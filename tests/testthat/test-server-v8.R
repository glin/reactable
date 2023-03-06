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
