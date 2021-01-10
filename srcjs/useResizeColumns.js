// useResizeColumns modified to:
// - Resize based on actual DOM width of column, like in v6. Requires a
//   getDOMWidth() method to be defined on each column header and header group.
// - Clean up touchend listeners properly (https://github.com/tannerlinsley/react-table/issues/2622)

import React from 'react'
import {
  actions,
  defaultColumn,
  makePropGetter,
  ensurePluginOrder,
  useMountedLayoutEffect,
  useGetLatest
} from 'react-table'

import { getFirstDefined } from './utils'

let passiveSupported = null
function passiveEventSupported() {
  // memoize support to avoid adding multiple test events
  if (typeof passiveSupported === 'boolean') return passiveSupported

  let supported = false
  try {
    const options = {
      get passive() {
        supported = true
        return false
      }
    }

    window.addEventListener('test', null, options)
    window.removeEventListener('test', null, options)
  } catch (err) {
    supported = false
  }
  passiveSupported = supported
  return passiveSupported
}

// Default Column
defaultColumn.canResize = true

// Actions
actions.columnStartResizing = 'columnStartResizing'
actions.columnResizing = 'columnResizing'
actions.columnDoneResizing = 'columnDoneResizing'
actions.resetResize = 'resetResize'

export default function useResizeColumns(hooks) {
  hooks.getResizerProps = [defaultGetResizerProps]
  hooks.getHeaderProps.push({
    style: {
      position: 'relative'
    }
  })
  hooks.stateReducers.push(reducer)
  hooks.useInstance.push(useInstance)
  hooks.useInstanceBeforeDimensions.push(useInstanceBeforeDimensions)
}

const defaultGetResizerProps = (props, { instance, header }) => {
  const { dispatch } = instance

  const onResizeStart = (e, header) => {
    let isTouchEvent = false
    if (e.type === 'touchstart') {
      // lets not respond to multiple touches (e.g. 2 or 3 fingers)
      if (e.touches && e.touches.length > 1) {
        return
      }
      isTouchEvent = true
    }
    const headersToResize = getAllColumns(header)
    const headerIdWidths = headersToResize.map(d => [d.id, d.getDOMWidth()])
    const columnWidth = headerIdWidths.find(([id]) => id === header.id)[1]

    const clientX = isTouchEvent ? Math.round(e.touches[0].clientX) : e.clientX

    const dispatchMove = clientXPos => {
      dispatch({ type: actions.columnResizing, clientX: clientXPos })
    }
    const dispatchEnd = () => dispatch({ type: actions.columnDoneResizing })

    const handlersAndEvents = {
      mouse: {
        moveEvent: 'mousemove',
        moveHandler: e => dispatchMove(e.clientX),
        upEvent: 'mouseup',
        upHandler: () => {
          document.removeEventListener('mousemove', handlersAndEvents.mouse.moveHandler)
          document.removeEventListener('mouseup', handlersAndEvents.mouse.upHandler)
          dispatchEnd()
        }
      },
      touch: {
        moveEvent: 'touchmove',
        moveHandler: e => {
          if (e.cancelable) {
            e.preventDefault()
            e.stopPropagation()
          }
          dispatchMove(e.touches[0].clientX)
          return false
        },
        upEvent: 'touchend',
        upHandler: () => {
          document.removeEventListener(
            handlersAndEvents.touch.moveEvent,
            handlersAndEvents.touch.moveHandler
          )
          document.removeEventListener(
            handlersAndEvents.touch.upEvent,
            handlersAndEvents.touch.upHandler
          )
          dispatchEnd()
        }
      }
    }

    const events = isTouchEvent ? handlersAndEvents.touch : handlersAndEvents.mouse
    const passiveIfSupported = passiveEventSupported() ? { passive: false } : false
    document.addEventListener(events.moveEvent, events.moveHandler, passiveIfSupported)
    document.addEventListener(events.upEvent, events.upHandler, passiveIfSupported)

    dispatch({
      type: actions.columnStartResizing,
      columnId: header.id,
      columnWidth,
      headerIdWidths,
      clientX
    })
  }

  return [
    props,
    {
      onMouseDown: e => e.persist() || onResizeStart(e, header),
      onTouchStart: e => e.persist() || onResizeStart(e, header),
      style: {
        cursor: 'col-resize'
      },
      draggable: false,
      role: 'separator'
    }
  ]
}

useResizeColumns.pluginName = 'useResizeColumns'

function reducer(state, action) {
  if (action.type === actions.init) {
    return {
      columnResizing: {
        columnWidths: {}
      },
      ...state
    }
  }

  if (action.type === actions.resetResize) {
    return {
      ...state,
      columnResizing: {
        columnWidths: {}
      }
    }
  }

  if (action.type === actions.columnStartResizing) {
    const { clientX, columnId, columnWidth, headerIdWidths } = action

    return {
      ...state,
      columnResizing: {
        ...state.columnResizing,
        startX: clientX,
        headerIdWidths,
        columnWidth,
        isResizingColumn: columnId
      }
    }
  }

  if (action.type === actions.columnResizing) {
    const { clientX } = action
    const { startX, columnWidth, headerIdWidths = [] } = state.columnResizing

    const deltaX = clientX - startX
    const percentageDeltaX = deltaX / columnWidth

    const newColumnWidths = {}

    headerIdWidths.forEach(([headerId, headerWidth]) => {
      newColumnWidths[headerId] = Math.max(headerWidth + headerWidth * percentageDeltaX, 0)
    })

    return {
      ...state,
      columnResizing: {
        ...state.columnResizing,
        columnWidths: {
          ...state.columnResizing.columnWidths,
          ...newColumnWidths
        }
      }
    }
  }

  if (action.type === actions.columnDoneResizing) {
    return {
      ...state,
      columnResizing: {
        ...state.columnResizing,
        startX: null,
        isResizingColumn: null
      }
    }
  }
}

const useInstanceBeforeDimensions = instance => {
  const {
    flatHeaders,
    disableResizing,
    getHooks,
    state: { columnResizing }
  } = instance

  const getInstance = useGetLatest(instance)

  flatHeaders.forEach(header => {
    const canResize = getFirstDefined(
      header.disableResizing === true ? false : undefined,
      disableResizing === true ? false : undefined,
      true
    )

    header.canResize = canResize
    header.width = getFirstDefined(
      columnResizing.columnWidths[header.id],
      header.originalWidth,
      header.width
    )
    header.isResizing = columnResizing.isResizingColumn === header.id

    if (canResize) {
      header.getResizerProps = makePropGetter(getHooks().getResizerProps, {
        instance: getInstance(),
        header
      })
    }
  })
}

function useInstance(instance) {
  const { plugins, dispatch, autoResetResize = true, columns } = instance

  ensurePluginOrder(plugins, ['useAbsoluteLayout'], 'useResizeColumns')

  const getAutoResetResize = useGetLatest(autoResetResize)
  useMountedLayoutEffect(() => {
    if (getAutoResetResize()) {
      dispatch({ type: actions.resetResize })
    }
  }, [columns])

  const resetResizing = React.useCallback(() => dispatch({ type: actions.resetResize }), [dispatch])

  Object.assign(instance, {
    resetResizing
  })
}

function getAllColumns(column) {
  const allColumns = []
  const recurseColumn = column => {
    if (column.columns && column.columns.length) {
      column.columns.forEach(recurseColumn)
    }
    allColumns.push(column)
  }
  recurseColumn(column)
  return allColumns
}
