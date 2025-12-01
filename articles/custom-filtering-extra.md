# Extra Custom Filtering Examples

More examples of [custom filtering](./custom-filtering.md). Note that
the examples on this page do not support IE 11.

## Material UI Range Filter

Range filter using [Material UI’s Slider
component](https://mui.com/material-ui/react-slider/), adapted from an
[example by
@timelyportfolio](https://github.com/glin/reactable/issues/9#issuecomment-1008424287).

``` js
// JavaScript code for the Material UI range filter. This is a js language
// chunk, but you could also inline this in R using `tags$script(HTML("..."))`

const muiRangeFilter = (column, state) => {
  // Get min and max values from raw table data and memoize so it doesn't
  // have to be recalculated each time
  const range = React.useMemo(() => {
    let min = Infinity
    let max = -Infinity
    state.data.forEach(row => {
      const value = row[column.id]
      if (value < min) {
        min = Math.floor(value)
      } else if (value > max) {
        max = Math.ceil(value)
      }
    })
    return [min, max]
  }, [state.data])

  const value = column.filterValue ? column.filterValue : range
  const valueLabel = `${value[0]}...${value[1]}`

  return React.createElement(
    'div',
    // Add some margin so the tooltips don't get cut off
    { style: { margin: '0 8px' } },
    [
      valueLabel,
      React.createElement(
        MaterialUI.Slider,
        {
          value: value,
          min: range[0],
          max: range[1],
          valueLabelDisplay: 'auto',
          onChange: (e, val) => column.setFilter(val),
          'aria-label': `Filter ${column.name}`
        }
      )
    ]
  )
}

const filterRange = (rows, columnId, filterValue) => {
  const [min, max] = filterValue
  return rows.filter(row => {
    const value = row.values[columnId]
    return value >= min && value <= max
  })
}
```

``` r
library(htmltools)

data <- MASS::Cars93[, c("Manufacturer", "Model", "Type", "Price")]

muiDependency <- function() {
  list(
    # Material UI requires React
    reactR::html_dependency_react(),
    htmlDependency(
      name = "mui",
      version = "5.6.3",
      src = c(href = "https://unpkg.com/@mui/material@5.6.3/umd/"),
      script = "material-ui.production.min.js"
    )
  )
}

browsable(tagList(
  muiDependency(),

  reactable(
    data,
    columns = list(
      Price = colDef(
        filterable = TRUE,
        filterMethod = JS("filterRange"),
        filterInput = JS("muiRangeFilter")
      )
    ),
    defaultPageSize = 5,
    minRows = 5
  )
))
```
