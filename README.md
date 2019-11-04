# reactable

[![Build Status](https://travis-ci.com/glin/reactable.svg?branch=master)](https://travis-ci.com/glin/reactable)
[![codecov](https://codecov.io/gh/glin/reactable/branch/master/graph/badge.svg)](https://codecov.io/gh/glin/reactable)
[![lifecycle](https://img.shields.io/badge/lifecycle-experimental-orange.svg)](https://www.tidyverse.org/lifecycle/#experimental)

Interactive data tables for R, based on the
[React Table](https://github.com/tannerlinsley/react-table) library.

## Features
- Sorting, filtering, pagination
- Grouping and aggregation
- Expandable rows and nested tables
- Built-in column formatting
- Conditional styling
- Custom rendering using R or JavaScript
- HTML widget (via [reactR](https://github.com/react-R/reactR)) that can be used in R Markdown documents or Shiny apps

## Installation

You can install the development version from GitHub with:
```r
# install.packages("devtools")
devtools::install_github("glin/reactable")
```

## Examples

### Demos
- [Twitter Followers](https://glin.github.io/reactable/articles/twitter-followers/twitter-followers.html)
- [Women's World Cup Predictions](https://glin.github.io/reactable/articles/womens-world-cup/womens-world-cup.html)
- [NBA Box Score](https://glin.github.io/reactable/articles/nba-box-score/nba-box-score.html)
- [CRAN Packages](https://glin.github.io/reactable/articles/cran-packages/cran-packages.html)
- [100k Rows](https://glin.github.io/reactable/articles/100k-rows.html)
- [Demo Cookbook](https://glin.github.io/reactable/articles/cookbook/cookbook.html)
- [Shiny Demo](https://glin.github.io/reactable/articles/shiny-demo.html)

### Basic Usage
https://glin.github.io/reactable/articles/examples.html#basic-usage

```r
reactable(iris)
```

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

### Expandable Rows and Nested Tables
https://glin.github.io/reactable/articles/examples.html#expandable-row-details

```r
data <- unique(CO2[, c("Plant", "Type")])

reactable(data, details = function(index) {
  subset <- CO2[CO2$Plant == data[index, "Plant"], ]
  htmltools::div(style = "padding: 16px",
    reactable(subset, outlined = TRUE)
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

### Searching
https://glin.github.io/reactable/articles/examples.html#searching

```r
data <- MASS::Cars93[, c("Manufacturer", "Model", "Type", "AirBags", "Price")]

reactable(data, searchable = TRUE, minRows = 10)
```

### Column Formatting
https://glin.github.io/reactable/articles/examples.html#column-formatting

```r
data <- data.frame(
  price_USD = c(123456.56, 132, 5650.12),
  price_INR = c(350, 23208.552, 1773156.4),
  temp = c(22, NA, 31),
  percent = c(0.9525556, 0.5, 0.112),
  date = as.Date(c("2019-01-02", "2019-03-15", "2019-09-22"))
)

reactable(data, columns = list(
  price_USD = colDef(format = colFormat(prefix = "$", separators = TRUE, digits = 2)),
  price_INR = colDef(format = colFormat(currency = "INR", separators = TRUE, locales = "hi-IN")),
  temp = colDef(format = colFormat(suffix = " °C")),
  percent = colDef(format = colFormat(percent = TRUE, digits = 1)),
  date = colDef(format = colFormat(date = TRUE, locales = "en-GB"))
))
```

### Conditional Styling
https://glin.github.io/reactable/articles/examples.html#conditional-styling

```r
reactable(sleep, columns = list(
  extra = colDef(style = function(value) {
    if (value > 0) {
      color <- "green"
    } else if (value < 0) {
      color <- "red"
    } else {
      color <- "#777"
    }
    list(color = color, fontWeight = "bold")
  })
))
```

### Custom Cell Rendering
https://glin.github.io/reactable/articles/examples.html#custom-cell-rendering

```r
data <- MASS::Cars93[, c("Manufacturer", "Model", "Type", "AirBags", "Price")]

reactable(data, columns = list(
  Model = colDef(cell = function(value, index) {
    # Render as a link
    url <- sprintf("https://wikipedia.org/wiki/%s_%s", data[index, "Manufacturer"], value)
    htmltools::tags$a(href = url, target = "_blank", as.character(value))
  }),
  AirBags = colDef(cell = function(value) {
    # Render as ✘ or ✓
    if (value == "None") "\u2718" else "\u2713"
  }),
  Price = colDef(cell = function(value) {
    # Render as currency
    paste0("$", format(value * 1000, big.mark = ","))
  })
))
```

### Embedding HTML Widgets
https://glin.github.io/reactable/articles/examples.html#embedding-html-widgets

```r
library(dplyr)
library(sparkline)

data <- chickwts %>%
  group_by(feed) %>%
  summarise(weight = list(weight)) %>%
  mutate(boxplot = NA, sparkline = NA)

reactable(data, columns = list(
  weight = colDef(cell = function(values) {
    sparkline(values, type = "bar")
  }),
  boxplot = colDef(cell = function(value, index) {
    sparkline(data$weight[[index]], type = "box")
  }),
  sparkline = colDef(cell = function(value, index) {
    sparkline(data$weight[[index]])
  })
))
```

### Footers and Total Rows
https://glin.github.io/reactable/articles/examples.html#footers

```r
data <- subset(iris[1:5, ], select = c(Species, Sepal.Length:Petal.Width))

reactable(
  data, 
  defaultColDef = colDef(footer = function(values) {
    format(sum(values), nsmall = 1)
  }),
  columns = list(
    Species = colDef(footer = htmltools::tags$b("Total"))
  )
)
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

### Table Styling
https://glin.github.io/reactable/articles/examples.html#table-styling

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

## Usage
```r
reactable(
  data,                       # Data frame or matrix
  columns = NULL,             # Named list of column definitions. See column definitions below
  columnGroups = NULL,        # List of column group definitions. See column groups below
  rownames = NULL,            # Show row names? Defaults to TRUE if the data has row names
                              # To customize or group the row names column, use ".rownames" as the column name
  groupBy = NULL,             # Names of columns to group by
  sortable = TRUE,            # Enable sorting?
  resizable = FALSE,          # Enable column resizing?
  filterable = FALSE,         # Enable column filtering?
  searchable = FALSE,         # Enable global table searching?
  defaultColDef = NULL,       # Default column definition. See column definitions below
  defaultColGroup = NULL,     # Default column group definition. See column groups below
  defaultSortOrder = "asc",   # Default sort order. Either "asc" or "desc"
  defaultSorted = NULL,       # Column names to sort by default. Or a named list with values of "asc" or "desc"
  pagination = TRUE,          # Enable pagination?
  defaultPageSize = 10,       # Default page size
  showPageSizeOptions = FALSE,# Show page size options?
  pageSizeOptions =           # Page size options
    c(10, 25, 50, 100),
  paginationType = "numbers", # Pagination control to use. Either "numbers", "jump", or "simple"
  showPagination = NULL,      # Show pagination? Defaults to TRUE if the table has more than one page
  showPageInfo = TRUE,        # Show page info?
  minRows = 1,                # Minimum number of rows to show per page
  details = NULL,             # Additional content to display when expanding a row. See row details below
  selection = NULL,           # Enable row selection? Either "multiple" or "single"
  selectionId = NULL,         # Shiny input ID for the selected rows
  onClick = NULL,             # Action to take when clicking a cell. Either "expand", "select", or a JS function
  highlight = FALSE,          # Highlight rows on hover?
  outlined = FALSE,           # Add borders around the table?
  bordered = FALSE,           # Add borders around the table and every cell?
  borderless = FALSE,         # Remove inner borders from table?
  striped = FALSE,            # Zebra-stripe rows?
  compact = FALSE,            # Make tables more compact?
  wrap = TRUE,                # Enable text wrapping? If FALSE, long text will be truncated to fit on one line
  showSortIcon = TRUE,        # Show a sort icon when sorting columns?
  showSortable = FALSE,       # Show an indicator on sortable columns?
  class = NULL,               # Additional CSS classes to apply to the table
  style = NULL,               # Inline styles to apply to the table. A named list or character string
  rowClass = NULL,            # Additional CSS classes to apply to table rows. Also see conditional styling below
  rowStyle = NULL,            # Inline styles to apply to table rows. A named list or character string.
                              # Also see conditional styling below
  fullWidth = TRUE,           # Stretch the table to fill the full width of its container?
  width = "auto",             # Width in pixels. Defaults to automatic sizing
  height = "auto",            # Height in pixels. Defaults to automatic sizing
  elementId = NULL            # Element ID for the widget
)
```

### Column Definitions
```r
colDef(
  name = NULL,              # Column header name
  aggregate = NULL,         # Aggregate function. See aggregate functions below
  sortable = NULL,          # Enable sorting?
  resizable = NULL,         # Enable column resizing?
  filterable = NULL,        # Enable column filtering?
  show = TRUE,              # Show the column?
  defaultSortOrder = NULL,  # Default sort order. Either "asc" or "desc"
  sortNALast = FALSE,       # Always sort missing values (NA or NaN) last?
  format = NULL,            # Column formatting options. See column formatting below
  cell = NULL,              # Custom cell renderer. See cell rendering below
  aggregated = NULL,        # Custom aggregated cell renderer. See cell rendering below
  header = NULL,            # Custom header renderer. See header rendering below
  footer = NULL,            # Footer content or renderer. See footers below
  details = NULL,           # Additional content to display when expanding a row. See row details below
  html = FALSE,             # Render cells as HTML? HTML strings are escaped by default
  na = "",                  # String to display for missing values (i.e. NA or NaN)
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
  name,                # Column group header name
  columns,             # Names of columns in the group
  header = NULL,       # Custom header renderer. See header rendering below
  html = FALSE,        # Render header as HTML? HTML strings are escaped by default
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
      //  - rows: an array of row info objects for all rows in the group
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
  format = colFormat(...)
)
```

Format standard and aggregated cells separately:
```r
colDef(
  format = list(
    cell = colFormat(...),       # Standard cells
    aggregated = colFormat(...)  # Aggregated cells
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

### Custom Cell Rendering
Cell rendering can be customized using a JavaScript function:
```r
colDef(
  cell = JS("
    function(cellInfo) {
      // input:
      //  - cellInfo, an object containing cell and row info
      //
      // output:
      //  - content to render (e.g. an HTML string)
      return '<div>' + cellInfo.value + '</div>'
    }
  "),
  aggregated = JS("function(cellInfo) { return cellInfo.value }"),
  html = TRUE  # to render as HTML
)
```

Standard cell renderers can also be an R function (not supported for aggregated cells):
```r
colDef(
  cell = function(value, index, name) {
    # input:
    #   - value, the cell value
    #   - index, the row index (optional)
    #   - name, the column name (optional)
    #
    # output:
    #   - content to render (e.g. an HTML tag)
    htmltools::div(style = "color: red", toupper(value))
  }
)
```

See [Custom Rendering](https://glin.github.io/reactable/articles/custom-rendering.html)
for more details on JavaScript render function arguments.

### Custom Header Rendering
Header rendering can be customized using an R render function:
```r
colDef(
  header = function(value, name) {
    # input:
    #   - value, the header value
    #   - name, the column name (optional)
    #
    # output:
    #   - content to render (e.g. an HTML tag)
    htmltools::div(value)
  }
)
```

Or a JavaScript render function:
```r
colDef(
  header = JS("
    function(colInfo) {
      // input:
      //  - colInfo, an object containing column info
      //
      // output:
      //  - content to render (e.g. an HTML string)
      return '<div>' + colInfo.column.name + '</div>'
    }
  "),
  html = TRUE  # to render as HTML
)
```

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

Or a JavaScript render function:
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
  html = TRUE  # to render as HTML
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

Or a JavaScript render function:
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

Columns can also have row details. Multiple row details are supported:
```r
reactable(
  details = function(index) { ... },
  columns = list(
    colA = colDef(details = function(index) { ... }),
    colB = colDef(details = function(index) { ... })
  )
)
```

To customize the table-level row details column, provide a column definition:
```r
reactable(
  details = colDef(
    name = "More",
    details = JS("function(rowInfo) { return '<div>details</div>' }"),
    html = TRUE,  # to render as HTML
    width = 50
  )
)
```

### Conditional Styling
Cells can be conditionally styled using a JavaScript function:
```r
colDef(
  style = JS("
    function(rowInfo, colInfo, state) {
      // input:
      //  - rowInfo, an object containing row info
      //  - colInfo, an object containing column info (optional)
      //  - state, an object containing the table state (optional)
      //
      // output:
      //  - a style object with camelCased properties
      return { backgroundColor: 'gray' }
    }
  "),
  class = JS("
    function(rowInfo, colInfo, state) {
      // input:
      //  - rowInfo, an object containing row info
      //  - colInfo, an object containing column info (optional)
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
  style = function(value, index, name) {
    # input:
    #   - value, the cell value
    #   - index, the row index (optional)
    #   - name, the column name (optional)
    #
    # output:
    #   - an inline style string or named list of camelCased properties
    if (index == 1) "color: red; margin-left: 30px;"
    else list(color = "red", marginLeft = "30px")
  },
  class = function(value, index, name) {
    # input:
    #   - value, the cell value
    #   - index, the row index (optional)
    #   - name, the column name (optional)
    #
    # output:
    #   - CSS class names
    "class1 class2"
  }
)
```

Rows can also be conditionally styled using a JavaScript function:
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
  rowClass = function(index) {
    # input:
    #   - index, the row index
    #
    # output:
    #   - CSS class names
    "class1 class2"
  }
)
```

## Browser Support
| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br>IE / Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br>Safari | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png" alt="Opera" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br>Opera |
| --------- | --------- | --------- | --------- | --------- |
| IE11, Edge | last 2 versions | last 2 versions | last 2 versions | last 2 versions |

## License
MIT
