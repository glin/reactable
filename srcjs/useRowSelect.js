// useRowSelect hook modified to:
// - Set row.isSelected for sub rows when paginateExpandedRows = false
//   (https://github.com/TanStack/react-table/issues/2908)
// - Include an instance.setRowsSelected() function to set selected rows.
//   This is also useful to clear all selection, since toggleAllRowsSelected()
//   only affects visible rows, excluding any selected rows that may be filtered out.
// - Handle sub rows correctly when custom getSubRows is used
//   (https://github.com/TanStack/react-table/pull/2886)
// - Add inverted selection model for backend modes (manualPagination). In backend mode,
//   only one page of rows is loaded at a time, so toggleAllRowsSelected can't enumerate
//   all row IDs. Instead, selectAllRows=true means "all rows selected" and deselectedRowIds
//   tracks exceptions. This is resolved to concrete indices at API boundaries (Shiny, JS API).

import React from 'react'
import {
  actions,
  makePropGetter,
  ensurePluginOrder,
  useGetLatest,
  useMountedLayoutEffect
} from 'react-table'

const pluginName = 'useRowSelect'

// Actions
actions.resetSelectedRows = 'resetSelectedRows'
actions.toggleAllRowsSelected = 'toggleAllRowsSelected'
actions.toggleRowSelected = 'toggleRowSelected'
actions.toggleAllPageRowsSelected = 'toggleAllPageRowsSelected'
actions.setRowsSelected = 'setRowsSelected'

export default function useRowSelect(hooks) {
  hooks.getToggleRowSelectedProps = [defaultGetToggleRowSelectedProps]
  hooks.getToggleAllRowsSelectedProps = [defaultGetToggleAllRowsSelectedProps]
  hooks.getToggleAllPageRowsSelectedProps = [defaultGetToggleAllPageRowsSelectedProps]
  hooks.stateReducers.push(reducer)
  hooks.useInstance.push(useInstance)
  hooks.prepareRow.push(prepareRow)
}

useRowSelect.pluginName = pluginName

const defaultGetToggleRowSelectedProps = (props, { instance, row }) => {
  const { manualRowSelectedKey = 'isSelected' } = instance
  let checked = false

  if (row.original && row.original[manualRowSelectedKey]) {
    checked = true
  } else {
    checked = row.isSelected
  }

  return [
    props,
    {
      onChange: e => {
        row.toggleRowSelected(e.target.checked)
      },
      style: {
        cursor: 'pointer'
      },
      checked,
      title: 'Toggle Row Selected',
      indeterminate: row.isSomeSelected
    }
  ]
}

const defaultGetToggleAllRowsSelectedProps = (props, { instance }) => [
  props,
  {
    onChange: e => {
      instance.toggleAllRowsSelected(e.target.checked)
    },
    style: {
      cursor: 'pointer'
    },
    checked: instance.isAllRowsSelected,
    title: 'Toggle All Rows Selected',
    indeterminate: Boolean(
      !instance.isAllRowsSelected &&
        (instance.state.selectAllRows || Object.keys(instance.state.selectedRowIds).length)
    )
  }
]

const defaultGetToggleAllPageRowsSelectedProps = (props, { instance }) => [
  props,
  {
    onChange(e) {
      instance.toggleAllPageRowsSelected(e.target.checked)
    },
    style: {
      cursor: 'pointer'
    },
    checked: instance.isAllPageRowsSelected,
    title: 'Toggle All Current Page Rows Selected',
    indeterminate: Boolean(
      !instance.isAllPageRowsSelected &&
        instance.page.some(({ id }) => instance.state.selectedRowIds[id])
    )
  }
]

function reducer(state, action, previousState, instance) {
  if (action.type === actions.init) {
    return {
      selectedRowIds: {},
      selectAllRows: false,
      deselectedRowIds: {},
      ...state
    }
  }

  if (action.type === actions.resetSelectedRows) {
    return {
      ...state,
      selectedRowIds: instance.initialState.selectedRowIds || {},
      selectAllRows: false,
      deselectedRowIds: {}
    }
  }

  if (action.type === actions.toggleAllRowsSelected) {
    const { value: setSelected } = action
    const {
      isAllRowsSelected,
      rowsById,
      nonGroupedRowsById = rowsById,
      manualPagination
    } = instance

    const selectAll = typeof setSelected !== 'undefined' ? setSelected : !isAllRowsSelected

    // In backend mode, use inverted selection model: track "all selected" flag and exceptions,
    // rather than enumerating all row IDs (which aren't all loaded).
    if (manualPagination) {
      if (selectAll) {
        return {
          ...state,
          selectAllRows: true,
          deselectedRowIds: {},
          selectedRowIds: {}
        }
      } else {
        return {
          ...state,
          selectAllRows: false,
          deselectedRowIds: {},
          selectedRowIds: {}
        }
      }
    }

    // Client-side: enumerate visible rows (existing behavior)
    // Only remove/add the rows that are visible on the screen
    //  Leave all the other rows that are selected alone.
    const selectedRowIds = Object.assign({}, state.selectedRowIds)

    if (selectAll) {
      Object.keys(nonGroupedRowsById).forEach(rowId => {
        selectedRowIds[rowId] = true
      })
    } else {
      Object.keys(nonGroupedRowsById).forEach(rowId => {
        delete selectedRowIds[rowId]
      })
    }

    return {
      ...state,
      selectedRowIds
    }
  }

  if (action.type === actions.toggleRowSelected) {
    const { id, value: setSelected } = action
    const { rowsById, selectSubRows = true } = instance

    // In inverted (select-all) mode, toggle in the deselected set
    if (state.selectAllRows) {
      const isDeselected = Boolean(state.deselectedRowIds[id])
      const shouldBeSelected = typeof setSelected !== 'undefined' ? setSelected : isDeselected

      if (shouldBeSelected === !isDeselected) {
        return state
      }

      const newDeselectedRowIds = { ...state.deselectedRowIds }

      const handleRowById = id => {
        const row = rowsById[id]
        if (!row || !row.isGrouped) {
          if (shouldBeSelected) {
            delete newDeselectedRowIds[id]
          } else {
            newDeselectedRowIds[id] = true
          }
        }

        if (selectSubRows && row && row.subRows) {
          row.subRows.forEach(row => handleRowById(row.id))
        }
      }

      handleRowById(id)

      return {
        ...state,
        deselectedRowIds: newDeselectedRowIds
      }
    }

    // Normal mode: existing behavior
    const isSelected = state.selectedRowIds[id]
    const shouldExist = typeof setSelected !== 'undefined' ? setSelected : !isSelected

    if (isSelected === shouldExist) {
      return state
    }

    const newSelectedRowIds = { ...state.selectedRowIds }

    const handleRowById = id => {
      const row = rowsById[id]
      if (!row.isGrouped) {
        if (shouldExist) {
          newSelectedRowIds[id] = true
        } else {
          delete newSelectedRowIds[id]
        }
      }

      if (selectSubRows && row.subRows) {
        return row.subRows.forEach(row => handleRowById(row.id))
      }
    }

    handleRowById(id)

    return {
      ...state,
      selectedRowIds: newSelectedRowIds
    }
  }

  if (action.type === actions.toggleAllPageRowsSelected) {
    const { value: setSelected } = action
    const { page, rowsById, selectSubRows = true, isAllPageRowsSelected } = instance

    const selectAll = typeof setSelected !== 'undefined' ? setSelected : !isAllPageRowsSelected

    const newSelectedRowIds = { ...state.selectedRowIds }

    const handleRowById = id => {
      const row = rowsById[id]

      if (!row.isGrouped) {
        if (selectAll) {
          newSelectedRowIds[id] = true
        } else {
          delete newSelectedRowIds[id]
        }
      }

      if (selectSubRows && row.subRows) {
        return row.subRows.forEach(row => handleRowById(row.id))
      }
    }

    page.forEach(row => handleRowById(row.id))

    return {
      ...state,
      selectedRowIds: newSelectedRowIds
    }
  }

  if (action.type === actions.setRowsSelected) {
    const { ids: setSelected } = action
    const { rowsById, selectSubRows = true } = instance

    const newSelectedRowIds = {}

    const handleRowById = id => {
      const row = rowsById[id]

      // Select a filtered or (less likely) invalid row (rowsById only contains visible rows).
      if (!row) {
        newSelectedRowIds[id] = true
        return
      }

      if (!row.isGrouped) {
        newSelectedRowIds[id] = true
      }

      if (selectSubRows && row.subRows) {
        return row.subRows.forEach(row => handleRowById(row.id))
      }
    }

    setSelected.forEach(rowId => handleRowById(rowId))

    return {
      ...state,
      selectedRowIds: newSelectedRowIds,
      selectAllRows: false,
      deselectedRowIds: {}
    }
  }
  return state
}

function useInstance(instance) {
  const {
    data,
    rows,
    getHooks,
    plugins,
    rowsById,
    nonGroupedRowsById = rowsById,
    autoResetSelectedRows = true,
    state: { selectedRowIds, selectAllRows, deselectedRowIds },
    selectSubRows = true,
    dispatch,
    page
  } = instance

  ensurePluginOrder(
    plugins,
    ['useFilters', 'useGroupBy', 'useSortBy', 'useExpanded', 'usePagination'],
    'useRowSelect'
  )

  const selectedFlatRows = React.useMemo(() => {
    const selectedFlatRows = []

    // Ensure row.isSelected is set for sub rows when paginateExpandedRows = false
    // https://github.com/TanStack/react-table/issues/2908
    const handleRow = row => {
      let isSelected
      if (selectAllRows) {
        // Inverted mode: all non-grouped rows are selected unless in deselectedRowIds
        isSelected = row.isGrouped ? false : !deselectedRowIds[row.id]
      } else {
        isSelected = selectSubRows
          ? getRowIsSelected(row, selectedRowIds)
          : Boolean(selectedRowIds[row.id])
      }
      row.isSelected = Boolean(isSelected)
      row.isSomeSelected = isSelected === null

      if (isSelected) {
        selectedFlatRows.push(row)
      }

      if (row.subRows && row.subRows.length) {
        row.subRows.forEach(row => handleRow(row))
      }
    }

    rows.forEach(row => handleRow(row))

    return selectedFlatRows
  }, [rows, selectSubRows, selectedRowIds, selectAllRows, deselectedRowIds])

  let isAllRowsSelected

  if (selectAllRows) {
    // Inverted mode: all selected unless there are deselected rows
    isAllRowsSelected = Object.keys(deselectedRowIds).length === 0
  } else {
    isAllRowsSelected = Boolean(
      Object.keys(nonGroupedRowsById).length && Object.keys(selectedRowIds).length
    )

    if (isAllRowsSelected) {
      if (Object.keys(nonGroupedRowsById).some(id => !selectedRowIds[id])) {
        isAllRowsSelected = false
      }
    }
  }

  let isAllPageRowsSelected = isAllRowsSelected

  if (!isAllRowsSelected) {
    if (selectAllRows) {
      // Inverted mode: page is fully selected if no page rows are deselected
      isAllPageRowsSelected =
        page && page.length > 0 && !page.some(({ id }) => deselectedRowIds[id])
    } else if (page && page.length && page.some(({ id }) => !selectedRowIds[id])) {
      isAllPageRowsSelected = false
    }
  }

  const getAutoResetSelectedRows = useGetLatest(autoResetSelectedRows)

  useMountedLayoutEffect(() => {
    if (getAutoResetSelectedRows()) {
      dispatch({ type: actions.resetSelectedRows })
    }
  }, [dispatch, data])

  const toggleAllRowsSelected = React.useCallback(
    value => dispatch({ type: actions.toggleAllRowsSelected, value }),
    [dispatch]
  )

  const toggleAllPageRowsSelected = React.useCallback(
    value => dispatch({ type: actions.toggleAllPageRowsSelected, value }),
    [dispatch]
  )

  const toggleRowSelected = React.useCallback(
    (id, value) => dispatch({ type: actions.toggleRowSelected, id, value }),
    [dispatch]
  )

  const setRowsSelected = React.useCallback(
    ids => dispatch({ type: actions.setRowsSelected, ids }),
    [dispatch]
  )

  const getInstance = useGetLatest(instance)

  const getToggleAllRowsSelectedProps = makePropGetter(getHooks().getToggleAllRowsSelectedProps, {
    instance: getInstance()
  })

  const getToggleAllPageRowsSelectedProps = makePropGetter(
    getHooks().getToggleAllPageRowsSelectedProps,
    { instance: getInstance() }
  )

  Object.assign(instance, {
    selectedFlatRows,
    isAllRowsSelected,
    isAllPageRowsSelected,
    toggleRowSelected,
    toggleAllRowsSelected,
    setRowsSelected,
    getToggleAllRowsSelectedProps,
    getToggleAllPageRowsSelectedProps,
    toggleAllPageRowsSelected
  })
}

function prepareRow(row, { instance }) {
  row.toggleRowSelected = set => instance.toggleRowSelected(row.id, set)

  row.getToggleRowSelectedProps = makePropGetter(instance.getHooks().getToggleRowSelectedProps, {
    instance: instance,
    row
  })
}

function getRowIsSelected(row, selectedRowIds) {
  if (selectedRowIds[row.id]) {
    return true
  }

  const subRows = row.subRows

  if (subRows && subRows.length) {
    let allChildrenSelected = true
    let someSelected = false

    // TODO: For server-side pagination, if sub rows are paginated, there's no way to know
    // whether all sub rows are selected if not present on the page. Row selection needs
    // to be fully server-side, so this is a temporary workaround to prevent grouped
    // rows from always appearing as selected.
    const availableSubRows = subRows.filter(row => row != null)
    if (availableSubRows.length !== subRows.length) {
      return false
    }

    subRows.forEach(subRow => {
      // Bail out early if we know both of these
      if (someSelected && !allChildrenSelected) {
        return
      }

      if (getRowIsSelected(subRow, selectedRowIds)) {
        someSelected = true
      } else {
        allChildrenSelected = false
      }
    })
    return allChildrenSelected ? true : someSelected ? null : false
  }

  return false
}
