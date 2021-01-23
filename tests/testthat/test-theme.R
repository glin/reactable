test_that("reactableTheme", {
  expect_equal(reactableTheme(), structure(list(), .Names = character(0), class = "reactableTheme"))
  expect_equal(
    reactableTheme(cellPadding = paste0("3", "px"), style = list(color = "#fff")),
    structure(list(cellPadding = "3px", style = list(color = "#fff")), class = "reactableTheme")
  )

  argTypes <- list(
    color = "string",
    backgroundColor = "string",
    borderColor = "string",
    borderWidth = "number",
    stripedColor = "string",
    highlightColor = "string",
    cellPadding = "number",

    style = "style",

    tableStyle = "style",

    headerStyle = "style",

    groupHeaderStyle = "style",

    tableBodyStyle = "style",

    rowGroupStyle = "style",

    rowStyle = "style",
    rowStripedStyle = "style",
    rowHighlightStyle = "style",
    rowSelectedStyle = "style",

    cellStyle = "style",

    footerStyle = "style",

    inputStyle = "style",
    filterInputStyle = "style",
    searchInputStyle = "style",

    selectStyle = "style",

    paginationStyle = "style",
    pageButtonStyle = "style",
    pageButtonHoverStyle = "style",
    pageButtonActiveStyle = "style",
    pageButtonCurrentStyle = "style"
  )

  makeTheme <- function(arg, value) {
    do.call(reactableTheme, stats::setNames(list(value), arg))
  }

  for (arg in names(argTypes)) {
    if (argTypes[[arg]] == "style") {
      expect_equal(makeTheme(arg, list(color = "red"))[[arg]], list(color = "red"))
      expect_equal(makeTheme(arg, list(color = "red", "&:hover" = list(padding = 1)))[[arg]],
                   list(color = "red", "&:hover" = list(padding = 1)))
      expect_error(makeTheme(arg, 123), sprintf("`%s` must be a named list", arg))
    } else if (argTypes[[arg]] == "number") {
      expect_equal(makeTheme(arg, 34)[[arg]], 34)
      expect_equal(makeTheme(arg, "22px")[[arg]], "22px")
      expect_error(makeTheme(arg, NA), sprintf("`%s` must be a character string or number", arg))
    } else {
      expect_equal(makeTheme(arg, "#fff")[[arg]], "#fff")
      expect_error(makeTheme(arg, 234), sprintf("`%s` must be a character string", arg))
    }
  }
})

test_that("is.reactableTheme", {
  expect_true(is.reactableTheme(reactableTheme()))
  expect_false(is.reactableTheme(list()))
})
