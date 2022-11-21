import React from 'react'
import { useGetLatest } from 'react-table'

export function classNames(...classes) {
  return classes.filter(cls => cls).join(' ')
}

export function getFirstDefined(...args) {
  return args.find(x => x != null)
}

export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Get leaf columns as an array
export function getLeafColumns(column) {
  const leafColumns = []
  const recurseColumn = column => {
    if (column.columns) {
      column.columns.forEach(recurseColumn)
    } else {
      leafColumns.push(column)
    }
  }
  recurseColumn(column)
  return leafColumns
}

// Convert row data for react-table v6 compatibility
export function convertRowsToV6(rows) {
  return rows.map(row => {
    if (row.subRows && row.subRows.length > 0) {
      return { _subRows: convertRowsToV6(row.subRows), ...row.values }
    } else {
      return row.values
    }
  })
}

export function rowsToCSV(rows, options = {}) {
  let { columnIds, headers = true, sep = ',' } = options
  const rowToCSV = row => {
    return row
      .map(value => {
        if (value == null) {
          value = ''
        }
        // Serialize dates as ISO strings, all other non-string and non-numeric values as JSON
        if (value instanceof Date) {
          value = value.toISOString()
        } else if (typeof value !== 'string' && typeof value !== 'number') {
          value = JSON.stringify(value)
        }
        // Escape CSV-unsafe characters
        if (typeof value === 'string' && (value.includes('"') || value.includes(sep))) {
          value = `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      .join(sep)
  }
  let csvRows = []
  if (!columnIds) {
    columnIds = rows.length > 0 ? Object.keys(rows[0]) : []
  }
  if (headers) {
    csvRows.push(rowToCSV(columnIds))
  }
  for (let row of rows) {
    const values = columnIds.map(id => row[id])
    csvRows.push(rowToCSV(values))
  }
  return csvRows.join('\n') + '\n'
}

export function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  if (window.navigator.msSaveBlob) {
    // For IE11
    window.navigator.msSaveBlob(blob, filename)
  } else {
    const link = document.createElement('a')
    const url = window.URL.createObjectURL(blob)
    link.href = url
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(url)
  }
}

export function isBrowser() {
  return typeof document !== 'undefined'
}

// useAsyncDebounce from react-table without async/await (which seems to be unnecessary anyway)
// to avoid adding regenerator-runtime to bundle.
export function useAsyncDebounce(defaultFn, defaultWait = 0) {
  const debounceRef = React.useRef({})

  const getDefaultFn = useGetLatest(defaultFn)
  const getDefaultWait = useGetLatest(defaultWait)

  return React.useCallback(
    (...args) => {
      if (!debounceRef.current.promise) {
        debounceRef.current.promise = new Promise((resolve, reject) => {
          debounceRef.current.resolve = resolve
          debounceRef.current.reject = reject
        })
      }

      if (debounceRef.current.timeout) {
        clearTimeout(debounceRef.current.timeout)
      }

      debounceRef.current.timeout = setTimeout(() => {
        delete debounceRef.current.timeout
        try {
          debounceRef.current.resolve(getDefaultFn()(...args))
        } catch (err) {
          debounceRef.current.reject(err)
        } finally {
          delete debounceRef.current.promise
        }
      }, getDefaultWait())

      return debounceRef.current.promise
    },
    [getDefaultFn, getDefaultWait]
  )
}
