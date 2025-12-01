# Get the state of a reactable instance

`getReactableState()` gets the state of a reactable instance within a
Shiny application.

## Usage

``` r
getReactableState(outputId, name = NULL, session = NULL)
```

## Arguments

- outputId:

  The Shiny output ID of the `reactable` instance.

- name:

  Character vector of state value(s) to get. Values must be one of
  `"page"`, `"pageSize"`, `"pages"`, `sorted`, or `"selected"`. If
  unspecified, all values will be returned.

- session:

  The Shiny session object. Defaults to the current Shiny session.

## Value

If `name` is specified, one of the following values:

- `page`: the current page

- `pageSize`: the page size

- `pages`: the number of pages

- `sorted`: the sorted columns - a named list of columns with values of
  `"asc"` for ascending order or `"desc"` for descending order, or
  `NULL` if no columns are sorted

- `selected`: the selected rows - a numeric vector of row indices, or
  `NULL` if no rows are selected

If `name` contains more than one value, `getReactableState()` returns a
named list of the specified values.

If `name` is unspecified, `getReactableState()` returns a named list
containing all values.

If the table has not been rendered yet, `getReactableState()` returns
`NULL`.

## Examples

``` r
# Run in an interactive R session
if (interactive()) {

library(shiny)
library(reactable)
library(htmltools)

ui <- fluidPage(
  actionButton("prev_page_btn", "Previous page"),
  actionButton("next_page_btn", "Next page"),
  reactableOutput("table"),
  verbatimTextOutput("table_state"),
  uiOutput("selected_row_details")
)

server <- function(input, output) {
  output$table <- renderReactable({
    reactable(
      MASS::Cars93[, 1:5],
      showPageSizeOptions = TRUE,
      selection = "multiple",
      onClick = "select"
    )
  })

  output$table_state <- renderPrint({
    state <- req(getReactableState("table"))
    print(state)
  })

  observeEvent(input$prev_page_btn, {
    # Change to the previous page
    page <- getReactableState("table", "page")
    if (page > 1) {
      updateReactable("table", page = page - 1)
    }
  })

  observeEvent(input$next_page_btn, {
    # Change to the next page
    state <- getReactableState("table")
    if (state$page < state$pages) {
      updateReactable("table", page = state$page + 1)
    }
  })

  output$selected_row_details <- renderUI({
    selected <- getReactableState("table", "selected")
    req(selected)
    details <- MASS::Cars93[selected, -c(1:5)]
    tagList(
      h2("Selected row details"),
      tags$pre(
        paste(capture.output(print(details, width = 1200)), collapse = "\n")
      )
    )
  })
}

shinyApp(ui, server)
}
```
