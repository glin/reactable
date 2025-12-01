# Column formatting options

Use `colFormat()` to add data formatting to a column.

## Usage

``` r
colFormat(
  prefix = NULL,
  suffix = NULL,
  digits = NULL,
  separators = FALSE,
  percent = FALSE,
  currency = NULL,
  datetime = FALSE,
  date = FALSE,
  time = FALSE,
  hour12 = NULL,
  locales = NULL
)
```

## Arguments

- prefix:

  Prefix string.

- suffix:

  Suffix string.

- digits:

  Number of decimal digits to use for numbers.

- separators:

  Whether to use grouping separators for numbers, such as thousands
  separators or thousand/lakh/crore separators. The format is
  locale-dependent.

- percent:

  Format number as a percentage? The format is locale-dependent.

- currency:

  Currency format. An ISO 4217 currency code such as `"USD"` for the US
  dollar, `"EUR"` for the euro, or `"CNY"` for the Chinese RMB. The
  format is locale-dependent.

- datetime:

  Format as a locale-dependent date-time?

- date:

  Format as a locale-dependent date?

- time:

  Format as a locale-dependent time?

- hour12:

  Whether to use 12-hour time (`TRUE`) or 24-hour time (`FALSE`). The
  default time convention is locale-dependent.

- locales:

  Locales to use for number, date, time, and currency formatting. A
  character vector of BCP 47 language tags, such as `"en-US"` for
  English (United States), `"hi"` for Hindi, or `"sv-SE"` for Swedish
  (Sweden). Defaults to the locale of the user's browser.

  Multiple locales may be specified to provide a fallback language in
  case a locale is unsupported. When multiple locales are specified, the
  first supported locale will be used.

  See a list of [common BCP 47 language
  tags](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oe376/6c085406-a698-4e12-9d4d-c3b0ee3dbc4a)
  for reference.

## Value

A column format object that can be used to customize data formatting in
[`colDef()`](colDef.md).

## See also

Custom cell rendering in [`colDef()`](colDef.md) to customize data
formatting beyond what the built-in formatters provide.

## Examples

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
  temp = colDef(format = colFormat(suffix = " \u00b0C")),
  percent = colDef(format = colFormat(percent = TRUE, digits = 1)),
  date = colDef(format = colFormat(date = TRUE, locales = "en-GB"))
))

{"x":{"tag":{"name":"Reactable","attribs":{"data":{"price_USD":[123456.56,132,5650.12],"price_INR":[350,23208.552,1773156.4],"number_FR":[123456.56,132,5650.12],"temp":[22,"NA",31],"percent":[0.9525556,0.5,0.112],"date":["2019-01-02","2019-03-15","2019-09-22"]},"columns":[{"id":"price_USD","name":"price_USD","type":"numeric","format":{"cell":{"prefix":"$","digits":2,"separators":true},"aggregated":{"prefix":"$","digits":2,"separators":true}}},{"id":"price_INR","name":"price_INR","type":"numeric","format":{"cell":{"separators":true,"currency":"INR","locales":"hi-IN"},"aggregated":{"separators":true,"currency":"INR","locales":"hi-IN"}}},{"id":"number_FR","name":"number_FR","type":"numeric","format":{"cell":{"locales":"fr-FR"},"aggregated":{"locales":"fr-FR"}}},{"id":"temp","name":"temp","type":"numeric","format":{"cell":{"suffix":" °C"},"aggregated":{"suffix":" °C"}}},{"id":"percent","name":"percent","type":"numeric","format":{"cell":{"digits":1,"percent":true},"aggregated":{"digits":1,"percent":true}}},{"id":"date","name":"date","type":"Date","format":{"cell":{"date":true,"locales":"en-GB"},"aggregated":{"date":true,"locales":"en-GB"}}}],"dataKey":"1f829b084c6d8ccf2a0d83553d6fd500"},"children":[]},"class":"reactR_markup"},"evals":[],"jsHooks":[]}
# Date formatting
datetimes <- as.POSIXct(c("2019-01-02 3:22:15", "2019-03-15 09:15:55", "2019-09-22 14:20:00"))
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

{"x":{"tag":{"name":"Reactable","attribs":{"data":{"datetime":["2019-01-02T03:22:15Z","2019-03-15T09:15:55Z","2019-09-22T14:20:00Z"],"date":["2019-01-02T03:22:15Z","2019-03-15T09:15:55Z","2019-09-22T14:20:00Z"],"time":["2019-01-02T03:22:15Z","2019-03-15T09:15:55Z","2019-09-22T14:20:00Z"],"time_24h":["2019-01-02T03:22:15Z","2019-03-15T09:15:55Z","2019-09-22T14:20:00Z"],"datetime_pt_BR":["2019-01-02T03:22:15Z","2019-03-15T09:15:55Z","2019-09-22T14:20:00Z"]},"columns":[{"id":"datetime","name":"datetime","type":"Date","format":{"cell":{"datetime":true},"aggregated":{"datetime":true}}},{"id":"date","name":"date","type":"Date","format":{"cell":{"date":true},"aggregated":{"date":true}}},{"id":"time","name":"time","type":"Date","format":{"cell":{"time":true},"aggregated":{"time":true}}},{"id":"time_24h","name":"time_24h","type":"Date","format":{"cell":{"time":true,"hour12":false},"aggregated":{"time":true,"hour12":false}}},{"id":"datetime_pt_BR","name":"datetime_pt_BR","type":"Date","format":{"cell":{"datetime":true,"locales":"pt-BR"},"aggregated":{"datetime":true,"locales":"pt-BR"}}}],"dataKey":"8724b1e05599bb444925052d081a24b4"},"children":[]},"class":"reactR_markup"},"evals":[],"jsHooks":[]}
# Currency formatting
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

{"x":{"tag":{"name":"Reactable","attribs":{"data":{"USD":[12.12,2141.213,0.42,1.55,34414],"EUR":[10.68,1884.27,0.37,1.36,30284.32],"INR":[861.07,152122.48,29.84,110,2444942.63],"JPY":[1280,226144,44.36,164,3634634.61],"MAD":[115.78,20453.94,4.01,15,328739.73]},"columns":[{"id":"USD","name":"USD","type":"numeric","format":{"cell":{"separators":true,"currency":"USD","locales":"en-US"},"aggregated":{"separators":true,"currency":"USD","locales":"en-US"}}},{"id":"EUR","name":"EUR","type":"numeric","format":{"cell":{"separators":true,"currency":"EUR","locales":"de-DE"},"aggregated":{"separators":true,"currency":"EUR","locales":"de-DE"}}},{"id":"INR","name":"INR","type":"numeric","format":{"cell":{"separators":true,"currency":"INR","locales":"hi-IN"},"aggregated":{"separators":true,"currency":"INR","locales":"hi-IN"}}},{"id":"JPY","name":"JPY","type":"numeric","format":{"cell":{"separators":true,"currency":"JPY","locales":"ja-JP"},"aggregated":{"separators":true,"currency":"JPY","locales":"ja-JP"}}},{"id":"MAD","name":"MAD","type":"numeric","format":{"cell":{"separators":true,"currency":"MAD","locales":"ar-MA"},"aggregated":{"separators":true,"currency":"MAD","locales":"ar-MA"}}}],"dataKey":"33aa25222ca2a5d4bf0afd951dbafcd2"},"children":[]},"class":"reactR_markup"},"evals":[],"jsHooks":[]}
# Formatting aggregated cells
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
      format = colFormat(suffix = " mi\u00b2", separators = TRUE)
    )
  )
)

{"x":{"tag":{"name":"Reactable","attribs":{"data":{"States":["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"],"Region":["South","West","West","South","West","West","Northeast","South","South","South","West","West","North Central","North Central","North Central","North Central","South","South","Northeast","South","Northeast","North Central","North Central","South","North Central","West","North Central","West","Northeast","Northeast","West","Northeast","South","North Central","North Central","South","West","Northeast","Northeast","South","North Central","South","South","West","Northeast","South","West","South","North Central","West"],"Area":[51609,589757,113909,53104,158693,104247,5009,2057,58560,58876,6450,83557,56400,36291,56290,82264,40395,48523,33215,10577,8257,58216,84068,47716,69686,147138,77227,110540,9304,7836,121666,49576,52586,70665,41222,69919,96981,45333,1214,31055,77047,42244,267339,84916,9609,40815,68192,24181,56154,97914]},"columns":[{"id":"States","name":"States","type":"character","aggregate":"count","format":{"aggregated":{"suffix":" states"}}},{"id":"Region","name":"Region","type":"factor"},{"id":"Area","name":"Area","type":"numeric","aggregate":"sum","format":{"cell":{"suffix":" mi²","separators":true},"aggregated":{"suffix":" mi²","separators":true}}}],"groupBy":["Region"],"dataKey":"8072c37e56d4ecde5dd39ddce6670e31"},"children":[]},"class":"reactR_markup"},"evals":[],"jsHooks":[]}
```
