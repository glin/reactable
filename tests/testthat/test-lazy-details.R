test_that("lazyDetails validates its execution context", {
  df <- data.frame(x = 1:3)
  for (value in list(NA, NULL, 1, "true", c(TRUE, FALSE))) {
    expect_error(reactable(df, lazyDetails = value), "must be TRUE or FALSE")
  }
  expect_error(reactable(df, lazyDetails = TRUE), "active Shiny session")
  calls <- 0L
  reactable(df, details = function(index) { calls <<- calls + 1L; "detail" })
  expect_equal(calls, 3L)
})

test_that("lazy callbacks are deferred, isolated, deduplicated, and released", {
  skip_if_not_installed("shiny", "1.5.0")
  session <- shiny::MockShinySession$new()
  on.exit(session$close())
  calls <- 0L
  value <- shiny::reactiveVal("initial")
  shiny::withReactiveDomain(session, {
    widget <- reactable(data.frame(x = 1:2), lazyDetails = TRUE,
      details = function(index, name) {
        calls <<- calls + 1L
        htmltools::div(paste(index, name, value()))
      })
    expect_equal(calls, 0L)
    expect_equal(getAttribs(widget)$columns[[1]]$details, list(lazy = TRUE))
    config <- getAttribs(widget)$lazyDetails
    registry <- session$userData$reactableLazyDetails
    request <- list(table = config$id, request = "r1", action = "open", index = 2, column = ".details")
    lazyDetailsRequest(registry, request)
    expect_equal(calls, 1L)
    lazyDetailsRequest(registry, request)
    expect_equal(calls, 1L)
    value("changed")
    session$flushReact()
    expect_equal(calls, 1L)
    expect_length(ls(registry$tables[[config$id]]$panels), 1L)
    lazyDetailsRequest(registry, modifyList(request, list(action = "close")))
    expect_length(ls(registry$tables[[config$id]]$panels), 0L)
    lazyDetailsRequest(registry, modifyList(request, list(request = "r2")))
    expect_equal(calls, 2L)
    destroyLazyTable(registry, config$id)
    expect_length(ls(registry$tables), 0L)
    lazyDetailsRequest(registry, modifyList(request, list(request = "r3")))
    expect_equal(calls, 2L)
  })
})

test_that("closing a parent releases every nested callback registration", {
  skip_if_not_installed("shiny", "1.5.0")
  session <- shiny::MockShinySession$new()
  on.exit(session$close())
  calls <- 0L
  shiny::withReactiveDomain(session, {
    widget <- reactable(data.frame(x = 1), lazyDetails = TRUE, details = function(index) {
      reactable(data.frame(y = 1), lazyDetails = TRUE, details = function(index) {
        calls <<- calls + 1L
        "child"
      })
    })
    registry <- session$userData$reactableLazyDetails
    id <- getAttribs(widget)$lazyDetails$id
    request <- list(table = id, request = "r1", action = "open", index = 1, column = ".details")
    lazyDetailsRequest(registry, request)
    expect_equal(calls, 0L)
    expect_length(ls(registry$tables), 2L)
    child <- registry$tables[[id]]$panels$r1$children[[1]]
    lazyDetailsRequest(registry, modifyList(request, list(table = child, request = "r2")))
    expect_equal(calls, 1L)
    lazyDetailsRequest(registry, modifyList(request, list(action = "close")))
    expect_identical(ls(registry$tables), id)
  })
})

test_that("invalid requests cannot execute callbacks", {
  skip_if_not_installed("shiny", "1.5.0")
  session <- shiny::MockShinySession$new()
  on.exit(session$close())
  calls <- 0L
  shiny::withReactiveDomain(session, {
    widget <- reactable(data.frame(x = 1), lazyDetails = TRUE,
      details = function(index) { calls <<- calls + 1L })
    registry <- session$userData$reactableLazyDetails
    request <- list(table = getAttribs(widget)$lazyDetails$id, request = "r1",
      action = "open", index = 1, column = ".details")
    for (index in list(0, 2, -1, 1.5, NA_real_, Inf, "1", c(1, 2))) {
      lazyDetailsRequest(registry, modifyList(request, list(index = index)))
    }
    lazyDetailsRequest(registry, modifyList(request, list(column = "unknown")))
    lazyDetailsRequest(registry, modifyList(request, list(request = "invalid")))
    expect_equal(calls, 0L)
  })
})

test_that("lazy details reject incompatible server and static modes", {
  skip_if_not_installed("shiny", "1.5.0")
  session <- shiny::MockShinySession$new()
  on.exit(session$close())
  shiny::withReactiveDomain(session, {
    expect_error(reactable(data.frame(x = 1), lazyDetails = TRUE, server = TRUE), "combined")
    expect_error(reactable(data.frame(x = 1), lazyDetails = TRUE, static = TRUE), "combined")
  })
})

test_that("requests registered first inside a module use the root input observer", {
  skip_if_not_installed("shiny", "1.5.0")
  session <- shiny::MockShinySession$new()
  on.exit(session$close())
  module <- session$makeScope("module")
  shiny::withReactiveDomain(module, {
    widget <- reactable(data.frame(x = 1), lazyDetails = TRUE, details = function(index) "module")
    expect_identical(getAttribs(widget)$lazyDetails$inputId, session$ns("__reactable_lazy__"))
    registry <- session$userData$reactableLazyDetails
    id <- getAttribs(widget)$lazyDetails$id
    expect_identical(registry$tables[[id]]$session, module)
  })
})

test_that("request batches travel through the Shiny observer", {
  skip_if_not_installed("shiny", "1.5.0")
  session <- shiny::MockShinySession$new()
  on.exit(session$close())
  calls <- integer()
  shiny::withReactiveDomain(session, {
    widget <- reactable(data.frame(x = 1:2), lazyDetails = TRUE,
      details = function(index) { calls <<- c(calls, index); "ok" })
    id <- getAttribs(widget)$lazyDetails$id
    session$setInputs(`__reactable_lazy__` = jsonlite::toJSON(list(
      list(table = id, request = "r1", action = "open", index = 1, column = ".details"),
      list(table = id, request = "r2", action = "open", index = 2, column = ".details")
    ), auto_unbox = TRUE))
    expect_identical(calls, 1:2)
    session$setInputs(`__reactable_lazy__` = "invalid JSON")
    expect_identical(calls, 1:2)
    session$setInputs(`__reactable_lazy__` = jsonlite::toJSON(list(
      list(table = id, request = "r3", action = "open", index = 1, column = ".details")
    ), auto_unbox = TRUE))
    expect_identical(calls, c(1L, 2L, 1L))
  })
})

test_that("silent validation and callback errors do not abort the request observer", {
  skip_if_not_installed("shiny", "1.5.0")
  session <- shiny::MockShinySession$new()
  on.exit(session$close())
  shiny::withReactiveDomain(session, {
    widget <- reactable(data.frame(x = 1:3), lazyDetails = TRUE, details = function(index) {
      if (index == 1L) shiny::req(FALSE)
      if (index == 2L) shiny::validate(shiny::need(FALSE, "Not ready"))
      stop("test failure")
    })
    registry <- session$userData$reactableLazyDetails
    id <- getAttribs(widget)$lazyDetails$id
    request <- function(index) list(table = id, request = paste0("r", index),
      action = "open", index = index, column = ".details")
    expect_silent(lazyDetailsRequest(registry, request(1)))
    expect_silent(lazyDetailsRequest(registry, request(2)))
    expect_message(lazyDetailsRequest(registry, request(3)), "test failure")
    expect_length(ls(registry$tables[[id]]$panels), 3L)
    expect_null(registry$current)
  })
})

test_that("one render owns all registrations and rerendering invalidates them", {
  skip_if_not_installed("shiny", "1.5.0")
  session <- shiny::MockShinySession$new()
  on.exit(session$close())
  module <- session$makeScope("module")
  revision <- shiny::reactiveVal(0L)
  calls <- integer()
  shiny::withReactiveDomain(module, {
    module$output$table <- renderReactable({
      revision()
      widgets <- lapply(1:2, function(index) {
        reactable(data.frame(y = index), lazyDetails = TRUE, details = function(i) {
          calls <<- c(calls, index)
          "child"
        })
      })
      widgets[[2]]
    })
    session$flushReact()
    registry <- session$userData$reactableLazyDetails
    ids <- ls(registry$tables)
    expect_length(ids, 2L)
    expect_setequal(registry$outputs[[module$ns("table")]], ids)
    request <- function(id) list(table = id, request = "r1", action = "open",
      index = 1, column = ".details")
    for (id in ids) lazyDetailsRequest(registry, request(id))
    expect_identical(calls, 1:2)
    expect_error(updateReactable("table", data = data.frame(x = 3:4)), "rerendering")
    expect_silent(updateReactable("table", expanded = FALSE))
    revision(1L)
    session$flushReact()
    expect_length(ls(registry$tables), 2L)
    expect_length(intersect(ids, ls(registry$tables)), 0L)
    for (id in ids) lazyDetailsRequest(registry, request(id))
    expect_identical(calls, 1:2)
    # Switching to an eager result also releases the old callbacks immediately.
    module$output$table <- renderReactable(reactable(data.frame(x = 1:2)))
    session$flushReact()
    expect_length(ls(registry$tables), 0L)
    expect_length(ls(registry$outputs), 0L)
    expect_silent(updateReactable("table", data = data.frame(x = 3:4)))
  })
})


test_that("eager parents reject lazy children that cannot survive reopening", {
  skip_if_not_installed("shiny", "1.5.0")
  session <- shiny::MockShinySession$new()
  on.exit(session$close())
  shiny::withReactiveDomain(session, {
    expect_error(reactable(data.frame(x = 1), details = function(index) {
      reactable(data.frame(y = 1), lazyDetails = TRUE, details = function(index) "child")
    }), "set `lazyDetails = TRUE` on the parent", fixed = TRUE)
  })
})

test_that("failed renders release registrations constructed before the error", {
  skip_if_not_installed("shiny", "1.5.0")
  session <- shiny::MockShinySession$new()
  on.exit(session$close())
  shiny::withReactiveDomain(session, {
    session$output$table <- renderReactable({
      reactable(data.frame(x = 1), lazyDetails = TRUE, details = function(index) "detail")
      stop("render failed")
    })
    expect_error(session$getOutput("table"), "render failed")
    expect_length(ls(session$userData$reactableLazyDetails$tables), 0L)
    expect_length(ls(session$userData$reactableLazyDetails$outputs), 0L)
  })
})

test_that("eager render caching still distinguishes different expressions", {
  skip_if_not_installed("shiny", "1.6.0")
  shiny::testServer(function(input, output, session) {
    output$first <- shiny::bindCache(renderReactable(reactable(data.frame(x = "first"))), 1)
    output$second <- shiny::bindCache(renderReactable(reactable(data.frame(x = "second"))), 1)
  }, {
    expect_match(output$first, '"x":\\["first"\\]')
    expect_match(output$second, '"x":\\["second"\\]')
  })
})
