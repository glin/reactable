context("utils")

library(htmltools)

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
  expect_true(is.tag(tags$div()))
  expect_false(is.tag(list()))
})

test_that("is.htmlwidget", {
  expect_true(is.htmlwidget(reactable(data.frame())))
  expect_false(is.htmlwidget(div()))
})

test_that("isTagList", {
  expect_true(isTagList(tagList()))
  expect_true(isTagList(tagList("a")))
  expect_true(isTagList(tagList(1, div())))
  expect_true(isTagList(list(div(), span())))
  expect_false(isTagList(div()))
  expect_false(isTagList(list(div(), list())))
})

test_that("asReactTag", {
  expect_equal(asReactTag("text"), "text")
  expect_equal(asReactTag(NULL), NULL)
  expect_equal(asReactTag(list("text")), list("text"))
  expect_equal(asReactTag(123), "123")
  expect_equal(asReactTag(TRUE), "TRUE")

  # Tags should be extracted from htmlwidgets
  expect_true(is.tag(asReactTag(reactable(data.frame()))))

  # Tag lists should be unnested
  tag <- tagList(div("x"))
  expect_equal(asReactTag(tag), div("x"))
  # Multiple elements should be wrapped in a fragment
  tag <- tagList(div(), "x")
  expect_equal(asReactTag(tag), reactR::React$Fragment(div(), "x"))
  # htmlwidgets in tag lists
  tag <- tagList(reactable(data.frame()), "y")
  converted <- asReactTag(tag)
  expect_equal(length(converted$children), 2)
  expect_true(is.tag(converted$children[[1]]))
  expect_equal(converted$children[[2]], "y")

  # Nested tags should be unnested
  nestedTag <- div(
    list(
      div(),
      div(list(div()))
    )
  )
  expected <- div(
    div(),
    div(div())
  )
  expect_equal(asReactTag(nestedTag), expected)

  nestedTag <- div(
    tagList("a", div(
      tagList("b", span("c", class = "c"))
    ))
  )
  expected <- div("a", div("b", span("c", className = "c")))
  expect_equal(asReactTag(nestedTag), expected)

  nestedTagList <- tagList(
    div(class = "a"),
    tagList(
      div(),
      tagList("x", span("y", class = "y"))
    )
  )
  expected <- reactR::React$Fragment(
    div(className = "a"),
    div(),
    "x",
    span("y", className = "y")
  )
  expect_equal(asReactTag(nestedTagList), expected)

  # Null elements should be pruned
  expect_equal(asReactTag(div(1, NULL, 3)), div("1", "3"))

  # Attributes should be converted
  expect_equal(asReactTag(div(style = "color: red", class = "cls")),
               div(style = list(color = "red"), className = "cls"))
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

test_that("callFunc", {
  expect_equal(callFunc(function(x) x, 5), 5)
  expect_equal(callFunc(function(x) x, 5, "a", "b"), 5)
  expect_equal(callFunc(function(x, y) x + y, 5, 1), 6)
  expect_equal(callFunc(function(x, y) x + y, 5, 1), 6)
  expect_equal(callFunc(function(x) x), NULL)
  expect_equal(callFunc(function(x, y) y, "x"), NULL)
})
