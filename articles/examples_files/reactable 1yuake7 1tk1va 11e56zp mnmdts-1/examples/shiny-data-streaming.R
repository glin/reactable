library(shiny)
library(reactable)

db <- tools::CRAN_package_db()

ui <- fluidPage(
  reactableOutput("table")
)

server <- function(input, output) {
  pkgs <- c("rlang", "magrittr", "Rcpp", "dplyr", "tibble", "ggplot2", "glue", "pillar", "data.table")
  pkgs <- db[db$Package %in% pkgs, c("Package", "Version", "Description")]
  pkgs$Downloads <- c(70, 105, 38, 51, 49, 64, 53, 43, 22)

  output$table <- renderReactable({
    reactable(
      pkgs,
      searchable = TRUE,
      wrap = FALSE,
      resizable = TRUE,
      fullWidth = FALSE,
      defaultSorted = "Downloads",
      defaultColDef = colDef(minWidth = 200),
      columns = list(
        Downloads = colDef(defaultSortOrder = "desc")
      )
    )
  })

  observe({
    # Update download counts
    invalidateLater(100)
    pkgs$Downloads <<- pkgs$Downloads + floor(runif(9, 0, 10))
    updateReactable("table", data = pkgs)
  })
}

shinyApp(ui, server)
