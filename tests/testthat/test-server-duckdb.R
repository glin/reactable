test_that("serverDuckdb - basic pagination", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- serverDuckdb()
  df <- data.frame(
    x = c(1, 2, 3, 4, 5),
    y = c("a", "b", "c", "d", "e"),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "x", type = "numeric"),
    list(id = "y", type = "character")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  # First page
  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 3)
  expect_true(is.resolvedData(result))
  expect_equal(nrow(result$data), 3)
  expect_equal(result$rowCount, 5)
  expect_equal(result$data$x, c(1, 2, 3))
  expect_equal(result$data$y, c("a", "b", "c"))

  # Second page
  result2 <- reactableServerData(backend, data = df, columns = columns,
                                 pageIndex = 1, pageSize = 3)
  expect_equal(nrow(result2$data), 2)
  expect_equal(result2$rowCount, 5)
  expect_equal(result2$data$x, c(4, 5))
})

test_that("serverDuckdb - sorting", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- serverDuckdb()
  df <- data.frame(
    x = c(3, 1, 5, 2, 4),
    y = c("c", "a", "e", "b", "d"),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "x", type = "numeric"),
    list(id = "y", type = "character")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  # Sort ascending
  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 5,
                                sortBy = list(list(id = "x", desc = FALSE)))
  expect_equal(result$data$x, c(1, 2, 3, 4, 5))
  expect_equal(result$data$y, c("a", "b", "c", "d", "e"))

  # Sort descending
  result2 <- reactableServerData(backend, data = df, columns = columns,
                                 pageIndex = 0, pageSize = 5,
                                 sortBy = list(list(id = "x", desc = TRUE)))
  expect_equal(result2$data$x, c(5, 4, 3, 2, 1))
})

test_that("serverDuckdb - NULLs sort last", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- serverDuckdb()
  df <- data.frame(
    x = c(3, NA, 1, NA, 2),
    stringsAsFactors = FALSE
  )
  columns <- list(list(id = "x", type = "numeric"))
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                sortBy = list(list(id = "x", desc = FALSE)))
  expect_equal(result$data$x, c(1, 2, 3, NA, NA))
})

test_that("serverDuckdb - column filter (text substring)", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- serverDuckdb()
  df <- data.frame(
    name = c("Ford Mustang", "Toyota Corolla", "Ford Focus", "Honda Civic"),
    price = c(25000, 20000, 22000, 21000),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "name", type = "character"),
    list(id = "price", type = "numeric")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                filters = list(list(id = "name", value = "ford")))
  expect_equal(result$rowCount, 2)
  expect_equal(result$data$name, c("Ford Mustang", "Ford Focus"))
})

test_that("serverDuckdb - column filter (numeric starts-with)", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- serverDuckdb()
  df <- data.frame(
    value = c(1, 12, 123, 2, 21, 213),
    stringsAsFactors = FALSE
  )
  columns <- list(list(id = "value", type = "numeric"))
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                filters = list(list(id = "value", value = "12")))
  expect_equal(result$rowCount, 2)
  expect_equal(result$data$value, c(12, 123))
})

test_that("serverDuckdb - global search", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- serverDuckdb()
  df <- data.frame(
    name = c("Ford Mustang", "Toyota Corolla", "Ford Focus", "Honda Civic"),
    city = c("Detroit", "Tokyo", "Detroit", "Tokyo"),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "name", type = "character"),
    list(id = "city", type = "character")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  # Search matches in "name" column
  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                searchValue = "ford")
  expect_equal(result$rowCount, 2)
  expect_equal(result$data$name, c("Ford Mustang", "Ford Focus"))

  # Search matches in "city" column
  result2 <- reactableServerData(backend, data = df, columns = columns,
                                 pageIndex = 0, pageSize = 10,
                                 searchValue = "tokyo")
  expect_equal(result2$rowCount, 2)
  expect_equal(result2$data$name, c("Toyota Corolla", "Honda Civic"))
})

test_that("serverDuckdb - filter + sort + pagination combined", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- serverDuckdb()
  df <- data.frame(
    name = c("a1", "b1", "a2", "b2", "a3", "b3", "a4"),
    value = c(10, 20, 30, 40, 50, 60, 70),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "name", type = "character"),
    list(id = "value", type = "numeric")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  # Filter to "a" names, sort by value desc, get second page of 2
  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 1, pageSize = 2,
                                filters = list(list(id = "name", value = "a")),
                                sortBy = list(list(id = "value", desc = TRUE)))
  expect_equal(result$rowCount, 4) # 4 rows match "a"
  expect_equal(nrow(result$data), 2) # page of 2
  # sorted desc: a4(70), a3(50), a2(30), a1(10) → page 1 = a2(30), a1(10)
  expect_equal(result$data$name, c("a2", "a1"))
  expect_equal(result$data$value, c(30, 10))
})

test_that("serverDuckdb - requires duckdb package", {
  skip_if_not_installed("duckdb")

  # Just verify the backend can be created and initialized without error
  backend <- serverDuckdb()
  expect_s3_class(backend, "reactable_serverDuckdb")
})
