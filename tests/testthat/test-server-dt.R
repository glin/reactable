test_that("serverDt - basic pagination", {
  backend <- serverDt()

  df <- dataFrame(
    a = c("a", "b", "c", "d", "e"),
    b = c(1, 2, 3, 4, 5)
  )
  dt <- data.table::as.data.table(df)
  expect_equal(
    reactableServerData(backend, data = df, pageSize = NULL),
    resolvedData(dt, rowCount = 5)
  )
  expect_equal(
    reactableServerData(backend, data = df, pageIndex = 0, pageSize = 10),
    resolvedData(dt, rowCount = 5)
  )
  expect_equal(
    reactableServerData(backend, data = df, pageIndex = 1, pageSize = 3),
    resolvedData(dt[4:5, ], rowCount = 5)
  )
})
