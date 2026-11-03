# Native lazy reactable acceptance test
# Run in a fresh R session: source("test-lazy-reactable.R")
# The GitHub branch must be published before the default installation works.
# To test a local checkout instead:
# Sys.setenv(REACTABLE_LOCAL_SOURCE = "/path/to/reactable")
# To reuse an installed build: Sys.setenv(REACTABLE_TEST_INSTALL = "false")

if ("reactable" %in% loadedNamespaces()) {
  stop("Restart R before running this script so the newly installed package is used.")
}
options(repos = c(CRAN = "https://cloud.r-project.org"))
needed <- c("remotes", "shiny")
missing <- needed[!vapply(needed, requireNamespace, logical(1), quietly = TRUE)]
if (length(missing)) install.packages(missing)

branch <- "native-lazy-details"
if (Sys.getenv("REACTABLE_TEST_INSTALL", "true") != "false") {
  local_source <- Sys.getenv("REACTABLE_LOCAL_SOURCE")
  if (nzchar(local_source)) {
    remotes::install_local(local_source, dependencies = NA, upgrade = "never", force = TRUE)
  } else {
    remotes::install_github(
      "gkroken/reactable", ref = branch, dependencies = NA,
      upgrade = "never", force = TRUE, build_vignettes = FALSE
    )
  }
}
library(shiny)
library(reactable)
if (!"lazyDetails" %in% names(formals(reactable))) {
  stop("This build does not contain lazyDetails. Install the native-lazy-details branch.")
}

build <- packageDescription("reactable")
cat("reactable:", as.character(packageVersion("reactable")), "\n")
cat("Commit:", if (is.null(build$RemoteSha)) "local checkout" else build$RemoteSha, "\n")

ui <- fluidPage(
  titlePanel("Native lazy details: acceptance test"),
  p("No wrapper functions. Each detail call is counted and logged below."),
  tags$ol(
    tags$li("At startup, the event log is empty."),
    tags$li("Expand a car: exactly one parent call; no child call yet."),
    tags$li("Expand an inspection inside it: exactly one child call."),
    tags$li("Close and reopen: another call and a new timestamp."),
    tags$li("Sort, search and paginate: details must match the car shown."),
    tags$li("Refresh the data: old panels close; reopening uses the new revision."),
    tags$li("Enable failure, then open a car: an error appears; disable and reopen to retry."),
    tags$li("Try the second table and module: their requests must remain separate."),
    tags$li("With virtual scrolling enabled, scroll away and back: an open detail should not recalculate.")
  ),
  fluidRow(
    column(4, actionButton("refresh", "Refresh data")),
    column(4, checkboxInput("fail", "Fail parent detail deliberately", FALSE)),
    column(4, checkboxInput("virtual", "Virtual scrolling (recreates main table)", FALSE))
  ),
  h3("Main table"), reactableOutput("cars"),
  h3("Independent table"), reactableOutput("other"),
  h3("Shiny module"), reactableOutput(NS("module", "cars")),
  h3("Event log"), verbatimTextOutput("events"),
  downloadButton("report", "Download test report")
)

server <- function(input, output, session) {
  events <- reactiveVal(character())
  record <- function(kind, identity) {
    line <- sprintf("%s | %s | %s", format(Sys.time(), "%H:%M:%OS3"), kind, identity)
    events(c(isolate(events()), line))
    message(line)
  }
  cars <- reactive({
    revision <- input$refresh
    d <- data.frame(car = rownames(mtcars), mtcars, revision = revision, row.names = NULL)
    d
  })
  output$cars <- renderReactable({
    d <- cars()
    virtual <- input$virtual
    reactable(
      d, lazyDetails = TRUE, searchable = TRUE, defaultPageSize = 5,
      pagination = !virtual, virtual = virtual,
      height = if (virtual) 350 else NULL,
      details = function(index) {
        car <- d$car[index]
        record("parent", paste(car, "revision", d$revision[index]))
        Sys.sleep(0.6)
        if (isTRUE(isolate(input$fail))) stop("Deliberate test failure")
        inspections <- data.frame(inspection = c("Engine", "Brakes", "Tyres"))
        tagList(
          h4(paste(car, "- revision", d$revision[index])),
          p(paste("Calculated:", format(Sys.time(), "%H:%M:%OS3"))),
          reactable(
            inspections, lazyDetails = TRUE, pagination = FALSE,
            details = function(index) {
              item <- inspections$inspection[index]
              record("child", paste(car, item))
              Sys.sleep(0.3)
              div(paste(car, item, "checked at", format(Sys.time(), "%H:%M:%OS3")))
            }
          )
        )
      }
    )
  })
  output$other <- renderReactable({
    reactable(head(mtcars, 3), lazyDetails = TRUE, details = function(index) {
      record("independent", rownames(mtcars)[index])
      div(paste("Independent:", rownames(mtcars)[index]))
    })
  })
  moduleServer("module", function(input, output, session) {
    output$cars <- renderReactable({
      reactable(head(mtcars, 2), lazyDetails = TRUE, details = function(index) {
        record("module", rownames(mtcars)[index])
        div(paste("Module:", rownames(mtcars)[index]))
      })
    })
  })
  output$events <- renderText({
    log <- events()
    if (!length(log)) "0 detail calls (expected at startup)" else {
      paste(c(paste(length(log), "detail calls"), log), collapse = "\n")
    }
  })
  output$report <- downloadHandler(
    filename = function() paste0("lazy-reactable-report-", Sys.Date(), ".txt"),
    content = function(file) {
      writeLines(c(
        paste("reactable version:", packageVersion("reactable")),
        paste("Commit:", build$RemoteSha),
        "", "DETAIL EVENTS", isolate(events()), "", "SESSION", capture.output(sessionInfo())
      ), file)
    }
  )
}
shiny::runApp(shinyApp(ui, server), launch.browser = interactive())
