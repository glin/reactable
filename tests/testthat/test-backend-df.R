test_that("backendDf - basic pagination", {
  backend <- backendDf()

  df <- dataFrame(
    a = c("a", "b", "c", "d", "e"),
    b = c(1, 2, 3, 4, 5)
  )

  # No pagination
  result <- reactableServerData(backend, data = df, pageSize = NULL)
  expect_equal(result$rowCount, 5)
  expect_equal(result$data$a, df$a)
  expect_equal(result$data$b, df$b)
  expect_equal(result$data$`__state`, data.frame(id = as.character(0:4), index = 0:4, stringsAsFactors = FALSE))

  # Single page (all rows fit)
  result <- reactableServerData(backend, data = df, pageIndex = 0, pageSize = 10)
  expect_equal(result$rowCount, 5)
  expect_equal(result$data$a, df$a)
  expect_equal(result$data$b, df$b)
  expect_equal(result$data$`__state`, data.frame(id = as.character(0:4), index = 0:4, stringsAsFactors = FALSE))

  # Second page
  result <- reactableServerData(backend, data = df, pageIndex = 1, pageSize = 3)
  expect_equal(result$rowCount, 5)
  expect_equal(result$data$a, c("d", "e"))
  expect_equal(result$data$b, c(4, 5))
  expect_equal(result$data$`__state`, data.frame(id = as.character(3:4), index = 3:4, stringsAsFactors = FALSE))
})

test_that("dfSortBy", {
  # Single column sort in ascending order
  df <- dataFrame(
    x = c("aaa", "AAA", "aaa", "a", "B", "b")
  )
  # In a UTF-8 locale, this would be: a, aaa, aaa, AAA, b, B
  withCollationC({
    expect_equal(
      dfSortBy(df, list(list(id = "x"))),
      dataFrame(
        x = c("AAA", "B", "a", "aaa", "aaa", "b"),
        row.names = as.integer(c(2, 5, 4, 1, 3, 6))
      )
    )
  })

  # Multiple column sort with descending order
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi", "Audi", "BMW"),
    model = c("Integra", "Legend", "90", "100", "535i"),
    price = c(1, 2, 2, 10, 5)
  )
  rownames(df) <- df$model
  expect_equal(
    dfSortBy(df, list(list(id = "mfr", desc = TRUE), list(id = "price"))),
    dataFrame(
      mfr = c("BMW", "Audi", "Audi", "Acura", "Acura"),
      model = c("535i", "90", "100", "Integra", "Legend"),
      price = c(5, 2, 10, 1, 2),
      row.names = c("535i", "90", "100", "Integra", "Legend")
    )
  )
})

test_that("dfFilter", {
  df <- dataFrame(
    chr = c("aaa", "AAA", "aaa", "cba", "B", "b"),
    num = c(1, 2, 3, 12, 123, 2123)
  )

  # No filters
  expect_equal(
    dfFilter(df, list()),
    df
  )

  # Invalid columns should be ignored
  expect_equal(
    dfFilter(df, list(list(id = "non-existent column", value = ""))),
    df
  )

  # Valid column - no match
  expect_equal(
    dfFilter(df, list(list(id = "chr", value = "no-match"))),
    dataFrame(
      chr = character(0),
      num = numeric(0)
    )
  )

  # String filtering (case-insensitive)
  expect_equal(
    dfFilter(df, list(list(id = "chr", value = "a"))),
    dataFrame(
      chr = c("aaa", "AAA", "aaa", "cba"),
      num = c(1, 2, 3, 12)
    )
  )

  # Numeric filtering - doesn't filter by prefix currently
  expect_equal(
    dfFilter(df, list(list(id = "num", value = "1"))),
    dataFrame(
      chr = c("aaa", "cba", "B", "b"),
      num = c(1, 12, 123, 2123),
      row.names = as.integer(c(1, 4, 5, 6))
    )
  )

  # Multiple filters
  expect_equal(
    dfFilter(df, list(list(id = "num", value = "21"), list(id = "chr", value = "b"))),
    dataFrame(
      chr = c("b"),
      num = c(2123),
      row.names = as.integer(c(6))
    )
  )
})

test_that("dfGlobalSearch", {
  df <- dataFrame(
    chr = c("aaa", "AAA", "aaa", "cba", "B", "b"),
    num = c(1, 2, 3, 12, 123, 2123)
  )

  # Empty search value
  expect_equal(
    dfGlobalSearch(df, ""),
    df
  )

  # No match
  expect_equal(
    dfGlobalSearch(df, "no-match"),
    dataFrame(
      chr = character(0),
      num = numeric(0)
    )
  )

  # String search (case-insensitive)
  expect_equal(
    dfGlobalSearch(df, "a"),
    dataFrame(
      chr = c("aaa", "AAA", "aaa", "cba"),
      num = c(1, 2, 3, 12)
    )
  )

  # Numeric searching - doesn't filter by prefix currently
  expect_equal(
    dfGlobalSearch(df, "1"),
    dataFrame(
      chr = c("aaa", "cba", "B", "b"),
      num = c(1, 12, 123, 2123),
      row.names = as.integer(c(1, 4, 5, 6))
    )
  )
})

test_that("dfGroupBy grouped by a string column", {
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi", "Audi", "BMW"),
    model = c("Integra", "Legend", "90", "100", "535i"),
    price = c(1, 2, 2, 10, 5)
  )
  grouped <- dfGroupBy(df, list("mfr"))

  expected <- listSafeDataFrame(
    mfr = c("Acura", "Audi", "BMW"),
    .subRows = list(
      dataFrame(
        model = c("Integra", "Legend"),
        price = c(1, 2)
      ),
      dataFrame(
        model = c("90", "100"),
        price = c(2, 10)
      ),
      # dfGroupBy should handle single row groups
      dataFrame(
        model = c("535i"),
        price = c(5)
      )
    ),
    `__state` = data.frame(
      id = c("mfr:Acura", "mfr:Audi", "mfr:BMW"),
      grouped = c(TRUE, TRUE, TRUE),
      subRowCount = c(2L, 2L, 1L),
      stringsAsFactors = FALSE
    )
  )
  expect_equal(grouped, expected)
})

test_that("dfGroupBy grouped by a numeric column", {
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi"),
    model = c("Integra", "Legend", "90"),
    price = c(1, 2, 2)
  )
  grouped <- dfGroupBy(df, list("price"))

  expected <- listSafeDataFrame(
    price = c(1, 2),
    .subRows = list(
      dataFrame(
        mfr = c("Acura"),
        model = c("Integra")
      ),
      dataFrame(
        mfr = c("Acura", "Audi"),
        model = c("Legend", "90")
      )
    ),
    `__state` = data.frame(
      id = c("price:1", "price:2"),
      grouped = c(TRUE, TRUE),
      subRowCount = c(1L, 2L),
      stringsAsFactors = FALSE
    )
  )
  expect_equal(grouped, expected)
})

test_that("dfGroupBy grouped by a factor column", {
  levels <- c("Acura", "UNUSED_LEVEL", "Audi", "UNUSED_LEVEL2", "BMW")
  df <- dataFrame(
    mfr = factor(c("Acura", "Acura", "Audi", "Audi", "BMW"), levels = levels),
    model = c("Integra", "Legend", "90", "100", "535i"),
    price = c(1, 2, 2, 10, 5)
  )
  grouped <- dfGroupBy(df, list("mfr"))

  expected <- listSafeDataFrame(
    mfr = factor(c("Acura", "Audi", "BMW"), levels = levels),
    .subRows = list(
      dataFrame(
        model = c("Integra", "Legend"),
        price = c(1, 2)
      ),
      dataFrame(
        model = c("90", "100"),
        price = c(2, 10)
      ),
      dataFrame(
        model = c("535i"),
        price = c(5)
      )
    ),
    `__state` = data.frame(
      id = c("mfr:Acura", "mfr:Audi", "mfr:BMW"),
      grouped = c(TRUE, TRUE, TRUE),
      subRowCount = c(2L, 2L, 1L),
      stringsAsFactors = FALSE
    )
  )
  expect_equal(grouped, expected)
})

test_that("dfGroupBy grouped by a list-column", {
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi"),
    model = c("Integra", "Legend", "90"),
    price = I(list(list(1), list(2), list(2)))
  )
  grouped <- dfGroupBy(df, list("price"))

  expected <- listSafeDataFrame(
    price = list(list(1), list(2)),
    .subRows = list(
      listSafeDataFrame(
        mfr = c("Acura"),
        model = c("Integra")
      ),
      listSafeDataFrame(
        mfr = c("Acura", "Audi"),
        model = c("Legend", "90")
      )
    ),
    `__state` = data.frame(
      id = c("price:[1]", "price:[2]"),
      grouped = c(TRUE, TRUE),
      subRowCount = c(1L, 2L),
      stringsAsFactors = FALSE
    )
  )
  expect_equal(grouped, expected)
})

test_that("dfGroupBy grouped by multiple columns", {
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi", "Audi", "BMW"),
    model = c("Integra", "Legend", "90", "100", "535i"),
    price = c(1, 2, 2, 10, 5),
    type = c("Small", "Midsize", "Compact", "Compact", "Midsize")
  )
  grouped <- dfGroupBy(df, list("mfr", "type"))

  expected <- listSafeDataFrame(
    mfr = c("Acura", "Audi", "BMW"),
    .subRows = list(
      listSafeDataFrame(
        type = c("Small", "Midsize"),
        .subRows = list(
          dataFrame(
            model = c("Integra"),
            price = c(1)
          ),
          dataFrame(
            model = c("Legend"),
            price = c(2)
          )
        ),
        `__state` = data.frame(
          id = c("type:Small", "type:Midsize"),
          grouped = c(TRUE, TRUE),
          subRowCount = c(1L, 1L),
          stringsAsFactors = FALSE
        )
      ),
      listSafeDataFrame(
        type = "Compact",
        .subRows = list(
          dataFrame(
            model = c("90", "100"),
            price = c(2, 10)
          )
        ),
        `__state` = data.frame(
          id = "type:Compact",
          grouped = TRUE,
          subRowCount = 2L,
          stringsAsFactors = FALSE
        )
      ),
      listSafeDataFrame(
        type = "Midsize",
        .subRows = list(
          dataFrame(
            model = c("535i"),
            price = c(5)
          )
        ),
        `__state` = data.frame(
          id = "type:Midsize",
          grouped = TRUE,
          subRowCount = 1L,
          stringsAsFactors = FALSE
        )
      )
    ),
    `__state` = data.frame(
      id = c("mfr:Acura", "mfr:Audi", "mfr:BMW"),
      grouped = c(TRUE, TRUE, TRUE),
      subRowCount = c(2L, 1L, 1L),
      stringsAsFactors = FALSE
    )
  )
  expect_equal(grouped, expected)
})

test_that("dfGroupBy with aggregate functions", {
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi", "Audi", "BMW"),
    model = c("Integra", "Legend", "90", "100", "535i"),
    price = c(1, 2, 2, 10, 5)
  )
  columns <- getAttrib(
    reactable(df, columns = list(
      model = colDef(aggregate = "unique"),
      price = colDef(aggregate = "sum")
    )),
    "columns"
  )
  grouped <- dfGroupBy(df, list("mfr"), columns = columns)

  expected <- listSafeDataFrame(
    mfr = c("Acura", "Audi", "BMW"),
    model = c("Integra, Legend", "90, 100", "535i"),
    price = c(3, 12, 5),
    .subRows = list(
      dataFrame(
        model = c("Integra", "Legend"),
        price = c(1, 2)
      ),
      dataFrame(
        model = c("90", "100"),
        price = c(2, 10)
      ),
      dataFrame(
        model = c("535i"),
        price = c(5)
      )
    ),
    `__state` = data.frame(
      id = c("mfr:Acura", "mfr:Audi", "mfr:BMW"),
      grouped = c(TRUE, TRUE, TRUE),
      subRowCount = c(2L, 2L, 1L),
      stringsAsFactors = FALSE
    )
  )
  expect_equal(grouped, expected)
})

test_that("dfGroupBy with aggregate functions grouped by a factor column", {
  levels <- c("Acura", "UNUSED_LEVEL", "Audi", "UNUSED_LEVEL2", "BMW")
  df <- dataFrame(
    mfr = factor(c("Acura", "Acura", "Audi", "Audi", "BMW"), levels = levels),
    model = c("Integra", "Legend", "90", "100", "535i"),
    price = c(1, 2, 2, 10, 5)
  )
  columns <- getAttrib(
    reactable(df, columns = list(price = colDef(aggregate = "sum"))),
    "columns"
  )
  grouped <- dfGroupBy(df, list("mfr"), columns = columns)

  expected <- listSafeDataFrame(
    mfr = factor(c("Acura", "Audi", "BMW"), levels = levels),
    price = c(3, 12, 5),
    .subRows = list(
      dataFrame(
        model = c("Integra", "Legend"),
        price = c(1, 2)
      ),
      dataFrame(
        model = c("90", "100"),
        price = c(2, 10)
      ),
      dataFrame(
        model = c("535i"),
        price = c(5)
      )
    ),
    `__state` = data.frame(
      id = c("mfr:Acura", "mfr:Audi", "mfr:BMW"),
      grouped = c(TRUE, TRUE, TRUE),
      subRowCount = c(2L, 2L, 1L),
      stringsAsFactors = FALSE
    )
  )
  expect_equal(grouped, expected)
})

test_that("dfGroupBy with aggregate functions grouped by a list column", {
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi"),
    model = c("Integra", "Legend", "90"),
    price = I(list(list(1), list(2), list(2)))
  )
  columns <- getAttrib(
    reactable(df, columns = list(price = colDef(aggregate = "unique"))),
    "columns"
  )
  grouped <- dfGroupBy(df, list("mfr"), columns = columns)

  expected <- listSafeDataFrame(
    mfr = c("Acura", "Audi"),
    price = c("list(1), list(2)", "list(2)"),
    .subRows = list(
      listSafeDataFrame(
        model = c("Integra", "Legend"),
        price = I(list(list(1), list(2)))
      ),
      listSafeDataFrame(
        model = c("90"),
        price = I(list(list(2)))
      )
    ),
    `__state` = data.frame(
      id = c("mfr:Acura", "mfr:Audi"),
      grouped = c(TRUE, TRUE),
      subRowCount = c(2L, 1L),
      stringsAsFactors = FALSE
    )
  )
  expect_equal(grouped, expected)
})

test_that("dfGroupBy with aggregate functions grouped by multiple columns", {
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi", "Audi", "BMW"),
    model = c("Integra", "Legend", "90", "100", "535i"),
    price = c(1, 2, 2, 10, 5),
    type = c("Small", "Midsize", "Compact", "Compact", "Midsize")
  )
  columns <- getAttrib(
    reactable(df, columns = list(
      mfr = colDef(aggregate = "count"), # Should be ignored for initial grouped columns
      price = colDef(aggregate = "sum"),
      type = colDef(aggregate = "count") # Should work for subsequent grouped columns
    )),
    "columns"
  )
  grouped <- dfGroupBy(df, list("mfr", "type"), columns = columns)

  expected <- listSafeDataFrame(
    mfr = c("Acura", "Audi", "BMW"),
    price = c(3, 12, 5),
    type = c(2, 2, 1),
    .subRows = list(
      listSafeDataFrame(
        type = c("Small", "Midsize"),
        price = c(1, 2),
        .subRows = list(
          dataFrame(
            model = c("Integra"),
            price = c(1)
          ),
          dataFrame(
            model = c("Legend"),
            price = c(2)
          )
        ),
        `__state` = data.frame(
          id = c("type:Small", "type:Midsize"),
          grouped = c(TRUE, TRUE),
          subRowCount = c(1L, 1L),
          stringsAsFactors = FALSE
        )
      ),
      listSafeDataFrame(
        type = "Compact",
        price = c(12),
        .subRows = list(
          dataFrame(
            model = c("90", "100"),
            price = c(2, 10)
          )
        ),
        `__state` = data.frame(
          id = "type:Compact",
          grouped = TRUE,
          subRowCount = 2L,
          stringsAsFactors = FALSE
        )
      ),
      listSafeDataFrame(
        type = "Midsize",
        price = c(5),
        .subRows = list(
          dataFrame(
            model = c("535i"),
            price = c(5)
          )
        ),
        `__state` = data.frame(
          id = "type:Midsize",
          grouped = TRUE,
          subRowCount = 1L,
          stringsAsFactors = FALSE
        )
      )
    ),
    `__state` = data.frame(
      id = c("mfr:Acura", "mfr:Audi", "mfr:BMW"),
      grouped = c(TRUE, TRUE, TRUE),
      subRowCount = c(2L, 1L, 1L),
      stringsAsFactors = FALSE
    )
  )
  expect_equal(grouped, expected)
})

test_that("aggregate functions - sum", {
  sum <- aggregateFuncs[["sum"]]
  expect_equal(sum(c(1, 2, 3, 4, -1)), 9)
  expect_equal(sum(c(1)), 1)
  expect_equal(sum(c(0.1, 0.2)), 0.3)
  expect_equal(sum(c(1, 2, NA)), 3)
  expect_equal(sum(c(1, 2, Inf)), Inf)
  expect_equal(sum(c(1, 2, -Inf)), -Inf)
  expect_equal(sum(c()), 0)
})

test_that("aggregate functions - mean", {
  mean <- aggregateFuncs[["mean"]]
  expect_equal(mean(c(1, 2, 3, 4, 0)), 2)
  expect_equal(mean(c(1)), 1)
  expect_equal(mean(c(0.1, 0.2)), 0.15)
  expect_equal(mean(c(1, 2, NA)), 1.5)
  expect_equal(mean(c(1, 2, Inf)), Inf)
  expect_equal(mean(c(1, 2, -Inf)), -Inf)
  expect_equal(mean(numeric(0)), NaN)
})

test_that("aggregate functions - max", {
  max <- aggregateFuncs[["max"]]
  # Numerics
  expect_equal(max(c(1, 2, 3, 4, 0)), 4)
  expect_equal(max(c(1)), 1)
  expect_equal(max(c(0.1, 0.2)), 0.2)
  expect_equal(max(c(1, 2, NA)), 2)
  expect_equal(max(c(1, 2, Inf)), Inf)
  expect_equal(max(c(1, 2, -Inf)), 2)
  expect_equal(max(numeric(0)), NaN)

  # Other types
  expect_equal(max(character(0)), NA)
  expect_equal(max(c("a")), "a")
  expect_equal(max(c("a", "b", "c")), "c")
  expect_equal(max(c("A", NA, "C")), "C")
  # In a UTF-8 locale, this would be "AAA"
  withCollationC({
    expect_equal(max(c("a", "aaa", "AAA")), "aaa")
  })
  expect_equal(max(c("2020-03-04", "2020-03-04", "2020-03-05")), "2020-03-05")
  expect_equal(max(c("2021-03-01T19:00:00", "2021-03-01T19:00:01", "2020-12-01T19:00:00")), "2021-03-01T19:00:01")
  # In JS, this would be TRUE
  expect_equal(max(c(TRUE, FALSE, TRUE, NA)), 1)
  # In JS, this would work ("c", "d", "e")
  expect_error(max(list(c("a", "b"), c("c", "d", "e"))))
})

test_that("aggregate functions - min", {
  min <- aggregateFuncs[["min"]]
  expect_equal(min(c(1, 2, 3, 4, 0)), 0)
  expect_equal(min(c(1)), 1)
  expect_equal(min(c(0.1, 0.2)), 0.1)
  expect_equal(min(c(1, 2, NA)), 1)
  expect_equal(min(c(1, 2, Inf)), 1)
  expect_equal(min(c(1, 2, -Inf)), -Inf)
  expect_equal(min(numeric(0)), NaN)

  # Other types
  expect_equal(min(character(0)), NA)
  expect_equal(min(c("a")), "a")
  expect_equal(min(c("a", "b", "c")), "a")
  expect_equal(min(c("A", NA, "C")), "A")
  # In a UTF-8 locale, this would be "a"
  withCollationC({
    expect_equal(min(c("a", "aaa", "AAA")), "AAA")
  })
  expect_equal(min(c("2020-03-04", "2020-03-04", "2020-03-05")), "2020-03-04")
  expect_equal(min(c("2021-03-01T19:00:00", "2021-03-01T19:00:01", "2020-12-01T19:00:00")), "2020-12-01T19:00:00")
  # In JS, this would be FALSE
  expect_equal(min(c(TRUE, FALSE, TRUE, NA)), 0)
  # In JS, this would work ("a", "b")
  expect_error(min(list(c("a", "b"), c("c", "d", "e"))))
})

test_that("listSafeDataFrame", {
  df <- listSafeDataFrame(x = list(1, 2, "abc"))
  expected <- data.frame(x = I(list(1, 2, "abc")))
  expected$x <- unclass(expected$x)
  expect_equal(df, expected)
})

test_that("dfPaginate", {
  df <- dataFrame(
    a = c("a", "b", "c", "d", "e"),
    b = c(1, 2, 3, 4, 5)
  )

  # Default - no pagination
  expect_equal(
    dfPaginate(df),
    resolvedData(df, rowCount = 5)
  )

  # One page
  expect_equal(
    dfPaginate(df, pageIndex = 0, pageSize = 10),
    resolvedData(df, rowCount = 5)
  )

  # Multiple pages
  expect_equal(
    dfPaginate(df, pageIndex = 0, pageSize = 3),
    resolvedData(df[1:3, ], rowCount = 5)
  )
  expect_equal(
    dfPaginate(df, pageIndex = 1, pageSize = 3),
    resolvedData(df[4:5, ], rowCount = 5)
  )

  # Out of boundaries page index
  expect_equal(
    dfPaginate(df, pageIndex = -2, pageSize = 3),
    resolvedData(df[1:3, ], rowCount = 5)
  )
  expect_equal(
    dfPaginate(df, pageIndex = 999, pageSize = 3),
    resolvedData(df[4:5, ], rowCount = 5)
  )

  # Zero rows
  expect_equal(
    dfPaginate(df[0, ], pageIndex = 0, pageSize = 10),
    resolvedData(df[0, ], rowCount = 0)
  )
})

test_that("backendDf - selectAll returns matching row IDs", {
  backend <- backendDf()
  df <- data.frame(
    name = c("Ford Mustang", "Toyota Corolla", "Honda Civic", "Ford Focus"),
    city = c("Detroit", "Tokyo", "Tokyo", "Detroit"),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "name", type = "character"),
    list(id = "city", type = "character")
  )

  # selectAll with no filters returns all row IDs
  result <- reactableServerData(backend, data = df, columns = columns,
                                selectAll = TRUE)
  expect_s3_class(result, "reactable_selectAllResult")
  expect_equal(sort(result$rowIds), c("0", "1", "2", "3"))

  # selectAll with search filter returns only matching row IDs
  result2 <- reactableServerData(backend, data = df, columns = columns,
                                 selectAll = TRUE, searchValue = "ford")
  expect_equal(sort(result2$rowIds), c("0", "3"))

  # selectAll with column filter
  result3 <- reactableServerData(backend, data = df, columns = columns,
                                 selectAll = TRUE,
                                 filters = list(list(id = "city", value = "tokyo")))
  expect_equal(sort(result3$rowIds), c("1", "2"))
})

# --- paginateSubRows tests ---

test_that("dfPaginateSubRows with all groups collapsed", {
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi", "Audi", "BMW"),
    model = c("Integra", "Legend", "90", "100", "535i"),
    price = c(1, 2, 2, 10, 5),
    `_reactable_rowid` = 0:4,
    check.names = FALSE
  )
  columns <- getAttrib(
    reactable(df[, c("mfr", "model", "price")],
              columns = list(model = colDef(aggregate = "unique"),
                             price = colDef(aggregate = "sum"))),
    "columns"
  )
  grouped <- dfGroupBy(df, list("mfr"), columns = columns)
  result <- dfPaginateSubRows(grouped, pageIndex = 0, pageSize = 10,
                              expanded = list(), groupBy = list("mfr"))

  expect_equal(result$rowCount, 3)
  expect_equal(nrow(result$data), 3)
  expect_equal(result$data$mfr, c("Acura", "Audi", "BMW"))
  expect_equal(result$data[["__state"]]$id, c("mfr:Acura", "mfr:Audi", "mfr:BMW"))
  expect_equal(result$data[["__state"]]$grouped, c(TRUE, TRUE, TRUE))
  expect_equal(result$data[["__state"]]$subRowCount, c("2", "2", "1"))
})

test_that("dfPaginateSubRows with expanded group shows sub-rows", {
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi"),
    model = c("Integra", "Legend", "90"),
    price = c(1, 2, 3),
    `_reactable_rowid` = 0:2,
    check.names = FALSE
  )
  columns <- getAttrib(
    reactable(df[, c("mfr", "model", "price")],
              columns = list(model = colDef(aggregate = "unique"),
                             price = colDef(aggregate = "sum"))),
    "columns"
  )
  grouped <- dfGroupBy(df, list("mfr"), columns = columns)
  result <- dfPaginateSubRows(grouped, pageIndex = 0, pageSize = 10,
                              expanded = list("mfr:Acura" = TRUE),
                              groupBy = list("mfr"))

  # Acura(1) + 2 sub-rows + Audi(1) = 4
  expect_equal(result$rowCount, 4)
  expect_equal(nrow(result$data), 4)

  # Row 1: Acura header
  expect_equal(result$data[["__state"]]$id[1], "mfr:Acura")
  expect_equal(result$data[["__state"]]$grouped[1], TRUE)
  expect_equal(result$data[["__state"]]$subRowCount[1], "2")

  # Rows 2-3: sub-rows with parentId
  expect_equal(result$data[["__state"]]$id[2], "0")
  expect_equal(result$data[["__state"]]$parentId[2], "mfr:Acura")
  expect_equal(result$data$model[2], "Integra")
  expect_equal(result$data[["__state"]]$id[3], "1")
  expect_equal(result$data[["__state"]]$parentId[3], "mfr:Acura")
  expect_equal(result$data$model[3], "Legend")

  # Row 4: Audi header
  expect_equal(result$data[["__state"]]$id[4], "mfr:Audi")
  expect_equal(result$data[["__state"]]$grouped[4], TRUE)
})

test_that("dfPaginateSubRows paginates across group boundaries", {
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Acura", "Audi", "Audi"),
    model = c("Integra", "Legend", "NSX", "90", "100"),
    price = c(1, 2, 3, 4, 5),
    `_reactable_rowid` = 0:4,
    check.names = FALSE
  )
  columns <- getAttrib(
    reactable(df[, c("mfr", "model", "price")],
              columns = list(model = colDef(aggregate = "unique"),
                             price = colDef(aggregate = "sum"))),
    "columns"
  )
  grouped <- dfGroupBy(df, list("mfr"), columns = columns)

  # Acura expanded: header + 3 sub-rows = 4. Audi collapsed: header = 1. Total = 5.
  # Page 1 (pageSize=3): Acura header + 2 sub-rows
  result1 <- dfPaginateSubRows(grouped, pageIndex = 0, pageSize = 3,
                               expanded = list("mfr:Acura" = TRUE),
                               groupBy = list("mfr"))
  expect_equal(result1$rowCount, 5)
  expect_equal(nrow(result1$data), 3)
  expect_equal(result1$data[["__state"]]$id, c("mfr:Acura", "0", "1"))

  # Page 2 (pageSize=3): last Acura sub-row + Audi header
  result2 <- dfPaginateSubRows(grouped, pageIndex = 1, pageSize = 3,
                               expanded = list("mfr:Acura" = TRUE),
                               groupBy = list("mfr"))
  expect_equal(result2$rowCount, 5)
  expect_equal(nrow(result2$data), 2)
  expect_equal(result2$data[["__state"]]$id, c("2", "mfr:Audi"))
  expect_equal(result2$data[["__state"]]$parentId[1], "mfr:Acura")
})

test_that("dfPaginateSubRows multi-level with collapsed top-level", {
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi", "Audi", "BMW"),
    model = c("Integra", "Legend", "90", "100", "535i"),
    price = c(1, 2, 2, 10, 5),
    type = c("Small", "Midsize", "Compact", "Compact", "Midsize"),
    `_reactable_rowid` = 0:4,
    check.names = FALSE
  )
  grouped <- dfGroupBy(df, list("mfr", "type"))
  result <- dfPaginateSubRows(grouped, pageIndex = 0, pageSize = 10,
                              expanded = list(), groupBy = list("mfr", "type"))

  # 3 collapsed top-level groups
  expect_equal(result$rowCount, 3)
  expect_equal(nrow(result$data), 3)
  expect_equal(result$data$mfr, c("Acura", "Audi", "BMW"))
  # subRowCount = sub-group count (not leaf count)
  expect_equal(result$data[["__state"]]$subRowCount, c("2", "1", "1"))
})

test_that("dfPaginateSubRows multi-level with expanded top-level shows sub-groups", {
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi", "Audi", "BMW"),
    model = c("Integra", "Legend", "90", "100", "535i"),
    price = c(1, 2, 2, 10, 5),
    type = c("Small", "Midsize", "Compact", "Compact", "Midsize"),
    `_reactable_rowid` = 0:4,
    check.names = FALSE
  )
  grouped <- dfGroupBy(df, list("mfr", "type"))
  result <- dfPaginateSubRows(grouped, pageIndex = 0, pageSize = 10,
                              expanded = list("mfr:Acura" = TRUE),
                              groupBy = list("mfr", "type"))

  # Acura(1) + Small(1) + Midsize(1) + Audi(1) + BMW(1) = 5
  expect_equal(result$rowCount, 5)
  expect_equal(nrow(result$data), 5)
  expect_equal(result$data[["__state"]]$id,
               c("mfr:Acura", "mfr:Acura.type:Small", "mfr:Acura.type:Midsize",
                 "mfr:Audi", "mfr:BMW"))
  # Acura header subRowCount = 2 (sub-groups)
  expect_equal(result$data[["__state"]]$subRowCount[1], "2")
  # Sub-group headers subRowCount = leaf row count
  expect_equal(result$data[["__state"]]$subRowCount[2], "1") # Small
  expect_equal(result$data[["__state"]]$subRowCount[3], "1") # Midsize
})

test_that("dfPaginateSubRows multi-level with both levels expanded", {
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi"),
    model = c("Integra", "Legend", "90"),
    price = c(1, 2, 3),
    type = c("Small", "Midsize", "Compact"),
    `_reactable_rowid` = 0:2,
    check.names = FALSE
  )
  grouped <- dfGroupBy(df, list("mfr", "type"))
  result <- dfPaginateSubRows(grouped, pageIndex = 0, pageSize = 10,
                              expanded = list("mfr:Acura" = TRUE,
                                              "mfr:Acura.type:Small" = TRUE),
                              groupBy = list("mfr", "type"))

  # Acura(1) + Small(1+1) + Midsize(1) + Audi(1) = 5
  expect_equal(result$rowCount, 5)
  expect_equal(nrow(result$data), 5)
  expect_equal(result$data[["__state"]]$id,
               c("mfr:Acura", "mfr:Acura.type:Small", "0",
                 "mfr:Acura.type:Midsize", "mfr:Audi"))
  # Sub-group headers have parentId
  expect_equal(result$data[["__state"]]$parentId[2], "mfr:Acura")
  expect_equal(result$data[["__state"]]$parentId[4], "mfr:Acura")
  # Leaf sub-row has parentId
  expect_equal(result$data[["__state"]]$parentId[3], "mfr:Acura.type:Small")
  expect_equal(result$data$model[3], "Integra")
})

test_that("reactableServerData with paginateSubRows integration", {
  backend <- backendDf()
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi"),
    model = c("Integra", "Legend", "90"),
    price = c(1, 2, 3)
  )
  columns <- getAttrib(
    reactable(df, columns = list(model = colDef(aggregate = "unique"),
                                 price = colDef(aggregate = "sum"))),
    "columns"
  )

  # All collapsed
  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                groupBy = list("mfr"),
                                paginateSubRows = TRUE, expanded = list())
  expect_equal(result$rowCount, 2)
  expect_equal(result$data[["__state"]]$id, c("mfr:Acura", "mfr:Audi"))

  # Acura expanded
  result2 <- reactableServerData(backend, data = df, columns = columns,
                                 pageIndex = 0, pageSize = 10,
                                 groupBy = list("mfr"),
                                 paginateSubRows = TRUE,
                                 expanded = list("mfr:Acura" = TRUE))
  expect_equal(result2$rowCount, 4)
  expect_equal(nrow(result2$data), 4)
  expect_equal(result2$data[["__state"]]$id, c("mfr:Acura", "0", "1", "mfr:Audi"))
  expect_equal(result2$data[["__state"]]$parentId[2], "mfr:Acura")
})
test_that("dfPaginateSubRows multi-level page boundary inside expanded children", {
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Acura", "Audi"),
    model = c("Integra", "Legend", "NSX", "90"),
    price = c(1, 2, 3, 4),
    type = c("Small", "Midsize", "Large", "Compact"),
    `_reactable_rowid` = 0:3,
    check.names = FALSE
  )
  grouped <- dfGroupBy(df, list("mfr", "type"))

  # Acura expanded (3 sub-groups), Small expanded (1 leaf row)
  # Flat: Acura(1) + Small(1+1) + Midsize(1) + Large(1) + Audi(1) = 6
  expanded <- list("mfr:Acura" = TRUE, "mfr:Acura.type:Small" = TRUE)

  # Page 1 (pageSize=2): Acura header + Small header
  r1 <- dfPaginateSubRows(grouped, pageIndex = 0, pageSize = 2,
                          expanded = expanded, groupBy = list("mfr", "type"))
  expect_equal(r1$rowCount, 6)
  expect_equal(nrow(r1$data), 2)
  expect_equal(r1$data[["__state"]]$id, c("mfr:Acura", "mfr:Acura.type:Small"))

  # Page 2 (pageSize=2): Small leaf row + Midsize header
  r2 <- dfPaginateSubRows(grouped, pageIndex = 1, pageSize = 2,
                          expanded = expanded, groupBy = list("mfr", "type"))
  expect_equal(r2$rowCount, 6)
  expect_equal(nrow(r2$data), 2)
  expect_equal(r2$data[["__state"]]$id, c("0", "mfr:Acura.type:Midsize"))
  expect_equal(r2$data[["__state"]]$parentId[1], "mfr:Acura.type:Small")
  expect_equal(r2$data$model[1], "Integra")

  # Page 3 (pageSize=2): Large header + Audi header
  r3 <- dfPaginateSubRows(grouped, pageIndex = 2, pageSize = 2,
                          expanded = expanded, groupBy = list("mfr", "type"))
  expect_equal(r3$rowCount, 6)
  expect_equal(nrow(r3$data), 2)
  expect_equal(r3$data[["__state"]]$id, c("mfr:Acura.type:Large", "mfr:Audi"))
})
