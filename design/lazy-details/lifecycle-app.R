library(shiny)
library(reactable)
depdir <- tempfile(); dir.create(depdir)
writeLines('window.lazyDependencyLoaded = true;', file.path(depdir, 'slow.js'))
dep <- htmltools::htmlDependency('lazy-review-slow', '1.0.0', src = c(file = depdir), script = 'slow.js')
shinyApp(fluidPage(reactableOutput('table')), function(input, output, session) {
  output$table <- renderReactable(reactable(data.frame(x = 1:2), lazyDetails = TRUE, defaultPageSize = 1,
    details = function(i) htmltools::attachDependencies(tagList(
      textInput('lazy_input', 'Lazy input'),
      reactable(data.frame(y = 1), lazyDetails = TRUE, details = function(i) 'child')
    ), dep)))
})
