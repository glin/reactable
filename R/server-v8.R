serverV8 <- function() {
  private <- new.env(parent = emptyenv())

  list(
    init = function(
      data = NULL,
      columns = NULL,
      pagination = NULL,
      paginateSubRows = NULL,
      searchMethod = NULL,
      ...
    ) {

      if (!requireNamespace("V8", quietly = TRUE)) {
        stop('The V8 package must be installed to use `reactable(server = TRUE)`.
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
      debugLog(sprintf("(serverV8) init time: %s", format(end - start)))
    },

    data = function(
      pageIndex = 0,
      pageSize = NULL,
      sortBy = NULL,
      filters = NULL,
      searchValue = NULL,
      groupBy = NULL,
      # TODO currently unused/unimplemented props
      selectedRowIds = NULL,
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
        # Currently unused
        selectedRowIds = selectedRowIds,
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
        debugLog(sprintf("(serverV8) Reactable.renderToData() time: %s", format(end - start)))
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
  )
}
