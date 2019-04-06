context("reactable")

test_that("reactable handles invalid args", {
  expect_error(reactable(1))
  df <- data.frame(x = 1)
  expect_error(reactable(df, rownames = "true"))
  expect_error(reactable(df, colnames = list("name")))
  expect_error(reactable(df, sortable = "true"))
  expect_error(reactable(df, resizable = "true"))
  expect_error(reactable(df, filterable = "true"))
  expect_error(reactable(df, defaultPageSize = "100"))
  expect_error(reactable(df, pageSizeOptions = c("a", "100")))
  expect_error(reactable(df, minRows = "2"))
  expect_error(reactable(df, striped = "true"))
  expect_error(reactable(df, highlight = "true"))
  expect_error(reactable(df, pivotBy = c("y", "z")))
  expect_error(reactable(df, columns = "x"))
  expect_error(reactable(df, columns = list(list())))
  expect_error(reactable(df, columns = list(colDef())))
  expect_error(reactable(df, columns = list(zzzz = colDef())))
})

test_that("reactable", {
  getAttribs <- function(widget) widget$x$tag$attribs

  # Default args
  tbl <- reactable(data.frame(x = 1, y = "b"))
  expect_equal(tbl$width, "auto")
  expect_equal(tbl$height, "auto")

  attribs <- getAttribs(tbl)
  data <- data.frame(x = 1, y = "b")
  data[["__rowname__"]] <- "1"
  expected <- list(
    data = jsonlite::toJSON(data, dataframe = "columns", rownames = FALSE),
    columns = list(list(accessor = "__rowname__", sortable = FALSE, filterable = FALSE),
                   list(accessor = "x", Header = "x", style = list(textAlign = "right")),
                   list(accessor = "y", Header = "y")),
    sortable = TRUE,
    resizable = TRUE,
    filterable = FALSE,
    defaultPageSize = 10,
    pageSizeOptions = c(10, 25, 50, 100),
    minRows = 1,
    striped = TRUE,
    highlight = TRUE
  )
  expect_equal(attribs, expected)

  # Table options
  tbl <- reactable(data.frame(x = "a"), rownames = FALSE,
                   sortable = FALSE, resizable = FALSE, filterable = TRUE,
                   defaultPageSize = 1, pageSizeOptions = c(1, 2),
                   minRows = 5, striped = FALSE, highlight = FALSE,
                   pivotBy = "x", width = "400px", height = "100%", elementId = "tbl")
  attribs <- getAttribs(tbl)
  expect_equal(attribs$pivotBy, list("x"))
  expect_equal(attribs$sortable, FALSE)
  expect_equal(attribs$resizable, FALSE)
  expect_equal(attribs$filterable, TRUE)
  expect_equal(attribs$defaultPageSize, 1)
  expect_equal(attribs$pageSizeOptions, c(1, 2))
  expect_equal(attribs$minRows, 5)
  expect_equal(attribs$striped, FALSE)
  expect_equal(attribs$highlight, FALSE)

  # No rownames
  tbl <- reactable(data.frame(x = 1), rownames = FALSE)
  attribs <- getAttribs(tbl)
  expectedData <- jsonlite::toJSON(data.frame(x = 1), dataframe = "columns", rownames = FALSE)
  expect_equal(attribs$data, expectedData)

  # Column names
  tbl <- reactable(data.frame(x = 1, y = "2"), colnames = list(x = "X", y = "Y"))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[2]]$Header, "X")
  expect_equal(attribs$columns[[3]]$Header, "Y")

  # Column overrides
  tbl <- reactable(data.frame(x = 1, y = "2"), rownames = FALSE,
                   columns = list(x = colDef(sortable = FALSE), y = colDef(name = "Y")))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$sortable, FALSE)
  expect_equal(attribs$columns[[2]]$Header, "Y")
})
