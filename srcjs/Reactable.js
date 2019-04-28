import React from 'react'
import ReactTable from 'react-table'
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
  // Mark actual column group headers
  if (column.Header) {
    return { className: '-headerGroup' }
  }
  return {}
}

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
      collapseOnPageChange={false}
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
