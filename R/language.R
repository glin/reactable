#' Language options
#'
#' @description
#' Use `reactableLang()` to customize the language strings in a table.
#' Language strings include both visible text and accessible labels that can
#' be read by assistive technology, such as screen readers.
#'
#' To set the default language strings for all tables, use the global
#' `reactable.language` option.
#'
#' @param sortLabel Accessible label for column sort buttons.
#'   Takes a `{name}` parameter for the column name.
#'
#' @param filterPlaceholder Placeholder for column filter inputs.
#' @param filterLabel Accessible label for column filter inputs.
#'   Takes a `{name}` parameter for the column name.
#'
#' @param searchPlaceholder Placeholder for the table search input.
#' @param searchLabel Accessible label for the table search input.
#'
#' @param noData Placeholder text when the table has no data.
#'
#' @param pageNext Text for the next page button.
#' @param pagePrevious Text for the previous page button.
#' @param pageNumbers Text for the page numbers info. Only used with the `"jump"` and
#'   `"simple"` pagination types.
#'   Takes the following parameters:
#'   - `{page}` for the current page
#'   - `{pages}` for the total number of pages
#' @param pageInfo Text for the page info.
#'   Takes the following parameters:
#'   - `{rowStart}` for the starting row of the page
#'   - `{rowEnd}` for the ending row of the page
#'   - `{rows}` for the total number of rows
#' @param pageSizeOptions Text for the page size options input.
#'   Takes a `{rows}` parameter for the page size options input.
#' @param pageNextLabel Accessible label for the next page button.
#' @param pagePreviousLabel Accessible label for the previous page button.
#' @param pageNumberLabel Accessible label for the page number buttons.
#'   Only used with the the `"numbers"` pagination type.
#'   Takes a `{page}` parameter for the page number.
#' @param pageJumpLabel Accessible label for the page jump input. Only used with
#'   the `"jump"` pagination type.
#' @param pageSizeOptionsLabel Accessible label for the page size options input.
#'
#' @param groupExpandLabel Accessible label for the row group expand button.
#'
#' @param detailsExpandLabel Accessible label for the row details expand button.
#'
#' @param selectAllRowsLabel Accessible label for the select all rows checkbox.
#' @param selectAllSubRowsLabel Accessible label for the select all sub rows checkbox.
#' @param selectRowLabel Accessible label for the select row checkbox.
#'
#' @param defaultGroupHeader Deprecated and no longer used.
#' @param detailsCollapseLabel Deprecated and no longer used.
#' @param deselectAllRowsLabel Deprecated and no longer used.
#' @param deselectAllSubRowsLabel Deprecated and no longer used.
#' @param deselectRowLabel Deprecated and no longer used.
#'
#' @return A language options object that can be used to customize the language
#'   strings in `reactable()`.
#'
#' @usage reactableLang(
#'   sortLabel = "Sort {name}",
#'   filterPlaceholder = "",
#'   filterLabel = "Filter {name}",
#'   searchPlaceholder = "Search",
#'   searchLabel = "Search",
#'   noData = "No rows found",
#'   pageNext = "Next",
#'   pagePrevious = "Previous",
#'   pageNumbers = "{page} of {pages}",
#'   pageInfo = "{rowStart}\u2013{rowEnd} of {rows} rows",
#'   pageSizeOptions = "Show {rows}",
#'   pageNextLabel = "Next page",
#'   pagePreviousLabel = "Previous page",
#'   pageNumberLabel = "Page {page}",
#'   pageJumpLabel = "Go to page",
#'   pageSizeOptionsLabel = "Rows per page",
#'   groupExpandLabel = "Toggle group",
#'   detailsExpandLabel = "Toggle details",
#'   selectAllRowsLabel = "Select all rows",
#'   selectAllSubRowsLabel = "Select all rows in group",
#'   selectRowLabel = "Select row",
#'   defaultGroupHeader = NULL,
#'   detailsCollapseLabel = NULL,
#'   deselectAllRowsLabel = NULL,
#'   deselectAllSubRowsLabel = NULL,
#'   deselectRowLabel = NULL
#' )
#'
#' @examples
#' reactable(
#'   iris[1:30, ],
#'   searchable = TRUE,
#'   paginationType = "simple",
#'   language = reactableLang(
#'     searchPlaceholder = "Search...",
#'     noData = "No entries found",
#'     pageInfo = "{rowStart}\u2013{rowEnd} of {rows} entries",
#'     pagePrevious = "\u276e",
#'     pageNext = "\u276f",
#'
#'     # Accessible labels for assistive technology, such as screen readers
#'     pagePreviousLabel = "Previous page",
#'     pageNextLabel = "Next page"
#'   )
#' )
#'
#' # Set the default language for all tables
#' options(reactable.language = reactableLang(
#'   searchPlaceholder = "Search...",
#'   noData = "No entries found",
#'   pageInfo = "{rowStart} to {rowEnd} of {rows} entries"
#' ))
#'
#' reactable(iris[1:30, ], searchable = TRUE)
#'
#' @export
reactableLang <- function(
  # Sorting
  sortLabel = "Sort {name}",

  # Filters
  filterPlaceholder = "",
  filterLabel = "Filter {name}",

  # Search
  searchPlaceholder = "Search",
  searchLabel = "Search",

  # Tables
  noData = "No rows found",

  # Pagination
  pageNext = "Next",
  pagePrevious = "Previous",
  pageNumbers = "{page} of {pages}",
  pageInfo = "{rowStart}\u2013{rowEnd} of {rows} rows",
  pageSizeOptions = "Show {rows}",
  pageNextLabel = "Next page",
  pagePreviousLabel = "Previous page",
  pageNumberLabel = "Page {page}",
  pageJumpLabel = "Go to page",
  pageSizeOptionsLabel = "Rows per page",

  # Row grouping
  groupExpandLabel = "Toggle group",

  # Row details
  detailsExpandLabel = "Toggle details",

  # Selection
  selectAllRowsLabel = "Select all rows",
  selectAllSubRowsLabel = "Select all rows in group",
  selectRowLabel = "Select row",

  # Deprecated and no longer used (in v0.3.0)
  defaultGroupHeader = NULL,
  detailsCollapseLabel = NULL,
  deselectAllRowsLabel = NULL,
  deselectAllSubRowsLabel = NULL,
  deselectRowLabel = NULL
) {

  if (!is.null(defaultGroupHeader)) {
    warning(
      "`defaultGroupHeader` is deprecated and no longer used. ",
      "Use the `columnGroups` argument in `reactable()` to customize the column ",
      "group header for `groupBy` columns."
    )
  }
  if (!is.null(detailsCollapseLabel)) {
    warning("`detailsCollapseLabel` is deprecated and no longer used. ",
            "Use the `detailsExpandLabel` argument to customize the accessible label ",
            "for the row details expand button.")
  }
  if (!is.null(deselectAllRowsLabel)) {
    warning("`deselectAllRowsLabel` is deprecated and no longer used. ",
            "Use the `selectAllRowsLabel` argument to customize the accessible label ",
            "for the select all rows checkbox.")
  }
  if (!is.null(deselectAllSubRowsLabel)) {
    warning("`deselectAllSubRowsLabel` is deprecated and no longer used. ",
            "Use the `selectAllSubRowsLabel` argument to customize the accessible label ",
            "for the select all sub rows checkbox.")
  }
  if (!is.null(deselectRowLabel)) {
    warning("`deselectRowLabel` is deprecated and no longer used. ",
            "Use the `selectRowLabel` argument to customize the accessible label ",
            "for the select row checkbox.")
  }

  defaultArgs <- formals()
  args <- as.list(match.call())
  args <- args[names(args) %in% names(defaultArgs)]

  for (arg in names(args)) {
    value <- get(arg)
    if (!is.null(value) && !is.character(value)) {
      stop(sprintf("`%s` must be a character string", arg))
    }
    args[[arg]] <- value
  }
  lang <- filterNulls(args)
  structure(lang, class = "reactableLang")
}

is.reactableLang <- function(x) {
  inherits(x, "reactableLang")
}
