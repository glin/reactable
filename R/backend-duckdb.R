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

  # Add 0-based row IDs for stable row identification across pages
  data[["_reactable_rowid"]] <- seq_len(nrow(data)) - 1L

  if (!is.null(x$private$con)) {
    # Re-initialization with new data: unregister old table and re-register
    duckdb::duckdb_unregister(x$private$con, "reactable_data")
    duckdb::duckdb_register(x$private$con, "reactable_data", data)
  } else {
    con <- DBI::dbConnect(duckdb::duckdb())
    # Zero-copy registration - DuckDB reads directly from R data frame memory
    duckdb::duckdb_register(con, "reactable_data", data)
    x$private$con <- con
  }
  # Filter out virtual columns that don't exist in the data
  x$private$columns <- Filter(function(col) !(col$id %in% virtualColumnIds), columns)
}

#' @exportS3Method
reactableServerSelectAll.reactable_backendDuckdb <- function(x, data = NULL, columns = NULL,
                                                             filters = NULL, searchValue = NULL,
                                                             ...) {
  con <- x$private$con
  cols <- x$private$columns
  query <- buildDuckdbRowIdQuery(
    tableName = "reactable_data",
    columns = cols,
    filters = filters,
    searchValue = searchValue
  )
  result <- DBI::dbGetQuery(con, query$sql, params = query$params)
  rowIds <- as.character(result[["_reactable_rowid"]])
  structure(list(rowIds = rowIds), class = "reactable_selectAllResult")
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
  searchMethod = NULL,
  groupBy = NULL,
  pagination = NULL,
  paginateSubRows = NULL,
  expanded = NULL,
  ...
) {
  con <- x$private$con
  cols <- x$private$columns

  if (length(groupBy) > 0) {
    if (isTRUE(paginateSubRows)) {
      return(duckdbPaginateSubRows(con, cols, filters, searchValue, sortBy,
                                   pageIndex, pageSize, groupBy, expanded))
    }
    return(duckdbGroupedQuery(con, cols, filters, searchValue, sortBy,
                              pageIndex, pageSize, groupBy, expanded))
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

  # Extract _reactable_rowid into __state for stable row identification
  if ("_reactable_rowid" %in% colnames(page)) {
    rowids <- page[["_reactable_rowid"]]
    page[["__state"]] <- dataFrame(
      id = as.character(rowids),
      index = as.integer(rowids)
    )
    page[["_reactable_rowid"]] <- NULL
  }

  resolvedData(page, rowCount = rowCount)
}

# Execute a grouped query: GROUP BY for top level, then sub-rows for each group.
# Returns resolvedData with nested .subRows matching the server-df format.
duckdbGroupedQuery <- function(con, columns, filters, searchValue, sortBy,
                                pageIndex, pageSize, groupBy, expanded = NULL,
                                depth = 0, parentFilters = list(clauses = character(0), params = list()),
                                parentId = NULL) {
  groupCol <- groupBy[[depth + 1]]
  groupedCols <- groupBy[seq_len(depth + 1)]
  baseWhere <- buildDuckdbWhere(columns, filters, searchValue)

  # Build SELECT with group column + COUNT(*) for sub-row counts + SQL aggregates
  escapedGroupCol <- duckdbQuoteIdentifier(groupCol)
  selectParts <- c(escapedGroupCol, "COUNT(*) AS _sub_row_count")
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

  # Sort (default to group column for deterministic ordering)
  sortClauses <- buildDuckdbGroupSortClauses(sortBy, groupCol, columns, groupedCols)
  if (length(sortClauses) == 0) {
    sortClauses <- paste(escapedGroupCol, "ASC NULLS LAST")
  }
  groupSql <- paste0(groupSql, " ORDER BY ", paste(sortClauses, collapse = ", "))

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

  # Extract sub-row counts and remove the helper column
  subRowCounts <- groupData[["_sub_row_count"]]
  groupData[["_sub_row_count"]] <- NULL

  # Classify groups as expanded or collapsed.
  # expanded=NULL means all groups expanded (no lazy fetching, backward compat).
  # expanded=list() means nothing expanded (all collapsed).
  groupValues <- groupData[[groupCol]]
  stateIds <- vapply(groupValues, function(val) paste0(groupCol, ":", val), character(1))
  rowIds <- if (!is.null(parentId)) paste0(parentId, ".", stateIds) else stateIds
  if (is.null(expanded)) {
    isExpanded <- rep(TRUE, length(groupValues))
  } else {
    isExpanded <- vapply(rowIds, function(id) isTRUE(expanded[[id]]), logical(1))
  }

  # Fetch sub-rows only for expanded groups
  subRowsList <- vector("list", length(groupValues))

  for (i in seq_along(groupValues)) {
    if (!isExpanded[[i]]) {
      # Collapsed group: empty sub-rows (subRowCount set in __state below)
      subRowsList[[i]] <- data.frame()
      next
    }

    childFilters <- list(
      clauses = c(parentFilters$clauses, paste0(escapedGroupCol, " = ?")),
      params = c(parentFilters$params, list(groupValues[[i]]))
    )

    if (depth + 1 < length(groupBy)) {
      # More grouping levels - recurse only for expanded groups
      subResult <- duckdbGroupedQuery(con, columns, filters, searchValue, sortBy,
                                       pageIndex = 0, pageSize = .Machine$integer.max,
                                       groupBy, expanded = expanded, depth = depth + 1,
                                       parentFilters = childFilters,
                                       parentId = rowIds[[i]])
      if (inherits(subResult, "reactable_resolvedData")) {
        subRowsList[[i]] <- subResult$data
      } else {
        subRowsList[[i]] <- subResult
      }
    } else {
      # Leaf level - fetch individual rows
      subQuery <- buildDuckdbSubRowSql("reactable_data", baseWhere, childFilters, sortBy)
      subRows <- DBI::dbGetQuery(con, subQuery$sql, params = subQuery$params)
      # Extract _reactable_rowid into __state for stable row identification
      if ("_reactable_rowid" %in% colnames(subRows)) {
        rowids <- subRows[["_reactable_rowid"]]
        subRows[["__state"]] <- dataFrame(
          id = as.character(rowids),
          index = as.integer(rowids)
        )
        subRows[["_reactable_rowid"]] <- NULL
      }
      subRowsList[[i]] <- subRows
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

  # Add __state with group ID for group header rows.
  # Collapsed groups include subRowCount so the expander arrow shows.
  groupData[["__state"]] <- dataFrame(
    id = unname(stateIds),
    grouped = rep(TRUE, length(stateIds)),
    subRowCount = ifelse(isExpanded, NA_integer_, as.integer(subRowCounts))
  )

  if (depth == 0) {
    resolvedData(groupData, rowCount = rowCount)
  } else {
    groupData
  }
}

# Paginate grouped data with paginateSubRows: flatten group headers + sub-rows
# into a single stream and return the slice for the current page.
duckdbPaginateSubRows <- function(con, columns, filters, searchValue, sortBy,
                                   pageIndex, pageSize, groupBy, expanded) {
  expandedMap <- if (is.null(expanded)) list() else expanded
  baseWhere <- buildDuckdbWhere(columns, filters, searchValue)

  # Fetch all groups with sub-row counts and aggregates
  groupTree <- duckdbBuildGroupTree(con, columns, filters, searchValue, sortBy,
                                    groupBy, baseWhere, depth = 0,
                                    parentFilters = list(clauses = character(0), params = list()))

  # Compute flat sizes and total row count
  flatSizes <- duckdbFlatSizes(groupTree, expandedMap, groupBy, depth = 0, parentId = NULL)
  rowCount <- sum(flatSizes)

  # Determine page window
  pageStart <- pageIndex * pageSize
  pageEnd <- pageStart + pageSize

  # Collect rows for the current page
  rows <- duckdbCollectPageRows(con, groupTree, flatSizes, pageStart, pageEnd,
                                 groupBy, baseWhere, sortBy, columns,
                                 depth = 0, parentId = NULL, expandedMap = expandedMap)

  resolvedData(rows, rowCount = rowCount)
}

# Build a group tree: for each group at this level, fetch group header data
# (aggregates, sub-row counts). For non-leaf levels, recurse to build sub-group trees.
duckdbBuildGroupTree <- function(con, columns, filters, searchValue, sortBy,
                                  groupBy, baseWhere, depth, parentFilters) {
  groupCol <- groupBy[[depth + 1]]
  groupedCols <- groupBy[seq_len(depth + 1)]
  isLeafLevel <- depth + 1 >= length(groupBy)

  escapedGroupCol <- duckdbQuoteIdentifier(groupCol)

  # Build SELECT: group column + COUNT(*) + SQL aggregates
  selectParts <- c(escapedGroupCol, "COUNT(*) AS _sub_row_count")
  postComputeAggs <- list()

  # For non-leaf levels, also count distinct sub-groups
  if (!isLeafLevel) {
    nextGroupCol <- groupBy[[depth + 2]]
    selectParts <- c(selectParts,
                     paste0("COUNT(DISTINCT ", duckdbQuoteIdentifier(nextGroupCol),
                            ") AS _sub_group_count"))
  }

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

  # Sort (default to group column for deterministic ordering)
  sortClauses <- buildDuckdbGroupSortClauses(sortBy, groupCol, columns, groupedCols)
  if (length(sortClauses) == 0) {
    sortClauses <- paste(escapedGroupCol, "ASC NULLS LAST")
  }
  groupSql <- paste0(groupSql, " ORDER BY ", paste(sortClauses, collapse = ", "))

  groupData <- DBI::dbGetQuery(con, groupSql, params = allParams)

  if (nrow(groupData) == 0) {
    return(groupData)
  }

  groupValues <- groupData[[groupCol]]

  # Post-compute aggregates that can't be done in SQL (e.g., frequency)
  if (length(postComputeAggs) > 0) {
    for (i in seq_along(groupValues)) {
      childFilters <- list(
        clauses = c(parentFilters$clauses, paste0(escapedGroupCol, " = ?")),
        params = c(parentFilters$params, list(groupValues[[i]]))
      )
      subQuery <- buildDuckdbSubRowSql("reactable_data", baseWhere, childFilters, sortBy)
      subRows <- DBI::dbGetQuery(con, subQuery$sql, params = subQuery$params)
      for (agg in postComputeAggs) {
        if (agg$id %in% colnames(subRows)) {
          groupData[i, agg$id] <- duckdbComputeAggregate(agg$aggregate, subRows[[agg$id]])
        }
      }
    }
  }

  # For non-leaf levels, recursively build sub-group trees for each group
  if (!isLeafLevel) {
    subTrees <- vector("list", length(groupValues))
    for (i in seq_along(groupValues)) {
      childFilters <- list(
        clauses = c(parentFilters$clauses, paste0(escapedGroupCol, " = ?")),
        params = c(parentFilters$params, list(groupValues[[i]]))
      )
      subTrees[[i]] <- duckdbBuildGroupTree(con, columns, filters, searchValue, sortBy,
                                             groupBy, baseWhere, depth = depth + 1,
                                             parentFilters = childFilters)
    }
    groupData[[".subTrees"]] <- subTrees
  }

  groupData
}

# Compute the flat size of each group row: 1 if collapsed, 1 + children if expanded.
duckdbFlatSizes <- function(groupTree, expandedMap, groupBy, depth, parentId) {
  groupCol <- groupBy[[depth + 1]]
  isLeafLevel <- depth + 1 >= length(groupBy)
  ngroups <- nrow(groupTree)
  sizes <- integer(ngroups)

  for (i in seq_len(ngroups)) {
    groupId <- paste0(groupCol, ":", groupTree[[groupCol]][i])
    if (!is.null(parentId)) {
      groupId <- paste0(parentId, ".", groupId)
    }

    if (isTRUE(expandedMap[[groupId]])) {
      if (isLeafLevel) {
        sizes[i] <- 1L + as.integer(groupTree[["_sub_row_count"]][i])
      } else {
        childSizes <- duckdbFlatSizes(groupTree[[".subTrees"]][[i]], expandedMap, groupBy,
                                       depth = depth + 1, parentId = groupId)
        sizes[i] <- 1L + sum(childSizes)
      }
    } else {
      sizes[i] <- 1L
    }
  }
  sizes
}

# Collect rows that fall within [pageStart, pageEnd) from the flattened group stream.
duckdbCollectPageRows <- function(con, groupTree, flatSizes, pageStart, pageEnd,
                                   groupBy, baseWhere, sortBy, columns,
                                   depth, parentId, expandedMap,
                                   parentFilters = list(clauses = character(0), params = list())) {
  groupCol <- groupBy[[depth + 1]]
  isLeafLevel <- depth + 1 >= length(groupBy)
  escapedGroupCol <- duckdbQuoteIdentifier(groupCol)

  # Data columns: everything except internal columns
  dataCols <- setdiff(colnames(groupTree), c("_sub_row_count", "_sub_group_count", ".subTrees"))

  rows <- list()
  offset <- 0L

  for (i in seq_len(nrow(groupTree))) {
    nodeStart <- offset
    nodeEnd <- nodeStart + flatSizes[i]

    if (nodeEnd <= pageStart) {
      offset <- nodeEnd
      next
    }
    if (nodeStart >= pageEnd) {
      break
    }

    groupValue <- groupTree[[groupCol]][i]
    groupId <- paste0(groupCol, ":", groupValue)
    if (!is.null(parentId)) {
      groupId <- paste0(parentId, ".", groupId)
    }

    # Group header on this page?
    if (nodeStart >= pageStart && nodeStart < pageEnd) {
      headerRow <- groupTree[i, dataCols, drop = FALSE]
      row.names(headerRow) <- NULL

      # subRowCount: for non-leaf levels, count of sub-groups; for leaf, count of data rows
      if (!isLeafLevel) {
        subRowCount <- as.integer(groupTree[["_sub_group_count"]][i])
      } else {
        subRowCount <- as.integer(groupTree[["_sub_row_count"]][i])
      }

      headerRow[["__state"]] <- dataFrame(
        id = groupId,
        grouped = TRUE,
        subRowCount = subRowCount
      )
      if (!is.null(parentId)) {
        headerRow[["__state"]]$parentId <- parentId
      }
      rows <- c(rows, list(headerRow))
    }

    isExpanded <- isTRUE(expandedMap[[groupId]])
    if (isExpanded) {
      if (isLeafLevel) {
        # Fetch leaf sub-row slice from DuckDB
        subRowCount <- as.integer(groupTree[["_sub_row_count"]][i])
        subFlatStart <- nodeStart + 1L
        subSliceStart <- max(0L, pageStart - subFlatStart)
        subSliceEnd <- min(subRowCount, pageEnd - subFlatStart)

        if (subSliceEnd > subSliceStart) {
          childFilters <- list(
            clauses = c(parentFilters$clauses, paste0(escapedGroupCol, " = ?")),
            params = c(parentFilters$params, list(groupValue))
          )
          subQuery <- buildDuckdbSubRowSql("reactable_data", baseWhere, childFilters, sortBy)
          # Add LIMIT/OFFSET to the sub-row query
          subQuery$sql <- paste0(subQuery$sql,
                                 " LIMIT ", as.integer(subSliceEnd - subSliceStart),
                                 " OFFSET ", as.integer(subSliceStart))
          subSlice <- DBI::dbGetQuery(con, subQuery$sql, params = subQuery$params)

          # Extract _reactable_rowid into __state
          if ("_reactable_rowid" %in% colnames(subSlice)) {
            rowids <- subSlice[["_reactable_rowid"]]
            subSlice[["__state"]] <- dataFrame(
              id = as.character(rowids),
              index = as.integer(rowids),
              parentId = rep(groupId, length(rowids))
            )
            subSlice[["_reactable_rowid"]] <- NULL
          }
          rows <- c(rows, list(subSlice))
        }
      } else {
        # Recurse into sub-groups, adjusting page window to child's coordinate system
        childTree <- groupTree[[".subTrees"]][[i]]
        childSizes <- duckdbFlatSizes(childTree, expandedMap, groupBy,
                                       depth = depth + 1, parentId = groupId)
        childPageStart <- pageStart - (nodeStart + 1L)
        childPageEnd <- pageEnd - (nodeStart + 1L)
        levelFilters <- list(
          clauses = c(parentFilters$clauses, paste0(escapedGroupCol, " = ?")),
          params = c(parentFilters$params, list(groupValue))
        )
        childRows <- duckdbCollectPageRows(con, childTree, childSizes,
                                            childPageStart, childPageEnd,
                                            groupBy, baseWhere, sortBy, columns,
                                            depth = depth + 1, parentId = groupId,
                                            expandedMap = expandedMap,
                                            parentFilters = levelFilters)
        if (!is.null(childRows) && nrow(childRows) > 0) {
          rows <- c(rows, list(childRows))
        }
      }
    }

    offset <- nodeEnd
  }

  if (length(rows) == 0) {
    return(dataFrame())
  }
  rbindFill(rows)
}
