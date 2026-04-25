test_that("backend warns outside of a Shiny context", {
  data <- data.frame(x = c(1, 1), y = c("a", "b"))

  tbl <- reactable(data, backend = backendV8())
  expect_warning(tbl <- tbl$preRenderHook(tbl), "requires a Shiny session")
  expect_equal(as.character(getAttrib(tbl, "data")), '{"x":[1,1],"y":["a","b"]}')
  expect_equal(getAttrib(tbl, "dataURL"), NULL)

  tbl <- reactable(data, groupBy = "x", backend = backendV8())
  expect_warning(tbl <- tbl$preRenderHook(tbl), "requires a Shiny session")
  expect_equal(as.character(getAttrib(tbl, "data")), '{"x":[1,1],"y":["a","b"]}')
  expect_equal(getAttrib(tbl, "groupBy"), list("x"))
})

test_that("backendDuckDB() auto mode switches to server in preRenderHook", {
  skip_if_not_installed("arrow")
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  data <- data.frame(x = c(1, 2), y = c("a", "b"))
  tbl <- reactable(data, backend = backendDuckDB())

  # preRenderHook should be set for auto mode
  expect_true(!is.null(tbl$preRenderHook))

  # Outside Shiny, preRenderHook keeps client mode (no changes)
  tbl2 <- tbl$preRenderHook(tbl)
  expect_identical(tbl2, tbl)
  expect_equal(getAttrib(tbl2, "backend"), "duckdb")
  expect_true(!is.null(getAttrib(tbl2, "arrowData")))
  expect_null(getAttrib(tbl2, "dataURL"))

  # Inside Shiny, preRenderHook should switch to server mode
  registeredURL <- NULL
  mockShinySession <- new.env(parent = emptyenv())
  mockShinySession$userData <- new.env(parent = emptyenv())
  mockShinySession$registerDataObj <- function(name, data, filterFunc) {
    registeredURL <<- paste0("/session/", name)
    registeredURL
  }
  local_mocked_bindings(
    getDefaultReactiveDomain = function() mockShinySession,
    getCurrentOutputInfo = function(session) list(name = "test_table"),
    .package = "shiny"
  )
  tbl3 <- tbl$preRenderHook(tbl)

  # Should have switched to server mode: dataURL set, client-mode props cleared
  expect_equal(getAttrib(tbl3, "dataURL"), registeredURL)
  expect_null(getAttrib(tbl3, "arrowData"))
  expect_null(getAttrib(tbl3, "parquetId"))
  expect_null(getAttrib(tbl3, "backend"))
  # Should have server row counts
  expect_equal(getAttrib(tbl3, "serverRowCount"), 2)
  expect_null(getAttrib(tbl3, "serverMaxRowCount"))
  # Should have registered data URL with the session
  expect_equal(registeredURL, "/session/test_table")
  # Should have stored backend and data in session$userData
  serverDataStore <- mockShinySession$userData[["__reactable__test_table"]]
  expect_true(!is.null(serverDataStore))
  expect_s3_class(serverDataStore$value$backend, "reactable_backendDuckdb")
  expect_equal(nrow(serverDataStore$value$data), 2)
  expect_false("_reactable_rowid" %in% colnames(serverDataStore$value$data))
  # Should have removed client-mode dependencies (duckdb-wasm, parquet sidecar)
  depNames <- vapply(tbl3$dependencies, function(d) d$name, character(1))
  expect_false("duckdb-wasm" %in% depNames)
  expect_false(any(startsWith(depNames, "reactable-parquet-")))
})

test_that("backendDuckDB(format = 'parquet') auto mode removes parquet dependency", {
  skip_if_not_installed("arrow")
  skip_if_not_installed("duckdb")
  skip_if_not_installed("DBI")

  data <- data.frame(x = c(1, 2), y = c("a", "b"))
  tbl <- reactable(data, backend = backendDuckDB(format = "parquet"))

  # Parquet format should have parquet sidecar dependency in client mode
  depNames <- vapply(tbl$dependencies, function(d) d$name, character(1))
  expect_true(any(startsWith(depNames, "reactable-parquet-")))

  # Inside Shiny, preRenderHook should switch to server mode and remove parquet dep
  registeredURL <- NULL
  mockShinySession <- new.env(parent = emptyenv())
  mockShinySession$userData <- new.env(parent = emptyenv())
  mockShinySession$registerDataObj <- function(name, data, filterFunc) {
    registeredURL <<- paste0("/session/", name)
    registeredURL
  }
  local_mocked_bindings(
    getDefaultReactiveDomain = function() mockShinySession,
    getCurrentOutputInfo = function(session) list(name = "test_table2"),
    .package = "shiny"
  )
  tbl2 <- tbl$preRenderHook(tbl)

  depNames2 <- vapply(tbl2$dependencies, function(d) d$name, character(1))
  expect_false("duckdb-wasm" %in% depNames2)
  expect_false(any(startsWith(depNames2, "reactable-parquet-")))
})

test_that("backendDuckDB(mode = 'client') has no preRenderHook", {
  skip_if_not_installed("arrow")

  data <- data.frame(x = c(1, 2), y = c("a", "b"))
  tbl <- reactable(data, backend = backendDuckDB(mode = "client"))
  # preRenderHook should not be set when user explicitly chose client mode
  expect_null(tbl$preRenderHook)
})
