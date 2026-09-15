# Run from the repository root after installing this checkout:
# Rscript design/lazy-details/benchmark-dashboard.R
# The eager sample keeps market/receipt descendants lazy in both cases.
app <- source("design/lazy-details/dashboard-app.R")$value
result <- NULL
shiny::testServer(app, {
  session$setInputs(region = "All regions", virtual = TRUE, refresh = 0)
  result <<- run_benchmark()
  stopifnot(result$lazy$dashboards == 0L, result$eager$dashboards == 50L,
    isolate(stats())$market == 0L, isolate(stats())$receipt == 0L)
})
cat(jsonlite::toJSON(result, auto_unbox = TRUE, pretty = TRUE), "\n")
