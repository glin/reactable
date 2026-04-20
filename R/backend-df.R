#' Data Frame Server Backend
#'
#' Uses pure R data frame operations for table data processing in Shiny apps.
#' Does not require the V8 package.
#'
#' @return A backend object to pass to the `backend` argument of [reactable()].
#'
#' @examples
#' \dontrun{
#' reactable(data, backend = backendDf())
#' }
#'
#' @export
backendDf <- function() {
  structure(list(), class = "reactable_backendDf")
}

#' @exportS3Method
reactableServerData.reactable_backendDf <- function(
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

  # Add 0-based row IDs for stable row identification across pages
  data[["_reactable_rowid"]] <- seq_len(nrow(data)) - 1L

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
    data <- dfSortBy(data, sortBy)
  }

  # Grouping and aggregation
  if (length(groupBy) > 0) {
    data <- dfGroupBy(data, groupBy, columns, expanded = expanded)
  }

  # Pagination
  if (isTRUE(paginateSubRows) && length(groupBy) > 0) {
    dfPaginateSubRows(data, pageIndex, pageSize, expanded, groupBy)
  } else {
    dfPaginate(data, pageIndex, pageSize)
  }
}

dfFilter <- function(df, filters) {
  for (filter in filters) {
    # Ignore invalid columns
    if (!filter$id %in% colnames(df)) {
      next
    }
    df <- df[grepl(tolower(filter$value), tolower(df[[filter$id]]), fixed = TRUE), ]
  }
  df
}

dfGlobalSearch <- function(df, searchValue) {
  matched <- FALSE
  for (col in colnames(df)) {
    matched <- grepl(tolower(searchValue), tolower(df[[col]]), fixed = TRUE) | matched
  }
  df <- df[matched, ]
  df
}

# Sorting is locale dependent and usually different from JavaScript
# (UTF-8 collation vs. C collation in JS)
dfSortBy <- function(df, by) {
  columns <- lapply(by, function(col) {
    if (is.numeric(df[[col$id]])) {
      df[[col$id]]
    } else {
      xtfrm(df[[col$id]])
    }
  })
  decreasing <- sapply(by, function(col) if (isTRUE(col$desc)) TRUE else FALSE)
  df <- df[do.call(order, c(columns, list(decreasing = decreasing))), , drop = FALSE]
  df
}

dfGroupBy <- function(df, by, columns = NULL, depth = 0, expanded = NULL, parentId = NULL) {
  by <- unlist(by)
  if (length(by) == depth) {
    return(df)
  }
  groupedColumnId <- by[depth + 1]

  splitBy <- if (is.list(df[[groupedColumnId]])) {
    # Split doesn't work with list-columns, so convert list-columns to strings
    vapply(df[[groupedColumnId]], toJSON, character(1))
  } else {
    # Filter out unused levels for factor columns (which split would turn into
    # empty groups), and ensure group names are character strings (split coerces
    # factors/numerics/etc. into strings anyway).
    as.character(df[[groupedColumnId]])
  }

  splitIndices <- split(seq_len(nrow(df)), splitBy)

  # NOTE: grouped rows won't necessarily be in the same order as the column values
  groups <- lapply(
    splitIndices,
    function(inds) {
      subGroup <- df[inds, , drop = FALSE]
      # Reset row names for easier testing. This doesn't really matter though,
      # as row names are eventually discarded in the end.
      row.names(subGroup) <- NULL
      # Omit grouped column
      subGroup[[groupedColumnId]] <- NULL
      subGroup
    }
  )
  values <- unique(df[[groupedColumnId]])

  df <- if (is.list(values)) {
    # Preserve list-columns
    listSafeDataFrame(values)
  } else {
    dataFrame(values)
  }
  colnames(df) <- groupedColumnId

  # Find the columns that can be aggregated, including any columns in groupBy.
  # groupBy columns that aren't in the row's group are allowed to be aggregated.
  groupedColumns <- by[seq_len(depth + 1)]
  aggregatedColumns <- Filter(function(column) !column[["id"]] %in% groupedColumns, columns)
  for (column in aggregatedColumns) {
    aggregate <- column[["aggregate"]]
    if (is.null(aggregate)) next
    if (!is.function(aggregate)) {
      aggregate <- aggregateFuncs[[aggregate]]
    }
    id <- column[["id"]]
    df[[id]] <- unlist(lapply(values, function(x) {
      value <- if (is.list(x)) toJSON(x) else as.character(x)
      subGroup <- groups[[value]]
      aggregate(subGroup[[id]])
    }), recursive = FALSE)
  }

  # Compute row state IDs before building .subRows (needed for expanded check and parentId)
  rowIds <- unname(vapply(values, function(x) {
    value <- if (is.list(x)) toJSON(x) else as.character(x)
    sprintf("%s:%s", groupedColumnId, value)
  }, character(1)))

  df[[".subRows"]] <- lapply(seq_along(values), function(j) {
    x <- values[[j]]
    value <- if (is.list(x)) toJSON(x) else as.character(x)
    subGroup <- groups[[value]]
    childParentId <- if (!is.null(parentId)) paste0(parentId, ".", rowIds[j]) else rowIds[j]
    dfGroupBy(subGroup, by, columns = columns, depth = depth + 1,
              expanded = expanded, parentId = childParentId)
  })

  # Add row state for grouped rows. This includes:

  # - id: unique identifier for the row (format: "columnId:value")
  # - grouped: TRUE to mark this as a grouped row
  # - subRowCount: count of sub rows (for paginateSubRows and lazy sub-row fetching)
  subRowCounts <- vapply(df[[".subRows"]], nrow, integer(1))
  df[["__state"]] <- dataFrame(
    id = rowIds,
    grouped = rep(TRUE, length(rowIds)),
    subRowCount = subRowCounts
  )

  # Trim sub-rows for collapsed groups (lazy sub-row fetching).
  # When expanded is provided, only expanded groups keep their sub-rows.
  # Collapsed groups get empty data frames; subRowCount is preserved in __state
  # so the expander arrow still shows.
  if (!is.null(expanded)) {
    for (i in seq_along(rowIds)) {
      fullRowId <- if (!is.null(parentId)) paste0(parentId, ".", rowIds[i]) else rowIds[i]
      if (!isTRUE(expanded[[fullRowId]])) {
        df[[".subRows"]][[i]] <- df[[".subRows"]][[i]][0, , drop = FALSE]
      }
    }
  }

  df
}

# Like data.frame() but preserves list-columns without having to wrap them in I().
# Uses the default row.names and always stringsAsFactors = FALSE.
listSafeDataFrame <- function(...) {
  columns <- list(...)
  rowNames <- seq_len(length(columns[[1]]))
  structure(columns, row.names = rowNames, class = "data.frame")
}

# Like data.frame() but always uses stringsAsFactors = FALSE for R 3.6 and below
dataFrame <- function(...) {
  data.frame(..., stringsAsFactors = FALSE)
}

# Paginate grouped data with paginateSubRows: flatten group headers + sub-rows
# into a single stream and return the slice for the current page.
dfPaginateSubRows <- function(groupedDf, pageIndex, pageSize, expanded, groupBy) {
  expandedMap <- if (is.null(expanded)) list() else expanded

  # Compute the flat size of each group (how many rows it contributes to the stream)
  flatSizes <- dfFlatSizes(groupedDf, expandedMap, groupBy, depth = 0, parentId = NULL)
  rowCount <- sum(flatSizes)

  # Determine page window
  pageStart <- pageIndex * pageSize
  pageEnd <- pageStart + pageSize

  # Collect rows for the current page
  rows <- dfCollectPageRows(groupedDf, flatSizes, pageStart, pageEnd, groupBy,
                            depth = 0, parentId = NULL, expandedMap = expandedMap)

  resolvedData(rows, rowCount = rowCount)
}

# Compute the flat size of each group row: 1 if collapsed, 1 + children if expanded.
# For multi-level groupBy, recursively computes sizes of sub-groups.
dfFlatSizes <- function(groupedDf, expandedMap, groupBy, depth, parentId) {
  ngroups <- nrow(groupedDf)
  sizes <- integer(ngroups)
  states <- groupedDf[["__state"]]
  subRowsList <- groupedDf[[".subRows"]]
  isLeafLevel <- depth + 1 >= length(groupBy)

  for (i in seq_len(ngroups)) {
    groupId <- if (!is.null(parentId)) {
      paste0(parentId, ".", states$id[i])
    } else {
      states$id[i]
    }

    if (isTRUE(expandedMap[[groupId]])) {
      if (isLeafLevel) {
        sizes[i] <- 1L + nrow(subRowsList[[i]])
      } else {
        childSizes <- dfFlatSizes(subRowsList[[i]], expandedMap, groupBy,
                                  depth = depth + 1, parentId = groupId)
        sizes[i] <- 1L + sum(childSizes)
      }
    } else {
      sizes[i] <- 1L
    }
  }
  sizes
}

# Collect the rows that fall within [pageStart, pageEnd) from the flattened group stream.
dfCollectPageRows <- function(groupedDf, flatSizes, pageStart, pageEnd, groupBy,
                              depth, parentId, expandedMap) {
  states <- groupedDf[["__state"]]
  subRowsList <- groupedDf[[".subRows"]]
  isLeafLevel <- depth + 1 >= length(groupBy)

  # Get all column names except .subRows and __state (the data columns)
  dataCols <- setdiff(colnames(groupedDf), c(".subRows", "__state"))

  rows <- list()
  offset <- 0L

  for (i in seq_len(nrow(groupedDf))) {
    nodeStart <- offset
    nodeEnd <- nodeStart + flatSizes[i]

    if (nodeEnd <= pageStart) {
      offset <- nodeEnd
      next
    }
    if (nodeStart >= pageEnd) {
      break
    }

    groupId <- if (!is.null(parentId)) {
      paste0(parentId, ".", states$id[i])
    } else {
      states$id[i]
    }

    # Group header on this page?
    if (nodeStart >= pageStart && nodeStart < pageEnd) {
      headerRow <- groupedDf[i, dataCols, drop = FALSE]
      row.names(headerRow) <- NULL

      # subRowCount: for non-leaf levels, count of sub-groups; for leaf, count of data rows
      if (!isLeafLevel) {
        subRowCount <- nrow(subRowsList[[i]])
      } else {
        subRowCount <- states$subRowCount[i]
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
        # Fetch leaf sub-row slice
        subDf <- subRowsList[[i]]
        subFlatStart <- nodeStart + 1L
        subSliceStart <- max(0L, pageStart - subFlatStart)
        subSliceEnd <- min(nrow(subDf), pageEnd - subFlatStart)

        if (subSliceEnd > subSliceStart) {
          subSlice <- subDf[(subSliceStart + 1L):subSliceEnd, , drop = FALSE]
          row.names(subSlice) <- NULL

          # Add __state with parentId for each sub-row
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
        childDf <- subRowsList[[i]]
        childSizes <- dfFlatSizes(childDf, expandedMap, groupBy,
                                  depth = depth + 1, parentId = groupId)
        childPageStart <- pageStart - (nodeStart + 1L)
        childPageEnd <- pageEnd - (nodeStart + 1L)
        childRows <- dfCollectPageRows(childDf, childSizes, childPageStart, childPageEnd,
                                       groupBy, depth = depth + 1, parentId = groupId,
                                       expandedMap = expandedMap)
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

# rbind data frames with different columns, filling missing columns with NA.
# Group headers and sub-rows typically have different column sets, and __state
# is a nested data frame column that needs special handling to avoid row name conflicts.
rbindFill <- function(dfs) {
  # Collect all column names
  allDataCols <- unique(unlist(lapply(dfs, function(df) setdiff(colnames(df), "__state"))))
  allStateCols <- unique(unlist(lapply(dfs, function(df) {
    if ("__state" %in% colnames(df)) colnames(df[["__state"]]) else character(0)
  })))

  # Align columns and separate __state to avoid nested data frame rbind issues
  dataList <- vector("list", length(dfs))
  stateList <- vector("list", length(dfs))

  for (k in seq_along(dfs)) {
    df <- dfs[[k]]
    n <- nrow(df)

    # Extract and remove __state
    state <- df[["__state"]]
    df[["__state"]] <- NULL

    # Fill missing data columns with NA
    for (col in setdiff(allDataCols, colnames(df))) {
      df[[col]] <- NA
    }
    dataList[[k]] <- df[, allDataCols, drop = FALSE]

    # Fill missing state columns with NA
    if (!is.null(state)) {
      for (col in setdiff(allStateCols, colnames(state))) {
        state[[col]] <- NA
      }
      stateList[[k]] <- state[, allStateCols, drop = FALSE]
    } else {
      stateList[[k]] <- as.data.frame(
        setNames(replicate(length(allStateCols), rep(NA, n), simplify = FALSE), allStateCols),
        stringsAsFactors = FALSE
      )
    }
  }

  # rbind data and state separately, then re-attach
  resultData <- do.call(rbind, c(dataList, list(make.row.names = FALSE)))
  resultState <- do.call(rbind, c(stateList, list(make.row.names = FALSE)))

  # Convert numeric __state columns to character so that NAs serialize as JSON null
  # rather than "NA" (jsonlite preserves numeric NAs as strings for table cell display,
  # but __state fields like subRowCount and index need null when absent)
  for (col in colnames(resultState)) {
    if (is.numeric(resultState[[col]])) {
      resultState[[col]] <- as.character(resultState[[col]])
    }
  }

  resultData[["__state"]] <- resultState
  resultData
}

# Extract _reactable_rowid into __state for stable row identification
dfAddRowState <- function(df) {
  if ("_reactable_rowid" %in% colnames(df) && !"__state" %in% colnames(df)) {
    rowids <- df[["_reactable_rowid"]]
    df[["__state"]] <- dataFrame(
      id = as.character(rowids),
      index = as.integer(rowids)
    )
    df[["_reactable_rowid"]] <- NULL
  }
  df
}

dfPaginate <- function(df, pageIndex = 0, pageSize = NULL) {
  if (is.null(pageSize)) {
    # Extract _reactable_rowid into __state for stable row identification (flat rows only)
    df <- dfAddRowState(df)
    return(resolvedData(df, rowCount = nrow(df)))
  }

  # Ensure page index is within boundaries
  rowCount <- nrow(df)
  maxPageIndex <- max(ceiling(rowCount / pageSize) - 1, 0)
  if (pageIndex < 0) {
    pageIndex <- 0
  } else if (pageIndex > maxPageIndex) {
    pageIndex <- maxPageIndex
  }

  rowStart <- min(pageIndex * pageSize + 1, nrow(df))
  rowEnd <- min(pageIndex * pageSize + pageSize, nrow(df))
  page <- df[rowStart:rowEnd, ]
  # Extract _reactable_rowid into __state after pagination to avoid row name issues
  page <- dfAddRowState(page)

  resolvedData(page, rowCount = rowCount)
}

# For strings, max/min/median are locale dependent and usually different from JavaScript
# (UTF-8 collation vs. C collation in JS)
aggregateFuncs <- list(
  "sum" = function(x) sum(x, na.rm = TRUE),
  "mean" = function(x) mean(x, na.rm = TRUE),
  "max" = function(x) {
    if (!all(is.na(x))) {
      max(x, na.rm = TRUE)
    } else if (is.numeric(x)) {
      NaN
    } else {
      NA
    }
  },
  "min" = function(x) {
    if (!all(is.na(x))) {
      min(x, na.rm = TRUE)
    } else if (is.numeric(x)) {
      NaN
    } else {
      NA
    }
  },
  "median" = function(x) median(x, na.rm = TRUE),
  "count" = function(x) length(x),
  "unique" = function(x) paste(unique(x), collapse = ", "),
  "frequency" = function(x) {
    counts <- as.list(table(x))
    countStrs <- vapply(seq_along(counts), function(i) {
      value <- names(counts)[i]
      count <- counts[[i]]
      sprintf("%s (%s)", value, count)
    }, character(1))
    paste(countStrs, collapse = ", ")
  }
)

# For testing only. Sorting is locale dependent and different between UTF-8 (typically
# the default in R) and C (which JavaScript uses). See ?Comparison). testthat 3e and
# R CMD check both use a C locale for collation, but this can be used for more explicit tests.
withCollationC <- function(expr) {
  locale <- Sys.getlocale("LC_COLLATE")
  on.exit({
    Sys.setlocale("LC_COLLATE", locale)
  })
  Sys.setlocale("LC_COLLATE", "C")
  expr
}
