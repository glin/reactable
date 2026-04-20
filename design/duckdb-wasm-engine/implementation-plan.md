# DuckDB Engine — Implementation Plan

Working scratch doc. MVP-first: get basic pagination working ASAP to validate the approach, then layer features.

**Note:** Step-level checkboxes and code snippets in earlier phases (0-4) were not maintained after
phase completion. Phase headers marked "DONE" or "\u2714\uFE0F" are the authoritative completion status.

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

### Phase 5: Grouping and aggregation — DONE

**Goal:** `groupBy` works with the DuckDB engine (both WASM and R).

#### Steps

- [x] **5.1** Add GROUP BY SQL generation:

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

- [x] **5.2** Map reactable aggregate functions to SQL:
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

- [x] **5.3** Handle row expansion: when user clicks to expand a group, fire a sub-query for that group's
      children. The expanded group key is passed in `state.expanded`.

- [x] **5.4** Handle multi-level grouping: `groupBy = c("region", "city")` → nested GROUP BY queries

- [x] **5.5** Add `__state` metadata to grouped results (index, grouped flag, subRowCount) to match what
      the react-table server-side mode expects

- [x] **5.6** Add JS tests for grouping:
  - GROUP BY produces correct SQL with aggregation functions
  - Expanding a group produces correct WHERE clause for sub-rows
  - Multi-level grouping produces correct nested queries
  - Aggregate function mapping (sum→SUM, mean→AVG, etc.) is correct
  - Grouped row count is correct

#### ~~Known limitation: `paginateSubRows` not supported with DuckDB engine~~ DONE

`paginateSubRows = TRUE` is now implemented for all backends: DuckDB WASM (client), DuckDB R server, and df server.
See [paginate-sub-rows.md](paginate-sub-rows.md) for the design.

#### Validate

- [x] `reactable(data, backend = backendDuckDB(), groupBy = "region")` shows grouped rows
- [x] Click to expand a group → shows child rows
- [x] Aggregated values (sum, mean, count) are correct
- [x] Pagination works within expanded groups
- [x] Sort works on grouped view
- [x] Filter + group combination works
- [x] Same behavior in DuckDB R backend

---

### Phase 6: Polish and edge cases

- ~~**6.1** Loading state~~ — Skipped (pre-rendered first page is sufficient)
- ~~**6.2** Error handling~~ — Skipped for now (console.error + pre-rendered fallback is acceptable)
- ~~**6.3** Document R render limitation~~ — Covered by 6.10.2 warnings; vignette will mention it
- ~~**6.4** Column formatting verification~~ — Skipped (`colFormat()` is client-side JS, works fine).
  Added colFormat examples to test Rmd instead (dates, currencies, percentages, grouped aggregates).
- ~~**6.5** Selection~~ — ~~Deferred. Row selection is broken with DuckDB (per-page index collisions,
  server-side selection not implemented). Added to Deferred/Future list. Add R warning when
  `selection` is used with `engine = "duckdb"`.~~ Fixed in 9C/9D.
- ~~**6.6** Accessibility (ARIA row count)~~ — Not needed. `aria-rowcount` is only set for virtual
  tables, same as client-side tables. No DuckDB-specific issue.
- ~~**6.7** `Reactable.setData()` JS API~~ — Deferred. DuckDB WASM is for static HTML where data
  doesn't change dynamically. Added to Deferred/Future list.
- ~~**6.8** Shiny `updateReactable(data = ...)`~~ — Deferred. Same reasoning. Added to Deferred/Future.
- ~~**6.9** Write tests~~ — Already done as part of each phase. JS: 37 tests in DuckDB.test.js
  (Phases 2, 2.5, 3, 5). R: 49 tests in test-server-duckdb.R, 29 in test-duckdb-sql.R (Phase 4),
  plus DuckDB warning tests in test-reactable.R (Phase 6).
- [x] **6.10.1** Warn about unsupported custom JS methods: When `engine = "duckdb"` is used with custom
      `searchMethod`, `filterMethod`, or JS `aggregate` functions, emit R-level warnings that these will be
      ignored. Built-in string aggregate names ("sum", "mean", etc.) are fine. `filterInput` (custom UI) works.
      `sortType` is not in the R API so no check needed.
- [x] **6.10.2** Warn about unsupported per-row R render functions: When `engine = "duckdb"` is used with
      R function renderers that are pre-evaluated per-row, emit R-level warnings. These produce arrays indexed
      by original row position, which break when DuckDB sorts/filters/paginates to different rows.
      Affected parameters (6 total): - `colDef(cell = function(...))` — per-row cell rendering - `colDef(details = function(...))` — per-row details/expansion content - `colDef(style = function(...))` — per-row conditional styling - `colDef(class = function(...))` — per-row conditional CSS classes - `reactable(rowClass = function(...))` — per-row class on row element - `reactable(rowStyle = function(...))` — per-row style on row element
      Safe parameters (called once, not row-dependent): `header`, `footer`, `filterInput`, `colGroup header`.
      JS() function variants of all parameters work correctly with DuckDB.
  - Ensure all DuckDBEngine methods have test coverage
  - Ensure all R server-duckdb S3 methods have test coverage
  - Integration tests: R Arrow IPC → JS DuckDB ingestion → query → correct results
- [x] **6.10.3** ~~Warn about unsupported row selection: When `engine = "duckdb"` is used with
      `selection`, emit an R-level warning. Row selection with DuckDB is not supported because
      row IDs are per-page indices that collide across pages.~~ Warning was added, then removed
      when row selection was fixed in 9C/9D.

#### Validate

- [x] All existing reactable tests pass (no regressions)
- [x] New DuckDB tests pass
- [ ] Manual testing in Chrome, Firefox, Safari
- [ ] `R CMD check` passes
- [ ] pkgdown site builds

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

### Phase 7: Backend API refactor — DONE

**Goal:** Introduce a `backend` param with `backendDuckDB()` constructor. Remove the `engine` param
(never released). Keep `server` working exactly as-is (no internal remapping). `backendV8()` is
deferred to Phase 9.

See [backend-api.md](backend-api.md) for the design doc.

```r
# New API:
reactable(data, backend = backendDuckDB())     # auto client/server detection

# Existing server param is completely unchanged:
reactable(data, server = TRUE)                   # works as before (no remapping)
reactable(data, server = "duckdb")               # works as before (getServerBackend)
reactable(data, server = "df")                   # works as before
reactable(data, server = "dt")                   # works as before

# engine param is deleted (never released):
reactable(data, engine = "duckdb")               # ❌ removed
```

#### Key decisions

- **`engine` param:** Delete entirely. It only existed on this dev branch and was never released.
  All references to `engine = "duckdb"` in R code, JS code, and tests become `backend = backendDuckDB()`.
- **`server` param:** Completely unchanged. No internal remapping to backend objects. `server = TRUE`
  still dispatches to V8, `server = "duckdb"` still dispatches through `getServerBackend()`, etc.
  Error if both `backend` and `server` are specified.
- **Only `backendDuckDB()` in this phase.** `backendV8()` constructor is deferred to Phase 9
  when `server` is merged into `backend`.
- **Auto-detection:** `backendDuckDB("auto")` checks for active Shiny session → server mode,
  otherwise → client WASM mode. Same detection as `preRenderHook`.

#### Steps

- [x] **7.1** Create `backendDuckDB()` in `R/backends.R`: - `backendDuckDB(mode = c("auto", "client", "server"))` → S3 class `"reactable_backendDuckDB"` - Export and add roxygen docs with examples and limitations. - No `backendV8()` in this phase (deferred to Phase 9).

- [x] **7.2** Add `backend` param to `reactable()`, remove `engine` param: - Add `backend = NULL` param (placed after `server` in the signature). - Delete `engine` param entirely. - Validate: error if both `backend` and `server` are specified. - `server` param is completely unchanged — no internal remapping to backend objects.
      `server = TRUE`, `"duckdb"`, `"df"`, `"dt"` all dispatch through existing code paths.

- [x] **7.3** Implement auto-detection for `backendDuckDB("auto")`: - In `reactable()`, resolve mode: check Shiny session → "server", else → "client". - `"client"` mode → existing DuckDB WASM path (Arrow IPC, pre-rendered first page, etc.) - `"server"` mode → existing DuckDB R server path (duckdb_register, S3 methods)

- [x] **7.4** Refactor `reactable()` internals to use backend objects: - Replace `identical(engine, "duckdb")` checks with `isDuckDBClientBackend(backend)`. - Existing `server` checks (`!isFALSE(server)`, etc.) remain unchanged. - Move DuckDB WASM warnings (searchMethod, filterMethod, R render functions, selection)
      to fire when backend is DuckDB client mode, not when `engine == "duckdb"`. - `getServerBackend()` accepts `backendDuckDB("server")` in addition to existing string dispatch.

- [x] **7.5** Update JS side: - In `Reactable.js`, rename `engine` prop to `backend` (or keep as internal prop name — decide). - Update `duckdb-entry.js` if needed. - The JS side just needs to know "use DuckDB WASM" — the prop name is the only change.

- [x] **7.6** Update all tests: - R tests: replace `engine = "duckdb"` with `backend = backendDuckDB()` (or `backendDuckDB("client")`
      where explicit client mode is needed). - JS tests: update prop names if changed. - Add new tests for `backend` param validation, auto-detection logic,
      error when both `backend` and `server` specified. - Existing `server` tests remain unchanged.

- [x] **7.7** Update `roxygen` docs: - `?reactable`: Add `backend` param docs. `server` param docs unchanged. - `?backendDuckDB`: Full docs with modes, examples, limitations. - Run `devtools::document()`.

- [x] **7.8** Update design docs and test Rmd: - `duckdb-wasm-engine-test.Rmd`: Replace `engine = "duckdb"` with `backend = backendDuckDB()`. - `implementation-plan.md`: Mark phase complete.

#### Validate

- [x] `reactable(data, backend = backendDuckDB())` works in static HTML (WASM) and Shiny (server)
- [x] `reactable(data, server = TRUE)` still works (completely unchanged)
- [x] `reactable(data, server = "duckdb")` still works (completely unchanged)
- [x] Error when both `backend` and `server` are specified
- [x] All existing tests pass (DuckDB tests updated to use `backend =`, server tests unchanged)
- [ ] `R CMD check` passes
- [x] `npm test` passes

---

### Phase 8: Documentation — DONE

**Goal:** Document the backend API and DuckDB feature in vignettes and NEWS.md.

- [x] **8.1** Document in vignettes: Created `vignettes/duckdb-backend.Rmd` with 1M row demo,
      "How it works" section, data size comparison table, performance comparison with default backend
      (measured in Chrome: page load, sorting, search, pagination, memory, document size at 1M and 2M rows),
      limitations, and browser requirements.
- [ ] **8.2** Update NEWS.md — deferred (hold off until closer to release)
- [x] **8.3** Update pkgdown site: Added DuckDB backend article to `pkgdown/_pkgdown.yml`.
- [x] **8.4** Update design doc: Added end-to-end benchmark section with exact stats at 1M and 2M rows
      comparing DuckDB vs default backend. Revised honest assessment based on measured data (sorting is the
      killer feature, page load is faster not slower, search is a tradeoff).

#### Validate

- [x] Vignette renders correctly
- [ ] pkgdown site builds
- [ ] NEWS.md has DuckDB engine entry (deferred)

---

### Phase 8.5: Improve duckdb-backend vignette — DONE

**Goal:** Fix vignette prose that became inaccurate after Parquet sidecar support was added.
Split into two vignettes: `duckdb-backend.Rmd` (embedded Arrow IPC) and `duckdb-backend-parquet.Rmd`
(external Parquet files).

- [x] **8.5.1** Fix the 1M row demo: force `format = "arrow"` on the main vignette demo.
- [x] **8.5.2** Update intro paragraph: mentions both Arrow IPC and Parquet with link to Parquet page.
- [x] **8.5.3** Update "How it works" steps 1-3: focused on embedded Arrow IPC path.
- [x] **8.5.4** Update comparison table: labeled as embedded Arrow IPC measurements.
- [x] **8.5.5** Fix "The DuckDB document is about 2x larger when gzip-compressed" claim: accurate for embedded.
- [x] **8.5.6** Update memory limits section: links to Parquet page for larger datasets.

#### Validate

- [ ] Vignette renders correctly with accurate prose for both Arrow IPC and Parquet modes
- [ ] 1M row demo works end-to-end (doesn't silently fail from self_contained + Parquet conflict)

---

### Phase 9: Merge `server` into `backend` + server-side data polish

**Goal:** Unify the `server` and `backend` params, deprecate `server`, fix server-side data bugs,
and document the server-side data feature. This merges work from the `server-data-3` branch
(see `design/server-side-data/server-side-data.md` for the full plan).

#### 9.0: Cherry-pick from `server-data-3` branch

- [x] **9.0.1** Cherry-pick `design/server-side-data/server-side-data.md` into this branch
      (commit `5a325715` from `server-data-3`).
- [x] **9.0.2** Cherry-pick bug fix commit `cd015147` from `server-data-3`: doc typo fix in
      `R/shiny.R` + `man/reactable-server.Rd`, dfGroupBy `__state` fix in `R/server-df.R`,
      and tests in `tests/testthat/test-server-df.R`. Resolve conflict in `R/shiny.R`
      (trivial: duckdb-wasm already has a superset of the shiny.R changes).

```r
# After Phase 9:
reactable(data, backend = backendDuckDB())     # DuckDB (auto client/server)
reactable(data, backend = backendV8())          # V8 server (currently server = TRUE)
reactable(data, backend = backendDf())          # Pure R server backend
reactable(data, backend = backendDt())          # data.table server backend
reactable(data, server = TRUE)                   # still works, undocumented, deprecated warning
```

#### 9A: `server` to `backend` migration

- [x] **9.1** Alias `server` to `backend` internally: Accept `server` via `...` args in `reactable()`.
      `server` remains an accepted but undocumented parameter. When `server` is used, emit a deprecation
      warning: "The `server` argument is deprecated. Use `backend =` instead." Map `server` values to
      backend objects: `TRUE` / `"v8"` -> `backendV8()`, `"df"` -> `backendDf()`, `"dt"` -> `backendDt()`,
      `"duckdb"` -> `backendDuckDB("server")`, S3 objects pass through.
- [x] **9.2** Create `backendV8()`, `backendDf()`, `backendDt()` constructors.
      Export and add roxygen docs. Each defined in its own `R/backend-*.R` file.
- [x] **9.3** Update `getServerBackend()` to dispatch on `backend` S3 class instead of string matching.
- [x] **9.4** Update all docs, vignettes, examples to use `backend =` instead of `server =`.
- [x] **9.5** Update tests to use `backend =` for server backends.
- [x] **9.5.1** Rename `R/server-*.R` files to `R/backend-*.R` and rename S3 classes
      from `reactable_server*` to `reactable_backend*`. Test files similarly renamed from
      `test-server-*.R` to `test-backend-*.R`. Removed `R/backends.R` -- each backend
      constructor (`backendV8()`, `backendDf()`, `backendDt()`, `backendDuckDB()`) now lives
      in its own `R/backend-*.R` file alongside its implementation and S3 methods.
      Removed unused `isServerBackend()` helper.

#### 9B: Server-side data bug fixes (from `server-data-3` branch)

- [x] **9.6** Fix documentation typo in `man/reactable-server.Rd`: second bullet says
      `reactableServerData()` should be `reactableServerInit()`. (Cherry-picked in 9.0.2.)
- [x] **9.7** Fix df backend groupBy bug: `dfGroupBy()` missing `__state` property on grouped rows,
      causing broken row identification when `Reactable.toggleGroupBy()` is called via JS API.
      (Cherry-picked in 9.0.2 with tests.)

#### 9C: Row selection for DuckDB (and all server backends)

**Goal:** Fix row selection so it works correctly with DuckDB and all server backends. Currently,
row IDs are per-page indices (0, 1, 2...) that collide across pages. This is broken for DuckDB
(both WASM and R server) and the df/dt backends (non-grouped flat rows). V8 works because it
provides `__state.id` from the server-side react-table pipeline, but it wastefully re-fetches on
every selection click.

**Current state of selection across backends:**
- **V8:** Selection visually persists across pages (thanks to `autoResetSelectedRows: false` and
  stable `__state.id`), but every click triggers an unnecessary server re-fetch because
  `state.selectedRowIds` is in the useEffect dependency array. The server ignores it.
  `manualRowSelectedKey` is commented out. Select-all only affects current page.
- **df/dt:** Non-grouped flat rows use page-relative IDs (same collision bug as DuckDB).
  Grouped rows have `__state = { id: "colName:value", grouped: true }` so they work.
- **DuckDB (WASM and server):** All rows use page-relative IDs. R warning currently blocks use.
- **Details expansion:** Works for client-side DuckDB because `details` is a JS function called
  at render time. Grouped row expansion also works because `.subRows` are fetched inline with the
  query for all visible groups. Server-side DuckDB works the same way.

**Steps:**

- [x] **9C.1** **R side:** Add `_reactable_rowid` column (0-based) to data before serializing to Arrow
      IPC / Parquet. For `backendDuckDB("server")`, add it to the data frame before `duckdb_register()`.
- [x] **9C.2** **JS side (DuckDBBackend.js):** After `query()` returns rows, extract `_reactable_rowid`,
      set `row['__state'] = { id: String(row._reactable_rowid), index: row._reactable_rowid }`, and
      delete `row._reactable_rowid`. For grouped rows, set `id` to `"colName:value"` pattern (matching
      the df backend). Include `_reactable_rowid` via `SELECT *` (hidden column approach).
- [x] **9C.3** **JS side (Reactable.js):** Extend `getRowId` to check `useDuckDB || useServerData`.
- [x] **9C.4** **R DuckDB server backend (backend-duckdb.R):** Add `__state` with `id` and `index` to
      `resolvedData()` response for flat rows. Grouped rows already have `__state` from the df backend
      pattern used in `duckdbGroupedQuery()` -- add `id` field there too.
- [x] **9C.5** **V8 server request:** Remove `state.selectedRowIds` from the V8 server request useEffect
      dependency array to stop the unnecessary re-fetch on every selection click. The V8 backend ignores
      it anyway. Keep `selectedRowIds` in the request body for future use but don't trigger re-fetches.
- [x] **9C.6** **R warning:** Remove the "not supported" warning for `selection` with `backendDuckDB()`.
- [x] **9C.7** **Tests:** Add JS tests for row selection with DuckDB (select on page 1, navigate to
      page 2, select there, navigate back -- both selections preserved). Add R tests for
      `_reactable_rowid` column in Arrow IPC / Parquet output and in server backend responses.
- [x] **9C.8** **df/dt backends:** Add `__state` with `id` and `index` to flat (non-grouped) rows in
      `dfSortFilterPage()` / `dtSortFilterPage()` to fix the same page-relative ID collision bug.

#### 9D: Cross-page select-all -- DONE

**Goal:** Make the select-all checkbox select all rows across all pages, not just the current
page. Currently, `toggleAllRowsSelected()` only iterates over rows loaded into react-table
(the current page for backend modes). Per-row selection across pages works after 9C.

**Approach:** Inverted selection model in backend modes (`manualPagination`). When select-all
is clicked, state becomes `{ selectAllRows: true, deselectedRowIds: {} }` instead of enumerating
all row IDs. Individual deselections add to the `deselectedRowIds` set. Client-side tables keep
existing behavior unchanged.

Resolved transparently at API boundaries: Shiny `getReactableState('selected')` detects the
inverted payload `{ selectAll: true, deselected: [...], rowCount: N }` and resolves to an
integer vector via `setdiff(seq_len(rowCount), deselected)`. The payload is self-contained
(no `session$userData` needed).

**Steps:**

- [x] **9D.1** Implement inverted selection model in `useRowSelect.js`: new state fields
      `selectAllRows` and `deselectedRowIds`. `toggleAllRowsSelected` in backend mode sets
      `selectAllRows` flag. `toggleRowSelected` in inverted mode adds/removes from
      `deselectedRowIds`. `selectedFlatRows` and `row.isSelected` handle both modes.
      `isAllRowsSelected` is O(1) in inverted mode. Client-side unchanged.
- [x] **9D.2** Update `Reactable.js`: `selectedRowIndexes` handles inverted mode by iterating
      visible rows and checking `!deselectedRowIds`. Shiny sync sends self-contained inverted
      payload with `rowCount` embedded.
- [x] **9D.3** Update `getReactableState("selected")` in R to detect and resolve inverted
      payload transparently. Returns integer vector always.
- [x] **9D.4** Select-all checkbox shows correct checked/indeterminate state in inverted mode
      via updated `defaultGetToggleAllRowsSelectedProps` indeterminate check.
- [x] **9D.5** Tests: 3 JS tests (cross-page select-all, deselect after select-all,
      deselect-all after select-all). R test for inverted selection resolution in
      `getReactableState`.

**Known issues (to fix next):**

1. **~~Per-row Shiny reporting incomplete:~~** Fixed. The `selectedRowIndexes` memo
   (line ~1509 in Reactable.js) now checks for backend mode (`useDuckDB || useServerData`)
   and converts `selectedRowIds` keys directly via `Number(id)` instead of looking up
   `rowsById` (which only has current-page rows). This fixes `stateInfo.selected` (used by
   `Reactable.getState`, `Reactable.onStateChange`) and the deprecated `selectionId` path.
   The duplicate backend-specific branch in the Shiny state sync effect was removed since
   `stateInfo.selected` is now correct for all modes.

   The deprecated `selectionId` Shiny input (pre-v0.3.0 API) is also fixed by the
   `selectedRowIndexes` change, since it reads from the same memo (line ~1531).

2. **~~Select-all + filter interaction:~~** Fixed. Added a `useMountedLayoutEffect` in
   `Reactable.js` that watches `state.filters` and `state.globalFilter`. When either changes
   while `selectAllRows` is true, it calls `setRowsSelected([])` to clear the inverted
   selection state. This matches client-side semantics where select-all only applies to
   the currently filtered rows.

3. **~~`unique` aggregator is nondeterministic:~~** Fixed. Added `ORDER BY 1` inside the
   `STRING_AGG` in both DuckDB WASM client (`DuckDBBackend.js`) and DuckDB R server
   (`duckdb-sql.R`). Values are now sorted alphabetically, making the output deterministic.
   The `frequency` aggregator was also checked: it's computed from sub-rows using
   `Object.entries(counts)` in JS and `table()` in R. The R version sorts alphabetically
   (via `table()`); the JS version uses insertion order. Both are stable within each
   backend, so no fix needed (minor cross-backend ordering difference is acceptable).

4. **~~Select-all has no fallback for custom backends:~~** Fixed. The `toggleAllRowsSelected`
   override now saves a reference to the original (current-page-only) implementation before
   overriding it. If `getMatchingRowIds()` returns an empty array (backend doesn't support
   `selectAll`) or throws an error, it calls through to the original, which selects
   `nonGroupedRowsById` (current-page rows). This makes the documented behavior in
   `?reactableServerData` accurate: "selection will only work for rows on the current page"
   when the backend doesn't support it.

5. **Refactor `selectAll` out of `reactableServerData`:** The `selectAll` parameter overloads
   `reactableServerData()` to serve two unrelated purposes (return page data vs. return all
   matching row IDs) with a polymorphic return type. Refactor into a separate S3 generic,
   e.g. `reactableServerSelectAll(x, data, columns, filters, searchValue, ...)`. Provide a
   default method that calls `reactableServerData()` without pagination and extracts row IDs
   from `__state$id`, so custom backends get cross-page select-all for free without
   implementing anything extra. Keep the existing overloaded approach working for backward
   compatibility (if a backend handles `selectAll` in `reactableServerData`, use that;
   otherwise dispatch to the new generic).

#### 9E: Server-side expansion (lazy sub-row fetching)

**Goal:** Only fetch sub-rows for expanded groups, not all groups on the page. Currently, in
non-`paginateSubRows` mode, all backends fetch sub-rows for every visible group (even collapsed
ones). This wastes bandwidth and query time, especially with many groups or large sub-row sets.

**Scope:** DuckDB WASM, DuckDB R server, and df backends. V8 is excluded because it runs
react-table internally and already receives `expanded` state (optimizing V8's internal rendering
is out of scope). dt backend was removed (see Deferred list).

**Current behavior (non-`paginateSubRows`):**
- DuckDB WASM `queryGrouped()`: fetches ALL sub-rows for ALL groups on the page via `IN()` query
- DuckDB R server `duckdbGroupedQuery()`: fetches ALL sub-rows per group in a loop
- df backend `dfGroupBy()`: groups entire filtered data in memory, attaches all sub-rows
- V8: sends `expanded` in POST body, re-fetches on expand/collapse (react-table in V8 handles expansion)
- `state.expanded` is deliberately NOT sent to DuckDB WASM (line ~1388: `expanded: paginateSubRows ? state.expanded : undefined`)
- `state.expanded` IS in V8 server useEffect deps (line ~1257), so V8 already re-fetches on expand

**`paginateSubRows` already works correctly:** When `paginateSubRows=true`, `expanded` is sent
to all backends and only visible expanded rows on the current page are fetched. No changes
needed for that path.

**Design:**

1. **Pass `expanded` to backends in non-`paginateSubRows` grouped mode.** Change the DuckDB
   query effect to always send `state.expanded` when `groupBy` is active (not just when
   `paginateSubRows` is true). Add `state.expanded` to the effect's dependency array so
   expanding/collapsing a group triggers a re-query.

2. **Backends only fetch sub-rows for expanded groups.** Each backend checks the `expanded`
   map. Collapsed groups get empty `.subRows` but include `__state.subRowCount` so the
   expander arrow shows. Expanded groups get full sub-rows as before.

3. **Client-side placeholder sub-rows for collapsed groups.** In `Reactable.js`, extend the
   `subRowCount` placeholder pattern (currently `paginateSubRows`-only) to also apply in
   non-`paginateSubRows` backend mode (`useDuckDB || useServerData`). This sets
   `row.subRows.length = rowState.subRowCount` so `canExpand` is true and the expander shows.

4. **Multi-level grouping:** For multi-level `groupBy`, a group is expanded if its ID is in
   the `expanded` map. Sub-groups of an expanded group follow the same rule: only fetch their
   sub-rows if they are also expanded. A collapsed parent means its children are never fetched.

**Changes per backend:**

- **DuckDB WASM (`DuckDBBackend.js` `queryGrouped()`):** Accept `expanded` param. At the leaf
  level, only fetch sub-rows (the `IN()` query) for group values where `expanded[groupId]`
  is true. For collapsed groups, set `__state.subRowCount` from `COUNT(*)` (needs to be
  added to the GROUP BY SELECT; see `_sub_count` in `buildPaginatedGroupTree` for reference).
  For multi-level, only recurse into expanded groups.

- **DuckDB R server (`backend-duckdb.R` `duckdbGroupedQuery()`):** Accept `expanded` param.
  Skip sub-row fetch for collapsed groups. Set `__state$subRowCount` from the GROUP BY
  count. The `_sub_row_count` is already computed in `duckdbBuildGroupTree()` but not in
  `duckdbGroupedQuery()` -- add `COUNT(*)` to the GROUP BY select.

- **df backend (`backend-df.R` `dfGroupBy()`):** Accept `expanded` param. After grouping,
  replace `.subRows` with empty data frames for collapsed groups. Set `__state$subRowCount`
  from `nrow()` of the original sub-rows.

- **Reactable.js:** Always send `expanded` in DuckDB query when `groupBy` is active. Always
  include `state.expanded` in dependency array when `groupBy` is active. Extend the
  `subRowCount` placeholder logic to non-`paginateSubRows` backend mode.

- **V8:** No changes. V8 already sends `expanded` and re-fetches. The V8 react-table engine
  handles expansion internally.

**Steps:**

- [x] **9E.1** **Reactable.js:** Always pass `expanded: state.expanded` (not just when
      `paginateSubRows`) in the DuckDB query effect when `groupBy` is active. Add
      `state.expanded` to the dependency array for grouped DuckDB queries. Removed the
      `paginateSubRows` guard on the `subRowCount` placeholder pattern (the inner
      `subRowCount != null` check is sufficient since we're inside `manualPagination`).
- [x] **9E.2** **Reactable.js (server data):** Verified: the V8 server useEffect already
      sends `expanded: state.expanded` and has it in deps. No changes needed; the server
      POST already includes `expanded` for all backends.
- [x] **9E.3** **DuckDB WASM (`DuckDBBackend.js`):** `queryGrouped()` accepts `expanded`.
      `buildGroupLevel()` adds `COUNT(*) AS _sub_count` to GROUP BY SELECT, classifies
      groups as expanded/collapsed, only fetches sub-rows (IN() query) for expanded groups.
      Collapsed groups get `.subRows = []` with `__state.subRowCount`. Multi-level only
      recurses into expanded groups. `expanded=undefined` means all expanded (backward compat);
      `expanded={}` means all collapsed.
- [x] **9E.4** **DuckDB R server (`backend-duckdb.R`):** `duckdbGroupedQuery()` accepts
      `expanded` and `parentId`. Adds `COUNT(*) AS _sub_row_count` to GROUP BY SELECT.
      Skips sub-row fetch for collapsed groups. Sets `__state$subRowCount` (NA for expanded,
      integer for collapsed). `expanded=NULL` is backward compat (all expanded).
- [x] **9E.5** **df backend (`backend-df.R`):** `dfGroupBy()` accepts `expanded` and
      `parentId`. After building full sub-rows and computing `subRowCount`, trims sub-rows
      for collapsed groups to empty data frames. `expanded=NULL` is backward compat.
      Passes `expanded` and `parentId` through recursion for multi-level groupBy.
- [x] **9E.6** **Tests:** 4 new JS tests (collapsed groups, expanded/collapsed mix,
      multi-level collapsed, multi-level expanded parent). 4 new df R tests (all collapsed,
      expanded/collapsed mix, backward compat, multi-level). 3 new DuckDB R tests (all
      collapsed, expanded/collapsed mix, backward compat). All 515 JS tests pass, all R tests pass.

#### 9F: Server-side data documentation

- [ ] **9.9** Create server-side data vignette (`vignettes/server-side-data.Rmd`): when to use,
      quick start, built-in backends (V8/df/dt/DuckDB server), creating custom backends, grouped
      data format, limitations, performance tips. Should cover `backendDuckDB(mode = "server")`
      as a built-in server backend option alongside V8/df/dt, and explain when to prefer it
      (e.g., SQL-based filtering vs. V8's JavaScript-based filtering).
- [ ] **9.10** Update pkgdown reference: add server-side data section with `reactableServerInit`,
      `reactableServerData`, `resolvedData`.
- [ ] **9.11** Document S3 registration for custom backends in packages (`registerS3method()`).
- [ ] **9.12** Before publicly documenting the custom backend API, decide how to handle custom
      backends in client mode. Currently, only `backendDuckDB()` works in client mode (static
      HTML / R Markdown) because it has a WASM implementation. All other backends (`backendV8()`,
      `backendDf()`, `backendDt()`, custom S3 backends) silently fall back to default client-side
      React Table behavior when used outside Shiny. Questions to resolve:
      - Should custom backends be allowed to provide client-side implementations? This would
        require a JS plugin interface, a data serialization protocol, and a dependency registration
        mechanism (similar to what DuckDB does with Arrow IPC / Parquet + duckdb-wasm JS bundle).
      - If not, should non-DuckDB backends warn when used outside Shiny instead of silently
        falling back? (e.g., "backendV8() only works in Shiny. Table will use default client-side
        processing.")
      - How should the docs describe this asymmetry? The `backend` param is unified, but the
        capabilities differ: DuckDB works everywhere, others are Shiny-only.
      - Consider whether Phase 10 (JS backend plugin) should be designed first, so the custom
        backend docs can reference a future extension point for client-side backends.

#### 9G: Server-side data API refinements (optional)

- [ ] **9.13** Benchmark V8 vs DuckDB server-side backends on large datasets (e.g., 1M rows).
      Compare initialization time (V8 startup is notably slow on large data), query speed
      (sort/filter/search), and memory usage. If DuckDB is faster across the board, consider
      deprecating and eventually removing the V8 backend entirely in favor of DuckDB as the
      default server backend. This would simplify the backend landscape and eliminate the V8
      dependency. Test with the `shiny-server-data-duckdb-1m.R` example vs the equivalent
      `shiny-server-data-1m.R` (V8) example.
      Note: V8 requires calling `reactable()` at the top level (outside `renderReactable()`)
      to avoid re-initializing the expensive V8 context on every Shiny re-render (see
      [#22](https://github.com/glin/reactable/issues/22)). DuckDB's `duckdb_register()`
      uses zero-copy access and initializes much faster, so this pattern may not be necessary.
      This is another reason to prefer DuckDB over V8.
- [ ] **9.14** Add `resolvedData()` validation for grouped `.subRows` structure.
- [ ] **9.15** Consider `reactableServerDestroy()` for backends needing cleanup (DB connections).

#### 9H: Server-side data testing

- [ ] **9.16** Add missing test coverage per `design/server-side-data/server-side-data.md` test matrix:
      Shiny integration tests (end-to-end HTTP), toggleGroupBy + df backend, invalid `resolvedData()` returns,
      `maxRowCount` pagination edge cases.

**Full server-side data plan:** See `design/server-side-data/server-side-data.md` for the complete plan
including architecture, request/response format, grouped data format, backend comparison matrix,
manual testing checklist, and related GitHub issues.

#### Validate

- [ ] `server` param still works with deprecation warning
- [ ] All existing tests pass (server + DuckDB)
- [ ] `R CMD check` passes
- [ ] Server-side data vignette renders

---

### Phase 10: Internal JS backend plugin interface

**Goal:** Define an internal generic backend interface in JS and refactor DuckDB to be a plugin of
it. This removes DuckDB-specific code paths from `Reactable.js`, making the component backend-agnostic
and laying groundwork for future custom backends. The interface is internal only -- not documented or
exposed as a public API.

#### Internal backend interface

A backend plugin is a JS object with well-known methods:

```js
// Internal interface -- not user-facing. Used by DuckDB and potentially future built-in backends.
{
  // Called once on mount. Initialize resources (WASM, DB connections, etc.).
  init: async function(props) { ... },

  // Called on every page/sort/filter/search/group change. Return one page of results.
  // Return: { data: Array<Object>, rowCount: number, maxRowCount?: number }
  resolveData: async function({ pageIndex, pageSize, sortBy, filters, searchValue, groupBy }) {
    return { data: [...], rowCount: 50000 }
  },

  // Cleanup on unmount.
  destroy: async function() {}
}
```

#### Steps

- [ ] **10.1** Refactor `Reactable.js` to consume a generic backend object instead of DuckDB-specific
      code paths. Replace `useDuckDB` flag, `duckdbRef`, `duckdbReady` state, and the DuckDB init/query
      effects with generic `useBackend`, `backendRef`, etc. The component calls `backend.init()`,
      `backend.resolveData()`, and `backend.destroy()` without knowing what backend it is.
- [ ] **10.2** Refactor `DuckDBBackend.js` to export a factory function that returns a backend object
      conforming to the resolver interface. The `duckdb-entry.js` registers this factory instead of the
      raw class. `init()` wraps WASM setup + Arrow/Parquet import, `resolveData()` wraps `query()` /
      `queryGrouped()`, `destroy()` wraps cleanup. Estimated ~15 lines of glue.
- [ ] **10.3** Add JS tests for the refactored backend plugin with DuckDB factory.

#### Validate

- [ ] DuckDB backend works identically after refactor (sort, filter, search, group, paginate, Parquet)
- [ ] No DuckDB-specific code paths remain in `Reactable.js`
- [ ] All existing JS tests pass

---

### Deferred / Future

- [x] `paginateSubRows` support for DuckDB engine: Flatten grouped + expanded rows into a single paginated list
      where sub-rows count toward the page size. See [paginate-sub-rows.md](paginate-sub-rows.md) for the design.
      Implemented for DuckDB WASM, DuckDB R server, and df server backends.
- [ ] `Reactable.setData()` JS API for DuckDB: When data changes dynamically, the DuckDB engine instance still
      holds old Arrow data and needs to be re-initialized. Currently, `setData()` only updates React state.
- [ ] Shiny `updateReactable(data = ...)` for DuckDB: Same issue as `setData()`. The DuckDB R server backend
      would need to re-register the new data, and DuckDB WASM would need re-import of Arrow IPC.
- [x] Parquet sidecar files: For very large data, write Parquet alongside HTML, query via HTTP range requests.
      Implemented: `backendDuckDB(format = "parquet")`, auto-format picks Parquet when Arrow IPC > ~20 MB.
- [ ] Remove R-side first-page pre-rendering: When `pagination = FALSE`, the pre-rendered first page is the entire
      dataset, doubling the payload (full data in Arrow IPC/Parquet + full data as JSON). Even with pagination, the
      pre-rendered JSON page is redundant weight. Consider removing R-side pre-rendering entirely and instead showing
      a loading skeleton or CSS placeholder until DuckDB initializes and returns the first page. This avoids the
      flash-of-content problem (pre-rendered page briefly visible, then replaced by DuckDB results) and eliminates
      the duplicate payload. Needs a CSS/JS loading state that prevents layout shift.
- [ ] Defer `resolveDuckDBMode()` to render time: Currently, `backendDuckDB(mode = "auto")` resolves
      client vs. server at `reactable()` call time, which means calling `reactable()` at the top level
      of a Shiny script (outside `renderReactable()`) incorrectly picks client mode. The V8 backend
      works at the top level because it has no auto-detection. To fix, defer mode resolution to
      `preRenderHook`, where the Shiny session is available. This is much simpler after removing
      first-page pre-rendering (above), since both paths would just need Arrow IPC serialization
      at `reactable()` time, with the server path discarding it in the hook. Currently, a warning
      is emitted when DuckDB client mode is rendered in Shiny.
- [x] Web Worker isolation: ~~Move DuckDB queries to a dedicated Web Worker to guarantee UI thread never blocks~~
      Already implemented. `DuckDBBackend.js` creates an `AsyncDuckDB(logger, worker)` instance with a Web Worker
      (blob URL from `duckdb-browser-eh.worker.js`). All SQL execution runs off the main thread via Worker
      `postMessage`. Only `arrowTableToRows()` result conversion runs on the main thread (unavoidable).
- [ ] Custom SQL filter methods: Let users pass custom SQL WHERE clauses per column
- [ ] Arrow IPC streaming: For Shiny, stream Arrow data incrementally instead of all-at-once
- [ ] Shared DuckDB instance: Multiple reactable tables on one page share a single DuckDB-WASM instance
- [x] CRAN package size: The `duckdb-eh.wasm` file is ~32.7 MB uncompressed but compresses to ~7.3 MB with
      gzip/tar.gz. A full source tarball is ~8.9 MB, within CRAN's 10 MB limit (CRAN prefers bundling third-party
      source software over runtime downloads, and modest limit increases are available on request). No separate
      delivery mechanism is needed.
- [ ] Add DuckDB-WASM and Apache Arrow authors/license to `DESCRIPTION` `Authors@R` field (copyright holders).
      DuckDB-WASM is MIT licensed (DuckDB Labs). Apache Arrow is Apache-2.0 licensed (Apache Software Foundation).
- [ ] Public custom JS backend API: Expose the internal backend plugin interface as a public API so users can
      write custom client-side backends. Requires substantial documentation of the backend contract, object shapes,
      return types, column discovery, and error handling. See "Design notes: custom JS backend API" below for the
      full design sketch.
- [ ] Remove `backendDf()` and `backendDt()`: These were carried over from development but are unlikely to be
      needed. DuckDB server mode should cover the same use cases with better performance. Can be removed
      without a deprecation cycle since they were never in a CRAN release.
- [ ] Virtualized windowed fetching: With `virtual = TRUE, pagination = FALSE`, DuckDB currently fetches all
      rows at once (`pageSize: null` omits LIMIT/OFFSET). For Parquet, this means downloading the entire file
      over HTTP before the table renders. Use scroll-position-driven queries to fetch only a sliding window of
      rows around the viewport, leveraging Parquet HTTP range requests for efficient partial reads. See
      `design/duckdb-wasm-engine/duckdb-wasm-engine.md` "Future: virtualized windowed fetching" section.

---

### Design notes: custom JS backend API

Design sketch for the deferred public custom JS backend feature. Not yet implemented.

**Two patterns for loading data via JS:**

1. **Load-all (data source):** Use the `data` arg with a JS callback: `data = JS("async function() { ... }")`. The
   function fetches/loads all data, then reactable handles sort/filter/paginate client-side. This mirrors how `data`
   already works -- it provides the full dataset, just asynchronously from JS instead of from R.

2. **Per-page resolver:** Use `backend = JS("{...}")` with a resolver object that handles sort/filter/paginate
   per-request (like the internal backend plugin interface in Phase 10, but user-facing).

**Resolver interface (user-facing version of Phase 10 internal interface):**

```js
// backend = JS("{ ... }")
{
  // Optional. Called once on mount. Initialize resources.
  init: async function() { ... },

  // Called on every page/sort/filter/search change. Return one page of results.
  // Return: { data: Array<Object>, rowCount: number }
  resolveData: async function({ pageIndex, pageSize, sortBy, filters, searchValue, groupBy }) {
    const params = new URLSearchParams({ page: pageIndex, size: pageSize })
    const resp = await fetch('/api/data?' + params)
    const json = await resp.json()
    return { data: json.rows, rowCount: json.total }
  },

  // Optional. Cleanup on unmount.
  destroy: async function() {}
}
```

**Column type declaration:** When using JS backends with no R data, declare column types via a zero-row
data.frame: `data.frame(col = numeric(0), name = character(0))`. This gives R the column names and types
(like `vapply`'s `FUN.VALUE` pattern) without requiring actual data.

**DuckDB as plugin:** `DuckDBBackend` wraps as a resolver factory -- ~15 lines of glue mapping `init()` to
WASM setup + Arrow/Parquet import, `resolveData()` to `query()`/`queryGrouped()`, `destroy()` to cleanup.

**Use cases:**

1. External CSV/Parquet on same site (fetch hosted file, client-side sort/filter)
2. External paged API (REST endpoint with pages + total count)
3. Custom in-browser databases (SQLite-WASM, OPFS, IndexedDB)
4. DuckDB over arbitrary remote Parquet URLs

**Open questions:**

- Column discovery for load-all mode: infer from first row of returned data, or require predefinition?
- Grouped data in resolver mode: support `.subRows` in return value, or only for built-in backends?
- Backend factory vs object: `function(tableId) { return {...} }` for per-instance state, or plain object?
- Loading state / error state rendering (shared concern with "remove pre-rendering" deferred item)
