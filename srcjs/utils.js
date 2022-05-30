export function classNames(...classes) {
  return classes.filter(cls => cls).join(' ')
}

export function getFirstDefined(...args) {
  return args.find(x => x != null)
}

// Case-insensitive string includes
export function strIncludes(string, substring) {
  return string.toUpperCase().indexOf(substring.toUpperCase()) >= 0
}

// Locale-sensitive, case-insensitive string includes
export function getStrIncludesLocale(locales, options = { sensitivity: 'base' }) {
  const collator = new Intl.Collator(locales, options)
  return (string, substring) => {
    const strLength = string.length
    const substrLength = substring.length
    for (let i = 0; i <= strLength - substrLength; i++) {
      if (collator.compare(string.substring(i, i + substrLength), substring) === 0) {
        return true
      }
    }
    return false
  }
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

export function rowsToCSV(rows) {
  if (rows.length === 0) {
    return ''
  }
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
        if (typeof value === 'string' && value.match(/[",]/)) {
          value = `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      .join(',')
  }
  let csv = []
  const headers = Object.keys(rows[0])
  csv.push(rowToCSV(headers))
  for (let row of rows) {
    csv.push(rowToCSV(Object.values(row)))
  }
  return csv.join('\n') + '\n'
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
