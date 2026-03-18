# Shared DuckDB SQL query builder used by the R server backend.
# The SQL generated here must match the JS DuckDBBackend.query() behavior exactly
# so that client-side (WASM) and server-side (R) produce identical results.

buildDuckdbQuery <- function(tableName, columns, filters, searchValue, sortBy,
                             pageIndex, pageSize, groupBy = NULL) {
  if (length(groupBy) > 0) {
    return(buildDuckdbGroupedQuery(tableName, columns, filters, searchValue, sortBy,
                                   pageIndex, pageSize, groupBy))
  }

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
        # Numeric: starts-with matching (same as JS DuckDBBackend)
        whereClauses <- c(whereClauses, paste0("CAST(", col, " AS VARCHAR) LIKE ? || '%'"))
      } else {
        # Text: case-insensitive substring (same as JS DuckDBBackend)
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
  list(where = where, clauses = whereClauses, params = params)
}

# Quote a column identifier for DuckDB SQL. Double any existing double quotes,
# then wrap in double quotes. Matches the JS escapeIdentifier() exactly.
duckdbQuoteIdentifier <- function(name) {
  paste0('"', gsub('"', '""', name, fixed = TRUE), '"')
}

# Build a grouped query with GROUP BY, aggregation, and sub-row fetching.
# Returns list(groupSql, countSql, subRowSql, params, countParams, subRowParams,
#              groupBy, columns, depth, postComputeAggs)
buildDuckdbGroupedQuery <- function(tableName, columns, filters, searchValue, sortBy,
                                     pageIndex, pageSize, groupBy) {
  baseWhere <- buildDuckdbWhere(columns, filters, searchValue)
  groupCol <- groupBy[[1]]
  escapedGroupCol <- duckdbQuoteIdentifier(groupCol)
  groupedCols <- groupBy[1]

  # Build SELECT with group column + SQL aggregates
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

  whereStr <- baseWhere$where
  groupSql <- paste0("SELECT ", paste(selectParts, collapse = ", "),
                      " FROM ", tableName, whereStr,
                      " GROUP BY ", escapedGroupCol)

  # Count total groups
  countSql <- paste0("SELECT COUNT(DISTINCT ", escapedGroupCol, ") AS n FROM ",
                      tableName, whereStr)

  # Sort: only by group column or aggregated columns
  sortClauses <- buildDuckdbGroupSortClauses(sortBy, groupCol, columns, groupedCols)
  if (length(sortClauses) > 0) {
    groupSql <- paste0(groupSql, " ORDER BY ", paste(sortClauses, collapse = ", "))
  }

  # Paginate
  groupSql <- paste0(groupSql, " LIMIT ", as.integer(pageSize),
                      " OFFSET ", as.integer(pageIndex) * as.integer(pageSize))

  list(
    groupSql = groupSql,
    countSql = countSql,
    params = baseWhere$params,
    tableName = tableName,
    groupBy = groupBy,
    columns = columns,
    sortBy = sortBy,
    baseWhere = baseWhere,
    postComputeAggs = postComputeAggs
  )
}

# Build sub-row SQL for a set of group values at the leaf level.
buildDuckdbSubRowSql <- function(tableName, baseWhere, parentFilters, sortBy) {
  allClauses <- c(baseWhere$clauses, parentFilters$clauses)
  allParams <- c(baseWhere$params, parentFilters$params)
  whereStr <- ""
  if (length(allClauses) > 0) {
    whereStr <- paste0(" WHERE ", paste(allClauses, collapse = " AND "))
  }
  sql <- paste0("SELECT * FROM ", tableName, whereStr)

  if (length(sortBy) > 0) {
    leafSorts <- vapply(sortBy, function(s) {
      paste(duckdbQuoteIdentifier(s$id),
            if (isTRUE(s$desc)) "DESC" else "ASC",
            "NULLS LAST")
    }, character(1))
    sql <- paste0(sql, " ORDER BY ", paste(leafSorts, collapse = ", "))
  }

  list(sql = sql, params = allParams)
}

# Build ORDER BY clauses for a GROUP BY query. Only includes sortBy columns that
# are the group column or have SQL-computable aggregates.
buildDuckdbGroupSortClauses <- function(sortBy, groupCol, columns, groupedCols) {
  if (length(sortBy) == 0) return(character(0))
  clauses <- character(0)
  for (s in sortBy) {
    dir <- if (isTRUE(s$desc)) "DESC" else "ASC"
    if (identical(s$id, groupCol)) {
      clauses <- c(clauses, paste(duckdbQuoteIdentifier(s$id), dir, "NULLS LAST"))
    } else {
      col <- Find(function(c) identical(c$id, s$id), columns)
      if (!is.null(col) && !is.null(col$aggregate) && is.character(col$aggregate) &&
          !col$id %in% groupedCols) {
        sqlExpr <- duckdbAggregateSQL(col$aggregate, col$id)
        if (!is.null(sqlExpr)) {
          clauses <- c(clauses, paste(sqlExpr, dir, "NULLS LAST"))
        }
      }
    }
  }
  clauses
}

# Map a reactable aggregate function name to a SQL expression.
# Returns NULL for aggregates that can't be expressed in SQL.
duckdbAggregateSQL <- function(aggregate, columnId) {
  col <- duckdbQuoteIdentifier(columnId)
  switch(aggregate,
    "sum" = paste0("SUM(", col, ")"),
    "mean" = paste0("AVG(", col, ")"),
    "max" = paste0("MAX(", col, ")"),
    "min" = paste0("MIN(", col, ")"),
    "median" = paste0("MEDIAN(", col, ")"),
    "count" = paste0("COUNT(", col, ")"),
    "unique" = paste0("STRING_AGG(DISTINCT CAST(", col, " AS VARCHAR), ', ')"),
    NULL  # frequency and unknown aggregates are computed from sub-rows
  )
}

# Compute an aggregate value from sub-row data for aggregates that can't be
# expressed in SQL GROUP BY (e.g. frequency).
duckdbComputeAggregate <- function(aggregate, values) {
  if (identical(aggregate, "frequency")) {
    counts <- as.list(table(values))
    countStrs <- vapply(seq_along(counts), function(i) {
      value <- names(counts)[i]
      count <- counts[[i]]
      sprintf("%s (%s)", value, count)
    }, character(1))
    return(paste(countStrs, collapse = ", "))
  }
  NA
}
