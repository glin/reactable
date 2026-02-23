# JavaScript API for Programmatic Sort Control

## Overview

Add public JavaScript API methods to programmatically control column sorting: `toggleSortBy()` for toggling
individual column sort, and `setSortBy()` for setting the full sort state declaratively.

The internal `getInstance().toggleSortBy()` and `getInstance().setSortBy()` methods from react-table already
exist but are undocumented/unsupported. This feature wraps them in the public `Reactable.*` API with improved
semantics for the common case (no accidental unsort on toggle).

**Related Issues:**
- https://github.com/glin/reactable/issues/316 — `toggleSortBy` request
- https://github.com/glin/reactable/issues/322 — `setSortBy` request (mentioned in comments)

## Usage

### From External JavaScript

```js
// Toggle sort on a column (cycles between ascending and descending only)
Reactable.toggleSortBy('cars-table', 'Type')

// Set sort direction explicitly
Reactable.toggleSortBy('cars-table', 'Type', true)   // Sort descending
Reactable.toggleSortBy('cars-table', 'Type', false)  // Sort ascending

// Multi-sort: add this column to the existing sort (like shift-clicking a header)
Reactable.toggleSortBy('cars-table', 'Manufacturer', null, true)

// Set full sort state declaratively
Reactable.setSortBy('cars-table', [{ id: 'Type', desc: false }])

// Multi-column sort
Reactable.setSortBy('cars-table', [
  { id: 'Type', desc: false },
  { id: 'Price', desc: true }
])

// Clear all sorting
Reactable.setSortBy('cars-table', [])
```

### From Custom Renderers (onClick, headers)

```r
# Custom sort button in header (with UI sorting disabled)
reactable(
  MASS::Cars93,
  sortable = FALSE,
  defaultColDef = colDef(
    header = function(value, name) {
      tagList(
        value,
        tags$button(
          icon("sort"),
          onclick = sprintf("Reactable.toggleSortBy('my-table', '%s')", name)
        )
      )
    }
  ),
  elementId = "my-table"
)
```

## API Design

### `Reactable.toggleSortBy(tableId, columnId, desc, multi)`

Toggles the sort state for a single column. Behavior matches clicking a column header.

```ts
Reactable.toggleSortBy(
  tableId: string,
  columnId: string,
  desc?: boolean,
  multi?: boolean
)
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tableId` | `string` | required | The table element ID |
| `columnId` | `string` | required | The column ID to sort by |
| `desc` | `boolean \| undefined` | `undefined` | Sort direction. `true` for descending, `false` for ascending, `undefined` to toggle. |
| `multi` | `boolean` | `false` | When `true`, adds this column to the existing sort like shift-clicking a header (multi-sort). When `false`, replaces any existing sort with this column like clicking a header. |

**Behavior when `desc` is `undefined` (default toggle):**

- **Column not sorted → sorted ascending** (or descending if `sortDescFirst` is set for the column)
- **Column sorted ascending → sorted descending**
- **Column sorted descending → sorted ascending**

This differs from the internal react-table `toggleSortBy` which cycles asc → desc → unsorted. The public API
omits the "unsorted" state from the default toggle cycle because it's rarely the desired behavior when
programmatically controlling sort. Users who want to clear sort should use `setSortBy([])`.

When `multi` is `true`, removing sort from a column IS allowed in the toggle cycle (asc → desc → removed),
matching the shift-click behavior on column headers.

**Behavior when `desc` is explicitly set:**

Setting `desc` to `true` or `false` always sets the sort direction directly, regardless of current state.

### `Reactable.setSortBy(tableId, sortBy)`

Sets the full sort state for the table declaratively.

```ts
Reactable.setSortBy(
  tableId: string,
  sortBy: Array<{ id: string, desc: boolean }>
)
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tableId` | `string` | required | The table element ID |
| `sortBy` | `Array<{ id: string, desc: boolean }>` | required | Array of sort objects. Each object has `id` (column ID) and `desc` (sort direction). Pass `[]` to clear all sorting. |

### Method Naming

- `toggleSortBy` / `setSortBy` match react-table's internal method names and the existing pattern
  of `toggleGroupBy` / `setGroupBy` and `toggleHideColumn` / `setHiddenColumns` in the public API.
- The parameter name `desc` (rather than `descending`) matches the `defaultSorted` prop format
  (`[{ id: 'col', desc: true }]`) and the state shape returned by `getState().sorted`.

## Changes

### JavaScript (`srcjs/Reactable.js`)

Add two new exported functions near the existing `toggleGroupBy`/`setGroupBy` exports (~line 78-83):

```javascript
export function toggleSortBy(tableId, columnId, desc, multi) {
  const instance = getInstance(tableId)

  if (!multi) {
    // Match normal header click behavior: compute explicit desc so the reducer
    // never hits the "remove" path (asc <-> desc only, no unsorted state).
    if (desc == null) {
      const { sortBy } = instance.state
      const existingSort = sortBy.find(d => d.id === columnId)
      if (existingSort) {
        desc = !existingSort.desc
      } else {
        const column = instance.allColumns.find(d => d.id === columnId)
        desc = column ? column.sortDescFirst : false
      }
    }
    instance.toggleSortBy(columnId, desc, false)
  } else {
    // Match shift-click header behavior: pass desc as-is (null/undefined enables
    // the 3-state remove cycle in the reducer, just like shift-clicking a header).
    instance.toggleSortBy(columnId, desc, true)
  }
}

export function setSortBy(tableId, sortBy) {
  getInstance(tableId).setSortBy(sortBy)
}
```

**Key detail:** This reuses the exact same pattern as `ThComponent`'s `toggleSort` handler (line ~335).
The header click prevents the "unsorted" cycle by always computing an explicit `desc` value before
calling the reducer — we do the same. For `multi = true`, we pass `desc` through as-is (null/undefined
when not specified), which enables the 3-state asc → desc → removed cycle in the `useSortBy` reducer,
identical to shift-clicking a header. No custom sort logic needed — everything flows through the
existing `useSortBy` reducer.

### JavaScript Exports (`srcjs/index.js`)

Add exports:

```javascript
export {
  // ... existing exports ...
  toggleSortBy,
  setSortBy
} from './Reactable'
```

### Documentation Updates

1. **`vignettes/javascript-api.Rmd`**: Add new sections documenting `Reactable.toggleSortBy()` and
   `Reactable.setSortBy()`, following the same format as `toggleGroupBy`/`setGroupBy`.

2. **`NEWS.md`**: Add entry for new API methods referencing #316, #322.

3. **`vignettes/examples.Rmd`**: Consider adding an example of custom sort buttons using `toggleSortBy`.

4. **`man/updateReactable.Rd`** (via roxygen): Document the new `sortBy` parameter.

5. **`man/getReactableState.Rd`**: Ensure the `sorted` state documentation notes it can be passed back to `updateReactable(sortBy = ...)`.

### R/Shiny: `updateReactable()` (`R/shiny.R`)

Add a `sortBy` parameter to `updateReactable()` so sort can be controlled from Shiny server code:

```r
updateReactable <- function(outputId, data = NULL, sortBy = NULL, page = NULL,
                            expanded = NULL, selected = NULL, meta = NULL, session = NULL)
```

`sortBy` accepts a named list of sort directions, e.g.:

```r
# Sort by Type ascending, then Price descending
updateReactable("table", sortBy = list(Type = "asc", Price = "desc"))

# Clear all sorting
updateReactable("table", sortBy = NA)
```

This matches the format returned by `getReactableState("table", "sorted")` — a named list with values
`"asc"` or `"desc"` — so users can round-trip sort state.

**R-side changes:**
- Validate `sortBy` is a named list with values `"asc"`/`"desc"`, or `NA` to clear.
- Convert to the JS format `[{ id: "col", desc: true/false }, ...]` before sending.
- Add to the `newState` list sent via `sendCustomMessage`.

**JS-side changes (`srcjs/Reactable.js`):**

In the `updateState` handler (~line 2158), add a block for `sortBy`:

```javascript
if (newState.sortBy != null) {
  setSortBy(newState.sortBy)
}
```

And capture `setSortBy` from the instance alongside the other methods.

### Server-Side Data Compatibility

No additional changes needed. When sort state changes via `setSortBy`/`toggleSortBy`, the controlled
`sortBy` state in the `useTable` hook updates, triggering the existing server-side data fetch effect
(which already sends `sortBy` in the POST body). This works identically to how UI-based sorting works
with server-side backends.

## Accessibility Considerations

- When `sortable = FALSE` is set and custom sort buttons are provided via `toggleSortBy`, the developer
  is responsible for providing accessible sort controls (appropriate `aria-label`, keyboard interaction, etc.).
- The `aria-sort` attribute on column headers is automatically updated by the existing `ThComponent` when
  sort state changes, regardless of how the sort was triggered (UI click vs. API call).
- Custom sort buttons should be focusable and operable via keyboard (Enter/Space).

No additional ARIA changes are needed in reactable itself — the existing `aria-sort` attributes on headers
will reflect sort state changes regardless of the trigger mechanism.

## Test Plan

### Unit Tests (`srcjs/__tests__/Reactable.test.js`)

#### `Reactable.toggleSortBy`

| Test Case | Action | Expected Result |
|-----------|--------|-----------------|
| Toggle unsorted column (asc default) | `toggleSortBy('tbl', 'a')` | `state.sorted = [{ id: 'a', desc: false }]` |
| Toggle ascending column | Sort 'a' asc, then `toggleSortBy('tbl', 'a')` | `state.sorted = [{ id: 'a', desc: true }]` |
| Toggle descending column | Sort 'a' desc, then `toggleSortBy('tbl', 'a')` | `state.sorted = [{ id: 'a', desc: false }]` (NOT unsorted) |
| Set desc explicitly | `toggleSortBy('tbl', 'a', true)` | `state.sorted = [{ id: 'a', desc: true }]` |
| Set asc explicitly | `toggleSortBy('tbl', 'a', false)` | `state.sorted = [{ id: 'a', desc: false }]` |
| Replaces existing sort | Sort 'a', then `toggleSortBy('tbl', 'b')` | `state.sorted = [{ id: 'b', desc: false }]` (only 'b') |
| sortDescFirst column | Column 'a' has `sortDescFirst: true`, then `toggleSortBy('tbl', 'a')` | `state.sorted = [{ id: 'a', desc: true }]` |
| Multi-sort: add column | Sort 'a', then `toggleSortBy('tbl', 'b', null, true)` | `state.sorted = [{ id: 'a', desc: false }, { id: 'b', desc: false }]` |
| Multi-sort: toggle existing | Sort 'a' asc + 'b' asc, then `toggleSortBy('tbl', 'a', null, true)` | 'a' becomes desc, 'b' unchanged |
| Multi-sort: remove column | Sort 'a' desc + 'b' asc, then `toggleSortBy('tbl', 'a', null, true)` | 'a' removed, only 'b' remains |
| Invalid column ID | `toggleSortBy('tbl', 'nonexistent')` | Sets sort to `[{ id: 'nonexistent', desc: false }]` (no error) |

#### `Reactable.setSortBy`

| Test Case | Action | Expected Result |
|-----------|--------|-----------------|
| Set single column sort | `setSortBy('tbl', [{ id: 'a', desc: false }])` | `state.sorted = [{ id: 'a', desc: false }]` |
| Set multi-column sort | `setSortBy('tbl', [{ id: 'a', desc: false }, { id: 'b', desc: true }])` | Both columns sorted |
| Clear all sorting | `setSortBy('tbl', [])` | `state.sorted = []` |
| Replace existing sort | Sort 'a', then `setSortBy('tbl', [{ id: 'b', desc: true }])` | Only 'b' sorted |
| Data re-sorts correctly | Set sort, verify row order changes | Rows reorder according to sort |

#### `Reactable.getState` integration

| Test Case | Action | Expected Result |
|-----------|--------|-----------------|
| State reflects API sort | `toggleSortBy('tbl', 'a')` | `getState('tbl').sorted` returns `[{ id: 'a', desc: false }]` |
| State reflects cleared sort | `setSortBy('tbl', [])` | `getState('tbl').sorted` returns `[]` |

#### `onStateChange` integration

| Test Case | Action | Expected Result |
|-----------|--------|-----------------|
| onStateChange fires on toggleSortBy | Register listener, call `toggleSortBy` | Listener called with updated state |
| onStateChange fires on setSortBy | Register listener, call `setSortBy` | Listener called with updated state |

### Manual / Integration Tests (Rmd file)

See `js-sort-api-test.Rmd` for interactive test cases including:
- Basic toggleSortBy with visual verification of row order
- Multi-sort with shift-key equivalent behavior
- setSortBy with multiple columns
- Clear sort
- Custom sort buttons with `sortable = FALSE`
- Server-side data tables
- sortDescFirst columns
- Interaction with existing sort UI (mixing API and UI sort)

## Limitations

- `toggleSortBy` does not validate that the column ID exists. Sorting by a non-existent column ID will
  set the sort state but won't affect row order (react-table filters out non-existent columns during sort).
- For columns with `sortable = FALSE`, the API can still programmatically sort by that column. The
  `sortable` / `disableSortBy` property only disables the UI sort toggle, not programmatic sort. This is
  intentional — it allows building custom sort UIs while disabling the default header click behavior.
- Multi-sort toggle (`multi = true`) allows cycling to "unsorted" for individual columns (matching
  the shift-click behavior). If you want to ensure a column stays sorted, use `desc` explicitly.
