# Column definitions

Use `colDef()` to customize the columns in a table.

## Usage

``` r
colDef(
  name = NULL,
  aggregate = NULL,
  sortable = NULL,
  resizable = NULL,
  filterable = NULL,
  searchable = NULL,
  filterMethod = NULL,
  show = TRUE,
  defaultSortOrder = NULL,
  sortNALast = FALSE,
  format = NULL,
  cell = NULL,
  grouped = NULL,
  aggregated = NULL,
  header = NULL,
  footer = NULL,
  details = NULL,
  filterInput = NULL,
  html = FALSE,
  na = "",
  rowHeader = FALSE,
  minWidth = 100,
  maxWidth = NULL,
  width = NULL,
  align = NULL,
  vAlign = NULL,
  headerVAlign = NULL,
  sticky = NULL,
  class = NULL,
  style = NULL,
  headerClass = NULL,
  headerStyle = NULL,
  footerClass = NULL,
  footerStyle = NULL
)
```

## Arguments

- name:

  Column header name.

- aggregate:

  Aggregate function to use when rows are grouped. The name of a
  built-in aggregate function or a custom
  [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) aggregate
  function. Built-in aggregate functions are: `"mean"`, `"sum"`,
  `"max"`, `"min"`, `"median"`, `"count"`, `"unique"`, and
  `"frequency"`.

  To enable row grouping, use the `groupBy` argument in
  [`reactable()`](reactable.md).

- sortable:

  Enable sorting? Overrides the table option.

- resizable:

  Enable column resizing? Overrides the table option.

- filterable:

  Enable column filtering? Overrides the table option.

- searchable:

  Enable or disable global table searching for this column. By default,
  global searching applies to all visible columns. Set this to `FALSE`
  to exclude a visible column from searching, or `TRUE` to include a
  hidden column in searching.

- filterMethod:

  Custom filter method to use for column filtering. A
  [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) function that
  takes an array of row objects, the column ID, and the filter value as
  arguments, and returns the filtered array of row objects.

- show:

  Show the column?

  If `FALSE`, this column will be excluded from global table searching
  by default. To include this hidden column in searching, set
  `searchable` to `TRUE` in `colDef()`.

- defaultSortOrder:

  Default sort order. Either `"asc"` for ascending order or `"desc"` for
  descending order. Overrides the table option.

- sortNALast:

  Always sort missing values ([NA](https://rdrr.io/r/base/NA.html) or
  [NaN](https://rdrr.io/r/base/is.finite.html)) last?

- format:

  Column formatting options. A [`colFormat()`](colFormat.md) object to
  format all cells, or a named list of [`colFormat()`](colFormat.md)
  objects to format standard cells (`"cell"`) and aggregated cells
  (`"aggregated"`) separately.

- cell:

  Custom cell renderer. An R function that takes the cell value, row
  index, and column name as arguments, or a
  [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) function that
  takes a cell info object and table state object as arguments.

- grouped:

  Custom grouped cell renderer. A
  [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) function that
  takes a cell info object and table state object as arguments.

- aggregated:

  Custom aggregated cell renderer. A
  [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) function that
  takes a cell info object and table state object as arguments.

- header:

  Custom header renderer. An R function that takes the header value and
  column name as arguments, or a
  [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) function that
  takes a column object and table state object as arguments.

- footer:

  Footer content or render function. Render functions can be an R
  function that takes the column values and column name as arguments, or
  a [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) function that
  takes a column object and table state object as arguments.

- details:

  Additional content to display when expanding a row. An R function that
  takes the row index and column name as arguments, or a
  [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) function that
  takes a row info object and table state object as arguments. Cannot be
  used on a `groupBy` column.

- filterInput:

  Custom filter input or render function. Render functions can be an R
  function that takes the column values and column name as arguments, or
  a [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) function that
  takes a column object and table state object as arguments.

- html:

  Render content as HTML? Raw HTML strings are escaped by default.

- na:

  String to display for missing values (i.e.
  [NA](https://rdrr.io/r/base/NA.html) or
  [NaN](https://rdrr.io/r/base/is.finite.html)). By default, missing
  values are displayed as blank cells.

- rowHeader:

  Mark up cells in this column as row headers?

  Set this to `TRUE` to help users navigate the table using assistive
  technologies. When cells are marked up as row headers, assistive
  technologies will read them aloud while navigating through cells in
  the table.

  Cells in the row names column are automatically marked up as row
  headers.

- minWidth:

  Minimum width of the column in pixels. Defaults to 100.

- maxWidth:

  Maximum width of the column in pixels.

- width:

  Fixed width of the column in pixels. Overrides `minWidth` and
  `maxWidth`.

- align:

  Horizontal alignment of content in the column. One of `"left"`,
  `"right"`, `"center"`. By default, all numbers are right-aligned,
  while all other content is left-aligned.

- vAlign:

  Vertical alignment of content in data cells. One of `"top"` (the
  default), `"center"`, `"bottom"`.

- headerVAlign:

  Vertical alignment of content in header cells. One of `"top"` (the
  default), `"center"`, `"bottom"`.

- sticky:

  Make the column sticky when scrolling horizontally? Either `"left"` or
  `"right"` to make the column stick to the left or right side.

  If a sticky column is in a column group, all columns in the group will
  automatically be made sticky, including the column group header.

  Sticky columns do not work if `fullWidth` is set to `FALSE` in
  [`reactable()`](reactable.md).

- class:

  Additional CSS classes to apply to cells. Can also be an R function
  that takes the cell value, row index, and column name as arguments, or
  a [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) function that
  takes a row info object, column object, and table state object as
  arguments.

  Note that R functions cannot apply classes to aggregated cells.

- style:

  Inline styles to apply to cells. A named list or character string. Can
  also be an R function that takes the cell value and row index as
  arguments, or a [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html)
  function that takes a row info object, column object, and table state
  object as arguments.

  Note that R functions cannot apply styles to aggregated cells. If
  `style` is a named list, property names should be camelCased.

- headerClass:

  Additional CSS classes to apply to the header.

- headerStyle:

  Inline styles to apply to the header. A named list or character
  string.

  Note that if `headerStyle` is a named list, property names should be
  camelCased.

- footerClass:

  Additional CSS classes to apply to the footer.

- footerStyle:

  Inline styles to apply to the footer. A named list or character
  string.

  Note that if `footerStyle` is a named list, property names should be
  camelCased.

## Value

A column definition object that can be used to customize columns in
[`reactable()`](reactable.md).

## Examples

``` r
reactable(
  iris,
  columns = list(
    Sepal.Length = colDef(name = "Sepal Length"),
    Sepal.Width = colDef(filterable = TRUE),
    Petal.Length = colDef(show = FALSE),
    Petal.Width = colDef(defaultSortOrder = "desc")
  )
)

{"x":{"tag":{"name":"Reactable","attribs":{"data":{"Sepal.Length":[5.1,4.9,4.7,4.6,5,5.4,4.6,5,4.4,4.9,5.4,4.8,4.8,4.3,5.8,5.7,5.4,5.1,5.7,5.1,5.4,5.1,4.6,5.1,4.8,5,5,5.2,5.2,4.7,4.8,5.4,5.2,5.5,4.9,5,5.5,4.9,4.4,5.1,5,4.5,4.4,5,5.1,4.8,5.1,4.6,5.3,5,7,6.4,6.9,5.5,6.5,5.7,6.3,4.9,6.6,5.2,5,5.9,6,6.1,5.6,6.7,5.6,5.8,6.2,5.6,5.9,6.1,6.3,6.1,6.4,6.6,6.8,6.7,6,5.7,5.5,5.5,5.8,6,5.4,6,6.7,6.3,5.6,5.5,5.5,6.1,5.8,5,5.6,5.7,5.7,6.2,5.1,5.7,6.3,5.8,7.1,6.3,6.5,7.6,4.9,7.3,6.7,7.2,6.5,6.4,6.8,5.7,5.8,6.4,6.5,7.7,7.7,6,6.9,5.6,7.7,6.3,6.7,7.2,6.2,6.1,6.4,7.2,7.4,7.9,6.4,6.3,6.1,7.7,6.3,6.4,6,6.9,6.7,6.9,5.8,6.8,6.7,6.7,6.3,6.5,6.2,5.9],"Sepal.Width":[3.5,3,3.2,3.1,3.6,3.9,3.4,3.4,2.9,3.1,3.7,3.4,3,3,4,4.4,3.9,3.5,3.8,3.8,3.4,3.7,3.6,3.3,3.4,3,3.4,3.5,3.4,3.2,3.1,3.4,4.1,4.2,3.1,3.2,3.5,3.6,3,3.4,3.5,2.3,3.2,3.5,3.8,3,3.8,3.2,3.7,3.3,3.2,3.2,3.1,2.3,2.8,2.8,3.3,2.4,2.9,2.7,2,3,2.2,2.9,2.9,3.1,3,2.7,2.2,2.5,3.2,2.8,2.5,2.8,2.9,3,2.8,3,2.9,2.6,2.4,2.4,2.7,2.7,3,3.4,3.1,2.3,3,2.5,2.6,3,2.6,2.3,2.7,3,2.9,2.9,2.5,2.8,3.3,2.7,3,2.9,3,3,2.5,2.9,2.5,3.6,3.2,2.7,3,2.5,2.8,3.2,3,3.8,2.6,2.2,3.2,2.8,2.8,2.7,3.3,3.2,2.8,3,2.8,3,2.8,3.8,2.8,2.8,2.6,3,3.4,3.1,3,3.1,3.1,3.1,2.7,3.2,3.3,3,2.5,3,3.4,3],"Petal.Length":[1.4,1.4,1.3,1.5,1.4,1.7,1.4,1.5,1.4,1.5,1.5,1.6,1.4,1.1,1.2,1.5,1.3,1.4,1.7,1.5,1.7,1.5,1,1.7,1.9,1.6,1.6,1.5,1.4,1.6,1.6,1.5,1.5,1.4,1.5,1.2,1.3,1.4,1.3,1.5,1.3,1.3,1.3,1.6,1.9,1.4,1.6,1.4,1.5,1.4,4.7,4.5,4.9,4,4.6,4.5,4.7,3.3,4.6,3.9,3.5,4.2,4,4.7,3.6,4.4,4.5,4.1,4.5,3.9,4.8,4,4.9,4.7,4.3,4.4,4.8,5,4.5,3.5,3.8,3.7,3.9,5.1,4.5,4.5,4.7,4.4,4.1,4,4.4,4.6,4,3.3,4.2,4.2,4.2,4.3,3,4.1,6,5.1,5.9,5.6,5.8,6.6,4.5,6.3,5.8,6.1,5.1,5.3,5.5,5,5.1,5.3,5.5,6.7,6.9,5,5.7,4.9,6.7,4.9,5.7,6,4.8,4.9,5.6,5.8,6.1,6.4,5.6,5.1,5.6,6.1,5.6,5.5,4.8,5.4,5.6,5.1,5.1,5.9,5.7,5.2,5,5.2,5.4,5.1],"Petal.Width":[0.2,0.2,0.2,0.2,0.2,0.4,0.3,0.2,0.2,0.1,0.2,0.2,0.1,0.1,0.2,0.4,0.4,0.3,0.3,0.3,0.2,0.4,0.2,0.5,0.2,0.2,0.4,0.2,0.2,0.2,0.2,0.4,0.1,0.2,0.2,0.2,0.2,0.1,0.2,0.2,0.3,0.3,0.2,0.6,0.4,0.3,0.2,0.2,0.2,0.2,1.4,1.5,1.5,1.3,1.5,1.3,1.6,1,1.3,1.4,1,1.5,1,1.4,1.3,1.4,1.5,1,1.5,1.1,1.8,1.3,1.5,1.2,1.3,1.4,1.4,1.7,1.5,1,1.1,1,1.2,1.6,1.5,1.6,1.5,1.3,1.3,1.3,1.2,1.4,1.2,1,1.3,1.2,1.3,1.3,1.1,1.3,2.5,1.9,2.1,1.8,2.2,2.1,1.7,1.8,1.8,2.5,2,1.9,2.1,2,2.4,2.3,1.8,2.2,2.3,1.5,2.3,2,2,1.8,2.1,1.8,1.8,1.8,2.1,1.6,1.9,2,2.2,1.5,1.4,2.3,2.4,1.8,1.8,2.1,2.4,2.3,1.9,2.3,2.5,2.3,1.9,2,2.3,1.8],"Species":["setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","versicolor","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica","virginica"]},"columns":[{"id":"Sepal.Length","name":"Sepal Length","type":"numeric"},{"id":"Sepal.Width","name":"Sepal.Width","type":"numeric","filterable":true},{"id":"Petal.Length","name":"Petal.Length","type":"numeric","show":false},{"id":"Petal.Width","name":"Petal.Width","type":"numeric","defaultSortDesc":true},{"id":"Species","name":"Species","type":"factor"}],"dataKey":"cecd00bd829b29beec6cee523a36f91c"},"children":[]},"class":"reactR_markup"},"evals":[],"jsHooks":[]}
```
