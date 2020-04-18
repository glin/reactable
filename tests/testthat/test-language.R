context("language")

test_that("reactableLang", {
  expect_equal(reactableLang(), structure(list(), class = "reactableLang"))
  expect_equal(reactableLang(sortLabel = "_Sort {name}", searchPlaceholder = "", noData = NULL),
               structure(list(sortLabel = "_Sort {name}", searchPlaceholder = ""), class = "reactableLang"))

  lang <- list(
    # Sorting
    sortLabel = "_Sort {name}",

    # Filters
    filterPlaceholder = "_Filter",
    filterLabel = "_Filter {name}",

    # Search
    searchPlaceholder = "_Search",
    searchLabel = "_Search",

    # Tables
    noData = "_No rows found",

    # Pagination
    pageNext = "_Next",
    pagePrevious = "_Previous",
    pageNumbers = "_{page} of {pages}",
    pageInfo = "_{rowStart}–{rowEnd} of {rows} rows",
    pageSizeOptions = "_Show {rows}",
    pageNextLabel = "_Next page",
    pagePreviousLabel = "_Previous page",
    pageNumberLabel = "_Page {page}",
    pageJumpLabel = "_Go to page",
    pageSizeOptionsLabel = "_Rows per page",

    # Column groups
    defaultGroupHeader = "_Grouped",

    # Row details
    detailsExpandLabel = "_Expand details",
    detailsCollapseLabel = "_Collapse details",

    # Selection
    selectAllRowsLabel = "_Select all rows",
    deselectAllRowsLabel = "_Deselect all rows",
    selectAllSubRowsLabel = "_Select all rows in group",
    deselectAllSubRowsLabel = "_Deselect all rows in group",
    selectRowLabel = "_Select row {row}",
    deselectRowLabel = "_Deselect row {row}"
  )
  expect_equal(do.call(reactableLang, lang), structure(lang, class = "reactableLang"))

  # Expressions should work
  expect_equal(reactableLang(noData = paste("no", "data"))$noData, "no data")
  expect_equal(reactableLang(pageInfo = (function() "pageinfo")())$pageInfo, "pageinfo")
  expect_equal(do.call(reactableLang, list(sortLabel = "sort"))$sortLabel, "sort")

  # Errors
  expect_error(reactableLang(noData = 123, detailsExpandLabel = TRUE), "`noData` must be a character string")
  expect_error(reactableLang(selectRowLabel = list()), "`selectRowLabel` must be a character string")
})

test_that("is.reactableLang", {
  expect_true(is.reactableLang(reactableLang()))
  expect_false(is.reactableLang(list()))
})
