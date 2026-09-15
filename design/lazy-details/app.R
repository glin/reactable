library(shiny)
library(reactable)

if (!"lazyDetails" %in% names(formals(reactable))) {
  stop("Install reactable from this checkout before running the app.")
}

ui <- fluidPage(
  titlePanel("Nested lazy details"),
  p("Expand a car, a system, then a check. Each opening adds one calculation to the log."),
  actionButton("refresh", "Recreate tables"),
  reactableOutput("cars"),
  h3("Calculation log"),
  verbatimTextOutput("events")
)

server <- function(input, output, session) {
  events <- reactiveVal(character())
  record <- function(path) {
    events(c(isolate(events()), paste(path, format(Sys.time(), "%H:%M:%OS3"), sep = " | ")))
  }
  output$cars <- renderReactable({
    input$refresh
    cars <- data.frame(car = rownames(mtcars)[1:8], mtcars[1:8, ], row.names = NULL)
    reactable(cars, lazyDetails = TRUE, searchable = TRUE, defaultPageSize = 4,
      details = function(index) {
        car <- cars$car[index]
        record(car)
        systems <- data.frame(system = c("Engine", "Brakes", "Tyres"))
        tagList(h4(car), reactable(systems, lazyDetails = TRUE, pagination = FALSE,
          details = function(index) {
            system <- systems$system[index]
            record(paste(car, system, sep = " / "))
            checks <- data.frame(check = c("Condition", "Pressure", "Service history"))
            tagList(h5(paste(car, system, sep = " / ")),
              reactable(checks, lazyDetails = TRUE, pagination = FALSE,
                details = function(index) {
                  path <- paste(car, system, checks$check[index], sep = " / ")
                  record(path)
                  div(class = "check-result", paste("Checked:", path))
                }
              )
            )
          }
        ))
      }
    )
  })
  output$events <- renderText({
    log <- events()
    paste(c(paste("Calculations:", length(log)), log), collapse = "\n")
  })
}

shinyApp(ui, server)
