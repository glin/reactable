# reactable 0.1.0.9000

### New features

* `reactable()` gains a `defaultSelected` argument to set default selected rows.
* `reactable()` gains a `defaultExpanded` argument to set default expanded rows.
* New `updateReactable()` function to update the selected rows, expanded rows, or
  current page of a reactable instance in Shiny.
* In `reactable()`, the `rowClass`, `rowStyle`, and `details` JavaScript functions
  now receive a `rowInfo.selected` property indicating whether the row is selected.

### Bug fixes

* `colFormat(percent = TRUE)` now works correctly when viewing tables in IE11.
* Table searching now works when row selection is enabled.
* In `colDef()`, R functions for `class` and `style` now always receive cell values as single elements.

# reactable 0.1.0

* Initial release.
