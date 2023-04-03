serverDt <- function() {
  structure(list(), class = "reactable_serverDt")
}

reactableServerInit.reactable_serverDt <- function(...) {
  if (!require("data.table", quietly = TRUE)) {
    stop('The data.table package must be installed to use the "dt" server backend.
Do you need to run `install.packages("data.table")`?', call. = FALSE)
  }
}

reactableServerData.reactable_serverDt <- function(
  x,
  data = NULL,
  columns = NULL,
  pageIndex = 0,
  pageSize = 0,
  sortBy = NULL,
  filters = NULL,
  searchValue = NULL,
  groupBy = NULL,
  pagination = NULL,
  paginateSubRows = NULL,
  # Unused/unimplemented props
  selectedRowIds = NULL,
  expanded = NULL,
  searchMethod = NULL,
  ...
) {

  data <- data.table::as.data.table(data)

  # Column filters - simple text match for now
  if (length(filters) > 0) {
    data <- dfFilter(data, filters)
  }

  # Global searching - simple text match for now
  if (!is.null(searchValue)) {
    data <- dfGlobalSearch(data, searchValue)
  }

  # Sorting
  if (length(sortBy) > 0) {
    data <- data.table::copy(data)
    cols <- sapply(sortBy, function(col) col$id)
    order <- sapply(sortBy, function(col) if (isTRUE(col$desc)) -1 else 1)
    data <- data.table::setorderv(data, cols = cols, order = order)
  }

  # Grouping and aggregation
  if (length(groupBy) > 0) {
    data <- data[, list(.subRows = list(.SD)), by = c(unlist(groupBy))]
  }

  # Pagination
  dfPaginate(data, pageIndex = pageIndex, pageSize = pageSize)
}
