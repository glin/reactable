import { DuckDBEngine } from './DuckDBEngine'

// Detect the base path for WASM files from this script's URL.
// This script is loaded via an htmlDependency <script> tag, so
// document.currentScript points to it. WASM files are in the same directory.
const currentScript = document.currentScript
const wasmBasePath = currentScript ? currentScript.src.replace(/[^/]*$/, '') : ''

// Register globally so the main reactable bundle can access it
window.__ReactableDuckDB = {
  DuckDBEngine,
  wasmBasePath
}
