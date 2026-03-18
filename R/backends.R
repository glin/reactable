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
#' }
#'
#' @export
backendDuckDB <- function(mode = c("auto", "client", "server")) {
  mode <- match.arg(mode)
  structure(list(mode = mode), class = "reactable_backendDuckDB")
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
