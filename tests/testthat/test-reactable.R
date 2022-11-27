library(htmltools)

test_that("reactable handles invalid args", {
  # NOTE: New arguments should be tested in their own separate test

  df <- data.frame(x = 1)
  expect_error(reactable(df, sortable = "true"))
  expect_error(reactable(df, resizable = "true"))
  expect_error(reactable(df, defaultSortOrder = "ascending"))
  expect_error(reactable(df, defaultSorted = "y"))
  expect_error(reactable(df, defaultSorted = list("x")))
  expect_error(reactable(df, defaultSorted = list(x = "ascending")))
  expect_error(reactable(df, defaultSorted = list(y = "asc")))
  expect_error(reactable(df, defaultExpanded = NULL))
  expect_error(reactable(df, defaultExpanded = 1:3))
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
})

test_that("reactable", {
  # NOTE: New arguments should be tested in their own separate test

  expect_error(reactable(1), "`data` must be a data frame or matrix")

  # Default args
  tbl <- reactable(data.frame(x = 1, y = "b", stringsAsFactors = TRUE))
  attribs <- getAttribs(tbl)
  data <- data.frame(x = 1, y = "b")
  data <- jsonlite::toJSON(data, dataframe = "columns", rownames = FALSE)
  columns <- list(
    list(id = "x", name = "x", type = "numeric"),
    list(id = "y", name = "y", type = "factor")
  )
  expected <- list(
    data = data,
    columns = columns,
    dataKey = digest::digest(list(data, columns)),
    static = FALSE
  )
  expect_equal(attribs, expected)

  # Table options
  tbl <- reactable(data.frame(x = "a", stringsAsFactors = TRUE), rownames = TRUE,
                   sortable = FALSE, resizable = TRUE,
                   defaultSortOrder = "desc", defaultSorted = list(x = "asc"),
                   defaultExpanded = TRUE, highlight = TRUE,
                   outlined = TRUE, bordered = TRUE, borderless = TRUE, striped = TRUE,
                   compact = TRUE, wrap = FALSE, showSortIcon = FALSE,
                   showSortable = TRUE, class = "tbl", style = list(color = "red"),
                   fullWidth = FALSE)
  attribs <- getAttribs(tbl)
  data <- data.frame(.rownames = 1, x = "a")
  data <- jsonlite::toJSON(data, dataframe = "columns", rownames = FALSE)
  columns <- list(
    list(id = ".rownames", name = "", type = "numeric",
         sortable = FALSE, filterable = FALSE, rowHeader = TRUE),
    list(id = "x", name = "x", type = "factor")
  )
  expected <- list(
    data = data,
    columns = columns,
    sortable = FALSE,
    resizable = TRUE,
    defaultSortDesc = TRUE,
    defaultSorted = list(list(id = "x", desc = FALSE)),
    defaultExpanded = TRUE,
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
    dataKey = digest::digest(list(data, columns)),
    static = FALSE
  )
  expect_equal(attribs, expected)

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

test_that("data with numbers are serialized with max precision", {
  data <- data.frame(x = 0.123456789012345)  # 16 digits
  tbl <- reactable(data)
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{"x":[0.123456789012345]}')
})

test_that("data with numeric NA, NaN, Inf, and -Inf are serialized correctly", {
  # jsonlite::toJSON(na = "null") will serialize NA as null, but also discard NaN, Inf, and -Inf
  data <- data.frame(n = c(1, NA, NaN, Inf, -Inf, 0, -1))
  tbl <- reactable(data)
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{"n":[1,"NA","NaN","Inf","-Inf",0,-1]}')
})

test_that("data with dates/datetimes are serialized in ISO 8601", {
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

test_that("data with list-columns are serialized correctly", {
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
      # NULLs should be serialized as null, not jsonlite's default {}
      NULL,
      NA
    ))
  )
  tbl <- reactable(data)
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{"x":["x",["x"],["x"],[1,2,3],["a","b"],{"x":true},{"x":["y"]},null,null]}')
})

test_that("data supports Crosstalk", {
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

test_that("columns", {
  df <- data.frame(x = 1)
  expect_error(reactable(df, columns = "x"), "`columns` must be a named list of column definitions")
  expect_error(reactable(df, columns = list(list())), "`columns` must be a named list of column definitions")
  expect_error(reactable(df, columns = list(colDef())), "`columns` must be a named list of column definitions")
  expect_error(reactable(df, columns = list(zzzz = colDef())), "`columns` names must exist in `data`")

  df <- data.frame(
    chr = "a",
    num = 1,
    fct = factor("b"),
    lgl = TRUE,
    lst = I(list("a")),
    stringsAsFactors = FALSE
  )
  tbl <- reactable(df)
  columns <- getAttrib(tbl, "columns")
  expect_equal(columns, list(
    list(id = "chr", name = "chr", type = "character"),
    list(id = "num", name = "num", type = "numeric"),
    list(id = "fct", name = "fct", type = "factor"),
    list(id = "lgl", name = "lgl", type = "logical"),
    list(id = "lst", name = "lst", type = "AsIs")
  ))

  # Complex numbers currently fail due to `jsonlite::toJSON(3i, digits = NA)` error
  tryCatch({
    tbl <- reactable(data.frame(cpl = 3i))
    columns <- getAttrib(tbl, "columns")
    expect_equal(columns, list(id = "cpl", name = "cpl", type = "complex"))
    writeLines("complex numbers test passed")
  },
  error = function(e) {
    # Skipped due to error, "invalid value -2147483648 for 'digits' argument"
  })
})

test_that("columnGroups", {
  df <- data.frame(x = 1)
  expect_error(reactable(df, columnGroups = "x"), "`columnGroups` must be a list of column group definitions")
  expect_error(reactable(df, columnGroups = list(colDef())),
               "`columnGroups` must be a list of column group definitions")
  expect_error(reactable(df, columnGroups = list(colGroup(name = "", columns = "y"))),
               "`columnGroups` columns must exist in `data`")
  expect_error(reactable(df, columnGroups = list(colGroup(name = ""))),
               "`columnGroups` groups must contain at least one column")

  df <- data.frame(x = 1, y = 2, z = "z")
  tbl <- reactable(df, columnGroups = list(
    colGroup(columns = c("x", "z")),
    colGroup(name = "y", columns = "y")
  ))
  expect_equal(getAttrib(tbl, "columnGroups"), list(
    colGroup(columns = c("x", "z")),
    colGroup(name = "y", columns = "y")
  ))
})

test_that("rownames", {
  expect_error(reactable(data.frame(x = 1), rownames = "true"),
               "`rownames` must be TRUE or FALSE")

  # Integer row names
  tbl <- reactable(data.frame(x = c(1, 2, 3)), rownames = TRUE)
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{".rownames":[1,2,3],"x":[1,2,3]}')
  expect_equal(attribs$columns[[1]], list(
    id = ".rownames", name = "",  type = "numeric",
    sortable = FALSE, filterable = FALSE, rowHeader = TRUE
  ))

  # Character row names
  tbl <- reactable(data.frame(x = c(1, 2, 3), row.names = c("a", "b", "c")), rownames = TRUE)
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{".rownames":["a","b","c"],"x":[1,2,3]}')
  expect_equal(attribs$columns[[1]], list(
    id = ".rownames", name = "",  type = "character",
    sortable = FALSE, filterable = FALSE, rowHeader = TRUE
  ))

  # Custom rownames colDef
  tbl <- reactable(data.frame(x = c(1, 2)), rownames = TRUE, columns = list(
    .rownames = colDef(name = "N", sortable = TRUE, headerClass = "hdr")
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[1]], list(
    id = ".rownames", name = "N",  type = "numeric",
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
    id = ".rownames", name = "",  type = "character",
    sortable = FALSE, filterable = FALSE, rowHeader = TRUE
  ))
  # Handles matrices
  tbl <- reactable(matrix(c(1,2,3), dimnames = list(c(1, 2, 3), "x")))
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{".rownames":["1","2","3"],"x":[1,2,3]}')
  expect_equal(attribs$columns[[1]], list(
    id = ".rownames", name = "",  type = "character",
    sortable = FALSE, filterable = FALSE, rowHeader = TRUE
  ))

  # If no row names, should not be shown by default
  tbl <- reactable(data.frame(x = c(1, 2, 3)))
  attribs <- getAttribs(tbl)
  expect_equal(as.character(attribs$data), '{"x":[1,2,3]}')
  expect_equal(length(attribs$columns), 1)

  # Should work with grouped_df from dplyr. cbind.data.frame() uses stringsAsFactors, but
  # dplyr:::cbind.grouped_df() ignores it
  grouped_df <- dplyr::grouped_df(data.frame(x = c(1, 2)), "x")
  tbl <- reactable(grouped_df, rownames = TRUE)
  expect_equal(as.character(getAttrib(tbl, "data")), '{".rownames":[1,2],"x":[1,2]}')
})

test_that("groupBy", {
  data <- data.frame(x = 1, y = "a", z = TRUE)

  tbl <- reactable(data)
  expect_equal(getAttrib(tbl, "groupBy"), NULL)

  tbl <- reactable(data, groupBy = "x")
  expect_equal(getAttrib(tbl, "groupBy"), list("x"))

  tbl <- reactable(data, groupBy = c("z", "x"))
  expect_equal(getAttrib(tbl, "groupBy"), list("z", "x"))

  expect_error(reactable(data, groupBy = c("z", "notexists")), "`groupBy` columns must exist in `data`")
  expect_error(reactable(data, groupBy = "x", columns = list(x = colDef(details = function(i) i))),
               "`details` cannot be used on a grouping column")
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
  expect_error(reactable(data.frame(x = 1), defaultColDef = list()),
               "`defaultColDef` must be a column definition")

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
  expect_error(reactable(data.frame(x = 1), defaultColGroup = list()),
               "`defaultColGroup` must be a column group definition")

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

test_that("showPageSizeOptions", {
  data <- data.frame(x = 1)

  tbl <- reactable(data)
  expect_equal(getAttrib(tbl, "showPageSizeOptions"), NULL)

  tbl <- reactable(data, showPageSizeOptions = TRUE)
  expect_equal(getAttrib(tbl, "showPageSizeOptions"), TRUE)

  tbl <- reactable(data, showPageSizeOptions = FALSE)
  expect_equal(getAttrib(tbl, "showPageSizeOptions"), FALSE)

  expect_error(reactable(data, showPageSizeOptions = "true"), "`showPageSizeOptions` must be TRUE or FALSE")
})

test_that("pageSizeOptions", {
  data <- data.frame(x = 1)

  tbl <- reactable(data)
  expect_equal(getAttrib(tbl, "pageSizeOptions"), NULL)

  tbl <- reactable(data, pageSizeOptions = c(10, 25, 50, 100))
  expect_equal(getAttrib(tbl, "pageSizeOptions"), list(10, 25, 50, 100))

  # Length-1 pageSizeOptions should be serialized as a JSON array
  tbl <- reactable(data,  pageSizeOptions = 5)
  expect_equal(getAttrib(tbl, "pageSizeOptions"), list(5))

  expect_error(reactable(data, pageSizeOptions = "1"), "`pageSizeOptions` must be numeric")
})

test_that("paginationType", {
  data <- data.frame(x = 1)

  tbl <- reactable(data)
  expect_equal(getAttrib(tbl, "paginationType"), NULL)

  for (type in c("numbers", "jump", "simple")) {
    tbl <- reactable(data, paginationType = type)
    expect_equal(getAttrib(tbl, "paginationType"), type)
  }

  expect_error(reactable(data, paginationType = "none"),
               '`paginationType` must be one of "numbers", "jump", "simple"')
})

test_that("defaultPageSize", {
  data <- data.frame(x = 1)

  tbl <- reactable(data)
  expect_equal(getAttrib(tbl, "defaultPageSize"), NULL)

  tbl <- reactable(data, defaultPageSize = 10)
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

test_that("showPageInfo", {
  data <- data.frame(x = 1)

  tbl <- reactable(data)
  expect_equal(getAttrib(tbl, "showPageInfo"), NULL)

  tbl <- reactable(data, showPageInfo = TRUE)
  expect_equal(getAttrib(tbl, "showPageInfo"), TRUE)

  tbl <- reactable(data, showPageInfo = FALSE)
  expect_equal(getAttrib(tbl, "showPageInfo"), FALSE)

  expect_error(reactable(data, showPageInfo = "true"), "`showPageInfo` must be TRUE or FALSE")
})

test_that("minRows", {
  data <- data.frame(x = 1)

  tbl <- reactable(data)
  expect_equal(getAttrib(tbl, "minRows"), NULL)

  tbl <- reactable(data, minRows = 1)
  expect_equal(getAttrib(tbl, "minRows"), 1)

  tbl <- reactable(data, minRows = 10)
  expect_equal(getAttrib(tbl, "minRows"), 10)

  expect_error(reactable(data, minRows = "2"), "`minRows` must be numeric")
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
  expect_equal(columns[[1]]$id, "x")
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
      id = ".details", name = "", type = NULL, sortable = FALSE,
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
  tbl <- reactable(data, selection = "single")
  attribs <- getAttribs(tbl)
  expect_equal(attribs$selection, "single")
  expect_equal(attribs$columns[[1]], list(
    id = ".selection", name = "", type = NULL, resizable = FALSE,
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
    id = ".selection", name = "", type = NULL, resizable = TRUE,
    width = 100, selectable = TRUE, className = "my-cls"
  ))

  # Selection column can be part of column groups
  tbl <- reactable(data.frame(x = c(1, 2)), selection = "multiple", columnGroups = list(
    colGroup("group", c(".selection", "x"))
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columnGroups[[1]]$columns, list(".selection", "x"))

  expect_error(reactable(data, selection = "none"), '`selection` must be "multiple" or "single"')

  # Out of bounds errors
  expect_error(reactable(data, selection = "single", defaultSelected = c(0, 1)))
  expect_error(reactable(data, selection = "multiple", defaultSelected = c(2, 4)))
})

test_that("selectionId", {
  expect_warning(
    reactable(data.frame(x = 1), selectionId = "selected"),
    "`selectionId` is deprecated."
  )
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

  # POSIXlt objects should be handled correctly (mostly just on R <= 3.4)
  data$p <- c(as.POSIXlt("2019-01-01"), as.POSIXlt("2019-05-01"), as.POSIXlt("2019-07-05"))
  tbl <- reactable(data, columns = list(
    p = colDef(class = function(value) value)
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[4]]$className,
               # Use as.list(c(...)) instead of list() to preserve tzone attributes
               as.list(c(as.POSIXlt("2019-01-01"), as.POSIXlt("2019-05-01"), as.POSIXlt("2019-07-05"))))

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

  # POSIXlt objects should be handled correctly (mostly just on R <= 3.4)
  data$p <- c(as.POSIXlt("2019-01-01"), as.POSIXlt("2019-05-01"), as.POSIXlt("2019-07-05"))
  tbl <- reactable(data, columns = list(
    p = colDef(style = function(value) value)
  ))
  attribs <- getAttribs(tbl)
  expect_equal(attribs$columns[[4]]$style,
               # Use as.list(c(...)) instead of list() to preserve tzone attributes
               as.list(c(as.POSIXlt("2019-01-01"), as.POSIXlt("2019-05-01"), as.POSIXlt("2019-07-05"))))

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

test_that("width, height, and sizingPolicy", {
  data <- data.frame(x = 1)
  expect_error(reactable(data, width = "not a valid CSS unit"))
  expect_error(reactable(data, height = "not a valid CSS unit"))

  tbl <- reactable(data)
  expect_equal(tbl$width, NULL)
  expect_equal(tbl$height, NULL)

  tbl <- reactable(data, width = "400px", height = "100%")
  expect_equal(tbl$width, "400px")
  expect_equal(tbl$height, "100%")

  expect_equal(tbl$sizingPolicy$knitr$figure, FALSE)
  expect_equal(tbl$sizingPolicy$defaultWidth, "auto")
  expect_equal(tbl$sizingPolicy$defaultHeight, "auto")
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

test_that("meta", {
  data <- data.frame(x = 1)

  expect_error(reactable(data, meta = "meta"), "`meta` must be a named list")

  tbl <- reactable(data)
  expect_equal(getAttrib(tbl, "meta"), NULL)

  # Empty lists should be omitted, not serialized as an empty array through jsonlite
  tbl <- reactable(data, meta = list())
  expect_equal(getAttrib(tbl, "meta"), NULL)

  meta <- list(
    number = 30,
    str = "str",
    df = data.frame(y = 2),
    func = JS("value => value > 30"),
    na = NA,
    naInteger = NA_integer_,
    null = NULL,
    date = as.POSIXct("2019-01-02 3:22:15"),
    array = c(2, 4, 6),
    arrayLength1 = 1,
    list = list(1),
    emptyList = list()  # will be serialized as []
  )
  tbl <- reactable(data, meta = meta)
  expect_equal(getAttrib(tbl, "meta"), meta)
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
  expect_equal(output[[1]]$attribs[["data-reactable-output"]], "mytbl")
  expect_equal(output[[1]]$name, "div")
  expect_equal(output[[1]]$attribs$id, "mytbl")
})

test_that("reactable_html", {
  html <- reactable_html("id", "color: red", "class")
  expect_equal(html, htmltools::tags$div(id = "id", class = "class", style = "color: red", reactDependencies()))

  # Text color should be set in R Notebooks
  old <- options(rstudio.notebook.executing = TRUE)
  on.exit(options(old))
  html <- reactable_html(NULL, "color: red", NULL)
  expect_equal(html, htmltools::tags$div(style = "color: #333;color: red", reactDependencies()))
})

test_that("reactable.yaml widget dependencies are included with correct version", {
  deps <- htmlwidgets::getDependency("reactable")
  reactableDep <- Find(function(x) x$name == "reactable", deps)
  expect_true(!is.null(reactableDep))
  # Keep widget dependency version in sync with package version
  expect_equal(package_version(reactableDep$version), packageVersion("reactable"))
  # Ensure reactable.css is included and named correctly, as it's also used as
  # the insertion point for theme style injection
  expect_equal(reactableDep$stylesheet, "reactable.css")
})

# Static rendering (experimental)
test_that("static rendering", {
  data <- data.frame(
    x = c(1, 2),
    y = c("a", "column-y-cell"),
    z = I(list(list(1,2,3), list(4,5,6))),
    stringsAsFactors = FALSE
  )

  expect_error(reactable(data, static = "true"), "`static` must be TRUE or FALSE")

  # expect_snapshot() uses capture.output(), which forces UTF-8 characters to latin-1 on
  # Windows R <= 4.1 or other non-UTF-8 platforms. expect_snapshot_value() is harder to read
  # but handles UTF-8 characters.
  # For any errors like `Error: lexical error: invalid char in json text.`, delete the snapshot
  # entirely and regenerate.
  expect_snapshot_html_with_utf8 <- function(x) expect_snapshot_value(as.character(x))

  tbl <- reactable(
    data,
    static = TRUE,
    elementId = "stable-id-static-rendering"
  )
  rendered <- htmltools::renderTags(tbl)
  expect_true(grepl("data-react-ssr", rendered$html))
  expect_true(grepl(">column-y-cell<", rendered$html))
  expect_snapshot(cat(rendered$html))

  # JS evals should always be serialized as an array
  expect_true(grepl('"evals":[]', rendered$html, fixed = TRUE))

  # Themes critical CSS should be included in <head>
  tbl <- reactable(
    data,
    static = TRUE,
    theme = reactableTheme(color = "blue", borderWidth = 3),
    elementId = "stable-id-theme-critical-css"
  )
  rendered <- htmltools::renderTags(tbl)
  styleDep <- Find(
    function(dep) !is.null(dep$head) && grepl('<style data-emotion="reactable .+color:blue;', dep$head),
    rendered$dependencies
  )
  expect_true(!is.null(styleDep))
  expect_snapshot(cat(styleDep$head))
  expect_snapshot(cat(rendered$html))

  # Custom render functions and JS evals should work
  tbl <- reactable(
    data,
    columns = list(
      x = colDef(cell = JS("cellInfo => `js-rendered_${cellInfo.value}_`")),
      y = colDef(cell = function(value) htmltools::tags$b(value))
    ),
    static = TRUE,
    elementId = "stable-id-custom-js-evals"
  )
  rendered <- htmltools::renderTags(tbl)
  expect_true(grepl("js-rendered_2_", rendered$html))
  expect_true(grepl("<b>column-y-cell</b>", rendered$html))
  expect_snapshot(cat(rendered$html))

  # Custom render functions and JS evals that call React externally should work
  tbl <- reactable(
    data,
    columns = list(
      y = colDef(cell = JS("cellInfo => React.createElement('b', null, cellInfo.value)"))
    ),
    static = TRUE,
    elementId = "stable-id-external-React"
  )
  rendered <- htmltools::renderTags(tbl)
  expect_true(grepl("<b>column-y-cell</b>", rendered$html))
  expect_snapshot(cat(rendered$html))

  # Known limitation: default expanded rows with defaultExpanded = TRUE is not currently supported.
  # Note: add a test for nested tables if it ever does become supported.
  tbl <- reactable(
    data.frame(x = 1),
    details = function(i) "row-details",
    static = TRUE,
    elementId = "stable-id-row-details"
  )
  rendered <- htmltools::renderTags(tbl)
  expect_false(grepl(">row-details<", rendered$html))
  expect_snapshot_html_with_utf8(rendered$html)

  # Embedded HTML widgets' root elements and widget scripts should not be statically rendered
  tbl <- reactable(
    data.frame(x = 1),
    columns = list(x = colDef(cell = function() {
      sparkline::sparkline(c(1, 2), elementId = "stable-id-sparkline")
    })),
    static = TRUE,
    elementId = "stable-id-html-widgets"
  )
  rendered <- htmltools::renderTags(tbl)
  expect_false(grepl("sparkline", strsplit(rendered$html, "<script")[[1]][[1]]))
  expect_equal(lengths(gregexpr("<script ", rendered$html)), 1) # Should only be one <script> for reactable
  expect_snapshot(cat(rendered$html))

  # Column formatting features that depend on Intl polyfills should work
  formatData <- data.frame(
    str = "str",
    pct = 0.75,
    # Test for floating-point precision issues: should not be formatted as 52.90000000000001%
    pct_digits = 0.529,
    currency_USD = 10,
    currency_EUR = 11.123,
    date = as.POSIXct("2019-05-06 3:22:15", tz = "UTC"),
    time = as.POSIXct("2019-05-06 3:22:15", tz = "UTC"),
    num = 1234.1234,
    locale_hi_IN = 1234567.4,
    stringsAsFactors = FALSE
  )
  tbl <- reactable(
    formatData,
    columns = list(
      str = colDef(format = colFormat(prefix = "pre_", suffix = "_suffix")),
      pct = colDef(format = colFormat(percent = TRUE)),
      pct_digits = colDef(format = colFormat(percent = TRUE)),
      currency_USD = colDef(format = colFormat(currency = "USD")),
      currency_EUR = colDef(format = colFormat(currency = "EUR")),
      date = colDef(format = colFormat(datetime = TRUE, prefix = "_date_", suffix = "_date_")),
      time = colDef(format = colFormat(time = TRUE, prefix = "_time_", suffix = "_time_")),
      num = colDef(format = colFormat(digits = 1, separators = TRUE)),
      # Current limitation: locales other than "en" aren't supported for now
      locale_hi_IN = colDef(format = colFormat(locales = "hi-IN", currency = "INR", separators = TRUE))
    ),
    static = TRUE,
    elementId = "stable-id-formatting-intl-polyfills"
  )
  rendered <- htmltools::renderTags(tbl)
  html <- rendered$html
  expect_true(grepl("pre_str_suffix", html, fixed = TRUE))
  expect_true(grepl(">75%<", html, fixed = TRUE))
  expect_true(grepl(">52.9%<", html, fixed = TRUE))
  expect_true(grepl(">$10.00<", html, fixed = TRUE))
  expect_true(grepl(">€11.12<", html, fixed = TRUE))
  expect_true(grepl(">1,234.1<", html, fixed = TRUE))
  expect_true(grepl(">₹1,234,567.40<", html, fixed = TRUE))
  # Date/time formatting depends on the local timezone, which can't easily be controlled in tests
  expect_false(grepl("_date_2019-05-06T03:22:15Z_date_", html))
  html <- sub(">_date_.+_date_<", ">_date_replaced_date_<", html)
  expect_false(grepl("_time_2019-05-06T03:22:15Z_time_", html))
  html <- sub(">_time_.+_time_<", ">_time_replaced_time_<", html)
  expect_snapshot_html_with_utf8(html)

  # Should fall back to client-side rendering when there are rendering errors
  tbl <- reactable(
    data,
    columns = list(x = colDef(cell = JS("throw new Error('error rendering JS')"))),
    static = TRUE,
    elementId = "stable-id-CSR-fallback"
  )
  expect_warning({ rendered <- htmltools::renderTags(tbl) }, "Failed to render table to static HTML:\nError: error rendering JS")
  expect_false(grepl("data-react-ssr", rendered$html))
  expect_false(grepl(">column-y-cell<", rendered$html))
  expect_snapshot(cat(rendered$html))

  # Custom knit_print method should work
  tbl <- reactable(data, static = TRUE)
  output <- knitr::knit_print(tbl, options = list(screenshot.force = FALSE))
  expect_true(grepl("data-react-ssr", output))

  tbl <- reactable(data)
  output <- knitr::knit_print(tbl, options = list(screenshot.force = FALSE))
  expect_false(grepl("data-react-ssr", output))
})
