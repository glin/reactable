import React from 'react'
import reactR from 'reactR'
import { render } from '@testing-library/react'

import {
  columnsToRows,
  RawHTML,
  addColumnGroups,
  createCompareFunction,
  buildColumnDefs,
  formatValue,
  createStartsWithMatcher,
  createSubstringMatcher
} from '../columns'
import * as aggregators from '../aggregators'

jest.mock('reactR')
reactR.hydrate = (components, tag) => tag

describe('columnsToRows', () => {
  test('converts column-wise data to row-wise format', () => {
    const columns = { a: [1, 2, 3], b: ['x', 'y', 'z'], c: [{}, { a: 1 }, null] }
    const rows = columnsToRows(columns)
    expect(rows).toEqual([
      { a: 1, b: 'x', c: {} },
      { a: 2, b: 'y', c: { a: 1 } },
      { a: 3, b: 'z', c: null }
    ])
  })

  test('handles empty objects', () => {
    expect(columnsToRows({})).toEqual([])
  })

  test('converts data with sub rows', () => {
    const columns = {
      a: [1, 2, 3, 4, 5],
      '.subRows': [{ a: [1], b: ['a'] }, { a: ['a', 'b'] }, null, {}, []]
    }
    const rows = columnsToRows(columns)
    expect(rows).toEqual([
      { a: 1, '.subRows': [{ a: 1, b: 'a' }] },
      { a: 2, '.subRows': [{ a: 'a' }, { a: 'b' }] },
      { a: 3 },
      { a: 4, '.subRows': [] },
      { a: 5, '.subRows': [] }
    ])
  })
})

test('RawHTML', () => {
  const { container, rerender } = render(<RawHTML html="<div>html</div>" />)
  expect(container.innerHTML).toEqual('<div class="rt-text-content"><div>html</div></div>')

  rerender(<RawHTML className="extra" style={{ display: 'inline' }} html="html" />)
  expect(container.innerHTML).toEqual(
    '<div class="rt-text-content extra" style="display: inline;">html</div>'
  )
})

describe('buildColumnDefs', () => {
  test('accessor', () => {
    const cols = buildColumnDefs([{ id: 'x' }, { id: 'y' }])
    expect(cols[0].accessor({ x: 1, y: 2 })).toEqual(1)
    expect(cols[1].accessor({ x: 'x', y: 'y' })).toEqual('y')
    expect(cols[0].accessor({})).toEqual(undefined)
  })

  test('accessors with path characters (periods or square brackets) work', () => {
    const cols = buildColumnDefs([{ id: 'petal.width' }, { id: 'x[' }, { id: 'y]' }])
    expect(cols[0].accessor({ 'petal.width': 5 })).toEqual(5)
    expect(cols[1].accessor({ 'x[': 6 })).toEqual(6)
    expect(cols[2].accessor({ 'y]': 7 })).toEqual(7)
  })

  test('aggregators', () => {
    let cols = buildColumnDefs([{ id: 'x', aggregate: 'mean', type: 'numeric' }])
    expect(cols[0].aggregate).toEqual(aggregators.mean)

    cols = buildColumnDefs([{ id: 'x', aggregate: 'count' }])
    expect(cols[0].aggregate).toEqual(aggregators.count)

    const customFn = values => values.length
    cols = buildColumnDefs([{ id: 'x', aggregate: customFn }])
    expect(cols[0].aggregate).toEqual(customFn)

    cols = buildColumnDefs([{ id: 'x', aggregate: 'invalid-aggregator' }])
    expect(cols[0].aggregate).toEqual(undefined)
    expect(cols[0].Aggregated({ value: undefined })).toEqual('')
  })

  test('formatters', () => {
    // Cell
    let cols = buildColumnDefs([{ id: 'x', format: { cell: { prefix: '$', digits: 1 } } }])
    expect(cols[0].Cell({ value: 123.12 })).toEqual('$123.1')
    expect(cols[0].Grouped({ value: 123.12, subRows: [] })).toEqual(
      <React.Fragment>
        {'$123.1'}
        {' (0)'}
      </React.Fragment>
    )
    expect(cols[0].Aggregated({ value: 123.12 })).toEqual('123.12')

    // Aggregated
    cols = buildColumnDefs([{ id: 'x', format: { aggregated: { suffix: '!' } } }])
    expect(cols[0].Cell({ value: 'xyz' })).toEqual('xyz')
    expect(cols[0].Grouped({ value: 'xyz', subRows: [{}] })).toEqual(
      <React.Fragment>
        {'xyz'}
        {' (1)'}
      </React.Fragment>
    )
    expect(cols[0].Aggregated({ value: 'xyz' })).toEqual('xyz!')
    // Formatters should not apply to empty aggregate values
    expect(cols[0].Aggregated({ value: null })).toEqual('')
  })

  test('renderers', () => {
    // Cell
    let cols = buildColumnDefs([{ id: 'x', cell: cellInfo => cellInfo.value }])
    expect(cols[0].Cell({ value: 'x' })).toEqual('x')
    expect(cols[0].Aggregated({ value: 'x' })).toEqual('x')

    cols = buildColumnDefs([{ id: 'x', cell: ['X', 2, React.createElement('div', null, 'Z')] }])
    expect(cols[0].Cell({ value: 'x', index: 0 })).toEqual('X')
    expect(cols[0].Cell({ value: 'y', index: 1 })).toEqual('2')
    expect(cols[0].Cell({ value: 'z', index: 2 })).toEqual(React.createElement('div', null, 'Z'))

    cols = buildColumnDefs([{ id: 'x', html: true, cell: ['<div>cell</div>'] }])
    expect(cols[0].Cell({ value: 'x', index: 0 })).toEqual(
      <RawHTML style={{ display: 'inline' }} html="<div>cell</div>" />
    )

    // Grouped
    cols = buildColumnDefs([
      { id: 'x', cell: () => 'overridden', grouped: cellInfo => cellInfo.value }
    ])
    expect(cols[0].Grouped({ value: 'x' })).toEqual('x')

    cols = buildColumnDefs([
      {
        id: 'x',
        cell: () => 'overridden',
        grouped: function Grouped(cellInfo) {
          return <div>{cellInfo.value}</div>
        }
      }
    ])
    expect(cols[0].Grouped({ value: 'x' })).toEqual(<div>{'x'}</div>)

    cols = buildColumnDefs([
      {
        id: 'x',
        cell: () => 'overridden',
        html: true,
        grouped: cellInfo => `<div>${cellInfo.value}</div>`
      }
    ])
    expect(cols[0].Grouped({ value: 'x' })).toEqual(
      <RawHTML style={{ display: 'inline' }} html="<div>x</div>" />
    )

    // Aggregated
    cols = buildColumnDefs([{ id: 'x', aggregated: cellInfo => cellInfo.value + '!!' }])
    expect(cols[0].Cell({ value: 'x' })).toEqual('x')
    expect(cols[0].Aggregated({ value: 'x' })).toEqual('x!!')
    expect(cols[0].Aggregated({ value: null })).toEqual('null!!')

    cols = buildColumnDefs([
      {
        id: 'x',
        aggregated: function Aggregated(cellInfo) {
          return React.createElement('div', null, cellInfo.value)
        }
      }
    ])
    expect(cols[0].Aggregated({ value: 'x' })).toEqual(React.createElement('div', null, 'x'))

    cols = buildColumnDefs([{ id: 'x' }])
    expect(cols[0].Aggregated({ value: true })).toEqual('true')

    // React elements and HTML rendering don't clash
    cols = buildColumnDefs([
      {
        id: 'x',
        cell: [React.createElement('div', null, 'Z')],
        grouped: function Grouped(cellInfo) {
          return <span>{cellInfo.value}</span>
        },
        aggregated: function Aggregated(cellInfo) {
          return <div>{cellInfo.value}</div>
        },
        html: true
      }
    ])
    expect(cols[0].Cell({ value: 'x', index: 0 })).toEqual(React.createElement('div', null, 'Z'))
    expect(cols[0].Grouped({ value: 'x' })).toEqual(<span>{'x'}</span>)
    expect(cols[0].Aggregated({ value: 'x', index: 0 })).toEqual(<div>{'x'}</div>)

    // Header
    cols = buildColumnDefs([{ id: 'x', name: 'x' }])
    expect(cols[0].Header()).toEqual('x')
    cols = buildColumnDefs([{ id: 'x', name: 'x', header: '' }])
    expect(cols[0].Header()).toEqual('')
    cols = buildColumnDefs([{ id: 'x', header: () => 'header' }])
    expect(cols[0].Header()).toEqual('header')
    cols = buildColumnDefs([{ id: 'x', header: <div>header</div> }])
    expect(cols[0].Header()).toEqual(<div>header</div>)
    cols = buildColumnDefs([{ id: 'x', html: true, header: '<div>header</div>' }])
    expect(cols[0].Header()).toEqual(<RawHTML html="<div>header</div>" />)

    // React elements and HTML rendering don't clash
    cols = buildColumnDefs([{ id: 'x', header: <div>header</div>, html: true }])
    expect(cols[0].Header()).toEqual(<div>header</div>)

    // Footer
    cols = buildColumnDefs([{ id: 'x' }])
    expect(cols[0].Footer).toEqual('\u200b')
    cols = buildColumnDefs([{ id: 'x', footer: '' }])
    expect(cols[0].Footer()).toEqual('')
    cols = buildColumnDefs([{ id: 'x', footer: () => 'footer' }])
    expect(cols[0].Footer()).toEqual('footer')
    cols = buildColumnDefs([{ id: 'x', footer: React.createElement('div', null, 'footer') }])
    expect(cols[0].Footer()).toEqual(React.createElement('div', null, 'footer'))
    cols = buildColumnDefs([{ id: 'x', html: true, footer: '<div>footer</div>' }])
    expect(cols[0].Footer()).toEqual(<RawHTML html="<div>footer</div>" />)

    // React elements and HTML rendering don't clash
    cols = buildColumnDefs([
      { id: 'x', footer: React.createElement('div', null, 'footer'), html: true }
    ])
    expect(cols[0].Footer()).toEqual(React.createElement('div', null, 'footer'))
  })

  test('formatters applied before renderers', () => {
    // Cell
    let cols = buildColumnDefs([
      {
        id: 'x',
        format: { cell: { prefix: '@' } },
        cell: cellInfo => `__${cellInfo.value}__`,
        grouped: cellInfo => `/${cellInfo.value}/`
      }
    ])
    expect(cols[0].Cell({ value: 'x' })).toEqual('__@x__')
    expect(cols[0].Grouped({ value: 'x' })).toEqual('/@x/')
    expect(cols[0].Aggregated({ value: 'x' })).toEqual('x')

    // Aggregated
    cols = buildColumnDefs([
      {
        id: 'x',
        format: { aggregated: { prefix: '@' } },
        aggregated: cellInfo => `__${cellInfo.value}__`
      }
    ])
    expect(cols[0].Cell({ value: 'x' })).toEqual('x')
    expect(cols[0].Grouped({ value: 'x', subRows: [{}] })).toEqual(
      <React.Fragment>
        {'x'}
        {' (1)'}
      </React.Fragment>
    )
    expect(cols[0].Aggregated({ value: 'x' })).toEqual('__@x__')
  })

  test('html', () => {
    let cols = buildColumnDefs([{ id: 'x', html: true }])
    expect(cols[0].Cell({ value: 'x' })).toEqual(<RawHTML style={{ display: 'inline' }} html="x" />)
    expect(cols[0].Aggregated({ value: 'x' })).toEqual(<RawHTML html="x" />)

    // render html
    cols = buildColumnDefs([
      {
        id: 'x',
        cell: cellInfo => cellInfo.value + '!',
        aggregated: cellInfo => cellInfo.value + '!!',
        html: true
      }
    ])
    expect(cols[0].Cell({ value: 'x' })).toEqual(
      <RawHTML style={{ display: 'inline' }} html="x!" />
    )
    expect(cols[0].Aggregated({ value: 'x' })).toEqual(<RawHTML html="x!!" />)

    // format html
    cols = buildColumnDefs([
      {
        id: 'x',
        format: { cell: { prefix: '@' }, aggregated: { prefix: '$' } },
        cell: cellInfo => `__${cellInfo.value}__`,
        grouped: cellInfo => `__${cellInfo.value}__`,
        aggregated: cellInfo => `__${cellInfo.value}__`,
        html: true
      }
    ])
    expect(cols[0].Cell({ value: 'x' })).toEqual(
      <RawHTML style={{ display: 'inline' }} html="__@x__" />
    )
    expect(cols[0].Grouped({ value: 'x' })).toEqual(
      <RawHTML style={{ display: 'inline' }} html="__@x__" />
    )
    expect(cols[0].Aggregated({ value: 'x' })).toEqual(<RawHTML html="__$x__" />)
  })

  test('grouped cells render the same as regular cells by default', () => {
    let cols = buildColumnDefs([
      {
        id: 'x',
        format: { cell: { prefix: '@' } },
        cell: cellInfo => `__${cellInfo.value}__`
      }
    ])
    expect(cols[0].Cell({ value: 'x' })).toEqual('__@x__')
    expect(cols[0].Grouped({ value: 'x', subRows: [{}, {}] })).toEqual(
      <React.Fragment>
        {'__@x__'}
        {' (2)'}
      </React.Fragment>
    )
  })

  test('NA and NaN rendering', () => {
    // Default rendering of numeric NAs
    let cols = buildColumnDefs([{ id: 'x', type: 'numeric', grouped: cellInfo => cellInfo.value }])
    expect(cols[0].Cell({ value: 'NA' })).toEqual('\u200b')
    expect(cols[0].Cell({ value: 'NaN' })).toEqual('\u200b')
    expect(cols[0].Grouped({ value: 'NA' })).toEqual('\u200b')
    expect(cols[0].Grouped({ value: 'NaN' })).toEqual('\u200b')

    // Default rendering of non-numeric NAs (serialized as nulls)
    cols = buildColumnDefs([{ id: 'x', grouped: cellInfo => cellInfo.value }])
    expect(cols[0].Cell({ value: null })).toEqual('\u200b')
    expect(cols[0].Grouped({ value: null })).toEqual('\u200b')

    // Custom NA strings
    cols = buildColumnDefs([
      { id: 'x', type: 'numeric', na: '---', grouped: cellInfo => cellInfo.value },
      { id: 'y', na: 'missing', grouped: cellInfo => cellInfo.value }
    ])
    expect(cols[0].Cell({ value: 'NA' })).toEqual('---')
    expect(cols[0].Cell({ value: 'NaN' })).toEqual('---')
    expect(cols[1].Cell({ value: null })).toEqual('missing')
    expect(cols[0].Grouped({ value: 'NA' })).toEqual('---')
    expect(cols[0].Grouped({ value: 'NaN' })).toEqual('---')
    expect(cols[1].Grouped({ value: null })).toEqual('missing')

    // Works with renderers, ignored by formatters
    cols = buildColumnDefs([
      {
        id: 'x',
        type: 'numeric',
        format: { cell: { prefix: '@', suffix: '$', percent: true, time: true } },
        cell: cellInfo => `__${cellInfo.value ? cellInfo.value : 'missing'}__`,
        grouped: cellInfo => `__${cellInfo.value ? cellInfo.value : 'missing'}__`
      },
      {
        id: 'y',
        format: { cell: { prefix: '@', suffix: '$', percent: true, time: true } },
        cell: cellInfo => `__${cellInfo.value ? cellInfo.value : 'missing'}__`,
        grouped: cellInfo => `__${cellInfo.value ? cellInfo.value : 'missing'}__`
      }
    ])
    expect(cols[0].Cell({ value: 'NA' })).toEqual('__missing__')
    expect(cols[0].Cell({ value: 'NaN' })).toEqual('__missing__')
    expect(cols[1].Cell({ value: null })).toEqual('__missing__')
    expect(cols[0].Grouped({ value: 'NA' })).toEqual('__missing__')
    expect(cols[0].Grouped({ value: 'NaN' })).toEqual('__missing__')
    expect(cols[1].Grouped({ value: null })).toEqual('__missing__')
  })

  test('sortType', () => {
    // Non-numeric sort
    let cols = buildColumnDefs([{ id: 'x' }])
    expect(cols[0].sortType({ values: { x: 'a' } }, { values: { x: 'B' } }, 'x')).toEqual(-1)

    // Numeric sort
    cols = buildColumnDefs([{ id: 'x', type: 'numeric' }])
    expect(cols[0].sortType({ values: { x: 111 } }, { values: { x: 2 } }, 'x')).toEqual(1)
    expect(cols[0].sortType({ values: { x: 111 } }, { values: { x: 'Inf' } }, 'x')).toEqual(-1)

    // Sort missing values last
    cols = buildColumnDefs([{ id: 'x', sortNALast: true }])
    expect(cols[0].sortType({ values: { x: null } }, { values: { x: 'x' } }, 'x', true)).toEqual(-1)
    expect(cols[0].sortType({ values: { x: null } }, { values: { x: 'x' } }, 'x', false)).toEqual(1)
  })

  test('className', () => {
    let cols = buildColumnDefs([
      {
        id: 'x',
        className: 'cell',
        headerClassName: 'hdr',
        footerClassName: 'ftr'
      }
    ])
    expect(cols[0].getProps({ index: 0 }, {}, null).className).toEqual('rt-align-left cell') // Cell
    expect(cols[0].headerClassName).toEqual('rt-align-left hdr')
    expect(cols[0].footerClassName).toEqual('rt-align-left ftr')

    // JS callback
    cols = buildColumnDefs([
      {
        id: 'x',
        className: (rowInfo, column, state) => {
          if (rowInfo.index === 1) {
            return `index-${rowInfo.index} col-${column.id} page-${state.page}`
          }
        }
      }
    ])
    expect(cols[0].getProps({ index: 0 }, { id: 'x' }, { page: 3 }).className).toEqual(
      'rt-align-left'
    )
    expect(cols[0].getProps({ index: 1 }, { id: 'x' }, { page: 3 }).className).toEqual(
      'rt-align-left index-1 col-x page-3'
    )

    // R callback
    cols = buildColumnDefs([
      {
        id: 'x',
        className: ['a-cls', 'b-cls', null],
        align: 'right'
      }
    ])
    expect(cols[0].getProps({ index: 0 }, {}, null).className).toEqual('rt-align-right a-cls')
    expect(cols[0].getProps({ index: 1 }, {}, null).className).toEqual('rt-align-right b-cls')
    expect(cols[0].getProps({ index: 2 }, {}, null).className).toEqual('rt-align-right')
  })

  test('style', () => {
    let cols = buildColumnDefs([
      {
        id: 'x',
        style: 'cell-style',
        headerStyle: 'hdr-style',
        footerStyle: 'ftr-style'
      }
    ])
    expect(cols[0].getProps({ index: 0 }, {}, null).style).toEqual('cell-style') // Cell
    expect(cols[0].headerStyle).toEqual('hdr-style')
    expect(cols[0].footerStyle).toEqual('ftr-style')

    // JS callback
    cols = buildColumnDefs([
      {
        id: 'x',
        style: (rowInfo, column, state) => {
          if (rowInfo.index === 1 && column.id === 'x' && state.page === 1) {
            return { color: 'red' }
          }
        }
      }
    ])
    expect(cols[0].getProps({ index: 0 }, { id: 'x' }, { page: 0 }).style).toEqual(undefined)
    expect(cols[0].getProps({ index: 1 }, { id: 'x' }, { page: 1 }).style).toEqual({ color: 'red' })

    // R callback
    cols = buildColumnDefs([
      {
        id: 'x',
        style: [{ color: 'red' }, { width: '100px' }, null]
      }
    ])
    expect(cols[0].getProps({ index: 0 }, {}, null).style).toEqual({ color: 'red' })
    expect(cols[0].getProps({ index: 1 }, {}, null).style).toEqual({ width: '100px' })
    expect(cols[0].getProps({ index: 2 }, {}, null).style).toEqual(null)
  })

  test('numeric cols', () => {
    let cols = buildColumnDefs([{ id: 'x', type: 'numeric' }])
    expect(cols[0].Cell({ value: 123 })).toEqual('123')
    expect(cols[0].Cell({ value: 0 })).toEqual('0')
    expect(cols[0].Cell({ value: 'Inf' })).toEqual('Inf')
    expect(cols[0].Cell({ value: '-Inf' })).toEqual('-Inf')
    expect(cols[0].align).toEqual('right')
    expect(cols[0].className).toEqual(undefined)
    expect(cols[0].getProps({ index: 0 }, {}, null).className).toEqual('rt-align-right')
    expect(cols[0].headerClassName).toEqual('rt-align-right')
    expect(cols[0].footerClassName).toEqual('rt-align-right')

    // Align override
    cols = buildColumnDefs([{ id: 'x', type: 'numeric', align: 'left' }])
    expect(cols[0].align).toEqual('left')
    expect(cols[0].className).toEqual(undefined)
    expect(cols[0].getProps({ index: 0 }, {}, null).className).toEqual('rt-align-left')
    expect(cols[0].headerClassName).toEqual('rt-align-left')
    expect(cols[0].footerClassName).toEqual('rt-align-left')
  })

  test('column alignment', () => {
    // Default: left
    let cols = buildColumnDefs([{ id: 'x' }])
    expect(cols[0].align).toEqual('left')
    expect(cols[0].className).toEqual(undefined)
    expect(cols[0].getProps({ index: 0 }, {}, null).className).toEqual('rt-align-left')
    expect(cols[0].headerClassName).toEqual('rt-align-left')
    expect(cols[0].footerClassName).toEqual('rt-align-left')

    // Left
    cols = buildColumnDefs([{ id: 'x', align: 'left' }])
    expect(cols[0].align).toEqual('left')
    expect(cols[0].className).toEqual(undefined)
    expect(cols[0].getProps({ index: 0 }, {}, null).className).toEqual('rt-align-left')
    expect(cols[0].headerClassName).toEqual('rt-align-left')
    expect(cols[0].footerClassName).toEqual('rt-align-left')

    // Right
    cols = buildColumnDefs([{ id: 'x', align: 'right' }])
    expect(cols[0].align).toEqual('right')
    expect(cols[0].className).toEqual(undefined)
    expect(cols[0].getProps({ index: 0 }, {}, null).className).toEqual('rt-align-right')
    expect(cols[0].headerClassName).toEqual('rt-align-right')
    expect(cols[0].footerClassName).toEqual('rt-align-right')

    // Center
    cols = buildColumnDefs([
      {
        id: 'x',
        align: 'center',
        className: 'col',
        headerClassName: 'hdr',
        footerClassName: 'ftr'
      }
    ])
    expect(cols[0].align).toEqual('center')
    expect(cols[0].getProps({ index: 0 }, {}, null).className).toEqual('rt-align-center col')
    expect(cols[0].headerClassName).toEqual('rt-align-center hdr')
    expect(cols[0].footerClassName).toEqual('rt-align-center ftr')
  })

  test('column vertical alignment', () => {
    // Default: top
    let cols = buildColumnDefs([{ id: 'x' }])
    expect(cols[0].vAlign).toEqual('top')
    expect(cols[0].headerVAlign).toEqual('top')
    expect(cols[0].getProps().className).toEqual('rt-align-left')
    expect(cols[0].headerClassName).toEqual('rt-align-left')
    expect(cols[0].footerClassName).toEqual('rt-align-left')

    // Top
    cols = buildColumnDefs([{ id: 'x', vAlign: 'top', headerVAlign: 'top' }])
    expect(cols[0].vAlign).toEqual('top')
    expect(cols[0].headerVAlign).toEqual('top')
    expect(cols[0].getProps().className).toEqual('rt-align-left')
    expect(cols[0].headerClassName).toEqual('rt-align-left')
    expect(cols[0].footerClassName).toEqual('rt-align-left')

    // Center
    cols = buildColumnDefs([{ id: 'x', vAlign: 'center' }])
    expect(cols[0].vAlign).toEqual('center')
    expect(cols[0].headerVAlign).toEqual('top')
    expect(cols[0].getProps().className).toEqual('rt-align-left rt-valign-center')
    expect(cols[0].headerClassName).toEqual('rt-align-left')
    expect(cols[0].footerClassName).toEqual('rt-align-left rt-valign-center')

    cols = buildColumnDefs([{ id: 'x', headerVAlign: 'center' }])
    expect(cols[0].vAlign).toEqual('top')
    expect(cols[0].headerVAlign).toEqual('center')
    expect(cols[0].getProps().className).toEqual('rt-align-left')
    expect(cols[0].headerClassName).toEqual('rt-align-left rt-valign-center')
    expect(cols[0].footerClassName).toEqual('rt-align-left')

    // Bottom
    cols = buildColumnDefs([{ id: 'x', vAlign: 'bottom', headerVAlign: 'bottom' }])
    expect(cols[0].vAlign).toEqual('bottom')
    expect(cols[0].headerVAlign).toEqual('bottom')
    expect(cols[0].getProps().className).toEqual('rt-align-left rt-valign-bottom')
    expect(cols[0].headerClassName).toEqual('rt-align-left rt-valign-bottom')
    expect(cols[0].footerClassName).toEqual('rt-align-left rt-valign-bottom')
  })

  test('column widths', () => {
    // Default widths
    let cols = buildColumnDefs([{ id: 'x' }])
    expect(cols[0].minWidth).toEqual(100)
    expect(cols[0].maxWidth).toEqual(Number.MAX_SAFE_INTEGER)
    expect(cols[0].width).toEqual(100)

    // Custom min and max widths
    cols = buildColumnDefs([{ id: 'x', minWidth: 111, maxWidth: 222 }])
    expect(cols[0].minWidth).toEqual(111)
    expect(cols[0].maxWidth).toEqual(222)
    expect(cols[0].width).toEqual(111)

    // Max width should take priority over min width
    cols = buildColumnDefs([{ id: 'x', minWidth: 111, maxWidth: 110 }])
    expect(cols[0].minWidth).toEqual(110)
    expect(cols[0].maxWidth).toEqual(110)
    expect(cols[0].width).toEqual(110)

    // Fixed width should take priority over min and max widths
    cols = buildColumnDefs([{ id: 'x', width: 99, minWidth: 111, maxWidth: 110 }])
    expect(cols[0].minWidth).toEqual(99)
    expect(cols[0].maxWidth).toEqual(99)
    expect(cols[0].width).toEqual(99)
    expect(cols[0].disableResizing).toEqual(true)

    // Fixed width columns should not be resizable
    cols = buildColumnDefs([{ id: 'x', minWidth: 111, maxWidth: 111 }])
    expect(cols[0].minWidth).toEqual(111)
    expect(cols[0].maxWidth).toEqual(111)
    expect(cols[0].width).toEqual(111)
    expect(cols[0].disableResizing).toEqual(true)
  })

  test('header sort icons', () => {
    // No sort
    let cols = buildColumnDefs([{ name: 'xy', id: 'x' }])
    expect(cols[0].Header()).toEqual('xy')
    cols = buildColumnDefs([{ name: 'xy', id: 'x' }], null, {
      sortable: false,
      showSortIcon: true
    })
    expect(cols[0].Header()).toEqual('xy')

    // Table sort - left aligned
    cols = buildColumnDefs([{ name: 'x', id: 'x' }], null, {
      sortable: true,
      showSortIcon: true
    })
    expect(cols[0].Header()).toEqual(
      <div className="rt-sort-header">
        <div className="rt-text-content">x</div>
        <span aria-hidden="true" className="rt-sort-right" />
      </div>
    )

    // Table sort - right aligned
    cols = buildColumnDefs([{ name: 'x', id: 'x', align: 'right' }], null, {
      sortable: true,
      showSortIcon: true
    })
    expect(cols[0].Header()).toEqual(
      <div className="rt-sort-header">
        <span aria-hidden="true" className="rt-sort-left" />
        <div className="rt-text-content">x</div>
      </div>
    )

    // Raw HTML
    cols = buildColumnDefs(
      [{ name: 'x', id: 'x', html: true, header: '<div>header</div>' }],
      null,
      {
        sortable: true,
        showSortIcon: true
      }
    )
    expect(cols[0].Header()).toEqual(
      <div className="rt-sort-header">
        <RawHTML html="<div>header</div>" />
        <span aria-hidden="true" className="rt-sort-right" />
      </div>
    )

    // Column sort override
    cols = buildColumnDefs([{ name: 'xy', id: 'x', align: 'center', sortable: true }], null, {
      sortable: false,
      showSortIcon: true
    })
    expect(cols[0].Header()).toEqual(
      <div className="rt-sort-header">
        <div className="rt-text-content">xy</div>
        <span aria-hidden="true" className="rt-sort-right" />
      </div>
    )

    // Hide sort icon
    cols = buildColumnDefs(
      [
        { name: 'x', id: 'x', align: 'right' },
        { name: 'y', id: 'y' }
      ],
      null,
      {
        sortable: true,
        showSortIcon: false
      }
    )
    expect(cols[0].Header()).toEqual('x')
    expect(cols[1].Header()).toEqual('y')

    // showSortable
    cols = buildColumnDefs(
      [
        { name: 'x', id: 'x', align: 'right' },
        { name: 'y', id: 'y' }
      ],
      null,
      {
        sortable: true,
        showSortIcon: true,
        showSortable: true
      }
    )
    expect(cols[0].Header()).toEqual(
      <div className="rt-sort-header">
        <span aria-hidden="true" className="rt-sort rt-sort-left" />
        <div className="rt-text-content">x</div>
      </div>
    )
    expect(cols[1].Header()).toEqual(
      <div className="rt-sort-header">
        <div className="rt-text-content">y</div>
        <span aria-hidden="true" className="rt-sort rt-sort-right" />
      </div>
    )
  })

  test('column groups', () => {
    let groups = [{ name: 'xy', columns: ['x', 'y'] }]
    let cols = buildColumnDefs([{ id: 'x' }, { id: 'y' }], groups)
    expect(cols.length).toEqual(1)
    expect(cols[0].Header()).toEqual('xy')
    expect(cols[0].columns.map(col => col.id)).toEqual(['x', 'y'])
  })

  test('column group header renderers', () => {
    let groups = [{ name: 'xy', columns: ['x', 'y'], header: () => 'group header' }]
    let cols = buildColumnDefs([{ id: 'x' }, { id: 'y' }], groups)
    expect(cols[0].Header()).toEqual('group header')

    groups = [
      { name: 'xy', columns: ['x', 'y'], header: React.createElement('div', null, 'header') }
    ]
    cols = buildColumnDefs([{ id: 'x' }, { id: 'y' }], groups)
    expect(cols[0].Header()).toEqual(React.createElement('div', null, 'header'))

    groups = [{ name: 'xy', columns: ['x', 'y'], header: '<div>header</div>', html: true }]
    cols = buildColumnDefs([{ id: 'x' }, { id: 'y' }], groups)
    expect(cols[0].Header()).toEqual(<RawHTML html="<div>header</div>" />)

    // React elements and HTML rendering don't clash
    groups = [
      {
        name: 'xy',
        columns: ['x', 'y'],
        header: React.createElement('div', null, 'header'),
        html: true
      }
    ]
    cols = buildColumnDefs([{ id: 'x' }, { id: 'y' }], groups)
    expect(cols[0].Header()).toEqual(React.createElement('div', null, 'header'))
  })

  test('column group resizing', () => {
    // Default: resizing disabled
    let groups = [{ name: 'xy', columns: ['x', 'y'] }]
    let cols = buildColumnDefs([{ id: 'x' }, { id: 'y' }], groups)
    expect(cols[0].disableResizing).toEqual(true)

    // Resizing enabled
    cols = buildColumnDefs([{ id: 'x', resizable: true }, { id: 'y' }], groups)
    expect(cols[0].disableResizing).toBeFalsy()
  })

  test('column group alignment', () => {
    // Default: center
    let groups = [{ name: 'xy', columns: ['x', 'y'] }]
    let cols = buildColumnDefs([{ id: 'x' }, { id: 'y' }], groups)
    expect(cols[0].headerClassName).toEqual('rt-align-center')

    // Left
    groups = [{ name: 'xy', columns: ['x', 'y'], align: 'left' }]
    cols = buildColumnDefs([{ id: 'x' }, { id: 'y' }], groups)
    expect(cols[0].headerClassName).toEqual('rt-align-left')

    // Right
    groups = [{ name: 'xy', columns: ['x', 'y'], align: 'right', headerClassName: 'hdr' }]
    cols = buildColumnDefs([{ id: 'x' }, { id: 'y' }], groups)
    expect(cols[0].headerClassName).toEqual('rt-align-right hdr')

    // Center
    groups = [{ name: 'xy', columns: ['x', 'y'], align: 'center' }]
    cols = buildColumnDefs([{ id: 'x' }, { id: 'y' }], groups)
    expect(cols[0].headerClassName).toEqual('rt-align-center')
  })

  test('column group vertical alignment', () => {
    // Default: top
    let groups = [{ name: 'xy', columns: ['x', 'y'] }]
    let cols = buildColumnDefs([{ id: 'x' }, { id: 'y' }], groups)
    expect(cols[0].headerVAlign).toEqual('top')
    expect(cols[0].headerClassName).toEqual('rt-align-center')

    // Top
    groups = [{ name: 'xy', columns: ['x', 'y'], headerVAlign: 'top' }]
    cols = buildColumnDefs([{ id: 'x' }, { id: 'y' }], groups)
    expect(cols[0].headerVAlign).toEqual('top')
    expect(cols[0].headerClassName).toEqual('rt-align-center')

    // Center
    groups = [{ name: 'xy', columns: ['x', 'y'], headerVAlign: 'center' }]
    cols = buildColumnDefs([{ id: 'x' }, { id: 'y' }], groups)
    expect(cols[0].headerVAlign).toEqual('center')
    expect(cols[0].headerClassName).toEqual('rt-align-center rt-valign-center')

    // Bottom
    groups = [{ name: 'xy', columns: ['x', 'y'], headerVAlign: 'bottom' }]
    cols = buildColumnDefs([{ id: 'x' }, { id: 'y' }], groups)
    expect(cols[0].headerVAlign).toEqual('bottom')
    expect(cols[0].headerClassName).toEqual('rt-align-center rt-valign-bottom')
  })

  test("columns and groups aren't mutated", () => {
    const groups = [{ name: 'xy', columns: ['x', 'y'] }]
    const columns = [{ id: 'x' }, { id: 'y' }]
    let cols = buildColumnDefs(columns, groups)
    expect(cols[0].Header()).toEqual('xy')
    expect(columns).toEqual([{ id: 'x' }, { id: 'y' }])
    expect(groups).toEqual([{ name: 'xy', columns: ['x', 'y'] }])
  })
})

describe('addColumnGroups', () => {
  test('adjacent group', () => {
    const columns = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const groups = [{ id: 'ab', columns: ['a', 'b'] }]
    let newCols = addColumnGroups(columns, groups)
    expect(newCols).toEqual([
      { id: 'ab', columns: [{ id: 'a' }, { id: 'b' }] },
      { columns: [{ id: 'c' }], isUngrouped: true }
    ])
  })

  test('split group', () => {
    const columns = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
    const groups = [{ id: 'bd', columns: ['b', 'd'] }]
    let newCols = addColumnGroups(columns, groups)
    expect(newCols).toEqual([
      { columns: [{ id: 'a' }], isUngrouped: true },
      { id: 'bd', columns: [{ id: 'b' }, { id: 'd' }] },
      { columns: [{ id: 'c' }], isUngrouped: true }
    ])
  })
})

describe('createCompareFunction', () => {
  test('compare values', () => {
    const compareNumbers = createCompareFunction()
    const tests = [
      ['aa', 'aa', 0],
      ['AAA', 'aaa', 0],
      ['a', 'b', -1],
      ['b', 'a', 1],
      ['aaa', 'aaab', -1],
      ['xyz', null, 1],
      [null, 'Z', -1],
      [null, null, 0],
      [null, 'Inf', -1],
      [true, false, 1],
      [false, true, -1],
      [true, true, 0]
    ]
    tests.forEach(([a, b, order]) => {
      expect(compareNumbers(a, b)).toEqual(order)
    })
  })

  test('compare values with naLast', () => {
    const compareNumbers = createCompareFunction({ naLast: true })
    const tests = [
      [null, 'a', true, -1],
      [null, 'gh', false, 1],
      ['agh', null, true, 1],
      ['augh', null, false, -1],
      [null, null, true, 0],
      [null, null, false, 0]
    ]
    tests.forEach(([a, b, desc, order]) => {
      expect(compareNumbers(a, b, desc)).toEqual(order)
    })
  })

  test('compare numbers', () => {
    const compareNumbers = createCompareFunction({ type: 'numeric' })
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

  test('compare numbers with naLast', () => {
    const compareNumbers = createCompareFunction({ type: 'numeric', naLast: true })
    const tests = [
      ['NA', 0, true, -1],
      ['NA', 0, false, 1],
      [0, 'NA', true, 1],
      [0, 'NA', false, -1],
      ['NA', '-Inf', true, -1],
      ['-Inf', 'NA', false, -1],
      ['NA', 'NA', true, 0],
      ['NA', 'NA', false, 0]
    ]
    tests.forEach(([a, b, desc, order]) => {
      expect(compareNumbers(a, b, desc)).toEqual(order)
    })
  })
})

describe('formatValue', () => {
  test('no options', () => {
    expect(formatValue(125253.125, {})).toEqual(125253.125)
    expect(formatValue('string', {})).toEqual('string')
    expect(formatValue(true, {})).toEqual(true)
  })

  test('prefix/suffix', () => {
    expect(formatValue(123, { prefix: 'a' })).toEqual('a123')
    expect(formatValue(123, { suffix: 'b' })).toEqual('123b')
    expect(formatValue('bc', { prefix: 'a', suffix: 'd' })).toEqual('abcd')
    const options = { prefix: 'amt: ', suffix: ' dollaroos', currency: 'USD', locales: 'en-US' }
    expect(formatValue(123.1, options)).toEqual('amt: $123.10 dollaroos')
    // Non-string prefix/suffix
    expect(formatValue(123, { prefix: 5, suffix: 0 })).toEqual('51230')
    expect(formatValue(123, { prefix: 0, suffix: true })).toEqual('0123true')
    // Prefix/suffix with null value
    expect(formatValue(null, { prefix: 'a', suffix: 'b' })).toEqual('ab')
    expect(formatValue(undefined, { suffix: 'b' })).toEqual('b')
  })

  test('digits', () => {
    expect(formatValue(123.125, { digits: 0 })).toEqual('123')
    expect(formatValue(123.125, { digits: 2 })).toEqual('123.13')
    expect(formatValue(123.1, { digits: 3 })).toEqual('123.100')
    expect(formatValue(24, { digits: 1 })).toEqual('24.0')
    // Should limit to 18 digits
    expect(formatValue(24, { digits: 20 })).toEqual('24.000000000000000000')
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
    // Shouldn't be any precision errors (0.569 * 100)
    expect(formatValue(0.569, { percent: true })).toEqual('56.9%')
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

    // YYYY-MM-DD dates should be formatted in local time
    expect(formatValue('2018-03-22', { date: true, locales: 'en-US' })).toEqual('3/22/2018')
  })

  test('locales', () => {
    expect(formatValue(125253.125, { locales: 'en-US' })).toEqual('125253.125')
    expect(formatValue(125253.125, { locales: ['en-US'] })).toEqual('125253.125')
    // Fallback locale
    expect(formatValue(125253.125, { locales: ['xx-XX', 'en-US'] })).toEqual('125253.125')
  })
})

test('createsStartsWithMatcher', () => {
  let match = createStartsWithMatcher('string')
  expect(match(undefined)).toEqual(false)
  expect(match('')).toEqual(false)
  expect(match('storing')).toEqual(false)
  expect(match('ring')).toEqual(false)
  expect(match('not string')).toEqual(false)

  expect(match('string')).toEqual(true)
  expect(match('sTrInG')).toEqual(true)
  expect(match('stringuh')).toEqual(true)

  // Should match strings with diacritics
  match = createStartsWithMatcher('á')
  expect(match('a')).toEqual(false)
  expect(match('ááád')).toEqual(true)
  expect(match('ÁÁ')).toEqual(true)

  // Should escape regex strings
  match = createStartsWithMatcher('[.*+?^${}()|\\]')
  expect(match('[.*+?^${}()|\\]')).toEqual(true)
})

test('createSubstringMatcher', () => {
  let match = createSubstringMatcher('string')
  expect(match(undefined)).toEqual(false)
  expect(match('')).toEqual(false)
  expect(match('storing')).toEqual(false)
  expect(match('ring')).toEqual(false)

  expect(match('string')).toEqual(true)
  expect(match('sTrInG')).toEqual(true)
  expect(match('stringuh')).toEqual(true)
  expect(match('Astringuh')).toEqual(true)
  expect(match('not string')).toEqual(true)

  // Should match strings with diacritics
  match = createSubstringMatcher('á')
  expect(match('a')).toEqual(false)
  expect(match('ááád')).toEqual(true)
  expect(match('ÁÁ')).toEqual(true)

  // Should escape regex strings
  match = createStartsWithMatcher('[.*+?^${}()|\\]')
  expect(match('[.*+?^${}()|\\]')).toEqual(true)
})
