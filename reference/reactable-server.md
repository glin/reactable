# Create custom server-side data backends for Shiny

Custom server-side data backends are created using the [S3 object
system](https://adv-r.hadley.nz/s3.html).

To create a custom server-side data backend, provide an S3 object to the
`server` argument in [`reactable()`](reactable.md) with the following S3
methods defined:

- `reactableServerInit` initializes the server backend (optional).

- `reactableServerData` handles requests for data and should return a
  [`resolvedData()`](resolvedData.md) object.

Custom backend methods do not have to accept every argument, and can
choose not to implement certain features such as grouping, row
expansion, or row selection.

If there is no server-side implementation for row expansion and row
selection, reactable will fall back to client-side row expansion and
selection. This means row expansion and selection will only work for
rows on the current page, so for example, selecting all rows in the
table will only select rows on the current page.

Custom backend methods should accept additional arguments via `...` in
case new arguments are added in the future.

## Usage

``` r
reactableServerInit(
  x,
  data = NULL,
  columns = NULL,
  pageIndex = 0,
  pageSize = 0,
  sortBy = NULL,
  filters = NULL,
  searchValue = NULL,
  searchMethod = NULL,
  groupBy = NULL,
  pagination = NULL,
  paginateSubRows = NULL,
  selectedRowIds = NULL,
  expanded = NULL,
  ...
)

reactableServerData(
  x,
  data = NULL,
  columns = NULL,
  pageIndex = 0,
  pageSize = 0,
  sortBy = NULL,
  filters = NULL,
  searchValue = NULL,
  searchMethod = NULL,
  groupBy = NULL,
  pagination = NULL,
  paginateSubRows = NULL,
  selectedRowIds = NULL,
  expanded = NULL,
  ...
)
```

## Arguments

- x:

  The server backend.

- data:

  The original table data. A data frame.

- columns:

  Table columns. A list of [`colDef()`](colDef.md) objects.

- pageIndex:

  The current page index. Starts at zero.

- pageSize:

  The current page size.

- sortBy:

  The current sorted columns. `NULL` if empty.

- filters:

  The current column filters. `NULL` if empty.

- searchValue:

  The current global search value. `NULL` if empty.

- searchMethod:

  The custom search method. A
  [`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) function.

- groupBy:

  The current grouped columns. `NULL` if empty.

- pagination:

  Whether pagination is enabled, `TRUE` or `FALSE`.

- paginateSubRows:

  Whether sub rows are paginated, `TRUE` or `FALSE`.

- selectedRowIds:

  The current selected rows.

- expanded:

  The current expanded rows.

- ...:

  Additional arguments passed to the S3 method.

## Value

- `reactableServerData()` should return a
  [`resolvedData()`](resolvedData.md) object.

- `reactableServerData()` should not return any value.
