test_that("duckdbQuoteIdentifier quotes column names", {
  expect_equal(duckdbQuoteIdentifier("name"), '"name"')
  expect_equal(duckdbQuoteIdentifier("col with spaces"), '"col with spaces"')
  # Double quotes are escaped by doubling
  expect_equal(duckdbQuoteIdentifier('col"quote'), '"col""quote"')
  expect_equal(duckdbQuoteIdentifier('a"b"c'), '"a""b""c"')
})

test_that("buildDuckdbQuery - basic pagination", {
  columns <- list(
    list(id = "x", type = "numeric"),
    list(id = "y", type = "character")
  )
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = NULL, searchValue = NULL, sortBy = NULL,
                             pageIndex = 0, pageSize = 10)
  expect_equal(result$sql, 'SELECT * FROM reactable_data LIMIT 10 OFFSET 0')
  expect_equal(result$countSql, 'SELECT COUNT(*) AS n FROM reactable_data')
  expect_equal(result$params, list())
})

test_that("buildDuckdbQuery - pagination offset", {
  columns <- list(list(id = "x", type = "numeric"))
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = NULL, searchValue = NULL, sortBy = NULL,
                             pageIndex = 2, pageSize = 25)
  expect_equal(result$sql, 'SELECT * FROM reactable_data LIMIT 25 OFFSET 50')
})

test_that("buildDuckdbQuery - single column sort ASC", {
  columns <- list(list(id = "price", type = "numeric"))
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = NULL, searchValue = NULL,
                             sortBy = list(list(id = "price", desc = FALSE)),
                             pageIndex = 0, pageSize = 10)
  expect_equal(result$sql,
               'SELECT * FROM reactable_data ORDER BY "price" ASC NULLS LAST LIMIT 10 OFFSET 0')
})

test_that("buildDuckdbQuery - single column sort DESC", {
  columns <- list(list(id = "price", type = "numeric"))
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = NULL, searchValue = NULL,
                             sortBy = list(list(id = "price", desc = TRUE)),
                             pageIndex = 0, pageSize = 10)
  expect_equal(result$sql,
               'SELECT * FROM reactable_data ORDER BY "price" DESC NULLS LAST LIMIT 10 OFFSET 0')
})

test_that("buildDuckdbQuery - multi-column sort", {
  columns <- list(
    list(id = "region", type = "character"),
    list(id = "price", type = "numeric")
  )
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = NULL, searchValue = NULL,
                             sortBy = list(
                               list(id = "region", desc = FALSE),
                               list(id = "price", desc = TRUE)
                             ),
                             pageIndex = 0, pageSize = 10)
  expect_equal(result$sql,
               'SELECT * FROM reactable_data ORDER BY "region" ASC NULLS LAST, "price" DESC NULLS LAST LIMIT 10 OFFSET 0')
})

test_that("buildDuckdbQuery - text column filter (ILIKE substring)", {
  columns <- list(
    list(id = "name", type = "character"),
    list(id = "value", type = "numeric")
  )
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = list(list(id = "name", value = "ford")),
                             searchValue = NULL, sortBy = NULL,
                             pageIndex = 0, pageSize = 10)
  expect_equal(result$sql,
               "SELECT * FROM reactable_data WHERE CAST(\"name\" AS VARCHAR) ILIKE '%' || ? || '%' LIMIT 10 OFFSET 0")
  expect_equal(result$countSql,
               "SELECT COUNT(*) AS n FROM reactable_data WHERE CAST(\"name\" AS VARCHAR) ILIKE '%' || ? || '%'")
  expect_equal(result$params, list("ford"))
})

test_that("buildDuckdbQuery - numeric column filter (LIKE starts-with)", {
  columns <- list(
    list(id = "price", type = "numeric")
  )
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = list(list(id = "price", value = "5")),
                             searchValue = NULL, sortBy = NULL,
                             pageIndex = 0, pageSize = 10)
  expect_equal(result$sql,
               "SELECT * FROM reactable_data WHERE CAST(\"price\" AS VARCHAR) LIKE ? || '%' LIMIT 10 OFFSET 0")
  expect_equal(result$params, list("5"))
})

test_that("buildDuckdbQuery - multiple filters combined with AND", {
  columns <- list(
    list(id = "name", type = "character"),
    list(id = "price", type = "numeric")
  )
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = list(
                               list(id = "name", value = "ford"),
                               list(id = "price", value = "3")
                             ),
                             searchValue = NULL, sortBy = NULL,
                             pageIndex = 0, pageSize = 10)
  expect_equal(result$sql, paste0(
    "SELECT * FROM reactable_data",
    " WHERE CAST(\"name\" AS VARCHAR) ILIKE '%' || ? || '%'",
    " AND CAST(\"price\" AS VARCHAR) LIKE ? || '%'",
    " LIMIT 10 OFFSET 0"
  ))
  expect_equal(result$params, list("ford", "3"))
})

test_that("buildDuckdbQuery - global search across all columns", {
  columns <- list(
    list(id = "name", type = "character"),
    list(id = "price", type = "numeric")
  )
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = NULL, searchValue = "hello",
                             sortBy = NULL,
                             pageIndex = 0, pageSize = 10)
  expect_equal(result$sql, paste0(
    "SELECT * FROM reactable_data",
    " WHERE (CAST(\"name\" AS VARCHAR) ILIKE '%' || ? || '%'",
    " OR CAST(\"price\" AS VARCHAR) LIKE ? || '%')",
    " LIMIT 10 OFFSET 0"
  ))
  expect_equal(result$params, list("hello", "hello"))
})

test_that("buildDuckdbQuery - global search respects disableGlobalFilter", {
  columns <- list(
    list(id = "name", type = "character"),
    list(id = "secret", type = "character", disableGlobalFilter = TRUE),
    list(id = "price", type = "numeric")
  )
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = NULL, searchValue = "test",
                             sortBy = NULL,
                             pageIndex = 0, pageSize = 10)
  # "secret" column should be excluded from search
  expect_equal(result$sql, paste0(
    "SELECT * FROM reactable_data",
    " WHERE (CAST(\"name\" AS VARCHAR) ILIKE '%' || ? || '%'",
    " OR CAST(\"price\" AS VARCHAR) LIKE ? || '%')",
    " LIMIT 10 OFFSET 0"
  ))
  expect_equal(result$params, list("test", "test"))
})

test_that("buildDuckdbQuery - filter + sort + pagination combined", {
  columns <- list(
    list(id = "name", type = "character"),
    list(id = "price", type = "numeric")
  )
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = list(list(id = "name", value = "a")),
                             searchValue = NULL,
                             sortBy = list(list(id = "price", desc = TRUE)),
                             pageIndex = 1, pageSize = 5)
  expect_equal(result$sql, paste0(
    "SELECT * FROM reactable_data",
    " WHERE CAST(\"name\" AS VARCHAR) ILIKE '%' || ? || '%'",
    " ORDER BY \"price\" DESC NULLS LAST",
    " LIMIT 5 OFFSET 5"
  ))
  expect_equal(result$countSql,
               "SELECT COUNT(*) AS n FROM reactable_data WHERE CAST(\"name\" AS VARCHAR) ILIKE '%' || ? || '%'")
  expect_equal(result$params, list("a"))
})

test_that("buildDuckdbQuery - filter + search combined", {
  columns <- list(
    list(id = "name", type = "character"),
    list(id = "price", type = "numeric")
  )
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = list(list(id = "name", value = "ford")),
                             searchValue = "abc",
                             sortBy = NULL,
                             pageIndex = 0, pageSize = 10)
  # Column filter AND global search should both appear in WHERE
  expect_equal(result$sql, paste0(
    "SELECT * FROM reactable_data",
    " WHERE CAST(\"name\" AS VARCHAR) ILIKE '%' || ? || '%'",
    " AND (CAST(\"name\" AS VARCHAR) ILIKE '%' || ? || '%'",
    " OR CAST(\"price\" AS VARCHAR) LIKE ? || '%')",
    " LIMIT 10 OFFSET 0"
  ))
  expect_equal(result$params, list("ford", "abc", "abc"))
})

test_that("buildDuckdbQuery - special characters in column names", {
  columns <- list(
    list(id = "col with spaces", type = "character"),
    list(id = 'col"quote', type = "numeric")
  )
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = list(list(id = 'col"quote', value = "5")),
                             searchValue = NULL, sortBy = NULL,
                             pageIndex = 0, pageSize = 10)
  expect_equal(result$sql,
               "SELECT * FROM reactable_data WHERE CAST(\"col\"\"quote\" AS VARCHAR) LIKE ? || '%' LIMIT 10 OFFSET 0")
})

test_that("buildDuckdbQuery - empty search value is ignored", {
  columns <- list(list(id = "x", type = "character"))
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = NULL, searchValue = "",
                             sortBy = NULL,
                             pageIndex = 0, pageSize = 10)
  expect_equal(result$sql, "SELECT * FROM reactable_data LIMIT 10 OFFSET 0")
  expect_equal(result$params, list())
})
