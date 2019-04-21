library(shiny)
library(reactable)

ui <- fluidPage(
  includeCSS("assets/styles.css"),
  tags$head(tags$title("reactable example")),
  div(class = "main",
      div(class = "sidebar",
          h1("reactable example", class = "title"),

          checkboxGroupInput("groupBy", "Group By", choices = c("Species", "Petal.Width")),

          checkboxGroupInput(
            "options",
            "Table Options",
            choices = c(
              Filterable = "filterable",
              Sortable = "sortable",
              Resizable = "resizable",
              Pagination = "showPagination",
              Striped = "striped",
              Highlight = "highlight"
            ),
            selected = c("filterable", "sortable", "resizable", "showPagination",
                         "striped", "highlight")
          ),

          tags$a(href = "https://github.com/glin/reactable/tree/master/inst/examples/app",
                 span(icon("github"), "Source code"))
      ),
      div(class = "content",
          reactableOutput("table")
      )
  )
)

server <- function(input, output, session) {
  options <- reactive({
    list(
      filterable = "filterable" %in% input$options,
      sortable = "sortable" %in% input$options,
      resizable = "resizable" %in% input$options,
      showPagination = "showPagination" %in% input$options,
      striped = "striped" %in% input$options,
      highlight = "highlight" %in% input$options,
      groupBy = input$groupBy,
      defaultSorted = if ("sortable" %in% input$options) "Sepal.Width"
    )
  })

  output$table <- renderReactable({
    reactable(
      iris,
      filterable = options()$filterable,
      sortable = options()$sortable,
      resizable = options()$resizable,
      showPagination = options()$showPagination,
      striped = options()$striped,
      highlight = options()$highlight,
      groupBy = options()$groupBy,
      defaultSorted = options()$defaultSorted,
      columns = list(
        Sepal.Length = colDef(
          name = "Sepal Length",
          aggregate = "max",
          format = colFormat(suffix = " cm")
        ),
        Sepal.Width = colDef(
          name = "Sepal Width",
          defaultSortOrder = "desc",
          aggregate = "mean",
          format = list(aggregated = colFormat(suffix = " (avg)", digits = 2)),
          html = TRUE,
          render = list(cell = JS("
            function(cell) {
              var className
              if (cell.value >= 3.3) {
                className = 'tag num-high'
              } else if (cell.value >= 3) {
                className = 'tag num-med'
              } else {
                className = 'tag num-low'
              }
              return '<span class=\"' + className + '\">' + cell.value + '</span>'
            }
          "))
        ),
        Petal.Length = colDef(
          name = "Petal Length",
          aggregate = "sum"
        ),
        Petal.Width = colDef(
          name = "Petal Width",
          aggregate = "count"
        ),
        Species = colDef(
          aggregate = "frequency"
        )
      )
    )
  })
}

shinyApp(ui, server)
