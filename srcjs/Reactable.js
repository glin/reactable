import React from 'react'
import ReactTable from 'react-table'
import { ReactTableDefaults } from 'react-table'
import PropTypes from 'prop-types'

import selectTableHOC from './selectTable'
import fixedReactTablePropTypes from './propTypes'
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

ReactTable.propTypes = fixedReactTablePropTypes

const SelectTable = selectTableHOC(ReactTable)

class Reactable extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selection: new Set()
    }
    this.toggleSelection = this.toggleSelection.bind(this)
    this.toggleAll = this.toggleAll.bind(this)
    this.isSelected = this.isSelected.bind(this)
  }

  isSelected(index) {
    return this.state.selection.has(index)
  }

  toggleSelection(index) {
    const selection = new Set(this.state.selection)
    if (this.state.selection.has(index)) {
      selection.delete(index)
    } else {
      if (this.props.selectionType === 'single') {
        selection.clear()
      }
      selection.add(index)
    }
    this.setState({ selection })
  }

  toggleAll(indices, checked) {
    const selection = new Set(this.state.selection)
    if (checked) {
      indices.forEach(i => selection.add(i))
    } else {
      indices.forEach(i => selection.delete(i))
    }
    this.setState({ selection })
  }

  componentDidUpdate() {
    const { selectable, selectionId } = this.props
    if (selectable) {
      // Convert to R's 1-based indices
      const selection = [...this.state.selection].map(i => i + 1)
      if (window.Shiny && selectionId) {
        Shiny.onInputChange(selectionId, selection)
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
      selectable,
      selectionType,
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
      style,
      inline
    } = this.props

    data = columnsToRows(data)
    columns = buildColumnDefs(columns, columnGroups, { sortable })

    className = classNames(
      className,
      outlined ? '-outlined' : '',
      bordered ? '-bordered' : '',
      striped ? '-striped' : '',
      highlight ? ' -highlight' : '',
      inline ? ' -inline' : ''
    )

    let Table = ReactTable
    let selectProps = {}
    if (selectable) {
      Table = SelectTable
      selectProps = {
        isSelected: this.isSelected,
        toggleSelection: this.toggleSelection,
        toggleAll: this.toggleAll,
        selectType: selectionType === 'multiple' ? 'checkbox' : 'radio'
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
        {...selectProps}
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
  selectable: PropTypes.string,
  selectionType: PropTypes.oneOf(['multiple', 'single']),
  selectionId: PropTypes.string,
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
  style: PropTypes.object,
  inline: PropTypes.bool
}

export default Reactable
