# Virtual Scrolling Implementation

## Overview

Added row virtualization to reactable as an alternative to pagination. When enabled, only visible rows are rendered in the DOM, significantly improving performance for large datasets.

## Usage

```r
reactable(
  data,
  virtual = TRUE,
  height = 500  # Recommended for best results
)
```

Note: `height` is optional. Without an explicit height, the table will use its container's height (e.g., `height: 100%` in a Shiny app with a sized container).

### API Design: Why `virtual`?

The parameter is named `virtual` to match reactable's existing concise naming style (`striped`, `compact`, `bordered`, `highlight`). Other libraries use various names:

- TanStack Table: `enableRowVirtualization`
- Vuetify: `virtual`
- AG Grid: `suppressRowVirtualisation`

`virtual` was chosen because it's short, commonly used (Vuetify), and consistent with reactable's API conventions.

## Changes Made

### R Package (`R/reactable.R`)

- Added `virtual` parameter to `reactable()` function (default: `FALSE`)
- Added validation:
  - `virtual` must be logical
  - Not compatible with `groupBy` (grouped tables)
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

Virtual scrolling cannot be used with:
- **Grouped tables** (`groupBy`) - group headers and nested row expansion would require complex variable height handling

Virtual scrolling **can** be combined with:
- **Pagination** - only visible rows on the current page are rendered
- **Row details** (`details`) - expandable rows are dynamically measured via ResizeObserver. Note: expanding rows outside the visible area may cause scroll position shifts.

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
| Renders with virtual=TRUE | Create table with `virtual=TRUE, height=500` | Table renders, only ~15-20 rows in DOM |
| Works without explicit height | Create table with `virtual=TRUE` in a sized container | Table uses container height, virtualization works |
| Works with pagination | Create table with `virtual=TRUE, pagination=TRUE, height=500` | Table renders with pagination controls, current page rows are virtualized |
| Incompatible with groupBy | Create table with `virtual=TRUE, groupBy="category"` | Error about groupBy incompatibility |
| Works with details | Create table with `virtual=TRUE, details=...` | Expandable rows work, height adjusts dynamically |

### Scrolling

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Mouse wheel scroll | Scroll down with mouse wheel | Rows update smoothly, correct rows visible |
| Scrollbar drag | Drag scrollbar to middle | Jumps to ~row 50,000, rows render correctly |
| Scroll to bottom | Scroll to very bottom | Last rows (99,996-100,000) visible |
| Scroll to top | Scroll back to top | First rows (1-15) visible |
| Single scrollbar | Inspect DOM | Only one scrollbar on `.rt-table`, none inside tbody |

### Keyboard Navigation

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Home key | Focus table, press Home | Scrolls to top, row 1 visible |
| End key | Focus table, press End | Scrolls to bottom, row 100,000 visible |
| Page Down | Focus table, press Page Down | Scrolls down by one viewport height (~14 rows) |
| Page Up | From middle, press Page Up | Scrolls up by one viewport height (~14 rows) |
| Arrow Down | Press Down Arrow repeatedly | Scrolls down incrementally |
| Arrow Up | Press Up Arrow repeatedly | Scrolls up incrementally |

### Data Operations

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Sorting | Click column header to sort | Data re-sorts, scroll position resets, virtualization works |
| Filtering | Add column filter | Filtered rows display correctly, row count updates |
| Global search | Use search box | Matching rows display correctly with virtualization |

### Pagination with Virtual

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Page navigation | `virtual=TRUE, pagination=TRUE, defaultPageSize=1000`, navigate pages | Each page virtualizes correctly, page controls work |
| Page size change | Change page size dropdown | New page size applies, virtualization continues working |
| Scroll within page | Scroll within a page of 1000 rows | Only visible rows rendered, smooth scrolling |
| Page change resets scroll | Scroll down on page 1, then go to page 2 | Scroll position resets to top of page 2 |

### Row Selection

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Single selection | `selection="single"`, click row | Row selects, selection persists during scroll |
| Multiple selection | `selection="multiple"`, select multiple rows | Selections persist when scrolling away and back |
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

### Styling

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Striped rows | `striped=TRUE` | Alternating row colors work correctly |
| Highlighted rows | `highlight=TRUE` | Hover highlighting works on virtualized rows |
| Compact mode | `compact=TRUE` | Row height is 30px instead of 36px |
| Custom row styles | Use `rowClassName` or `rowStyle` | Styles apply correctly to virtualized rows |
| Custom font size | `theme=reactableTheme(tableStyle=list(fontSize="24px"))` | Row heights adapt dynamically, no gaps or overlaps |

### Edge Cases

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Empty data | `virtual=TRUE` with 0 rows | Shows "No rows found" message |
| Small dataset | `virtual=TRUE` with 5 rows | Works correctly even when all rows fit |
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
- Integration with grouped tables
- Horizontal virtualization for tables with many columns
