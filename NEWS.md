# reactable 0.1.0.9000

### New features

* `reactable()` gains a `defaultSelected` argument to set default selected rows.
* `reactable()` gains a `defaultExpanded` argument to set default expanded rows.
* New `updateReactable()` function to update the selected rows, expanded rows, or
  current page of a reactable instance in Shiny.
* New `getReactableState()` function to get the state of a reactable instance in Shiny.
* In `reactable()`, the `rowClass`, `rowStyle`, and `details` JavaScript functions
  now receive a `rowInfo.selected` property indicating whether the row is selected.
* `reactable()` gains a `theme` argument to customize the default styling of a table.
* `reactable()` gains a `language` argument to customize the language strings in a table.
* `colDef()` gains a `"median"` aggregate function to calculate the median of numbers.
* The row selection column can now be customized using `".selection"` as the column name.

### Breaking changes

* The `selectionId` argument in `reactable()` will be deprecated in a future release.
  Use `getReactableState()` to get the selected rows of a table in Shiny instead.

### Bug fixes

* General improvements to screen reader accessibility.
* Table searching now works correctly when row selection is enabled.
* `colFormat(percent = TRUE)` now works correctly when viewing tables in IE11.
* `colFormat(date = TRUE)` now formats `YYYY-MM-DD` dates correctly ([#38](https://github.com/glin/reactable/issues/38)).
* In `colDef()`, the `class` and `style` R functions now handle list-columns correctly.
* Cell click actions now work for all cells in aggregated rows.
* Aggregated cells in columns with row details no longer throw an error when clicked.
* Row striping and highlighting styles no longer affect nested tables.
* Text selection now works in column headers.
* Dark themes no longer affect text color in RStudio R Notebooks ([#21](https://github.com/glin/reactable/issues/21)).

# reactable 0.1.0.1

* Updated tests for compatibility with R 4.0.0.

# reactable 0.1.0

* Initial release.
