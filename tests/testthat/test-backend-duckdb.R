test_that("backendDuckdb - basic pagination", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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

test_that("backendDuckdb - sorting", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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

test_that("backendDuckdb - NULLs sort last", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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

test_that("backendDuckdb - column filter (text substring)", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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

test_that("backendDuckdb - column filter (numeric starts-with)", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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

test_that("backendDuckdb - global search", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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

test_that("backendDuckdb - filter + sort + pagination combined", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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

test_that("backendDuckdb - requires duckdb package", {
  skip_if_not_installed("duckdb")

  # Just verify the backend can be created and initialized without error
  backend <- backendDuckdbServer()
  expect_s3_class(backend, "reactable_backendDuckdb")
})

test_that("backendDuckdb - virtual columns like .selection are excluded from queries", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
  df <- data.frame(
    name = c("Ford Mustang", "Toyota Corolla"),
    value = c(10, 20),
    stringsAsFactors = FALSE
  )
  # Include a .selection virtual column like reactable does for selection = "multiple"
  columns <- list(
    list(id = ".selection", type = "character"),
    list(id = "name", type = "character"),
    list(id = "value", type = "numeric")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  # Global search should not reference .selection column
  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                searchValue = "ford")
  expect_equal(result$rowCount, 1)
  expect_equal(result$data$name, "Ford Mustang")
})

test_that("backendDuckdb - selectAll returns matching row IDs", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
  df <- data.frame(
    name = c("Ford Mustang", "Toyota Corolla", "Honda Civic", "Ford Focus"),
    city = c("Detroit", "Tokyo", "Tokyo", "Detroit"),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "name", type = "character"),
    list(id = "city", type = "character")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  # selectAll with no filters returns all row IDs
  result <- reactableServerSelectAll(backend, data = df, columns = columns)
  expect_s3_class(result, "reactable_selectAllResult")
  expect_equal(sort(result$rowIds), c("0", "1", "2", "3"))

  # selectAll with search filter returns only matching row IDs
  result2 <- reactableServerSelectAll(backend, data = df, columns = columns,
                                      searchValue = "ford")
  expect_equal(sort(result2$rowIds), c("0", "3"))

  # selectAll with column filter
  result3 <- reactableServerSelectAll(backend, data = df, columns = columns,
                                      filters = list(list(id = "city", value = "tokyo")))
  expect_equal(sort(result3$rowIds), c("1", "2"))
})

# --- Grouping tests ---

test_that("backendDuckdb - basic groupBy", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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

test_that("backendDuckdb - groupBy with pagination", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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

test_that("backendDuckdb - groupBy with sort", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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

test_that("backendDuckdb - groupBy with filter", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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

test_that("backendDuckdb - groupBy with mean aggregate", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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

test_that("backendDuckdb - groupBy with count aggregate", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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

test_that("backendDuckdb - groupBy with unique aggregate", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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

test_that("backendDuckdb - groupBy with frequency aggregate", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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

test_that("backendDuckdb - groupBy returns empty for no matches", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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

test_that("backendDuckdb - flat rows have __state with stable row IDs", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
  df <- data.frame(
    x = c(10, 20, 30, 40, 50),
    stringsAsFactors = FALSE
  )
  columns <- list(list(id = "x", type = "numeric"))
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  # First page: row IDs should be 0-based original indices
  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 3)
  expect_equal(result$data$`__state`,
    data.frame(id = as.character(0:2), index = 0:2, stringsAsFactors = FALSE)
  )

  # Second page: row IDs should continue from original data
  result2 <- reactableServerData(backend, data = df, columns = columns,
                                 pageIndex = 1, pageSize = 3)
  expect_equal(result2$data$`__state`,
    data.frame(id = as.character(3:4), index = 3:4, stringsAsFactors = FALSE)
  )

  # _reactable_rowid should not appear in data
  expect_false("_reactable_rowid" %in% colnames(result$data))
})

test_that("backendDuckdb - sorted rows preserve original __state IDs", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
  df <- data.frame(
    x = c(30, 10, 20),
    stringsAsFactors = FALSE
  )
  columns <- list(list(id = "x", type = "numeric"))
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  # Sort ascending: original indices should be preserved
  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                sortBy = list(list(id = "x", desc = FALSE)))
  expect_equal(result$data$x, c(10, 20, 30))
  expect_equal(result$data$`__state`,
    data.frame(id = c("1", "2", "0"), index = c(1L, 2L, 0L), stringsAsFactors = FALSE)
  )
})

test_that("backendDuckdb - grouped rows have __state with id", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
  df <- data.frame(
    grp = c("A", "A", "B"),
    val = c(1, 2, 3),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "val", type = "numeric", aggregate = "sum")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                groupBy = list("grp"))

  # Group header rows should have __state with "grp:value" format
  groupIds <- result$data$`__state`$id
  expect_true(setequal(groupIds, c("grp:A", "grp:B")))
  expect_true(all(result$data$`__state`$grouped))

  # Sub-rows for group A should have __state with stable row IDs (0, 1)
  groupAIdx <- which(result$data$grp == "A")
  subRowsA <- result$data$.subRows[[groupAIdx]]
  subRowIds <- subRowsA$`__state`$id
  subRowIndices <- subRowsA$`__state`$index
  expect_true(setequal(subRowIds, c("0", "1")))
  expect_true(setequal(subRowIndices, c(0L, 1L)))

  # _reactable_rowid should not appear in sub-rows
  expect_false("_reactable_rowid" %in% colnames(subRowsA))
})

# --- paginateSubRows tests ---

test_that("backendDuckdb - paginateSubRows with all groups collapsed", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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
                                groupBy = list("mfr"),
                                paginateSubRows = TRUE, expanded = list())
  expect_true(is.resolvedData(result))
  expect_equal(result$rowCount, 3)
  expect_equal(nrow(result$data), 3)

  # Should NOT have .subRows (flat format)
  expect_false(".subRows" %in% colnames(result$data))

  # All rows should be group headers
  expect_true(all(result$data$`__state`$grouped))
  expect_true(all(result$data$`__state`$subRowCount > 0))
  expect_true(all(c("mfr:Acura", "mfr:Audi", "mfr:BMW") %in% result$data$`__state`$id))
})

test_that("backendDuckdb - paginateSubRows with expanded group shows sub-rows", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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
                                sortBy = list(list(id = "mfr", desc = FALSE)),
                                groupBy = list("mfr"),
                                paginateSubRows = TRUE,
                                expanded = list("mfr:Acura" = TRUE))
  # 3 group headers + 2 Acura sub-rows = 5
  expect_equal(result$rowCount, 5)
  expect_equal(nrow(result$data), 5)

  # Find Acura group header
  acuraIdx <- which(result$data$`__state`$id == "mfr:Acura")
  expect_length(acuraIdx, 1)
  expect_true(result$data$`__state`$grouped[acuraIdx])
  expect_equal(result$data$`__state`$subRowCount[acuraIdx], "2")

  # Sub-rows should have parentId = "mfr:Acura"
  subRowIdx <- which(result$data$`__state`$parentId == "mfr:Acura")
  expect_length(subRowIdx, 2)

  # _reactable_rowid should not appear
  expect_false("_reactable_rowid" %in% colnames(result$data))
})

test_that("backendDuckdb - paginateSubRows paginates across group boundaries", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
  df <- data.frame(
    grp = c("A", "A", "A", "B", "B"),
    val = c(1, 2, 3, 4, 5),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "val", type = "numeric", aggregate = "sum")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  # Expand group A (3 sub-rows) + group B (2 sub-rows)
  # Flat: [A header, A:1, A:2, A:3, B header, B:4, B:5] = 7 rows
  expanded <- list("grp:A" = TRUE, "grp:B" = TRUE)

  # Page 1: first 3 rows (A header + 2 sub-rows)
  r1 <- reactableServerData(backend, data = df, columns = columns,
                             pageIndex = 0, pageSize = 3,
                             sortBy = list(list(id = "grp", desc = FALSE)),
                             groupBy = list("grp"),
                             paginateSubRows = TRUE, expanded = expanded)
  expect_equal(r1$rowCount, 7)
  expect_equal(nrow(r1$data), 3)
  expect_equal(r1$data$`__state`$id[1], "grp:A")
  expect_true(r1$data$`__state`$grouped[1])

  # Page 2: next 3 rows (A:3 sub-row, B header, B:4 sub-row)
  r2 <- reactableServerData(backend, data = df, columns = columns,
                             pageIndex = 1, pageSize = 3,
                             sortBy = list(list(id = "grp", desc = FALSE)),
                             groupBy = list("grp"),
                             paginateSubRows = TRUE, expanded = expanded)
  expect_equal(nrow(r2$data), 3)
  # Should contain B header
  expect_true("grp:B" %in% r2$data$`__state`$id)
})

test_that("backendDuckdb - paginateSubRows multi-level with collapsed top-level", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
  df <- data.frame(
    mfr = c("Acura", "Acura", "Acura", "Audi", "Audi"),
    type = c("Small", "Small", "Compact", "Small", "Small"),
    model = c("Integra", "Legend", "CL", "A4", "A6"),
    price = c(15.9, 33.9, 20.0, 29.1, 37.7),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "mfr", type = "character"),
    list(id = "type", type = "character"),
    list(id = "model", type = "character"),
    list(id = "price", type = "numeric", aggregate = "sum")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                groupBy = list("mfr", "type"),
                                paginateSubRows = TRUE, expanded = list())
  # All collapsed: just 2 top-level groups
  expect_equal(result$rowCount, 2)
  expect_equal(nrow(result$data), 2)
  expect_true(all(result$data$`__state`$grouped))
  # subRowCount should be count of sub-groups, not leaf rows
  acuraIdx <- which(result$data$mfr == "Acura")
  expect_equal(result$data$`__state`$subRowCount[acuraIdx], "2") # Small + Compact
})

test_that("backendDuckdb - paginateSubRows multi-level with expanded top-level", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
  df <- data.frame(
    mfr = c("Acura", "Acura", "Acura", "Audi", "Audi"),
    type = c("Small", "Small", "Compact", "Small", "Small"),
    model = c("Integra", "Legend", "CL", "A4", "A6"),
    price = c(15.9, 33.9, 20.0, 29.1, 37.7),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "mfr", type = "character"),
    list(id = "type", type = "character"),
    list(id = "model", type = "character"),
    list(id = "price", type = "numeric", aggregate = "sum")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  # Expand Acura: shows its 2 sub-groups (Small, Compact), collapsed
  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                sortBy = list(list(id = "mfr", desc = FALSE)),
                                groupBy = list("mfr", "type"),
                                paginateSubRows = TRUE,
                                expanded = list("mfr:Acura" = TRUE))
  # Acura header (1) + 2 sub-groups (2) + Audi header (1) = 4
  expect_equal(result$rowCount, 4)
  expect_equal(nrow(result$data), 4)

  # Acura header should be present
  expect_true("mfr:Acura" %in% result$data$`__state`$id)

  # Acura's sub-groups should have parentId = "mfr:Acura"
  subGroupIdx <- which(result$data$`__state`$parentId == "mfr:Acura")
  expect_length(subGroupIdx, 2)
  subGroupIds <- result$data$`__state`$id[subGroupIdx]
  expect_true(all(grepl("^mfr:Acura\\.type:", subGroupIds)))
})

test_that("backendDuckdb - paginateSubRows multi-level both levels expanded", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
  df <- data.frame(
    mfr = c("Acura", "Acura", "Acura", "Audi", "Audi"),
    type = c("Small", "Small", "Compact", "Small", "Small"),
    model = c("Integra", "Legend", "CL", "A4", "A6"),
    price = c(15.9, 33.9, 20.0, 29.1, 37.7),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "mfr", type = "character"),
    list(id = "type", type = "character"),
    list(id = "model", type = "character"),
    list(id = "price", type = "numeric", aggregate = "sum")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  # Expand Acura and its Small sub-group
  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 20,
                                sortBy = list(list(id = "mfr", desc = FALSE)),
                                groupBy = list("mfr", "type"),
                                paginateSubRows = TRUE,
                                expanded = list(
                                  "mfr:Acura" = TRUE,
                                  "mfr:Acura.type:Small" = TRUE
                                ))
  # Acura(1) + Small(1) + 2 leaves + Compact(1) + Audi(1) = 6
  expect_equal(result$rowCount, 6)
  expect_equal(nrow(result$data), 6)

  # Leaf rows should have parentId pointing to their sub-group
  leafRows <- which(!is.na(result$data$`__state`$index))
  expect_true(all(result$data$`__state`$parentId[leafRows] == "mfr:Acura.type:Small"))

  # Leaf rows should only be from Acura's Small group (Integra, Legend), not Audi's
  leafModels <- sort(result$data$model[leafRows])
  expect_equal(leafModels, c("Integra", "Legend"))
})

test_that("backendDuckdb - paginateSubRows multi-level page boundary inside expanded children", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
  df <- data.frame(
    mfr = c("Acura", "Acura", "Acura", "Audi", "Audi"),
    type = c("Small", "Small", "Compact", "Small", "Small"),
    model = c("Integra", "Legend", "CL", "A4", "A6"),
    price = c(15.9, 33.9, 20.0, 29.1, 37.7),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "mfr", type = "character"),
    list(id = "type", type = "character"),
    list(id = "model", type = "character"),
    list(id = "price", type = "numeric", aggregate = "sum")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  # Expand both levels of Acura
  # With default sort, Compact comes before Small alphabetically
  # Flat: Acura(1), Compact(1), Small(1), Integra, Legend, Audi(1) = 6
  expanded <- list("mfr:Acura" = TRUE, "mfr:Acura.type:Small" = TRUE)
  sortBy <- list(list(id = "mfr", desc = FALSE))

  # Page 1 (pageSize=2): Acura header + Compact header
  r1 <- reactableServerData(backend, data = df, columns = columns,
                             pageIndex = 0, pageSize = 2,
                             sortBy = sortBy,
                             groupBy = list("mfr", "type"),
                             paginateSubRows = TRUE, expanded = expanded)
  expect_equal(r1$rowCount, 6)
  expect_equal(nrow(r1$data), 2)
  expect_equal(r1$data$`__state`$id[1], "mfr:Acura")
  expect_true(grepl("type:Compact", r1$data$`__state`$id[2]))

  # Page 2 (pageSize=2): Small header + Integra leaf
  r2 <- reactableServerData(backend, data = df, columns = columns,
                             pageIndex = 1, pageSize = 2,
                             sortBy = sortBy,
                             groupBy = list("mfr", "type"),
                             paginateSubRows = TRUE, expanded = expanded)
  expect_equal(nrow(r2$data), 2)
  expect_true(grepl("type:Small", r2$data$`__state`$id[1]))

  # Page 3 (pageSize=2): Legend leaf + Audi header
  r3 <- reactableServerData(backend, data = df, columns = columns,
                             pageIndex = 2, pageSize = 2,
                             sortBy = sortBy,
                             groupBy = list("mfr", "type"),
                             paginateSubRows = TRUE, expanded = expanded)
  expect_equal(nrow(r3$data), 2)
})


# Lazy sub-row fetching (9E) ---------------------------------------------------------

test_that("backendDuckdb - lazy expansion: collapsed groups have empty subRows with subRowCount", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
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
                                groupBy = list("mfr"),
                                expanded = list())

  expect_equal(result$rowCount, 3)
  expect_equal(nrow(result$data), 3)

  # All groups collapsed: empty sub-rows with subRowCount
  for (i in seq_len(nrow(result$data))) {
    expect_equal(nrow(result$data[[".subRows"]][[i]]), 0)
  }
  expect_true(all(!is.na(result$data[["__state"]]$subRowCount)))
  expect_true(all(result$data[["__state"]]$subRowCount > 0))

  # SQL aggregates should still be computed
  acura_row <- result$data[result$data$mfr == "Acura", ]
  expect_equal(acura_row$price, 15.9 + 33.9)
})

test_that("backendDuckdb - lazy expansion: expanded group gets sub-rows", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
  df <- data.frame(
    mfr = c("Acura", "Acura", "Audi", "Audi"),
    model = c("Integra", "Legend", "90", "100"),
    price = c(15.9, 33.9, 29.1, 37.7),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "mfr", type = "character"),
    list(id = "model", type = "character"),
    list(id = "price", type = "numeric", aggregate = "sum")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  expanded <- list("mfr:Acura" = TRUE)
  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                groupBy = list("mfr"),
                                expanded = expanded)

  # Acura: expanded, has sub-rows
  acura_idx <- which(result$data$mfr == "Acura")
  expect_equal(nrow(result$data[[".subRows"]][[acura_idx]]), 2)
  # subRowCount should be NA for expanded groups
  expect_true(is.na(result$data[["__state"]]$subRowCount[acura_idx]))

  # Audi: collapsed, empty sub-rows with subRowCount
  audi_idx <- which(result$data$mfr == "Audi")
  expect_equal(nrow(result$data[[".subRows"]][[audi_idx]]), 0)
  expect_equal(result$data[["__state"]]$subRowCount[audi_idx], 2L)
})

test_that("backendDuckdb - lazy expansion: expanded=NULL fetches all sub-rows (backward compat)", {
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  backend <- backendDuckdbServer()
  df <- data.frame(
    mfr = c("Acura", "Acura", "Audi"),
    model = c("Integra", "Legend", "90"),
    stringsAsFactors = FALSE
  )
  columns <- list(
    list(id = "mfr", type = "character"),
    list(id = "model", type = "character")
  )
  reactableServerInit(backend, data = df, columns = columns)
  on.exit(DBI::dbDisconnect(backend$private$con, shutdown = TRUE), add = TRUE)

  result <- reactableServerData(backend, data = df, columns = columns,
                                pageIndex = 0, pageSize = 10,
                                groupBy = list("mfr"))

  # All sub-rows should be present (no lazy fetching)
  acura_idx <- which(result$data$mfr == "Acura")
  expect_equal(nrow(result$data[[".subRows"]][[acura_idx]]), 2)
  audi_idx <- which(result$data$mfr == "Audi")
  expect_equal(nrow(result$data[[".subRows"]][[audi_idx]]), 1)
})
