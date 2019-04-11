context("columns")

test_that("colDef", {
  # Default args
  expect_equal(colDef(), structure(list(
    Header = NULL, aggregate = NULL,
    sortable = NULL, resizable = NULL, filterable = NULL,
    show = NULL, defaultSortDesc = NULL, render = NULL, renderAggregated = NULL,
    minWidth = NULL, maxWidth = NULL, width = NULL,
    className = NULL, style = NULL, headerClassName = NULL,
    headerStyle = NULL), class = "colDef"))

  # Valid args
  col <- colDef(name = "col", aggregate = "sum",
                sortable = TRUE, resizable = TRUE, filterable = TRUE,
                show = FALSE, defaultSortOrder = "desc",
                minWidth = 100, maxWidth = 250, width = 125,
                render = JS("row => row.value"),
                renderAggregated = JS("function(row) { return row.value }"),
                class = "cell", style = list(color = "a"), headerClass = "hdr",
                headerStyle = list(height = 10))
  expected <- structure(list(
    Header = "col", aggregate = "sum",
    sortable = TRUE, resizable = TRUE, filterable = TRUE,
    show = FALSE, defaultSortDesc = TRUE, render = JS("row => row.value"),
    renderAggregated = JS("function(row) { return row.value }"),
    minWidth = 100, maxWidth = 250, width = 125,
    className = "cell", style = list(color = "a"), headerClassName = "hdr",
    headerStyle = list(height = 10)), class = "colDef")
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
    render = list("function() {}", function() {}, 5),
    renderAggregated = list(1, "row => row.value", TRUE, function(row) row$value),
    minWidth = list("1", FALSE),
    maxWidth = list("1", FALSE),
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

test_that("is.colDef", {
  expect_true(is.colDef(colDef()))
  expect_false(is.colDef(list()))
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

test_that("sort order", {
  expect_true(isSortOrder("asc"))
  expect_true(isSortOrder("desc"))
  expect_false(isSortOrder(FALSE))
  expect_false(isSortOrder(list("asc")))
  expect_true(isDescOrder("desc"))
  expect_false(isDescOrder("asc"))
})