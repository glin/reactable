import React from 'react'
import ReactTable from 'react-table'
import PropTypes from 'prop-types'
import { reactWidget } from 'reactR'

import 'react-table/react-table.css'

import { columnsToRows, round, mean } from './utils'

const Reactable = ({
  data,
  columns,
  pivotBy,
  sortable,
  resizable,
  filterable,
  defaultPageSize,
  minRows,
  striped,
  highlight
}) => {
  data = columnsToRows(data)

  columns = columns.map(col => {
    if (col.accessor.includes('.')) {
      // Interpret column names with dots as IDs, not paths
      col.id = col.accessor
      col.accessor = data => data[col.id]
    }

    col.aggregate = vals => round(mean(vals))
    return col
  })

  const className = (striped ? '-striped' : '') + (highlight ? ' -highlight' : '')

  return (
    <ReactTable
      data={data}
      columns={columns}
      pivotBy={pivotBy || []}
      sortable={sortable}
      resizable={resizable}
      filterable={filterable}
      defaultPageSize={defaultPageSize}
      minRows={minRows}
      className={className}
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
  minRows: PropTypes.number,
  striped: PropTypes.bool,
  highlight: PropTypes.bool
}

reactWidget('reactable', 'output', {
  Reactable
})
