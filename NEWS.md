# reactable 0.3.0

This release upgrades to a new major version of React Table
([#35](https://github.com/glin/reactable/issues/35)), which introduces many
new features, improvements, and bug fixes. Backward compatibility was kept
where possible, but note that there are several breaking changes.

## New features

* Cell content can now be vertically aligned using the new `vAlign` and `headerVAlign`
  arguments in `colDef()`, and the new `headerVAlign` argument in `colGroup()`
  ([#142](https://github.com/glin/reactable/issues/142),
  [#177](https://github.com/glin/reactable/issues/177)).
* Sticky columns are now supported using a new `sticky` argument in `colDef()`
  and `colGroup()` ([#19](https://github.com/glin/reactable/issues/19),
  [#72](https://github.com/glin/reactable/issues/72),
  [#141](https://github.com/glin/reactable/issues/141)).
* New JavaScript API to manipulate or access tables from JavaScript. Use this to
  create custom interactive controls, such as CSV download buttons, custom filter inputs,
  or toggle buttons for row grouping and row expansion
  ([#11](https://github.com/glin/reactable/issues/11),
  [#28](https://github.com/glin/reactable/issues/28),
  [#182](https://github.com/glin/reactable/issues/182),
  [#194](https://github.com/glin/reactable/issues/194)).
  Learn more in the [JavaScript API guide](https://glin.github.io/reactable/articles/javascript-api.html)
  or the [JavaScript API examples](https://glin.github.io/reactable/articles/examples.html#javascript-api).
* Column filtering and table searching can now be customized. Learn more in the
  [Custom Filtering guide](https://glin.github.io/reactable/articles/custom-filtering.html).
  * `reactable()` gains a `searchMethod` argument to use a custom JavaScript function
    for global table searching ([#222](https://github.com/glin/reactable/issues/222)).
  * `colDef()` gains a `filterMethod` argument to use a custom JavaScript function
    for column filtering ([#9](https://github.com/glin/reactable/issues/9),
    [#90](https://github.com/glin/reactable/issues/90),
    [#145](https://github.com/glin/reactable/issues/145)).
  * `colDef()` gains a `filterInput` argument to render a custom filter input for
    column filtering ([#9](https://github.com/glin/reactable/issues/9)).
* `reactable()` gains a `paginateSubRows` argument to include grouped sub rows
  in pagination. This is recommended for grouped tables with a large number of rows
  where expanded rows may not all fit on one page.
* Expanded rows now stay expanded on sorting, filtering, and pagination changes.
  Previously, expanded rows were always collapsed on sorting and pagination
  changes, and incorrectly persisted on filtering changes
  ([#39](https://github.com/glin/reactable/issues/39)).
* Aggregated rows can now be selected when multiple selection is enabled.
* `colDef()` gains a `grouped` argument to customize rendering for grouped cells
  in `groupBy` columns ([#33](https://github.com/glin/reactable/issues/33),
  [#94](https://github.com/glin/reactable/issues/94),
  [#148](https://github.com/glin/reactable/issues/148)).
* Column group headers can now be resized.
* Column group headers and filters are now sticky. Previously, only column
  headers were sticky ([#107](https://github.com/glin/reactable/issues/107)).
* JavaScript render functions and style functions receive new properties:
  * `rowInfo.expanded` and `cellInfo.expanded` indicating whether the row is expanded
  * `cellInfo.selected` indicating whether the cell's row is selected
  * `state.page`, `state.pageSize`, and `state.pages` for the current page index,
    page size, and number of pages in the table
  * `cellInfo.filterValue` and `column.filterValue` for the column filter value, and
    `column.setFilter` to set the filter value
  * `state.filters` for the column filter values
  * `state.searchValue` for the table search value
  * `state.selected` for the selected row indices
* JavaScript render functions for cells, headers, footers, and row details
  receive a new `state` argument to access the table state
  ([#88](https://github.com/glin/reactable/issues/88)). Custom cell click actions also
  now receive a `state` argument.
* R render functions for row details now receive an additional argument for
  the column name (@ksnap28, [#155](https://github.com/glin/reactable/issues/155)).
* `colDef()` gains a `searchable` argument to enable or disable global table
  searching. Columns can be excluded from searching using `colDef(searchable = FALSE)`,
  and hidden columns can be included in searching using `colDef(searchable = TRUE)`
  ([#217](https://github.com/glin/reactable/issues/217)).

## Breaking changes

### JavaScript render and style functions

* The `rowInfo.row` property is now **deprecated**, and has been renamed to
  `rowInfo.values`. `rowInfo.row` remains supported, but replace usages with
  `rowInfo.values` when possible.
  ```js
  // Old
  function(rowInfo) {
    rowInfo.row
  }

  // New
  function(rowInfo) {
    rowInfo.values
  }
  ```
* The `colInfo.column` and `colInfo.data` properties in header and cell render
  functions are now **deprecated**. The `colInfo` object now contains all of the same
  properties as `colInfo.column`, and is now referred to as `column` in the documentation.
  When possible, replace usages of `colInfo` with `column`, `colInfo.column`
  with `column`, and `colInfo.data` with `state.data` or `state.sortedData`.
  ```js
  // Old
  function(colInfo) {
    colInfo.column.id
    colInfo.data
  }

  // New
  function(column, state) {
    column.id
    state.data
  }
  ```
* The `state.expanded` property has been **removed**. To check whether a row is
  expanded, use `rowInfo.expanded` instead.
  ```js
  // Old
  function(rowInfo, column, state) {
    if (state.expanded[rowInfo.index]) { // row is expanded ... }
  }

  // New
  function(rowInfo, column, state) {
    if (rowInfo.expanded) { // row is expanded ... }
  }
  ```
* The `rowInfo.page` and `cellInfo.page` properties have been **removed**. To get
  the current page index of the table, use `state.page` instead.
  ```js
  // Old
  function(rowInfo, column, state) {
    rowInfo.page
  }

  // New
  function(rowInfo, column, state) {
    state.page
  }
  ```
* When accessing row data in JavaScript render functions and style functions:
  * Date and time values are now represented in UTC time (ISO 8601 format),
    rather than local time without a timezone.
    ```js
    function(cellInfo) {
      // Old
      cellInfo.value // 2022-05-22T19:30:00

      // New
      cellInfo.value // 2022-05-22T19:30:00Z

      // With a UTC time, it's much easier to format dates in the user's local time
      return new Date(cellInfo.value).toLocaleString()
    }
    ```
  * Single values (length-1 vectors) in list-columns are no longer represented as
    arrays (i.e., data is now serialized using `jsonlite::toJSON(auto_unbox = TRUE)`).
    For example, `list(x = 1)` in R is now represented as `{x: 1}` in JavaScript
    instead of `{x: [1]}`.

### Other changes

* When both `columnGroups` and `groupBy` arguments are provided in `reactable()`,
  `groupBy` columns are no longer added to a column group automatically
  ([#87](https://github.com/glin/reactable/issues/87)).
* The `defaultGroupHeader` argument in `reactableLang()` is now deprecated and
  no longer used. Use the `columnGroups` argument in `reactable()` to customize
  the column group header for `groupBy` columns.
* The `detailsCollapseLabel`, `deselectAllRowsLabel`, `deselectAllSubRowsLabel`,
  and `deselectRowLabel` arguments in `reactableLang()` are now deprecated and
  no longer used ([#167](https://github.com/glin/reactable/issues/167)).
* The row selection column is now always placed as the first column in the
  table, even before the `groupBy` and row details columns
  ([#71](https://github.com/glin/reactable/issues/71)).
* Increased the default width of the row selection column to match the row
  details column (45px).

## Minor improvements and bug fixes

* Setting `show = FALSE` as a default value in `defaultColDef()` now works
  (@csgillespie, [#105](https://github.com/glin/reactable/pull/105)).
  Setting `sortNALast`, `html`, and `na` to their default values in
  `defaultColDef()` also now works.
* Using a single value for `pageSizeOptions` in `reactable()` now works.
* Column resizing is now limited by the min and max width of the column.
* Column group headers and filter cells in fixed height tables now display
  properly in Safari, Chrome, and the RStudio Viewer
  ([#76](https://github.com/glin/reactable/issues/76)).
* In `reactable()`, `defaultExpanded = TRUE` now expands all rows in the table,
  not just rows on the first page.
* In `reactable()`, `defaultExpanded = TRUE` now works when column groups are present.
* Aggregated cell values are now recalculated when filtering or searching the table.
* Aggregate functions now always take the unaggregated values in the column.
  Previously, if there were multiple `groupBy` columns, aggregate functions
  could take aggregated values which could produce inaccurate calculations
  (e.g., when calculating the mean of values).
* The `"max"` and `"min"` aggregate functions now work on dates, date-times,
  and strings ([#130](https://github.com/glin/reactable/issues/130)).
* Column formatters no longer apply to empty aggregated cell values.
* Searching now properly ignores the row details and selection columns.
* Selected rows now reset when the table data changes in Shiny
  ([#110](https://github.com/glin/reactable/issues/110)).
* When selecting rows, errors from other Crosstalk widgets no longer cause the
  table to disappear.
* HTML widgets and HTML dependencies in nested tables now render correctly
  ([#125](https://github.com/glin/reactable/issues/125)).
* Tables are now displayed with full width when rendered inside an R Markdown
  document or R Notebook ([#163](https://github.com/glin/reactable/issues/163)).
* `reactable()` now works for data frames with `difftime` objects and objects
  with custom classes ([#164](https://github.com/glin/reactable/issues/164)).
* `colFormat()` now formats dates and times in the user's time zone, rather than
  ignoring time zones.
* Row expand buttons no longer change their accessible labels based on expanded
  state. They now use the `aria-expanded` attribute to indicate expanded
  or collapsed state, and use "Toggle details" as their default label
  ([#167](https://github.com/glin/reactable/issues/167)).
* `reactableLang()` gains the `groupExpandLabel` argument to customize the
  accessible label for row group expand buttons
  ([#167](https://github.com/glin/reactable/issues/167)).
* Row selection checkboxes and radio buttons no longer change their accessible
  labels based on selection state ([#167](https://github.com/glin/reactable/issues/167)).
* Cells can now be marked up as row headers for assistive technologies, using the
  new `rowHeader` argument in `colDef()`. Cells in the row names column are
  automatically marked up as row headers ([#167](https://github.com/glin/reactable/issues/167)).
* The page info and "no rows found" message are now marked as ARIA live regions
  so page changes can be announced by assistive technologies when searching,
  filtering, or paging through the table ([#167](https://github.com/glin/reactable/issues/167)).
* Scrollable tables are now focusable and scrollable when using a keyboard
  ([#167](https://github.com/glin/reactable/issues/167)).
* In `reactableTheme()`, `filterInputStyle` now applies correctly when rerendering
  a table in Shiny ([#186](https://github.com/glin/reactable/issues/186)).
* In `reactableTheme()`, `cellPadding` now applies to column group headers correctly.
* Columns with square brackets (`[` or `]`) in their column name now render correctly
  ([#187](https://github.com/glin/reactable/issues/187)).
* Disabling pagination using `reactable(pagination = FALSE)` now works correctly
  on table data updates ([#214](https://github.com/glin/reactable/issues/214)).
* More HTML attributes are supported when rendering HTML tags, such as `onclick`
  ([#150](https://github.com/glin/reactable/issues/150)).
* Improved initial load time of tables with a large number of rows (up to
  50% faster in some cases).

# reactable 0.2.3

## Bug fixes

* Fixed a character encoding issue in the documentation.

# reactable 0.2.2

## Bug fixes

* Headers in fixed height tables now display properly in Safari, Chrome, and
  the RStudio Viewer ([#76](https://github.com/glin/reactable/issues/76)).

# reactable 0.2.1

## New features

* `updateReactable()` gains a `data` argument to update the data of a reactable
  instance in Shiny ([#49](https://github.com/glin/reactable/issues/49)).

## Bug fixes

* Row selection columns now display correctly in tables with column groups
  ([#52](https://github.com/glin/reactable/issues/52)).
* `defaultSelected` now works correctly with Crosstalk linked selection.
* Crosstalk selection and filtering now works with nested and dynamically
  rendered tables [#57](https://github.com/glin/reactable/issues/57)).
* Tables now display correctly for Crosstalk `SharedData` objects with zero or one rows.
* Shiny UI elements in expanded row details are now properly removed when
  collapsed on page changes.
* `colFormat()` now always formats numbers as a localized string when `locales`
  is specified.
* Table rows no longer stretch to fill the height of the container
  ([#69](https://github.com/glin/reactable/issues/69)). To make rows stretch
  again, use a theme like `reactableTheme(tableBodyStyle = list(flex = "auto"))`.
* Multi-sorting no longer selects text in column headers.

# reactable 0.2.0

## New features

* `reactable()` now supports linked selection and filtering with Crosstalk-compatible
  HTML widgets ([#46](https://github.com/glin/reactable/issues/46)).
* `reactable()` gains a `theme` argument to customize the default styling of a table.
* `reactable()` gains a `language` argument to customize the language strings in a table
  ([#24](https://github.com/glin/reactable/issues/24)).
* `reactable()` gains a `defaultSelected` argument to set default selected rows.
* `reactable()` gains a `defaultExpanded` argument to set default expanded rows
  ([#23](https://github.com/glin/reactable/issues/23)).
* New `updateReactable()` function to update the selected rows, expanded rows, or
  current page of a reactable instance in Shiny ([#20](https://github.com/glin/reactable/issues/20)).
* New `getReactableState()` function to get the state of a reactable instance in Shiny
  ([#20](https://github.com/glin/reactable/issues/20)).
* `colDef()` gains a `"median"` aggregate function to calculate the median of numbers
  ([#30](https://github.com/glin/reactable/issues/30)).
* The row selection column can now be customized using `".selection"` as the column name
  ([#19](https://github.com/glin/reactable/issues/19)).
* In `reactable()`, the `rowClass`, `rowStyle`, and `details` JavaScript functions
  now receive a `rowInfo.selected` property indicating whether the row is selected
  ([#20](https://github.com/glin/reactable/issues/20)).

## Breaking changes

* The `selectionId` argument in `reactable()` will be deprecated in a future release.
  Use `getReactableState()` to get the selected rows of a table in Shiny instead.

## Bug fixes

* General accessibility improvements, particularly for screen reader users.
* Table searching now works correctly when row selection is enabled.
* `colFormat(date = TRUE)` now formats `YYYY-MM-DD` dates correctly ([#38](https://github.com/glin/reactable/issues/38)).
* `colFormat(percent = TRUE)` now works correctly when viewing tables in IE11.
* Cell click actions now work for all cells in aggregated rows.
* Aggregated cells in columns with row details no longer throw an error when clicked.
* In `colDef()`, the `class` and `style` R functions now handle list-columns correctly.
* Column headers now truncate long text properly.
* Footers now display properly in fixed height tables for Safari and Chrome ([#41](https://github.com/glin/reactable/issues/41)).
* Dark themes no longer affect text color in RStudio R Notebooks ([#21](https://github.com/glin/reactable/issues/21)).
* Checkboxes and radio buttons now align with multi-line text in selectable tables.
* Text selection now works in column headers.
* Row striping and highlighting styles no longer affect nested tables.

# reactable 0.1.0.1

* Updated tests for compatibility with R 4.0.0.

# reactable 0.1.0

* Initial release.
