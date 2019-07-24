import React, { Fragment } from 'react'
import { ReactTableDefaults } from 'react-table'
import { hydrate } from 'reactR'

import { aggregators, normalizeNumber, isNA } from './aggregators'
import { classNames, getFirstDefined, getStrIncludesLocale, strIncludes } from './utils'

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

export function buildColumnDefs(columns, groups, tableProps = {}) {
  const { sortable, showSortable, isExpanded, onExpanderClick } = tableProps

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

    col.Cell = function Cell(cell) {
      let value = cell.value
      // Render NAs and NaNs as blank cells
      if (!col.showNA && col.type === 'numeric' && isNA(value)) {
        value = null
      }
      if (col.format && col.format.cell) {
        value = formatValue(value, col.format.cell)
      }
      if (col.cell) {
        if (typeof col.cell === 'function') {
          value = col.cell({ ...cell, value })
        }
        // Make sure we don't render aggregated cells for R renderers
        if (col.cell instanceof Array && !cell.aggregated) {
          value = col.cell[cell.index]
          if (value) {
            value = hydrate({ Fragment }, col.cell[cell.index])
          }
        }
      }

      let content
      if (React.isValidElement(value)) {
        content = value
      } else if (col.html) {
        content = <div dangerouslySetInnerHTML={{ __html: value }} />
      } else {
        content = value != null ? String(value) : ''
      }

      // Render expander for custom row details
      let expander
      if (col.details) {
        if (col.details instanceof Array && col.details[cell.index] == null) {
          // Don't expand rows without content
        } else {
          expander = ReactTableDefaults.ExpanderComponent({ ...cell, isExpanded: isExpanded(cell) })
        }
      }

      if (expander) {
        return (
          <React.Fragment>
            {expander}
            {content}
          </React.Fragment>
        )
      }
      return content
    }

    // Render pivoted values the same as regular cells
    col.PivotValue = function PivotValue(cell) {
      const value = col.Cell(cell)
      return (
        <span>
          {value} {cell.subRows && `(${cell.subRows.length})`}
        </span>
      )
    }

    col.Aggregated = function Aggregated(cell) {
      // Default to empty string to avoid string conversion of undefined/null
      let value = cell.value != null ? cell.value : ''
      if (col.format && col.format.aggregated) {
        value = formatValue(value, col.format.aggregated)
      }
      if (col.aggregated) {
        value = col.aggregated({ ...cell, value })
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

    if (col.footer) {
      col.Footer = function Footer(colInfo) {
        let footer
        if (typeof col.footer === 'function') {
          footer = col.footer(colInfo)
        } else {
          footer = hydrate({ Fragment }, col.footer)
        }
        if (React.isValidElement(footer)) {
          return footer
        } else if (col.html) {
          return <div dangerouslySetInnerHTML={{ __html: footer }} />
        } else {
          return footer != null ? String(footer) : ''
        }
      }

      // Workaround for bug in react-table >= 6.7.0 where footerClassName
      // and footerStyle are not passed through.
      // https://github.com/tannerlinsley/react-table/issues/598
      col.getFooterProps = () => {
        return {
          className: col.footerClassName,
          style: col.footerStyle
        }
      }
    }

    col.sortMethod = createCompareFunction({ type: col.type, naLast: col.sortMethod === 'naLast' })

    if (col.type === 'numeric') {
      // Right-align numbers by default
      col.align = col.align || 'right'
    } else {
      col.align = col.align || 'left'
    }

    const colAlignClass = `rt-col-${col.align}`
    col.headerClassName = classNames(colAlignClass, col.headerClassName)
    col.footerClassName = classNames(colAlignClass, col.footerClassName)

    // Add sort icon to column header
    const isSortable = getFirstDefined(col.sortable, sortable)
    if (isSortable) {
      const header = col.Header
      col.Header = function Header() {
        const sortClass = showSortable ? '-sort' : ''
        if (col.align === 'right') {
          return (
            <React.Fragment>
              <span className={classNames(sortClass, '-sort-left')} />
              {header}
            </React.Fragment>
          )
        } else {
          return (
            <React.Fragment>
              {header}
              <span className={classNames(sortClass, '-sort-right')} />
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

    // Prevent react-table from applying cell classes and styles to footers by default.
    // Override this behavior with our own footerClass and footerStyle.
    const cellClass = col.className
    const cellStyle = col.style
    col.className = undefined
    col.style = undefined
    col.getProps = (state, rowInfo, column) => {
      let props = {}
      // Ignore footers
      if (!rowInfo) return props
      // Set cell class
      let className
      if (typeof cellClass === 'function') {
        className = cellClass(rowInfo, state)
      } else if (cellClass instanceof Array) {
        className = cellClass[rowInfo.index]
      } else {
        className = cellClass
      }
      props.className = classNames(colAlignClass, className)
      // Set cell style
      if (cellStyle) {
        let style
        if (typeof cellStyle === 'function') {
          style = cellStyle(rowInfo, state)
        } else if (cellStyle instanceof Array) {
          style = cellStyle[rowInfo.index]
        } else {
          style = cellStyle
        }
        if (style) {
          props.style = style
        }
      }

      if (column.details) {
        if (column.details instanceof Array && column.details[rowInfo.index] == null) {
          // Don't expand rows without content
        } else {
          props.className = classNames('rt-expandable', props.className)
          props.onClick = (e, handleOriginal) => {
            onExpanderClick(rowInfo, column)
            if (handleOriginal) {
              handleOriginal()
            }
          }
        }
      } else if (column.pivoted && !rowInfo.aggregated) {
        // Disable expansion on child rows under pivoted columns
        props.onClick = () => {}
        props.className = classNames('rt-expand-disabled', props.className)
      }

      return props
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

// Compare function that handles numbers (NAs and Inf/-Inf) and optionally
// sorts NAs/NaNs/nulls last
export function createCompareFunction({ type, naLast } = {}) {
  return function compare(a, b, desc) {
    if (type === 'numeric') {
      a = normalizeNumber(a)
      b = normalizeNumber(b)
    } else {
      a = typeof a === 'string' ? a.toLowerCase() : a
      b = typeof b === 'string' ? b.toLowerCase() : b
    }
    if (a === b) {
      return 0
    }
    if (a == null) {
      if (naLast) return desc ? -1 : 1
      return -1
    }
    if (b == null) {
      if (naLast) return desc ? 1 : -1
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
    if (separators || percent || currency || digits != null) {
      const options = { useGrouping: separators ? true : false }
      if (percent) {
        options.style = 'percent'
      }
      if (currency) {
        options.style = 'currency'
        options.currency = currency
      } else if (digits != null) {
        options.minimumFractionDigits = digits
        options.maximumFractionDigits = digits
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
    value = value != null ? value : ''
    value = String(prefix) + value
  }
  if (suffix != null) {
    value = value != null ? value : ''
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
