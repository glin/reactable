# Women's World Cup Predictions

## 2019 Women's World Cup Predictions

Soccer Power Index (SPI) ratings and chances of advancing for every team

​

Team Rating

Chance of Finishing Group Stage In ...

Knockout Stage Chances

team

group

spi

Off.

Def.

1st Place

2nd Place

3rd Place

Make Round of 16

Make Qtr-Finals

Make Semifinals

Make Final

Win World Cup

![USA flag](images/USA.png)

USA6 pts.

F

98.3

5.5

0.6

83%

17%

–

✓

78%

47%

35%

24%

![France flag](images/France.png)

France6 pts.

A

96.3

4.3

0.5

\>99%

\<1%

\<1%

✓

78%

42%

30%

19%

![Germany flag](images/Germany.png)

Germany6 pts.

B

93.8

4.0

0.7

98%

2%

–

✓

89%

48%

28%

12%

![Canada flag](images/Canada.png)

Canada6 pts.

E

93.5

3.7

0.6

39%

61%

–

✓

59%

36%

20%

9%

![England flag](images/England.png)

England6 pts.

D

91.9

3.5

0.6

71%

29%

–

✓

69%

43%

16%

8%

![Netherlands flag](images/Netherlands.png)

Netherlands6 pts.

E

92.7

3.9

0.7

61%

39%

–

✓

59%

37%

19%

8%

![Australia flag](images/Australia.png)

Australia3 pts.

C

92.8

4.2

0.9

13%

54%

34%

\>99%

54%

26%

10%

5%

![Sweden flag](images/Sweden.png)

Sweden6 pts.

F

88.4

3.0

0.6

17%

83%

–

✓

47%

20%

10%

4%

![Japan flag](images/Japan.png)

Japan4 pts.

D

90.3

3.8

0.9

29%

63%

8%

✓

46%

27%

9%

4%

![Brazil flag](images/Brazil.png)

Brazil3 pts.

C

89.5

3.6

0.9

26%

22%

52%

\>99%

43%

17%

7%

3%

![Spain flag](images/Spain.png)

Spain3 pts.

B

86.5

3.1

0.8

1%

70%

29%

\>99%

31%

11%

5%

2%

![Norway flag](images/Norway.png)

Norway3 pts.

A

83.7

3.0

0.9

\<1%

94%

5%

\>99%

44%

18%

4%

2%

![China flag](images/China.png)

China3 pts.

B

82.7

2.7

0.8

\<1%

29%

70%

93%

34%

11%

3%

\<1%

![Italy flag](images/Italy.png)

Italy6 pts.

C

76.1

3.0

1.3

61%

24%

15%

✓

37%

9%

2%

\<1%

![New Zealand flag](images/New%20Zealand.png)

New Zealand0 pts.

E

77.6

2.8

1.2

–

–

48%

40%

10%

4%

\<1%

\<1%

![Nigeria flag](images/Nigeria.png)

Nigeria3 pts.

A

71.7

2.4

1.1

\<1%

5%

91%

50%

13%

3%

\<1%

\<1%

![Cameroon flag](images/Cameroon.png)

Cameroon0 pts.

E

65.8

2.1

1.2

–

–

52%

23%

4%

1%

\<1%

\<1%

![South Korea flag](images/South%20Korea.png)

South Korea0 pts.

A

76.4

2.7

1.1

–

\<1%

4%

2%

\<1%

\<1%

\<1%

\<1%

![Scotland flag](images/Scotland.png)

Scotland0 pts.

D

54.0

2.0

1.7

–

–

53%

52%

3%

\<1%

\<1%

\<1%

![Argentina flag](images/Argentina.png)

Argentina1 pts.

D

39.2

1.5

1.9

–

8%

40%

25%

\<1%

\<1%

\<1%

\<1%

![Jamaica flag](images/Jamaica.png)

Jamaica0 pts.

C

53.5

2.5

2.1

–

–

\<1%

\<1%

\<1%

–

–

–

![Thailand flag](images/Thailand.png)

Thailand0 pts.

F

40.7

2.0

2.4

–

–

34%

2%

\<1%

\<1%

–

–

![South Africa flag](images/South%20Africa.png)

South Africa0 pts.

B

56.7

1.7

1.3

–

–

\<1%

\<1%

\<1%

\<1%

\<1%

–

![Chile flag](images/Chile.png)

Chile0 pts.

F

46.5

1.8

1.8

–

–

66%

15%

\<1%

\<1%

\<1%

–

Forecast from before 3rd group matches

------------------------------------------------------------------------

Source:
[FiveThirtyEight](https://projects.fivethirtyeight.com/2019-womens-world-cup-predictions/)

Raw data: [`wwc_forecasts.csv`](wwc_forecasts.csv)

## Source Code

Full source:
[`vignettes/womens-world-cup/womens-world-cup.Rmd`](https://github.com/glin/reactable/blob/main/vignettes/womens-world-cup/womens-world-cup.Rmd)

``` r
library(reactable)
library(htmltools)

forecasts <- read.csv("wwc_forecasts.csv", stringsAsFactors = FALSE)

rating_cols <- c("spi", "global_o", "global_d")
group_cols <- c("group_1", "group_2", "group_3")
knockout_cols <- c("make_round_of_16", "make_quarters", "make_semis", "make_final", "win_league")
forecasts <- forecasts[, c("team", "points", "group", rating_cols, group_cols, knockout_cols)]

rating_column <- function(maxWidth = 55, ...) {
  colDef(maxWidth = maxWidth, align = "center", class = "cell number", ...)
}

group_column <- function(class = NULL, ...) {
  colDef(cell = format_pct, maxWidth = 70, align = "center", class = paste("cell number", class), ...)
}

knockout_column <- function(maxWidth = 70, class = NULL, ...) {
  colDef(
    cell = format_pct,
    maxWidth = maxWidth,
    class = paste("cell number", class),
    style = function(value) {
      # Lighter color for <1%
      if (value < 0.01) {
        list(color = "#aaa")
      } else {
        list(color = "#111", background = knockout_pct_color(value))
      }
    },
    ...
  )
}

format_pct <- function(value) {
  if (value == 0) "  \u2013 "    # en dash for 0%
  else if (value == 1) "\u2713"  # checkmark for 100%
  else if (value < 0.01) " <1%"
  else if (value > 0.99) ">99%"
  else formatC(paste0(round(value * 100), "%"), width = 4)
}

make_color_pal <- function(colors, bias = 1) {
  get_color <- colorRamp(colors, bias = bias)
  function(x) rgb(get_color(x), maxColorValue = 255)
}

off_rating_color <- make_color_pal(c("#ff2700", "#f8fcf8", "#44ab43"), bias = 1.3)
def_rating_color <- make_color_pal(c("#ff2700", "#f8fcf8", "#44ab43"), bias = 0.6)
knockout_pct_color <- make_color_pal(c("#ffffff", "#f2fbd2", "#c9ecb4", "#93d3ab", "#35b0ab"), bias = 2)

tbl <- reactable(
  forecasts,
  pagination = FALSE,
  defaultSorted = "win_league",
  defaultSortOrder = "desc",
  defaultColGroup = colGroup(headerVAlign = "bottom"),
  columnGroups = list(
    colGroup(name = "Team Rating", columns = rating_cols),
    colGroup(name = "Chance of Finishing Group Stage In ...", columns = group_cols),
    colGroup(name = "Knockout Stage Chances", columns = knockout_cols)
  ),
  defaultColDef = colDef(
    vAlign = "center",
    headerVAlign = "bottom",
    class = "cell",
    headerClass = "header"
  ),
  columns = list(
    team = colDef(
      defaultSortOrder = "asc",
      minWidth = 200,
      headerStyle = list(fontWeight = 700),
      cell = function(value, index) {
        div(
          class = "team",
          img(class = "team-flag", alt = paste(value, "flag"), src = sprintf("images/%s.png", value)),
          div(
            span(class = "team-name", value),
            span(class = "team-record", sprintf("%s pts.", forecasts[index, "points"]))
          )
        )
      }
    ),
    points = colDef(show = FALSE),
    group = colDef(defaultSortOrder = "asc", align = "center", maxWidth = 75,
                   class = "cell group", headerStyle = list(fontWeight = 700)),
    spi = rating_column(format = colFormat(digits = 1)),
    global_o = rating_column(
      name = "Off.",
      cell = function(value) {
        scaled <- (value - min(forecasts$global_o)) / (max(forecasts$global_o) - min(forecasts$global_o))
        color <- off_rating_color(scaled)
        value <- format(round(value, 1), nsmall = 1)
        div(class = "spi-rating", style = list(background = color), value)
      }
    ),
    global_d = rating_column(
      name = "Def.", 
      defaultSortOrder = "asc",
      cell = function(value) {
        scaled <- 1 - (value - min(forecasts$global_d)) / (max(forecasts$global_d) - min(forecasts$global_d))
        color <- def_rating_color(scaled)
        value <- format(round(value, 1), nsmall = 1)
        div(class = "spi-rating", style = list(background = color), value)
      }
    ),
    group_1 = group_column(name = "1st Place", class = "border-left"),
    group_2 = group_column(name = "2nd Place"),
    group_3 = group_column(name = "3rd Place"),
    make_round_of_16 = knockout_column(name = "Make Round of 16", class = "border-left"),
    make_quarters = knockout_column(name = "Make Qtr-Finals"),
    make_semis = knockout_column(name = "Make Semifinals", maxWidth = 90),
    make_final = knockout_column(name = "Make Final"),
    win_league = knockout_column(name = "Win World Cup")
  ),
  # Emphasize borders between groups when sorting by group
  rowClass = JS("
    function(rowInfo, state) {
      const firstSorted = state.sorted[0]
      if (firstSorted && firstSorted.id === 'group') {
        const nextRow = state.pageRows[rowInfo.viewIndex + 1]
        if (nextRow && rowInfo.values['group'] !== nextRow.group) {
          return 'group-last'
        }
      }
    }"
  ),
  showSortIcon = FALSE,
  borderless = TRUE,
  class = "standings-table"
)

div(class = "standings",
  div(class = "title",
    h2("2019 Women's World Cup Predictions"),
    "Soccer Power Index (SPI) ratings and chances of advancing for every team"
  ),
  tbl,
  "Forecast from before 3rd group matches"
)
```

``` r
htmltools::tags$link(
  href = "https://fonts.googleapis.com/css?family=Karla:400,700|Fira+Mono&display=fallback",
  rel = "stylesheet"
)
```

``` css
.standings {
  font-family: Karla, "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 0.875rem;
}

.title {
  margin-top: 2rem;
  margin-bottom: 1.125rem;
  font-size: 1rem;
}

.title h2 {
  font-size: 1.25rem;
  font-weight: 600;
}

.standings-table {
  margin-bottom: 1.25rem;
}

.header {
  border-bottom-color: #555;
  font-size: 0.8125rem;
  font-weight: 400;
  text-transform: uppercase;
}

/* Highlight headers when sorting */
.header:hover,
.header:focus,
.header[aria-sort="ascending"],
.header[aria-sort="descending"] {
  background-color: #eee;
}

.border-left {
  border-left: 2px solid #555;
}

/* Use box-shadow to create row borders that appear behind vertical borders */
.cell {
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.15);
}

.group-last .cell {
  box-shadow: inset 0 -2px 0 #555;
}

.team {
  display: flex;
  align-items: center;
}

.team-flag {
  height: 1.3rem;
  border: 1px solid #f0f0f0;
}

.team-name {
  margin-left: 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
}

.team-record {
  margin-left: 0.35rem;
  color: hsl(0, 0%, 45%);
  font-size: 0.8125rem;
}

.group {
  font-size: 1.1875rem;
}

.number {
  font-family: "Fira Mono", Consolas, Monaco, monospace;
  font-size: 1rem;
  white-space: pre;
}

.spi-rating {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: auto;
  width: 1.875rem;
  height: 1.875rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  color: #000;
  font-size: 0.8125rem;
  letter-spacing: -1px;
}
```
