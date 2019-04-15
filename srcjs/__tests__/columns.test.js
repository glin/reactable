import React from 'react'

import {
  columnsToRows,
  addColumnGroups,
  compareNumbers,
  buildColumnDefs,
  formatValue
} from '../columns'
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

  test('formatters', () => {
    // Cell
    let cols = buildColumnDefs([{ accessor: 'x', format: { cell: { prefix: '$', digits: 1 } } }])
    expect(cols[0].Cell({ value: 123.12 })).toEqual('$123.1')
    expect(cols[0].Aggregated).toEqual(undefined)

    // Aggregated
    cols = buildColumnDefs([{ accessor: 'x', format: { aggregated: { suffix: '!' } } }])
    expect(cols[0].Cell).toEqual(undefined)
    expect(cols[0].Aggregated({ value: 'xyz' })).toEqual('xyz!')
  })

  test('renderers', () => {
    // Cell
    let cols = buildColumnDefs([{ accessor: 'x', render: { cell: cell => cell.value } }])
    expect(cols[0].Cell({ value: 'x' })).toEqual(<div dangerouslySetInnerHTML={{ __html: 'x' }} />)
    expect(cols[0].Aggregated).toEqual(undefined)

    // Aggregated
    cols = buildColumnDefs([{ accessor: 'x', render: { aggregated: cell => cell.value } }])
    expect(cols[0].Cell).toEqual(undefined)
    expect(cols[0].Aggregated({ value: 'x' })).toEqual(
      <div dangerouslySetInnerHTML={{ __html: 'x' }} />
    )
  })

  test('formatters applied before renderers', () => {
    // Cell
    let cols = buildColumnDefs([
      {
        accessor: 'x',
        format: { cell: { prefix: '@' } },
        render: { cell: cell => `__${cell.value}__` }
      }
    ])
    expect(cols[0].Cell({ value: 'x' })).toEqual(
      <div dangerouslySetInnerHTML={{ __html: '__@x__' }} />
    )
    expect(cols[0].Aggregated).toEqual(undefined)

    // Aggregated
    cols = buildColumnDefs([
      {
        accessor: 'x',
        format: { aggregated: { prefix: '@' } },
        render: { aggregated: cell => `__${cell.value}__` }
      }
    ])
    expect(cols[0].Cell).toEqual(undefined)
    expect(cols[0].Aggregated({ value: 'x' })).toEqual(
      <div dangerouslySetInnerHTML={{ __html: '__@x__' }} />
    )
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

describe('formatValue', () => {
  test('prefix/suffix', () => {
    expect(formatValue(123, { prefix: 'a' })).toEqual('a123')
    expect(formatValue(123, { suffix: 'b' })).toEqual('123b')
    expect(formatValue('bc', { prefix: 'a', suffix: 'd' })).toEqual('abcd')
    const options = { prefix: 'amt: ', suffix: ' dollaroos', currency: 'USD', locales: 'en-US' }
    expect(formatValue(123.1, options)).toEqual('amt: $123.10 dollaroos')
    // Non-string prefix/suffix
    expect(formatValue(123, { prefix: 5, suffix: 0 })).toEqual('51230')
    expect(formatValue(123, { prefix: 0, suffix: true })).toEqual('0123true')
  })

  test('digits', () => {
    expect(formatValue(123.125, { digits: 0 })).toEqual(123)
    expect(formatValue(123.125, { digits: 2 })).toEqual(123.13)
    expect(formatValue('ignorestring', { digits: 3 })).toEqual('ignorestring')
  })

  test('separators', () => {
    expect(formatValue(125253.125, { separators: true, locales: 'en-US' })).toEqual('125,253.125')
    expect(formatValue(125253.125, { separators: false })).toEqual(125253.125)
    expect(formatValue(125253.125, {})).toEqual(125253.125)
  })

  test('currency', () => {
    expect(formatValue(125253.125, { currency: 'USD', locales: 'en-US' })).toEqual('$125253.13')
    expect(
      formatValue(125253.125, { currency: 'USD', separators: true, locales: 'en-US' })
    ).toEqual('$125,253.13')
  })
})
