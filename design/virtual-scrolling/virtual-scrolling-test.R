# Virtual Scrolling Test Cases
# Run these examples to test virtual scrolling functionality

library(reactable)

# =============================================================================
# Test Data
# =============================================================================

# Large dataset (100k rows) for performance testing
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

# Medium dataset (1k rows) for quick testing
rows <- 1000
data_1k <- data.frame(
  index = seq_len(rows),
  date = sample(dates, rows, replace = TRUE),
  city = sample(names(precip), rows, replace = TRUE),
  state = sample(rownames(USArrests), rows, replace = TRUE),
  temp = round(runif(rows, 0, 100), 1),
  stringsAsFactors = FALSE
)

# =============================================================================
# Basic Virtual Scrolling
# =============================================================================

# Basic virtual scrolling with no pagination
# Expected: Smooth scrolling through 100k rows, only ~15-20 DOM elements
reactable(data, virtual = TRUE, pagination = FALSE, height = 500, searchable = TRUE)

# Virtual scrolling with pagination controls visible
# Expected: Pagination controls visible, current page rows virtualized
reactable(data, virtual = TRUE, pagination = FALSE, showPagination = TRUE, height = 500, searchable = TRUE)

# Virtual scrolling with pagination (1000 rows per page)
# Expected: Pagination controls visible, current page rows virtualized
reactable(data, virtual = TRUE, defaultPageSize = 1000, height = 500, searchable = TRUE)

# Virtual scrolling without explicit height (not recommended - may not scroll)
# Expected: Table may expand to fit content, virtualization less effective
reactable(data_1k, virtual = TRUE, pagination = FALSE, searchable = TRUE)

# =============================================================================
# Container Height
# =============================================================================

# Virtual scrolling with percentage height (requires sized container)
# Expected: Table fills 100% of the 800px container
htmltools::browsable(
  htmltools::div(
    style = "height: 800px",
    reactable(data, virtual = TRUE, pagination = FALSE, searchable = TRUE, height = "100%")
  )
)

# =============================================================================
# Custom Styling
# =============================================================================

# Virtual scrolling with custom font size
# Expected: Row heights adapt dynamically to larger font, no gaps or overlaps
reactable(
  data,
  virtual = TRUE,
  pagination = FALSE,
  height = 500,
  searchable = TRUE,
  theme = reactableTheme(tableStyle = list(fontSize = "36px"))
)

# =============================================================================
# Row Details (Expandable Rows)
# =============================================================================

# Virtual scrolling with expandable row details
# Expected: Clicking expander shows details, row heights adjust dynamically
reactable(
  data.frame(x = 1:1000, y = rnorm(1000)),
  virtual = TRUE,
  height = 500,
  details = function(index) paste("Details for row", index),
  pagination = FALSE
)

# Virtual scrolling with all rows expanded by default
# Expected: All rows show details, variable heights handled correctly
reactable(
  data.frame(x = 1:1000, y = rnorm(1000)),
  virtual = TRUE,
  height = 500,
  details = function(index) paste("Details for row", index),
  pagination = FALSE,
  defaultExpanded = TRUE
)

# =============================================================================
# Grouped Tables
# =============================================================================

# Virtual scrolling with grouped rows (no pagination)
# Expected: Group headers expandable, sub-rows virtualized
reactable(
  data,
  virtual = TRUE,
  pagination = FALSE,
  height = 500,
  searchable = TRUE,
  groupBy = "city"
)

# Virtual scrolling with grouped rows and paginateSubRows
# Expected: Sub-rows count toward page size, pagination controls work
reactable(
  data,
  virtual = TRUE,
  height = 500,
  searchable = TRUE,
  groupBy = "city",
  paginateSubRows = TRUE,
  defaultPageSize = 100
)

# =============================================================================
# Server-Side Data with Virtualization
# =============================================================================

# Server-side data combined with virtual scrolling
# Useful when server pages are large (e.g., 1000 rows) but only ~15 fit on screen
# - Server-side handles millions of total rows (only fetches current page)
# - Virtual handles large page sizes (only renders visible rows)

library(shiny)

ui <- fluidPage(
  reactableOutput("table")
)

server <- function(input, output) {
  output$table <- renderReactable({
    data <- data.frame(
      id = 1:100000,
      value = rnorm(100000),
      category = sample(LETTERS, 100000, replace = TRUE)
    )

    reactable(
      data,
      server = TRUE,
      virtual = TRUE,
      height = 500,
      defaultPageSize = 1000,
      showPageSizeOptions = TRUE,
      pageSizeOptions = c(100, 500, 1000)
    )
  })
}

shinyApp(ui, server)

# =============================================================================
# Future Enhancements
# =============================================================================

# Many columns (potential future enhancement to virtualize columns)
# Currently all 100 columns are rendered even with virtual = TRUE
# Column virtualization would render only visible columns
wide_data <- as.data.frame(matrix(
  rnorm(1000 * 100),
  nrow = 1000,
  ncol = 100,
  dimnames = list(NULL, paste0("col_", 1:100))
))

reactable(
  wide_data,
  pagination = FALSE,
  virtual = TRUE,
  height = 500,
  defaultColDef = colDef(minWidth = 100)
)

# Infinite scroll / scroll-based server-side data fetching
# (Not currently implemented - hypothetical API design)
#
# Instead of page-based fetching, the server would send only the visible rows
# based on scroll position. This would allow seamless scrolling through millions
# of rows without pagination controls.
#
# Hypothetical API:
#
# reactable(
#   # Column schema only, no data
#   data.frame(id = integer(), value = numeric(), category = character()),
#   server = TRUE,
#   virtual = TRUE,
#   pagination = FALSE,  # No pagination - seamless scrolling
#   height = 500,
#   serverRowCount = 1000000  # Total rows in database
# )
#
# The server backend would:
# 1. Receive scroll position updates (visible row range)
# 2. Query database for just those rows: SELECT * FROM table LIMIT 20 OFFSET 5000
# 3. Return rows to client for rendering
# 4. Client caches fetched rows to avoid re-fetching on scroll back
