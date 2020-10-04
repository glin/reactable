# reactable 0.2.3

### Bug fixes

* Fixed a character encoding issue in the documentation.

# reactable 0.2.2

### Bug fixes

* Headers in fixed height tables now display properly in Safari, Chrome, and
  the RStudio Viewer ([#76](https://github.com/glin/reactable/issues/76)).

# reactable 0.2.1

### New features

* `updateReactable()` gains a `data` argument to update the data of a reactable
  instance in Shiny ([#49](https://github.com/glin/reactable/issues/49)).

### Bug fixes

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

### New features

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

### Breaking changes

* The `selectionId` argument in `reactable()` will be deprecated in a future release.
  Use `getReactableState()` to get the selected rows of a table in Shiny instead.

### Bug fixes

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
