# Server-Side Data

## Overview

Server-side data processing (`reactable(server = TRUE)`) moves sorting, filtering, searching, and pagination from the browser to the R server. This enables reactable to handle datasets with hundreds of thousands or millions of rows in Shiny applications, where client-side processing would be too slow or exceed browser memory limits.

## Current Status

**Experimental**. The feature is functional for most use cases but has known limitations:

- ✅ Pagination, sorting, filtering, global search
- ✅ Grouping with aggregation (V8 backend)
- ✅ Custom S3 backend interface
- ✅ Cross-page row selection (select-all, deselect-all, per-row)
- ✅ `defaultSelected` with stable row IDs across pages
- ✅ `updateReactable(selected = ...)` in backend modes
- ✅ DuckDB-WASM client mode in Shiny (`mode = "client"`, both Arrow IPC and Parquet)
- ⚠️ R render functions still run for entire table up front
- ❌ No documentation vignette

## Usage

```r
library(shiny)
library(reactable)

# Requires V8 package for default backend
# install.packages("V8")

ui <- fluidPage(
  reactableOutput("table")
)

server <- function(input, output) {
  output$table <- renderReactable({
    reactable(
      large_data,
      server = TRUE,
      filterable = TRUE,
      searchable = TRUE
    )
  })
}

shinyApp(ui, server)
```

### Backend Options

```r
# Default: V8 backend (recommended, uses JavaScript engine)
reactable(data, server = TRUE)

# Pure R backend (no V8 dependency, some limitations)
reactable(data, server = "df")

# data.table backend (faster for large data)
reactable(data, server = "dt")

# Custom backend (S3 object)
reactable(data, server = my_custom_backend())
```

## Architecture

### Data Flow

```
[Browser]                           [R Server]
    |                                    |
    |  POST {pageIndex, sortBy, ...}     |
    |----------------------------------->|
    |                                    |  reactableServerData()
    |                                    |  - Filter
    |                                    |  - Search
    |                                    |  - Sort
    |                                    |  - Group
    |                                    |  - Paginate
    |  {data, rowCount, maxRowCount}     |
    |<-----------------------------------|
    |                                    |
```

### Request Parameters

JavaScript sends these parameters on every data request:

| Parameter | Type | Description |
|-----------|------|-------------|
| `pageIndex` | integer | Current page (0-based) |
| `pageSize` | integer | Rows per page |
| `sortBy` | list | Sorted columns with `id` and `desc` |
| `filters` | list | Column filters with `id` and `value` |
| `searchValue` | string | Global search value |
| `groupBy` | list | Grouped column IDs |
| `expanded` | object | Expanded row state (currently unused) |

### Response Format

Backends must return a `resolvedData()` object:

```r
resolvedData(
  data = page_data,        # Data frame for current page

  rowCount = 1000,         # Total filtered row count

  maxRowCount = 10000      # Optional: total unfiltered rows (for pagination visibility)
)
```

### Grouped Data Format

For grouped tables, data must include a `.subRows` list-column:

```r
# Example: data grouped by "manufacturer"
data.frame(
  manufacturer = c("Acura", "Audi", "BMW"),
  avg_price = c(25000, 35000, 45000),  # Aggregated value
  .subRows = list(
    data.frame(model = c("Integra", "Legend"), price = c(20000, 30000)),
    data.frame(model = c("90", "100"), price = c(30000, 40000)),
    data.frame(model = c("535i"), price = c(45000))
  )
)
```

For multi-level grouping, nested data frames contain their own `.subRows`.

## Remaining Work

### 1. Bug Fixes and Polish

#### 1.1 Documentation Typo
**File:** `man/reactable-server.Rd` line 52-53

Current text incorrectly says:
```
- `reactableServerData()` should return a `resolvedData()` object.
- `reactableServerData()` should not return any value.
```

Should be:
```
- `reactableServerData()` should return a `resolvedData()` object.
- `reactableServerInit()` should not return any value.
```

#### 1.2 df Backend groupBy Bug
**File:** `R/server-df.R`

When `Reactable.toggleGroupBy()` is called via JavaScript API, the df backend returns grouped rows without the `__state` property needed for proper row identification. The V8 backend handles this correctly.

**Fix:** In `dfGroupBy()`, add state information to grouped rows:
```r
df[["__state"]] <- listSafeDataFrame(
  id = sapply(df[[groupedColumnId]], function(x) sprintf("%s:%s", groupedColumnId, x)),
  grouped = rep(TRUE, nrow(df))
)
```

#### 1.3 Pagination Display with Empty Results
**File:** `srcjs/Reactable.js`

When server-side search returns zero results, pagination shows "1-10 of 0 rows" instead of "0-0 of 0 rows".

#### 1.4 Stop Sending Unused State
**File:** `srcjs/Reactable.js`

~~Currently sends `expanded` and `selectedRowIds` in every request, but no backend uses them.~~ **Done.** `selectedRowIds` has been removed from server requests and all backend signatures. `expanded` is still sent for potential future use with `paginateSubRows`.

### 2. Server-Side Row Selection

~~This is complex work involving react-table hooks and row ID management.~~

**Done.** Cross-page row selection is fully implemented:

- Select-all queries the backend for all matching row IDs (via `selectAll` param) and stores them as explicit `selectedRowIds`
- Deselect-all only removes the filtered/searched rows, leaving other selections intact
- Per-row selections persist across page navigation, sort, and filter changes
- `isAllRowsSelected` checks against `serverRowCount` (not just current page rows)
- `toggleAllInProgressRef` guard prevents concurrent async calls from checkbox onChange+onClick bubbling
- All 3 backends (DuckDB, V8, df) support `selectAll`
- `defaultSelected` works correctly with `defaultSorted` via `__state` on pre-rendered pages
- `updateReactable(selected = ...)` works in backend modes (0-based indices match `__state.id`)

### 3. DuckDB-WASM Client Mode in Shiny

**Done.** DuckDB-WASM client mode (`backendDuckDB(mode = "client")`) works in Shiny apps:

- WASM base path detection: locator script (`duckdb-locator.js`) runs before the main bundle and uses `document.currentScript` with a `querySelector` fallback for Shiny (where scripts are dynamically inserted and `document.currentScript` is null)
- Runtime fallback in `Reactable.js` `useEffect`: queries DOM for `script[src*="reactable-duckdb"]` to resolve WASM/worker paths
- Parquet sidecar files: same `querySelector` fallback in the Parquet locator script and a runtime URL resolution fallback in `useEffect`
- Both `format = "arrow"` and `format = "parquet"` work correctly
- Warning suppressed when user explicitly sets `mode = "client"` (only warns for auto-resolved client mode)
- This is acceptable behavior matching other table libraries
- Much simpler than full server-side implementation

**Future simplification: consider removing pre-rendered first page.** The R-side pre-rendering of the first page (to avoid a blank flash while WASM loads) adds significant JS complexity: `canSkipInitialDuckDBQuery`, `duckdbQueryCount`, `stateMatchesPrerender` comparison against `defaultSorted`, the groupBy special case (pre-rendered data is flat so we must query immediately), and race conditions when users interact before DuckDB is ready. Without pre-rendering, the query effect fires unconditionally after init and the entire skip optimization disappears. The tradeoff is showing a loading/empty state during WASM init instead of instant first-page display.

Another issue: **floating point precision mismatch** between the two data paths. The pre-rendered page goes through `jsonlite::toJSON(digits = NA)` which uses C's `%.15g` format (15 significant digits), while DuckDB query results come through Arrow's `row.toJSON()` which uses JavaScript's `Number.toString()` (up to 17 significant digits for exact float64 round-trip). Since 15 significant digits isn't always enough to recover the exact float64 value, numbers with many decimal places can visibly change when the user first interacts and DuckDB takes over from the pre-rendered data. This is unsolvable without either (a) increasing jsonlite's digits to 17 for exact round-trip, (b) rounding DuckDB results to 15 significant digits to match jsonlite, or (c) removing pre-rendering so there's only one data path.

**Option B: Full server-side implementation (future)**
- Use `manualRowSelectedKey` / `manualExpandedKey` in react-table
- Track selection/expansion state on server
- Requires consistent row IDs across pages
- Complex edge cases with grouped rows and `paginateSubRows`

#### Key Challenges (from TODO notes)

1. **Row ID management**: Every page has indices starting from 0. Need consistent IDs across pages via `getRowId` option or `__state.id` property.

2. **Grouped row selection with paginateSubRows=TRUE**: Impossible to know if a grouped row should show as selected without access to all child rows.

3. **Select-all with millions of rows**: Can't send million row IDs. Need "select all" command that server interprets, returning only visible selections.

4. **react-table hooks**: `manualRowSelectedKey` exists but doesn't fully bail out of client-side selection logic.

### 3. Custom Backend API Improvements

#### 3.1 Stabilize API Before Documentation

Review parameter naming for consistency with JavaScript API:

| Current | JS API | Consider |
|---------|--------|----------|
| `pageIndex` | `pageIndex` | Keep (0-based matches JS) |
| `sortBy` | `sorted` (in getReactableState) | Consider `sorted` |
| `searchValue` | `globalFilter` (internal) | Keep `searchValue` |

**Decision:** Keep current naming. Changing now would break existing custom backends.

#### 3.2 Add Validation for Grouped Data

In `resolvedData()`, optionally validate `.subRows` structure:
- Must be a list-column
- Each element must be a data frame
- Warn if grouped column appears in subRows

#### 3.3 Document S3 Registration for Packages

Custom backends in R packages need `registerS3Method()` in `.onLoad()`:

```r
.onLoad <- function(libname, pkgname) {
  registerS3method("reactableServerInit", "my_backend", reactableServerInit.my_backend)
  registerS3method("reactableServerData", "my_backend", reactableServerData.my_backend)
}
```

#### 3.4 Consider reactableServerDestroy()

For backends that need cleanup (database connections, etc.):
```r
#' @export
reactableServerDestroy <- function(x, ...) {

  UseMethod("reactableServerDestroy")
}

reactableServerDestroy.default <- function(...) {
  # No-op
}
```

### 4. Documentation

#### 4.1 Create Server-Side Data Vignette

**File:** `vignettes/server-side-data.Rmd`

Outline:
1. **When to use server-side data**
   - Dataset size guidelines (>10k rows consider server-side)
   - Trade-offs: initial load time vs. operation speed

2. **Quick start**
   - Basic example with V8 backend
   - Installing V8 package

3. **Built-in backends**
   - V8 (default): Best compatibility, uses same code as client
   - df: Pure R, no dependencies, locale-aware sorting
   - dt: data.table, fastest for large data

4. **Creating custom backends**
   - Step-by-step tutorial
   - Required: `reactableServerData()` returning `resolvedData()`
   - Optional: `reactableServerInit()` for setup
   - Example: Simple DuckDB backend

5. **Grouped data format**
   - `.subRows` structure
   - Multi-level grouping
   - Aggregation functions

6. **Limitations**
   - Select-all/expand-all only work on current page
   - R render functions run for entire table up front
   - Custom `searchMethod` not supported in df backend

7. **Performance tips**
   - Use V8 backend for best memoization
   - Consider data.table for very large datasets
   - Pre-filter data in R when possible

#### 4.2 Add to pkgdown Reference

**File:** `pkgdown/_pkgdown.yml`

Add new section:
```yaml
reference:
  - title: Server-side data
    desc: Functions for server-side data processing in Shiny
    contents:
      - reactableServerInit
      - reactableServerData
      - resolvedData
```

#### 4.3 DuckDB Backend Example

For the vignette, include a simple DuckDB backend example:

```r
duckdb_backend <- function(con, table_name) {
 structure(
    list(con = con, table = table_name),
    class = "duckdb_backend"
  )
}

reactableServerData.duckdb_backend <- function(
  x, data, columns, pageIndex, pageSize, sortBy, filters, 
  searchValue, groupBy, ...
) {
  query <- sprintf("SELECT * FROM %s", x$table)
  

  # Apply filters
  where_clauses <- c()
  if (length(filters) > 0) {
    for (f in filters) {
      where_clauses <- c(where_clauses, 
        sprintf("%s ILIKE '%%%s%%'", f$id, f$value))
    }
  }
  if (!is.null(searchValue) && searchValue != "") {
    # Search all text columns
    search_clauses <- sapply(names(data), function(col) {
      sprintf("CAST(%s AS VARCHAR) ILIKE '%%%s%%'", col, searchValue)
    })
    where_clauses <- c(where_clauses, 
      sprintf("(%s)", paste(search_clauses, collapse = " OR ")))
  }
  if (length(where_clauses) > 0) {
    query <- sprintf("%s WHERE %s", query, paste(where_clauses, collapse = " AND "))
  }
  
  # Get total count
  count_query <- sprintf("SELECT COUNT(*) FROM (%s)", query)
  row_count <- DBI::dbGetQuery(x$con, count_query)[[1]]
  
  # Apply sorting
  if (length(sortBy) > 0) {
    order_clauses <- sapply(sortBy, function(s) {
      sprintf("%s %s", s$id, if (s$desc) "DESC" else "ASC")
    })
    query <- sprintf("%s ORDER BY %s", query, paste(order_clauses, collapse = ", "))
  }
  
  # Apply pagination
  query <- sprintf("%s LIMIT %d OFFSET %d", query, pageSize, pageIndex * pageSize)
  
  page_data <- DBI::dbGetQuery(x$con, query)
  
  resolvedData(page_data, rowCount = row_count)
}
```

### 5. Testing

#### 5.1 Missing Test Coverage

| Area | File | Description |
|------|------|-------------|
| Shiny integration | `tests/testthat/test-server-shiny.R` | End-to-end test with actual HTTP requests |
| toggleGroupBy + df backend | `tests/testthat/test-server-df.R` | Dynamic groupBy changes |
| Error handling | `tests/testthat/test-server-df.R` | Invalid resolvedData() returns |
| maxRowCount pagination | `srcjs/__tests__/server.test.js` | Edge cases for auto-shown pagination |

#### 5.2 Test Matrix

| Backend | Filter | Search | Sort | Group | Paginate | Selection | Expansion |
|---------|--------|--------|------|-------|----------|-----------|-----------|
| V8 | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ page-only | ⚠️ page-only |
| df | ✅ | ✅ | ✅ | ⚠️ bug | ✅ | ⚠️ page-only | ⚠️ page-only |
| dt | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ page-only | ⚠️ page-only |

## Implementation Order

1. **Phase 1: Bug fixes** (can release independently)
   - Fix documentation typo
   - Fix df backend groupBy bug
   - Fix pagination display

2. **Phase 2: Documentation** (main deliverable)
   - Write server-side data vignette
   - Add DuckDB example
   - Update pkgdown reference
   - Add missing tests

3. **Phase 3: API refinements** (optional)
   - Add resolvedData() validation
   - Document S3 registration for packages
   - Consider reactableServerDestroy()

4. **Phase 4: Server-side selection** (future, optional)
   - Document current limitation first
   - Full implementation if user demand warrants

## Verification

### Manual Testing

```r
# 100k rows test app
library(shiny)
library(reactable)

rows <- 100000
data <- data.frame(
  index = seq_len(rows),
  value = rnorm(rows),
  category = sample(LETTERS[1:5], rows, replace = TRUE)
)

ui <- fluidPage(
 reactableOutput("table")
)

server <- function(input, output) {
  output$table <- renderReactable({
    reactable(
      data,
      server = TRUE,
      filterable = TRUE,
      searchable = TRUE,
      groupBy = "category",
      columns = list(
        value = colDef(aggregate = "mean")
      )
    )
  })
}

shinyApp(ui, server)
```

Test checklist:
- [ ] Table loads with first page
- [ ] Pagination works (timing <200ms)
- [ ] Sorting works (timing <200ms)
- [ ] Column filtering works (timing <50ms)
- [ ] Global search works (timing <50ms)
- [ ] Grouping works with aggregation
- [ ] Expand group shows sub-rows
- [ ] Selection works (page-only expected)
- [ ] No console errors

### Automated Tests

```bash
# R tests
devtools::test()

# JavaScript tests
npm test

# Build check
devtools::check()
```

## Related Issues

- [#22](https://github.com/glin/reactable/issues/22) - Server Side Rendering (main tracking issue)
- Row selection reset on page change mentioned by flash0926 (Aug 2024)
- groupBy bug with df backend mentioned by jwijffels (Apr 2024)

## References

- [dbplyr: Creating a new backend](https://dbplyr.tidyverse.org/articles/new-backend.html) - Model for custom backend documentation
- [ag-Grid Server-Side Row Model](https://www.ag-grid.com/javascript-data-grid/server-side-model/) - Similar feature in another library
- [DT Server-Side Processing](https://rstudio.github.io/DT/server.html) - R DataTables equivalent
