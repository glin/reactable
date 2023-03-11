test_that("serverV8 handles server rendering errors", {
  df <- dataFrame(x = c(1, 2, 3, 4, 5), y = c("a", "b", "c", "d", "e"))
  tbl <- reactable(df)
  columns <- getAttrib(tbl, "columns")

  backend <- serverV8()
  backend$init(data = df, columns = columns)

  expect_error(
    backend$data(pageIndex = 0, pageSize = 10, sortBy = "not an array"),
    "Failed to server render table:.+"
  )
})

test_that("pagination", {
  df <- dataFrame(x = c(1, 2, 3, 4, 5), y = c("a", "b", "c", "d", "e"))
  tbl <- reactable(df)
  columns <- getAttrib(tbl, "columns")

  backend <- serverV8()
  backend$init(data = df, columns = columns)

  results <- backend$data(pageIndex = 0, pageSize = 10)
  expected <- df
  expected[["__state"]] <- dataFrame(
    id = c("0", "1", "2", "3", "4"),
    index = c(0, 1, 2, 3, 4)
  )
  expect_equal(results, resolvedData(expected, pageCount = 1, rowCount = 5))

  results <- backend$data(pageIndex = 1, pageSize = 2)
  expected <- dataFrame(x = c(3, 4), y = c("c", "d"))
  expected[["__state"]] <- dataFrame(
    id = c("2", "3"),
    index = c(2, 3)
  )
  expect_equal(results, resolvedData(expected, pageCount = 3, rowCount = 5))
})

test_that("sorting", {
  # Single column sort in ascending order
  df <- dataFrame(
    x = c("aaa", "AAA", "aaa", "a", "B", "b")
  )
  tbl <- reactable(df)
  columns <- getAttrib(tbl, "columns")

  backend <- serverV8()
  backend$init(data = df, columns = columns)

  results <- backend$data(pageIndex = 0, pageSize = 10, sortBy = list(list(id = "x")))
  expected <- dataFrame(
    x = c("a", "aaa", "AAA", "aaa", "B", "b")
  )
  expected[["__state"]] <- dataFrame(
    id = c("3", "0", "1", "2", "4", "5"),
    index = c(3, 0, 1, 2, 4, 5)
  )
  expect_equal(results, resolvedData(expected, pageCount = 1, rowCount = 6))

  # Multiple column sort with descending order
  df <- dataFrame(
    mfr = c("Acura", "Acura", "Audi", "Audi", "BMW"),
    model = c("Integra", "Legend", "90", "100", "535i"),
    price = c(1, 2, 2, 10, 5)
  )
  tbl <- reactable(df)
  columns <- getAttrib(tbl, "columns")

  backend <- serverV8()
  backend$init(data = df, columns = columns)

  results <- backend$data(pageIndex = 0, pageSize = 10,
                          sortBy = list(list(id = "mfr", desc = TRUE), list(id = "price")))
  expected <- dataFrame(
    mfr = c("BMW", "Audi", "Audi", "Acura", "Acura"),
    model = c("535i", "90", "100", "Integra", "Legend"),
    price = c(5, 2, 10, 1, 2)
  )
  expect_equal(results$data[, colnames(df)], expected)
})

test_that("filtering", {
  df <- dataFrame(
    chr = c("aaa", "AAA", "aaa", "cba", "B", "b"),
    num = c(1, 2, 3, 12, 123, 2123)
  )
  tbl <- reactable(df)
  columns <- getAttrib(tbl, "columns")

  backend <- serverV8()
  backend$init(data = df, columns = columns)

  # No filters
  results <- backend$data(pageIndex = 0, pageSize = 10, filters = list())
  results$data[["__state"]] <- NULL
  expect_equal(results, resolvedData(df, pageCount = 1, rowCount = 6))

  # Invalid columns should be ignored
  results <- backend$data(pageIndex = 0, pageSize = 10, filters = list(list(id = "non-existent column", value = "")))
  results$data[["__state"]] <- NULL
  expect_equal(results, resolvedData(df, pageCount = 1, rowCount = 6))

  # Valid column - no match
  # NOTE: Empty results come back as an empty array right now, rather than a
  # object of columns (empty data frame). This coincidentally works fine, but
  # may be fixed in the future.
  results <- backend$data(pageIndex = 0, pageSize = 10, filters = list(list(id = "chr", value = "no-match")))
  results$data[["__state"]] <- NULL
  expect_equal(results, resolvedData(list(), pageCount = 0, rowCount = 0))

  # String filtering (case-insensitive)
  results <- backend$data(pageIndex = 0, pageSize = 10, filters = list(list(id = "chr", value = "a")))
  results$data[["__state"]] <- NULL
  expected <- dataFrame(
    chr = c("aaa", "AAA", "aaa", "cba"),
    num = c(1, 2, 3, 12)
  )
  expect_equal(results, resolvedData(expected, pageCount = 1, rowCount = 4))

  # Numeric filtering - should filter by prefix
  results <- backend$data(pageIndex = 0, pageSize = 10, filters = list(list(id = "num", value = "1")))
  results$data[["__state"]] <- NULL
  expected <- dataFrame(
    chr = c("aaa", "cba", "B"),
    num = c(1, 12, 123)
  )
  expect_equal(results, resolvedData(expected, pageCount = 1, rowCount = 3))

  # Multiple filters
  results <- backend$data(pageIndex = 0, pageSize = 10,
                          filters = list(list(id = "num", value = "21"), list(id = "chr", value = "b")))
  results$data[["__state"]] <- NULL
  expected <- dataFrame(
    chr = c("b"),
    num = c(2123)
  )
  expect_equal(results, resolvedData(expected, pageCount = 1, rowCount = 1))
})

test_that("searching", {
  df <- dataFrame(
    chr = c("aaa", "AAA", "aaa", "cba", "B", "b"),
    num = c(1, 2, 3, 12, 123, 2123)
  )
  tbl <- reactable(df)
  columns <- getAttrib(tbl, "columns")

  backend <- serverV8()
  backend$init(data = df, columns = columns)

  # Empty search value
  results <- backend$data(pageIndex = 0, pageSize = 10, searchValue = "")
  results$data[["__state"]] <- NULL
  expect_equal(results, resolvedData(df, pageCount = 1, rowCount = 6))

  # No match
  # NOTE: Empty results come back as an empty array right now, rather than a
  # object of columns (empty data frame). This coincidentally works fine, but
  # may be fixed in the future.
  results <- backend$data(pageIndex = 0, pageSize = 10, searchValue = "no-match")
  results$data[["__state"]] <- NULL
  expect_equal(results, resolvedData(list(), pageCount = 0, rowCount = 0))

  # String search (case-insensitive)
  results <- backend$data(pageIndex = 0, pageSize = 10, searchValue = "a")
  results$data[["__state"]] <- NULL
  expected <- dataFrame(
    chr = c("aaa", "AAA", "aaa", "cba"),
    num = c(1, 2, 3, 12)
  )
  expect_equal(results, resolvedData(expected, pageCount = 1, rowCount = 4))

  # Numeric searching - should filter by prefix
  results <- backend$data(pageIndex = 0, pageSize = 10, searchValue = "1")
  results$data[["__state"]] <- NULL
  expected <- dataFrame(
    chr = c("aaa", "cba", "B"),
    num = c(1, 12, 123)
  )
  expect_equal(results, resolvedData(expected, pageCount = 1, rowCount = 3))
})
