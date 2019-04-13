import React from 'react'

import { aggregators } from './aggregators'

// Convert column-based data to rows
// e.g. { a: [1, 2], b: ['x', 'y'] } to [{ a: 1, b: 'x' }, { a: 2, b: 'y' }]
export function columnsToRows(columns) {
  const names = Object.keys(columns)
  const rows = new Array(columns[names[0]].length)
  for (let i = 0; i < rows.length; i++) {
    rows[i] = {}
    for (let name of names) {
      rows[i][name] = columns[name][i]
    }
  }
  return rows
}

export function buildColumnDefs(columns, groups) {
  columns = columns.map(col => {
    col.id = col.accessor
    if (col.accessor.includes('.')) {
      // Interpret column names with dots as IDs, not paths
      col.accessor = data => data[col.id]
    }

    if (typeof col.aggregate === 'string' && aggregators[col.aggregate]) {
      const type = col.aggregate
      col.aggregate = aggregators[type]
    }

    if (col.render && col.render.cell) {
      const renderCell = col.render.cell
      col.Cell = function renderedCell(cell) {
        return <div dangerouslySetInnerHTML={{ __html: renderCell(cell) }} />
      }
    }
    if (col.render && col.render.aggregated) {
      const renderAggregated = col.render.aggregated
      col.Aggregated = function renderedCell(cell) {
        return <div dangerouslySetInnerHTML={{ __html: renderAggregated(cell) }} />
      }
    } else {
      // Set a default renderer to prevent the cell renderer from applying
      // to aggregated cells (without having to check cell.aggregated).
      col.Aggregated = cell => cell.value
    }

    if (col.type === 'numeric') {
      col.sortMethod = compareNumbers
      // Right-align numbers by default
      col.style = { textAlign: 'right', ...col.style }
    }

    return col
  })

  if (groups) {
    columns = addColumnGroups(columns, groups)
  }

  return columns
}

// Add groups to an array of column definitions
export function addColumnGroups(columns, groups) {
  groups.forEach(group => {
    const groupIds = group.columns
    group.columns = []
    columns = columns.reduce((newCols, col) => {
      if (col.id === groupIds[0]) {
        newCols.push(group)
        group.columns.push(col)
      } else if (groupIds.includes(col.id)) {
        group.columns.push(col)
      } else {
        newCols.push(col)
      }
      return newCols
    }, [])
  })

  // Workaround for bug in react-table >= 6.5.2 where ungrouped pivot columns
  // are incompatible with grouped aggregate columns. Add all ungrouped
  // columns to their own header group (combining adjacent columns).
  // https://github.com/tannerlinsley/react-table/issues/472
  const newCols = []
  let lastGroup
  columns.forEach(col => {
    if (col.columns) {
      // Already a header group
      newCols.push(col)
      lastGroup = null
    } else {
      // Individual column
      if (!lastGroup) {
        lastGroup = { columns: [] }
        newCols.push(lastGroup)
      }
      lastGroup.columns.push(col)
    }
  })
  columns = newCols

  return columns
}

// Compare function that handles handles NAs and Inf/-Inf
export function compareNumbers(a, b) {
  a = normalizeNumber(a)
  b = normalizeNumber(b)
  a = typeof a === 'string' ? a.toLowerCase() : a
  b = typeof b === 'string' ? b.toLowerCase() : b
  if (a === b) {
    return 0
  }
  if (a == null) {
    return -1
  }
  if (b == null) {
    return 1
  }
  if (a > b) {
    return 1
  }
  if (a < b) {
    return -1
  }
  return 0
}

function normalizeNumber(n) {
  if (n === null || n === undefined || n === 'NA') {
    n = null
  }
  if (n === 'Inf') {
    n = Infinity
  }
  if (n === '-Inf') {
    n = -Infinity
  }
  return n
}
