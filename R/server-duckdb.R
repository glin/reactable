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
