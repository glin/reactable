library(shiny)
library(reactable)

ui <- fluidPage(
  includeCSS("assets/styles.css"),
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
