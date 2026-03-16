# Backend API Design

## Problem

The current API has two separate parameters for the same concept (where does data processing happen):

- `engine = "duckdb"` — client-side DuckDB-WASM
- `server = TRUE` / `server = "duckdb"` / `server = "df"` — server-side backends

These are mutually exclusive but not obviously related. Additionally:

- **Magic strings** — `engine = "duckdb"` has no autocomplete, no hover docs, no way to pass configuration
- **Hidden behavior changes** — DuckDB silently ignores custom `filterMethod`, `searchMethod`, JS `aggregate`
  functions, and R cell render functions. A string param doesn't communicate these caveats.
- **Confusing client/server split** — `engine` is client-side, `server` is server-side, but DuckDB can be
  either. Users have to know which param to use for which scenario.

## Proposed API

Merge `engine` and `server` into a single `backend` param that accepts constructor function results:

```r
reactable(data, backend = duckdb_backend())     # auto: WASM in static, DuckDB R in Shiny
reactable(data, backend = v8_backend())          # legacy server-only
reactable(data)                                  # default: fully client-side, no backend
```

### `duckdb_backend()`

```r
duckdb_backend <- function(mode = c("auto", "client", "server"), ...) {
  mode <- match.arg(mode)
  structure(list(mode = mode, ...), class = "reactable_backend_duckdb")
}
```

Modes:

- **`"auto"`** (default) — detects the rendering context:
  - In Shiny → uses DuckDB R package server-side (data stays on server, zero-copy `duckdb_register()`)
  - In static HTML (R Markdown, Quarto) → uses DuckDB-WASM client-side (data shipped as Arrow IPC)
  - Users don't have to think about it. One line works everywhere.
- **`"client"`** — always DuckDB-WASM, even in Shiny (data sent to browser as Arrow)
- **`"server"`** — always DuckDB R server-side; errors if not in Shiny

Future config options in the constructor:

```r
duckdb_backend(
  mode = "client",
  wasm_path = "/local/duckdb-wasm/"   # self-hosted WASM for air-gapped environments
)
```

### `v8_backend()`

```r
v8_backend <- function() {
  structure(list(), class = "reactable_backend_v8")
}
```

Server-only (requires Shiny + V8 R package). Exists primarily for backward compatibility — `duckdb_backend()`
is strictly better for new code.

### Default (no backend)

```r
reactable(data)   # no backend param → classic fully client-side mode
```

All data embedded as JSON, all sort/filter/search in JS. No new dependencies. Best for small tables (<10K rows).

## Naming

**Preferred:** `duckdb_backend()`, `v8_backend()` — snake_case. Reads well inline, collision-free.

**Alternatives to consider:**

- `duckdbBackend()`, `v8Backend()` — camelCase, consistent with package conventions (`colDef`, `reactableTheme`)
- `backend_duckdb()`, `backend_v8()` — prefix grouping, tab-complete shows all backends together

The naming decision can be finalized later. The API shape (constructor functions returning S3 objects) is the
important part — naming is a surface choice.

## Backward Compatibility

Both `engine` and `server` params are unreleased (dev-only on the `duckdb-wasm` branch), so they can be
removed without deprecation and replaced entirely by `backend`.

```r
# Old (remove):
reactable(data, engine = "duckdb")       # → backend = duckdb_backend()
reactable(data, server = TRUE)           # → backend = v8_backend()
reactable(data, server = "duckdb")       # → backend = duckdb_backend("server")

# New:
reactable(data, backend = duckdb_backend())
reactable(data, backend = v8_backend())
```

## Why Not `reactable_duckdb()`?

A separate entry point was considered but rejected:

- **Maintenance burden** — params are 95% identical; every new feature must be added to both functions
- **API fragmentation** — users must decide which function to use before they start, rather than swapping a param
- **Constructor functions are better** — `duckdb_backend()` can have its own docs, config, and caveats without
  duplicating the entire `reactable()` API
- **Composability** — `backend` is just a param, so it works with `updateReactable()`, `renderReactable()`, etc.
  without needing `updateReactable_duckdb()` variants

## Why Constructor Functions, Not Strings?

|                     | String (`backend = "duckdb"`)       | Constructor (`backend = duckdb_backend()`)        |
| ------------------- | ----------------------------------- | ------------------------------------------------- |
| Autocomplete        | No                                  | Yes                                               |
| Hover documentation | No                                  | Yes (`?duckdb_backend`)                           |
| Configuration       | Needs extra params on `reactable()` | Self-contained: `duckdb_backend(wasm_path = ...)` |
| Validation          | Runtime error on typo               | Function-not-found error at parse time            |
| Extensibility       | Must register strings               | Any S3 object works                               |
| Discoverability     | Must read docs to know options      | Tab-complete shows all `*_backend()` functions    |

The DBI driver pattern (`dbConnect(duckdb::duckdb())`) established this as the R convention for pluggable backends.

## Auto-Detection Logic

```r
# Inside reactable() when backend is duckdb_backend("auto"):
resolve_backend_mode <- function(backend) {
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

1. Add `backend` param to `reactable()` (default NULL)
2. Create constructor functions: `duckdb_backend()`, `v8_backend()`, `df_backend()`, `dt_backend()`
3. Implement S3 dispatch: `reactable()` checks `class(backend)` to determine behavior
4. Add auto-detection for `duckdb_backend("auto")`
5. Wire existing `engine`/`server` paths through the new `backend` dispatch
6. Deprecate `engine` and `server` params with lifecycle warnings
7. Update all docs, vignettes, examples, NEWS.md

## Open Questions

- Should `df_backend()` and `dt_backend()` be public? They're rarely used directly — most users just use
  `server = TRUE` (which uses V8). They could remain internal and accessible only through string compat.
- Should auto-detection consider data size? e.g., `duckdb_backend()` on a 10-row data frame could skip
  DuckDB entirely and use the default client-side path. Probably not — keep it simple and predictable.
