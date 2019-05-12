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

  expect_equal(mergeLists(NULL, list(a = 1, b = 2)), list(a = 1, b = 2))
  expect_equal(mergeLists(list(a = 1, b = 2), NULL), list(a = 1, b = 2))

  a <- list(a = NULL, b = 2, 3)
  b <- list(a = 1, b = NULL, 4)
  expect_equal(mergeLists(a, b), list(a = 1, b = 2, 3, 4))

  a <- list(a = NULL, b = 2)
  b <- list(1, 2, 3)
  expect_equal(mergeLists(a, b), list(a = NULL, b = 2, 1, 2, 3))
})

test_that("filterNulls", {
  expect_equal(filterNulls(list(a = 1, b = NULL, c = NULL, d = 2)), list(a = 1, d = 2))
  expect_equal(filterNulls(list(a = 1, b = "b")), list(a = 1, b = "b"))
  expect_equal(filterNulls(list(a = 1, 2, b = NULL)), list(a = 1, 2))
  expect_equal(filterNulls(list(1, NULL, 2)), list(1, 2))
})

test_that("isNamedList", {
  expect_true(isNamedList(list()))
  expect_true(isNamedList(list(a = 1, b = 2)))
  expect_false(isNamedList(list(1)))
  expect_false(isNamedList(list(1, a = 2)))
  expect_false(isNamedList(NULL))
  expect_false(isNamedList("a"))
})

test_that("is.tag", {
  expect_true(is.tag(htmltools::tags$div()))
  expect_false(is.tag(list()))
})

test_that("is.htmlwidget", {
  expect_true(is.htmlwidget(reactable(data.frame())))
  expect_false(is.htmlwidget(htmltools::div()))
})

test_that("isTagList", {
  expect_true(isTagList(htmltools::tagList()))
  expect_true(isTagList(list(htmltools::div(), htmltools::span())))
  expect_false(isTagList(htmltools::div()))
  expect_false(isTagList(list(htmltools::div(), list())))
})

test_that("asReactTag", {
  expect_equal(asReactTag("text"), "text")
  expect_equal(asReactTag(list("text")), list("text"))

  # HTMLWidgets
  expect_true(is.tag(asReactTag(reactable(data.frame()))))

  # Nested tags
  nestedTag <- htmltools::div(
    list(
      htmltools::div(),
      htmltools::div(list(htmltools::div()))
    )
  )
  expected <- htmltools::div(
    htmltools::div(),
    htmltools::div(htmltools::div())
  )
  expect_equal(asReactTag(nestedTag), expected)

  # Null elements
  expect_equal(asReactTag(htmltools::div(1, NULL, 3)), htmltools::div(1, 3))

  # Attributes
  expect_equal(asReactTag(htmltools::div(style = "color: red", class = "cls")),
               htmltools::div(style = list(color = "red"), className = "cls"))
})

test_that("asReactAttributes", {
  attribs <- list(class = "cls", checked = TRUE, value = "x", "for" = "id")
  expected <- list(className = "cls", defaultChecked = TRUE, defaultValue = "x", htmlFor = "id")
  expect_equal(asReactAttributes(attribs), expected)

  attribs <- list(style = "border: none; color: red; text-align: left")
  expected <- list(style = list(border = "none", color = "red", "text-align" = "left"))
  expect_equal(asReactAttributes(attribs), expected)

  attribs <- list(style = list(border = "none"))
  expected <- list(style = list(border = "none"))
  expect_equal(asReactAttributes(attribs), expected)

  # Non-converted attributes
  expect_equal(asReactAttributes(list("data-attr" = "t")), list("data-attr" = "t"))
})

test_that("asReactStyle", {
  expect_equal(asReactStyle("color: red"), list(color = "red"))
  expect_equal(asReactStyle("color: red;"), list(color = "red"))
  expect_equal(asReactStyle("  color: red; margin-bottom:55px ;"),
               list(color = "red", "margin-bottom" = "55px"))
  expect_equal(asReactStyle("  color: red ;; margin-bott"),
               list(color = "red"))
  expect_equal(asReactStyle("color"), list())
  expect_equal(asReactStyle(list(height = 0)), list(height = 0))
})

test_that("trimws", {
  expect_equal(trimws(" "), "")
  expect_equal(trimws("xvz "), "xvz")
  expect_equal(trimws("abd "), "abd")
  expect_equal(trimws("   xvz "), "xvz")
})
