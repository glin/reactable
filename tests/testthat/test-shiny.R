context("shiny")

mockSession <- function() {
  e <- new.env()
  e$msgs <- list()
  e$sendCustomMessage = function(type, message) {
    msg <- list(type = type, message = message)
    e$msgs[[length(e$msgs) + 1]] <- msg
    e$lastMsg <- msg
    msg
  }
  e
}

test_that("updateReactable", {
  session <- mockSession()
  expect_error(updateReactable(123, session = session), "`outputId` must be a character string")
  expect_error(updateReactable("id", selected = TRUE, session = session), "`selected` must be numeric")
  expect_error(updateReactable("id", expanded = 123, session = session), "`expanded` must be TRUE or FALSE")
  expect_error(updateReactable("id", page = TRUE, session = session), "`page` must be a single, positive integer")
  expect_error(updateReactable("id", page = c(1, 3), session = session), "`page` must be a single, positive integer")
  expect_error(updateReactable("id", page = 0, session = session), "`page` must be a single, positive integer")

  expect_null(updateReactable("id"))
  updateReactable("id", session = session)
  expect_null(session$lastMsg)

  # Update selected rows
  updateReactable("mytbl", selected = 1, session = session)
  expect_equal(session$lastMsg, list(type = "__reactable__mytbl", message = list(selected = list(0))))
  updateReactable("mytbl", selected = c(1, 3, 5), session = session)
  expect_equal(session$lastMsg, list(type = "__reactable__mytbl", message = list(selected = list(0, 2, 4))))

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
})
