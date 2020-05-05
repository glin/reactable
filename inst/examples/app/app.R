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

themes <- list(
  "Light 1" = quote(reactableTheme(
    borderColor = "#dfe2e5",
    stripedColor = "#f6f8fa",
    highlightColor = "#f0f5f9",
    cellPadding = "8px 12px"
  )),
  "Dark 1" = quote(reactableTheme(
    color = "hsl(0, 0%, 87%)",
    backgroundColor = "hsl(220, 13%, 18%)",
    borderColor = "hsl(0, 0%, 22%)",
    stripedColor = "rgba(255, 255, 255, 0.04)",
    highlightColor = "rgba(255, 255, 255, 0.06)",
    inputStyle = list(backgroundColor = "hsl(0, 0%, 24%)"),
    selectStyle = list(backgroundColor = "hsl(0, 0%, 24%)"),
    pageButtonHoverStyle = list(backgroundColor = "hsl(0, 0%, 24%)"),
    pageButtonActiveStyle = list(backgroundColor = "hsl(0, 0%, 28%)")
  )),
  "Dark 2" = quote(reactableTheme(
    color = "hsl(233, 9%, 87%)",
    backgroundColor = "hsl(233, 9%, 19%)",
    borderColor = "hsl(233, 9%, 22%)",
    stripedColor = "hsl(233, 12%, 22%)",
    highlightColor = "hsl(233, 12%, 24%)",
    inputStyle = list(backgroundColor = "hsl(233, 9%, 25%)"),
    selectStyle = list(backgroundColor = "hsl(233, 9%, 25%)"),
    pageButtonHoverStyle = list(backgroundColor = "hsl(233, 9%, 25%)"),
    pageButtonActiveStyle = list(backgroundColor = "hsl(233, 9%, 28%)")
  )),
  "Dark 3" = quote(reactableTheme(
    color = "hsl(0, 0%, 90%)",
    backgroundColor = "hsl(0, 0%, 10%)",
    borderColor = "hsl(0, 0%, 18%)",
    stripedColor = "hsl(0, 0%, 13%)",
    headerStyle = list(
      "&:hover[aria-sort]" = list(backgroundColor = "hsl(0, 0%, 14%)")
    ),
    tableBodyStyle = list(color = "hsl(0, 0%, 75%)"),
    rowHighlightStyle = list(color = "hsl(0, 0%, 90%)", backgroundColor = "hsl(0, 0%, 14%)"),
    selectStyle = list(backgroundColor = "hsl(0, 0%, 20%)"),
    inputStyle = list(
      backgroundColor = "hsl(0, 0%, 10%)",
      borderColor = "hsl(0, 0%, 21%)",
      "&:hover, &:focus" = list(borderColor = "hsl(0, 0%, 30%)")
    ),
    pageButtonHoverStyle = list(backgroundColor = "hsl(0, 0%, 20%)"),
    pageButtonActiveStyle = list(backgroundColor = "hsl(0, 0%, 24%)")
  ))
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
              Searchable = "searchable",
              Sortable = "sortable",
              Resizable = "resizable",
              "Default sorted" = "defaultSorted",
              "Show sortable" = "showSortable",
              Outlined = "outlined",
              Bordered = "bordered",
              Borderless = "borderless",
              Striped = "striped",
              Highlight = "highlight",
              Compact = "compact",
              "Full width" = "fullWidth"
            ),
            selected = c("sortable", "resizable", "highlight", "fullWidth")
          ),

          selectInput(
            "theme",
            "Theme",
            c("Default", names(themes)),
            selectize = FALSE,
            width = 170
          ),

          checkboxGroupInput(
            "pagination",
            "Pagination",
            choices = c(
              "Enable pagination" = "pagination",
              "Show page size options" = "showPageSizeOptions",
              "Show page info" = "showPageInfo"
            ),
            selected = c("pagination", "showPageSizeOptions", "showPageInfo")
          ),
          radioButtons(
            "paginationType",
            "Pagination type",
            choices = c("page numbers" = "numbers", "page jump" = "jump", "simple")
          ),

          checkboxGroupInput("groupBy", "Group By", choices = c("Species", "Petal.Width")),

          checkboxGroupInput(
            "rowDetails",
            "Row Details",
            choices = c(
              "Show row details" = "showRowDetails",
              "Multiple row details" = "multiRowDetails",
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
          )
      ),
      div(class = "content",
          tabsetPanel(
            tabPanel(
              "Table",
              reactableOutput("table"),
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
  tblOptions <- reactive({
    list(
      groupBy = input$groupBy,
      columnGroups = if ("columnGroups" %in% input$options) {
        quote(list(
          colGroup(name = "Sepal", columns = c("Sepal.Length", "Sepal.Width")),
          colGroup(name = "Petal", columns = c("Petal.Length", "Petal.Width"))
        ))
      },
      filterable = "filterable" %in% input$options,
      searchable = "searchable" %in% input$options,
      resizable = "resizable" %in% input$options,
      sortable = "sortable" %in% input$options,
      defaultSorted = if ("defaultSorted" %in% input$options) c("Sepal.Length", "Sepal.Width"),
      pagination = "pagination" %in% input$pagination,
      paginationType = input$paginationType,
      showPageSizeOptions = all(c("showPageSizeOptions", "pagination") %in% input$pagination),
      showPageInfo = "showPageInfo" %in% input$pagination,
      selection = if (input$rowSelection != "none") input$rowSelection,
      onClick = if (input$rowSelection != "none") {
        "select"
      } else if (any(c("showRowDetails", "multiRowDetails") %in% input$rowDetails)) {
        "expand"
      },
      outlined = "outlined" %in% input$options,
      bordered = "bordered" %in% input$options,
      borderless = "borderless" %in% input$options,
      striped = "striped" %in% input$options,
      highlight = "highlight" %in% input$options,
      compact = "compact" %in% input$options,
      showSortable = "showSortable" %in% input$options,
      fullWidth = "fullWidth" %in% input$options,
      height = if ("pagination" %in% input$pagination) "auto" else 500,
      theme = if (input$theme != "Default") bquote(.(themes[[input$theme]]))
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
        },
        details = if ("multiRowDetails" %in% input$rowDetails) {
          function(index) {
            tagList(
              paste("Details for row:", index),
              pre(paste(capture.output(iris[index, ]), collapse = "\n"))
            )
          }
        }
      )
    )
  })

  rowDetailsOptions <- reactive({
    if (!any(c("showRowDetails", "multiRowDetails") %in% input$rowDetails)) {
      return(NULL)
    }

    details <- function(index) {
      if (index == 3) {
        tabsetPanel(
          tabPanel("plot", plotOutput("plot")),
          tabPanel("subtable", reactable(iris[1:3, 1:2], fullWidth = FALSE))
        )
      } else if (index == 5) {
        paste("Details for row:", index)
      }
    }

    if (!"columnHeader" %in% input$rowDetails) {
      details
    } else {
      bquote(
        colDef(
          details = .(details),
          name = "More",
          width = 70
        )
      )
    }
  })

  code <- reactive({
    opts <- tblOptions()
    colOpts <- colOptions()

    call <- bquote(reactable(
      iris,
      columnGroups = .(opts$columnGroups),
      filterable = .(opts$filterable),
      searchable = .(opts$searchable),
      sortable = .(opts$sortable),
      resizable = .(opts$resizable),
      pagination = .(opts$pagination),
      paginationType = .(opts$paginationType),
      showPageSizeOptions = .(opts$showPageSizeOptions),
      showPageInfo = .(opts$showPageInfo),
      selection = .(opts$selection),
      onClick = .(opts$onClick),
      outlined = .(opts$outlined),
      bordered = .(opts$bordered),
      borderless = .(opts$borderless),
      striped = .(opts$striped),
      highlight = .(opts$highlight),
      compact = .(opts$compact),
      showSortable = .(opts$showSortable),
      groupBy = .(opts$groupBy),
      defaultSorted = .(opts$defaultSorted),
      fullWidth = .(opts$fullWidth),
      height = .(opts$height),
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
          footer = .(colOpts$Sepal.Width$footer),
          details = .(colOpts$Sepal.Width$details)
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
      details = .(rowDetailsOptions()),
      theme = .(if (!is.null(opts$theme)) quote(theme))
    ))

    # Omit default reactable args
    defaultArgs <- formals(reactable)
    for (argname in names(call)) {
      if (argname != "" &&
          (is.null(call[[argname]]) || identical(call[[argname]], defaultArgs[[argname]]))) {
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

    code <- gsub("\\n", "\n", deparse(call, control = "useSource"), fixed = TRUE)

    if (!is.null(opts$theme)) {
      themeCall <- bquote({ theme <- .(opts$theme) })
      themeCode <- gsub("\\n", "\n", deparse(themeCall[[2]], control = "useSource"), fixed = TRUE)
      code <- c(themeCode, "", code)
    }

    paste(code, collapse = "\n")
  })

  output$code <- renderUI({
    prismCodeBlock(code())
  })

  output$table <- renderReactable({
    eval(parse(text = code()))
  })

  output$selected <- renderPrint({
    print(getReactableState("table", "selected"))
  })

  output$plot <- renderPlot({
    hist(iris$Sepal.Length)
  })

  outputOptions(output, "table", suspendWhenHidden = FALSE)
}

shinyApp(ui, server)
