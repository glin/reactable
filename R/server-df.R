serverDf <- function() {
  structure(list(), class = "reactable_serverDf")
}

reactableServerData.reactable_serverDf <- function(
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
    data <- dfGroupBy(data, groupBy, columns)
  }

  # Pagination
  dfPaginate(data, pageIndex, pageSize)
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

dfGroupBy <- function(df, by, columns = NULL, depth = 0) {
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

  df[[".subRows"]] <- lapply(values, function(x) {
    value <- if (is.list(x)) toJSON(x) else as.character(x)
    subGroup <- groups[[value]]
    dfGroupBy(subGroup, by, columns = columns, depth = depth + 1)
  })
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

dfPaginate <- function(df, pageIndex = 0, pageSize = NULL) {
  if (is.null(pageSize)) {
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
