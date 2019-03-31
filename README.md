# reactable

R interface to the [React Table](https://github.com/tannerlinsley/react-table) library,
made with [reactR](https://github.com/react-R/reactR).

## Installation

```r
# install.packages("devtools")
devtools::install_github("glin/reactable")
```

## Examples

### Filtering
```r
reactable(iris, filterable = TRUE)
```

### Pivoting
```r
reactable(iris, pivotBy = "Species")
```

## Usage
```r
reactable(
  data,                # Data frame or matrix
  rownames = TRUE,     # Show row names?
  pivotBy = NULL,      # Vector of column names to pivot by
  sortable = TRUE,     # Enable sorting?
  resizable = TRUE,    # Enable column resizing?
  filterable = FALSE,  # Enable column filtering?
  pageSize = 20,       # Default page size
  minRows = 1,         # Minimum number of rows
  striped = TRUE,      # Zebra-stripe rows?
  highlight = TRUE     # Highlight rows on hover?
)
```
