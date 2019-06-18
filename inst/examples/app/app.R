library(shiny)
library(reactable)

prismCodeBlock <- function(code, language = "r") {
  # Generate a pre-code tag without indentation
  html <- as.character(tags$code(class = paste0("language-", language), code))
  html <- sprintf("<pre>%s</pre>", html)
  tagList(
    HTML(html),
    tags$script("Prism.highlightAll()")
  )
}

prismDependencies <- tags$head(
  tags$script(src = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.16.0/prism.min.js"),
  tags$script(src = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.16.0/components/prism-r.min.js"),
  tags$link(rel = "stylesheet", type = "text/css",
            href = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.16.0/themes/prism.min.css")
)

ui <- fluidPage(
  tags$head(
    tags$title("reactable demo"),
    includeCSS("assets/styles.css"),
    prismDependencies
  ),

  div(class = "main",
      div(class = "sidebar",
          h1("reactable demo", class = "title"),

          checkboxGroupInput(
            "options",
            "Table Options",
            choices = c(
              "Column groups" = "columnGroups",
              "Footer" = "footer",
              Filterable = "filterable",
              Sortable = "sortable",
              Resizable = "resizable",
              "Default sorted" = "defaultSorted",
              "Show sortable" = "showSortable",
              "Show pagination" = "showPagination",
              Outlined = "outlined",
              Bordered = "bordered",
              Borderless = "borderless",
              Striped = "striped",
              Highlight = "highlight",
              Inline = "inline"
            ),
            selected = c("sortable", "resizable", "showPagination", "highlight")
          ),

          checkboxGroupInput("groupBy", "Group By", choices = c("Species", "Petal.Width")),

          checkboxGroupInput(
            "rowDetails",
            "Row Details",
            choices = c(
              "Show row details" = "showRowDetails",
              "Column header" = "columnHeader"
            ),
            selected = "showRowDetails"
          ),

          radioButtons(
            "rowSelection",
            "Row Selection",
            choices = c(
              "None" = "none",
              "Single" = "single",
              "Multiple" = "multiple"
            )
          ),

          checkboxGroupInput(
            "colOptions",
            "Column Options",
            choices = c(
              Formatting = "format",
              "Custom cell renderer" = "cell"
            ),
            selected = c("format", "cell")
          ),

          tags$a(href = "https://github.com/glin/reactable/tree/master/inst/examples/app",
                 span(icon("github"), "Source code"))
      ),
      div(class = "content",
          tabsetPanel(
            tabPanel(
              "Table",
              reactableOutput("table"),
              tags$div(class = "sort-tip", "Tip: shift+click to sort multiple columns"),
              conditionalPanel(
                "input.rowSelection !== 'none'",
                hr(),
                "Selected rows:",
                verbatimTextOutput("selected")
              )
            ),
            tabPanel(
              "Code",
              htmlOutput("code")
            )
          )
      )
  )
)

server <- function(input, output, session) {
  options <- reactive({
    list(
      groupBy = input$groupBy,
      columnGroups = if ("columnGroups" %in% input$options) {
        quote(list(
          colGroup("Sepal", c("Sepal.Length", "Sepal.Width")),
          colGroup("Petal", c("Petal.Length", "Petal.Width"))
        ))
      },
      filterable = "filterable" %in% input$options,
      resizable = "resizable" %in% input$options,
      sortable = "sortable" %in% input$options,
      defaultSorted = if ("defaultSorted" %in% input$options) c("Sepal.Length", "Sepal.Width"),
      selection = if (input$rowSelection != "none") input$rowSelection,
      selectionId = if (input$rowSelection != "none") "selected",
      showPagination = "showPagination" %in% input$options,
      outlined = "outlined" %in% input$options,
      bordered = "bordered" %in% input$options,
      borderless = "borderless" %in% input$options,
      striped = "striped" %in% input$options,
      highlight = "highlight" %in% input$options,
      showSortable = "showSortable" %in% input$options,
      inline = "inline" %in% input$options
    )
  })

  colOptions <- reactive({
    list(
      Sepal.Length = list(
        format = if ("format" %in% input$colOptions) {
          quote(colFormat(suffix = " cm", digits = 1))
        }
      ),
      Sepal.Width = list(
        format = if ("format" %in% input$colOptions) {
          quote(list(aggregated = colFormat(suffix = " (avg)", digits = 2)))
        },
        cell = if ("cell" %in% input$colOptions) {
          function(value) {
            if (value >= 3.3) {
              classes <- "tag num-high"
            } else if (value >= 3) {
              classes <- "tag num-med"
            } else {
              classes <- "tag num-low"
            }
            value <- format(value, nsmall = 1)
            span(class = classes, value)
          }
        },
        footer = if ("footer" %in% input$options) {
          function(values) {
            div(tags$b("Average: "), round(mean(values), 1))
          }
        }
      )
    )
  })

  rowDetailsOptions <- reactive({
    if (!"showRowDetails" %in% input$rowDetails) {
      return(NULL)
    }

    bquote(
      rowDetails(
        function(index) {
          if (index == 3) {
            tabsetPanel(
              tabPanel("plot", plotOutput("plot")),
              tabPanel("subtable", reactable(iris[1:3, 1:2], inline = TRUE))
            )
          } else if (index == 5) {
            div(paste("Details for row:", index))
          }
        },
        name = .(if ("columnHeader" %in% input$rowDetails) "More"),
        width = .(if ("columnHeader" %in% input$rowDetails) 50)
      )
    )
  })

  code <- reactive({
    opts <- options()
    colOpts <- colOptions()

    call <- bquote(reactable(
      iris,
      columnGroups = .(opts$columnGroups),
      filterable = .(opts$filterable),
      sortable = .(opts$sortable),
      resizable = .(opts$resizable),
      selection = .(opts$selection),
      selectionId = .(opts$selectionId),
      showPagination = .(opts$showPagination),
      outlined = .(opts$outlined),
      bordered = .(opts$bordered),
      borderless = .(opts$borderless),
      striped = .(opts$striped),
      highlight = .(opts$highlight),
      showSortable = .(opts$showSortable),
      inline = .(opts$inline),
      groupBy = .(opts$groupBy),
      defaultSorted = .(opts$defaultSorted),
      columns = list(
        Sepal.Length = colDef(
          name = .(if (is.null(opts$columnGroups)) "Sepal Length" else "Length"),
          aggregate = "max",
          format = .(colOpts$Sepal.Length$format)
        ),
        Sepal.Width = colDef(
          name = .(if (is.null(opts$columnGroups)) "Sepal Width" else "Width"),
          defaultSortOrder = "desc",
          aggregate = "mean",
          format = .(colOpts$Sepal.Width$format),
          cell = .(colOpts$Sepal.Width$cell),
          footer = .(colOpts$Sepal.Width$footer)
        ),
        Petal.Length = colDef(
          name = .(if (is.null(opts$columnGroups)) "Petal Length" else "Length"),
          aggregate = "sum"
        ),
        Petal.Width = colDef(
          name = .(if (is.null(opts$columnGroups)) "Petal Width" else "Width"),
          aggregate = "count"
        ),
        Species = colDef(
          aggregate = "frequency"
        )
      ),
      details = .(rowDetailsOptions())
    ))

    # Omit default reactable args
    defaultArgs <- formals(reactable)
    for (argname in names(call)) {
      if (argname != "" && identical(call[[argname]], defaultArgs[[argname]])) {
        call[[argname]] <- NULL
      }
    }

    # Omit default colDef args
    defaultArgs <- formals(colDef)
    for (colname in names(call$columns)) {
      col <- call$columns[[colname]]
      for (argname in names(col)) {
        if (argname != "" && identical(col[[argname]], defaultArgs[[argname]])) {
          call$columns[[colname]][[argname]] <- NULL
        }
      }
    }

    # Omit default rowDetails args
    defaultArgs <- formals(rowDetails)
    for (argname in names(call$details)) {
      if (argname != "" && identical(call$details[[argname]], defaultArgs[[argname]])) {
        call$details[[argname]] <- NULL
      }
    }

    code <- gsub("\\n", "\n", deparse(call, control = "useSource"), fixed = TRUE)
    paste(code, collapse = "\n")
  })

  output$code <- renderUI({
    prismCodeBlock(code())
  })

  output$table <- renderReactable({
    eval(parse(text = code()))
  })

  output$selected <- renderPrint({
    print(input$selected)
  })

  output$plot <- renderPlot({
    hist(iris$Sepal.Length)
  })

  outputOptions(output, "code", suspendWhenHidden = FALSE)
  outputOptions(output, "table", suspendWhenHidden = FALSE)
}

shinyApp(ui, server)
