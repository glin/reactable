import React, { Fragment } from 'react'
import ReactTable from 'react-table'
import { ReactTableDefaults } from 'react-table'
import PropTypes from 'prop-types'
import { hydrate } from 'reactR'

import Pagination from './Pagination'
import selectTableHOC from './selectTable'
import fixedReactTablePropTypes from './propTypes'
import { columnsToRows, buildColumnDefs } from './columns'
import { classNames, getFirstDefined } from './utils'

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

ReactTable.propTypes = fixedReactTablePropTypes

const SelectTable = selectTableHOC(ReactTable)

class RowDetails extends React.Component {
  componentDidMount() {
    if (window.Shiny) {
      Shiny.bindAll(this.el)
    }
  }

  componentWillUnmount() {
    if (window.Shiny) {
      Shiny.unbindAll(this.el)
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
      selected: new Set()
    }
    this.toggleSelection = this.toggleSelection.bind(this)
    this.toggleAll = this.toggleAll.bind(this)
    this.isSelected = this.isSelected.bind(this)
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
      details,
      outlined,
      bordered,
      borderless,
      striped,
      highlight,
      compact,
      showSortable,
      className,
      style,
      inline
    } = this.props

    data = columnsToRows(data)
    columns = buildColumnDefs(columns, columnGroups, { sortable, showSortable })

    className = classNames(
      className,
      outlined ? '-outlined' : '',
      bordered ? '-bordered' : '',
      borderless ? '-borderless' : '',
      striped ? '-striped' : '',
      highlight ? ' -highlight' : '',
      compact ? '-compact' : '',
      inline ? ' -inline' : ''
    )

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

    let SubComponent, colProps, getTdProps
    if (details) {
      const { render, html, name, width } = details
      if (typeof render === 'function') {
        SubComponent = row => {
          let content = render(row)
          if (html) {
            return <RowDetails html={content} />
          }
          return <RowDetails>{content}</RowDetails>
        }
      } else if (render instanceof Array) {
        SubComponent = row => {
          let content = render[row.index]
          if (content == null) {
            return null
          }
          if (html) {
            return <RowDetails html={content} />
          }
          return <RowDetails>{hydrate({ Reactable, Fragment }, content)}</RowDetails>
        }

        colProps = {
          Expander: props => {
            if (render[props.index] == null) {
              return null
            }
            return ReactTableDefaults.ExpanderComponent(props)
          },
          getProps: (state, rowInfo) => {
            if (!rowInfo) return {}
            // Disable expander on rows without content
            if (render[rowInfo.index] == null) {
              return { onClick: () => {}, className: 'rt-expand-disabled' }
            }
            return {}
          }
        }

        getTdProps = (state, rowInfo, column) => {
          if (!rowInfo) return {}
          let props = {
            onClick: (e, handleOriginal) => {
              if (handleOriginal) {
                handleOriginal()
              }
            }
          }
          // Disable expander on rows without content
          if (!rowInfo.aggregated && column.pivoted && render[rowInfo.index] == null) {
            props = { ...props, className: 'rt-expand-disabled' }
          }
          return props
        }
      }

      const expanderCol = {
        expander: true,
        Header: name,
        width: width || 35,
        headerClassName: 'rt-col-left',
        ...colProps
      }
      columns = [expanderCol, ...columns]
    } else {
      // SubComponent must have a value (not undefined) to properly update on rerenders
      SubComponent = null
    }

    return (
      <Table
        data={data}
        columns={columns}
        pivotBy={pivotBy || []}
        sortable={sortable}
        resizable={resizable}
        filterable={filterable}
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
        collapseOnSortingChange={false}
        collapseOnPageChange={true}
        collapseOnDataChange={false}
        className={className}
        style={style}
        getTheadThProps={getTheadThProps}
        getTheadGroupThProps={getTheadGroupThProps}
        getTdProps={getTdProps}
        SubComponent={SubComponent}
        {...selectProps}
        pageJumpText="go to page"
        rowsSelectorText="rows per page"
        // Force ReactTable to rerender when default page size changes
        key={`${defaultPageSize}`}
      />
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
  details: PropTypes.shape({
    render: PropTypes.oneOfType([PropTypes.func, PropTypes.array]),
    html: PropTypes.bool,
    name: PropTypes.string,
    width: PropTypes.number
  }),
  outlined: PropTypes.bool,
  bordered: PropTypes.bool,
  borderless: PropTypes.bool,
  striped: PropTypes.bool,
  highlight: PropTypes.bool,
  compact: PropTypes.bool,
  showSortable: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  inline: PropTypes.bool
}

Reactable.defaultProps = {
  sortable: true
}

export default Reactable
