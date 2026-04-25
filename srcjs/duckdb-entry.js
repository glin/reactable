import { DuckDBBackend } from './DuckDBBackend'

// Read the WASM base path from the locator script (duckdb-locator.js), which runs
// as a separate <script> tag before this bundle. The locator uses
// document.currentScript to detect its own URL, which is more reliable than trying
// to detect the path from within a webpack bundle (where document.currentScript
// may not be set, e.g., in Shiny's dynamic dependency loading).
window.Reactable = window.Reactable || {}
const wasmBasePath = window.Reactable.__DuckDBBasePath || ''

// Register globally so the main reactable bundle can access it.
// Uses the window.Reactable namespace to avoid polluting the global scope.
// This runs before the main reactable.js bundle, which uses webpack's
// assign-properties library type that preserves existing properties.
window.Reactable.__DuckDB = {
  DuckDBBackend,
  wasmBasePath
}
