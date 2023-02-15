test_that("server = TRUE works outside of a server-side data context", {
  data <- data.frame(x = c(1, 1), y = c("a", "b"))

  tbl <- reactable(data, server = TRUE)
  tbl <- tbl$preRenderHook(tbl)
  expect_equal(as.character(getAttrib(tbl, "data")), '{"x":[1,1],"y":["a","b"]}')
  expect_equal(getAttrib(tbl, "dataURL"), NULL)

  tbl <- reactable(data, groupBy = "x", server = TRUE)
  tbl <- tbl$preRenderHook(tbl)
  expect_equal(as.character(getAttrib(tbl, "data")), '{"x":[1,1],"y":["a","b"]}')
  expect_equal(getAttrib(tbl, "groupBy"), list("x"))
})
