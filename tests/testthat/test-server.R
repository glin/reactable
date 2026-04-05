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
