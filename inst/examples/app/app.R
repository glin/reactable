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
      pivotBy = pivotBy,
      columns = list(
        Sepal.Length = colDef(name = "Sepal Length"),
        Sepal.Width = colDef(name = "Sepal Width", aggregate = "mean"),
        Petal.Length = colDef(name = "Petal Length", aggregate = "sum"),
        Petal.Width = colDef(name = "Petal Width", aggregate = "count")
      )
    )
  })
}

shinyApp(ui, server)
