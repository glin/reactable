library(shiny)
library(reactable)

ui <- fluidPage(
  tags$head(tags$style('body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }')),
  titlePanel("reactable example"),
  checkboxInput("pivotBySpecies", "Pivot by Species"),
  reactableOutput("table")
)

server <- function(input, output, session) {
  output$table <- renderReactable({
    pivotBy <- if (input$pivotBySpecies) "Species"
    reactable(iris, pivotBy = pivotBy, filterable = TRUE, rownames = FALSE)
  })
}

shinyApp(ui, server)
