library(shiny)
library(reactable)

rows_options <- c(100000, 1000000)
names(rows_options) <- format(rows_options, scientific = FALSE)

tables <- lapply(rows_options, function(rows) {
  dates <- seq.Date(as.Date("2018-01-01"), as.Date("2018-12-01"), "day")
  data <- data.frame(
    index = seq_len(rows),
    date = sample(dates, rows, replace = TRUE),
    city = sample(names(precip), rows, replace = TRUE),
    state = sample(rownames(USArrests), rows, replace = TRUE),
    temp = round(runif(rows, 0, 100), 1),
    stringsAsFactors = FALSE
  )

  tbl <- reactable(
    data,
    # defaultSorted = "state",
    # groupBy = "date",
    # defaultSortOrder = "desc",
    filterable = TRUE,
    searchable = TRUE,
    minRows = 10,
    highlight = TRUE,
    columns = list(
      state = colDef(
        html = TRUE,
        cell = JS("function(cell) {
        return '<a href=\"https://wikipedia.org/wiki/' + cell.value + '\">' + cell.value + '</a>'
      }")
      )
    ),
    details = colDef(
      html = TRUE,
      details = JS("function(rowInfo) {
      return 'Details for row: ' + rowInfo.index +
        '<pre>' + JSON.stringify(rowInfo.row, null, 2) + '</pre>'
    }")
    ),
    showPageSizeOptions = TRUE,
    server = TRUE
  )

  tbl
})

ui <- fluidPage(
  h2("Server-side data processing demo"),
  selectInput("rows", "Rows", choices = names(rows_options), selectize = FALSE),
  reactableOutput("tbl")
)

server <- function(input, output) {
  tbl <- reactive({
    rows <- input$rows
    req(rows)
    tables[[rows]]
  })

  output$tbl <- renderReactable({
    tbl()
  })
}

shinyApp(ui, server)
