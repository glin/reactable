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

# --- GROUP BY tests ---

test_that("duckdbAggregateSQL maps all supported aggregates", {
  expect_equal(duckdbAggregateSQL("sum", "x"), 'SUM("x")')
  expect_equal(duckdbAggregateSQL("mean", "x"), 'AVG("x")')
  expect_equal(duckdbAggregateSQL("max", "x"), 'MAX("x")')
  expect_equal(duckdbAggregateSQL("min", "x"), 'MIN("x")')
  expect_equal(duckdbAggregateSQL("median", "x"), 'MEDIAN("x")')
  expect_equal(duckdbAggregateSQL("count", "x"), 'COUNT("x")')
  expect_equal(duckdbAggregateSQL("unique", "x"), "STRING_AGG(DISTINCT CAST(\"x\" AS VARCHAR), ', ' ORDER BY 1)")
  # frequency returns NULL (computed from sub-rows)
  expect_null(duckdbAggregateSQL("frequency", "x"))
  # Unknown aggregate returns NULL
  expect_null(duckdbAggregateSQL("custom_func", "x"))
})

test_that("duckdbAggregateSQL escapes column names", {
  expect_equal(duckdbAggregateSQL("sum", 'col"name'), 'SUM("col""name")')
})

test_that("buildDuckdbQuery with groupBy returns grouped query", {
  columns <- list(
    list(id = "region", type = "character"),
    list(id = "city", type = "character"),
    list(id = "revenue", type = "numeric", aggregate = "sum")
  )
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = NULL, searchValue = NULL, sortBy = NULL,
                             pageIndex = 0, pageSize = 10,
                             groupBy = list("region"))

  expect_true("groupSql" %in% names(result))
  expect_true("countSql" %in% names(result))
  expect_match(result$groupSql, 'SELECT "region", SUM\\("revenue"\\) AS "revenue"')
  expect_match(result$groupSql, 'GROUP BY "region"')
  expect_match(result$groupSql, "LIMIT 10 OFFSET 0")
  expect_match(result$countSql, 'COUNT\\(DISTINCT "region"\\)')
  # "city" has no aggregate, should not be in the SELECT
  expect_false(grepl('"city"', result$groupSql))
})

test_that("buildDuckdbQuery with groupBy sorts by group column", {
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "val", type = "numeric", aggregate = "sum")
  )
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = NULL, searchValue = NULL,
                             sortBy = list(list(id = "grp", desc = TRUE)),
                             pageIndex = 0, pageSize = 10,
                             groupBy = list("grp"))
  expect_match(result$groupSql, 'ORDER BY "grp" DESC NULLS LAST')
})

test_that("buildDuckdbQuery with groupBy sorts by aggregated column", {
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "val", type = "numeric", aggregate = "sum")
  )
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = NULL, searchValue = NULL,
                             sortBy = list(list(id = "val", desc = FALSE)),
                             pageIndex = 0, pageSize = 10,
                             groupBy = list("grp"))
  expect_match(result$groupSql, 'ORDER BY SUM\\("val"\\) ASC NULLS LAST')
})

test_that("buildDuckdbQuery with groupBy does not sort by non-aggregated column", {
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "name", type = "character") # no aggregate
  )
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = NULL, searchValue = NULL,
                             sortBy = list(list(id = "name", desc = FALSE)),
                             pageIndex = 0, pageSize = 10,
                             groupBy = list("grp"))
  expect_false(grepl("ORDER BY", result$groupSql))
})

test_that("buildDuckdbQuery with groupBy applies filters", {
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "val", type = "numeric")
  )
  result <- buildDuckdbQuery("reactable_data", columns,
                             filters = list(list(id = "val", value = "5")),
                             searchValue = NULL, sortBy = NULL,
                             pageIndex = 0, pageSize = 10,
                             groupBy = list("grp"))
  expect_match(result$groupSql, "LIKE \\? \\|\\| '%'")
  expect_equal(result$params, list("5"))
})

test_that("buildDuckdbSubRowSql builds correct sub-row query", {
  baseWhere <- list(clauses = character(0), params = list())
  parentFilters <- list(
    clauses = c('"region" = ?'),
    params = list("East")
  )
  sortBy <- list(list(id = "val", desc = TRUE))

  result <- buildDuckdbSubRowSql("reactable_data", baseWhere, parentFilters, sortBy)

  expect_equal(result$sql,
               'SELECT * FROM reactable_data WHERE "region" = ? ORDER BY "val" DESC NULLS LAST')
  expect_equal(result$params, list("East"))
})

test_that("buildDuckdbSubRowSql combines base and parent filters", {
  baseWhere <- list(
    clauses = c("CAST(\"name\" AS VARCHAR) ILIKE '%' || ? || '%'"),
    params = list("test")
  )
  parentFilters <- list(
    clauses = c('"grp" = ?'),
    params = list("A")
  )

  result <- buildDuckdbSubRowSql("reactable_data", baseWhere, parentFilters, sortBy = NULL)
  expect_match(result$sql, "ILIKE")
  expect_match(result$sql, '"grp" = \\?')
  expect_equal(result$params, list("test", "A"))
})

test_that("buildDuckdbGroupSortClauses handles group column sort", {
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "val", type = "numeric", aggregate = "sum")
  )
  sortBy <- list(list(id = "grp", desc = FALSE))
  clauses <- buildDuckdbGroupSortClauses(sortBy, "grp", columns, "grp")
  expect_equal(clauses, '"grp" ASC NULLS LAST')
})

test_that("buildDuckdbGroupSortClauses handles aggregated column sort", {
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "val", type = "numeric", aggregate = "sum")
  )
  sortBy <- list(list(id = "val", desc = TRUE))
  clauses <- buildDuckdbGroupSortClauses(sortBy, "grp", columns, "grp")
  expect_equal(clauses, 'SUM("val") DESC NULLS LAST')
})

test_that("buildDuckdbGroupSortClauses skips non-aggregated columns", {
  columns <- list(
    list(id = "grp", type = "character"),
    list(id = "name", type = "character") # no aggregate
  )
  sortBy <- list(list(id = "name", desc = FALSE))
  clauses <- buildDuckdbGroupSortClauses(sortBy, "grp", columns, "grp")
  expect_equal(clauses, character(0))
})

test_that("duckdbComputeAggregate computes frequency", {
  values <- c("A", "A", "B", "C", "C", "C")
  result <- duckdbComputeAggregate("frequency", values)
  expect_match(result, "A \\(2\\)")
  expect_match(result, "B \\(1\\)")
  expect_match(result, "C \\(3\\)")
})

test_that("duckdbComputeAggregate returns NA for unknown aggregates", {
  expect_true(is.na(duckdbComputeAggregate("unknown", c(1, 2, 3))))
})
