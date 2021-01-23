mockSession <- function(namespace = NULL) {
  e <- new.env()
  e$input <- list()
  e$msgs <- list()
  e$sendCustomMessage <- function(type, message) {
    msg <- list(type = type, message = message)
    e$msgs[[length(e$msgs) + 1]] <- msg
    e$lastMsg <- msg
    msg
  }
  e$ns <- function(id) {
    shiny::NS(namespace, id)
  }
  e
}

test_that("updateReactable", {
  session <- mockSession()
  expect_error(updateReactable(123, session = session),
               "`outputId` must be a character string")
  expect_error(updateReactable("id", data = list(), session = session),
               "`data` must be a data frame or matrix")
  expect_error(updateReactable("id", selected = TRUE, session = session),
               "`selected` must be numeric")
  expect_error(updateReactable("id", expanded = 123, session = session),
               "`expanded` must be TRUE or FALSE")
  expect_error(updateReactable("id", page = TRUE, session = session),
               "`page` must be a single, positive integer")
  expect_error(updateReactable("id", page = c(1, 3), session = session),
               "`page` must be a single, positive integer")
  expect_error(updateReactable("id", page = 0, session = session),
               "`page` must be a single, positive integer")

  expect_null(updateReactable("id"))
  updateReactable("id", session = session)
  expect_null(session$lastMsg)

  # Update data
  updateReactable("mytbl", data = data.frame(x = 1), session = session)
  expected <- list(
    data = data.frame(x = 1),
    dataKey = digest::digest(data.frame(x = 1)),
    selected = list(),
    expanded = FALSE,
    page = 0
  )
  expect_equal(session$lastMsg, list(type = "__reactable__mytbl", message = expected))
  # Override state resets
  updateReactable("mytbl", data = matrix(4), selected = 3, expanded = TRUE,
                  page = 2, session = session)
  expected <- list(
    data = matrix(4),
    dataKey = digest::digest(matrix(4)),
    selected = list(2),
    expanded = TRUE,
    page = 1
  )
  expect_equal(session$lastMsg, list(type = "__reactable__mytbl", message = expected))

  # Update selected rows
  updateReactable("mytbl", selected = 1, session = session)
  expect_equal(session$lastMsg, list(type = "__reactable__mytbl", message = list(selected = list(0))))
  updateReactable("mytbl", selected = c(1, 3, 5), session = session)
  expect_equal(session$lastMsg, list(type = "__reactable__mytbl", message = list(selected = list(0, 2, 4))))
  updateReactable("mytbl", selected = integer(0), session = session)
  expect_equal(session$lastMsg, list(type = "__reactable__mytbl", message = list(selected = list())))
  updateReactable("mytbl", selected = NA, session = session)
  expect_equal(session$lastMsg, list(type = "__reactable__mytbl", message = list(selected = list())))
  updateReactable("mytbl", selected = NA_real_, session = session)
  expect_equal(session$lastMsg, list(type = "__reactable__mytbl", message = list(selected = list())))
  updateReactable("mytbl", selected = c(3, 5, NA), session = session)
  expect_equal(session$lastMsg, list(type = "__reactable__mytbl", message = list(selected = list(2, 4))))

  # Update expanded rows
  updateReactable("mytbl", expanded = TRUE, session = session)
  expect_equal(session$lastMsg, list(type = "__reactable__mytbl", message = list(expanded = TRUE)))
  updateReactable("mytbl", expanded = FALSE, session = session)
  expect_equal(session$lastMsg, list(type = "__reactable__mytbl", message = list(expanded = FALSE)))

  updateReactable("mytbl", selected = c(1, 3), expanded = FALSE, session = session)
  expect_equal(session$lastMsg, list(
    type = "__reactable__mytbl",
    message = list(selected = list(0, 2), expanded = FALSE)
  ))

  # Update current page
  updateReactable("mytbl", page = 2, session = session)
  expect_equal(session$lastMsg, list(type = "__reactable__mytbl", message = list(page = 1)))

  # Should work with Shiny modules
  session <- mockSession(namespace = "mod")
  updateReactable("mytbl", selected = 2, session = session)
  expect_equal(session$lastMsg, list(type = "__reactable__mod-mytbl", message = list(selected = list(1))))
})

test_that("getReactableState", {
  session <- mockSession()
  expect_error(getReactableState(123, session = session), "`outputId` must be a character string")
  expect_error(getReactableState("id", "x", session = session), '`name` must be one of "page", "pageSize", "pages", "selected"')

  expect_null(getReactableState("id"))
  updateReactable("id", session = session)

  expect_equal(getReactableState("mytbl", session = session), NULL)

  session$input[["mytbl__reactable__page"]] <- 3
  expect_equal(getReactableState("mytbl", "page", session = session), 3)

  session$input[["mytbl__reactable__pageSize"]] <- 2
  expect_equal(getReactableState("mytbl", "pageSize", session = session), 2)

  session$input[["mytbl__reactable__pages"]] <- 10
  expect_equal(getReactableState("mytbl", "pages", session = session), 10)

  session$input[["mytbl__reactable__selected"]] <- c(1, 5, 7)
  expect_equal(getReactableState("mytbl", "selected", session = session), c(1, 5, 7))

  expect_equal(getReactableState("mytbl", session = session),
               list(page = 3, pageSize = 2, pages = 10, selected = c(1, 5, 7)))
})
