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
  expect_error(reactable(df, defaultColDef))
  expect_error(reactable(df, defaultSortOrder = "ascending"))
  expect_error(reactable(df, defaultSorted = "y"))
  expect_error(reactable(df, defaultSorted = list("x")))
  expect_error(reactable(df, defaultSorted = list(x = "ascending")))
  expect_error(reactable(df, defaultSorted = list(y = "asc")))
  expect_error(reactable(df, defaultPageSize = "100"))
  expect_error(reactable(df, pageSizeOptions = c("a", "100")))
  expect_error(reactable(df, showPagination = "true"))
  expect_error(reactable(df, minRows = "2"))
  expect_error(reactable(df, selection = "none"))
  expect_error(reactable(df, selectionId = 123))
  expect_error(reactable(df, details = list()))
  expect_error(reactable(df, outlined = "true"))
  expect_error(reactable(df, bordered = NULL))
  expect_error(reactable(df, striped = "true"))
  expect_error(reactable(df, highlight = "true"))
  expect_error(reactable(df, showSortable = "true"))
  expect_error(reactable(df, class = c(1, 5)))
  expect_error(reactable(df, style = 555))
  expect_error(reactable(df, inline = "yes"))
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
    striped = FALSE,
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
                   minRows = 5, selection = "single", selectionId = "sel",
                   details = rowDetails(function(i) i),
                   outlined = TRUE, bordered = FALSE, striped = TRUE,
                   highlight = FALSE, showSortable = TRUE, class = "tbl",
                   style = list(color = "red"),
                   inline = TRUE, groupBy = "x", width = "400px", height = "100%",
                   elementId = "tbl")
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
    selection = "single",
    selectionId = "sel",
    details = structure(list(render = list("1")), class = "rowDetails"),
    outlined = TRUE,
    bordered = FALSE,
    striped = TRUE,
    highlight = FALSE,
    showSortable = TRUE,
    className = "tbl",
    style = list(color = "red"),
    inline = TRUE
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

  # Style
  tbl <- reactable(data.frame(), style = " border-bottom: 1px solid; top: 50px")
  attribs <- getAttribs(tbl)
  expect_equal(attribs$style, list("border-bottom" = "1px solid", top = "50px"))
})

test_that("data can be a matrix", {
  data <- matrix(c(1, 2, 3, 4), nrow = 2)
  tbl <- reactable(data)
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{"V1":[1,2],"V2":[3,4]}')
  expect_length(attribs$columns, 2)

  data <- matrix(c("a", "b", "c", "d"), nrow = 2, dimnames = list(NULL, c("x", "y")))
  tbl <- reactable(data)
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{"x":["a","b"],"y":["c","d"]}')
  expect_length(attribs$columns, 2)
})

test_that("defaultColDef", {
  # Defaults applied
  tbl <- reactable(data.frame(x = 1, y = "2"),
                   defaultColDef = colDef(width = 22),
                   columns = list(y = colDef(class = "cls")))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$width, 22)
  expect_equal(attribs$columns[[2]]$width, 22)
  expect_equal(attribs$columns[[2]]$class, "cls")

  # Defaults can be overrided
  tbl <- reactable(data.frame(x = 1, y = "2"),
                   defaultColDef = colDef(width = 22, class = "default-cls"),
                   columns = list(y = colDef(width = 44)))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$width, 22)
  expect_equal(attribs$columns[[2]]$width, 44)
  expect_equal(attribs$columns[[2]]$class, "default-cls")

  # Defaults apply to row name column
  tbl <- reactable(data.frame(x = 1, y = "2"),
                   defaultColDef = colDef(show = FALSE),
                   rownames = TRUE)
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$show, FALSE)
  expect_equal(attribs$columns[[2]]$show, FALSE)
  expect_equal(attribs$columns[[3]]$show, FALSE)
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

test_that("column renderers", {
  # Cell renderers
  data <- data.frame(x = c(1, 2), y = c("a", "b"))
  tbl <- reactable(data, columns = list(
    x = colDef(cell = function(value) value + 1),
    y = colDef(cell = function(value, index) index)
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$cell, list("2", "3"))
  expect_equal(attribs$columns[[2]]$cell, list("1", "2"))

  # Footer renderers
  data <- data.frame(x = c(1, 2), y = c("a", "b"))
  tbl <- reactable(data, columns = list(
    x = colDef(footer = function(values) paste(values, collapse = " ")),
    y = colDef(footer = function(values, name) name)
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$footer, "1 2")
  expect_equal(attribs$columns[[2]]$footer, "y")

  tbl <- reactable(data, columns = list(
    x = colDef(footer = htmltools::div("footer")),
    y = colDef(footer = 123)
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$footer, htmltools::div("footer"))
  expect_equal(attribs$columns[[2]]$footer, "123")
})

test_that("row details", {
  data <- data.frame(x = c(1, 2), y = c("a", "b"), stringsAsFactors = FALSE)

  # R renderer
  tbl <- reactable(data, details = function(i) data[i, "y"])
  attribs <- getAttribs(tbl)
  expect_equal(attribs$details, rowDetails(list("a", "b")))

  # JS renderer
  tbl <- reactable(data, details = JS("rowInfo => rowInfo.y"))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$details, rowDetails(JS("rowInfo => rowInfo.y")))

  # Row details definition
  tbl <- reactable(data, details = rowDetails(function(i) data[i, "y"]))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$details, rowDetails(list("a", "b")))
})

test_that("rowDetails definitions", {
  # Default args
  details <- rowDetails(JS("row => row.value"))
  expected <- structure(list(render = JS("row => row.value")), class = "rowDetails")
  expect_equal(details, expected)

  # rowDetails options
  details <- rowDetails(function(i) i, html = TRUE, name = "more", width = 50)
  expected <- structure(list(render = function(i) i, html = TRUE, name = "more", width = 50),
                        class = "rowDetails")
  expect_equal(details, expected)

  details <- rowDetails(function() "x")
  expected <- structure(list(render = function() "x"), class = "rowDetails")
  expect_equal(details, expected)

  details <- rowDetails(list(1, 2, 3), html = FALSE)
  expected <- structure(list(render = list(1, 2, 3)), class = "rowDetails")
  expect_equal(details, expected)

  # Invalid args
  expect_error(rowDetails("content"))
  expect_error(rowDetails(function(i) {}, html = 0))
  expect_error(rowDetails(function(i) {}, name = 0))
  expect_error(rowDetails(function(i) {}, width = ""))
})

test_that("is.rowDetails", {
  expect_true(is.rowDetails(rowDetails(function(i) {})))
  expect_false(is.rowDetails(list()))
})

test_that("columnSortDefs", {
  defaultSorted <- list(x = "asc", y = "desc")
  expected <- list(list(id = "x", desc = FALSE), list(id = "y", desc = TRUE))
  expect_equal(columnSortDefs(defaultSorted), expected)
})
