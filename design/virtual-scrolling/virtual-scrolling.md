# Virtual Scrolling

## Overview

Virtual scrolling (aka row virtualization or virtualized tables) renders only the visible rows in the DOM, significantly improving performance for large datasets. Instead of paginating through data, users can smoothly scroll through thousands of rows while the table dynamically renders only what's on screen (plus a small buffer for smooth scrolling).

## Usage

```r
reactable(
  data,
  pagination = FALSE,
  virtual = TRUE,
  height = 500
)
```

Note: `height` is optional. Without an explicit height, the table will use its container's height (e.g., `height: 100%` in a Shiny app with a sized container).

### API Design: Why `virtual`?

The parameter is named `virtual` rather than `virtualScroll` or `virtualScrolling` to match reactable's existing concise naming style. Reactable uses short, adjective-like parameter names:

- `striped` (not `stripedRows`)
- `compact` (not `compactMode`)
- `bordered` (not `borderedCells`)
- `highlight` (not `highlightOnHover`)
- `filterable` (not `filterableColumns`)
- `searchable` (not `searchableTable`)

Following this pattern, `virtual` is preferred over longer alternatives.

Other table libraries use various names:
- TanStack Table: `enableRowVirtualization`
- Vuetify: `virtual`
- AG Grid: `suppressRowVirtualisation`
- Material UI: `virtualize`

`virtual` was chosen because it's concise, commonly used (Vuetify, similar to Material UI), and consistent with reactable's API conventions.

## Changes Made

### R Package (`R/reactable.R`)

- Added `virtual` parameter to `reactable()` function (default: `FALSE`)
- Added validation: `virtual` must be logical
- Passes `virtual` prop to JavaScript widget

### JavaScript (`srcjs/Reactable.js`)

- Added `@tanstack/react-virtual` dependency for virtualization
- Created `VirtualTbody` component that:
  - Uses `useVirtualizer` hook from @tanstack/react-virtual
  - Renders only visible rows plus overscan buffer (5 rows)
  - Uses the existing `.rt-table` element as scroll container (no extra scrollbars)
  - Positions rows absolutely within a spacer div sized to total content height
- Modified `makeTbody()` to:
  - Extract row rendering into reusable `renderRow()` function
  - Use `VirtualTbody` when `virtual=true`
  - Render all rows (`instance.rows`) instead of paginated rows (`instance.page`)

### CSS (`srcjs/reactable.css`)

Added styles for virtual scrolling:
```css
.rt-tbody-virtual {
  overflow: hidden !important;
}

.rt-tbody-virtual .rt-tr-group {
  display: flex;
  flex-direction: column;
}
```

### Dependencies (`package.json`)

Added:
```json
"@tanstack/react-virtual": "^3.13.0"
```

### Bundle Size Impact

| Metric | Before | After | Increase |
|--------|--------|-------|----------|
| Uncompressed | 168.6 KB | 184.7 KB | +16.1 KB (+9.6%) |
| Gzipped | 39.7 KB | 44.6 KB | +4.9 KB (+12.4%) |

The `@tanstack/react-virtual` library adds ~16 KB uncompressed (~5 KB gzipped) to the bundle. This is a modest increase for significant performance gains with large datasets.

For comparison:
- `@tanstack/react-virtual`: ~8 KB minified
- `@tanstack/virtual-core` (peer dependency): ~12 KB minified

## Architecture

### DOM Structure (Virtual Mode)

```
.rt-table (scroll container with overflow: auto and fixed height)
  .rt-thead
  .rt-tbody.rt-tbody-virtual
    <div> (spacer - height equals total content height)
      <div.rt-tr-group> (absolutely positioned visible rows)
      ...
  .rt-tfoot
```

### How It Works

1. The virtualizer tracks scroll position of `.rt-table`
2. Calculates which rows are visible based on scroll position and container height
3. Only renders visible rows plus overscan buffer
4. Rows are absolutely positioned using CSS transforms
5. A spacer div maintains correct scrollbar size

### Row Height

Row heights are dynamically measured at runtime, allowing the virtualizer to adapt to:
- Custom font sizes via `theme` or CSS
- Different content heights
- Any styling that affects row dimensions

Initial estimates used before measurement:
- Default: 36px (7px top padding + 7px bottom padding + ~20px line-height + 1px border)
- Compact mode: 30px (4px top padding + 4px bottom padding + ~20px line-height + 1px border)

These values are derived from the default `.rt-td-inner` padding styles in `reactable.css`.

The virtualizer measures actual rendered row heights and adjusts scroll positioning accordingly.

## Limitations

Virtual scrolling has no hard restrictions. It can be combined with:
- **Pagination** - only visible rows on the current page are rendered
- **Row details** (`details`) - expandable rows are dynamically measured via ResizeObserver
- **Grouped tables** (`groupBy`) - group headers and sub-rows are virtualized together

**Notes on grouped tables:**
- When `paginateSubRows = FALSE` (default): sub-rows add to the row count, ignoring page size. All visible rows (group headers + expanded sub-rows) are virtualized.
- When `paginateSubRows = TRUE`: sub-rows count toward the page size. Pagination and virtualization work together.
- Expanding/collapsing groups outside the visible area may cause scroll position shifts.

**Browser find-in-page (Ctrl+F) does not work** with virtualized tables. Since only visible rows exist in the DOM, the browser's built-in search cannot find text in off-screen rows. This is inherent to how virtual scrolling works. Users should use the table's search/filter functionality instead.

### Accessibility Considerations

Virtual scrolling introduces accessibility challenges:

**Keyboard navigation** is essential for accessibility. `@tanstack/react-virtual` works with the native scroll container, so standard keyboard navigation (arrow keys, Page Up/Down, Home/End) works as expected. Note that some virtualization libraries like `react-window` do not handle keyboard navigation out of the box and require custom implementation (see [react-window#46](https://github.com/bvaughn/react-window/issues/46)).

**ARIA attributes** are implemented to help screen readers understand off-screen rows:
- `aria-rowcount` on the table indicates the total number of rows (data rows + header rows)
- `aria-rowindex` on each row indicates its 1-based position in the full table (header rows first, then data rows)

These attributes are only added when `virtual = TRUE`. Support varies across browser/screen reader combinations. See [W3C ARIA Grid and Table Properties](https://www.w3.org/WAI/ARIA/apg/practices/grid-and-table-properties/) for guidance on using these attributes.

**Other accessibility issues** are documented at the [WICG virtual-scroller proposal](https://github.com/WICG/virtual-scroller), which discusses general challenges with making virtualized scrolling accessible.

## Performance

For a table with 100,000 rows:
- Without virtualization: All 100k DOM elements rendered
- With virtualization: ~15-20 DOM elements rendered (visible + overscan)

This dramatically reduces:
- Initial render time
- Memory usage
- DOM manipulation overhead during scrolling

## Test Plan

### Setup

```r
# Create test table with 100,000 rows
test_data <- data.frame(
  id = 1:100000,
  value = rnorm(100000),
  category = sample(LETTERS, 100000, replace = TRUE)
)

tbl <- reactable(
 test_data,
  virtual = TRUE,
  height = 500
)
```

### Basic Functionality

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Renders with virtual = TRUE | Create table with `virtual = TRUE, height = 500` | Table renders, only ~15-20 rows in DOM |
| Works without explicit height | Create table with `virtual = TRUE` in a sized container | Table uses container height, virtualization works |
| Works with pagination | Create table with `virtual = TRUE, pagination = TRUE, height = 500` | Table renders with pagination controls, current page rows are virtualized |
| Works with groupBy | Create table with `virtual = TRUE, groupBy = "category"` | Grouped table renders, groups expandable |
| Works with details | Create table with `virtual = TRUE, details = ...` | Expandable rows work, height adjusts dynamically |

### Scrolling

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Mouse wheel scroll | Scroll down with mouse wheel | Rows update smoothly, correct rows visible |
| Scrollbar drag | Drag scrollbar to middle | Jumps to ~row 50,000, rows render correctly |
| Scroll to bottom | Scroll to very bottom | Last rows (99,996-100,000) visible |
| Scroll to top | Scroll back to top | First rows (1-15) visible |
| Single scrollbar | Inspect DOM | Only one scrollbar on `.rt-table`, none inside tbody |

### Keyboard Navigation and Accessibility

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Home key | Focus table, press Home | Scrolls to top, row 1 visible |
| End key | Focus table, press End | Scrolls to bottom, row 100,000 visible |
| Page Down | Focus table, press Page Down | Scrolls down by one viewport height (~14 rows) |
| Page Up | From middle, press Page Up | Scrolls up by one viewport height (~14 rows) |
| Arrow Down | Press Down Arrow repeatedly | Scrolls down incrementally |
| Arrow Up | Press Up Arrow repeatedly | Scrolls up incrementally |
| aria-rowcount | Inspect table element | `aria-rowcount` equals total rows + header rows |
| aria-rowindex on headers | Inspect header row(s) | Header rows have `aria-rowindex` starting at 1 |
| aria-rowindex on data rows | Inspect data rows | Data rows have `aria-rowindex` = row index + header count + 1 |
| ARIA with column groups | Table with column groups | `aria-rowcount` and `aria-rowindex` account for multiple header rows |
| No ARIA in non-virtual | `virtual = FALSE` | No `aria-rowcount` or `aria-rowindex` attributes |

### Data Operations

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Sorting | Click column header to sort | Data re-sorts, scroll position resets, virtualization works |
| Filtering | Add column filter | Filtered rows display correctly, row count updates |
| Global search | Use search box | Matching rows display correctly with virtualization |

### Pagination with Virtual

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Page navigation | `virtual = TRUE, pagination = TRUE, defaultPageSize = 1000`, navigate pages | Each page virtualizes correctly, page controls work |
| Page size change | Change page size dropdown | New page size applies, virtualization continues working |
| Scroll within page | Scroll within a page of 1000 rows | Only visible rows rendered, smooth scrolling |
| Page change resets scroll | Scroll down on page 1, then go to page 2 | Scroll position resets to top of page 2 |

### Row Selection

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Single selection | `selection = "single"`, click row | Row selects, selection persists during scroll |
| Multiple selection | `selection = "multiple"`, select multiple rows | Selections persist when scrolling away and back |
| Select after scroll | Scroll to row 50,000, select it | Selection works on virtualized rows |

### Row Details (Expandable Rows)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Expand visible row | Click expander on visible row | Row expands, details visible, other rows shift down |
| Collapse row | Click expander on expanded row | Row collapses, details hidden, rows shift back |
| Expand then scroll | Expand row, scroll away, scroll back | Expanded state preserved, details still visible |
| Multiple expanded | Expand several rows | All expanded rows show details correctly |
| Scroll with expanded | Scroll through table with some rows expanded | Variable heights handled smoothly |
| Expand row above viewport | Scroll down, expand row above visible area | Content may shift (expected behavior) |

### Grouped Tables

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Basic groupBy | `virtual = TRUE, groupBy = "category"` | Group headers render, expandable |
| Expand group | Click group header to expand | Sub-rows appear, virtualization continues |
| Collapse group | Click expanded group header | Sub-rows hidden, row count updates |
| Nested groupBy | `groupBy = c("category", "subcategory")` | Multiple grouping levels work |
| paginateSubRows = FALSE | Default behavior, expand large group | Sub-rows add to visible rows, may exceed page size |
| paginateSubRows = TRUE | `paginateSubRows = TRUE`, expand group | Sub-rows count toward page size |
| Aggregated values | Group with aggregated columns | Aggregated values display correctly in group headers |
| Scroll through groups | Many groups, scroll through | Group headers and sub-rows render correctly |

### Styling

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Striped rows | `striped = TRUE` | Alternating row colors work correctly |
| Highlighted rows | `highlight = TRUE` | Hover highlighting works on virtualized rows |
| Compact mode | `compact = TRUE` | Row height is 30px instead of 36px |
| Custom row styles | Use `rowClassName` or `rowStyle` | Styles apply correctly to virtualized rows |
| Custom font size | `theme = reactableTheme(tableStyle = list(fontSize = "24px"))` | Row heights adapt dynamically, no gaps or overlaps |

### Edge Cases

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Empty data | `virtual = TRUE` with 0 rows | Shows "No rows found" message |
| Small dataset | `virtual = TRUE` with 5 rows | Works correctly even when all rows fit |
| Resize window | Resize browser window | Virtualization adapts to new container size |
| Rapid scrolling | Scroll very fast | No blank rows, smooth rendering |

### Performance

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Initial render | Time from load to interactive | < 500ms for 100k rows |
| DOM element count | Inspect DOM during scroll | Consistently ~15-25 row elements |
| Memory usage | Monitor browser memory | Stable, no leaks during extended scrolling |
| Scroll FPS | Profile scrolling | Maintains 60fps during normal scrolling |

## Future Enhancements

Potential improvements for future versions:
- Horizontal virtualization for tables with many columns
- Scroll-based server-side data fetching (windowed/infinite scroll): Instead of page-based fetching, the server would send only the visible rows based on scroll position. This would allow seamless scrolling through millions of rows without pagination controls. Requirements:
  - Virtualizer notifies server when visible row range changes
  - Server fetches only that range from database
  - Client-side caching to avoid re-fetching already-loaded rows
  - Handling sort/filter with partial data
