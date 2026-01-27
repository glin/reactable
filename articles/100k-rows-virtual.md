# 100k Rows (Virtualized)

This example demonstrates virtual scrolling with 100,000 rows. Virtual
scrolling renders only the visible rows on screen, allowing you to
scroll through large tables without performance issues. For an
alternative using pagination instead of virtual scrolling, see [100k
Rows](100k-rows.md).

``` r
library(reactable)

rows <- 100000
dates <- seq.Date(as.Date("2018-01-01"), as.Date("2018-12-01"), "day")
data <- data.frame(
  index = seq_len(rows),
  date = sample(dates, rows, replace = TRUE),
  city = sample(names(precip), rows, replace = TRUE),
  state = sample(rownames(USArrests), rows, replace = TRUE),
  temp = round(runif(rows, 0, 100), 1),
  stringsAsFactors = FALSE
)

reactable(
  data,
  pagination = FALSE,
  virtual = TRUE,
  height = 600,
  filterable = TRUE,
  searchable = TRUE,
  highlight = TRUE,
  showPagination = TRUE,
  columns = list(
    state = colDef(
      html = TRUE,
      cell = JS('function(cell) {
        return `<a href="https://wikipedia.org/wiki/${cell.value}">${cell.value}</a>`
      }')
    )
  ),
  details = colDef(
    html = TRUE,
    details = JS("function(rowInfo) {
      return `Details for row: ${rowInfo.index}` +
        `<pre>${JSON.stringify(rowInfo.values, null, 2)}</pre>`
    }")
  )
)
```

index

date

city

state

temp

1–100000 of 100000 rows

Previous

1

Next
