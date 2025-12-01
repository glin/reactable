# The result from handling a server-side data request

The result from handling a server-side data request

## Usage

``` r
resolvedData(data, rowCount = NULL, maxRowCount = NULL)
```

## Arguments

- data:

  The current page of data. A data frame.

- rowCount:

  The row count of the current page.

- maxRowCount:

  The maximum row count. Optional. Used to determine whether the
  pagination bar should be kept visible when filtering or searching
  reduces the current rows to one page, or when expanding rows (when
  paginateSubRows is `TRUE`) would expand the table beyond one page.

## See also

[`reactableServerInit()`](reactable-server.md) and
[`reactableServerData()`](reactable-server.md) for creating custom
server-side data backends.
