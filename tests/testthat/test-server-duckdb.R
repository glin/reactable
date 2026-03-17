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

# --- Grouping tests ---

test_that("serverDuckdb - basic groupBy", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- serverDuckdb()
  df <- data.frame(
    mfr = c("Acura", "Acura", "Audi", "Audi", "BMW"),
    model = c("Integra", "Legend", "90", "100", "535i"),
    price = c(15.9, 33.9, 29.1, 37.7, 30.0),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "mfr", type = "character"),
    list(id = "model", type = "character"),
    list(id = "price", type = "numeric", aggregate = "sum")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                groupBy = list("mfr"))
  expect_true(is.resolvedData(result))
  expect_equal(result$rowCount, 3) # 3 manufacturers
  expect_equal(nrow(result$data), 3)
  expect_true(".subRows" %in% colnames(result$data))
  expect_true("mfr" %in% colnames(result$data))
  expect_true("price" %in% colnames(result$data))

  # Check aggregated values (SUM of price per manufacturer)
  acura_row <- result$data[result$data$mfr == "Acura", ]
  expect_equal(acura_row$price, 15.9 + 33.9)

  # Check sub-rows
  acura_sub <- acura_row$.subRows[[1]]
  expect_equal(nrow(acura_sub), 2)
  expect_true("model" %in% colnames(acura_sub))
})

test_that("serverDuckdb - groupBy with pagination", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- serverDuckdb()
  df <- data.frame(
    grp = c("A", "A", "B", "B", "C", "C", "D", "D"),
    val = 1:8,
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "val", type = "numeric", aggregate = "sum")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  # Page 1: 2 groups
  result1 <- reactableServerData(backend, data = df, columns = columns,
                                 pageIndex = 0, pageSize = 2,
                                 groupBy = list("grp"))
  expect_equal(result1$rowCount, 4) # total groups
  expect_equal(nrow(result1$data), 2) # 2 groups per page
})

test_that("serverDuckdb - groupBy with sort", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- serverDuckdb()
  df <- data.frame(
    grp = c("B", "B", "A", "A", "C", "C"),
    val = c(10, 20, 100, 200, 1, 2),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "val", type = "numeric", aggregate = "sum")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  # Sort by aggregated val DESC: A(300) > B(30) > C(3)
  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                sortBy = list(list(id = "val", desc = TRUE)),
                                groupBy = list("grp"))
  expect_equal(result$data$grp, c("A", "B", "C"))
  expect_equal(result$data$val, c(300, 30, 3))
})

test_that("serverDuckdb - groupBy with filter", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- serverDuckdb()
  df <- data.frame(
    grp = c("A", "A", "B", "B"),
    name = c("apple", "avocado", "banana", "blueberry"),
    val = c(1, 2, 3, 4),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "name", type = "character"),
    list(id = "val", type = "numeric", aggregate = "sum")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  # Filter by name containing "a" → apple, avocado, banana
  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                filters = list(list(id = "name", value = "a")),
                                groupBy = list("grp"))
  expect_equal(result$rowCount, 2) # A and B groups
  acura_row <- result$data[result$data$grp == "A", ]
  expect_equal(acura_row$val, 3) # SUM(1, 2) — both apple and avocado match
  b_row <- result$data[result$data$grp == "B", ]
  expect_equal(b_row$val, 3) # only banana matches
})

test_that("serverDuckdb - groupBy with mean aggregate", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- serverDuckdb()
  df <- data.frame(
    grp = c("A", "A", "B", "B"),
    val = c(10, 20, 30, 40),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "val", type = "numeric", aggregate = "mean")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                groupBy = list("grp"))
  a_row <- result$data[result$data$grp == "A", ]
  b_row <- result$data[result$data$grp == "B", ]
  expect_equal(a_row$val, 15) # mean(10, 20)
  expect_equal(b_row$val, 35) # mean(30, 40)
})

test_that("serverDuckdb - groupBy with count aggregate", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- serverDuckdb()
  df <- data.frame(
    grp = c("A", "A", "A", "B"),
    val = c(1, 2, 3, 4),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "val", type = "numeric", aggregate = "count")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                groupBy = list("grp"))
  a_row <- result$data[result$data$grp == "A", ]
  b_row <- result$data[result$data$grp == "B", ]
  expect_equal(a_row$val, 3)
  expect_equal(b_row$val, 1)
})

test_that("serverDuckdb - groupBy with unique aggregate", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- serverDuckdb()
  df <- data.frame(
    grp = c("A", "A", "A", "B"),
    type = c("Small", "Small", "Large", "Medium"),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "type", type = "character", aggregate = "unique")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                groupBy = list("grp"))
  a_row <- result$data[result$data$grp == "A", ]
  # STRING_AGG(DISTINCT ...) — should have both unique values
  expect_true(grepl("Large", a_row$type))
  expect_true(grepl("Small", a_row$type))
})

test_that("serverDuckdb - groupBy with frequency aggregate", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- serverDuckdb()
  df <- data.frame(
    grp = c("A", "A", "A"),
    type = c("Small", "Small", "Large"),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "type", type = "character", aggregate = "frequency")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                groupBy = list("grp"))
  a_row <- result$data[result$data$grp == "A", ]
  expect_true(grepl("Small \\(2\\)", a_row$type))
  expect_true(grepl("Large \\(1\\)", a_row$type))
})

test_that("serverDuckdb - groupBy returns empty for no matches", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- serverDuckdb()
  df <- data.frame(
    grp = c("A", "B"),
    val = c(1, 2),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "val", type = "numeric", aggregate = "sum")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  # Filter that matches nothing
  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                filters = list(list(id = "val", value = "999")),
                                groupBy = list("grp"))
  expect_equal(result$rowCount, 0)
  expect_equal(nrow(result$data), 0)
})
