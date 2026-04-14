#' V8 Server Backend
#'
#' Uses V8 (server-side JavaScript) for table data processing in Shiny apps.
#' This is the default server-side backend.
#'
#' @return A backend object to pass to the `backend` argument of [reactable()].
#'
#' @examples
#' \dontrun{
#' reactable(data, backend = backendV8())
#' }
#'
#' @export
backendV8 <- function() {
  private <- new.env(parent = emptyenv())

  structure(list(
    init = function(
      data = NULL,
      columns = NULL,
      pagination = NULL,
      paginateSubRows = NULL,
      searchMethod = NULL,
      ...
    ) {

      if (!requireNamespace("V8", quietly = TRUE)) {
        stop('The V8 package must be installed to use `reactable(backend = backendV8())`.
Do you need to run `install.packages("V8")`?', call. = FALSE)
      }
      # Initialize V8 and set initial props to reduce overhead of JSON serialization,
      # which can be significant for large datasets.
      start <- Sys.time()
      ctx <- V8::v8()
      ctx$source(system.file("htmlwidgets/reactable.server.js", package = "reactable", mustWork = TRUE))
      if (isTRUE(getOption("reactable.debug"))) {
        ctx$call("Reactable.enableDebugLogging")
      }
      attribs <- filterNulls(list(
        data = data,
        columns = columns,
        pagination = pagination,
        paginateSubRows = paginateSubRows,
        searchMethod = searchMethod
      ))

      evals <- htmlwidgets::JSEvals(attribs)
      evals <- if (length(evals) > 0) evals else NULL

      input <- filterNulls(list(
        props = attribs,
        evals = evals
      ))
      ctx$call("Reactable.setInitialProps", toJSON(input))
      private$ctx <- ctx
      end <- Sys.time()
      debugLog(sprintf("(backendV8) init time: %s", format(end - start)))
    },

    data = function(
      pageIndex = 0,
      pageSize = 0,
      sortBy = NULL,
      filters = NULL,
      searchValue = NULL,
      groupBy = NULL,
      expanded = NULL,
      ...
    ) {

      attribs <- filterNulls(list(
        pageIndex = pageIndex,
        pageSize = pageSize,
        filters = filters,
        searchValue = searchValue,
        sortBy = sortBy,
        groupBy = asJSONList(groupBy),
        expanded = expanded
      ))

      evals <- htmlwidgets::JSEvals(attribs)
      evals <- if (length(evals) > 0) evals else NULL

      input <- filterNulls(list(
        props = attribs,
        evals = evals
      ))

      result <- tryCatch({
        start <- Sys.time()
        input <- toJSON(input)
        result <- private$ctx$call("Reactable.renderToData", input)
        end <- Sys.time()
        debugLog(sprintf("(backendV8) Reactable.renderToData() time: %s", format(end - start)))
        result
      }, error = function(e) {
        stop(sprintf("Failed to server render table:\n%s", e), call. = FALSE)
      })

      # NOTE: Empty results come back as an empty array right now, rather than a
      # object of columns (empty data frame). This coincidentally works fine, but
      # could be fixed in the future.
      if (identical(result$data, list())) {
        result$data <- data.frame()
      }

      return(resolvedData(
        result$data,
        rowCount = result$rowCount,
        maxRowCount = result$maxRowCount
      ))
    }
  ), class = "reactable_backendV8")
}

#' @exportS3Method
reactableServerInit.reactable_backendV8 <- function(x, ...) {
  x$init(...)
}

#' @exportS3Method
reactableServerData.reactable_backendV8 <- function(x, data = NULL, columns = NULL,
                                                    pageIndex = 0, pageSize = 0,
                                                    sortBy = NULL, filters = NULL,
                                                    searchValue = NULL, searchMethod = NULL,
                                                    groupBy = NULL, pagination = NULL,
                                                    paginateSubRows = NULL, selectAll = NULL,
                                                    expanded = NULL, ...) {
  # Handle select-all request using R data frame operations (V8 JS engine
  # doesn't need to be involved for this).
  if (isTRUE(selectAll) && !is.null(data)) {
    data[["_reactable_rowid"]] <- seq_len(nrow(data)) - 1L
    if (length(filters) > 0) {
      data <- dfFilter(data, filters)
    }
    if (!is.null(searchValue)) {
      data <- dfGlobalSearch(data, searchValue)
    }
    rowIds <- as.character(data[["_reactable_rowid"]])
    return(structure(list(rowIds = rowIds), class = "reactable_selectAllResult"))
  }
  x$data(
    pageIndex = pageIndex, pageSize = pageSize, sortBy = sortBy,
    filters = filters, searchValue = searchValue, groupBy = groupBy,
    expanded = expanded, ...
  )
}
