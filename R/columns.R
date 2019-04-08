#' Column definitions
#'
#' @param name Name of the column.
#' @param aggregate Aggregate function name or JS callback.
#' @param aggregated Render function for aggregated cells.
#' @param sortable Enable sorting? Overrides the table option.
#' @param resizable Enable column resizing? Overrides the table option.
#' @param filterable Enable column filtering? Overrides the table option.
#' @param show Show the column? Defaults to `TRUE`.
#' @param defaultSortOrder Default sort order. Either `"asc"` for ascending
#'   order or `"desc"` for descending order. Overrides the table option.
#' @param class Additional CSS classes to apply to cells.
#' @param style Named list of inline styles to apply to cells.
#' @param headerClass Additional CSS classes to apply to the header.
#' @param headerStyle Named list of inline styles to apply to the header.
#' @export
colDef <- function(name = NULL, aggregate = NULL, aggregated = NULL,
                   sortable = NULL, resizable = NULL, filterable = NULL,
                   show = TRUE, defaultSortOrder = NULL, class = NULL,
                   style = NULL, headerClass = NULL, headerStyle = NULL) {

  if (!is.null(name) && !is.character(name)) {
    stop("`name` must be a character")
  }
  if (!is.null(aggregate) && !is.character(aggregate) && !is.JS(aggregate)) {
    stop("`aggregate` must be a character or JS callback")
  }
  if (!is.null(aggregated) && !is.JS(aggregated)) {
    stop("`aggregated` must be a JS callback")
  }
  if (!is.null(sortable) && !is.logical(sortable)) {
    stop("`sortable` must be TRUE or FALSE")
  }
  if (!is.null(resizable) && !is.logical(resizable)) {
    stop("`resizable` must be TRUE or FALSE")
  }
  if (!is.null(filterable) && !is.logical(filterable)) {
    stop("`filterable` must be TRUE or FALSE")
  }
  if (!is.null(show) && !is.logical(show)) {
    stop("`show` must be TRUE or FALSE")
  }
  if (!is.null(defaultSortOrder) && !isSortOrder(defaultSortOrder)) {
    stop('`defaultSortOrder` must be "asc" or "desc"')
  }
  if (!is.null(class) && !is.character(class)) {
    stop("`class` must be a character")
  }
  if (!is.null(style) && !isNamedList(style)) {
    stop("`style` must be a named list")
  }
  if (!is.null(headerClass) && !is.character(headerClass)) {
    stop("`headerClass` must be a character")
  }
  if (!is.null(headerStyle) && !isNamedList(headerStyle)) {
    stop("`headerStyle` must be a named list")
  }

  structure(
    list(
      Header = name,
      aggregate = aggregate,
      Aggregated = aggregated,
      sortable = sortable,
      resizable = resizable,
      filterable = filterable,
      show = show,
      defaultSortDesc = if (!is.null(defaultSortOrder)) isDescOrder(defaultSortOrder),
      className = class,
      style = style,
      headerClassName = headerClass,
      headerStyle = headerStyle
    ),
    class = "colDef"
  )
}

is.colDef <- function(x) {
  inherits(x, "colDef")
}

#' Column group definitions
#'
#' @param name Name of the column group.
#' @param columns Character vector of column names to group.
#' @param headerClass Additional CSS classes to apply to the header.
#' @param headerStyle Named list of inline styles to apply to the header.
#' @export
colGroup <- function(name, columns, headerClass = NULL, headerStyle = NULL) {
  if (!is.character(columns)) {
    stop("`columns` must be a character vector")
  }
  group <- colDef(name = name, headerClass = headerClass, headerStyle = headerStyle)
  group$columns <- columns
  group <- filterNulls(group)
  structure(group, class = "colGroup")
}

is.colGroup <- function(x) {
  inherits(x, "colGroup")
}

isSortOrder <- function(x) {
  is.character(x) && x %in% c("asc", "desc")
}

isDescOrder <- function(x) {
  is.character(x) && x == "desc"
}
