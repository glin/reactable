# 100k Rows

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
  filterable = TRUE,
  searchable = TRUE,
  minRows = 10,
  highlight = TRUE,
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

​

​

1

2018-11-18

Atlantic City

[Delaware](https://wikipedia.org/wiki/Delaware)

75.1

​

​

2

2018-07-04

Peoria

[Texas](https://wikipedia.org/wiki/Texas)

25.8

​

​

3

2018-07-26

Houston

[New Mexico](https://wikipedia.org/wiki/New%20Mexico)

28.7

​

​

4

2018-07-22

Oklahoma City

[Montana](https://wikipedia.org/wiki/Montana)

67.6

​

​

5

2018-10-24

Bismark

[New Mexico](https://wikipedia.org/wiki/New%20Mexico)

52.9

​

​

6

2018-08-01

Richmond

[Iowa](https://wikipedia.org/wiki/Iowa)

2.5

​

​

7

2018-08-10

El Paso

[South Carolina](https://wikipedia.org/wiki/South%20Carolina)

12.8

​

​

8

2018-03-12

Columbia

[New Hampshire](https://wikipedia.org/wiki/New%20Hampshire)

18.1

​

​

9

2018-10-21

Minneapolis/St Paul

[Alabama](https://wikipedia.org/wiki/Alabama)

81.7

​

​

10

2018-11-10

Wilmington

[Oklahoma](https://wikipedia.org/wiki/Oklahoma)

40.3

1–10 of 100000 rows

Previous

1

2

3

4

5

...

10000

Next
