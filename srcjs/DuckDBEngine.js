import * as duckdb from '@duckdb/duckdb-wasm'

export class DuckDBEngine {
  constructor() {
    this.db = null
    this.conn = null
    this.totalRowCount = 0
  }

  async init(arrowBase64, wasmBasePath) {
    // Build bundle descriptor pointing to self-hosted WASM/worker files
    const bundles = {
      mvp: {
        mainModule: wasmBasePath + 'duckdb-mvp.wasm',
        mainWorker: wasmBasePath + 'duckdb-browser-mvp.worker.js'
      },
      eh: {
        mainModule: wasmBasePath + 'duckdb-eh.wasm',
        mainWorker: wasmBasePath + 'duckdb-browser-eh.worker.js'
      }
    }

    const bundle = await duckdb.selectBundle(bundles)
    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
    )
    const worker = new Worker(worker_url)
    const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING)
    this.db = new duckdb.AsyncDuckDB(logger, worker)
    await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker)
    URL.revokeObjectURL(worker_url)

    // Decode base64 Arrow IPC and load into DuckDB
    const bytes = Uint8Array.from(atob(arrowBase64), c => c.charCodeAt(0))
    this.conn = await this.db.connect()
    await this.conn.insertArrowFromIPCStream(bytes, { name: 'reactable_data', create: true })

    // Get total row count
    const countResult = await this.conn.query('SELECT COUNT(*) as n FROM reactable_data')
    this.totalRowCount = Number(countResult.toArray()[0].n)
  }

  escapeIdentifier(name) {
    // Double any existing double quotes, then wrap in double quotes
    return '"' + name.replace(/"/g, '""') + '"'
  }

  async query({ pageIndex, pageSize, sortBy, filters, searchValue, columns }) {
    let sql = 'SELECT * FROM reactable_data'
    let countSql = 'SELECT COUNT(*) AS n FROM reactable_data'
    const whereClauses = []
    const params = []

    // Column filters
    if (filters && filters.length > 0) {
      for (const filter of filters) {
        const col = this.escapeIdentifier(filter.id)
        // Match the client-side behavior: numeric columns use "starts with",
        // other columns use case-insensitive substring
        const columnMeta = columns && columns.find(c => c.id === filter.id)
        if (columnMeta && columnMeta.type === 'numeric') {
          whereClauses.push(`CAST(${col} AS VARCHAR) LIKE ? || '%'`)
        } else {
          whereClauses.push(`CAST(${col} AS VARCHAR) ILIKE '%' || ? || '%'`)
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
        whereClauses.push('(' + orClauses.join(' OR ') + ')')
        for (let i = 0; i < searchCols.length; i++) {
          params.push(searchValue)
        }
      }
    }

    if (whereClauses.length > 0) {
      const whereStr = ' WHERE ' + whereClauses.join(' AND ')
      sql += whereStr
      countSql += whereStr
    }

    // Sort
    if (sortBy && sortBy.length > 0) {
      const orderClauses = sortBy.map(s => {
        return this.escapeIdentifier(s.id) + (s.desc ? ' DESC' : ' ASC') + ' NULLS LAST'
      })
      sql += ' ORDER BY ' + orderClauses.join(', ')
    }

    sql += ` LIMIT ${Number(pageSize)} OFFSET ${Number(pageIndex) * Number(pageSize)}`

    // Run data query and count query in parallel using prepared statements
    const dataStmt = await this.conn.prepare(sql)
    const countStmt = await this.conn.prepare(countSql)
    const [dataResult, countResult] = await Promise.all([
      dataStmt.query(...params),
      countStmt.query(...params)
    ])
    dataStmt.close()
    countStmt.close()

    const rows = dataResult.toArray().map(row => row.toJSON())
    const rowCount = Number(countResult.toArray()[0].n)

    return { rows, rowCount }
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
