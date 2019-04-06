#' Column definitions
#'
#' @param name Column name.
#' @param aggregate Aggregate function name or JS callback.
#' @param aggregated Render function for aggregated cells.
#' @param sortable Enable sorting? Overrides the table option.
#' @param resizable Enable column resizing? Overrides the table option.
#' @param filterable Enable column filtering? Overrides the table option.
#' @param show Show the column? Defaults to `TRUE`.
#' @export
colDef <- function(name = NULL, aggregate = NULL, aggregated = NULL,
                   sortable = NULL, resizable = NULL, filterable = NULL,
                   show = TRUE) {

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

  structure(
    list(
      Header = name,
      aggregate = aggregate,
      Aggregated = aggregated,
      sortable = sortable,
      resizable = resizable,
      filterable = filterable,
      show = show
    ),
    class = "colDef"
  )
}

is.colDef <- function(x) {
  inherits(x, "colDef")
}
