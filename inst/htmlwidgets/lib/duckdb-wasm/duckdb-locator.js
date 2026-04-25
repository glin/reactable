// Detect and register the base path for DuckDB WASM files.
// WASM and worker files are in the same directory as this script.
// In Shiny, scripts are dynamically inserted via document.createElement(),
// so document.currentScript is null. Fall back to querying the DOM.
(function() {
  var s = document.currentScript ||
    document.querySelector('script[src*="duckdb-locator"]');
  var basePath = s ? s.src.replace(/[^/]*$/, '') : '';
  window.Reactable = window.Reactable || {};
  window.Reactable.__DuckDBBasePath = basePath;
})();
