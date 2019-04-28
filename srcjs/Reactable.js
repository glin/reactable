import React from 'react'
import ReactTable from 'react-table'
import { ReactTableDefaults } from 'react-table'
import PropTypes from 'prop-types'

import { columnsToRows, buildColumnDefs } from './columns'
import { classNames } from './utils'

import 'react-table/react-table.css'
import './assets/reactable.css'

const getTheadThProps = (state, rowInfo, column) => {
  // Add aria-sort to column headers
  if (state.sortable || column.sortable) {
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

const Reactable = ({
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
  showPagination,
  minRows,
  outlined,
  bordered,
  striped,
  highlight,
  className,
  style
}) => {
  data = columnsToRows(data)

  columns = buildColumnDefs(columns, columnGroups, { sortable })

  className = classNames(
    className,
    outlined ? '-outlined' : '',
    bordered ? '-bordered' : '',
    striped ? '-striped' : '',
    highlight ? ' -highlight' : ''
  )

  return (
    <ReactTable
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
      minRows={minRows}
      collapseOnSortingChange={false}
      collapseOnPageChange={true}
      collapseOnDataChange={false}
      className={className}
      style={style}
      getTheadThProps={getTheadThProps}
      getTheadGroupThProps={getTheadGroupThProps}
    />
  )
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
  showPagination: PropTypes.bool,
  minRows: PropTypes.number,
  outlined: PropTypes.bool,
  bordered: PropTypes.bool,
  striped: PropTypes.bool,
  highlight: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object
}

export default Reactable
