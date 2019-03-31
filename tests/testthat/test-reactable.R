context("reactable")

test_that("reactable", {
  expect_error(reactable(1), "must be a data frame or matrix")
})
