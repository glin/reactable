import { DuckDBBackend } from './DuckDBBackend'

// Read the WASM base path from the locator script (duckdb-locator.js), which runs
// as a separate <script> tag before this bundle. The locator uses
// document.currentScript to detect its own URL, which is more reliable than trying
// to detect the path from within a webpack bundle (where document.currentScript
// may not be set, e.g., in Shiny's dynamic dependency loading).
const wasmBasePath = window.__ReactableDuckDBBasePath || ''

// Register globally so the main reactable bundle can access it
window.__ReactableDuckDB = {
  DuckDBBackend,
  wasmBasePath
}
