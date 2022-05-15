#' @details
#' See the [online documentation](https://glin.github.io/reactable/) for
#' examples and an extensive usage guide.
#' @keywords internal
#' @import htmlwidgets
#' @name reactable-package
#' @aliases reactable-package
"_PACKAGE"

#' Create an interactive data table
#'
#' `reactable()` creates a data table from tabular data with sorting
#' and pagination by default. The data table is an HTML widget that can be
#' used in R Markdown documents and Shiny applications, or viewed from an
#' R console.
#'
#' @param data A data frame or matrix.
#'
#'   Can also be a [`crosstalk::SharedData`] object that wraps a data frame.
#' @param columns Named list of column definitions. See [colDef()].
#' @param columnGroups List of column group definitions. See [colGroup()].
#' @param rownames Show row names? Defaults to `TRUE` if the data has row names.
#'
#'   To customize the row names column, use `".rownames"` as the column name.
#'
#'   Cells in the row names column are automatically marked up as row headers
#'   for assistive technologies.
#' @param groupBy Character vector of column names to group by.
#'
#'   To aggregate data when rows are grouped, use the `aggregate` argument in [colDef()].
#' @param sortable Enable sorting? Defaults to `TRUE`.
#' @param resizable Enable column resizing?
#' @param filterable Enable column filtering?
#' @param searchable Enable global table searching?
#' @param searchMethod Custom search method to use for global table searching.
#'   A [JS()] function that takes an array of row objects, an array of
#'   column IDs, and the search value as arguments, and returns the filtered
#'   array of row objects.
#' @param defaultColDef Default column definition used by every column. See [colDef()].
#' @param defaultColGroup Default column group definition used by every column group.
#'   See [colGroup()].
#' @param defaultSortOrder Default sort order. Either `"asc"` for ascending
#'   order or `"desc"` for descending order. Defaults to `"asc"`.
#' @param defaultSorted Character vector of column names to sort by default.
#'   Or to customize sort order, a named list with values of `"asc"` or `"desc"`.
#' @param pagination Enable pagination? Defaults to `TRUE`.
#' @param defaultPageSize Default page size for the table. Defaults to 10.
#' @param showPageSizeOptions Show page size options?
#' @param pageSizeOptions Page size options for the table. Defaults to 10, 25, 50, 100.
#' @param paginationType Pagination control to use. Either `"numbers"` for page
#'   number buttons (the default), `"jump"` for a page jump, or `"simple"` to show
#'   'Previous' and 'Next' buttons only.
#' @param showPagination Show pagination? Defaults to `TRUE` if the table has more
#'   than one page.
#' @param showPageInfo Show page info? Defaults to `TRUE`.
#' @param minRows Minimum number of rows to show per page. Defaults to 1.
#' @param paginateSubRows When rows are grouped, paginate sub rows? Defaults to `FALSE`.
#' @param details Additional content to display when expanding a row. An R function
#'   that takes the row index and column name as arguments, or a [JS()] function
#'   that takes a row info object as an argument. Can also be a [colDef()] to
#'   customize the details expander column.
#' @param defaultExpanded Expand all rows by default?
#' @param selection Enable row selection? Either `"multiple"` or `"single"` for
#'   multiple or single row selection.
#'
#'   To get the selected rows in Shiny, use [getReactableState()].
#'
#'   To customize the selection column, use `".selection"` as the column name.
#' @param selectionId Shiny input ID for the selected rows. The selected rows are
#'   given as a numeric vector of row indices, or `NULL` if no rows are selected.
#'   **NOTE:** `selectionId` will be deprecated in a future release.
#'   Use [getReactableState()] to get the selected rows in Shiny instead.
#' @param defaultSelected A numeric vector of default selected row indices.
#' @param onClick Action to take when clicking a cell. Either `"expand"` to expand
#'   the row, `"select"` to select the row, or a [JS()] function that takes a
#'   row info object, column object, and table state object as arguments.
#' @param highlight Highlight table rows on hover?
#' @param outlined Add borders around the table?
#' @param bordered Add borders around the table and every cell?
#' @param borderless Remove inner borders from table?
#' @param striped Add zebra-striping to table rows?
#' @param compact Make tables more compact?
#' @param wrap Enable text wrapping? If `TRUE` (the default), long text will be
#'   wrapped to multiple lines. If `FALSE`, text will be truncated to fit on one line.
#' @param showSortIcon Show a sort icon when sorting columns?
#' @param showSortable Show an indicator on sortable columns?
#' @param class Additional CSS classes to apply to the table.
#' @param style Inline styles to apply to the table. A named list or character string.
#'
#'   Note that if `style` is a named list, property names should be camelCased.
#' @param rowClass Additional CSS classes to apply to table rows. A character
#'   string, a [JS()] function that takes a row info object and table state object
#'   as arguments, or an R function that takes a row index argument.
#' @param rowStyle Inline styles to apply to table rows. A named list, character
#'   string, [JS()] function that takes a row info object and table state object
#'   as arguments, or an R function that takes a row index argument.
#'
#'   Note that if `rowStyle` is a named list, property names should be camelCased.
#'   If `rowStyle` is a [JS()] function, it should return a JavaScript object with
#'   camelCased property names.
#' @param fullWidth Stretch the table to fill the full width of its container?
#'   Defaults to `TRUE`.
#' @param width Width of the table in pixels. Defaults to `"auto"` for automatic sizing.
#'
#'   To set the width of a column, see [colDef()].
#' @param height Height of the table in pixels. Defaults to `"auto"` for automatic sizing.
#' @param theme Theme options for the table, specified by
#'   [reactableTheme()]. Defaults to the global `reactable.theme` option.
#'   Can also be a function that returns a [reactableTheme()] or `NULL`.
#' @param language Language options for the table, specified by
#'   [reactableLang()]. Defaults to the global `reactable.language` option.
#' @param elementId Element ID for the widget.
#' @return A `reactable` HTML widget that can be used in R Markdown documents
#'   and Shiny applications, or viewed from an R console.
#'
#' @note
#' See the [online documentation](https://glin.github.io/reactable/) for
#' additional details and examples.
#'
#' @seealso
#' * [renderReactable()] and [reactableOutput()] for using reactable
#'   in Shiny applications or interactive R Markdown documents.
#' * [colDef()], [colFormat()], and [colGroup()] to customize columns.
#' * [reactableTheme()] and [reactableLang()] to customize the table.
#'
#' @examples
#' # Basic usage
#' reactable(iris)
#'
#' # Grouping and aggregation
#' reactable(
#'   iris,
#'   groupBy = "Species",
#'   columns = list(
#'     Sepal.Length = colDef(aggregate = "count"),
#'     Sepal.Width = colDef(aggregate = "mean"),
#'     Petal.Length = colDef(aggregate = "sum"),
#'     Petal.Width = colDef(aggregate = "max")
#'   )
#' )
#'
#' # Row details
#' reactable(iris, details = function(index) {
#'   htmltools::div(
#'     "Details for row: ", index,
#'     htmltools::tags$pre(paste(capture.output(iris[index, ]), collapse = "\n"))
#'   )
#' })
#'
#' # Conditional styling
#' reactable(sleep, columns = list(
#'   extra = colDef(style = function(value) {
#'     if (value > 0) {
#'       color <- "green"
#'     } else if (value < 0) {
#'       color <- "red"
#'     } else {
#'       color <- "#777"
#'     }
#'     list(color = color, fontWeight = "bold")
#'   })
#' ))
#'
#' @export
reactable <- function(
  data,
  columns = NULL,
  columnGroups = NULL,
  rownames = NULL,
  groupBy = NULL,
  sortable = TRUE,
  resizable = FALSE,
  filterable = FALSE,
  searchable = FALSE,
  searchMethod = NULL,
  defaultColDef = NULL,
  defaultColGroup = NULL,
  defaultSortOrder = "asc",
  defaultSorted = NULL,
  pagination = TRUE,
  defaultPageSize = 10,
  showPageSizeOptions = FALSE,
  pageSizeOptions = c(10, 25, 50, 100),
  paginationType = "numbers",
  showPagination = NULL,
  showPageInfo = TRUE,
  minRows = 1,
  paginateSubRows = FALSE,
  details = NULL,
  defaultExpanded = FALSE,
  selection = NULL,
  selectionId = NULL,
  defaultSelected = NULL,
  onClick = NULL,
  highlight = FALSE,
  outlined = FALSE,
  bordered = FALSE,
  borderless = FALSE,
  striped = FALSE,
  compact = FALSE,
  wrap = TRUE,
  showSortIcon = TRUE,
  showSortable = FALSE,
  class = NULL,
  style = NULL,
  rowClass = NULL,
  rowStyle = NULL,
  fullWidth = TRUE,
  width = "auto",
  height = "auto",
  theme = getOption("reactable.theme"),
  language = getOption("reactable.language"),
  elementId = NULL
) {
  crosstalkKey <- NULL
  crosstalkGroup <- NULL
  dependencies <- list()
  if (requireNamespace("crosstalk", quietly = TRUE)) {
    if (crosstalk::is.SharedData(data)) {
      crosstalkKey <- as.list(data$key())
      crosstalkGroup <- data$groupName()
      data <- data$origData()
      dependencies <- crosstalk::crosstalkLibs()
    }
  }

  if (!(is.data.frame(data) || is.matrix(data))) {
    stop("`data` must be a data frame or matrix")
  } else if (is.matrix(data)) {
    data <- as.data.frame(data, stringsAsFactors = FALSE)
  }
  if (ncol(data) == 0) {
    stop("`data` must have at least one column")
  }

  if (is.null(rownames)) {
    # Check if row names were set. This may not work if row names were set to
    # integers, but it's more reliable than using .row_names_info() on
    # data frames that have been subsetted.
    rownames <- is.character(attr(data, "row.names"))
  }
  if (!is.logical(rownames)) {
    stop("`rownames` must be TRUE or FALSE")
  } else if (rownames) {
    rownamesKey <- ".rownames"
    # Get row names from attribute to preserve type (in case of integer row names)
    data <- cbind(
      stats::setNames(list(attr(data, "row.names")), rownamesKey),
      data,
      stringsAsFactors = FALSE
    )
    rownamesColumn <- colDef(name = "", sortable = FALSE, filterable = FALSE)
    if (rownamesKey %in% names(columns)) {
      rownamesColumn <- mergeLists(rownamesColumn, columns[[rownamesKey]])
    }
    rownamesColumn$rowHeader <- TRUE
    columns[[rownamesKey]] <- rownamesColumn
  }

  if (!is.null(groupBy)) {
    if (!all(groupBy %in% colnames(data))) {
      stop("`groupBy` columns must exist in `data`")
    }
    if (any(sapply(columns[groupBy], function(col) !is.null(col[["details"]])))) {
      stop("`details` cannot be used on a grouping column")
    }
  }

  if (!is.logical(sortable)) {
    stop("`sortable` must be TRUE or FALSE")
  }

  if (!is.logical(resizable)) {
    stop("`resizable` must be TRUE or FALSE")
  }

  if (!is.logical(filterable)) {
    stop("`filterable` must be TRUE or FALSE")
  }

  if (!is.logical(searchable)) {
    stop("`searchable` must be TRUE or FALSE")
  }

  if (!is.null(searchMethod) && !is.JS(searchMethod)) {
    stop('`searchMethod` must be a JS function')
  }

  columnKeys <- colnames(data)

  # Exclude special column for sub rows
  subRowsKey <- ".subRows"
  columnKeys <- columnKeys[columnKeys != subRowsKey]

  if (!is.null(details)) {
    detailsKey <- ".details"
    columnKeys <- c(detailsKey, columnKeys)
    detailsColumn <- colDef(name = "", sortable = FALSE, filterable = FALSE,
                            searchable = FALSE, resizable = FALSE, width = 45,
                            align = "center")
    if (is.colDef(details)) {
      detailsColumn <- mergeLists(detailsColumn, details)
    } else {
      detailsColumn <- mergeLists(detailsColumn, colDef(details = details))
    }
    # Prepend column
    columns <- c(stats::setNames(list(detailsColumn), detailsKey), columns)
  }

  if (!is.null(selection)) {
    selectionKey <- ".selection"
    columnKeys <- c(selectionKey, columnKeys)
    selectionColumn <- colDef(name = "", resizable = FALSE, width = 45)
    selectionColumn$selectable <- TRUE
    if (selectionKey %in% names(columns)) {
      selectionColumn <- mergeLists(selectionColumn, columns[[selectionKey]])
    }
    columns[[selectionKey]] <- selectionColumn
  }

  if (!is.null(defaultColDef)) {
    if (!is.colDef(defaultColDef)) {
      stop("`defaultColDef` must be a column definition")
    }
    columns <- lapply(columnKeys, function(name) {
      mergeLists(defaultColDef, columns[[name]])
    })
    columns <- stats::setNames(columns, columnKeys)
  }

  if (!is.null(defaultColGroup)) {
    if (!is.colGroup(defaultColGroup)) {
      stop("`defaultColGroup` must be a column group definition")
    }
    columnGroups <- lapply(columnGroups, function(group) {
      mergeLists(defaultColGroup, group)
    })
  }

  if (!is.null(columns)) {
    if (!isNamedList(columns) || !all(sapply(columns, is.colDef))) {
      stop("`columns` must be a named list of column definitions")
    }
    if (!all(names(columns) %in% columnKeys)) {
      stop("`columns` names must exist in `data`")
    }
  }

  if (!is.null(columnGroups)) {
    if (!all(sapply(columnGroups, is.colGroup))) {
      stop("`columnGroups` must be a list of column group definitions")
    }
    for (group in columnGroups) {
      if (length(group$columns) == 0) {
        stop("`columnGroups` groups must contain at least one column")
      }
      if (!all(group$columns %in% columnKeys)) {
        stop("`columnGroups` columns must exist in `data`")
      }
    }
  }

  if (!isSortOrder(defaultSortOrder)) {
    stop('`defaultSortOrder` must be "asc" or "desc"')
  }
  if (!is.null(defaultSorted)) {
    if (!is.character(defaultSorted) && !isNamedList(defaultSorted)) {
      stop("`defaultSorted` must be a named list or character vector of column names")
    }
    if (is.character(defaultSorted)) {
      orders <- lapply(defaultSorted, function(name) {
        if (!is.null(columns[[name]]$defaultSortDesc)) {
          if (columns[[name]]$defaultSortDesc) "desc" else "asc"
        } else {
          defaultSortOrder
        }
      })
      defaultSorted <- stats::setNames(orders, defaultSorted)
    }
    if (!all(sapply(defaultSorted, isSortOrder))) {
      stop('`defaultSorted` values must be "asc" or "desc"')
    }
    if (!all(names(defaultSorted) %in% colnames(data))) {
      stop("`defaultSorted` columns must exist in `data`")
    }
  }
  if (!is.logical(pagination)) {
    stop("`pagination` must be TRUE or FALSE")
  }
  if (!is.numeric(defaultPageSize)) {
    stop("`defaultPageSize` must be numeric")
  }
  if (!is.logical(showPageSizeOptions)) {
    stop("`showPageSizeOptions` must be TRUE or FALSE")
  }
  if (!is.null(pageSizeOptions)) {
    if (!is.numeric(pageSizeOptions)) {
      stop("`pageSizeOptions` must be numeric")
    }
    pageSizeOptions <- as.list(pageSizeOptions)
  }
  if (!paginationType %in% c("numbers", "jump", "simple")) {
    stop('`paginationType` must be one of "numbers", "jump", "simple"')
  }
  if (!is.null(showPagination) && !is.logical(showPagination)) {
    stop("`showPagination` must be TRUE or FALSE")
  }
  if (!is.logical(showPageInfo)) {
    stop("`showPageInfo` must be TRUE or FALSE")
  }
  if (!is.numeric(minRows)) {
    stop("`minRows` must be numeric")
  }
  if (!is.logical(paginateSubRows)) {
    stop("`paginateSubRows` must be TRUE or FALSE")
  }
  if (!is.logical(defaultExpanded)) {
    stop("`defaultExpanded` must be TRUE or FALSE")
  }
  if (!is.null(selection) && !selection %in% c("multiple", "single")) {
    stop('`selection` must be "multiple" or "single"')
  }
  if (!is.null(selectionId) && !is.character(selectionId)) {
    stop("`selectionId` must be a character")
  }
  if (!is.null(defaultSelected)) {
    if (!is.numeric(defaultSelected)) {
      stop("`defaultSelected` must be numeric")
    }
    if (any(defaultSelected < 1 | defaultSelected > nrow(data))) {
      stop("`defaultSelected` row indices must be within range")
    }
    # Convert to 0-based indexing
    defaultSelected <- as.list(defaultSelected - 1)
  }
  if (!is.null(onClick) && !onClick %in% c("expand", "select") && !is.JS(onClick)) {
    stop('`onClick` must be "expand", "select", or a JS function')
  }
  if (!is.logical(highlight)) {
    stop("`highlight` must be TRUE or FALSE")
  }
  if (!is.logical(outlined)) {
    stop("`outlined` must be TRUE or FALSE")
  }
  if (!is.logical(bordered)) {
    stop("`bordered` must be TRUE or FALSE")
  }
  if (!is.logical(borderless)) {
    stop("`borderless` must be TRUE or FALSE")
  }
  if (!is.logical(striped)) {
    stop("`striped` must be TRUE or FALSE")
  }
  if (!is.logical(compact)) {
    stop("`compact` must be TRUE or FALSE")
  }
  if (!is.logical(wrap)) {
    stop("`wrap` must be `TRUE` or `FALSE`")
  }
  if (!is.logical(showSortIcon)) {
    stop("`showSortIcon` must be TRUE or FALSE")
  }
  if (!is.logical(showSortable)) {
    stop("`showSortable` must be TRUE or FALSE")
  }
  if (!is.null(class) && !is.character(class)) {
    stop("`class` must be a character")
  }
  if (!is.null(style) && !isNamedList(style) && !is.character(style)) {
    stop("`style` must be a named list or character string")
  }
  if (!is.null(rowClass)) {
    if (!is.character(rowClass) && !is.JS(rowClass) && !is.function(rowClass)) {
      stop("`rowClass` must be a character, JS function, or R function")
    }
    if (is.function(rowClass)) {
      rowClass <- lapply(seq_len(nrow(data)), function(index) {
        callFunc(rowClass, index)
      })
    }
  }
  if (!is.null(rowStyle)) {
    if (!isNamedList(rowStyle) && !is.character(rowStyle) && !is.JS(rowStyle) && !is.function(rowStyle)) {
      stop("`rowStyle` must be a named list, character string, JS function, or R function")
    }
    if (is.function(rowStyle)) {
      rowStyle <- lapply(seq_len(nrow(data)), function(index) {
        asReactStyle(callFunc(rowStyle, index))
      })
    } else if (is.character(rowStyle) && !is.JS(rowStyle)) {
      rowStyle <- asReactStyle(rowStyle)
    }
  }
  if (!is.logical(fullWidth)) {
    stop("`fullWidth` must be TRUE or FALSE")
  }
  width <- htmltools::validateCssUnit(width)
  height <- htmltools::validateCssUnit(height)

  if (!is.null(theme)) {
    if (is.function(theme)) {
      theme <- callFunc(theme)
    }
    if (!is.null(theme) && !is.reactableTheme(theme)) {
      stop("`theme` must be a reactable theme object")
    }
  }
  if (!is.null(language) && !is.reactableLang(language)) {
    stop("`language` must be a reactable language options object")
  }

  addDependencies <- function(x) {
    # Dedupe dependencies
    for (dep in htmltools::findDependencies(x)) {
      dependencies[[sprintf("%s-%s", dep$name, dep$version)]] <<- dep
    }
    dependencies <<- htmltools::resolveDependencies(dependencies)
  }

  cols <- lapply(columnKeys, function(key) {
    column <- list(
      accessor = key,
      name = key,
      type = colType(data[[key]])
    )

    if (!is.null(columns[[key]])) {
      column <- mergeLists(column, columns[[key]])
    }

    cell <- column[["cell"]]
    if (is.function(cell)) {
      content <- lapply(seq_len(nrow(data)), function(index) {
        value <- data[[key]][[index]]
        callFunc(cell, value, index, key)
      })
      column$cell <- lapply(content, asReactTag)
      addDependencies(column$cell)
    }

    header <- column[["header"]]
    if (!is.null(header)) {
      if (is.function(header)) {
        header <- callFunc(header, column$name, key)
      }
      if (!is.JS(header)) {
        column$header <- asReactTag(header)
        addDependencies(column$header)
      }
    }

    footer <- column[["footer"]]
    if (!is.null(footer)) {
      if (is.function(footer)) {
        values <- data[[key]]
        footer <- callFunc(footer, values, key)
      }
      if (!is.JS(footer)) {
        column$footer <- asReactTag(footer)
        addDependencies(column$footer)
      }
    }

    details <- column[["details"]]
    if (is.function(details)) {
      details <- lapply(seq_len(nrow(data)), function(index) {
        callFunc(details, index, key)
      })
      column$details <- lapply(details, asReactTag)
      addDependencies(column$details)
    }

    filterInput <- column[["filterInput"]]
    if (!is.null(filterInput)) {
      if (is.function(filterInput)) {
        values <- data[[key]]
        filterInput <- callFunc(filterInput, values, key)
      }
      if (!is.JS(filterInput)) {
        column$filterInput <- asReactTag(filterInput)
        addDependencies(column$filterInput)
      }
    }

    className <- column[["className"]]
    if (is.function(className)) {
      classes <- lapply(seq_len(nrow(data)), function(index) {
        value <- data[[key]][[index]]
        callFunc(className, value, index, key)
      })
      column$className <- classes
    }

    style <- column[["style"]]
    if (is.function(style)) {
      style <- lapply(seq_len(nrow(data)), function(index) {
        value <- data[[key]][[index]]
        callFunc(style, value, index, key)
      })
      column$style <- lapply(style, asReactStyle)
    }

    column
  })

  if (!is.null(columnGroups)) {
    columnGroups <- lapply(columnGroups, function(group) {
      header <- group[["header"]]
      if (!is.null(header)) {
        if (is.function(header)) {
          header <- callFunc(header, group$name)
        }
        if (!is.JS(header)) {
          group$header <- asReactTag(header)
          addDependencies(group$header)
        }
      }
      group
    })
  }

  data <- jsonlite::toJSON(data, dataframe = "columns", rownames = FALSE, digits = NA,
                           POSIXt = "ISO8601", Date = "ISO8601", UTC = TRUE, force = TRUE,
                           auto_unbox = TRUE)

  # Create a unique key for the data. The key is used to fully reset state when
  # the data changes (for tables in Shiny).
  dataKey <- digest::digest(list(data, cols))

  if (isV2()) {
    widgetName <- "reactable"
  } else {
    widgetName <- "reactable_v1"
    class <- paste("reactable", class)
  }

  component <- reactR::component("Reactable", list(
    data = data,
    columns = cols,
    columnGroups = columnGroups,
    pivotBy = as.list(groupBy),
    sortable = if (!sortable) FALSE,
    resizable = if (resizable) TRUE,
    filterable = if (filterable) TRUE,
    searchable = if (searchable) TRUE,
    searchMethod = searchMethod,
    defaultSortDesc = if (isDescOrder(defaultSortOrder)) TRUE,
    defaultSorted = columnSortDefs(defaultSorted),
    pagination = if (!pagination) FALSE,
    defaultPageSize = defaultPageSize,
    showPageSizeOptions = if (showPageSizeOptions) TRUE,
    pageSizeOptions = if (showPageSizeOptions) pageSizeOptions,
    paginationType = paginationType,
    showPagination = if (!is.null(showPagination)) showPagination,
    showPageInfo = showPageInfo,
    minRows = minRows,
    paginateSubRows = if (paginateSubRows) TRUE,
    defaultExpanded = if (defaultExpanded) defaultExpanded,
    selection = selection,
    selectionId = selectionId,
    defaultSelected = defaultSelected,
    onClick = onClick,
    highlight = if (highlight) TRUE,
    outlined = if (outlined) TRUE,
    bordered = if (bordered) TRUE,
    borderless = if (borderless) TRUE,
    striped = if (striped) TRUE,
    compact = if (compact) TRUE,
    nowrap = if (!wrap) TRUE,
    showSortIcon = if (!showSortIcon) FALSE,
    showSortable = if (showSortable) TRUE,
    className = class,
    style = asReactStyle(style),
    rowClassName = rowClass,
    rowStyle = rowStyle,
    inline = if (!fullWidth) TRUE,
    width = if (width != "auto") width,
    height = if (height != "auto") height,
    theme = theme,
    language = language,
    crosstalkKey = crosstalkKey,
    crosstalkGroup = crosstalkGroup,
    elementId = elementId,
    dataKey = dataKey,
    key = if (!isV2()) dataKey
  ))

  htmlwidgets::createWidget(
    name = widgetName,
    reactR::reactMarkup(component),
    width = width,
    height = height,
    # Don't limit width when rendered inside an R Notebook
    sizingPolicy = htmlwidgets::sizingPolicy(knitr.figure = FALSE),
    package = "reactable",
    dependencies = dependencies,
    elementId = elementId
  )
}

# Convert named list of column orders to { id, desc } definitions
columnSortDefs <- function(defaultSorted) {
  lapply(names(defaultSorted), function(id) {
    list(id = id, desc = isDescOrder(defaultSorted[[id]]))
  })
}

#' Shiny bindings for reactable
#'
#' Output and render functions for using reactable within Shiny
#' applications and interactive R Markdown documents.
#'
#' @param outputId Output variable to read from.
#' @param width,height A valid CSS unit (like `"100%"`, `"400px"`, `"auto"`)
#'   or a number, which will be coerced to a string and have `"px"` appended.
#' @param inline Use an inline element for the table's container?
#' @param expr An expression that generates a [reactable] widget.
#' @param env The environment in which to evaluate `expr`.
#' @param quoted Is `expr` a quoted expression (with [quote()])? This is useful
#'   if you want to save an expression in a variable.
#' @return `reactableOutput()` returns a `reactable` output element that can be
#'   included in a Shiny UI.
#'
#'   `renderReactable()` returns a `reactable` render function that can be
#'   assigned to a Shiny output slot.
#'
#' @name reactable-shiny
#'
#' @note
#' See the [online demo](https://glin.github.io/reactable/articles/shiny-demo.html)
#' for additional examples of using reactable in Shiny.
#'
#' @seealso [updateReactable()] for updating a reactable instance in Shiny.
#'
#'  [getReactableState()] for getting the state of a reactable instance in Shiny.
#'
#' @examples
#' # Run in an interactive R session
#' if (interactive()) {
#'
#' library(shiny)
#' library(reactable)
#'
#' ui <- fluidPage(
#'  titlePanel("reactable example"),
#'  reactableOutput("table")
#' )
#'
#' server <- function(input, output, session) {
#'   output$table <- renderReactable({
#'    reactable(iris)
#'  })
#' }
#'
#' shinyApp(ui, server)
#' }
#'
#' @export
reactableOutput <- function(outputId, width = "auto", height = "auto", inline = FALSE) {
  widgetName <- if (isV2()) "reactable" else "reactable_v1"
  output <- htmlwidgets::shinyWidgetOutput(outputId, widgetName, width, height,
                                           inline = inline, package = "reactable")
  # Add attribute to Shiny output containers to differentiate them from static widgets
  addOutputId <- function(x) {
    if (isTagList(x)) {
      x[] <- lapply(x, addOutputId)
    } else if (is.tag(x)) {
      x <- htmltools::tagAppendAttributes(x, "data-reactable-output" = outputId)
    }
    x
  }
  output <- addOutputId(output)
  output
}

#' @rdname reactable-shiny
#' @export
renderReactable <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) }
  htmlwidgets::shinyRenderWidget(expr, reactableOutput, env, quoted = TRUE)
}


#' Called by HTMLWidgets to produce the widget's root element
#'
#' @param id Element ID.
#' @param style Element style.
#' @param class Element class.
#' @param ... Additional arguments.
#' @keywords internal
widget_html.reactable <- function(id, style, class, ...) {
  # Set text color in R Notebooks to prevent contrast issues when
  # using a dark editor theme and htmltools 0.4.0.
  if (isTRUE(getOption("rstudio.notebook.executing"))) {
    style <- paste0("color: #333;", style)
  }
  htmltools::tagList(
    # Necessary for RStudio Viewer version < 1.2 and IE11
    reactR::html_dependency_corejs(),
    reactR::html_dependency_react(),
    reactR::html_dependency_reacttools(),
    htmltools::tags$div(id = id, class = class, style = style)
  )
}

# Deprecated convention for htmlwidgets <= 1.5.2 support
reactable_html <- widget_html.reactable

isV2 <- function() {
  getOption("reactable.v2", TRUE)
}

reactable_v1 <- function(..., class = NULL) {
  old <- options(reactable.v2 = FALSE)
  on.exit(options(old))
  reactable(...)
}

reactable_v1_html <- widget_html.reactable
