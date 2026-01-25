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

rows <- 1000
dates <- seq.Date(as.Date("2018-01-01"), as.Date("2018-12-01"), "day")
data_1k <- data.frame(
  index = seq_len(rows),
  date = sample(dates, rows, replace = TRUE),
  city = sample(names(precip), rows, replace = TRUE),
  state = sample(rownames(USArrests), rows, replace = TRUE),
  temp = round(runif(rows, 0, 100), 1),
  stringsAsFactors = FALSE
)


reactable(data, virtual = T, pagination = F, height = 500, searchable = T)

reactable(data, virtual = T, defaultPageSize = 1000, height = 500, searchable = T)

reactable(data, virtual = T, pagination = F, searchable = T)

reactable(data_1k, virtual = T, pagination = F, searchable = T, height = "100%")

htmltools::browsable(
  htmltools::div(
    style = "height: 800px",
    reactable(data, virtual = T, pagination = F, searchable = T, height = "100%")
  )
)
