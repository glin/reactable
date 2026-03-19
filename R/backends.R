#' DuckDB Backend
#'
#' Use DuckDB for table data processing. In static documents (R Markdown, Quarto),
#' uses DuckDB-WASM in the browser for client-side sorting, filtering, and pagination
#' via SQL. In Shiny, uses the DuckDB R package on the server.
#'
#' @param mode One of `"auto"`, `"client"`, or `"server"`:
#'   \describe{
#'     \item{`"auto"` (default)}{Automatically detects the rendering context.
#'       Uses DuckDB-WASM client-side in static documents, or the DuckDB R package
#'       server-side in Shiny apps.}
#'     \item{`"client"`}{Always uses DuckDB-WASM in the browser. Data is serialized
#'       as Arrow IPC and sent to the client.}
#'     \item{`"server"`}{Always uses the DuckDB R package on the server. Only works
#'       in Shiny apps.}
#'   }
#' @param format Data format for client-side mode. One of `"auto"`, `"arrow"`, or `"parquet"`:
#'   \describe{
#'     \item{`"auto"` (default)}{Uses Arrow IPC for small datasets and Parquet sidecar
#'       files for larger datasets (over ~20 MB). Parquet files are served via HTTP range
#'       requests so the browser only downloads the data it needs for each page.}
#'     \item{`"arrow"`}{Always embeds data as base64-encoded Arrow IPC in the HTML document.}
#'     \item{`"parquet"`}{Always writes a Parquet sidecar file alongside the HTML document.
#'       Only works with `self_contained: false` output.}
#'   }
#'
#'   The `format` option only applies in client-side mode (DuckDB-WASM in the browser).
#'   In server mode, data stays in R memory and this option is ignored.
#'
#' @return A backend object to pass to the `backend` argument of [reactable()].
#'
#' @note
#' The DuckDB backend does not support:
#' \itemize{
#'   \item Custom `searchMethod` or column `filterMethod` (SQL-based search/filter is used instead)
#'   \item Custom JavaScript `aggregate` functions (use built-in aggregate names like `"sum"`, `"mean"`)
#'   \item R function renderers for `cell`, `details`, `style`, `class`, `rowClass`, `rowStyle`
#'     (use `JS()` function renderers instead)
#'   \item Row selection
#' }
#'
#' @examples
#' \dontrun{
#' # Auto-detection: WASM in static docs, server in Shiny
#' reactable(data, backend = backendDuckDB())
#'
#' # Force client-side (DuckDB-WASM)
#' reactable(data, backend = backendDuckDB("client"))
#'
#' # Force server-side (DuckDB R package, Shiny only)
#' reactable(data, backend = backendDuckDB("server"))
#'
#' # Always use Parquet sidecar files (for large datasets)
#' reactable(data, backend = backendDuckDB(format = "parquet"))
#'
#' # Always embed Arrow IPC (for self-contained output)
#' reactable(data, backend = backendDuckDB(format = "arrow"))
#' }
#'
#' @export
backendDuckDB <- function(mode = c("auto", "client", "server"),
                          format = c("auto", "arrow", "parquet")) {
  mode <- match.arg(mode)
  format <- match.arg(format)
  structure(list(mode = mode, format = format), class = "reactable_backendDuckDB")
}

isDuckDBBackend <- function(x) {
  inherits(x, "reactable_backendDuckDB")
}

# Resolve "auto" mode to "client" or "server" based on rendering context
resolveDuckDBMode <- function(backend) {
  if (backend$mode != "auto") return(backend$mode)
  session <- NULL
  if (requireNamespace("shiny", quietly = TRUE)) {
    session <- shiny::getDefaultReactiveDomain()
  }
  if (!is.null(session)) "server" else "client"
}
