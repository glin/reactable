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
  unique: { sql: col => `STRING_AGG(DISTINCT CAST(${col} AS VARCHAR), ', ' ORDER BY 1)`, numeric: false }
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

  async query({
    pageIndex,
    pageSize,
    sortBy,
    filters,
    searchValue,
    columns,
    groupBy,
    expanded,
    paginateSubRows
  }) {
    if (groupBy && groupBy.length > 0) {
      if (paginateSubRows) {
        return this.queryGroupedPaginated({
          pageIndex,
          pageSize,
          sortBy,
          filters,
          searchValue,
          columns,
          groupBy,
          expanded
        })
      }
      return this.queryGrouped({
        pageIndex,
        pageSize,
        sortBy,
        filters,
        searchValue,
        columns,
        groupBy,
        expanded
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
  async queryGrouped({
    pageIndex,
    pageSize,
    sortBy,
    filters,
    searchValue,
    columns,
    groupBy,
    expanded
  }) {
    const baseWhere = this.buildWhereParts(filters, searchValue, columns)
    // expanded=undefined means all groups expanded (fetch all sub-rows).
    // expanded={} means all collapsed. expanded={"id":true} means only that group
    // is expanded. Pass through as-is; buildGroupLevel checks for null.
    const expandedMap = expanded
    const rows = await this.buildGroupLevel({
      groupBy,
      columns,
      baseWhere,
      parentFilters: { clauses: [], params: [] },
      depth: 0,
      pageIndex,
      pageSize,
      sortBy,
      expandedMap,
      parentId: null
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

  // Query with GROUP BY and paginateSubRows. Returns a flat list where group headers
  // and expanded sub-rows are interleaved, paginated as a single list. Sub-rows count
  // toward pageSize. Only fetches sub-rows for expanded groups on the current page.
  // Supports multi-level groupBy via recursive sub-group fetching.
  async queryGroupedPaginated({
    pageIndex,
    pageSize,
    sortBy,
    filters,
    searchValue,
    columns,
    groupBy,
    expanded
  }) {
    const baseWhere = this.buildWhereParts(filters, searchValue, columns)
    const expandedMap = expanded || {}

    // Build the full group tree with flat sizes, then paginate
    const tree = await this.buildPaginatedGroupTree({
      groupBy,
      columns,
      baseWhere,
      parentFilters: { clauses: [], params: [] },
      parentId: null,
      depth: 0,
      expandedMap,
      sortBy
    })

    // Compute total flattened row count
    let rowCount = 0
    for (const node of tree) {
      rowCount += node.flatSize
    }

    // Collect rows for the current page
    const pageStart = Number(pageIndex) * Number(pageSize)
    const pageEnd = pageStart + Number(pageSize)
    const rows = []

    await this.collectPageRows({
      nodes: tree,
      pageStart,
      pageEnd,
      flatOffset: 0,
      rows,
      groupBy,
      columns,
      baseWhere,
      sortBy
    })

    return { rows, rowCount }
  }

  // Recursively build the group tree for paginateSubRows. Each node contains:
  // - groupId, groupValue, row (aggregate data), depth
  // - subCount (number of leaf rows in this group)
  // - isExpanded, children (sub-group nodes or null for leaf level)
  // - flatSize (1 + sum of children flat sizes if expanded, else 1)
  // - parentFilters (WHERE clauses to scope queries to this group's ancestors)
  async buildPaginatedGroupTree({
    groupBy,
    columns,
    baseWhere,
    parentFilters,
    parentId,
    depth,
    expandedMap,
    sortBy
  }) {
    const groupCol = groupBy[depth]
    const escapedGroupCol = this.escapeIdentifier(groupCol)
    const groupedCols = groupBy.slice(0, depth + 1)
    const isLeafLevel = depth + 1 >= groupBy.length

    // Combine base WHERE with parent group filters
    const allClauses = [...baseWhere.clauses, ...parentFilters.clauses]
    const allParams = [...baseWhere.params, ...parentFilters.params]
    const whereStr = allClauses.length > 0 ? ' WHERE ' + allClauses.join(' AND ') : ''

    // Build GROUP BY SELECT with aggregates and COUNT(*) for sub-row counts
    const selectParts = [escapedGroupCol, `COUNT(*) AS _sub_count`]
    // For non-leaf levels, also count distinct sub-groups so we always know the
    // immediate children count (used for the "(N)" expander display)
    if (!isLeafLevel) {
      const nextGroupCol = this.escapeIdentifier(groupBy[depth + 1])
      selectParts.push(`COUNT(DISTINCT ${nextGroupCol}) AS _sub_group_count`)
    }
    const numericAggCols = []

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
      }
    }

    let groupSql = `SELECT ${selectParts.join(', ')} FROM reactable_data${whereStr} GROUP BY ${escapedGroupCol}`

    const sortClauses = this.buildGroupSortClauses(sortBy, groupCol, columns, groupedCols)
    if (sortClauses.length > 0) {
      groupSql += ' ORDER BY ' + sortClauses.join(', ')
    }

    // Fetch ALL groups at this level (no LIMIT) to compute flattened row count
    const groupResult = await this.runPrepared(groupSql, allParams)
    const allGroups = arrowTableToRows(groupResult)

    // Round numeric aggregates
    if (numericAggCols.length > 0) {
      for (const row of allGroups) {
        for (const colId of numericAggCols) {
          if (typeof row[colId] === 'number') {
            row[colId] = round(row[colId], 12)
          }
        }
      }
    }

    // Build tree nodes
    const nodes = []
    for (const row of allGroups) {
      const groupId = parentId
        ? `${parentId}.${groupCol}:${row[groupCol]}`
        : `${groupCol}:${row[groupCol]}`
      const subCount = Number(row._sub_count)
      const isExpanded = Boolean(expandedMap[groupId])

      const childFilters = {
        clauses: [...parentFilters.clauses, `${escapedGroupCol} = ?`],
        params: [...parentFilters.params, row[groupCol]]
      }

      let children = null
      let flatSize = 1 // the group header itself

      if (isExpanded) {
        if (isLeafLevel) {
          // Expanded leaf-level group: children are data rows
          flatSize = 1 + subCount
        } else {
          // Expanded non-leaf group: recursively fetch sub-groups
          children = await this.buildPaginatedGroupTree({
            groupBy,
            columns,
            baseWhere,
            parentFilters: childFilters,
            parentId: groupId,
            depth: depth + 1,
            expandedMap,
            sortBy
          })
          let childrenSize = 0
          for (const child of children) {
            childrenSize += child.flatSize
          }
          flatSize = 1 + childrenSize
        }
      }

      // subGroupCount: for non-leaf levels, the number of distinct sub-groups
      const subGroupCount = !isLeafLevel ? Number(row._sub_group_count) : null

      nodes.push({
        groupId,
        groupValue: row[groupCol],
        subCount,
        subGroupCount,
        isExpanded,
        flatSize,
        row,
        depth,
        isLeafLevel,
        children,
        childFilters
      })
    }

    return nodes
  }

  // Walk the group tree and collect rows that fall within [pageStart, pageEnd).
  // Only fetches leaf sub-rows for expanded groups on the current page.
  async collectPageRows({
    nodes,
    pageStart,
    pageEnd,
    flatOffset,
    rows,
    groupBy,
    columns,
    baseWhere,
    sortBy
  }) {
    let offset = flatOffset

    for (const node of nodes) {
      const nodeStart = offset
      const nodeEnd = nodeStart + node.flatSize

      if (nodeEnd <= pageStart) {
        offset = nodeEnd
        continue // entirely before this page
      }
      if (nodeStart >= pageEnd) {
        break // entirely after this page
      }

      // Group header on this page?
      if (nodeStart >= pageStart && nodeStart < pageEnd) {
        const headerRow = { ...node.row }
        delete headerRow._sub_count
        delete headerRow._sub_group_count
        headerRow['__state'] = {
          id: node.groupId,
          grouped: true,
          // subRowCount: number of immediate children for the expander "(N)" display.
          // Leaf-level groups: count of data rows. Non-leaf groups: count of sub-groups.
          subRowCount: node.subGroupCount != null ? node.subGroupCount : node.subCount
        }
        rows.push(headerRow)
      }

      if (node.isExpanded) {
        if (node.isLeafLevel) {
          // Fetch leaf sub-row slice
          const subFlatStart = nodeStart + 1
          const subSliceStart = Math.max(0, pageStart - subFlatStart)
          const subSliceEnd = Math.min(node.subCount, pageEnd - subFlatStart)

          if (subSliceEnd > subSliceStart) {
            const subLimit = subSliceEnd - subSliceStart
            const subOffset = subSliceStart

            const allClauses = [...baseWhere.clauses, ...node.childFilters.clauses]
            const allParams = [...baseWhere.params, ...node.childFilters.params]
            let subSql = `SELECT * FROM reactable_data WHERE ${allClauses.join(' AND ')}`

            if (sortBy && sortBy.length > 0) {
              const leafSorts = sortBy.map(
                s => this.escapeIdentifier(s.id) + (s.desc ? ' DESC' : ' ASC') + ' NULLS LAST'
              )
              subSql += ' ORDER BY ' + leafSorts.join(', ')
            }
            subSql += ` LIMIT ${subLimit} OFFSET ${subOffset}`

            const subResult = await this.runPrepared(subSql, allParams)
            const subRows = arrowTableToRows(subResult)

            for (const subRow of subRows) {
              if (subRow._reactable_rowid != null) {
                subRow['__state'] = {
                  id: String(subRow._reactable_rowid),
                  index: subRow._reactable_rowid,
                  parentId: node.groupId
                }
                delete subRow._reactable_rowid
              }
              rows.push(subRow)
            }
          }
        } else if (node.children) {
          // Recurse into sub-group children
          await this.collectPageRows({
            nodes: node.children,
            pageStart,
            pageEnd,
            flatOffset: nodeStart + 1, // children start after this header
            rows,
            groupBy,
            columns,
            baseWhere,
            sortBy
          })
        }
      }

      offset = nodeEnd
    }

    return offset
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
    sortBy,
    expandedMap,
    parentId
  }) {
    const groupCol = groupBy[depth]
    const escapedGroupCol = this.escapeIdentifier(groupCol)
    const groupedCols = groupBy.slice(0, depth + 1)

    // Combine base WHERE with parent group filters
    const allClauses = [...baseWhere.clauses, ...parentFilters.clauses]
    const allParams = [...baseWhere.params, ...parentFilters.params]
    const whereStr = allClauses.length > 0 ? ' WHERE ' + allClauses.join(' AND ') : ''

    // Build GROUP BY SELECT: group column + COUNT(*) for sub-row counts + SQL-computable aggregates
    const selectParts = [escapedGroupCol, 'COUNT(*) AS _sub_count']
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

    // Classify groups as expanded or collapsed based on the expanded map.
    // expandedMap=null/undefined means all groups expanded (fetch all sub-rows).
    // Collapsed groups get empty .subRows with subRowCount for the expander arrow.
    // Expanded groups get full sub-rows fetched from the database.
    const expandedGroups = []
    const collapsedGroups = []
    for (const row of groupRows) {
      const stateId = `${groupCol}:${row[groupCol]}`
      const rowId = parentId ? parentId + '.' + stateId : stateId
      const subCount = Number(row._sub_count)
      delete row._sub_count

      if (expandedMap == null || expandedMap[rowId]) {
        expandedGroups.push(row)
      } else {
        collapsedGroups.push(row)
        row['.subRows'] = []
        row['__state'] = { id: stateId, grouped: true, subRowCount: subCount }
      }
    }

    if (depth + 1 < groupBy.length) {
      // More grouping levels — recurse only for expanded groups
      for (const row of expandedGroups) {
        const stateId = `${groupCol}:${row[groupCol]}`
        const rowId = parentId ? parentId + '.' + stateId : stateId
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
          sortBy,
          expandedMap,
          parentId: rowId
        })
        row['__state'] = { id: stateId, grouped: true }
      }
    } else if (expandedGroups.length > 0) {
      // Leaf level — fetch individual rows only for expanded groups
      const groupValues = expandedGroups.map(row => row[groupCol])
      const inPlaceholders = groupValues.map(() => '?').join(', ')
      const subClauses = [...allClauses, `${escapedGroupCol} IN (${inPlaceholders})`]
      const subParams = [...allParams, ...groupValues]
      const subWhereStr = ' WHERE ' + subClauses.join(' AND ')

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

      for (const row of expandedGroups) {
        const stateId = `${groupCol}:${row[groupCol]}`
        row['.subRows'] = subRowsByGroup.get(row[groupCol]) || []
        row['__state'] = { id: stateId, grouped: true }

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
