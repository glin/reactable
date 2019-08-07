#' reactable: R Interface to the React Table Library
#'
#' @keywords internal
#' @import htmlwidgets
#' @name reactable-package
NULL

#' Create a reactable widget
#'
#' @param data A data frame or matrix.
#' @param rownames Show row names?
#' @param colnames Optional named list of column names.
#' @param columns Optional named list of column definitions. See `colDef()`.
#' @param columnGroups Optional list of column group definitions. See `colGroup()`.
#' @param groupBy Optional vector of column names to group by.
#' @param sortable Enable sorting? Defaults to `TRUE`.
#' @param resizable Enable column resizing?
#' @param filterable Enable column filtering?
#' @param defaultColDef Default column definition used by every column. See `colDef()`.
#' @param defaultColGroup Default column group definition used by every column group.
#'   See `colGroup()`.
#' @param defaultSortOrder Default sort order. Either `"asc"` for ascending
#'   order or `"desc"` for descending order. Defaults to `"asc"`.
#' @param defaultSorted Optional vector of column names to sort by default.
#'   Or to customize sort order, a named list with values of `"asc"` or `"desc"`.
#' @param pagination Enable pagination? Defaults to `TRUE`.
#' @param defaultPageSize Default page size for the table. Defaults to 10.
#' @param pageSizeOptions Page size options for the table. Defaults to 10, 25, 50, 100.
#' @param paginationType Pagination control to use. Either `"numbers"` for page
#'   number buttons (the default), `"jump"` for a page jump, or `"simple"` to show
#'   'Previous' and 'Next' buttons only.
#' @param showPagination Show pagination? Defaults to `TRUE` if the table has more
#'   than one page.
#' @param showPageSizeOptions Show page size options?
#' @param showPageInfo Show page info?
#' @param minRows Minimum number of rows to show. Defaults to 1.
#' @param selection Enable row selection? Either `"multiple"` or `"single"` for
#'   multiple or single row selection.
#' @param selectionId Shiny input ID for the selected rows. The selected rows are
#'   represented as a vector of row indices, or `NULL` if no rows are selected.
#' @param details Additional content to display when expanding a row. An R function
#'   that takes a row index argument or a `JS()` function that takes a row info object
#'   as an argument. Can also be a `colDef()` to customize the details expander column.
#' @param outlined Add borders around the table?
#' @param bordered Add borders around the table and every cell?
#' @param borderless Remove inner borders from table?
#' @param striped Add zebra-striping to table rows?
#' @param highlight Highlight table rows on hover? Defaults to `TRUE`.
#' @param compact Make tables more compact?
#' @param showSortable Show an indicator on sortable columns?
#' @param class Additional CSS classes to apply to the table.
#' @param style Inline styles to apply to the table. A named list or character string.
#' @param rowClass Additional CSS classes to apply to table rows. A character
#'   string, a `JS()` function that takes a row info object and table state object
#'   as arguments, or an R function that takes a row index argument.
#' @param rowStyle Inline styles to apply to table rows. A named list, character
#'   string, `JS()` function that takes a row info object and table state object
#'   as arguments, or an R function that takes a row index argument.
#' @param inline Display the table as an inline element, which shrinks to fit
#'   its contents? By default, the table is displayed as a block element, which
#'   expands to fit its parent container.
#' @param width Width in pixels (optional, defaults to automatic sizing).
#' @param height Height in pixels (optional, defaults to automatic sizing).
#' @param elementId Optional element ID for the widget.
#' @return An htmlwidget.
#' @export
reactable <- function(data, rownames = FALSE, colnames = NULL,
                      groupBy = NULL, columns = NULL, columnGroups = NULL,
                      sortable = TRUE, resizable = FALSE, filterable = FALSE,
                      defaultColDef = NULL, defaultColGroup = NULL,
                      defaultSortOrder = "asc", defaultSorted = NULL,
                      pagination = TRUE, defaultPageSize = 10,
                      pageSizeOptions = c(10, 25, 50, 100), paginationType = "numbers",
                      showPagination = NULL, showPageSizeOptions = TRUE, showPageInfo = TRUE,
                      minRows = 1, selection = NULL, selectionId = NULL,
                      details = NULL, outlined = FALSE, bordered = FALSE, borderless = FALSE,
                      striped = FALSE, highlight = TRUE, compact = FALSE, showSortable = FALSE,
                      class = NULL, style = NULL, rowClass = NULL, rowStyle = NULL,
                      inline = FALSE, width = "auto", height = "auto",
                      elementId = NULL) {

  if (!(is.data.frame(data) || is.matrix(data))) {
    stop("`data` must be a data frame or matrix")
  } else if (is.matrix(data)) {
    data <- as.data.frame(data, stringsAsFactors = FALSE)
  }
  if (!is.logical(rownames)) {
    stop("`rownames` must be TRUE or FALSE")
  } else if (rownames) {
    rownamesKey <- ".rownames"
    # Use attribute to get integer row names, if present
    data <- cbind(
      stats::setNames(list(attr(data, "row.names")), rownamesKey),
      data,
      stringsAsFactors = FALSE
    )
    defaultColumn <- colDef(name = "", sortable = FALSE, filterable = FALSE)
    if (rownamesKey %in% names(columns)) {
      columns[[rownamesKey]] <- mergeLists(defaultColumn, columns[[rownamesKey]])
    } else {
      columns <- c(stats::setNames(list(defaultColumn), rownamesKey), columns)
    }
  }
  if (!is.null(colnames)) {
    if (!isNamedList(colnames)) {
      stop("`colnames` must be a named list")
    }
    if (!all(names(colnames) %in% colnames(data))) {
      stop("`colnames` names must exist in `data`")
    }
  }
  if (!is.null(columns)) {
    if (!isNamedList(columns) || !all(sapply(columns, is.colDef))) {
      stop("`columns` must be a named list of column definitions")
    }
    if (!all(names(columns) %in% colnames(data))) {
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
      if (!all(group$columns %in% colnames(data))) {
        stop("`columnGroups` columns must exist in `data`")
      }
    }
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
  columnKeys <- colnames(data)
  if (!is.null(details)) {
    detailsKey <- ".details"
    columnKeys <- c(detailsKey, columnKeys)
    detailsColumn <- colDef(name = "", sortable = FALSE, filterable = FALSE, width = 35)
    if (is.colDef(details)) {
      detailsColumn <- mergeLists(detailsColumn, details)
    } else {
      detailsColumn <- mergeLists(detailsColumn, colDef(details = details))
    }
    columns <- c(stats::setNames(list(detailsColumn), detailsKey), columns)
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
  } else if (!pagination) {
    defaultPageSize <- nrow(data)
    showPagination <- FALSE
  }
  if (!is.numeric(defaultPageSize)) {
    stop("`defaultPageSize` must be numeric")
  }
  if (!is.numeric(pageSizeOptions)) {
    stop("`pageSizeOptions` must be numeric")
  }
  if (!paginationType %in% c("numbers", "jump", "simple")) {
    stop('`paginationType` must be one of "numbers", "jump", "simple"')
  }
  if (!is.null(showPagination) && !is.logical(showPagination)) {
    stop("`showPagination` must be TRUE or FALSE")
  }
  if (!is.logical(showPageSizeOptions)) {
    stop("`showPageSizeOptions` must be TRUE or FALSE")
  }
  if (!is.logical(showPageInfo)) {
    stop("`showPageInfo` must be TRUE or FALSE")
  }
  if (!is.numeric(minRows)) {
    stop("`minRows` must be numeric")
  }
  if (!is.null(selection) && !selection %in% c("multiple", "single")) {
    stop('`selection` must be "multiple" or "single"')
  }
  if (!is.null(selectionId) && !is.character(selectionId)) {
    stop("`selectionId` must be a character")
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
  if (!is.logical(highlight)) {
    stop("`highlight` must be TRUE or FALSE")
  }
  if (!is.logical(compact)) {
    stop("`compact` must be TRUE or FALSE")
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
  if (!is.null(inline) && !is.logical(inline)) {
    stop("`inline` must be TRUE or FALSE")
  }

  dependencies <- list()
  addDependencies <- function(x) {
    # Dedupe dependencies
    for (dep in htmltools::findDependencies(x)) {
      dependencies[[sprintf("%s-%s", dep$name, dep$version)]] <<- dep
    }
    dependencies <<- htmltools::resolveDependencies(dependencies)
  }

  cols <- lapply(columnKeys, function(key) {
    column <- list(accessor = key)
    if (!is.null(colnames[[key]])) {
      column$Header <- colnames[[key]]
    } else {
      column$Header <- key
    }
    column$type <- colType(data[[key]])
    if (!is.null(columns[[key]])) {
      column <- mergeLists(column, columns[[key]])
    }

    cell <- column[["cell"]]
    if (is.function(cell)) {
      content <- lapply(seq_len(nrow(data)), function(index) {
        value <- data[[index, key]]
        callFunc(cell, value, index)
      })
      column$cell <- lapply(content, asReactTag)
      addDependencies(column$cell)
    }

    footer <- column[["footer"]]
    if (!is.null(footer)) {
      if (is.function(footer)) {
        values <- data[[key]]
        footer <- callFunc(footer, values, key)
      }
      column$footer <- asReactTag(footer)
      addDependencies(column$footer)
    }

    details <- column[["details"]]
    if (is.function(details)) {
      details <- lapply(seq_len(nrow(data)), function(index) {
        callFunc(details, index)
      })
      column$details <- lapply(details, asReactTag)
      addDependencies(column$details)
    }

    className <- column[["className"]]
    if (is.function(className)) {
      classes <- lapply(seq_len(nrow(data)), function(index) {
        value <- data[index, key]
        callFunc(className, value, index)
      })
      column$className <- classes
    }

    style <- column[["style"]]
    if (is.function(style)) {
      style <- lapply(seq_len(nrow(data)), function(index) {
        value <- data[index, key]
        callFunc(style, value, index)
      })
      column$style <- lapply(style, asReactStyle)
    }

    column
  })

  data <- jsonlite::toJSON(data, dataframe = "columns", rownames = FALSE, digits = NA,
                           POSIXt = "ISO8601")

  component <- reactR::component("Reactable", list(
    data = data,
    columns = cols,
    columnGroups = columnGroups,
    pivotBy = as.list(groupBy),
    sortable = sortable,
    resizable = resizable,
    filterable = filterable,
    defaultSortDesc = isDescOrder(defaultSortOrder),
    defaultSorted = columnSortDefs(defaultSorted),
    defaultPageSize = defaultPageSize,
    pageSizeOptions = pageSizeOptions,
    paginationType = paginationType,
    showPagination = showPagination,
    showPageSizeOptions = showPageSizeOptions,
    showPageInfo = showPageInfo,
    minRows = minRows,
    selection = selection,
    selectionId = selectionId,
    outlined = outlined,
    bordered = bordered,
    borderless = borderless,
    striped = striped,
    highlight = highlight,
    compact = compact,
    showSortable = if (showSortable) showSortable,
    className = class,
    style = asReactStyle(style),
    rowClassName = rowClass,
    rowStyle = rowStyle,
    inline = if (inline) inline,
    dataKey = digest::digest(list(data, cols))
  ))

  htmlwidgets::createWidget(
    name = "reactable",
    reactR::reactMarkup(component),
    width = width,
    height = height,
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
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param inline Display the table as an inline element, which shrinks to fit
#'   its contents? By default, the table is displayed as a block element, which
#'   expands to fit its parent container.
#' @param expr An expression that generates a reactable.
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name reactable-shiny
#' @export
#' @examples
#' \dontrun{
#' library(shiny)
#' library(reactable)
#'
#' ui <- fluidPage(
#'   titlePanel("reactable example"),
#'   reactableOutput("table")
#' )
#'
#' server <- function(input, output, session) {
#'   output$table <- renderReactable({
#'     reactable(iris)
#'   })
#' }
#'
#' shinyApp(ui, server)
#' }
reactableOutput <- function(outputId, width = NULL, height = NULL, inline = FALSE) {
  htmlwidgets::shinyWidgetOutput(outputId, "reactable", width, height,
                                 inline = inline, package = "reactable")
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
#' @rdname reactable-shiny
reactable_html <- function(id, style, class, ...) {
  htmltools::tagList(
    # Necessary for RStudio viewer version < 1.2
    reactR::html_dependency_corejs(),
    reactR::html_dependency_react(),
    reactR::html_dependency_reacttools(),
    htmltools::tags$div(id = id, class = class, style = style)
  )
}
