import React, { Fragment } from 'react'
import ReactTable from 'react-table'
import { ReactTableDefaults } from 'react-table'
import PropTypes from 'prop-types'
import { hydrate } from 'reactR'

import Pagination from './Pagination'
import selectTableHOC from './selectTable'
import WidgetContainer from './WidgetContainer'
import fixedReactTablePropTypes from './propTypes'
import { columnsToRows, buildColumnDefs } from './columns'
import { classNames, getFirstDefined, get, set } from './utils'

import 'react-table/react-table.css'
import './assets/reactable.css'

const getTheadThProps = (state, rowInfo, column) => {
  // Add aria-sort to column headers
  const isSortable = getFirstDefined(column.sortable, state.sortable)
  if (isSortable) {
    const sort = state.sorted.find(d => d.id === column.id)
    const order = sort ? (sort.desc ? 'descending' : 'ascending') : 'none'
    return { 'aria-sort': order }
  }
  return {}
}

const getTheadGroupThProps = (state, rowInfo, column) => {
  let props = {}
  // When ungrouped columns or columns in different groups are pivoted,
  // the group header is hardcoded to <strong>Pivoted</strong> and not easily
  // configurable. Work around this by overriding the default ThComponent to
  // render a custom HeaderPivoted component instead.
  if (column.columns.some(col => col.pivoted)) {
    const pivotColumns = column.columns
    const pivotParentColumn = pivotColumns.reduce(
      (prev, current) => prev && prev === current.parentColumn && current.parentColumn,
      pivotColumns[0].parentColumn
    )
    if (!pivotParentColumn.Header) {
      props.HeaderPivoted = 'Grouped'
    }
  }

  // Mark actual column group headers
  if (column.Header) {
    props.className = classNames('-headerGroup', column.className)
  }

  return props
}

// Render column group headers with a custom HeaderPivoted component instead
// of the default "Pivoted" header.
const DefaultThComponent = ReactTableDefaults.ThComponent
Object.assign(ReactTableDefaults, {
  ThComponent({ HeaderPivoted, children, ...rest }) {
    if (HeaderPivoted) {
      children = HeaderPivoted
    }
    return DefaultThComponent({ ...rest, children })
  }
})

// Render no data component in table body rather than the entire table
// so it doesn't overlap with headers/filters.
const getTbodyProps = state => ({ state })
const DefaultTbodyComponent = ReactTableDefaults.TbodyComponent
const DefaultNoDataComponent = ReactTableDefaults.NoDataComponent
Object.assign(ReactTableDefaults, {
  // eslint-disable-next-line react/prop-types
  TbodyComponent({ state, children, ...rest }) {
    const { pageRows, noDataText } = state
    const noData = !pageRows.length && <DefaultNoDataComponent>{noDataText}</DefaultNoDataComponent>
    return (
      <DefaultTbodyComponent {...rest}>
        {children}
        {noData}
      </DefaultTbodyComponent>
    )
  },
  NoDataComponent() {
    return null
  }
})

// Add aria-label to filter inputs
Object.assign(ReactTableDefaults, {
  // eslint-disable-next-line react/prop-types
  FilterComponent({ column, filter, onChange }) {
    return (
      <input
        type="text"
        style={{ width: '100%' }}
        value={filter ? filter.value : ''}
        onChange={event => onChange(event.target.value)}
        aria-label={`Filter ${column.name}`}
      />
    )
  }
})

ReactTable.propTypes = fixedReactTablePropTypes

// Prevent unnecessary data updates on table rerenders by doing a deep comparison
// of data props rather than a === comparison. Kind of ugly, but significantly
// increases performance when selecting or expanding rows in a very large table.
ReactTable.prototype.oldComponentWillReceiveProps = ReactTable.prototype.componentWillReceiveProps
ReactTable.prototype.componentWillReceiveProps = function(newProps, newState) {
  newProps = { ...newProps }
  if (this.props.dataKey && this.props.dataKey === newProps.dataKey) {
    newProps.data = this.props.data
    newProps.columns = this.props.columns
  }
  const dataUpdateProps = ['pivotBy', 'sorted', 'filtered']
  dataUpdateProps.forEach(name => {
    if (JSON.stringify(this.props[name]) === JSON.stringify(newProps[name])) {
      newProps[name] = this.props[name]
    }
  })
  // Reset search value if searchable changes
  if (this.props.searchable !== newProps.searchable) {
    newProps.filtered = this.state.filtered.filter(filter => filter.id !== this.props.searchKey)
  }
  return this.oldComponentWillReceiveProps(newProps, newState)
}

// Add global table searching. react-table doesn't support a global filter,
// so we use a dummy column to efficiently filter all columns. Because filters
// are only applied for visible (show = true) columns, we pass the dummy column
// directly to filterData to avoid having to hide the column.
ReactTable.prototype.oldFilterData = ReactTable.prototype.filterData
ReactTable.prototype.filterData = function(data, filtered, defaultFilterMethod, allVisibleColumns) {
  let filterColumns = allVisibleColumns
  if (this.props.searchable) {
    const searchColumn = {
      id: this.props.searchKey,
      filterAll: true,
      filterable: true,
      filterMethod: (filter, rows) => {
        if (!filter.value) {
          return rows
        }

        const matchers = allVisibleColumns.reduce((obj, col) => {
          obj[col.id] = col.createMatcher(filter.value)
          return obj
        }, {})

        rows = rows.filter(row => {
          // Don't filter on aggregated rows
          if (row._subRows) {
            return true
          }
          for (let col of allVisibleColumns) {
            let value = row._original[col.id]
            if (matchers[col.id](value)) {
              return true
            }
          }
        })
        return rows
      }
    }
    filterColumns = allVisibleColumns.concat(searchColumn)
  }
  return this.oldFilterData(data, filtered, defaultFilterMethod, filterColumns)
}

const SelectTable = selectTableHOC(ReactTable)

class RowDetails extends React.Component {
  componentDidMount() {
    if (window.Shiny) {
      window.Shiny.bindAll(this.el)
    }
  }

  componentWillUnmount() {
    if (window.Shiny) {
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
    return <div {...props} />
  }
}

RowDetails.propTypes = {
  children: PropTypes.node,
  html: PropTypes.string
}

class Reactable extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selected: new Set(),
      expanded: {}
    }
    this.toggleSelection = this.toggleSelection.bind(this)
    this.toggleAll = this.toggleAll.bind(this)
    this.isSelected = this.isSelected.bind(this)
    this.handleExpanderClick = this.handleExpanderClick.bind(this)
    this.isExpanded = this.isExpanded.bind(this)
  }

  isSelected(index) {
    return this.state.selected.has(index)
  }

  toggleSelection(index) {
    const selected = new Set(this.state.selected)
    if (this.state.selected.has(index)) {
      selected.delete(index)
    } else {
      if (this.props.selection === 'single') {
        selected.clear()
      }
      selected.add(index)
    }
    this.setState({ selected })
  }

  toggleAll(indices, checked) {
    const selected = new Set(this.state.selected)
    if (checked) {
      indices.forEach(i => selected.add(i))
    } else {
      indices.forEach(i => selected.delete(i))
    }
    this.setState({ selected })
  }

  handleExpanderClick(rowInfo, column) {
    let expanded = { ...this.state.expanded }
    const expandedId = get(expanded, rowInfo.nestingPath)
    if (expandedId && expandedId === column.id) {
      expanded = set(expanded, rowInfo.nestingPath, undefined)
    } else {
      expanded = set(expanded, rowInfo.nestingPath, column.id)
    }
    this.setState({ expanded })
  }

  isExpanded(cellInfo) {
    const expanded = get(this.state.expanded, cellInfo.nestingPath)
    return expanded && expanded === cellInfo.column.id
  }

  componentDidUpdate() {
    const { selection, selectionId } = this.props
    if (selection) {
      // Convert to R's 1-based indices
      const selected = [...this.state.selected].map(i => i + 1)
      if (window.Shiny && selectionId) {
        Shiny.onInputChange(selectionId, selected)
      }
    }
  }

  render() {
    let {
      data,
      columns,
      columnGroups,
      pivotBy,
      sortable,
      resizable,
      filterable,
      searchable,
      defaultSortDesc,
      defaultSorted,
      defaultPageSize,
      pageSizeOptions,
      paginationType,
      showPagination,
      showPageSizeOptions,
      showPageInfo,
      minRows,
      selection,
      outlined,
      bordered,
      borderless,
      striped,
      highlight,
      compact,
      nowrap,
      showSortIcon,
      showSortable,
      className,
      style,
      rowClassName,
      rowStyle,
      inline,
      width,
      height,
      dataKey
    } = this.props

    data = columnsToRows(data)
    columns = buildColumnDefs(columns, columnGroups, {
      sortable,
      showSortIcon,
      showSortable,
      isExpanded: this.isExpanded,
      onExpanderClick: this.handleExpanderClick
    })

    // Leave at least one row to show the no data message properly
    if (minRows != null) {
      minRows = Math.max(minRows, 1)
    }

    className = classNames(
      className,
      outlined ? '-outlined' : '',
      bordered ? '-bordered' : '',
      borderless ? '-borderless' : '',
      striped ? '-striped' : '',
      highlight ? ' -highlight' : '',
      compact ? '-compact' : '',
      inline ? ' -inline' : '',
      nowrap ? '-nowrap' : ''
    )

    style = { width, height, ...style }

    let Table = ReactTable
    let selectProps = {}
    if (selection) {
      Table = SelectTable
      selectProps = {
        isSelected: this.isSelected,
        toggleSelection: this.toggleSelection,
        toggleAll: this.toggleAll,
        selectType: selection === 'multiple' ? 'checkbox' : 'radio'
      }
    }

    const autoHidePagination = showPagination == null

    let getTrProps
    if (rowClassName || rowStyle) {
      getTrProps = (state, rowInfo) => {
        let props = {}
        if (rowClassName) {
          if (typeof rowClassName === 'function') {
            props.className = rowClassName(rowInfo, state)
          } else if (rowClassName instanceof Array) {
            // Ignore padding rows
            props.className = rowInfo && rowClassName[rowInfo.index]
          } else {
            props.className = rowClassName
          }
        }
        if (rowStyle) {
          if (typeof rowStyle === 'function') {
            props.style = rowStyle(rowInfo, state)
          } else if (rowStyle instanceof Array) {
            // Ignore padding rows
            props.style = rowInfo && rowStyle[rowInfo.index]
          } else {
            props.style = rowStyle
          }
        }
        return props
      }
    }

    // Row details
    let SubComponent
    const dataColumns = columns.reduce((cols, col) => {
      return cols.concat(col.columns ? col.columns : col)
    }, [])
    if (dataColumns.some(col => col.details)) {
      SubComponent = rowInfo => {
        const expandedId = get(this.state.expanded, rowInfo.nestingPath)
        const column = dataColumns.find(col => col.id === expandedId)
        const { details, html } = column
        let props = {}
        if (typeof details === 'function') {
          let content = details(rowInfo)
          if (html) {
            props.html = content
          }
          props.children = content
        } else if (details instanceof Array) {
          let content = details[rowInfo.index]
          if (content == null) {
            // No content to render, although we should never get here since
            // the expander isn't rendered for this row.
            return null
          }
          if (html) {
            props.html = content
          }
          props.children = hydrate({ Reactable, Fragment, WidgetContainer }, content)
        }
        // Set a key to force updates when expanding a different column
        return <RowDetails key={expandedId} {...props} />
      }

      // Add a dummy expander column to prevent react-table from adding one
      // automatically, which won't work with our custom expanders.
      columns = [{ expander: true, show: false }, ...columns]
    } else {
      // SubComponent must have a value (not undefined) to properly update on rerenders
      SubComponent = null
    }

    // Expanded state is controlled, so we have to handle expanding of pivoted cells
    const onExpandedChange = newExpanded => {
      this.setState({ expanded: newExpanded })
    }
    // And also handle collapsing on page/sorting/filter change
    const collapseDetails = () => {
      if (Object.keys(this.state.expanded).length > 0) {
        this.setState({ expanded: {} })
      }
    }

    return (
      <Table
        data={data}
        columns={columns}
        pivotBy={pivotBy || []}
        sortable={sortable}
        resizable={resizable}
        filterable={filterable}
        searchable={searchable}
        searchKey="__search__"
        defaultSortDesc={defaultSortDesc}
        defaultSorted={defaultSorted}
        defaultPageSize={defaultPageSize}
        pageSizeOptions={pageSizeOptions}
        showPagination={showPagination}
        showPageSizeOptions={showPageSizeOptions}
        PaginationComponent={Pagination}
        paginationType={paginationType}
        autoHidePagination={autoHidePagination}
        showPageInfo={showPageInfo}
        minRows={minRows}
        collapseOnSortingChange={true}
        collapseOnPageChange={true}
        collapseOnDataChange={false}
        className={className}
        style={style}
        expanded={this.state.expanded}
        onExpandedChange={onExpandedChange}
        onPageChange={collapseDetails}
        onSortedChange={collapseDetails}
        getTheadGroupThProps={getTheadGroupThProps}
        getTheadThProps={getTheadThProps}
        getTbodyProps={getTbodyProps}
        getTrProps={getTrProps}
        SubComponent={SubComponent}
        {...selectProps}
        pageJumpText="go to page"
        rowsSelectorText="rows per page"
        // Force ReactTable to rerender when default page size changes
        key={`${defaultPageSize}`}
        // Used to deep compare data and columns props
        dataKey={dataKey}
      >
        {(state, makeTable, instance) => {
          let searchInput
          if (searchable) {
            const filter = state.filtered.find(filter => filter.id === state.searchKey)
            searchInput = (
              <input
                type="text"
                value={filter ? filter.value : ''}
                onChange={event =>
                  instance.filterColumn({ id: state.searchKey }, event.target.value)
                }
                className="rt-search"
                placeholder="Search"
                aria-label="Search"
              />
            )
          }
          return (
            <React.Fragment>
              {searchInput}
              {makeTable()}
            </React.Fragment>
          )
        }}
      </Table>
    )
  }
}

Reactable.propTypes = {
  data: PropTypes.objectOf(PropTypes.array).isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  columnGroups: PropTypes.arrayOf(PropTypes.object),
  pivotBy: PropTypes.arrayOf(PropTypes.string),
  sortable: PropTypes.bool,
  resizable: PropTypes.bool,
  filterable: PropTypes.bool,
  searchable: PropTypes.bool,
  defaultSortDesc: PropTypes.bool,
  defaultSorted: PropTypes.arrayOf(PropTypes.object),
  defaultPageSize: PropTypes.number,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  paginationType: Pagination.propTypes.paginationType,
  showPagination: PropTypes.bool,
  showPageSizeOptions: PropTypes.bool,
  showPageInfo: Pagination.propTypes.showPageInfo,
  minRows: PropTypes.number,
  selection: PropTypes.oneOf(['multiple', 'single']),
  selectionId: PropTypes.string,
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
  dataKey: PropTypes.string
}

Reactable.defaultProps = {
  sortable: true,
  showSortIcon: true
}

export default Reactable
