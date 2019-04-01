context("utils")

test_that("mergeLists", {
  a <- list(a = 1, b = "b", c = 3)
  b <- list(a = 2, c = 4, d = "d")
  expect_equal(mergeLists(a, b), list(a = 2, b = "b", c = 4, d = "d"))

  a <- list(a = 1, b = 2)
  b <- list()
  expect_equal(mergeLists(a, b), list(a = 1, b = 2))

  a <- list()
  b <- list(a = 1, b = 2)
  expect_equal(mergeLists(a, b), list(a = 1, b = 2))
})
