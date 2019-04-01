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
    reactable(
      iris,
      filterable = TRUE,
      rownames = FALSE,
      pivotBy = pivotBy,
      columns = list(
        Sepal.Width = list(aggregate = "mean"),
        Petal.Length = list(aggregate = "sum"),
        Petal.Width = list(aggregate = "count")
      )
    )
  })
}

shinyApp(ui, server)
