context("columns")

test_that("colDef", {
  # Default args
  expect_equal(colDef(), structure(list(
    Header = NULL, aggregate = NULL,
    sortable = NULL, resizable = NULL, filterable = NULL,
    show = NULL, defaultSortDesc = NULL, format = NULL, render = NULL,
    html = NULL, minWidth = NULL, maxWidth = NULL, width = NULL, align = NULL,
    className = NULL, style = NULL, headerClassName = NULL,
    headerStyle = NULL), class = "colDef"))

  # Valid args
  col <- colDef(name = "col", aggregate = "sum",
                sortable = TRUE, resizable = TRUE, filterable = TRUE,
                show = FALSE, defaultSortOrder = "desc",
                format = list(cell = colFormat(), aggregated = colFormat()),
                render = list(cell = JS("row => row.value"),
                              aggregated = JS("row => row.value")),
                html = TRUE, minWidth = 100, maxWidth = 250, width = 125,
                align = "right", class = "cell", style = list(color = "a"),
                headerClass = "hdr", headerStyle = list(height = 10))

  expected <- structure(list(
    Header = "col", aggregate = "sum",
    sortable = TRUE, resizable = TRUE, filterable = TRUE,
    show = FALSE, defaultSortDesc = TRUE,
    format = list(cell = colFormat(), aggregated = colFormat()),
    render = list(cell = JS("row => row.value"), aggregated = JS("row => row.value")),
    html = TRUE, minWidth = 100, maxWidth = 250, width = 125,
    align = "right", className = "cell", style = list(color = "a"),
    headerClassName = "hdr", headerStyle = list(height = 10)), class = "colDef")
  expect_equal(col, expected)

  # Invalid args
  invalidArgs <- list(
    name = list(1, FALSE),
    aggregate = list(2, TRUE, function() {}, "fn", "SUM"),
    sortable = list(1, "TRUE"),
    resizable = list(1, "TRUE"),
    filterable = list(0, "FALSE"),
    show = list(0, "TRUE"),
    defaultSortOrder = list(1, TRUE, "ascending"),
    format = list(23, list(CELL = colFormat()), list(aggregated = list())),
    render = list("function() {}", list(CELL = JS("")), list(cell = "func")),
    html = list("false", NA),
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
      expect_error(do.call(colDef, stats::setNames(list(val), arg)))
    }
  }
})

test_that("colDef format/render", {
  format <- colFormat()
  renderJS <- JS("row => row.value")

  # Default cell format/renderer
  col <- colDef(format = format, render = renderJS)
  expect_equal(col$format, list(cell = format, aggregated = format))
  expect_equal(col$render, list(cell = renderJS, aggregated = renderJS))

  # Separate cell and aggregated format/renderer
  col <- colDef(format = list(aggregated = format), render = list(aggregated = renderJS))
  expect_equal(col$format, list(aggregated = format))
  expect_equal(col$render, list(aggregated = renderJS))
  col <- colDef(format = list(cell = format), render = list(cell = renderJS))
  expect_equal(col$format, list(cell = format))
  expect_equal(col$render, list(cell = renderJS))

  # R renderer
  renderR <- function(value, index) value
  col <- colDef(render = renderR)
  expect_equal(col$render, list(cell = renderR))
  col <- colDef(render = list(cell = renderR))
  expect_equal(col$render, list(cell = renderR))
  col <- colDef(render = list(cell = renderR, aggregated = renderJS))
  expect_equal(col$render, list(cell = renderR, aggregated = renderJS))
})

test_that("colDef style", {
  col <- colDef(style = " border-bottom: 1px solid; top: 50px",
                headerStyle = " border: 1px solid; top: 25px;;df")
  expect_equal(col$style, list("border-bottom" = "1px solid", top = "50px"))
  expect_equal(col$headerStyle, list("border" = "1px solid", top = "25px"))
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
  group <- colGroup("name", c("colA", "colB"), align = "right",
                    headerStyle = list(color = "red"), headerClass = "cls")
  expect_equal(group, structure(list(
    Header = "name",
    align = "right",
    headerClassName = "cls",
    headerStyle = list(color = "red"),
    columns = c("colA", "colB")
  ), class = "colGroup"))

  # Style
  test_that("colDef style", {
    group <- colGroup("grp", "col", headerStyle = " border: 1px solid; top: 25px;;df")
    expect_equal(group$headerStyle, list("border" = "1px solid", top = "25px"))
  })

  # Invalid args
  expect_error(colGroup(1, "col"))
  expect_error(colGroup("name", list("col")))
  expect_error(colGroup("name", 123))
  expect_error(colGroup("name", "col", align = "CENTER"))
})

test_that("is.colGroup", {
  expect_true(is.colGroup(colGroup("name", "col")))
  expect_false(is.colGroup(list()))
})

test_that("colFormat", {
  # Default args
  expect_equal(colFormat(), structure(list(), .Names = character(0), class = "colFormat"))

  # Valid args
  options <- colFormat(prefix = "a", suffix = "b", digits = 5, separators = TRUE,
                       percent = TRUE, currency = "INR", datetime = TRUE,
                       date = TRUE, time = TRUE, hour12 = FALSE,
                       locales = c("en-US", "zh-Hans-CN"))
  expect_equal(options, structure(list(
    prefix = "a", suffix = "b", digits = 5, separators = TRUE, percent = TRUE,
    currency = "INR", datetime = TRUE, date = TRUE, time = TRUE, hour12 = FALSE,
    locales = c("en-US", "zh-Hans-CN")
  ), class = "colFormat"))

  # Invalid args
  expect_error(colFormat(prefix = 1))
  expect_error(colFormat(suffix = 1))
  expect_error(colFormat(digits = -1))
  expect_error(colFormat(digits = 21))
  expect_error(colFormat(separators = "sad"))
  expect_error(colFormat(percent = "true"))
  expect_error(colFormat(currency = FALSE))
  expect_error(colFormat(datetime = "false"))
  expect_error(colFormat(date = "false"))
  expect_error(colFormat(time = "false"))
  expect_error(colFormat(hour12 = 24))
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
