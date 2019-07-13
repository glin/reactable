# reactable

[![Build Status](https://travis-ci.com/glin/reactable.svg?branch=master)](https://travis-ci.com/glin/reactable)
[![codecov](https://codecov.io/gh/glin/reactable/branch/master/graph/badge.svg)](https://codecov.io/gh/glin/reactable)
[![lifecycle](https://img.shields.io/badge/lifecycle-experimental-orange.svg)](https://www.tidyverse.org/lifecycle/#experimental)

R interface to the [React Table](https://github.com/tannerlinsley/react-table) library,
made with [reactR](https://github.com/react-R/reactR).

## Installation

You can install the development version from GitHub with:
```r
# install.packages("devtools")
devtools::install_github("glin/reactable")
```

## Examples

### Grouping and Aggregation
https://glin.github.io/reactable/articles/examples.html#grouping-and-aggregation

```r
reactable(iris, groupBy = "Species", columns = list(
  Sepal.Length = colDef(aggregate = "count"),
  Sepal.Width = colDef(aggregate = "mean"),
  Petal.Length = colDef(aggregate = "sum"),
  Petal.Width = colDef(aggregate = "max")
))
```

### Expandable Row Details
https://glin.github.io/reactable/articles/examples.html#expandable-row-details

```r
reactable(iris, details = function(index) {
  htmltools::div(
    htmltools::h4(paste("Details for row:", index)),
    reactable(iris[index, ], inline = TRUE)
  )
})
```

### Sorting
https://glin.github.io/reactable/articles/examples.html#sorting

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

### Filtering
https://glin.github.io/reactable/articles/examples.html#filtering

```r
reactable(iris, filterable = TRUE)
```

### Column Groups
https://glin.github.io/reactable/articles/examples.html#column-groups

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

### Column Formatting
https://glin.github.io/reactable/articles/examples.html#column-formatting

```r
reactable(iris, groupBy = "Species", columns = list(
  Sepal.Length = colDef(
    aggregate = "sum",
    format = colFormat(suffix = " cm")
  ),
  Sepal.Width = colDef(
    aggregate = "mean",
    format = list(aggregated = colFormat(suffix = " (avg)", digits = 2))
  )
))
```

### Cell Renderers
https://glin.github.io/reactable/articles/examples.html#cell-renderers

```r
reactable(iris, columns = list(
  Petal.Length = colDef(html = TRUE, cell = JS("
    function(cell) {
      var colors = { setosa: 'red', versicolor: 'green', virginica: 'navy' }
      var color = colors[cell.row.Species]
      return '<span style=\"color: ' + color + ';\">' + cell.value + '</span>'
    }
  ")),
  Petal.Width = colDef(cell = function(value, index) {
    colors <- c(setosa = "red", versicolor = "green", virginica = "navy")
    color <- colors[iris[index, "Species"]]
    htmltools::span(style = paste("color:", color), value)
  })
))
```

### Footers
https://glin.github.io/reactable/articles/examples.html#footers

```r
reactable(iris, columns = list(
  Sepal.Length = colDef(
    footer = paste("Avg:", round(mean(iris$Sepal.Length), 1))
  ),
  Sepal.Width = colDef(footer = function(values, key) {
    htmltools::span(htmltools::tags$b("Total: "), sum(values))
  }),
  Petal.Length = colDef(html = TRUE, footer = JS("
    function(colInfo) {
      return '<b>Rows: </b>' + colInfo.data.length
    }
  "))
))
```

### Table Styles
https://glin.github.io/reactable/articles/examples.html#table-styles

```r
reactable(iris, striped = TRUE, outlined = TRUE, bordered = TRUE)
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

### More Examples
- [Twitter Followers](https://glin.github.io/reactable/articles/twitter-followers/twitter-followers.html)
- [Women's World Cup Predictions](https://glin.github.io/reactable/articles/womens-world-cup/womens-world-cup.html)
- [NBA Box Score](https://glin.github.io/reactable/articles/nba-box-score/nba-box-score.html)
- [100k Rows](https://glin.github.io/reactable/articles/100k-rows.html)

## Usage
```r
reactable(
  data,                       # Data frame or matrix
  rownames = FALSE,           # Show row names?
  colnames = NULL,            # Named list of column names
  columns = NULL,             # Named list of column definitions. See column definitions below
  columnGroups = NULL,        # List of column group definitions. See column groups below
  groupBy = NULL,             # Names of columns to group by
  sortable = TRUE,            # Enable sorting?
  resizable = FALSE,          # Enable column resizing?
  filterable = FALSE,         # Enable column filtering?
  defaultColDef = NULL,       # Default column definition used by every column. See column definitions below
  defaultColGroup = NULL,     # Default column group definition used by every column group. See column groups below
  defaultSortOrder = "asc",   # Default sort order. Either "asc" or "desc"
  defaultSorted = NULL,       # Column names to sort by default. Or a named list with values of "asc" or "desc"
  pagination = TRUE,          # Enable pagination?
  defaultPageSize = 10,       # Default page size
  pageSizeOptions =           # Page size options
    c(10, 25, 50, 100),
  paginationType = "numbers", # Pagination control to use. Either "numbers" (the default), "jump", or "simple"
  showPagination = NULL,      # Show pagination? Defaults to TRUE if the table has more than one page
  showPageSizeOptions = TRUE, # Show page size options?
  showPageInfo = TRUE,        # Show page info?
  minRows = 1,                # Minimum number of rows to show
  selection = NULL,           # Enable row selection? Either "multiple" or "single"
  selectionId = NULL,         # Shiny input ID for the selected rows
  details = NULL,             # Additional content to display when expanding a row. See row details below
  outlined = FALSE,           # Add borders around the table?
  bordered = FALSE,           # Add borders around the table and every cell?
  borderless = FALSE,         # Remove inner borders from table?
  striped = FALSE,            # Zebra-stripe rows?
  highlight = TRUE,           # Highlight rows on hover?
  compact = FALSE,            # Make tables more compact?
  showSortable = FALSE,       # Show an indicator on sortable columns?
  class = NULL,               # Additional CSS classes to apply to the table
  style = NULL,               # Inline styles to apply to the table. A named list or character string
  rowClass = NULL,            # Additional CSS classes to apply to table rows. Also see conditional styling below
  rowStyle = NULL,            # Inline styles to apply to table rows. A named list or character string.
                              # Also see conditional styling below
  inline = FALSE              # Display the table as an inline element, which shrinks to fit its contents?
)
```

### Column Definitions
```r
colDef(
  name = NULL,              # Column name
  aggregate = NULL,         # Aggregate function. See aggregate functions below
  sortable = NULL,          # Enable sorting?
  resizable = NULL,         # Enable column resizing?
  filterable = NULL,        # Enable column filtering?
  show = TRUE,              # Show the column?
  defaultSortOrder = NULL,  # Default sort order. Either "asc" or "desc"
  sortMethod = NULL,        # Custom sort method. Specify "naLast" to always sort NAs to the bottom
  format = NULL,            # Column formatting options. See column formatting below
  cell = NULL,              # Custom cell renderer. See cell renderers below
  aggregated = NULL,        # Custom aggregated cell renderer. See cell renderers below
  footer = NULL,            # Footer content or renderer. See footers below
  html = FALSE,             # Render cells as HTML? HTML strings are escaped by default
  showNA = FALSE,           # Show NA values? If FALSE, NA values will be left as empty cells
  minWidth = NULL,          # Min width of the column in pixels
  maxWidth = NULL,          # Max width of the column in pixels
  width = NULL,             # Fixed width of the column in pixels. Overrides minWidth and maxWidth
  align = NULL,             # Column alignment. One of "left", "right", "center"
  class = NULL,             # Additional CSS classes to apply to cells. Also see conditional styling below
  style = NULL,             # Inline styles to apply to cells. A named list or character string.
                            # Also see conditional styling below
  headerClass = NULL,       # Additional CSS classes to apply to the header
  headerStyle = NULL,       # Inline styles to apply to the header. A named list or character string
  footerClass = NULL,       # Additional CSS classes to apply to the footer
  footerStyle = NULL        # Inline styles to apply to the footer. A named list or character string
)
```

### Column Groups
```r
colGroup(
  name,                # Column group name
  columns,             # Names of columns in the group
  align = NULL,        # Column group header alignment. One of "left", "right", "center"
  headerClass = NULL,  # Additional CSS classes to apply to the header
  headerStyle = NULL   # Inline styles to apply to the header. A named list or character string
)
```

### Aggregate Functions
Built-in aggregate functions:
```r
colDef(aggregate = "sum")        # Sum of numbers
colDef(aggregate = "mean")       # Mean of numbers
colDef(aggregate = "max")        # Max of numbers
colDef(aggregate = "min")        # Min of numbers
colDef(aggregate = "count")      # Count of values
colDef(aggregate = "unique")     # Comma-separated list of unique values
colDef(aggregate = "frequency")  # Comma-separated counts of unique values
```

Custom aggregate functions:
```r
colDef(
  aggregate = JS("
    function(values, rows) {
      // input:
      //  - values: an array of all values in the group
      //  - rows: an array of all rows in the group
      //
      // output:
      //  - an aggregated value, e.g. a comma-separated list
      return values.join(', ')
    }
  ")
)
```

### Column Formatting
Format all cells in the column:
```r
colDef(
  format = colFormat()
)
```

Format standard and aggregated cells separately:
```r
colDef(
  format = list(
    cell = colFormat(),       # Standard cells
    aggregated = colFormat()  # Aggregated cells
  )
)
```

Formatting options:
```r
colFormat(
  prefix = NULL,       # Prefix string
  suffix = NULL,       # Suffix string
  digits = NULL,       # Number of decimal digits to use for numbers
  separators = FALSE,  # Use grouping separators (e.g. thousands) for numbers? Locale-dependent
  percent = FALSE,     # Format number as a percentage? Locale-dependent
  currency = NULL,     # Currency format. An ISO 4217 currency code, such as "USD", "EUR", "CNY". Locale-dependent
  datetime = FALSE,    # Format as a locale-dependent date-time?
  date = FALSE,        # Format as a locale-dependent date?
  time = FALSE,        # Format as a locale-dependent time?
  hour12 = NULL,       # Whether to use 12-hour time or 24-hour time. The default convention is locale-dependent
  locales = NULL       # Locales to use for number and date/time formatting. A vector of BCP 47 language
)                      # tags, such as "en-US", "hi", "sv-SE". Defaults to the locale of the browser
```

### Cell Renderers
Cell rendering can be customized using a Javascript function:
```r
colDef(
  cell = JS("
    function(cellInfo) {
      // input:
      //  - cellInfo, an object containing cell and row info
      //
      // output:
      //  - a cell value, e.g. a string converted to uppercase
      return cellInfo.value.toUpperCase()
    }
  "),
  aggregated = JS("function(cellInfo) { return cellInfo.value }")
)
```

Standard cell renderers can also be an R function (not supported for aggregated cells):
```r
colDef(
  cell = function(value, index) {
    # input:
    #   - value, the cell value
    #   - index, the row index (optional)
    #
    # output:
    #   - content to render (e.g. an HTML tag)
    htmltools::div(style = "color: red", toupper(value))
  }
)
```

See https://github.com/tannerlinsley/react-table/tree/v6#renderers for more details
on JS render function arguments.

### Footers
Footer content can be a cell value or HTML tag:
```r
colDef(footer = "Total: 5")
colDef(footer = htmltools::div("Total: 5"))
```

Or an R render function:
```r
colDef(
  footer = function(values, name) {
    # input:
    #   - values, the column values
    #   - name, the column name (optional)
    #
    # output:
    #   - content to render (e.g. an HTML tag)
    htmltools::div(paste("Total:", sum(values)))
  }
)
```

Or a Javascript render function:
```r
colDef(
  footer = JS("
    function(colInfo) {
      // input:
      //  - colInfo, an object containing column info
      //
      // output:
      //  - content to render (e.g. an HTML string)
      return '<div>Rows: ' + colInfo.data.length + '</div>'
    }
  "),
  html = TRUE
)
```

### Expandable Row Details
Rows can be expanded with additional content by specifying an R render function:
```r
reactable(
  details = function(index) {
    # input:
    #   - index, the row index
    #
    # output:
    #   - content to render (e.g. an HTML tag or subtable), or NULL to hide details for the row
    htmltools::div(
      paste("Details for row:", index),
      reactable(data[index, ])
    )
  }
)
```

Or a Javascript render function:
```r
reactable(
  details = JS("
    function(rowInfo) {
      // input:
      //  - rowInfo, an object containing row info
      //
      // output:
      //  - content to render (e.g. an HTML string)
      return '<div>' + JSON.stringify(rowInfo) + '</div>'
    }
  ")
)
```

Or for additional customization, a row details definition:
```r
rowDetails(
  render,        # Content render function
  html = FALSE,  # Render content as HTML? HTML strings are escaped by default
  name = NULL,   # Expander column name
  width = NULL   # Expander column width in pixels
)
```

### Conditional Styling
Cells can be conditionally styled using a Javascript function:
```r
colDef(
  style = JS("
    function(rowInfo, state) {
      // input:
      //  - rowInfo, an object containing row info
      //  - state, an object containing the table state (optional)
      //
      // output:
      //  - a style object with camelCased properties
      return { backgroundColor: 'gray' }
    }
  "),
  class = JS("
    function(rowInfo, state) {
      // input:
      //  - rowInfo, an object containing row info
      //  - state, an object containing the table state (optional)
      //
      // output:
      //  - CSS class names
      return 'class1 class2'
    }
  ")
)
```

Or using an R function (not applied to aggregated cells):
```r
colDef(
  style = function(value, index) {
    # input:
    #   - value, the cell value
    #   - index, the row index (optional)
    #
    # output:
    #   - an inline style string or named list of camelCased properties
    if (index == 1) "color: red; margin-left: 30px;"
    else list(color = "red", marginLeft = "30px")
  },
  class = function(value, index) {
    # input:
    #   - value, the cell value
    #   - index, the row index (optional)
    #
    # output:
    #   - CSS class names
    "class1 class2"
  }
)
```

Rows can also be conditionally styled using a Javascript function:
```r
reactable(
  rowStyle = JS("
    function(rowInfo, state) {
      // input:
      //  - rowInfo, an object containing row info
      //  - state, an object containing the table state (optional)
      //
      // output:
      //  - a style object with camelCased properties
      return { backgroundColor: 'gray' }
    }
  "),
  rowClass = JS("
    function(rowInfo, state) {
      // input:
      //  - rowInfo, an object containing row info
      //  - state, an object containing the table state (optional)
      //
      // output:
      //  - CSS class names
      return 'class1 class2'
    }
  ")
)
```

Or using an R function (not applied to aggregated rows):
```r
reactable(
  rowStyle = function(index) {
    # input:
    #   - index, the row index
    #
    # output:
    #   - an inline style string or named list of camelCased properties
    if (index == 1) "color: red; margin-left: 30px;"
    else list(color = "red", marginLeft = "30px")
  },
  rowClass = function(value, index) {
    # input:
    #   - index, the row index
    #
    # output:
    #   - CSS class names
    "class1 class2"
  }
)
```

## License
MIT
