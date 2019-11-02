// selectTable HOC adapted from
// https://github.com/tannerlinsley/react-table/blob/v6/src/hoc/selectTable/index.js

import React from 'react'
import PropTypes from 'prop-types'

const DefaultSelectInputComponent = props => {
  return (
    <input
      type={props.selectType || 'checkbox'}
      aria-label={`${props.checked ? 'Deselect' : 'Select'} ${props.label || ''}`}
      checked={props.checked}
      onClick={e => {
        e.stopPropagation()
        if (props.rows) {
          // Select all
          const indices = props.rows.map(row => row._index)
          props.onClick(indices, !props.checked)
        } else if (props.row) {
          // Select single
          const index = props.row._index
          props.onClick(index)
        }
      }}
      onChange={() => {}}
    />
  )
}

DefaultSelectInputComponent.propTypes = {
  selectType: PropTypes.oneOf(['checkbox', 'radio']),
  checked: PropTypes.bool,
  label: PropTypes.string,
  onClick: PropTypes.func,
  row: PropTypes.object,
  rows: PropTypes.arrayOf(PropTypes.object)
}

export default (Component, options) => {
  const wrapper = class RTSelectTable extends React.Component {
    constructor(props) {
      super(props)
    }

    rowSelector(cellInfo) {
      const { isSelected, toggleSelection, selectType, SelectInputComponent } = this.props
      const checked = isSelected(cellInfo.index)
      const inputProps = {
        checked,
        onClick: toggleSelection,
        selectType,
        row: cellInfo.row,
        label: `row ${cellInfo.index + 1}`
      }
      return React.createElement(SelectInputComponent, inputProps)
    }

    subRowSelector(cellInfo) {
      const { isSelected, toggleAll, selectType, SelectInputComponent } = this.props
      if (selectType === 'radio') return null
      const rows = cellInfo.subRows
      // Don't support selecting aggregated cells for now
      if (!rows || rows.some(row => row._aggregated)) {
        return null
      }
      const checked = rows.every(row => isSelected(row._index))
      const inputProps = {
        checked,
        onClick: toggleAll,
        selectType,
        rows,
        label: `all rows in the group`
      }
      return React.createElement(SelectInputComponent, inputProps)
    }

    headSelector(cellInfo) {
      const { isSelected, selectType, toggleAll, SelectAllInputComponent } = this.props
      if (selectType === 'radio') return null
      const rows = cellInfo.data
      // Don't support selecting aggregated cells for now
      if (rows.length === 0 || rows.some(row => row._aggregated)) {
        return null
      }
      const checked = rows.every(row => isSelected(row._index))
      const inputProps = {
        checked,
        onClick: toggleAll,
        selectType,
        rows,
        label: 'all rows'
      }
      return React.createElement(SelectAllInputComponent, inputProps)
    }

    render() {
      const { columns: originalCols, selectWidth, ...rest } = this.props
      const select = {
        id: '_selector',
        accessor: () => '', // this value is not important
        Header: cellInfo => {
          return <label className="rt-select-label">{this.headSelector.bind(this)(cellInfo)}</label>
        },
        Cell: cellInfo => {
          return <label className="rt-select-label">{this.rowSelector.bind(this)(cellInfo)}</label>
        },
        Aggregated: cellInfo => {
          return (
            <label className="rt-select-label">{this.subRowSelector.bind(this)(cellInfo)}</label>
          )
        },
        selectable: true,
        filterable: false,
        sortable: false,
        resizable: false,
        className: 'rt-select',
        headerClassName: 'rt-select',
        width: selectWidth || 30,
        style: { textAlign: 'center' }
      }

      const columns =
        options !== undefined && options.floatingLeft === true
          ? [...originalCols, select]
          : [select, ...originalCols]
      const extra = {
        columns
      }

      RTSelectTable.propTypes = {
        selectType: PropTypes.oneOf(['checkbox', 'radio']).isRequired,
        SelectInputComponent: PropTypes.func.isRequired,
        SelectAllInputComponent: PropTypes.func.isRequired,
        isSelected: PropTypes.func.isRequired,
        toggleSelection: PropTypes.func.isRequired,
        toggleAll: PropTypes.func.isRequired,
        selectWidth: PropTypes.number,
        columns: PropTypes.array.isRequired
      }

      return <Component {...rest} {...extra} />
    }
  }

  wrapper.displayName = 'RTSelectTable'
  wrapper.defaultProps = {
    selectType: 'checkbox',
    SelectInputComponent: DefaultSelectInputComponent,
    SelectAllInputComponent: DefaultSelectInputComponent
  }

  return wrapper
}
