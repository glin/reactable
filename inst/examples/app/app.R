library(shiny)
library(reactable)

ui <- fluidPage(
  includeCSS("assets/styles.css"),
  titlePanel("reactable example"),
  checkboxGroupInput("groupBy", "Group by", choices = c("Species", "Petal.Width")),
  reactableOutput("table")
)

server <- function(input, output, session) {
  output$table <- renderReactable({
    reactable(
      iris,
      filterable = TRUE,
      groupBy = input$groupBy,
      defaultSorted = "Sepal.Width",
      columns = list(
        Sepal.Length = colDef(name = "Sepal Length"),
        Sepal.Width = colDef(
          name = "Sepal Width",
          defaultSortOrder = "desc",
          aggregate = "mean",
          renderAggregated = JS("function(cell) { return cell.value + ' (avg)' }")
        ),
        Petal.Length = colDef(name = "Petal Length", aggregate = "sum"),
        Petal.Width = colDef(name = "Petal Width", aggregate = "count"),
        Species = colDef(aggregate = "frequency")
      )
    )
  })
}

shinyApp(ui, server)
