# Theme options

Use `reactableTheme()` to customize the default styling of a table. You
can set theme variables to change the default styles, or add custom CSS
to specific elements of the table.

The `color` variables are specified as character strings of CSS color
values. The `width` and `padding` variables are specified as either
character strings of CSS width and padding values, or numeric pixel
values. The `style` arguments take custom CSS as named lists of
camelCased properties.

To set the default theme for all tables, use the global
`reactable.theme` option.

## Usage

``` r
reactableTheme(
  color = NULL,
  backgroundColor = NULL,
  borderColor = NULL,
  borderWidth = NULL,
  stripedColor = NULL,
  highlightColor = NULL,
  cellPadding = NULL,
  style = NULL,
  tableStyle = NULL,
  headerStyle = NULL,
  groupHeaderStyle = NULL,
  tableBodyStyle = NULL,
  rowGroupStyle = NULL,
  rowStyle = NULL,
  rowStripedStyle = NULL,
  rowHighlightStyle = NULL,
  rowSelectedStyle = NULL,
  cellStyle = NULL,
  footerStyle = NULL,
  inputStyle = NULL,
  filterInputStyle = NULL,
  searchInputStyle = NULL,
  selectStyle = NULL,
  paginationStyle = NULL,
  pageButtonStyle = NULL,
  pageButtonHoverStyle = NULL,
  pageButtonActiveStyle = NULL,
  pageButtonCurrentStyle = NULL
)
```

## Arguments

- color:

  Default text color.

- backgroundColor:

  Default background color.

- borderColor:

  Default border color.

- borderWidth:

  Default border width.

- stripedColor:

  Default row stripe color.

- highlightColor:

  Default row highlight color.

- cellPadding:

  Default cell padding.

- style:

  Additional CSS for the table.

- tableStyle:

  Additional CSS for the table element (excludes the pagination bar and
  search input).

- headerStyle:

  Additional CSS for header cells.

- groupHeaderStyle:

  Additional CSS for group header cells.

- tableBodyStyle:

  Additional CSS for the table body element.

- rowGroupStyle:

  Additional CSS for rows. Includes row details.

- rowStyle:

  Additional CSS for rows. Does not include row details.

- rowStripedStyle:

  Additional CSS for striped rows.

- rowHighlightStyle:

  Additional CSS for highlighted rows.

- rowSelectedStyle:

  Additional CSS for selected rows.

- cellStyle:

  Additional CSS for cells.

- footerStyle:

  Additional CSS for footer cells.

- inputStyle:

  Additional CSS for inputs.

- filterInputStyle:

  Additional CSS for filter inputs.

- searchInputStyle:

  Additional CSS for the search input.

- selectStyle:

  Additional CSS for table select controls.

- paginationStyle:

  Additional CSS for the pagination bar.

- pageButtonStyle, pageButtonHoverStyle, pageButtonActiveStyle,
  pageButtonCurrentStyle:

  Additional CSS for page buttons, page buttons with hover or active
  states, and the current page button.

## Value

A theme options object that can be used to customize the default styling
in [`reactable()`](reactable.md).

## Details

You can use nested CSS selectors in `style` arguments to target the
current element, using `&` as the selector, or other child elements
(just like in Sass). This is useful for adding pseudo-classes like
`&:hover`, or adding styles in a certain context like
`.outer-container &`.

## Examples

``` r
reactable(
  iris[1:30, ],
  searchable = TRUE,
  striped = TRUE,
  highlight = TRUE,
  bordered = TRUE,
  theme = reactableTheme(
    borderColor = "#dfe2e5",
    stripedColor = "#f6f8fa",
    highlightColor = "#f0f5f9",
    cellPadding = "8px 12px",
    style = list(
      fontFamily = "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"
    ),
    searchInputStyle = list(width = "100%")
  )
)

{"x":{"tag":{"name":"Reactable","attribs":{"data":{"Sepal.Length":[5.1,4.9,4.7,4.6,5,5.4,4.6,5,4.4,4.9,5.4,4.8,4.8,4.3,5.8,5.7,5.4,5.1,5.7,5.1,5.4,5.1,4.6,5.1,4.8,5,5,5.2,5.2,4.7],"Sepal.Width":[3.5,3,3.2,3.1,3.6,3.9,3.4,3.4,2.9,3.1,3.7,3.4,3,3,4,4.4,3.9,3.5,3.8,3.8,3.4,3.7,3.6,3.3,3.4,3,3.4,3.5,3.4,3.2],"Petal.Length":[1.4,1.4,1.3,1.5,1.4,1.7,1.4,1.5,1.4,1.5,1.5,1.6,1.4,1.1,1.2,1.5,1.3,1.4,1.7,1.5,1.7,1.5,1,1.7,1.9,1.6,1.6,1.5,1.4,1.6],"Petal.Width":[0.2,0.2,0.2,0.2,0.2,0.4,0.3,0.2,0.2,0.1,0.2,0.2,0.1,0.1,0.2,0.4,0.4,0.3,0.3,0.3,0.2,0.4,0.2,0.5,0.2,0.2,0.4,0.2,0.2,0.2],"Species":["setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa"]},"columns":[{"id":"Sepal.Length","name":"Sepal.Length","type":"numeric"},{"id":"Sepal.Width","name":"Sepal.Width","type":"numeric"},{"id":"Petal.Length","name":"Petal.Length","type":"numeric"},{"id":"Petal.Width","name":"Petal.Width","type":"numeric"},{"id":"Species","name":"Species","type":"factor"}],"searchable":true,"highlight":true,"bordered":true,"striped":true,"theme":{"borderColor":"#dfe2e5","stripedColor":"#f6f8fa","highlightColor":"#f0f5f9","cellPadding":"8px 12px","style":{"fontFamily":"-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"},"searchInputStyle":{"width":"100%"}},"language":{"searchPlaceholder":"Search...","noData":"No entries found","pageInfo":"{rowStart} to {rowEnd} of {rows} entries"},"dataKey":"bd109cf9c811c9b2f740e27c20610745"},"children":[]},"class":"reactR_markup"},"evals":[],"jsHooks":[]}
# Set the default theme for all tables
options(reactable.theme = reactableTheme(
  color = "hsl(233, 9%, 87%)",
  backgroundColor = "hsl(233, 9%, 19%)",
  borderColor = "hsl(233, 9%, 22%)",
  stripedColor = "hsl(233, 12%, 22%)",
  highlightColor = "hsl(233, 12%, 24%)",
  inputStyle = list(backgroundColor = "hsl(233, 9%, 25%)"),
  selectStyle = list(backgroundColor = "hsl(233, 9%, 25%)"),
  pageButtonHoverStyle = list(backgroundColor = "hsl(233, 9%, 25%)"),
  pageButtonActiveStyle = list(backgroundColor = "hsl(233, 9%, 28%)")
))

reactable(
  iris[1:30, ],
  filterable = TRUE,
  showPageSizeOptions = TRUE,
  striped = TRUE,
  highlight = TRUE,
  details = function(index) paste("Details for row", index)
)

{"x":{"tag":{"name":"Reactable","attribs":{"data":{"Sepal.Length":[5.1,4.9,4.7,4.6,5,5.4,4.6,5,4.4,4.9,5.4,4.8,4.8,4.3,5.8,5.7,5.4,5.1,5.7,5.1,5.4,5.1,4.6,5.1,4.8,5,5,5.2,5.2,4.7],"Sepal.Width":[3.5,3,3.2,3.1,3.6,3.9,3.4,3.4,2.9,3.1,3.7,3.4,3,3,4,4.4,3.9,3.5,3.8,3.8,3.4,3.7,3.6,3.3,3.4,3,3.4,3.5,3.4,3.2],"Petal.Length":[1.4,1.4,1.3,1.5,1.4,1.7,1.4,1.5,1.4,1.5,1.5,1.6,1.4,1.1,1.2,1.5,1.3,1.4,1.7,1.5,1.7,1.5,1,1.7,1.9,1.6,1.6,1.5,1.4,1.6],"Petal.Width":[0.2,0.2,0.2,0.2,0.2,0.4,0.3,0.2,0.2,0.1,0.2,0.2,0.1,0.1,0.2,0.4,0.4,0.3,0.3,0.3,0.2,0.4,0.2,0.5,0.2,0.2,0.4,0.2,0.2,0.2],"Species":["setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa"]},"columns":[{"id":".details","name":"","type":null,"sortable":false,"resizable":false,"filterable":false,"searchable":false,"width":45,"align":"center","details":["Details for row 1","Details for row 2","Details for row 3","Details for row 4","Details for row 5","Details for row 6","Details for row 7","Details for row 8","Details for row 9","Details for row 10","Details for row 11","Details for row 12","Details for row 13","Details for row 14","Details for row 15","Details for row 16","Details for row 17","Details for row 18","Details for row 19","Details for row 20","Details for row 21","Details for row 22","Details for row 23","Details for row 24","Details for row 25","Details for row 26","Details for row 27","Details for row 28","Details for row 29","Details for row 30"]},{"id":"Sepal.Length","name":"Sepal.Length","type":"numeric"},{"id":"Sepal.Width","name":"Sepal.Width","type":"numeric"},{"id":"Petal.Length","name":"Petal.Length","type":"numeric"},{"id":"Petal.Width","name":"Petal.Width","type":"numeric"},{"id":"Species","name":"Species","type":"factor"}],"filterable":true,"showPageSizeOptions":true,"highlight":true,"striped":true,"theme":{"color":"hsl(233, 9%, 87%)","backgroundColor":"hsl(233, 9%, 19%)","borderColor":"hsl(233, 9%, 22%)","stripedColor":"hsl(233, 12%, 22%)","highlightColor":"hsl(233, 12%, 24%)","inputStyle":{"backgroundColor":"hsl(233, 9%, 25%)"},"selectStyle":{"backgroundColor":"hsl(233, 9%, 25%)"},"pageButtonHoverStyle":{"backgroundColor":"hsl(233, 9%, 25%)"},"pageButtonActiveStyle":{"backgroundColor":"hsl(233, 9%, 28%)"}},"language":{"searchPlaceholder":"Search...","noData":"No entries found","pageInfo":"{rowStart} to {rowEnd} of {rows} entries"},"dataKey":"215f06472414aac806a6848dff55b08b"},"children":[]},"class":"reactR_markup"},"evals":[],"jsHooks":[]}
# Use nested selectors to highlight headers when sorting
reactable(
  iris[1:30, ],
  columns = list(Sepal.Length = colDef(sortable = FALSE)),
  showSortable = TRUE,
  theme = reactableTheme(
    headerStyle = list(
      "&:hover[aria-sort]" = list(background = "hsl(0, 0%, 96%)"),
      "&[aria-sort='ascending'], &[aria-sort='descending']" = list(background = "hsl(0, 0%, 96%)"),
      borderColor = "#555"
    )
  )
)

{"x":{"tag":{"name":"Reactable","attribs":{"data":{"Sepal.Length":[5.1,4.9,4.7,4.6,5,5.4,4.6,5,4.4,4.9,5.4,4.8,4.8,4.3,5.8,5.7,5.4,5.1,5.7,5.1,5.4,5.1,4.6,5.1,4.8,5,5,5.2,5.2,4.7],"Sepal.Width":[3.5,3,3.2,3.1,3.6,3.9,3.4,3.4,2.9,3.1,3.7,3.4,3,3,4,4.4,3.9,3.5,3.8,3.8,3.4,3.7,3.6,3.3,3.4,3,3.4,3.5,3.4,3.2],"Petal.Length":[1.4,1.4,1.3,1.5,1.4,1.7,1.4,1.5,1.4,1.5,1.5,1.6,1.4,1.1,1.2,1.5,1.3,1.4,1.7,1.5,1.7,1.5,1,1.7,1.9,1.6,1.6,1.5,1.4,1.6],"Petal.Width":[0.2,0.2,0.2,0.2,0.2,0.4,0.3,0.2,0.2,0.1,0.2,0.2,0.1,0.1,0.2,0.4,0.4,0.3,0.3,0.3,0.2,0.4,0.2,0.5,0.2,0.2,0.4,0.2,0.2,0.2],"Species":["setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa"]},"columns":[{"id":"Sepal.Length","name":"Sepal.Length","type":"numeric","sortable":false},{"id":"Sepal.Width","name":"Sepal.Width","type":"numeric"},{"id":"Petal.Length","name":"Petal.Length","type":"numeric"},{"id":"Petal.Width","name":"Petal.Width","type":"numeric"},{"id":"Species","name":"Species","type":"factor"}],"showSortable":true,"theme":{"headerStyle":{"&:hover[aria-sort]":{"background":"hsl(0, 0%, 96%)"},"&[aria-sort='ascending'], &[aria-sort='descending']":{"background":"hsl(0, 0%, 96%)"},"borderColor":"#555"}},"language":{"searchPlaceholder":"Search...","noData":"No entries found","pageInfo":"{rowStart} to {rowEnd} of {rows} entries"},"dataKey":"7d85d50be98979cc02d097de40c244b6"},"children":[]},"class":"reactR_markup"},"evals":[],"jsHooks":[]}
```
