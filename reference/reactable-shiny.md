# Shiny bindings for reactable

Output and render functions for using reactable within Shiny
applications and interactive R Markdown documents.

## Usage

``` r
reactableOutput(outputId, width = "auto", height = "auto", inline = FALSE)

renderReactable(expr, env = parent.frame(), quoted = FALSE)
```

## Arguments

- outputId:

  Output variable to read from.

- width, height:

  A valid CSS unit (like `"100%"`, `"400px"`, `"auto"`) or a number,
  which will be coerced to a string and have `"px"` appended.

- inline:

  Use an inline element for the table's container?

- expr:

  An expression that generates a [reactable](reactable.md) widget.

- env:

  The environment in which to evaluate `expr`.

- quoted:

  Is `expr` a quoted expression (with
  [`quote()`](https://rdrr.io/r/base/substitute.html))? This is useful
  if you want to save an expression in a variable.

## Value

`reactableOutput()` returns a `reactable` output element that can be
included in a Shiny UI.

`renderReactable()` returns a `reactable` render function that can be
assigned to a Shiny output slot.

## Note

See the [online
demo](https://glin.github.io/reactable/articles/shiny-demo.html) for
additional examples of using reactable in Shiny.

## See also

[`updateReactable()`](updateReactable.md) for updating a reactable
instance in Shiny.

[`getReactableState()`](getReactableState.md) for getting the state of a
reactable instance in Shiny.

## Examples

``` r
# Run in an interactive R session
if (interactive()) {

library(shiny)
library(reactable)

ui <- fluidPage(
 titlePanel("reactable example"),
 reactableOutput("table")
)

server <- function(input, output, session) {
  output$table <- renderReactable({
   reactable(iris)
 })
}

shinyApp(ui, server)
}
```
