# Language options

Use `reactableLang()` to customize the language strings in a table.
Language strings include both visible text and accessible labels that
can be read by assistive technology, such as screen readers.

To set the default language strings for all tables, use the global
`reactable.language` option.

## Usage

``` r
reactableLang(
  sortLabel = "Sort {name}",
  filterPlaceholder = "",
  filterLabel = "Filter {name}",
  searchPlaceholder = "Search",
  searchLabel = "Search",
  noData = "No rows found",
  pageNext = "Next",
  pagePrevious = "Previous",
  pageNumbers = "{page} of {pages}",
  pageInfo = "{rowStart}\u2013{rowEnd} of {rows} rows",
  pageSizeOptions = "Show {rows}",
  pageNextLabel = "Next page",
  pagePreviousLabel = "Previous page",
  pageNumberLabel = "Page {page}",
  pageJumpLabel = "Go to page",
  pageSizeOptionsLabel = "Rows per page",
  groupExpandLabel = "Toggle group",
  detailsExpandLabel = "Toggle details",
  selectAllRowsLabel = "Select all rows",
  selectAllSubRowsLabel = "Select all rows in group",
  selectRowLabel = "Select row",
  defaultGroupHeader = NULL,
  detailsCollapseLabel = NULL,
  deselectAllRowsLabel = NULL,
  deselectAllSubRowsLabel = NULL,
  deselectRowLabel = NULL
)
```

## Arguments

- sortLabel:

  Accessible label for column sort buttons. Takes a `{name}` parameter
  for the column name.

- filterPlaceholder:

  Placeholder for column filter inputs.

- filterLabel:

  Accessible label for column filter inputs. Takes a `{name}` parameter
  for the column name.

- searchPlaceholder:

  Placeholder for the table search input.

- searchLabel:

  Accessible label for the table search input.

- noData:

  Placeholder text when the table has no data.

- pageNext:

  Text for the next page button.

- pagePrevious:

  Text for the previous page button.

- pageNumbers:

  Text for the page numbers info. Only used with the `"jump"` and
  `"simple"` pagination types. Takes the following parameters:

  - `{page}` for the current page

  - `{pages}` for the total number of pages

- pageInfo:

  Text for the page info. Takes the following parameters:

  - `{rowStart}` for the starting row of the page

  - `{rowEnd}` for the ending row of the page

  - `{rows}` for the total number of rows

- pageSizeOptions:

  Text for the page size options input. Takes a `{rows}` parameter for
  the page size options input.

- pageNextLabel:

  Accessible label for the next page button.

- pagePreviousLabel:

  Accessible label for the previous page button.

- pageNumberLabel:

  Accessible label for the page number buttons. Only used with the the
  `"numbers"` pagination type. Takes a `{page}` parameter for the page
  number.

- pageJumpLabel:

  Accessible label for the page jump input. Only used with the `"jump"`
  pagination type.

- pageSizeOptionsLabel:

  Accessible label for the page size options input.

- groupExpandLabel:

  Accessible label for the row group expand button.

- detailsExpandLabel:

  Accessible label for the row details expand button.

- selectAllRowsLabel:

  Accessible label for the select all rows checkbox.

- selectAllSubRowsLabel:

  Accessible label for the select all sub rows checkbox.

- selectRowLabel:

  Accessible label for the select row checkbox.

- defaultGroupHeader:

  Deprecated and no longer used.

- detailsCollapseLabel:

  Deprecated and no longer used.

- deselectAllRowsLabel:

  Deprecated and no longer used.

- deselectAllSubRowsLabel:

  Deprecated and no longer used.

- deselectRowLabel:

  Deprecated and no longer used.

## Value

A language options object that can be used to customize the language
strings in [`reactable()`](reactable.md).

## Examples

``` r
reactable(
  iris[1:30, ],
  searchable = TRUE,
  paginationType = "simple",
  language = reactableLang(
    searchPlaceholder = "Search...",
    noData = "No entries found",
    pageInfo = "{rowStart}\u2013{rowEnd} of {rows} entries",
    pagePrevious = "\u276e",
    pageNext = "\u276f",

    # Accessible labels for assistive technology, such as screen readers
    pagePreviousLabel = "Previous page",
    pageNextLabel = "Next page"
  )
)

{"x":{"tag":{"name":"Reactable","attribs":{"data":{"Sepal.Length":[5.1,4.9,4.7,4.6,5,5.4,4.6,5,4.4,4.9,5.4,4.8,4.8,4.3,5.8,5.7,5.4,5.1,5.7,5.1,5.4,5.1,4.6,5.1,4.8,5,5,5.2,5.2,4.7],"Sepal.Width":[3.5,3,3.2,3.1,3.6,3.9,3.4,3.4,2.9,3.1,3.7,3.4,3,3,4,4.4,3.9,3.5,3.8,3.8,3.4,3.7,3.6,3.3,3.4,3,3.4,3.5,3.4,3.2],"Petal.Length":[1.4,1.4,1.3,1.5,1.4,1.7,1.4,1.5,1.4,1.5,1.5,1.6,1.4,1.1,1.2,1.5,1.3,1.4,1.7,1.5,1.7,1.5,1,1.7,1.9,1.6,1.6,1.5,1.4,1.6],"Petal.Width":[0.2,0.2,0.2,0.2,0.2,0.4,0.3,0.2,0.2,0.1,0.2,0.2,0.1,0.1,0.2,0.4,0.4,0.3,0.3,0.3,0.2,0.4,0.2,0.5,0.2,0.2,0.4,0.2,0.2,0.2],"Species":["setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa"]},"columns":[{"id":"Sepal.Length","name":"Sepal.Length","type":"numeric"},{"id":"Sepal.Width","name":"Sepal.Width","type":"numeric"},{"id":"Petal.Length","name":"Petal.Length","type":"numeric"},{"id":"Petal.Width","name":"Petal.Width","type":"numeric"},{"id":"Species","name":"Species","type":"factor"}],"searchable":true,"paginationType":"simple","language":{"searchPlaceholder":"Search...","noData":"No entries found","pageNext":"❯","pagePrevious":"❮","pageInfo":"{rowStart}–{rowEnd} of {rows} entries","pageNextLabel":"Next page","pagePreviousLabel":"Previous page"},"dataKey":"bd109cf9c811c9b2f740e27c20610745"},"children":[]},"class":"reactR_markup"},"evals":[],"jsHooks":[]}
# Set the default language for all tables
options(reactable.language = reactableLang(
  searchPlaceholder = "Search...",
  noData = "No entries found",
  pageInfo = "{rowStart} to {rowEnd} of {rows} entries"
))

reactable(iris[1:30, ], searchable = TRUE)

{"x":{"tag":{"name":"Reactable","attribs":{"data":{"Sepal.Length":[5.1,4.9,4.7,4.6,5,5.4,4.6,5,4.4,4.9,5.4,4.8,4.8,4.3,5.8,5.7,5.4,5.1,5.7,5.1,5.4,5.1,4.6,5.1,4.8,5,5,5.2,5.2,4.7],"Sepal.Width":[3.5,3,3.2,3.1,3.6,3.9,3.4,3.4,2.9,3.1,3.7,3.4,3,3,4,4.4,3.9,3.5,3.8,3.8,3.4,3.7,3.6,3.3,3.4,3,3.4,3.5,3.4,3.2],"Petal.Length":[1.4,1.4,1.3,1.5,1.4,1.7,1.4,1.5,1.4,1.5,1.5,1.6,1.4,1.1,1.2,1.5,1.3,1.4,1.7,1.5,1.7,1.5,1,1.7,1.9,1.6,1.6,1.5,1.4,1.6],"Petal.Width":[0.2,0.2,0.2,0.2,0.2,0.4,0.3,0.2,0.2,0.1,0.2,0.2,0.1,0.1,0.2,0.4,0.4,0.3,0.3,0.3,0.2,0.4,0.2,0.5,0.2,0.2,0.4,0.2,0.2,0.2],"Species":["setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa","setosa"]},"columns":[{"id":"Sepal.Length","name":"Sepal.Length","type":"numeric"},{"id":"Sepal.Width","name":"Sepal.Width","type":"numeric"},{"id":"Petal.Length","name":"Petal.Length","type":"numeric"},{"id":"Petal.Width","name":"Petal.Width","type":"numeric"},{"id":"Species","name":"Species","type":"factor"}],"searchable":true,"language":{"searchPlaceholder":"Search...","noData":"No entries found","pageInfo":"{rowStart} to {rowEnd} of {rows} entries"},"dataKey":"bd109cf9c811c9b2f740e27c20610745"},"children":[]},"class":"reactR_markup"},"evals":[],"jsHooks":[]}
```
