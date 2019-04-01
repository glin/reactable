# reactable

[![Build Status](https://travis-ci.com/glin/reactable.svg?branch=master)](https://travis-ci.com/glin/reactable)

R interface to the [React Table](https://github.com/tannerlinsley/react-table) library,
made with [reactR](https://github.com/react-R/reactR).

## Installation

```r
# install.packages("devtools")
devtools::install_github("glin/reactable")
```

## Examples

- [Filtering](https://glin.github.io/reactable/inst/examples/filtering.html)
```r
reactable(iris, filterable = TRUE)
```

- [Pivoting](https://glin.github.io/reactable/inst/examples/pivoting.html)
```r
reactable(
  iris,
  pivotBy = "Species",
  columns = list(
    Sepal.Width = list(aggregate = "mean"),
    Petal.Length = list(aggregate = "sum"),
    Petal.Width = list(aggregate = "count")
  )
)
```

## Usage
```r
reactable(
  data,                # Data frame or matrix
  rownames = TRUE,     # Show row names?
  colnames = NULL,     # Optional named list of column names
  sortable = TRUE,     # Enable sorting?
  resizable = TRUE,    # Enable column resizing?
  filterable = FALSE,  # Enable column filtering?
  pageSize = 20,       # Default page size
  minRows = 1,         # Minimum number of rows to show
  striped = TRUE,      # Zebra-stripe rows?
  highlight = TRUE,    # Highlight rows on hover?
  pivotBy = NULL,      # Optional vector of column names to pivot by
  columns = NULL       # Optional named list of column definitions
)
```
