import { ensurePluginOrder } from 'react-table'

import { getLeafColumns } from './utils'

export default function useStickyColumns(hooks) {
  hooks.getHeaderProps.push(getHeaderProps)
  hooks.getCellProps.push(getCellProps)
  hooks.getFooterProps.push(getFooterProps)
  hooks.useInstance.push(useInstance)
}

useStickyColumns.pluginName = 'useStickyColumns'

const getHeaderProps = (props, { column }) => {
  if (!column.stickyProps) {
    return props
  }
  return [props, column.stickyProps]
}

const getCellProps = (props, { cell }) => {
  if (!cell.column.stickyProps) {
    return props
  }
  return [props, cell.column.stickyProps]
}

const getFooterProps = (props, { column }) => {
  if (!column.stickyProps) {
    return props
  }
  return [props, column.stickyProps]
}

const getStickyProps = (column, columns) => {
  const props = {
    className: 'rt-sticky',
    style: {
      position: 'sticky'
    }
  }
  if (column.sticky === 'left') {
    const stickyCols = columns.filter(col => col.sticky === 'left')
    props.style.left = 0
    for (let col of stickyCols) {
      if (col.id === column.id) break
      props.style.left += col.totalWidth
    }
  } else if (column.sticky === 'right') {
    const stickyCols = columns.filter(col => col.sticky === 'right')
    props.style.right = 0
    for (let col of stickyCols.reverse()) {
      if (col.id === column.id) break
      props.style.right += col.totalWidth
    }
  }
  return props
}

function useInstance(instance) {
  const { plugins, headerGroups } = instance

  ensurePluginOrder(plugins, ['useResizeColumns'], 'useStickyColumns')

  headerGroups.forEach(headerGroup => {
    const columns = headerGroup.headers

    // Ensure all columns in the group have the same sticky property.
    // If any sticky properties in the group differ, the first sticky column's
    // property is used for the whole group.
    columns.forEach(column => {
      const groupColumns = [column]
      if (column.columns) {
        groupColumns.push(...getLeafColumns(column))
      }
      const firstStickyCol = groupColumns.find(col => col.sticky)
      if (firstStickyCol) {
        groupColumns.forEach(col => {
          col.sticky = firstStickyCol.sticky
        })
      }
    })

    columns.forEach(column => {
      if (column.sticky) {
        column.stickyProps = getStickyProps(column, columns)
      }
    })
  })
}
