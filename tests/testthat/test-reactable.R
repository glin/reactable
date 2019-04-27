context("reactable")

getAttribs <- function(widget) widget$x$tag$attribs

test_that("reactable handles invalid args", {
  expect_error(reactable(1))
  df <- data.frame(x = 1)
  expect_error(reactable(df, rownames = "true"))
  expect_error(reactable(df, colnames = list("name")))
  expect_error(reactable(df, colnames = list(y = "asd")))
  expect_error(reactable(df, columns = "x"))
  expect_error(reactable(df, columns = list(list())))
  expect_error(reactable(df, columns = list(colDef())))
  expect_error(reactable(df, columns = list(zzzz = colDef())))
  expect_error(reactable(df, columnGroups = "x"))
  expect_error(reactable(df, columnGroups = list(colDef())))
  expect_error(reactable(df, columnGroups = list(colGroup("", "y"))))
  expect_error(reactable(df, groupBy = c("y", "z")))
  expect_error(reactable(df, sortable = "true"))
  expect_error(reactable(df, resizable = "true"))
  expect_error(reactable(df, filterable = "true"))
  expect_error(reactable(df, defaultSortOrder = "ascending"))
  expect_error(reactable(df, defaultSorted = "y"))
  expect_error(reactable(df, defaultSorted = list("x")))
  expect_error(reactable(df, defaultSorted = list(x = "ascending")))
  expect_error(reactable(df, defaultSorted = list(y = "asc")))
  expect_error(reactable(df, defaultPageSize = "100"))
  expect_error(reactable(df, pageSizeOptions = c("a", "100")))
  expect_error(reactable(df, showPagination = "true"))
  expect_error(reactable(df, minRows = "2"))
  expect_error(reactable(df, outlined = "true"))
  expect_error(reactable(df, bordered = NULL))
  expect_error(reactable(df, striped = "true"))
  expect_error(reactable(df, highlight = "true"))
  expect_error(reactable(df, class = c(1, 5)))
  expect_error(reactable(df, style = "color: red;"))
})

test_that("reactable", {
  # Default args
  tbl <- reactable(data.frame(x = 1, y = "b"))
  attribs <- getAttribs(tbl)
  data <- data.frame(x = 1, y = "b")
  expected <- list(
    data = jsonlite::toJSON(data, dataframe = "columns", rownames = FALSE),
    columns = list(
      list(accessor = "x", Header = "x", type = "numeric"),
      list(accessor = "y", Header = "y", type = "factor")
    ),
    sortable = TRUE,
    resizable = TRUE,
    filterable = FALSE,
    defaultSortDesc = FALSE,
    defaultPageSize = 10,
    pageSizeOptions = c(10, 25, 50, 100),
    showPagination = FALSE,
    minRows = 1,
    outlined = FALSE,
    bordered = TRUE,
    striped = TRUE,
    highlight = TRUE
  )
  expect_equal(attribs, expected)
  expect_equal(tbl$width, "auto")
  expect_equal(tbl$height, "auto")
  expect_null(tbl$elementId)

  # Table options
  tbl <- reactable(data.frame(x = "a"), rownames = TRUE,
                   columnGroups = list(colGroup("group", "x")),
                   sortable = FALSE, resizable = FALSE, filterable = TRUE,
                   defaultSortOrder = "desc", defaultSorted = list(x = "asc"),
                   defaultPageSize = 1, pageSizeOptions = c(1, 2), showPagination = FALSE,
                   minRows = 5, outlined = TRUE, bordered = FALSE, striped = FALSE,
                   highlight = FALSE, class = "tbl", style = list(color = "red"),
                   groupBy = "x", width = "400px", height = "100%", elementId = "tbl")
  attribs <- getAttribs(tbl)
  data <- data.frame(x = "a")
  data[["__rowname__"]] <- "1"
  expected <- list(
    data = jsonlite::toJSON(data, dataframe = "columns", rownames = FALSE),
    columns = list(
      list(accessor = "__rowname__", sortable = FALSE, filterable = FALSE),
      list(accessor = "x", Header = "x", type = "factor")
    ),
    columnGroups = list(colGroup("group", "x")),
    pivotBy = list("x"),
    sortable = FALSE,
    resizable = FALSE,
    filterable = TRUE,
    defaultSortDesc = TRUE,
    defaultSorted = list(list(id = "x", desc = FALSE)),
    defaultPageSize = 1,
    pageSizeOptions = c(1, 2),
    showPagination = FALSE,
    minRows = 5,
    outlined = TRUE,
    bordered = FALSE,
    striped = FALSE,
    highlight = FALSE,
    className = "tbl",
    style = list(color = "red")
  )
  expect_equal(attribs, expected)
  expect_equal(tbl$width, "400px")
  expect_equal(tbl$height, "100%")
  expect_equal(tbl$elementId, "tbl")

  # Column names
  tbl <- reactable(data.frame(x = 1, y = "2"), colnames = list(x = "X", y = "Y"))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$Header, "X")
  expect_equal(attribs$columns[[2]]$Header, "Y")

  # Column overrides
  tbl <- reactable(data.frame(x = 1, y = "2"), columns = list(
    x = colDef(sortable = FALSE),
    y = colDef(name = "Y")
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$sortable, FALSE)
  expect_equal(attribs$columns[[2]]$Header, "Y")
})

test_that("defaultSorted", {
  # Column overrides
  tbl <- reactable(data.frame(x = 1, y = "2"),
                   defaultSorted = c("x", "y"),
                   columns = list(y = colDef(defaultSortOrder = "desc")))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$defaultSorted, list(
    list(id = "x", desc = FALSE),
    list(id = "y", desc = TRUE)
  ))

  # Global defaults w/ column overrides
  tbl <- reactable(data.frame(x = 1, y = "2"),
                   defaultSorted = c("x", "y"),
                   defaultSortOrder = "desc",
                   columns = list(y = colDef(defaultSortOrder = "asc")))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$defaultSorted, list(
    list(id = "x", desc = TRUE),
    list(id = "y", desc = FALSE)
  ))

  # Explicit sort orders aren't overridden
  tbl <- reactable(data.frame(x = 1, y = "2"),
                   defaultSorted = list(x = "asc", y = "desc"),
                   defaultSortOrder = "desc",
                   columns = list(y = colDef(defaultSortOrder = "asc")))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$defaultSorted, list(
    list(id = "x", desc = FALSE),
    list(id = "y", desc = TRUE)
  ))
})

test_that("showPagination defaults", {
  # Table that fits
  tbl <- reactable(data.frame(x = rep(0, 10)),
                   defaultPageSize = 10,
                   pageSizeOptions = c(10, 20))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$showPagination, FALSE)

  # Table that doesn't fit (defaultPageSize)
  tbl <- reactable(data.frame(x = rep(0, 10)),
                   defaultPageSize = 9,
                   pageSizeOptions = c(10, 20))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$showPagination, TRUE)

  # Table that doesn't fit (pageSizeOptions)
  tbl <- reactable(data.frame(x = rep(0, 10)),
                   defaultPageSize = 10,
                   pageSizeOptions = c(10, 20, 9))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$showPagination, TRUE)
})

test_that("columnSortDefs", {
  defaultSorted <- list(x = "asc", y = "desc")
  expected <- list(list(id = "x", desc = FALSE), list(id = "y", desc = TRUE))
  expect_equal(columnSortDefs(defaultSorted), expected)
})
