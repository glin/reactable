# Backend API Design

## Problem

The current API has two separate parameters for the same concept (where does data processing happen):

- `engine = "duckdb"` — client-side DuckDB-WASM
- `server = TRUE` / `server = "duckdb"` — server-side backends

These are mutually exclusive but not obviously related. Additionally:

- **Magic strings** — `engine = "duckdb"` has no autocomplete, no hover docs, no way to pass configuration
- **Hidden behavior changes** — DuckDB silently ignores custom `filterMethod`, `searchMethod`, JS `aggregate`
  functions, and R cell render functions. A string param doesn't communicate these caveats.
- **Confusing client/server split** — `engine` is client-side, `server` is server-side, but DuckDB can be
  either. Users have to know which param to use for which scenario.

## Proposed API

Add a `backend` param that accepts constructor function results:

```r
reactable(data, backend = backendDuckDB())     # auto: WASM in static, DuckDB R in Shiny
reactable(data)                                  # default: fully client-side, no backend
```

`backendV8()` is created in Phase 9 when `server` is merged into `backend`.

### `backendDuckDB()`

```r
backendDuckDB <- function(mode = c("auto", "client", "server"), ...) {
  mode <- match.arg(mode)
  structure(list(mode = mode, ...), class = "reactable_backendDuckDB")
}
```

Modes:

- **`"auto"`** (default) — detects the rendering context:
  - In Shiny → uses DuckDB R package server-side (data stays on server, zero-copy `duckdb_register()`)
  - In static HTML (R Markdown, Quarto) → uses DuckDB-WASM client-side (data shipped as Arrow IPC)
  - Users don't have to think about it. One line works everywhere.
- **`"client"`** — always DuckDB-WASM, even in Shiny (data sent to browser as Arrow)
- **`"server"`** — always DuckDB R server-side; errors if not in Shiny

### `backendV8()` (Phase 9)

```r
backendV8 <- function() {
  structure(list(), class = "reactable_backendV8")
}
```

Server-only (requires Shiny + V8 R package). Created in Phase 9 when `server` is merged into `backend`.
Until then, `server = TRUE` continues to dispatch to V8 through existing code paths.

### Default (no backend)

```r
reactable(data)   # no backend param → classic fully client-side mode
```

All data embedded as JSON, all sort/filter/search in JS. No new dependencies. Best for small tables (<10K rows).

## Naming

**Decided:** `backendDuckDB()`, `backendV8()` — camelCase, consistent with the package convention
(`colDef`, `colGroup`, `colFormat`, `reactableTheme`). `DuckDB` preserves the proper name
(like `toJSON` preserves JSON).

**Rejected alternatives:**

- `backend_duckdb()`, `backend_v8()` — snake_case prefix grouping for tab-complete, but inconsistent
  with the rest of the package's camelCase convention
- `duckdb_backend()`, `v8_backend()` — snake_case, collision-free, but doesn't group in autocomplete
- `duckdbBackend()`, `v8Backend()` — groups on suffix not prefix

## Backward Compatibility

- **`engine` param:** Delete entirely. It only existed on the `duckdb-wasm` dev branch and was never released.
  All code referencing `engine = "duckdb"` is replaced with `backend = backendDuckDB()`.
- **`server` param:** Completely unchanged in Phase 7. No internal remapping to backend objects.
  `server = TRUE` dispatches to V8, `server = "duckdb"` dispatches through `getServerBackend()`,
  `server = "df"` / `server = "dt"` work as before. Error if both `backend` and `server` are specified.
  In Phase 9, `server` will be deprecated and merged into `backend`, with `backendV8()` created at that point.

```r
# Old (engine removed, server completely unchanged):
reactable(data, engine = "duckdb")       # ❌ deleted
reactable(data, server = TRUE)           # ✅ still works (unchanged, no remapping)
reactable(data, server = "duckdb")       # ✅ still works (unchanged)
reactable(data, server = "df")           # ✅ still works (unchanged)
reactable(data, server = "dt")           # ✅ still works (unchanged)

# New:
reactable(data, backend = backendDuckDB())
# backendV8() created in Phase 9
```

## Why Not `reactable_duckdb()`?

A separate entry point was considered but rejected:

- **Maintenance burden** — params are 95% identical; every new feature must be added to both functions
- **API fragmentation** — users must decide which function to use before they start, rather than swapping a param
- **Constructor functions are better** — `backendDuckDB()` can have its own docs, config, and caveats without
  duplicating the entire `reactable()` API
- **Composability** — `backend` is just a param, so it works with `updateReactable()`, `renderReactable()`, etc.
  without needing `updateReactable_duckdb()` variants

## Why Constructor Functions, Not Strings?

|                     | String (`backend = "duckdb"`)       | Constructor (`backend = backendDuckDB()`)        |
| ------------------- | ----------------------------------- | ------------------------------------------------ |
| Autocomplete        | No                                  | Yes                                              |
| Hover documentation | No                                  | Yes (`?backendDuckDB`)                           |
| Configuration       | Needs extra params on `reactable()` | Self-contained: `backendDuckDB(wasm_path = ...)` |
| Validation          | Runtime error on typo               | Function-not-found error at parse time           |
| Extensibility       | Must register strings               | Any S3 object works                              |
| Discoverability     | Must read docs to know options      | Tab-complete shows all `backend*()` functions    |

The DBI driver pattern (`dbConnect(duckdb::duckdb())`) established this as the R convention for pluggable backends.

## Auto-Detection Logic

```r
# Inside reactable() when backend is backendDuckDB("auto"):
resolveBackendMode <- function(backend) {
  if (backend$mode != "auto") return(backend$mode)

  session <- NULL
  if (requireNamespace("shiny", quietly = TRUE)) {
    session <- shiny::getDefaultReactiveDomain()
  }

  if (!is.null(session)) {
    "server"   # In Shiny → use DuckDB R backend (data stays on server)
  } else {
    "client"   # Static HTML → use DuckDB-WASM (data shipped as Arrow IPC)
  }
}
```

This is the same detection already done in `reactable()` for the `preRenderHook` — if there's an active Shiny
session, we're in Shiny; otherwise we're rendering static HTML.

## Implementation Plan

See [implementation-plan.md](implementation-plan.md) Phase 7 for the detailed step-by-step plan.

## Resolved Questions

- **`backendDf()` / `backendDt()` constructors?** No. `server = "df"` and `server = "dt"` are left alone
  as internal string-based backends. No constructor functions needed for these.
- **Auto-detection consider data size?** No. Keep it simple and predictable — context detection only.
