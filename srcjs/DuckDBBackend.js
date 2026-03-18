import * as duckdb from '@duckdb/duckdb-wasm'

// Map reactable aggregate function names to SQL aggregate expressions.
// The column identifier is passed pre-escaped.
const aggregateSQLMap = {
  sum: col => `SUM(${col})`,
  mean: col => `AVG(${col})`,
  max: col => `MAX(${col})`,
  min: col => `MIN(${col})`,
  median: col => `MEDIAN(${col})`,
  count: col => `COUNT(${col})`,
  unique: col => `STRING_AGG(DISTINCT CAST(${col} AS VARCHAR), ', ')`
  // frequency: computed from sub-rows (too complex for a single GROUP BY expression)
}

export class DuckDBBackend {
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

    const rows = dataResult.toArray().map(row => row.toJSON())
    const rowCount = Number(countResult.toArray()[0].n)

    return { rows, rowCount }
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

    for (const col of columns) {
      if (groupedCols.includes(col.id)) continue
      const aggName =
        col.aggregateName || (typeof col.aggregate === 'string' ? col.aggregate : null)
      if (!aggName) continue

      const sqlFn = aggregateSQLMap[aggName]
      if (sqlFn) {
        selectParts.push(
          `${sqlFn(this.escapeIdentifier(col.id))} AS ${this.escapeIdentifier(col.id)}`
        )
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
    const groupRows = groupResult.toArray().map(row => row.toJSON())

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
        row['__state'] = { grouped: true }
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
      const allSubRows = subResult.toArray().map(r => r.toJSON())

      // Partition sub-rows by group value
      const subRowsByGroup = new Map()
      for (const subRow of allSubRows) {
        const key = subRow[groupCol]
        if (!subRowsByGroup.has(key)) subRowsByGroup.set(key, [])
        subRowsByGroup.get(key).push(subRow)
      }

      for (const row of groupRows) {
        row['.subRows'] = subRowsByGroup.get(row[groupCol]) || []
        row['__state'] = { grouped: true }

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
          const sqlFn = aggregateSQLMap[aggName]
          if (sqlFn) {
            // Sort by the aggregate expression
            clauses.push(
              sqlFn(this.escapeIdentifier(s.id)) + (s.desc ? ' DESC' : ' ASC') + ' NULLS LAST'
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
