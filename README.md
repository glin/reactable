# reactable

[![Build Status](https://travis-ci.com/glin/reactable.svg?branch=master)](https://travis-ci.com/glin/reactable)
[![codecov](https://codecov.io/gh/glin/reactable/branch/master/graph/badge.svg)](https://codecov.io/gh/glin/reactable)

R interface to the [React Table](https://github.com/tannerlinsley/react-table) library,
made with [reactR](https://github.com/react-R/reactR).

## Installation

```r
# install.packages("devtools")
devtools::install_github("glin/reactable")
```

## Examples

### Filtering
https://glin.github.io/reactable/inst/examples/filtering.html

```r
reactable(iris, filterable = TRUE)
```

### Grouping
https://glin.github.io/reactable/inst/examples/grouping.html

```r
reactable(iris, groupBy = "Species", columns = list(
  Sepal.Width = colDef(aggregate = "mean"),
  Petal.Length = colDef(aggregate = "sum"),
  Petal.Width = colDef(aggregate = "frequency")
))
```

### Sorting
https://glin.github.io/reactable/inst/examples/sorting.html

```r
reactable(
  iris,
  defaultSortOrder = "desc",
  defaultSorted = list(Sepal.Length = "asc", Petal.Length = "desc"),
  columns = list(
    Species = colDef(defaultSortOrder = "asc")
  )
)
```

### Column Groups
https://glin.github.io/reactable/inst/examples/column-groups.html

```r
reactable(
  iris,
  columns = list(
    Sepal.Length = colDef(name = "Length"),
    Sepal.Width = colDef(name = "Width"),
    Petal.Length = colDef(name = "Length"),
    Petal.Width = colDef(name = "Width")
  ),
  columnGroups = list(
    colGroup(name = "Sepal", columns = c("Sepal.Length", "Sepal.Width")),
    colGroup(name = "Petal", columns = c("Petal.Length", "Petal.Width"))
  )
)
```

### Shiny
https://glin.shinyapps.io/reactable/

```r
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
```

## Usage
```r
reactable(
  data,                      # Data frame or matrix
  rownames = FALSE,          # Show row names?
  colnames = NULL,           # Named list of column names
  columns = NULL,            # Named list of column definitions. See colDef()
  columnGroups = NULL,       # List of column group definitions. See colGroup()
  groupBy = NULL,            # Names of columns to group by
  sortable = TRUE,           # Enable sorting?
  resizable = TRUE,          # Enable column resizing?
  filterable = FALSE,        # Enable column filtering?
  defaultSortOrder = "asc",  # Default sort order. Either "asc" or "desc"
  defaultSorted = NULL,      # Column names to sort by default. Or a named list with values of "asc" or "desc"
  defaultPageSize = 10,      # Default page size
  pageSizeOptions =          # Page size options
    c(10, 25, 50, 100), 
  minRows = 1,               # Minimum number of rows to show
  striped = TRUE,            # Zebra-stripe rows?
  highlight = TRUE,          # Highlight rows on hover?
  class = NULL,              # Additional CSS classes to apply to the table
  style = NULL               # Named list of inline styles to apply to the table
)
```

### Columns
```r
colDef(
  name = NULL,              # Column name
  aggregate = NULL,         # Aggregate function name or JS callback
  sortable = NULL,          # Enable sorting?
  resizable = NULL,         # Enable column resizing?
  filterable = NULL,        # Enable column filtering?
  show = TRUE,              # Show the column?
  defaultSortOrder = NULL,  # Default sort order. Either "asc" or "desc"
  render = NULL,            # Render function for standard cells
  renderAggregated = NULL,  # Render function for aggregated cells
  minWidth = NULL,          # Min width of the column in pixels
  maxWidth = NULL,          # Max width of the column in pixels
  width = NULL,             # Fixed width of the column in pixels. Overrides minWidth and maxWidth
  class = NULL,             # Additional CSS classes to apply to cells
  style = NULL,             # Named list of inline styles to apply to cells
  headerClass = NULL,       # Additional CSS classes to apply to the header
  headerStyle = NULL        # Named list of inline styles to apply to the header
)
```

### Column Groups
```r
colGroup(
  name,                # Column group name
  columns,             # Names of columns in the group
  headerClass = NULL,  # Additional CSS classes to apply to the header
  headerStyle = NULL   # Named list of inline styles to apply to the header
)
```

## License
MIT
