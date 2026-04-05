#' DuckDB Backend
#'
#' Use DuckDB for table data processing. In static documents (R Markdown, Quarto),
#' uses DuckDB-WASM in the browser for client-side sorting, filtering, and pagination
#' via SQL. In Shiny, uses the DuckDB R package on the server.
#'
#' @param mode One of `"auto"`, `"client"`, or `"server"`:
#'   \describe{
#'     \item{`"auto"` (default)}{Automatically detects the rendering context.
#'       Uses DuckDB-WASM client-side in static documents, or the DuckDB R package
#'       server-side in Shiny apps.}
#'     \item{`"client"`}{Always uses DuckDB-WASM in the browser. Data is serialized
#'       as Arrow IPC and sent to the client.}
#'     \item{`"server"`}{Always uses the DuckDB R package on the server. Only works
#'       in Shiny apps.}
#'   }
#' @param format Data format for client-side mode. One of `"auto"`, `"arrow"`, or `"parquet"`:
#'   \describe{
#'     \item{`"auto"` (default)}{Uses Arrow IPC for small datasets and Parquet sidecar
#'       files for larger datasets (over ~20 MB). Parquet files are served via HTTP range
#'       requests so the browser only downloads the data it needs for each page.}
#'     \item{`"arrow"`}{Always embeds data as base64-encoded Arrow IPC in the HTML document.}
#'     \item{`"parquet"`}{Always writes a Parquet sidecar file alongside the HTML document.
#'       Only works with `self_contained: false` output.}
#'   }
#'
#'   The `format` option only applies in client-side mode (DuckDB-WASM in the browser).
#'   In server mode, data stays in R memory and this option is ignored.
#'
#' @return A backend object to pass to the `backend` argument of [reactable()].
#'
#' @note
#' **Required packages:**
#' \itemize{
#'   \item Client mode requires the \pkg{arrow} package.
#'   \item Server mode requires the \pkg{duckdb} and \pkg{DBI} packages.
#' }
#'
#' The DuckDB backend does not support:
#' \itemize{
#'   \item Custom `searchMethod` or column `filterMethod` (SQL-based search/filter is used instead)
#'   \item Custom JavaScript `aggregate` functions (use built-in aggregate names like `"sum"`, `"mean"`)
#'   \item R function renderers for `cell`, `details`, `style`, `class`, `rowClass`, `rowStyle`
#'     (use `JS()` function renderers instead)
#'   \item Row selection
#' }
#'
#' @examples
#' \dontrun{
#' # Auto-detection: WASM in static docs, server in Shiny
#' reactable(data, backend = backendDuckDB())
#'
#' # Force client-side (DuckDB-WASM)
#' reactable(data, backend = backendDuckDB("client"))
#'
#' # Force server-side (DuckDB R package, Shiny only)
#' reactable(data, backend = backendDuckDB("server"))
#'
#' # Always use Parquet sidecar files (for large datasets)
#' reactable(data, backend = backendDuckDB(format = "parquet"))
#'
#' # Always embed Arrow IPC (for self-contained output)
#' reactable(data, backend = backendDuckDB(format = "arrow"))
#' }
#'
#' @export
backendDuckDB <- function(mode = c("auto", "client", "server"),
                          format = c("auto", "arrow", "parquet")) {
  mode <- match.arg(mode)
  format <- match.arg(format)
  structure(list(mode = mode, format = format), class = "reactable_backendDuckDB")
}

isDuckDBBackend <- function(x) {
  inherits(x, "reactable_backendDuckDB")
}

# Resolve "auto" mode to "client" or "server" based on rendering context
resolveDuckDBMode <- function(backend) {
  if (backend$mode != "auto") return(backend$mode)
  session <- NULL
  if (requireNamespace("shiny", quietly = TRUE)) {
    session <- shiny::getDefaultReactiveDomain()
  }
  if (!is.null(session)) "server" else "client"
}

# DuckDB server backend for Shiny. Uses the DuckDB R package for fast SQL-based
# sorting, filtering, searching, and pagination. Data stays on the R server.
#
# Uses duckdb_register() for zero-copy data access -- DuckDB reads directly from
# the R data frame's memory without copying.

backendDuckdbServer <- function() {
  private <- new.env(parent = emptyenv())
  structure(list(private = private), class = "reactable_backendDuckdb")
}

#' @exportS3Method
reactableServerInit.reactable_backendDuckdb <- function(x, data = NULL, columns = NULL, ...) {
  if (!requireNamespace("duckdb", quietly = TRUE) || !requireNamespace("DBI", quietly = TRUE)) {
    stop('The duckdb and DBI packages must be installed to use the DuckDB server backend.\n',
         'Install with: install.packages(c("duckdb", "DBI"))', call. = FALSE)
  }

  con <- DBI::dbConnect(duckdb::duckdb())
  # Zero-copy registration - DuckDB reads directly from R data frame memory
  duckdb::duckdb_register(con, "reactable_data", data)
  x$private$con <- con
  x$private$columns <- columns
}

#' @exportS3Method
reactableServerData.reactable_backendDuckdb <- function(
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

  if (length(groupBy) > 0) {
    return(duckdbGroupedQuery(con, cols, filters, searchValue, sortBy,
                              pageIndex, pageSize, groupBy))
  }

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

# Execute a grouped query: GROUP BY for top level, then sub-rows for each group.
# Returns resolvedData with nested .subRows matching the server-df format.
duckdbGroupedQuery <- function(con, columns, filters, searchValue, sortBy,
                                pageIndex, pageSize, groupBy,
                                depth = 0, parentFilters = list(clauses = character(0), params = list())) {
  groupCol <- groupBy[[depth + 1]]
  groupedCols <- groupBy[seq_len(depth + 1)]
  baseWhere <- buildDuckdbWhere(columns, filters, searchValue)

  # Build SELECT with group column + SQL aggregates
  escapedGroupCol <- duckdbQuoteIdentifier(groupCol)
  selectParts <- escapedGroupCol
  postComputeAggs <- list()

  for (col in columns) {
    if (col$id %in% groupedCols) next
    aggregate <- col$aggregate
    if (is.null(aggregate) || is.function(aggregate)) next
    sqlExpr <- duckdbAggregateSQL(aggregate, col$id)
    if (!is.null(sqlExpr)) {
      selectParts <- c(selectParts, paste0(sqlExpr, " AS ", duckdbQuoteIdentifier(col$id)))
    } else {
      postComputeAggs <- c(postComputeAggs, list(list(id = col$id, aggregate = aggregate)))
    }
  }

  allClauses <- c(baseWhere$clauses, parentFilters$clauses)
  allParams <- c(baseWhere$params, parentFilters$params)
  whereStr <- if (length(allClauses) > 0) {
    paste0(" WHERE ", paste(allClauses, collapse = " AND "))
  } else {
    ""
  }

  groupSql <- paste0("SELECT ", paste(selectParts, collapse = ", "),
                      " FROM reactable_data", whereStr,
                      " GROUP BY ", escapedGroupCol)

  # Sort
  sortClauses <- buildDuckdbGroupSortClauses(sortBy, groupCol, columns, groupedCols)
  if (length(sortClauses) > 0) {
    groupSql <- paste0(groupSql, " ORDER BY ", paste(sortClauses, collapse = ", "))
  }

  # Paginate only at top level
  if (depth == 0) {
    countSql <- paste0("SELECT COUNT(DISTINCT ", escapedGroupCol, ") AS n FROM reactable_data",
                        whereStr)
    countResult <- DBI::dbGetQuery(con, countSql, params = allParams)
    rowCount <- countResult$n

    groupSql <- paste0(groupSql, " LIMIT ", as.integer(pageSize),
                        " OFFSET ", as.integer(pageIndex) * as.integer(pageSize))
  }

  groupData <- DBI::dbGetQuery(con, groupSql, params = allParams)

  if (nrow(groupData) == 0) {
    if (depth == 0) {
      return(resolvedData(groupData, rowCount = 0L))
    }
    return(groupData)
  }

  # Fetch sub-rows for each group
  groupValues <- groupData[[groupCol]]
  subRowsList <- vector("list", length(groupValues))

  for (i in seq_along(groupValues)) {
    childFilters <- list(
      clauses = c(parentFilters$clauses, paste0(escapedGroupCol, " = ?")),
      params = c(parentFilters$params, list(groupValues[[i]]))
    )

    if (depth + 1 < length(groupBy)) {
      # More grouping levels — recurse
      subResult <- duckdbGroupedQuery(con, columns, filters, searchValue, sortBy,
                                       pageIndex = 0, pageSize = .Machine$integer.max,
                                       groupBy, depth = depth + 1,
                                       parentFilters = childFilters)
      if (inherits(subResult, "reactable_resolvedData")) {
        subRowsList[[i]] <- subResult$data
      } else {
        subRowsList[[i]] <- subResult
      }
    } else {
      # Leaf level — fetch individual rows
      subQuery <- buildDuckdbSubRowSql("reactable_data", baseWhere, childFilters, sortBy)
      subRowsList[[i]] <- DBI::dbGetQuery(con, subQuery$sql, params = subQuery$params)
    }

    # Post-compute aggregates from sub-row data (e.g. frequency)
    for (agg in postComputeAggs) {
      subRows <- subRowsList[[i]]
      if (agg$id %in% colnames(subRows)) {
        groupData[i, agg$id] <- duckdbComputeAggregate(agg$aggregate, subRows[[agg$id]])
      }
    }
  }

  groupData[[".subRows"]] <- subRowsList

  if (depth == 0) {
    resolvedData(groupData, rowCount = rowCount)
  } else {
    groupData
  }
}
