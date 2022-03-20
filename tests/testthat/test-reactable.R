library(htmltools)

getAttribs <- function(widget) {
  widget$x$tag$attribs
}

getAttrib <- function(widget, name) {
  widget$x$tag$attribs[[name]]
}

test_that("reactable handles invalid args", {
  # NOTE: New arguments should be tested in their own separate test

  expect_error(reactable(1))
  df <- data.frame(x = 1)
  expect_error(reactable(df, columns = "x"))
  expect_error(reactable(df, columns = list(list())))
  expect_error(reactable(df, columns = list(colDef())))
  expect_error(reactable(df, columns = list(zzzz = colDef())))
  expect_error(reactable(df, columnGroups = "x"))
  expect_error(reactable(df, columnGroups = list(colDef())))
  expect_error(reactable(df, columnGroups = list(colGroup(name = "", columns = "y"))))
  expect_error(reactable(df, columnGroups = list(colGroup(name = ""))))
  expect_error(reactable(df, rownames = "true"))
  expect_error(reactable(df, groupBy = c("y", "z")))
  expect_error(reactable(df, groupBy = "x", columns = list(x = colDef(details = function(i) i))))
  expect_error(reactable(df, sortable = "true"))
  expect_error(reactable(df, resizable = "true"))
  expect_error(reactable(df, defaultColDef = list()))
  expect_error(reactable(df, defaultColGroup = list()))
  expect_error(reactable(df, defaultSortOrder = "ascending"))
  expect_error(reactable(df, defaultSorted = "y"))
  expect_error(reactable(df, defaultSorted = list("x")))
  expect_error(reactable(df, defaultSorted = list(x = "ascending")))
  expect_error(reactable(df, defaultSorted = list(y = "asc")))
  expect_error(reactable(df, showPageInfo = "true"))
  expect_error(reactable(df, minRows = "2"))
  expect_error(reactable(df, defaultExpanded = NULL))
  expect_error(reactable(df, defaultExpanded = 1:3))
  expect_error(reactable(df, selection = "none"))
  expect_error(reactable(df, selectionId = 123))
  expect_error(reactable(df, defaultSelected = "12"))
  expect_error(reactable(df, onClick = "function() {}"))
  expect_error(reactable(df, highlight = "true"))
  expect_error(reactable(df, outlined = "true"))
  expect_error(reactable(df, bordered = NULL))
  expect_error(reactable(df, borderless = NULL))
  expect_error(reactable(df, striped = "true"))
  expect_error(reactable(df, compact = "true"))
  expect_error(reactable(df, wrap = "true"))
  expect_error(reactable(df, showSortIcon = "true"))
  expect_error(reactable(df, showSortable = "true"))
  expect_error(reactable(df, class = c(1, 5)))
  expect_error(reactable(df, style = 555))
  expect_error(reactable(df, rowClass = 123))
  expect_error(reactable(df, rowStyle = 555))
  expect_error(reactable(df, fullWidth = "yes"))
  expect_error(reactable(df, width = "asd"))
  expect_error(reactable(df, height = "asd"))
})

test_that("reactable", {
  # NOTE: New arguments should be tested in their own separate test

  # Default args
  tbl <- reactable(data.frame(x = 1, y = "b", stringsAsFactors = TRUE))
  attribs <- getAttribs(tbl)
  data <- data.frame(x = 1, y = "b")
  data <- jsonlite::toJSON(data, dataframe = "columns", rownames = FALSE)
  columns <- list(
    list(accessor = "x", name = "x", type = "numeric"),
    list(accessor = "y", name = "y", type = "factor")
  )
  expected <- list(
    data = data,
    columns = columns,
    defaultPageSize = 10,
    paginationType = "numbers",
    showPageInfo = TRUE,
    minRows = 1,
    dataKey = digest::digest(list(data, columns))
  )
  expect_equal(attribs, expected)
  expect_equal(tbl$width, "auto")
  expect_equal(tbl$height, "auto")

  # Table options
  tbl <- reactable(data.frame(x = "a", stringsAsFactors = TRUE), rownames = TRUE,
                   columnGroups = list(colGroup("group", "x")),
                   sortable = FALSE, resizable = TRUE,
                   defaultSortOrder = "desc", defaultSorted = list(x = "asc"),
                   showPageInfo = FALSE, minRows = 5, defaultExpanded = TRUE,
                   selection = "single", selectionId = "sel", highlight = TRUE,
                   outlined = TRUE, bordered = TRUE, borderless = TRUE, striped = TRUE,
                   compact = TRUE, wrap = FALSE, showSortIcon = FALSE,
                   showSortable = TRUE, class = "tbl", style = list(color = "red"),
                   fullWidth = FALSE, groupBy = "x", width = "400px", height = "100%")
  attribs <- getAttribs(tbl)
  data <- data.frame(.rownames = 1, x = "a")
  data <- jsonlite::toJSON(data, dataframe = "columns", rownames = FALSE)
  columns <- list(
    list(accessor = ".selection", name = "", type = "NULL", resizable = FALSE,
         width = 45, selectable = TRUE),
    list(accessor = ".rownames", name = "", type = "numeric",
         sortable = FALSE, filterable = FALSE, rowHeader = TRUE),
    list(accessor = "x", name = "x", type = "factor")
  )
  expected <- list(
    data = data,
    columns = columns,
    columnGroups = list(colGroup("group", "x")),
    pivotBy = list("x"),
    sortable = FALSE,
    resizable = TRUE,
    defaultSortDesc = TRUE,
    defaultSorted = list(list(id = "x", desc = FALSE)),
    defaultPageSize = 10,
    paginationType = "numbers",
    showPageInfo = FALSE,
    minRows = 5,
    defaultExpanded = TRUE,
    selection = "single",
    selectionId = "sel",
    highlight = TRUE,
    outlined = TRUE,
    bordered = TRUE,
    borderless = TRUE,
    striped = TRUE,
    compact = TRUE,
    nowrap = TRUE,
    showSortIcon = FALSE,
    showSortable = TRUE,
    className = "tbl",
    style = list(color = "red"),
    inline = TRUE,
    width = "400px",
    height = "100%",
    dataKey = digest::digest(list(data, columns))
  )
  expect_equal(attribs, expected)
  expect_equal(tbl$width, "400px")
  expect_equal(tbl$height, "100%")
  expect_equal(tbl$sizingPolicy$knitr$figure, FALSE)

  # Column overrides
  tbl <- reactable(data.frame(x = 1, y = "2"), columns = list(
    x = colDef(sortable = FALSE),
    y = colDef(name = "Y")
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$sortable, FALSE)
  expect_equal(attribs$columns[[2]]$name, "Y")

  # Style
  tbl <- reactable(data.frame(x = 1), style = " border-bottom: 1px solid; top: 50px")
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

test_that("data should have at least one column", {
  expect_error(reactable(data.frame()), "`data` must have at least one column")

  # Data can have zero rows, as long as it has columns
  tbl <- reactable(data.frame(x = character(0), y = numeric(0)))
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{"x":[],"y":[]}')
  expect_length(attribs$columns, 2)
})

test_that("numbers are serialized with max precision", {
  data <- data.frame(x = 0.123456789012345)  # 16 digits
  tbl <- reactable(data)
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{"x":[0.123456789012345]}')
})

test_that("dates/datetimes are serialized in ISO 8601", {
  data <- data.frame(x = as.POSIXct("2019-05-06 3:22:15", tz = "UTC"), y = as.Date("2010-12-30"))
  tbl <- reactable(data)
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{"x":["2019-05-06T03:22:15Z"],"y":["2010-12-30"]}')
})

test_that("data with custom classes not supported by jsonlite are serialized", {
  data <- data.frame(
    difftime = as.Date("2021-06-11") - as.Date("2021-03-05"),
    custom = I(structure("custom", class = "unsupported_custom_class"))
  )
  tbl <- reactable(data)
  attribs <- getAttribs(tbl)
  serialized <- jsonlite::fromJSON(attribs$data)
  expect_equal(serialized$custom, "custom")
  # jsonlite may support difftime objects at some point, so don't throw an error
  if (serialized$difftime != 98) {
    warning(paste("Unexpected result from serializing difftime:", serialized$difftime))
  }
})

test_that("list-columns are serialized correctly", {
  data <- data.frame(
    x = I(list(
      # Length-1 vectors should be unboxed, except when wrapped in I()
      "x",
      I("x"),
      list("x"),
      list(1, 2, 3),
      c("a", "b"),
      list(x = TRUE),
      # Length-1 data frame columns should still be arrays
      data.frame(x = "y"),
      NA
    ))
  )
  tbl <- reactable(data)
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{"x":["x",["x"],["x"],[1,2,3],["a","b"],{"x":true},{"x":["y"]},null]}')
})

test_that("supports Crosstalk", {
  data <- crosstalk::SharedData$new(
    data.frame(x = c(1, 2), y = c("a", "b"), stringsAsFactors = FALSE),
    key = ~y,
    group = "group"
  )
  tbl <- reactable(data)
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{"x":[1,2],"y":["a","b"]}')
  expect_equal(attribs$crosstalkKey, list("a", "b"))
  expect_equal(attribs$crosstalkGroup, "group")

  # Keys with length 1 should be serialized as arrays
  data <- crosstalk::SharedData$new(data.frame(x = 1, y = "2"))
  tbl <- reactable(data)
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{"x":[1],"y":["2"]}')
  expect_equal(attribs$crosstalkKey, list("1"))
  expect_equal(attribs$crosstalkGroup, data$groupName())

  # Data with list-columns
  data <- crosstalk::SharedData$new(data.frame(x = I(list(list(1,2,3), list(x = 1)))), key = ~x)
  tbl <- reactable(data)
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{"x":[[1,2,3],{"x":1}]}')
  expect_equal(attribs$crosstalkKey, I(list(list(1,2,3), list(x = 1))))
  expect_equal(attribs$crosstalkGroup, data$groupName())
})

test_that("rownames", {
  # Integer row names
  tbl <- reactable(data.frame(x = c(1, 2, 3)), rownames = TRUE)
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{".rownames":[1,2,3],"x":[1,2,3]}')
  expect_equal(attribs$columns[[1]], list(
    accessor = ".rownames", name = "",  type = "numeric",
    sortable = FALSE, filterable = FALSE, rowHeader = TRUE
  ))

  # Character row names
  tbl <- reactable(data.frame(x = c(1, 2, 3), row.names = c("a", "b", "c")), rownames = TRUE)
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{".rownames":["a","b","c"],"x":[1,2,3]}')
  expect_equal(attribs$columns[[1]], list(
    accessor = ".rownames", name = "",  type = "character",
    sortable = FALSE, filterable = FALSE, rowHeader = TRUE
  ))

  # Custom rownames colDef
  tbl <- reactable(data.frame(x = c(1, 2)), rownames = TRUE, columns = list(
    .rownames = colDef(name = "N", sortable = TRUE, headerClass = "hdr")
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]], list(
    accessor = ".rownames", name = "N",  type = "numeric",
    sortable = TRUE, filterable = FALSE, headerClassName = "hdr", rowHeader = TRUE
  ))

  # Row names can be part of column groups
  tbl <- reactable(data.frame(x = c(1, 2)), rownames = TRUE, columnGroups = list(
    colGroup("group", c(".rownames", "x"))
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columnGroups[[1]]$columns, list(".rownames", "x"))

  # Can't use rownames column without rownames
  expect_error(reactable(data.frame(1), columns = list(.rownames = colDef())))
  expect_error(reactable(data.frame(1), columnGroups = list(colGroup("", ".rownames"))))

  # If row names present, should be shown by default
  tbl <- reactable(data.frame(x = c(1, 2, 3), row.names = c("a", "b", "c")))
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{".rownames":["a","b","c"],"x":[1,2,3]}')
  expect_equal(attribs$columns[[1]], list(
    accessor = ".rownames", name = "",  type = "character",
    sortable = FALSE, filterable = FALSE, rowHeader = TRUE
  ))
  # Handles matrices
  tbl <- reactable(matrix(c(1,2,3), dimnames = list(c(1, 2, 3), "x")))
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{".rownames":["1","2","3"],"x":[1,2,3]}')
  expect_equal(attribs$columns[[1]], list(
    accessor = ".rownames", name = "",  type = "character",
    sortable = FALSE, filterable = FALSE, rowHeader = TRUE
  ))

  # If no row names, should not be shown by default
  tbl <- reactable(data.frame(x = c(1, 2, 3)))
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{"x":[1,2,3]}')
  expect_equal(length(attribs$columns), 1)
})

test_that("filterable", {
  data <- data.frame(x = 1)

  tbl <- reactable(data)
  expect_equal(getAttrib(tbl, "filterable"), NULL)

  tbl <- reactable(data, filterable = TRUE)
  expect_equal(getAttrib(tbl, "filterable"), TRUE)

  tbl <- reactable(data, filterable = FALSE)
  expect_equal(getAttrib(tbl, "filterable"), NULL)

  expect_error(reactable(data, filterable = "true"), "`filterable` must be TRUE or FALSE")
})

test_that("searchable", {
  data <- data.frame(x = 1)

  tbl <- reactable(data)
  expect_equal(getAttrib(tbl, "searchable"), NULL)

  tbl <- reactable(data, searchable = TRUE)
  expect_equal(getAttrib(tbl, "searchable"), TRUE)

  tbl <- reactable(data, searchable = FALSE)
  expect_equal(getAttrib(tbl, "searchable"), NULL)

  expect_error(reactable(data, searchable = "true"), "`searchable` must be TRUE or FALSE")
})

test_that("searchMethod", {
  data <- data.frame(x = 1)

  tbl <- reactable(data)
  expect_equal(getAttrib(tbl, "searchMethod"), NULL)

  tbl <- reactable(data, searchMethod = JS("(rows, columnIds, filterValue) => rows"))
  expect_equal(getAttrib(tbl, "searchMethod"), JS("(rows, columnIds, filterValue) => rows"))

  expect_error(reactable(data, searchMethod = "rows => rows"), "`searchMethod` must be a JS function")
})

test_that("defaultColDef", {
  # Defaults applied
  tbl <- reactable(
    data.frame(x = 1, y = "2"),
    defaultColDef = colDef(
      sortNALast = TRUE,
      html = TRUE,
      width = 22,
      rowHeader = TRUE
    ),
    columns = list(y = colDef(
      class = "cls"
    ))
  )
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$sortNALast, TRUE)
  expect_equal(attribs$columns[[2]]$sortNALast, TRUE)
  expect_equal(attribs$columns[[1]]$html, TRUE)
  expect_equal(attribs$columns[[2]]$html, TRUE)
  expect_equal(attribs$columns[[1]]$width, 22)
  expect_equal(attribs$columns[[2]]$width, 22)
  expect_equal(attribs$columns[[1]]$rowHeader, TRUE)
  expect_equal(attribs$columns[[2]]$rowHeader, TRUE)
  expect_equal(attribs$columns[[2]]$class, "cls")

  # Defaults can be overridden
  tbl <- reactable(
    data.frame(x = 1, y = "2"),
    defaultColDef = colDef(
      show = FALSE,
      sortNALast = TRUE,
      html = TRUE,
      na = "na",
      width = 22,
      class = "default-cls",
      rowHeader = TRUE,
      vAlign = "center"
    ),
    columns = list(y = colDef(
      show = TRUE,
      sortNALast = FALSE,
      html = FALSE,
      na = "",
      width = 44,
      rowHeader = FALSE,
      vAlign = "top"
    ))
  )
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$show, FALSE)
  expect_equal(attribs$columns[[2]]$show, TRUE)
  expect_equal(attribs$columns[[1]]$sortNALast, TRUE)
  expect_equal(attribs$columns[[2]]$sortNALast, FALSE)
  expect_equal(attribs$columns[[1]]$html, TRUE)
  expect_equal(attribs$columns[[2]]$html, FALSE)
  expect_equal(attribs$columns[[1]]$na, "na")
  expect_equal(attribs$columns[[2]]$na, "")
  expect_equal(attribs$columns[[1]]$width, 22)
  expect_equal(attribs$columns[[2]]$width, 44)
  expect_equal(attribs$columns[[1]]$class, "default-cls")
  expect_equal(attribs$columns[[2]]$class, "default-cls")
  expect_equal(attribs$columns[[1]]$rowHeader, TRUE)
  expect_equal(attribs$columns[[2]]$rowHeader, FALSE)
  expect_equal(attribs$columns[[1]]$vAlign, "center")
  expect_equal(attribs$columns[[2]]$vAlign, "top")

  # Defaults should apply to row name column
  tbl <- reactable(data.frame(x = 1, y = "2"),
                   defaultColDef = colDef(name = "not-row-names", show = FALSE),
                   rownames = TRUE)
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$show, FALSE)
  expect_equal(attribs$columns[[2]]$show, FALSE)
  expect_equal(attribs$columns[[3]]$show, FALSE)
  # Defaults don't override row name column defaults
  expect_equal(attribs$columns[[1]]$name, "")
  expect_equal(attribs$columns[[2]]$name, "not-row-names")
  expect_equal(attribs$columns[[3]]$name, "not-row-names")
})

test_that("defaultColGroup", {
  # Defaults applied
  tbl <- reactable(
    data.frame(x = 1, y = "2"),
    defaultColGroup = colGroup(
      name = "group",
      columns = "x",
      align = "left",
      headerClass = "cls",
      headerStyle = list(color = "blue")
    ),
    columnGroups = list(
      colGroup(columns = "x"),
      colGroup(name = "y", columns = "y")
    )
  )
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columnGroups[[1]]$name, "group")
  expect_equal(attribs$columnGroups[[1]]$columns, list("x"))
  expect_equal(attribs$columnGroups[[1]]$align, "left")
  expect_equal(attribs$columnGroups[[1]]$headerClass, "cls")
  expect_equal(attribs$columnGroups[[1]]$headerStyle, list(color = "blue"))
  expect_equal(attribs$columnGroups[[2]]$name, "y")
  expect_equal(attribs$columnGroups[[2]]$columns, list("y"))
  expect_equal(attribs$columnGroups[[2]]$align, "left")
  expect_equal(attribs$columnGroups[[2]]$headerClass, "cls")
  expect_equal(attribs$columnGroups[[2]]$headerStyle, list(color = "blue"))

  # Defaults can be overrided
  tbl <- reactable(
    data.frame(x = 1, y = "2"),
    defaultColGroup = colGroup(
      align = "left",
      headerClass = "cls",
      headerStyle = list(color = "blue")
    ),
    columnGroups = list(colGroup(
      name = "xy",
      columns = c("x", "y"),
      align = "right",
      headerClass = "xy",
      headerStyle = list(color = "red")
    ))
  )
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columnGroups[[1]]$align, "right")
  expect_equal(attribs$columnGroups[[1]]$headerClass, "xy")
  expect_equal(attribs$columnGroups[[1]]$headerStyle, list(color = "red"))

  # defaultColGroup should still be valid without column groups
  tbl <- reactable(data.frame(x = 1, y = "2"), defaultColGroup = colGroup(headerClass = "cls"))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columnGroups, NULL)
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

  # Works with defaultColDef
  tbl <- reactable(data.frame(x = 1, y = "2"),
                   defaultSorted = "x",
                   defaultColDef = colDef(defaultSortOrder = "desc"))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$defaultSorted, list(list(id = "x", desc = TRUE)))
})

test_that("pagination", {
  data <- data.frame(x = 1)

  tbl <- reactable(data)
  expect_equal(getAttrib(tbl, "pagination"), NULL)

  tbl <- reactable(data, pagination = TRUE)
  expect_equal(getAttrib(tbl, "pagination"), NULL)

  tbl <- reactable(data, pagination = FALSE)
  expect_equal(getAttrib(tbl, "pagination"), FALSE)

  expect_error(reactable(data, pagination = "false"), "`pagination` must be TRUE or FALSE")
})

test_that("showPageSizeOptions and pageSizeOptions", {
  data <- data.frame(x = 1)

  tbl <- reactable(data.frame(x = 1))
  expect_equal(getAttrib(tbl, "showPageSizeOptions"), NULL)
  expect_equal(getAttrib(tbl, "pageSizeOptions"), NULL)

  # pageSizeOptions should be unset when page size options are hidden
  tbl <- reactable(data.frame(x = 1), pageSizeOptions = 5)
  expect_equal(getAttrib(tbl, "pageSizeOptions"), NULL)

  # pageSizeOptions should be serialized as an array
  tbl <- reactable(data, showPageSizeOptions = TRUE, pageSizeOptions = c(1, 3))
  expect_equal(getAttrib(tbl, "pageSizeOptions"), list(1, 3))
  tbl <- reactable(data, showPageSizeOptions = TRUE, pageSizeOptions = 5)
  expect_equal(getAttrib(tbl, "pageSizeOptions"), list(5))

  expect_error(reactable(data, showPageSizeOptions = "true"), "`showPageSizeOptions` must be TRUE or FALSE")
  expect_error(reactable(data, pageSizeOptions = "1"), "`pageSizeOptions` must be numeric")
})

test_that("paginationType", {
  data <- data.frame(x = 1)

  tbl <- reactable(data)
  expect_equal(getAttrib(tbl, "paginationType"), "numbers")

  for (type in c("numbers", "jump", "simple")) {
    tbl <- reactable(data, paginationType = type)
    expect_equal(getAttrib(tbl, "paginationType"), type)
  }

  expect_error(reactable(data, paginationType = "none"), '`paginationType` must be one of "numbers", "jump", "simple"')
})

test_that("defaultPageSize", {
  data <- data.frame(x = 1)

  tbl <- reactable(data)
  expect_equal(getAttrib(tbl, "defaultPageSize"), 10)

  tbl <- reactable(data, defaultPageSize = 1)
  expect_equal(getAttrib(tbl, "defaultPageSize"), 1)

  expect_error(reactable(data, defaultPageSize = "10"), "`defaultPageSize` must be numeric")
})

test_that("showPagination", {
  data <- data.frame(x = 1)

  tbl <- reactable(data)
  expect_equal(getAttrib(tbl, "showPagination"), NULL)

  tbl <- reactable(data, pagination = FALSE, showPagination = TRUE)
  expect_equal(getAttrib(tbl, "showPagination"), TRUE)

  tbl <- reactable(data, showPagination = FALSE)
  expect_equal(getAttrib(tbl, "showPagination"), FALSE)

  expect_error(reactable(data, showPagination = "false"), "`showPagination` must be TRUE or FALSE")
})

test_that("paginateSubRows", {
  data <- data.frame(x = 1)

  tbl <- reactable(data)
  expect_equal(getAttrib(tbl, "paginateSubRows"), NULL)

  tbl <- reactable(data, paginateSubRows = TRUE)
  expect_equal(getAttrib(tbl, "paginateSubRows"), TRUE)

  tbl <- reactable(data, paginateSubRows = FALSE)
  expect_equal(getAttrib(tbl, "paginateSubRows"), NULL)

  expect_error(reactable(data, paginateSubRows = "true"), "`paginateSubRows` must be TRUE or FALSE")
})

test_that("sub rows", {
  data <- data.frame(
    x = c(1, 2),
    .subRows = I(list(
      data.frame(x = c(3, 4)),
      NA
    ))
  )
  tbl <- reactable(data)
  columns <- getAttrib(tbl, "columns")
  expect_equal(length(columns), 1)
  expect_equal(columns[[1]]$accessor, "x")
})

test_that("column renderers", {
  data <- data.frame(
    x = c(1, 2),
    y = c("a", "b"),
    z = I(list(list(1,2,3), list(4,5,6)))
  )

  # Cell renderers
  tbl <- reactable(data, columns = list(
    x = colDef(cell = function(value) value + 1),
    y = colDef(cell = function(value, index, name) index),
    z = colDef(cell = function(values, index, name) paste(length(values), index, name))
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$cell, list("2", "3"))
  expect_equal(attribs$columns[[2]]$cell, list("1", "2"))
  expect_equal(attribs$columns[[3]]$cell, list("3 1 z", "3 2 z"))

  # POSIXlt objects should be handled correctly (mostly just on R <= 3.4)
  data$p <- c(as.POSIXlt("2019-01-01"), as.POSIXlt("2019-05-01"))
  tbl <- reactable(data, columns = list(
    p = colDef(cell = function(value) value)
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[4]]$cell, list("2019-01-01", "2019-05-01"))

  # Header renderers
  tbl <- reactable(data, columns = list(
    x = colDef(header = function(value) paste("header:", value)),
    y = colDef(header = function(value, name) paste("name:", name)),
    z = colDef(name = "ZZ", header = function(value) div(value))
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]][["header"]], "header: x")
  expect_equal(attribs$columns[[2]][["header"]], "name: y")
  expect_equal(attribs$columns[[3]][["header"]], div("ZZ"))

  tbl <- reactable(data, columns = list(
    x = colDef(header = div("header")),
    y = colDef(header = 123)
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]][["header"]], div("header"))
  expect_equal(attribs$columns[[2]][["header"]], "123")

  tbl <- reactable(data, columns = list(
    x = colDef(header = JS("colInfo => 'header'"), headerClass = "header"),
    y = colDef(headerClass = "no-header")
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]][["header"]], JS("colInfo => 'header'"))
  expect_equal(attribs$columns[[2]][["header"]], NULL)

  # Footer renderers
  tbl <- reactable(data, columns = list(
    x = colDef(footer = function(values) paste(values, collapse = " ")),
    y = colDef(footer = function(values, name) name),
    z = colDef(footer = function(values) paste(length(values), sum(unlist(values))))
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]][["footer"]], "1 2")
  expect_equal(attribs$columns[[2]][["footer"]], "y")
  expect_equal(attribs$columns[[3]][["footer"]], "2 21")

  tbl <- reactable(data, columns = list(
    x = colDef(footer = div("footer")),
    y = colDef(footer = 123)
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]][["footer"]], div("footer"))
  expect_equal(attribs$columns[[2]][["footer"]], "123")

  tbl <- reactable(data, columns = list(
    x = colDef(footer = JS("colInfo => 'footer'"), footerClass = "footer"),
    y = colDef(footerClass = "no-footer")
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]][["footer"]], JS("colInfo => 'footer'"))
  expect_equal(attribs$columns[[2]][["footer"]], NULL)

  # Group header renderers
  tbl <- reactable(data, columnGroups = list(
    colGroup(name = "x", header = div("group X"), columns = "x"),
    colGroup(name = "group Y", header = function(value) div("name:", value), columns = "y"),
    colGroup(name = "group Z", header = JS("colInfo => 'header'"), columns = "z")
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columnGroups[[1]][["header"]], div("group X"))
  expect_equal(attribs$columnGroups[[2]][["header"]], div("name:", "group Y"))
  expect_equal(attribs$columnGroups[[3]][["header"]], JS("colInfo => 'header'"))

  tbl <- reactable(data, columns = list(
    x = colDef(header = div("header")),
    y = colDef(header = 123)
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]][["header"]], div("header"))
  expect_equal(attribs$columns[[2]][["header"]], "123")

  tbl <- reactable(data, columns = list(
    x = colDef(header = JS("colInfo => 'header'"), headerClass = "header"),
    y = colDef(headerClass = "no-header")
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]][["header"]], JS("colInfo => 'header'"))
  expect_equal(attribs$columns[[2]][["header"]], NULL)
})

test_that("row details", {
  data <- data.frame(x = c(1, 2), y = c("a", "b"), stringsAsFactors = FALSE)

  # R renderer
  tbl <- reactable(data, details = function(i) if (i == 1) data[i, "y"])
  attribs <- getAttribs(tbl)
  expect_equal(
    attribs$columns[[1]],
    list(
      accessor = ".details", name = "", type = "NULL", sortable = FALSE,
      resizable = FALSE, filterable = FALSE, searchable = FALSE, width = 45,
      align = "center", details = list("a", NULL)
    )
  )

  tbl <- reactable(
    data,
    defaultColDef = colDef(details = function(i, name) paste(i, name))
  )
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$details, list("1 x", "2 x"))

  # JS renderer
  tbl <- reactable(data, details = JS("rowInfo => rowInfo.y"))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$details, JS("rowInfo => rowInfo.y"))

  # List
  tbl <- reactable(data, details = list("a", "b"))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$details, list("a", "b"))

  # Custom details column definition
  tbl <- reactable(data, details = colDef(details = function(i) data[i, "y"],
                                          width = 125, class = "my-details"))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$details, list("a", "b"))
  expect_equal(attribs$columns[[1]]$width, 125)
  expect_equal(attribs$columns[[1]]$className, "my-details")

  # Details column definition works with defaultColDef
  tbl <- reactable(
    data,
    defaultColDef = colDef(headerClass = "header", sortable = TRUE, filterable = TRUE),
    details = colDef(details = function(i) data[i, "y"], class = "my-details")
  )
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$details, list("a", "b"))
  expect_equal(attribs$columns[[1]]$className, "my-details")
  expect_equal(attribs$columns[[1]]$headerClass, "header")
  expect_equal(attribs$columns[[1]]$sortable, FALSE)
  expect_equal(attribs$columns[[1]]$filterable, FALSE)

  # Column row details
  tbl <- reactable(data, columns = list(y = colDef(details = function(i) data[i, "y"])))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[2]]$details, list("a", "b"))

  # Details column can be part of column groups
  tbl <- reactable(data.frame(x = c(1, 2)), details = function(i) i, columnGroups = list(
    colGroup("group", c(".details", "x"))
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columnGroups[[1]]$columns, list(".details", "x"))

  expect_error(reactable(data, details = "details"), "`details` renderer must be an R function or JS function")
})

test_that("custom filter inputs", {
  data <- data.frame(x = c(1, 2), y = c("a", "b"), z = c("c", "d"), stringsAsFactors = FALSE)

  tbl <- reactable(data, columns = list(
    x = colDef(filterInput = JS("(filterValue, setFilter, column) => filterInput")),
    y = colDef(filterInput = function(values, name) {
      htmltools::tags$input(type = "text", class = paste(c(values, name), collapse = "_"))
    }),
    z = colDef(filterInput = '<input type="text">', html = TRUE)
  ))

  columns <- getAttrib(tbl, "columns")
  expect_equal(columns[[1]]$filterInput, JS("(filterValue, setFilter, column) => filterInput"))
  expect_equal(columns[[2]]$filterInput, htmltools::tags$input(type = "text", className = "a_b_y"))
  expect_equal(columns[[3]]$filterInput, '<input type="text">')
})

test_that("html dependencies from rendered content are passed through", {
  dep <- htmlDependency("dep", "0.1.0", "/path/to/dep")
  dep2 <- htmlDependency("dep2", "0.5.0", "/path/to/dep2")

  # Cell renderers
  data <- data.frame(x = c(1, 2), y = c("a", "b"))
  tbl <- reactable(data, columns = list(
    x = colDef(cell = function(value) {
      attachDependencies(div(value), dep)
    }),
    y = colDef(cell = function(value, index) {
      attachDependencies(tagList(value), dep2)
    })
  ))
  expect_equal(tbl$dependencies, list(dep, dep2))

  # Header renderers
  tbl <- reactable(data, columns = list(
    x = colDef(header = function(value) {
      attachDependencies(div("x"), dep)
    }),
    y = colDef(header = attachDependencies(tagList(), dep2))
  ))
  expect_equal(tbl$dependencies, list(dep, dep2))

  # Footer renderers
  tbl <- reactable(data, columnGroups = list(
    colGroup(columns = "x", header = function(value) attachDependencies(div("x"), dep)),
    colGroup(columns = "y", header = attachDependencies(tagList(), dep2))
  ))
  expect_equal(tbl$dependencies, list(dep, dep2))

  # Group header renderers
  tbl <- reactable(data, columns = list(
    x = colDef(footer = function(values) {
      attachDependencies(div("x"), dep)
    }),
    y = colDef(footer = attachDependencies(tagList(), dep2))
  ))
  expect_equal(tbl$dependencies, list(dep, dep2))

  # Details column definition works with defaultColDef
  tbl <- reactable(
    data,
    details = colDef(details = function(i) {
      attachDependencies(div(i), dep2)
    }),
    columns = list(
      x = colDef(details = function(i) {
        attachDependencies(tagList(i), dep)
      })
    )
  )
  expect_equal(tbl$dependencies, list(dep2, dep))

  # No dependencies
  tbl <- reactable(data)
  expect_equal(tbl$dependencies, list())
})

test_that("row selection", {
  data <- data.frame(x = c(1, 2, 3))
  tbl <- reactable(data, selection = "single", selectionId = "selected")
  attribs <- getAttribs(tbl)
  expect_equal(attribs$selection, "single")
  expect_equal(attribs$selectionId, "selected")
  expect_equal(attribs$columns[[1]], list(
    accessor = ".selection", name = "", type = "NULL", resizable = FALSE,
    width = 45, selectable = TRUE
  ))

  tbl <- reactable(data, selection = "multiple", defaultSelected = c(1, 3, 2))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$selection, "multiple")
  expect_equal(attribs$defaultSelected, list(0, 2, 1))

  # defaultSelected should be serialized as an array
  tbl <- reactable(data, selection = "single", defaultSelected = 3)
  attribs <- getAttribs(tbl)
  expect_equal(attribs$defaultSelected, list(2))

  # Selection column should be customizable
  tbl <- reactable(data, selection = "single", columns = list(
    .selection = colDef(width = 100, class = "my-cls", resizable = TRUE)
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]], list(
    accessor = ".selection", name = "", type = "NULL", resizable = TRUE,
    width = 100, selectable = TRUE, className = "my-cls"
  ))

  # Selection column can be part of column groups
  tbl <- reactable(data.frame(x = c(1, 2)), selection = "multiple", columnGroups = list(
    colGroup("group", c(".selection", "x"))
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columnGroups[[1]]$columns, list(".selection", "x"))

  # Out of bounds errors
  expect_error(reactable(data, selection = "single", defaultSelected = c(0, 1)))
  expect_error(reactable(data, selection = "multiple", defaultSelected = c(2, 4)))
})

test_that("onClick", {
  data <- data.frame(x = c(1, 2), y = c("a", "b"))
  tbl <- reactable(data, onClick = "expand")
  attribs <- getAttribs(tbl)
  expect_equal(attribs$onClick, "expand")

  tbl <- reactable(data, onClick = "select")
  attribs <- getAttribs(tbl)
  expect_equal(attribs$onClick, "select")

  tbl <- reactable(data, onClick = JS("(rowInfo, column, state) => {}"))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$onClick, JS("(rowInfo, column, state) => {}"))
})

test_that("column class functions", {
  data <- data.frame(
    x = c("a", "b", "c"),
    y = c(2, 4, 6),
    z = I(list(list(1,2,3), list(4,5,6), list(0,0,0)))
  )

  # R functions
  tbl <- reactable(data, columns = list(
    x = colDef(class = function(value) if (value != "a") paste0(value, "-cls")),
    y = colDef(class = function(value, index, name) sprintf("%s-%s-%s", value, index, name)),
    z = colDef(class = function(values, index) sprintf("%s-%s", length(values), index))
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$className, list(NULL, "b-cls", "c-cls"))
  expect_equal(attribs$columns[[2]]$className, list("2-1-y", "4-2-y", "6-3-y"))
  expect_equal(attribs$columns[[3]]$className, list("3-1", "3-2", "3-3"))

  # POSIXlt objects should be handled
  data$p <- c(as.POSIXlt("2019-01-01"), as.POSIXlt("2019-05-01"), as.POSIXlt("2019-07-05"))
  tbl <- reactable(data, columns = list(
    p = colDef(class = function(value) value)
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[4]]$className,
               list(as.POSIXlt("2019-01-01"), as.POSIXlt("2019-05-01"), as.POSIXlt("2019-07-05")))

  # JS functions
  tbl <- reactable(data, columns = list(
    x = colDef(class = JS("rowInfo => 'cls'"))
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$className, JS("rowInfo => 'cls'"))
})

test_that("column style functions", {
  data <- data.frame(
    x = c("a", "b", "c"),
    y = c(2, 4, 6),
    z = I(list(list(1,2,3), list(4,5,6), list(0,0,0)))
  )

  # R functions
  tbl <- reactable(data, columns = list(
    x = colDef(style = function(value) if (value != "a") "background-color: red"),
    y = colDef(style = function(value, index, name) list(color = sprintf("%s-%s-%s", value, index, name))),
    z = colDef(style = function(values, index) list(content = sprintf("%s-%s", length(values), index)))
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$style,
               list(NULL, list("background-color" = "red"), list("background-color" = "red")))
  expect_equal(attribs$columns[[2]]$style,
               list(list(color = "2-1-y"), list(color = "4-2-y"), list(color = "6-3-y")))
  expect_equal(attribs$columns[[3]]$style,
               list(list(content = "3-1"), list(content = "3-2"), list(content = "3-3")))

  # POSIXlt objects should be handled
  data$p <- c(as.POSIXlt("2019-01-01"), as.POSIXlt("2019-05-01"), as.POSIXlt("2019-07-05"))
  tbl <- reactable(data, columns = list(
    p = colDef(style = function(value) value)
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[4]]$style,
               list(as.POSIXlt("2019-01-01"), as.POSIXlt("2019-05-01"), as.POSIXlt("2019-07-05")))

  # JS functions
  tbl <- reactable(data, columns = list(
    x = colDef(style = JS("rowInfo => ({ backgroundColor: 'red' })"))
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]]$style, JS("rowInfo => ({ backgroundColor: 'red' })"))
})

test_that("rowClass and rowStyle", {
  # rowClass
  tbl <- reactable(data.frame(x = 1), rowClass = "cls")
  attribs <- getAttribs(tbl)
  expect_equal(attribs$rowClassName, "cls")

  tbl <- reactable(data.frame(x = 1), rowClass = JS("(rowInfo, state) => 'cls'"))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$rowClassName, JS("(rowInfo, state) => 'cls'"))

  tbl <- reactable(data.frame(x = c("a", "b", "c")),
                   rowClass = function(index) paste0("row-", index))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$rowClassName, list("row-1", "row-2", "row-3"))

  # rowStyle
  tbl <- reactable(data.frame(x = 1), rowStyle = " border-bottom: 1px solid; top: 50px")
  attribs <- getAttribs(tbl)
  expect_equal(attribs$rowStyle, list("border-bottom" = "1px solid", top = "50px"))

  tbl <- reactable(data.frame(x = 1), rowStyle = list(color = "red"))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$rowStyle, list(color = "red"))

  tbl <- reactable(data.frame(x = 1), rowStyle = JS("(rowInfo, state) => ({ color: 'red' })"))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$rowStyle, JS("(rowInfo, state) => ({ color: 'red' })"))

  tbl <- reactable(
    data.frame(x = c("a", "b", "c")),
    rowStyle = function(index) {
      if (index == 1) "background-color: red;"
      else if (index == 2) list(color = "red")
    }
  )
  attribs <- getAttribs(tbl)
  expect_equal(attribs$rowStyle,
               list(list("background-color" = "red"), list(color = "red"), NULL))
})

test_that("theme", {
  data <- data.frame(x = 1)

  tbl <- reactable(data, theme = reactableTheme())
  attribs <- getAttribs(tbl)
  expect_equal(attribs$theme, NULL)

  theme <- reactableTheme(style = list(color = "red"), borderColor = "#555")
  tbl <- reactable(data, theme = theme)
  attribs <- getAttribs(tbl)
  expect_equal(attribs$theme, theme)

  # Theme function
  theme <- function() reactableTheme(cellPadding = 13)
  tbl <- reactable(data, theme = theme)
  attribs <- getAttribs(tbl)
  expect_equal(attribs$theme, theme())

  theme <- function() NULL
  tbl <- reactable(data, theme = theme)
  attribs <- getAttribs(tbl)
  expect_equal(attribs$theme, NULL)

  # Global theme option
  theme <- reactableTheme(style = list(color = "red"), borderColor = "#555")
  old <- options(reactable.theme = theme)
  on.exit(options(old))
  tbl <- reactable(data)
  attribs <- getAttribs(tbl)
  expect_equal(attribs$theme, theme)

  # Table theme should override global option
  theme <- reactableTheme(borderWidth = "3px")
  tbl <- reactable(data, theme = theme)
  attribs <- getAttribs(tbl)
  expect_equal(attribs$theme, theme)

  # Errors
  expect_error(reactable(data, theme = list()),
               "`theme` must be a reactable theme object")
})

test_that("language", {
  data <- data.frame(x = 1)

  tbl <- reactable(data, language = reactableLang())
  attribs <- getAttribs(tbl)
  expect_equal(attribs$language, NULL)

  language <- reactableLang(pageNext = "_Next", searchPlaceholder = "_Search", sortLabel = "_Sort {name}")
  tbl <- reactable(data, language = language)
  attribs <- getAttribs(tbl)
  expect_equal(attribs$language, language)

  # Global language option
  old <- options(reactable.language = language)
  on.exit(options(old))
  tbl <- reactable(data)
  attribs <- getAttribs(tbl)
  expect_equal(attribs$language, language)

  # Table language should override global option
  language <- reactableLang(selectAllRowsLabel = "_Select all rows")
  tbl <- reactable(data, language = language)
  attribs <- getAttribs(tbl)
  expect_equal(attribs$language, language)

  # Errors
  expect_error(reactable(data, language = list()),
               "`language` must be a reactable language options object")
})

test_that("elementId", {
  data <- data.frame(x = 1)

  tbl <- reactable(data)
  expect_equal(tbl$elementId, NULL)
  expect_equal(getAttribs(tbl)$elementId, NULL)

  tbl <- reactable(data, elementId = "my-tbl")
  expect_equal(tbl$elementId, "my-tbl")
  expect_equal(getAttribs(tbl)$elementId, "my-tbl")
})

test_that("columnSortDefs", {
  defaultSorted <- list(x = "asc", y = "desc")
  expected <- list(list(id = "x", desc = FALSE), list(id = "y", desc = TRUE))
  expect_equal(columnSortDefs(defaultSorted), expected)
})

test_that("reactableOutput", {
  output <- reactableOutput("mytbl")

  # HTML dependencies should be intact
  deps <- htmltools::htmlDependencies(output)
  expect_true(length(deps) > 0)

  # Output container should have data-reactable-output ID set
  expect_equal(output[[1]][[4]]$attribs[["data-reactable-output"]], "mytbl")
  expect_equal(output[[1]][[4]]$name, "div")
  expect_equal(output[[1]][[4]]$attribs$id, "mytbl")
})

test_that("reactable_html", {
  html <- reactable_html("id", "color: red", "class")
  expect_equal(html[[4]], htmltools::tags$div(id = "id", class = "class", style = "color: red"))

  # Text color should be set in R Notebooks
  old <- options(rstudio.notebook.executing = TRUE)
  on.exit(options(old))
  html <- reactable_html(NULL, "color: red", NULL)
  expect_equal(html[[4]], htmltools::tags$div(style = "color: #333;color: red"))
})
