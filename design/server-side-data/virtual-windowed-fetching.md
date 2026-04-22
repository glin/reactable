# Virtual Windowed Fetching

## Problem

With `virtual = TRUE, pagination = FALSE`, all backends currently fetch ALL rows at once:

- **DuckDB WASM**: `SELECT * FROM reactable_data` with no LIMIT/OFFSET. For Parquet, this downloads the entire
  file over HTTP before the table renders.
- **DuckDB R server / df / V8**: The Shiny backend sends all matching rows in a single HTTP response.

This defeats the purpose of server-side/DuckDB processing for large datasets. A table with 1M rows and
`pagination = FALSE` loads all 1M rows into JS memory, even though the user can only see ~15-20 at a time.

## Solution

Windowed fetching: query only the rows around the visible viewport, plus a buffer. As the user scrolls,
fetch new windows of data. The virtualizer already knows which rows are visible; we extend this to drive
data fetching, not just DOM rendering.

**When it applies:** `virtual = TRUE` and `pagination = FALSE` (or `showPagination = FALSE`) with a backend
(`useDuckDB || useServerData`). Client-side tables don't need this since all data is already in memory.

**When it does NOT apply:** Paginated tables already fetch one page at a time. Non-virtual tables render
all rows in the DOM anyway, so fetching all data is correct.

## Design

### Data Model

Instead of a flat array of all rows, maintain a **sparse data structure**:

```
totalRowCount: 500000        (from backend, known upfront)
buffer: {
  start: 200,               (first fetched row index in the flat stream)
  end: 700,                 (exclusive end)
  rows: [...500 rows...]    (the actual data for this range)
}
```

The virtualizer is told `count = totalRowCount` so the scrollbar reflects the full dataset. Rows inside the
buffer render normally. Rows outside the buffer render as placeholder/skeleton rows (empty cells with a
subtle shimmer animation, or just blank rows at the estimated height).

### Buffer Strategy

- **Buffer size**: ~500 rows (tunable). This is large enough to handle fast scrolling without constant
  re-fetching, small enough to stay fast.
- **Fetch trigger**: When the virtualizer's visible range extends beyond `bufferPadding` rows from the
  buffer edge. For example, with `bufferPadding = 100`, if the visible range reaches within 100 rows of
  the buffer start or end, fetch a new buffer.
- **Fetch position**: Center the new buffer on the current scroll position. If the user is at row 5000,
  fetch rows 4750-5250.
- **Debounce**: Debounce fetch triggers by ~150ms to avoid excessive queries during fast scrolling.
  If the user is dragging the scrollbar rapidly, wait until they pause.

### Query Interface

Backends already accept `pageIndex` and `pageSize`. Windowed fetching reuses these with a fractional
`pageIndex` trick: `pageIndex = offset / bufferSize`. Since backends compute `OFFSET = pageIndex * pageSize`,
this produces the correct offset without any backend changes.

```js
// DuckDB WASM (via windowedFetchData callback)
duckdbRef.current.query({
  pageIndex: offset / bufferSize,   // fractional, e.g., 1.968 for offset=984
  pageSize: bufferSize,             // e.g., 500
  sortBy: state.sortBy,
  filters: state.filters,
  searchValue: state.globalFilter,
  // ...
})
// Backend computes: OFFSET = 1.968 * 500 = 984, LIMIT = 500
```

**Decision**: Reuse `pageIndex`/`pageSize` with fractional pageIndex. Zero backend changes required.
The fractional value works because `(offset / limit) * limit = offset` in IEEE 754 for reasonable
dataset sizes (up to millions of rows). For very large offsets, floating point precision is not a
concern because `offset / 500 * 500` stays exact for integers up to 2^53.

### Sort / Filter / Search Interaction

When sort, filter, or search changes:

1. **Reset scroll to top** (scroll container `scrollTop = 0`)
2. **Invalidate the buffer** (clear all cached rows)
3. **Fetch the first buffer** (rows 0 to bufferSize)
4. **Update totalRowCount** from the new query result

This matches the behavior of paginated tables (which reset to page 0 on sort/filter).

### Grouped Data

Grouped tables with windowed fetching use the `paginateSubRows` code path internally. The flattened stream
of group headers + sub-rows can be windowed the same way as flat rows. The backend already handles
`paginateSubRows` by flattening the group tree into a single ordered stream with `LIMIT`/`OFFSET`.

When `virtual = TRUE, pagination = FALSE, groupBy` is set:
- Enable `paginateSubRows` mode internally (even though there's no visible pagination)
- The backend returns a flat stream of group headers and sub-rows
- Expanding/collapsing a group invalidates the buffer and re-fetches (same as today, `state.expanded`
  is in the dependency array)
- `totalRowCount` is the flattened count (headers + visible sub-rows)

**Question**: Should collapsing a group reset scroll to top, or keep position? **Decision**: Keep
position. The user is interacting with a specific group, and TanStack Virtual handles count changes
gracefully. Only sort/filter/search resets to top.

### Row Selection

The inverted selection model (`selectAllRows` + `deselectedRowIds`) already handles rows outside the
visible buffer. Individual row selection uses stable `__state.id` row IDs that persist across buffer
changes. No changes needed.

### Placeholder Rows

Rows outside the buffer need visual treatment:

- **Option A: Empty rows at estimated height.** Simple. The virtualizer already estimates row height.
  Render empty `rt-tr` elements with no cell content. Minimal visual disruption.
- **Option B: Skeleton/shimmer rows.** More polished. Show animated placeholder cells that indicate
  loading. Better UX but adds CSS complexity.
- **Option C: Don't render placeholders.** Only render rows that are in the buffer. Set the virtualizer
  count to `buffer.end - buffer.start` and offset the spacer. Problem: scrollbar won't reflect the full
  dataset size.

**Recommendation**: Option A for MVP, with the option to add shimmer later. Empty rows are simple, and the
scrollbar correctly reflects total size. Fast scrolling past the buffer briefly shows empty rows, then they
fill in when the new buffer arrives.

### Stale Buffer During Fetch

When a new buffer is being fetched (user scrolled past the current buffer):

1. Keep showing the old buffer data for rows that are still in the old range
2. Show placeholders for rows outside both old and new buffers
3. When the new buffer arrives, replace data and re-render

This avoids a flash of all-empty rows during the fetch latency.

## Architecture

### New State

```js
// In Reactable component
const [windowBuffer, setWindowBuffer] = React.useState(null)
// windowBuffer = { start: number, end: number, rows: Array }
```

### Data Flow

```
User scrolls
  -> VirtualTbody reports visible range via callback
  -> Debounced check: is visible range near buffer edge?
  -> If yes: compute new buffer center, fire query
  -> Query returns: setWindowBuffer({ start, end, rows })
  -> VirtualTbody re-renders:
     - Rows in buffer: render from buffer.rows[index - buffer.start]
     - Rows outside buffer: render placeholder
```

### Component Changes

**VirtualTbody**: Needs to accept a callback to report visible range changes. TanStack Virtual's
`virtualizer.range` provides `{ startIndex, endIndex }` on every scroll. Add an `onRangeChange` prop.

**Reactable (DuckDB effect)**: Replace the single "fetch all" query with buffer-aware fetching.
The effect watches `virtualizer.range` (debounced) instead of just `state.pageIndex`.

**Reactable (server data effect)**: Same pattern for HTTP-based backends.

### New: `useWindowedData` Hook

Extract windowed fetching logic into a custom hook to share between DuckDB and server-side paths:

```js
function useWindowedData({
  enabled,           // virtual && !pagination && (useDuckDB || useServerData)
  totalRowCount,     // from initial query or backend
  fetchData,         // async function(offset, limit) => { rows, rowCount }
  bufferSize = 500,
  bufferPadding = 100,
  debounceMs = 150,
  deps = []          // sort/filter/search/expanded state
}) {
  // Returns: { rows, onRangeChange, isLoading }
  // rows: sparse-ish array where buffer range has data, rest are null/placeholder
  // onRangeChange: callback for VirtualTbody
  // isLoading: true while a fetch is in flight
}
```

This hook encapsulates:
- Buffer state management
- Debounced range watching
- Query dispatch
- Stale buffer handling
- Reset on dependency changes (sort/filter/search)

## Backend Changes

### DuckDB WASM

No changes to `DuckDBBackend.js`. The existing `query()` method already accepts `pageIndex`/`pageSize`
and produces `LIMIT`/`OFFSET` SQL. Windowed fetching just calls it with different values.

For grouped data, `queryGrouped()` with `paginateSubRows` already handles flattened pagination.

### DuckDB R Server

No changes to `backend-duckdb.R`. The existing `reactableServerData` method handles `pageIndex`/`pageSize`.

### df Backend

No changes to `backend-df.R`. `dfPaginate()` and `dfPaginateSubRows()` already handle offset/limit.

### V8 Backend

No changes. V8 already accepts `pageIndex`/`pageSize` in the POST body.

### Server-side HTTP

No changes to `reactableFilterFunc` or the HTTP request format. The JS side just sends different
`pageIndex`/`pageSize` values.

**Summary: Zero backend changes required.** All windowed fetching logic is client-side (JS).

## Limitations

- **Browser find-in-page**: Already broken by virtual scrolling (only visible rows in DOM). Windowed
  fetching doesn't make this worse.
- **Accessibility**: Same limitations as virtual scrolling. `aria-rowcount` and `aria-rowindex` still
  work correctly since they're based on `totalRowCount`, not buffer size.
- **Fast scrolling**: Dragging the scrollbar to a distant position shows placeholders until the buffer
  catches up. This is inherent to any windowed/infinite-scroll approach.
- **Memory**: The buffer is capped at ~500 rows regardless of total dataset size. Old buffers are
  discarded, not accumulated.

## Test Plan

### Setup

```r
# Test with DuckDB WASM (Parquet for large data)
tbl <- reactable(
  large_data,  # 100K+ rows
  backend = backendDuckDB(),
  virtual = TRUE,
  pagination = FALSE,
  height = 500
)
```

### Test Cases

| Test | Steps | Expected |
|------|-------|----------|
| Initial render | Open table | First ~500 rows fetched, not all rows |
| Scroll down | Scroll slowly to row ~400 | New buffer fetched before reaching edge |
| Fast scroll | Drag scrollbar to middle | Brief placeholders, then data appears |
| Scroll to end | Scroll to last row | Last buffer fetched, correct data shown |
| Sort | Click column header | Scroll resets to top, new buffer fetched |
| Filter | Type in filter | Scroll resets to top, new buffer fetched, row count updates |
| Search | Type in search box | Same as filter |
| Expand group | Click group expander | Buffer re-fetched with expanded rows |
| Select row | Click row checkbox | Selection persists across buffer changes |
| Select all | Click select-all checkbox | Inverted selection mode, works across buffers |
| Memory | Open DevTools Memory | Only ~500 rows in heap, not full dataset |
| Parquet | Use `format = "parquet"` with 1M rows | No full-file download on initial load |
| Server backend | Use `backendDf()` in Shiny | Same windowed behavior over HTTP |

### Accessibility

| Test | Expected |
|------|----------|
| `aria-rowcount` | Set to total row count (not buffer size) |
| `aria-rowindex` | Correct 1-based index for each visible row |
| Keyboard scroll (Page Down) | Fetches new buffer as needed |

### Performance Targets

| Metric | Target |
|--------|--------|
| Buffer fetch (DuckDB WASM, 100K rows) | < 50ms |
| Buffer fetch (DuckDB WASM, 1M rows) | < 100ms |
| Buffer fetch (Parquet HTTP, 1M rows) | < 500ms (includes network) |
| Scroll-to-fetch latency | < 200ms perceived |
| Memory (1M row table) | < 10 MB JS heap for table data |

## Implementation Steps

- [x] **1.** Create `useWindowedData` hook with buffer management, debounced range tracking, and
      query dispatch (`srcjs/useWindowedData.js`)
- [x] **2.** Add `onRangeChange` callback to `VirtualTbody` (report `virtualizer.range` changes)
- [x] **3.** Wire `useWindowedData` into DuckDB query path: when `virtual && !pagination`, use
      windowed fetching instead of fetch-all
- [x] **4.** Wire `useWindowedData` into server-side data path (same conditions)
- [x] **5.** Render placeholder rows for out-of-buffer indices in `VirtualTbody`
- [x] **6.** Handle grouped data: enable `paginateSubRows` internally when windowed fetching is active
- [x] **7.** Reset scroll position on sort/filter/search/groupBy changes
- [x] **8.** Add JS tests (8 unit tests for `useWindowedData`, 8 integration tests for windowed DuckDB)
- [x] **9.** Add test Rmd with large dataset examples
- [ ] **10.** Update virtual scrolling and DuckDB backend vignettes
