# Conditional Styling

You can conditionally style a table using functions that return inline
styles or CSS classes. Just like with [custom
rendering](custom-rendering.md), style functions can either be in R or
JavaScript:

[TABLE]

Whichever one to use depends on the situation and personal preference.
You might prefer to use R functions except when you need more dynamic
behavior (e.g., style based on sorted state).

#### Example: color scales

We can use R’s built-in [color
utilities](https://bookdown.org/rdpeng/exdata/plotting-and-color-in-r.html#color-utilities-in-r)
to apply a color scale to a column:

``` r
data <- iris[1:5, ]
orange_pal <- function(x) rgb(colorRamp(c("#ffe4cc", "#ffb54d"))(x), maxColorValue = 255)

reactable(
  data,
  columns = list(
    Petal.Length = colDef(
      style = function(value) {
        normalized <- (value - min(data$Petal.Length)) / (max(data$Petal.Length) - min(data$Petal.Length))
        color <- orange_pal(normalized)
        list(background = color)
      }
    )
  )
)
```

#### Example: highlight sorted columns

To style sorted columns, we need to use a JavaScript function to
determine whether a column is currently being sorted:

``` r
reactable(
  iris[1:5, ],
  defaultSorted = "Petal.Length",
  defaultColDef = colDef(
    class = JS("function(rowInfo, column, state) {
      // Highlight sorted columns
      for (let i = 0; i < state.sorted.length; i++) {
        if (state.sorted[i].id === column.id) {
          return 'sorted'
        }
      }
    }")
  )
)
```

``` css
.sorted {
  background: rgba(0, 0, 0, 0.03);
}
```

## Cell Styling

### R functions

Both `style` and `class` take an R function with up to 3 optional
arguments:

``` r
colDef(
  style = function(value, index, name) {
    # input:
    #   - value, the cell value
    #   - index, the row index (optional)
    #   - name, the column name (optional)
    #
    # output:
    #   - a named list with camelCased property names
    list(color = "red", marginLeft = "30px")
    #   - or an inline style string
    "color: red; margin-left: 30px;"
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

**Note:** R functions cannot apply styles to aggregated cells.

### JavaScript functions

Or a JavaScript function, wrapped in
[`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html), with up to 3
optional arguments:

``` r
colDef(
  style = JS("
    function(rowInfo, column, state) {
      // input:
      //  - rowInfo, an object containing row info
      //  - column, an object containing column properties (optional)
      //  - state, an object containing the table state (optional)
      //
      // output:
      //  - a style object with camelCased property names
      return { backgroundColor: 'gray' }
    }
  "),
  class = JS("
    function(rowInfo, column, state) {
      // input:
      //  - rowInfo, an object containing row info
      //  - column, an object containing column properties (optional)
      //  - state, an object containing the table state (optional)
      //
      // output:
      //  - CSS class names
      return 'class1 class2'
    }
  ")
)
```

#### `rowInfo` properties

| Property            | Example                                           | Description                                                                                                           |
|---------------------|---------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `values`            | `{ Petal.Length: 1.7, Species: "setosa" }`        | row data values                                                                                                       |
| `row`               | `{ Petal.Length: 1.7, Species: "setosa" }`        | same as `values` (deprecated in v0.3.0)                                                                               |
| `index`             | `20`                                              | row index (zero-based)                                                                                                |
| `viewIndex`         | `0`                                               | row index within the page (zero-based)                                                                                |
| `aggregated`        | `true`                                            | whether the row is aggregated                                                                                         |
| `expanded`          | `true`                                            | whether the row is expanded                                                                                           |
| `subRows`           | `[{ Petal.Length: 1.7, Species: "setosa" }, ...]` | sub rows data (aggregated rows only)                                                                                  |
| `level`             | `0`                                               | row nesting depth (zero-based)                                                                                        |
| `selected`          | `true`                                            | whether the row is selected                                                                                           |
| `toggleRowSelected` | `function (isSelected?: boolean)`                 | function to toggle the row's selection. Optionally pass `true` to select or `false` to deselect. (new in v0.4.5.9000) |

#### `column` properties

| Property      | Example                 | Description                                                                      |
|---------------|-------------------------|----------------------------------------------------------------------------------|
| `id`          | `"Petal.Length"`        | column ID                                                                        |
| `name`        | `"Petal Length"`        | column display name                                                              |
| `filterValue` | `"petal"`               | column filter value                                                              |
| `setFilter`   | `function (value: any)` | function to set the column filter value (set to `undefined` to clear the filter) |

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

## Row Styling

### R functions

Both `rowStyle` and `rowClass` take an R function with a single
argument:

``` r
reactable(
  rowStyle = function(index) {
    # input:
    #   - index, the row index
    #
    # output:
    #   - a named list with camelCased property names
    list(color = "red", marginLeft = "30px")
    #   - or an inline style string
    "color: red; margin-left: 30px;"
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

**Note:** R functions cannot apply styles to aggregated rows.

### JavaScript functions

Or a JavaScript function with up to 2 optional arguments:

``` r
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

#### `rowInfo` properties

| Property            | Example                                           | Description                                                                                                           |
|---------------------|---------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `values`            | `{ Petal.Length: 1.7, Species: "setosa" }`        | row data values                                                                                                       |
| `row`               | `{ Petal.Length: 1.7, Species: "setosa" }`        | same as `values` (deprecated in v0.3.0)                                                                               |
| `index`             | `20`                                              | row index (zero-based)                                                                                                |
| `viewIndex`         | `0`                                               | row index within the page (zero-based)                                                                                |
| `aggregated`        | `true`                                            | whether the row is aggregated                                                                                         |
| `expanded`          | `true`                                            | whether the row is expanded                                                                                           |
| `subRows`           | `[{ Petal.Length: 1.7, Species: "setosa" }, ...]` | sub rows data (aggregated rows only)                                                                                  |
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
