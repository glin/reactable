# Custom Rendering

You may want to customize how your data is displayed beyond what the
built-in formatters provide. For example, inserting a link, combining
data from multiple columns, or showing a column total that updates on
filtering.

In reactable, you can customize data rendering using either an R or
JavaScript function that returns custom content:

[TABLE]

Whichever one to use depends on the situation and personal preference.
You might prefer to use R render functions except in cases where you
need more dynamic behavior (e.g., render based on filtered state) or
have a very large table.

#### Example: column total with filtering

This example requires reactable v0.3.0 or above.

For example, you can easily add a column total using an R render
function:

``` r
data <- MASS::Cars93[20:24, c("Manufacturer", "Model", "Type", "Price")]

reactable(
  data,
  searchable = TRUE,
  columns = list(
    Price = colDef(footer = function(values) {
      htmltools::tags$b(sprintf("$%.2f", sum(values)))
    }),
    Manufacturer = colDef(footer = htmltools::tags$b("Total"))
  )
)
```

However, the column total doesn’t update with filtering. For that, you
need a JavaScript render function with access to the client-side
filtered state:

``` r
data <- MASS::Cars93[20:24, c("Manufacturer", "Model", "Type", "Price")]

reactable(
  data,
  searchable = TRUE,
  columns = list(
    Price = colDef(
      html = TRUE,
      footer = JS("function(column, state) {
        let total = 0
        state.sortedData.forEach(function(row) {
          total += row[column.id]
        })
        return '<b>$' + total.toFixed(2) + '</b>'
      }")
    ),
    Manufacturer = colDef(html = TRUE, footer = "<b>Total</b>")
  )
)
```

## Cells

### R render function

To customize cell rendering, provide an R function with up to 3 optional
arguments:

``` r
colDef(
  cell = function(value, index, name) {
    # input:
    #   - value, the cell value
    #   - index, the row index (optional)
    #   - name, the column name (optional)
    #
    # output:
    #   - content to render (e.g. an HTML tag or widget)
    htmltools::div(style = "color: red", toupper(value))
  }
)
```

### JavaScript render function

Or a JavaScript function, wrapped in
[`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html), with up to 2
optional arguments:

``` r
colDef(
  cell = JS("
    function(cellInfo, state) {
      // input:
      //  - cellInfo, an object containing cell info
      //  - state, an object containing the table state (optional)
      //
      // output:
      //  - content to render (e.g. an HTML string)
      return `<div>${cellInfo.value}</div>`
    }
  "),
  html = TRUE  # to render as HTML
)
```

With JavaScript functions, you can also customize rendering of grouped
cells and aggregated cells:

``` r
colDef(
  grouped = JS("function(cellInfo, state) {
    return cellInfo.value
  }"),
  aggregated = JS("function(cellInfo, state) {
    return cellInfo.value
  }")
)
```

#### `cellInfo` properties

| Property            | Example                                           | Description                                                                                                           |
|---------------------|---------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `value`             | `"setosa"`                                        | cell value                                                                                                            |
| `row`               | `{ Petal.Length: 1.7, Species: "setosa" }`        | row data                                                                                                              |
| `column`            | `{ id: "Petal.Length" }`                          | column info object                                                                                                    |
| `index`             | `20`                                              | row index (zero-based)                                                                                                |
| `viewIndex`         | `0`                                               | row index within the page (zero-based)                                                                                |
| `aggregated`        | `true`                                            | whether the row is aggregated                                                                                         |
| `expanded`          | `true`                                            | whether the row is expanded                                                                                           |
| `filterValue`       | `"petal"`                                         | column filter value                                                                                                   |
| `subRows`           | `[{ Petal.Length: 1.7, Species: "setosa" }, ...]` | sub rows data (aggregated cells only)                                                                                 |
| `level`             | `0`                                               | row nesting depth (zero-based)                                                                                        |
| `selected`          | `true`                                            | whether the row is selected                                                                                           |
| `toggleRowSelected` | `function (isSelected?: boolean)`                 | function to toggle the row's selection. Optionally pass `true` to select or `false` to deselect. (new in v0.4.5.9000) |

#### `state` properties

| Property        | Example                                           | Description                                                                           |
|-----------------|---------------------------------------------------|---------------------------------------------------------------------------------------|
| `sorted`        | `[{ id: "Petal.Length", desc: true }, ...]`       | columns being sorted in the table                                                     |
| `page`          | `2`                                               | page index (zero-based)                                                               |
| `pageSize`      | `10`                                              | page size                                                                             |
| `pages`         | `5`                                               | number of pages                                                                       |
| `filters`       | `[{ id: "Species", value: "petal" }]`             | column filter values                                                                  |
| `searchValue`   | `"petal"`                                         | table search value                                                                    |
| `selected`      | `[0, 1, 4]`                                       | selected row indices (zero-based)                                                     |
| `pageRows`      | `[{ Petal.Length: 1.7, Species: "setosa" }, ...]` | current row data on the page                                                          |
| `sortedData`    | `[{ Petal.Length: 1.7, Species: "setosa" }, ...]` | current row data in the table (after sorting, filtering, grouping)                    |
| `data`          | `[{ Petal.Length: 1.7, Species: "setosa" }, ...]` | original row data in the table                                                        |
| `meta`          | `{ custom: 123 }`                                 | custom table metadata from [`reactable()`](../reference/reactable.md) (new in v0.4.0) |
| `hiddenColumns` | `["Petal.Length"]`                                | columns being hidden in the table                                                     |

## Headers

### R render function

To customize header rendering, provide an R function with up to 2
optional arguments:

``` r
colDef(
  header = function(value, name) {
    # input:
    #   - value, the header value
    #   - name, the column name (optional)
    #
    # output:
    #   - content to render (e.g. an HTML tag or widget)
    htmltools::div(value)
  }
)
```

### JavaScript render function

Or a JavaScript function with up to 2 optional arguments:

``` r
colDef(
  header = JS("
    function(column, state) {
      // input:
      //  - column, an object containing column properties
      //  - state, an object containing the table state (optional)
      //
      // output:
      //  - content to render (e.g. an HTML string)
      return `<div>${column.name}</div>`
    }
  "),
  html = TRUE  # to render as HTML
)
```

#### `column` properties

| Property      | Example                                                              | Description                                                                      |
|---------------|----------------------------------------------------------------------|----------------------------------------------------------------------------------|
| `id`          | `"Petal.Length"`                                                     | column ID                                                                        |
| `name`        | `"Petal Length"`                                                     | column display name                                                              |
| `filterValue` | `"petal"`                                                            | column filter value                                                              |
| `setFilter`   | `function (value: any)`                                              | function to set the column filter value (set to `undefined` to clear the filter) |
| `column`      | `{ id: "Petal.Length", name: "Petal Length", filterValue: "petal" }` | column info object (deprecated in v0.3.0)                                        |
| `data`        | `[{ Petal.Length: 1.7, Petal.Width: 0.2, _subRows: [] }, ...]`       | current row data in the table (deprecated in v0.3.0)                             |

#### `state` properties

| Property        | Example                                           | Description                                                                           |
|-----------------|---------------------------------------------------|---------------------------------------------------------------------------------------|
| `sorted`        | `[{ id: "Petal.Length", desc: true }, ...]`       | columns being sorted in the table                                                     |
| `page`          | `2`                                               | page index (zero-based)                                                               |
| `pageSize`      | `10`                                              | page size                                                                             |
| `pages`         | `5`                                               | number of pages                                                                       |
| `filters`       | `[{ id: "Species", value: "petal" }]`             | column filter values                                                                  |
| `searchValue`   | `"petal"`                                         | table search value                                                                    |
| `selected`      | `[0, 1, 4]`                                       | selected row indices (zero-based)                                                     |
| `pageRows`      | `[{ Petal.Length: 1.7, Species: "setosa" }, ...]` | current row data on the page                                                          |
| `sortedData`    | `[{ Petal.Length: 1.7, Species: "setosa" }, ...]` | current row data in the table (after sorting, filtering, grouping)                    |
| `data`          | `[{ Petal.Length: 1.7, Species: "setosa" }, ...]` | original row data in the table                                                        |
| `meta`          | `{ custom: 123 }`                                 | custom table metadata from [`reactable()`](../reference/reactable.md) (new in v0.4.0) |
| `hiddenColumns` | `["Petal.Length"]`                                | columns being hidden in the table                                                     |

## Footers

### R render function

To add footer content, provide an R function with up to 2 optional
arguments:

``` r
colDef(
  footer = function(values, name) {
    # input:
    #   - values, the column values
    #   - name, the column name (optional)
    #
    # output:
    #   - content to render (e.g. an HTML tag or widget)
    htmltools::div(paste("Total:", sum(values)))
  }
)
```

### JavaScript render function

Or a JavaScript function with up to 2 optional arguments:

``` r
colDef(
  footer = JS("
    function(column, state) {
      // input:
      //  - column, an object containing column properties
      //  - state, an object containing the table state (optional)
      //
      // output:
      //  - content to render (e.g. an HTML string)
      return `<div>Rows: ${state.sortedData.length}</div>`
    }
  "),
  html = TRUE  # to render as HTML
)
```

#### `column` properties

| Property      | Example                                                              | Description                                                                      |
|---------------|----------------------------------------------------------------------|----------------------------------------------------------------------------------|
| `id`          | `"Petal.Length"`                                                     | column ID                                                                        |
| `name`        | `"Petal Length"`                                                     | column display name                                                              |
| `filterValue` | `"petal"`                                                            | column filter value                                                              |
| `setFilter`   | `function (value: any)`                                              | function to set the column filter value (set to `undefined` to clear the filter) |
| `column`      | `{ id: "Petal.Length", name: "Petal Length", filterValue: "petal" }` | column info object (deprecated in v0.3.0)                                        |
| `data`        | `[{ Petal.Length: 1.7, Petal.Width: 0.2, _subRows: [] }, ...]`       | current row data in the table (deprecated in v0.3.0)                             |

#### `state` properties

| Property        | Example                                           | Description                                                                           |
|-----------------|---------------------------------------------------|---------------------------------------------------------------------------------------|
| `sorted`        | `[{ id: "Petal.Length", desc: true }, ...]`       | columns being sorted in the table                                                     |
| `page`          | `2`                                               | page index (zero-based)                                                               |
| `pageSize`      | `10`                                              | page size                                                                             |
| `pages`         | `5`                                               | number of pages                                                                       |
| `filters`       | `[{ id: "Species", value: "petal" }]`             | column filter values                                                                  |
| `searchValue`   | `"petal"`                                         | table search value                                                                    |
| `selected`      | `[0, 1, 4]`                                       | selected row indices (zero-based)                                                     |
| `pageRows`      | `[{ Petal.Length: 1.7, Species: "setosa" }, ...]` | current row data on the page                                                          |
| `sortedData`    | `[{ Petal.Length: 1.7, Species: "setosa" }, ...]` | current row data in the table (after sorting, filtering, grouping)                    |
| `data`          | `[{ Petal.Length: 1.7, Species: "setosa" }, ...]` | original row data in the table                                                        |
| `meta`          | `{ custom: 123 }`                                 | custom table metadata from [`reactable()`](../reference/reactable.md) (new in v0.4.0) |
| `hiddenColumns` | `["Petal.Length"]`                                | columns being hidden in the table                                                     |

## Expandable Row Details

### R render function

To add expandable row details, provide an R function with up to 2
optional arguments:

``` r
reactable(
  details = function(index, name) {
    # input:
    #   - index, the row index
    #   - name, the column name (optional)
    #
    # output:
    #   - content to render (e.g., an HTML tag or nested table), or NULL to hide details
    htmltools::div(
      paste("Details for row:", index),
      reactable(data[index, ])
    )
  }
)
```

### JavaScript render function

Or a JavaScript function with up to 2 optional arguments:

``` r
reactable(
  details = JS("
    function(rowInfo, state) {
      // input:
      //  - rowInfo, an object containing row info
      //  - state, an object containing the table state (optional)
      //
      // output:
      //  - content to render (e.g. an HTML string)
      return `<div>Details for row: ${rowInfo.index}</div>`
    }
  ")
)
```

#### `rowInfo` properties

| Property            | Example                                    | Description                                                                                                           |
|---------------------|--------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `values`            | `{ Petal.Length: 1.7, Species: "setosa" }` | row data values                                                                                                       |
| `row`               | `{ Petal.Length: 1.7, Species: "setosa" }` | same as `values` (deprecated in v0.3.0)                                                                               |
| `index`             | `20`                                       | row index (zero-based)                                                                                                |
| `viewIndex`         | `0`                                        | row index within the page (zero-based)                                                                                |
| `expanded`          | `true`                                     | whether the row is expanded                                                                                           |
| `level`             | `0`                                        | row nesting depth (zero-based)                                                                                        |
| `selected`          | `true`                                     | whether the row is selected                                                                                           |
| `toggleRowSelected` | `function (isSelected?: boolean)`          | function to toggle the row's selection. Optionally pass `true` to select or `false` to deselect. (new in v0.4.5.9000) |

#### `state` properties

| Property        | Example                                           | Description                                                                           |
|-----------------|---------------------------------------------------|---------------------------------------------------------------------------------------|
| `sorted`        | `[{ id: "Petal.Length", desc: true }, ...]`       | columns being sorted in the table                                                     |
| `page`          | `2`                                               | page index (zero-based)                                                               |
| `pageSize`      | `10`                                              | page size                                                                             |
| `pages`         | `5`                                               | number of pages                                                                       |
| `filters`       | `[{ id: "Species", value: "petal" }]`             | column filter values                                                                  |
| `searchValue`   | `"petal"`                                         | table search value                                                                    |
| `selected`      | `[0, 1, 4]`                                       | selected row indices (zero-based)                                                     |
| `pageRows`      | `[{ Petal.Length: 1.7, Species: "setosa" }, ...]` | current row data on the page                                                          |
| `sortedData`    | `[{ Petal.Length: 1.7, Species: "setosa" }, ...]` | current row data in the table (after sorting, filtering, grouping)                    |
| `data`          | `[{ Petal.Length: 1.7, Species: "setosa" }, ...]` | original row data in the table                                                        |
| `meta`          | `{ custom: 123 }`                                 | custom table metadata from [`reactable()`](../reference/reactable.md) (new in v0.4.0) |
| `hiddenColumns` | `["Petal.Length"]`                                | columns being hidden in the table                                                     |
