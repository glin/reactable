// useGroupBy hook modified to:
// - Pass row objects and aggregated row objects to aggregate functions
// - Include groupBy columns in aggregations
// - Set nesting depth for leaf rows
// - Omit row index properties on aggregated rows

import React from 'react'
import {
  actions,
  makePropGetter,
  ensurePluginOrder,
  useMountedLayoutEffect,
  useGetLatest
} from 'react-table'

import { getFirstDefined } from './utils'

// Not using any built-in aggregations
const aggregations = {}

const emptyArray = []
const emptyObject = {}

// Actions
actions.resetGroupBy = 'resetGroupBy'
actions.setGroupBy = 'setGroupBy'
actions.toggleGroupBy = 'toggleGroupBy'

export default function useGroupBy(hooks) {
  hooks.getGroupByToggleProps = [defaultGetGroupByToggleProps]
  hooks.stateReducers.push(reducer)
  hooks.visibleColumnsDeps.push((deps, { instance }) => [...deps, instance.state.groupBy])
  hooks.visibleColumns.push(visibleColumns)
  hooks.useInstance.push(useInstance)
  hooks.prepareRow.push(prepareRow)
}

useGroupBy.pluginName = 'useGroupBy'

const defaultGetGroupByToggleProps = (props, { header }) => [
  props,
  {
    onClick: header.canGroupBy
      ? e => {
          e.persist()
          header.toggleGroupBy()
        }
      : undefined,
    style: {
      cursor: header.canGroupBy ? 'pointer' : undefined
    },
    title: 'Toggle GroupBy'
  }
]

// Reducer
function reducer(state, action, previousState, instance) {
  if (action.type === actions.init) {
    return {
      groupBy: [],
      ...state
    }
  }

  if (action.type === actions.resetGroupBy) {
    return {
      ...state,
      groupBy: instance.initialState.groupBy || []
    }
  }

  if (action.type === actions.setGroupBy) {
    const { value } = action
    return {
      ...state,
      groupBy: value
    }
  }

  if (action.type === actions.toggleGroupBy) {
    const { columnId, value: setGroupBy } = action

    const resolvedGroupBy =
      typeof setGroupBy !== 'undefined' ? setGroupBy : !state.groupBy.includes(columnId)

    if (resolvedGroupBy) {
      return {
        ...state,
        groupBy: [...state.groupBy, columnId]
      }
    }

    return {
      ...state,
      groupBy: state.groupBy.filter(d => d !== columnId)
    }
  }
}

function visibleColumns(
  columns,
  {
    instance: {
      state: { groupBy }
    }
  }
) {
  // Sort grouped columns to the start of the column list
  // before the headers are built

  const groupByColumns = groupBy.map(g => columns.find(col => col.id === g)).filter(Boolean)

  const nonGroupByColumns = columns.filter(col => !groupBy.includes(col.id))

  columns = [...groupByColumns, ...nonGroupByColumns]

  columns.forEach(column => {
    column.isGrouped = groupBy.includes(column.id)
    column.groupedIndex = groupBy.indexOf(column.id)
  })

  return columns
}

const defaultUserAggregations = {}

function useInstance(instance) {
  const {
    data,
    rows,
    flatRows,
    rowsById,
    allColumns,
    flatHeaders,
    groupByFn = defaultGroupByFn,
    manualGroupBy,
    aggregations: userAggregations = defaultUserAggregations,
    plugins,
    state: { groupBy },
    dispatch,
    autoResetGroupBy = true,
    disableGroupBy,
    defaultCanGroupBy,
    getHooks
  } = instance

  ensurePluginOrder(plugins, ['useColumnOrder', 'useFilters'], 'useGroupBy')

  const getInstance = useGetLatest(instance)

  allColumns.forEach(column => {
    const {
      accessor,
      defaultGroupBy: defaultColumnGroupBy,
      disableGroupBy: columnDisableGroupBy
    } = column

    column.canGroupBy = accessor
      ? getFirstDefined(
          column.canGroupBy,
          columnDisableGroupBy === true ? false : undefined,
          disableGroupBy === true ? false : undefined,
          true
        )
      : getFirstDefined(column.canGroupBy, defaultColumnGroupBy, defaultCanGroupBy, false)

    if (column.canGroupBy) {
      column.toggleGroupBy = () => instance.toggleGroupBy(column.id)
    }

    column.Aggregated = column.Aggregated || column.Cell
  })

  const toggleGroupBy = React.useCallback(
    (columnId, value) => {
      dispatch({ type: actions.toggleGroupBy, columnId, value })
    },
    [dispatch]
  )

  const setGroupBy = React.useCallback(
    value => {
      dispatch({ type: actions.setGroupBy, value })
    },
    [dispatch]
  )

  flatHeaders.forEach(header => {
    header.getGroupByToggleProps = makePropGetter(getHooks().getGroupByToggleProps, {
      instance: getInstance(),
      header
    })
  })

  const [
    groupedRows,
    groupedFlatRows,
    groupedRowsById,
    onlyGroupedFlatRows,
    onlyGroupedRowsById,
    nonGroupedFlatRows,
    nonGroupedRowsById
  ] = React.useMemo(() => {
    if (groupBy.length === 0) {
      return [rows, flatRows, rowsById, emptyArray, emptyObject, flatRows, rowsById]
    }

    if (manualGroupBy) {
      // Ensure that the list of filtered columns exist
      const existingGroupBy = groupBy.filter(g => allColumns.find(col => col.id === g))

      // Derive grouping props in each row that aren't present in manually grouped data.
      // Note that this excludes groupByVal and leafRows.
      const setGroupingProps = (rows, depth = 0) => {
        // Set nesting depth
        rows.forEach(row => {
          row.depth = depth
        })

        // Last level - these are leaf rows
        if (depth === existingGroupBy.length) {
          return
        }

        const columnId = existingGroupBy[depth]

        // Find the columns that can be aggregated, including any columns in groupBy.
        // groupBy columns that aren't in the row's group are allowed to be aggregated.
        const groupedColumns = existingGroupBy.slice(0, depth + 1)
        const aggregatedColumns = allColumns
          .filter(col => !groupedColumns.includes(col.id))
          .map(col => col.id)

        rows.forEach(row => {
          if (!row.isGrouped) {
            return
          }

          // Required but unset: row.groupByID, row.isGrouped
          row.groupByID = columnId
          // All columns that can be aggregated (including groupBy columns)
          row.aggregatedColumns = aggregatedColumns
          setGroupingProps(row.subRows, depth + 1)
        })
      }

      const flatRows = rows.filter(row => row.parentId == null)
      setGroupingProps(flatRows)

      return [rows, flatRows, rowsById, emptyArray, emptyObject, flatRows, rowsById]
    }

    // Ensure that the list of filtered columns exist
    const existingGroupBy = groupBy.filter(g => allColumns.find(col => col.id === g))

    // Find the columns that can or are aggregating
    // Uses each column to aggregate rows into a single value
    const aggregateRowsToValues = (leafRows, groupedRows, depth, aggregatedColumns) => {
      const values = {}

      allColumns.forEach(column => {
        // Only aggregate columns that aren't being grouped. Originally, all groupBy
        // columns were excluded, but now, groupBy columns not in the row's group
        // may be aggregated.
        if (!aggregatedColumns.includes(column.id)) {
          // Set placeholder values
          values[column.id] = groupedRows[0] ? groupedRows[0].values[column.id] : null
          return
        }

        // Get the columnValues to aggregate (no longer used)
        // const groupedValues = groupedRows.map(row => row.values[column.id])

        // Aggregate the values
        let aggregateFn =
          typeof column.aggregate === 'function'
            ? column.aggregate
            : userAggregations[column.aggregate] || aggregations[column.aggregate]

        if (aggregateFn) {
          // Get the columnValues to aggregate
          const leafValues = leafRows.map(row => {
            let columnValue = row.values[column.id]

            if (!depth && column.aggregateValue) {
              const aggregateValueFn =
                typeof column.aggregateValue === 'function'
                  ? column.aggregateValue
                  : userAggregations[column.aggregateValue] || aggregations[column.aggregateValue]

              if (!aggregateValueFn) {
                console.info({ column })
                throw new Error(
                  `React Table: Invalid column.aggregateValue option for column listed above`
                )
              }

              columnValue = aggregateValueFn(columnValue, row, column)
            }
            return columnValue
          })

          // Originally, the leafValues and groupedValues were passed to the aggregate function.
          // Now, the aggregate function takes:
          // - leafValues: flattened array of values in the column
          // - leafRows: flattened array of rows in the column (for v6 compatibility)
          // - groupedRows: array of aggregated rows in the column
          values[column.id] = aggregateFn(
            leafValues,
            leafRows.map(row => row.values),
            groupedRows.map(row => row.values)
          )
        } else if (column.aggregate) {
          console.info({ column })
          throw new Error(`React Table: Invalid column.aggregate option for column listed above`)
        } else {
          values[column.id] = null
        }
      })

      return values
    }

    let groupedFlatRows = []
    const groupedRowsById = {}
    const onlyGroupedFlatRows = []
    const onlyGroupedRowsById = {}
    const nonGroupedFlatRows = []
    const nonGroupedRowsById = {}

    // Recursively group the data
    const groupUpRecursively = (rows, depth = 0, parentId) => {
      // This is the last level, just return the rows
      if (depth === existingGroupBy.length) {
        // Set nesting depth for leaf rows
        rows.forEach(row => {
          row.depth = depth
        })
        return rows
      }

      const columnId = existingGroupBy[depth]

      // Group the rows together for this level
      let rowGroupsMap = groupByFn(rows, columnId)

      // Peform aggregations for each group
      const aggregatedGroupedRows = Object.entries(rowGroupsMap).map(
        ([groupByVal, groupedRows], index) => {
          let id = `${columnId}:${groupByVal}`
          id = parentId ? `${parentId}>${id}` : id

          // First, Recurse to group sub rows before aggregation
          const subRows = groupUpRecursively(groupedRows, depth + 1, id)

          // Flatten the leaf rows of the rows in this group
          const leafRows = depth ? flattenBy(groupedRows, 'leafRows') : groupedRows

          // Find the columns that can be aggregated, including any columns in
          // groupBy. Originally, no groupBy columns were aggregated. Now we
          // aggregate groupBy columns that aren't in the row's group.
          const groupedColumns = existingGroupBy.slice(0, depth + 1)
          const aggregatedColumns = allColumns
            .filter(col => !groupedColumns.includes(col.id))
            .map(col => col.id)

          // Originally, groupedRows were passed here, which were the same as
          // the leafRows. Now, the subRows are passed, which contain the aggregated
          // values of the immediate child rows.
          const values = aggregateRowsToValues(leafRows, subRows, depth, aggregatedColumns)

          const row = {
            id,
            isGrouped: true,
            groupByID: columnId,
            groupByVal,
            values,
            subRows,
            leafRows,
            depth,
            // Originally, aggregated rows had a row index corresponding to the index within
            // rowGroupsMap. This row index doesn't map to a valid data row and overlaps
            // with the leaf rows, so explicitly omit it.
            // index: undefined,
            index: undefined,
            groupIndex: index,
            // All columns that can be aggregated (including groupBy columns)
            aggregatedColumns
          }

          subRows.forEach(subRow => {
            groupedFlatRows.push(subRow)
            groupedRowsById[subRow.id] = subRow
            if (subRow.isGrouped) {
              onlyGroupedFlatRows.push(subRow)
              onlyGroupedRowsById[subRow.id] = subRow
            } else {
              nonGroupedFlatRows.push(subRow)
              nonGroupedRowsById[subRow.id] = subRow
            }
          })

          return row
        }
      )

      return aggregatedGroupedRows
    }

    const groupedRows = groupUpRecursively(rows)

    groupedRows.forEach(subRow => {
      groupedFlatRows.push(subRow)
      groupedRowsById[subRow.id] = subRow
      if (subRow.isGrouped) {
        onlyGroupedFlatRows.push(subRow)
        onlyGroupedRowsById[subRow.id] = subRow
      } else {
        nonGroupedFlatRows.push(subRow)
        nonGroupedRowsById[subRow.id] = subRow
      }
    })

    // Assign the new data
    return [
      groupedRows,
      groupedFlatRows,
      groupedRowsById,
      onlyGroupedFlatRows,
      onlyGroupedRowsById,
      nonGroupedFlatRows,
      nonGroupedRowsById
    ]
  }, [manualGroupBy, groupBy, rows, flatRows, rowsById, allColumns, userAggregations, groupByFn])

  const getAutoResetGroupBy = useGetLatest(autoResetGroupBy)

  useMountedLayoutEffect(() => {
    if (getAutoResetGroupBy()) {
      dispatch({ type: actions.resetGroupBy })
    }
  }, [dispatch, manualGroupBy ? null : data])

  Object.assign(instance, {
    preGroupedRows: rows,
    preGroupedFlatRow: flatRows,
    preGroupedRowsById: rowsById,
    groupedRows,
    groupedFlatRows,
    groupedRowsById,
    onlyGroupedFlatRows,
    onlyGroupedRowsById,
    nonGroupedFlatRows,
    nonGroupedRowsById,
    rows: groupedRows,
    flatRows: groupedFlatRows,
    rowsById: groupedRowsById,
    toggleGroupBy,
    setGroupBy
  })
}

function prepareRow(row) {
  row.allCells.forEach(cell => {
    // Grouped cells are in the groupBy and the pivot cell for the row
    cell.isGrouped = cell.column.isGrouped && cell.column.id === row.groupByID

    // Aggregated cells are not grouped, not repeated, but still have subRows
    cell.isAggregated =
      !cell.isGrouped && row.aggregatedColumns?.includes(cell.column.id) && row.subRows?.length

    // Placeholder cells are any columns in the groupBy that are not grouped or aggregated
    cell.isPlaceholder = !cell.isGrouped && cell.column.isGrouped && !cell.isAggregated
  })
}

export function defaultGroupByFn(rows, columnId) {
  return rows.reduce((prev, row) => {
    // TODO: Might want to implement a key serializer here so
    // irregular column values can still be grouped if needed?
    const resKey = `${row.values[columnId]}`
    prev[resKey] = Array.isArray(prev[resKey]) ? prev[resKey] : []
    prev[resKey].push(row)
    return prev
  }, {})
}

function flattenBy(arr, key) {
  const flat = []

  const recurse = arr => {
    arr.forEach(d => {
      if (!d[key]) {
        flat.push(d)
      } else {
        recurse(d[key])
      }
    })
  }

  recurse(arr)

  return flat
}
