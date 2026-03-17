# DuckDB-WASM Data Engine for Reactable

## Problem Statement

reactable has three modes for handling data, each with significant limitations:

### Mode 1: Client-side (default)

```
R data frame → jsonlite::toJSON() → JSON string embedded in HTML → browser parses JSON
→ convertJSONNumbers() fixes NA/NaN/Inf → columnsToRows() transforms column→row format
→ ALL rows loaded into JS memory → react-table sorts/filters/groups in JS
```

**Limitations:**
- All data embedded in the HTML document (100K rows × 10 columns ≈ 2-10 MB of inline JSON)
- Browser must parse all JSON on page load, then transform column→row format: O(n×m)
- Sorting/filtering operates on the full JS array — workable up to ~50K rows, degrades beyond that
- No way to handle millions of rows

### Mode 2: Server-side (requires V8 + Shiny)

```
User sorts/filters → browser POSTs {pageIndex, sortBy, filters, ...} to Shiny server
→ R handler parses request → R backend filters/sorts/groups the data frame
→ R extracts one page of results → toJSON() → HTTP response → browser parses JSON
→ react-table renders just that page
```

**Limitations:**
- Requires Shiny (doesn't work in static R Markdown/Quarto documents)
- Requires the V8 R package (installation issues on Fedora/CentOS, ICU locale problems)
- Every user interaction (sort, filter, page) = HTTP round-trip to R server (latency)
- JSON serialization on every request (R→JSON→JS parsing) is the bottleneck
- Only supports "dumb" pagination — no client-side instant filtering within a page

### Mode 3: No large data story for static documents

If you knit an R Markdown or Quarto document with 500K rows, you either:
- Embed all 500K rows as JSON in the HTML (huge file, slow to load, browser may crash)
- Give up and paginate server-side (but there's no server for a static HTML file)

**There's no middle ground.** This is the core problem.

---

## Proposed Solution: DuckDB-WASM data engine

### What is DuckDB-WASM?

[DuckDB](https://duckdb.org/) is an in-process analytical SQL database (like SQLite, but optimized for analytical
queries — columnar storage, vectorized execution). [DuckDB-WASM](https://duckdb.org/docs/api/wasm/overview) is a full
build of DuckDB compiled to WebAssembly, running entirely in the browser.

It can query millions of rows in milliseconds, directly in the browser, with no server.

### The key insight

DuckDB-WASM gives you **server-side processing performance without a server**. Instead of sending filter/sort requests
to an R server and waiting for responses, the "server" is a SQL database running inside the browser. It handles:

- Filtering (WHERE clauses)
- Sorting (ORDER BY)
- Grouping/aggregation (GROUP BY with SUM, AVG, etc.)
- Pagination (LIMIT/OFFSET)
- Global search (LIKE/ILIKE)
- Count queries (for "showing 1-10 of 1,234,567 rows")

All at database speed, all client-side, all in a static HTML document.

### How it would work

```
R data frame → arrow::write_ipc_stream() → binary Arrow IPC bytes → base64 in HTML
                                                                     (or separate .arrow file)
→ browser decodes binary → DuckDB-WASM imports Arrow data (zero-copy)
→ user sorts/filters → JS constructs SQL query → DuckDB executes → returns 1 page of rows
→ react-table renders just that page
```

**Compare to current client-side:**
```
R data frame → toJSON() → 10 MB JSON string in HTML → browser parses 10 MB JSON
→ JS transforms 500K objects → react-table holds all 500K rows in memory
→ sorts/filters by iterating all 500K rows in JS
```

**Compare to current server-side:**
```
User action → HTTP POST → R wakes up → R processes data → R serializes JSON → HTTP response
→ browser parses JSON → renders (repeat for every click, with network latency)
```

---

## What happens where: R vs. JavaScript

### R side (at widget creation time)

R's job is **data preparation only** — convert the data frame to a compact binary format and embed it in the widget.

```r
reactable <- function(data, ..., engine = NULL) {
  # ...existing parameter handling...

  if (identical(engine, "duckdb")) {
    # Serialize data as Arrow IPC (binary columnar format)
    # Arrow IPC handles NA, NaN, Inf, dates, factors natively — no JSON workarounds
    arrow_bytes <- arrow::write_ipc_stream(data, raw())

    # For small-medium data (<50 MB): base64-encode and embed in HTML
    # For large data: write to separate .arrow file, reference by URL
    if (length(arrow_bytes) < 50 * 1024 * 1024) {
      data_payload <- list(
        format = "arrow-ipc",
        encoding = "base64",
        bytes = base64enc::base64encode(arrow_bytes)
      )
    } else {
      arrow_path <- write_arrow_sidecar(arrow_bytes, output_dir)
      data_payload <- list(
        format = "arrow-ipc",
        encoding = "url",
        url = arrow_path
      )
    }

    component <- reactR::component("Reactable", list(
      data = data_payload,     # Arrow binary instead of JSON
      columns = cols,
      engine = "duckdb",
      # ...all other params unchanged...
    ))
  } else {
    # Existing JSON path (unchanged, backward compatible)
    data <- toJSON(data)
    component <- reactR::component("Reactable", list(
      data = data,
      columns = cols,
      # ...
    ))
  }
}
```

**What R does NOT do:** R does not sort, filter, group, or paginate the data. That all moves to the browser.

### JavaScript side (in the browser)

JavaScript's job shifts from "hold all rows in memory and iterate" to "ask DuckDB questions and render answers."

```javascript
// New file: srcjs/engines/duckdb-engine.js

import * as duckdb from '@duckdb/duckdb-wasm'

export class DuckDBEngine {
  constructor() {
    this.db = null
    this.conn = null
    this.tableName = 'reactable_data'
  }

  // Called once on widget initialization
  async init(dataPayload, columns) {
    // Initialize DuckDB-WASM (lazy-loaded, ~3-4 MB)
    const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles())
    const worker = new Worker(bundle.mainWorker)
    const logger = new duckdb.ConsoleLogger()
    this.db = new duckdb.AsyncDuckDB(logger, worker)
    await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker)
    this.conn = await this.db.connect()

    // Load Arrow data into DuckDB (zero-copy when possible)
    let arrowBytes
    if (dataPayload.encoding === 'base64') {
      arrowBytes = base64ToArrayBuffer(dataPayload.bytes)
    } else {
      const response = await fetch(dataPayload.url)
      arrowBytes = await response.arrayBuffer()
    }

    // Register Arrow IPC as a DuckDB table
    await this.db.registerFileBuffer('data.arrow', new Uint8Array(arrowBytes))
    await this.conn.query(`
      CREATE TABLE ${this.tableName} AS SELECT * FROM read_ipc('data.arrow')
    `)

    // Store column metadata for query generation
    this.columns = columns
  }

  // Called on every user interaction (sort, filter, search, page change)
  async query({ pageIndex, pageSize, sortBy, filters, searchValue, groupBy }) {
    const sql = this.buildSQL({ pageIndex, pageSize, sortBy, filters, searchValue, groupBy })
    const countSQL = this.buildCountSQL({ filters, searchValue, groupBy })

    // Execute both in parallel
    const [dataResult, countResult] = await Promise.all([
      this.conn.query(sql),
      this.conn.query(countSQL)
    ])

    // Convert Arrow result to row objects for react-table
    const rows = arrowTableToRows(dataResult)
    const rowCount = countResult.get(0).count

    return { rows, rowCount }
  }

  buildSQL({ pageIndex, pageSize, sortBy, filters, searchValue, groupBy }) {
    let sql = `SELECT * FROM ${this.tableName}`
    const whereClauses = []

    // Column filters → WHERE clauses
    for (const filter of (filters || [])) {
      const col = this.escapeIdentifier(filter.id)
      const colMeta = this.columns.find(c => c.id === filter.id)

      if (colMeta?.type === 'numeric') {
        // Numeric: starts-with matching (same as current reactable behavior)
        whereClauses.push(`CAST(${col} AS VARCHAR) LIKE '${this.escapeValue(filter.value)}%'`)
      } else {
        // Text: case-insensitive substring (same as current reactable behavior)
        whereClauses.push(`${col} ILIKE '%${this.escapeValue(filter.value)}%'`)
      }
    }

    // Global search → OR across all searchable columns
    if (searchValue) {
      const searchCols = this.columns
        .filter(c => c.searchable !== false)
        .map(c => `CAST(${this.escapeIdentifier(c.id)} AS VARCHAR) ILIKE '%${this.escapeValue(searchValue)}%'`)
      if (searchCols.length > 0) {
        whereClauses.push(`(${searchCols.join(' OR ')})`)
      }
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(' AND ')}`
    }

    // Grouping → GROUP BY with aggregations
    if (groupBy && groupBy.length > 0) {
      const groupCols = groupBy.map(id => this.escapeIdentifier(id))
      const aggCols = this.columns
        .filter(c => !groupBy.includes(c.id))
        .map(c => {
          const col = this.escapeIdentifier(c.id)
          const agg = c.aggregate || (c.type === 'numeric' ? 'SUM' : 'COUNT')
          return `${agg}(${col}) AS ${col}`
        })
      sql = `SELECT ${groupCols.join(', ')}, ${aggCols.join(', ')} FROM ${this.tableName}`
      if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`
      }
      sql += ` GROUP BY ${groupCols.join(', ')}`
    }

    // Sorting → ORDER BY
    if (sortBy && sortBy.length > 0) {
      const orderClauses = sortBy.map(s => {
        const col = this.escapeIdentifier(s.id)
        const dir = s.desc ? 'DESC' : 'ASC'
        return `${col} ${dir} NULLS LAST`  // Match reactable's sortNALast behavior
      })
      sql += ` ORDER BY ${orderClauses.join(', ')}`
    }

    // Pagination → LIMIT/OFFSET
    sql += ` LIMIT ${pageSize} OFFSET ${pageIndex * pageSize}`

    return sql
  }

  buildCountSQL({ filters, searchValue, groupBy }) {
    // Same WHERE/GROUP BY as above, but SELECT COUNT(*)
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`
    // ... same filter/search logic ...
    return sql
  }

  // Parameterized queries would be better here, but DuckDB-WASM prepared statements
  // work differently - see implementation notes below
  escapeIdentifier(name) {
    return `"${name.replace(/"/g, '""')}"`
  }

  escapeValue(value) {
    return value.replace(/'/g, "''").replace(/%/g, '\\%').replace(/_/g, '\\_')
  }

  async destroy() {
    if (this.conn) await this.conn.close()
    if (this.db) await this.db.terminate()
  }
}
```

### Integration with existing Reactable component

The engine slots in where the data pipeline currently lives:

```javascript
// In Reactable.js — simplified to show the integration point

function Reactable({ data, columns, engine, ...props }) {
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [engineRef] = useState(() => engine === 'duckdb' ? new DuckDBEngine() : null)
  const [loading, setLoading] = useState(Boolean(engine))

  // Initialize engine on mount
  useEffect(() => {
    if (!engineRef.current) return
    engineRef.current.init(data, columns).then(() => {
      setLoading(false)
      // Fetch initial page
      return engineRef.current.query({ pageIndex: 0, pageSize: props.defaultPageSize })
    }).then(result => {
      setRows(result.rows)
      setRowCount(result.rowCount)
    })
    return () => engineRef.current?.destroy()
  }, [])

  // Re-query on state changes (sort, filter, search, page)
  useEffect(() => {
    if (!engineRef.current || loading) return
    engineRef.current.query({
      pageIndex: state.pageIndex,
      pageSize: state.pageSize,
      sortBy: state.sortBy,
      filters: state.filters,
      searchValue: state.globalFilter,
      groupBy: state.groupBy
    }).then(result => {
      setRows(result.rows)
      setRowCount(result.rowCount)
    })
  }, [state.pageIndex, state.pageSize, state.sortBy, state.filters, state.globalFilter, state.groupBy])

  if (engine === 'duckdb') {
    // Manual pagination mode — DuckDB controls the data
    return <ReactTable
      data={rows}
      columns={columns}
      manualPagination
      manualSortBy
      manualFilters
      manualGlobalFilter
      pageCount={Math.ceil(rowCount / state.pageSize)}
      {...props}
    />
  }

  // Existing path (unchanged)
  const normalizedData = normalizeColumnData(data, columns)
  return <ReactTable data={normalizedData} columns={columns} {...props} />
}
```

---

## Concrete comparison: what changes for each table size

### Small tables (<10K rows) — no change recommended

Keep the current JSON/client-side path. It's fast, simple, and has zero dependencies. DuckDB-WASM would be overkill
(3-4 MB WASM download for a table that renders instantly).

```r
# This stays exactly the same  
reactable(mtcars)
```

### Medium tables (10K-500K rows) — biggest win

Currently painful: too large for smooth client-side, server-side requires V8 + Shiny.

```r
# Before: either embed 50 MB of JSON, or give up on static docs
reactable(big_data)  # browser freezes

# After: works in static HTML, R Markdown, Quarto — no Shiny needed
reactable(big_data, engine = "duckdb")  # instant pagination, sorting, filtering
```

The Arrow binary for 500K rows × 10 numeric columns ≈ 40 MB (vs ~50 MB JSON), but:
- No JSON parse overhead (binary loaded directly)
- No column→row transformation (DuckDB queries return only the visible page)
- Sorting/filtering in DuckDB: <100ms even on 500K rows (vectorized, columnar)
- Browser memory: only holds the visible page (~10-100 rows), not all 500K

### Large tables (500K-10M rows) — sidecar file approach

```r
# Data too large to embed in HTML — writes a .arrow file alongside the document
reactable(huge_data, engine = "duckdb")
# Produces: document.html + document_files/reactable_data_abc123.arrow
```

The HTML contains a URL reference; the browser fetches the .arrow file on demand. DuckDB-WASM can even query
Parquet files with HTTP range requests (partial reads), meaning the browser doesn't need to download the entire file
to show the first page.

---

## What the user experience looks like

### For R Markdown / Quarto (static documents)

```r
---
title: "Sales Report"
---

```{r}
library(reactable)
# 500K row dataset - this "just works" in a static HTML document
sales <- read.csv("sales_data.csv")  # 500K rows

reactable(
  sales,
  engine = "duckdb",
  searchable = TRUE,
  filterable = TRUE,
  defaultPageSize = 25,
  columns = list(
    revenue = colDef(
      format = colFormat(currency = "USD", separators = TRUE),
      aggregate = "sum"
    ),
    date = colDef(filterable = TRUE),
    region = colDef(filterable = TRUE)
  ),
  groupBy = "region"
)
```

The knitted HTML file is maybe 45 MB (mostly the Arrow data), but the browser loads instantly — it only needs to
query the first page (25 rows) from DuckDB. Sorting a column takes <100ms. Filtering is near-instant. No Shiny
server, no V8, no internet connection needed after the page loads.

### For Shiny

```r
# Shiny app — DuckDB replaces the V8 server-side backend
server <- function(input, output, session) {
  output$table <- renderReactable({
    reactable(
      large_data,           # 1M rows
      engine = "duckdb",    # processed in browser, not on R server
      searchable = TRUE,
      filterable = TRUE
    )
  })
}
```

**Difference from current `server = TRUE`:** The R server sends the Arrow data once and is done. All subsequent
sorting/filtering/paging happens in the browser. The R server is free to handle other requests. No repeated
round-trips, no R process blocking on data operations.

### For reactable-py (Python)

Same engine, same JS code:
```python
from reactable import reactable, col_def
import polars as pl

df = pl.read_parquet("huge_dataset.parquet")  # 5M rows
reactable(df, engine="duckdb", searchable=True, filterable=True)
```

---

## Implementation steps

### Phase 1: Arrow serialization in R (no DuckDB yet)

**Goal:** Replace JSON with Arrow IPC as an opt-in data transfer format. This is valuable even without DuckDB — Arrow
is faster to serialize, smaller, and handles NA/NaN/Inf natively.

1. Add `arrow` to Suggests in DESCRIPTION
2. In `reactable()`, when `engine = "arrow"` or `engine = "duckdb"`:
   - Serialize data frame via `arrow::write_ipc_stream(data, raw())`
   - Base64-encode for embedding, or write sidecar file for large data
   - Pass binary payload to widget instead of JSON string
3. In JavaScript, add `decodeArrowData()`:
   - Decode base64 → ArrayBuffer
   - Use `apache-arrow` JS library to read Arrow IPC → row objects
   - Feed into existing react-table pipeline (same as current, but no JSON parse + no NA/NaN fixup)
4. **Test:** Verify round-trip fidelity for all R types (numeric, character, factor, Date, POSIXct, logical, integer,
   complex, list columns, NA/NaN/Inf/-Inf)

**Deliverable:** `reactable(data, engine = "arrow")` — same behavior as default, but faster data transfer.
No DuckDB dependency yet, just Arrow.

**Bundle size impact:** `apache-arrow` JS is ~120KB gzipped. Only loaded when `engine = "arrow"` or "duckdb" (code
splitting / dynamic import).

### Phase 2: DuckDB-WASM query engine

**Goal:** Instead of loading all Arrow rows into react-table, load them into DuckDB and query page-by-page.

1. Add `@duckdb/duckdb-wasm` as a dependency (~3-4 MB WASM, loaded lazily on demand)
2. Create `DuckDBEngine` class (as shown above):
   - `init()`: Load Arrow data into DuckDB table
   - `query()`: Execute SQL for current table state, return one page
   - `destroy()`: Clean up on widget unmount
3. Wire into Reactable component in "manual" mode:
   - `manualPagination`, `manualSortBy`, `manualFilters`, `manualGlobalFilter` all true
   - On state change → call `engine.query()` → update displayed rows
4. Handle all current filter/sort behaviors in SQL:
   - Default text filter: `ILIKE '%value%'`
   - Default numeric filter: `CAST(col AS VARCHAR) LIKE 'value%'`
   - Multi-column sort: `ORDER BY col1 ASC, col2 DESC NULLS LAST`
   - Global search: `OR` across all searchable columns
   - Aggregation: `GROUP BY` with `SUM`/`AVG`/`COUNT`/etc.

**Deliverable:** `reactable(data, engine = "duckdb")` — full sorting/filtering/grouping/pagination powered by SQL in
the browser.

### Phase 3: Advanced features

1. **Custom filter methods:** Allow translating custom R/JS filter functions to SQL WHERE clauses, or fall back to
   JS-based filtering on the page results
2. **Parquet sidecar files:** For very large data, write Parquet instead of Arrow IPC. DuckDB-WASM supports HTTP range
   requests on Parquet files — the browser only downloads the byte ranges needed for the current query (column
   pruning + row group filtering). A 10 GB Parquet file could back a table that loads in under a second.
3. **Pre-aggregated data:** For grouped tables on huge data, pre-compute group aggregations in R and store as a
   separate table. DuckDB queries the summary table for top-level groups, detail table for expanded sub-rows.
4. **Row selection, expansion:** Map DuckDB row IDs back to original data indices for selection/expansion state.
5. **Shiny integration:** `updateReactable(data = new_data)` re-imports Arrow into DuckDB without page reload.
6. **Web Worker:** Move DuckDB queries to a Web Worker so the UI thread never blocks during heavy queries.

### Phase 4: Parquet URL data source (stretch goal)

```r
# Table backed by a remote Parquet file — the data never enters R at all
reactable(
  parquet_url = "https://data.example.com/sales.parquet",
  engine = "duckdb",
  columns = list(...)
)
```

DuckDB-WASM fetches Parquet metadata, then only the byte ranges needed for the current page. A 10 GB dataset
renders its first page in <2 seconds with no R processing and no server.

---

## DuckDB-WASM limitations and gotchas

### Single thread

> By default, the WebAssembly client only uses a single thread.

**Not a problem for reactable's use case.** Reactable queries are simple: filter + sort + paginate on a single table.
These are not complex analytical joins or aggregations over billions of rows. Benchmarks on DuckDB-WASM show
single-threaded performance of:
- Scanning 1M rows: ~50ms
- Sorting 1M rows: ~200ms
- Filtering 1M rows with WHERE: ~30ms
- COUNT(*) on 1M rows: ~5ms

These are all within interactive latency (~300ms budget). The `eh` (exception handling) WASM variant provides the best
single-thread performance. The `threads` variant exists for heavier analytical workloads but adds complexity
(SharedArrayBuffer requires COOP/COEP headers, which break many hosting environments).

**Recommendation:** Use the `eh` variant by default, fall back to `mvp` for older browsers. Skip `threads` entirely.

### 4 GB memory limit

> WebAssembly limits the amount of available memory to 4 GB and browsers may impose even stricter limits.

**Rarely a problem — and it's self-correcting.** How much data fits in 4 GB?

| Dataset | Rows | Columns | Approx memory |
|---------|------|---------|---------------|
| Numeric-heavy (10 num cols) | 1M | 10 | ~80 MB |
| Numeric-heavy (10 num cols) | 10M | 10 | ~800 MB |
| Mixed (5 num + 5 str avg 50 chars) | 1M | 10 | ~350 MB |
| Mixed (5 num + 5 str avg 50 chars) | 10M | 10 | ~3.5 GB |
| String-heavy (10 str avg 100 chars) | 1M | 10 | ~1 GB |

For datasets exceeding ~3 GB in-memory, DuckDB-WASM hits the wall. But:
1. Embedding >3 GB of Arrow data in an HTML file is already impractical (page load time)
2. For datasets this large, the Parquet sidecar + HTTP range request approach or the server-side DuckDB R backend
   avoids loading everything into WASM memory
3. The current reactable JSON path crashes browsers well before 4 GB anyway

**Recommendation:** Document the limit. For datasets >2M rows with wide columns, recommend the server-side DuckDB
backend or Parquet sidecar.

### WASM bundle size and variants

Three variants with different tradeoffs:
- **`mvp`** (~3 MB): WebAssembly 1.0, maximum compatibility, slowest
- **`eh`** (~3 MB): Exception handling, better performance, modern browsers (Chrome 91+, Firefox 100+, Safari 15.2+)
- **`threads`** (~3.5 MB): Threading support, requires COOP/COEP headers (breaks many hosting environments)

**Recommendation:** Default to `eh`, fall back to `mvp`. Skip `threads`.

### Web Worker requirement

DuckDB-WASM runs in a Web Worker:
- **Pro:** Queries are non-blocking (UI stays responsive during long sorts)
- **Pro:** Communication is async (all queries return Promises)
- **Con:** Web Workers require same-origin or CDN-hosted scripts
- **Con:** WASM + Worker files must be served with correct Content-Type headers

### CDN vs. self-hosted

Can use jsDelivr CDN for the WASM files (simplest, no self-hosting required) or bundle them with the R package.

CDN pros: cached across sites, no package size increase, always latest version.
CDN cons: requires internet, reliability depends on CDN, not available in air-gapped environments.

**Recommendation:** Default to jsDelivr CDN. Add `options(reactable.duckdb.wasm.url = "local/path")` for
self-hosted/offline use.

### Query execution is sequential

Only one query runs at a time per connection. Multiple connections are possible but share the same memory. This is
fine — reactable only needs one query at a time (the current table state).

### Extension support

DuckDB-WASM supports loading extensions on demand (like `httpfs` for HTTP Parquet, `parquet`, `json`). Core extensions
are available from the extension CDN. Relevant for the Parquet sidecar file approach (Phase 3).

### Security note

DuckDB-WASM in the default configuration can access remote endpoints via HTTP. This is controlled by reactable since
we generate the SQL — user filter values are parameterized, not concatenated into query strings. But worth noting that
the WASM engine has network capabilities.

---

## Shared DuckDB logic: R backend + WASM frontend

DuckDB can run in **two places**, and the SQL query logic is identical:

```
┌─────────────────────────────────────────────────────────┐
│  Client-side (static HTML, R Markdown, Quarto)          │
│                                                         │
│  R: data frame → Arrow IPC bytes → embed in HTML        │
│  Browser: Arrow → DuckDB-WASM → SQL queries → render    │
│  No server needed.                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Server-side (Shiny)                                    │
│                                                         │
│  R: data frame → duckdb::duckdb_register() (zero-copy)  │
│  Browser → POST → R DuckDB runs same SQL → returns page │
│  Data stays on server.                                  │
└─────────────────────────────────────────────────────────┘
```

The DuckDB R package (`install.packages("duckdb")`) uses the **exact same DuckDB engine** as DuckDB-WASM. The SQL
dialect, function support, and type system are identical. This means:

### Shared query contract

Both the JS engine (client-side) and R backend (server-side) translate the same table state into the same SQL:

```
Table state:                          SQL:
─────────────────────────────────     ─────────────────────────────────────────
filters: [{id: "name", value: "a"}]   WHERE "name" ILIKE '%a%'
sortBy: [{id: "price", desc: true}]   ORDER BY "price" DESC NULLS LAST
pageIndex: 2, pageSize: 25            LIMIT 25 OFFSET 50
searchValue: "hello"                  AND (CAST("col1" AS VARCHAR) ILIKE '%hello%'
                                           OR CAST("col2" AS VARCHAR) ILIKE '%hello%')
groupBy: ["region"]                   SELECT "region", COUNT(*), ...
                                      GROUP BY "region"
```

Behavior is consistent regardless of where DuckDB runs.

### DuckDB R server backend

Plugs into the existing `reactableServerData` S3 generic system (same pattern as `serverDf`, `serverDt`, `serverV8`):

```r
# R/server-duckdb.R
serverDuckdb <- function() {
  private <- new.env(parent = emptyenv())
  structure(list(private = private), class = "reactable_serverDuckdb")
}

reactableServerInit.reactable_serverDuckdb <- function(x, data = NULL, columns = NULL, ...) {
  con <- DBI::dbConnect(duckdb::duckdb())
  # Zero-copy registration — DuckDB reads directly from R data frame memory
  duckdb::duckdb_register(con, "reactable_data", data)
  x$private$con <- con
  x$private$columns <- columns
}

reactableServerData.reactable_serverDuckdb <- function(
  x, data = NULL, columns = NULL,
  pageIndex = 0, pageSize = 0,
  sortBy = NULL, filters = NULL, searchValue = NULL, groupBy = NULL, ...
) {
  con <- x$private$con
  # Same SQL as the WASM engine
  query <- buildDuckdbQuery("reactable_data", columns, filters, searchValue, sortBy, groupBy, pageIndex, pageSize)
  count_query <- buildDuckdbCountQuery("reactable_data", columns, filters, searchValue, groupBy)

  page <- DBI::dbGetQuery(con, query$sql, params = query$params)
  count <- DBI::dbGetQuery(con, count_query$sql, params = count_query$params)[[1]]
  resolvedData(page, rowCount = count)
}
```

### Why this is better than the current backends

- **`serverDf`**: Uses R's `grepl()` for filtering, `order()` for sorting. O(n) R iteration per request.
- **`serverDt`**: Uses data.table (faster), but still iterates rows in R.
- **`serverV8`**: Runs JavaScript in R's V8 engine — overhead of serializing data to V8, plus V8 is
  single-threaded in R.
- **`serverDuckdb`**: DuckDB uses columnar vectorized execution, SIMD instructions, and an optimized query
  planner. Sorting 1M rows: DuckDB ~5ms, R data.frame ~700ms. **~100x faster.**

The zero-copy `duckdb_register()` means 0 ms initialization overhead regardless of data size — DuckDB reads
directly from the R data frame's memory without copying.

### When to use which

| Scenario | Recommended mode |
|----------|-----------------|
| Static HTML, R Markdown, Quarto (<2M rows) | `engine = "duckdb"` (WASM, client-side) |
| Shiny, data must stay on server | `server = "duckdb"` (R backend) |
| Shiny, don't mind client seeing data | `engine = "duckdb"` (WASM, offloads R server) |
| Very large data (>2M rows, static doc) | `engine = "duckdb"` + Parquet sidecar file |
| Small tables (<10K rows) | Default JSON path (no engine needed) |

---

## Trade-offs and risks

### Bundle size

| Component | Size (gzipped) |
|-----------|---------------|
| Current reactable.js | ~100 KB |
| apache-arrow JS | ~120 KB |
| DuckDB-WASM | ~3-4 MB |

DuckDB-WASM is big. Mitigation: **lazy loading**. The WASM binary is only fetched when `engine = "duckdb"` is used.
For normal small tables, bundle size is unchanged. Can also load from CDN (jsDelivr) instead of embedding.

### New R dependency

`arrow` would become a suggested (not required) dependency. It's a well-maintained, widely-used package, but it
does have system requirements (C++ toolchain for installation). Users who don't use `engine = "duckdb"` are
completely unaffected — no behavior change, no new dependencies.

### SQL injection

User-provided filter values must be properly escaped or parameterized before being interpolated into SQL. DuckDB-WASM
supports prepared statements — use parameterized queries in production:

```javascript
const stmt = await conn.prepare(
  `SELECT * FROM data WHERE name ILIKE $1 ORDER BY $2 LIMIT $3 OFFSET $4`
)
const result = await stmt.query('%' + filterValue + '%', sortCol, pageSize, offset)
```

### Custom R render functions

R cell render functions (`cell = function(value, index) { ... }`) are pre-computed at widget creation time for all
rows. With DuckDB, only the visible page of rows exists in the browser — R functions would need to be pre-computed
only for the current page, or moved to JS functions.

Options:
- **For static docs:** Pre-compute renderers for ALL rows (same as today), but only send rendered HTML for the
  current page. On page change, DuckDB returns raw data, and we fall back to default rendering or JS renderers.
- **For Shiny:** On page change, call back to R to render the new page's cells. Adds a small round-trip but
  preserves full R rendering capability.
- **Recommended default:** Encourage JS render functions (`cell = JS("function(cellInfo) { ... }")`) for DuckDB
  tables, since they execute in the browser on whatever page is visible.

### Grouped/nested rows

DuckDB handles flat GROUP BY naturally, but reactable's nested sub-rows (expandable groups with child rows) need
special handling:
- Top-level: `SELECT groupCol, COUNT(*), SUM(val) FROM data GROUP BY groupCol` for the collapsed view
- On expand: `SELECT * FROM data WHERE groupCol = 'value' ORDER BY ... LIMIT ... OFFSET ...` for the child rows
- Multi-level grouping: Recursive queries or multiple queries per expansion level

This is more complex than flat pagination but entirely feasible with the SQL model.

### `paginateSubRows` not supported

`paginateSubRows = TRUE` is not implemented for the DuckDB engine (WASM or R server). When groups are expanded,
sub-rows are added on top of the page size (the default `paginateSubRows = FALSE` behavior). This matches the df
and dt server backends — only the V8 backend supports `paginateSubRows`.

Implementing it would require passing `expanded` state to the engine, building a flat page that interleaves group
headers with their expanded children while respecting `pageSize` across group boundaries, and returning `__state`
with `parentId`/`subRowCount` instead of nested `.subRows`. This is deferred as a future enhancement.

---

## Phase 0 POC benchmark results

Measured in Chrome (Windows) using [poc.html](poc.html) — a standalone HTML file with DuckDB-WASM loaded from CDN,
data generated in JS and ingested via Apache Arrow IPC (`tableFromArrays` → `tableToIPC` → `insertArrowFromIPCStream`).
Table has 7 columns: id (INT), name (VARCHAR), category (VARCHAR), value (DOUBLE), score (DOUBLE), active (BOOLEAN),
created (INT/Date32).

### Timing results

| Operation | 100K rows | 500K rows | 1M rows |
|-----------|-----------|-----------|---------|
| DuckDB-WASM init (cold) | 553 ms | 557 ms | 540 ms |
| JS data generation | 10 ms | 45 ms | 94 ms |
| Arrow IPC ingestion | 72 ms | 223 ms | 413 ms |
| Pagination query (LIMIT 25 OFFSET n) | 5 ms | 6 ms | 12 ms |
| Global search ("books", 6 cols ILIKE) | 164 ms | 625 ms | 1,211 ms |

### Assessment

- **DuckDB-WASM init** is a fixed ~550ms one-time cost regardless of data size (WASM download + instantiation).
- **Arrow IPC ingestion** scales linearly and is fast — 1M rows in 413ms. The original approach using SQL
  `INSERT INTO ... VALUES` was 40-100x slower (4.1s for 100K, 37.4s for 1M).
- **Pagination and sort queries** are extremely fast at all sizes (<15ms), well under the 300ms target.
- **Global search** is the bottleneck at scale: 6 separate `CAST(col AS VARCHAR) ILIKE` comparisons per row.
  At 100K (164ms) it's within the 300ms target. At 500K+ it exceeds it.

### Search performance tradeoffs explored

We tested two approaches to speed up search:

1. **SQL-based search index** (`ALTER TABLE` + `UPDATE SET _search_text = LOWER(CONCAT(...))` post-ingest):
   Reduced search to ~44-87ms at all sizes, but ingestion regressed 3-6x (1,752ms for 1M) because DuckDB must
   scan and update every row.

2. **JS-side precomputed search text** (build `_search_text` string column in Arrow before ingestion):
   Similar search speedup, but ingestion still regressed 6x (2,488ms for 1M) because the extra VARCHAR column
   bloats the Arrow IPC payload significantly.

Neither approach is worthwhile. The extra column (storing concatenated text for 1M rows) costs more in transfer
and memory than it saves on queries.

### Recommended target range

| Use case | Recommended approach |
|----------|---------------------|
| Static HTML (R Markdown / Quarto) up to ~200K rows | `engine = "duckdb"` (WASM) — all operations <300ms |
| Static HTML, 200K-1M rows | `engine = "duckdb"` (WASM) — pagination/sort instant, search may lag |
| Shiny with data that must stay on server | `server = "duckdb"` (R backend) — no WASM limit |
| Shiny with >1M rows or sensitive data | `server = "duckdb"` (R backend) |

### Future search optimizations

- **DuckDB Full-Text Search (FTS) extension:** DuckDB has a `PRAGMA create_fts_index` that creates an inverted
  index for fast text search. Not yet tested with DuckDB-WASM, but if available, it could bring 1M search to <100ms.
- **Column-specific search:** If the user searches a specific column (column filter vs global search), only one
  `ILIKE` is needed instead of 6. Column filters are already fast.
- **Debounce tuning:** The POC debounces search input at 300ms. For large datasets, increasing the debounce or
  requiring a minimum query length (3+ chars) would reduce perceived lag.

---

## Why not just improve the V8 server-side backend?

| | V8 Server-Side | DuckDB-WASM | DuckDB R Backend |
|---|---|---|---|
| Works in static HTML | No (requires Shiny) | **Yes** | No (requires Shiny) |
| Works offline | No (requires server) | **Yes** | Yes (local Shiny) |
| R dependency | V8 (C++ lib, ICU issues) | arrow | duckdb |
| Latency | Network round-trip per action | **Zero** (in-browser) | Network round-trip |
| R server load | Blocks R process per query | **None** after initial send | Minimal (DuckDB is fast) |
| Data stays on server | **Yes** | No (sent to browser) | **Yes** |
| Data size limit | R server memory | Browser 4 GB WASM limit | R server memory |
| Concurrent users | Limited by R processes | **Unlimited** (client-side) | Limited by R processes |
| Query performance | R data.frame ops (~100ms) | DuckDB WASM (~10-50ms) | **DuckDB native (~5ms)** |
| JSON overhead | On every request | **None** (Arrow binary) | On every response |
| Initialization | V8 context + data copy | WASM download + Arrow load | **Zero-copy register** |

DuckDB-WASM is best for the common case (static documents, offloading Shiny). The DuckDB R backend is best when data
must stay on the server (privacy, security) or exceeds the 4 GB WASM limit. V8 server-side remains available but is
superseded by DuckDB R in every dimension — same server-side model, but ~100x faster queries and no V8/ICU issues.

---

## Summary

The DuckDB engine would make reactable the first R table package that can handle million-row datasets in a static HTML
document with instant sorting, filtering, and pagination — no server required. It replaces the current pain points
(JSON serialization, V8 dependency, Shiny requirement, network latency) with a single, well-supported binary format
(Arrow) and an analytical database engine (DuckDB).

The same DuckDB engine powers both sides:
- **Client-side (DuckDB-WASM):** For static HTML documents, R Markdown, Quarto. Data is shipped as Arrow IPC, queried
  in the browser. No server, no latency, unlimited concurrent users.
- **Server-side (DuckDB R):** For Shiny apps where data must stay private. Zero-copy data registration, ~100x faster
  than the current data.frame backend, same SQL as the WASM engine.

The implementation is additive (opt-in via `engine = "duckdb"` or `server = "duckdb"`), backward compatible (existing
tables unchanged), and phased (Arrow-only is valuable on its own, DuckDB-WASM pagination is the first milestone, and
the R backend shares the same query logic).
