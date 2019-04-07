context("columns")

test_that("colDef", {
  # Default args
  expect_equal(colDef(), structure(list(
    Header = NULL, aggregate = NULL, Aggregated = NULL,
    sortable = NULL, resizable = NULL, filterable = NULL,
    show = TRUE, defaultSortDesc = NULL, className = NULL, style = NULL,
    headerClassName = NULL, headerStyle = NULL), class = "colDef"))

  # Valid args
  col <- colDef(name = "col", aggregate = "sum",
                aggregated = JS("function(row) { return row.value }"),
                sortable = TRUE, resizable = TRUE, filterable = TRUE,
                show = TRUE, defaultSortOrder = "desc", class = "cell",
                style = list(color = "a"), headerClass = "hdr",
                headerStyle = list(height = 10))
  expected <- structure(list(
    Header = "col", aggregate = "sum",
    Aggregated = JS("function(row) { return row.value }"),
    sortable = TRUE, resizable = TRUE, filterable = TRUE,
    show = TRUE, defaultSortDesc = TRUE, className = "cell",
    style = list(color = "a"), headerClassName = "hdr",
    headerStyle = list(height = 10)), class = "colDef")
  expect_equal(col, expected)

  # Invalid args
  invalidArgs <- list(
    name = list(1, FALSE),
    aggregate = list(2, TRUE, function() {}),
    aggregated = list(1, "row => row.value", TRUE, function(row) row$value),
    sortable = list(1, "TRUE"),
    resizable = list(1, "TRUE"),
    filterable = list(0, "FALSE"),
    show = list(0, "TRUE"),
    defaultSortOrder = list(1, TRUE, "ascending"),
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

test_that("sort order", {
  expect_true(isSortOrder("asc"))
  expect_true(isSortOrder("desc"))
  expect_false(isSortOrder(FALSE))
  expect_false(isSortOrder(list("asc")))
  expect_true(isDescOrder("desc"))
  expect_false(isDescOrder("asc"))
})
