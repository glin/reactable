# Update a reactable instance

`updateReactable()` updates a reactable instance within a Shiny
application.

## Usage

``` r
updateReactable(
  outputId,
  data = NULL,
  sortBy = NULL,
  page = NULL,
  expanded = NULL,
  selected = NULL,
  meta = NULL,
  session = NULL
)
```

## Arguments

- outputId:

  The Shiny output ID of the `reactable` instance.

- data:

  Table data. A data frame or matrix.

  `data` should have the same columns as the original table data. When
  updating `data`, the selected rows, expanded rows, and current page
  will reset unless explicitly specified. All other state will persist,
  including sorting, filtering, and grouping state.

- sortBy:

  Sorted columns. A named list of column IDs with values of `"asc"` for
  ascending order or `"desc"` for descending order, or `NA` to clear all
  sorting. This format matches the return value of
  `getReactableState(outputId, "sorted")`.

- page:

  The current page. A single, positive integer.

- expanded:

  Expanded rows. Either `TRUE` to expand all rows, or `FALSE` to
  collapse all rows.

- selected:

  Selected rows. Either a numeric vector of row indices, or `NA` to
  deselect all rows.

- meta:

  Custom table metadata. Either a named list with new values, or `NA` to
  clear all metadata. New values are merged into the current metadata,
  so only the values specified in `meta` will be updated.

- session:

  The Shiny session object. Defaults to the current Shiny session.

## Value

None

## Examples

``` r
# Run in an interactive R session
if (interactive()) {

library(shiny)
library(reactable)

data <- MASS::Cars93[, 1:7]

ui <- fluidPage(
  actionButton("select_btn", "Select rows"),
  actionButton("clear_btn", "Clear selection"),
  actionButton("expand_btn", "Expand rows"),
  actionButton("collapse_btn", "Collapse rows"),
  actionButton("page_btn", "Change page"),
  selectInput("filter_type", "Filter type", unique(data$Type), multiple = TRUE),
  reactableOutput("table")
)

server <- function(input, output) {
  output$table <- renderReactable({
    reactable(
      data,
      filterable = TRUE,
      searchable = TRUE,
      selection = "multiple",
      details = function(index) paste("Details for row:", index)
    )
  })

  observeEvent(input$select_btn, {
    # Select rows
    updateReactable("table", selected = c(1, 3, 5))
  })

  observeEvent(input$clear_btn, {
    # Clear row selection
    updateReactable("table", selected = NA)
  })

  observeEvent(input$expand_btn, {
    # Expand all rows
    updateReactable("table", expanded = TRUE)
  })

  observeEvent(input$collapse_btn, {
    # Collapse all rows
    updateReactable("table", expanded = FALSE)
  })

  observeEvent(input$page_btn, {
    # Change current page
    updateReactable("table", page = 3)
  })

  observe({
    # Filter data
    filtered <- if (length(input$filter_type) > 0) {
      data[data$Type %in% input$filter_type, ]
    } else {
      data
    }
    updateReactable("table", data = filtered)
  })
}

shinyApp(ui, server)
}
```
