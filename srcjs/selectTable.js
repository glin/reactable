// selectTable HOC adapted from
// https://github.com/tannerlinsley/react-table/blob/v6/src/hoc/selectTable/index.js

import React from 'react'
import PropTypes from 'prop-types'

import { defaultLanguage } from './language'
import { classNames } from './utils'

const DefaultSelectInputComponent = props => {
  const { selectType, checked, label, rows, row, onClick } = props
  return (
    <input
      type={selectType || 'checkbox'}
      className="rt-select-input"
      aria-label={label}
      checked={checked}
      onClick={e => {
        e.stopPropagation()
        if (rows) {
          // Select all
          const indices = rows.map(row => row._index)
          onClick(indices, !checked)
        } else if (row) {
          // Select single
          const index = row._index
          onClick(index)
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
  class RTSelectTable extends React.Component {
    constructor(props) {
      super(props)
    }

    rowSelector(cellInfo) {
      const { isSelected, toggleSelection, selectType, SelectInputComponent, language } = this.props
      const checked = isSelected(cellInfo.index)
      const inputProps = {
        checked,
        onClick: toggleSelection,
        selectType,
        row: cellInfo.row,
        label: checked ? language.deselectRowLabel : language.selectRowLabel
      }
      return React.createElement(SelectInputComponent, inputProps)
    }

    subRowSelector(cellInfo) {
      const { isSelected, toggleAll, selectType, SelectInputComponent, language } = this.props
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
        label: checked ? language.deselectAllSubRowsLabel : language.selectAllSubRowsLabel
      }
      return React.createElement(SelectInputComponent, inputProps)
    }

    headSelector(cellInfo) {
      const { isSelected, selectType, toggleAll, SelectAllInputComponent, language } = this.props
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
        label: checked ? language.deselectAllRowsLabel : language.selectAllRowsLabel
      }
      return React.createElement(SelectAllInputComponent, inputProps)
    }

    render() {
      const { columns: originalCols, selectWidth, forwardedRef, ...rest } = this.props
      const { isSelected, selectType, toggleAll, toggleSelection, selectId } = this.props

      let origSelectCol = {}
      for (let i = 0; i < originalCols.length; i++) {
        if (originalCols[i].id === selectId) {
          origSelectCol = originalCols.splice(i, 1)[0]
          break
        }
      }

      const selectCol = {
        ...origSelectCol,
        id: selectId,
        accessor: () => '', // this value is not important
        Header: cellInfo => {
          return this.headSelector.bind(this)(cellInfo)
        },
        Cell: cellInfo => {
          return this.rowSelector.bind(this)(cellInfo)
        },
        Aggregated: cellInfo => {
          return this.subRowSelector.bind(this)(cellInfo)
        },
        getProps: (state, rowInfo, column) => {
          let props = origSelectCol.getProps ? origSelectCol.getProps(state, rowInfo, column) : {}
          // Ignore padding rows
          if (!rowInfo) {
            return props
          }
          // Ignore expandable pivoted cells
          if (column.pivoted && rowInfo.aggregated) {
            return props
          }
          if (rowInfo.aggregated) {
            if (selectType === 'radio') {
              return props
            }
            const rows = rowInfo.subRows
            // Don't support selecting aggregated cells for now
            if (!rows || rows.some(row => row._aggregated)) {
              return props
            }
            props.onClick = () => {
              const indices = rows.map(row => row._index)
              const checked = indices.every(index => isSelected(index))
              toggleAll(indices, !checked)
            }
          } else {
            props.onClick = () => {
              toggleSelection(rowInfo.index)
            }
          }
          return props
        },
        getHeaderProps: state => {
          let props = {}
          if (selectType === 'radio') {
            return props
          }
          const rows = state.sortedData
          // Don't support selecting aggregated cells for now
          if (!rows || rows.some(row => row._aggregated)) {
            return props
          }
          props.onClick = () => {
            const indices = rows.map(row => row._index)
            const checked = indices.every(index => isSelected(index))
            toggleAll(indices, !checked)
          }
          return props
        },
        selectable: true,
        filterable: false,
        sortable: false,
        resizable: false,
        className: classNames('rt-td-select', origSelectCol.className),
        headerClassName: classNames('rt-td-select', origSelectCol.headerClassName),
        width: origSelectCol.width || selectWidth
      }

      const columns =
        options !== undefined && options.floatingLeft === true
          ? [...originalCols, selectCol]
          : [selectCol, ...originalCols]
      const extra = {
        columns
      }

      return <Component ref={forwardedRef} {...rest} {...extra} />
    }
  }

  RTSelectTable.displayName = 'RTSelectTable'
  RTSelectTable.propTypes = {
    selectType: PropTypes.oneOf(['checkbox', 'radio']).isRequired,
    selectWidth: PropTypes.number,
    selectId: PropTypes.string,
    SelectInputComponent: PropTypes.func.isRequired,
    SelectAllInputComponent: PropTypes.func.isRequired,
    isSelected: PropTypes.func.isRequired,
    toggleSelection: PropTypes.func.isRequired,
    toggleAll: PropTypes.func.isRequired,
    columns: PropTypes.array.isRequired,
    language: PropTypes.shape({
      selectAllRowsLabel: PropTypes.string,
      deselectAllRowsLabel: PropTypes.string,
      selectAllSubRowsLabel: PropTypes.string,
      deselectAllSubRowsLabel: PropTypes.string,
      selectRowLabel: PropTypes.string,
      deselectRowLabel: PropTypes.string
    }),
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })])
  }
  RTSelectTable.defaultProps = {
    selectType: 'checkbox',
    selectWidth: 36,
    selectId: '.selection',
    SelectInputComponent: DefaultSelectInputComponent,
    SelectAllInputComponent: DefaultSelectInputComponent,
    language: defaultLanguage
  }

  return React.forwardRef((props, ref) => {
    return <RTSelectTable {...props} forwardedRef={ref} />
  })
}
