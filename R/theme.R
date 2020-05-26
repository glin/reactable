#' Theme options
#'
#' @description
#' Use `reactableTheme()` to customize the default styling of a table.
#' You can set theme variables to change the default styles, or add custom CSS
#' to specific elements of the table.
#'
#' The `color` variables are specified as character strings of CSS color values.
#' The `width` and `padding` variables are specified as either character strings
#' of CSS width and padding values, or numeric pixel values. The `style` arguments
#' take custom CSS as named lists of camelCased properties.
#'
#' To set the default theme for all tables, use the global `reactable.theme` option.
#'
#' @details
#' You can use nested CSS selectors in `style` arguments to target
#' the current element, using `&` as the selector, or other child elements
#' (just like in Sass). This is useful for adding pseudo-classes like `&:hover`,
#' or adding styles in a certain context like `.outer-container &`.
#'
#' @param color Default text color.
#' @param backgroundColor Default background color.
#' @param borderColor Default border color.
#' @param borderWidth Default border width.
#' @param stripedColor Default row stripe color.
#' @param highlightColor Default row highlight color.
#' @param cellPadding Default cell padding.
#'
#' @param style Additional CSS for the table.
#'
#' @param tableStyle Additional CSS for the table element (excludes
#'   the pagination bar and search input).
#'
#' @param headerStyle Additional CSS for header cells.
#'
#' @param groupHeaderStyle Additional CSS for group header cells.
#'
#' @param tableBodyStyle Additional CSS for the table body element.
#'
#' @param rowGroupStyle Additional CSS for row groups.
#'
#' @param rowStyle Additional CSS for rows.
#' @param rowStripedStyle Additional CSS for striped rows.
#' @param rowHighlightStyle Additional CSS for highlighted rows.
#' @param rowSelectedStyle Additional CSS for selected rows.
#'
#' @param cellStyle Additional CSS for cells.
#'
#' @param footerStyle Additional CSS for footer cells.
#'
#' @param inputStyle Additional CSS for inputs.
#' @param filterInputStyle Additional CSS for filter inputs.
#' @param searchInputStyle Additional CSS for the search input.
#'
#' @param selectStyle Additional CSS for table select controls.
#'
#' @param paginationStyle Additional CSS for the pagination bar.
#' @param pageButtonStyle,pageButtonHoverStyle,pageButtonActiveStyle,pageButtonCurrentStyle
#'   Additional CSS for page buttons, page buttons with hover or active
#'   states, and the current page button.
#'
#' @return A theme options object that can be used to customize the default
#'   styling in `reactable()`.
#'
#' @examples
#' reactable(
#'   iris[1:30, ],
#'   searchable = TRUE,
#'   striped = TRUE,
#'   highlight = TRUE,
#'   bordered = TRUE,
#'   theme = reactableTheme(
#'     borderColor = "#dfe2e5",
#'     stripedColor = "#f6f8fa",
#'     highlightColor = "#f0f5f9",
#'     cellPadding = "8px 12px",
#'     style = list(
#'       fontFamily = "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"
#'     ),
#'     searchInputStyle = list(width = "100%")
#'   )
#' )
#'
#' # Set the default theme for all tables
#' options(reactable.theme = reactableTheme(
#'   color = "hsl(233, 9%, 87%)",
#'   backgroundColor = "hsl(233, 9%, 19%)",
#'   borderColor = "hsl(233, 9%, 22%)",
#'   stripedColor = "hsl(233, 12%, 22%)",
#'   highlightColor = "hsl(233, 12%, 24%)",
#'   inputStyle = list(backgroundColor = "hsl(233, 9%, 25%)"),
#'   selectStyle = list(backgroundColor = "hsl(233, 9%, 25%)"),
#'   pageButtonHoverStyle = list(backgroundColor = "hsl(233, 9%, 25%)"),
#'   pageButtonActiveStyle = list(backgroundColor = "hsl(233, 9%, 28%)")
#' ))
#'
#' reactable(
#'   iris[1:30, ],
#'   filterable = TRUE,
#'   showPageSizeOptions = TRUE,
#'   striped = TRUE,
#'   highlight = TRUE,
#'   details = function(index) paste("Details for row", index)
#' )
#'
#' # Use nested selectors to highlight headers when sorting
#' reactable(
#'   iris[1:30, ],
#'   columns = list(Sepal.Length = colDef(sortable = FALSE)),
#'   showSortable = TRUE,
#'   theme = reactableTheme(
#'     headerStyle = list(
#'       "&:hover[aria-sort]" = list(background = "hsl(0, 0%, 96%)"),
#'       "&[aria-sort='ascending'], &[aria-sort='descending']" = list(background = "hsl(0, 0%, 96%)"),
#'       borderColor = "#555"
#'     )
#'   )
#' )
#'
#' @export
reactableTheme <- function(
  color = NULL,
  backgroundColor = NULL,
  borderColor = NULL,
  borderWidth = NULL,
  stripedColor = NULL,
  highlightColor = NULL,
  cellPadding = NULL,

  style = NULL,

  tableStyle = NULL,

  headerStyle = NULL,

  groupHeaderStyle = NULL,

  tableBodyStyle = NULL,

  rowGroupStyle = NULL,

  rowStyle = NULL,
  rowStripedStyle = NULL,
  rowHighlightStyle = NULL,
  rowSelectedStyle = NULL,

  cellStyle = NULL,

  footerStyle = NULL,

  inputStyle = NULL,
  filterInputStyle = NULL,
  searchInputStyle = NULL,

  selectStyle = NULL,

  paginationStyle = NULL,
  pageButtonStyle = NULL,
  pageButtonHoverStyle = NULL,
  pageButtonActiveStyle = NULL,
  pageButtonCurrentStyle = NULL
) {

  args <- formals()

  for (arg in names(args)) {
    value <- get(arg)
    if (is.null(value)) {
      next
    }

    if (grepl("style$", arg, ignore.case = TRUE)) {
      if (!isNamedList(value) && !is.character(value)) {
        stop(sprintf("`%s` must be a named list", arg))
      }
    } else if (grepl("width$|padding$", arg, ignore.case = TRUE)) {
      if (!is.character(value) && !is.numeric(value)) {
        stop(sprintf("`%s` must be a character string or number", arg))
      }
    } else if (!is.character(value)) {
      stop(sprintf("`%s` must be a character string", arg))
    }

    args[[arg]] <- value
  }

  theme <- filterNulls(args)
  structure(theme, class = "reactableTheme")
}

is.reactableTheme <- function(x) {
  inherits(x, "reactableTheme")
}
