test_that("serverDf - basic pagination", {
  backend <- serverDf()

  df <- dataFrame(
    a = c("a", "b", "c", "d", "e"),
    b = c(1, 2, 3, 4, 5)
  )
  expect_equal(
    backend$data(data = df),
    resolvedData(df, pageCount = 1, rowCount = 5)
  )
  expect_equal(
    backend$data(df, pageIndex = 0, pageSize = 10),
    resolvedData(df, pageCount = 1, rowCount = 5)
  )
  expect_equal(
    backend$data(df, pageIndex = 1, pageSize = 3),
    resolvedData(df[4:5, ], pageCount = 2, rowCount = 5)
  )
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

test_that("dfGroupBy grouped by a string column", {
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi", "Audi", "BMW"),
    model = c("Integra", "Legend", "90", "100", "535i"),
    price = c(1, 2, 2, 10, 5)
  )
  grouped <- dfGroupBy(df, "mfr")

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
  grouped <- dfGroupBy(df, "price")

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
  grouped <- dfGroupBy(df, "mfr")

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
  grouped <- dfGroupBy(df, "price")

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
  grouped <- dfGroupBy(df, c("mfr", "type"))

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
        )
      ),
      listSafeDataFrame(
        type = "Compact",
        .subRows = list(
          dataFrame(
            model = c("90", "100"),
            price = c(2, 10)
          )
        )
      ),
      listSafeDataFrame(
        type = "Midsize",
        .subRows = list(
          dataFrame(
            model = c("535i"),
            price = c(5)
          )
        )
      )
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
  grouped <- dfGroupBy(df, "mfr", columns = columns)

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
  grouped <- dfGroupBy(df, "mfr", columns = columns)

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
    )
  )
  expect_equal(grouped, expected)
})

test_that("dfGroupBy with aggregate functions grouped by a factor column", {
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi"),
    model = c("Integra", "Legend", "90"),
    price = I(list(list(1), list(2), list(2)))
  )
  columns <- getAttrib(
    reactable(df, columns = list(price = colDef(aggregate = "unique"))),
    "columns"
  )
  grouped <- dfGroupBy(df, "mfr", columns = columns)

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
  grouped <- dfGroupBy(df, c("mfr", "type"), columns = columns)

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
        )
      )
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
    resolvedData(df, pageCount = 1, rowCount = 5)
  )

  # One page
  expect_equal(
    dfPaginate(df, pageIndex = 0, pageSize = 10),
    resolvedData(df, pageCount = 1, rowCount = 5)
  )

  # Multiple pages
  expect_equal(
    dfPaginate(df, pageIndex = 0, pageSize = 3),
    resolvedData(df[1:3, ], pageCount = 2, rowCount = 5)
  )
  expect_equal(
    dfPaginate(df, pageIndex = 1, pageSize = 3),
    resolvedData(df[4:5, ], pageCount = 2, rowCount = 5)
  )

  # Out of boundaries page index
  expect_equal(
    dfPaginate(df, pageIndex = -2, pageSize = 3),
    resolvedData(df[1:3, ], pageCount = 2, rowCount = 5)
  )
  expect_equal(
    dfPaginate(df, pageIndex = 999, pageSize = 3),
    resolvedData(df[4:5, ], pageCount = 2, rowCount = 5)
  )

  # Zero rows
  expect_equal(
    dfPaginate(df[0, ], pageIndex = 0, pageSize = 10),
    resolvedData(df[0, ], pageCount = 0, rowCount = 0)
  )
})
