# DuckDB Engine — Implementation Plan

Working scratch doc. MVP-first: get basic pagination working ASAP to validate the approach, then layer features.

See [duckdb-wasm-engine.md](duckdb-wasm-engine.md) for architecture, rationale, limitations (single thread, 4 GB
memory, WASM variants), shared DuckDB R/WASM design, and the comparison with V8 server-side.

---

### Phase 0: Standalone proof-of-concept — DONE

See [design doc benchmarks](duckdb-wasm-engine.md#phase-0-poc-benchmark-results) for full results.

**Key findings:**

- Arrow IPC ingestion is the right path (70ms/100K, 413ms/1M). SQL INSERT was 40-100x slower.
- `insertArrowFromIPCStream` is the working DuckDB-WASM API (not `registerFileBuffer` or `insertArrowTable`).
- Prepared statement params are passed via `stmt.query(...params)`, not `stmt.bind()`.
- Pagination/sort: <15ms at all sizes. Global search: 164ms/100K (OK), 625ms/500K, 1.2s/1M (too slow at scale).
- Search precomputation (SQL or JS-side) not worthwhile — bloats ingest more than it saves on queries.
- Recommended WASM target: up to ~200K rows for static HTML. Server backend for larger datasets.
- Future: DuckDB FTS extension could fix search at scale.

---

### Phase 1: Arrow IPC serialization in R — DONE

Added `engine = NULL` param to `reactable()`, `serializeArrowIPC()` in `R/utils.R` using `arrow::write_ipc_stream()`

- `jsonlite::base64_enc()`. When `engine = "duckdb"`, data is serialized as Arrow IPC base64 and passed as `arrowData`
  prop (data is NULL). `arrow` added to Suggests. `base64enc` not needed — `jsonlite::base64_enc` already available.

**Tests added** (`tests/testthat/test-reactable.R`, `tests/testthat/test-utils.R`):

- Engine param validation (invalid values error, NULL works)
- Arrow IPC round-trip (numeric, character, logical, factor, Date, POSIXct)
- Special values (NA, NaN, Inf, -Inf in numeric; NA in character)
- dataKey uniqueness across different data
- Other reactable features preserved with engine = "duckdb"
- `serializeArrowIPC()` unit tests (basic, column types, NA handling)

---

### Phase 2: DuckDB-WASM JavaScript engine — MVP pagination — DONE

**Goal:** Get a reactable table that loads Arrow data into DuckDB-WASM and paginates via SQL. This is the core
proof that the full pipeline works end-to-end (R → Arrow → browser → DuckDB → react-table).

**Scope for MVP:** Pagination ONLY. No sorting, no filtering, no grouping. Just `SELECT * FROM data LIMIT ? OFFSET ?`.

**Architecture:**

- Separate webpack bundle (`webpack.config.duckdb.js`) keeps DuckDB out of the main reactable bundle (0 cost when not used)
- `srcjs/DuckDBEngine.js` — the engine class (init, query, destroy)
- `srcjs/duckdb-entry.js` — entry point that registers `window.__ReactableDuckDB` with engine class + WASM base path
- `reactable-duckdb.js` (202KB prod) + WASM files + worker files in `inst/htmlwidgets/lib/duckdb-wasm/`
- R adds `htmltools::htmlDependency` for duckdb-wasm only when `engine = "duckdb"`
- `Reactable.js` checks `window.__ReactableDuckDB`, creates engine instance, queries on page changes

**Tests added** (8 tests in `srcjs/__tests__/DuckDB.test.js`):

- Engine initialization and first page load
- Pagination queries on page navigation
- Page info with total row count
- Engine cleanup on unmount
- Empty data (0 rows)
- Normal mode unaffected when engine not set
- Error when `__ReactableDuckDB` not available
- Graceful handling of init failure

#### Steps

- [ ] **2.1** `npm install @duckdb/duckdb-wasm apache-arrow`

- [ ] **2.2** Create `srcjs/DuckDBEngine.js` — the engine class:

  ```javascript
  import * as duckdb from '@duckdb/duckdb-wasm'
  import { tableFromIPC } from 'apache-arrow'

  export class DuckDBEngine {
    constructor() {
      this.db = null
      this.conn = null
    }

    async init(arrowBase64) {
      // 1. Instantiate DuckDB-WASM from bundled files
      const bundle = await duckdb.selectBundle(/* bundled WASM paths */)
      const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
      )
      const worker = new Worker(worker_url)
      const logger = new duckdb.ConsoleLogger()
      this.db = new duckdb.AsyncDuckDB(logger, worker)
      await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker)
      URL.revokeObjectURL(worker_url)

      // 2. Decode base64 Arrow IPC and load into DuckDB
      const bytes = Uint8Array.from(atob(arrowBase64), c => c.charCodeAt(0))
      this.conn = await this.db.connect()
      await this.conn.insertArrowFromIPCStream(bytes, { name: 'reactable_data', create: true })

      // 3. Get total row count
      const countResult = await this.conn.query('SELECT COUNT(*) as n FROM reactable_data')
      this.totalRowCount = countResult.toArray()[0].n
    }

    async query({ pageIndex, pageSize }) {
      const offset = pageIndex * pageSize
      const result = await this.conn.query(
        `SELECT * FROM reactable_data LIMIT ${pageSize} OFFSET ${offset}`
      )

      // Convert Arrow result to row objects
      const rows = result.toArray().map(row => row.toJSON())

      return {
        rows,
        rowCount: this.totalRowCount
      }
    }

    async destroy() {
      if (this.conn) await this.conn.close()
      if (this.db) await this.db.terminate()
    }
  }
  ```

- [ ] **2.3** In `Reactable.js`, add engine prop and wire DuckDB into the existing server-data pattern.
      The key insight: DuckDB-WASM mode reuses the same `useServerData`/manual pagination code path that
      `dataURL` already uses. Instead of fetching from a URL, we query DuckDB:

  ```javascript
  // New prop
  engine: PropTypes.string,       // "duckdb" or null
  arrowData: PropTypes.object,    // { arrowIPC: "base64...", format: "arrow-ipc-base64" }

  // In the component:
  const useDuckDB = engine === 'duckdb'
  const [duckdbEngine] = React.useState(() => useDuckDB ? new DuckDBEngine() : null)
  const [duckdbReady, setDuckdbReady] = React.useState(false)

  // Initialize DuckDB on mount
  React.useEffect(() => {
    if (!duckdbEngine || !arrowData) return
    duckdbEngine.init(arrowData.arrowIPC).then(() => {
      setServerRowCount(duckdbEngine.totalRowCount)
      setServerMaxRowCount(duckdbEngine.totalRowCount)
      setDuckdbReady(true)
      // Fetch first page
      return duckdbEngine.query({ pageIndex: 0, pageSize: state.pageSize })
    }).then(result => {
      const normalized = arrayToColumnData(result.rows, dataColumns)
      setNewData(normalized)
    })
    return () => duckdbEngine?.destroy()
  }, [])

  // Re-query on page change (MVP: pagination only)
  React.useEffect(() => {
    if (!duckdbEngine || !duckdbReady) return
    duckdbEngine.query({
      pageIndex: state.pageIndex,
      pageSize: state.pageSize
    }).then(result => {
      const normalized = arrayToColumnData(result.rows, dataColumns)
      setNewData(normalized)
    })
  }, [duckdbReady, state.pageIndex, state.pageSize])
  ```

  The `useDuckDB` flag feeds into the same manual-mode flags as `useServerData`:

  ```javascript
  manualPagination: useServerData || useDuckDB,
  manualSortBy: useServerData || useDuckDB,
  manualGlobalFilter: useServerData || useDuckDB,
  manualFilters: useServerData || useDuckDB,
  ```

- [ ] **2.4** Update webpack config: DuckDB-WASM JS library (~200KB) should be code-split into a separate chunk
      or dynamically imported only when `engine = "duckdb"` (zero cost when not used). The WASM binary files
      should be copied to `inst/htmlwidgets/lib/duckdb-wasm/` for self-hosted serving.

  ```javascript
  // webpack.config.client.js
  // Option A: Dynamic import (preferred — zero cost when not used)
  // In DuckDBEngine.js, use: const duckdb = await import('@duckdb/duckdb-wasm')

  // Option B: Separate entry point
  entry: {
    reactable: path.join(__dirname, 'srcjs', 'index.js'),
    'reactable-duckdb': path.join(__dirname, 'srcjs', 'DuckDBEngine.js')  // separate bundle
  }

  // Copy WASM files to inst/htmlwidgets/lib/duckdb-wasm/ via CopyWebpackPlugin
  ```

- [ ] **2.5** R side: pass Arrow data as a prop when engine = "duckdb":

  ```r
  # In reactable(), when engine = "duckdb":
  component <- reactR::component("Reactable", list(
    data = NULL,                    # No JSON data
    arrowData = data_payload,       # Arrow IPC base64
    engine = "duckdb",
    columns = cols,
    # ... everything else the same ...
    # Force pagination on, virtual off
    pagination = TRUE,
    virtual = NULL
  ))
  ```

- [ ] **2.6** Create test Rmd: `vignettes-test/duckdb-basic.Rmd`

- [ ] **2.7** Add JS tests (`srcjs/__tests__/DuckDBEngine.test.js`):
  - `DuckDBEngine.init()` creates table from Arrow IPC bytes
  - `DuckDBEngine.query()` returns correct page of rows with LIMIT/OFFSET
  - `DuckDBEngine.query()` returns correct `rowCount`
  - `DuckDBEngine.destroy()` cleans up connection and database
  - Edge case: empty data (0 rows)
  - Edge case: page beyond last row returns empty result

#### Validate

- [ ] Knit `duckdb-basic.Rmd` to HTML, open in browser
- [ ] Table shows first 25 rows
- [ ] Click "Next" → shows rows 26-50 (new SQL query, not client-side)
- [ ] Page info shows correct total: "1–25 of 93000 rows"
- [ ] Click last page → shows correct last rows
- [ ] Existing `reactable(mtcars)` without engine param is completely unchanged
- [ ] Measure: first page load time, page navigation time
- [ ] Chrome DevTools Network → verify WASM files loaded from bundled path
- [ ] Chrome DevTools Memory → verify data frame not duplicated in JS heap

---

### Phase 2.5: Pre-rendered first page — DONE

**Goal:** Eliminate the empty table flash while DuckDB-WASM initializes. On first render, the table should show
real data immediately (like server mode's `skipInitialFetch` pattern), with DuckDB taking over for subsequent pages.

**Problem:** DuckDB-WASM initialization is asynchronous — loading WASM, decoding Arrow IPC, creating the in-memory
table — so the first page was blank ("No rows found") until the engine was ready. This also broke static rendering
(V8 SSR) since `data` was NULL.

**Solution:** Pre-compute the first page in R and pass it alongside the Arrow IPC data:

1. **R side** (`R/reactable.R`): After serializing Arrow IPC (full dataset), sort data by `defaultSorted` (if any)
   using `xtfrm()` + `order()`, take `head(data, defaultPageSize)` rows, serialize as JSON via `toJSON()`. Set
   `serverRowCount` and `serverMaxRowCount` to the total row count so pagination info displays correctly.

2. **JS side** (`srcjs/Reactable.js`): Added `skipInitialDuckDBQuery` ref — when `useDuckDB && originalData.length > 0`,
   the first DuckDB query effect is skipped (pre-rendered data is already displayed). Subsequent page changes query
   DuckDB normally.

3. **Static rendering:** Works automatically because `data` now contains the first page (not NULL), so V8 SSR renders
   actual rows.

**Tests updated:**

- R tests: 3 new tests — basic pre-rendering, page size verification, defaultSorted pre-computation
- JS tests: 9 tests updated to pass pre-rendered first page data with `serverRowCount`/`serverMaxRowCount` props.
  New tests verify immediate rendering, initial query skip, and graceful degradation on init failure.
- Test Rmd: Added `defaultSorted` example, 100k-row and 1M-row examples.

---

### Phase 3: Sort + filter + search ✅

**Goal:** Full interactive table powered by DuckDB-WASM.

#### Steps

- [x] **3.1** Add sort SQL to `DuckDBEngine.query()`:

  ```javascript
  async query({ pageIndex, pageSize, sortBy, filters, searchValue }) {
    let sql = 'SELECT * FROM reactable_data'
    let countSql = 'SELECT COUNT(*) as n FROM reactable_data'
    const whereClauses = []

    // Column filters
    for (const filter of (filters || [])) {
      const col = this.escapeIdentifier(filter.id)
      // Use prepared statement params for values
      whereClauses.push(`CAST(${col} AS VARCHAR) ILIKE '%' || ? || '%'`)
    }

    // Global search
    if (searchValue) {
      const searchCols = this.columns
        .filter(c => c.searchable !== false)
        .map(c => `CAST(${this.escapeIdentifier(c.id)} AS VARCHAR) ILIKE '%' || ? || '%'`)
      if (searchCols.length > 0) {
        whereClauses.push(`(${searchCols.join(' OR ')})`)
      }
    }

    if (whereClauses.length > 0) {
      const whereStr = ' WHERE ' + whereClauses.join(' AND ')
      sql += whereStr
      countSql += whereStr
    }

    // Sort
    if (sortBy && sortBy.length > 0) {
      const orderClauses = sortBy.map(s =>
        `${this.escapeIdentifier(s.id)} ${s.desc ? 'DESC' : 'ASC'} NULLS LAST`
      )
      sql += ` ORDER BY ${orderClauses.join(', ')}`
    }

    sql += ` LIMIT ${Number(pageSize)} OFFSET ${Number(pageIndex) * Number(pageSize)}`

    // Use prepared statements for filter values to prevent SQL injection
    const params = []
    for (const filter of (filters || [])) {
      params.push(filter.value)
    }
    if (searchValue) {
      for (const c of this.columns.filter(c => c.searchable !== false)) {
        params.push(searchValue)
      }
    }

    const [dataResult, countResult] = await Promise.all([
      this.runPrepared(sql, params),
      this.runPrepared(countSql, params)
    ])

    return {
      rows: dataResult.toArray().map(r => r.toJSON()),
      rowCount: countResult.toArray()[0].n
    }
  }
  ```

- [x] **3.2** Wire `state.sortBy`, `state.filters`, `state.globalFilter` into the DuckDB query effect
      (add to the useEffect dependency array alongside pageIndex/pageSize)

- [x] **3.3** Handle numeric filter matching: current reactable uses "starts with" for numeric columns.
      In SQL: `CAST(col AS VARCHAR) LIKE ? || '%'` (vs ILIKE for text). Detect column type from the
      column metadata already passed from R.

- [x] **3.4** Update `duckdb-basic.Rmd` test to enable `searchable = TRUE, filterable = TRUE`

- [x] **3.5** Add JS tests for sort/filter/search:
  - Sort ASC/DESC produces correct SQL ORDER BY
  - Multi-column sort produces correct ORDER BY clause
  - Column filter produces correct WHERE ILIKE clause
  - Global search produces correct OR-joined WHERE clause
  - Numeric column filter uses LIKE (starts-with) not ILIKE (contains)
  - Filter + sort + pagination combination produces correct SQL
  - `escapeIdentifier` handles column names with special characters
  - Parameterized queries prevent SQL injection (filter value with `'; DROP TABLE --`)

#### Validate

- [x] Click column header → sorts ascending → click again → descending → click again → unsorted
- [x] Multi-column sort (shift+click) works
- [x] Type in search box → results filter, row count updates
- [x] Type in column filter → results filter
- [x] Numeric column filter: typing "5" shows values starting with 5 (50, 500, 5.1, etc.)
- [x] String column filter: typing "ford" shows values containing "ford" (case-insensitive)
- [x] Filter + sort combination works
- [x] Page count updates after filtering
- [x] Sort performance: <300ms on 100K rows (measure in DevTools)
- [x] Filter performance: <300ms on 100K rows

---

### Phase 4: DuckDB R server backend ✅

**Goal:** A `server = "duckdb"` backend for Shiny that uses the DuckDB R package. Data stays on the server, but
queries are fast (DuckDB instead of data.frame `grepl`/`order`). See design doc for architecture and rationale.

#### Steps

- [x] **4.1** Add `duckdb` and `DBI` to Suggests in DESCRIPTION

- [x] **4.2** Create `R/server-duckdb.R` — implements `reactableServerInit` and `reactableServerData` S3 methods
      for class `reactable_serverDuckdb`. Uses `duckdb_register()` for zero-copy data access.

- [x] **4.3** Create `R/duckdb-sql.R` — shared SQL query builder (`buildDuckdbQuery`, `duckdbQuoteIdentifier`).
      Uses custom `duckdbQuoteIdentifier()` for column names (matches JS `escapeIdentifier()` exactly) and
      parameterized `?` placeholders for filter values. Produces identical WHERE/ORDER BY/LIMIT SQL as the
      JS `DuckDBEngine.query()`.

- [x] **4.4** Register `"duckdb"` in `getServerBackend()` in `R/shiny.R`:

  ```r
  backends <- list(v8 = serverV8, df = serverDf, dt = serverDt, duckdb = serverDuckdb)
  ```

- [x] **4.5** Create test Shiny app: `inst/examples/shiny-server-data-duckdb.R`

- [x] **4.6** Add shared SQL builder test cases (`tests/testthat/test-duckdb-sql.R`, 30 tests) that verify
      identical SQL output for known inputs: identifier quoting, pagination, sort (ASC/DESC, multi-column),
      column filters (text ILIKE, numeric LIKE), global search (OR across columns, disableGlobalFilter),
      filter+sort+search combinations, special characters in column names, empty search ignored.

- [x] **4.7** Add server backend integration tests (`tests/testthat/test-server-duckdb.R`, 25 tests) using
      actual DuckDB: pagination, sorting, NULL sort order, text substring filter, numeric starts-with filter,
      global search, combined filter+sort+pagination.

#### Validate

- [ ] Shiny app with `reactable(data, server = "duckdb")` renders and paginates
- [ ] Sort/filter/search all work identically to the V8 backend
- [ ] `R CMD check` passes with duckdb in Suggests

---

### Phase 5: Grouping and aggregation

**Goal:** `groupBy` works with the DuckDB engine (both WASM and R).

#### Steps

- [ ] **5.1** Add GROUP BY SQL generation:

  ```sql
  -- Top-level groups (collapsed view)
  SELECT "region", COUNT(*) AS _n, SUM("revenue") AS "revenue", ...
  FROM reactable_data
  GROUP BY "region"
  ORDER BY "region" ASC
  LIMIT 25 OFFSET 0

  -- Expanded sub-rows (when user expands a group)
  SELECT * FROM reactable_data
  WHERE "region" = 'West'
  ORDER BY "revenue" DESC
  LIMIT 25 OFFSET 0
  ```

- [ ] **5.2** Map reactable aggregate functions to SQL:
      | reactable | SQL |
      |-----------|-----|
      | "sum" | `SUM(col)` |
      | "mean" | `AVG(col)` |
      | "max" | `MAX(col)` |
      | "min" | `MIN(col)` |
      | "median" | `MEDIAN(col)` |
      | "count" | `COUNT(col)` |
      | "unique" | `STRING_AGG(DISTINCT CAST(col AS VARCHAR), ', ')` |
      | "frequency" | custom subquery |

- [ ] **5.3** Handle row expansion: when user clicks to expand a group, fire a sub-query for that group's
      children. The expanded group key is passed in `state.expanded`.

- [ ] **5.4** Handle multi-level grouping: `groupBy = c("region", "city")` → nested GROUP BY queries

- [ ] **5.5** Add `__state` metadata to grouped results (index, grouped flag, subRowCount) to match what
      the react-table server-side mode expects

- [ ] **5.6** Add JS tests for grouping:
  - GROUP BY produces correct SQL with aggregation functions
  - Expanding a group produces correct WHERE clause for sub-rows
  - Multi-level grouping produces correct nested queries
  - Aggregate function mapping (sum→SUM, mean→AVG, etc.) is correct
  - Grouped row count is correct

#### Known limitation: `paginateSubRows` not supported with DuckDB engine

`paginateSubRows = TRUE` is not implemented for the DuckDB engine (WASM or R server). Sub-rows are always fetched
in full for each visible group, and pagination is based on top-level group count only. This matches the behavior of
the df and dt server backends, which also don't implement `paginateSubRows` — only the V8 backend does.

When `paginateSubRows = FALSE` (the default), expanding a group adds its child rows *on top of* the page size.
With `paginateSubRows = TRUE`, expanded children would count toward the page size, giving consistent page heights.

Implementing it for DuckDB would require:
- Passing `expanded` state to the engine (which groups are currently open)
- Building a flat page interleaving group headers and their expanded children, respecting `pageSize` across group
  boundaries (e.g., if group A has 50 children and page size is 10, page 2 starts mid-group-A)
- Returning `__state` with `parentId` (on child rows) and `subRowCount` (on group rows) instead of nested `.subRows`
- Setting `expandSubRows = false` in react-table config to prevent duplicate sub-row expansion
- Computing correct total row count that accounts for expanded vs collapsed groups

This is deferred as a future enhancement. See the "Deferred / Future" section for the revisit item.

#### Validate

- [ ] `reactable(data, engine = "duckdb", groupBy = "region")` shows grouped rows
- [ ] Click to expand a group → shows child rows
- [ ] Aggregated values (sum, mean, count) are correct
- [ ] Pagination works within expanded groups
- [ ] Sort works on grouped view
- [ ] Filter + group combination works
- [ ] Same behavior in DuckDB R backend

---

### Phase 6: Polish and edge cases

- [ ] **6.1** Loading state: Show a spinner/skeleton while DuckDB-WASM initializes (first page load)
- [ ] **6.2** Error handling: graceful fallback if DuckDB-WASM fails to load (CDN down, old browser)
- [ ] **6.3** Document limitation: R cell render functions (`colDef(cell = function(...) ...)`) are not
      supported with `engine = "duckdb"`. Users must use JS render functions (`colDef(cell = JS(...))`).
- [ ] **6.4** Column formatting: `colFormat()` works client-side (JS Intl), so it should work fine on
      DuckDB query results. Verify dates, currencies, percentages.
- [ ] **6.5** Selection: Row selection indices need mapping between DuckDB result rows and original data
      row indices. Store original row index in a `_rowid` column.
- [ ] **6.6** Accessibility: Ensure ARIA row count is correct (total rows, not just visible page)
- [ ] **6.7** `Reactable.setData()` JS API: Support updating the DuckDB table when data changes
- [ ] **6.8** Shiny `updateReactable(data = ...)`: Re-import Arrow data into DuckDB-WASM
- [ ] **6.9** Write tests: Jest tests for DuckDBEngine, R tests for server-duckdb backend
- [x] **6.10.1** Warn about unsupported custom JS methods: When `engine = "duckdb"` is used with custom
      `searchMethod`, `filterMethod`, or JS `aggregate` functions, emit R-level warnings that these will be
      ignored. Built-in string aggregate names ("sum", "mean", etc.) are fine. `filterInput` (custom UI) works.
      `sortType` is not in the R API so no check needed.
  - Ensure all DuckDBEngine methods have test coverage
  - Ensure all R server-duckdb S3 methods have test coverage
  - Integration tests: R Arrow IPC → JS DuckDB ingestion → query → correct results
- [ ] **6.10** Document in vignettes: new `engine = "duckdb"` parameter, when to use it, limitations
- [ ] **6.11** Update NEWS.md

#### Validate

- [ ] All existing reactable tests pass (no regressions)
- [ ] New DuckDB tests pass
- [ ] Manual testing in Chrome, Firefox, Safari
- [ ] `R CMD check` passes
- [ ] pkgdown site builds

---

### Deferred / Future (not in MVP)

- [ ] `paginateSubRows` support for DuckDB engine: Flatten grouped + expanded rows into a single paginated list
      where sub-rows count toward the page size. Requires passing `expanded` state to the engine and computing
      cross-group page offsets. See Phase 5 limitation notes for full details.
- [ ] Parquet sidecar files: For very large data, write Parquet alongside HTML, query via HTTP range requests
- [ ] Web Worker isolation: Move DuckDB queries to a dedicated Web Worker to guarantee UI thread never blocks
- [ ] Custom SQL filter methods: Let users pass custom SQL WHERE clauses per column
- [ ] Arrow IPC streaming: For Shiny, stream Arrow data incrementally instead of all-at-once
- [ ] Shared DuckDB instance: Multiple reactable tables on one page share a single DuckDB-WASM instance

---

## File inventory (what gets created/modified)

### New files

| File                                       | Purpose                                |
| ------------------------------------------ | -------------------------------------- |
| `R/server-duckdb.R`                        | DuckDB R server backend (S3 methods)   |
| `R/duckdb-sql.R`                           | Shared SQL query builder for R backend |
| `srcjs/DuckDBEngine.js`                    | DuckDB-WASM engine class               |
| `design/duckdb-wasm-engine/poc.html`       | Phase 0 standalone proof-of-concept    |
| `vignettes-test/duckdb-basic.Rmd`          | Test document for development          |
| `inst/examples/shiny-server-data-duckdb.R` | Shiny test app                         |
| `srcjs/__tests__/DuckDBEngine.test.js`     | JS tests                               |
| `tests/testthat/test-server-duckdb.R`      | R tests                                |

### Modified files

| File                       | Change                                           |
| -------------------------- | ------------------------------------------------ |
| `DESCRIPTION`              | Add arrow, duckdb, base64enc to Suggests         |
| `R/reactable.R`            | Add `engine` parameter, Arrow serialization path |
| `R/shiny.R`                | Register "duckdb" in `getServerBackend()`        |
| `srcjs/Reactable.js`       | Add engine/arrowData props, DuckDB query effects |
| `webpack.config.client.js` | Handle DuckDB-WASM bundling/dynamic import       |
| `package.json`             | Add @duckdb/duckdb-wasm, apache-arrow deps       |
| `NEWS.md`                  | Document new feature                             |
| `.Rbuildignore`            | Exclude poc.html and design files                |

---

## Open questions (resolved)

- [x] **CDN vs. bundled WASM:** Self-hosted/bundled. Relying on external CDN is bad practice and fails for
      air-gapped users in corporate environments. Bundle the WASM files in the R package (`inst/htmlwidgets/`).
- [x] **Arrow R package optionality:** `arrow` is fine as an optional Suggests dependency. Users who want
      `engine = "duckdb"` install arrow; everyone else is unaffected.
- [x] **JSON fallback for DuckDB-WASM:** Not needed — arrow as Suggests is acceptable (see above).
- [x] **How to handle R cell render functions?** Not supported with `engine = "duckdb"` for now. Document
      as a known limitation. Users must use JS render functions (`colDef(cell = JS(...))`) with the DuckDB engine.
- [x] **Parameter name:** `engine = "duckdb"` for the client-side WASM mode. The `server` param stays as-is
      for server backends (TRUE/FALSE/backend-object).
      **Note:** This will be refactored in Phase 7 to a unified `backend` param. See
      [backend-api.md](backend-api.md) for the design.

---

### Phase 7: Backend API refactor

**Goal:** Replace `engine` and `server` with a unified `backend` param using constructor functions.
See [backend-api.md](backend-api.md) for the full design doc.

```r
# New API:
reactable(data, backend = duckdb_backend())     # auto client/server detection
reactable(data, backend = v8_backend())          # legacy server-only

# Old API (deprecated, still works):
reactable(data, engine = "duckdb")               # → duckdb_backend("client")
reactable(data, server = TRUE)                   # → v8_backend()
reactable(data, server = "duckdb")               # → duckdb_backend("server")
```

#### Steps

- [ ] **7.1** Add `backend` param to `reactable()` (default NULL). Validate: error if `backend` is used
      alongside `engine` or `server`.
- [ ] **7.2** Create constructor functions: `duckdb_backend()`, `v8_backend()`, `df_backend()`, `dt_backend()`.
      Each returns an S3 object with class `reactable_backend_*`.
- [ ] **7.3** Implement auto-detection in `duckdb_backend("auto")`: check for active Shiny session → server
      mode; otherwise → client mode.
- [ ] **7.4** Wire existing `engine`/`server` code paths through the new `backend` S3 dispatch.
- [ ] **7.5** Deprecate `engine` and `server` params with lifecycle warnings.
- [ ] **7.6** Update docs, vignettes, examples, NEWS.md.
- [ ] **7.7** Update roxygen: `?duckdb_backend`, `?v8_backend`, `?reactable` backend param docs.

#### Naming decision (deferred)

Preferred: `duckdb_backend()` (snake_case, reads well)
Alternatives: `duckdbBackend()` (camelCase, matches package conventions), `backend_duckdb()` (prefix grouping)

#### Validate

- [ ] `reactable(data, backend = duckdb_backend())` works in static HTML (WASM) and Shiny (server)
- [ ] `reactable(data, engine = "duckdb")` still works with deprecation warning
- [ ] `reactable(data, server = TRUE)` still works with deprecation warning
- [ ] All existing tests pass
- [ ] `R CMD check` passes
