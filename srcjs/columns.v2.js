import React, { Fragment } from 'react'
import { hydrate } from 'reactR'

import WidgetContainer from './WidgetContainer'
import { getAggregateFunction, isNA, normalizeNumber } from './aggregators.v2'
import { classNames, escapeRegExp, getFirstDefined, getLeafColumns } from './utils'

// Use zero-width spaces to preserve the height of empty cells
export const emptyValue = '\u200b'

// Override default subRows property
const subRowsKey = '.subRows'

export function getSubRows(row) {
  return row[subRowsKey] || []
}

// Convert column-based data to rows
// e.g. { a: [1, 2], b: ['x', 'y'] } to [{ a: 1, b: 'x' }, { a: 2, b: 'y' }]
export function columnsToRows(columns) {
  const names = Object.keys(columns)
  if (names.length === 0) {
    return []
  }
  const rows = new Array(columns[names[0]].length)
  for (let i = 0; i < rows.length; i++) {
    rows[i] = {}
    for (let name of names) {
      const value = columns[name][i]
      if (name === subRowsKey) {
        if (value instanceof Object) {
          rows[i][name] = columnsToRows(value)
        }
      } else {
        rows[i][name] = value
      }
    }
  }
  return rows
}

export function RawHTML({ html, className, ...props }) {
  return (
    <div
      // Ensure text is truncated with ellipsis when text wrapping is off
      className={classNames('rt-text-content', className)}
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  )
}

export function buildColumnDefs(columns, groups, tableProps = {}) {
  const { sortable, defaultSortDesc, showSortIcon, showSortable, filterable, resizable } =
    tableProps

  columns = columns.map(column => {
    let col = { ...column }
    col.id = col.accessor
    // Interpret column names with dots and square brackets as IDs, not paths
    if (col.accessor.includes('.') || col.accessor.includes('[') || col.accessor.includes(']')) {
      col.accessor = data => data[col.id]
    }

    if (typeof col.aggregate === 'string') {
      col.aggregate = getAggregateFunction(col.aggregate, col.type)
    }

    const sortMethod = createCompareFunction({ type: col.type, naLast: col.sortNALast })
    col.sortType = function sortType(a, b, id, desc) {
      return sortMethod(a.values[id], b.values[id], desc)
    }

    // Translate v6 props (e.g. sortable) to v7 (e.g. disableSortBy)
    col.sortable = getFirstDefined(col.sortable, sortable)
    col.disableSortBy = !col.sortable

    col.defaultSortDesc = getFirstDefined(col.defaultSortDesc, defaultSortDesc)
    col.sortDescFirst = col.defaultSortDesc

    col.filterable = getFirstDefined(col.filterable, filterable)
    col.disableFilters = !col.filterable

    if (col.searchable === false) {
      col.disableGlobalFilter = true
    }
    // Disable searching for hidden columns by default, but still allow it if requested
    if (col.show === false && col.searchable !== true) {
      col.disableGlobalFilter = true
    }

    // Default column filters
    //  - numeric columns: string starts with
    //  - other columns: case-insensitive substring
    if (col.type === 'numeric') {
      col.createMatcher = createStartsWithMatcher
    } else {
      col.createMatcher = createSubstringMatcher
    }
    col.filter = (rows, columnIds, filterValue) => {
      // For individual column filters, columnIds will always contain one column ID
      const id = columnIds[0]
      if (typeof col.filterMethod === 'function') {
        return col.filterMethod(rows, id, filterValue)
      }
      const match = col.createMatcher(filterValue)
      return rows.filter(row => {
        const value = row.values[id]
        return match(value)
      })
    }

    if (col.type === 'numeric') {
      // Right-align numbers by default
      col.align = col.align || 'right'
    } else {
      col.align = col.align || 'left'
    }

    col.vAlign = col.vAlign || 'top'
    col.headerVAlign = col.headerVAlign || 'top'

    const { width, minWidth, maxWidth } = col
    col.minWidth = getFirstDefined(width, minWidth, 100)
    col.maxWidth = getFirstDefined(width, maxWidth, Number.MAX_SAFE_INTEGER)

    // maxWidth takes priority over minWidth
    col.minWidth = Math.min(col.minWidth, col.maxWidth)

    // Start column width at min width / flex width, like in v6
    col.width = col.minWidth

    col.resizable = getFirstDefined(col.resizable, resizable)
    // Disable resizing on fixed width columns
    if (col.minWidth === col.maxWidth) {
      col.resizable = false
    }
    col.disableResizing = !col.resizable

    col.Cell = function Cell(cellInfo, state) {
      let value = cellInfo.value

      const isMissingValue = value == null || (col.type === 'numeric' && isNA(value))
      if (isMissingValue) {
        value = col.na
      }

      if (!isMissingValue && col.format && col.format.cell) {
        value = formatValue(value, col.format.cell)
      }

      if (col.cell) {
        if (typeof col.cell === 'function') {
          value = col.cell({ ...cellInfo, value }, state)
        }
        // Make sure we don't render aggregated cells for R renderers
        if (col.cell instanceof Array && !cellInfo.aggregated) {
          value = col.cell[cellInfo.index]
          if (value) {
            value = hydrate({ Fragment, WidgetContainer }, col.cell[cellInfo.index])
          }
        }
      }

      // Use zero-width spaces to preserve the height of blank cells
      if (value == null || value === '') {
        value = emptyValue
      }

      let content
      if (React.isValidElement(value)) {
        content = value
      } else if (col.html) {
        // Render inline to align with the expander
        content = <RawHTML style={{ display: 'inline' }} html={value} />
      } else {
        content = String(value)
      }

      return content
    }

    if (col.grouped) {
      col.Grouped = function Grouped(cellInfo, state) {
        let value = cellInfo.value

        const isMissingValue = value == null || (col.type === 'numeric' && isNA(value))
        if (isMissingValue) {
          value = col.na
        }

        if (!isMissingValue && col.format && col.format.cell) {
          value = formatValue(value, col.format.cell)
        }

        value = col.grouped({ ...cellInfo, value }, state)

        // Use zero-width spaces to preserve the height of blank cells
        if (value == null || value === '') {
          value = emptyValue
        }

        let content
        if (React.isValidElement(value)) {
          content = value
        } else if (col.html) {
          // Render inline to align with the expander
          content = <RawHTML style={{ display: 'inline' }} html={value} />
        } else {
          content = String(value)
        }
        return content
      }
    } else {
      // Render grouped values the same as regular cells
      col.Grouped = function Grouped(cellInfo, state) {
        const value = col.Cell(cellInfo, state)
        return (
          <React.Fragment>
            {value}
            {cellInfo.subRows && ` (${cellInfo.subRows.length})`}
          </React.Fragment>
        )
      }
    }

    col.Aggregated = function Aggregated(cellInfo, state) {
      let value = cellInfo.value
      if (value != null && col.format && col.format.aggregated) {
        value = formatValue(value, col.format.aggregated)
      }
      if (col.aggregated) {
        value = col.aggregated({ ...cellInfo, value }, state)
      }
      if (value == null) {
        value = ''
      }
      let content
      if (React.isValidElement(value)) {
        content = value
      } else if (col.html) {
        return <RawHTML html={value} />
      } else {
        content = String(value)
      }
      return content
    }

    col.Header = function Header(colInfo, stateInfo) {
      let header = col.name

      if (col.header != null) {
        if (typeof col.header === 'function') {
          header = col.header(colInfo, stateInfo)
        } else {
          header = hydrate({ Fragment, WidgetContainer }, col.header)
        }
      }

      let content
      if (React.isValidElement(header)) {
        content = header
      } else if (col.html) {
        content = <RawHTML html={header} />
      } else {
        content = header != null ? String(header) : ''
      }

      // Add sort icon to column header
      if (col.sortable && showSortIcon) {
        const sortClass = showSortable ? 'rt-sort' : ''
        // Ensure text is truncated with an ellipsis when text wrapping is off.
        // The outer container is a flex container, so we need to wrap text in a
        // block element to allow text to shrink below their minimum content size.
        content = col.html ? content : <div className="rt-text-content">{content}</div>

        if (col.align === 'right') {
          return (
            <div className="rt-sort-header">
              <span className={classNames(sortClass, 'rt-sort-left')} aria-hidden="true" />
              {content}
            </div>
          )
        } else {
          return (
            <div className="rt-sort-header">
              {content}
              <span className={classNames(sortClass, 'rt-sort-right')} aria-hidden="true" />
            </div>
          )
        }
      }
      return content
    }

    if (col.footer != null) {
      col.Footer = function Footer(colInfo, stateInfo) {
        let footer
        if (typeof col.footer === 'function') {
          footer = col.footer(colInfo, stateInfo)
        } else {
          footer = hydrate({ Fragment, WidgetContainer }, col.footer)
        }
        if (React.isValidElement(footer)) {
          return footer
        } else if (col.html) {
          return <RawHTML html={footer} />
        } else {
          return footer != null ? String(footer) : ''
        }
      }
    } else {
      // Set default content for an empty footer (otherwise defaults to &nbsp;)
      col.Footer = emptyValue
    }

    const colAlignClass = getAlignClass(col.align)
    const cellVAlignClass = getVAlignClass(col.vAlign)
    const headerVAlignClass = getVAlignClass(col.headerVAlign)

    col.headerClassName = classNames(colAlignClass, headerVAlignClass, col.headerClassName)
    col.footerClassName = classNames(colAlignClass, cellVAlignClass, col.footerClassName)

    col.getProps = (rowInfo, column, state) => {
      let props = {
        className: classNames(colAlignClass, cellVAlignClass)
      }
      if (col.className) {
        let className
        if (typeof col.className === 'function') {
          className = col.className(rowInfo, column, state)
        } else if (col.className instanceof Array) {
          className = col.className[rowInfo.index]
        } else {
          className = col.className
        }
        props.className = classNames(props.className, className)
      }
      if (col.style) {
        let style
        if (typeof col.style === 'function') {
          style = col.style(rowInfo, column, state)
        } else if (col.style instanceof Array) {
          style = col.style[rowInfo.index]
        } else {
          style = col.style
        }
        props.style = style
      }
      return props
    }

    return col
  })

  if (groups) {
    columns = addColumnGroups(columns, groups)
    columns.forEach((col, i) => {
      // The column group ID is arbitrary and just has to be unique
      col.id = `group_${i}`
      if (col.name != null || col.header != null) {
        col.Header = function Header(colInfo, state) {
          let header = col.name
          if (col.header) {
            if (typeof col.header === 'function') {
              header = col.header(colInfo, state)
            } else {
              header = hydrate({ Fragment, WidgetContainer }, col.header)
            }
          }
          if (React.isValidElement(header)) {
            return header
          } else if (col.html) {
            return <RawHTML html={header} />
          } else {
            return header != null ? String(header) : ''
          }
        }
      } else {
        col.Header = emptyValue
      }

      // Enable resizing if a single leaf column can be resized
      const leafColumns = getLeafColumns(col)
      if (leafColumns.every(col => col.disableResizing)) {
        col.disableResizing = true
      }

      col.align = col.align || 'center'
      col.headerVAlign = col.headerVAlign || 'top'

      const colAlignClass = getAlignClass(col.align)
      const headerVAlignClass = getVAlignClass(col.headerVAlign)

      col.headerClassName = classNames(colAlignClass, headerVAlignClass, col.headerClassName)
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

  // Create column groups for ungrouped columns, combining adjacent columns
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
        lastGroup = { columns: [], isUngrouped: true }
        newCols.push(lastGroup)
      }
      lastGroup.columns.push(col)
    }
  })
  columns = newCols

  return columns
}

// Compare function that handles numbers (NAs and Inf/-Inf) and optionally
// sorts missing values (NA, NaN, NULL) last.
export function createCompareFunction({ type, naLast } = {}) {
  return function compare(a, b, desc) {
    if (type === 'numeric') {
      a = normalizeNumber(a)
      b = normalizeNumber(b)
      a = Number.isNaN(a) ? null : a
      b = Number.isNaN(b) ? null : b
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
    if (separators || percent || currency || digits != null || locales) {
      // While Number.toLocaleString supports up to 20 fraction digits,
      // IE11 only supports up to 18 digits when formatting as percentages.
      const maximumFractionDigits = 18
      const options = { useGrouping: separators ? true : false }
      if (percent) {
        options.style = 'percent'
      }
      if (currency) {
        options.style = 'currency'
        options.currency = currency
      } else if (digits != null) {
        options.minimumFractionDigits = Math.min(digits, maximumFractionDigits)
        options.maximumFractionDigits = Math.min(digits, maximumFractionDigits)
      } else {
        options.maximumFractionDigits = maximumFractionDigits
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
      // Format YYYY-MM-DD dates in local time, not UTC.
      // Ignore ISO 8601 dates otherwise, i.e., YYYY-MM-DDTHH:MM:SS[Z]
      // http://blog.dygraphs.com/2012/03/javascript-and-dates-what-mess.html
      if (value.includes('-') && !value.includes('T') && !value.includes('Z')) {
        value = value.replace(/-/g, '/')
      }
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

export function createStartsWithMatcher(str) {
  const regex = new RegExp('^' + escapeRegExp(str), 'i')
  return value => {
    // Ignore columns without data (don't match on "undefined"). This shouldn't
    // happen unless a data-less column (e.g., selection) is manually filtered via API.
    if (value === undefined) {
      return false
    }
    return regex.test(value)
  }
}

export function createSubstringMatcher(str) {
  const regex = new RegExp(escapeRegExp(str), 'i')
  return value => {
    // Ignore columns without data (don't match on "undefined"). This shouldn't
    // happen unless a data-less column (e.g., selection) is manually filtered via API.
    if (value === undefined) {
      return false
    }
    return regex.test(value)
  }
}

function getAlignClass(align) {
  return `rt-align-${align}`
}

function getVAlignClass(vAlign) {
  if (vAlign === 'top') {
    return ''
  }
  return `rt-valign-${vAlign}`
}
