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
  expect_true(is.htmlwidget(reactable(data.frame(x = 1))))
  expect_false(is.htmlwidget(div()))
})

test_that("is.htmlDependency", {
  dep <- htmlDependency("dep", "0.1.0", "/path/to/dep")
  expect_true(is.htmlDependency(dep))
  expect_false(is.htmlDependency(div()))
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
  # Nodes should be strings
  expect_equal(asReactTag("text"), "text")
  expect_equal(asReactTag("\u2718"), "\u2718")
  expect_equal(asReactTag(123), "123")
  expect_equal(asReactTag(TRUE), "TRUE")
  expect_equal(asReactTag(NA), "NA")  # should be "NA" rather than NA_character_
  expect_equal(asReactTag(NA_character_), "NA")  # should be "NA" rather than NA_character_
  expect_equal(asReactTag(factor("xy")), "xy")
  expect_equal(asReactTag(as.Date("2019-01-03")), "2019-01-03")
  expect_equal(asReactTag(list("text")), "text")
  # NULLs should be left as-is
  expect_equal(asReactTag(NULL), NULL)

  # Tags should be extracted from nested tables
  tag <- asReactTag(reactable(data.frame(x = 1)))
  expect_true(is.tag(tag))
  # Nested tables should be marked
  expect_true(tag$attribs$nested)

  # All other htmlwidgets should be converted to tags
  tbl <- reactable(data.frame(x = 1))
  class(tbl) <- c("my-widget", "htmlwidget")
  tag <- asReactTag(tbl)
  expect_equal(tag$name, "WidgetContainer")
  expect_equal(tag$attribs, list(key = digest::digest(tbl)))
  expect_equal(findDependencies(tag), findDependencies(tbl))
  expect_equal(length(tag$children), 1)
  expect_equal(tag$children[[1]]$name, "Fragment")

  # Tag lists should be unnested and wrapped in fragments
  expect_equal(asReactTag(tagList()), reactR::React$Fragment())
  expect_equal(asReactTag(tagList(div("x"))), reactR::React$Fragment(div("x")))
  expect_equal(asReactTag(tagList(div(), "x")), reactR::React$Fragment(div(), "x"))
  # htmlwidgets in tag lists
  tag <- asReactTag(tagList(reactable(data.frame(x = 1)), "y"))
  expect_equal(length(tag$children), 2)
  expect_true(is.tag(tag$children[[1]]))
  expect_equal(tag$children[[2]], "y")

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
  expect_equal(asReactTag(tagList(NULL, "a", tagList(NULL, "b", NULL), div(NULL, "c"))),
               reactR::React$Fragment("a", "b", div("c")))

  # Attributes should be converted
  expect_equal(asReactTag(div(style = "color: red", class = "cls")),
               div(style = list(color = "red"), className = "cls"))

  # Attributes should be preserved
  expect_equal(asReactTag(div(factor("xy"))), div("xy"))
  expect_equal(asReactTag(div(div(as.Date("2019-01-03")))), div(div("2019-01-03")))
})

test_that("asReactTag preserves HTML dependencies", {
  dep <- htmlDependency("dep", "0.1.0", "/path/to/dep")
  dep2 <- htmlDependency("dep2", "0.5.0", "/path/to/dep2")

  # Single tag
  tag <- attachDependencies(div(div("x")), dep)
  expect_equal(htmlDependencies(asReactTag(tag)), list(dep))

  # Tag w/ nested deps
  tag <- div(attachDependencies(div("x"), dep))
  expect_equal(htmlDependencies(asReactTag(tag)$children[[1]]), list(dep))

  # Multiple nested deps
  tag <- div(attachDependencies(div("x"), dep2), attachDependencies(div("x"), dep))
  expect_equal(findDependencies(asReactTag(tag)), list(dep2, dep))

  # Tag list
  tag <- attachDependencies(tagList(div("x")), dep)
  expect_equal(htmlDependencies(asReactTag(tag)), list(dep))

  # Tag list w/ nested tag deps
  tag <- attachDependencies(tagList(div("x"), attachDependencies(div("y"), dep)), dep2)
  expect_equal(findDependencies(asReactTag(tag)), list(dep, dep2))

  # Tag list w/ nested tag list deps
  tag <- attachDependencies(tagList(div("x"), attachDependencies(tagList("y"), dep)), dep2)
  expect_equal(findDependencies(asReactTag(tag)), list(dep2, dep))

  # Tag w/ nested tag list deps
  tag <- div(attachDependencies(tagList(div("x")), dep), div("y"))
  expect_equal(findDependencies(asReactTag(tag)), list(dep))

  # HTML dependency objects
  tag <- tagList("x", "y", dep)
  expect_equal(asReactTag(tag), attachDependencies(reactR::React$Fragment("x", "y"), dep))
  tag <- div("x", div(), dep, dep2, "z")
  expect_equal(asReactTag(tag), attachDependencies(div("x", div(), "z"), list(dep, dep2)))

  # Nested HTML dependency objects
  tag <- tagList("x", div(dep), span("y"))
  expect_equal(asReactTag(tag), reactR::React$Fragment("x", attachDependencies(div(), dep), span("y")))
  tag <- div("x", tagList(dep), span("y"))
  expect_equal(asReactTag(tag), attachDependencies(div("x", span("y")), dep))

  # HTML dependencies in nested tables
  tbl <- reactable(
    data.frame(x = 1),
    columns = list(x = colDef(cell = function() tagList(dep, dep2)))
  )
  tag <- asReactTag(tbl)
  expect_equal(htmlDependencies(tag), list(dep, dep2))
})

test_that("asReactAttributes", {
  attribs <- list(class = "cls", "for" = "id", tabindex = 1)
  expected <- list(className = "cls", htmlFor = "id", tabIndex = 1)
  expect_equal(asReactAttributes(attribs, "th"), expected)

  attribs <- list(value = "x")
  expect_equal(asReactAttributes(attribs, "input"), list(defaultValue = "x"))
  expect_equal(asReactAttributes(attribs, "select"), list(defaultValue = "x"))
  expect_equal(asReactAttributes(attribs, "textarea"), list(defaultValue = "x"))
  expect_equal(asReactAttributes(attribs, "option"), list(value = "x"))
  expect_equal(asReactAttributes(attribs, "button"), list(value = "x"))

  attribs <- list(checked = NA)
  expect_equal(asReactAttributes(attribs, "input"), list(defaultChecked = TRUE))
  expect_equal(asReactAttributes(attribs, "div"), list(checked = NA))

  attribs <- list(onchange = "onChange(this, event)", onclick = "console.log(this, event);")
  expect_equal(
    asReactAttributes(attribs, "select"),
    list(
      onChange = JS("function(_e){(function(event){onChange(this, event)}).apply(event.target,[_e])}"),
      onClick = JS("function(_e){(function(event){console.log(this, event);}).apply(event.target,[_e])}")
    )
  )

  attribs <- list(style = "border: none; color: red; text-align: left")
  expected <- list(style = list(border = "none", color = "red", "text-align" = "left"))
  expect_equal(asReactAttributes(attribs, "div"), expected)

  attribs <- list(style = list(border = "none"))
  expected <- list(style = list(border = "none"))
  expect_equal(asReactAttributes(attribs, "div"), expected)

  # Non-converted attributes
  expect_equal(asReactAttributes(list("data-attr" = "t"), "div"), list("data-attr" = "t"))
  expect_equal(asReactAttributes(list("aria-label" = "lab"), "div"), list("aria-label" = "lab"))
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
