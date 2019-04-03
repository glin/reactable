#' reactable: R Interface to the React Table Library
#'
#' @keywords internal
#' @import htmlwidgets
#' @name reactable-package
NULL

#' Create a data table
#'
#' @param data A data frame or matrix.
#' @param rownames Show row names? Defaults to `TRUE`.
#' @param colnames Optional named list of column names.
#' @param sortable Enable sorting? Defaults to `TRUE`.
#' @param resizable Enable column resizing? Defaults to `TRUE`.
#' @param filterable Enable column filtering? Defaults to `FALSE`.
#' @param defaultPageSize Default page size for the table. Defaults to 10.
#' @param pageSizeOptions Page size options for the table. Defaults to 10, 25, 50, 100.
#' @param minRows Minimum number of rows to show. Defaults to 1.
#' @param striped Add zebra-striping to table rows? Defaults to `TRUE`.
#' @param highlight Highlight table rows on hover? Defaults to `TRUE`.
#' @param pivotBy Optional character vector of column names to pivot by.
#' @param columns Optional named list of column definitions.
#' @param width Width in pixels (optional, defaults to automatic sizing).
#' @param height Height in pixels (optional, defaults to automatic sizing).
#' @param elementId Optional element ID for the widget.
#' @return An htmlwidget.
#' @export
reactable <- function(data, rownames = TRUE, colnames = NULL,
                      sortable = TRUE, resizable = TRUE, filterable = FALSE,
                      defaultPageSize = 10, pageSizeOptions = c(10, 25, 50, 100),
                      minRows = 1, striped = TRUE, highlight = TRUE,
                      pivotBy = NULL, columns = NULL,
                      width = "auto", height = "auto", elementId = NULL) {

  if (!(is.data.frame(data) || is.matrix(data))) {
    stop("`data` must be a data frame or matrix")
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
      pivotBy = as.list(pivotBy),
      sortable = sortable,
      resizable = resizable,
      filterable = filterable,
      defaultPageSize = defaultPageSize,
      pageSizeOptions = pageSizeOptions,
      minRows = minRows,
      striped = striped,
      highlight = highlight
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
