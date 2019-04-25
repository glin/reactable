// selectTable HOC from https://github.com/tannerlinsley/react-table/blob/v6/src/hoc/selectTable/index.js

/* eslint-disable */

import React from 'react'

const defaultSelectInputComponent = props => {
  return (
    <input
      type={props.selectType || 'checkbox'}
      aria-label={`${props.checked ? 'Un-select' : 'Select'} row with id:${props.id}`}
      checked={props.checked}
      id={props.id}
      onClick={e => {
        const { shiftKey } = e
        e.stopPropagation()
        props.onClick(props.id, shiftKey, props.row)
      }}
      onChange={() => {}}
    />
  )
}

export default (Component, options) => {
  const wrapper = class RTSelectTable extends React.Component {
    constructor(props) {
      super(props)
    }

    // rowSelector(row) {
    rowSelector(cellInfo) {
      const row = cellInfo.original

      // if (!row || !row.hasOwnProperty(this.props.keyField)) return null

      if (!row) return null
      // const { toggleSelection, selectType, keyField } = this.props
      const { toggleSelection, selectType } = this.props
      
      // const checked = this.props.isSelected(row[this.props.keyField])
      const checked = this.props.isSelected(cellInfo.index)

      const inputProps = {
        checked,
        onClick: toggleSelection,
        selectType,
        row,
        // id: `select-${row[keyField]}`
        // id: row[keyField]
        id: cellInfo.index
      }
      return React.createElement(this.props.SelectInputComponent, inputProps)
    }

    headSelector(row) {
      const { selectType } = this.props
      if (selectType === 'radio') return null

      const { toggleAll, selectAll: checked, SelectAllInputComponent } = this.props
      const inputProps = {
        checked,
        onClick: toggleAll,
        selectType,
        id: 'select-all'
      }

      return React.createElement(SelectAllInputComponent, inputProps)
    }

    // this is so we can expose the underlying ReactTable to get at the sortedData for selectAll
    getWrappedInstance() {
      if (!this.wrappedInstance) console.warn('RTSelectTable - No wrapped instance')
      if (this.wrappedInstance.getWrappedInstance) return this.wrappedInstance.getWrappedInstance()
      else return this.wrappedInstance
    }

    render() {
      const {
        columns: originalCols,
        isSelected,
        toggleSelection,
        toggleAll,
        // keyField,
        selectAll,
        selectType,
        selectWidth,
        SelectAllInputComponent,
        SelectInputComponent,
        ...rest
      } = this.props
      const select = {
        id: '_selector',
        accessor: () => 'x', // this value is not important
        Header: this.headSelector.bind(this),
        Cell: ci => {
          // return this.rowSelector.bind(this)(ci.original)
          return this.rowSelector.bind(this)(ci)
        },
        width: selectWidth || 30,
        filterable: false,
        sortable: false,
        resizable: false,
        style: { textAlign: 'center' }
      }

      const columns =
        options !== undefined && options.floatingLeft === true
          ? [...originalCols, select]
          : [select, ...originalCols]
      const extra = {
        columns
      }
      return <Component {...rest} {...extra} ref={r => (this.wrappedInstance = r)} />
    }
  }

  wrapper.displayName = 'RTSelectTable'
  wrapper.defaultProps = {
    // keyField: '_id',
    isSelected: key => {
      console.log('No isSelected handler provided:', { key })
    },
    selectAll: false,
    toggleSelection: (key, shift, row) => {
      console.log('No toggleSelection handler provided:', { key, shift, row })
    },
    toggleAll: () => {
      console.log('No toggleAll handler provided.')
    },
    selectType: 'checkbox',
    SelectInputComponent: defaultSelectInputComponent,
    SelectAllInputComponent: defaultSelectInputComponent
  }

  return wrapper
}
