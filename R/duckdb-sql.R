# Shared DuckDB SQL query builder used by the R server backend.
# The SQL generated here must match the JS DuckDBEngine.query() behavior exactly
# so that client-side (WASM) and server-side (R) produce identical results.

buildDuckdbQuery <- function(tableName, columns, filters, searchValue, sortBy,
                             pageIndex, pageSize) {
  result <- buildDuckdbWhere(columns, filters, searchValue)
  sql <- paste0("SELECT * FROM ", tableName, result$where)
  countSql <- paste0("SELECT COUNT(*) AS n FROM ", tableName, result$where)

  # Sort
  if (length(sortBy) > 0) {
    orderClauses <- vapply(sortBy, function(s) {
      col <- duckdbQuoteIdentifier(s$id)
      dir <- if (isTRUE(s$desc)) "DESC" else "ASC"
      paste(col, dir, "NULLS LAST")
    }, character(1))
    sql <- paste0(sql, " ORDER BY ", paste(orderClauses, collapse = ", "))
  }

  # Pagination
  sql <- paste0(sql, " LIMIT ", as.integer(pageSize),
                " OFFSET ", as.integer(pageIndex) * as.integer(pageSize))

  list(sql = sql, countSql = countSql, params = result$params)
}

buildDuckdbWhere <- function(columns, filters, searchValue) {
  whereClauses <- character(0)
  params <- list()

  # Column filters
  if (length(filters) > 0) {
    for (filter in filters) {
      col <- duckdbQuoteIdentifier(filter$id)
      columnMeta <- Find(function(c) c$id == filter$id, columns)
      if (!is.null(columnMeta) && identical(columnMeta$type, "numeric")) {
        # Numeric: starts-with matching (same as JS DuckDBEngine)
        whereClauses <- c(whereClauses, paste0("CAST(", col, " AS VARCHAR) LIKE ? || '%'"))
      } else {
        # Text: case-insensitive substring (same as JS DuckDBEngine)
        whereClauses <- c(whereClauses, paste0("CAST(", col, " AS VARCHAR) ILIKE '%' || ? || '%'"))
      }
      params <- c(params, list(filter$value))
    }
  }

  # Global search — OR across all searchable columns
  if (!is.null(searchValue) && nzchar(searchValue)) {
    searchCols <- Filter(function(c) !isTRUE(c$disableGlobalFilter), columns)
    if (length(searchCols) > 0) {
      orClauses <- vapply(searchCols, function(c) {
        col <- duckdbQuoteIdentifier(c$id)
        if (identical(c$type, "numeric")) {
          paste0("CAST(", col, " AS VARCHAR) LIKE ? || '%'")
        } else {
          paste0("CAST(", col, " AS VARCHAR) ILIKE '%' || ? || '%'")
        }
      }, character(1))
      whereClauses <- c(whereClauses, paste0("(", paste(orClauses, collapse = " OR "), ")"))
      params <- c(params, as.list(rep(searchValue, length(searchCols))))
    }
  }

  where <- ""
  if (length(whereClauses) > 0) {
    where <- paste0(" WHERE ", paste(whereClauses, collapse = " AND "))
  }
  list(where = where, params = params)
}

# Quote a column identifier for DuckDB SQL. Double any existing double quotes,
# then wrap in double quotes. Matches the JS escapeIdentifier() exactly.
duckdbQuoteIdentifier <- function(name) {
  paste0('"', gsub('"', '""', name, fixed = TRUE), '"')
}
