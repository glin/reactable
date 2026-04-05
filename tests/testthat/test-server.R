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

test_that("backendDuckDB() client mode has preRenderHook for Shiny detection", {
  skip_if_not_installed("arrow")

  data <- data.frame(x = c(1, 2), y = c("a", "b"))
  tbl <- reactable(data, backend = backendDuckDB())
  # preRenderHook should be set to warn if rendered in Shiny
  expect_true(!is.null(tbl$preRenderHook))
  # Outside Shiny, no warning should be emitted
  tbl2 <- tbl$preRenderHook(tbl)
  expect_identical(tbl2, tbl)

  # Inside Shiny, should warn about calling reactable() outside renderReactable()
  local_mocked_bindings(
    getDefaultReactiveDomain = function() list(),
    .package = "shiny"
  )
  expect_warning(tbl$preRenderHook(tbl), "outside of a Shiny render function")
})
