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
              Filterable = "filterable",
              Sortable = "sortable",
              Resizable = "resizable",
              "Default sorted" = "defaultSorted",
              Pagination = "showPagination",
              Outlined = "outlined",
              Bordered = "bordered",
              Striped = "striped",
              Highlight = "highlight",
              Inline = "inline"
            ),
            selected = c("sortable", "resizable", "showPagination", "bordered", "highlight")
          ),

          checkboxGroupInput("groupBy", "Group By", choices = c("Species", "Petal.Width")),

          checkboxGroupInput(
            "rowDetails",
            "Row Details",
            choices = c(
              "Show row details" = "showRowDetails",
              "Column header" = "columnHeader"
            )
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
              "Custom renderer" = "render",
              HTML = "html"
            ),
            selected = c("format", "render", "html")
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
      striped = "striped" %in% input$options,
      highlight = "highlight" %in% input$options,
      inline = "inline" %in% input$options
    )
  })

  colOptions <- reactive({
    list(
      Sepal.Length = list(
        format = if ("format" %in% input$colOptions) {
          quote(colFormat(suffix = " cm"))
        }
      ),
      Sepal.Width = list(
        html = "html" %in% input$colOptions,
        format = if ("format" %in% input$colOptions) {
          quote(list(aggregated = colFormat(suffix = " (avg)", digits = 2)))
        },
        render = if ("render" %in% input$colOptions) {
          quote(list(cell = JS('
                  function (cell) {
                    let classes
                    if (cell.value >= 3.3) {
                      classes = "tag num-high"
                    } else if (cell.value >= 3) {
                      classes = "tag num-med"
                    } else {
                      classes = "tag num-low"
                    }
                    return `<span class="${classes}">${cell.value}</span>`
                  }')))
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
      striped = .(opts$striped),
      highlight = .(opts$highlight),
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
          html = .(colOpts$Sepal.Width$html),
          format = .(colOpts$Sepal.Width$format),
          render = .(colOpts$Sepal.Width$render)
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
    for (argname in names(call$rowDetails)) {
      if (argname != "" && identical(call$rowDetails[[argname]], defaultArgs[[argname]])) {
        call$rowDetails[[argname]] <- NULL
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
