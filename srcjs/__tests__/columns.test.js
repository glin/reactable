import React from 'react'

import { columnsToRows, addColumnGroups, compareNumbers, buildColumnDefs } from '../columns'
import { aggregators } from '../aggregators'

test('columnsToRows', () => {
  const columns = { a: [1, 2, 3], b: ['x', 'y', 'z'] }
  const rows = columnsToRows(columns)
  expect(rows).toEqual([{ a: 1, b: 'x' }, { a: 2, b: 'y' }, { a: 3, b: 'z' }])
})

describe('buildColumnDefs', () => {
  test('id', () => {
    const cols = buildColumnDefs([{ accessor: 'x' }, { accessor: 'y' }])
    cols.forEach(col => expect(col.id).toEqual(col.accessor))
  })

  test('accessors with dots', () => {
    const cols = buildColumnDefs([{ accessor: 'petal.width' }])
    expect(cols[0].accessor({ 'petal.width': 5 })).toEqual(5)
  })

  test('aggregators', () => {
    let cols = buildColumnDefs([{ accessor: 'x', aggregate: 'mean' }])
    expect(cols[0].aggregate).toEqual(aggregators.mean)
    cols = buildColumnDefs([{ accessor: 'x', aggregate: 'justastring' }])
    expect(cols[0].aggregate).toEqual('justastring')
  })

  test('renderers', () => {
    let cols = buildColumnDefs([{ accessor: 'x', render: { cell: cell => cell.value } }])
    expect(cols[0].Cell({ value: 'x' })).toEqual(<div dangerouslySetInnerHTML={{ __html: 'x' }} />)
    expect(cols[0].Aggregated({ value: 'x' })).toEqual('x')
    // Default Aggregated
    cols = buildColumnDefs([{ accessor: 'x', render: { aggregated: cell => cell.value } }])
    expect(cols[0].Aggregated({ value: 'x' })).toEqual(<div dangerouslySetInnerHTML={{ __html: 'x' }} />)
  })

  test('numeric cols', () => {
    let cols = buildColumnDefs([{ accessor: 'x', type: 'numeric' }])
    expect(cols[0].sortMethod).toEqual(compareNumbers)
    expect(cols[0].style.textAlign).toEqual('right')
    // Text align override
    cols = buildColumnDefs([{ accessor: 'x', type: 'numeric', style: { textAlign: 'left' } }])
    expect(cols[0].style.textAlign).toEqual('left')
  })

  test('column groups', () => {
    const groups = [{ Header: 'xy', columns: ['x', 'y'] }]
    const cols = buildColumnDefs([{ accessor: 'x' }, { accessor: 'y' }], groups)
    expect(cols.length).toEqual(1)
    expect(cols[0].Header).toEqual('xy')
    expect(cols[0].columns.map(col => col.id)).toEqual(['x', 'y'])
  })
})

describe('addColumnGroups', () => {
  test('adjacent group', () => {
    const columns = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const groups = [{ id: 'ab', columns: ['a', 'b'] }]
    let newCols = addColumnGroups(columns, groups)
    expect(newCols).toEqual([
      { id: 'ab', columns: [{ id: 'a' }, { id: 'b' }] },
      { columns: [{ id: 'c' }] }
    ])
  })

  test('split group', () => {
    const columns = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
    const groups = [{ id: 'bd', columns: ['b', 'd'] }]
    let newCols = addColumnGroups(columns, groups)
    expect(newCols).toEqual([
      { columns: [{ id: 'a' }] },
      { id: 'bd', columns: [{ id: 'b' }, { id: 'd' }] },
      { columns: [{ id: 'c' }] }
    ])
  })
})

test('compareNumbers', () => {
  const tests = [
    [0, 0, 0],
    [0, 1, -1],
    [1, 0, 1],
    [5, 5.01, -1],
    ['NA', 0, -1],
    [0, 'NA', 1],
    ['NA', 'NA', 0],
    ['Inf', 1, 1],
    ['-Inf', 1, -1],
    [1, 'Inf', -1],
    [-1, '-Inf', 1],
    ['Inf', 'Inf', 0],
    ['-Inf', '-Inf', 0],
    ['NA', 'Inf', -1],
    ['Inf', 'NA', 1],
    ['NA', '-Inf', -1],
    ['-Inf', 'NA', 1]
  ]
  tests.forEach(([a, b, order]) => {
    expect(compareNumbers(a, b)).toEqual(order)
  })
})
