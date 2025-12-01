# Twitter Followers

## Candidates whose followers are loyal only to them

Share of each 2020 candidate's followers who don't follow any other
candidates

account

followers

Exclusive Followers

[@marwilliamson](https://twitter.com/marwilliamson)

2,610,335

74.8%

[@BernieSanders](https://twitter.com/BernieSanders)

9,254,423

63.2

[@Hickenlooper](https://twitter.com/Hickenlooper)

144,816

56.3

[@CoryBooker](https://twitter.com/CoryBooker)

4,246,252

52.5

[@JoeBiden](https://twitter.com/JoeBiden)

3,558,333

43.8

[@AndrewYang](https://twitter.com/AndrewYang)

267,897

43.4

[@TulsiGabbard](https://twitter.com/TulsiGabbard)

349,443

34.7

[@BetoORourke](https://twitter.com/BetoORourke)

1,424,745

26.5

[@amyklobuchar](https://twitter.com/amyklobuchar)

692,985

24.0

[@PeteButtigieg](https://twitter.com/PeteButtigieg)

1,033,834

23.7

[@SenGillibrand](https://twitter.com/SenGillibrand)

1,410,303

23.3

[@KamalaHarris](https://twitter.com/KamalaHarris)

2,640,072

22.3

[@JulianCastro](https://twitter.com/JulianCastro)

212,582

21.4

[@sethmoulton](https://twitter.com/sethmoulton)

138,450

20.1

[@JayInslee](https://twitter.com/JayInslee)

51,504

19.0

[@ewarren](https://twitter.com/ewarren)

2,486,101

16.4

[@TimRyan](https://twitter.com/TimRyan)

20,080

15.6

[@JohnDelaney](https://twitter.com/JohnDelaney)

20,266

12.9

[@MichaelBennet](https://twitter.com/MichaelBennet)

21,053

11.7

[@ericswalwell](https://twitter.com/ericswalwell)

84,415

9.2

------------------------------------------------------------------------

Source:
[FiveThirtyEight](https://fivethirtyeight.com/features/which-2020-candidates-have-the-most-in-common-on-twitter/)

Raw data: [`twitter_followers.csv`](twitter_followers.csv)

How it was made: [Building the Twitter Followers
Demo](../building-twitter-followers.md)

## Source Code

``` r
library(reactable)
library(htmltools)

data <- read.csv("twitter_followers.csv", stringsAsFactors = FALSE)

tbl <- reactable(
  data,
  pagination = FALSE,
  defaultSorted = "exclusive_followers_pct",
  defaultColDef = colDef(headerClass = "header", align = "left"),
  columns = list(
    account = colDef(
      cell = function(value) {
        url <- paste0("https://twitter.com/", value)
        tags$a(href = url, target = "_blank", paste0("@", value))
      },
      width = 150
    ),
    followers = colDef(
      defaultSortOrder = "desc",
      cell = function(value) {
        width <- paste0(value * 100 / max(data$followers), "%")
        value <- format(value, big.mark = ",")
        value <- format(value, width = 9, justify = "right")
        bar <- div(
          class = "bar-chart",
          style = list(marginRight = "0.375rem"),
          div(class = "bar", style = list(width = width, backgroundColor = "#3fc1c9"))
        )
        div(class = "bar-cell", span(class = "number", value), bar)
      }
    ),
    exclusive_followers_pct = colDef(
      name = "Exclusive Followers",
      defaultSortOrder = "desc",
      cell = JS('function(cellInfo) {
        // Format as percentage
        const pct = (cellInfo.value * 100).toFixed(1) + "%"
        // Pad single-digit numbers
        let value = pct.padStart(5)
        // Show % on first row only
        if (cellInfo.viewIndex > 0) {
          value = value.replace("%", " ")
        }
        // Render bar chart
        return `
          <div class="bar-cell">
            <span class="number">${value}</span>
            <div class="bar-chart" style="background-color: #e1e1e1">
              <div class="bar" style="width: ${pct}; background-color: #fc5185"></div>
            </div>
          </div>
        `
      }'),
      html = TRUE
    )
  ),
  compact = TRUE,
  class = "followers-tbl"
)

div(class = "twitter-followers",
  div(class = "followers-header",
    h2(class = "followers-title", "Candidates whose followers are loyal only to them"),
    "Share of each 2020 candidate's followers who don't follow any other candidates"
  ),
  tbl
)
```

``` r
htmltools::tags$link(href = "https://fonts.googleapis.com/css?family=Karla:400,700|Fira+Mono&display=fallback", rel = "stylesheet")
```

``` css
.twitter-followers {
  margin: 0 auto;
  width: 575px;
  font-family: Karla, "Helvetica Neue", Helvetica, Arial, sans-serif;
}

.followers-header {
  margin: 1.125rem 0;
  font-size: 1rem;
}

.followers-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.followers-tbl {
  font-size: 0.875rem;
  line-height: 1.125rem;
}

.followers-tbl a {
  color: inherit;
  text-decoration: none;
}

.followers-tbl a:hover,
.followers-tbl a:focus {
  text-decoration: underline;
  text-decoration-thickness: max(1px, 0.0625rem);
}

.header {
  border-bottom: 2px solid #555;
  font-size: 0.8125rem;
  font-weight: 400;
  text-transform: uppercase;
}

.header:hover {
  background-color: #eee;
}

.bar-cell {
  display: flex;
  align-items: center;
}

.number {
  font-family: "Fira Mono", Consolas, Monaco, monospace;
  font-size: 0.84375rem;
  white-space: pre;
}

.bar-chart {
  flex-grow: 1;
  margin-left: 0.375rem;
  height: 0.875rem;
}

.bar {
  height: 100%;
}
```
