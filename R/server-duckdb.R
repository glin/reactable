# DuckDB server backend for Shiny. Uses the DuckDB R package for fast SQL-based
# sorting, filtering, searching, and pagination. Data stays on the R server.
#
# Uses duckdb_register() for zero-copy data access — DuckDB reads directly from
# the R data frame's memory without copying.

serverDuckdb <- function() {
  private <- new.env(parent = emptyenv())
  structure(list(private = private), class = "reactable_serverDuckdb")
}

reactableServerInit.reactable_serverDuckdb <- function(x, data = NULL, columns = NULL, ...) {
  if (!requireNamespace("duckdb", quietly = TRUE) || !requireNamespace("DBI", quietly = TRUE)) {
    stop('The duckdb and DBI packages must be installed to use the DuckDB server backend.\n',
         'Install with: install.packages(c("duckdb", "DBI"))', call. = FALSE)
  }

  con <- DBI::dbConnect(duckdb::duckdb())
  # Zero-copy registration — DuckDB reads directly from R data frame memory
  duckdb::duckdb_register(con, "reactable_data", data)
  x$private$con <- con
  x$private$columns <- columns
}

reactableServerData.reactable_serverDuckdb <- function(
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
  con <- x$private$con
  cols <- x$private$columns

  query <- buildDuckdbQuery(
    tableName = "reactable_data",
    columns = cols,
    filters = filters,
    searchValue = searchValue,
    sortBy = sortBy,
    pageIndex = pageIndex,
    pageSize = pageSize
  )

  # Execute data and count queries with parameterized values
  page <- DBI::dbGetQuery(con, query$sql, params = query$params)
  countResult <- DBI::dbGetQuery(con, query$countSql, params = query$params)
  rowCount <- countResult$n

  resolvedData(page, rowCount = rowCount)
}
