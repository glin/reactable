import React from 'react'
import ReactTable from 'react-table'
import { ReactTableDefaults } from 'react-table'
import PropTypes from 'prop-types'

import { aggregators, DefaultAggregated } from './aggregators'
import { columnsToRows, addColumnGroups, compareNumbers } from './columns'

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

  columns = columns.map(col => {
    col.id = col.accessor
    if (col.accessor.includes('.')) {
      // Interpret column names with dots as IDs, not paths
      col.accessor = data => data[col.id]
    }

    if (typeof col.aggregate === 'string' && aggregators[col.aggregate]) {
      const type = col.aggregate
      col.aggregate = aggregators[type]
    }

    if (col.render && col.render.cell) {
      const renderCell = col.render.cell
      col.Cell = function renderedCell(cell) {
        return <div dangerouslySetInnerHTML={{ __html: renderCell(cell) }} />
      }
    }
    if (col.render && col.render.aggregated) {
      const renderAggregated = col.render.aggregated
      col.Aggregated = function renderedCell(cell) {
        return <div dangerouslySetInnerHTML={{ __html: renderAggregated(cell) }} />
      }
    } else {
      // Set a default renderer to prevent the cell renderer from applying
      // to aggregated cells (without having to check cell.aggregated).
      col.Aggregated = cell => cell.value
    }

    if (col.type === 'numeric') {
      col.sortMethod = compareNumbers
      // Right-align numbers by default
      col.style = { textAlign: 'right', ...col.style }
    }

    return col
  })

  if (columnGroups) {
    columns = addColumnGroups(columns, columnGroups)
  }

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
