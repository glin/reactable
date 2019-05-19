import React from 'react'
import reactR from 'reactR'

import {
  columnsToRows,
  addColumnGroups,
  compareNumbers,
  buildColumnDefs,
  formatValue
} from '../columns'
import { aggregators } from '../aggregators'

jest.mock('reactR')
reactR.hydrate = (components, tag) => tag

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
    expect(cols[0].Aggregated({ value: undefined })).toEqual('')
  })

  test('formatters', () => {
    // Cell
    let cols = buildColumnDefs([{ accessor: 'x', format: { cell: { prefix: '$', digits: 1 } } }])
    expect(cols[0].Cell({ value: 123.12 })).toEqual('$123.1')
    expect(cols[0].Aggregated({ value: 123.12 })).toEqual(123.12)

    // Aggregated
    cols = buildColumnDefs([{ accessor: 'x', format: { aggregated: { suffix: '!' } } }])
    expect(cols[0].Cell({ value: 'xyz' })).toEqual('xyz')
    expect(cols[0].Aggregated({ value: 'xyz' })).toEqual('xyz!')
  })

  test('renderers', () => {
    // Cell
    let cols = buildColumnDefs([{ accessor: 'x', cell: cell => cell.value }])
    expect(cols[0].Cell({ value: 'x' })).toEqual('x')
    expect(cols[0].Aggregated({ value: 'x' })).toEqual('x')

    cols = buildColumnDefs([
      { accessor: 'x', cell: ['X', 2, React.createElement('div', null, 'Z')] }
    ])
    expect(cols[0].Cell({ value: 'x', index: 0 })).toEqual('X')
    expect(cols[0].Cell({ value: 'y', index: 1 })).toEqual('2')
    expect(cols[0].Cell({ value: 'z', index: 2 })).toEqual(React.createElement('div', null, 'Z'))

    cols = buildColumnDefs([{ accessor: 'x', html: true, cell: ['<div>footer</div>'] }])
    expect(cols[0].Cell({ value: 'x', index: 0 })).toEqual(
      <div dangerouslySetInnerHTML={{ __html: '<div>footer</div>' }} />
    )

    // Aggregated
    cols = buildColumnDefs([{ accessor: 'x', aggregated: cell => cell.value + '!!' }])
    expect(cols[0].Cell({ value: 'x' })).toEqual('x')
    expect(cols[0].Aggregated({ value: 'x' })).toEqual('x!!')

    // Footer
    cols = buildColumnDefs([{ accessor: 'x' }])
    expect(cols[0].Footer).toEqual(undefined)
    cols = buildColumnDefs([{ accessor: 'x', footer: () => 'footer' }])
    expect(cols[0].Footer()).toEqual('footer')
    cols = buildColumnDefs([{ accessor: 'x', footer: React.createElement('div', null, 'footer') }])
    expect(cols[0].Footer()).toEqual(React.createElement('div', null, 'footer'))
    cols = buildColumnDefs([{ accessor: 'x', html: true, footer: '<div>footer</div>' }])
    expect(cols[0].Footer()).toEqual(
      <div dangerouslySetInnerHTML={{ __html: '<div>footer</div>' }} />
    )
  })

  test('formatters applied before renderers', () => {
    // Cell
    let cols = buildColumnDefs([
      {
        accessor: 'x',
        format: { cell: { prefix: '@' } },
        cell: cell => `__${cell.value}__`
      }
    ])
    expect(cols[0].Cell({ value: 'x' })).toEqual('__@x__')
    expect(cols[0].Aggregated({ value: 'x' })).toEqual('x')

    // Aggregated
    cols = buildColumnDefs([
      {
        accessor: 'x',
        format: { aggregated: { prefix: '@' } },
        aggregated: cell => `__${cell.value}__`
      }
    ])
    expect(cols[0].Cell({ value: 'x' })).toEqual('x')
    expect(cols[0].Aggregated({ value: 'x' })).toEqual('__@x__')
  })

  test('html', () => {
    let cols = buildColumnDefs([{ accessor: 'x', html: true }])
    expect(cols[0].Cell({ value: 'x' })).toEqual(<div dangerouslySetInnerHTML={{ __html: 'x' }} />)
    expect(cols[0].Aggregated({ value: 'x' })).toEqual(
      <div dangerouslySetInnerHTML={{ __html: 'x' }} />
    )

    // render html
    cols = buildColumnDefs([
      {
        accessor: 'x',
        cell: cell => cell.value + '!',
        aggregated: cell => cell.value + '!!',
        html: true
      }
    ])
    expect(cols[0].Cell({ value: 'x' })).toEqual(<div dangerouslySetInnerHTML={{ __html: 'x!' }} />)
    expect(cols[0].Aggregated({ value: 'x' })).toEqual(
      <div dangerouslySetInnerHTML={{ __html: 'x!!' }} />
    )

    // format html
    cols = buildColumnDefs([
      {
        accessor: 'x',
        format: { cell: { prefix: '@' }, aggregated: { prefix: '$' } },
        cell: cell => `__${cell.value}__`,
        aggregated: cell => `__${cell.value}__`,
        html: true
      }
    ])
    expect(cols[0].Cell({ value: 'x' })).toEqual(
      <div dangerouslySetInnerHTML={{ __html: '__@x__' }} />
    )
    expect(cols[0].Aggregated({ value: 'x' })).toEqual(
      <div dangerouslySetInnerHTML={{ __html: '__$x__' }} />
    )
  })

  test('pivoted cells render the same as regular cells', () => {
    let cols = buildColumnDefs([
      {
        accessor: 'x',
        format: { cell: { prefix: '@' } },
        cell: cell => `__${cell.value}__`
      }
    ])
    expect(cols[0].Cell({ value: 'x' })).toEqual('__@x__')
    expect(cols[0].PivotValue({ value: 'x', subRows: [{}, {}] })).toEqual(
      <span>
        {'__@x__'} {'(2)'}
      </span>
    )
  })

  test('numeric cols', () => {
    let cols = buildColumnDefs([{ accessor: 'x', type: 'numeric' }])
    expect(cols[0].sortMethod).toEqual(compareNumbers)
    expect(cols[0].align).toEqual('right')
    expect(cols[0].className).toEqual('rt-col-right')
    expect(cols[0].headerClassName).toEqual('rt-col-right')
    // Align override
    cols = buildColumnDefs([{ accessor: 'x', type: 'numeric', align: 'left' }])
    expect(cols[0].sortMethod).toEqual(compareNumbers)
    expect(cols[0].align).toEqual('left')
    expect(cols[0].className).toEqual('rt-col-left')
    expect(cols[0].headerClassName).toEqual('rt-col-left')
  })

  test('column alignment', () => {
    // Default: left
    let cols = buildColumnDefs([{ accessor: 'x' }])
    expect(cols[0].align).toEqual('left')
    expect(cols[0].className).toEqual('rt-col-left')
    expect(cols[0].headerClassName).toEqual('rt-col-left')

    // Left
    cols = buildColumnDefs([{ accessor: 'x', align: 'left' }])
    expect(cols[0].align).toEqual('left')
    expect(cols[0].className).toEqual('rt-col-left')
    expect(cols[0].headerClassName).toEqual('rt-col-left')

    // Right
    cols = buildColumnDefs([{ accessor: 'x', align: 'right' }])
    expect(cols[0].align).toEqual('right')
    expect(cols[0].className).toEqual('rt-col-right')
    expect(cols[0].headerClassName).toEqual('rt-col-right')

    // Center
    cols = buildColumnDefs([
      { accessor: 'x', align: 'center', className: 'col', headerClassName: 'hdr' }
    ])
    expect(cols[0].align).toEqual('center')
    expect(cols[0].className).toEqual('rt-col-center col')
    expect(cols[0].headerClassName).toEqual('rt-col-center hdr')
  })

  test('header sort icons', () => {
    // No sort
    let cols = buildColumnDefs([{ Header: 'xy', accessor: 'x' }])
    expect(cols[0].Header).toEqual('xy')
    cols = buildColumnDefs([{ Header: 'xy', accessor: 'x' }], null, { sortable: false })
    expect(cols[0].Header).toEqual('xy')

    // Table sort
    cols = buildColumnDefs([{ Header: 'x', accessor: 'x' }], null, { sortable: true })
    expect(cols[0].Header()).toEqual(
      <React.Fragment>
        {'x'}
        <span className="-sort-right" />
      </React.Fragment>
    )

    cols = buildColumnDefs([{ Header: 'x', accessor: 'x', align: 'right' }], null, {
      sortable: true
    })
    expect(cols[0].Header()).toEqual(
      <React.Fragment>
        <span className="-sort-left" />
        {'x'}
      </React.Fragment>
    )

    // Column sort override
    cols = buildColumnDefs(
      [{ Header: 'xy', accessor: 'x', align: 'center', sortable: true }],
      null,
      {
        sortable: false
      }
    )
    expect(cols[0].Header()).toEqual(
      <React.Fragment>
        {'xy'}
        <span className="-sort-right" />
      </React.Fragment>
    )

    // showSortable
    cols = buildColumnDefs(
      [{ Header: 'x', accessor: 'x', align: 'right' }, { Header: 'y', accessor: 'y' }],
      null,
      {
        sortable: true,
        showSortable: true
      }
    )
    expect(cols[0].Header()).toEqual(
      <React.Fragment>
        <span className="-sort -sort-left" />
        {'x'}
      </React.Fragment>
    )
    expect(cols[1].Header()).toEqual(
      <React.Fragment>
        {'y'}
        <span className="-sort -sort-right" />
      </React.Fragment>
    )
  })

  test('column groups', () => {
    let groups = [{ Header: 'xy', columns: ['x', 'y'] }]
    let cols = buildColumnDefs([{ accessor: 'x' }, { accessor: 'y' }], groups)
    expect(cols.length).toEqual(1)
    expect(cols[0].Header).toEqual('xy')
    expect(cols[0].columns.map(col => col.id)).toEqual(['x', 'y'])
  })

  test('column group alignment', () => {
    // Default: center
    let groups = [{ Header: 'xy', columns: ['x', 'y'] }]
    let cols = buildColumnDefs([{ accessor: 'x' }, { accessor: 'y' }], groups)
    expect(cols[0].headerClassName).toEqual('rt-col-center')

    // Left
    groups = [{ Header: 'xy', columns: ['x', 'y'], align: 'left' }]
    cols = buildColumnDefs([{ accessor: 'x' }, { accessor: 'y' }], groups)
    expect(cols[0].headerClassName).toEqual('rt-col-left')

    // Right
    groups = [{ Header: 'xy', columns: ['x', 'y'], align: 'right', headerClassName: 'hdr' }]
    cols = buildColumnDefs([{ accessor: 'x' }, { accessor: 'y' }], groups)
    expect(cols[0].headerClassName).toEqual('rt-col-right hdr')

    // Center
    groups = [{ Header: 'xy', columns: ['x', 'y'], align: 'center' }]
    cols = buildColumnDefs([{ accessor: 'x' }, { accessor: 'y' }], groups)
    expect(cols[0].headerClassName).toEqual('rt-col-center')
  })

  test("columns and groups aren't mutated", () => {
    const groups = [{ Header: 'xy', columns: ['x', 'y'] }]
    const columns = [{ accessor: 'x' }, { accessor: 'y' }]
    let cols = buildColumnDefs(columns, groups)
    expect(cols[0].Header).toEqual('xy')
    expect(columns).toEqual([{ accessor: 'x' }, { accessor: 'y' }])
    expect(groups).toEqual([{ Header: 'xy', columns: ['x', 'y'] }])
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
    ['-Inf', 'NA', 1],
    ['2', '10', -1]
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

  test('percent', () => {
    expect(formatValue(0.951, { percent: true })).toEqual('95.1%')
    expect(formatValue(0.95123, { percent: true, digits: 2 })).toEqual('95.12%')
    expect(formatValue(10.356, { percent: true, separators: true, digits: 0 })).toEqual('1,036%')
    expect(formatValue(0.33, { percent: true, suffix: '_' })).toEqual('33%_')
  })

  test('currency', () => {
    expect(formatValue(125253.125, { currency: 'USD', locales: 'en-US' })).toEqual('$125253.13')
    expect(
      formatValue(125253.125, { currency: 'USD', separators: true, locales: 'en-US' })
    ).toEqual('$125,253.13')
  })

  test('datetime', () => {
    const date = '2018-03-22 13:22:49'
    expect(formatValue(date, { datetime: true, locales: 'en-US' })).toEqual('3/22/2018, 1:22:49 PM')
    expect(formatValue(date, { date: true, locales: 'en-US' })).toEqual('3/22/2018')
    expect(formatValue(date, { time: true, locales: 'en-US' })).toEqual('1:22:49 PM')
    expect(formatValue(date, { datetime: true, hour12: false, locales: 'en-US' })).toEqual(
      '3/22/2018, 13:22:49'
    )
    expect(formatValue(date, { time: true, hour12: false, locales: 'en-US' })).toEqual('13:22:49')
    expect(formatValue(date, { time: true, hour12: null, locales: 'en-US' })).toEqual('1:22:49 PM')
  })
})
