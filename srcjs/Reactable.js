import React from 'react'
import ReactTable from 'react-table'
import { ReactTableDefaults } from 'react-table'
import PropTypes from 'prop-types'

import { DefaultAggregated } from './aggregators'
import { columnsToRows, buildColumnDefs } from './columns'

import 'react-table/react-table.css'
import './assets/reactable.css'

Object.assign(ReactTableDefaults, {
  AggregatedComponent: DefaultAggregated
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
  minRows,
  striped,
  highlight,
  className,
  style
}) => {
  data = columnsToRows(data)

  columns = buildColumnDefs(columns, columnGroups)

  const classes = [className, striped ? '-striped' : '', highlight ? ' -highlight' : '']
  className = classes.join(' ').trim()

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
      minRows={minRows}
      collapseOnSortingChange={false}
      collapseOnPageChange={false}
      collapseOnDataChange={false}
      className={className}
      style={style}
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
  minRows: PropTypes.number,
  striped: PropTypes.bool,
  highlight: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object
}

export default Reactable
