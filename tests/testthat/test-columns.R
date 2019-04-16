context("columns")

test_that("colDef", {
  # Default args
  expect_equal(colDef(), structure(list(
    Header = NULL, aggregate = NULL,
    sortable = NULL, resizable = NULL, filterable = NULL,
    show = NULL, defaultSortDesc = NULL, format = NULL, render = NULL,
    minWidth = NULL, maxWidth = NULL, width = NULL,
    className = NULL, style = NULL, headerClassName = NULL,
    headerStyle = NULL), class = "colDef"))

  # Valid args
  col <- colDef(name = "col", aggregate = "sum",
                sortable = TRUE, resizable = TRUE, filterable = TRUE,
                show = FALSE, defaultSortOrder = "desc",
                format = list(cell = colFormat(), aggregated = colFormat()),
                render = list(cell = JS("row => row.value"),
                              aggregated = JS("row => row.value")),
                minWidth = 100, maxWidth = 250, width = 125, align = "right",
                class = "cell", style = list(color = "a"), headerClass = "hdr",
                headerStyle = list(height = 10))
  expected <- structure(list(
    Header = "col", aggregate = "sum",
    sortable = TRUE, resizable = TRUE, filterable = TRUE,
    show = FALSE, defaultSortDesc = TRUE,
    format = list(cell = colFormat(), aggregated = colFormat()),
    render = list(cell = JS("row => row.value"), aggregated = JS("row => row.value")),
    minWidth = 100, maxWidth = 250, width = 125,
    className = "cell", style = list(color = "a", textAlign = "right"),
    headerClassName = "hdr", headerStyle = list(height = 10)), class = "colDef")
  expect_equal(col, expected)

  # Invalid args
  invalidArgs <- list(
    name = list(1, FALSE),
    aggregate = list(2, TRUE, function() {}),
    sortable = list(1, "TRUE"),
    resizable = list(1, "TRUE"),
    filterable = list(0, "FALSE"),
    show = list(0, "TRUE"),
    defaultSortOrder = list(1, TRUE, "ascending"),
    format = list(23, list(CELL = colFormat()), list(aggregated = list())),
    render = list("function() {}", list(CELL = JS("")), list(cell = "func")),
    minWidth = list("1", FALSE),
    maxWidth = list("1", FALSE),
    align = list("a", "RIGHT", 1),
    width = list("1", FALSE),
    class = list(1, list()),
    style = list(list("a"), 2),
    headerClass = list(1, list()),
    headerStyle = list(list("a"), 2)
  )
  for (arg in names(invalidArgs)) {
    for (val in invalidArgs[[arg]]) {
      expect_error(do.call(colDef, setNames(list(val), arg)))
    }
  }
})

test_that("colDef format/render", {
  format <- colFormat()
  render <- JS("row => row.value")

  # Default cell format/renderer
  col <- colDef(format = format, render = render)
  expect_equal(col$format, list(cell = format))
  expect_equal(col$render, list(cell = render))

  # Aggregated format/renderer
  col <- colDef(format = list(aggregated = format), render = list(aggregated = render))
  expect_equal(col$format, list(aggregated = format))
  expect_equal(col$render, list(aggregated = render))
})

test_that("is.colDef", {
  expect_true(is.colDef(colDef()))
  expect_false(is.colDef(list()))
})

test_that("sort order", {
  expect_true(isSortOrder("asc"))
  expect_true(isSortOrder("desc"))
  expect_false(isSortOrder(FALSE))
  expect_false(isSortOrder(list("asc")))
  expect_true(isDescOrder("desc"))
  expect_false(isDescOrder("asc"))
})

test_that("colGroup", {
  # Default args
  group <- colGroup("name", c("colA", "colB"))
  expect_equal(group, structure(list(
    Header = "name",
    columns = c("colA", "colB")
  ), class = "colGroup"))

  # Valid args
  group <- colGroup("name", c("colA", "colB"),
                    headerStyle = list(color = "red"), headerClass = "cls")
  expect_equal(group, structure(list(
    Header = "name",
    headerClassName = "cls",
    headerStyle = list(color = "red"),
    columns = c("colA", "colB")
  ), class = "colGroup"))

  # Invalid args
  expect_error(colGroup(1, "col"))
  expect_error(colGroup("name", list("col")))
  expect_error(colGroup("name", 123))
})

test_that("is.colGroup", {
  expect_true(is.colGroup(colGroup("name", "col")))
  expect_false(is.colGroup(list()))
})

test_that("colFormat", {
  # Default args
  expect_equal(colFormat(), structure(list(), class = "colFormat"))

  # Valid args
  options <- colFormat(prefix = "a", suffix = "b", digits = 5, separators = TRUE,
                       currency = "INR", locales = c("en-US", "zh-Hans-CN"))
  expect_equal(options, structure(list(
    prefix = "a", suffix = "b", digits = 5, separators = TRUE,
    currency = "INR", locales = c("en-US", "zh-Hans-CN")
  ), class = "colFormat"))

  # Invalid args
  expect_error(colFormat(prefix = 1))
  expect_error(colFormat(suffix = 1))
  expect_error(colFormat(digits = -1))
  expect_error(colFormat(digits = 21))
  expect_error(colFormat(separators = "sad"))
  expect_error(colFormat(currency = FALSE))
  expect_error(colFormat(locales = 123))
})

test_that("is.colFormat", {
  expect_true(is.colFormat(colFormat()))
  expect_false(is.colFormat(list()))
})

test_that("colType", {
  expect_equal(colType(c(1, 2)), "numeric")
  expect_equal(colType(1L), "numeric")
  expect_equal(colType(c("a", "b")), "character")
  expect_equal(colType(as.factor(c("a", "b"))), "factor")
  expect_equal(colType(c(TRUE, FALSE)), "logical")
  expect_equal(colType(as.Date("2018-05-06")), "Date")
  expect_equal(colType(as.POSIXct("2018-05-06")), "Date")
  expect_equal(colType(as.POSIXlt("2018-05-06")), "Date")
})
