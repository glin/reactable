# Create an interactive data table

`reactable()` creates a data table from tabular data with sorting and
pagination by default. The data table is an HTML widget that can be used
in R Markdown documents and Shiny applications, or viewed from an R
console.

## Usage

``` r
reactable(
  data,
  columns = NULL,
  columnGroups = NULL,
  rownames = NULL,
  groupBy = NULL,
  sortable = TRUE,
  resizable = FALSE,
  filterable = FALSE,
  searchable = FALSE,
  searchMethod = NULL,
  defaultColDef = NULL,
  defaultColGroup = NULL,
  defaultSortOrder = "asc",
  defaultSorted = NULL,
  pagination = TRUE,
  defaultPageSize = 10,
  showPageSizeOptions = FALSE,
  pageSizeOptions = c(10, 25, 50, 100),
  paginationType = "numbers",
  showPagination = NULL,
  showPageInfo = TRUE,
  minRows = 1,
  paginateSubRows = FALSE,
  details = NULL,
  defaultExpanded = FALSE,
  selection = NULL,
  defaultSelected = NULL,
  onClick = NULL,
  highlight = FALSE,
  outlined = FALSE,
  bordered = FALSE,
  borderless = FALSE,
  striped = FALSE,
  compact = FALSE,
  wrap = TRUE,
  showSortIcon = TRUE,
  showSortable = FALSE,
  class = NULL,
  style = NULL,
  rowClass = NULL,
  rowStyle = NULL,
  fullWidth = TRUE,
  width = NULL,
  height = NULL,
  theme = getOption("reactable.theme"),
  language = getOption("reactable.language"),
  meta = NULL,
  elementId = NULL,
  static = getOption("reactable.static", FALSE),
  server = FALSE,
  selectionId = NULL
)
```

## Arguments

- data:

  A data frame or matrix.

  Can also be a
  [`crosstalk::SharedData`](https://rdrr.io/pkg/crosstalk/man/SharedData.html)
  object that wraps a data frame.

- columns:

  Named list of column definitions. See [`colDef()`](colDef.md).

- columnGroups:

  List of column group definitions. See [`colGroup()`](colGroup.md).

- rownames:

  Show row names? Defaults to `TRUE` if the data has row names.

  To customize the row names column, add a column definition using
  `".rownames"` as the column name.

  Cells in the row names column are automatically marked up as row
  headers for assistive technologies.

- groupBy:

  Character vector of column names to group by.

  To aggregate data when rows are grouped, use the `aggregate` argument
  in [`colDef()`](colDef.md).

- sortable:

  Enable sorting? Defaults to `TRUE`.

- resizable:

  Enable column resizing?

- filterable:

  Enable column filtering?

- searchable:

  Enable global table searching?

- searchMethod:

  Custom search method to use for global table searching. A
  [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) function that
  takes an array of row objects, an array of column IDs, and the search
  value as arguments, and returns the filtered array of row objects.

- defaultColDef:

  Default column definition used by every column. See
  [`colDef()`](colDef.md).

- defaultColGroup:

  Default column group definition used by every column group. See
  [`colGroup()`](colGroup.md).

- defaultSortOrder:

  Default sort order. Either `"asc"` for ascending order or `"desc"` for
  descending order. Defaults to `"asc"`.

- defaultSorted:

  Character vector of column names to sort by default. Or to customize
  sort order, a named list with values of `"asc"` or `"desc"`.

- pagination:

  Enable pagination? Defaults to `TRUE`.

- defaultPageSize:

  Default page size for the table. Defaults to 10.

- showPageSizeOptions:

  Show page size options?

- pageSizeOptions:

  Page size options for the table. Defaults to 10, 25, 50, 100.

- paginationType:

  Pagination control to use. Either `"numbers"` for page number buttons
  (the default), `"jump"` for a page jump, or `"simple"` to show
  'Previous' and 'Next' buttons only.

- showPagination:

  Show pagination? Defaults to `TRUE` if the table has more than one
  page.

- showPageInfo:

  Show page info? Defaults to `TRUE`.

- minRows:

  Minimum number of rows to show per page. Defaults to 1.

- paginateSubRows:

  When rows are grouped, paginate sub rows? Defaults to `FALSE`.

- details:

  Additional content to display when expanding a row. An R function that
  takes the row index and column name as arguments, or a
  [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) function that
  takes a row info object as an argument. Can also be a
  [`colDef()`](colDef.md) to customize the details expander column.

- defaultExpanded:

  Expand all rows by default?

- selection:

  Enable row selection? Either `"multiple"` or `"single"` for multiple
  or single row selection.

  To get the selected rows in Shiny, use
  [`getReactableState()`](getReactableState.md).

  To customize the selection column, use `".selection"` as the column
  name.

- defaultSelected:

  A numeric vector of default selected row indices.

- onClick:

  Action to take when clicking a cell. Either `"expand"` to expand the
  row, `"select"` to select the row, or a
  [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) function that
  takes a row info object, column object, and table state object as
  arguments.

- highlight:

  Highlight table rows on hover?

- outlined:

  Add borders around the table?

- bordered:

  Add borders around the table and every cell?

- borderless:

  Remove inner borders from table?

- striped:

  Add zebra-striping to table rows?

- compact:

  Make tables more compact?

- wrap:

  Enable text wrapping? If `TRUE` (the default), long text will be
  wrapped to multiple lines. If `FALSE`, text will be truncated to fit
  on one line.

- showSortIcon:

  Show a sort icon when sorting columns?

- showSortable:

  Show an indicator on sortable columns?

- class:

  Additional CSS classes to apply to the table.

- style:

  Inline styles to apply to the table. A named list or character string.

  Note that if `style` is a named list, property names should be
  camelCased.

- rowClass:

  Additional CSS classes to apply to table rows. A character string, a
  [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) function that
  takes a row info object and table state object as arguments, or an R
  function that takes a row index argument.

- rowStyle:

  Inline styles to apply to table rows. A named list, character string,
  [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) function that
  takes a row info object and table state object as arguments, or an R
  function that takes a row index argument.

  Note that if `rowStyle` is a named list, property names should be
  camelCased. If `rowStyle` is a
  [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) function, it
  should return a JavaScript object with camelCased property names.

- fullWidth:

  Stretch the table to fill the full width of its container? Defaults to
  `TRUE`.

- width:

  Width of the table in pixels. Defaults to `"auto"` for automatic
  sizing.

  To set the width of a column, see [`colDef()`](colDef.md).

- height:

  Height of the table in pixels. Defaults to `"auto"` for automatic
  sizing.

- theme:

  Theme options for the table, specified by
  [`reactableTheme()`](reactableTheme.md). Defaults to the global
  `reactable.theme` option. Can also be a function that returns a
  [`reactableTheme()`](reactableTheme.md) or `NULL`.

- language:

  Language options for the table, specified by
  [`reactableLang()`](reactableLang.md). Defaults to the global
  `reactable.language` option.

- meta:

  Custom metadata to pass to JavaScript render functions or style
  functions. A named list of values that can also be
  [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) expressions or
  functions. Custom metadata can be accessed using the `state.meta`
  property, and updated using [`updateReactable()`](updateReactable.md)
  in Shiny or `Reactable.setMeta()` in the JavaScript API.

- elementId:

  Element ID for the widget.

- static:

  Render the table to static HTML? Defaults to the global
  `reactable.static` option. Requires the V8 package, which is not
  installed with reactable by default.

  With static rendering, tables are pre-rendered to their initial HTML
  so they appear immediately without any flash of content. Tables are
  then made interactive and subsequently rendered by JavaScript as
  needed.

  Static rendering is **experimental**, and is not supported for tables
  rendered via [`reactableOutput()`](reactable-shiny.md) in Shiny.

- server:

  Enable server-side data processing in Shiny apps? Requires the V8
  package, which is not installed with reactable by default.

  Server-side data processing is currently **experimental**.

- selectionId:

  **Deprecated**. Use [`getReactableState()`](getReactableState.md) to
  get the selected rows in Shiny.

## Value

A `reactable` HTML widget that can be used in R Markdown documents and
Shiny applications, or viewed from an R console.

## Note

See the [online documentation](https://glin.github.io/reactable/) for
additional details and examples.

## See also

- [`renderReactable()`](reactable-shiny.md) and
  [`reactableOutput()`](reactable-shiny.md) for using reactable in Shiny
  applications or interactive R Markdown documents.

- [`colDef()`](colDef.md), [`colFormat()`](colFormat.md), and
  [`colGroup()`](colGroup.md) to customize columns.

- [`reactableTheme()`](reactableTheme.md) and
  [`reactableLang()`](reactableLang.md) to customize the table.

## Examples

``` r
# Basic usage
reactable(iris)

{"x":{"tag":{"name":"Reactable","attribs":{"data":{"Sepal.Length":[5.1,4.9,4.7,4.6,5,5.4,4.6,5,4.4,4.9,5.4,4.8,4.8,4.3,5.8,5.7,5.4,5.1,5.7,5.1,5.4,5.1,4.6,5.1,4.8,5,5,5.2,5.2,4.7,4.8,5.4,5.2,5.5,4.9,5,5.5,4.9,4.4,5.1,5,4.5,4.4,5,5.1,4.8,5.1,4.6,5.3,5,7,6.4,6.9,5.5,6.5,5.7,6.3,4.9,6.6,5.2,5,5.9,6,6.1,5.6,6.7,5.6,5.8,6.2,5.6,5.9,6.1,6.3,6.1,6.4,6.6,6.8,6.7,6,5.7,5.5,5.5,5.8,6,5.4,6,6.7,6.3,5.6,5.5,5.5,6.1,5.8,5,5.6,5.7,5.7,6.2,5.1,5.7,6.3,5.8,7.1,6.3,6.5,7.6,4.9,7.3,6.7,7.2,6.5,6.4,6.8,5.7,5.8,6.4,6.5,7.7,7.7,6,6.9,5.6,7.7,6.3,6.7,7.2,6.2,6.1,6.4,7.2,7.4,7.9,6.4,6.3,6.1,7.7,6.3,6.4,6,6.9,6.7,6.9,5.8,6.8,6.7,6.7,6.3,6.5,6.2,5.9],"Sepal.Width":[3.5,3,3.2,3.1,3.6,3.9,3.4,3.4,2.9,3.1,3.7,3.4,3,3,4,4.4,3.9,3.5,3.8,3.8,3.4,3.7,3.6,3.3,3.4,3,3.4,3.5,3.4,3.2,3.1,3.4,4.1,4.2,3.1,3.2,3.5,3.6,3,3.4,3.5,2.3,3.2,3.5,3.8,3,3.8,3.2,3.7,3.3,3.2,3.2,3.1,2.3,2.8,2.8,3.3,2.4,2.9,2.7,2,3,2.2,2.9,2.9,3.1,3,2.7,2.2,2.5,3.2,2.8,2.5,2.8,2.9,3,2.8,3,2.9,2.6,2.4,2.4,2.7,2.7,3,3.4,3.1,2.3,3,2.5,2.6,3,2.6,2.3,2.7,3,2.9,2.9,2.5,2.8,3.3,2.7,3,2.9,3,3,2.5,2.9,2.5,3.6,3.2,2.7,3,2.5,2.8,3.2,3,3.8,2.6,2.2,3.2,2.8,2.8,2.7,3.3,3.2,2.8,3,2.8,3,2.8,3.8,2.8,2.8,2.6,3,3.4,3.1,3,3.1,3.1,3.1,2.7,3.2,3.3,3,2.5,3,3.4,3],"Petal.Length":[1.4,1.4,1.3,1.5,1.4,1.7,1.4,1.5,1.4,1.5,1.5,1.6,1.4,1.1,1.2,1.5,1.3,1.4,1.7,1.5,1.7,1.5,1,1.7,1.9,1.6,1.6,1.5,1.4,1.6,1.6,1.5,1.5,1.4,1.5,1.2,1.3,1.4,1.3,1.5,1.3,1.3,1.3,1.6,1.9,1.4,1.6,1.4,1.5,1.4,4.7,4.5,4.9,4,4.6,4.5,4.7,3.3,4.6,3.9,3.5,4.2,4,4.7,3.6,4.4,4.5,4.1,4.5,3.9,4.8,4,4.9,4.7,4.3,4.4,4.8,5,4.5,3.5,3.8,3.7,3.9,5.1,4.5,4.5,4.7,4.4,4.1,4,4.4,4.6,4,3.3,4.2,4.2,4.2,4.3,3,4.1,6,5.1,5.9,5.6,5.8,6.6,4.5,6.3,5.8,6.1,5.1,5.3,5.5,5,5.1,5.3,5.5,6.7,6.9,5,5.7,4.9,6.7,4.9,5.7,6,4.8,4.9,5.6,5.8,6.1,6.4,5.6,5.1,5.6,6.1,5.6,5.5,4.8,5.4,5.6,5.1,5.1,5.9,5.7,5.2,5,5.2,5.4,5.1],"Petal.Width":[0.2,0.2,0.2,0.2,0.2,0.4,0.3,0.2,0.2,0.1,0.2,0.2,0.1,0.1,0.2,0.4,0.4,0.3,0.3,0.3,0.2,0.4,0.2,0.5,0.2,0.2,0.4,0.2,0.2,0.2,0.2,0.4,0.1,0.2,0.2,0.2,0.2,0.1,0.2,0.2,0.3,0.3,0.2,0.6,0.4,0.3,0.2,0.2,0.2,0.2,1.4,1.5,1.5,1.3,1.5,1.3,1.6,1,1.3,1.4,1,1.5,1,1.4,1.3,1.4,1.5,1,1.5,1.1,1.8,1.3,1.5,1.2,1.3,1.4,1.4,1.7,1.5,1,1.1,1,1.2,1.6,1.5,1.6,1.5,1.3,1.3,1.3,1.2,1.4,1.2,1,1.3,1.2,1.3,1.3,1.1,1.3,2.5,1.9,2.1,1.8,2.2,2.1,1.7,1.8,1.8,2.5,2,1.9,2.1,2,2.4,2.3,1.8,2.2,2.3,1.5,2.3,2,2,1.8,2.1,1.8,1.8,1.8,2.1,1.6,1.9,2,2.2,1.5,1.4,2.3,2.4,1.8,1.8,2.1,2.4,2.3,1.9,2.3,2.5,2.3,1.9,2,2.3,1.8],"Species":["setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica"]},"columns":[{"id":"Sepal.Length","name":"Sepal.Length","type":"numeric"},{"id":"Sepal.Width","name":"Sepal.Width","type":"numeric"},{"id":"Petal.Length","name":"Petal.Length","type":"numeric"},{"id":"Petal.Width","name":"Petal.Width","type":"numeric"},{"id":"Species","name":"Species","type":"factor"}],"dataKey":"d3cef23026d9ee220e6a649a546cbdc4"},"children":[]},"class":"reactR_markup"},"evals":[],"jsHooks":[]}
# Grouping and aggregation
reactable(
  iris,
  groupBy = "Species",
  columns = list(
    Sepal.Length = colDef(aggregate = "count"),
    Sepal.Width = colDef(aggregate = "mean"),
    Petal.Length = colDef(aggregate = "sum"),
    Petal.Width = colDef(aggregate = "max")
  )
)

{"x":{"tag":{"name":"Reactable","attribs":{"data":{"Sepal.Length":[5.1,4.9,4.7,4.6,5,5.4,4.6,5,4.4,4.9,5.4,4.8,4.8,4.3,5.8,5.7,5.4,5.1,5.7,5.1,5.4,5.1,4.6,5.1,4.8,5,5,5.2,5.2,4.7,4.8,5.4,5.2,5.5,4.9,5,5.5,4.9,4.4,5.1,5,4.5,4.4,5,5.1,4.8,5.1,4.6,5.3,5,7,6.4,6.9,5.5,6.5,5.7,6.3,4.9,6.6,5.2,5,5.9,6,6.1,5.6,6.7,5.6,5.8,6.2,5.6,5.9,6.1,6.3,6.1,6.4,6.6,6.8,6.7,6,5.7,5.5,5.5,5.8,6,5.4,6,6.7,6.3,5.6,5.5,5.5,6.1,5.8,5,5.6,5.7,5.7,6.2,5.1,5.7,6.3,5.8,7.1,6.3,6.5,7.6,4.9,7.3,6.7,7.2,6.5,6.4,6.8,5.7,5.8,6.4,6.5,7.7,7.7,6,6.9,5.6,7.7,6.3,6.7,7.2,6.2,6.1,6.4,7.2,7.4,7.9,6.4,6.3,6.1,7.7,6.3,6.4,6,6.9,6.7,6.9,5.8,6.8,6.7,6.7,6.3,6.5,6.2,5.9],"Sepal.Width":[3.5,3,3.2,3.1,3.6,3.9,3.4,3.4,2.9,3.1,3.7,3.4,3,3,4,4.4,3.9,3.5,3.8,3.8,3.4,3.7,3.6,3.3,3.4,3,3.4,3.5,3.4,3.2,3.1,3.4,4.1,4.2,3.1,3.2,3.5,3.6,3,3.4,3.5,2.3,3.2,3.5,3.8,3,3.8,3.2,3.7,3.3,3.2,3.2,3.1,2.3,2.8,2.8,3.3,2.4,2.9,2.7,2,3,2.2,2.9,2.9,3.1,3,2.7,2.2,2.5,3.2,2.8,2.5,2.8,2.9,3,2.8,3,2.9,2.6,2.4,2.4,2.7,2.7,3,3.4,3.1,2.3,3,2.5,2.6,3,2.6,2.3,2.7,3,2.9,2.9,2.5,2.8,3.3,2.7,3,2.9,3,3,2.5,2.9,2.5,3.6,3.2,2.7,3,2.5,2.8,3.2,3,3.8,2.6,2.2,3.2,2.8,2.8,2.7,3.3,3.2,2.8,3,2.8,3,2.8,3.8,2.8,2.8,2.6,3,3.4,3.1,3,3.1,3.1,3.1,2.7,3.2,3.3,3,2.5,3,3.4,3],"Petal.Length":[1.4,1.4,1.3,1.5,1.4,1.7,1.4,1.5,1.4,1.5,1.5,1.6,1.4,1.1,1.2,1.5,1.3,1.4,1.7,1.5,1.7,1.5,1,1.7,1.9,1.6,1.6,1.5,1.4,1.6,1.6,1.5,1.5,1.4,1.5,1.2,1.3,1.4,1.3,1.5,1.3,1.3,1.3,1.6,1.9,1.4,1.6,1.4,1.5,1.4,4.7,4.5,4.9,4,4.6,4.5,4.7,3.3,4.6,3.9,3.5,4.2,4,4.7,3.6,4.4,4.5,4.1,4.5,3.9,4.8,4,4.9,4.7,4.3,4.4,4.8,5,4.5,3.5,3.8,3.7,3.9,5.1,4.5,4.5,4.7,4.4,4.1,4,4.4,4.6,4,3.3,4.2,4.2,4.2,4.3,3,4.1,6,5.1,5.9,5.6,5.8,6.6,4.5,6.3,5.8,6.1,5.1,5.3,5.5,5,5.1,5.3,5.5,6.7,6.9,5,5.7,4.9,6.7,4.9,5.7,6,4.8,4.9,5.6,5.8,6.1,6.4,5.6,5.1,5.6,6.1,5.6,5.5,4.8,5.4,5.6,5.1,5.1,5.9,5.7,5.2,5,5.2,5.4,5.1],"Petal.Width":[0.2,0.2,0.2,0.2,0.2,0.4,0.3,0.2,0.2,0.1,0.2,0.2,0.1,0.1,0.2,0.4,0.4,0.3,0.3,0.3,0.2,0.4,0.2,0.5,0.2,0.2,0.4,0.2,0.2,0.2,0.2,0.4,0.1,0.2,0.2,0.2,0.2,0.1,0.2,0.2,0.3,0.3,0.2,0.6,0.4,0.3,0.2,0.2,0.2,0.2,1.4,1.5,1.5,1.3,1.5,1.3,1.6,1,1.3,1.4,1,1.5,1,1.4,1.3,1.4,1.5,1,1.5,1.1,1.8,1.3,1.5,1.2,1.3,1.4,1.4,1.7,1.5,1,1.1,1,1.2,1.6,1.5,1.6,1.5,1.3,1.3,1.3,1.2,1.4,1.2,1,1.3,1.2,1.3,1.3,1.1,1.3,2.5,1.9,2.1,1.8,2.2,2.1,1.7,1.8,1.8,2.5,2,1.9,2.1,2,2.4,2.3,1.8,2.2,2.3,1.5,2.3,2,2,1.8,2.1,1.8,1.8,1.8,2.1,1.6,1.9,2,2.2,1.5,1.4,2.3,2.4,1.8,1.8,2.1,2.4,2.3,1.9,2.3,2.5,2.3,1.9,2,2.3,1.8],"Species":["setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica"]},"columns":[{"id":"Sepal.Length","name":"Sepal.Length","type":"numeric","aggregate":"count"},{"id":"Sepal.Width","name":"Sepal.Width","type":"numeric","aggregate":"mean"},{"id":"Petal.Length","name":"Petal.Length","type":"numeric","aggregate":"sum"},{"id":"Petal.Width","name":"Petal.Width","type":"numeric","aggregate":"max"},{"id":"Species","name":"Species","type":"factor"}],"groupBy":["Species"],"dataKey":"4cca391c2289576dbb338b0a1fd9d9e1"},"children":[]},"class":"reactR_markup"},"evals":[],"jsHooks":[]}
# Row details
reactable(iris, details = function(index) {
  htmltools::div(
    "Details for row: ", index,
    htmltools::tags$pre(paste(capture.output(iris[index, ]), collapse = "\n"))
  )
})

{"x":{"tag":{"name":"Reactable","attribs":{"data":{"Sepal.Length":[5.1,4.9,4.7,4.6,5,5.4,4.6,5,4.4,4.9,5.4,4.8,4.8,4.3,5.8,5.7,5.4,5.1,5.7,5.1,5.4,5.1,4.6,5.1,4.8,5,5,5.2,5.2,4.7,4.8,5.4,5.2,5.5,4.9,5,5.5,4.9,4.4,5.1,5,4.5,4.4,5,5.1,4.8,5.1,4.6,5.3,5,7,6.4,6.9,5.5,6.5,5.7,6.3,4.9,6.6,5.2,5,5.9,6,6.1,5.6,6.7,5.6,5.8,6.2,5.6,5.9,6.1,6.3,6.1,6.4,6.6,6.8,6.7,6,5.7,5.5,5.5,5.8,6,5.4,6,6.7,6.3,5.6,5.5,5.5,6.1,5.8,5,5.6,5.7,5.7,6.2,5.1,5.7,6.3,5.8,7.1,6.3,6.5,7.6,4.9,7.3,6.7,7.2,6.5,6.4,6.8,5.7,5.8,6.4,6.5,7.7,7.7,6,6.9,5.6,7.7,6.3,6.7,7.2,6.2,6.1,6.4,7.2,7.4,7.9,6.4,6.3,6.1,7.7,6.3,6.4,6,6.9,6.7,6.9,5.8,6.8,6.7,6.7,6.3,6.5,6.2,5.9],"Sepal.Width":[3.5,3,3.2,3.1,3.6,3.9,3.4,3.4,2.9,3.1,3.7,3.4,3,3,4,4.4,3.9,3.5,3.8,3.8,3.4,3.7,3.6,3.3,3.4,3,3.4,3.5,3.4,3.2,3.1,3.4,4.1,4.2,3.1,3.2,3.5,3.6,3,3.4,3.5,2.3,3.2,3.5,3.8,3,3.8,3.2,3.7,3.3,3.2,3.2,3.1,2.3,2.8,2.8,3.3,2.4,2.9,2.7,2,3,2.2,2.9,2.9,3.1,3,2.7,2.2,2.5,3.2,2.8,2.5,2.8,2.9,3,2.8,3,2.9,2.6,2.4,2.4,2.7,2.7,3,3.4,3.1,2.3,3,2.5,2.6,3,2.6,2.3,2.7,3,2.9,2.9,2.5,2.8,3.3,2.7,3,2.9,3,3,2.5,2.9,2.5,3.6,3.2,2.7,3,2.5,2.8,3.2,3,3.8,2.6,2.2,3.2,2.8,2.8,2.7,3.3,3.2,2.8,3,2.8,3,2.8,3.8,2.8,2.8,2.6,3,3.4,3.1,3,3.1,3.1,3.1,2.7,3.2,3.3,3,2.5,3,3.4,3],"Petal.Length":[1.4,1.4,1.3,1.5,1.4,1.7,1.4,1.5,1.4,1.5,1.5,1.6,1.4,1.1,1.2,1.5,1.3,1.4,1.7,1.5,1.7,1.5,1,1.7,1.9,1.6,1.6,1.5,1.4,1.6,1.6,1.5,1.5,1.4,1.5,1.2,1.3,1.4,1.3,1.5,1.3,1.3,1.3,1.6,1.9,1.4,1.6,1.4,1.5,1.4,4.7,4.5,4.9,4,4.6,4.5,4.7,3.3,4.6,3.9,3.5,4.2,4,4.7,3.6,4.4,4.5,4.1,4.5,3.9,4.8,4,4.9,4.7,4.3,4.4,4.8,5,4.5,3.5,3.8,3.7,3.9,5.1,4.5,4.5,4.7,4.4,4.1,4,4.4,4.6,4,3.3,4.2,4.2,4.2,4.3,3,4.1,6,5.1,5.9,5.6,5.8,6.6,4.5,6.3,5.8,6.1,5.1,5.3,5.5,5,5.1,5.3,5.5,6.7,6.9,5,5.7,4.9,6.7,4.9,5.7,6,4.8,4.9,5.6,5.8,6.1,6.4,5.6,5.1,5.6,6.1,5.6,5.5,4.8,5.4,5.6,5.1,5.1,5.9,5.7,5.2,5,5.2,5.4,5.1],"Petal.Width":[0.2,0.2,0.2,0.2,0.2,0.4,0.3,0.2,0.2,0.1,0.2,0.2,0.1,0.1,0.2,0.4,0.4,0.3,0.3,0.3,0.2,0.4,0.2,0.5,0.2,0.2,0.4,0.2,0.2,0.2,0.2,0.4,0.1,0.2,0.2,0.2,0.2,0.1,0.2,0.2,0.3,0.3,0.2,0.6,0.4,0.3,0.2,0.2,0.2,0.2,1.4,1.5,1.5,1.3,1.5,1.3,1.6,1,1.3,1.4,1,1.5,1,1.4,1.3,1.4,1.5,1,1.5,1.1,1.8,1.3,1.5,1.2,1.3,1.4,1.4,1.7,1.5,1,1.1,1,1.2,1.6,1.5,1.6,1.5,1.3,1.3,1.3,1.2,1.4,1.2,1,1.3,1.2,1.3,1.3,1.1,1.3,2.5,1.9,2.1,1.8,2.2,2.1,1.7,1.8,1.8,2.5,2,1.9,2.1,2,2.4,2.3,1.8,2.2,2.3,1.5,2.3,2,2,1.8,2.1,1.8,1.8,1.8,2.1,1.6,1.9,2,2.2,1.5,1.4,2.3,2.4,1.8,1.8,2.1,2.4,2.3,1.9,2.3,2.5,2.3,1.9,2,2.3,1.8],"Species":["setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica"]},"columns":[{"id":".details","name":"","type":null,"sortable":false,"resizable":false,"filterable":false,"searchable":false,"width":45,"align":"center","details":[{"name":"div","attribs":{},"children":["Details for row: ","1",{"name":"pre","attribs":{},"children":["  Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n1          5.1         3.5          1.4         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","2",{"name":"pre","attribs":{},"children":["  Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n2          4.9           3          1.4         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","3",{"name":"pre","attribs":{},"children":["  Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n3          4.7         3.2          1.3         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","4",{"name":"pre","attribs":{},"children":["  Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n4          4.6         3.1          1.5         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","5",{"name":"pre","attribs":{},"children":["  Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n5            5         3.6          1.4         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","6",{"name":"pre","attribs":{},"children":["  Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n6          5.4         3.9          1.7         0.4  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","7",{"name":"pre","attribs":{},"children":["  Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n7          4.6         3.4          1.4         0.3  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","8",{"name":"pre","attribs":{},"children":["  Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n8            5         3.4          1.5         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","9",{"name":"pre","attribs":{},"children":["  Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n9          4.4         2.9          1.4         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","10",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n10          4.9         3.1          1.5         0.1  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","11",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n11          5.4         3.7          1.5         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","12",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n12          4.8         3.4          1.6         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","13",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n13          4.8           3          1.4         0.1  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","14",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n14          4.3           3          1.1         0.1  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","15",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n15          5.8           4          1.2         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","16",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n16          5.7         4.4          1.5         0.4  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","17",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n17          5.4         3.9          1.3         0.4  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","18",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n18          5.1         3.5          1.4         0.3  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","19",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n19          5.7         3.8          1.7         0.3  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","20",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n20          5.1         3.8          1.5         0.3  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","21",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n21          5.4         3.4          1.7         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","22",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n22          5.1         3.7          1.5         0.4  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","23",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n23          4.6         3.6            1         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","24",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n24          5.1         3.3          1.7         0.5  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","25",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n25          4.8         3.4          1.9         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","26",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n26            5           3          1.6         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","27",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n27            5         3.4          1.6         0.4  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","28",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n28          5.2         3.5          1.5         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","29",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n29          5.2         3.4          1.4         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","30",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n30          4.7         3.2          1.6         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","31",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n31          4.8         3.1          1.6         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","32",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n32          5.4         3.4          1.5         0.4  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","33",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n33          5.2         4.1          1.5         0.1  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","34",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n34          5.5         4.2          1.4         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","35",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n35          4.9         3.1          1.5         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","36",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n36            5         3.2          1.2         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","37",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n37          5.5         3.5          1.3         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","38",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n38          4.9         3.6          1.4         0.1  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","39",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n39          4.4           3          1.3         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","40",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n40          5.1         3.4          1.5         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","41",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n41            5         3.5          1.3         0.3  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","42",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n42          4.5         2.3          1.3         0.3  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","43",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n43          4.4         3.2          1.3         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","44",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n44            5         3.5          1.6         0.6  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","45",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n45          5.1         3.8          1.9         0.4  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","46",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n46          4.8           3          1.4         0.3  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","47",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n47          5.1         3.8          1.6         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","48",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n48          4.6         3.2          1.4         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","49",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n49          5.3         3.7          1.5         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","50",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width Species\n50            5         3.3          1.4         0.2  setosa"]}]},{"name":"div","attribs":{},"children":["Details for row: ","51",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n51            7         3.2          4.7         1.4 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","52",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n52          6.4         3.2          4.5         1.5 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","53",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n53          6.9         3.1          4.9         1.5 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","54",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n54          5.5         2.3            4         1.3 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","55",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n55          6.5         2.8          4.6         1.5 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","56",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n56          5.7         2.8          4.5         1.3 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","57",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n57          6.3         3.3          4.7         1.6 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","58",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n58          4.9         2.4          3.3           1 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","59",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n59          6.6         2.9          4.6         1.3 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","60",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n60          5.2         2.7          3.9         1.4 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","61",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n61            5           2          3.5           1 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","62",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n62          5.9           3          4.2         1.5 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","63",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n63            6         2.2            4           1 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","64",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n64          6.1         2.9          4.7         1.4 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","65",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n65          5.6         2.9          3.6         1.3 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","66",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n66          6.7         3.1          4.4         1.4 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","67",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n67          5.6           3          4.5         1.5 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","68",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n68          5.8         2.7          4.1           1 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","69",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n69          6.2         2.2          4.5         1.5 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","70",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n70          5.6         2.5          3.9         1.1 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","71",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n71          5.9         3.2          4.8         1.8 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","72",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n72          6.1         2.8            4         1.3 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","73",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n73          6.3         2.5          4.9         1.5 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","74",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n74          6.1         2.8          4.7         1.2 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","75",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n75          6.4         2.9          4.3         1.3 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","76",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n76          6.6           3          4.4         1.4 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","77",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n77          6.8         2.8          4.8         1.4 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","78",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n78          6.7           3            5         1.7 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","79",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n79            6         2.9          4.5         1.5 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","80",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n80          5.7         2.6          3.5           1 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","81",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n81          5.5         2.4          3.8         1.1 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","82",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n82          5.5         2.4          3.7           1 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","83",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n83          5.8         2.7          3.9         1.2 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","84",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n84            6         2.7          5.1         1.6 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","85",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n85          5.4           3          4.5         1.5 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","86",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n86            6         3.4          4.5         1.6 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","87",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n87          6.7         3.1          4.7         1.5 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","88",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n88          6.3         2.3          4.4         1.3 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","89",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n89          5.6           3          4.1         1.3 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","90",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n90          5.5         2.5            4         1.3 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","91",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n91          5.5         2.6          4.4         1.2 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","92",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n92          6.1           3          4.6         1.4 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","93",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n93          5.8         2.6            4         1.2 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","94",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n94            5         2.3          3.3           1 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","95",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n95          5.6         2.7          4.2         1.3 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","96",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n96          5.7           3          4.2         1.2 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","97",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n97          5.7         2.9          4.2         1.3 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","98",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n98          6.2         2.9          4.3         1.3 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","99",{"name":"pre","attribs":{},"children":["   Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n99          5.1         2.5            3         1.1 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","100",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width    Species\n100          5.7         2.8          4.1         1.3 versicolor"]}]},{"name":"div","attribs":{},"children":["Details for row: ","101",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n101          6.3         3.3            6         2.5 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","102",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n102          5.8         2.7          5.1         1.9 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","103",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n103          7.1           3          5.9         2.1 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","104",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n104          6.3         2.9          5.6         1.8 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","105",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n105          6.5           3          5.8         2.2 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","106",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n106          7.6           3          6.6         2.1 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","107",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n107          4.9         2.5          4.5         1.7 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","108",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n108          7.3         2.9          6.3         1.8 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","109",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n109          6.7         2.5          5.8         1.8 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","110",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n110          7.2         3.6          6.1         2.5 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","111",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n111          6.5         3.2          5.1           2 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","112",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n112          6.4         2.7          5.3         1.9 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","113",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n113          6.8           3          5.5         2.1 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","114",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n114          5.7         2.5            5           2 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","115",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n115          5.8         2.8          5.1         2.4 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","116",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n116          6.4         3.2          5.3         2.3 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","117",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n117          6.5           3          5.5         1.8 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","118",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n118          7.7         3.8          6.7         2.2 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","119",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n119          7.7         2.6          6.9         2.3 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","120",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n120            6         2.2            5         1.5 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","121",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n121          6.9         3.2          5.7         2.3 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","122",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n122          5.6         2.8          4.9           2 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","123",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n123          7.7         2.8          6.7           2 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","124",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n124          6.3         2.7          4.9         1.8 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","125",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n125          6.7         3.3          5.7         2.1 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","126",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n126          7.2         3.2            6         1.8 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","127",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n127          6.2         2.8          4.8         1.8 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","128",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n128          6.1           3          4.9         1.8 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","129",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n129          6.4         2.8          5.6         2.1 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","130",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n130          7.2           3          5.8         1.6 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","131",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n131          7.4         2.8          6.1         1.9 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","132",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n132          7.9         3.8          6.4           2 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","133",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n133          6.4         2.8          5.6         2.2 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","134",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n134          6.3         2.8          5.1         1.5 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","135",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n135          6.1         2.6          5.6         1.4 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","136",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n136          7.7           3          6.1         2.3 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","137",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n137          6.3         3.4          5.6         2.4 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","138",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n138          6.4         3.1          5.5         1.8 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","139",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n139            6           3          4.8         1.8 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","140",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n140          6.9         3.1          5.4         2.1 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","141",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n141          6.7         3.1          5.6         2.4 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","142",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n142          6.9         3.1          5.1         2.3 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","143",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n143          5.8         2.7          5.1         1.9 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","144",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n144          6.8         3.2          5.9         2.3 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","145",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n145          6.7         3.3          5.7         2.5 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","146",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n146          6.7           3          5.2         2.3 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","147",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n147          6.3         2.5            5         1.9 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","148",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n148          6.5           3          5.2           2 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","149",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n149          6.2         3.4          5.4         2.3 virginica"]}]},{"name":"div","attribs":{},"children":["Details for row: ","150",{"name":"pre","attribs":{},"children":["    Sepal.Length Sepal.Width Petal.Length Petal.Width   Species\n150          5.9           3          5.1         1.8 virginica"]}]}]},{"id":"Sepal.Length","name":"Sepal.Length","type":"numeric"},{"id":"Sepal.Width","name":"Sepal.Width","type":"numeric"},{"id":"Petal.Length","name":"Petal.Length","type":"numeric"},{"id":"Petal.Width","name":"Petal.Width","type":"numeric"},{"id":"Species","name":"Species","type":"factor"}],"dataKey":"a3a43ad1d13879e26f9ebfc68e862821"},"children":[]},"class":"reactR_markup"},"evals":[],"jsHooks":[]}
# Conditional styling
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

{"x":{"tag":{"name":"Reactable","attribs":{"data":{"extra":[0.7,-1.6,-0.2,-1.2,-0.1,3.4,3.7,0.8,0,2,1.9,0.8,1.1,0.1,-0.1,4.4,5.5,1.6,4.6,3.4],"group":["1","1","1","1","1","1","1","1","1","1","2","2","2","2","2","2","2","2","2","2"],"ID":["1","2","3","4","5","6","7","8","9","10","1","2","3","4","5","6","7","8","9","10"]},"columns":[{"id":"extra","name":"extra","type":"numeric","style":[{"color":"green","fontWeight":"bold"},{"color":"red","fontWeight":"bold"},{"color":"red","fontWeight":"bold"},{"color":"red","fontWeight":"bold"},{"color":"red","fontWeight":"bold"},{"color":"green","fontWeight":"bold"},{"color":"green","fontWeight":"bold"},{"color":"green","fontWeight":"bold"},{"color":"#777","fontWeight":"bold"},{"color":"green","fontWeight":"bold"},{"color":"green","fontWeight":"bold"},{"color":"green","fontWeight":"bold"},{"color":"green","fontWeight":"bold"},{"color":"green","fontWeight":"bold"},{"color":"red","fontWeight":"bold"},{"color":"green","fontWeight":"bold"},{"color":"green","fontWeight":"bold"},{"color":"green","fontWeight":"bold"},{"color":"green","fontWeight":"bold"},{"color":"green","fontWeight":"bold"}]},{"id":"group","name":"group","type":"factor"},{"id":"ID","name":"ID","type":"factor"}],"dataKey":"565f9723204007be72ad13a2aa38fc99"},"children":[]},"class":"reactR_markup"},"evals":[],"jsHooks":[]}
```
