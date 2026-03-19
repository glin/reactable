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
- Sorting/filtering operates on the full JS array — works even at 1M rows, but sorting is noticeably
  slower than a database engine (hundreds of ms vs. single-digit ms), and search scales linearly
- All rows held in JS memory as individual objects (high per-object overhead)
- No way to partially load data — the entire dataset must be embedded and parsed upfront

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

### Honest assessment: where DuckDB-WASM actually helps

The default client-side backend is more capable than expected -- it handles 1M rows without crashing, and pagination
works fine. But end-to-end benchmarks (see "End-to-end benchmark" section below) show DuckDB-WASM provides a more
significant improvement than initially estimated from POC-only timings.

**DuckDB-WASM is NOT needed because the default backend breaks.** But it provides a meaningfully better user
experience at scale, especially for sorting:

1. **Sort speed is the killer feature** — At 1M rows, DuckDB sorts near-instantly while the default takes ~1s and
   blocks the UI. At 2M rows, the default takes ~4s with a completely frozen UI. This alone justifies DuckDB for
   interactive tables at 500K+ rows.

2. **Page load is faster, not slower** — Despite a larger document (~18% uncompressed, ~2x gzipped), DuckDB page
   load is ~2x faster (1.1s vs 2.4s at 1M). The default backend's JSON parse + column-to-row transform is the
   bottleneck, not network transfer. DuckDB pre-renders the first page and loads Arrow data asynchronously.

3. **Memory efficiency is real** — 25-30% less memory after GC (428 MB vs 569 MB at 1M, 726 MB vs 1,074 MB at 2M).
   DuckDB's columnar storage is more compact than 1M individual JS row objects.

4. **Global search is slower but non-blocking** — DuckDB search runs in a Web Worker (~1s at 1M, ~3s at 2M) while
   the default's JS search is faster in raw time (<1s at 1M, ~1.5s at 2M) but blocks the UI thread completely. The
   non-blocking behavior is a significant UX advantage at scale.

5. **Foundation for Parquet sidecar files** — This is the genuinely transformative feature. With Parquet, the
   browser fetches only the bytes needed for each page via HTTP range requests. A 10 GB dataset can render its first
   page by downloading ~1-5 MB. This is fundamentally impossible with the default backend, which must embed and
   parse ALL data upfront. DuckDB-WASM is a prerequisite for this.

6. **Server-side DuckDB R backend** — Replaces V8 for Shiny server-side processing. No V8 dependency (no ICU
   issues), ~100x faster queries via zero-copy `duckdb_register()`. This is arguably the most immediately useful
   outcome of the DuckDB investment.

**Bottom line:** DuckDB-WASM for embedded Arrow data provides a clearly better experience for interactive sorting and
overall responsiveness at 500K+ rows. The document size tradeoff (2x larger gzipped) is the main cost. The Parquet
sidecar approach and the DuckDB R server backend remain the features with the most transformative potential.

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
    for (const filter of filters || []) {
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
        .map(
          c =>
            `CAST(${this.escapeIdentifier(c.id)} AS VARCHAR) ILIKE '%${this.escapeValue(searchValue)}%'`
        )
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
        return `${col} ${dir} NULLS LAST` // Match reactable's sortNALast behavior
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
  const [engineRef] = useState(() => (engine === 'duckdb' ? new DuckDBEngine() : null))
  const [loading, setLoading] = useState(Boolean(engine))

  // Initialize engine on mount
  useEffect(() => {
    if (!engineRef.current) return
    engineRef.current
      .init(data, columns)
      .then(() => {
        setLoading(false)
        // Fetch initial page
        return engineRef.current.query({ pageIndex: 0, pageSize: props.defaultPageSize })
      })
      .then(result => {
        setRows(result.rows)
        setRowCount(result.rowCount)
      })
    return () => engineRef.current?.destroy()
  }, [])

  // Re-query on state changes (sort, filter, search, page)
  useEffect(() => {
    if (!engineRef.current || loading) return
    engineRef.current
      .query({
        pageIndex: state.pageIndex,
        pageSize: state.pageSize,
        sortBy: state.sortBy,
        filters: state.filters,
        searchValue: state.globalFilter,
        groupBy: state.groupBy
      })
      .then(result => {
        setRows(result.rows)
        setRowCount(result.rowCount)
      })
  }, [
    state.pageIndex,
    state.pageSize,
    state.sortBy,
    state.filters,
    state.globalFilter,
    state.groupBy
  ])

  if (engine === 'duckdb') {
    // Manual pagination mode — DuckDB controls the data
    return (
      <ReactTable
        data={rows}
        columns={columns}
        manualPagination
        manualSortBy
        manualFilters
        manualGlobalFilter
        pageCount={Math.ceil(rowCount / state.pageSize)}
        {...props}
      />
    )
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

### Medium tables (10K-500K rows) — incremental improvement

The default client-side backend actually handles medium tables reasonably well. Page load is under a second even at
1M rows, pagination is fast, and sorting/filtering work (just slower than DuckDB). DuckDB-WASM provides a speed
improvement for interactive operations but not a qualitative difference at this size.

```r
# Default backend works fine here, but DuckDB is snappier for sort/filter
reactable(big_data, backend = backendDuckDB())  # faster sorting and filtering
```

The Arrow binary for 500K rows × 10 numeric columns ≈ 40 MB (vs ~50 MB JSON):

- Sorting/filtering in DuckDB: <100ms even on 500K rows vs. hundreds of ms in JS
- Browser memory: only the visible page materialized as JS objects, not all 500K
- No column-to-row transformation overhead
- But: ~550ms DuckDB-WASM init cost, ~3-4 MB WASM download, date/type conversion edge cases
- Global search is actually _slower_ in DuckDB at scale (1.2s at 1M rows with 6 ILIKE comparisons)

**Honest assessment:** At this size, the default backend is adequate. DuckDB is a nice-to-have for sort/filter speed,
not a necessity. The real value of DuckDB-WASM at this tier is that it's the same engine that enables the
transformative Parquet sidecar approach (see below).

### Large tables (500K-10M rows) — Parquet sidecar file (the real win)

This is where DuckDB-WASM becomes genuinely transformative. Instead of embedding the entire dataset in the HTML,
R writes a Parquet file alongside the document. The browser fetches only the bytes it needs for each page.

```r
# R writes a .parquet file alongside the HTML document
reactable(huge_data, backend = backendDuckDB())
# Produces: document.html + document_files/reactable_data_abc123.parquet
```

The HTML contains a URL reference. DuckDB-WASM uses HTTP range requests to read only the relevant byte ranges from
the Parquet file. A 10 GB dataset could render its first page by downloading maybe 100 KB. This is fundamentally
impossible with the default client-side backend, which must embed and parse ALL data upfront.

---

## What the user experience looks like

### For R Markdown / Quarto (static documents)

````r
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
````

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

### Phase 3: Parquet sidecar files

**Goal:** Enable tables backed by Parquet files instead of embedded Arrow IPC, so the browser only downloads the data
it needs. This is the most impactful feature in the roadmap.

#### Why Parquet changes everything

With Arrow IPC (current approach), the entire dataset is base64-encoded and embedded in the HTML document. A 1M row
table produces a 40-80 MB HTML file that the browser must fully download and decode before DuckDB can query it.

With Parquet sidecar files, the data lives in a separate `.parquet` file. DuckDB-WASM uses HTTP range requests to read
only the bytes it needs:

1. **Metadata fetch (~1 KB):** Parquet stores a footer with schema, row group locations, and column chunk offsets.
   DuckDB reads this first to understand the file layout.

2. **Column pruning:** If the user sorts by column A, DuckDB only fetches column A's data from the Parquet file,
   skipping all other columns entirely. A 50-column table where you page/sort on 2 columns downloads ~4% of the file.

3. **Row group filtering:** Parquet stores min/max statistics per row group (typically 128K-1M rows per group). If a
   filter is `WHERE price > 100` and a row group's max price is 50, DuckDB skips that entire row group without
   downloading it.

4. **Page-sized reads:** For a simple page query (`LIMIT 25 OFFSET 0`), DuckDB downloads at most one row group's
   worth of data for the needed columns, then returns 25 rows. On a 10 GB file, this might be 1-5 MB.

#### Concrete example

```
10 GB Parquet file, 50M rows × 20 columns, hosted on a static file server

1. Browser loads HTML (small, just widget markup + Parquet URL reference)
2. DuckDB-WASM inits (~550ms one-time)
3. Fetches Parquet footer via HTTP range request (~1 KB, ~50ms)
4. User sees first page: fetches 1 row group × 20 columns (~2 MB, ~200ms)
5. User sorts by "price" DESC: fetches only "price" column (~100 KB range request, ~50ms),
   then fetches the top-25 rows' full data (~50 KB)
6. User filters "category = Electronics": fetches "category" column, applies filter,
   skips row groups where min/max stats exclude "Electronics"

Total downloaded: maybe 5-10 MB out of 10 GB. First page visible in <2 seconds.
```

Compare to the default backend: you'd need to embed 10 GB of JSON. That's not viable. Even Arrow IPC at 10 GB is
not viable as embedded data. Parquet is the only approach that lets you back a table with arbitrarily large data in a
static HTML document.

#### How R would generate the sidecar

```r
reactable <- function(data, ..., backend = NULL) {
  if (uses_duckdb_backend(backend)) {
    arrow_bytes_size <- estimate_arrow_size(data)

    if (arrow_bytes_size < 20 * 1024 * 1024) {
      # Small data: embed as base64 Arrow IPC (current approach)
      data_payload <- list(format = "arrow-ipc", encoding = "base64", bytes = serialize_arrow(data))
    } else {
      # Large data: write Parquet sidecar file
      parquet_path <- write_parquet_sidecar(data, output_dir)
      data_payload <- list(format = "parquet", encoding = "url", url = parquet_path)
    }
  }
}

write_parquet_sidecar <- function(data, output_dir) {
  filename <- paste0("reactable_data_", substr(digest::digest(data), 1, 8), ".parquet")
  path <- file.path(output_dir, filename)
  arrow::write_parquet(
    data, path,
    # Row group size affects granularity of range requests vs. overhead
    chunk_size = 100000  # 100K rows per row group (good balance)
  )
  filename  # relative URL for the browser
}
```

#### JS-side Parquet support

DuckDB-WASM has built-in Parquet support. The init path would branch based on the data format:

```javascript
async init(dataPayload) {
  // ... DuckDB-WASM initialization ...

  if (dataPayload.format === 'arrow-ipc') {
    // Current path: decode base64, insert Arrow IPC
    const bytes = Uint8Array.from(atob(dataPayload.bytes), c => c.charCodeAt(0))
    await this.conn.insertArrowFromIPCStream(bytes, { name: 'reactable_data', create: true })
  } else if (dataPayload.format === 'parquet') {
    // Parquet sidecar: register URL, DuckDB handles range requests
    await this.conn.query(
      `CREATE TABLE reactable_data AS SELECT * FROM read_parquet('${dataPayload.url}')`
    )
    // Or for true lazy reading (no full scan):
    await this.conn.query(
      `CREATE VIEW reactable_data AS SELECT * FROM read_parquet('${dataPayload.url}')`
    )
  }
}
```

Using `CREATE VIEW` instead of `CREATE TABLE` means DuckDB never loads the full file into WASM memory. Every query
goes directly to the Parquet file via range requests. This keeps WASM memory usage near-zero regardless of file size.

#### Hosting requirements

Parquet sidecar files need a server that supports HTTP range requests (`Accept-Ranges: bytes`). This includes:

- Any static file server (nginx, Apache, Caddy, Python's `http.server`)
- GitHub Pages, Netlify, Vercel, S3, GCS, Azure Blob Storage
- R Markdown / Quarto `self_contained: false` output

It does NOT work with `self_contained: true` (which inlines everything) or the RStudio Viewer pane.

#### Limitations

- Requires `self_contained: false` in R Markdown/Quarto
- HTTP range requests add latency per query (~50-200ms round trip per request)
- Sorting/filtering may require multiple range requests (one to read the filter column, one to read result columns)
- Row group statistics only help with numeric/date range filters, not substring search
- Parquet files are slightly larger than gzipped Arrow IPC for the same data

### Phase 4: Additional features

1. **Custom filter methods:** Allow translating custom R/JS filter functions to SQL WHERE clauses, or fall back to
   JS-based filtering on the page results
2. **Pre-aggregated data:** For grouped tables on huge data, pre-compute group aggregations in R and store as a
   separate table. DuckDB queries the summary table for top-level groups, detail table for expanded sub-rows.
3. **Row selection, expansion:** Map DuckDB row IDs back to original data indices for selection/expansion state.
4. **Shiny integration:** `updateReactable(data = new_data)` re-imports Arrow into DuckDB without page reload.
5. **Web Worker:** Move DuckDB queries to a Web Worker so the UI thread never blocks during heavy queries.

### Phase 5: Parquet URL data source (stretch goal)

```r
# Table backed by a remote Parquet file — the data never enters R at all
reactable(
  parquet_url = "https://data.example.com/sales.parquet",
  backend = backendDuckDB(),
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
- COUNT(\*) on 1M rows: ~5ms

These are all within interactive latency (~300ms budget). The `eh` (exception handling) WASM variant provides the best
single-thread performance. The `threads` variant exists for heavier analytical workloads but adds complexity
(SharedArrayBuffer requires COOP/COEP headers, which break many hosting environments).

**Recommendation:** Use the `eh` variant by default, fall back to `mvp` for older browsers. Skip `threads` entirely.

### 4 GB memory limit

> WebAssembly limits the amount of available memory to 4 GB and browsers may impose even stricter limits.

**Rarely a problem — and it's self-correcting.** How much data fits in 4 GB?

| Dataset                             | Rows | Columns | Approx memory |
| ----------------------------------- | ---- | ------- | ------------- |
| Numeric-heavy (10 num cols)         | 1M   | 10      | ~80 MB        |
| Numeric-heavy (10 num cols)         | 10M  | 10      | ~800 MB       |
| Mixed (5 num + 5 str avg 50 chars)  | 1M   | 10      | ~350 MB       |
| Mixed (5 num + 5 str avg 50 chars)  | 10M  | 10      | ~3.5 GB       |
| String-heavy (10 str avg 100 chars) | 1M   | 10      | ~1 GB         |

For datasets exceeding ~3 GB in-memory, DuckDB-WASM hits the wall. But:

1. Embedding >3 GB of Arrow data in an HTML file is already impractical (page load time)
2. For datasets this large, the Parquet sidecar + HTTP range request approach or the server-side DuckDB R backend
   avoids loading everything into WASM memory
3. The current reactable JSON path crashes browsers well before 4 GB anyway

**Recommendation:** Document the limit. For datasets >2M rows with wide columns, recommend the server-side DuckDB
backend or Parquet sidecar.

### WASM bundle size and variants

Three variants with different tradeoffs:

- **`mvp`** (~37.5 MB): WebAssembly 1.0, maximum compatibility, slowest
- **`eh`** (~32.7 MB): Exception handling, better performance, modern browsers (Chrome 95+, Firefox 100+, Safari 15.2+)
- **`threads`**: Threading support, requires COOP/COEP headers (breaks many hosting environments)

**Decision:** Ship only the `eh` bundle. The `mvp` fallback bundle is not included. WebAssembly Exception Handling
has been supported by all major browsers since late 2021 (Chrome 95, Firefox 100, Safari 15.2, Edge 95), so there
is no practical compatibility cost. Dropping `mvp` saves ~37.5 MB. Skip `threads` (COOP/COEP headers break most
hosting environments).

Even with only the `eh` bundle, the self-hosted WASM files are ~32.7 MB, which exceeds CRAN's 5 MB package tarball
limit. The WASM files cannot be included directly in the R package for CRAN submission. This needs a delivery
strategy such as runtime CDN download, a separate companion package on r-universe, or a first-use download cache.
See the Deferred/Future section in the implementation plan.

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

| Scenario                                   | Recommended mode                              |
| ------------------------------------------ | --------------------------------------------- |
| Static HTML, R Markdown, Quarto (<2M rows) | `engine = "duckdb"` (WASM, client-side)       |
| Shiny, data must stay on server            | `server = "duckdb"` (R backend)               |
| Shiny, don't mind client seeing data       | `engine = "duckdb"` (WASM, offloads R server) |
| Very large data (>2M rows, static doc)     | `engine = "duckdb"` + Parquet sidecar file    |
| Small tables (<10K rows)                   | Default JSON path (no engine needed)          |

---

## Trade-offs and risks

### Bundle size

| Component            | Size (uncompressed) |
| -------------------- | ------------------- |
| Current reactable.js | ~330 KB             |
| apache-arrow JS      | ~120 KB (gzipped)   |
| DuckDB-WASM (eh)     | ~32.7 MB            |

DuckDB-WASM is big. Mitigation: **lazy loading**. The WASM binary is only fetched when `backend = "duckdb"` is
used. For normal small tables, bundle size is unchanged. Only the `eh` variant is shipped (the `mvp` fallback was
dropped to save ~37.5 MB).

The ~32.7 MB WASM binary exceeds CRAN's 5 MB package tarball limit, so it cannot be bundled directly in the R
package. A separate delivery mechanism is needed (CDN download at runtime, companion package, or first-use cache).

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

Per-row R render functions are pre-evaluated at widget creation time against the full dataset, producing arrays
indexed by original row position. With DuckDB, the visible page changes dynamically (sort, filter, paginate), so
these pre-rendered arrays won't match the current rows. The following parameters are affected:

- `colDef(cell = function(...))` — per-row cell rendering
- `colDef(details = function(...))` — per-row details/expansion content
- `colDef(style = function(...))` — per-row conditional styling
- `colDef(class = function(...))` — per-row conditional CSS classes
- `reactable(rowClass = function(...))` — per-row class on row element
- `reactable(rowStyle = function(...))` — per-row style on row element

R-level warnings are emitted when any of these are used with `engine = "duckdb"`.

**Safe parameters** (called once, not row-dependent): `header`, `footer`, `filterInput`, `colGroup header`.

**Recommended:** Use `JS()` function variants for all per-row renderers with the DuckDB engine. JS functions
execute client-side with the current row's data and work correctly regardless of page/sort/filter state.

### Row details (`details` parameter)

Row expansion via `details` works with the DuckDB engine, with the following caveats:

- **`JS()` function details**: Work correctly. The function executes client-side with the current row's data.
- **R function details**: Broken on pages beyond the first. R pre-evaluates details for all rows into an array
  indexed by original row position, but DuckDB-fetched rows have different indices. A warning is emitted.
- **Static HTML/list details**: Same issue as R functions — pre-rendered content is indexed by original position.

### Multiple tables on the same page

Multiple reactable tables with `engine = "duckdb"` on the same page are supported. Each table creates its own
independent `DuckDBEngine` instance with its own Web Worker, WASM memory, and database. The hardcoded
`reactable_data` table name doesn't conflict because each database is isolated.

**Resource concern:** N tables = N Web Workers + N WASM instances (~3-4 MB each + data). For 2-3 tables this is
fine. For many tables, memory could add up. A future enhancement (shared DuckDB instance pooling) could allow
multiple tables to share a single DuckDB-WASM instance with separate table names.

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

| Operation                             | 100K rows | 500K rows | 1M rows  |
| ------------------------------------- | --------- | --------- | -------- |
| DuckDB-WASM init (cold)               | 553 ms    | 557 ms    | 540 ms   |
| JS data generation                    | 10 ms     | 45 ms     | 94 ms    |
| Arrow IPC ingestion                   | 72 ms     | 223 ms    | 413 ms   |
| Pagination query (LIMIT 25 OFFSET n)  | 5 ms      | 6 ms      | 12 ms    |
| Global search ("books", 6 cols ILIKE) | 164 ms    | 625 ms    | 1,211 ms |

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

| Use case                                           | Recommended approach                                                 |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| Static HTML (R Markdown / Quarto) up to ~200K rows | `engine = "duckdb"` (WASM) — all operations <300ms                   |
| Static HTML, 200K-1M rows                          | `engine = "duckdb"` (WASM) — pagination/sort instant, search may lag |
| Shiny with data that must stay on server           | `server = "duckdb"` (R backend) — no WASM limit                      |
| Shiny with >1M rows or sensitive data              | `server = "duckdb"` (R backend)                                      |

### Future search optimizations

- **DuckDB Full-Text Search (FTS) extension:** DuckDB has a `PRAGMA create_fts_index` that creates an inverted
  index for fast text search. Not yet tested with DuckDB-WASM, but if available, it could bring 1M search to <100ms.
- **Column-specific search:** If the user searches a specific column (column filter vs global search), only one
  `ILIKE` is needed instead of 6. Column filters are already fast.
- **Debounce tuning:** The POC debounces search input at 300ms. For large datasets, increasing the debounce or
  requiring a minimum query length (3+ chars) would reduce perceived lag.

## End-to-end benchmark: DuckDB vs default backend

Measured in Chrome (Windows), serving rendered R Markdown documents over HTTP. Both documents use the same dataset
(5 columns: index, date, city, state, temp) with the same seed. Hard page refresh with cache disabled for page load;
DuckDB-WASM binary cached for interaction tests. Memory measured in Chrome Task Manager.

### 1M rows (5 columns)

| Metric                   | DuckDB backend    | Default backend |
| ------------------------ | ----------------- | --------------- |
| **Document size**        | 55 MB             | 47 MB           |
| **Document size (gzip)** | 16 MB             | 8 MB            |
| **Page load**            | ~1.1s             | ~2.4s           |
| **Sorting**              | Near instant      | ~1s, blocks UI  |
| **Global search**        | ~1s, non-blocking | <1s, blocks UI  |
| **Pagination**           | Very fast         | Slightly slower |
| **Memory (peak)**        | 925 MB            | 900 MB          |
| **Memory (after GC)**    | 428 MB            | 569 MB          |

### 2M rows (5 columns)

| Metric                   | DuckDB backend    | Default backend   |
| ------------------------ | ----------------- | ----------------- |
| **Document size**        | 109 MB            | 93 MB             |
| **Document size (gzip)** | 32 MB             | 16 MB             |
| **Page load**            | ~2.3s             | ~4.9s             |
| **Sorting**              | Near instant      | ~4s, blocks UI    |
| **Global search**        | ~3s, non-blocking | ~1.5s, blocks UI  |
| **Pagination**           | Very fast         | Noticeably slower |
| **Memory (peak)**        | 1,083 MB          | 1,493 MB          |
| **Memory (after GC)**    | 726 MB            | 1,074 MB          |

### Key findings

- **Sorting is the biggest win.** DuckDB sorting is near-instant at both 1M and 2M rows. The default backend takes
  ~1s at 1M and ~4s at 2M, and blocks the UI thread the entire time (no input, no scrolling). This is the single
  most compelling reason to use DuckDB for large tables.

- **Page load is faster despite larger payload.** DuckDB loads 2x faster even though the document is ~18% larger
  (uncompressed). The default backend must parse all JSON and transform column-oriented data to row objects for every
  row, which is the bottleneck. DuckDB skips this: the first page is pre-rendered, and Arrow data is loaded into
  DuckDB asynchronously.

- **Global search is a tradeoff.** DuckDB search is slower in raw time (~1s vs <1s at 1M, ~3s vs ~1.5s at 2M)
  because it runs 5 ILIKE comparisons per row in SQL. However, DuckDB runs queries in a Web Worker, so the UI stays
  responsive during search. The default backend's JS-based search is faster but blocks the UI thread completely.
  At 2M rows, the blocking becomes a serious UX issue.

- **Document size is larger, especially gzipped.** Base64-encoded Arrow IPC compresses poorly with gzip (~3.4x
  compression) compared to JSON (~5.7x). The DuckDB document is about 2x larger when gzip-compressed. The DuckDB-WASM
  binary (~34 MB uncompressed, ~8 MB gzipped) is an additional one-time download, cached by the browser.

- **Memory is lower after GC.** Peak memory is similar at 1M but diverges at 2M (1,083 MB vs 1,493 MB). After
  garbage collection, DuckDB uses 25-30% less memory at both sizes. The default backend holds all rows as individual
  JS objects with high per-object overhead; DuckDB stores data in columnar format and only materializes one page of
  row objects at a time.

- **Pagination and filtering scale well.** DuckDB pagination is consistently fast at both sizes (SQL LIMIT/OFFSET).
  The default backend's pagination is acceptable but noticeably slower, especially at 2M rows.

### Updated assessment

The earlier POC benchmark (synthetic data, DuckDB-only timing) was conservative. The end-to-end comparison shows
DuckDB-WASM provides a more significant improvement than initially estimated:

- Sorting goes from "noticeably slower but still works" to "near instant" -- the difference is dramatic enough
  that users with interactive sort requirements should use DuckDB at 500K+ rows.
- Page load is actually faster with DuckDB, not slower as initially assumed from the larger payload.
- The global search speed concern from the POC (1.2s at 1M) is confirmed, but the non-blocking execution via
  Web Worker makes it feel better than the default's faster-but-blocking search.
- Memory efficiency is a real benefit, not just theoretical -- 25-30% less after GC.

---

## Why not just improve the V8 server-side backend?

|                      | V8 Server-Side                | DuckDB-WASM                 | DuckDB R Backend         |
| -------------------- | ----------------------------- | --------------------------- | ------------------------ |
| Works in static HTML | No (requires Shiny)           | **Yes**                     | No (requires Shiny)      |
| Works offline        | No (requires server)          | **Yes**                     | Yes (local Shiny)        |
| R dependency         | V8 (C++ lib, ICU issues)      | arrow                       | duckdb                   |
| Latency              | Network round-trip per action | **Zero** (in-browser)       | Network round-trip       |
| R server load        | Blocks R process per query    | **None** after initial send | Minimal (DuckDB is fast) |
| Data stays on server | **Yes**                       | No (sent to browser)        | **Yes**                  |
| Data size limit      | R server memory               | Browser 4 GB WASM limit     | R server memory          |
| Concurrent users     | Limited by R processes        | **Unlimited** (client-side) | Limited by R processes   |
| Query performance    | R data.frame ops (~100ms)     | DuckDB WASM (~10-50ms)      | **DuckDB native (~5ms)** |
| JSON overhead        | On every request              | **None** (Arrow binary)     | On every response        |
| Initialization       | V8 context + data copy        | WASM download + Arrow load  | **Zero-copy register**   |

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
