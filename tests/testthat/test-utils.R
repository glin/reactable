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

  a <- list(a = NULL, b = 2)
  b <- list(a = 1, b = NULL)
  expect_equal(mergeLists(a, b), list(a = 1, b = 2))
})

test_that("isNamedList", {
  expect_true(isNamedList(list()))
  expect_true(isNamedList(list(a = 1, b = 2)))
  expect_false(isNamedList(list(1)))
  expect_false(isNamedList(list(1, a = 2)))
  expect_false(isNamedList(NULL))
  expect_false(isNamedList("a"))
})
