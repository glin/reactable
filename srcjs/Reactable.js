import React from 'react'
import ReactTable from 'react-table'
import PropTypes from 'prop-types'

import { aggregators } from './aggregators'
import { columnsToRows } from './utils'

import 'react-table/react-table.css'
import './assets/reactable.css'

const Reactable = ({
  data,
  columns,
  pivotBy,
  sortable,
  resizable,
  filterable,
  defaultPageSize,
  pageSizeOptions,
  minRows,
  striped,
  highlight,
  className,
  style
}) => {
  data = columnsToRows(data)

  columns = columns.map(col => {
    if (col.accessor.includes('.')) {
      // Interpret column names with dots as IDs, not paths
      col.id = col.accessor
      col.accessor = data => data[col.id]
    }
    if (typeof col.aggregate === 'string' && aggregators[col.aggregate]) {
      const type = col.aggregate
      col.aggregate = aggregators[type]
      col.Aggregated = col.Aggregated || (row => `${row.value} (${type})`)
    }
    return col
  })

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
      defaultPageSize={defaultPageSize}
      pageSizeOptions={pageSizeOptions}
      minRows={minRows}
      className={className}
      style={style}
    />
  )
}

Reactable.propTypes = {
  data: PropTypes.objectOf(PropTypes.array).isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  pivotBy: PropTypes.array,
  sortable: PropTypes.bool,
  resizable: PropTypes.bool,
  filterable: PropTypes.bool,
  defaultPageSize: PropTypes.number,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  minRows: PropTypes.number,
  striped: PropTypes.bool,
  highlight: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object
}

export default Reactable
