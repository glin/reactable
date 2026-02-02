# Examples

## Basic Usage

To create a data table, use [`reactable()`](../reference/reactable.md)
on a data frame or matrix. The table will be sortable and paginated by
default:

``` r
library(reactable)

reactable(iris)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

5.4

3.9

1.7

0.4

setosa

4.6

3.4

1.4

0.3

setosa

5

3.4

1.5

0.2

setosa

4.4

2.9

1.4

0.2

setosa

4.9

3.1

1.5

0.1

setosa

1–10 of 150 rows

Previous

1

2

3

4

5

...

15

Next

### Column definitions

Columns can be customized by providing a named list of column
definitions created by [`colDef()`](../reference/colDef.md) to
`columns`:

``` r
reactable(
  iris[1:5, ],
  columns = list(
    Sepal.Length = colDef(name = "Sepal Length"),
    Sepal.Width = colDef(name = "Sepal Width"),
    Species = colDef(align = "center")
  )
)
```

Sepal Length

Sepal Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

For convenience, you can also specify a default
[`colDef()`](../reference/colDef.md) to use for all columns in
`defaultColDef`:

``` r
reactable(
  iris[1:5, ],
  defaultColDef = colDef(
    header = function(value) gsub(".", " ", value, fixed = TRUE),
    cell = function(value) format(value, nsmall = 1),
    align = "center",
    minWidth = 70,
    headerStyle = list(background = "#f7f7f8")
  ),
  columns = list(
    Species = colDef(minWidth = 140)  # overrides the default
  ),
  bordered = TRUE,
  highlight = TRUE
)
```

Sepal Length

Sepal Width

Petal Length

Petal Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3.0

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5.0

3.6

1.4

0.2

setosa

## Sorting

Tables are sortable by default. You can sort a column by clicking on its
header, or sort multiple columns by holding the shift key while sorting.

Sorting toggles between ascending and descending order by default. To
clear the sort, hold the shift key while sorting, and the sorting will
additionally toggle between ascending, descending, and unsorted order.

**Note:** Ascending order means the lowest, first, or earliest values
will appear first. Descending order means the largest, last, or latest
values will appear first.

### Default sorted columns

You can set the default sorted columns by providing a vector of column
names to `defaultSorted`:

``` r
reactable(iris[48:52, ], defaultSorted = c("Species", "Petal.Length"))
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

4.6

3.2

1.4

0.2

setosa

5

3.3

1.4

0.2

setosa

5.3

3.7

1.5

0.2

setosa

6.4

3.2

4.5

1.5

versicolor

7

3.2

4.7

1.4

versicolor

You can also provide a named list to customize the default sort orders.
Use `"asc"` for ascending order, or `"desc"` for descending order:

``` r
reactable(iris[48:52, ], defaultSorted = list(Species = "asc", Petal.Length = "desc"))
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.3

3.7

1.5

0.2

setosa

4.6

3.2

1.4

0.2

setosa

5

3.3

1.4

0.2

setosa

7

3.2

4.7

1.4

versicolor

6.4

3.2

4.5

1.5

versicolor

### Default sort order

Columns are sorted in ascending order first by default. To change the
default sort order for all columns in the table, set `defaultSortOrder`
in [`reactable()`](../reference/reactable.md) to `"asc"` for ascending
order, or `"desc"` for descending order.

To change the sort order of an individual column, set `defaultSortOrder`
in its [`colDef()`](../reference/colDef.md) to `"asc"` or `"desc"`. The
default sort order of the column takes precedence over the table.

``` r
reactable(
  iris[48:52, ],
  defaultSortOrder = "desc",
  columns = list(
    Species = colDef(defaultSortOrder = "asc")
  ),
  defaultSorted = c("Species", "Petal.Length")
)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.3

3.7

1.5

0.2

setosa

4.6

3.2

1.4

0.2

setosa

5

3.3

1.4

0.2

setosa

7

3.2

4.7

1.4

versicolor

6.4

3.2

4.5

1.5

versicolor

### Sort missing values last

You can ignore missing values when sorting by setting `sortNALast` on a
column:

``` r
reactable(
  data.frame(
    n = c(1, 2, 3, -Inf, Inf),
    x = c(2, 3, 1, NA, NaN),
    y = c("aa", "cc", "bb", NA, NA)
  ),
  defaultColDef = colDef(sortNALast = TRUE),
  defaultSorted = "x"
)
```

n

x

y

3

1

bb

1

2

aa

2

3

cc

-Infinity

​

​

Infinity

​

​

### No sorting

You can disable sorting by setting `sortable` to `FALSE` on the table or
column. When only some columns are sortable, it can help to indicate
sortable columns using `showSortable`:

``` r
reactable(
  iris[1:5, ],
  sortable = FALSE,
  showSortable = TRUE,
  columns = list(
    Petal.Width = colDef(sortable = TRUE),
    Petal.Length = colDef(sortable = TRUE)
  )
)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

### Hide sort icons

You can hide sort icons by setting `showSortIcon` to `FALSE`. This is
only recommended when you want to use a [custom sort
indicator](cookbook/cookbook.html#custom-sort-indicators).

``` r
reactable(iris[1:5, ], showSortIcon = FALSE)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

## Filtering

You can make columns filterable by setting `filterable = TRUE` in
[`reactable()`](../reference/reactable.md):

``` r
data <- MASS::Cars93[1:20, c("Manufacturer", "Model", "Type", "AirBags", "Price")]

reactable(data, filterable = TRUE, minRows = 10)
```

Manufacturer

Model

Type

AirBags

Price

Acura

Integra

Small

None

15.9

Acura

Legend

Midsize

Driver & Passenger

33.9

Audi

90

Compact

Driver only

29.1

Audi

100

Midsize

Driver & Passenger

37.7

BMW

535i

Midsize

Driver only

30

Buick

Century

Midsize

Driver only

15.7

Buick

LeSabre

Large

Driver only

20.8

Buick

Roadmaster

Large

Driver only

23.7

Buick

Riviera

Midsize

Driver only

26.3

Cadillac

DeVille

Large

Driver only

34.7

1–10 of 20 rows

Previous

1

2

Next

To make specific columns filterable (or not), set `filterable` to `TRUE`
or `FALSE` in [`colDef()`](../reference/colDef.md):

``` r
reactable(
  data,
  filterable = TRUE,
  columns = list(
    Price = colDef(filterable = FALSE)
  ),
  defaultPageSize = 5
)
```

Manufacturer

Model

Type

AirBags

Price

Acura

Integra

Small

None

15.9

Acura

Legend

Midsize

Driver & Passenger

33.9

Audi

90

Compact

Driver only

29.1

Audi

100

Midsize

Driver & Passenger

37.7

BMW

535i

Midsize

Driver only

30

1–5 of 20 rows

Previous

1

2

3

4

Next

### Custom filtering

Column filtering can be customized using the `filterMethod` and
`filterInput` arguments in [`colDef()`](../reference/colDef.md). See the
[Custom Filtering](custom-filtering.md) guide for more details and
examples.

This example shows basic usage of a custom filter method, changing
filtering on the `Manufacturer` column to be case-sensitive rather than
case-insensitive. (Try filtering for “bmw” and then “BMW”).

``` r
data <- MASS::Cars93[, c("Manufacturer", "Model", "Type", "Price")]

reactable(
  data,
  columns = list(
    Manufacturer = colDef(
      filterable = TRUE,
      # Filter by case-sensitive text match
      filterMethod = JS("function(rows, columnId, filterValue) {
        return rows.filter(function(row) {
          return row.values[columnId].indexOf(filterValue) !== -1
        })
      }")
    )
  ),
  defaultPageSize = 5
)
```

Manufacturer

Model

Type

Price

Acura

Integra

Small

15.9

Acura

Legend

Midsize

33.9

Audi

90

Compact

29.1

Audi

100

Midsize

37.7

BMW

535i

Midsize

30

1–5 of 93 rows

Previous

1

2

3

4

5

...

19

Next

## Searching

You can make the entire table searchable by setting `searchable = TRUE`
in [`reactable()`](../reference/reactable.md):

``` r
data <- MASS::Cars93[1:20, c("Manufacturer", "Model", "Type", "AirBags", "Price")]

reactable(data, searchable = TRUE, minRows = 10)
```

Manufacturer

Model

Type

AirBags

Price

Acura

Integra

Small

None

15.9

Acura

Legend

Midsize

Driver & Passenger

33.9

Audi

90

Compact

Driver only

29.1

Audi

100

Midsize

Driver & Passenger

37.7

BMW

535i

Midsize

Driver only

30

Buick

Century

Midsize

Driver only

15.7

Buick

LeSabre

Large

Driver only

20.8

Buick

Roadmaster

Large

Driver only

23.7

Buick

Riviera

Midsize

Driver only

26.3

Cadillac

DeVille

Large

Driver only

34.7

1–10 of 20 rows

Previous

1

2

Next

### Custom searching

The table search method can be customized using the `searchMethod`
argument in [`reactable()`](../reference/reactable.md). See the [Custom
Filtering](custom-filtering.md) guide for details and examples.

## Pagination

You can change the default page size by configuring `defaultPageSize`:

``` r
reactable(iris[1:6, ], defaultPageSize = 4)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

1–4 of 6 rows

Previous

1

2

Next

You can also set the minimum rows per page using `minRows`. This may be
useful when rows don’t completely fill the page, or if the table has
filtering:

``` r
reactable(iris[1:6, ], defaultPageSize = 4, minRows = 4, searchable = TRUE)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

1–4 of 6 rows

Previous

1

2

Next

### Page size options

You can show a dropdown of page sizes for users to choose from using
`showPageSizeOptions`. The page size options can be customized through
`pageSizeOptions`:

``` r
reactable(
  iris[1:12, ],
  showPageSizeOptions = TRUE,
  pageSizeOptions = c(4, 8, 12),
  defaultPageSize = 4
)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

1–4 of 12 rows

Show 4 8 12

Previous

1

2

3

Next

### Alternative pagination types

You can use an alternative pagination type by setting `paginationType`
to:

- `"jump"` to show a page jump
- `"simple"` to show previous/next buttons only

#### Page jump

``` r
reactable(iris[1:50, ], paginationType = "jump", defaultPageSize = 4)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

1–4 of 50 rows

Previous

of 13

Next

#### Simple

``` r
reactable(iris[1:50, ], paginationType = "simple", defaultPageSize = 4)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

1–4 of 50 rows

Previous

1 of 13

Next

### Hide page info

You can hide page info by setting `showPageInfo` to `FALSE`:

``` r
reactable(iris[1:12, ], showPageInfo = FALSE, defaultPageSize = 4)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

Previous

1

2

3

Next

``` r
reactable(iris[1:12, ], showPageInfo = FALSE, showPageSizeOptions = TRUE, defaultPageSize = 4)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

Show 10 25 50 100

Previous

1

2

3

Next

### Always show pagination

By default, pagination is hidden if the table only has one page. To keep
the pagination shown, set `showPagination` to `TRUE`. This is especially
useful if you want to keep the page info showing the number of rows in
the table.

``` r
reactable(iris[1:5, ], showPagination = TRUE)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

1–5 of 5 rows

Previous

1

Next

### No pagination

Tables are paginated by default, but you can disable pagination by
setting `pagination = FALSE`:

``` r
reactable(iris[1:20, ], pagination = FALSE, highlight = TRUE, height = 250)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

5.4

3.9

1.7

0.4

setosa

4.6

3.4

1.4

0.3

setosa

5

3.4

1.5

0.2

setosa

4.4

2.9

1.4

0.2

setosa

4.9

3.1

1.5

0.1

setosa

5.4

3.7

1.5

0.2

setosa

4.8

3.4

1.6

0.2

setosa

4.8

3

1.4

0.1

setosa

4.3

3

1.1

0.1

setosa

5.8

4

1.2

0.2

setosa

5.7

4.4

1.5

0.4

setosa

5.4

3.9

1.3

0.4

setosa

5.1

3.5

1.4

0.3

setosa

5.7

3.8

1.7

0.3

setosa

5.1

3.8

1.5

0.3

setosa

If you want to keep the row count and pagination controls visible even
when pagination is disabled, set `showPagination = TRUE`:

``` r
reactable(iris[1:20, ], pagination = FALSE, showPagination = TRUE, highlight = TRUE, height = 250)
```

**Tip:** Disabling pagination is not recommended for large tables with
many interactive elements (such as links, expand buttons, or selection
checkboxes), as that can make it difficult for keyboard users to
navigate the page.

## Virtual Scrolling

Virtual scrolling renders only the visible rows on screen, allowing you
to scroll through large tables without performance issues. To enable it,
set `virtual = TRUE` with a fixed height (using the `height` argument or
a sized parent container).

Virtual scrolling works with or without pagination, but is most useful
when pagination is disabled. It can also be combined with expandable row
details and grouped rows.

``` r
set.seed(10)

rows <- 1000
dates <- seq.Date(as.Date("2026-01-01"), as.Date("2026-12-01"), "day")
data <- data.frame(
  index = seq_len(rows),
  date = sample(dates, rows, replace = TRUE),
  city = sample(names(precip), rows, replace = TRUE)
)

reactable(
  data,
  pagination = FALSE,
  virtual = TRUE,
  height = 500,
  showPagination = TRUE,
  searchable = TRUE
)
```

index

date

city

1–1000 of 1000 rows

Previous

1

Next

**Note:** Browser find-in-page (`Ctrl+F` / `Cmd+F`) does not work with
virtualized tables since only visible rows exist in the page. Use the
table’s built-in search or filtering instead.

## Grouping and Aggregation

You can group rows in a table by specifying one or more columns in
`groupBy`:

``` r
data <- MASS::Cars93[10:22, c("Manufacturer", "Model", "Type", "Price", "MPG.city")]

reactable(data, groupBy = "Manufacturer")
```

Manufacturer

Model

Type

Price

MPG.city

​

Cadillac (2)

​

Chevrolet (8)

​

Chrylser (1)

​

Chrysler (2)

When rows are grouped, you can aggregate data in a column using an
`aggregate` function:

``` r
data <- MASS::Cars93[14:38, c("Type", "Price", "MPG.city", "DriveTrain", "Man.trans.avail")]

reactable(
  data,
  groupBy = "Type",
  columns = list(
    Price = colDef(aggregate = "max"),
    MPG.city = colDef(aggregate = "mean", format = colFormat(digits = 1)),
    DriveTrain = colDef(aggregate = "unique"),
    Man.trans.avail = colDef(aggregate = "frequency")
  )
)
```

Type

Price

MPG.city

DriveTrain

Man.trans.avail

​

Sporty (5)

38

20.0

Rear, 4WD, Front

Yes (5)

​

Midsize (3)

20.2

21.0

Front

No (3)

​

Van (4)

19.9

16.3

Front, 4WD

No (3), Yes

​

Large (5)

29.5

19.0

Rear, Front

No (5)

​

Compact (3)

15.8

22.3

Front

No, Yes (2)

​

Small (5)

12.2

27.0

Front

Yes (5)

You can use one of the built-in aggregate functions:

``` r
colDef(aggregate = "sum")        # Sum of numbers
colDef(aggregate = "mean")       # Mean of numbers
colDef(aggregate = "max")        # Maximum of numbers
colDef(aggregate = "min")        # Minimum of numbers
colDef(aggregate = "median")     # Median of numbers
colDef(aggregate = "count")      # Count of values
colDef(aggregate = "unique")     # Comma-separated list of unique values
colDef(aggregate = "frequency")  # Comma-separated counts of unique values
```

Or a custom aggregate function in JavaScript:

``` r
colDef(
  aggregate = JS("
    function(values, rows) {
      // input:
      //  - values: an array of all values in the group
      //  - rows: an array of row data values for all rows in the group (optional)
      //
      // output:
      //  - an aggregated value, e.g. a comma-separated list
      return values.join(', ')
    }
  ")
)
```

### Multiple groups

``` r
data <- data.frame(
  State = state.name,
  Region = state.region,
  Division = state.division,
  Area = state.area
)

reactable(
  data,
  groupBy = c("Region", "Division"),
  columns = list(
    Division = colDef(aggregate = "unique"),
    Area = colDef(aggregate = "sum", format = colFormat(separators = TRUE))
  ),
  bordered = TRUE
)
```

Region

Division

State

Area

​

South (3)

East South Central, West South Central, South Atlantic

899,556

​

West (2)

Pacific, Mountain

1,783,960

​

Northeast (2)

New England, Middle Atlantic

169,353

​

North Central (2)

East North Central, West North Central

765,530

### Custom aggregate function

Custom aggregate functions are useful when none of the built-in
aggregate functions apply, or when you want to aggregate values from
multiple columns. For example, when calculating aggregate averages or
percentages.

Within a custom aggregate function, you can access the values in the
column using the `values` argument, and the values in other columns
using the `rows` argument:

``` js
columns = list(
  Price = colDef(
    aggregate = JS("function(values, rows) {
      values
      // [46.8, 27.6, 57]

      rows
      // [
      //   { "Model": "Dynasty", "Manufacturer": "Dodge", "Price": 46.8, "Units": 2 },
      //   { "Model": "Colt", "Manufacturer": "Dodge", "Price": 27.6, "Units": 5 },
      //   { "Model": "Caravan", "Manufacturer": "Dodge", "Price": 57, "Units": 5 }
      // ]
    }")
  )
)
```

Here’s an example that calculates an aggregate average price by dividing
the the sum of two columns, `Price` and `Units`:

``` r
library(dplyr)

set.seed(10)

data <- sample_n(MASS::Cars93[23:40, ], 30, replace = TRUE) %>%
  mutate(Price = Price * 3, Units = sample(1:5, 30, replace = TRUE)) %>%
  mutate(Avg.Price = Price / Units) %>%
  select(Model, Manufacturer, Price, Units, Avg.Price)

reactable(
  data,
  groupBy = "Manufacturer",
  columns = list(
    Price = colDef(aggregate = "sum", format = colFormat(currency = "USD")),
    Units = colDef(aggregate = "sum"),
    Avg.Price = colDef(
      # Calculate the aggregate Avg.Price as `sum(Price) / sum(Units)`
      aggregate = JS("function(values, rows) {
        let totalPrice = 0
        let totalUnits = 0
        rows.forEach(function(row) {
          totalPrice += row['Price']
          totalUnits += row['Units']
        })
        return totalPrice / totalUnits
      }"),
      format = colFormat(currency = "USD")
    )
  )
)
```

Manufacturer

Model

Price

Units

Avg.Price

​

Ford (13)

\$556.20

29

\$19.18

​

Eagle (7)

\$298.80

22

\$13.58

​

Dodge (5)

\$242.70

14

\$17.34

​

Geo (5)

\$187.50

17

\$11.03

### Include sub rows in pagination

By default, sub rows are excluded from pagination and always shown on
the same page when expanded. To include sub rows in pagination, you can
set `paginateSubRows` to `TRUE`. This is recommended for grouped tables
with a large number of rows where expanded rows may not all fit on one
page.

``` r
data <- MASS::Cars93[, c("Manufacturer", "Model", "Type", "Price", "MPG.city")]

reactable(data, groupBy = "Type", paginateSubRows = TRUE)
```

Type

Manufacturer

Model

Price

MPG.city

​

Small (21)

​

Midsize (22)

​

Compact (16)

​

Large (11)

​

Sporty (14)

​

Van (9)

1–6 of 6 rows

Previous

1

Next

## Column Formatting

You can format data in a column by providing
[`colFormat()`](../reference/colFormat.md) options to the `format`
argument in [`colDef()`](../reference/colDef.md).

The formatters for numbers, dates, times, and currencies are
locale-sensitive and automatically adapt to language preferences of the
user’s browser. This means, for example, that users will see dates
formatted in their own timezone or numbers formatted in their own
locale.

To use a specific locale for data formatting, provide a vector of BCP 47
language tags in the `locales` argument. See a list of [common BCP 47
language
tags](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oe376/6c085406-a698-4e12-9d4d-c3b0ee3dbc4a)
for reference.

**Note:** Column formatters change how data is displayed without
affecting the underlying data. Sorting, filtering, and grouping will
still work on the original data.

``` r
data <- data.frame(
  price_USD = c(123456.56, 132, 5650.12),
  price_INR = c(350, 23208.552, 1773156.4),
  number_FR = c(123456.56, 132, 5650.12),
  temp = c(22, NA, 31),
  percent = c(0.9525556, 0.5, 0.112),
  date = as.Date(c("2019-01-02", "2019-03-15", "2019-09-22"))
)

reactable(data, columns = list(
  price_USD = colDef(format = colFormat(prefix = "$", separators = TRUE, digits = 2)),
  price_INR = colDef(format = colFormat(currency = "INR", separators = TRUE, locales = "hi-IN")),
  number_FR = colDef(format = colFormat(locales = "fr-FR")),
  temp = colDef(format = colFormat(suffix = " °C")),
  percent = colDef(format = colFormat(percent = TRUE, digits = 1)),
  date = colDef(format = colFormat(date = TRUE, locales = "en-GB"))
))
```

price_USD

price_INR

number_FR

temp

percent

date

\$123,456.56

₹350.00

123456.56

22 °C

95.3%

Wed Jan 02 2019

\$132.00

₹23,208.55

132

​

50.0%

Fri Mar 15 2019

\$5,650.12

₹1,773,156.40

5650.12

31 °C

11.2%

Sun Sep 22 2019

### Date formatting

``` r
datetimes <- as.POSIXct(c("2019-01-02 3:22:15", "2019-03-15 09:15:55", "2019-09-22 14:20:00"),
                        tz = "America/New_York")
data <- data.frame(
  datetime = datetimes,
  date = datetimes,
  time = datetimes,
  time_24h = datetimes,
  datetime_pt_BR = datetimes
)

reactable(data, columns = list(
  datetime = colDef(format = colFormat(datetime = TRUE)),
  date = colDef(format = colFormat(date = TRUE)),
  time = colDef(format = colFormat(time = TRUE)),
  time_24h = colDef(format = colFormat(time = TRUE, hour12 = FALSE)),
  datetime_pt_BR = colDef(format = colFormat(datetime = TRUE, locales = "pt-BR"))
))
```

datetime

date

time

time_24h

datetime_pt_BR

Wed Jan 02 2019 08:22:15 GMT+0000 (UTC)

Wed Jan 02 2019

08:22:15 GMT+0000 (UTC)

08:22:15 GMT+0000 (UTC)

Wed Jan 02 2019 08:22:15 GMT+0000 (UTC)

Fri Mar 15 2019 13:15:55 GMT+0000 (UTC)

Fri Mar 15 2019

13:15:55 GMT+0000 (UTC)

13:15:55 GMT+0000 (UTC)

Fri Mar 15 2019 13:15:55 GMT+0000 (UTC)

Sun Sep 22 2019 18:20:00 GMT+0000 (UTC)

Sun Sep 22 2019

18:20:00 GMT+0000 (UTC)

18:20:00 GMT+0000 (UTC)

Sun Sep 22 2019 18:20:00 GMT+0000 (UTC)

### Currency formatting

``` r
data <- data.frame(
  USD = c(12.12, 2141.213, 0.42, 1.55, 34414),
  EUR = c(10.68, 1884.27, 0.37, 1.36, 30284.32),
  INR = c(861.07, 152122.48, 29.84, 110, 2444942.63),
  JPY = c(1280, 226144, 44.36, 164, 3634634.61),
  MAD = c(115.78, 20453.94, 4.01, 15, 328739.73)
)

reactable(data, columns = list(
  USD = colDef(
    format = colFormat(currency = "USD", separators = TRUE, locales = "en-US")
  ),
  EUR = colDef(
    format = colFormat(currency = "EUR", separators = TRUE, locales = "de-DE")
  ),
  INR = colDef(
    format = colFormat(currency = "INR", separators = TRUE, locales = "hi-IN")
  ),
  JPY = colDef(
    format = colFormat(currency = "JPY", separators = TRUE, locales = "ja-JP")
  ),
  MAD = colDef(
    format = colFormat(currency = "MAD", separators = TRUE, locales = "ar-MA")
  )
))
```

USD

EUR

INR

JPY

MAD

\$12.12

€10.68

₹861.07

¥1,280

MAD 115.78

\$2,141.21

€1,884.27

₹152,122.48

¥226,144

MAD 20,453.94

\$0.42

€0.37

₹29.84

¥44

MAD 4.01

\$1.55

€1.36

₹110.00

¥164

MAD 15.00

\$34,414.00

€30,284.32

₹2,444,942.63

¥3,634,635

MAD 328,739.73

### Formatting aggregated cells

Column formatters apply to both standard and aggregated cells by
default. If you want to format aggregated cells separately, provide a
named list of `cell` and `aggregated` options:

``` r
colDef(
  format = list(
    cell = colFormat(...),       # Standard cells
    aggregated = colFormat(...)  # Aggregated cells
  )
)
```

For example, only the aggregated `States` are formatted here:

``` r
data <- data.frame(
  States = state.name,
  Region = state.region,
  Area = state.area
)

reactable(
  data,
  groupBy = "Region",
  columns = list(
    States = colDef(
      aggregate = "count",
      format = list(
        aggregated = colFormat(suffix = " states")
      )
    ),
    Area = colDef(
      aggregate = "sum",
      format = colFormat(suffix = " mi²", separators = TRUE)
    )
  )
)
```

Region

States

Area

​

South (16)

16 states

899,556 mi²

​

West (13)

13 states

1,783,960 mi²

​

Northeast (9)

9 states

169,353 mi²

​

North Central (12)

12 states

765,530 mi²

### Displaying missing values

Missing values are ignored by formatters and shown as empty cells by
default. You can customize their display text by setting `na` on a
column:

``` r
reactable(
  data.frame(
    n = c(1, 2, NA, 4, 5),
    x = c(55, 27, NA, NaN, 19),
    y = c(1, NA, 0.25, 0.55, NA)
  ),
  columns = list(
    x = colDef(na = "–", format = colFormat(prefix = "$")),
    y = colDef(na = "NA", format = colFormat(percent = TRUE))
  )
)
```

n

x

y

1

\$55

100%

2

\$27

NA

​

–

25%

4

–

55%

5

\$19

NA

### Custom data formatting

If none of the built-in formatters apply to your data, you can use a
[custom cell renderer](#cell-rendering) instead.

## Custom Rendering

You can customize how data is displayed using an R or JavaScript
function that returns custom content. R render functions support [Shiny
HTML tags](https://shiny.rstudio.com/articles/tag-glossary.html) (or
[`htmltools`](https://unleash-shiny.rinterface.com/htmltools-overview.html))
and [HTML widgets](https://www.htmlwidgets.org/), while JavaScript
render functions allow for more dynamic behavior.

You can also render content as HTML using `colDef(html = TRUE)`. Note
that all raw HTML is escaped by default.

See [Custom Rendering](custom-rendering.md) for details on how to use
render functions, and the [Demo Cookbook](cookbook/cookbook.md) for even
more examples of custom rendering.

**Note:** Custom rendering changes how data is displayed without
affecting the underlying data. Sorting, filtering, and grouping will
still work on the original data.

### Cell rendering

#### R render function

``` r
data <- MASS::Cars93[1:5, c("Manufacturer", "Model", "Type", "AirBags", "Price")]

reactable(data, columns = list(
  Model = colDef(cell = function(value, index) {
    # Render as a link
    url <- sprintf("https://wikipedia.org/wiki/%s_%s", data[index, "Manufacturer"], value)
    htmltools::tags$a(href = url, target = "_blank", as.character(value))
  }),
  AirBags = colDef(cell = function(value) {
    # Render as an X mark or check mark
    if (value == "None") "\u274c No" else "\u2714\ufe0f Yes"
  }),
  Price = colDef(cell = function(value) {
    # Render as currency
    paste0("$", format(value * 1000, big.mark = ","))
  })
))
```

Manufacturer

Model

Type

AirBags

Price

Acura

[Integra](https://wikipedia.org/wiki/Acura_Integra)

Small

❌ No

\$15,900

Acura

[Legend](https://wikipedia.org/wiki/Acura_Legend)

Midsize

✔️ Yes

\$33,900

Audi

[90](https://wikipedia.org/wiki/Audi_90)

Compact

✔️ Yes

\$29,100

Audi

[100](https://wikipedia.org/wiki/Audi_100)

Midsize

✔️ Yes

\$37,700

BMW

[535i](https://wikipedia.org/wiki/BMW_535i)

Midsize

✔️ Yes

\$30,000

#### JavaScript render function

``` r
data <- MASS::Cars93[1:5, c("Manufacturer", "Model", "Type", "AirBags", "Price")]

reactable(data, columns = list(
  Model = colDef(html = TRUE, cell = JS('
    function(cellInfo) {
      // Render as a link
      const url = `https://wikipedia.org/wiki/${cellInfo.row["Manufacturer"]}_${cellInfo.value}`
      return `<a href="${url}" target="_blank">${cellInfo.value}</a>`
    }
  ')),
  AirBags = colDef(cell = JS("
    function(cellInfo) {
      // Render as an X mark or check mark
      return cellInfo.value === 'None' ? '\u274c No' : '\u2714\ufe0f Yes'
    }
  ")),
  Price = colDef(cell = JS("
    function(cellInfo) {
      // Render as currency
      return '$' + (cellInfo.value * 1000).toLocaleString()
    }
  "))
))
```

Manufacturer

Model

Type

AirBags

Price

Acura

[Integra](https://wikipedia.org/wiki/Acura_Integra)

Small

❌ No

\$15,900

Acura

[Legend](https://wikipedia.org/wiki/Acura_Legend)

Midsize

✔️ Yes

\$33,900

Audi

[90](https://wikipedia.org/wiki/Audi_90)

Compact

✔️ Yes

\$29,100

Audi

[100](https://wikipedia.org/wiki/Audi_100)

Midsize

✔️ Yes

\$37,700

BMW

[535i](https://wikipedia.org/wiki/BMW_535i)

Midsize

✔️ Yes

\$30,000

#### Embedding HTML widgets

``` r
library(dplyr)
library(sparkline)

data <- chickwts %>%
  group_by(feed) %>%
  summarise(weight = list(weight)) %>%
  mutate(boxplot = NA, sparkline = NA)

reactable(data, columns = list(
  weight = colDef(cell = function(values) {
    sparkline(values, type = "bar", chartRangeMin = 0, chartRangeMax = max(chickwts$weight))
  }),
  boxplot = colDef(cell = function(value, index) {
    sparkline(data$weight[[index]], type = "box")
  }),
  sparkline = colDef(cell = function(value, index) {
    sparkline(data$weight[[index]])
  })
))
```

feed

weight

boxplot

sparkline

casein

horsebean

linseed

meatmeal

soybean

sunflower

### Grouped cell rendering

``` r
data <- MASS::Cars93[10:22, c("Manufacturer", "Model", "Type", "Price", "MPG.city")]

reactable(
  data,
  groupBy = c("Manufacturer", "Type"),
  columns = list(
    Manufacturer = colDef(
      # Render grouped cells without the row count
      grouped = JS("function(cellInfo) {
        return cellInfo.value
      }")
    ),
    Type = colDef(
      # Render grouped cells with the row count, only if there are multiple sub rows
      grouped = JS("function(cellInfo) {
        if (cellInfo.subRows.length > 1) {
          return cellInfo.value + ' (' + cellInfo.subRows.length + ')'
        }
        return cellInfo.value
      }")
    )
  )
)
```

Manufacturer

Type

Model

Price

MPG.city

​

Cadillac

​

Chevrolet

​

Chrylser

​

Chrysler

### Aggregated cell rendering

``` r
library(dplyr)

set.seed(10)

data <- sample_n(tail(MASS::Cars93, 9), 30, replace = TRUE) %>%
  select(Manufacturer, Model, Type, Sales = Price)

reactable(
  data,
  groupBy = "Manufacturer",
  searchable = TRUE,
  columns = list(
    Model = colDef(aggregate = "unique"),
    Type = colDef(
      # Render aggregated value as a comma-separated list of unique values
      aggregated = JS("function(cellInfo) {
        const values = cellInfo.subRows.map(function(row) { return row['Type'] })
        const unique = values.reduce(function(obj, v) { obj[v] = true; return obj }, {})
        return Object.keys(unique).join(', ')
      }")
    ),
    Sales = colDef(
      aggregate = "sum",
      # Render aggregated cell as currency
      aggregated = JS("function(cellInfo) {
        return cellInfo.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
      }")
    )
  )
)
```

Manufacturer

Model

Type

Sales

​

Volvo (8)

850, 240

Midsize, Compact

\$193.60

​

Volkswagen (13)

Corrado, Passat, Eurovan, Fox

Sporty, Compact, Van, Small

\$268.30

​

Toyota (9)

Previa, Camry, Celica

Van, Midsize, Sporty

\$173.00

### Header rendering

This example requires reactable v0.3.0 or above.

``` r
library(htmltools)

reactable(
  iris[1:5, ],
  defaultColDef = colDef(header = function(value) {
    units <- div(style = "color: #737373", "cm")
    div(title = value, value, units)
  }),
  columns = list(
    Petal.Width = colDef(
      name = "Petal Width",
      html = TRUE,
      align = "left",
      header = JS('function(column) {
        return column.name + `<div style="color: #737373">cm</div>`
      }')
    ),
    Species = colDef(header = function(value) {
      tags$a(href = "https://wikipedia.org/wiki/List_of_Iris_species", value)
    })
  )
)
```

Sepal.Length

cm

Sepal.Width

cm

Petal.Length

cm

Petal Width

cm

[Species](https://wikipedia.org/wiki/List_of_Iris_species)

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

### Custom metadata

New in v0.4.0

You can pass arbitrary data from R to JavaScript render functions using
the `meta` argument in [`reactable()`](../reference/reactable.md).

`meta` should be a named list of values that can also be
[`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) expressions or
functions. Custom metadata can be accessed from JavaScript using the
`state.meta` property, and updated using
[`updateReactable()`](../reference/updateReactable.md) in Shiny or
[`Reactable.setMeta()`](./javascript-api.html#reactable-setmeta) in the
JavaScript API.

Use custom metadata to:

- Simplify JavaScript render functions that need access to data outside
  of the table
- Dynamically change how data is formatted without rerendering the table
- Share JavaScript code or data between different render functions

``` r
library(htmltools)

data <- MASS::Cars93[1:6, c("Manufacturer", "Model", "Type", "Price", "MPG.city")]

exchange_rates <- list(
  USD = 1,
  CAD = 1.30,
  JPY = 137.56
)

tbl <- reactable(
  data,
  columns = list(
    Price = colDef(
      cell = JS("function(cellInfo, state) {
        const { currency, exchangeRates } = state.meta
        const converted = cellInfo.value * exchangeRates[currency]
        return converted.toLocaleString(undefined, { style: 'currency', currency: currency })
      }")
    )
  ),
  meta = list(
    currency = "USD",
    exchangeRates = exchange_rates
  ),
  elementId = "cars-currency-table"
)

browsable(
  tagList(
    tags$label(
      "Currency",
      tags$select(
        onchange = "Reactable.setMeta('cars-currency-table', { currency: event.target.value })",
        lapply(names(exchange_rates), tags$option)
      )
    ),

    tags$hr("aria-hidden" = "true"),

    tbl
  )
)
```

Currency USD CAD JPY

------------------------------------------------------------------------

Manufacturer

Model

Type

Price

MPG.city

Acura

Integra

Small

\$15.90

25

Acura

Legend

Midsize

\$33.90

18

Audi

90

Compact

\$29.10

20

Audi

100

Midsize

\$37.70

19

BMW

535i

Midsize

\$30.00

22

Buick

Century

Midsize

\$15.70

22

## Footers

You can add column footers using the `footer` argument in
[`colDef()`](../reference/colDef.md).

`footer` can either be custom content to render (e.g., a character
string or HTML tag), or a custom render function. See [Custom
Rendering](custom-rendering.md) to learn more about using custom render
functions.

### R render function

``` r
library(dplyr)
library(htmltools)

data <- MASS::Cars93[18:47, ] %>%
  select(Manufacturer, Model, Type, Sales = Price)

reactable(
  data,
  defaultPageSize = 5,
  columns = list(
    Manufacturer = colDef(footer = "Total"),
    Sales = colDef(footer = function(values) sprintf("$%.2f", sum(values)))
  ),
  defaultColDef = colDef(footerStyle = list(fontWeight = "bold"))
)
```

Manufacturer

Model

Type

Sales

Chevrolet

Caprice

Large

18.8

Chevrolet

Corvette

Sporty

38

Chrylser

Concorde

Large

18.4

Chrysler

LeBaron

Compact

15.8

Chrysler

Imperial

Large

29.5

Total

​

​

\$478.10

1–5 of 30 rows

Previous

1

2

3

4

5

6

Next

### JavaScript render function

This example requires reactable v0.3.0 or above.

``` r
reactable(
  data,
  searchable = TRUE,
  defaultPageSize = 5,
  minRows = 5,
  columns = list(
    Manufacturer = colDef(footer = "Total"),
    Sales = colDef(
      footer = JS("function(column, state) {
        let total = 0
        state.sortedData.forEach(function(row) {
          total += row[column.id]
        })
        return total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
      }")
    )
  ),
  defaultColDef = colDef(footerStyle = list(fontWeight = "bold"))
)
```

Manufacturer

Model

Type

Sales

Chevrolet

Caprice

Large

18.8

Chevrolet

Corvette

Sporty

38

Chrylser

Concorde

Large

18.4

Chrysler

LeBaron

Compact

15.8

Chrysler

Imperial

Large

29.5

Total

​

​

\$478.10

1–5 of 30 rows

Previous

1

2

3

4

5

6

Next

### Embedding HTML widgets

``` r
library(sparkline)

reactable(
  iris[1:20, ],
  defaultPageSize = 5,
  bordered = TRUE,
  defaultColDef = colDef(footer = function(values) {
    if (!is.numeric(values)) return()
    sparkline(values, type = "box", width = 100, height = 30)
  })
)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

​

1–5 of 20 rows

Previous

1

2

3

4

Next

## Expandable Row Details

This example requires reactable v0.3.0 or above.

You can make rows expandable with additional content through `details`,
which takes an R or JavaScript render function. See [Custom
Rendering](custom-rendering.md) for details on how to use render
functions.

``` r
reactable(iris[1:5, ], details = function(index) {
  htmltools::div(
    "Details for row: ", index,
    htmltools::tags$pre(paste(capture.output(iris[index, ]), collapse = "\n"))
  )
})
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

​

​

5.1

3.5

1.4

0.2

setosa

​

​

4.9

3

1.4

0.2

setosa

​

​

4.7

3.2

1.3

0.2

setosa

​

​

4.6

3.1

1.5

0.2

setosa

​

​

5

3.6

1.4

0.2

setosa

The details column can be customized by providing a
[`colDef()`](../reference/colDef.md) instead. This can be used to add a
column name, render HTML content, or change the column width:

``` r
reactable(iris[1:5, ], details = colDef(
  name = "More",
  details = JS("function(rowInfo) {
    return `Details for row: ${rowInfo.index}` +
      `<pre>${JSON.stringify(rowInfo.values, null, 2)}</pre>`
  }"),
  html = TRUE,
  width = 60
))
```

More

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

​

​

5.1

3.5

1.4

0.2

setosa

​

​

4.9

3

1.4

0.2

setosa

​

​

4.7

3.2

1.3

0.2

setosa

​

​

4.6

3.1

1.5

0.2

setosa

​

​

5

3.6

1.4

0.2

setosa

### Nested tables

With R render functions, you can render HTML tags, HTML widgets, and
even nested tables:

``` r
data <- unique(CO2[, c("Plant", "Type")])

reactable(data, details = function(index) {
  plant_data <- CO2[CO2$Plant == data$Plant[index], ]
  htmltools::div(style = "padding: 1rem",
    reactable(plant_data, outlined = TRUE)
  )
})
```

Plant

Type

​

​

Qn1

Quebec

​

​

Qn2

Quebec

​

​

Qn3

Quebec

​

​

Qc1

Quebec

​

​

Qc2

Quebec

​

​

Qc3

Quebec

​

​

Mn1

Mississippi

​

​

Mn2

Mississippi

​

​

Mn3

Mississippi

​

​

Mc1

Mississippi

1–10 of 12 rows

Previous

1

2

Next

### Conditional row details

R render functions support conditional rendering. If a render function
returns `NULL`, the row won’t be expandable:

``` r
reactable(iris[1:5, ], details = function(index) {
  if (index %in% c(3, 5)) {
    reactable(data.frame(x = c(1, 2, 3), y = c("a", "b", "c")), fullWidth = FALSE)
  }
})
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

​

5.1

3.5

1.4

0.2

setosa

​

4.9

3

1.4

0.2

setosa

​

​

4.7

3.2

1.3

0.2

setosa

​

4.6

3.1

1.5

0.2

setosa

​

​

5

3.6

1.4

0.2

setosa

### Multiple row details

This example requires reactable v0.3.0 or above.

You can add `details` to individual columns, and even show multiple
details for a row:

``` r
reactable(iris[1:5, ],
  details = function(index) {
    if (index %in% c(3, 5)) {
      reactable(data.frame(x = c(1, 2, 3), y = c("a", "b", "c")), fullWidth = FALSE)
    }
  },
  columns = list(
    Petal.Length = colDef(details = function(index) {
      paste("Petal.Length: ", iris[index, "Petal.Length"])
    }),
    Sepal.Length = colDef(format = colFormat(digits = 1), details = JS("
      function(rowInfo) {
        return 'Sepal.Length: ' + rowInfo.values['Sepal.Length']
      }
    "))
  )
)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

​

​

5.1

3.5

​

1.4

0.2

setosa

​

​

4.9

3

​

1.4

0.2

setosa

​

​

​

4.7

3.2

​

1.3

0.2

setosa

​

​

4.6

3.1

​

1.5

0.2

setosa

​

​

​

5.0

3.6

​

1.4

0.2

setosa

### Default expanded rows

You can expand all rows by default by setting `defaultExpanded` to
`TRUE`:

``` r
reactable(
  iris[1:12, ],
  defaultPageSize = 4,
  details = function(index) paste("Details for row:", index),
  defaultExpanded = TRUE
)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

​

​

5.1

3.5

1.4

0.2

setosa

​

​

4.9

3

1.4

0.2

setosa

​

​

4.7

3.2

1.3

0.2

setosa

​

​

4.6

3.1

1.5

0.2

setosa

1–4 of 12 rows

Previous

1

2

3

Next

## Conditional Styling

You can conditionally style a table using functions that return inline
styles or CSS classes. Just like with custom rendering, style functions
can either be in R or JavaScript.

See [Conditional Styling](conditional-styling.md) for details on how to
use style functions, and the [Demo Cookbook](cookbook/cookbook.md) for
even more examples of conditional styling.

### Cell styling

#### R style function

``` r
reactable(sleep[1:6, ], columns = list(
  extra = colDef(
    style = function(value) {
      if (value > 0) {
        color <- "#008000"
      } else if (value < 0) {
        color <- "#e00000"
      } else {
        color <- "#777"
      }
      list(color = color, fontWeight = "bold")
    }
  )
))
```

extra

group

ID

0.7

1

1

-1.6

1

2

-0.2

1

3

-1.2

1

4

-0.1

1

5

3.4

1

6

#### JavaScript style function

This example requires reactable v0.3.0 or above.

``` r
reactable(sleep[1:6, ], columns = list(
  extra = colDef(
    style = JS("function(rowInfo) {
      const value = rowInfo.values['extra']
      let color
      if (value > 0) {
        color = '#008000'
      } else if (value < 0) {
        color = '#e00000'
      } else {
        color = '#777'
      }
      return { color: color, fontWeight: 'bold' }
    }")
  )
))
```

extra

group

ID

0.7

1

1

-1.6

1

2

-0.2

1

3

-1.2

1

4

-0.1

1

5

3.4

1

6

### Row styling

#### R style function

``` r
reactable(sleep[1:6, ], 
  rowStyle = function(index) {
    if (sleep[index, "extra"] < -1) {
      list(background = "rgba(0, 0, 0, 0.05)")
    }
  },
  rowClass = function(index) {
    if (sleep[index, "extra"] < -1) {
      "bold"
    }
  }
)
```

``` css
.bold {
  font-weight: bold;
}
```

extra

group

ID

0.7

1

1

-1.6

1

2

-0.2

1

3

-1.2

1

4

-0.1

1

5

3.4

1

6

#### JavaScript style function

This example requires reactable v0.3.0 or above.

``` r
reactable(sleep[1:6, ],
  rowStyle = JS("function(rowInfo) {
    if (rowInfo.values['extra'] < -1) {
      return { background: 'rgba(0, 0, 0, 0.05)' }
    }
  }"),
  rowClass = JS("function(rowInfo) {
    if (rowInfo.values['extra'] < -1) {
      return 'bold'
    }
  }")
)
```

extra

group

ID

0.7

1

1

-1.6

1

2

-0.2

1

3

-1.2

1

4

-0.1

1

5

3.4

1

6

### Custom metadata

New in v0.4.0

You can pass arbitrary data from R to JavaScript style functions using
the `meta` argument in [`reactable()`](../reference/reactable.md).

`meta` should be a named list of values that can also be
[`JS()`](https://rdrr.io/pkg/htmlwidgets/man/JS.html) expressions or
functions. Custom metadata can be accessed from JavaScript using the
`state.meta` property, and updated using
[`updateReactable()`](../reference/updateReactable.md) in Shiny or
[`Reactable.setMeta()`](./javascript-api.html#reactable-setmeta) in the
JavaScript API.

Use custom metadata to:

- Simplify JavaScript style functions that need access to data outside
  of the table
- Dynamically change how data is styled without rerendering the table
- Share JavaScript code or data between different style functions

``` r
library(htmltools)

data <- MASS::Cars93[1:6, c("Manufacturer", "Model", "Type", "Price", "MPG.city")]

mpg_normalized <- (data$MPG.city - min(data$MPG.city)) / (max(data$MPG.city) - min(data$MPG.city))
mpg_colors <-  rgb(colorRamp(c("#ffe4cc", "#ff9f1a"))(mpg_normalized), maxColorValue = 255)

tbl <- reactable(
  data,
  columns = list(
    MPG.city = colDef(
      style = JS("function(rowInfo, column, state) {
        const { showColors, mpgColors } = state.meta
        if (showColors) {
          return { backgroundColor: mpgColors[rowInfo.index] }
        }
      }")
    )
  ),
  meta = list(
    mpgColors = mpg_colors,
    showColors = TRUE
  ),
  elementId = "cars-colors-table"
)

browsable(
  tagList(
    tags$label(
      tags$input(
        type = "checkbox",
        checked = NA,
        onclick = "Reactable.setMeta('cars-colors-table', function(prevMeta) {
          return { showColors: !prevMeta.showColors }
        })"
      ),
      "Show color scale"
    ),

    tags$hr("aria-hidden" = "true"),

    tbl
  )
)
```

Show color scale

------------------------------------------------------------------------

Manufacturer

Model

Type

Price

MPG.city

Acura

Integra

Small

15.9

25

Acura

Legend

Midsize

33.9

18

Audi

90

Compact

29.1

20

Audi

100

Midsize

37.7

19

BMW

535i

Midsize

30

22

Buick

Century

Midsize

15.7

22

## Table Styling

You can customize table styling using several options, which can all be
combined:

### Highlight rows on hover

``` r
reactable(iris[1:5, ], highlight = TRUE)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

### Bordered

``` r
reactable(iris[1:5, ], bordered = TRUE)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

### Borderless

``` r
reactable(iris[1:5, ], borderless = TRUE)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

### Outlined

``` r
reactable(iris[1:5, ], outlined = TRUE)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

### Striped

``` r
reactable(iris[1:5, ], striped = TRUE)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

### Bordered + striped + highlighting

``` r
reactable(iris[1:5, ], bordered = TRUE, striped = TRUE, highlight = TRUE)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

### Outlined + borderless

``` r
reactable(iris[1:5, ], outlined = TRUE, borderless = TRUE)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

### Compact

``` r
reactable(iris[1:5, ], compact = TRUE)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

### No text wrapping

Long text is wrapped by default, but you can force text to fit on a
single line by setting `wrap` to `FALSE`:

``` r
data <- aggregate(. ~ Species, iris, toString)

reactable(
  data,
  wrap = FALSE,
  resizable = TRUE,
  bordered = TRUE,
  columns = list(Petal.Length = colDef(name = "Petal Length (cm)", minWidth = 50))
)
```

Species

Sepal.Length

Sepal.Width

Petal Length (cm)

Petal.Width

setosa

5.1, 4.9, 4.7, 4.6, 5, 5.4, 4.6, 5, 4.4, 4.9, 5.4, 4.8, 4.8, 4.3, 5.8,
5.7, 5.4, 5.1, 5.7, 5.1, 5.4, 5.1, 4.6, 5.1, 4.8, 5, 5, 5.2, 5.2, 4.7,
4.8, 5.4, 5.2, 5.5, 4.9, 5, 5.5, 4.9, 4.4, 5.1, 5, 4.5, 4.4, 5, 5.1,
4.8, 5.1, 4.6, 5.3, 5

3.5, 3, 3.2, 3.1, 3.6, 3.9, 3.4, 3.4, 2.9, 3.1, 3.7, 3.4, 3, 3, 4, 4.4,
3.9, 3.5, 3.8, 3.8, 3.4, 3.7, 3.6, 3.3, 3.4, 3, 3.4, 3.5, 3.4, 3.2, 3.1,
3.4, 4.1, 4.2, 3.1, 3.2, 3.5, 3.6, 3, 3.4, 3.5, 2.3, 3.2, 3.5, 3.8, 3,
3.8, 3.2, 3.7, 3.3

1.4, 1.4, 1.3, 1.5, 1.4, 1.7, 1.4, 1.5, 1.4, 1.5, 1.5, 1.6, 1.4, 1.1,
1.2, 1.5, 1.3, 1.4, 1.7, 1.5, 1.7, 1.5, 1, 1.7, 1.9, 1.6, 1.6, 1.5, 1.4,
1.6, 1.6, 1.5, 1.5, 1.4, 1.5, 1.2, 1.3, 1.4, 1.3, 1.5, 1.3, 1.3, 1.3,
1.6, 1.9, 1.4, 1.6, 1.4, 1.5, 1.4

0.2, 0.2, 0.2, 0.2, 0.2, 0.4, 0.3, 0.2, 0.2, 0.1, 0.2, 0.2, 0.1, 0.1,
0.2, 0.4, 0.4, 0.3, 0.3, 0.3, 0.2, 0.4, 0.2, 0.5, 0.2, 0.2, 0.4, 0.2,
0.2, 0.2, 0.2, 0.4, 0.1, 0.2, 0.2, 0.2, 0.2, 0.1, 0.2, 0.2, 0.3, 0.3,
0.2, 0.6, 0.4, 0.3, 0.2, 0.2, 0.2, 0.2

versicolor

7, 6.4, 6.9, 5.5, 6.5, 5.7, 6.3, 4.9, 6.6, 5.2, 5, 5.9, 6, 6.1, 5.6,
6.7, 5.6, 5.8, 6.2, 5.6, 5.9, 6.1, 6.3, 6.1, 6.4, 6.6, 6.8, 6.7, 6, 5.7,
5.5, 5.5, 5.8, 6, 5.4, 6, 6.7, 6.3, 5.6, 5.5, 5.5, 6.1, 5.8, 5, 5.6,
5.7, 5.7, 6.2, 5.1, 5.7

3.2, 3.2, 3.1, 2.3, 2.8, 2.8, 3.3, 2.4, 2.9, 2.7, 2, 3, 2.2, 2.9, 2.9,
3.1, 3, 2.7, 2.2, 2.5, 3.2, 2.8, 2.5, 2.8, 2.9, 3, 2.8, 3, 2.9, 2.6,
2.4, 2.4, 2.7, 2.7, 3, 3.4, 3.1, 2.3, 3, 2.5, 2.6, 3, 2.6, 2.3, 2.7, 3,
2.9, 2.9, 2.5, 2.8

4.7, 4.5, 4.9, 4, 4.6, 4.5, 4.7, 3.3, 4.6, 3.9, 3.5, 4.2, 4, 4.7, 3.6,
4.4, 4.5, 4.1, 4.5, 3.9, 4.8, 4, 4.9, 4.7, 4.3, 4.4, 4.8, 5, 4.5, 3.5,
3.8, 3.7, 3.9, 5.1, 4.5, 4.5, 4.7, 4.4, 4.1, 4, 4.4, 4.6, 4, 3.3, 4.2,
4.2, 4.2, 4.3, 3, 4.1

1.4, 1.5, 1.5, 1.3, 1.5, 1.3, 1.6, 1, 1.3, 1.4, 1, 1.5, 1, 1.4, 1.3,
1.4, 1.5, 1, 1.5, 1.1, 1.8, 1.3, 1.5, 1.2, 1.3, 1.4, 1.4, 1.7, 1.5, 1,
1.1, 1, 1.2, 1.6, 1.5, 1.6, 1.5, 1.3, 1.3, 1.3, 1.2, 1.4, 1.2, 1, 1.3,
1.2, 1.3, 1.3, 1.1, 1.3

virginica

6.3, 5.8, 7.1, 6.3, 6.5, 7.6, 4.9, 7.3, 6.7, 7.2, 6.5, 6.4, 6.8, 5.7,
5.8, 6.4, 6.5, 7.7, 7.7, 6, 6.9, 5.6, 7.7, 6.3, 6.7, 7.2, 6.2, 6.1, 6.4,
7.2, 7.4, 7.9, 6.4, 6.3, 6.1, 7.7, 6.3, 6.4, 6, 6.9, 6.7, 6.9, 5.8, 6.8,
6.7, 6.7, 6.3, 6.5, 6.2, 5.9

3.3, 2.7, 3, 2.9, 3, 3, 2.5, 2.9, 2.5, 3.6, 3.2, 2.7, 3, 2.5, 2.8, 3.2,
3, 3.8, 2.6, 2.2, 3.2, 2.8, 2.8, 2.7, 3.3, 3.2, 2.8, 3, 2.8, 3, 2.8,
3.8, 2.8, 2.8, 2.6, 3, 3.4, 3.1, 3, 3.1, 3.1, 3.1, 2.7, 3.2, 3.3, 3,
2.5, 3, 3.4, 3

6, 5.1, 5.9, 5.6, 5.8, 6.6, 4.5, 6.3, 5.8, 6.1, 5.1, 5.3, 5.5, 5, 5.1,
5.3, 5.5, 6.7, 6.9, 5, 5.7, 4.9, 6.7, 4.9, 5.7, 6, 4.8, 4.9, 5.6, 5.8,
6.1, 6.4, 5.6, 5.1, 5.6, 6.1, 5.6, 5.5, 4.8, 5.4, 5.6, 5.1, 5.1, 5.9,
5.7, 5.2, 5, 5.2, 5.4, 5.1

2.5, 1.9, 2.1, 1.8, 2.2, 2.1, 1.7, 1.8, 1.8, 2.5, 2, 1.9, 2.1, 2, 2.4,
2.3, 1.8, 2.2, 2.3, 1.5, 2.3, 2, 2, 1.8, 2.1, 1.8, 1.8, 1.8, 2.1, 1.6,
1.9, 2, 2.2, 1.5, 1.4, 2.3, 2.4, 1.8, 1.8, 2.1, 2.4, 2.3, 1.9, 2.3, 2.5,
2.3, 1.9, 2, 2.3, 1.8

### Fixed height + sticky header/footer

You can make tables scrollable by setting a fixed height or width.
Headers and footers are sticky by default, so they stay in place when
scrolling.

Scrollable tables are automatically made focusable when navigating using
a keyboard to ensure that they’re always accessible for keyboard users.

``` r
reactable(
  iris[1:20, ],
  height = 270,
  striped = TRUE,
  defaultColDef = colDef(
    footer = function(values, name) {
      htmltools::div(name, style = list(fontWeight = 600))
    }
  )
)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

5.4

3.9

1.7

0.4

setosa

4.6

3.4

1.4

0.3

setosa

5

3.4

1.5

0.2

setosa

4.4

2.9

1.4

0.2

setosa

4.9

3.1

1.5

0.1

setosa

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

1–10 of 20 rows

Previous

1

2

Next

### Column widths

By default, columns have a minimum width of 100px and stretch to fill
the table. You can control the width of a column using the following
arguments in [`colDef()`](../reference/colDef.md):

- `minWidth` - minimum width of the column in pixels (defaults to `100`)
- `maxWidth` - maximum width of the column in pixels
- `width` - fixed width of the column in pixels (overrides `minWidth`
  and `maxWidth`)

When columns stretch, `minWidth` also controls the ratio at which
columns grow. For example, if a table consists of 3 columns having
`minWidth = 100` each, the columns will stretch at a ratio of
`100:100:100`. Each column will take up 1/3 of the table’s width and not
shrink below 100px.

Another example: if a table consists of three columns having minimum
widths of 200px, 100px, and 100px, the columns will take up 50%, 25%,
and 25% of the table’s width respectively:

``` r
reactable(
  MASS::Cars93[1:6, c("Make", "Type", "Weight")],
  columns = list(
    Make = colDef(minWidth = 200),   # 50% width, 200px minimum
    Type = colDef(minWidth = 100),   # 25% width, 100px minimum
    Weight = colDef(minWidth = 100)  # 25% width, 100px minimum
  ),
  bordered = TRUE
)
```

Make

Type

Weight

Acura Integra

Small

2705

Acura Legend

Midsize

3560

Audi 90

Compact

3375

Audi 100

Midsize

3405

BMW 535i

Midsize

3640

Buick Century

Midsize

2880

### No full width

Tables are full width by default, but you can shrink the table to fit
its contents by setting `fullWidth` to `FALSE`:

``` r
reactable(
  MASS::Cars93[1:5, 1:5],
  fullWidth = FALSE,
  bordered = TRUE,
  defaultColDef = colDef(minWidth = 120)
)
```

Manufacturer

Model

Type

Min.Price

Price

Acura

Integra

Small

12.9

15.9

Acura

Legend

Midsize

29.2

33.9

Audi

90

Compact

25.9

29.1

Audi

100

Midsize

30.8

37.7

BMW

535i

Midsize

23.7

30

You can also set a maximum or fixed width on the table:

``` r
reactable(
  MASS::Cars93[1:5, 1:5],
  bordered = TRUE,
  defaultColDef = colDef(minWidth = 120),
  # Set a maximum width on the table:
  style = list(maxWidth = 650),
  # Or a fixed width:
  width = 650
)
```

Manufacturer

Model

Type

Min.Price

Price

Acura

Integra

Small

12.9

15.9

Acura

Legend

Midsize

29.2

33.9

Audi

90

Compact

25.9

29.1

Audi

100

Midsize

30.8

37.7

BMW

535i

Midsize

23.7

30

### Vertical alignment

You can change the vertical alignment of cell content using the `vAlign`
or `headerVAlign` arguments in [`colDef()`](../reference/colDef.md) and
[`colGroup()`](../reference/colGroup.md). `vAlign` controls the
alignment of data cells, while `headerVAlign` controls the alignment of
header cells. Possible options are `"top"` (the default), `"center"`,
and `"bottom"`.

``` r
library(dplyr)
library(htmltools)

data <- starwars[1:6, ] %>%
  select(character = name, height, mass, gender, homeworld, species)

reactable(
  data,
  columns = list(
    character = colDef(
      name = "Character / Species",
      # Show species under character names
      cell = function(value, index) {
        species <- data$species[index]
        species <- if (!is.na(species)) species else "Unknown"
        div(
          div(style = list(fontWeight = 600), value),
          div(style = list(fontSize = "0.75rem"), species)
        )
      }
    ),
    species = colDef(show = FALSE)
  ),
  # Vertically center cells and bottom-align headers
  defaultColDef = colDef(vAlign = "center", headerVAlign = "bottom"),
  bordered = TRUE
)
```

Character / Species

height

mass

gender

homeworld

Luke Skywalker

Human

172

77

masculine

Tatooine

C-3PO

Droid

167

75

masculine

Tatooine

R2-D2

Droid

96

32

masculine

Naboo

Darth Vader

Human

202

136

masculine

Tatooine

Leia Organa

Human

150

49

feminine

Alderaan

Owen Lars

Human

178

120

masculine

Tatooine

### Custom CSS

For more control over styling, you can add custom class names to the
table and apply your own CSS:

``` r
reactable(
  iris[1:18, ],
  defaultPageSize = 6,
  borderless = TRUE,
  class = "my-tbl",
  defaultColDef = colDef(headerClass = "my-header"),
  columns = list(
    Sepal.Width = colDef(class = "my-col"),
    Petal.Width = colDef(class = "my-col")
  ),
  rowClass = "my-row"
)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

5.4

3.9

1.7

0.4

setosa

1–6 of 18 rows

Previous

1

2

3

Next

In R Markdown documents, you can embed CSS using a `css` language chunk:

    ```{css, echo=FALSE}
    .my-tbl {
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .my-header {
      border-width: 1px;
    }

    .my-col {
      border-right: 1px solid rgba(0, 0, 0, 0.05);
    }

    .my-row:hover {
      background-color: #f5f8ff;
    }
    ```

The examples here embed CSS for demonstration, but it’s sometimes better
to add CSS through an external style sheet. To learn more about adding
custom CSS through an external style sheet:

- [Using custom CSS in R Markdown
  documents](https://bookdown.org/yihui/rmarkdown/html-document.html#custom-css)
- [Using custom CSS in Shiny
  apps](https://shiny.rstudio.com/articles/css.html)

**Note:** If you inspect a table’s HTML, you might find CSS classes like
`.rt-table` on different elements of the table. These CSS classes are
undocumented and subject to change, so we recommend adding your own
custom class names, or using [themes](#theming) to customize parts of
the table that aren’t covered by the custom class names.

## Theming

Themes provide a powerful way to customize table styling that can be
reused across tables. You can either set theme variables to change the
default styles (e.g., row stripe color), or add your own custom CSS to
specific elements of the table.

To apply a theme, provide a
[`reactableTheme()`](../reference/reactableTheme.md) to `theme`:

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
    style = list(fontFamily = "-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"),
    searchInputStyle = list(width = "100%")
  )
)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

5.4

3.9

1.7

0.4

setosa

4.6

3.4

1.4

0.3

setosa

5

3.4

1.5

0.2

setosa

4.4

2.9

1.4

0.2

setosa

4.9

3.1

1.5

0.1

setosa

1–10 of 30 rows

Previous

1

2

3

Next

### Global theme

To set the default theme for all tables, use the global
`reactable.theme` option:

``` r
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
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

​

​

5.1

3.5

1.4

0.2

setosa

​

​

4.9

3

1.4

0.2

setosa

​

​

4.7

3.2

1.3

0.2

setosa

​

​

4.6

3.1

1.5

0.2

setosa

​

​

5

3.6

1.4

0.2

setosa

​

​

5.4

3.9

1.7

0.4

setosa

​

​

4.6

3.4

1.4

0.3

setosa

​

​

5

3.4

1.5

0.2

setosa

​

​

4.4

2.9

1.4

0.2

setosa

​

​

4.9

3.1

1.5

0.1

setosa

1–10 of 30 rows

Show 10 25 50 100

Previous

1

2

3

Next

### Nested selectors

You can use nested CSS selectors in theme styles to target the current
element, using `&` as the selector, or other child elements (just like
in Sass). This is useful for adding pseudo-classes like `&:hover`, or
adding styles in a certain context like `.outer-container &`.

For example, to highlight headers when sorting:

``` r
reactable(
  iris[1:5, ],
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
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

Or to apply a dark theme when a parent element has a certain class, like
`.dark`:

``` r
theme <- reactableTheme(
  style = list(".dark &" = list(color = "#fff", background = "#282a36")),
  cellStyle = list(".dark &" = list(borderColor = "rgba(255, 255, 255, 0.15)")),
  headerStyle = list(".dark &" = list(borderColor = "rgba(255, 255, 255, 0.15)")),
  paginationStyle = list(".dark &" = list(borderColor = "rgba(255, 255, 255, 0.15)")),
  rowHighlightStyle = list(".dark &" = list(background = "rgba(255, 255, 255, 0.04)")),
  pageButtonHoverStyle = list(".dark &" = list(background = "rgba(255, 255, 255, 0.08)")),
  pageButtonActiveStyle = list(".dark &" = list(background = "rgba(255, 255, 255, 0.1)"))
)

tbl <- reactable(iris[1:12, ], highlight = TRUE, defaultPageSize = 6, theme = theme)

# Simple theme toggle button
tags$button(onclick = "document.querySelector('.themeable-tbl').classList.toggle('dark')",
            "Toggle light/dark")

# Start with the dark theme enabled
div(class = "themeable-tbl dark", tbl)
```

Toggle light/dark

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

5.4

3.9

1.7

0.4

setosa

1–6 of 12 rows

Previous

1

2

Next

### Dynamic theming

Themes can also be functions that return a
[`reactableTheme()`](../reference/reactableTheme.md) for
context-specific styling.

For example, to style tables in RStudio R Notebooks only when a dark
editor theme is active:

``` r
options(reactable.theme = function() {
  theme <- reactableTheme(
    color = "hsl(233, 9%, 85%)",
    backgroundColor = "hsl(233, 9%, 19%)",
    borderColor = "hsl(233, 9%, 22%)",
    stripedColor = "hsl(233, 12%, 22%)",
    highlightColor = "hsl(233, 12%, 24%)",
    inputStyle = list(backgroundColor = "hsl(233, 9%, 25%)"),
    selectStyle = list(backgroundColor = "hsl(233, 9%, 25%)"),
    pageButtonHoverStyle = list(backgroundColor = "hsl(233, 9%, 25%)"),
    pageButtonActiveStyle = list(backgroundColor = "hsl(233, 9%, 28%)")
  )

  if (isTRUE(getOption("rstudio.notebook.executing"))) {
    if (requireNamespace("rstudioapi", quietly = TRUE) && rstudioapi::getThemeInfo()$dark) {
      return(theme)
    }
  }
})
```

## Column Groups

You can create column groups by passing a list of
[`colGroup()`](../reference/colGroup.md) definitions to `columnGroups`:

``` r
reactable(
  iris[1:5, ],
  columns = list(
    Sepal.Length = colDef(name = "Length"),
    Sepal.Width = colDef(name = "Width"),
    Petal.Length = colDef(name = "Length"),
    Petal.Width = colDef(name = "Width")
  ),
  columnGroups = list(
    colGroup(name = "Sepal", columns = c("Sepal.Length", "Sepal.Width")),
    colGroup(name = "Petal", columns = c("Petal.Length", "Petal.Width"))
  )
)
```

Sepal

Petal

​

Length

Width

Length

Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

## Column Resizing

You can make columns resizable by setting `resizable` to `TRUE`:

``` r
reactable(MASS::Cars93[1:5, ], resizable = TRUE, wrap = FALSE, bordered = TRUE)
```

Manufacturer

Model

Type

Min.Price

Price

Max.Price

MPG.city

MPG.highway

AirBags

DriveTrain

Cylinders

EngineSize

Horsepower

RPM

Rev.per.mile

Man.trans.avail

Fuel.tank.capacity

Passengers

Length

Wheelbase

Width

Turn.circle

Rear.seat.room

Luggage.room

Weight

Origin

Make

Acura

Integra

Small

12.9

15.9

18.8

25

31

None

Front

4

1.8

140

6300

2890

Yes

13.2

5

177

102

68

37

26.5

11

2705

non-USA

Acura Integra

Acura

Legend

Midsize

29.2

33.9

38.7

18

25

Driver & Passenger

Front

6

3.2

200

5500

2335

Yes

18

5

195

115

71

38

30

15

3560

non-USA

Acura Legend

Audi

90

Compact

25.9

29.1

32.3

20

26

Driver only

Front

6

2.8

172

5500

2280

Yes

16.9

5

180

102

67

37

28

14

3375

non-USA

Audi 90

Audi

100

Midsize

30.8

37.7

44.6

19

26

Driver & Passenger

Front

6

2.8

172

5500

2535

Yes

21.1

6

193

106

70

37

31

17

3405

non-USA

Audi 100

BMW

535i

Midsize

23.7

30

36.2

22

30

Driver only

Rear

4

3.5

208

5700

2545

Yes

21.1

4

186

109

69

39

27

13

3640

non-USA

BMW 535i

## Sticky Columns

You can make columns sticky when scrolling horizontally using the
`sticky` argument in [`colDef()`](../reference/colDef.md) or
[`colGroup()`](../reference/colGroup.md). Set `sticky` to either
`"left"` or `"right"` to make the column stick to the left or right
side.

``` r
reactable(
  MASS::Cars93[1:5, ],
  columns = list(
    Manufacturer = colDef(
      sticky = "left",
      # Add a right border style to visually distinguish the sticky column
      style = list(borderRight = "1px solid #eee"),
      headerStyle = list(borderRight = "1px solid #eee")
    ),
    Make = colDef(
      sticky = "right",
      # Add a left border style to visually distinguish the sticky column
      style = list(borderLeft = "1px solid #eee"),
      headerStyle = list(borderLeft = "1px solid #eee")
    )
  ),
  defaultColDef = colDef(minWidth = 150)
)
```

Manufacturer

Model

Type

Min.Price

Price

Max.Price

MPG.city

MPG.highway

AirBags

DriveTrain

Cylinders

EngineSize

Horsepower

RPM

Rev.per.mile

Man.trans.avail

Fuel.tank.capacity

Passengers

Length

Wheelbase

Width

Turn.circle

Rear.seat.room

Luggage.room

Weight

Origin

Make

Acura

Integra

Small

12.9

15.9

18.8

25

31

None

Front

4

1.8

140

6300

2890

Yes

13.2

5

177

102

68

37

26.5

11

2705

non-USA

Acura Integra

Acura

Legend

Midsize

29.2

33.9

38.7

18

25

Driver & Passenger

Front

6

3.2

200

5500

2335

Yes

18

5

195

115

71

38

30

15

3560

non-USA

Acura Legend

Audi

90

Compact

25.9

29.1

32.3

20

26

Driver only

Front

6

2.8

172

5500

2280

Yes

16.9

5

180

102

67

37

28

14

3375

non-USA

Audi 90

Audi

100

Midsize

30.8

37.7

44.6

19

26

Driver & Passenger

Front

6

2.8

172

5500

2535

Yes

21.1

6

193

106

70

37

31

17

3405

non-USA

Audi 100

BMW

535i

Midsize

23.7

30

36.2

22

30

Driver only

Rear

4

3.5

208

5700

2545

Yes

21.1

4

186

109

69

39

27

13

3640

non-USA

BMW 535i

### Multiple sticky columns

``` r
# Background style to visually distinguish sticky columns
sticky_style <- list(backgroundColor = "#f7f7f7")

reactable(
  MASS::Cars93[1:5, ],
  columns = list(
    Manufacturer = colDef(
      sticky = "left",
      style = sticky_style,
      headerStyle = sticky_style
    ),
    Model = colDef(
      sticky = "left",
      style = sticky_style,
      headerStyle = sticky_style
    ),
    Type = colDef(
      sticky = "left",
      style = sticky_style,
      headerStyle = sticky_style
    )
  ),
  resizable = TRUE,
  wrap = FALSE,
  bordered = TRUE
)
```

Manufacturer

Model

Type

Min.Price

Price

Max.Price

MPG.city

MPG.highway

AirBags

DriveTrain

Cylinders

EngineSize

Horsepower

RPM

Rev.per.mile

Man.trans.avail

Fuel.tank.capacity

Passengers

Length

Wheelbase

Width

Turn.circle

Rear.seat.room

Luggage.room

Weight

Origin

Make

Acura

Integra

Small

12.9

15.9

18.8

25

31

None

Front

4

1.8

140

6300

2890

Yes

13.2

5

177

102

68

37

26.5

11

2705

non-USA

Acura Integra

Acura

Legend

Midsize

29.2

33.9

38.7

18

25

Driver & Passenger

Front

6

3.2

200

5500

2335

Yes

18

5

195

115

71

38

30

15

3560

non-USA

Acura Legend

Audi

90

Compact

25.9

29.1

32.3

20

26

Driver only

Front

6

2.8

172

5500

2280

Yes

16.9

5

180

102

67

37

28

14

3375

non-USA

Audi 90

Audi

100

Midsize

30.8

37.7

44.6

19

26

Driver & Passenger

Front

6

2.8

172

5500

2535

Yes

21.1

6

193

106

70

37

31

17

3405

non-USA

Audi 100

BMW

535i

Midsize

23.7

30

36.2

22

30

Driver only

Rear

4

3.5

208

5700

2545

Yes

21.1

4

186

109

69

39

27

13

3640

non-USA

BMW 535i

### Sticky column groups

If a column group is sticky, all columns in the group will automatically
be made sticky.

``` r
reactable(
  MASS::Cars93[1:5, ],
  columnGroups = list(
    colGroup("Make", columns = c("Manufacturer", "Model"), sticky = "left"),
    colGroup("Price", columns = c("Min.Price", "Price", "Max.Price"), sticky = "left")
  ),
  defaultColDef = colDef(footer = "Footer"),
  resizable = TRUE,
  wrap = FALSE,
  bordered = TRUE
)
```

Make

​

Price

​

Manufacturer

Model

Type

Min.Price

Price

Max.Price

MPG.city

MPG.highway

AirBags

DriveTrain

Cylinders

EngineSize

Horsepower

RPM

Rev.per.mile

Man.trans.avail

Fuel.tank.capacity

Passengers

Length

Wheelbase

Width

Turn.circle

Rear.seat.room

Luggage.room

Weight

Origin

Make

Acura

Integra

Small

12.9

15.9

18.8

25

31

None

Front

4

1.8

140

6300

2890

Yes

13.2

5

177

102

68

37

26.5

11

2705

non-USA

Acura Integra

Acura

Legend

Midsize

29.2

33.9

38.7

18

25

Driver & Passenger

Front

6

3.2

200

5500

2335

Yes

18

5

195

115

71

38

30

15

3560

non-USA

Acura Legend

Audi

90

Compact

25.9

29.1

32.3

20

26

Driver only

Front

6

2.8

172

5500

2280

Yes

16.9

5

180

102

67

37

28

14

3375

non-USA

Audi 90

Audi

100

Midsize

30.8

37.7

44.6

19

26

Driver & Passenger

Front

6

2.8

172

5500

2535

Yes

21.1

6

193

106

70

37

31

17

3405

non-USA

Audi 100

BMW

535i

Midsize

23.7

30

36.2

22

30

Driver only

Rear

4

3.5

208

5700

2545

Yes

21.1

4

186

109

69

39

27

13

3640

non-USA

BMW 535i

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

Footer

## Row Names and Row Headers

### Row names

Row names are shown by default if present. You can customize the row
names column by adding a column definition using `".rownames"` as the
column name:

``` r
reactable(
  USPersonalExpenditure,
  columns = list(
    .rownames = colDef(name = "Category", sortable = TRUE)
  )
)
```

Category

1940

1945

1950

1955

1960

Food and Tobacco

22.2

44.5

59.6

73.2

86.8

Household Operation

10.5

15.5

29

36.5

46.2

Medical and Health

3.53

5.76

9.71

14

21.1

Personal Care

1.04

1.98

2.45

3.4

5.4

Private Education

0.341

0.974

1.8

2.6

3.64

If row names haven’t been set explicitly, you can force them to show by
setting `rownames` to `TRUE`:

``` r
reactable(iris[1:5, ], rownames = TRUE)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

1

5.1

3.5

1.4

0.2

setosa

2

4.9

3

1.4

0.2

setosa

3

4.7

3.2

1.3

0.2

setosa

4

4.6

3.1

1.5

0.2

setosa

5

5

3.6

1.4

0.2

setosa

### Row headers

You can mark up cells in a column as row headers by setting `rowHeader`
to `TRUE` in [`colDef()`](../reference/colDef.md).

Use this to help users navigate the table using assistive technologies.
When cells are marked up as row headers, assistive technologies will
read them aloud while navigating through cells in the table.

Cells in the row names column are automatically marked up as row
headers.

``` r
data <- MASS::Cars93[1:5, c("Make", "Type", "Price", "MPG.city", "AirBags")]

reactable(
  data,
  columns = list(
    Make = colDef(rowHeader = TRUE, style = list(fontWeight = 600))
  ),
  bordered = TRUE
)
```

Make

Type

Price

MPG.city

AirBags

Acura Integra

Small

15.9

25

None

Acura Legend

Midsize

33.9

18

Driver & Passenger

Audi 90

Compact

29.1

20

Driver only

Audi 100

Midsize

37.7

19

Driver & Passenger

BMW 535i

Midsize

30

22

Driver only

## Cell Click Actions

You can add cell click actions using the `onClick` argument, which
accepts the following values:

- `"expand"` to expand the row
- `"select"` to select the row
- A JavaScript function for a custom action, e.g., sending the click
  event to Shiny

### Expand on click

``` r
reactable(
  iris[48:52, ],
  groupBy = "Species",
  details = function(index) paste("Details for row:", index),
  onClick = "expand",
  # Give rows a pointer cursor to indicate that they're clickable
  rowStyle = list(cursor = "pointer")
)
```

Species

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

​

setosa (3)

​

versicolor (2)

### Select on click

``` r
reactable(iris[1:5, ], selection = "multiple", onClick = "select")
```

​

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

​

5.1

3.5

1.4

0.2

setosa

​

4.9

3

1.4

0.2

setosa

​

4.7

3.2

1.3

0.2

setosa

​

4.6

3.1

1.5

0.2

setosa

​

5

3.6

1.4

0.2

setosa

### Custom action

This example requires reactable v0.3.0 or above.

Custom click actions are JavaScript functions that receive three
arguments:

- `rowInfo`, an object containing row information
- `column`, an object containing column information
- `state`, an object containing the current table state

Some common properties include `rowInfo.index` (zero-based row index),
`rowInfo.values` (row data values), `column.id` (column ID), and
`state.selected` (selected row indices). For the full list of
properties, see the [Custom Rendering](custom-rendering.md) guide.

This example uses a custom click action to create custom “show details”
action buttons in each row of the table:

``` r
data <- cbind(
  MASS::Cars93[1:5, c("Manufacturer", "Model", "Type", "Price")],
  details = NA
)

reactable(
  data,
  columns = list(
    # Render a "show details" button in the last column of the table.
    # This button won't do anything by itself, but will trigger the custom
    # click action on the column.
    details = colDef(
      name = "",
      sortable = FALSE,
      cell = function() htmltools::tags$button("Show details")
    )
  ),
  onClick = JS("function(rowInfo, column, state) {
    // Only handle click events on the 'details' column
    if (column.id !== 'details') {
      return
    }

    // Display an alert dialog with details for the row
    window.alert('Details for row ' + rowInfo.index + ':\\n' + JSON.stringify(rowInfo.values, null, 2))

    // Send the click event to Shiny, which will be available in input$show_details
    // Note that the row index starts at 0 in JavaScript, so we add 1
    if (window.Shiny) {
      Shiny.setInputValue('show_details', { index: rowInfo.index + 1 }, { priority: 'event' })
    }
  }")
)
```

Manufacturer

Model

Type

Price

Acura

Integra

Small

15.9

Show details

Acura

Legend

Midsize

33.9

Show details

Audi

90

Compact

29.1

Show details

Audi

100

Midsize

37.7

Show details

BMW

535i

Midsize

30

Show details

**Warning:** Custom click actions are currently not accessible to
keyboard users, and are generally not recommended. If they must be used,
ensure that they can be triggered by a keyboard through other means,
such as a button in the example above.

## Language Options

You can customize the language in the table by providing a set of
[`reactableLang()`](../reference/reactableLang.md) options to
`language`:

``` r
reactable(
  iris[1:30, ],
  searchable = TRUE,
  paginationType = "simple",
  language = reactableLang(
    searchPlaceholder = "Search...",
    noData = "No entries found",
    pageInfo = "{rowStart} to {rowEnd} of {rows} entries",
    pagePrevious = "\u276e",
    pageNext = "\u276f",

    # Accessible labels for assistive technologies such as screen readers.
    # These are already set by default, but don't forget to update them when
    # changing visible text.
    pagePreviousLabel = "Previous page",
    pageNextLabel = "Next page"
  )
)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

5

3.6

1.4

0.2

setosa

5.4

3.9

1.7

0.4

setosa

4.6

3.4

1.4

0.3

setosa

5

3.4

1.5

0.2

setosa

4.4

2.9

1.4

0.2

setosa

4.9

3.1

1.5

0.1

setosa

1 to 10 of 30 entries

❮

1 of 3

❯

### Global language options

To set the default language strings for all tables, use the global
`reactable.language` option:

``` r
options(reactable.language = reactableLang(
  pageSizeOptions = "\u663e\u793a {rows}",
  pageInfo = "{rowStart} \u81f3 {rowEnd} \u9879\u7ed3\u679c,\u5171 {rows} \u9879",
  pagePrevious = "\u4e0a\u9875",
  pageNext = "\u4e0b\u9875"
))

reactable(iris[1:12, ], defaultPageSize = 4, showPageSizeOptions = TRUE)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

5.1

3.5

1.4

0.2

setosa

4.9

3

1.4

0.2

setosa

4.7

3.2

1.3

0.2

setosa

4.6

3.1

1.5

0.2

setosa

1 至 4 项结果,共 12 项

显示 10 25 50 100

上页

1

2

3

下页

## Shiny

To use reactable in Shiny apps, use
[`renderReactable()`](../reference/reactable-shiny.md) and
[`reactableOutput()`](../reference/reactable-shiny.md):

``` r
library(shiny)
library(reactable)

ui <- fluidPage(
  titlePanel("reactable example"),
  reactableOutput("table")
)

server <- function(input, output, session) {
  output$table <- renderReactable({
    reactable(iris)
  })
}

shinyApp(ui, server)
```

### Row selection

You can enable row selection by setting `selection` to `"single"` for
single selection, or `"multiple"` for multiple selection.

To get the selected rows in Shiny, use
[`getReactableState()`](../reference/getReactableState.md). The selected
rows are given as a vector of row indices (e.g. `c(1, 6, 4)`) or `NULL`
if no rows are selected.

``` r
library(shiny)
library(reactable)

ui <- fluidPage(
  titlePanel("row selection example"),
  reactableOutput("table"),
  verbatimTextOutput("selected")
)

server <- function(input, output, session) {
  selected <- reactive(getReactableState("table", "selected"))

  output$table <- renderReactable({
    reactable(iris, selection = "multiple", onClick = "select")
  })

  output$selected <- renderPrint({
    print(selected())
  })

  observe({
    print(iris[selected(), ])
  })
}

shinyApp(ui, server)
```

#### Default selected rows

You can preselect rows by specifying a vector of row indices in
`defaultSelected`:

``` r
reactable(iris[1:4, ], selection = "multiple", defaultSelected = c(1, 3))
```

​

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

​

5.1

3.5

1.4

0.2

setosa

​

4.9

3

1.4

0.2

setosa

​

4.7

3.2

1.3

0.2

setosa

​

4.6

3.1

1.5

0.2

setosa

#### Style selected rows

You can style selected rows using `rowSelectedStyle` in
[`reactableTheme()`](../reference/reactableTheme.md):

``` r
reactable(
  iris[1:4, ],
  selection = "multiple",
  defaultSelected = c(1, 3),
  borderless = TRUE,
  onClick = "select",
  theme = reactableTheme(
    rowSelectedStyle = list(backgroundColor = "#eee", boxShadow = "inset 2px 0 0 0 #ffa62d")
  )
)
```

​

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

​

5.1

3.5

1.4

0.2

setosa

​

4.9

3

1.4

0.2

setosa

​

4.7

3.2

1.3

0.2

setosa

​

4.6

3.1

1.5

0.2

setosa

Or using a `rowStyle` or `rowClass` JavaScript function:

``` r
reactable(
  MASS::Cars93[10:22, c("Manufacturer", "Model", "Type", "Price", "MPG.city")],
  groupBy = "Manufacturer",
  selection = "multiple",
  defaultSelected = c(1, 2),
  borderless = TRUE,
  onClick = "select",
  rowStyle = JS("function(rowInfo) {
    if (rowInfo && rowInfo.selected) {
      return { backgroundColor: '#eee', boxShadow: 'inset 2px 0 0 0 #ffa62d' }
    }
  }")
)
```

​

Manufacturer

Model

Type

Price

MPG.city

​

​

Cadillac (2)

​

​

Chevrolet (8)

​

​

Chrylser (1)

​

​

Chrysler (2)

#### Customize the selection column

You can customize the selection column using `".selection"` as the
column name:

``` r
reactable(
  MASS::Cars93[1:4, ],
  columns = list(
    .selection = colDef(
      width = 80,
      sticky = "left",
      style = list(cursor = "pointer"),
      headerStyle = list(cursor = "pointer")
    )
  ),
  selection = "multiple",
  onClick = "select",
  resizable = TRUE,
  wrap = FALSE,
  bordered = TRUE
)
```

​

Manufacturer

Model

Type

Min.Price

Price

Max.Price

MPG.city

MPG.highway

AirBags

DriveTrain

Cylinders

EngineSize

Horsepower

RPM

Rev.per.mile

Man.trans.avail

Fuel.tank.capacity

Passengers

Length

Wheelbase

Width

Turn.circle

Rear.seat.room

Luggage.room

Weight

Origin

Make

​

Acura

Integra

Small

12.9

15.9

18.8

25

31

None

Front

4

1.8

140

6300

2890

Yes

13.2

5

177

102

68

37

26.5

11

2705

non-USA

Acura Integra

​

Acura

Legend

Midsize

29.2

33.9

38.7

18

25

Driver & Passenger

Front

6

3.2

200

5500

2335

Yes

18

5

195

115

71

38

30

15

3560

non-USA

Acura Legend

​

Audi

90

Compact

25.9

29.1

32.3

20

26

Driver only

Front

6

2.8

172

5500

2280

Yes

16.9

5

180

102

67

37

28

14

3375

non-USA

Audi 90

​

Audi

100

Midsize

30.8

37.7

44.6

19

26

Driver & Passenger

Front

6

2.8

172

5500

2535

Yes

21.1

6

193

106

70

37

31

17

3405

non-USA

Audi 100

### Update a reactable instance

You can update the selected rows, expanded rows, current page, or data
using [`updateReactable()`](../reference/updateReactable.md):

``` r
library(shiny)
library(reactable)

data <- MASS::Cars93[, 1:7]

ui <- fluidPage(
  actionButton("select_btn", "Select rows"),
  actionButton("clear_btn", "Clear selection"),
  actionButton("expand_btn", "Expand rows"),
  actionButton("collapse_btn", "Collapse rows"),
  actionButton("page_btn", "Change page"),
  selectInput("filter_type", "Filter type", unique(data$Type), multiple = TRUE),
  reactableOutput("table")
)

server <- function(input, output) {
  output$table <- renderReactable({
    reactable(
      data,
      filterable = TRUE,
      searchable = TRUE,
      selection = "multiple",
      details = function(index) paste("Details for row:", index)
    )
  })

  observeEvent(input$select_btn, {
    # Select rows
    updateReactable("table", selected = c(1, 3, 5))
  })

  observeEvent(input$clear_btn, {
    # Clear row selection
    updateReactable("table", selected = NA)
  })

  observeEvent(input$expand_btn, {
    # Expand all rows
    updateReactable("table", expanded = TRUE)
  })

  observeEvent(input$collapse_btn, {
    # Collapse all rows
    updateReactable("table", expanded = FALSE)
  })

  observeEvent(input$page_btn, {
    # Change current page
    updateReactable("table", page = 3)
  })

  observe({
    # Filter data
    filtered <- if (length(input$filter_type) > 0) {
      data[data$Type %in% input$filter_type, ]
    } else {
      data
    }
    updateReactable("table", data = filtered)
  })
}

shinyApp(ui, server)
```

### Get the state of a reactable instance

You can get the current state of a table using
[`getReactableState()`](../reference/getReactableState.md).

By default, [`getReactableState()`](../reference/getReactableState.md)
returns a named list with the following values:

- `page`: the current page
- `pageSize`: the page size
- `pages`: the number of pages
- `sorted`: the sorted columns - a named list of columns with values of
  `"asc"` for ascending order or `"desc"` for descending order, or
  `NULL` if no columns are sorted
- `selected`: the selected rows - a numeric vector of row indices, or
  `NULL` if no rows are selected

To only watch for changes on a specific value, you can use the optional
`name` argument, like `getReactableState(outputId, "selected")`.

``` r
library(shiny)
library(reactable)
library(htmltools)

ui <- fluidPage(
  actionButton("prev_page_btn", "Previous page"),
  actionButton("next_page_btn", "Next page"),
  reactableOutput("table"),
  verbatimTextOutput("table_state"),
  uiOutput("selected_row_details")
)

server <- function(input, output) {
  output$table <- renderReactable({
    reactable(
      MASS::Cars93[, 1:5],
      showPageSizeOptions = TRUE,
      selection = "multiple",
      onClick = "select"
    )
  })

  output$table_state <- renderPrint({
    state <- req(getReactableState("table"))
    print(state)
  })

  observeEvent(input$prev_page_btn, {
    # Change to the previous page
    page <- getReactableState("table", "page")
    if (page > 1) {
      updateReactable("table", page = page - 1)
    }
  })

  observeEvent(input$next_page_btn, {
    # Change to the next page
    state <- getReactableState("table")
    if (state$page < state$pages) {
      updateReactable("table", page = state$page + 1)
    }
  })
  
  output$selected_row_details <- renderUI({
    selected <- getReactableState("table", "selected")
    req(selected)
    details <- MASS::Cars93[selected, -c(1:5)]
    tagList(
      h2("Selected row details"),
      tags$pre(
        paste(capture.output(print(details, width = 1200)), collapse = "\n")
      )
    )
  })
}

shinyApp(ui, server)
```

## Cross-Widget Interactions

You can link selection and filtering with other HTML widgets in an R
Markdown document or Shiny app using
[Crosstalk](https://rstudio.github.io/crosstalk). To get started,
install the `crosstalk` package and wrap your data frame in a
[`crosstalk::SharedData`](https://rdrr.io/pkg/crosstalk/man/SharedData.html)
object:

``` r
install.packages("crosstalk")

library(crosstalk)

data <- SharedData$new(iris)
```

Then, pass the shared data to [`reactable()`](../reference/reactable.md)
and any other Crosstalk-compatible HTML widget or filter input:

``` r
reactable(data)

filter_slider("sepal_length", "Sepal Length", data, ~Sepal.Length)
```

For more examples and a list of Crosstalk-compatible widgets, check out
[Using Crosstalk](https://rstudio.github.io/crosstalk/using.html) in the
Crosstalk package documentation.

### Filtering

Tables can be filtered by widgets that support Crosstalk’s filtering
API, such as Crosstalk’s
[`filter_checkbox()`](https://rdrr.io/pkg/crosstalk/man/filter_select.html),
[`filter_slider()`](https://rdrr.io/pkg/crosstalk/man/filter_slider.html),
and
[`filter_select()`](https://rdrr.io/pkg/crosstalk/man/filter_select.html)
inputs:

``` r
library(crosstalk)

cars <- MASS::Cars93[1:20, c("Manufacturer", "Model", "Type", "Price")]
data <- SharedData$new(cars)

shiny::fluidRow(
  shiny::column(
    4,
    filter_checkbox("type", "Type", data, ~Type),
    filter_slider("price", "Price", data, ~Price, width = "100%"),
    filter_select("mfr", "Manufacturer", data, ~Manufacturer)
  ),
  shiny::column(
    8,
    reactable(data, minRows = 10)
  )
)
```

Type

Compact

Large

Midsize

Small

Sporty

Van

Price

Manufacturer

Manufacturer

Model

Type

Price

Acura

Integra

Small

15.9

Acura

Legend

Midsize

33.9

Audi

90

Compact

29.1

Audi

100

Midsize

37.7

BMW

535i

Midsize

30

Buick

Century

Midsize

15.7

Buick

LeSabre

Large

20.8

Buick

Roadmaster

Large

23.7

Buick

Riviera

Midsize

26.3

Cadillac

DeVille

Large

34.7

1–10 of 20 rows

Previous

1

2

Next

**Note:** This example uses
[`shiny::fluidRow()`](https://rdrr.io/pkg/shiny/man/fluidPage.html) and
[`shiny::column()`](https://rdrr.io/pkg/shiny/man/column.html) to create
a Bootstrap grid layout, which works with all Bootstrap versions.
[`crosstalk::bscols()`](https://rdrr.io/pkg/crosstalk/man/bscols.html)
can also create a grid, but is only compatible with Bootstrap 3. If
you’re not using Bootstrap, here’s an alternative way to create a
responsive grid using CSS grid.

Example: grid layout using CSS grid

``` r
library(crosstalk)

cars <- MASS::Cars93[1:20, c("Manufacturer", "Model", "Type", "Price")]
data <- SharedData$new(cars)

div(
  style = "display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;",
  div(
    filter_checkbox("type", "Type", data, ~Type),
    filter_slider("price", "Price", data, ~Price, width = "100%"),
    filter_select("mfr", "Manufacturer", data, ~Manufacturer)
  ),
  div(
    style = "grid-column: span 2;",
    reactable(data, minRows = 10)
  )
)
```

### Linked selection

Table selection state can be linked with other widgets that support
Crosstalk’s linked selection (or linked brushing) API.

In this example, you can select rows to highlight points on the map, or
select areas on the map to highlight rows in the table.

``` r
library(crosstalk)
library(leaflet)
library(dplyr)

# A SpatialPointsDataFrame for the map.
# Set a group name to share data points with the table.
brew_sp <- SharedData$new(breweries91, group = "breweries")

# A regular data frame (without coordinates) for the table.
# Use the same group name as the map data.
brew_data <- breweries91 %>%
  select(brewery, address, village, founded) %>%
  SharedData$new(group = "breweries")

map <- leaflet(brew_sp) %>%
  addTiles() %>%
  addMarkers()

tbl <- reactable(
  brew_data,
  selection = "multiple",
  onClick = "select",
  rowStyle = list(cursor = "pointer"),
  minRows = 10
)

htmltools::browsable(
  htmltools::tagList(map, tbl)
)
```

​

brewery

address

village

founded

​

Brauerei Rittmayer

Aischer Hauptstrasse 5

Adelsdorf

1422

​

Aufsesser Brauerei

Im Tal 70b

Aufsess

1886

​

Brauhaus Doebler

Kornmarkt 6

Bad Windsheim

1867

​

Brauerei Gundel GmbH

Noerdlinger Strasse 15

Barthelmesaurach

1887

​

Krug-Braeu

Breitenlesau 1b

Waischenfeld

1834

​

Brauerei-Gasthof Herold

Marktstrasse 29

Buechenbach

1568

​

Brauerei Alt Dietzhof

Dietzhof 42

Leutenbach

1886

​

Brauerei Hauf KG

Heiningerstrasse 28

Dinkelsbuehl

1901

​

Weib's Brauhaus Dinkelsbuehl

Untere Schmiedgasse 13

Dinkelsbuehl

1999

​

Schwanenbraeu

Am Marktplatz 2

Ebermannstadt

​

1–10 of 32 rows

Previous

1

2

3

4

Next

## JavaScript API

You can use the JavaScript API to create custom interactive controls for
your table without the use of Shiny, or add cross-widget interactions
beyond what Crosstalk provides.

See the [JavaScript API guide](javascript-api.md) for details on how to
use the JavaScript API in R Markdown documents or Shiny apps, and the
full API reference.

### CSV download button

[`Reactable.downloadDataCSV()`](./javascript-api.html#reactable-downloaddatacsv)
downloads table data to a CSV file, including any filters that have been
applied. See the JavaScript API guide for more details on usage,
including how to customize the field separator, decimal separator,
included columns, and more.

``` r
library(htmltools)
library(fontawesome)

data <- MASS::Cars93[1:15, c("Manufacturer", "Model", "Type", "Price")]

htmltools::browsable(
  tagList(
    tags$button(
      tagList(fontawesome::fa("download"), "Download as CSV"),
      onclick = "Reactable.downloadDataCSV('cars-download-table', 'cars.csv')"
    ),

    reactable(
      data,
      searchable = TRUE,
      defaultPageSize = 5,
      elementId = "cars-download-table"
    )
  )
)
```

![](data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiB2aWV3Ym94PSIwIDAgNTEyIDUxMiIgc3R5bGU9ImhlaWdodDoxZW07d2lkdGg6MWVtO3ZlcnRpY2FsLWFsaWduOi0wLjEyNWVtO21hcmdpbi1sZWZ0OmF1dG87bWFyZ2luLXJpZ2h0OmF1dG87Zm9udC1zaXplOmluaGVyaXQ7ZmlsbDpjdXJyZW50Q29sb3I7b3ZlcmZsb3c6dmlzaWJsZTtwb3NpdGlvbjpyZWxhdGl2ZTsiPjxwYXRoIGQ9Ik0yODggMzJjMC0xNy43LTE0LjMtMzItMzItMzJzLTMyIDE0LjMtMzIgMzJWMjc0LjdsLTczLjQtNzMuNGMtMTIuNS0xMi41LTMyLjgtMTIuNS00NS4zIDBzLTEyLjUgMzIuOCAwIDQ1LjNsMTI4IDEyOGMxMi41IDEyLjUgMzIuOCAxMi41IDQ1LjMgMGwxMjgtMTI4YzEyLjUtMTIuNSAxMi41LTMyLjggMC00NS4zcy0zMi44LTEyLjUtNDUuMyAwTDI4OCAyNzQuN1YzMnpNNjQgMzUyYy0zNS4zIDAtNjQgMjguNy02NCA2NHYzMmMwIDM1LjMgMjguNyA2NCA2NCA2NEg0NDhjMzUuMyAwIDY0LTI4LjcgNjQtNjRWNDE2YzAtMzUuMy0yOC43LTY0LTY0LTY0SDM0Ni41bC00NS4zIDQ1LjNjLTI1IDI1LTY1LjUgMjUtOTAuNSAwTDE2NS41IDM1Mkg2NHptMzY4IDU2YTI0IDI0IDAgMSAxIDAgNDggMjQgMjQgMCAxIDEgMC00OHoiIC8+PC9zdmc+)
Download as CSV

Manufacturer

Model

Type

Price

Acura

Integra

Small

15.9

Acura

Legend

Midsize

33.9

Audi

90

Compact

29.1

Audi

100

Midsize

37.7

BMW

535i

Midsize

30

1–5 of 15 rows

Previous

1

2

3

Next

### CSV download button in Shiny

While you can create download buttons in Shiny using
[`shiny::downloadButton()`](https://rdrr.io/pkg/shiny/man/downloadButton.html),
you may still prefer to use the JavaScript API, as
[`Reactable.downloadDataCSV()`](./javascript-api.html#reactable-downloaddatacsv)
automatically applies any client-side filtering that has been done to
the table.

``` r
library(shiny)
library(reactable)
library(htmltools)

csvDownloadButton <- function(id, filename = "data.csv", label = "Download as CSV") {
  tags$button(
    tagList(icon("download"), label),
    onclick = sprintf("Reactable.downloadDataCSV('%s', '%s')", id, filename)
  )
}

ui <- fluidPage(
  csvDownloadButton("cars_table", filename = "cars.csv"),
  reactableOutput("cars_table")
)

server <- function(input, output) {
  output$cars_table <- renderReactable({
    reactable(
      MASS::Cars93[, c("Manufacturer", "Model", "Type", "Price")],
      searchable = TRUE
    )
  })
}

shinyApp(ui, server)
```

### Custom column filter

``` r
library(htmltools)

data <- MASS::Cars93[1:15, c("Manufacturer", "Model", "Type", "Price")]

htmltools::browsable(
  tagList(
    div(
      div(tags$label("Filter Type", `for` = "cars-type-filter")),
      tags$select(
        id = "cars-type-filter",
        onchange = "Reactable.setFilter('cars-filter-table', 'Type', this.value)",
        tags$option("All", value = ""),
        lapply(unique(data$Type), tags$option)
      )
    ),
    
    tags$hr("aria-hidden" = "true"),

    reactable(data, defaultPageSize = 5, elementId = "cars-filter-table")
  )
)
```

Filter Type

All Small Midsize Compact Large Sporty

------------------------------------------------------------------------

Manufacturer

Model

Type

Price

Acura

Integra

Small

15.9

Acura

Legend

Midsize

33.9

Audi

90

Compact

29.1

Audi

100

Midsize

37.7

BMW

535i

Midsize

30

1–5 of 15 rows

Previous

1

2

3

Next

### Custom search input

``` r
library(htmltools)

data <- MASS::Cars93[1:15, c("Manufacturer", "Model", "Type", "Price")]

htmltools::browsable(
  tagList(
    div(
      style = "margin-bottom: 0.75rem",
      tags$input(
        type = "text",
        placeholder = "Search for cars...",
        style = "padding: 0.25rem 0.5rem; width: 100%",
        oninput = "Reactable.setSearch('cars-search-table', this.value)"
      )
    ),

    reactable(data, defaultPageSize = 5, elementId = "cars-search-table")
  )
)
```

Manufacturer

Model

Type

Price

Acura

Integra

Small

15.9

Acura

Legend

Midsize

33.9

Audi

90

Compact

29.1

Audi

100

Midsize

37.7

BMW

535i

Midsize

30

1–5 of 15 rows

Previous

1

2

3

Next

### Column grouping select

``` r
library(dplyr)
library(htmltools)

set.seed(10)

data <- sample_n(tail(MASS::Cars93, 9), 30, replace = TRUE) %>%
  select(Manufacturer, Model, Type, Sales = Price)

htmltools::browsable(
  tagList(
    div(tags$label("Group by", `for` = "cars-grouping-select")),
    tags$select(
      id = "cars-grouping-select",
      onchange = "Reactable.setGroupBy('cars-grouping-table', this.value ? [this.value] : [])",
      tags$option("None", value = ""),
      lapply(c("Manufacturer", "Model", "Type"), tags$option)
    ),

    tags$hr("aria-hidden" = "true"),

    reactable(
      data,
      columns = list(
        Manufacturer = colDef(aggregate = "unique"),
        Model = colDef(aggregate = "unique"),
        Type = colDef(aggregate = "unique"),
        Sales = colDef(aggregate = "sum", format = colFormat(currency = "USD"))
      ),
      defaultPageSize = 5,
      minRows = 5,
      elementId = "cars-grouping-table"
    )
  )
)
```

Group by

None Manufacturer Model Type

------------------------------------------------------------------------

Manufacturer

Model

Type

Sales

Volvo

850

Midsize

\$26.70

Volkswagen

Corrado

Sporty

\$23.30

Volvo

240

Compact

\$22.70

Volkswagen

Passat

Compact

\$20.00

Volkswagen

Corrado

Sporty

\$23.30

1–5 of 30 rows

Previous

1

2

3

4

5

6

Next

### Row expansion toggle button

``` r
library(htmltools)

data <- MASS::Cars93[1:5, c("Manufacturer", "Model", "Type", "Price")]

htmltools::browsable(
  tagList(
    tags$button(
      "Expand/collapse all",
      onclick = "Reactable.toggleAllRowsExpanded('cars-expansion-table')"
    ),

    reactable(
      data,
      groupBy = "Manufacturer",
      defaultPageSize = 5,
      elementId = "cars-expansion-table"
    )
  )
)
```

Expand/collapse all

Manufacturer

Model

Type

Price

​

Acura (2)

​

Audi (2)

​

BMW (1)

### Column visibility toggle button

New in v0.4.0

``` r
library(htmltools)

data <- MASS::Cars93[1:5, c("Manufacturer", "Model", "Type", "Price",
                            "Passengers", "DriveTrain", "Cylinders", "EngineSize")]

htmltools::browsable(
  tagList(
    tags$button(
      "Show/hide more columns",
      onclick = "Reactable.setHiddenColumns('cars-vis-table', prevColumns => {
        return prevColumns.length === 0 ? ['Passengers', 'DriveTrain', 'Cylinders', 'EngineSize'] : []
      })"
    ),
    reactable(
      data,
      columns = list(
        Passengers = colDef(show = FALSE),
        DriveTrain = colDef(show = FALSE),
        Cylinders = colDef(show = FALSE),
        EngineSize = colDef(show = FALSE)
      ),
      elementId = "cars-vis-table"
    )
  )
)
```

Show/hide more columns

Manufacturer

Model

Type

Price

Acura

Integra

Small

15.9

Acura

Legend

Midsize

33.9

Audi

90

Compact

29.1

Audi

100

Midsize

37.7

BMW

535i

Midsize

30
