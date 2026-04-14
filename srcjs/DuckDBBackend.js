import * as duckdb from '@duckdb/duckdb-wasm'
import { DataType } from 'apache-arrow'

import { round } from './aggregators'

// Map reactable aggregate function names to SQL aggregate expressions.
// The column identifier is passed pre-escaped.
// `numeric: true` flags aggregates whose float64 results need precision rounding.
const aggregateSQLMap = {
  sum: { sql: col => `SUM(${col})`, numeric: true },
  mean: { sql: col => `AVG(${col})`, numeric: true },
  max: { sql: col => `MAX(${col})`, numeric: true },
  min: { sql: col => `MIN(${col})`, numeric: true },
  median: { sql: col => `MEDIAN(${col})`, numeric: true },
  count: { sql: col => `COUNT(${col})`, numeric: false },
  unique: { sql: col => `STRING_AGG(DISTINCT CAST(${col} AS VARCHAR), ', ')`, numeric: false }
  // frequency: computed from sub-rows (too complex for a single GROUP BY expression)
}

// Convert an Arrow table to an array of plain JS objects, converting temporal
// columns (Date, Timestamp) from epoch milliseconds to ISO 8601 strings.
// This matches R's toJSON serialization (Date = "ISO8601", POSIXt = "ISO8601").
function arrowTableToRows(table) {
  // Find temporal columns from the schema
  const temporalCols = []
  for (const field of table.schema.fields) {
    if (DataType.isDate(field.type)) {
      temporalCols.push({ name: field.name, kind: 'date' })
    } else if (DataType.isTimestamp(field.type)) {
      temporalCols.push({ name: field.name, kind: 'timestamp' })
    }
  }

  const rows = table.toArray().map(row => row.toJSON())

  if (temporalCols.length === 0) {
    return rows
  }

  // Convert temporal values from epoch ms to ISO 8601 strings
  for (const row of rows) {
    for (const col of temporalCols) {
      const value = row[col.name]
      if (value == null) continue
      if (col.kind === 'date') {
        // Date -> "YYYY-MM-DD" (matches R's Date = "ISO8601")
        row[col.name] = new Date(value).toISOString().slice(0, 10)
      } else {
        // Timestamp -> "YYYY-MM-DDTHH:MM:SSZ" (matches R's POSIXt = "ISO8601")
        row[col.name] = new Date(value).toISOString()
      }
    }
  }

  return rows
}

export class DuckDBBackend {
  constructor() {
    this.db = null
    this.conn = null
    this.totalRowCount = 0
  }

  async init({ arrowBase64, parquetUrl, wasmBasePath }) {
    // Use the EH (Exception Handling) bundle only. The MVP fallback bundle is not
    // included to reduce package size. WebAssembly EH is supported by all major
    // browsers since late 2021 (Chrome 95, Firefox 100, Safari 15.2, Edge 95).
    const mainModule = wasmBasePath + 'duckdb-eh.wasm'
    const mainWorker = wasmBasePath + 'duckdb-browser-eh.worker.js'

    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${mainWorker}");`], { type: 'text/javascript' })
    )
    const worker = new Worker(worker_url)
    const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING)
    this.db = new duckdb.AsyncDuckDB(logger, worker)
    await this.db.instantiate(mainModule)
    URL.revokeObjectURL(worker_url)

    this.conn = await this.db.connect()

    if (parquetUrl) {
      // Parquet sidecar: create a view that queries the Parquet file via HTTP range requests.
      // DuckDB-WASM reads only the bytes needed for each query (column pruning + row group filtering).
      // Using a VIEW instead of TABLE keeps WASM memory near-zero regardless of file size.
      await this.conn.query(
        `CREATE VIEW reactable_data AS SELECT * FROM read_parquet('${parquetUrl}')`
      )
    } else {
      // Embedded Arrow IPC: decode base64 and load into DuckDB memory
      const bytes = Uint8Array.from(atob(arrowBase64), c => c.charCodeAt(0))
      await this.conn.insertArrowFromIPCStream(bytes, { name: 'reactable_data', create: true })
    }

    // Get total row count
    const countResult = await this.conn.query('SELECT COUNT(*) as n FROM reactable_data')
    this.totalRowCount = Number(countResult.toArray()[0].n)
  }

  escapeIdentifier(name) {
    // Double any existing double quotes, then wrap in double quotes
    return '"' + name.replace(/"/g, '""') + '"'
  }

  // Build WHERE clause parts from column filters and global search.
  // Returns { clauses: string[], params: any[] }
  buildWhereParts(filters, searchValue, columns) {
    const clauses = []
    const params = []

    // Column filters
    if (filters && filters.length > 0) {
      for (const filter of filters) {
        const col = this.escapeIdentifier(filter.id)
        // Match the client-side behavior: numeric columns use "starts with",
        // other columns use case-insensitive substring
        const columnMeta = columns && columns.find(c => c.id === filter.id)
        if (columnMeta && columnMeta.type === 'numeric') {
          clauses.push(`CAST(${col} AS VARCHAR) LIKE ? || '%'`)
        } else {
          clauses.push(`CAST(${col} AS VARCHAR) ILIKE '%' || ? || '%'`)
        }
        params.push(filter.value)
      }
    }

    // Global search — OR across all searchable columns
    if (searchValue) {
      const searchCols = columns ? columns.filter(c => !c.disableGlobalFilter) : []
      if (searchCols.length > 0) {
        const orClauses = searchCols.map(c => {
          const col = this.escapeIdentifier(c.id)
          if (c.type === 'numeric') {
            return `CAST(${col} AS VARCHAR) LIKE ? || '%'`
          }
          return `CAST(${col} AS VARCHAR) ILIKE '%' || ? || '%'`
        })
        clauses.push('(' + orClauses.join(' OR ') + ')')
        for (let i = 0; i < searchCols.length; i++) {
          params.push(searchValue)
        }
      }
    }

    return { clauses, params }
  }

  // Run a prepared statement with params and return the Arrow result.
  async runPrepared(sql, params) {
    const stmt = await this.conn.prepare(sql)
    const result = await stmt.query(...params)
    stmt.close()
    return result
  }

  async query({ pageIndex, pageSize, sortBy, filters, searchValue, columns, groupBy }) {
    if (groupBy && groupBy.length > 0) {
      return this.queryGrouped({
        pageIndex,
        pageSize,
        sortBy,
        filters,
        searchValue,
        columns,
        groupBy
      })
    }

    const where = this.buildWhereParts(filters, searchValue, columns)
    const whereStr = where.clauses.length > 0 ? ' WHERE ' + where.clauses.join(' AND ') : ''

    let sql = 'SELECT * FROM reactable_data' + whereStr
    const countSql = 'SELECT COUNT(*) AS n FROM reactable_data' + whereStr

    // Sort
    if (sortBy && sortBy.length > 0) {
      const orderClauses = sortBy.map(s => {
        return this.escapeIdentifier(s.id) + (s.desc ? ' DESC' : ' ASC') + ' NULLS LAST'
      })
      sql += ' ORDER BY ' + orderClauses.join(', ')
    }

    if (pageSize != null) {
      sql += ` LIMIT ${Number(pageSize)} OFFSET ${Number(pageIndex) * Number(pageSize)}`
    }

    // Run data query and count query in parallel using prepared statements
    const [dataResult, countResult] = await Promise.all([
      this.runPrepared(sql, where.params),
      this.runPrepared(countSql, where.params)
    ])

    const rows = arrowTableToRows(dataResult)
    const rowCount = Number(countResult.toArray()[0].n)

    // Extract _reactable_rowid into __state for stable row identification across pages
    for (const row of rows) {
      if (row._reactable_rowid != null) {
        row['__state'] = { id: String(row._reactable_rowid), index: row._reactable_rowid }
        delete row._reactable_rowid
      }
    }

    return { rows, rowCount }
  }

  // Query for all row IDs matching the current filters/search. Used by select-all
  // to enumerate the exact set of filtered rows rather than using a blanket flag.
  async queryRowIds({ filters, searchValue, columns }) {
    const where = this.buildWhereParts(filters, searchValue, columns)
    const whereStr = where.clauses.length > 0 ? ' WHERE ' + where.clauses.join(' AND ') : ''
    const sql = 'SELECT _reactable_rowid FROM reactable_data' + whereStr
    const result = await this.runPrepared(sql, where.params)
    return result.toArray().map(row => String(row._reactable_rowid))
  }

  // Query with GROUP BY for grouped tables. Returns rows with nested .subRows and
  // __state metadata so the client can render the grouped table correctly.
  async queryGrouped({ pageIndex, pageSize, sortBy, filters, searchValue, columns, groupBy }) {
    const baseWhere = this.buildWhereParts(filters, searchValue, columns)
    const rows = await this.buildGroupLevel({
      groupBy,
      columns,
      baseWhere,
      parentFilters: { clauses: [], params: [] },
      depth: 0,
      pageIndex,
      pageSize,
      sortBy
    })

    // Count total groups at top level
    const groupCol = this.escapeIdentifier(groupBy[0])
    const allClauses = baseWhere.clauses
    const whereStr = allClauses.length > 0 ? ' WHERE ' + allClauses.join(' AND ') : ''
    const countResult = await this.runPrepared(
      `SELECT COUNT(DISTINCT ${groupCol}) AS n FROM reactable_data` + whereStr,
      baseWhere.params
    )
    const rowCount = Number(countResult.toArray()[0].n)

    return { rows, rowCount }
  }

  // Recursively build grouped rows at the given depth level.
  async buildGroupLevel({
    groupBy,
    columns,
    baseWhere,
    parentFilters,
    depth,
    pageIndex,
    pageSize,
    sortBy
  }) {
    const groupCol = groupBy[depth]
    const escapedGroupCol = this.escapeIdentifier(groupCol)
    const groupedCols = groupBy.slice(0, depth + 1)

    // Combine base WHERE with parent group filters
    const allClauses = [...baseWhere.clauses, ...parentFilters.clauses]
    const allParams = [...baseWhere.params, ...parentFilters.params]
    const whereStr = allClauses.length > 0 ? ' WHERE ' + allClauses.join(' AND ') : ''

    // Build GROUP BY SELECT: group column + SQL-computable aggregates
    const selectParts = [escapedGroupCol]
    const postComputeAggs = [] // aggregates computed from sub-rows (e.g. frequency)
    const numericAggCols = [] // columns with numeric SQL aggregates that need precision rounding

    for (const col of columns) {
      if (groupedCols.includes(col.id)) continue
      const aggName =
        col.aggregateName || (typeof col.aggregate === 'string' ? col.aggregate : null)
      if (!aggName) continue

      const sqlAgg = aggregateSQLMap[aggName]
      if (sqlAgg) {
        selectParts.push(
          `${sqlAgg.sql(this.escapeIdentifier(col.id))} AS ${this.escapeIdentifier(col.id)}`
        )
        if (sqlAgg.numeric) {
          numericAggCols.push(col.id)
        }
      } else {
        postComputeAggs.push({ id: col.id, aggregate: aggName })
      }
    }

    let groupSql = `SELECT ${selectParts.join(', ')} FROM reactable_data${whereStr} GROUP BY ${escapedGroupCol}`

    // Sort: apply sortBy columns that are the group column or have SQL aggregates
    const sortClauses = this.buildGroupSortClauses(sortBy, groupCol, columns, groupedCols)
    if (sortClauses.length > 0) {
      groupSql += ' ORDER BY ' + sortClauses.join(', ')
    }

    // Paginate only at top level
    if (depth === 0) {
      groupSql += ` LIMIT ${Number(pageSize)} OFFSET ${Number(pageIndex) * Number(pageSize)}`
    }

    const groupResult = await this.runPrepared(groupSql, allParams)
    const groupRows = arrowTableToRows(groupResult)

    // Round numeric SQL aggregate values to avoid floating-point precision artifacts
    // (e.g., SUM returning 75.10000000000001 instead of 75.1). This matches the
    // client-side aggregators in aggregators.js which use round(result, 12).
    if (numericAggCols.length > 0) {
      for (const row of groupRows) {
        for (const colId of numericAggCols) {
          if (typeof row[colId] === 'number') {
            row[colId] = round(row[colId], 12)
          }
        }
      }
    }

    if (groupRows.length === 0) {
      return groupRows
    }

    // Fetch sub-rows for all groups in a single query using IN()
    const groupValues = groupRows.map(row => row[groupCol])
    const inPlaceholders = groupValues.map(() => '?').join(', ')
    const subClauses = [...allClauses, `${escapedGroupCol} IN (${inPlaceholders})`]
    const subParams = [...allParams, ...groupValues]
    const subWhereStr = ' WHERE ' + subClauses.join(' AND ')

    if (depth + 1 < groupBy.length) {
      // More grouping levels — recurse for each group
      for (const row of groupRows) {
        const childFilters = {
          clauses: [...parentFilters.clauses, `${escapedGroupCol} = ?`],
          params: [...parentFilters.params, row[groupCol]]
        }
        row['.subRows'] = await this.buildGroupLevel({
          groupBy,
          columns,
          baseWhere,
          parentFilters: childFilters,
          depth: depth + 1,
          pageIndex: 0,
          pageSize: Number.MAX_SAFE_INTEGER,
          sortBy
        })
        row['__state'] = { id: `${groupCol}:${row[groupCol]}`, grouped: true }
      }
    } else {
      // Leaf level — fetch all individual rows for visible groups
      let subSql = 'SELECT * FROM reactable_data' + subWhereStr
      if (sortBy && sortBy.length > 0) {
        const leafSorts = sortBy.map(
          s => this.escapeIdentifier(s.id) + (s.desc ? ' DESC' : ' ASC') + ' NULLS LAST'
        )
        subSql += ' ORDER BY ' + leafSorts.join(', ')
      }

      const subResult = await this.runPrepared(subSql, subParams)
      const allSubRows = arrowTableToRows(subResult)

      // Partition sub-rows by group value
      const subRowsByGroup = new Map()
      for (const subRow of allSubRows) {
        const key = subRow[groupCol]
        if (!subRowsByGroup.has(key)) subRowsByGroup.set(key, [])
        subRowsByGroup.get(key).push(subRow)
      }

      for (const row of groupRows) {
        row['.subRows'] = subRowsByGroup.get(row[groupCol]) || []
        row['__state'] = { id: `${groupCol}:${row[groupCol]}`, grouped: true }

        // Extract _reactable_rowid into __state for sub-rows
        for (const subRow of row['.subRows']) {
          if (subRow._reactable_rowid != null) {
            subRow['__state'] = {
              id: String(subRow._reactable_rowid),
              index: subRow._reactable_rowid
            }
            delete subRow._reactable_rowid
          }
        }

        // Post-compute aggregates that can't be expressed in SQL (e.g. frequency)
        for (const agg of postComputeAggs) {
          row[agg.id] = this.computeAggregate(agg.aggregate, row['.subRows'], agg.id)
        }
      }
    }

    return groupRows
  }

  // Build ORDER BY clauses for a GROUP BY query. Only includes sortBy columns that
  // are the group column itself or have a SQL-computable aggregate.
  buildGroupSortClauses(sortBy, groupCol, columns, groupedCols) {
    if (!sortBy || sortBy.length === 0) return []
    const clauses = []
    for (const s of sortBy) {
      if (s.id === groupCol) {
        clauses.push(this.escapeIdentifier(s.id) + (s.desc ? ' DESC' : ' ASC') + ' NULLS LAST')
      } else {
        const col = columns.find(c => c.id === s.id)
        const aggName =
          col && (col.aggregateName || (typeof col.aggregate === 'string' ? col.aggregate : null))
        if (aggName && !groupedCols.includes(col.id)) {
          const sqlAgg = aggregateSQLMap[aggName]
          if (sqlAgg) {
            // Sort by the aggregate expression
            clauses.push(
              sqlAgg.sql(this.escapeIdentifier(s.id)) + (s.desc ? ' DESC' : ' ASC') + ' NULLS LAST'
            )
          }
        }
      }
    }
    return clauses
  }

  // Compute an aggregate value from sub-row data for aggregates that can't be
  // expressed in a GROUP BY SQL expression (e.g. frequency).
  computeAggregate(aggregateName, subRows, columnId) {
    const values = subRows.map(r => r[columnId])
    if (aggregateName === 'frequency') {
      const counts = {}
      for (const v of values) {
        const key = String(v)
        counts[key] = (counts[key] || 0) + 1
      }
      return Object.entries(counts)
        .map(([value, count]) => `${value} (${count})`)
        .join(', ')
    }
    return null
  }

  async destroy() {
    if (this.conn) {
      await this.conn.close()
      this.conn = null
    }
    if (this.db) {
      await this.db.terminate()
      this.db = null
    }
  }
}
