import React from 'react'

import { aggregators, round, normalizeNumber } from './aggregators'
import { classNames, getStrIncludesLocale, strIncludes } from './utils'

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

export function buildColumnDefs(columns, groups, tableOptions = {}) {
  const { sortable } = tableOptions

  columns = columns.map(column => {
    let col = { ...column }
    col.id = col.accessor
    if (col.accessor.includes('.')) {
      // Interpret column names with dots as IDs, not paths
      col.accessor = data => data[col.id]
    }

    if (typeof col.aggregate === 'string' && aggregators[col.aggregate]) {
      const type = col.aggregate
      col.aggregate = aggregators[type]
    }

    col.Cell = function renderedCell(cell) {
      let value = cell.value
      if (col.format && col.format.cell) {
        value = formatValue(value, col.format.cell)
      }
      if (col.render && col.render.cell) {
        value = col.render.cell({ ...cell, value })
      }
      if (col.html) {
        return <div dangerouslySetInnerHTML={{ __html: value }} />
      } else {
        return value != null ? String(value) : ''
      }
    }

    // Render pivoted values the same as regular cells
    col.PivotValue = function renderedCell(cell) {
      const value = col.Cell(cell)
      return (
        <span>
          {value} {cell.subRows && `(${cell.subRows.length})`}
        </span>
      )
    }

    col.Aggregated = function renderedCell(cell) {
      // Default to empty string to avoid string conversion of undefined/null
      let value = cell.value != null ? cell.value : ''
      if (col.format && col.format.aggregated) {
        value = formatValue(value, col.format.aggregated)
      }
      if (col.render && col.render.aggregated) {
        value = col.render.aggregated({ ...cell, value })
      }
      if (col.html) {
        return <div dangerouslySetInnerHTML={{ __html: value }} />
      } else {
        // Set a default renderer to prevent the cell renderer from applying
        // to aggregated cells (without having to check cell.aggregated),
        // and also to override the default format of comma-separated values.
        return value
      }
    }

    if (col.type === 'numeric') {
      col.sortMethod = compareNumbers
      // Right-align numbers by default
      col.align = col.align || 'right'
    } else {
      col.align = col.align || 'left'
    }

    col.className = classNames(`rt-col-${col.align}`, col.className)
    col.headerClassName = classNames(`rt-col-${col.align}`, col.headerClassName)

    // Add sort icon to column header
    if (sortable || col.sortable) {
      const header = col.Header
      col.Header = function renderedHeader() {
        if (col.align === 'right') {
          return (
            <React.Fragment>
              <span className="-sort-left" />
              {header}
            </React.Fragment>
          )
        } else {
          return (
            <React.Fragment>
              {header}
              <span className="-sort-right" />
            </React.Fragment>
          )
        }
      }
    }

    // Default column filters
    //  - string columns: locale-sensitive, case-insensitive substring
    //  - numeric columns: string starts with (the default)
    //  - other columns: case-insensitive substring
    if (col.type === 'character' || col.type === 'factor') {
      col.filterAll = true
      col.filterMethod = filterRowsLocaleSubstring
    } else if (col.type !== 'numeric') {
      col.filterAll = true
      col.filterMethod = filterRowsSubstring
    }

    return col
  })

  if (groups) {
    columns = addColumnGroups(columns, groups)
    columns.forEach(col => {
      col.align = col.align || 'center'
      col.headerClassName = classNames(`rt-col-${col.align}`, col.headerClassName)
    })
  }

  return columns
}

// Add groups to an array of column definitions
export function addColumnGroups(columns, groups) {
  groups.forEach(group => {
    group = { ...group }
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

export function formatValue(value, options) {
  let {
    prefix,
    suffix,
    digits,
    separators,
    percent,
    currency,
    datetime,
    date,
    time,
    hour12,
    locales
  } = options
  if (typeof value === 'number') {
    if (percent) {
      value = value * 100
      suffix = '%' + (suffix || '')
    }
    if (digits != null) {
      value = round(value, digits)
    }
    if (separators || currency) {
      const options = { useGrouping: separators ? true : false }
      if (currency) {
        options.style = 'currency'
        options.currency = currency
      } else {
        options.maximumFractionDigits = 20
      }
      value = value.toLocaleString(locales || undefined, options)
    }
  }
  if (datetime || date || time) {
    locales = locales || undefined
    const options = {}
    if (hour12 != null) {
      options.hour12 = hour12
    }
    if (datetime) {
      value = new Date(value).toLocaleString(locales, options)
    } else if (date) {
      value = new Date(value).toLocaleDateString(locales, options)
    } else if (time) {
      value = new Date(value).toLocaleTimeString(locales, options)
    }
  }
  if (prefix != null) {
    value = String(prefix) + value
  }
  if (suffix != null) {
    value = value + String(suffix)
  }
  return value
}

function filterRowsSubstring(filter, rows) {
  const id = filter.pivotId || filter.id
  return rows.filter(row => {
    if (row[id] === undefined) {
      return true
    }
    const value = String(row[id])
    return strIncludes(value, filter.value)
  })
}

function filterRowsLocaleSubstring(filter, rows) {
  const id = filter.pivotId || filter.id
  const strIncludesLocale = getStrIncludesLocale()
  const noLocale = new RegExp(/^[\w-.\s,]*$/)
  return rows.filter(row => {
    if (row[id] === undefined) {
      return true
    }
    const value = String(row[id])
    // Ignore alphanumeric strings that don't need the (significantly) slower
    // locale-sensitive string comparison.
    if (noLocale.test(value)) {
      return strIncludes(value, filter.value)
    }
    return strIncludesLocale(value, filter.value)
  })
}
