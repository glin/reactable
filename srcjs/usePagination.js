// usePagination modified to:
// - Allow pagination to be disabled. This makes it easier to use the hook
//   conditionally while keeping pagination functionality intact (e.g., the
//   pagination bar and API can still be used when pagination is disabled).
// - Provide instance.pageRowCount for the number of paginated rows on the
//   page, excluding expanded rows when paginateExpandedRows = false.

import React from 'react'
import {
  actions,
  ensurePluginOrder,
  functionalUpdate,
  useMountedLayoutEffect,
  useGetLatest
} from 'react-table'

const pluginName = 'usePagination'

// Actions
actions.resetPage = 'resetPage'
actions.gotoPage = 'gotoPage'
actions.setPageSize = 'setPageSize'

export default function usePagination(hooks) {
  hooks.stateReducers.push(reducer)
  hooks.useInstance.push(useInstance)
}

usePagination.pluginName = pluginName

function reducer(state, action, previousState, instance) {
  if (action.type === actions.init) {
    return {
      pageSize: 10,
      pageIndex: 0,
      ...state
    }
  }

  if (action.type === actions.resetPage) {
    return {
      ...state,
      pageIndex: instance.initialState.pageIndex || 0
    }
  }

  if (action.type === actions.gotoPage) {
    const { pageCount, page } = instance
    const newPageIndex = functionalUpdate(action.pageIndex, state.pageIndex)
    let canNavigate = false

    if (newPageIndex > state.pageIndex) {
      // next page
      canNavigate = pageCount === -1 ? page.length >= state.pageSize : newPageIndex < pageCount
    } else if (newPageIndex < state.pageIndex) {
      // prev page
      canNavigate = newPageIndex > -1
    }

    if (!canNavigate) {
      return state
    }

    return {
      ...state,
      pageIndex: newPageIndex
    }
  }

  if (action.type === actions.setPageSize) {
    const { pageSize } = action
    const topRowIndex = state.pageSize * state.pageIndex
    const pageIndex = Math.floor(topRowIndex / pageSize)

    return {
      ...state,
      pageIndex,
      pageSize
    }
  }
}

function useInstance(instance) {
  const {
    rows,
    autoResetPage = true,
    manualExpandedKey = 'expanded',
    plugins,
    pagination = true,
    pageCount: userPageCount,
    paginateExpandedRows = true,
    expandSubRows = true,
    state: { pageIndex, expanded, globalFilter, filters, groupBy, sortBy },
    dispatch,
    data,
    manualPagination
  } = instance

  ensurePluginOrder(
    plugins,
    ['useGlobalFilter', 'useFilters', 'useGroupBy', 'useSortBy', 'useExpanded'],
    'usePagination'
  )

  const getAutoResetPage = useGetLatest(autoResetPage)

  useMountedLayoutEffect(() => {
    if (getAutoResetPage()) {
      dispatch({ type: actions.resetPage })
    }
  }, [dispatch, manualPagination ? null : data, globalFilter, filters, groupBy, sortBy])

  // Disabling pagination effectively means always having a page count of 1.
  // This should be done in the hook because the row count isn't known until
  // other row-manipulating hooks have run (e.g., useGroupBy).
  const pageSize = pagination ? instance.state.pageSize : rows.length

  const pageCount = manualPagination ? userPageCount : Math.ceil(rows.length / pageSize)

  const pageOptions = React.useMemo(
    () => (pageCount > 0 ? [...new Array(pageCount)].fill(null).map((d, i) => i) : []),
    [pageCount]
  )

  const [page, pageRowCount] = React.useMemo(() => {
    let page

    if (manualPagination) {
      page = rows
    } else {
      const pageStart = pageSize * pageIndex
      const pageEnd = pageStart + pageSize

      page = rows.slice(pageStart, pageEnd)
    }

    const pageRowCount = page.length

    if (paginateExpandedRows) {
      return [page, pageRowCount]
    }

    return [expandRows(page, { manualExpandedKey, expanded, expandSubRows }), pageRowCount]
  }, [
    expandSubRows,
    expanded,
    manualExpandedKey,
    manualPagination,
    pageIndex,
    pageSize,
    paginateExpandedRows,
    rows
  ])

  const canPreviousPage = pageIndex > 0
  const canNextPage = pageCount === -1 ? page.length >= pageSize : pageIndex < pageCount - 1

  const gotoPage = React.useCallback(
    pageIndex => {
      dispatch({ type: actions.gotoPage, pageIndex })
    },
    [dispatch]
  )

  const previousPage = React.useCallback(() => {
    return gotoPage(old => old - 1)
  }, [gotoPage])

  const nextPage = React.useCallback(() => {
    return gotoPage(old => old + 1)
  }, [gotoPage])

  const setPageSize = React.useCallback(
    pageSize => {
      dispatch({ type: actions.setPageSize, pageSize })
    },
    [dispatch]
  )

  Object.assign(instance, {
    pageOptions,
    pageCount,
    page,
    pageRowCount,
    canPreviousPage,
    canNextPage,
    gotoPage,
    previousPage,
    nextPage,
    setPageSize
  })
}

function expandRows(rows, { manualExpandedKey, expanded, expandSubRows = true }) {
  const expandedRows = []

  const handleRow = (row, addToExpandedRows = true) => {
    row.isExpanded = (row.original && row.original[manualExpandedKey]) || expanded[row.id]

    row.canExpand = row.subRows && !!row.subRows.length

    if (addToExpandedRows) {
      expandedRows.push(row)
    }

    if (row.subRows && row.subRows.length && row.isExpanded) {
      row.subRows.forEach(row => handleRow(row, expandSubRows))
    }
  }

  rows.forEach(row => handleRow(row))

  return expandedRows
}
