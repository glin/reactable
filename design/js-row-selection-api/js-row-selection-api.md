# JavaScript API for Row Selection

## Overview

Add public JavaScript API methods to programmatically toggle row selection, and document the existing `rowInfo.toggleRowSelected()` method for use in custom renderers and onClick handlers.

**Related Issues:**
- https://github.com/glin/reactable/issues/322
- https://github.com/glin/reactable/issues/394
- https://github.com/glin/reactable/issues/412

## Usage

### From Custom Renderers and onClick Handlers

```r
reactable(
  MASS::Cars93,
  selection = "single",
  onClick = JS("function(rowInfo, column) {
    rowInfo.toggleRowSelected()
  }")
)
```

### From External JavaScript

```js
// Toggle a single row's selection (by original data index)
Reactable.toggleRowSelected('my-table', 2)        // Toggle row at index 2
Reactable.toggleRowSelected('my-table', 2, true)  // Select row at index 2
Reactable.toggleRowSelected('my-table', 2, false) // Deselect row at index 2

// Set selected rows (by original data indices)
Reactable.setRowsSelected('my-table', [0, 2, 5])  // Select rows 0, 2, and 5
Reactable.setRowsSelected('my-table', [])         // Clear all selections

// Toggle all rows
Reactable.toggleAllRowsSelected('my-table')       // Toggle all rows
Reactable.toggleAllRowsSelected('my-table', true) // Select all rows
Reactable.toggleAllRowsSelected('my-table', false) // Deselect all rows
```

## API Design

### Method Naming

Methods use `toggleRowSelected` (adjective form) rather than `toggleRowSelection` (noun form) to match:
- react-table's internal API naming (`row.toggleRowSelected`, `instance.toggleAllRowsSelected`)
- The existing internal `rowInfo.toggleRowSelected()` method

### Index-Based Parameters

The `rowIndex` parameter uses original data indices (0-based), consistent with:
- `Reactable.getState()` which returns `selected` as an array of data indices
- `defaultSelected` parameter which accepts data indices
- The `rowInfo.index` property available in custom renderers

This means for grouped tables, `rowIndex` refers to the index of the leaf row in the original ungrouped data, not the visual position in the table.

## Changes

### JavaScript (`srcjs/Reactable.js`)

Add three new exported functions near existing API methods (~line 62-123):

```javascript
// Toggle selection for a single row by original data index
export function toggleRowSelected(tableId, rowIndex, isSelected) {
  const instance = getInstance(tableId)
  const row = getRowByIndex(instance, rowIndex)
  if (row) {
    instance.toggleRowSelected(row.id, isSelected)
  }
}

// Set all selected rows by original data indices
export function setRowsSelected(tableId, rowIndices) {
  const instance = getInstance(tableId)
  const rowIds = rowIndices.map(index => {
    const row = getRowByIndex(instance, index)
    return row ? row.id : String(index)
  })
  instance.setRowsSelected(rowIds)
}

// Toggle all rows selected
export function toggleAllRowsSelected(tableId, isSelected) {
  getInstance(tableId).toggleAllRowsSelected(isSelected)
}
```

Add internal helper to map indices to rows:

```javascript
// Helper to find a row by its original data index.
// Only works for leaf (non-aggregated) rows, since aggregated rows have no `index`.
// Row IDs:
//   - Flat tables: "0", "1", "2", etc.
//   - Grouped tables (leaf rows): "0", "1", "2", etc. (original data index)
//   - Grouped tables (aggregated rows): "colName:value" (e.g., "cyl:4")
//   - Multi-level grouped (nested aggregated): "col1:val1>col2:val2" (e.g., "cyl:6>vs:0")
function getRowByIndex(instance, index) {
  return instance.rowsById[String(index)] || null
}
```

### JavaScript Exports (`srcjs/index.js`)

Add exports:

```javascript
export {
  // ... existing exports ...
  toggleRowSelected,
  setRowsSelected,
  toggleAllRowsSelected
} from './Reactable'
```

### Documentation Updates

1. **`vignettes/custom-rendering.Rmd`**: Add `toggleRowSelected` to rowInfo/cellInfo property tables:
   
   | Property | Example | Description |
   |----------|---------|-------------|
   | toggleRowSelected | `function` | Function to toggle this row's selection state. Call with no arguments to toggle, or pass `true`/`false` to select/deselect. |

2. **`vignettes/javascript-api.Rmd`**: Add new section documenting:
   - `Reactable.toggleRowSelected(tableId, rowIndex, isSelected)`
   - `Reactable.setRowsSelected(tableId, rowIndices)`
   - `Reactable.toggleAllRowsSelected(tableId, isSelected)`
   - Note about grouped tables: indices refer to original data rows

3. **`vignettes/examples.Rmd`**: Update custom click action section with `rowInfo.toggleRowSelected()` example

4. **`NEWS.md`**: Add entry for new API methods referencing #322, #394, #412

## Limitations

### Grouped Tables

For grouped tables, the `rowIndex` parameter refers to the index of the leaf row in the original ungrouped data:
- Row IDs for leaf rows: `"0"`, `"1"`, `"2"`, etc. (same as original data index)
- Row IDs for aggregated (group header) rows: `"colName:value"` (e.g., `"cyl:4"`)
- Row IDs for nested aggregated rows (multi-level grouping): `"col1:val1>col2:val2"` (e.g., `"cyl:6>vs:0"`)
- Aggregated rows have `row.index === undefined`, so they cannot be selected via index
- To select an aggregated row, use `rowInfo.toggleRowSelected()` directly in a custom render function or style function

### Single vs Multiple Selection

- In `selection = "single"` mode, selecting a new row automatically deselects the previous selection
- `setRowsSelected()` with multiple indices in single selection mode will only keep the last row selected
- `toggleAllRowsSelected()` respects the selection mode

## Accessibility Considerations

No additional accessibility considerations. Row selection already supports keyboard interaction through the existing checkbox/radio inputs.

## Test Plan

### Setup

```r
# Flat table
flat_tbl <- reactable(
  mtcars[1:10, ],
  selection = "multiple",
  elementId = "test-flat"
)

# Grouped table
grouped_tbl <- reactable(
  mtcars,
  groupBy = "cyl",
  selection = "multiple",
  elementId = "test-grouped"
)
```

### Reactable.toggleRowSelected()

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Toggle unselected row | `Reactable.toggleRowSelected('test-flat', 0)` | Row 0 becomes selected |
| Toggle selected row | Select row 0, then `Reactable.toggleRowSelected('test-flat', 0)` | Row 0 becomes deselected |
| Select with explicit true | `Reactable.toggleRowSelected('test-flat', 0, true)` | Row 0 selected |
| Deselect with explicit false | Select row 0, then `Reactable.toggleRowSelected('test-flat', 0, false)` | Row 0 deselected |
| Already selected + true | Select row 0, then `Reactable.toggleRowSelected('test-flat', 0, true)` | Row 0 stays selected |
| Single selection mode | `selection = "single"`, select row 0, then `toggleRowSelected('test', 1)` | Row 1 selected, row 0 deselected |
| Grouped table | Expand group, `toggleRowSelected('test-grouped', 0)` | Leaf row at index 0 selected |
| Invalid index | `Reactable.toggleRowSelected('test-flat', 999)` | No error, no change |

### Reactable.setRowsSelected()

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Select multiple | `Reactable.setRowsSelected('test-flat', [0, 2, 4])` | Rows 0, 2, 4 selected |
| Clear selection | `Reactable.setRowsSelected('test-flat', [])` | All rows deselected |
| Replace selection | Select rows 0, 1, then `setRowsSelected('test-flat', [2, 3])` | Only rows 2, 3 selected |
| Single selection mode | `selection = "single"`, `setRowsSelected('test', [0, 2])` | Only row 2 selected (last one) |
| Grouped table | `setRowsSelected('test-grouped', [0, 10, 20])` | Leaf rows at those indices selected |

### Reactable.toggleAllRowsSelected()

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Select all | `Reactable.toggleAllRowsSelected('test-flat')` with none selected | All rows selected |
| Deselect all | `Reactable.toggleAllRowsSelected('test-flat')` with all selected | All rows deselected |
| Explicit select all | `Reactable.toggleAllRowsSelected('test-flat', true)` | All rows selected |
| Explicit deselect all | `Reactable.toggleAllRowsSelected('test-flat', false)` | All rows deselected |
| Grouped table | `toggleAllRowsSelected('test-grouped', true)` | All leaf rows selected |

### rowInfo.toggleRowSelected()

| Test | Steps | Expected Result |
|------|-------|-----------------|
| onClick handler | Click row with onClick using `rowInfo.toggleRowSelected()` | Row selection toggles |
| Cell renderer | Render button that calls `cellInfo.toggleRowSelected()` | Clicking button toggles row |
| Grouped row | Click on expanded group's leaf row | Leaf row selection toggles |

### paginateSubRows Variations

| Test | Steps | Expected Result |
|------|-------|-----------------|
| paginateSubRows = FALSE | Grouped table, default, toggle row by index | Correct leaf row selected |
| paginateSubRows = TRUE | `paginateSubRows = TRUE`, toggle row by index | Correct leaf row selected |

### State Consistency

| Test | Steps | Expected Result |
|------|-------|-----------------|
| State after toggle | Toggle row, call `Reactable.getState()` | `selected` array includes toggled row index |
| State after setRowsSelected | `setRowsSelected([1, 3])`, call `getState()` | `selected` equals `[1, 3]` |
| Shiny callback | Toggle row in Shiny app | `input$tableId_selected` updates correctly |
