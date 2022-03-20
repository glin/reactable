test_that("colDef", {
  # Default args
  expect_equal(colDef(), structure(list(), .Names = character(0), class = "colDef"))

  # Valid args
  col <- colDef(name = "col", aggregate = "sum",
                sortable = TRUE, resizable = TRUE,
                defaultSortOrder = "desc",
                format = list(cell = colFormat(), aggregated = colFormat()),
                cell = JS("cellInfo => cellInfo.value"), aggregated = JS("cellInfo => cellInfo.value"),
                footer = "footer", details = function(i) i,
                maxWidth = 250, width = 125,
                align = "right", class = "cell", style = list(color = "a"),
                headerClass = "hdr", headerStyle = list(height = 10),
                footerClass = "ftr", footerStyle = "color:blue")

  expected <- structure(list(
    name = "col", aggregate = "sum",
    sortable = TRUE, resizable = TRUE,
    defaultSortDesc = TRUE,
    format = list(cell = colFormat(), aggregated = colFormat()),
    cell = JS("cellInfo => cellInfo.value"), aggregated = JS("cellInfo => cellInfo.value"),
    footer = "footer", details = function(i) i,
    maxWidth = 250, width = 125,
    align = "right", className = "cell", style = list(color = "a"),
    headerClassName = "hdr", headerStyle = list(height = 10),
    footerClassName = "ftr", footerStyle = list(color = "blue")
  ), class = "colDef")
  expect_equal(col, expected)

  # Invalid args
  invalidArgs <- list(
    name = list(1, FALSE),
    aggregate = list(2, TRUE, function() {}, "fn", "SUM"),
    sortable = list(1, "TRUE"),
    resizable = list(1, "TRUE"),
    defaultSortOrder = list(1, TRUE, "ascending"),
    format = list(23, list(CELL = colFormat()), list(aggregated = list())),
    cell = list("function() {}"),
    aggregated = list(function() {}),
    maxWidth = list("1", FALSE),
    align = list("a", "RIGHT", 1),
    width = list("1", FALSE),
    class = list(1, list()),
    style = list(list("a"), 2),
    headerClass = list(1, list()),
    headerStyle = list(list("a"), 2),
    footerClass = list(1, list()),
    footerStyle = list(list("a"), 2)
  )
  for (arg in names(invalidArgs)) {
    for (val in invalidArgs[[arg]]) {
      expect_error(do.call(colDef, stats::setNames(list(val), arg)))
    }
  }
})

test_that("colDef aggregate function", {
  aggregators <- list(
    JS("function(values, rows) { return 1 }"),
    "mean", "sum", "max", "min", "median", "count", "unique", "frequency"
  )
  for (func in aggregators) {
    col <- colDef(aggregate = func)
    expect_equal(col$aggregate, func)
  }
})

test_that("colDef filterable", {
  expect_error(colDef(filterable = ""), "`filterable` must be TRUE or FALSE")
  expect_equal(colDef()$filterable, NULL)
  expect_equal(colDef(filterable = FALSE)$filterable, FALSE)
  expect_equal(colDef(filterable = TRUE)$filterable, TRUE)
})

test_that("colDef searchable", {
  expect_error(colDef(searchable = ""), "`searchable` must be TRUE or FALSE")
  expect_equal(colDef()$searchable, NULL)
  expect_equal(colDef(searchable = FALSE)$searchable, FALSE)
  expect_equal(colDef(searchable = TRUE)$searchable, TRUE)
})

test_that("colDef filterMethod", {
  expect_error(colDef(filterMethod = "rows => rows"), "`filterMethod` must be a JS function")
  expect_equal(colDef()$filterMethod, NULL)
  expect_equal(
    colDef(filterMethod = JS("(rows, columnId, filterValue) => rows"))$filterMethod,
    JS("(rows, columnId, filterValue) => rows")
  )
})

test_that("colDef show", {
  expect_error(colDef(show = ""), "`show` must be TRUE or FALSE")
  expect_equal(colDef()$show, NULL)
  expect_equal(colDef(show = FALSE)$show, FALSE)
  expect_equal(colDef(show = TRUE)$show, TRUE)
})

test_that("colDef sortNALast", {
  expect_error(colDef(sortNALast = 5), "`sortNALast` must be TRUE or FALSE")
  expect_equal(colDef()$sortNALast, NULL)
  expect_equal(colDef(sortNALast = FALSE)$sortNALast, FALSE)
  expect_equal(colDef(sortNALast = TRUE)$sortNALast, TRUE)
})

test_that("colDef format", {
  format <- colFormat()

  # Default cell format
  col <- colDef(format = format)
  expect_equal(col$format, list(cell = format, aggregated = format))

  # Separate cell and aggregated format/renderer
  col <- colDef(format = list(aggregated = format))
  expect_equal(col$format, list(aggregated = format))
  col <- colDef(format = list(cell = format))
  expect_equal(col$format, list(cell = format))
})

test_that("colDef renderers", {
  # Cell renderer
  col <- colDef(cell = JS("cellInfo => cellInfo.value"))
  expect_equal(col$cell, JS("cellInfo => cellInfo.value"))
  col <- colDef(cell = function(value, index) value)
  expect_equal(col$cell, function(value, index) value)

  # Grouped cell renderer
  col <- colDef(grouped = JS("cellInfo => cellInfo.value"))
  expect_equal(col$grouped, JS("cellInfo => cellInfo.value"))
  expect_error(colDef(grouped = function() {}), "`grouped` renderer must be a JS function")

  # Aggregated cell renderer
  col <- colDef(aggregated = JS("cellInfo => cellInfo.value"))
  expect_equal(col$aggregated, JS("cellInfo => cellInfo.value"))

  # Header renderer
  col <- colDef(header = "header")
  expect_equal(col$header, "header")
  col <- colDef(header = JS("colInfo => colInfo.column.name"))
  expect_equal(col$header, JS("colInfo => colInfo.column.name"))
  col <- colDef(header = function(value) value)
  expect_equal(col$header, function(value) value)

  # Footer renderer
  col <- colDef(footer = "footer")
  expect_equal(col$footer, "footer")
  col <- colDef(footer = JS("colInfo => colInfo.column.name"))
  expect_equal(col$footer, JS("colInfo => colInfo.column.name"))
  col <- colDef(footer = function(values, name) name)
  expect_equal(col$footer, function(values, name) name)

  # Details renderer
  col <- colDef(details = JS("rowInfo => rowInfo.row.value"))
  expect_equal(col$details, JS("rowInfo => rowInfo.row.value"))
  col <- colDef(details = function(i, name) i)
  expect_equal(col$details, function(i, name) i)
  col <- colDef(details = list(1, 2, 3))
  expect_equal(col$details, list(1, 2, 3))
  expect_error(colDef(details = "function() {}"), "`details` renderer must be an R function or JS function")
})

test_that("colDef html", {
  expect_error(colDef(html = 5), "`html` must be TRUE or FALSE")
  expect_equal(colDef()$html, NULL)
  expect_equal(colDef(html = FALSE)$html, FALSE)
  expect_equal(colDef(html = TRUE)$html, TRUE)
})

test_that("colDef na", {
  expect_error(colDef(na = TRUE), "`na` must be a character string")
  expect_equal(colDef()$na, NULL)
  expect_equal(colDef(na = "NA")$na, "NA")
})

test_that("colDef rowHeader", {
  expect_error(colDef(rowHeader = 5), "`rowHeader` must be TRUE or FALSE")
  expect_equal(colDef()$rowHeader, NULL)
  expect_equal(colDef(rowHeader = FALSE)$rowHeader, FALSE)
  expect_equal(colDef(rowHeader = TRUE)$rowHeader, TRUE)
})

test_that("colDef minWidth", {
  expect_error(colDef(minWidth = FALSE), "`minWidth` must be numeric")
  expect_equal(colDef()$minWidth, NULL)
  expect_equal(colDef(minWidth = 100)$minWidth, 100)
})

test_that("colDef vAlign", {
  expect_error(colDef(vAlign = TRUE), '`vAlign` must be one of "top", "center", "bottom"')
  expect_null(colDef()$vAlign)
  expect_equal(colDef(vAlign = "top")$vAlign, "top")
  expect_equal(colDef(vAlign = "center")$vAlign, "center")
  expect_equal(colDef(vAlign = "bottom")$vAlign, "bottom")
})

test_that("colDef headerVAlign", {
  expect_error(colDef(headerVAlign = TRUE), '`headerVAlign` must be one of "top", "center", "bottom"')
  expect_null(colDef()$headerVAlign)
  expect_equal(colDef(headerVAlign = "top")$headerVAlign, "top")
  expect_equal(colDef(headerVAlign = "center")$headerVAlign, "center")
  expect_equal(colDef(headerVAlign = "bottom")$headerVAlign, "bottom")
})

test_that("colDef sticky", {
  expect_error(colDef(sticky = TRUE), '`sticky` must be "left" or "right"')
  expect_equal(colDef()$sticky, NULL)
  expect_equal(colDef(sticky = "left")$sticky, "left")
  expect_equal(colDef(sticky = "right")$sticky, "right")
})

test_that("colDef class", {
  col <- colDef(class = "cell")
  expect_equal(col$className, "cell")

  col <- colDef(class = JS("rowInfo => 'cell'"))
  expect_equal(col$className, JS("rowInfo => 'cell'"))

  col <- colDef(class = function(value, index) "cell")
  expect_equal(col$className, function(value, index) "cell")
})

test_that("colDef style", {
  col <- colDef(style = " border-bottom: 1px solid; top: 50px",
                headerStyle = " border: 1px solid; top: 25px;;df",
                footerStyle = " border: 1px solid; top: 25px;;df")
  expect_equal(col$style, list("border-bottom" = "1px solid", top = "50px"))
  expect_equal(col$headerStyle, list("border" = "1px solid", top = "25px"))
  expect_equal(col$footerStyle, list("border" = "1px solid", top = "25px"))

  col <- colDef(style = JS("rowInfo => ({ backgroundColor: 'red' })"))
  expect_equal(col$style, JS("rowInfo => ({ backgroundColor: 'red' })"))

  col <- colDef(style = function(value, index) "background-color: red")
  expect_equal(col$style, function(value, index) "background-color: red")
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
  expect_equal(colGroup(), structure(list(), .Names = character(0), class = "colGroup"))

  # Valid args
  group <- colGroup(name = "name", columns = c("colA", "colB"), html = TRUE, align = "right",
                    headerStyle = list(color = "red"), headerClass = "cls")
  expect_equal(group, structure(list(
    name = "name",
    html = TRUE,
    align = "right",
    headerClassName = "cls",
    headerStyle = list(color = "red"),
    columns = list("colA", "colB")
  ), class = "colGroup"))

  # Header renderer
  group <- colGroup(header = "header")
  expect_equal(group$header, "header")
  group <- colGroup(header = JS("colInfo => colInfo.column.name"))
  expect_equal(group$header, JS("colInfo => colInfo.column.name"))
  group <- colGroup(header = function(value) value)
  expect_equal(group$header, function(value) value)

  # html
  expect_error(colGroup(html = 5), "`html` must be TRUE or FALSE")
  expect_equal(colGroup()$html, NULL)
  expect_equal(colGroup(html = FALSE)$html, FALSE)
  expect_equal(colGroup(html = TRUE)$html, TRUE)

  # headerVAlign
  expect_error(colGroup(headerVAlign = TRUE), '`headerVAlign` must be one of "top", "center", "bottom"')
  expect_null(colGroup()$headerVAlign)
  expect_equal(colGroup(headerVAlign = "top")$headerVAlign, "top")
  expect_equal(colGroup(headerVAlign = "center")$headerVAlign, "center")
  expect_equal(colGroup(headerVAlign = "bottom")$headerVAlign, "bottom")

  # sticky
  expect_error(colGroup(sticky = TRUE), '`sticky` must be "left" or "right"')
  group <- colGroup(sticky = "left")
  expect_equal(group$sticky, "left")
  group <- colDef(sticky = "right")
  expect_equal(group$sticky, "right")

  # headerStyle
  group <- colGroup("grp", "col", headerStyle = " border: 1px solid; top: 25px;;df")
  expect_equal(group$headerStyle, list("border" = "1px solid", top = "25px"))

  # Invalid args
  expect_error(colGroup(name = 1, columns = "col"))
  expect_error(colGroup(name = "name", columns = list("col")))
  expect_error(colGroup(name = "name", columns = 123))
  expect_error(colGroup(name = "name", columns = "col", align = "CENTER"))
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
  expect_error(colFormat(digits = 19))
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
