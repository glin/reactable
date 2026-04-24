// Shared constants used across both the main reactable bundle and the DuckDB bundle.
// This module must remain dependency-free (no React, reactR, etc.) so it can be
// imported by the standalone DuckDB webpack entry without pulling in UI libraries.

// Key for nested sub-rows in row data (overrides react-table's default 'subRows')
export const subRowsKey = '.subRows'

// Key for internal row state metadata (row ID, grouping info, etc.)
export const rowStateKey = '__state'

// Internal column added by R-side Arrow IPC serialization for stable row identification
export const rowIdKey = '_reactable_rowid'
