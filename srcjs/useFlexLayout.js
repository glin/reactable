// useFlexLayout modified to:
// - Fix flex widths when resizing is disabled (don't use column.totalFlexWidth)
// - Support resizing to actual min and max column widths (not flex widths)
// - Set min width on thead/tbody/tfoot instead of table for responsive, horizontal scrolling
// - Include resized widths in table min width to prevent glitches with sticky headers/footers
// - Exclude redundant styles

import { useGetLatest, makePropGetter } from 'react-table'

export default function useFlexLayout(hooks) {
  hooks.getTableBodyProps.push(getRowGroupStyles)
  hooks.getRowProps.push(getRowStyles)
  hooks.getHeaderGroupProps.push(getRowStyles)
  hooks.getFooterGroupProps.push(getRowStyles)
  hooks.getHeaderProps.push(getHeaderProps)
  hooks.getCellProps.push(getCellProps)
  hooks.getFooterProps.push(getFooterProps)
  hooks.useInstance.push(useInstance)
}

useFlexLayout.pluginName = 'useFlexLayout'

// Set min-width for thead and tfoot. Include resized widths in min width
// (using totalColumnsWidth over totalColumnsMinWidth) so cells don't overlap
// with sticky headers and footers when the total resized width is greater than
// the total min width.
const getRowGroupStyles = (props, { instance }) => {
  return [
    props,
    {
      style: {
        minWidth: asPx(instance.totalColumnsWidth)
      }
    }
  ]
}

const getRowStyles = (props, { instance }) => {
  return [
    props,
    {
      style: {
        flex: '1 0 auto',
        minWidth: asPx(instance.totalColumnsWidth)
      }
    }
  ]
}

const getHeaderProps = (props, { column }) => {
  // Don't set max width if MAX_SAFE_INTEGER (the default for column.maxWidth)
  const maxWidth = column.totalMaxWidth < Number.MAX_SAFE_INTEGER ? column.totalMaxWidth : null
  return [
    props,
    {
      style: {
        flex: `${column.flexWidth} 0 auto`,
        minWidth: asPx(column.totalMinWidth),
        width: asPx(column.totalWidth),
        maxWidth: asPx(maxWidth)
      }
    }
  ]
}

const getCellProps = (props, { cell }) => {
  const maxWidth =
    cell.column.totalMaxWidth < Number.MAX_SAFE_INTEGER ? cell.column.totalMaxWidth : null
  return [
    props,
    {
      style: {
        flex: `${cell.column.flexWidth} 0 auto`,
        minWidth: asPx(cell.column.totalMinWidth),
        width: asPx(cell.column.totalWidth),
        maxWidth: asPx(maxWidth)
      }
    }
  ]
}

const getFooterProps = (props, { column }) => {
  const maxWidth = column.totalMaxWidth < Number.MAX_SAFE_INTEGER ? column.totalMaxWidth : null
  return [
    props,
    {
      style: {
        flex: `${column.flexWidth} 0 auto`,
        minWidth: asPx(column.totalMinWidth),
        width: asPx(column.totalWidth),
        maxWidth: asPx(maxWidth)
      }
    }
  ]
}

function useInstance(instance) {
  const { headers, state } = instance

  const resizedWidths = state.columnResizing.columnWidths

  // Manually calculate flex widths instead of using column.totalFlexWidth
  function calculateFlexWidths(columns) {
    let totalFlexWidth = 0
    columns.forEach(column => {
      if (column.headers) {
        column.flexWidth = calculateFlexWidths(column.headers)
      } else {
        // If the column has been resized or has fixed width, flex width = 0.
        // Otherwise, flex width = min width.
        if (resizedWidths[column.id] != null) {
          column.flexWidth = 0
        } else {
          const isFixedWidth = column.totalMinWidth === column.totalMaxWidth
          column.flexWidth = isFixedWidth ? 0 : column.totalMinWidth
        }
      }
      totalFlexWidth += column.flexWidth
    })
    return totalFlexWidth
  }

  calculateFlexWidths(headers)

  const getInstance = useGetLatest(instance)
  const getTheadProps = makePropGetter(getRowGroupStyles, { instance: getInstance() })
  const getTfootProps = makePropGetter(getRowGroupStyles, { instance: getInstance() })

  Object.assign(instance, {
    getTheadProps,
    getTfootProps
  })
}

function asPx(value) {
  return typeof value === 'number' ? `${value}px` : undefined
}
