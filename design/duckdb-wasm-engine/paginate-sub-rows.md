# paginateSubRows for DuckDB backends

## Problem

When `groupBy` is used with DuckDB backends, all sub-rows for every visible group are fetched eagerly, even for
collapsed groups. With 100k rows and 4 groups, that's ~25k sub-rows per group serialized in a single response.

This causes two problems:
1. **Stack overflow on R server (Positron):** `jsonlite::toJSON` on deeply nested list-column data frames overflows
   Positron's smaller stack. Not a reactable bug per se, but a real user-facing crash.
2. **Browser lag:** Expanding a 25k-row group floods the DOM. No pagination within groups means all 25k rows render.

`paginateSubRows = TRUE` solves both: sub-rows count toward `pageSize`, so only a page-sized slice is ever
fetched/rendered. Currently only the V8 backend supports this (it runs the full React pipeline server-side).

## Scope

Implement `paginateSubRows` for:
- **DuckDB WASM** (`DuckDBBackend.js`) -- client-side, static HTML
- **DuckDB R server** (`backend-duckdb.R`) -- Shiny server-side

Both use the same SQL-based grouped query logic. The algorithm is identical; the implementations differ only in
language (JS vs R) and SQL driver (duckdb-wasm vs duckdb R package).

## Current behavior (paginateSubRows = FALSE)

```
Query: groupBy = ["region"], pageSize = 20, pageIndex = 0

DuckDB returns:
  rows: [
    { region: "East", revenue: 1250000, .subRows: [25000 rows...], __state: { id: "region:East", grouped: true } },
    { region: "North", revenue: 980000, .subRows: [25000 rows...], __state: { id: "region:North", grouped: true } },
    { region: "South", revenue: 1100000, .subRows: [25000 rows...], __state: { id: "region:South", grouped: true } },
    { region: "West", revenue: 1300000, .subRows: [25000 rows...], __state: { id: "region:West", grouped: true } }
  ],
  rowCount: 4
```

React table nests sub-rows under each group. Expanding a group dumps all 25k rows into the page.

## Target behavior (paginateSubRows = TRUE)

Groups and their expanded sub-rows are flattened into a single paginated list. The backend computes which slice of
the flattened view falls on the current page and returns only those rows.

### Collapsed state (no groups expanded)

```
Query: groupBy = ["region"], pageSize = 20, pageIndex = 0, expanded = {}, paginateSubRows = true

DuckDB returns:
  rows: [
    { region: "East", revenue: 1250000, __state: { id: "region:East", grouped: true, subRowCount: 25000 } },
    { region: "North", revenue: 980000, __state: { id: "region:North", grouped: true, subRowCount: 25000 } },
    { region: "South", revenue: 1100000, __state: { id: "region:South", grouped: true, subRowCount: 25000 } },
    { region: "West", revenue: 1300000, __state: { id: "region:West", grouped: true, subRowCount: 25000 } }
  ],
  rowCount: 4    // 4 group headers, no expanded sub-rows
```

No `.subRows` arrays. Each group header has `subRowCount` for React table's placeholder sub-rows.

### Expanded state (East expanded)

```
Query: expanded = { "region:East": true }, pageSize = 10, pageIndex = 0

Flattened view:
  row 0:  [group] East (25000 sub-rows)
  row 1:  [sub]   East, row 0
  row 2:  [sub]   East, row 1
  ...
  row 9:  [sub]   East, row 8
  --- page break ---
  row 10: [sub]   East, row 9
  ...

DuckDB returns (page 0, pageSize 10):
  rows: [
    { region: "East", revenue: 1250000, __state: { id: "region:East", grouped: true, subRowCount: 25000 } },
    { id: 42, region: "East", ..., __state: { id: "42", index: 42, parentId: "region:East" } },
    { id: 87, region: "East", ..., __state: { id: "87", index: 87, parentId: "region:East" } },
    ... (8 more sub-rows)
  ],
  rowCount: 25004    // 4 groups + 25000 expanded sub-rows from East
```

Page 1 would return the next 10 sub-rows of East. Eventually, page N crosses the boundary from East's sub-rows
into the North group header.

## Algorithm

### 1. Build the flattened row count

For each top-level group, compute the contribution to the flat list:
- Collapsed group: 1 row (the header)
- Expanded group: 1 + subRowCount rows (header + all sub-rows)

```sql
-- Get all groups with their sub-row counts
SELECT groupCol, COUNT(*) AS sub_count
FROM reactable_data
[WHERE ...]
GROUP BY groupCol
[ORDER BY ...]
```

Then walk the groups in order. For each group:
- If `expanded[groupId]` is true: flatSize = 1 + sub_count
- Else: flatSize = 1

Total `rowCount` = sum of all flatSizes.

### 2. Determine the page window

Given `pageStart = pageIndex * pageSize` and `pageEnd = pageStart + pageSize`, walk the flattened list to find
which groups and sub-row ranges fall in `[pageStart, pageEnd)`.

```
flatOffset = 0
for each group in order:
  groupStart = flatOffset
  groupSize = expanded ? 1 + sub_count : 1
  groupEnd = groupStart + groupSize

  if groupEnd <= pageStart:
    flatOffset = groupEnd
    continue    // entirely before this page

  if groupStart >= pageEnd:
    break       // entirely after this page

  // This group overlaps with the page
  emit group header (if groupStart >= pageStart)
  if expanded:
    subStart = max(0, pageStart - groupStart - 1)
    subEnd = min(sub_count, pageEnd - groupStart - 1)
    emit sub-rows [subStart, subEnd) with OFFSET subStart LIMIT (subEnd - subStart)

  flatOffset = groupEnd
```

### 3. Fetch only needed data

For each group that appears on the page:
- Always include the group header row (aggregate values from GROUP BY)
- If expanded and sub-rows fall on this page, fetch only the sub-row slice:
  `SELECT * FROM reactable_data WHERE groupCol = ? ORDER BY ... LIMIT ? OFFSET ?`

### 4. Return flat response

Instead of nested `.subRows`, return a flat array matching the V8 backend's `paginateSubRows` format:

```js
// Group header row
{ region: "East", revenue: 1250000, __state: { id: "region:East", grouped: true, subRowCount: 25000 } }

// Sub-row (leaf row within the group)
{ id: 42, region: "East", category: "A", ..., __state: { id: "42", index: 42, parentId: "region:East" } }
```

The client-side `useServerSideRows` hook (Reactable.js lines 1061-1112) already handles this format:
- Rows with `__state.parentId` are pushed into their parent's `subRows` array
- Rows with `__state.subRowCount` get placeholder sub-rows for pagination counting

## Multi-level grouping

With `groupBy = ["Origin", "Type"]`, the flattened view has three levels:

```
row 0:  [group L1] Origin=USA
row 1:    [group L2] Type=Compact (sub_count=10)
row 2:      [leaf] row data
...
row 11:   [group L2] Type=Large (sub_count=5)
row 12:     [leaf] row data
...
```

The same walk algorithm applies recursively. Each expanded L1 group includes its L2 groups. Each expanded L2
group includes its leaf rows. The `subRowCount` on L1 groups = count of L2 groups (not total leaves). The
`subRowCount` on L2 groups = count of leaf rows.

The `parentId` chain links each level: leaf rows have `parentId: "Type:Compact"`, L2 groups have
`parentId: "Origin:USA"`.

## Client-side changes (shared by WASM and server)

### Reactable.js

1. **DuckDB query effect:** Add `state.expanded` to the dependency array. Pass `expanded` and
   `paginateSubRows` to `queryGrouped()`.

2. **react-table config:** When `useDuckDB && paginateSubRows`:
   - Set `expandSubRows: false` (currently only set for `useServerData && paginateSubRows` on line 1180)
   - `rowCount` from DuckDB is the flattened count (not just group count)

3. **No changes to `useServerSideRows`:** It already handles the flat format with `parentId`/`subRowCount`
   reconstruction (lines 1090-1110). This is the same format the V8 backend produces.

### Server data effect (Reactable.js)

The server data effect (line 1219) already sends `expanded` in the request body. No changes needed for the
R server backend, which receives `expanded` as a parameter.

## Backend changes

### DuckDB WASM (DuckDBBackend.js)

Add a new method or branch in `queryGrouped()`:

```js
async queryGrouped({ pageIndex, pageSize, sortBy, filters, searchValue, columns, groupBy, expanded, paginateSubRows }) {
  if (!paginateSubRows) {
    // Existing behavior: nested .subRows
    return this.queryGroupedNested({ ... })
  }
  // New behavior: flat paginated response
  return this.queryGroupedPaginated({ ... })
}
```

`queryGroupedPaginated()` implements the algorithm above:
1. Query all groups with sub-row counts (single GROUP BY query)
2. Walk the flattened list to determine the page window
3. Fetch sub-row slices for expanded groups on this page (one query per expanded group with LIMIT/OFFSET)
4. Return flat rows with `__state` metadata

### DuckDB R server (backend-duckdb.R)

Same algorithm in R. Replace `duckdbGroupedQuery()` when `paginateSubRows` is TRUE:
1. Query groups with counts: `SELECT groupCol, COUNT(*) FROM ... GROUP BY groupCol`
2. Walk flattened list to determine page window
3. Fetch sub-row slices: `SELECT * FROM ... WHERE groupCol = ? LIMIT ? OFFSET ?`
4. Return flat data frame with `__state` column

### Shared SQL queries

Both backends need the same three query types:

| Query | Purpose | SQL |
|-------|---------|-----|
| Group headers | Aggregated row for each group | `SELECT groupCol, SUM(x), ... FROM data GROUP BY groupCol ORDER BY ...` |
| Group counts | Sub-row count per group | Same query with `COUNT(*) AS sub_count` (can combine with headers) |
| Sub-row slice | Leaf rows for one expanded group | `SELECT * FROM data WHERE groupCol = ? ORDER BY ... LIMIT ? OFFSET ?` |

The group headers query already exists. The sub-row slice query is a parameterized version of the existing
leaf-level fetch. The only new query is combining `COUNT(*)` into the group headers SELECT.

## Edge cases

### Page boundary mid-group

If a page break falls in the middle of a group's sub-rows, the group header appears on the earlier page
and sub-rows are split across pages. The client handles this through `parentId` linking.

### Sorting

Sort the groups by the sort column (already handled). Sub-rows within each group are sorted independently
(already handled). The flattened order follows group order, with sub-rows interleaved per group.

### Filtering

Filters apply before grouping (already handled). The flattened row count uses `COUNT(*)` from the filtered
GROUP BY result.

### Expand/collapse triggers re-query

Expanding or collapsing a group changes `state.expanded`, which triggers a new DuckDB query. The flattened
row count changes, and the page may need adjustment (e.g., if collapsing a group shrinks the total below
the current page index).

### pageIndex reset on expand/collapse

When the `expanded` state changes, the total `rowCount` changes. React table's `autoResetPage` handles this
when data changes, but expanding a group is a state change, not a data change. Consider whether the page index
should reset to 0 on expand/collapse, or try to maintain position. The V8 backend resets to page 0 on any state
change (since every state change triggers a full re-render in V8).

## Test plan

### JS tests (DuckDB.test.js)

1. **Collapsed groups:** `paginateSubRows = true`, no groups expanded. Returns group headers with
   `subRowCount`, no `.subRows`. `rowCount` = number of groups.

2. **Single group expanded:** Expand one group. Returns flat rows: group header + sub-row slice.
   `rowCount` = groups + expanded sub-rows. Sub-rows have `parentId`.

3. **Page boundary:** Expand a group whose sub-rows span multiple pages. Verify correct sub-row
   slice on each page.

4. **Multiple groups expanded:** Two groups expanded, verify interleaved flat list is correct.

5. **Sort + expand:** Sort by aggregate column, expand a group, verify sub-rows are sorted correctly.

6. **Filter + expand:** Filter narrows groups, expand one, verify sub-row count and slice.

7. **Multi-level grouping:** Two groupBy columns, expand L1 and L2, verify nested structure.

### R tests (test-backend-duckdb.R)

Mirror the JS tests for the R server backend.

### Integration tests (browser)

Use the test Rmd examples in `duckdb-wasm-engine-test.Rmd`:
- `paginateSubRows with DuckDB backend` (MASS::Cars93)
- `paginateSubRows with multi-level grouping`
- `paginateSubRows with large dataset` (100k rows, 4 groups)
- Compare behavior with the non-DuckDB `paginateSubRows` comparison example

## Implementation order

1. **DuckDB WASM (JS):** Implement `queryGroupedPaginated()` in `DuckDBBackend.js`
2. **Client glue:** Update `Reactable.js` to pass `expanded` + `paginateSubRows` to DuckDB query
3. **JS tests:** Add tests in `DuckDB.test.js`
4. **Browser test:** Knit test Rmd, verify in browser
5. **DuckDB R server:** Port algorithm to `backend-duckdb.R`
6. **R tests:** Add tests in `test-backend-duckdb.R`
7. **Shiny test:** Run grouped Shiny app with `paginateSubRows = TRUE`
