# Demo Cookbook

A collection of recipes used to create the reactable demos.

## Insert links

``` r
data <- data.frame(
  Address = c("https://google.com", "https://yahoo.com", "https://duckduckgo.com"),
  Site = c("Google", "Yahoo", "DuckDuckGo")
)

reactable(
  data,
  columns = list(
    # Using htmltools to render a link
    Address = colDef(cell = function(value) {
      htmltools::tags$a(href = value, target = "_blank", value)
    }),
    # Or using raw HTML
    Site = colDef(html = TRUE, cell = function(value, index) {
      sprintf('<a href="%s" target="_blank">%s</a>', data$Address[index], value)
    })
  )
)
```

Address

Site

[https://google.com](https://google.com)

[Google](https://google.com)

[https://yahoo.com](https://yahoo.com)

[Yahoo](https://yahoo.com)

[https://duckduckgo.com](https://duckduckgo.com)

[DuckDuckGo](https://duckduckgo.com)

## Conditional formatting

### Color scales

To add color scales, you can use [R’s built-in color
utilities](https://bookdown.org/rdpeng/exdata/plotting-and-color-in-r.html#color-utilities-in-r)
(or other color manipulation package):

``` r
data <- iris[10:29, ]
orange_pal <- function(x) rgb(colorRamp(c("#ffe4cc", "#ff9500"))(x), maxColorValue = 255)

reactable(
  data,
  columns = list(
    Petal.Length = colDef(style = function(value) {
      normalized <- (value - min(data$Petal.Length)) / (max(data$Petal.Length) - min(data$Petal.Length))
      color <- orange_pal(normalized)
      list(background = color)
    })
  )
)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

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

1–10 of 20 rows

Previous

1

2

Next

``` r
dimnames <- list(start(nottem)[1]:end(nottem)[1], month.abb)
temps <- matrix(nottem, ncol = 12, byrow = TRUE, dimnames = dimnames)

# ColorBrewer-inspired 3-color scale
BuYlRd <- function(x) rgb(colorRamp(c("#7fb7d7", "#ffffbf", "#fc8d59"))(x), maxColorValue = 255)

reactable(
  temps,
  defaultColDef = colDef(
    style = function(value) {
      if (!is.numeric(value)) return()
      normalized <- (value - min(nottem)) / (max(nottem) - min(nottem))
      color <- BuYlRd(normalized)
      list(background = color)
    },
    format = colFormat(digits = 1),
    minWidth = 50
  ),
  columns = list(
    .rownames = colDef(name = "Year", sortable = TRUE, align = "left")
  ),
  bordered = TRUE
)
```

Year

Jan

Feb

Mar

Apr

May

Jun

Jul

Aug

Sep

Oct

Nov

Dec

1920

40.6

40.8

44.4

46.7

54.1

58.5

57.7

56.4

54.3

50.5

42.9

39.8

1921

44.2

39.8

45.1

47.0

54.1

58.7

66.3

59.9

57.0

54.2

39.7

42.8

1922

37.5

38.7

39.5

42.1

55.7

57.8

56.8

54.3

54.3

47.1

41.8

41.7

1923

41.8

40.1

42.9

45.8

49.2

52.7

64.2

59.6

54.4

49.2

36.3

37.6

1924

39.3

37.5

38.3

45.5

53.2

57.7

60.8

58.2

56.4

49.8

44.4

43.6

1925

40.0

40.5

40.8

45.1

53.8

59.4

63.5

61.0

53.0

50.0

38.1

36.3

1926

39.2

43.4

43.4

48.9

50.6

56.8

62.5

62.0

57.5

46.7

41.6

39.8

1927

39.4

38.5

45.3

47.1

51.7

55.0

60.4

60.5

54.7

50.3

42.3

35.2

1928

40.8

41.1

42.8

47.3

50.9

56.4

62.2

60.5

55.4

50.2

43.0

37.3

1929

34.8

31.3

41.0

43.9

53.1

56.9

62.5

60.3

59.8

49.2

42.9

41.9

1–10 of 20 rows

Previous

1

2

Next

### Formatting changes

``` r
stocks <- data.frame(
  Symbol = c("GOOG", "FB", "AMZN", "NFLX", "TSLA"),
  Price = c(1265.13, 187.89, 1761.33, 276.82, 328.13),
  Change = c(4.14, 1.51, -19.45, 5.32, -12.45)
)

reactable(
  stocks,
  columns = list(
    Change = colDef(
      cell = function(value) {
        if (value >= 0) paste0("+", value) else value
      },
      style = function(value) {
        color <- if (value > 0) {
          "#008000"
        } else if (value < 0) {
          "#e00000"
        }
        list(fontWeight = 600, color = color)
      }
    )
  )
)
```

Symbol

Price

Change

GOOG

1265.13

+4.14

FB

187.89

+1.51

AMZN

1761.33

-19.45

NFLX

276.82

+5.32

TSLA

328.13

-12.45

### Tags and badges

``` r
library(htmltools)

orders <- data.frame(
  Order = 2300:2304,
  Created = seq(as.Date("2019-04-01"), by = "day", length.out = 5),
  Customer = sample(rownames(MASS::painters), 5),
  Status = sample(c("Pending", "Paid", "Canceled"), 5, replace = TRUE),
  stringsAsFactors = FALSE
)

reactable(
  orders,
  columns = list(
    Status = colDef(cell = function(value) {
      class <- paste0("tag status-", tolower(value))
      div(class = class, value)
    })
  )
)
```

``` css
.tag {
  display: inline-block;
  padding: 0.125rem 0.75rem;
  border-radius: 15px;
  font-weight: 600;
  font-size: 0.75rem;
}

.status-paid {
  background: hsl(116, 60%, 90%);
  color: hsl(116, 30%, 25%);
}

.status-pending {
  background: hsl(230, 70%, 90%);
  color: hsl(230, 45%, 30%);
}

.status-canceled {
  background: hsl(350, 70%, 90%);
  color: hsl(350, 45%, 30%);
}
```

Order

Created

Customer

Status

2300

2019-04-01

Lanfranco

Paid

2301

2019-04-02

Van Leyden

Paid

2302

2019-04-03

Da Vinci

Pending

2303

2019-04-04

Caravaggio

Canceled

2304

2019-04-05

Pordenone

Canceled

``` r
library(htmltools)

status_badge <- function(color = "#aaa", width = "0.55rem", height = width) {
  span(style = list(
    display = "inline-block",
    marginRight = "0.5rem",
    width = width,
    height = height,
    backgroundColor = color,
    borderRadius = "50%"
  ))
}

reactable(
  orders,
  columns = list(
    Status = colDef(cell = function(value) {
      color <- switch(
        value,
        Paid = "hsl(214, 45%, 50%)",
        Pending = "hsl(30, 97%, 70%)",
        Canceled = "hsl(3, 69%, 50%)"
      )
      badge <- status_badge(color = color)
      tagList(badge, value)
    })
  )
)
```

Order

Created

Customer

Status

2300

2019-04-01

Lanfranco

Paid

2301

2019-04-02

Van Leyden

Paid

2302

2019-04-03

Da Vinci

Pending

2303

2019-04-04

Caravaggio

Canceled

2304

2019-04-05

Pordenone

Canceled

## Bar charts

There are many ways to create bar charts using HTML and CSS, but here’s
one way inspired by [Making Charts with
CSS](https://css-tricks.com/making-charts-with-css/).

``` r
library(htmltools)

# Render a bar chart with a label on the left
bar_chart <- function(label, width = "100%", height = "1rem", fill = "#00bfc4", background = NULL) {
  bar <- div(style = list(background = fill, width = width, height = height))
  chart <- div(style = list(flexGrow = 1, marginLeft = "0.5rem", background = background), bar)
  div(style = list(display = "flex", alignItems = "center"), label, chart)
}

data <- MASS::Cars93[20:49, c("Make", "MPG.city", "MPG.highway")]

reactable(
  data,
  columns = list(
    MPG.city = colDef(name = "MPG (city)", align = "left", cell = function(value) {
      width <- paste0(value / max(data$MPG.city) * 100, "%")
      bar_chart(value, width = width)
    }),
    MPG.highway = colDef(name = "MPG (highway)", align = "left", cell = function(value) {
      width <- paste0(value / max(data$MPG.highway) * 100, "%")
      bar_chart(value, width = width, fill = "#fc5185", background = "#e1e1e1")
    })
  )
)
```

Make

MPG (city)

MPG (highway)

Chrylser Concorde

20

28

Chrysler LeBaron

23

28

Chrysler Imperial

20

26

Dodge Colt

29

33

Dodge Shadow

23

29

Dodge Spirit

22

27

Dodge Caravan

17

21

Dodge Dynasty

21

27

Dodge Stealth

18

24

Eagle Summit

29

33

1–10 of 30 rows

Previous

1

2

3

Next

### Positive and negative values

``` r
library(htmltools)

# Render a bar chart with positive and negative values
bar_chart_pos_neg <- function(label, value, max_value = 1, height = "1rem",
                              pos_fill = "#005ab5", neg_fill = "#dc3220") {
  neg_chart <- div(style = list(flex = "1 1 0"))
  pos_chart <- div(style = list(flex = "1 1 0"))
  width <- paste0(abs(value / max_value) * 100, "%")

  if (value < 0) {
    bar <- div(style = list(marginLeft = "0.5rem", background = neg_fill, width = width, height = height))
    chart <- div(
      style = list(display = "flex", alignItems = "center", justifyContent = "flex-end"),
      label,
      bar
    )
    neg_chart <- tagAppendChild(neg_chart, chart)
  } else {
    bar <- div(style = list(marginRight = "0.5rem", background = pos_fill, width = width, height = height))
    chart <- div(style = list(display = "flex", alignItems = "center"), bar, label)
    pos_chart <- tagAppendChild(pos_chart, chart)
  }

  div(style = list(display = "flex"), neg_chart, pos_chart)
}

data <- data.frame(
  company = sprintf("Company%02d", 1:10),
  profit_chg = c(0.2, 0.685, 0.917, 0.284, 0.105, -0.701, -0.528, -0.808, -0.957, -0.11)
)

reactable(
  data,
  bordered = TRUE,
  columns = list(
    company = colDef(name = "Company", minWidth = 100),
    profit_chg = colDef(
      name = "Change in Profit",
      defaultSortOrder = "desc",
      cell = function(value) {
        label <- paste0(round(value * 100), "%")
        bar_chart_pos_neg(label, value)
      },
      align = "center",
      minWidth = 400
    )
  )
)
```

Company

Change in Profit

Company01

20%

Company02

68%

Company03

92%

Company04

28%

Company05

10%

Company06

-70%

Company07

-53%

Company08

-81%

Company09

-96%

Company10

-11%

### Background bar charts

Another way to create bar charts is to render them as background images.
This example creates bar images using the [`linear-gradient()` CSS
function](https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient()),
inspired by an [example from the DT
package](https://rstudio.github.io/DT/010-style.html).

``` r
# Render a bar chart in the background of the cell
bar_style <- function(width = 1, fill = "#e6e6e6", height = "75%",
                      align = c("left", "right"), color = NULL) {
  align <- match.arg(align)
  if (align == "left") {
    position <- paste0(width * 100, "%")
    image <- sprintf("linear-gradient(90deg, %1$s %2$s, transparent %2$s)", fill, position)
  } else {
    position <- paste0(100 - width * 100, "%")
    image <- sprintf("linear-gradient(90deg, transparent %1$s, %2$s %1$s)", position, fill)
  }
  list(
    backgroundImage = image,
    backgroundSize = paste("100%", height),
    backgroundRepeat = "no-repeat",
    backgroundPosition = "center",
    color = color
  )
}

data <- mtcars[, 1:4]

reactable(
  data,
  columns = list(
    mpg = colDef(
      style = function(value) {
        bar_style(width = value / max(data$mpg), fill = "#2c5e77", color = "#fff")
      },
      align = "left",
      format = colFormat(digits = 1)
    ),
    disp = colDef(
      style = function(value) {
        bar_style(width = value / max(data$disp), fill = "hsl(208, 70%, 90%)")
      }
    ),
    hp = colDef(
      style = function(value) {
        bar_style(width = value / max(data$hp), height = "90%", align = "right")
      }
    )
  ),
  bordered = TRUE
)
```

mpg

cyl

disp

hp

Mazda RX4

21.0

6

160

110

Mazda RX4 Wag

21.0

6

160

110

Datsun 710

22.8

4

108

93

Hornet 4 Drive

21.4

6

258

110

Hornet Sportabout

18.7

8

360

175

Valiant

18.1

6

225

105

Duster 360

14.3

8

360

245

Merc 240D

24.4

4

146.7

62

Merc 230

22.8

4

140.8

95

Merc 280

19.2

6

167.6

123

1–10 of 32 rows

Previous

1

2

3

4

Next

## Embed images

To embed an image, render an [`<img>`
element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img)
into the table. Be sure to add [`alt`
text](https://webaim.org/techniques/alttext/) for accessibility, even if
the image is purely decorative (use a null `alt=""` attribute in this
case).

### External image files

``` r
library(htmltools)

data <- data.frame(
  Animal = c("beaver", "cow", "wolf", "goat"),
  Body = c(1.35, 465, 36.33, 27.66),
  Brain = c(8.1, 423, 119.5, 115)
)

reactable(
  data,
  columns = list(
    Animal = colDef(cell = function(value) {
      image <- img(src = sprintf("images/%s.png", value), style = "height: 24px;", alt = value)
      tagList(
        div(style = "display: inline-block; width: 45px;", image),
        value
      )
    }),
    Body = colDef(name = "Body (kg)"),
    Brain = colDef(name = "Brain (g)")
  )
)
```

Animal

Body (kg)

Brain (g)

![beaver](images/beaver.png)

beaver

1.35

8.1

![cow](images/cow.png)

cow

465

423

![wolf](images/wolf.png)

wolf

36.33

119.5

![goat](images/goat.png)

goat

27.66

115

If the image file is local, ensure the image can be found from the
rendered document:

- In pkgdown, you can include local images in your document using the
  `resource_files` YAML field. See [External files in
  pkgdown](https://pkgdown.r-lib.org/reference/build_articles.html#external-files)
  for details.
- In Shiny, you can include local images in your app using either the
  `www/` directory or
  [`shiny::addResourcePath()`](https://rdrr.io/pkg/shiny/man/resourcePaths.html)
  function. See [Resource Publishing in
  Shiny](https://shiny.rstudio.com/reference/shiny/latest/resourcePaths.html)
  for details.

### Inline embedded images

Images can also be embedded into documents as a [base64-encoded data
URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs)
using
[`knitr::image_uri()`](https://rdrr.io/pkg/knitr/man/image_uri.html).
This can be more portable, but is usually only recommended for small
image files.

``` r
library(htmltools)

data <- data.frame(
  Animal = c("beaver", "cow", "wolf", "goat"),
  Body = c(1.35, 465, 36.33, 27.66),
  Brain = c(8.1, 423, 119.5, 115)
)

reactable(
  data,
  columns = list(
    Animal = colDef(cell = function(value) {
      img_src <- knitr::image_uri(sprintf("images/%s.png", value))
      image <- img(src = img_src, style = "height: 24px;", alt = value)
      tagList(
        div(style = "display: inline-block; width: 45px", image),
        value
      )
    })
  )
)
```

Animal

Body

Brain

![beaver](data:image/png;base64,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)

beaver

1.35

8.1

![cow](data:image/png;base64,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)

cow

465

423

![wolf](data:image/png;base64,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)

wolf

36.33

119.5

![goat](data:image/png;base64,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)

goat

27.66

115

## Rating stars

This example uses [Font Awesome icons (via
Shiny)](https://shiny.rstudio.com/reference/shiny/latest/icon.html) to
render rating stars in a table.

To make the rating star icons accessible to users of assistive
technology, the icons are marked up as an image using the [ARIA `img`
role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/Role_Img),
and alternative text is added using an `aria-label` or `title`
attribute.

``` r
library(htmltools)

rating_stars <- function(rating, max_rating = 5) {
  star_icon <- function(empty = FALSE) {
    tagAppendAttributes(shiny::icon("star"),
      style = paste("color:", if (empty) "#edf0f2" else "orange"),
      "aria-hidden" = "true"
    )
  }
  rounded_rating <- floor(rating + 0.5)  # always round up
  stars <- lapply(seq_len(max_rating), function(i) {
    if (i <= rounded_rating) star_icon() else star_icon(empty = TRUE)
  })
  label <- sprintf("%s out of %s stars", rating, max_rating)
  div(title = label, role = "img", stars)
}

ratings <- data.frame(
  Movie = c("Silent Serpent", "Nowhere to Hyde", "The Ape-Man Goes to Mars", "A Menace in Venice"),
  Rating = c(3.65, 2.35, 4.5, 1.4),
  Votes = c(115, 37, 60, 99)
)

reactable(ratings, columns = list(
  Rating = colDef(cell = function(value) rating_stars(value))
))
```

Movie

Rating

Votes

Silent Serpent

115

Nowhere to Hyde

37

The Ape-Man Goes to Mars

60

A Menace in Venice

99

## Show data from other columns

This example requires reactable v0.3.0 or above.

To access data from another column, get the current row data using the
row index argument in an R render function, or `cellInfo.row` in a
JavaScript render function. This example shows both ways.

``` r
library(dplyr)
library(htmltools)

data <- starwars %>%
  select(character = name, height, mass, gender, homeworld, species)
```

### R render function

``` r
reactable(
  data,
  columns = list(
    character = colDef(
      # Show species under character names
      cell = function(value, index) {
        species <- data$species[index]
        species <- if (!is.na(species)) species else "Unknown"
        div(
          div(style = "font-weight: 600", value),
          div(style = "font-size: 0.75rem", species)
        )
      }
    ),
    species = colDef(show = FALSE)
  ),
  # Vertically center cells
  defaultColDef = colDef(vAlign = "center"),
  defaultPageSize = 6
)
```

character

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

1–6 of 87 rows

Previous

1

2

3

4

5

...

15

Next

### JavaScript render function

``` r
reactable(
  data,
  columns = list(
    character = colDef(
      # Show species under character names
      cell = JS('function(cellInfo) {
        const species = cellInfo.row["species"] || "Unknown"
        return `
          <div>
            <div style="font-weight: 600">${cellInfo.value}</div>
            <div style="font-size: 0.75rem">${species}</div>
          </div>
        `
      }'),
      html = TRUE
    ),
    species = colDef(show = FALSE)
  ),
  # Vertically center cells
  defaultColDef = colDef(vAlign = "center"),
  defaultPageSize = 6
)
```

character

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

1–6 of 87 rows

Previous

1

2

3

4

5

...

15

Next

## Total rows

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
    Sales = colDef(footer = sprintf("$%.2f", sum(data$Sales)))
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

### Dynamic totals

This example requires reactable v0.3.0 or above.

To update the total when filtering the table, calculate the total in a
JavaScript render function:

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

#### Totals with aggregated rows

``` r
reactable(
  data,
  groupBy = "Manufacturer",
  searchable = TRUE,
  columns = list(
    Manufacturer = colDef(footer = "Total"),
    Sales = colDef(
      aggregate = "sum",
      format = colFormat(currency = "USD"),
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

​

Chevrolet (2)

\$56.80

​

Chrylser (1)

\$18.40

​

Chrysler (2)

\$45.30

​

Dodge (6)

\$94.20

​

Eagle (2)

\$31.50

​

Ford (8)

\$119.70

​

Geo (2)

\$20.90

​

Honda (3)

\$49.40

​

Hyundai (4)

\$41.90

Total

​

​

\$478.10

## Nested tables

To create nested tables, use
[`reactable()`](../../reference/reactable.md) in a row details renderer:

``` r
library(dplyr)

data <- MASS::Cars93[18:47, ] %>%
  mutate(ID = as.character(18:47), Date = seq(as.Date("2019-01-01"), by = "day", length.out = 30)) %>%
  select(ID, Date, Manufacturer, Model, Type, Price)

sales_by_mfr <- group_by(data, Manufacturer) %>%
  summarize(Quantity = n(), Sales = sum(Price))

reactable(
  sales_by_mfr,
  details = function(index) {
    sales <- filter(data, Manufacturer == sales_by_mfr$Manufacturer[index]) %>% select(-Manufacturer)
    tbl <- reactable(sales, outlined = TRUE, highlight = TRUE, fullWidth = FALSE)
    htmltools::div(style = list(margin = "12px 45px"), tbl)
  },
  onClick = "expand",
  rowStyle = list(cursor = "pointer")
)
```

Manufacturer

Quantity

Sales

​

​

Chevrolet

2

56.8

​

​

Chrylser

1

18.4

​

​

Chrysler

2

45.3

​

​

Dodge

6

94.2

​

​

Eagle

2

31.5

​

​

Ford

8

119.7

​

​

Geo

2

20.9

​

​

Honda

3

49.4

​

​

Hyundai

4

41.9

## Units on first row only

To display a label on the first row only (even when sorting), use a
JavaScript render function to add the label when the [cell’s `viewIndex`
property](../custom-rendering.html#cellinfo-properties) is `0`.

If the label breaks the alignment of values in the column, realign the
values by adding white space to the cells without units. Two ways to do
this are shown below.

``` r
data <- MASS::Cars93[40:44, c("Make", "Length", "Luggage.room")]

reactable(
  data,
  class = "car-specs",
  columns = list(
    # Align values using white space (and a monospaced font)
    Length = colDef(
      cell = JS("function(cellInfo) {
        const units = cellInfo.viewIndex === 0 ? '\u2033' : ' '
        return cellInfo.value + units
      }"),
      class = "number"
    ),
    # Align values using a fixed-width container for units
    Luggage.room = colDef(
      name = "Luggage Room",
      cell = JS('function(cellInfo) {
        const units = cellInfo.viewIndex === 0 ? " ft³" : ""
        return cellInfo.value + `<div class="units">${units}</div>`
      }'),
      html = TRUE
    )
  )
)
```

``` css
.car-specs .number {
  font-family: "Courier New", Courier, monospace;
  white-space: pre;
}

.car-specs .units {
  display: inline-block;
  width: 1.125rem;
}
```

Make

Length

Luggage Room

Geo Storm

164″

11

ft³

Honda Prelude

175

8

Honda Civic

173

12

Honda Accord

185

14

Hyundai Excel

168

11

## Tooltips

To add tooltips to a column header, you can render the header as an
[`<abbr>`
element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr)
with a `title` attribute:

``` r
library(htmltools)
library(dplyr)

data <- as_tibble(mtcars[1:6, ], rownames = "car") %>%
  select(car:hp)

with_tooltip <- function(value, tooltip) {
  tags$abbr(style = "text-decoration: underline; text-decoration-style: dotted; cursor: help",
            title = tooltip, value)
}

reactable(
  data,
  columns = list(
    mpg = colDef(header = with_tooltip("mpg", "Miles per US gallon")),
    cyl = colDef(header = with_tooltip("cyl", "Number of cylinders")),
    disp = colDef(header = with_tooltip("disp", "Displacement (cubic inches)")),
    hp = colDef(header = with_tooltip("hp", "Gross horsepower"))
  )
)
```

car

mpg

cyl

disp

hp

Mazda RX4

21

6

160

110

Mazda RX4 Wag

21

6

160

110

Datsun 710

22.8

4

108

93

Hornet 4 Drive

21.4

6

258

110

Hornet Sportabout

18.7

8

360

175

Valiant

18.1

6

225

105

The [`title` attribute is
inaccessible](https://developer.paciellogroup.com/blog/2013/01/using-the-html-title-attribute-updated/)
to most keyboard, mobile, and screen reader users, however, so creating
tooltips like this is generally discouraged.

An alternate method would be to use the [tippy
package](https://tippy.john-coene.com/), which provides a
JavaScript-based tooltip that supports keyboard, touch, and screen
reader use.

``` r
library(htmltools)
library(dplyr)
library(tippy)

data <- as_tibble(mtcars[1:6, ], rownames = "car") %>%
  select(car:hp)

# See the ?tippy documentation to learn how to customize tooltips
with_tooltip <- function(value, tooltip, ...) {
  div(style = "text-decoration: underline; text-decoration-style: dotted; cursor: help",
      tippy(value, tooltip, ...))
}

reactable(
  data,
  columns = list(
    mpg = colDef(header = with_tooltip("mpg", "Miles per US gallon")),
    cyl = colDef(header = with_tooltip("cyl", "Number of cylinders"))
  )
)
```

car

disp

hp

Mazda RX4

21

6

160

110

Mazda RX4 Wag

21

6

160

110

Datsun 710

22.8

4

108

93

Hornet 4 Drive

21.4

6

258

110

Hornet Sportabout

18.7

8

360

175

Valiant

18.1

6

225

105

## Highlight cells

``` r
data <- MASS::road[11:17, ]

reactable(
  data,
  defaultColDef = colDef(
    style = function(value, index, name) {
      if (is.numeric(value) && value == max(data[[name]])) {
        list(fontWeight = "bold")
      }
    }
  )
)
```

deaths

drivers

popden

rural

temp

fuel

Georgia

1302

203

68

83

54

162

Idaho

262

41

8.1

40

36

29

Ill

2207

544

180

102

33

350

Ind

1410

254

129

89

37

196

Iowa

833

150

49

100

30

109

Kansas

669

136

27

124

42

94

Kent

911

147

76

65

44

104

## Highlight columns

``` r
reactable(
  iris[1:5, ],
  columns = list(
    Petal.Length = colDef(style = list(background = "rgba(0, 0, 0, 0.03)"))
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

## Highlight rows

``` r
reactable(
  iris[1:5, ],
  rowStyle = function(index) {
    if (index == 2) list(fontWeight = "bold")
    else if (iris[index, "Petal.Length"] >= 1.5) list(background = "rgba(0, 0, 0, 0.05)")
  }
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

## Highlight sorted headers

To style sortable headers on hover, select headers with an `aria-sort`
attribute and `:hover` pseudo-class in CSS:

``` r
reactable(iris[1:5, ], defaultColDef = colDef(headerClass = "sort-header"))
```

``` css
.sort-header[aria-sort]:hover {
  background: rgba(0, 0, 0, 0.03);
}
```

To style sorted headers, select headers with either an
`aria-sort="ascending"` or `aria-sort="descending"` attribute:

``` css
.sort-header[aria-sort="ascending"],
.sort-header[aria-sort="descending"] {
  background: rgba(0, 0, 0, 0.03);
}
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

## Highlight sorted columns

To style sorted columns, use a JavaScript function to style columns
based on the table’s sorted state:

``` r
reactable(
  iris[1:5, ],
  defaultSorted = "Sepal.Width",
  defaultColDef = colDef(
    style = JS("function(rowInfo, column, state) {
      // Highlight sorted columns
      for (let i = 0; i < state.sorted.length; i++) {
        if (state.sorted[i].id === column.id) {
          return { background: 'rgba(0, 0, 0, 0.03)' }
        }
      }
    }")
  )
)
```

Sepal.Length

Sepal.Width

Petal.Length

Petal.Width

Species

4.9

3

1.4

0.2

setosa

4.6

3.1

1.5

0.2

setosa

4.7

3.2

1.3

0.2

setosa

5.1

3.5

1.4

0.2

setosa

5

3.6

1.4

0.2

setosa

## Borders between groups of data

This example requires reactable v0.3.0 or above.

To add borders between groups, use an R or JavaScript function to style
rows based on the previous or next row’s data. If the table can be
sorted, use a JavaScript function to style rows only when the groups are
sorted.

``` r
library(dplyr)

data <- as_tibble(MASS::painters, rownames = "Painter") %>%
  filter(School %in% c("A", "B", "C")) %>%
  mutate(School = recode(School, A = "Renaissance", B = "Mannerist", C = "Seicento")) %>%
  select(Painter, School, everything()) %>%
  group_by(School) %>%
  slice(1:3)

reactable(
  data,
  defaultSorted = list(School = "asc", Drawing = "desc"),
  borderless = TRUE,
  rowStyle = JS("
    function(rowInfo, state) {
      // Ignore padding rows
      if (!rowInfo) return

      // Add horizontal separators between groups when sorting by school
      const firstSorted = state.sorted[0]
      if (firstSorted && firstSorted.id === 'School') {
        const nextRow = state.pageRows[rowInfo.viewIndex + 1]
        if (nextRow && rowInfo.values['School'] !== nextRow['School']) {
          // Use box-shadow to add a 2px border without taking extra space
          return { boxShadow: 'inset 0 -2px 0 rgba(0, 0, 0, 0.1)' }
        }
      }
    }
  ")
)
```

Painter

School

Composition

Drawing

Colour

Expression

Fr. Salviata

Mannerist

13

15

8

8

Parmigiano

Mannerist

10

15

6

6

F. Zucarro

Mannerist

10

13

8

8

Da Vinci

Renaissance

15

16

4

14

Del Piombo

Renaissance

8

13

16

7

Da Udine

Renaissance

10

8

16

3

Barocci

Seicento

14

15

6

10

Cortona

Seicento

16

14

12

6

Josepin

Seicento

10

10

6

2

## Merge cells

This example requires reactable v0.3.0 or above.

You can give the appearance of merged cells by hiding cells based on the
previous row’s data. Just like with the example above, you’ll need a
JavaScript style function for grouping to work with sorting, filtering,
and pagination.

``` r
library(dplyr)

data <- as_tibble(MASS::painters, rownames = "Painter") %>%
  filter(School %in% c("A", "B", "C")) %>%
  mutate(School = recode(School, A = "Renaissance", B = "Mannerist", C = "Seicento")) %>%
  select(School, Painter, everything()) %>%
  group_by(School) %>%
  slice(1:3)

reactable(
  data,
  columns = list(
    School = colDef(
      style = JS("function(rowInfo, column, state) {
        const firstSorted = state.sorted[0]
        // Merge cells if unsorted or sorting by school
        if (!firstSorted || firstSorted.id === 'School') {
          const prevRow = state.pageRows[rowInfo.viewIndex - 1]
          if (prevRow && rowInfo.values['School'] === prevRow['School']) {
            return { visibility: 'hidden' }
          }
        }
      }")
    )
  ),
  outlined = TRUE
)
```

School

Painter

Composition

Drawing

Colour

Expression

Renaissance

Da Udine

10

8

16

3

Renaissance

Da Vinci

15

16

4

14

Renaissance

Del Piombo

8

13

16

7

Mannerist

F. Zucarro

10

13

8

8

Mannerist

Fr. Salviata

13

15

8

8

Mannerist

Parmigiano

10

15

6

6

Seicento

Barocci

14

15

6

10

Seicento

Cortona

16

14

12

6

Seicento

Josepin

10

10

6

2

## Borders between columns

``` r
reactable(
  iris[1:5, ],
  columns = list(
    Sepal.Width = colDef(style = list(borderRight = "1px solid rgba(0, 0, 0, 0.1)")),
    Petal.Width = colDef(style = list(borderRight = "1px solid rgba(0, 0, 0, 0.1)"))
  ),
  borderless = TRUE
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

## Style nested rows

To style nested rows, use a JavaScript function to style rows based on
their [nesting `level`
property](../conditional-styling.html#rowinfo-properties):

``` r
data <- MASS::Cars93[4:8, c("Type", "Price", "MPG.city", "DriveTrain", "Man.trans.avail")]

reactable(
  data,
  groupBy = "Type",
  columns = list(
    Price = colDef(aggregate = "max"),
    MPG.city = colDef(aggregate = "mean", format = colFormat(digits = 1)),
    DriveTrain = colDef(aggregate = "unique"),
    Man.trans.avail = colDef(aggregate = "frequency")
  ),
  rowStyle = JS("function(rowInfo) {
    if (rowInfo.level > 0) {
      return { background: '#eee', borderLeft: '2px solid #ffa62d' }
    } else {
      return { borderLeft: '2px solid transparent' }
    }
  }"),
  defaultExpanded = TRUE
)
```

Type

Price

MPG.city

DriveTrain

Man.trans.avail

​

Midsize (3)

37.7

21.0

Front, Rear

Yes (2), No

​

Large (2)

23.7

17.5

Front, Rear

No (2)

## Custom fonts

Tables don’t have a default font, and just inherit the font properties
from their parent elements. (This may explain why tables look different
in R Markdown documents or Shiny apps vs. standalone pages).

To customize the table font, you can set a font on the page, or on the
table itself:

``` r
reactable(
  iris[1:5, ],
  style = list(fontFamily = "Work Sans, sans-serif", fontSize = "0.875rem"),
  defaultSorted = "Species"
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

To use a custom font that’s not installed on your users’ systems by
default, use the
[`@font-face`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face)
CSS rule to add the font and specify where to download it from.

Online font services such as [Google Fonts](https://fonts.google.com/)
can make this easier by hosting custom fonts and providing 1-2 lines of
HTML to copy into your document to use those fonts.

For example, to include a font from Google Fonts in an R Markdown
document, add a `<link>` tag pointing to the font stylesheet somewhere:

```` markdown
```{r, echo=FALSE}
# Add a custom font from Google Fonts
htmltools::tags$link(href = "https://fonts.googleapis.com/css?family=Work+Sans:400,600,700&display=fallback",
                     rel = "stylesheet")
```
````

Or in Shiny apps, the `<link>` tag can be included in the `<head>` of
the page via `ui`:

``` r
library(shiny)
library(reactable)

ui <- fluidPage(
  tags$head(
    tags$link(
      href = "https://fonts.googleapis.com/css?family=Work+Sans:400,600,700&display=fallback",
      rel = "stylesheet"
    ),
    tags$style("
      body {
        font-family: Work Sans, sans-serif;
      }
    ")
  ),
  reactable(
    MASS::Cars93[, 1:5],
    defaultSorted = "Price"
  )
)

server <- function(input, output) {}

shinyApp(ui, server)
```

For an example of using self-hosted custom fonts, see the [Popular
Movies](../popular-movies/popular-movies.md) demo.

**Tip:** The reactable package documentation uses the default system
fonts installed on your operating system (also known as a [system font
stack](https://css-tricks.com/snippets/css/system-font-stack)), which
load fast and look familiar:

``` css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
```

[Bootstrap 5 also uses a system font
stack](https://getbootstrap.com/docs/5.0/content/reboot/#native-font-stack)
by default.

## Custom sort indicators

To use a custom sort indicator, you can hide the default sort icon using
`reactable(showSortIcon = FALSE)` and add your own sort indicator.

This also hides the sort icon when a header is focused, so be sure to
add a visual focus indicator to ensure your table is accessible to
keyboard users (to test this, click the first table header then press
the Tab key to navigate to other headers).

Here’s an example that changes the sort indicator to a bar on the top or
bottom of the header (indicating an ascending or descending sort), and
adds a light background to headers when hovered or focused.

This example adds sort indicators using only CSS, and takes advantage of
the
[`aria-sort`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-sort)
attribute on table headers to style based on whether the column is
sorted in ascending or descending order.

``` r
reactable(
  MASS::Cars93[1:5, c("Manufacturer", "Model", "Type", "Min.Price", "Price")],
  showSortIcon = FALSE,
  bordered = TRUE,
  defaultSorted = "Type",
  defaultColDef = colDef(headerClass = "bar-sort-header")
)
```

``` css
.bar-sort-header:hover,
.bar-sort-header:focus {
  background: rgba(0, 0, 0, 0.03);
}

/* Add a top bar on ascending sort */
.bar-sort-header[aria-sort="ascending"] {
  box-shadow: inset 0 3px 0 0 rgba(0, 0, 0, 0.6);
}

/* Add a bottom bar on descending sort */
.bar-sort-header[aria-sort="descending"] {
  box-shadow: inset 0 -3px 0 0 rgba(0, 0, 0, 0.6);
}

/* Add an animation when toggling between ascending and descending sort */
.bar-sort-header {
  transition: box-shadow 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

Manufacturer

Model

Type

Min.Price

Price

Audi

90

Compact

25.9

29.1

Acura

Legend

Midsize

29.2

33.9

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

Acura

Integra

Small

12.9

15.9
