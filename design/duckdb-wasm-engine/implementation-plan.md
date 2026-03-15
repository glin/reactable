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

### Phase 1: Arrow IPC serialization in R
**Goal:** Replace JSON serialization with Arrow IPC as an opt-in format. This is valuable on its own — Arrow is
faster to serialize, smaller, and handles NA/NaN/Inf natively. No DuckDB yet.

#### Steps

- [ ] **1.1** Add `arrow` to Suggests in DESCRIPTION
- [ ] **1.2** In `reactable()`, add `engine` parameter (after `server` param):
  ```r
  reactable <- function(
    data,
    # ... existing params ...
    server = FALSE,
    engine = NULL,    # NEW: NULL (default/JSON), "duckdb"
    selectionId = NULL
  )
  ```
- [ ] **1.3** Add Arrow serialization function in `R/utils.R` or new `R/engine.R`:
  ```r
  serializeArrowIPC <- function(data) {
    if (!requireNamespace("arrow", quietly = TRUE)) {
      stop('The arrow package is required for engine = "duckdb". ',
           'Run install.packages("arrow")', call. = FALSE)
    }
    raw_bytes <- arrow::write_ipc_stream(data, raw())
    base64enc::base64encode(raw_bytes)
  }
  ```
- [ ] **1.4** When `engine = "duckdb"`, serialize data as Arrow IPC instead of JSON:
  ```r
  if (identical(engine, "duckdb")) {
    data_payload <- list(
      arrowIPC = serializeArrowIPC(data),
      format = "arrow-ipc-base64"
    )
    # Pass Arrow payload instead of JSON data string
  } else {
    data <- toJSON(data)
  }
  ```
- [ ] **1.5** Add `base64enc` to Suggests in DESCRIPTION (or use `jsonlite::base64_enc` which is already
  a dependency)

#### Validate
- [ ] `arrow::write_ipc_stream(mtcars, raw())` round-trips correctly for: numeric, character, factor, Date,
  POSIXct, logical, integer, NA, NaN, Inf, -Inf
- [ ] Base64-encoded Arrow IPC of 100K rows is ≤ size of equivalent JSON (should be smaller)
- [ ] Existing `reactable(mtcars)` (no engine param) is completely unchanged
- [ ] `R CMD check` passes

---

### Phase 2: DuckDB-WASM JavaScript engine — MVP pagination
**Goal:** Get a reactable table that loads Arrow data into DuckDB-WASM and paginates via SQL. This is the core
proof that the full pipeline works end-to-end (R → Arrow → browser → DuckDB → react-table).

**Scope for MVP:** Pagination ONLY. No sorting, no filtering, no grouping. Just `SELECT * FROM data LIMIT ? OFFSET ?`.

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
  ```r
  reactable(
    MASS::Cars93[rep(seq_len(nrow(MASS::Cars93)), 1000), ],  # ~93K rows
    engine = "duckdb",
    defaultPageSize = 25
  )
  ```

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

### Phase 3: Sort + filter + search
**Goal:** Full interactive table powered by DuckDB-WASM.

#### Steps

- [ ] **3.1** Add sort SQL to `DuckDBEngine.query()`:
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

- [ ] **3.2** Wire `state.sortBy`, `state.filters`, `state.globalFilter` into the DuckDB query effect
  (add to the useEffect dependency array alongside pageIndex/pageSize)

- [ ] **3.3** Handle numeric filter matching: current reactable uses "starts with" for numeric columns.
  In SQL: `CAST(col AS VARCHAR) LIKE ? || '%'` (vs ILIKE for text). Detect column type from the
  column metadata already passed from R.

- [ ] **3.4** Update `duckdb-basic.Rmd` test to enable `searchable = TRUE, filterable = TRUE`

#### Validate
- [ ] Click column header → sorts ascending → click again → descending → click again → unsorted
- [ ] Multi-column sort (shift+click) works
- [ ] Type in search box → results filter, row count updates
- [ ] Type in column filter → results filter
- [ ] Numeric column filter: typing "5" shows values starting with 5 (50, 500, 5.1, etc.)
- [ ] String column filter: typing "ford" shows values containing "ford" (case-insensitive)
- [ ] Filter + sort combination works
- [ ] Page count updates after filtering
- [ ] Sort performance: <300ms on 100K rows (measure in DevTools)
- [ ] Filter performance: <300ms on 100K rows

---

### Phase 4: DuckDB R server backend
**Goal:** A `server = "duckdb"` backend for Shiny that uses the DuckDB R package. Data stays on the server, but
queries are fast (DuckDB instead of data.frame `grepl`/`order`). See design doc for architecture and rationale.

#### Steps

- [ ] **4.1** Add `duckdb` and `DBI` to Suggests in DESCRIPTION

- [ ] **4.2** Create `R/server-duckdb.R` — implements `reactableServerInit` and `reactableServerData` S3 methods
  for class `reactable_serverDuckdb`. Uses `duckdb_register()` for zero-copy data access.

- [ ] **4.3** Create `R/duckdb-sql.R` — shared SQL query builder (`buildDuckdbQuery`, `buildDuckdbCountQuery`).
  Uses `DBI::dbQuoteIdentifier()` for column names and parameterized `?` placeholders for filter values.
  Must match the JS `DuckDBEngine` query builder behavior exactly — same WHERE/ORDER BY/LIMIT SQL for
  the same inputs.

- [ ] **4.4** Register `"duckdb"` in `getServerBackend()` in `R/shiny.R`:
  ```r
  backends <- list(v8 = serverV8, df = serverDf, dt = serverDt, duckdb = serverDuckdb)
  ```

- [ ] **4.5** Create test Shiny app: `inst/examples/shiny-server-data-duckdb.R`

- [ ] **4.6** Add shared SQL builder test cases (`tests/testthat/test-duckdb-sql.R`) that verify identical
  SQL output for known inputs. These same test cases should be mirrored in the JS tests to guarantee
  R and JS produce the same queries.

#### Validate
- [ ] Shiny app with `reactable(data, server = "duckdb")` renders and paginates
- [ ] Sort/filter/search all work identically to the V8 backend
- [ ] Benchmark vs. V8 backend and df backend on 500K rows:
  - Measure: sort click latency, filter typing latency, page click latency
- [ ] `duckdb_register()` confirms zero-copy (check memory before/after)
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

- [ ] Parquet sidecar files: For very large data, write Parquet alongside HTML, query via HTTP range requests
- [ ] Web Worker isolation: Move DuckDB queries to a dedicated Web Worker to guarantee UI thread never blocks
- [ ] Custom SQL filter methods: Let users pass custom SQL WHERE clauses per column
- [ ] Arrow IPC streaming: For Shiny, stream Arrow data incrementally instead of all-at-once
- [ ] Shared DuckDB instance: Multiple reactable tables on one page share a single DuckDB-WASM instance

---

## File inventory (what gets created/modified)

### New files
| File | Purpose |
|------|---------|
| `R/server-duckdb.R` | DuckDB R server backend (S3 methods) |
| `R/duckdb-sql.R` | Shared SQL query builder for R backend |
| `srcjs/DuckDBEngine.js` | DuckDB-WASM engine class |
| `design/duckdb-wasm-engine/poc.html` | Phase 0 standalone proof-of-concept |
| `vignettes-test/duckdb-basic.Rmd` | Test document for development |
| `inst/examples/shiny-server-data-duckdb.R` | Shiny test app |
| `srcjs/__tests__/DuckDBEngine.test.js` | JS tests |
| `tests/testthat/test-server-duckdb.R` | R tests |

### Modified files
| File | Change |
|------|--------|
| `DESCRIPTION` | Add arrow, duckdb, base64enc to Suggests |
| `R/reactable.R` | Add `engine` parameter, Arrow serialization path |
| `R/shiny.R` | Register "duckdb" in `getServerBackend()` |
| `srcjs/Reactable.js` | Add engine/arrowData props, DuckDB query effects |
| `webpack.config.client.js` | Handle DuckDB-WASM bundling/dynamic import |
| `package.json` | Add @duckdb/duckdb-wasm, apache-arrow deps |
| `NEWS.md` | Document new feature |
| `.Rbuildignore` | Exclude poc.html and design files |

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
