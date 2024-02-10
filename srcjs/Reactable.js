import React, { Fragment } from 'react'
import {
  safeUseLayoutEffect,
  useExpanded,
  useFilters,
  useGetLatest,
  useGlobalFilter,
  useMountedLayoutEffect,
  useSortBy,
  useTable
} from 'react-table'
import PropTypes from 'prop-types'
import { hydrate } from 'reactR'

import Pagination from './Pagination'
import WidgetContainer from './WidgetContainer'
import useFlexLayout from './useFlexLayout'
import useStickyColumns from './useStickyColumns'
import useGroupBy from './useGroupBy'
import useResizeColumns from './useResizeColumns'
import useRowSelect from './useRowSelect'
import usePagination from './usePagination'
import useMeta from './useMeta'
import {
  buildColumnDefs,
  emptyValue,
  getSubRows,
  materializedRowsToData,
  normalizeColumnData,
  rowExpandedKey,
  rowSelectedKey,
  rowStateKey,
  RawHTML
} from './columns'
import { defaultLanguage, renderTemplate } from './language'
import { createTheme, css } from './theme'
import {
  classNames,
  convertRowsToV6,
  getLeafColumns,
  rowsToCSV,
  downloadCSV,
  useAsyncDebounce
} from './utils'

import './react-table.css'
import './reactable.css'

const tableInstances = {}
export function getInstance(tableId) {
  if (!tableId) {
    throw new Error('A reactable table ID must be provided')
  }
  const getInstance = tableInstances[tableId]
  if (!getInstance) {
    throw new Error(`reactable instance '${tableId}' not found`)
  }
  return getInstance()
}

export function getState(tableId) {
  return getInstance(tableId).state
}

export function setFilter(tableId, columnId, value) {
  getInstance(tableId).setFilter(columnId, value)
}

export function setAllFilters(tableId, value) {
  getInstance(tableId).setAllFilters(value)
}

export function setSearch(tableId, value) {
  getInstance(tableId).setGlobalFilter(value)
}

export function toggleGroupBy(tableId, columnId, isGrouped) {
  getInstance(tableId).toggleGroupBy(columnId, isGrouped)
}

export function setGroupBy(tableId, columnIds) {
  getInstance(tableId).setGroupBy(columnIds)
}

export function toggleAllRowsExpanded(tableId, isExpanded) {
  getInstance(tableId).toggleAllRowsExpanded(isExpanded)
}

export function downloadDataCSV(tableId, filename = 'data.csv', options = {}) {
  getInstance(tableId).downloadDataCSV(filename, options)
}

export function getDataCSV(tableId, options = {}) {
  return getInstance(tableId).getDataCSV(options)
}

export function setMeta(tableId, meta) {
  getInstance(tableId).setMeta(meta)
}

export function toggleHideColumn(tableId, columnId, isHidden) {
  getInstance(tableId).toggleHideColumn(columnId, isHidden)
}

export function setHiddenColumns(tableId, columns) {
  getInstance(tableId).setHiddenColumns(columns)
}

export function setData(tableId, data, options) {
  getInstance(tableId).setData(data, options)
}

export function onStateChange(tableId, listenerFn) {
  return getInstance(tableId).onStateChange(listenerFn)
}

export function gotoPage(tableId, pageIndex) {
  getInstance(tableId).gotoPage(pageIndex)
}

export function setPageSize(tableId, pageSize) {
  getInstance(tableId).setPageSize(pageSize)
}

export default function Reactable({
  data,
  columns,
  columnGroups,
  sortable,
  defaultSortDesc,
  showSortIcon,
  showSortable,
  filterable,
  resizable,
  theme,
  language,
  dataKey,
  ...rest
}) {
  data = normalizeColumnData(data, columns)
  columns = buildColumnDefs(columns, columnGroups, {
    sortable,
    defaultSortDesc,
    showSortIcon,
    showSortable,
    filterable,
    resizable
  })

  theme = createTheme(theme) || {}

  language = { ...defaultLanguage, ...language }
  for (let key in language) {
    language[key] = language[key] || null
  }

  return (
    <Table
      data={data}
      columns={columns}
      theme={theme}
      language={language}
      // Reset all state when the data changes. By default, most of the table state
      // persists when the data changes (sorted, filtered, grouped state, etc.).
      key={dataKey}
      {...rest}
    />
  )
}

// Objects and arrays must be memoized to prevent unnecessary recalculations of data
function useMemoizedObject(obj) {
  const objStr = JSON.stringify(obj)
  return React.useMemo(() => {
    return obj
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objStr])
}

export function ReactableData({
  data,
  columns,
  columnGroups,
  sortable,
  defaultSortDesc,
  showSortIcon,
  showSortable,
  filterable,
  resizable,
  // Controlled state
  sortBy,
  filters,
  searchValue,
  groupBy,
  expanded,
  selectedRowIds,
  ...rest
}) {
  data = React.useMemo(
    () => normalizeColumnData(data, columns),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  columns = React.useMemo(
    () =>
      buildColumnDefs(columns, columnGroups, {
        sortable,
        defaultSortDesc,
        showSortIcon,
        showSortable,
        filterable,
        resizable
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Objects and arrays must be memoized to prevent unnecessary recalculations of data
  sortBy = useMemoizedObject(sortBy || [])
  filters = useMemoizedObject(filters || [])
  groupBy = useMemoizedObject(groupBy || [])
  expanded = useMemoizedObject(expanded || {})
  selectedRowIds = useMemoizedObject(selectedRowIds || {})

  return (
    <TableData
      data={data}
      columns={columns}
      sortBy={sortBy}
      filters={filters}
      searchValue={searchValue}
      groupBy={groupBy}
      expanded={expanded}
      selectedRowIds={selectedRowIds}
      {...rest}
    />
  )
}

const RootComponent = React.forwardRef(function RootComponent({ className, ...rest }, ref) {
  // Keep ReactTable class for legacy compatibility (deprecated in v0.3.0)
  return <div ref={ref} className={classNames('Reactable', 'ReactTable', className)} {...rest} />
})

const TableComponent = React.forwardRef(function TableComponent({ className, ...rest }, ref) {
  return <div ref={ref} className={classNames('rt-table', className)} role="table" {...rest} />
})

function TheadComponent({ className, ...rest }) {
  return <div className={classNames('rt-thead', className)} role="rowgroup" {...rest} />
}

function TbodyComponent({ className, ...rest }) {
  return <div className={classNames('rt-tbody', className)} role="rowgroup" {...rest} />
}

function TfootComponent({ className, ...rest }) {
  return <div className={classNames('rt-tfoot', className)} role="rowgroup" {...rest} />
}

function TrGroupComponent({ className, ...rest }) {
  return <div className={classNames('rt-tr-group', className)} {...rest} />
}

function TrComponent({ className, ...rest }) {
  return <div className={classNames('rt-tr', className)} role="row" {...rest} />
}

const ThComponent = React.forwardRef(function ThComponent(props, ref) {
  let {
    canSort,
    sortDescFirst,
    isSorted,
    isSortedDesc,
    toggleSortBy,
    canResize,
    isResizing,
    className,
    innerClassName,
    children,
    ...thProps
  } = props

  const [skipNextSort, setSkipNextSort] = React.useState(false)

  if (canSort) {
    const currentSortOrder = isSorted ? (isSortedDesc ? 'descending' : 'ascending') : 'none'
    const defaultSortOrder = sortDescFirst ? 'descending' : 'ascending'
    const toggleSort = isMultiSort => {
      let sortDesc = isSorted ? !isSortedDesc : sortDescFirst
      // Allow sort clearing if multi-sorting
      if (isMultiSort) {
        sortDesc = null
      }
      toggleSortBy && toggleSortBy(sortDesc, isMultiSort)
    }
    thProps = {
      ...thProps,
      'aria-sort': currentSortOrder,
      tabIndex: '0',
      onClick: e => {
        if (!skipNextSort) {
          toggleSort(e.shiftKey)
        }
      },
      onKeyPress: e => {
        const keyCode = e.which || e.keyCode
        if (keyCode === 13 || keyCode === 32) {
          toggleSort(e.shiftKey)
        }
      },
      onMouseUp: () => {
        // Prevent resizer clicks from toggling sort (since resizer is in the header)
        if (isResizing) {
          setSkipNextSort(true)
        } else {
          setSkipNextSort(false)
        }
      },
      onMouseDown: e => {
        // Prevent text selection on double clicks, only when sorting
        if (e.detail > 1 || e.shiftKey) {
          e.preventDefault()
        }
      },
      // Focus indicator for keyboard navigation
      'data-sort-hint': isSorted ? null : defaultSortOrder
    }
  }

  // The inner wrapper is a block container that prevents the outer flex container from
  // breaking text overflow and ellipsis truncation. Text nodes can't shrink below their
  // minimum content size.
  return (
    <div
      className={classNames('rt-th', canResize && 'rt-th-resizable', className)}
      role="columnheader"
      ref={ref}
      {...thProps}
    >
      <div className={classNames('rt-th-inner', innerClassName)}>{children}</div>
    </div>
  )
})

ThComponent.propTypes = {
  defaultSortOrder: PropTypes.string,
  canSort: PropTypes.bool,
  sortDescFirst: PropTypes.bool,
  isSorted: PropTypes.bool,
  isSortedDesc: PropTypes.bool,
  toggleSortBy: PropTypes.func,
  canResize: PropTypes.bool,
  isResizing: PropTypes.bool,
  className: PropTypes.string,
  innerClassName: PropTypes.string,
  children: PropTypes.node
}

function TdComponent({ className, innerClassName, children, ...rest }) {
  // The inner wrapper is a block container that prevents the outer flex container from
  // breaking text overflow and ellipsis truncation. Text nodes can't shrink below their
  // minimum content size.
  return (
    <div className={classNames('rt-td', className)} role="cell" {...rest}>
      <div className={classNames('rt-td-inner', innerClassName)}>{children}</div>
    </div>
  )
}

// Get class names for a cell theme. Padding is set on the inner wrapper to prevent
// the inner wrapper (with overflow hidden) from clipping borders, box shadows, etc.
function getCellTheme(style) {
  if (!style) {
    return {}
  }
  if (style.padding != null) {
    const { padding, ...cellStyle } = style
    return {
      className: css(cellStyle),
      innerClassName: css({ padding })
    }
  }
  return { className: css(style) }
}

function ResizerComponent({ onMouseDown, onTouchStart, className, ...rest }) {
  return (
    <div
      className={classNames('rt-resizer', className)}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      aria-hidden={true}
      {...rest}
    />
  )
}

ResizerComponent.propTypes = {
  onMouseDown: PropTypes.func,
  onTouchStart: PropTypes.func,
  className: PropTypes.string
}

class RowDetails extends React.Component {
  componentDidMount() {
    if (window.Shiny && window.Shiny.bindAll) {
      window.Shiny.bindAll(this.el)
    }
  }

  componentWillUnmount() {
    if (window.Shiny && window.Shiny.unbindAll) {
      window.Shiny.unbindAll(this.el)
    }
  }

  render() {
    const { children, html } = this.props
    let props = { ref: el => (this.el = el) }
    if (html) {
      props = { ...props, dangerouslySetInnerHTML: { __html: html } }
    } else {
      props = { ...props, children }
    }
    return <div className="rt-tr-details" {...props} />
  }
}

RowDetails.propTypes = {
  children: PropTypes.node,
  html: PropTypes.string
}

function ExpanderComponent({ isExpanded, className, 'aria-label': ariaLabel }) {
  return (
    <button
      className="rt-expander-button"
      aria-label={ariaLabel}
      aria-expanded={isExpanded ? 'true' : 'false'}
    >
      <span
        className={classNames('rt-expander', isExpanded && 'rt-expander-open', className)}
        tabIndex="-1"
        aria-hidden="true"
      >
        &#8203;
      </span>
    </button>
  )
}

ExpanderComponent.propTypes = {
  isExpanded: PropTypes.bool,
  className: PropTypes.string,
  'aria-label': PropTypes.string
}

function FilterComponent({
  filterValue,
  setFilter,
  className,
  placeholder,
  'aria-label': ariaLabel
}) {
  return (
    <input
      type="text"
      className={classNames('rt-filter', className)}
      value={filterValue || ''}
      // Filter value must be undefined (not empty string) to clear the filter
      onChange={e => setFilter(e.target.value || undefined)}
      placeholder={placeholder}
      aria-label={ariaLabel}
    />
  )
}

FilterComponent.propTypes = {
  filterValue: PropTypes.string,
  setFilter: PropTypes.func.isRequired,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  'aria-label': PropTypes.string
}

function SearchComponent({
  searchValue,
  setSearch,
  className,
  placeholder,
  'aria-label': ariaLabel
}) {
  return (
    <input
      type="text"
      value={searchValue || ''}
      // Search value must be undefined (not empty string) to clear the search
      onChange={e => setSearch(e.target.value || undefined)}
      className={classNames('rt-search', className)}
      placeholder={placeholder}
      aria-label={ariaLabel}
    />
  )
}

SearchComponent.propTypes = {
  searchValue: PropTypes.string,
  setSearch: PropTypes.func.isRequired,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  'aria-label': PropTypes.string
}

function NoDataComponent({ className, ...rest }) {
  return <div className={classNames('rt-no-data', className)} aria-live="assertive" {...rest} />
}

function SelectInputComponent({ type, checked, onChange, 'aria-label': ariaLabel }) {
  // Use zero-width space character to properly align checkboxes with first
  // line of text in other cells, even if the text spans multiple lines.
  return (
    <div className="rt-select">
      <input
        type={type}
        checked={checked}
        onChange={onChange}
        className="rt-select-input"
        aria-label={ariaLabel}
      />
      &#8203;
    </div>
  )
}

SelectInputComponent.propTypes = {
  type: PropTypes.oneOf(['checkbox', 'radio']).isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  'aria-label': PropTypes.string
}

function TableData({
  data,
  columns,
  groupBy,
  searchMethod,
  pagination,
  paginateSubRows,
  selection,
  crosstalkGroup,
  crosstalkId,
  setResolvedData,
  // Controlled state
  pageSize,
  pageIndex,
  sortBy,
  filters,
  searchValue,
  expanded,
  selectedRowIds
}) {
  const dataColumns = React.useMemo(
    () => columns.reduce((cols, col) => cols.concat(getLeafColumns(col)), []),
    [columns]
  )

  // Must be memoized to prevent re-filtering on every render
  const globalFilter = React.useMemo(() => {
    if (searchMethod) {
      return searchMethod
    }
    return function globalFilter(rows, columnIds, searchValue) {
      const matchers = dataColumns.reduce((obj, col) => {
        obj[col.id] = col.createMatcher(searchValue)
        return obj
      }, {})

      rows = rows.filter(row => {
        for (const id of columnIds) {
          const value = row.values[id]
          if (matchers[id](value)) {
            return true
          }
        }
      })
      return rows
    }
  }, [dataColumns, searchMethod])

  const useRowSelectColumn = function useRowSelectColumn(hooks) {
    if (selection) {
      hooks.visibleColumns.push(columns => {
        const selectionCol = {
          // Apply defaults from existing selection column
          ...columns.find(col => col.selectable),
          selectable: true,
          // Disable sorting, filtering, and searching for selection columns
          disableSortBy: true,
          filterable: false,
          disableFilters: true,
          disableGlobalFilter: true
        }
        // Make selection column the first column, even before grouped columns
        return [selectionCol, ...columns.filter(col => !col.selectable)]
      })
    }
  }

  const useCrosstalkColumn = function useCrosstalkColumn(hooks) {
    if (crosstalkGroup) {
      hooks.visibleColumns.push(columns => {
        const ctCol = {
          id: crosstalkId,
          filter: (rows, id, value) => {
            if (!value) {
              return rows
            }
            return rows.filter(row => {
              if (value.includes(row.index)) {
                return true
              }
            })
          },
          disableGlobalFilter: true
        }
        return columns.concat(ctCol)
      })

      hooks.stateReducers.push(state => {
        if (!state.hiddenColumns.includes(crosstalkId)) {
          return {
            ...state,
            hiddenColumns: state.hiddenColumns.concat(crosstalkId)
          }
        }
        return state
      })
    }
  }

  const instance = useTable(
    {
      columns,
      data,
      useControlledState: state => {
        return React.useMemo(
          () => ({
            ...state,
            pageIndex,
            pageSize,
            sortBy,
            filters,
            globalFilter: searchValue,
            groupBy,
            expanded,
            selectedRowIds
          }),
          // These dependencies are required for proper table updates
          // eslint-disable-next-line react-hooks/exhaustive-deps
          [
            state,
            pageIndex,
            pageSize,
            sortBy,
            filters,
            searchValue,
            groupBy,
            expanded,
            selectedRowIds
          ]
        )
      },
      globalFilter,
      paginateExpandedRows: paginateSubRows ? true : false,
      disablePagination: !pagination,
      getSubRows,
      // Disable manual row expansion
      manualExpandedKey: null,
      // Maintain grouped state when the data changes
      autoResetGroupBy: false,
      // Maintain sorted state when the data changes
      autoResetSortBy: false,
      // Maintain expanded state when groupBy, sortBy, defaultPageSize change.
      // Expanded state is still reset when the data changes via dataKey or updateReactable.
      autoResetExpanded: false,
      // Maintain filtered state when the data changes
      autoResetFilters: false,
      autoResetGlobalFilter: false,
      // Maintain selected state when groupBy, sortBy, defaultPageSize change.
      // Selected state is still reset when the data changes via dataKey or updateReactable.
      autoResetSelectedRows: false,
      // Maintain resized state when the data changes
      autoResetResize: false,
      // Reset current page when the data changes (e.g., sorting, filtering, searching)
      autoResetPage: true
    },
    useResizeColumns,
    useFlexLayout,
    useStickyColumns,
    useFilters,
    useGlobalFilter,
    useGroupBy,
    useSortBy,
    useExpanded,
    usePagination,
    useRowSelect,
    useRowSelectColumn,
    useCrosstalkColumn
  )

  // Track the max number of rows for auto-shown pagination. Unfortunately, the max
  // number of rows can't be determined up front in a grouped and filtered table
  // because grouping happens after filtering (and swapping these hooks would
  // disable dynamic aggregation). Instead, we track the max number of rows
  // per dataset, so at least the pagination doesn't disappear upon filtering.
  const maxRowCount = React.useRef(
    paginateSubRows ? instance.flatRows.length : instance.rows.length
  )

  React.useEffect(() => {
    maxRowCount.current = 0
  }, [data])

  React.useEffect(() => {
    const rowCount = paginateSubRows ? instance.flatRows.length : instance.rows.length
    if (rowCount > maxRowCount.current) {
      maxRowCount.current = rowCount
    }
  }, [paginateSubRows, instance.flatRows, instance.rows])

  if (setResolvedData) {
    setResolvedData({
      data: materializedRowsToData(instance.page, paginateSubRows),
      rowCount: instance.rows.length,
      maxRowCount: maxRowCount.current
    })
  }

  return null
}

function Table({
  data: originalData,
  columns,
  groupBy,
  searchable,
  searchMethod,
  defaultSorted,
  pagination,
  paginationType,
  showPagination,
  showPageSizeOptions,
  showPageInfo,
  defaultPageSize,
  pageSizeOptions,
  minRows,
  paginateSubRows,
  defaultExpanded,
  selection,
  defaultSelected,
  selectionId,
  onClick,
  outlined,
  bordered,
  borderless,
  compact,
  nowrap,
  striped,
  highlight,
  className,
  style,
  rowClassName,
  rowStyle,
  inline,
  width,
  height,
  theme,
  language,
  meta: initialMeta,
  crosstalkKey,
  crosstalkGroup,
  crosstalkId,
  elementId,
  nested,
  dataURL,
  serverRowCount: initialServerRowCount,
  serverMaxRowCount: initialServerMaxRowCount
}) {
  const [newData, setNewData] = React.useState(null)
  const data = React.useMemo(() => {
    return newData ? newData : originalData
  }, [newData, originalData])

  const useServerData = dataURL != null
  const [serverRowCount, setServerRowCount] = React.useState(initialServerRowCount)
  const [serverMaxRowCount, setServerMaxRowCount] = React.useState(initialServerMaxRowCount)

  const dataColumns = React.useMemo(() => {
    return columns.reduce((cols, col) => cols.concat(getLeafColumns(col)), [])
  }, [columns])

  // Must be memoized to prevent re-filtering on every render
  const globalFilter = React.useMemo(() => {
    if (searchMethod) {
      return searchMethod
    }
    return function globalFilter(rows, columnIds, searchValue) {
      const matchers = dataColumns.reduce((obj, col) => {
        obj[col.id] = col.createMatcher(searchValue)
        return obj
      }, {})

      rows = rows.filter(row => {
        for (const id of columnIds) {
          const value = row.values[id]
          if (matchers[id](value)) {
            return true
          }
        }
      })
      return rows
    }
  }, [dataColumns, searchMethod])

  const useRowSelectColumn = function useRowSelectColumn(hooks) {
    if (selection) {
      hooks.visibleColumns.push(columns => {
        const selectionCol = {
          // Apply defaults from existing selection column
          ...columns.find(col => col.selectable),
          selectable: true,
          // Disable sorting, filtering, and searching for selection columns
          disableSortBy: true,
          filterable: false,
          disableFilters: true,
          disableGlobalFilter: true
        }
        // Make selection column the first column, even before grouped columns
        return [selectionCol, ...columns.filter(col => !col.selectable)]
      })
    }
  }

  const useCrosstalkColumn = function useCrosstalkColumn(hooks) {
    if (crosstalkGroup) {
      hooks.visibleColumns.push(columns => {
        const ctCol = {
          id: crosstalkId,
          filter: (rows, id, value) => {
            if (!value) {
              return rows
            }
            return rows.filter(row => {
              if (value.includes(row.index)) {
                return true
              }
            })
          },
          disableGlobalFilter: true
        }
        return columns.concat(ctCol)
      })

      hooks.stateReducers.push(state => {
        if (!state.hiddenColumns.includes(crosstalkId)) {
          return {
            ...state,
            hiddenColumns: state.hiddenColumns.concat(crosstalkId)
          }
        }
        return state
      })
    }
  }

  const [meta, setMeta] = useMeta(initialMeta)

  function useServerSideRows(hooks) {
    hooks.useInstance.push(instance => {
      const { rows, manualPagination, rowsById } = instance

      if (!manualPagination) {
        return
      }

      // Set proper row indexes and IDs
      const setRowProps = rows => {
        rows.forEach(row => {
          const rowState = row.original[rowStateKey]
          // Fall back for backends that don't implement row state
          if (!rowState) {
            return
          }
          row.index = rowState.index
          // Not used for now because we need ability to select/expand all first
          if (rowState.selected) {
            row.original[rowSelectedKey] = rowState.selected
          }
          // Not used for now because we need ability to select/expand all first
          if (rowState.expanded) {
            row.original[rowExpandedKey] = rowState.expanded
          }
          if (rowState.grouped) {
            row.isGrouped = true
          }
          // Rebuild sub rows
          if (rowState.parentId != null) {
            rowsById[rowState.parentId].subRows.push(row)
            // Set parentId on row to tell useGroupBy that this is a nested row
            // TODO change this so useGroupBy gets a properly nested row structure, not flat rows
            row.parentId = rowState.parentId
          }
          // Set row props on sub rows. Skip this when sub rows are paginated, since sub rows
          // exist in both row.subRows and the flat list of rows.
          if (!paginateSubRows) {
            setRowProps(row.subRows, row)
          }
        })

        // Add placeholder subRows for aggregated row counts
        if (paginateSubRows) {
          rows.forEach(row => {
            const rowState = row.original[rowStateKey]
            row.subRows.length = rowState.subRowCount
          })
        }
      }
      setRowProps(rows)
    })
  }

  const getRowId = React.useMemo(() => {
    const defaultGetRowId = (row, index, parent) => {
      return `${parent ? [parent.id, index].join('.') : index}`
    }
    if (!useServerData) {
      return defaultGetRowId
    }
    return (row, index, parent) => {
      if (row[rowStateKey]) {
        return row[rowStateKey].id
      }
      // Fall back for backends that don't implement row state
      return defaultGetRowId(row, index, parent)
    }
  }, [useServerData])

  const { state, ...instance } = useTable(
    {
      columns,
      data,
      initialState: {
        hiddenColumns: dataColumns.filter(col => col.show === false).map(col => col.id),
        groupBy: groupBy || [],
        sortBy: defaultSorted || [],
        pageSize: defaultPageSize,
        selectedRowIds: defaultSelected
          ? defaultSelected.reduce((obj, index) => ({ ...obj, [index]: true }), {})
          : {}
      },
      globalFilter,
      paginateExpandedRows: paginateSubRows ? true : false,
      disablePagination: !pagination,
      getSubRows,
      getRowId,
      // Maintain grouped state when the data changes
      autoResetGroupBy: false,
      // Maintain sorted state when the data changes
      autoResetSortBy: false,
      // Maintain expanded state when groupBy, sortBy, defaultPageSize change.
      // Expanded state is still reset when the data changes via dataKey or updateReactable.
      autoResetExpanded: false,
      // Maintain filtered state when the data changes
      autoResetFilters: false,
      autoResetGlobalFilter: false,
      // Maintain selected state when groupBy, sortBy, defaultPageSize change.
      // Selected state is still reset when the data changes via dataKey or updateReactable.
      autoResetSelectedRows: false,
      // Maintain resized state when the data changes
      autoResetResize: false,
      // Reset current page when the data changes (e.g., sorting, filtering, searching)
      autoResetPage: true,
      manualPagination: useServerData,
      manualSortBy: useServerData,
      manualGlobalFilter: useServerData,
      manualFilters: useServerData,
      manualGroupBy: useServerData,
      // TODO for when server-side row selection is implemented - need the ability to select all first
      // manualRowSelectedKey: useServerData ? rowSelectedKey : null,
      // TODO for when server-side row expansion is implemented
      // Disable manual row expansion
      manualExpandedKey: null,
      // Prevent duplicate sub rows when sub rows are paginated server-side
      expandSubRows: !(useServerData && paginateSubRows),
      rowCount: useServerData ? serverRowCount : null
    },
    useServerSideRows,
    useResizeColumns,
    useFlexLayout,
    useStickyColumns,
    useFilters,
    useGlobalFilter,
    useGroupBy,
    useSortBy,
    useExpanded,
    usePagination,
    useRowSelect,
    useRowSelectColumn,
    useCrosstalkColumn
  )

  // Server-side data
  const skipInitialFetch = React.useRef(initialServerRowCount != null)
  React.useEffect(() => {
    if (!useServerData) {
      return
    }
    // Skip initial data fetch if the first page was provided
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false
      return
    }
    const url = new window.URL(dataURL, window.location)
    const params = {
      pageIndex: state.pageIndex,
      pageSize: state.pageSize,
      sortBy: state.sortBy,
      filters: state.filters,
      searchValue: state.globalFilter,
      groupBy: state.groupBy,
      expanded: state.expanded,
      selectedRowIds: state.selectedRowIds
    }
    window
      .fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })
      .then(res => res.json())
      .then(body => {
        const data = normalizeColumnData(body.data, dataColumns)
        const { rowCount, maxRowCount } = body
        setNewData(data)
        setServerRowCount(rowCount)
        setServerMaxRowCount(maxRowCount)
      })
      .catch(err => {
        console.error(err)
      })
  }, [
    useServerData,
    dataURL,
    state.pageIndex,
    state.pageSize,
    state.sortBy,
    state.filters,
    state.globalFilter,
    state.groupBy,
    state.expanded,
    state.selectedRowIds,
    dataColumns
  ])

  // Update table when default values change (preserves behavior from v6)
  useMountedLayoutEffect(() => {
    const setSortBy = instance.setSortBy
    setSortBy(defaultSorted || [])
  }, [instance.setSortBy, defaultSorted])

  useMountedLayoutEffect(() => {
    const setGroupBy = instance.setGroupBy
    setGroupBy(groupBy || [])
  }, [instance.setGroupBy, groupBy])

  useMountedLayoutEffect(() => {
    const setPageSize = instance.setPageSize
    setPageSize(defaultPageSize)
  }, [instance.setPageSize, defaultPageSize])

  useMountedLayoutEffect(() => {
    const setRowsSelected = instance.setRowsSelected
    setRowsSelected((defaultSelected || []).map(index => String(index)))
  }, [instance.setRowsSelected, defaultSelected])

  const rowsById = instance.preFilteredRowsById || instance.rowsById
  const selectedRowIndexes = React.useMemo(() => {
    return Object.keys(state.selectedRowIds).reduce((indexes, id) => {
      const row = rowsById[id]
      if (row) {
        indexes.push(row.index)
      }
      return indexes
    }, [])
  }, [state.selectedRowIds, rowsById])

  // Update Shiny on selected row changes (deprecated in v0.2.0)
  React.useEffect(() => {
    if (!selection) {
      return
    }
    // Convert to R's 1-based indices
    const selectedIndexes = selectedRowIndexes.map(index => index + 1)

    if (selectionId && window.Shiny) {
      window.Shiny.onInputChange(selectionId, selectedIndexes)
    }
  }, [selectedRowIndexes, selection, selectionId])

  // Reset searched state when table is no longer searchable
  const searchableRef = React.useRef(searchable)
  safeUseLayoutEffect(() => {
    if (searchableRef.current && !searchable) {
      const setGlobalFilter = instance.setGlobalFilter
      setGlobalFilter(undefined)
    }
    searchableRef.current = searchable
  }, [searchable, instance.setGlobalFilter])

  const makeSearch = () => {
    if (!searchable) {
      return null
    }
    return (
      <SearchComponent
        searchValue={state.globalFilter}
        setSearch={instance.setGlobalFilter}
        className={css(theme.searchInputStyle)}
        placeholder={language.searchPlaceholder}
        aria-label={language.searchLabel}
      />
    )
  }

  const rowData = convertRowsToV6(instance.rows)
  const stateInfo = React.useMemo(() => {
    return {
      ...state,
      searchValue: state.globalFilter,
      meta,
      hiddenColumns: state.hiddenColumns.filter(id => id !== crosstalkId),
      // For v6 compatibility
      sorted: state.sortBy,
      pageRows: convertRowsToV6(instance.page),
      sortedData: rowData,
      data: data,
      page: state.pageIndex,
      pageSize: state.pageSize,
      pages: instance.pageCount,
      selected: selectedRowIndexes
    }
  }, [
    state,
    meta,
    crosstalkId,
    instance.page,
    rowData,
    data,
    instance.pageCount,
    selectedRowIndexes
  ])

  const makeThead = () => {
    const theadProps = instance.getTheadProps()
    return (
      <TheadComponent {...theadProps}>
        {makeHeaders()}
        {makeFilters()}
      </TheadComponent>
    )
  }

  // Get actual width of the column for resizing
  const headerRefs = React.useRef({})
  const handleHeader = column => {
    column.getDOMWidth = () => {
      return headerRefs.current[column.id].getBoundingClientRect().width
    }
    if (column.headers && column.headers.length) {
      column.headers.forEach(col => handleHeader(col))
    }
  }
  instance.headers.forEach(handleHeader)

  const makeHeaders = () => {
    return instance.headerGroups.map((headerGroup, i) => {
      const isGroupHeader = i < instance.headerGroups.length - 1
      const { key: headerGroupKey, ...headerGroupProps } = headerGroup.getHeaderGroupProps({
        className: isGroupHeader ? 'rt-tr-group-header' : 'rt-tr-header'
      })
      return (
        <TrComponent key={headerGroupKey} {...headerGroupProps}>
          {headerGroup.headers.map(column => {
            column = {
              ...column,
              column, // Deprecated in v0.3.0
              data: rowData // Deprecated in v0.3.0
            }
            let header =
              typeof column.Header === 'function'
                ? column.Header(column, stateInfo)
                : column.render('Header')

            let headerProps = {
              // colspan doesn't apply to ARIA tables, but react-table adds it. Remove it.
              colSpan: null,
              ref: el => (headerRefs.current[column.id] = el)
            }
            if (isGroupHeader) {
              const { className: themeClass, innerClassName } = getCellTheme(theme.groupHeaderStyle)
              headerProps = {
                ...headerProps,
                'aria-colspan': column.totalVisibleHeaderCount,
                className: classNames(
                  !column.isUngrouped ? 'rt-th-group' : 'rt-th-group-none',
                  column.headerClassName,
                  themeClass
                ),
                innerClassName,
                style: column.headerStyle,
                canResize: column.canResize
              }
            } else {
              const { className: themeClass, innerClassName } = getCellTheme(theme.headerStyle)
              headerProps = {
                ...headerProps,
                // Assign cell role to selectable column headers to prevent input labels
                // from being read as column names ("select all rows column").
                role: column.selectable ? 'cell' : 'columnheader',
                className: classNames(column.headerClassName, themeClass),
                innerClassName,
                style: column.headerStyle,
                canResize: column.canResize,
                isResizing: column.isResizing
              }

              if (column.canSort) {
                headerProps = {
                  ...headerProps,
                  'aria-label': renderTemplate(language.sortLabel, { name: column.name }),
                  canSort: column.canSort,
                  sortDescFirst: column.sortDescFirst,
                  isSorted: column.isSorted,
                  isSortedDesc: column.isSortedDesc,
                  // Use toggleSortBy instead of getSortByToggleProps() for more control over sorting
                  toggleSortBy: column.toggleSortBy
                }
              }
            }

            let resizer
            if (column.canResize) {
              const { onMouseDown, onTouchStart } = column.getResizerProps()
              resizer = (
                <ResizerComponent
                  onMouseDown={e => {
                    onMouseDown(e)
                    // Prevent resizer from highlighting text
                    e.preventDefault()
                  }}
                  onTouchStart={onTouchStart}
                  onClick={e => {
                    // Prevent resizer from toggling sorting
                    e.stopPropagation()
                  }}
                />
              )
            }

            if (column.selectable && selection === 'multiple' && instance.rows.length > 0) {
              const toggleAllRowsSelected = () => instance.toggleAllRowsSelected()
              headerProps = {
                ...headerProps,
                onClick: toggleAllRowsSelected,
                className: classNames(headerProps.className, 'rt-td-select')
              }
              header = (
                <SelectInputComponent
                  type="checkbox"
                  checked={instance.isAllRowsSelected}
                  onChange={toggleAllRowsSelected}
                  aria-label={language.selectAllRowsLabel}
                />
              )
            }

            const { key, ...resolvedHeaderProps } = column.getHeaderProps(headerProps)
            return (
              <ThComponent key={key} {...resolvedHeaderProps}>
                {header}
                {resizer}
              </ThComponent>
            )
          })}
        </TrComponent>
      )
    })
  }

  // Use column.filterable over column.canFilter because useGlobalFilter
  // currently sets canFilter to true on columns with disableFilters = true.
  // https://github.com/tannerlinsley/react-table/issues/2787
  const isFilterable = instance.visibleColumns.some(col => col.filterable)

  // Reset filtered state when table is no longer filterable
  const filterableRef = React.useRef(isFilterable)
  safeUseLayoutEffect(() => {
    if (filterableRef.current && !isFilterable) {
      const setAllFilters = instance.setAllFilters
      setAllFilters(instance.visibleColumns.map(col => ({ id: col.id, value: undefined })))
    }
    filterableRef.current = isFilterable
  }, [isFilterable, instance.visibleColumns, instance.setAllFilters])

  const makeFilters = () => {
    if (!isFilterable) {
      return null
    }

    return (
      <TrComponent className={classNames('rt-tr-filters', css(theme.rowStyle))}>
        {instance.visibleColumns.map(column => {
          let filter
          // Use column.filterable over column.canFilter because useGlobalFilter
          // currently sets canFilter to true on columns with disableFilters = true.
          // https://github.com/TanStack/react-table/issues/2787
          if (column.filterable) {
            if (column.filterInput != null) {
              let filterInput
              if (typeof column.filterInput === 'function') {
                filterInput = column.filterInput(column, stateInfo)
              } else {
                filterInput = hydrate({ Fragment, WidgetContainer }, column.filterInput)
              }
              if (React.isValidElement(filterInput)) {
                filter = filterInput
              } else if (column.html) {
                filter = <RawHTML html={filterInput} />
              }
            } else {
              filter = (
                <FilterComponent
                  filterValue={column.filterValue}
                  setFilter={column.setFilter}
                  className={css(theme.filterInputStyle)}
                  placeholder={language.filterPlaceholder}
                  aria-label={renderTemplate(language.filterLabel, { name: column.name })}
                />
              )
            }
          }

          const { className: themeClass, innerClassName } = getCellTheme(theme.filterCellStyle)
          const filterCellProps = {
            role: 'cell',
            // colspan doesn't apply to ARIA tables, but react-table adds it. Remove it.
            colSpan: null,
            className: classNames('rt-td-filter', column.headerClassName, themeClass),
            innerClassName,
            style: column.headerStyle
          }
          const { key, ...resolvedFilterCellProps } = column.getHeaderProps(filterCellProps)
          return (
            <TdComponent key={key} {...resolvedFilterCellProps}>
              {filter}
            </TdComponent>
          )
        })}
      </TrComponent>
    )
  }

  safeUseLayoutEffect(() => {
    const toggleAllRowsExpanded = instance.toggleAllRowsExpanded
    if (defaultExpanded) {
      toggleAllRowsExpanded(true)
    } else {
      toggleAllRowsExpanded(false)
    }
  }, [instance.toggleAllRowsExpanded, defaultExpanded])

  // Track expanded columns for multiple row details
  const [expandedColumns, setExpandedColumns] = React.useState({})
  const makeRowDetails = (rowInfo, state) => {
    // Ensure that row is expanded and not a grouped row. Row details are
    // currently not supported on grouped rows.
    if (!rowInfo.isExpanded || rowInfo.isGrouped) {
      return null
    }

    const expandedId = expandedColumns[rowInfo.id]
    let expandedCol
    if (expandedId != null) {
      expandedCol = instance.visibleColumns.find(col => col.id === expandedId)
    } else {
      // When expanding all rows, default to the first column with details
      expandedCol = instance.visibleColumns.find(col => col.details)
    }
    // Ensure that row details exist. Rows may have expanded state even though
    // there are no row details (when defaultExpanded = true).
    if (!expandedCol) {
      return null
    }

    const { details, html } = expandedCol
    let props = {}
    if (typeof details === 'function') {
      let content = details(rowInfo, state)
      if (html) {
        props.html = content
      }
      props.children = content
    } else if (Array.isArray(details)) {
      let content = details[rowInfo.index]
      if (content == null) {
        // No content to render. Although this row has no expander, it may still
        // have expanded state (when defaultExpanded = true).
        return null
      }
      if (html) {
        props.html = content
      }
      props.children = hydrate({ Reactable, Fragment, WidgetContainer }, content)
    }
    // Set key to force updates when expanding a different column or changing page
    return <RowDetails key={`${expandedCol.id}_${rowInfo.index}`} {...props} />
  }

  const makeTbody = () => {
    const hasStickyColumns = instance.visibleColumns.some(column => column.sticky)
    let rowHighlightClass = hasStickyColumns ? 'rt-tr-highlight-sticky' : 'rt-tr-highlight'
    let rowStripedClass = hasStickyColumns ? 'rt-tr-striped-sticky' : 'rt-tr-striped'

    const rows = instance.page.map((row, viewIndex) => {
      instance.prepareRow(row)

      // toggleRowSelected that supports single selection
      const toggleRowSelected = set => {
        if (set == null) {
          set = !row.isSelected
        }
        if (selection === 'single') {
          instance.setRowsSelected([])
        }
        row.toggleRowSelected(set)
      }

      const rowInfo = {
        ...row,
        toggleRowSelected,
        // For v6 compatibility
        viewIndex,
        row: row.values, // Deprecated in v0.3.0
        subRows: convertRowsToV6(row.subRows),
        aggregated: row.isGrouped,
        expanded: row.isExpanded,
        level: row.depth,
        selected: row.isSelected,
        page: state.pageIndex // Deprecated in v0.3.0
      }

      const rowProps = {
        className: classNames(
          striped && (viewIndex % 2 ? null : rowStripedClass),
          highlight && rowHighlightClass,
          row.isSelected && 'rt-tr-selected',
          css(theme.rowStyle)
        )
      }
      if (rowClassName) {
        let rowCls
        if (typeof rowClassName === 'function') {
          rowCls = rowClassName(rowInfo, stateInfo)
        } else if (Array.isArray(rowClassName)) {
          rowCls = rowClassName[rowInfo.index]
        } else {
          rowCls = rowClassName
        }
        rowProps.className = classNames(rowProps.className, rowCls)
      }
      if (rowStyle) {
        if (typeof rowStyle === 'function') {
          rowProps.style = rowStyle(rowInfo, stateInfo)
        } else if (Array.isArray(rowStyle)) {
          rowProps.style = rowStyle[rowInfo.index]
        } else {
          rowProps.style = rowStyle
        }
      }

      const rowDetails = makeRowDetails(rowInfo, stateInfo)

      let expandedId
      if (row.isExpanded) {
        if (expandedColumns[row.id] != null) {
          expandedId = expandedColumns[row.id]
        } else {
          // When expanding all rows, default to the first column with details
          const expandedCol = instance.visibleColumns.find(col => col.details)
          expandedId = expandedCol ? expandedCol.id : null
        }
      }

      const resolvedRowProps = row.getRowProps(rowProps)
      return (
        // Use relative row index for key (like in v6) rather than row index (v7)
        // for better rerender performance, especially with a large number of rows.
        <TrGroupComponent key={`${row.depth}_${viewIndex}`} className={css(theme.rowGroupStyle)}>
          <TrComponent {...resolvedRowProps} key={undefined}>
            {row.cells.map((cell, colIndex) => {
              const { column } = cell
              let cellProps = column.getProps ? column.getProps(rowInfo, column, stateInfo) : {}
              const { className: themeClass, innerClassName } = getCellTheme(theme.cellStyle)
              cellProps = {
                ...cellProps,
                className: classNames(cellProps.className, themeClass),
                innerClassName,
                role: column.rowHeader ? 'rowheader' : 'cell'
              }
              const cellInfo = {
                ...cell,
                column,
                filterValue: column.filterValue,
                ...rowInfo
              }
              let value
              if (cell.isGrouped) {
                value = column.Grouped ? column.Grouped(cellInfo, stateInfo) : cellInfo.value
              } else if (cell.isAggregated) {
                value = column.Aggregated
                  ? column.Aggregated(cellInfo, stateInfo)
                  : cell.render('Aggregated')
              } else if (cell.isPlaceholder) {
                value = ''
              } else {
                value = column.Cell ? column.Cell(cellInfo, stateInfo) : cell.render('Cell')
              }

              let hasDetails
              if (column.details && !row.isGrouped) {
                if (Array.isArray(column.details) && column.details[row.index] == null) {
                  // Don't expand rows without content
                } else {
                  hasDetails = true
                }
              }

              let expander
              if (hasDetails) {
                const isExpanded = row.isExpanded && expandedId === column.id
                cellProps = {
                  ...cellProps,
                  onClick: () => {
                    if (isExpanded) {
                      row.toggleRowExpanded(false)
                      const newExpandedColumns = { ...expandedColumns }
                      delete newExpandedColumns[row.id]
                      setExpandedColumns(newExpandedColumns)
                    } else {
                      row.toggleRowExpanded(true)
                      const newExpandedColumns = { ...expandedColumns, [row.id]: column.id }
                      setExpandedColumns(newExpandedColumns)
                    }
                  },
                  className: classNames(cellProps.className, 'rt-td-expandable')
                }
                // Hide overflow ellipsis and prevent text selection on expander-only columns
                if (value === emptyValue) {
                  cellProps.style = { textOverflow: 'clip', userSelect: 'none', ...cellProps.style }
                }
                const expanderProps = {
                  isExpanded: isExpanded,
                  className: css(theme.expanderStyle),
                  'aria-label': language.detailsExpandLabel
                }
                expander = <ExpanderComponent {...expanderProps} />
              } else if (cell.isGrouped) {
                const isExpanded = row.isExpanded
                cellProps = {
                  ...cellProps,
                  onClick: () => row.toggleRowExpanded(),
                  className: classNames(cellProps.className, 'rt-td-expandable')
                }
                const expanderProps = {
                  isExpanded: isExpanded,
                  className: css(theme.expanderStyle),
                  'aria-label': language.groupExpandLabel
                }
                expander = <ExpanderComponent {...expanderProps} />
              } else if (cell.column.isGrouped && row.canExpand) {
                // Make all grouped column cells expandable (including placeholders)
                cellProps = {
                  ...cellProps,
                  onClick: () => row.toggleRowExpanded(),
                  className: classNames(cellProps.className, 'rt-td-expandable')
                }
              }

              const canRowSelect =
                selection === 'multiple' || (selection === 'single' && !cell.isAggregated)

              if (column.selectable && canRowSelect) {
                cellProps = {
                  ...cellProps,
                  onClick: () => toggleRowSelected(),
                  className: classNames(cellProps.className, 'rt-td-select')
                }
                let ariaLabel
                if (cell.isAggregated) {
                  ariaLabel = language.selectAllSubRowsLabel
                } else {
                  ariaLabel = language.selectRowLabel
                }
                value = (
                  <SelectInputComponent
                    type={selection === 'multiple' ? 'checkbox' : 'radio'}
                    checked={row.isSelected}
                    onChange={() => toggleRowSelected()}
                    aria-label={ariaLabel}
                  />
                )
              }

              // Add cell click actions. Don't override existing click actions.
              if (onClick && !cellProps.onClick) {
                if (onClick === 'expand') {
                  cellProps.onClick = () => row.toggleRowExpanded()
                } else if (onClick === 'select' && canRowSelect) {
                  cellProps.onClick = () => toggleRowSelected()
                } else if (typeof onClick === 'function') {
                  cellProps.onClick = () => onClick(rowInfo, column, stateInfo)
                }
              }

              const resolvedCellProps = cell.getCellProps(cellProps)
              return (
                // Use column ID for key (like in v6) rather than row index (v7)
                // for better rerender performance, especially with a large number of rows.
                <TdComponent {...resolvedCellProps} key={`${colIndex}_${column.id}`}>
                  {expander}
                  {value}
                </TdComponent>
              )
            })}
          </TrComponent>
          {rowDetails}
        </TrGroupComponent>
      )
    })

    let padRows
    // Leave at least one row to show the no data message properly
    minRows = minRows ? Math.max(minRows, 1) : 1
    const padRowCount = Math.max(minRows - instance.page.length, 0)
    if (padRowCount > 0) {
      padRows = [...Array(padRowCount)].map((_, viewIndex) => {
        const rowProps = {
          className: classNames('rt-tr-pad', css(theme.rowStyle))
        }
        if (rowClassName) {
          let rowCls
          if (typeof rowClassName === 'function') {
            rowCls = rowClassName(undefined, stateInfo)
          } else if (Array.isArray(rowClassName)) {
            // rowClassName not used for pad rows
          } else {
            rowCls = rowClassName
          }
          rowProps.className = classNames(rowProps.className, rowCls)
        }
        if (rowStyle) {
          if (typeof rowStyle === 'function') {
            rowProps.style = rowStyle(undefined, stateInfo)
          } else if (Array.isArray(rowStyle)) {
            // rowStyle not used for pad rows
          } else {
            rowProps.style = rowStyle
          }
        }
        return (
          <TrGroupComponent key={viewIndex} className={css(theme.rowGroupStyle)} aria-hidden>
            <TrComponent {...rowProps}>
              {instance.visibleColumns.map(column => {
                const { className: themeClass, innerClassName } = getCellTheme(theme.cellStyle)
                const cellProps = {
                  className: themeClass
                }
                // Get layout styles (flex, sticky) from footer props. useFlexLayout
                // doesn't have built-in support for pad cells.
                const { className, style } = column.getFooterProps(cellProps)
                return (
                  <TdComponent
                    key={`${viewIndex}_${column.id}`}
                    className={className}
                    innerClassName={innerClassName}
                    style={style}
                  >
                    &nbsp;
                  </TdComponent>
                )
              })}
            </TrComponent>
          </TrGroupComponent>
        )
      })
    }

    let className = css(theme.tableBodyStyle)
    let noData
    if (instance.rows.length === 0) {
      noData = <NoDataComponent>{language.noData}</NoDataComponent>
      // Hide cell borders when table has no data
      className = classNames('rt-tbody-no-data', className)
    } else {
      // Must be on the page for the ARIA live region to be announced
      noData = <NoDataComponent />
    }
    const tbodyProps = instance.getTableBodyProps({ className })

    return (
      <TbodyComponent {...tbodyProps}>
        {rows}
        {padRows}
        {noData}
      </TbodyComponent>
    )
  }

  const makeTfoot = () => {
    const hasFooters = instance.visibleColumns.some(column => column.footer != null)
    if (!hasFooters) {
      return null
    }

    const tfootProps = instance.getTfootProps()
    return (
      <TfootComponent {...tfootProps}>
        <TrComponent>
          {instance.visibleColumns.map(column => {
            column = {
              ...column,
              column, // Deprecated in v0.3.0
              data: rowData // Deprecated in v0.3.0
            }
            const footer =
              typeof column.Footer === 'function'
                ? column.Footer(column, stateInfo)
                : column.render('Footer')

            const { className: themeClass, innerClassName } = getCellTheme(theme.footerStyle)
            const footerProps = {
              className: classNames('rt-td-footer', column.footerClassName, themeClass),
              innerClassName,
              style: column.footerStyle,
              role: column.rowHeader ? 'rowheader' : 'cell',
              // colspan doesn't apply to ARIA tables, but react-table adds it. Remove it.
              colSpan: null
            }
            const { key, ...resolvedFooterProps } = column.getFooterProps(footerProps)
            return (
              <TdComponent key={key} {...resolvedFooterProps}>
                {footer}
              </TdComponent>
            )
          })}
        </TrComponent>
      </TfootComponent>
    )
  }

  // Track the max number of rows for auto-shown pagination. Unfortunately, the max
  // number of rows can't be determined up front in a grouped and filtered table
  // because grouping happens after filtering (and swapping these hooks would
  // disable dynamic aggregation). Instead, we track the max number of rows
  // per dataset, so at least the pagination doesn't disappear upon filtering.
  //
  // Unused for server-side pagination.
  const maxRowCount = React.useRef(
    paginateSubRows ? instance.flatRows.length : instance.rows.length
  )

  React.useEffect(() => {
    maxRowCount.current = 0
  }, [data])

  React.useEffect(() => {
    const rowCount = paginateSubRows ? instance.flatRows.length : instance.rows.length
    if (rowCount > maxRowCount.current) {
      maxRowCount.current = rowCount
    }
  }, [paginateSubRows, instance.flatRows, instance.rows])

  const makePagination = () => {
    if (showPagination === false) {
      return null
    } else if (!pagination && showPagination == null) {
      // Unpaginated tables can still have a visible pagination bar (e.g., for page info)
      return null
    } else if (pagination && showPagination == null) {
      // Auto-hide pagination if the entire table fits on one page
      const minPageSize = showPageSizeOptions
        ? Math.min(state.pageSize, ...(pageSizeOptions || []))
        : state.pageSize

      let rowCount
      if (serverMaxRowCount != null) {
        rowCount = serverMaxRowCount
      } else if (serverRowCount != null) {
        // If the optional server-side maxRowCount isn't provided, fall back to
        // serverRowCount so at least the pagination bar appears when expanding
        // a table past its initial page.
        rowCount = serverRowCount
      } else {
        rowCount = maxRowCount.current
      }
      if (rowCount <= minPageSize) {
        return null
      }
    }
    return (
      <Pagination
        paginationType={paginationType}
        pageSizeOptions={pageSizeOptions}
        showPageInfo={showPageInfo}
        showPageSizeOptions={showPageSizeOptions}
        page={state.pageIndex}
        pages={instance.pageCount}
        pageSize={state.pageSize}
        pageRowCount={instance.pageRowCount}
        canNext={instance.canNextPage}
        canPrevious={instance.canPreviousPage}
        onPageChange={instance.gotoPage}
        onPageSizeChange={instance.setPageSize}
        rowCount={serverRowCount != null ? serverRowCount : instance.rows.length}
        theme={theme}
        language={language}
      />
    )
  }

  // Add keyboard-only focus styles
  const rootElement = React.useRef(null)
  const keyboardActiveProps = {
    onMouseDown: () => {
      rootElement.current.classList.remove('rt-keyboard-active')
    },
    onKeyDown: () => {
      rootElement.current.classList.add('rt-keyboard-active')
    },
    onKeyUp: e => {
      // Detect keyboard use when tabbing into the table
      const keyCode = e.which || e.keyCode
      if (keyCode === 9) {
        rootElement.current.classList.add('rt-keyboard-active')
      }
    }
  }

  // Provide keyboard access to scrollable tables. Make the table focusable,
  // but only when it has a scrollbar.
  const tableElement = React.useRef(null)
  const [tableHasScrollbar, setTableHasScrollbar] = React.useState(false)
  safeUseLayoutEffect(() => {
    const checkTableHasScrollbar = () => {
      const { scrollHeight, clientHeight, scrollWidth, clientWidth } = tableElement.current
      const hasScrollbar = scrollHeight > clientHeight || scrollWidth > clientWidth
      setTableHasScrollbar(hasScrollbar)
    }
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        checkTableHasScrollbar()
      })
      resizeObserver.observe(tableElement.current)
      return function cleanup() {
        resizeObserver.disconnect()
      }
    } else {
      // Degrade gracefully on older browsers (e.g., Safari < 13)
      checkTableHasScrollbar()
    }
  }, [])

  // Send reactable state to Shiny for getReactableState
  React.useEffect(() => {
    // Ignore nested tables that aren't Shiny outputs
    if (!window.Shiny || !window.Shiny.onInputChange || nested) {
      return
    }
    // Ensure this is a Shiny output, not a static rendered table in Shiny
    const outputId = rootElement.current.parentElement.getAttribute('data-reactable-output')
    if (!outputId) {
      return
    }
    // Convert to R's 1-based indices
    const selectedIndexes = stateInfo.selected.map(index => index + 1)
    // Convert to R's 1-based indices
    const page = stateInfo.page + 1
    // Convert sortBy array to named list of "asc" and "desc"
    let sorted = stateInfo.sorted.length > 0 ? {} : null
    for (let sortInfo of stateInfo.sorted) {
      sorted[sortInfo.id] = sortInfo.desc ? 'desc' : 'asc'
    }

    // NOTE: any object arrays will be simplified into vectors by jsonlite by default. Avoid sending
    // arrays without transforming them first, or adding a custom input type and input handler.
    const state = {
      page: page,
      pageSize: stateInfo.pageSize,
      pages: stateInfo.pages,
      sorted: sorted,
      selected: selectedIndexes
    }
    // Shiny.onInputChange has built-in debouncing, so it's not strictly necessary to
    // debounce rapid state changes here.
    Object.keys(state).forEach(prop => {
      // NOTE: output IDs must always come first to work with Shiny modules
      window.Shiny.onInputChange(`${outputId}__reactable__${prop}`, state[prop])
    })
  }, [
    nested,
    stateInfo.page,
    stateInfo.pageSize,
    stateInfo.pages,
    stateInfo.sorted,
    stateInfo.selected
  ])

  // Getter for the latest page count
  const getPageCount = useGetLatest(instance.pageCount)

  // Add Shiny message handler for updateReactable
  React.useEffect(() => {
    // Ignore nested tables that aren't Shiny outputs
    if (!window.Shiny || nested) {
      return
    }
    // Ensure this is a Shiny output, not a static rendered table in Shiny
    const outputId = rootElement.current.parentElement.getAttribute('data-reactable-output')
    if (!outputId) {
      return
    }
    const setRowsSelected = instance.setRowsSelected
    const setHiddenColumns = instance.setHiddenColumns
    const gotoPage = instance.gotoPage
    const toggleAllRowsExpanded = instance.toggleAllRowsExpanded

    const updateState = newState => {
      if (newState.jsEvals) {
        for (let key of newState.jsEvals) {
          window.HTMLWidgets.evaluateStringMember(newState, key)
        }
      }
      if (newState.data != null) {
        const data = normalizeColumnData(newState.data, dataColumns)
        setNewData(data)
      }
      if (newState.selected != null) {
        const selectedRowIds = newState.selected.map(index => String(index))
        setRowsSelected(selectedRowIds)
      }
      if (newState.hidden != null) {
        const hiddenArray = Array.isArray(newState.hidden) ? newState.hidden: [newState.hidden]
        setHiddenColumns(hiddenArray)
      }
      else{
        setHiddenColumns([])
      }
      if (newState.page != null) {
        // Get the latest page count in case a data update changes the number of pages
        const nearestValidPage = Math.min(
          Math.max(newState.page, 0),
          Math.max(getPageCount() - 1, 0)
        )
        gotoPage(nearestValidPage)
      }
      if (newState.expanded != null) {
        if (newState.expanded) {
          toggleAllRowsExpanded(true)
        } else {
          toggleAllRowsExpanded(false)
        }
      }
      if (newState.meta !== undefined) {
        setMeta(newState.meta)
      }
    }
    window.Shiny.addCustomMessageHandler(`__reactable__${outputId}`, updateState)
  }, [
    nested,
    instance.setRowsSelected,
    instance.setHiddenColumns,
    instance.gotoPage,
    instance.toggleAllRowsExpanded,
    dataColumns,
    getPageCount,
    setMeta
  ])

  // Set up Crosstalk and apply initial selection/filtering.
  // useLayoutEffect so the hook runs in order with other useLayoutEffect hooks.
  const ctRef = React.useRef(null)

  safeUseLayoutEffect(() => {
    if (!crosstalkGroup || !window.crosstalk) {
      return
    }

    const ct = {}
    ct.selection = new window.crosstalk.SelectionHandle(crosstalkGroup)
    ct.filter = new window.crosstalk.FilterHandle(crosstalkGroup)
    // Keep track of selected and filtered state updated by other widgets.
    // SelectionHandle and FilterHandle also track state, but will include changes
    // coming from the table as well.
    ct.selected = ct.selection.value
    ct.filtered = ct.filter.filteredKeys
    ctRef.current = ct

    const rowByKey = (crosstalkKey || []).reduce((obj, key, index) => {
      obj[key] = index
      return obj
    }, {})

    const setFilter = instance.setFilter
    const setRowsSelected = instance.setRowsSelected
    const applyCrosstalkFilter = () => {
      // Selection value is an array of keys, or null or empty array if empty
      // Filter value is an an array of keys, or null if empty
      const selectedKeys = ct.selected && ct.selected.length > 0 ? ct.selected : null
      const filteredKeys = ct.filtered
      let keys
      if (!selectedKeys && !filteredKeys) {
        keys = null
      } else if (!selectedKeys) {
        keys = filteredKeys
      } else if (!filteredKeys) {
        keys = selectedKeys
      } else {
        keys = selectedKeys.filter(key => filteredKeys.includes(key))
      }
      const filteredRows = keys ? keys.map(key => rowByKey[key]) : null
      setFilter(crosstalkId, filteredRows)
    }

    const setCrosstalkSelection = value => {
      if (ct.selected !== value) {
        ct.selected = value
        applyCrosstalkFilter()
      }
    }

    const setCrosstalkFilter = value => {
      if (ct.filtered !== value) {
        ct.filtered = value
        applyCrosstalkFilter()
      }
    }

    ct.selection.on('change', e => {
      if (e.sender !== ct.selection) {
        setCrosstalkSelection(e.value)
        // Selections from other widgets should clear table selection state
        ct.skipNextSelection = true
        setRowsSelected([])
      } else {
        // Selections from table should clear selections from other widgets
        setCrosstalkSelection(null)
      }
    })

    ct.filter.on('change', e => {
      if (e.sender !== ct.filter) {
        setCrosstalkFilter(e.value)
      }
    })

    // Apply initial filter/selection for dynamically rendered tables (e.g., nested tables, Shiny outputs)
    if (ct.selected || ct.filtered) {
      applyCrosstalkFilter()
    }

    return function cleanup() {
      // Prevent errors from other widgets from breaking the table, e.g.,
      // https://github.com/ropensci/plotly/issues/1346
      try {
        ct.selection.close()
      } catch (e) {
        console.error('Error closing Crosstalk selection handle:', e)
      }
      try {
        ct.filter.close()
      } catch (e) {
        console.error('Error closing Crosstalk filter handle:', e)
      }
    }
  }, [crosstalkKey, crosstalkGroup, crosstalkId, instance.setFilter, instance.setRowsSelected])

  // Don't set Crosstalk selection on initial render
  safeUseLayoutEffect(() => {
    if (!ctRef.current) {
      return
    }
    if (!defaultSelected) {
      ctRef.current.skipNextSelection = true
    }
  }, [defaultSelected])

  // Set Crosstalk selection. useLayoutEffect to avoid visual flickering when
  // selecting a row and clearing a pre-existing selection at the same time.
  safeUseLayoutEffect(() => {
    if (!ctRef.current || !selection) {
      return
    }

    const ct = ctRef.current
    // Some selections don't update Crosstalk state, like selection clears from
    // other widget selections
    if (ct.skipNextSelection) {
      ct.skipNextSelection = false
      return
    }

    const selectedKeys = Object.keys(state.selectedRowIds).map(id => {
      return crosstalkKey[rowsById[id].index]
    })
    // Prevent errors from other widgets from breaking the table, e.g.,
    // https://github.com/ropensci/plotly/issues/1346
    try {
      ct.selection.set(selectedKeys)
    } catch (e) {
      console.error('Error selecting Crosstalk keys:', e)
    }
  }, [state.selectedRowIds, rowsById, selection, crosstalkKey])

  // Expose a limited JavaScript API to the table instance
  instance.state = stateInfo
  instance.downloadDataCSV = (filename, options = {}) => {
    filename = filename || 'data.csv'
    const csv = instance.getDataCSV(options)
    downloadCSV(csv, filename)
  }
  instance.getDataCSV = (options = {}) => {
    if (!options.columnIds) {
      options.columnIds = dataColumns.map(col => col.id)
    }
    // Ignore columns without data (e.g., selection or details columns) by default
    const dataColumnIds = data.length > 0 ? Object.keys(data[0]) : []
    options.columnIds = options.columnIds.filter(id => dataColumnIds.includes(id))
    // Ensure rows are flattened and ignore sort order. Unlike instance.flatRows,
    // instance.preGroupedRows excludes aggregated rows and uses the original data order.
    const rows = instance.preGroupedRows.map(row => row.values)
    const csv = rowsToCSV(rows, options)
    return csv
  }
  instance.setMeta = setMeta
  const origToggleHideColumn = instance.toggleHideColumn
  instance.toggleHideColumn = (columnId, isHidden) => {
    // Prevent duplicate column IDs from being added to hiddenColumns
    if (isHidden && stateInfo.hiddenColumns.includes(columnId)) {
      return
    }
    origToggleHideColumn(columnId, isHidden)
  }
  instance.setData = (data, options = {}) => {
    options = Object.assign({ resetSelected: true, resetExpanded: false }, options)
    if (typeof data !== 'object' || data == null) {
      throw new Error('data must be an array of row objects or an object containing column arrays')
    }
    // If data is in row format, it's assumed to have all numbers normalized (NA/NaN/Inf/-Inf not as strings)
    if (!Array.isArray(data)) {
      data = normalizeColumnData(data, dataColumns)
    }
    setNewData(data)
    if (options.resetSelected) {
      instance.setRowsSelected([])
    }
    if (options.resetExpanded) {
      instance.toggleAllRowsExpanded(false)
    }
  }

  let stateCallbacks = React.useRef([])
  instance.onStateChange = listenerFn => {
    if (typeof listenerFn !== 'function') {
      throw new Error('listenerFn must be a function')
    }
    stateCallbacks.current.push(listenerFn)
    return function cancel() {
      stateCallbacks.current = stateCallbacks.current.filter(cb => cb !== listenerFn)
    }
  }
  // Debounce rapid state changes. Some actions can cause the table to render twice, e.g., when
  // sorting and the pageIndex is automatically reset to 0 via an internal side effect.
  const onStateChange = useAsyncDebounce(state => {
    stateCallbacks.current.forEach(cb => {
      cb(state)
    })
  }, 0)
  React.useEffect(() => {
    onStateChange(stateInfo)
  }, [stateInfo, onStateChange])

  const getTableInstance = useGetLatest(instance)

  React.useEffect(() => {
    // For static rendered tables, the instance ID is the element ID. For Shiny outputs,
    // the instance ID is the Shiny output ID, although the element ID may override it.
    let instanceId = elementId
    if (!instanceId) {
      instanceId = rootElement.current.parentElement.getAttribute('data-reactable-output')
    }
    if (!instanceId) {
      return
    }

    tableInstances[instanceId] = getTableInstance

    return function cleanup() {
      delete tableInstances[instanceId]
    }
  }, [elementId, getTableInstance])

  className = classNames(
    className,
    css(theme.style),
    outlined && 'rt-outlined',
    bordered && 'rt-bordered',
    borderless && 'rt-borderless',
    compact && 'rt-compact',
    nowrap && 'rt-nowrap',
    inline && ' rt-inline'
  )
  style = { width, height, ...style }

  const isResizing = state.columnResizing.isResizingColumn != null
  const tableClassName = classNames(css(theme.tableStyle), isResizing && 'rt-resizing')

  return (
    <RootComponent ref={rootElement} {...keyboardActiveProps} className={className} style={style}>
      {makeSearch()}
      <TableComponent
        ref={tableElement}
        tabIndex={tableHasScrollbar ? 0 : null}
        className={tableClassName}
      >
        {makeThead()}
        {makeTbody()}
        {makeTfoot()}
      </TableComponent>
      {makePagination()}
    </RootComponent>
  )
}

Reactable.propTypes = {
  data: PropTypes.objectOf(PropTypes.array).isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  columnGroups: PropTypes.arrayOf(PropTypes.object),
  groupBy: PropTypes.arrayOf(PropTypes.string),
  sortable: PropTypes.bool,
  resizable: PropTypes.bool,
  filterable: PropTypes.bool,
  searchable: PropTypes.bool,
  searchMethod: PropTypes.func,
  defaultSortDesc: PropTypes.bool,
  defaultSorted: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, desc: PropTypes.bool })),
  pagination: PropTypes.bool,
  defaultPageSize: PropTypes.number,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  paginationType: PropTypes.oneOf(['numbers', 'jump', 'simple']),
  showPagination: PropTypes.bool,
  showPageSizeOptions: PropTypes.bool,
  showPageInfo: PropTypes.bool,
  minRows: PropTypes.number,
  paginateSubRows: PropTypes.bool,
  defaultExpanded: PropTypes.bool,
  selection: PropTypes.oneOf(['multiple', 'single']),
  selectionId: PropTypes.string, // Deprecated in v0.3.0
  defaultSelected: PropTypes.arrayOf(PropTypes.number),
  onClick: PropTypes.oneOfType([PropTypes.oneOf(['expand', 'select']), PropTypes.func]),
  outlined: PropTypes.bool,
  bordered: PropTypes.bool,
  borderless: PropTypes.bool,
  striped: PropTypes.bool,
  highlight: PropTypes.bool,
  compact: PropTypes.bool,
  nowrap: PropTypes.bool,
  showSortIcon: PropTypes.bool,
  showSortable: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  rowClassName: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.array]),
  rowStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.func, PropTypes.array]),
  inline: PropTypes.bool,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  theme: PropTypes.object,
  language: PropTypes.object,
  meta: PropTypes.object,
  crosstalkKey: PropTypes.array,
  crosstalkGroup: PropTypes.string,
  crosstalkId: PropTypes.string,
  elementId: PropTypes.string,
  nested: PropTypes.bool,
  dataKey: PropTypes.string,
  dataURL: PropTypes.string,
  serverRowCount: PropTypes.number,
  serverMaxRowCount: PropTypes.number
}

Reactable.defaultProps = {
  sortable: true,
  pagination: true,
  defaultPageSize: 10,
  paginationType: 'numbers',
  pageSizeOptions: [10, 25, 50, 100],
  showPageInfo: true,
  minRows: 1,
  showSortIcon: true,
  crosstalkId: '__crosstalk__'
}

ReactableData.propTypes = Reactable.propTypes
ReactableData.defaultProps = Reactable.defaultProps
