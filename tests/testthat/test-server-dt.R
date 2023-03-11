test_that("serverDt - basic pagination", {
  backend <- serverDt()

  df <- dataFrame(
    a = c("a", "b", "c", "d", "e"),
    b = c(1, 2, 3, 4, 5)
  )
  dt <- data.table::as.data.table(df)
  expect_equal(
    backend$data(data = df),
    resolvedData(dt, pageCount = 1, rowCount = 5)
  )
  expect_equal(
    backend$data(df, pageIndex = 0, pageSize = 10),
    resolvedData(dt, pageCount = 1, rowCount = 5)
  )
  expect_equal(
    backend$data(df, pageIndex = 1, pageSize = 3),
    resolvedData(dt[4:5, ], pageCount = 2, rowCount = 5)
  )
})
