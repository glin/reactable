# reactable 0.1.0.9000

### New features

* `reactable()` gains a `defaultSelected` argument to set default selected rows.
* `reactable()` gains a `defaultExpanded` argument to set default expanded rows.
* New `updateReactable()` function to update the selected rows, expanded rows, or
  current page of a reactable instance in Shiny.
* New `getReactableState()` function to get the state of a reactable instance in Shiny.
* In `reactable()`, the `rowClass`, `rowStyle`, and `details` JavaScript functions
  now receive a `rowInfo.selected` property indicating whether the row is selected.
* `reactable()` gains a `language` argument to customize the language strings in a table.

### Bug fixes

* General improvements to screen reader accessibility.
* Table searching now works correctly when row selection is enabled.
* `colFormat(percent = TRUE)` now works correctly when viewing tables in IE11.
* In `colDef()`, the `class` and `style` R functions now handle list-columns correctly.
* Cell click actions now work for all cells in aggregated rows.
* Aggregated cells in columns with row details no longer throw an error when clicked.

# reactable 0.1.0

* Initial release.
