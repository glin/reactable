#' Update a reactable instance
#'
#' `updateReactable()` updates a reactable instance within a Shiny application.
#'
#' @param outputId The Shiny output ID of the `reactable` instance.
#' @param selected Selected rows. Either a numeric vector of row indices,
#'   or `NA` to deselect all rows.
#' @param expanded Expanded rows. Either `TRUE` to expand all rows, or `FALSE`
#'   to collapse all rows.
#' @param page The current page. A single, positive integer.
#' @param session The Shiny session object. Defaults to the current Shiny session.
#'
#' @examples
#' # Run in an interactive R session
#' if (interactive()) {
#'
#' library(shiny)
#' library(reactable)
#'
#' ui <- fluidPage(
#'   actionButton("select_btn", "Select rows"),
#'   actionButton("clear_btn", "Clear selection"),
#'   actionButton("expand_btn", "Expand rows"),
#'   actionButton("collapse_btn", "Collapse rows"),
#'   actionButton("page_btn", "Change page"),
#'   reactableOutput("table")
#' )
#'
#' server <- function(input, output) {
#'   output$table <- renderReactable({
#'     reactable(
#'       iris,
#'       selection = "multiple",
#'       details = function(index) paste("Details for row:", index)
#'     )
#'   })
#'
#'   observeEvent(input$select_btn, {
#'     # Select rows
#'     updateReactable("table", selected = c(1, 3, 5))
#'   })
#'
#'   observeEvent(input$clear_btn, {
#'     # Clear row selection
#'     updateReactable("table", selected = NA)
#'   })
#'
#'   observeEvent(input$expand_btn, {
#'     # Expand all rows
#'     updateReactable("table", expanded = TRUE)
#'   })
#'
#'   observeEvent(input$collapse_btn, {
#'     # Collapse all rows
#'     updateReactable("table", expanded = FALSE)
#'   })
#'
#'   observeEvent(input$page_btn, {
#'     # Change current page
#'     updateReactable("table", page = 3)
#'   })
#' }
#'
#' shinyApp(ui, server)
#' }
#'
#' @export
updateReactable <- function(outputId, selected = NULL, expanded = NULL, page = NULL, session = NULL) {
  if (is.null(session)) {
    if (requireNamespace("shiny", quietly = TRUE)) {
      session <- shiny::getDefaultReactiveDomain()
    }
    if (is.null(session)) {
      # Not in an active Shiny session
      return(invisible(NULL))
    }
  }
  if (!is.character(outputId)) {
    stop("`outputId` must be a character string")
  }
  if (!is.null(selected)) {
    if (!is.numeric(selected) && !is.na(selected)) {
      stop("`selected` must be numeric")
    }
    # Convert to 0-based indexing
    selected <- if (is.numeric(selected)) as.list(as.integer(selected) - 1) else list()
  }
  if (!is.null(expanded) && !is.logical(expanded)) {
    stop("`expanded` must be TRUE or FALSE")
  }
  if (!is.null(page)) {
    if (!is.numeric(page) || length(page) != 1 || page <= 0) {
      stop("`page` must be a single, positive integer")
    }
    # Convert to 0-based indexing
    page <- as.integer(page - 1)
  }
  newState <- filterNulls(list(
    selected = selected,
    expanded = expanded,
    page = page
  ))
  if (length(newState) > 0) {
    session$sendCustomMessage(sprintf("__reactable__%s", outputId), newState)
  }
}
