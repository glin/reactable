#' reactable: R Interface to the React Table Library
#'
#' @keywords internal
#' @import htmlwidgets
#' @name reactable-package
NULL

#' Create a data table
#'
#' @param data A data frame or matrix.
#' @param rownames Show row names? Defaults to `FALSE`.
#' @param colnames Optional named list of column names.
#' @param sortable Enable sorting? Defaults to `TRUE`.
#' @param resizable Enable column resizing? Defaults to `TRUE`.
#' @param filterable Enable column filtering? Defaults to `FALSE`.
#' @param defaultSortOrder Default sort order. Either `"asc"` for ascending
#'   order or `"desc"` for descending order. Defaults to `"asc"`.
#' @param defaultSorted Optional named list of default sorted columns. Values
#'   should be either `"asc"` for ascending order or `"desc"` for descending order.
#' @param defaultPageSize Default page size for the table. Defaults to 10.
#' @param pageSizeOptions Page size options for the table. Defaults to 10, 25, 50, 100.
#' @param minRows Minimum number of rows to show. Defaults to 1.
#' @param groupBy Optional character vector of column names to group by.
#' @param columns Optional named list of column definitions.
#' @param striped Add zebra-striping to table rows? Defaults to `TRUE`.
#' @param highlight Highlight table rows on hover? Defaults to `TRUE`.
#' @param class Additional CSS classes to apply to the table.
#' @param style Named list of inline styles to apply to the table.
#' @param width Width in pixels (optional, defaults to automatic sizing).
#' @param height Height in pixels (optional, defaults to automatic sizing).
#' @param elementId Optional element ID for the widget.
#' @return An htmlwidget.
#' @export
reactable <- function(data, rownames = FALSE, colnames = NULL,
                      sortable = TRUE, resizable = TRUE, filterable = FALSE,
                      defaultSortOrder = "asc", defaultSorted = NULL,
                      defaultPageSize = 10, pageSizeOptions = c(10, 25, 50, 100),
                      minRows = 1, groupBy = NULL, columns = NULL, striped = TRUE,
                      highlight = TRUE, class = NULL, style = NULL,
                      width = "auto", height = "auto", elementId = NULL) {

  if (!(is.data.frame(data) || is.matrix(data))) {
    stop("`data` must be a data frame or matrix")
  }
  if (!is.logical(rownames)) {
    stop("`rownames` must be TRUE or FALSE")
  }
  if (!is.null(colnames)) {
    if (!isNamedList(colnames)) {
      stop("`colnames` must be a named list")
    }
    if (!all(names(colnames) %in% colnames(data))) {
      stop("`colnames` names must exist in `data`")
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
  if (!isSortOrder(defaultSortOrder)) {
    stop('`defaultSortOrder` must be "asc" or "desc"')
  }
  if (!is.null(defaultSorted)) {
    if (!isNamedList(defaultSorted)) {
      stop("`defaultSorted` must be a named list of column orders")
    }
    if (!all(sapply(defaultSorted, isSortOrder))) {
      stop('`defaultSorted` values must be "asc" or "desc"')
    }
    if (!all(names(defaultSorted) %in% colnames(data))) {
      stop("`defaultSorted` names must exist in `data`")
    }
  }
  if (!is.numeric(defaultPageSize)) {
    stop("`defaultPageSize` must be numeric")
  }
  if (!is.numeric(pageSizeOptions)) {
    stop("`pageSizeOptions` must be numeric")
  }
  if (!is.numeric(minRows)) {
    stop("`minRows` must be numeric")
  }
  if (!is.null(groupBy) && !all(groupBy %in% colnames(data))) {
    stop("`groupBy` columns must exist in `data`")
  }
  if (!is.null(columns)) {
    if (!isNamedList(columns) || !all(sapply(columns, is.colDef))) {
      stop("`columns` must be a named list of column definitions")
    }
    if (!all(names(columns) %in% colnames(data))) {
      stop("`columns` names must exist in `data`")
    }
  }
  if (!is.logical(striped)) {
    stop("`striped` must be TRUE or FALSE")
  }
  if (!is.logical(highlight)) {
    stop("`highlight` must be TRUE or FALSE")
  }
  if (!is.null(class) && !is.character(class)) {
    stop("`class` must be a character")
  }
  if (!is.null(style) && !isNamedList(style)) {
    stop("`style` must be a named list")
  }

  cols <- lapply(colnames(data), function(key) {
    column <- list(accessor = key)
    if (!is.null(colnames[[key]])) {
      column$Header <- colnames[[key]]
    } else {
      column$Header <- key
    }
    # Right-align numbers
    if (is.numeric(data[[key]])) {
      column$style <- list(textAlign = "right")
    }
    if (!is.null(columns[[key]])) {
      column <- mergeLists(column, columns[[key]])
    }
    column
  })

  if (rownames) {
    # Serialize row names with predictable order and ID
    data[["__rowname__"]] <- rownames(data)
    col <- list(
      accessor = "__rowname__",
      sortable = FALSE,
      filterable = FALSE
    )
    cols <- c(list(col), cols)
  }

  data <- jsonlite::toJSON(data, dataframe = "columns", rownames = FALSE)

  component <- reactR::reactMarkup(
    reactR::component("Reactable", list(
      data = data,
      columns = cols,
      pivotBy = as.list(groupBy),
      sortable = sortable,
      resizable = resizable,
      filterable = filterable,
      defaultSortDesc = isDescOrder(defaultSortOrder),
      defaultSorted = columnSortDefs(defaultSorted),
      defaultPageSize = defaultPageSize,
      pageSizeOptions = pageSizeOptions,
      minRows = minRows,
      striped = striped,
      highlight = highlight,
      className = class,
      style = style
    ))
  )

  htmlwidgets::createWidget(
    name = "reactable",
    component,
    width = width,
    height = height,
    package = "reactable",
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
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a reactable
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name reactable-shiny
#'
#' @export
reactableOutput <- function(outputId, width = "auto", height = "auto") {
  htmlwidgets::shinyWidgetOutput(outputId, "reactable", width, height, package = "reactable")
}

#' @rdname reactable-shiny
#' @export
renderReactable <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) }
  htmlwidgets::shinyRenderWidget(expr, reactableOutput, env, quoted = TRUE)
}


#' Called by HTMLWidgets to produce the widget's root element.
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
