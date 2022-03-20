import React from 'react'
import reactR from 'reactR'
import { render, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { matchers } from '@emotion/jest'

import Reactable, { getInstance } from '../Reactable.v2'
import * as reactable from '../Reactable.v2'
import { downloadCSV } from '../utils'

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  downloadCSV: jest.fn()
}))

jest.mock('reactR')
reactR.hydrate = (components, tag) => tag

afterEach(() => jest.clearAllMocks())

expect.extend(matchers)

const getRoot = container => container.querySelector('.Reactable.ReactTable')
const getTable = container => container.querySelector('.rt-table')
const getThead = container => container.querySelector('.rt-thead')
const getTbody = container => container.querySelector('.rt-tbody')
const getTfoot = container => container.querySelector('.rt-tfoot')
const getHeaderRows = container =>
  container.querySelectorAll('.rt-thead .rt-tr:not(.rt-tr-filters)')
const getFooterRow = container => container.querySelector('.rt-tfoot .rt-tr')
const getRowGroups = container => container.querySelectorAll('.rt-tbody .rt-tr-group')
const getRows = (container, selectors = '') =>
  container.querySelectorAll('.rt-tbody .rt-tr' + selectors)
const getDataRows = container => container.querySelectorAll('.rt-tbody .rt-tr:not(.rt-tr-pad)')
const getPadRows = container => container.querySelectorAll('.rt-tbody .rt-tr-pad')
const getGroupHeaders = (container, selectors = '') =>
  container.querySelectorAll('.rt-th-group' + selectors)
const getUngroupedHeaders = container => container.querySelectorAll('.rt-th-group-none')
const getHeaders = (container, selectors = '') => container.querySelectorAll('.rt-th' + selectors)
const getColumnHeaders = container => container.querySelectorAll('.rt-tr-header .rt-th')
const getSortableHeaders = container => container.querySelectorAll('.rt-th[aria-sort]')
const getResizableHeaders = container => container.querySelectorAll('.rt-th-resizable')
const getResizers = container => container.querySelectorAll('.rt-resizer')
const getCells = (container, selectors = '') =>
  container.querySelectorAll('.rt-tbody .rt-td' + selectors)
const getDataCells = (container, selectors = '') =>
  container.querySelectorAll('.rt-tbody .rt-tr:not(.rt-tr-pad) .rt-td' + selectors)
const getCellsText = (container, selectors) => {
  return [...getCells(container, selectors)].map(cell => cell.textContent)
}
const getFooters = (container, selectors = '') =>
  container.querySelectorAll('.rt-td.rt-td-footer' + selectors)
const getFilterRow = container => container.querySelector('.rt-thead .rt-tr.rt-tr-filters')
const getFilterCells = container => container.querySelectorAll('.rt-td-filter')
const getFilters = container => container.querySelectorAll('.rt-filter')
const getSearchInput = container => container.querySelector('.rt-search')
const getNoData = container => container.querySelector('.rt-no-data')
const getExpandableCells = container => container.querySelectorAll('.rt-td-expandable')
const getExpanders = container => container.querySelectorAll('.rt-expander-button')
const getExpanderIcons = container => container.querySelectorAll('.rt-expander')
const getRowDetails = container => container.querySelectorAll('.rt-tr-details')
const getSelectRowCells = container => container.querySelectorAll('.rt-td-select')
const getSelectRowRadios = container => container.querySelectorAll('.rt-select-input[type="radio"]')
const getSelectRowCheckboxes = container =>
  container.querySelectorAll('.rt-select-input[type="checkbox"]')
// Pagination
const getPagination = container => container.querySelector('.rt-pagination')
const getPageInfo = container => container.querySelector('.rt-page-info')
const getPageSizeOptions = container => container.querySelector('.rt-page-size')
const getPageSizeSelect = container => container.querySelector('.rt-page-size-select')
const getPrevButton = container => container.querySelector('.rt-prev-button')
const getNextButton = container => container.querySelector('.rt-next-button')
const getPageNumbers = container => container.querySelector('.rt-page-numbers')
const getPageButtons = container => container.querySelectorAll('.rt-page-button')
const getPageJump = container => container.querySelector('.rt-page-jump')

describe('tables', () => {
  it('renders tables', () => {
    const props = {
      data: { a: [1, 2], b: ['aa', 'bb'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const rootContainer = getRoot(container)
    expect(rootContainer).toBeVisible()
    const table = getTable(container)
    expect(table).toBeVisible()
    expect(table).toHaveAttribute('role', 'table')
  })

  it('applies table styles', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }],
      className: 'my-tbl',
      style: { background: 'my-tbl' }
    }
    const { container, rerender } = render(<Reactable {...props} />)
    const rootContainer = getRoot(container)
    expect(rootContainer).toHaveClass('my-tbl')
    expect(rootContainer).toHaveStyle('background: my-tbl')
    expect(rootContainer).not.toHaveClass(
      'rt-outlined',
      'rt-bordered',
      'rt-borderless',
      'rt-compact',
      'rt-inline',
      'rt-nowrap'
    )

    rerender(<Reactable {...props} outlined />)
    expect(rootContainer).toHaveClass('rt-outlined')

    rerender(<Reactable {...props} bordered />)
    expect(rootContainer).toHaveClass('rt-bordered')

    rerender(<Reactable {...props} borderless />)
    expect(rootContainer).toHaveClass('rt-borderless')

    rerender(<Reactable {...props} compact />)
    expect(rootContainer).toHaveClass('rt-compact')

    rerender(<Reactable {...props} nowrap />)
    expect(rootContainer).toHaveClass('rt-nowrap')

    rerender(<Reactable {...props} inline />)
    expect(rootContainer).toHaveClass('rt-inline')

    rerender(<Reactable {...props} outlined bordered borderless nowrap inline />)
    expect(rootContainer).toHaveClass('rt-outlined rt-bordered rt-borderless rt-inline rt-nowrap')
  })

  it('applies width and height', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }],
      width: 100,
      height: '100%',
      style: { background: 'blue' }
    }
    const { container } = render(<Reactable {...props} />)
    const rootContainer = getRoot(container)
    expect(rootContainer).toHaveStyle('width: 100px; height: 100%;')
  })

  it('style overrides width and height', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }],
      width: 100,
      height: '100%',
      style: { width: 500, height: '30px' }
    }
    const { container } = render(<Reactable {...props} />)
    const rootContainer = getRoot(container)
    expect(rootContainer).toHaveStyle('width: 500px; height: 30px;')
  })

  it('table updates when data or columns change', () => {
    const props = {
      data: { a: ['a-1', 'a-2'] },
      columns: [{ name: 'col-a', accessor: 'a', className: 'cell-a' }]
    }
    const { container, getByText, rerender } = render(<Reactable {...props} />)
    expect(getByText('a-1')).toBeVisible()
    rerender(<Reactable {...props} data={{ a: ['b-1', 'b-2'] }} />)
    expect(getByText('b-1')).toBeVisible()
    getCells(container).forEach(cell => expect(cell).toHaveClass('cell-a'))
    rerender(<Reactable {...props} columns={[{ name: 'col-a', accessor: 'a' }]} />)
    getCells(container).forEach(cell => expect(cell).not.toHaveClass('cell-a'))
  })

  it('table resets state when dataKey changes', () => {
    const props = {
      data: { a: ['a-1', 'a-2'] },
      columns: [{ name: 'col-a', accessor: 'a' }],
      dataKey: 'my-data-1',
      searchable: true
    }
    const { container, getByText, rerender } = render(<Reactable {...props} />)
    let searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'a-2' } })
    expect(getByText('a-2')).toBeVisible()
    let rows = getDataRows(container)
    expect(rows).toHaveLength(1)

    rerender(<Reactable {...props} />)
    searchInput = getSearchInput(container)
    expect(searchInput.value).toEqual('a-2')
    expect(getByText('a-2')).toBeVisible()
    rows = getDataRows(container)
    expect(rows).toHaveLength(1)

    rerender(<Reactable {...props} dataKey="your-data-2" />)
    searchInput = getSearchInput(container)
    expect(searchInput.value).toEqual('')
    rows = getDataRows(container)
    expect(rows).toHaveLength(2)
  })
})

describe('tbody', () => {
  it('renders tbody', () => {
    const props = {
      data: { a: [1, 2], b: ['aa', 'bb'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const tbody = getTbody(container)
    expect(tbody).toHaveAttribute('role', 'rowgroup')
  })
})

describe('row groups', () => {
  it('renders row groups', () => {
    const props = {
      data: { a: [1, 2], b: ['aa', 'bb'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const rowGroups = getRowGroups(container)
    expect(rowGroups).toHaveLength(2)
    rowGroups.forEach(rowGroup => expect(rowGroup).not.toHaveAttribute('role'))
  })
})

describe('rows', () => {
  it('renders rows', () => {
    const props = {
      data: { a: [1, 2], b: ['aa', 'bb'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const rows = getRows(container)
    expect(rows).toHaveLength(2)
    rows.forEach(row => expect(row).toHaveAttribute('role', 'row'))
  })

  it('applies row classes and styles', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['a', 'b', 'c'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      rowClassName: 'my-row',
      rowStyle: { backgroundColor: 'red' }
    }
    const { container } = render(<Reactable {...props} />)
    const rows = getRows(container)
    rows.forEach(row => {
      expect(row).toHaveClass('my-row')
      expect(row).toHaveStyle('background-color: red;')
    })
  })

  it('applies row classes and styles from JS functions', () => {
    const assertProps = (rowInfo, state) => {
      if (rowInfo) {
        expect(rowInfo.index >= 0).toEqual(true)
        expect(rowInfo.viewIndex >= 0).toEqual(true)
        expect(rowInfo.values.a).toEqual(['cellA', 'cellB', 'cellC'][rowInfo.index])
        expect(rowInfo.row.a).toEqual(['cellA', 'cellB', 'cellC'][rowInfo.index])
        expect(rowInfo.level).toEqual(0)
        expect(rowInfo.aggregated).toBeFalsy()
        expect(rowInfo.expanded).toBeFalsy()
        expect(rowInfo.selected).toEqual(false)
        expect(rowInfo.subRows).toEqual([])
      }
      expect(state.page).toEqual(0)
      expect(state.pageSize).toEqual(10)
      expect(state.pages).toEqual(1)
      expect(state.sorted).toEqual([{ id: 'a', desc: true }])
      expect(state.groupBy).toEqual([])
      expect(state.filters).toEqual([])
      expect(state.searchValue).toEqual(undefined)
      expect(state.selected).toEqual([])
      expect(state.pageRows).toEqual([
        { a: 'cellC', b: 'c' },
        { a: 'cellB', b: 'b' },
        { a: 'cellA', b: 'a' }
      ])
      expect(state.sortedData).toEqual([
        { a: 'cellC', b: 'c' },
        { a: 'cellB', b: 'b' },
        { a: 'cellA', b: 'a' }
      ])
      expect(state.data).toEqual([
        { a: 'cellA', b: 'a' },
        { a: 'cellB', b: 'b' },
        { a: 'cellC', b: 'c' }
      ])
    }
    const props = {
      data: { a: ['cellA', 'cellB', 'cellC'], b: ['a', 'b', 'c'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      minRows: 5,
      rowClassName: (rowInfo, state) => {
        assertProps(rowInfo, state)
        if (!rowInfo) {
          return 'pad-row'
        }
        if (rowInfo.viewIndex === 0 && state.page === 0) {
          return 'my-row'
        }
      },
      rowStyle: (rowInfo, state) => {
        assertProps(rowInfo, state)
        if (!rowInfo) {
          return { backgroundColor: 'blue' }
        }
        if (rowInfo.viewIndex === 0 && state.page === 0) {
          return { backgroundColor: 'red' }
        }
      },
      defaultSorted: [{ id: 'a', desc: true }]
    }
    const { container } = render(<Reactable {...props} />)
    const rows = getRows(container)
    rows.forEach((row, i) => {
      if (i === 0) {
        expect(row).toHaveClass('my-row')
        expect(row).toHaveStyle('background-color: red;')
      } else if (i < 3) {
        expect(row).not.toHaveClass('my-row')
        expect(row).not.toHaveStyle('background-color: red;')
      } else {
        // Padding rows
        expect(row).toHaveClass('pad-row')
        expect(row).toHaveStyle('background-color: blue;')
      }
    })
  })

  it('applies classes and styles from R functions', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['a', 'b', 'c'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      minRows: 5,
      rowClassName: ['row1', 'row2', null],
      rowStyle: [{ backgroundColor: 'red' }, { backgroundColor: 'blue' }, null]
    }
    const { container } = render(<Reactable {...props} />)
    const rows = getRows(container)
    rows.forEach((row, i) => {
      if (i === 0) {
        expect(row).toHaveClass('row1')
        expect(row).toHaveStyle('background-color: red;')
      } else if (i === 1) {
        expect(row).toHaveClass('row2')
        expect(row).toHaveStyle('background-color: blue;')
      } else {
        // Unstyled row and padding rows (ignored)
        expect(row).not.toHaveClass('row1')
        expect(row).not.toHaveClass('row2')
        expect(row).not.toHaveStyle('background-color: red;')
        expect(row).not.toHaveStyle('background-color: blue;')
      }
    })
  })

  it('applies row stripe styles', () => {
    const props = {
      data: { a: [1, 2, 3, 4] },
      columns: [{ name: 'a', accessor: 'a' }],
      striped: true,
      minRows: 8
    }
    const { container } = render(<Reactable {...props} />)
    const rows = getRows(container)
    expect(rows[0]).toHaveClass('rt-tr-striped')
    expect(rows[1]).not.toHaveClass('rt-tr-striped')
    expect(rows[2]).toHaveClass('rt-tr-striped')
    expect(rows[3]).not.toHaveClass('rt-tr-striped')
    const padRows = getPadRows(container)
    padRows.forEach(row => expect(row).not.toHaveClass('rt-tr-striped'))
  })

  it('applies row highlight styles', () => {
    const props = {
      data: { a: [1, 2, 3, 4] },
      columns: [{ name: 'a', accessor: 'a' }],
      striped: true,
      highlight: true,
      minRows: 8
    }
    const { container } = render(<Reactable {...props} />)
    const rows = getDataRows(container)
    rows.forEach(row => expect(row).toHaveClass('rt-tr-highlight'))
    const padRows = getPadRows(container)
    padRows.forEach(row => expect(row).not.toHaveClass('rt-tr-highlight'))
  })

  it('classes work with row striping and highlighting', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['a', 'b', 'c'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      striped: true,
      highlight: true,
      rowClassName: 'my-row',
      minRows: 3
    }
    const { container } = render(<Reactable {...props} />)
    const rows = getRows(container)
    rows.forEach((row, index) => {
      expect(row).toHaveClass('my-row')
      expect(row).toHaveClass('rt-tr-highlight')
      if (index % 2 === 0) {
        expect(row).toHaveClass('rt-tr-striped')
      }
    })
  })

  it('should not style header and footer rows', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['a', 'b', 'c'] },
      columns: [
        { name: 'a', accessor: 'a', footer: 'footer-a' },
        { name: 'b', accessor: 'b', footer: 'footer-b' }
      ],
      columnGroups: [{ name: 'group-a', columns: ['a', 'b'] }],
      striped: true,
      highlight: true,
      rowClassName: 'my-row',
      rowStyle: { color: 'red' }
    }
    const { container } = render(<Reactable {...props} />)
    const headerRows = getHeaderRows(container)
    const footerRow = getFooterRow(container)
    const rows = [...headerRows, footerRow]
    expect(rows).toHaveLength(3)
    rows.forEach(row => {
      expect(row).not.toHaveClass('my-row')
      expect(row).not.toHaveStyle('color: red')
      expect(row).not.toHaveClass('rt-tr-highlight')
      expect(row).not.toHaveClass('rt-tr-striped')
    })
  })
})

describe('pad rows', () => {
  it('renders pad rows', () => {
    const { container } = render(
      <Reactable
        data={{ a: [1, 3, 2, 5], b: ['aa', 'CC', 'dd', 'BB'] }}
        columns={[
          { name: 'colA', accessor: 'a' },
          { name: 'colB', accessor: 'b' }
        ]}
        minRows={10}
      />
    )
    const rows = getRows(container)
    expect(rows).toHaveLength(10)
    const dataRows = getDataRows(container)
    expect(dataRows).toHaveLength(4)
    const padRows = getPadRows(container)
    expect(padRows).toHaveLength(6)
    rows.forEach(row => expect(row).toHaveAttribute('role', 'row'))
    padRows.forEach(row => {
      const cells = getCells(row)
      expect(cells).toHaveLength(2)
      cells.forEach(cell =>
        // Should not have colspan attribute (from react-table)
        expect(cell).not.toHaveAttribute('colspan')
      )
    })
  })

  it('pad rows should be hidden from accessibility tree', () => {
    const { container } = render(
      <Reactable
        data={{ a: [1, 3, 2, 5], b: ['aa', 'CC', 'dd', 'BB'] }}
        columns={[
          { name: 'colA', accessor: 'a' },
          { name: 'colB', accessor: 'b' }
        ]}
        minRows={6}
      />
    )
    // Padding rows should be hidden via their parent row groups
    const padRows = getPadRows(container)
    expect(padRows).toHaveLength(2)
    padRows.forEach(row => expect(row.parentElement).toHaveAttribute('aria-hidden', 'true'))
  })

  it('renders a minimum of 1 row by default', () => {
    const { container } = render(
      <Reactable data={{ a: [] }} columns={[{ name: 'a', accessor: 'a' }]} />
    )
    const dataRows = getDataRows(container)
    expect(dataRows).toHaveLength(0)
    const padRows = getPadRows(container)
    expect(padRows).toHaveLength(1)
  })

  it('always renders at least 1 row', () => {
    const { container } = render(
      <Reactable data={{ a: [] }} columns={[{ name: 'a', accessor: 'a' }]} minRows={-5} />
    )
    const dataRows = getDataRows(container)
    expect(dataRows).toHaveLength(0)
    const padRows = getPadRows(container)
    expect(padRows).toHaveLength(1)
  })

  it('should not render padding cells for hidden columns', () => {
    const { container } = render(
      <Reactable
        data={{ a: [1, 3], b: ['aa', 'CC'], c: [5, 6] }}
        columns={[
          { name: 'colA', accessor: 'a' },
          { name: 'colB', accessor: 'b', show: false },
          { name: 'colC', accessor: 'c' }
        ]}
        minRows={4}
      />
    )
    const rows = getRows(container)
    expect(rows).toHaveLength(4)
    const dataRows = getDataRows(container)
    expect(dataRows).toHaveLength(2)
    const padRows = getPadRows(container)
    expect(padRows).toHaveLength(2)
    expect(getCells(padRows[0])).toHaveLength(2)
    expect(getCells(padRows[1])).toHaveLength(2)
  })

  it('applies row classes and styles', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      rowClassName: 'my-row',
      rowStyle: { backgroundColor: 'red' },
      minRows: 4
    }
    const { container } = render(<Reactable {...props} />)
    const padRows = getPadRows(container)
    expect(padRows).toHaveLength(2)
    padRows.forEach(row => {
      expect(row).toHaveClass('my-row')
      expect(row).toHaveStyle('background-color: red;')
    })
  })
})

describe('cells', () => {
  it('renders cells', () => {
    const props = {
      data: {
        a: [123, 246, -369],
        b: ['aa', 'bb', ''],
        c: [true, false, null],
        d: ['2019-03-04', '1955-12-12', '2000-01-30'],
        e: [[1, 2, 3], ['a'], []]
      },
      columns: [
        { name: 'num', accessor: 'a', type: 'numeric' },
        { name: 'str', accessor: 'b', type: 'character' },
        { name: 'bool', accessor: 'c', type: 'logical' },
        { name: 'date', accessor: 'd', type: 'date' },
        { name: 'list', accessor: 'e', type: 'list' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const cells = getCells(container)
    const expectedText = [
      '123',
      'aa',
      'true',
      '2019-03-04',
      '1,2,3',
      '246',
      'bb',
      'false',
      '1955-12-12',
      'a',
      '-369',
      '\u200b',
      '\u200b',
      '2000-01-30',
      ''
    ]
    cells.forEach((cell, i) => {
      expect(cell.textContent).toEqual(expectedText[i])
      expect(cell).toHaveAttribute('role', 'cell')
    })
  })

  it('renders row headers', () => {
    const props = {
      data: {
        a: [1, 2, 3],
        b: ['a', 'b', 'c']
      },
      columns: [
        { name: 'a', accessor: 'a', rowHeader: true, className: 'col-a' },
        { name: 'b', accessor: 'b', className: 'col-b' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const cellsA = getCells(container, '.col-a')
    const cellsB = getCells(container, '.col-b')
    cellsA.forEach(cell => expect(cell).toHaveAttribute('role', 'rowheader'))
    cellsB.forEach(cell => expect(cell).toHaveAttribute('role', 'cell'))
  })

  it('cell render function (JS)', () => {
    const assertProps = (cellInfo, state) => {
      expect(cellInfo.column.id).toEqual('a')
      expect(cellInfo.column.name).toEqual('colA')
      expect(cellInfo.index >= 0).toEqual(true)
      expect(cellInfo.viewIndex >= 0).toEqual(true)
      expect(cellInfo.value).toEqual([1, 2][cellInfo.index])
      expect(cellInfo.level).toEqual(0)
      expect(cellInfo.aggregated).toBeFalsy()
      expect(cellInfo.filterValue).toEqual(undefined)
      expect(cellInfo.subRows).toEqual([])
      expect(cellInfo.row).toEqual(
        [
          { a: 1, b: 'a', c: true },
          { a: 2, b: 'b', c: false }
        ][cellInfo.index]
      )
      expect(cellInfo.page).toEqual(0)
      expect(cellInfo.expanded).toBeFalsy()
      expect(cellInfo.selected).toEqual(false)
      expect(state.page).toEqual(0)
      expect(state.pageSize).toEqual(10)
      expect(state.pages).toEqual(1)
      expect(state.sorted).toEqual([])
      expect(state.groupBy).toEqual([])
      expect(state.filters).toEqual([])
      expect(state.searchValue).toEqual(undefined)
      expect(state.selected).toEqual([])
      expect(state.pageRows).toEqual([
        { a: 1, b: 'a', c: true },
        { a: 2, b: 'b', c: false }
      ])
      expect(state.sortedData).toEqual([
        { a: 1, b: 'a', c: true },
        { a: 2, b: 'b', c: false }
      ])
      expect(state.data).toEqual([
        { a: 1, b: 'a', c: true },
        { a: 2, b: 'b', c: false }
      ])
    }
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], c: [true, false] },
      columns: [
        {
          name: 'colA',
          accessor: 'a',
          cell: (cellInfo, state) => {
            assertProps(cellInfo, state)
            return (
              `<span>${cellInfo.value}</span> ` +
              `<span>(row ${cellInfo.index} ${cellInfo.viewIndex})</span> ` +
              `page ${state.page}`
            )
          },
          html: true,
          className: 'col-a'
        },
        { name: 'colB', accessor: 'b', cell: () => '', className: 'col-b' },
        { name: 'colC', accessor: 'c' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const cellsA = getCells(container, '.col-a')
    expect(cellsA[0].textContent).toEqual('1 (row 0 0) page 0')
    expect(cellsA[1].textContent).toEqual('2 (row 1 1) page 0')
    const cellsB = getCells(container, '.col-b')
    expect(cellsB[0].textContent).toEqual('\u200b')
    expect(cellsB[1].textContent).toEqual('\u200b')
  })

  it('cell render function (R)', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], c: [true, false] },
      columns: [
        {
          name: 'colA',
          accessor: 'a',
          cell: [`<span>cellA</span>`, ''],
          html: true,
          className: 'col-a'
        },
        { name: 'colB', accessor: 'b', cell: [<div key={0}>cellB</div>, null], className: 'col-b' },
        { name: 'colC', accessor: 'c' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const cellsA = getCells(container, '.col-a')
    expect(cellsA[0].innerHTML).toEqual(
      `<div class="rt-td-inner"><div class="rt-text-content" style="display: inline;"><span>cellA</span></div></div>`
    )
    expect(cellsA[1].textContent).toEqual('\u200b')
    const cellsB = getCells(container, '.col-b')
    expect(cellsB[0].innerHTML).toEqual('<div class="rt-td-inner"><div>cellB</div></div>')
    expect(cellsB[1].textContent).toEqual('\u200b')
  })

  it('renders cells with path characters in accessor', () => {
    const props = {
      data: {
        'a.b': [1],
        'x[]': ['a'],
        'x[0].b': ['b']
      },
      columns: [
        { name: 'a.b', accessor: 'a.b' },
        { name: 'x[]', accessor: 'x[]' },
        { name: 'x[0].b', accessor: 'x[0].b' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    expect(getCellsText(container)).toEqual(['1', 'a', 'b'])
  })

  it('cell formatting', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        {
          name: 'colA',
          accessor: 'a',
          format: { cell: { prefix: 'cell__', suffix: '__@' }, aggregated: { prefix: 'agg' } },
          cell: cellInfo => `${cellInfo.value}-a`,
          className: 'col-a'
        },
        { name: 'colB', accessor: 'b' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    expect(getCellsText(container, '.col-a')).toEqual(['cell__1__@-a', 'cell__2__@-a'])
  })

  it('applies cell classes and styles', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        {
          name: 'colA',
          accessor: 'a',
          className: 'my-cell',
          style: { backgroundColor: 'red' }
        },
        { name: 'colB', accessor: 'b' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const cells = getCells(container)
    expect(cells[0]).toHaveClass('my-cell')
    expect(cells[0]).toHaveStyle('background-color: red;')
    expect(cells[2]).toHaveClass('my-cell')
    expect(cells[2]).toHaveStyle('background-color: red;')
  })

  it('applies cell classes and styles from JS functions', () => {
    const assertProps = (rowInfo, colInfo, state) => {
      expect(rowInfo.index >= 0).toEqual(true)
      expect(rowInfo.viewIndex >= 0).toEqual(true)
      expect(rowInfo.level).toEqual(0)
      expect(rowInfo.aggregated).toBeFalsy()
      expect(rowInfo.expanded).toBeFalsy()
      expect(rowInfo.selected).toEqual(false)
      expect(rowInfo.subRows).toEqual([])
      expect(rowInfo.values.a).toEqual(['cellA', 'cellB'][rowInfo.index])
      expect(rowInfo.row.a).toEqual(['cellA', 'cellB'][rowInfo.index])
      expect(colInfo.id).toEqual('a')
      expect(colInfo.name).toEqual('colA')
      expect(state.page).toEqual(0)
      expect(state.pageSize).toEqual(7)
      expect(state.pages).toEqual(1)
      expect(state.sorted).toEqual([{ id: 'a', desc: false }])
      expect(state.groupBy).toEqual([])
      expect(state.filters).toEqual([])
      expect(state.searchValue).toEqual(undefined)
      expect(state.selected).toEqual([])
      expect(state.pageRows).toEqual([{ a: 'cellA' }, { a: 'cellB' }])
      expect(state.sortedData).toEqual([{ a: 'cellA' }, { a: 'cellB' }])
      expect(state.data).toEqual([{ a: 'cellA' }, { a: 'cellB' }])
    }
    const props = {
      data: { a: ['cellA', 'cellB'] },
      columns: [
        {
          name: 'colA',
          accessor: 'a',
          className: (rowInfo, colInfo, state) => {
            assertProps(rowInfo, colInfo, state)
            if (rowInfo.index === 0 && colInfo.id === 'a' && state.page === 0) {
              return 'my-cell'
            }
          },
          style: (rowInfo, colInfo, state) => {
            assertProps(rowInfo, colInfo, state)
            if (rowInfo.index === 0 && colInfo.id === 'a' && state.page === 0) {
              return { backgroundColor: 'red' }
            }
          }
        }
      ],
      defaultSorted: [{ id: 'a', desc: false }],
      defaultPageSize: 7
    }
    const { container } = render(<Reactable {...props} />)
    const [cellA, cellB] = getCells(container)
    expect(cellA).toHaveClass('my-cell')
    expect(cellA).toHaveStyle('background-color: red;')
    expect(cellB).not.toHaveClass('my-cell')
    expect(cellB).not.toHaveStyle('background-color: red;')
  })

  it('applies classes and styles from R functions', () => {
    const props = {
      data: { a: ['cellA', 'cellB'] },
      columns: [
        {
          name: 'colA',
          accessor: 'a',
          className: ['my-cell', null],
          style: [{ backgroundColor: 'red' }, null]
        }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const [cellA, cellB] = getCells(container)
    expect(cellA).toHaveClass('my-cell')
    expect(cellA).toHaveStyle('background-color: red;')
    expect(cellB).not.toHaveClass('my-cell')
    expect(cellB).not.toHaveStyle('background-color: red;')
  })

  it('cell alignment', () => {
    const props = {
      data: { a: ['a'], b: [1], c: [3], d: [5], e: [8] },
      columns: [
        { name: 'default', accessor: 'a', className: 'default' },
        { name: 'default-num', accessor: 'b', type: 'numeric', className: 'default-num' },
        { name: 'left', accessor: 'c', align: 'left', className: 'left' },
        { name: 'right', accessor: 'd', align: 'right', className: 'right' },
        { name: 'center', accessor: 'e', align: 'center', className: 'center' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    expect(getCells(container, '.default')[0]).toHaveClass('rt-align-left')
    expect(getCells(container, '.default-num')[0]).toHaveClass('rt-align-right')
    expect(getCells(container, '.left')[0]).toHaveClass('rt-align-left')
    expect(getCells(container, '.right')[0]).toHaveClass('rt-align-right')
    expect(getCells(container, '.center')[0]).toHaveClass('rt-align-center')
  })

  it('cell vertical alignment', () => {
    const props = {
      data: { a: ['a'], b: [1], c: [3], d: [5] },
      columns: [
        { name: 'default', accessor: 'a', className: 'default' },
        { name: 'top', accessor: 'b', vAlign: 'top', className: 'top' },
        { name: 'center', accessor: 'c', vAlign: 'center', className: 'center' },
        { name: 'bottom', accessor: 'd', vAlign: 'bottom', className: 'bottom' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    expect(getCells(container, '.default')[0]).not.toHaveClass('rt-valign-center')
    expect(getCells(container, '.default')[0]).not.toHaveClass('rt-valign-bottom')
    expect(getCells(container, '.top')[0]).not.toHaveClass('rt-valign-center')
    expect(getCells(container, '.top')[0]).not.toHaveClass('rt-valign-bottom')
    expect(getCells(container, '.center')[0]).toHaveClass('rt-valign-center')
    expect(getCells(container, '.bottom')[0]).toHaveClass('rt-valign-bottom')
  })

  it('cells rerender without unmounting', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['a', 'b', 'c'] },
      columns: [
        { name: 'colA', accessor: 'a', className: 'col-a' },
        {
          name: 'colB',
          accessor: 'b',
          cell: cellInfo => `${cellInfo.index}-${cellInfo.value}`,
          className: 'col-b'
        }
      ],
      defaultPageSize: 2
    }
    const { container } = render(<Reactable {...props} />)
    const cellsA = getCells(container, '.col-a')
    expect(cellsA[0].textContent).toEqual('1')
    expect(cellsA[1].textContent).toEqual('2')
    const cellsB = getCells(container, '.col-b')
    expect(cellsB[0].textContent).toEqual('0-a')
    expect(cellsB[1].textContent).toEqual('1-b')

    fireEvent.click(getNextButton(container))
    expect(cellsA[0].textContent).toEqual('3')
    expect(cellsB[0].textContent).toEqual('2-c')
  })
})

describe('headers', () => {
  it('renders headers', () => {
    const props = {
      data: { a: [1, 2], b: [3, 4], c: ['a', 'b'], d: ['c', 'd'] },
      columns: [
        {
          name: 'colA',
          accessor: 'a',
          headerClassName: 'my-header',
          headerStyle: { color: 'red' }
        },
        // Custom header should override name
        {
          name: 'colB',
          header: 'my-header',
          accessor: 'b'
        },
        // Custom header should override name
        {
          name: 'colC',
          header: '',
          accessor: 'c'
        },
        // Empty column header
        {
          name: '',
          accessor: 'd'
        }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const thead = getThead(container)
    expect(thead).toHaveAttribute('role', 'rowgroup')
    const headerRows = getHeaderRows(container)
    expect(headerRows).toHaveLength(1)
    expect(headerRows[0]).toHaveAttribute('role', 'row')
    const headers = getHeaders(container)
    expect(headers).toHaveLength(4)
    expect(headers[0].textContent).toEqual('colA')
    expect(headers[0]).toHaveClass('my-header')
    expect(headers[0]).toHaveStyle('color: red;')
    expect(headers[1].textContent).toEqual('my-header')
    expect(headers[2].textContent).toEqual('')
    expect(headers[3].textContent).toEqual('')
    headers.forEach(header => expect(header).toHaveAttribute('role', 'columnheader'))
    headers.forEach(header => expect(header).not.toHaveAttribute('aria-colspan'))
    // Should not have colspan attribute (from react-table)
    headers.forEach(header => expect(header).not.toHaveAttribute('colspan'))
  })

  it('header render function', () => {
    const assertProps = (colInfo, state) => {
      const { column, data } = colInfo
      expect(column.id).toEqual('a')
      expect(column.name).toEqual('colA')
      expect(column.filterValue).toEqual(undefined)
      expect(data).toEqual([
        { a: 1, b: 'a', c: true },
        { a: 2, b: 'b', c: false }
      ])
      expect(state.page).toEqual(0)
      expect(state.pageSize).toEqual(10)
      expect(state.pages).toEqual(1)
      expect(state.sorted).toEqual([])
      expect(state.groupBy).toEqual([])
      expect(state.filters).toEqual([])
      expect(state.searchValue).toEqual(undefined)
      expect(state.selected).toEqual([])
      expect(state.pageRows).toEqual([
        { a: 1, b: 'a', c: true },
        { a: 2, b: 'b', c: false }
      ])
      expect(state.sortedData).toEqual([
        { a: 1, b: 'a', c: true },
        { a: 2, b: 'b', c: false }
      ])
      expect(state.data).toEqual([
        { a: 1, b: 'a', c: true },
        { a: 2, b: 'b', c: false }
      ])
    }
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], c: [true, false] },
      columns: [
        {
          name: 'colA',
          accessor: 'a',
          header: (colInfo, state) => {
            assertProps(colInfo, state)
            const { column, data } = colInfo
            return (
              `<span>${column.name}</span> ` +
              `<span>(${data.length} ${data[0].a} ${data[1].a})</span>`
            )
          },
          html: true
        },
        { name: 'colB', accessor: 'b', header: () => '' },
        { name: 'colC', accessor: 'c' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const headers = getHeaders(container)
    expect(headers[0].textContent).toEqual('colA (2 1 2)')
    expect(headers[1].textContent).toEqual('')
    expect(headers[2].textContent).toEqual('colC')
  })

  it('header alignment', () => {
    const props = {
      data: { a: ['a'], b: [1], c: [3], d: [5], e: [8] },
      columns: [
        { name: 'default', accessor: 'a', headerClassName: 'default' },
        { name: 'default-num', accessor: 'b', type: 'numeric', headerClassName: 'default-num' },
        { name: 'left', accessor: 'c', align: 'left', headerClassName: 'left' },
        { name: 'right', accessor: 'd', align: 'right', headerClassName: 'right' },
        { name: 'center', accessor: 'e', align: 'center', headerClassName: 'center' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    expect(getHeaders(container, '.default')[0]).toHaveClass('rt-align-left')
    expect(getHeaders(container, '.default-num')[0]).toHaveClass('rt-align-right')
    expect(getHeaders(container, '.left')[0]).toHaveClass('rt-align-left')
    expect(getHeaders(container, '.right')[0]).toHaveClass('rt-align-right')
    expect(getHeaders(container, '.center')[0]).toHaveClass('rt-align-center')
  })

  it('header vertical alignment', () => {
    const props = {
      data: { a: ['a'], b: [1], c: [3], d: [5] },
      columns: [
        { name: 'default', accessor: 'a', headerClassName: 'default' },
        { name: 'top', accessor: 'b', headerVAlign: 'top', headerClassName: 'top' },
        { name: 'center', accessor: 'c', headerVAlign: 'center', headerClassName: 'center' },
        { name: 'bottom', accessor: 'd', headerVAlign: 'bottom', headerClassName: 'bottom' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    expect(getHeaders(container, '.default')[0]).not.toHaveClass('rt-valign-center')
    expect(getHeaders(container, '.default')[0]).not.toHaveClass('rt-valign-bottom')
    expect(getHeaders(container, '.top')[0]).not.toHaveClass('rt-valign-center')
    expect(getHeaders(container, '.top')[0]).not.toHaveClass('rt-valign-bottom')
    expect(getHeaders(container, '.center')[0]).toHaveClass('rt-valign-center')
    expect(getHeaders(container, '.bottom')[0]).toHaveClass('rt-valign-bottom')
  })
})

describe('column groups', () => {
  it('renders column groups', () => {
    const props = {
      data: { a: [1, 2], b: [3, 4], c: ['a', 'b'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' },
        { name: 'colC', accessor: 'c' }
      ],
      columnGroups: [
        {
          columns: ['a', 'b'],
          name: 'group-1',
          headerClassName: 'my-header',
          headerStyle: { color: 'red' }
        },
        {
          columns: ['c'],
          name: 'group-2'
        }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const headerRows = getHeaderRows(container)
    expect(headerRows).toHaveLength(2)
    headerRows.forEach(row => expect(row).toHaveAttribute('role', 'row'))
    const [groupHeaderRow, headerRow] = headerRows
    expect(groupHeaderRow).toHaveClass('rt-tr-group-header')
    expect(headerRow).toHaveClass('rt-tr-header')

    const groupHeaders = getGroupHeaders(groupHeaderRow)
    expect(groupHeaders).toHaveLength(2)
    expect(groupHeaders[0].textContent).toEqual('group-1')
    expect(groupHeaders[1].textContent).toEqual('group-2')
    expect(groupHeaders[0]).toHaveAttribute('aria-colspan', '2')
    expect(groupHeaders[1]).toHaveAttribute('aria-colspan', '1')
    expect(groupHeaders[0]).toHaveClass('my-header')
    expect(groupHeaders[0]).toHaveStyle('color: red;')
    // Should not have colspan attribute (from react-table)
    groupHeaders.forEach(header => expect(header).not.toHaveAttribute('colspan'))
  })

  it('renders ungrouped column headers', () => {
    const props = {
      data: { a: [1, 2], b: [3, 4], c: ['a', 'b'], d: ['c', 'd'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' },
        { name: 'colC', accessor: 'c' },
        { name: 'colD', accessor: 'd' }
      ],
      columnGroups: [{ columns: ['c'], name: 'group-2' }]
    }
    const { container } = render(<Reactable {...props} />)
    const headerRows = getHeaderRows(container)
    expect(headerRows).toHaveLength(2)
    headerRows.forEach(row => expect(row).toHaveAttribute('role', 'row'))
    const [groupHeaderRow] = headerRows
    expect(groupHeaderRow).toHaveClass('rt-tr-group-header')

    const groupHeaders = getGroupHeaders(groupHeaderRow)
    expect(groupHeaders).toHaveLength(1)
    const ungroupedHeaders = getUngroupedHeaders(groupHeaderRow)
    expect(ungroupedHeaders).toHaveLength(2)
    const groupTheadHeaders = getHeaders(groupHeaderRow)
    expect(groupTheadHeaders).toHaveLength(3)
    // Group headers should be: ungrouped (2), grouped (1), ungrouped (1)
    expect(groupTheadHeaders[0]).toEqual(ungroupedHeaders[0])
    expect(groupTheadHeaders[1]).toEqual(groupHeaders[0])
    expect(groupTheadHeaders[2]).toEqual(ungroupedHeaders[1])
    expect(groupTheadHeaders[0].textContent).toEqual('\u200b')
    expect(groupTheadHeaders[1].textContent).toEqual('group-2')
    expect(groupTheadHeaders[2].textContent).toEqual('\u200b')
    expect(groupTheadHeaders[0]).toHaveAttribute('aria-colspan', '2')
    expect(groupTheadHeaders[1]).toHaveAttribute('aria-colspan', '1')
    expect(groupTheadHeaders[2]).toHaveAttribute('aria-colspan', '1')
    // Should not have colspan attribute (from react-table)
    groupTheadHeaders.forEach(header => expect(header).not.toHaveAttribute('colspan'))
  })

  it('header render function', () => {
    const assertProps = (colInfo, state) => {
      const { column, data } = colInfo
      expect(column.id).toEqual('group_0_0')
      expect(column.name).toEqual('group-1')
      expect(column.filterValue).toEqual(undefined)
      expect(column.columns).toHaveLength(2)
      expect(column.columns[0].id).toEqual('a')
      expect(column.columns[1].id).toEqual('b')
      expect(data).toEqual([
        { a: 1, b: 'a', c: 'c' },
        { a: 2, b: 'b', c: 'd' }
      ])
      expect(column.filterValue).toEqual(undefined)
      expect(state.page).toEqual(0)
      expect(state.pageSize).toEqual(10)
      expect(state.pages).toEqual(1)
      expect(state.sorted).toEqual([])
      expect(state.groupBy).toEqual([])
      expect(state.filters).toEqual([])
      expect(state.searchValue).toEqual(undefined)
      expect(state.selected).toEqual([])
      expect(state.pageRows).toEqual([
        { a: 1, b: 'a', c: 'c' },
        { a: 2, b: 'b', c: 'd' }
      ])
      expect(state.sortedData).toEqual([
        { a: 1, b: 'a', c: 'c' },
        { a: 2, b: 'b', c: 'd' }
      ])
      expect(state.data).toEqual([
        { a: 1, b: 'a', c: 'c' },
        { a: 2, b: 'b', c: 'd' }
      ])
    }
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], c: ['c', 'd'] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        { name: 'col-b', accessor: 'b' },
        { name: 'col-c', accessor: 'c' }
      ],
      columnGroups: [
        {
          columns: ['a', 'b'],
          name: 'group-1',
          header: (colInfo, state) => {
            assertProps(colInfo, state)
            return `${colInfo.column.name} (${colInfo.column.columns.length} ${colInfo.data.length})`
          }
        },
        {
          columns: ['c'],
          name: 'group-2',
          header: () => '<span>group</span> <span>2</span>',
          html: true
        }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const headers = getGroupHeaders(container)
    expect(headers).toHaveLength(2)
    expect(headers[0].textContent).toEqual('group-1 (2 2)')
    expect(headers[1].textContent).toEqual('group 2')
  })

  it('renders group headers with blank names', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], c: ['c', 'd'] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        { name: 'col-b', accessor: 'b' },
        { name: 'col-c', accessor: 'c' }
      ],
      columnGroups: [
        {
          columns: ['a'],
          name: ''
        },
        {
          columns: ['b'],
          header: () => ''
        },
        {
          columns: ['c'],
          header: ''
        }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const headers = getGroupHeaders(container)
    expect(headers).toHaveLength(3)
    expect(headers[0].textContent).toEqual('')
    expect(headers[1].textContent).toEqual('')
    expect(headers[2].textContent).toEqual('')
  })

  it('handles column groups with hidden columns', () => {
    const props = {
      data: { a: [1, 2], b: [3, 4], c: ['a', 'b'], d: ['c', 'd'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b', show: false },
        { name: 'colC', accessor: 'c', show: false },
        { name: 'colD', accessor: 'd' }
      ],
      columnGroups: [
        {
          columns: ['a', 'b'],
          name: 'group-1',
          headerClassName: 'my-header',
          headerStyle: { color: 'red' }
        },
        {
          columns: ['c'],
          name: 'group-2'
        }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const groupHeaders = getGroupHeaders(container)
    expect(groupHeaders).toHaveLength(1)
    expect(groupHeaders[0].textContent).toEqual('group-1')
    expect(groupHeaders[0]).toHaveAttribute('aria-colspan', '1')
    const ungroupedHeaders = getUngroupedHeaders(container)
    expect(ungroupedHeaders).toHaveLength(1)
  })

  it('ungrouped grouping columns do not have a default header', () => {
    // In v6, ungrouped grouping columns had a default "Grouped" header
    const props = {
      data: { a: [1, 2], b: [3, 4], c: ['a', 'b'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' },
        { name: 'colC', accessor: 'c' }
      ],
      columnGroups: [
        {
          columns: ['a', 'b'],
          name: 'group-ab'
        }
      ],
      pivotBy: ['c']
    }
    const { container } = render(<Reactable {...props} />)
    const headers = getGroupHeaders(container)
    expect(headers).toHaveLength(1)
    expect(headers[0].textContent).toEqual('group-ab')
    const ungroupedHeaders = getUngroupedHeaders(container)
    expect(ungroupedHeaders).toHaveLength(1)
  })

  it('group header alignment', () => {
    const props = {
      data: { a: ['a'], b: [1], c: [3], d: [5] },
      columns: [
        { name: 'default', accessor: 'a' },
        { name: 'left', accessor: 'b' },
        { name: 'right', accessor: 'c' },
        { name: 'center', accessor: 'd' }
      ],
      columnGroups: [
        { name: 'default', columns: ['a'], headerClassName: 'default' },
        { name: 'left', columns: ['b'], align: 'left', headerClassName: 'left' },
        { name: 'right', columns: ['c'], align: 'right', headerClassName: 'right' },
        { name: 'center', columns: ['d'], align: 'center', headerClassName: 'center' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    expect(getGroupHeaders(container, '.default')[0]).toHaveClass('rt-align-center')
    expect(getGroupHeaders(container, '.left')[0]).toHaveClass('rt-align-left')
    expect(getGroupHeaders(container, '.right')[0]).toHaveClass('rt-align-right')
    expect(getGroupHeaders(container, '.center')[0]).toHaveClass('rt-align-center')
  })

  it('group header vertical alignment', () => {
    const props = {
      data: { a: ['a'], b: [1], c: [3], d: [5] },
      columns: [
        { name: 'default', accessor: 'a' },
        { name: 'left', accessor: 'b' },
        { name: 'right', accessor: 'c' },
        { name: 'center', accessor: 'd' }
      ],
      columnGroups: [
        { name: 'default', columns: ['a'], accessor: 'a', headerClassName: 'default' },
        { name: 'top', columns: ['b'], accessor: 'b', headerVAlign: 'top', headerClassName: 'top' },
        {
          name: 'center',
          columns: ['c'],
          accessor: 'c',
          headerVAlign: 'center',
          headerClassName: 'center'
        },
        {
          name: 'bottom',
          columns: ['d'],
          accessor: 'd',
          headerVAlign: 'bottom',
          headerClassName: 'bottom'
        }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    expect(getGroupHeaders(container, '.default')[0]).not.toHaveClass('rt-valign-center')
    expect(getGroupHeaders(container, '.default')[0]).not.toHaveClass('rt-valign-bottom')
    expect(getGroupHeaders(container, '.top')[0]).not.toHaveClass('rt-valign-center')
    expect(getGroupHeaders(container, '.top')[0]).not.toHaveClass('rt-valign-bottom')
    expect(getGroupHeaders(container, '.center')[0]).toHaveClass('rt-valign-center')
    expect(getGroupHeaders(container, '.bottom')[0]).toHaveClass('rt-valign-bottom')
  })
})

describe('footers', () => {
  it('does not render footers by default', () => {
    const props = {
      data: { a: [1, 2], b: [3, 4] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const footers = getFooters(container)
    expect(footers).toHaveLength(0)
  })

  it('renders footers', () => {
    const props = {
      data: { a: [1, 2], b: [3, 4], c: ['a', 'b'] },
      columns: [
        {
          name: 'a',
          accessor: 'a',
          footer: 'my-footer',
          footerClassName: 'my-footer',
          footerStyle: { color: 'red' }
        },
        {
          name: 'b',
          accessor: 'b',
          footer: ''
        },
        { name: 'c', accessor: 'c' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const tfoot = getTfoot(container)
    expect(tfoot).toBeVisible()
    expect(tfoot).toHaveAttribute('role', 'rowgroup')
    const footerRow = getFooterRow(container)
    expect(footerRow).toHaveAttribute('role', 'row')
    const footers = getFooters(container)
    expect(footers).toHaveLength(3)
    expect(footers[0].textContent).toEqual('my-footer')
    expect(footers[0]).toHaveClass('my-footer')
    expect(footers[0]).toHaveStyle('color: red;')
    expect(footers[1].textContent).toEqual('')
    expect(footers[2].textContent).toEqual('\u200b')
    footers.forEach(footer => expect(footer).toHaveAttribute('role', 'cell'))
    // Should not have colspan attribute (from react-table)
    footers.forEach(footer => expect(footer).not.toHaveAttribute('colspan'))
  })

  it('renders row headers', () => {
    const props = {
      data: {
        a: [1, 2],
        b: ['a', 'b']
      },
      columns: [
        { name: 'a', accessor: 'a', footer: 'my-footer', rowHeader: true },
        { name: 'b', accessor: 'b', footer: 'my-footer' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const [footerA, footerB] = getFooters(container)
    expect(footerA).toHaveAttribute('role', 'rowheader')
    expect(footerB).toHaveAttribute('role', 'cell')
  })

  it('footer render function', () => {
    const assertProps = (colInfo, state) => {
      const { column, data } = colInfo
      expect(column.id).toEqual('a')
      expect(column.name).toEqual('colA')
      expect(column.filterValue).toEqual(undefined)
      expect(data).toEqual([
        { a: 1, b: 'a', c: true },
        { a: 2, b: 'b', c: false }
      ])
      expect(state.page).toEqual(0)
      expect(state.pageSize).toEqual(10)
      expect(state.pages).toEqual(1)
      expect(state.sorted).toEqual([])
      expect(state.groupBy).toEqual([])
      expect(state.filters).toEqual([])
      expect(state.searchValue).toEqual(undefined)
      expect(state.selected).toEqual([])
      expect(state.pageRows).toEqual([
        { a: 1, b: 'a', c: true },
        { a: 2, b: 'b', c: false }
      ])
      expect(state.sortedData).toEqual([
        { a: 1, b: 'a', c: true },
        { a: 2, b: 'b', c: false }
      ])
      expect(state.data).toEqual([
        { a: 1, b: 'a', c: true },
        { a: 2, b: 'b', c: false }
      ])
    }
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], c: [true, false] },
      columns: [
        {
          name: 'colA',
          accessor: 'a',
          footer: (colInfo, state) => {
            assertProps(colInfo, state)
            const { column, data } = colInfo
            return (
              `<span>${column.name}</span> ` +
              `<span>(${data.length} ${data[0].a} ${data[1].a})</span>`
            )
          },
          html: true
        },
        { name: 'colB', accessor: 'b', footer: () => '' },
        { name: 'colC', accessor: 'c' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const footers = getFooters(container)
    expect(footers).toHaveLength(3)
    expect(footers[0].textContent).toEqual('colA (2 1 2)')
    expect(footers[1].textContent).toEqual('')
    expect(footers[2].textContent).toEqual('\u200b')
  })

  it('footer alignment', () => {
    const props = {
      data: { a: ['a'], b: [1], c: [3], d: [5], e: [8] },
      columns: [
        { name: 'default', accessor: 'a', footer: '', footerClassName: 'default' },
        { name: 'default-num', accessor: 'b', type: 'numeric', footerClassName: 'default-num' },
        { name: 'left', accessor: 'c', align: 'left', footerClassName: 'left' },
        { name: 'right', accessor: 'd', align: 'right', footerClassName: 'right' },
        { name: 'center', accessor: 'e', align: 'center', footerClassName: 'center' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    expect(getFooters(container, '.default')[0]).toHaveClass('rt-align-left')
    expect(getFooters(container, '.default-num')[0]).toHaveClass('rt-align-right')
    expect(getFooters(container, '.left')[0]).toHaveClass('rt-align-left')
    expect(getFooters(container, '.right')[0]).toHaveClass('rt-align-right')
    expect(getFooters(container, '.center')[0]).toHaveClass('rt-align-center')
  })

  it('footer vertical alignment', () => {
    const props = {
      data: { a: ['a'], b: [1], c: [3], d: [5] },
      columns: [
        { name: 'default', accessor: 'a', footer: '', footerClassName: 'default' },
        { name: 'top', accessor: 'b', vAlign: 'top', footerClassName: 'top' },
        { name: 'center', accessor: 'c', vAlign: 'center', footerClassName: 'center' },
        { name: 'bottom', accessor: 'd', vAlign: 'bottom', footerClassName: 'bottom' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    expect(getFooters(container, '.default')[0]).not.toHaveClass('rt-valign-center')
    expect(getFooters(container, '.default')[0]).not.toHaveClass('rt-valign-bottom')
    expect(getFooters(container, '.top')[0]).not.toHaveClass('rt-valign-center')
    expect(getFooters(container, '.top')[0]).not.toHaveClass('rt-valign-bottom')
    expect(getFooters(container, '.center')[0]).toHaveClass('rt-valign-center')
    expect(getFooters(container, '.bottom')[0]).toHaveClass('rt-valign-bottom')
  })

  it('renders footers with column groups', () => {
    const props = {
      data: { a: [1, 2], b: [3, 4], c: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a', footer: 'my-footer' },
        { name: 'b', accessor: 'b', footer: '' },
        { name: 'c', accessor: 'c' }
      ],
      columnGroups: [
        {
          columns: ['a', 'b'],
          name: 'group-1'
        }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const footers = getFooters(container)
    expect(footers).toHaveLength(3)
    expect(footers[0].textContent).toEqual('my-footer')
    expect(footers[1].textContent).toEqual('')
    expect(footers[2].textContent).toEqual('\u200b')
  })

  it('renders footers with hidden columns', () => {
    const props = {
      data: { a: [1, 2], b: [3, 4], c: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a', footer: 'footer-a' },
        { name: 'b', accessor: 'b', footer: '', show: false },
        { name: 'c', accessor: 'c', footer: 'footer-c' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const footers = getFooters(container)
    expect(footers).toHaveLength(2)
    expect(footers[0].textContent).toEqual('footer-a')
    expect(footers[1].textContent).toEqual('footer-c')
  })

  it('does not apply cell classes and styles to footers', () => {
    // Bug from v6
    const props = {
      data: { a: [1, 2] },
      columns: [
        {
          name: 'a',
          accessor: 'a',
          footer: 'my-footer',
          className: 'cell',
          style: { color: 'red' }
        }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const footers = getFooters(container)
    expect(footers).toHaveLength(1)
    expect(footers[0]).not.toHaveClass('cell')
    expect(footers[0]).not.toHaveStyle('color: red;')
  })

  it('does not render tfoot when there are no footers', () => {
    const { container } = render(
      <Reactable
        data={{ a: [1, 2], b: ['aa', 'bb'], c: [true, false] }}
        columns={[
          { name: 'colA', accessor: 'a' },
          { name: 'colB', accessor: 'b' },
          { name: 'colC', accessor: 'c' }
        ]}
      />
    )
    const tfoot = getTfoot(container)
    expect(tfoot).toEqual(null)
  })
})

describe('hidden columns', () => {
  it('some columns hidden', () => {
    const props = {
      data: { a: [1, 2], b: ['aaa', 'bbb'], c: [3, 4] },
      columns: [
        {
          name: 'col-a',
          accessor: 'a'
        },
        {
          name: 'col-b',
          accessor: 'b',
          show: false
        },
        {
          name: 'col-c',
          accessor: 'c'
        }
      ]
    }
    const { container, queryByText } = render(<Reactable {...props} />)
    const headers = getHeaders(container)
    expect(headers).toHaveLength(2)
    expect(queryByText('col-b')).toEqual(null)
    expect(queryByText('bbb')).toEqual(null)
    expect(queryByText('aaa')).toEqual(null)
  })

  it('all columns hidden', () => {
    const props = {
      data: { a: [1, 2], b: ['aaa', 'bbb'] },
      columns: [
        {
          name: 'col-a',
          accessor: 'a',
          show: false
        },
        {
          name: 'col-b',
          accessor: 'b',
          show: false
        }
      ]
    }
    const { container, queryByText } = render(<Reactable {...props} />)
    const headers = getHeaders(container)
    expect(headers).toHaveLength(0)
    expect(queryByText('col-a')).toEqual(null)
    expect(queryByText('col-b')).toEqual(null)
    expect(getCells(container)).toHaveLength(0)
  })

  it('hidden column state updates when columns changes', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'col-a', accessor: 'a', show: false },
        { name: 'col-b', accessor: 'b' }
      ]
    }
    const { container, queryByText, rerender } = render(<Reactable {...props} />)
    expect(getHeaders(container)).toHaveLength(1)
    expect(queryByText('col-a')).toEqual(null)
    expect(queryByText('col-b')).toBeVisible()

    const columns = [
      { name: 'col-a', accessor: 'a', show: false },
      { name: 'col-b', accessor: 'b', show: false }
    ]
    rerender(<Reactable {...props} columns={columns} />)
    expect(getHeaders(container)).toHaveLength(0)
    expect(queryByText('col-a')).toEqual(null)
    expect(queryByText('col-b')).toEqual(null)
  })
})

describe('column widths and flex layout', () => {
  const getFlex = elements => [...elements].map(el => el.style.flex)
  const getWidths = elements => [...elements].map(el => el.style.width)
  const getMinWidths = elements => [...elements].map(el => el.style.minWidth)
  const getMaxWidths = elements => [...elements].map(el => el.style.maxWidth)

  it('default column widths', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'colA', accessor: 'a', footer: 'footer' },
        { name: 'colB', accessor: 'b' }
      ],
      // Test pad rows
      minRows: 3
    }
    const { container } = render(<Reactable {...props} />)
    const headers = getHeaders(container)
    expect(getFlex(headers)).toEqual(['100 0 auto', '100 0 auto'])
    expect(getMinWidths(headers)).toEqual(['100px', '100px'])
    expect(getWidths(headers)).toEqual(['100px', '100px'])
    expect(getMaxWidths(headers)).toEqual(['', ''])

    const cells = getCells(container)
    expect(getFlex(cells)).toEqual(Array(6).fill('100 0 auto'))
    expect(getMinWidths(cells)).toEqual(Array(6).fill('100px'))
    expect(getWidths(cells)).toEqual(Array(6).fill('100px'))
    expect(getMaxWidths(cells)).toEqual(Array(6).fill(''))

    const footers = getFooters(container)
    expect(getFlex(footers)).toEqual(['100 0 auto', '100 0 auto'])
    expect(getMinWidths(footers)).toEqual(['100px', '100px'])
    expect(getWidths(footers)).toEqual(['100px', '100px'])
    expect(getMaxWidths(footers)).toEqual(['', ''])
  })

  it('min column widths', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'colA', accessor: 'a', footer: 'footer', minWidth: 50 },
        { name: 'colB', accessor: 'b' }
      ],
      // Test pad rows
      minRows: 3
    }
    const { container } = render(<Reactable {...props} />)
    const headers = getHeaders(container)
    expect(getFlex(headers)).toEqual(['50 0 auto', '100 0 auto'])
    expect(getMinWidths(headers)).toEqual(['50px', '100px'])
    expect(getWidths(headers)).toEqual(['50px', '100px'])
    expect(getMaxWidths(headers)).toEqual(['', ''])

    const cells = getCells(container)
    expect(getFlex(cells)).toEqual([
      '50 0 auto',
      '100 0 auto',
      '50 0 auto',
      '100 0 auto',
      '50 0 auto',
      '100 0 auto'
    ])
    expect(getMinWidths(cells)).toEqual(['50px', '100px', '50px', '100px', '50px', '100px'])
    expect(getWidths(cells)).toEqual(['50px', '100px', '50px', '100px', '50px', '100px'])
    expect(getMaxWidths(cells)).toEqual(Array(6).fill(''))

    const footers = getFooters(container)
    expect(getFlex(footers)).toEqual(['50 0 auto', '100 0 auto'])
    expect(getWidths(footers)).toEqual(['50px', '100px'])
    expect(getMaxWidths(footers)).toEqual(['', ''])
  })

  it('max column widths', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'colA', accessor: 'a', footer: 'footer', maxWidth: 50 },
        { name: 'colB', accessor: 'b', maxWidth: 220 }
      ],
      // Test pad rows
      minRows: 3
    }
    const { container } = render(<Reactable {...props} />)
    const headers = getHeaders(container)
    expect(getFlex(headers)).toEqual(['0 0 auto', '100 0 auto'])
    expect(getMinWidths(headers)).toEqual(['50px', '100px'])
    expect(getWidths(headers)).toEqual(['50px', '100px'])
    expect(getMaxWidths(headers)).toEqual(['50px', '220px'])

    const cells = getCells(container)
    expect(getFlex(cells)).toEqual([
      '0 0 auto',
      '100 0 auto',
      '0 0 auto',
      '100 0 auto',
      '0 0 auto',
      '100 0 auto'
    ])
    expect(getMinWidths(cells)).toEqual(['50px', '100px', '50px', '100px', '50px', '100px'])
    expect(getWidths(cells)).toEqual(['50px', '100px', '50px', '100px', '50px', '100px'])
    expect(getMaxWidths(cells)).toEqual(['50px', '220px', '50px', '220px', '50px', '220px'])

    const footers = getFooters(container)
    expect(getFlex(footers)).toEqual(['0 0 auto', '100 0 auto'])
    expect(getMinWidths(headers)).toEqual(['50px', '100px'])
    expect(getWidths(footers)).toEqual(['50px', '100px'])
    expect(getMaxWidths(footers)).toEqual(['50px', '220px'])
  })

  it('fixed column widths', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'colA', accessor: 'a', footer: 'footer', width: 70, minWidth: 50 },
        { name: 'colB', accessor: 'b', width: 120, maxWidth: 50 }
      ],
      // Test pad rows
      minRows: 3
    }
    const { container } = render(<Reactable {...props} />)
    const headers = getHeaders(container)
    expect(getFlex(headers)).toEqual(['0 0 auto', '0 0 auto'])
    expect(getMinWidths(headers)).toEqual(['70px', '120px'])
    expect(getWidths(headers)).toEqual(['70px', '120px'])
    expect(getMaxWidths(headers)).toEqual(['70px', '120px'])

    const cells = getCells(container)
    expect(getFlex(cells)).toEqual(Array(6).fill('0 0 auto'))
    expect(getMinWidths(cells)).toEqual(['70px', '120px', '70px', '120px', '70px', '120px'])
    expect(getWidths(cells)).toEqual(['70px', '120px', '70px', '120px', '70px', '120px'])
    expect(getMaxWidths(cells)).toEqual(['70px', '120px', '70px', '120px', '70px', '120px'])

    const footers = getFooters(container)
    expect(getFlex(footers)).toEqual(['0 0 auto', '0 0 auto'])
    expect(getMinWidths(footers)).toEqual(['70px', '120px'])
    expect(getWidths(footers)).toEqual(['70px', '120px'])
    expect(getMaxWidths(footers)).toEqual(['70px', '120px'])
  })

  it('column group widths', () => {
    const props = {
      data: { a: [1], b: [1], c: [1], d: [1], e: [1], f: [1], g: [1], h: [1], i: [1], j: [1] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' },
        { name: 'c', accessor: 'c', minWidth: 40 },
        { name: 'd', accessor: 'd', width: 50 },
        { name: 'e', accessor: 'e' },
        { name: 'f', accessor: 'f', width: 120 },
        { name: 'g', accessor: 'g', minWidth: 50, maxWidth: 140 },
        { name: 'h', accessor: 'h' },
        { name: 'i', accessor: 'i', maxWidth: 60 },
        { name: 'j', accessor: 'j' }
      ],
      columnGroups: [
        { name: 'default-1-col', columns: ['a'], headerClassName: 'default-1-col' },
        { name: 'minWidth-2-col', columns: ['b', 'c'], headerClassName: 'minWidth-2-col' },
        { name: 'width-1-col', columns: ['d'], headerClassName: 'width-1-col' },
        { name: 'width-2-col', columns: ['e', 'f'], headerClassName: 'width-2-col' },
        { name: 'maxWidth-1-col', columns: ['g'], headerClassName: 'maxWidth-1-col' },
        { name: 'maxWidth-2-col', columns: ['h', 'i'], headerClassName: 'maxWidth-2-col' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    expect(getGroupHeaders(container)).toHaveLength(6)
    expect(getGroupHeaders(container, '.default-1-col')[0]).toHaveStyle(
      'flex: 100 0 auto; min-width: 100px; width: 100px; max-width:'
    )
    expect(getGroupHeaders(container, '.minWidth-2-col')[0]).toHaveStyle(
      'flex: 140 0 auto; min-width: 140px; width: 140px; max-width:'
    )
    // Fixed width columns should be ignored when calculating flex width
    expect(getGroupHeaders(container, '.width-1-col')[0]).toHaveStyle(
      'flex: 0 0 auto; min-width: 50px; width: 50px; max-width: 50px'
    )
    expect(getGroupHeaders(container, '.width-2-col')[0]).toHaveStyle(
      'flex: 100 0 auto; min-width: 220px; width: 220px; max-width:'
    )
    expect(getGroupHeaders(container, '.maxWidth-1-col')[0]).toHaveStyle(
      'flex: 50 0 auto; min-width: 50px; width: 50px; max-width: 140px'
    )
    // Should not have max width if at least one column has no max width.
    // Known issue: this can cause group headers to be misaligned if the column
    // grows to hit its max width.
    expect(getGroupHeaders(container, '.maxWidth-2-col')[0]).toHaveStyle(
      'flex: 100 0 auto; min-width: 160px; width: 160px; max-width:'
    )

    const ungroupedHeaders = getUngroupedHeaders(container)
    expect(ungroupedHeaders).toHaveLength(1)
    expect(ungroupedHeaders[0]).toHaveStyle(
      'flex: 100 0 auto; min-width: 100px; width: 100px; max-width:'
    )
  })

  it('column group widths with groupBy columns', () => {
    const props = {
      data: { a: [1], b: [1], c: [1], d: [1] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' },
        { name: 'c', accessor: 'c' },
        { name: 'd', accessor: 'd' }
      ],
      columnGroups: [{ name: 'group', columns: ['a', 'b'] }],
      pivotBy: ['d']
    }
    const { container } = render(<Reactable {...props} />)
    const groupHeaders = getGroupHeaders(container)
    expect(groupHeaders).toHaveLength(1)
    const ungroupedHeaders = getUngroupedHeaders(container)
    expect(ungroupedHeaders).toHaveLength(2)

    expect(groupHeaders[0]).toHaveStyle(
      'flex: 200 0 auto; min-width: 200px; width: 200px; max-width:'
    )
    // Column groups for groupBy columns pulled out of a 2+ column group should
    // have correct widths for the new column count (1 column in this case).
    expect(ungroupedHeaders[0]).toHaveStyle(
      'flex: 100 0 auto; min-width: 100px; width: 100px; max-width:'
    )
    expect(ungroupedHeaders[1]).toHaveStyle(
      'flex: 100 0 auto; min-width: 100px; width: 100px; max-width:'
    )
  })

  it('should have min-width on thead, tbody, and tfoot', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], c: ['c', 'd'] },
      columns: [
        { name: 'colA', accessor: 'a', footer: 'footer', minWidth: 50 },
        { name: 'colB', accessor: 'b', width: 120, maxWidth: 50 },
        { name: 'colC', accessor: 'c' }
      ],
      columnGroups: [{ columns: ['a', 'b'], name: 'group-ab' }],
      filterable: true
    }
    const { container } = render(<Reactable {...props} />)
    // Table element should not have min-width for horizontal scrolling
    expect(getTable(container).style.minWidth).toEqual('')

    expect(getThead(container)).toHaveStyle('min-width: 270px')
    expect(getTbody(container)).toHaveStyle('min-width: 270px')
    expect(getTfoot(container)).toHaveStyle('min-width: 270px')

    // Min width should also be set on rows, but it's not really necessary
    const rows = getRows(container)
    expect(rows).toHaveLength(2)
    rows.forEach(row => expect(row).toHaveStyle('min-width: 270px'))
  })
})

describe('column resizing', () => {
  beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => cb())
  })

  afterEach(() => {
    window.requestAnimationFrame.mockRestore()
  })

  it('is not resizable by default', () => {
    const props = {
      data: { a: [1, 3, 2], b: ['aa', 'bb', 'cc'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    expect(getResizableHeaders(container)).toHaveLength(0)
    expect(getResizers(container)).toHaveLength(0)
  })

  it('enables resizing', () => {
    const props = {
      data: { a: [1, 3, 2], b: ['aa', 'bb', 'cc'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' }
      ],
      resizable: true
    }
    const { container } = render(<Reactable {...props} />)
    const resizableHeaders = getResizableHeaders(container)
    const resizers = getResizers(container)
    expect(resizableHeaders).toHaveLength(2)
    expect(resizers).toHaveLength(2)
    expect(getResizers(resizableHeaders[1])).toHaveLength(1)
    expect(getResizers(resizableHeaders[1])[0]).toEqual(resizers[0])
  })

  it('disables resizing', () => {
    // Resizing disabled globally
    const props = {
      data: { a: [1, 3, 2, 5], b: ['aa', 'CC', 'dd', 'BB'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' }
      ],
      resizable: false
    }
    const { container, rerender } = render(<Reactable {...props} />)
    expect(getResizableHeaders(container)).toHaveLength(0)
    expect(getResizers(container)).toHaveLength(0)

    // Resizing disabled globally with column enable override
    let columns = [
      { name: 'colA', accessor: 'a', headerClassName: 'col-a', resizable: true },
      { name: 'colB', accessor: 'b', headerClassName: 'col-b' }
    ]
    rerender(<Reactable {...props} columns={columns} />)
    expect(getResizableHeaders(container)).toHaveLength(1)
    expect(getResizableHeaders(container)[0]).toHaveClass('col-a')
    expect(getResizers(container)).toHaveLength(1)

    // Resizing enabled globally with column disable override
    columns = [
      { name: 'colA', accessor: 'a', headerClassName: 'col-a', resizable: false },
      { name: 'colB', accessor: 'b', headerClassName: 'col-b' }
    ]
    rerender(<Reactable {...props} columns={columns} resizable={true} />)
    expect(getResizableHeaders(container)).toHaveLength(1)
    expect(getResizableHeaders(container)[0]).toHaveClass('col-b')
    expect(getResizers(container)).toHaveLength(1)

    // Resizing should be disabled on fixed width columns
    columns = [
      { name: 'colA', accessor: 'a', headerClassName: 'col-a', width: 30 },
      { name: 'colB', accessor: 'b', headerClassName: 'col-b', width: 50, resizable: true }
    ]
    rerender(<Reactable {...props} columns={columns} resizable={true} />)
    expect(getResizableHeaders(container)).toHaveLength(0)
    expect(getResizers(container)).toHaveLength(0)
  })

  it('enables resizing for column groups', () => {
    const props = {
      data: { a: [1, 3], b: ['aa', 'bb'], c: ['c', 'd'], d: ['d', 'e'], e: ['e', 'f'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' },
        { name: 'colC', accessor: 'c' },
        // Column groups with at least one resizable column should be resizable
        { name: 'colD', accessor: 'd', resizable: false },
        // Ungrouped column headers should be resizable too
        { name: 'colE', accessor: 'e' }
      ],
      columnGroups: [
        { columns: ['a', 'b'], name: 'group-ab' },
        { columns: ['c', 'd'], name: 'group-cd' }
      ],
      resizable: true
    }
    const { container } = render(<Reactable {...props} />)
    expect(getResizableHeaders(container)).toHaveLength(7)
    expect(getResizers(container)).toHaveLength(7)
  })

  it('disables resizing for column groups', () => {
    const props = {
      data: { a: [1, 3], b: ['aa', 'bb'], c: ['c', 'd'], d: ['d', 'e'] },
      columns: [
        { name: 'colA', accessor: 'a', resizable: false },
        { name: 'colB', accessor: 'b', resizable: false },
        { name: 'colC', accessor: 'c', resizable: false },
        { name: 'colD', accessor: 'd', headerClassName: 'col-resizable' }
      ],
      columnGroups: [
        { columns: ['a', 'b'], name: 'group-all-cols-no-resize' },
        { columns: ['c'], name: 'group-single-col-no-resize' },
        { columns: ['d'], name: 'group-resizable', headerClassName: 'group-resizable' }
      ],
      resizable: true
    }
    const { container } = render(<Reactable {...props} />)
    expect(getResizableHeaders(container)).toHaveLength(2)
    expect(getResizableHeaders(container)[0]).toHaveClass('group-resizable')
    expect(getResizableHeaders(container)[1]).toHaveClass('col-resizable')
    expect(getResizers(container)).toHaveLength(2)
  })

  it('mouse resizing works for headers', () => {
    const props = {
      data: { a: [1, 3, 2], b: ['aa', 'bb', 'cc'] },
      columns: [
        { name: 'colA', accessor: 'a', className: 'col-a', footer: 'footer' },
        { name: 'colB', accessor: 'b', minWidth: 30, maxWidth: 130 },
        { name: 'colC', accessor: 'c', width: 70 }
      ],
      columnGroups: [{ name: 'group-bc', columns: ['b', 'c'] }],
      resizable: true,
      minRows: 4
    }
    const { container } = render(<Reactable {...props} />)
    const [headerA, headerB, headerC] = getColumnHeaders(container)
    const [ungroupedHeaderA] = getUngroupedHeaders(container)
    const [groupHeaderBC] = getGroupHeaders(container)
    const resizerA = getResizers(headerA)[0]
    const resizerB = getResizers(headerB)[0]
    expect(headerA).toHaveStyle('width: 100px; flex: 100 0 auto')
    expect(ungroupedHeaderA).toHaveStyle('width: 100px; flex: 100 0 auto')
    expect(headerB).toHaveStyle('width: 30px; flex: 30 0 auto')
    expect(headerC).toHaveStyle('width: 70px; flex: 0 0 auto')
    expect(groupHeaderBC).toHaveStyle('width: 100px; flex: 30 0 auto')

    const cellsA = [
      ...getCells(container, '.col-a'),
      getFooters(container)[0],
      getCells(getPadRows(container)[0])[0]
    ]
    expect(cellsA).toHaveLength(5)
    cellsA.forEach(cell => expect(cell).toHaveStyle('width: 100px; flex: 100 0 auto'))

    // Mock the DOM widths, which can be different from style.width
    headerA.getBoundingClientRect = jest.fn(() => ({ width: 120 }))
    headerB.getBoundingClientRect = jest.fn(() => ({ width: 50 }))
    ungroupedHeaderA.getBoundingClientRect = jest.fn(() => ({ width: 120 }))

    // Resizing header 120+70px
    fireEvent.mouseDown(resizerA, { clientX: 0 })
    fireEvent.mouseMove(resizerA, { clientX: 70 })
    fireEvent.mouseUp(resizerA, { clientX: 70 })
    expect(headerA).toHaveStyle('width: 190px; flex: 0 0 auto')
    expect(ungroupedHeaderA).toHaveStyle('width: 190px; flex: 0 0 auto')
    cellsA.forEach(cell => expect(cell).toHaveStyle('width: 190px; flex: 0 0 auto'))

    // Resizing header 120-10px
    fireEvent.mouseDown(resizerA, { clientX: 70 })
    fireEvent.mouseMove(resizerA, { clientX: 60 })
    fireEvent.mouseUp(resizerA, { clientX: 60 })
    expect(headerA).toHaveStyle('width: 110px; flex: 0 0 auto')
    expect(ungroupedHeaderA).toHaveStyle('width: 110px; flex: 0 0 auto')
    cellsA.forEach(cell => expect(cell).toHaveStyle('width: 110px; flex: 0 0 auto'))

    // Resizing should be limited by max width (50+300px limited at 130px)
    fireEvent.mouseDown(resizerB, { clientX: 0 })
    fireEvent.mouseMove(resizerB, { clientX: 300 })
    fireEvent.mouseUp(resizerB, { clientX: 300 })
    expect(headerB).toHaveStyle('width: 130px; flex: 0 0 auto')
    expect(headerC).toHaveStyle('width: 70px; flex: 0 0 auto')
    expect(groupHeaderBC).toHaveStyle('width: 200px; flex: 0 0 auto')

    // Resizing should be limited by min width (50-300px limited at 30px)
    fireEvent.mouseDown(resizerB, { clientX: 300 })
    fireEvent.mouseMove(resizerB, { clientX: 0 })
    fireEvent.mouseUp(resizerB, { clientX: 0 })
    expect(headerB).toHaveStyle('width: 30px; flex: 0 0 auto')
    expect(headerC).toHaveStyle('width: 70px; flex: 0 0 auto')
    expect(groupHeaderBC).toHaveStyle('width: 100px; flex: 0 0 auto')
  })

  it('touch resizing works for headers', () => {
    const props = {
      data: { a: [1, 3, 2], b: ['aa', 'bb', 'cc'] },
      columns: [
        { name: 'colA', accessor: 'a', className: 'col-a', footer: 'footer' },
        { name: 'colB', accessor: 'b', minWidth: 30, maxWidth: 130 },
        { name: 'colC', accessor: 'c', width: 70 }
      ],
      columnGroups: [{ name: 'group-bc', columns: ['b', 'c'] }],
      resizable: true,
      minRows: 4
    }
    const { container } = render(<Reactable {...props} />)
    const [headerA, headerB, headerC] = getColumnHeaders(container)
    const [ungroupedHeaderA] = getUngroupedHeaders(container)
    const [groupHeaderBC] = getGroupHeaders(container)
    const resizerA = getResizers(headerA)[0]
    const resizerB = getResizers(headerB)[0]
    expect(headerA).toHaveStyle('width: 100px; flex: 100 0 auto')
    expect(ungroupedHeaderA).toHaveStyle('width: 100px; flex: 100 0 auto')
    expect(headerB).toHaveStyle('width: 30px; flex: 30 0 auto')
    expect(headerC).toHaveStyle('width: 70px; flex: 0 0 auto')
    expect(groupHeaderBC).toHaveStyle('width: 100px; flex: 30 0 auto')

    const cellsA = [
      ...getCells(container, '.col-a'),
      getFooters(container)[0],
      getCells(getPadRows(container)[0])[0]
    ]
    expect(cellsA).toHaveLength(5)
    cellsA.forEach(cell => expect(cell).toHaveStyle('width: 100px; flex: 100 0 auto'))

    // Mock the DOM widths, which can be different from style.width
    headerA.getBoundingClientRect = jest.fn(() => ({ width: 120 }))
    headerB.getBoundingClientRect = jest.fn(() => ({ width: 50 }))
    ungroupedHeaderA.getBoundingClientRect = jest.fn(() => ({ width: 120 }))

    // Resizing header 120+70px
    fireEvent.touchStart(resizerA, { touches: [{ clientX: 0 }] })
    fireEvent.touchMove(resizerA, { touches: [{ clientX: 70 }] })
    fireEvent.touchEnd(resizerA, { touches: [{ clientX: 70 }] })
    expect(headerA).toHaveStyle('width: 190px; flex: 0 0 auto')
    expect(ungroupedHeaderA).toHaveStyle('width: 190px; flex: 0 0 auto')
    cellsA.forEach(cell => expect(cell).toHaveStyle('width: 190px; flex: 0 0 auto'))

    // Resizing header 120-10px
    fireEvent.touchStart(resizerA, { touches: [{ clientX: 70 }] })
    fireEvent.touchMove(resizerA, { touches: [{ clientX: 60 }] })
    fireEvent.touchEnd(resizerA, { touches: [{ clientX: 60 }] })
    expect(headerA).toHaveStyle('width: 110px; flex: 0 0 auto')
    expect(ungroupedHeaderA).toHaveStyle('width: 110px; flex: 0 0 auto')
    cellsA.forEach(cell => expect(cell).toHaveStyle('width: 110px; flex: 0 0 auto'))

    // Resizing should be limited by max width (50+300px limited at 130px)
    fireEvent.touchStart(resizerB, { touches: [{ clientX: 0 }] })
    fireEvent.touchMove(resizerB, { touches: [{ clientX: 300 }] })
    fireEvent.touchEnd(resizerB, { touches: [{ clientX: 300 }] })
    expect(headerB).toHaveStyle('width: 130px; flex: 0 0 auto')
    expect(headerC).toHaveStyle('width: 70px; flex: 0 0 auto')
    expect(groupHeaderBC).toHaveStyle('width: 200px; flex: 0 0 auto')

    // Resizing should be limited by min width (50-300px limited at 30px)
    fireEvent.touchStart(resizerB, { touches: [{ clientX: 300 }] })
    fireEvent.touchMove(resizerB, { touches: [{ clientX: 0 }] })
    fireEvent.touchEnd(resizerB, { touches: [{ clientX: 0 }] })
    expect(headerB).toHaveStyle('width: 30px; flex: 0 0 auto')
    expect(headerC).toHaveStyle('width: 70px; flex: 0 0 auto')
    expect(groupHeaderBC).toHaveStyle('width: 100px; flex: 0 0 auto')
  })

  it('mouse resizing works for column group headers', () => {
    const props = {
      data: { a: [1, 3, 2], b: ['aa', 'bb', 'cc'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b', minWidth: 30, maxWidth: 130 },
        { name: 'colC', accessor: 'c', width: 70 }
      ],
      columnGroups: [{ name: 'group-bc', columns: ['b', 'c'] }],
      resizable: true
    }
    const { container } = render(<Reactable {...props} />)
    const [headerA, headerB, headerC] = getColumnHeaders(container)
    const [ungroupedHeaderA] = getUngroupedHeaders(container)
    const [groupHeaderBC] = getGroupHeaders(container)
    const resizers = getResizers(container)
    expect(resizers).toHaveLength(4)
    const [resizerGroupA, resizerGroupBC] = resizers
    expect(headerA).toHaveStyle('width: 100px; flex: 100 0 auto')
    expect(ungroupedHeaderA).toHaveStyle('width: 100px; flex: 100 0 auto')
    expect(headerB).toHaveStyle('width: 30px; flex: 30 0 auto')
    expect(headerC).toHaveStyle('width: 70px; flex: 0 0 auto')
    expect(groupHeaderBC).toHaveStyle('width: 100px; flex: 30 0 auto')

    // Mock the DOM widths, which can be different from style.width
    headerA.getBoundingClientRect = jest.fn(() => ({ width: 120 }))
    ungroupedHeaderA.getBoundingClientRect = jest.fn(() => ({ width: 120 }))
    headerB.getBoundingClientRect = jest.fn(() => ({ width: 50 }))
    groupHeaderBC.getBoundingClientRect = jest.fn(() => ({ width: 120 }))

    // Resizing single group header 120+70px
    fireEvent.mouseDown(resizerGroupA, { clientX: 0 })
    fireEvent.mouseMove(resizerGroupA, { clientX: 70 })
    fireEvent.mouseUp(resizerGroupA, { clientX: 70 })
    expect(headerA).toHaveStyle('width: 190px; flex: 0 0 auto')
    expect(ungroupedHeaderA).toHaveStyle('width: 190px; flex: 0 0 auto')

    // Resizing single group header 120-10px
    fireEvent.mouseDown(resizerGroupA, { clientX: 70 })
    fireEvent.mouseMove(resizerGroupA, { clientX: 60 })
    fireEvent.mouseUp(resizerGroupA, { clientX: 60 })
    expect(headerA).toHaveStyle('width: 110px; flex: 0 0 auto')
    expect(ungroupedHeaderA).toHaveStyle('width: 110px; flex: 0 0 auto')

    // Resizing double group header 120+70px
    fireEvent.mouseDown(resizerGroupBC, { clientX: 0 })
    fireEvent.mouseMove(resizerGroupBC, { clientX: 70 })
    fireEvent.mouseUp(resizerGroupBC, { clientX: 70 })
    expect(headerB).toHaveStyle('width: 79.16666666666667px; flex: 0 0 auto') // 50 + 50 * (70/120)
    expect(headerC).toHaveStyle('width: 70px; flex: 0 0 auto')
    expect(groupHeaderBC).toHaveStyle('width: 149.16666666666669px; flex: 0 0 auto') // 50 + 50 * (70/120) + 70

    // Resizing should be limited by max width (50+300px limited at 130px)
    fireEvent.mouseDown(resizerGroupBC, { clientX: 0 })
    fireEvent.mouseMove(resizerGroupBC, { clientX: 300 })
    fireEvent.mouseUp(resizerGroupBC, { clientX: 300 })
    expect(headerB).toHaveStyle('width: 130px; flex: 0 0 auto')
    expect(headerC).toHaveStyle('width: 70px; flex: 0 0 auto')
    expect(groupHeaderBC).toHaveStyle('width: 200px; flex: 0 0 auto')

    // Resizing should be limited by min width (50-300px limited at 30px)
    fireEvent.mouseDown(resizerGroupBC, { clientX: 300 })
    fireEvent.mouseMove(resizerGroupBC, { clientX: 0 })
    fireEvent.mouseUp(resizerGroupBC, { clientX: 0 })
    expect(headerB).toHaveStyle('width: 30px; flex: 0 0 auto')
    expect(headerC).toHaveStyle('width: 70px; flex: 0 0 auto')
    expect(groupHeaderBC).toHaveStyle('width: 100px; flex: 0 0 auto')
  })

  it('touch resizing works for column group headers', () => {
    const props = {
      data: { a: [1, 3, 2], b: ['aa', 'bb', 'cc'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b', minWidth: 30, maxWidth: 130 },
        { name: 'colC', accessor: 'c', width: 70 }
      ],
      columnGroups: [{ name: 'group-bc', columns: ['b', 'c'] }],
      resizable: true
    }
    const { container } = render(<Reactable {...props} />)
    const [headerA, headerB, headerC] = getColumnHeaders(container)
    const [ungroupedHeaderA] = getUngroupedHeaders(container)
    const [groupHeaderBC] = getGroupHeaders(container)
    const resizers = getResizers(container)
    expect(resizers).toHaveLength(4)
    const [resizerGroupA, resizerGroupBC] = resizers
    expect(headerA).toHaveStyle('width: 100px; flex: 100 0 auto')
    expect(ungroupedHeaderA).toHaveStyle('width: 100px; flex: 100 0 auto')
    expect(headerB).toHaveStyle('width: 30px; flex: 30 0 auto')
    expect(headerC).toHaveStyle('width: 70px; flex: 0 0 auto')
    expect(groupHeaderBC).toHaveStyle('width: 100px; flex: 30 0 auto')

    // Mock the DOM widths, which can be different from style.width
    headerA.getBoundingClientRect = jest.fn(() => ({ width: 120 }))
    ungroupedHeaderA.getBoundingClientRect = jest.fn(() => ({ width: 120 }))
    headerB.getBoundingClientRect = jest.fn(() => ({ width: 50 }))
    groupHeaderBC.getBoundingClientRect = jest.fn(() => ({ width: 120 }))

    // Resizing single group header 120+70px
    fireEvent.touchStart(resizerGroupA, { touches: [{ clientX: 0 }] })
    fireEvent.touchMove(resizerGroupA, { touches: [{ clientX: 70 }] })
    fireEvent.touchEnd(resizerGroupA, { touches: [{ clientX: 70 }] })
    expect(headerA).toHaveStyle('width: 190px; flex: 0 0 auto')
    expect(ungroupedHeaderA).toHaveStyle('width: 190px; flex: 0 0 auto')

    // Resizing single group header 120-10px
    fireEvent.touchStart(resizerGroupA, { touches: [{ clientX: 70 }] })
    fireEvent.touchMove(resizerGroupA, { touches: [{ clientX: 60 }] })
    fireEvent.touchEnd(resizerGroupA, { touches: [{ clientX: 60 }] })
    expect(headerA).toHaveStyle('width: 110px; flex: 0 0 auto')
    expect(ungroupedHeaderA).toHaveStyle('width: 110px; flex: 0 0 auto')

    // Resizing double group header 120+70px
    fireEvent.touchStart(resizerGroupBC, { touches: [{ clientX: 0 }] })
    fireEvent.touchMove(resizerGroupBC, { touches: [{ clientX: 70 }] })
    fireEvent.touchEnd(resizerGroupBC, { touches: [{ clientX: 70 }] })
    expect(headerB).toHaveStyle('width: 79.16666666666667px; flex: 0 0 auto') // 50 + 50 * (70/120)
    expect(headerC).toHaveStyle('width: 70px; flex: 0 0 auto')
    expect(groupHeaderBC).toHaveStyle('width: 149.16666666666669px; flex: 0 0 auto') // 50 + 50 * (70/120) + 70

    // Resizing should be limited by max width (50+300px limited at 130px)
    fireEvent.touchStart(resizerGroupBC, { touches: [{ clientX: 0 }] })
    fireEvent.touchMove(resizerGroupBC, { touches: [{ clientX: 300 }] })
    fireEvent.touchEnd(resizerGroupBC, { touches: [{ clientX: 300 }] })
    expect(headerB).toHaveStyle('width: 130px; flex: 0 0 auto')
    expect(headerC).toHaveStyle('width: 70px; flex: 0 0 auto')
    expect(groupHeaderBC).toHaveStyle('width: 200px; flex: 0 0 auto')

    // Resizing should be limited by min width (50-300px limited at 30px)
    fireEvent.touchStart(resizerGroupBC, { touches: [{ clientX: 300 }] })
    fireEvent.touchMove(resizerGroupBC, { touches: [{ clientX: 0 }] })
    fireEvent.touchEnd(resizerGroupBC, { touches: [{ clientX: 0 }] })
    expect(headerB).toHaveStyle('width: 30px; flex: 0 0 auto')
    expect(headerC).toHaveStyle('width: 70px; flex: 0 0 auto')
    expect(groupHeaderBC).toHaveStyle('width: 100px; flex: 0 0 auto')
  })

  it('columns cannot be resized with multiple touches', () => {
    const props = {
      data: { a: [1, 3, 2], b: ['aa', 'bb', 'cc'] },
      columns: [{ name: 'colA', accessor: 'a' }],
      columnGroups: [{ name: 'group-a', columns: ['a'] }],
      resizable: true
    }
    const { container } = render(<Reactable {...props} />)
    const [headerA] = getColumnHeaders(container)
    const [groupedHeaderA] = getGroupHeaders(container)
    const resizerA = getResizers(headerA)[0]
    expect(headerA).toHaveStyle('width: 100px; flex: 100 0 auto')
    expect(groupedHeaderA).toHaveStyle('width: 100px; flex: 100 0 auto')

    // Mock the DOM widths, which can be different from style.width
    headerA.getBoundingClientRect = jest.fn(() => ({ width: 120 }))
    groupedHeaderA.getBoundingClientRect = jest.fn(() => ({ width: 120 }))

    fireEvent.touchStart(resizerA, { touches: [{ clientX: 0 }, { clientX: 0 }] })
    fireEvent.touchMove(resizerA, { touches: [{ clientX: 70 }, { clientX: 70 }] })
    fireEvent.touchEnd(resizerA, { touches: [{ clientX: 70 }, { clientX: 70 }] })
    expect(headerA).toHaveStyle('width: 100px; flex: 100 0 auto')
    expect(groupedHeaderA).toHaveStyle('width: 100px; flex: 100 0 auto')
  })

  it('headers and cells are styled when resizing the table', () => {
    const props = {
      data: { a: [1, 3, 2], b: ['aa', 'bb', 'cc'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b', minWidth: 30, maxWidth: 130 },
        { name: 'colC', accessor: 'c', width: 70 }
      ],
      columnGroups: [{ name: 'group-bc', columns: ['b', 'c'] }],
      resizable: true
    }
    const { container } = render(<Reactable {...props} />)
    const [headerA] = getColumnHeaders(container)
    const [groupHeaderBC] = getGroupHeaders(container)
    const resizerA = getResizers(headerA)[0]
    const resizerGroupBC = getResizers(groupHeaderBC)[0]

    const table = getTable(container)
    expect(table).not.toHaveClass('rt-resizing')

    // Resizing header
    fireEvent.mouseDown(resizerA, { clientX: 0 })
    expect(table).toHaveClass('rt-resizing')
    fireEvent.mouseMove(resizerA, { clientX: 70 })
    expect(table).toHaveClass('rt-resizing')
    fireEvent.mouseUp(resizerA, { clientX: 70 })
    expect(table).not.toHaveClass('rt-resizing')

    // Resizing group header
    fireEvent.mouseDown(resizerGroupBC, { clientX: 0 })
    expect(table).toHaveClass('rt-resizing')
    fireEvent.mouseMove(resizerGroupBC, { clientX: 70 })
    expect(table).toHaveClass('rt-resizing')
    fireEvent.mouseUp(resizerGroupBC, { clientX: 70 })
    expect(table).not.toHaveClass('rt-resizing')
  })

  it('min-width on table body, table head, and table foot should include resized widths', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], c: ['c', 'd'] },
      columns: [
        { name: 'colA', accessor: 'a', footer: 'footer', minWidth: 50 },
        { name: 'colB', accessor: 'b', width: 120, maxWidth: 50 },
        { name: 'colC', accessor: 'c' }
      ],
      columnGroups: [{ columns: ['a', 'b'], name: 'group-ab' }],
      filterable: true,
      resizable: true
    }
    const { container } = render(<Reactable {...props} />)
    const headerA = getColumnHeaders(container)[0]
    const resizerA = getResizers(headerA)[0]

    // Mock the DOM widths, which can be different from style.width
    headerA.getBoundingClientRect = jest.fn(() => ({ width: 120 }))

    // Resizing header 120+70px
    fireEvent.touchStart(resizerA, { touches: [{ clientX: 0 }] })
    fireEvent.touchMove(resizerA, { touches: [{ clientX: 70 }] })
    fireEvent.touchEnd(resizerA, { touches: [{ clientX: 70 }] })
    expect(headerA).toHaveStyle('width: 190px; flex: 0 0 auto')

    // Table element should not have min-width for horizontal scrolling
    expect(getTable(container).style.minWidth).toEqual('')

    expect(getThead(container)).toHaveStyle('min-width: 410px') // 190+120+100px
    expect(getTbody(container)).toHaveStyle('min-width: 410px')
    expect(getTfoot(container)).toHaveStyle('min-width: 410px')
  })

  it('resized state persists when data changes', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      columnGroups: [{ name: 'group-ab', columns: ['a', 'b'] }],
      resizable: true
    }
    const { container, rerender } = render(<Reactable {...props} />)

    const [headerA, headerB] = getColumnHeaders(container)
    const [groupHeader] = getGroupHeaders(container)
    const resizerA = getResizers(container)[1]
    expect(headerA).toHaveStyle('width: 100px; flex: 100 0 auto')
    expect(headerB).toHaveStyle('width: 100px; flex: 100 0 auto')
    expect(groupHeader).toHaveStyle('width: 200px; flex: 200 0 auto')

    // Mock the DOM widths, which can be different from style.width
    headerA.getBoundingClientRect = jest.fn(() => ({ width: 120 }))
    headerB.getBoundingClientRect = jest.fn(() => ({ width: 120 }))

    fireEvent.mouseDown(resizerA, { clientX: 120 })
    fireEvent.mouseMove(resizerA, { clientX: 200 })
    fireEvent.mouseUp(resizerA, { clientX: 200 })
    expect(headerA).toHaveStyle('width: 200px; flex: 0 0 auto')
    expect(headerB).toHaveStyle('width: 100px; flex: 100 0 auto')
    expect(groupHeader).toHaveStyle('width: 300px; flex: 100 0 auto')

    rerender(<Reactable {...props} data={{ a: ['a', 'b', 'c'], b: ['x', 'y', 'bz'] }} />)
    expect(headerA).toHaveStyle('width: 200px; flex: 0 0 auto')
    expect(headerB).toHaveStyle('width: 100px; flex: 100 0 auto')
    expect(groupHeader).toHaveStyle('width: 300px; flex: 100 0 auto')
  })
})

describe('sticky columns', () => {
  // For testing resizing
  beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => cb())
  })

  afterEach(() => {
    window.requestAnimationFrame.mockRestore()
  })

  it('sticky left', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], c: ['c', 'd'], d: ['e', 'f'] },
      columns: [
        {
          name: 'a',
          accessor: 'a',
          footer: 'ftr',
          sticky: 'left',
          className: 'col-a',
          headerClassName: 'col-a',
          footerClassName: 'col-a'
        },
        {
          name: 'b',
          accessor: 'b',
          footer: 'ftr',
          sticky: 'left',
          className: 'col-b',
          headerClassName: 'col-b',
          footerClassName: 'col-b'
        },
        {
          name: 'c',
          accessor: 'c',
          footer: 'ftr',
          className: 'col-c',
          headerClassName: 'col-c',
          footerClassName: 'col-c'
        },
        {
          name: 'd',
          accessor: 'd',
          footer: 'ftr',
          sticky: 'left',
          className: 'col-d',
          headerClassName: 'col-d',
          footerClassName: 'col-d'
        }
      ],
      columnGroups: [
        { name: 'group-ab', columns: ['a', 'b'], sticky: 'left' },
        { name: 'group-c', columns: ['c'] },
        { name: 'group-d', columns: ['d'], sticky: 'left' }
      ],
      filterable: true,
      minRows: 3
    }
    const { container } = render(<Reactable {...props} />)
    const [padCellA, padCellB, padCellC, padCellD] = getCells(getPadRows(container)[0])

    const cellsA = [...container.querySelectorAll('.col-a'), padCellA]
    cellsA.forEach(cell => expect(cell).toHaveStyle('position: sticky; left: 0'))
    cellsA.forEach(cell => expect(cell).toHaveClass('rt-sticky'))
    const cellsB = [...container.querySelectorAll('.col-b'), padCellB]
    cellsB.forEach(cell => expect(cell).toHaveStyle('position: sticky; left: 100px'))
    cellsB.forEach(cell => expect(cell).toHaveClass('rt-sticky'))
    const cellsC = [...container.querySelectorAll('.col-c'), padCellC]
    cellsC.forEach(cell => expect(cell).not.toHaveStyle('position: sticky'))
    cellsC.forEach(cell => expect(cell).not.toHaveClass('rt-sticky'))
    const cellsD = [...container.querySelectorAll('.col-d'), padCellD]
    cellsD.forEach(cell => expect(cell).toHaveStyle('position: sticky; left: 200px'))
    cellsD.forEach(cell => expect(cell).toHaveClass('rt-sticky'))

    const [groupAB, groupC, groupD] = getGroupHeaders(container)
    expect(groupAB).toHaveStyle('position: sticky; left: 0')
    expect(groupAB).toHaveClass('rt-sticky')
    expect(groupC).not.toHaveStyle('position: sticky')
    expect(groupC).not.toHaveClass('rt-sticky')
    expect(groupD).toHaveStyle('position: sticky; left: 200px')
    expect(groupD).toHaveClass('rt-sticky')
  })

  it('sticky right', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], c: ['c', 'd'], d: ['e', 'f'] },
      columns: [
        {
          name: 'a',
          accessor: 'a',
          footer: 'ftr',
          sticky: 'right',
          className: 'col-a',
          headerClassName: 'col-a',
          footerClassName: 'col-a'
        },
        {
          name: 'b',
          accessor: 'b',
          footer: 'ftr',
          sticky: 'right',
          className: 'col-b',
          headerClassName: 'col-b',
          footerClassName: 'col-b'
        },
        {
          name: 'c',
          accessor: 'c',
          footer: 'ftr',
          className: 'col-c',
          headerClassName: 'col-c',
          footerClassName: 'col-c'
        },
        {
          name: 'd',
          accessor: 'd',
          footer: 'ftr',
          sticky: 'right',
          className: 'col-d',
          headerClassName: 'col-d',
          footerClassName: 'col-d'
        }
      ],
      columnGroups: [
        { name: 'group-ab', columns: ['a', 'b'], sticky: 'right' },
        { name: 'group-c', columns: ['c'] },
        { name: 'group-d', columns: ['d'], sticky: 'right' }
      ],
      filterable: true,
      minRows: 3
    }
    const { container } = render(<Reactable {...props} />)
    const [padCellA, padCellB, padCellC, padCellD] = getCells(getPadRows(container)[0])

    const cellsD = [...container.querySelectorAll('.col-d'), padCellD]
    cellsD.forEach(cell => expect(cell).toHaveStyle('position: sticky; right: 0'))
    cellsD.forEach(cell => expect(cell).toHaveClass('rt-sticky'))
    const cellsC = [...container.querySelectorAll('.col-c'), padCellC]
    cellsC.forEach(cell => expect(cell).not.toHaveStyle('position: sticky'))
    cellsC.forEach(cell => expect(cell).not.toHaveClass('rt-sticky'))
    const cellsB = [...container.querySelectorAll('.col-b'), padCellB]
    cellsB.forEach(cell => expect(cell).toHaveStyle('position: sticky; right: 100px'))
    cellsB.forEach(cell => expect(cell).toHaveClass('rt-sticky'))
    const cellsA = [...container.querySelectorAll('.col-a'), padCellA]
    cellsA.forEach(cell => expect(cell).toHaveStyle('position: sticky; right: 200px'))
    cellsA.forEach(cell => expect(cell).toHaveClass('rt-sticky'))

    const [groupAB, groupC, groupD] = getGroupHeaders(container)
    expect(groupD).toHaveStyle('position: sticky; right: 0')
    expect(groupD).toHaveClass('rt-sticky')
    expect(groupC).not.toHaveStyle('position: sticky')
    expect(groupC).not.toHaveClass('rt-sticky')
    expect(groupAB).toHaveStyle('position: sticky; right: 100px')
    expect(groupAB).toHaveClass('rt-sticky')
  })

  it('sticky columns work with resizing', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], c: ['c', 'd'], d: ['e', 'f'] },
      columns: [
        {
          name: 'a',
          accessor: 'a',
          footer: 'ftr',
          sticky: 'left',
          className: 'col-a',
          headerClassName: 'col-a',
          footerClassName: 'col-a'
        },
        {
          name: 'b',
          accessor: 'b',
          footer: 'ftr',
          sticky: 'left',
          className: 'col-b',
          headerClassName: 'col-b',
          footerClassName: 'col-b'
        },
        {
          name: 'c',
          accessor: 'c',
          footer: 'ftr',
          className: 'col-c',
          headerClassName: 'col-c',
          footerClassName: 'col-c'
        },
        {
          name: 'd',
          accessor: 'd',
          footer: 'ftr',
          sticky: 'left',
          className: 'col-d',
          headerClassName: 'col-d',
          footerClassName: 'col-d'
        }
      ],
      columnGroups: [
        { name: 'group-ab', columns: ['a', 'b'], sticky: 'left' },
        { name: 'group-c', columns: ['c'] },
        { name: 'group-d', columns: ['d'], sticky: 'left' }
      ],
      filterable: true,
      resizable: true
    }
    const { container } = render(<Reactable {...props} />)
    const [headerA, headerB] = getColumnHeaders(container)
    const resizerA = getResizers(headerA)[0]
    const resizerB = getResizers(headerB)[0]
    expect(headerA).toHaveStyle('width: 100px; flex: 100 0 auto')
    expect(headerB).toHaveStyle('width: 100px; flex: 100 0 auto')

    // Mock the DOM widths, which can be different from style.width
    headerA.getBoundingClientRect = jest.fn(() => ({ width: 120 }))
    headerB.getBoundingClientRect = jest.fn(() => ({ width: 120 }))

    // Resizing header 120+70px
    fireEvent.mouseDown(resizerA, { clientX: 0 })
    fireEvent.mouseMove(resizerA, { clientX: 70 })
    fireEvent.mouseUp(resizerA, { clientX: 70 })
    expect(headerA).toHaveStyle('width: 190px; flex: 0 0 auto')

    // Resizing header 120+50px
    fireEvent.mouseDown(resizerB, { clientX: 0 })
    fireEvent.mouseMove(resizerB, { clientX: 50 })
    fireEvent.mouseUp(resizerB, { clientX: 50 })
    expect(headerB).toHaveStyle('width: 170px; flex: 0 0 auto')

    const cellsA = container.querySelectorAll('.col-a')
    cellsA.forEach(cell => expect(cell).toHaveStyle('position: sticky; left: 0'))
    cellsA.forEach(cell => expect(cell).toHaveClass('rt-sticky'))
    const cellsB = container.querySelectorAll('.col-b')
    cellsB.forEach(cell => expect(cell).toHaveStyle('position: sticky; left: 190px'))
    cellsB.forEach(cell => expect(cell).toHaveClass('rt-sticky'))
    const cellsC = container.querySelectorAll('.col-c')
    cellsC.forEach(cell => expect(cell).not.toHaveStyle('position: sticky'))
    cellsC.forEach(cell => expect(cell).not.toHaveClass('rt-sticky'))
    const cellsD = container.querySelectorAll('.col-d')
    cellsD.forEach(cell => expect(cell).toHaveStyle('position: sticky; left: 360px'))
    cellsD.forEach(cell => expect(cell).toHaveClass('rt-sticky'))

    const [groupAB, groupC, groupD] = getGroupHeaders(container)
    expect(groupAB).toHaveStyle('position: sticky; left: 0')
    expect(groupAB).toHaveClass('rt-sticky')
    expect(groupC).not.toHaveStyle('position: sticky')
    expect(groupC).not.toHaveClass('rt-sticky')
    expect(groupD).toHaveStyle('position: sticky; left: 360px')
    expect(groupD).toHaveClass('rt-sticky')
  })

  it('all columns in a group have the same sticky property', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], c: ['c', 'd'], d: ['e', 'f'], e: [3, 4] },
      columns: [
        {
          name: 'a - sticky col with ungrouped header',
          accessor: 'a',
          sticky: 'left',
          className: 'col-a',
          headerClassName: 'col-a'
        },
        {
          name: 'b - group with different sticky props',
          accessor: 'b',
          sticky: 'left',
          className: 'col-b',
          headerClassName: 'col-b'
        },
        {
          name: 'c - group with different sticky props',
          accessor: 'c',
          sticky: 'right',
          className: 'col-c',
          headerClassName: 'col-c'
        },
        {
          name: 'd - non-sticky col with sticky group header',
          accessor: 'd',
          className: 'col-d',
          headerClassName: 'col-d'
        },
        {
          name: 'e - sticky col with sticky group header',
          accessor: 'e',
          sticky: 'left',
          className: 'col-e',
          headerClassName: 'col-e'
        }
      ],
      columnGroups: [
        { name: 'group-bc', columns: ['b', 'c'] },
        { name: 'group-de', columns: ['d', 'e'], sticky: 'right' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const [ungroupedA] = getUngroupedHeaders(container)
    const [groupBC, groupDE] = getGroupHeaders(container)

    expect(ungroupedA).toHaveStyle('position: sticky; left: 0')
    expect(ungroupedA).toHaveClass('rt-sticky')
    const cellsA = container.querySelectorAll('.col-a')
    cellsA.forEach(cell => expect(cell).toHaveStyle('position: sticky; left: 0'))
    cellsA.forEach(cell => expect(cell).toHaveClass('rt-sticky'))

    expect(groupBC).toHaveStyle('position: sticky; left: 100px')
    expect(groupBC).toHaveClass('rt-sticky')
    const cellsB = container.querySelectorAll('.col-b')
    cellsB.forEach(cell => expect(cell).toHaveStyle('position: sticky; left: 100px'))
    cellsB.forEach(cell => expect(cell).toHaveClass('rt-sticky'))
    const cellsC = container.querySelectorAll('.col-c')
    cellsC.forEach(cell => expect(cell).toHaveStyle('position: sticky; left: 200px'))
    cellsC.forEach(cell => expect(cell).toHaveClass('rt-sticky'))

    expect(groupDE).toHaveStyle('position: sticky; right: 0')
    expect(groupDE).toHaveClass('rt-sticky')
    const cellsD = container.querySelectorAll('.col-d')
    cellsD.forEach(cell => expect(cell).toHaveStyle('position: sticky; right: 100px'))
    cellsD.forEach(cell => expect(cell).toHaveClass('rt-sticky'))
    const cellsE = container.querySelectorAll('.col-e')
    cellsE.forEach(cell => expect(cell).toHaveStyle('position: sticky; right: 0'))
    cellsE.forEach(cell => expect(cell).toHaveClass('rt-sticky'))
  })

  it('sticky columns work with row highlighting and row striping', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      columnGroups: [{ name: 'group-ab', columns: ['a', 'b'] }],
      highlight: true,
      striped: true,
      minRows: 2
    }
    const { container, rerender } = render(<Reactable {...props} />)
    let rows = getRows(container)
    rows.forEach((row, index) => {
      expect(row).toHaveClass('rt-tr-highlight')
      if (index % 2 === 0) {
        expect(row).toHaveClass('rt-tr-striped')
      }
    })

    const columns = [
      { name: 'a', accessor: 'a', sticky: 'left' },
      { name: 'b', accessor: 'b' }
    ]
    rerender(<Reactable {...props} columns={columns} />)
    rows = getRows(container)
    rows.forEach((row, index) => {
      expect(row).not.toHaveClass('rt-tr-highlight')
      expect(row).toHaveClass('rt-tr-highlight-sticky')
      if (index % 2 === 0) {
        expect(row).not.toHaveClass('rt-tr-striped')
        expect(row).toHaveClass('rt-tr-striped-sticky')
      }
    })
  })
})

describe('no data', () => {
  it('renders no data message in table body', () => {
    const props = {
      data: { a: [] },
      columns: [{ name: 'a', accessor: 'a' }]
    }
    const { container, queryAllByText, rerender } = render(<Reactable {...props} />)
    const noData = queryAllByText('No rows found')
    expect(noData).toHaveLength(1)
    expect(noData[0]).toHaveAttribute('aria-live', 'assertive')
    const tbody = getTbody(container)
    expect(getNoData(tbody)).toBeVisible()
    expect(tbody).toHaveClass('rt-tbody-no-data')

    const dataRows = getDataRows(container)
    expect(dataRows).toHaveLength(0)
    const padRows = getPadRows(container)
    expect(padRows).toHaveLength(1)

    // Language
    rerender(<Reactable {...props} language={{ noData: '_No rows found' }} />)
    expect(getNoData(tbody).textContent).toEqual('_No rows found')
  })

  it('does not show message with data present', () => {
    const props = {
      data: { a: [1] },
      columns: [{ name: 'a', accessor: 'a' }]
    }
    const { container, queryByText } = render(<Reactable {...props} />)
    const noData = queryByText('No rows found')
    expect(noData).toEqual(null)

    const tbody = getTbody(container)
    expect(tbody).not.toHaveClass('rt-tbody-no-data')
  })

  it('no data message element exists with data present', () => {
    // Element must exist on page for ARIA live region to be announced
    const props = {
      data: { a: [1] },
      columns: [{ name: 'a', accessor: 'a' }]
    }
    const { container } = render(<Reactable {...props} />)
    const tbody = getTbody(container)
    const noData = getNoData(tbody)
    expect(noData).toHaveTextContent('')
    expect(noData).toHaveAttribute('aria-live', 'assertive')
  })
})

describe('keyboard focus styles', () => {
  it('applies keyboard focus styles when using the keyboard', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'colA', accessor: 'a' }]
    }
    const { container } = render(<Reactable {...props} />)
    const rootContainer = getRoot(container)
    expect(rootContainer).not.toHaveClass('rt-keyboard-active')
    fireEvent.mouseDown(rootContainer)
    expect(rootContainer).not.toHaveClass('rt-keyboard-active')

    fireEvent.keyDown(rootContainer)
    expect(rootContainer).toHaveClass('rt-keyboard-active')

    fireEvent.mouseDown(rootContainer)
    expect(rootContainer).not.toHaveClass('rt-keyboard-active')

    // Should detect tabbing into the table
    fireEvent.keyUp(rootContainer)
    expect(rootContainer).not.toHaveClass('rt-keyboard-active')

    fireEvent.keyUp(rootContainer, { key: 'Tab', keyCode: 9, charCode: 9 })
    expect(rootContainer).toHaveClass('rt-keyboard-active')
  })
})

describe('scrollable tables are keyboard accessible', () => {
  afterEach(() => {
    delete window.ResizeObserver
  })

  it('table is not focusable when unscrollable', () => {
    const props = {
      data: { a: [1, 2], b: ['aa', 'bb'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const table = getTable(container)
    expect(table).toBeVisible()
    expect(table).toHaveAttribute('tabindex', '-1')
  })

  it('table is focusable when horizontally scrollable', () => {
    const props = {
      data: { a: [1, 2], b: ['aa', 'bb'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' }
      ]
    }

    let disconnectCount = 0
    window.ResizeObserver = class ResizeObserver {
      constructor(cb) {
        this.cb = cb
      }
      observe(el) {
        // Element height/widths are all 0 in jsdom
        Object.defineProperty(el, 'scrollWidth', { value: 2, configurable: true })
        Object.defineProperty(el, 'clientWidth', { value: 1, configurable: true })
        this.cb()
      }
      disconnect() {
        disconnectCount += 1
      }
    }

    const { container, unmount } = render(<Reactable {...props} />)
    const table = getTable(container)
    expect(table).toBeVisible()
    expect(table).toHaveAttribute('tabindex', '0')

    unmount(<Reactable {...props} />)
    expect(disconnectCount).toEqual(1)
  })

  it('table is focusable when vertically scrollable', () => {
    const props = {
      data: { a: [1, 2], b: ['aa', 'bb'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' }
      ]
    }

    let disconnectCount = 0
    window.ResizeObserver = class ResizeObserver {
      constructor(cb) {
        this.cb = cb
      }
      observe(el) {
        // Element height/widths are all 0 in jsdom
        Object.defineProperty(el, 'scrollHeight', { value: 2, configurable: true })
        Object.defineProperty(el, 'scrollHeight', { value: 1, configurable: true })
        this.cb()
      }
      disconnect() {
        disconnectCount += 1
      }
    }

    const { container, unmount } = render(<Reactable {...props} />)
    const table = getTable(container)
    expect(table).toBeVisible()
    expect(table).toHaveAttribute('tabindex', '0')

    unmount(<Reactable {...props} />)
    expect(disconnectCount).toEqual(1)
  })
})

describe('sorting', () => {
  it('enables sorting', () => {
    const props = {
      data: { a: [1, 3, 2, 5], b: ['aa', 'CC', 'dd', 'BB'] },
      columns: [
        { name: 'colA', accessor: 'a', type: 'numeric', className: 'col-a' },
        { name: 'colB', accessor: 'b', className: 'col-b' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    // Should be sortable by default
    const headers = getSortableHeaders(container)
    expect(headers.length).toEqual(2)

    fireEvent.click(headers[0])
    const cellsA = getCells(container, '.col-a')
    expect([...cellsA].map(cell => cell.textContent)).toEqual(['1', '2', '3', '5'])
    fireEvent.click(headers[0])
    expect([...cellsA].map(cell => cell.textContent)).toEqual(['5', '3', '2', '1'])
    fireEvent.click(headers[0])
    expect([...cellsA].map(cell => cell.textContent)).toEqual(['1', '2', '3', '5'])

    fireEvent.click(headers[1])
    const cellsB = getCells(container, '.col-b')
    expect([...cellsB].map(cell => cell.textContent)).toEqual(['aa', 'BB', 'CC', 'dd'])
    fireEvent.click(headers[1])
    expect([...cellsB].map(cell => cell.textContent)).toEqual(['dd', 'CC', 'BB', 'aa'])
    fireEvent.click(headers[1])
    expect([...cellsB].map(cell => cell.textContent)).toEqual(['aa', 'BB', 'CC', 'dd'])
  })

  it('disables sorting', () => {
    // Sorting disabled globally
    const props = {
      data: { a: [1, 3, 2, 5], b: ['aa', 'CC', 'dd', 'BB'] },
      columns: [
        { name: 'colA', accessor: 'a', type: 'numeric', className: 'col-a' },
        { name: 'colB', accessor: 'b', className: 'col-b' }
      ],
      sortable: false
    }
    const { container, rerender } = render(<Reactable {...props} />)
    let sortHeaders = getSortableHeaders(container)
    expect(sortHeaders.length).toEqual(0)

    let headers = getHeaders(container)
    fireEvent.click(headers[0])
    const colA = container.querySelectorAll('.col-a')
    expect([...colA].map(el => el.textContent)).toEqual(['1', '3', '2', '5'])

    // Sorting disabled globally with column enable override
    let columns = [
      { name: 'colA', accessor: 'a', type: 'numeric', className: 'col-a', sortable: true },
      { name: 'colB', accessor: 'b', className: 'col-b' }
    ]
    rerender(<Reactable {...props} columns={columns} />)
    sortHeaders = container.querySelectorAll('[aria-sort]')
    expect(sortHeaders.length).toEqual(1)
    expect(sortHeaders[0].textContent).toEqual('colA')

    // Sorting enabled globally with column disable override
    columns = [
      { name: 'colA', accessor: 'a', type: 'numeric', className: 'col-a', sortable: false },
      { name: 'colB', accessor: 'b', className: 'col-b' }
    ]
    rerender(<Reactable {...props} columns={columns} sortable={true} />)
    sortHeaders = container.querySelectorAll('[aria-sort]')
    expect(sortHeaders.length).toEqual(1)
    expect(sortHeaders[0].textContent).toEqual('colB')
  })

  it('multi-sorting', () => {
    const { container } = render(
      <Reactable
        data={{ a: [1, 3, 1, 1], b: ['aa', 'CC', 'dd', 'BB'] }}
        columns={[
          { name: 'colA', accessor: 'a', type: 'numeric', className: 'col-a' },
          { name: 'colB', accessor: 'b', className: 'col-b' }
        ]}
      />
    )
    const headers = getSortableHeaders(container)
    expect(headers.length).toEqual(2)

    // First multi-sort should work just like a regular sort
    fireEvent.click(headers[0], { shiftKey: true })
    const colA = container.querySelectorAll('.col-a')
    expect([...colA].map(el => el.textContent)).toEqual(['1', '1', '1', '3'])
    const colB = container.querySelectorAll('.col-b')
    expect([...colB].map(el => el.textContent)).toEqual(['aa', 'dd', 'BB', 'CC'])

    // Second multi-sort should resort the second column
    fireEvent.click(headers[1], { shiftKey: true })
    expect([...colB].map(el => el.textContent)).toEqual(['aa', 'BB', 'dd', 'CC'])
    fireEvent.click(headers[1], { shiftKey: true })
    expect([...colB].map(el => el.textContent)).toEqual(['dd', 'BB', 'aa', 'CC'])
    // Multi-sort should reset sorted state on the third toggle
    fireEvent.click(headers[1], { shiftKey: true })
    expect([...colB].map(el => el.textContent)).toEqual(['aa', 'dd', 'BB', 'CC'])

    // Regular sorting should clear multi-sort state
    fireEvent.click(headers[1])
    expect([...colB].map(el => el.textContent)).toEqual(['aa', 'BB', 'CC', 'dd'])
    expect([...colA].map(el => el.textContent)).toEqual(['1', '1', '3', '1'])
  })

  it('defaultSortOrder', () => {
    const props = {
      data: { a: [1, 3, 1, 1], b: ['aa', 'CC', 'dd', 'BB'] },
      columns: [
        { name: 'colA', accessor: 'a', type: 'numeric', className: 'col-a' },
        { name: 'colB', accessor: 'b', className: 'col-b' }
      ]
    }
    const { container, rerender } = render(<Reactable {...props} />)
    const headers = getSortableHeaders(container)
    expect(headers.length).toEqual(2)

    // Should default to ascending order
    fireEvent.click(headers[0])
    const colA = container.querySelectorAll('.col-a')
    expect([...colA].map(el => el.textContent)).toEqual(['1', '1', '1', '3'])

    // Descending order
    rerender(<Reactable {...props} defaultSortDesc />)
    fireEvent.click(headers[1])
    const colB = container.querySelectorAll('.col-b')
    expect([...colB].map(el => el.textContent)).toEqual(['dd', 'CC', 'BB', 'aa'])

    // Ascending order with column override for descending order
    let columns = [
      { name: 'colA', accessor: 'a', type: 'numeric', className: 'col-a', defaultSortDesc: true },
      { name: 'colB', accessor: 'b', className: 'col-b' }
    ]
    rerender(<Reactable {...props} columns={columns} />)
    fireEvent.click(headers[0])
    expect([...colA].map(el => el.textContent)).toEqual(['3', '1', '1', '1'])

    // Descending order with column override for ascending order
    columns = [
      { name: 'colA', accessor: 'a', type: 'numeric', className: 'col-a' },
      { name: 'colB', accessor: 'b', className: 'col-b', defaultSortDesc: false }
    ]
    rerender(<Reactable {...props} columns={columns} defaultSortDesc />)
    fireEvent.click(headers[1])
    expect([...colB].map(el => el.textContent)).toEqual(['aa', 'BB', 'CC', 'dd'])
  })

  it('defaultSorted', () => {
    const props = {
      data: { a: [1, 3, 1, 1], b: ['aa', 'CC', 'dd', 'BB'] },
      columns: [
        { name: 'colA', accessor: 'a', type: 'numeric', className: 'col-a' },
        { name: 'colB', accessor: 'b', className: 'col-b' }
      ]
    }
    // Default sorted in ascending order
    const { container, rerender } = render(
      <Reactable {...props} defaultSorted={[{ id: 'a', desc: false }]} />
    )
    const headers = getSortableHeaders(container)
    expect(headers.length).toEqual(2)

    const colA = container.querySelectorAll('.col-a')
    expect([...colA].map(el => el.textContent)).toEqual(['1', '1', '1', '3'])

    // Default sorted in descending order
    rerender(<Reactable {...props} defaultSorted={[{ id: 'b', desc: true }]} />)
    const colB = container.querySelectorAll('.col-b')
    expect([...colB].map(el => el.textContent)).toEqual(['dd', 'CC', 'BB', 'aa'])

    // Multiple default sorted
    rerender(
      <Reactable
        {...props}
        defaultSorted={[
          { id: 'a', desc: false },
          { id: 'b', desc: true }
        ]}
      />
    )
    expect([...colA].map(el => el.textContent)).toEqual(['1', '1', '1', '3'])
    expect([...colB].map(el => el.textContent)).toEqual(['dd', 'BB', 'aa', 'CC'])
  })

  it('table updates when defaultSorted changes', () => {
    const props = {
      data: { a: [1, 3, 5, 1], b: ['aa', 'CC', 'dd', 'BB'] },
      columns: [
        { name: 'colA', accessor: 'a', type: 'numeric', className: 'col-a' },
        { name: 'colB', accessor: 'b', className: 'col-b' }
      ],
      defaultSorted: [{ id: 'a', desc: false }]
    }
    const { container, rerender } = render(<Reactable {...props} />)
    let colA = container.querySelectorAll('.col-a')
    expect([...colA].map(el => el.textContent)).toEqual(['1', '1', '3', '5'])

    rerender(<Reactable {...props} defaultSorted={[{ id: 'a', desc: true }]} />)
    colA = container.querySelectorAll('.col-a')
    expect([...colA].map(el => el.textContent)).toEqual(['5', '3', '1', '1'])
  })

  it('sorted state persists when data changes', () => {
    const props = {
      data: { a: [1, 3, 2, 5], b: ['aa', 'CC', 'dd', 'BB'] },
      columns: [
        { name: 'colA', accessor: 'a', type: 'numeric', className: 'col-a' },
        { name: 'colB', accessor: 'b', className: 'col-b' }
      ]
    }
    const { container, rerender } = render(<Reactable {...props} />)
    const headers = getSortableHeaders(container)
    expect(headers.length).toEqual(2)

    fireEvent.click(headers[0])
    let cellsA = getCells(container, '.col-a')
    expect([...cellsA].map(cell => cell.textContent)).toEqual(['1', '2', '3', '5'])

    rerender(<Reactable {...props} />)
    cellsA = getCells(container, '.col-a')
    expect([...cellsA].map(cell => cell.textContent)).toEqual(['1', '2', '3', '5'])

    rerender(<Reactable {...props} data={{ a: [4, 2, 0], b: ['a', 'b', 'c'] }} />)
    cellsA = getCells(container, '.col-a')
    expect([...cellsA].map(cell => cell.textContent)).toEqual(['0', '2', '4'])
  })

  it('headers have aria attributes', () => {
    const { container } = render(
      <Reactable
        data={{ a: [1, 2], b: ['aa', 'bb'], c: [true, false] }}
        columns={[
          { name: 'colA', accessor: 'a' },
          { name: 'colB', accessor: 'b' },
          { name: 'colC', accessor: 'c', sortable: false }
        ]}
        sortable
      />
    )
    const headers = getHeaders(container)
    expect(headers[0]).toHaveAttribute('aria-sort', 'none')
    expect(headers[1]).toHaveAttribute('aria-sort', 'none')
    expect(headers[0]).toHaveAttribute('aria-label', 'Sort colA')
    expect(headers[1]).toHaveAttribute('aria-label', 'Sort colB')
    expect(headers[0]).toHaveAttribute('role', 'columnheader')
    expect(headers[1]).toHaveAttribute('role', 'columnheader')

    fireEvent.click(headers[1])
    expect(headers[1]).toHaveAttribute('aria-sort', 'ascending')
    fireEvent.click(headers[1])
    expect(headers[1]).toHaveAttribute('aria-sort', 'descending')
    fireEvent.click(headers[1], { shiftKey: true })
    expect(headers[1]).toHaveAttribute('aria-sort', 'none')

    expect(headers[2]).not.toHaveAttribute('aria-sort')
    expect(headers[2]).not.toHaveAttribute('aria-label')
    expect(headers[2]).toHaveAttribute('role', 'columnheader')
  })

  it('sorting works with grouping and sub-rows', () => {
    const props = {
      data: {
        group: ['group-x', 'group-x', 'group-x', 'group-y'],
        a: [2, -3, 0, 5],
        b: ['aaa', 'bbb', 'ccc', 'ddd']
      },
      columns: [
        { name: 'col-group', accessor: 'group', className: 'col-group' },
        {
          name: 'col-a',
          accessor: 'a',
          type: 'numeric',
          aggregate: values => (values.length === 3 ? 10 : 1),
          className: 'col-a'
        },
        { name: 'col-b', accessor: 'b', aggregate: values => values.length, className: 'col-b' }
      ],
      pivotBy: ['group']
    }
    const { container, getByText } = render(<Reactable {...props} />)
    // Should sort grouped cells
    fireEvent.click(getByText('col-group'))
    expect(getCellsText(container, '.col-group')).toEqual([
      '\u200bgroup-x (3)',
      '\u200bgroup-y (1)'
    ])
    fireEvent.click(getByText('col-group'))
    expect(getCellsText(container, '.col-group')).toEqual([
      '\u200bgroup-y (1)',
      '\u200bgroup-x (3)'
    ])

    // Numeric columns
    fireEvent.click(getByText('col-a'))
    // Should sort by aggregate values first, then leaf values.
    // group-y has the highest leaf value, but lowest aggregate value.
    expect(getCellsText(container, '.col-group')).toEqual([
      '\u200bgroup-y (1)',
      '\u200bgroup-x (3)'
    ])
    fireEvent.click(getExpanders(container)[0])
    fireEvent.click(getExpanders(container)[1])
    expect(getCellsText(container, '.col-a')).toEqual(['1', '5', '10', '-3', '0', '2'])
    fireEvent.click(getByText('col-a'))
    expect(getCellsText(container, '.col-a')).toEqual(['10', '2', '0', '-3', '1', '5'])

    // Non-numeric columns
    fireEvent.click(getByText('col-b'))
    expect(getCellsText(container, '.col-b')).toEqual(['1', 'ddd', '3', 'aaa', 'bbb', 'ccc'])
    fireEvent.click(getByText('col-b'))
    expect(getCellsText(container, '.col-b')).toEqual(['3', 'ccc', 'bbb', 'aaa', '1', 'ddd'])
  })

  it('sort language', () => {
    const props = {
      data: { a: [1, 2], b: ['aa', 'bb'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' }
      ],
      language: { sortLabel: '_Sort {name}' }
    }
    const { container } = render(<Reactable {...props} />)
    const headers = getSortableHeaders(container)
    expect(headers[0]).toHaveAttribute('aria-label', '_Sort colA')
    expect(headers[1]).toHaveAttribute('aria-label', '_Sort colB')
  })

  it('can be navigated with keyboard', () => {
    const props = {
      data: { a: [1, 2], b: ['aa', 'bb'], c: [true, false] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b', defaultSortDesc: true },
        { name: 'colC', accessor: 'c', sortable: false }
      ],
      sortable: true
    }
    const { container } = render(<Reactable {...props} />)
    const headers = getHeaders(container)
    expect(headers[0]).toHaveAttribute('tabindex', '0')
    expect(headers[1]).toHaveAttribute('tabindex', '0')
    expect(headers[2]).not.toHaveAttribute('tabindex')

    // Should be toggleable using enter or space key
    fireEvent.keyPress(headers[0], { key: 'Enter', keyCode: 13, charCode: 13 })
    expect(headers[0]).toHaveAttribute('aria-sort', 'ascending')
    fireEvent.keyPress(headers[0], { key: ' ', keyCode: 32, charCode: 32 })
    expect(headers[0]).toHaveAttribute('aria-sort', 'descending')
    fireEvent.keyPress(headers[0], { key: 'Enter', keyCode: 13, charCode: 13, shiftKey: true })
    expect(headers[0]).toHaveAttribute('aria-sort', 'none')
  })

  it('shows focus indicators when navigating using keyboard', () => {
    const props = {
      data: { a: [1, 2], b: ['aa', 'bb'], c: [true, false] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b', defaultSortDesc: true },
        { name: 'colC', accessor: 'c', sortable: false }
      ],
      sortable: true
    }
    const { container } = render(<Reactable {...props} />)
    const headers = getHeaders(container)
    expect(headers[0]).toHaveAttribute('data-sort-hint', 'ascending')
    expect(headers[1]).toHaveAttribute('data-sort-hint', 'descending')
    expect(headers[2]).not.toHaveAttribute('data-sort-hint')
  })

  it('clicking resizer does not toggle sorting', () => {
    const props = {
      data: { a: [1, 2], b: ['aa', 'bb'], c: [true, false] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' },
        { name: 'colC', accessor: 'c' }
      ],
      resizable: true
    }
    const { container } = render(<Reactable {...props} />)
    const [headerA] = getHeaders(container)
    expect(headerA).toHaveAttribute('aria-sort', 'none')

    // Resize header
    const [resizerA] = getResizers(container)
    fireEvent.mouseDown(resizerA, { clientX: 0 })
    fireEvent.mouseMove(resizerA, { clientX: 70 })
    fireEvent.mouseUp(resizerA, { clientX: 70 })
    fireEvent.click(headerA)

    expect(headerA).toHaveAttribute('aria-sort', 'none')
  })

  it('shows or hides sort icons', () => {
    const props = {
      data: { a: [1, 2], b: ['aa', 'bb'] },
      columns: [
        { name: 'colA', accessor: 'a', type: 'numeric' },
        { name: 'colB', accessor: 'b' }
      ]
    }
    const { container, rerender } = render(<Reactable {...props} />)
    const numericSortIcon = container.querySelectorAll('.rt-sort-left')
    expect(numericSortIcon).toHaveLength(1)
    const defaultSortIcon = container.querySelectorAll('.rt-sort-right')
    expect(defaultSortIcon).toHaveLength(1)

    // Hide sort icons
    rerender(<Reactable {...props} showSortIcon={false} />)
    expect(container.querySelector('.rt-sort-left')).toEqual(null)
    expect(container.querySelector('.rt-sort-right')).toEqual(null)
  })

  it('shows sortable columns', () => {
    const props = {
      data: { a: [1, 2], b: ['aa', 'bb'], c: [true, false] },
      columns: [
        { name: 'colA', accessor: 'a', type: 'numeric' },
        { name: 'colB', accessor: 'b', sortable: false },
        { name: 'colC', accessor: 'c' }
      ],
      showSortable: true
    }
    const { container } = render(<Reactable {...props} />)
    const headers = getHeaders(container)
    expect(headers[0].querySelector('.rt-sort-left.rt-sort')).toBeVisible()
    expect(headers[1].querySelector('.rt-sort')).toEqual(null)
    expect(headers[2].querySelector('.rt-sort-right.rt-sort')).toBeVisible()
  })

  it('sorts missing values last', () => {
    const props = {
      data: { a: [2, 'NA', 1, 3], b: ['aa', null, null, 'BB'] },
      columns: [
        {
          name: 'colA',
          accessor: 'a',
          type: 'numeric',
          sortNALast: true,
          className: 'col-a'
        },
        { name: 'colB', accessor: 'b', sortNALast: true, className: 'col-b' }
      ],
      minRows: 4
    }
    const { container } = render(<Reactable {...props} />)
    const headers = getSortableHeaders(container)
    expect(headers.length).toEqual(2)

    fireEvent.click(headers[0])
    const cellsA = getCells(container, '.col-a')
    expect([...cellsA].map(cell => cell.textContent)).toEqual(['1', '2', '3', '\u200b'])
    fireEvent.click(headers[0])
    expect([...cellsA].map(cell => cell.textContent)).toEqual(['3', '2', '1', '\u200b'])

    fireEvent.click(headers[1])
    const cellsB = getCells(container, '.col-b')
    expect([...cellsB].map(cell => cell.textContent)).toEqual(['aa', 'BB', '\u200b', '\u200b'])
    fireEvent.click(headers[1])
    expect([...cellsB].map(cell => cell.textContent)).toEqual(['BB', 'aa', '\u200b', '\u200b'])
  })
})

describe('filtering', () => {
  it('renders filters', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'colA', accessor: 'a', headerClassName: 'header', headerStyle: { color: 'red' } },
        { name: 'colB', accessor: 'b', className: 'cell', style: { color: 'blue' } }
      ],
      filterable: true
    }
    const { container } = render(<Reactable {...props} />)
    const filterRow = getFilterRow(container)
    expect(filterRow).toHaveAttribute('role', 'row')

    const filterCells = getFilterCells(container)
    expect(filterCells).toHaveLength(2)
    filterCells.forEach(cell => expect(cell).toHaveAttribute('role', 'cell'))
    // Should not have colspan attribute (from react-table)
    filterCells.forEach(cell => expect(cell).not.toHaveAttribute('colspan'))
    expect(filterCells[0]).toHaveClass('header')
    expect(filterCells[0]).toHaveStyle('color: red')
    expect(filterCells[1]).not.toHaveClass('cell')
    expect(filterCells[1]).not.toHaveStyle('color: blue')

    const filters = getFilters(container)
    expect(filters).toHaveLength(2)
    expect(filters[0]).toHaveAttribute('aria-label', 'Filter colA')
    expect(filters[1]).toHaveAttribute('aria-label', 'Filter colB')
    expect(filters[0].placeholder).toEqual('')
    expect(filters[1].placeholder).toEqual('')
  })

  it('is not filterable by default', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const filterRow = getFilterRow(container)
    expect(filterRow).toEqual(null)
    const filters = getFilters(container)
    const filterCells = getFilterCells(container)
    expect(filters).toHaveLength(0)
    expect(filterCells).toHaveLength(0)
  })

  it('column filterable should override global filterable', () => {
    // Column with filtering disabled
    let props = {
      data: { a: [1, 2], b: ['a', 'b'], c: ['c', 'd'] },
      columns: [
        { name: 'colA', accessor: 'a', headerClassName: 'header', headerStyle: { color: 'red' } },
        { name: 'colB', accessor: 'b', className: 'cell', style: { color: 'blue' } },
        { name: 'colC', accessor: 'c', filterable: false }
      ],
      filterable: true
    }
    const { container, rerender } = render(<Reactable {...props} />)
    let filterCells = getFilterCells(container)
    expect(filterCells).toHaveLength(3)
    let filters = getFilters(container)
    expect(filters).toHaveLength(2)
    expect(getFilters(filterCells[2])).toHaveLength(0)

    // Column with filtering enabled
    props = {
      ...props,
      columns: [
        { name: 'colA', accessor: 'a', headerClassName: 'header', headerStyle: { color: 'red' } },
        { name: 'colB', accessor: 'b', className: 'cell', style: { color: 'blue' } },
        { name: 'colC', accessor: 'c', filterable: true }
      ],
      filterable: false
    }
    rerender(<Reactable {...props} />)
    filterCells = getFilterCells(container)
    expect(filterCells).toHaveLength(3)
    filters = getFilters(container)
    expect(filters).toHaveLength(1)
    expect(getFilters(filterCells[2])).toHaveLength(1)
  })

  it('should not render filters for hidden columns', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'colA', accessor: 'a', show: false },
        { name: 'colB', accessor: 'b' }
      ],
      filterable: true
    }
    const { container } = render(<Reactable {...props} />)
    const filterCells = getFilterCells(container)
    expect(filterCells).toHaveLength(1)
    const filters = getFilters(container)
    expect(filters).toHaveLength(1)
    expect(filters[0]).toHaveAttribute('aria-label', 'Filter colB')
  })

  it('filters numeric columns', () => {
    const { container, getByText } = render(
      <Reactable
        data={{ a: [111, 115, 32.11] }}
        columns={[{ name: 'a', accessor: 'a', type: 'numeric' }]}
        filterable
      />
    )
    const filter = getFilters(container)[0]

    fireEvent.change(filter, { target: { value: '11' } })
    let rows = getDataRows(container)
    expect(rows).toHaveLength(2)
    expect(getByText('111')).toBeVisible()
    expect(getByText('115')).toBeVisible()

    // No matches
    fireEvent.change(filter, { target: { value: '5' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(0)
    expect(getByText('No rows found')).toBeVisible()
    const padRows = getPadRows(container)
    expect(padRows).toHaveLength(1)

    // Clear filter
    fireEvent.change(filter, { target: { value: '' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(3)
  })

  it('filters string columns', () => {
    const { container, getByText, queryByText } = render(
      <Reactable
        data={{ a: ['aaac', 'bbb', 'CCC'], b: ['ááád', 'bAb', 'CC'] }}
        columns={[
          { name: 'a', accessor: 'a', type: 'factor' },
          { name: 'b', accessor: 'b', type: 'character' }
        ]}
        filterable
      />
    )
    const filters = getFilters(container)

    // Case-insensitive
    fireEvent.change(filters[0], { target: { value: 'Bb' } })
    let rows = getDataRows(container)
    expect(rows).toHaveLength(1)
    expect(getByText('bbb')).toBeVisible()

    // Substring matches
    fireEvent.change(filters[0], { target: { value: 'c' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(2)
    expect(getByText('aaac')).toBeVisible()
    expect(getByText('CCC')).toBeVisible()

    // No matches
    fireEvent.change(filters[0], { target: { value: 'cccc' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(0)
    expect(getByText('No rows found')).toBeVisible()

    // Clear filter
    fireEvent.change(filters[0], { target: { value: '' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(3)

    // Diacritics
    fireEvent.change(filters[1], { target: { value: 'á' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(1)
    expect(queryByText('ááád')).toBeVisible()
  })

  it('filters other types of columns', () => {
    const { container, getByText } = render(
      <Reactable
        data={{ a: ['ááád', '123', 'acCC', '2018-03-05'] }}
        columns={[{ name: 'a', accessor: 'a' }]}
        filterable
      />
    )
    const filter = getFilters(container)[0]

    // Case-insensitive
    fireEvent.change(filter, { target: { value: 'acc' } })
    let rows = getDataRows(container)
    expect(rows).toHaveLength(1)
    expect(getByText('acCC')).toBeVisible()

    // Substring matches
    fireEvent.change(filter, { target: { value: '03-05' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(1)
    expect(getByText('2018-03-05')).toBeVisible()

    // Not locale-sensitive
    fireEvent.change(filter, { target: { value: 'aaa' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(0)
    expect(getByText('No rows found')).toBeVisible()

    // Clear filter
    fireEvent.change(filter, { target: { value: '' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(4)
  })

  it('filtering works with column groups', () => {
    const { container, getByText } = render(
      <Reactable
        data={{ a: ['aaac', 'bbb', 'CCC'], b: ['ááád', 'bAb', 'CC'] }}
        columns={[
          { name: 'a', accessor: 'a' },
          { name: 'b', accessor: 'b' }
        ]}
        columnGroups={[
          {
            columns: ['a', 'b'],
            name: 'group-1'
          }
        ]}
        filterable
      />
    )
    const filterCells = getFilterCells(container)
    expect(filterCells).toHaveLength(2)
    const filters = getFilters(container)
    expect(filters).toHaveLength(2)
    fireEvent.change(filters[0], { target: { value: 'Bb' } })
    let rows = getDataRows(container)
    expect(rows).toHaveLength(1)
    expect(getByText('bbb')).toBeVisible()
  })

  it('filtering works with grouping and sub-rows', () => {
    const props = {
      data: {
        group: ['group-x', 'group-x', 'group-x', 'group-y'],
        a: [1, 1, 2, 41],
        b: ['aaa', 'bbb', 'aaa', 'bbb']
      },
      columns: [
        { name: 'group', accessor: 'group' },
        { name: 'col-a', accessor: 'a', type: 'numeric', aggregate: 'sum', className: 'col-a' },
        { name: 'col-b', accessor: 'b', aggregate: () => 'ccc' }
      ],
      filterable: true,
      pivotBy: ['group']
    }
    const { container } = render(<Reactable {...props} />)
    const filters = getFilters(container)

    // Numeric column
    expect(getCellsText(container, '.col-a')).toEqual(['4', '41'])
    fireEvent.change(filters[1], { target: { value: '1' } })
    expect(getRows(container)).toHaveLength(1)
    expect([...getDataCells(container)].map(cell => cell.textContent)).toEqual([
      '\u200bgroup-x (2)',
      '2', // Aggregate functions should work on filtered data
      'ccc'
    ])

    // Non-numeric column
    fireEvent.change(filters[2], { target: { value: 'b' } })
    expect([...getDataCells(container)].map(cell => cell.textContent)).toEqual([
      '\u200bgroup-x (1)',
      '1',
      'ccc'
    ])

    // Searching should work on grouped cells
    fireEvent.change(filters[1], { target: { value: '' } })
    fireEvent.change(filters[2], { target: { value: '' } })
    fireEvent.change(filters[0], { target: { value: 'group-x' } })
    expect([...getDataCells(container)].map(cell => cell.textContent)).toEqual([
      '\u200bgroup-x (3)',
      '4',
      'ccc'
    ])
  })

  it('filtered state should be available in cellInfo, colInfo, and state info', () => {
    let lastCellInfo = {}
    let lastState = {}
    let lastColInfo = {}
    const props = {
      data: { a: ['aaa1', 'aaa2'], b: ['aaa', 'bbb'] },
      columns: [
        { name: 'a', accessor: 'a' },
        {
          name: 'b',
          accessor: 'b',
          cell: (cellInfo, state) => {
            lastCellInfo.cell = cellInfo
            lastState.cell = state
          },
          header: (colInfo, state) => {
            lastColInfo.header = colInfo
            lastState.header = state
          },
          footer: (colInfo, state) => {
            lastColInfo.footer = colInfo
            lastState.footer = state
          }
        }
      ],
      details: (rowInfo, state) => (lastState.details = state),
      filterable: true
    }
    const { container } = render(<Reactable {...props} />)
    const [filterA, filterB] = getFilters(container)
    Object.values(lastCellInfo).forEach(cellInfo => expect(cellInfo.filterValue).toEqual(undefined))
    Object.values(lastColInfo).forEach(colInfo =>
      expect(colInfo.column.filterValue).toEqual(undefined)
    )
    Object.values(lastState).forEach(state => expect(state.filters).toEqual([]))

    fireEvent.change(filterB, { target: { value: 'bb' } })
    Object.values(lastCellInfo).forEach(cellInfo => expect(cellInfo.filterValue).toEqual('bb'))
    Object.values(lastColInfo).forEach(colInfo => expect(colInfo.column.filterValue).toEqual('bb'))
    Object.values(lastState).forEach(state =>
      expect(state.filters).toEqual([{ id: 'b', value: 'bb' }])
    )

    fireEvent.change(filterA, { target: { value: 'a' } })
    Object.values(lastCellInfo).forEach(cellInfo => expect(cellInfo.filterValue).toEqual('bb'))
    Object.values(lastColInfo).forEach(colInfo => expect(colInfo.column.filterValue).toEqual('bb'))
    Object.values(lastState).forEach(state =>
      expect(state.filters).toEqual([
        { id: 'b', value: 'bb' },
        { id: 'a', value: 'a' }
      ])
    )

    // When filter is cleared, filter value should be unset, not an empty string
    fireEvent.change(filterB, { target: { value: '' } })
    Object.values(lastCellInfo).forEach(cellInfo => expect(cellInfo.filterValue).toEqual(undefined))
    Object.values(lastColInfo).forEach(colInfo =>
      expect(colInfo.column.filterValue).toEqual(undefined)
    )
    Object.values(lastState).forEach(state =>
      expect(state.filters).toEqual([{ id: 'a', value: 'a' }])
    )
  })

  it('filtered state persists when data changes', () => {
    const props = {
      data: { a: ['aaa1', 'aaa2'], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      filterable: true
    }
    const { container, getByText, rerender } = render(<Reactable {...props} />)
    let filter = getFilters(container)[0]
    fireEvent.change(filter, { target: { value: 'aaa2' } })
    let rows = getDataRows(container)
    expect(rows).toHaveLength(1)
    expect(getByText('aaa2')).toBeVisible()
    rerender(<Reactable {...props} data={{ a: ['aaa2', 'aaa222', 'bcd'], b: ['a', 'b', 'c'] }} />)
    rows = getDataRows(container)
    expect(rows).toHaveLength(2)
    expect(getByText('aaa2')).toBeVisible()
    expect(getByText('aaa222')).toBeVisible()
    expect(filter.value).toEqual('aaa2')
  })

  it('filtered state resets when filterable changes to false', () => {
    const props = {
      data: { a: ['aaa1', 'aaa2'], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      searchable: true
    }
    const { container, getByText, rerender } = render(<Reactable {...props} filterable />)
    let filter = getFilters(container)[0]
    fireEvent.change(filter, { target: { value: 'aaa2' } })
    expect(getDataRows(container)).toHaveLength(1)
    expect(getByText('aaa2')).toBeVisible()

    // All other state should persist, including searched state
    let searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'a' } })

    rerender(<Reactable {...props} />)
    expect(getFilters(container)).toHaveLength(0)
    expect(getDataRows(container)).toHaveLength(2)
    searchInput = getSearchInput(container)
    expect(searchInput.value).toEqual('a')

    rerender(<Reactable {...props} filterable />)
    expect(getDataRows(container)).toHaveLength(2)
    filter = getFilters(container)[0]
    expect(filter.value).toEqual('')

    fireEvent.change(filter, { target: { value: 'aaa2' } })
    rerender(<Reactable {...props} />)
    expect(getDataRows(container)).toHaveLength(2)
  })

  it('filter language', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'column-a', accessor: 'a' },
        { name: 'column-b', accessor: 'b' }
      ],
      filterable: true,
      language: {
        filterPlaceholder: 'All',
        filterLabel: '_Filter {name}'
      }
    }
    const { container } = render(<Reactable {...props} />)
    const filters = getFilters(container)
    expect(filters[0]).toHaveAttribute('aria-label', '_Filter column-a')
    expect(filters[1]).toHaveAttribute('aria-label', '_Filter column-b')
    expect(filters[0].placeholder).toEqual('All')
    expect(filters[1].placeholder).toEqual('All')
  })

  it('searchable should not make unfilterable columns filterable', () => {
    // Should not rely on column.canFilter for column filtering, since
    // useGlobalFilter sets column.canFilter on globally filterable columns.
    // https://github.com/tannerlinsley/react-table/issues/2787
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'column-a', accessor: 'a' },
        { name: 'column-b', accessor: 'b', filterable: true }
      ],
      searchable: true
    }
    const { container } = render(<Reactable {...props} />)
    expect(getFilters(container)).toHaveLength(1)
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'Bb' } })
    expect(getFilters(container)).toHaveLength(1)
  })

  it('custom filter method', () => {
    const props = {
      data: { a: ['aaa1', 'aaa2', 'aaa3'], b: ['a', 'b', 'c'] },
      columns: [
        {
          name: 'a',
          accessor: 'a',
          filterMethod: function exactMatch(rows, columnId, filterValue) {
            expect(rows).toHaveLength(3)
            expect(columnId).toEqual('a')
            return rows.filter(row => {
              return row.values[columnId] === filterValue
            })
          }
        },
        {
          name: 'b',
          accessor: 'b',
          filterMethod: function rowIndexMatch(rows, columnId, filterValue) {
            const indices = filterValue.split(',').map(Number)
            return rows.filter(row => {
              return indices.includes(row.index)
            })
          }
        }
      ],
      filterable: true
    }
    const { container, getByText } = render(<Reactable {...props} />)
    const [filterA, filterB] = getFilters(container)

    fireEvent.change(filterA, { target: { value: 'aaa' } })
    expect(getDataRows(container)).toHaveLength(0)
    fireEvent.change(filterA, { target: { value: 'aaa2' } })
    expect(getDataRows(container)).toHaveLength(1)
    expect(getByText('aaa2')).toBeVisible()
    fireEvent.change(filterA, { target: { value: '' } })
    expect(getDataRows(container)).toHaveLength(3)

    fireEvent.change(filterB, { target: { value: 'a' } })
    expect(getDataRows(container)).toHaveLength(0)
    fireEvent.change(filterB, { target: { value: '2,1' } })
    expect(getDataRows(container)).toHaveLength(2)
    expect(getByText('aaa3')).toBeVisible()
    expect(getByText('aaa2')).toBeVisible()
    fireEvent.change(filterB, { target: { value: '' } })
    expect(getDataRows(container)).toHaveLength(3)
  })

  it('custom filter inputs', () => {
    const CustomSelectFilter = (column, state) => {
      expect(column.id).toEqual('a')
      expect(column.name).toEqual('filter-component')
      expect(state.page).toEqual(0)
      expect(state.pageSize).toEqual(10)
      expect(state.data).toEqual([
        { a: 'aaac', b: 1, c: 4 },
        { a: 'bbb', b: 2, c: 5 },
        { a: 'CCC', b: 3, c: 6 }
      ])
      return (
        <select
          className="filter-component"
          value={column.filterValue}
          onChange={e => column.setFilter(e.target.value || undefined)}
        >
          <option value="">All</option>
          <option value="Bb">Bb</option>
          <option value="c">c</option>
          <option value="cccc">cccc</option>
        </select>
      )
    }
    const { container, getByText } = render(
      <Reactable
        data={{ a: ['aaac', 'bbb', 'CCC'], b: [1, 2, 3], c: [4, 5, 6] }}
        columns={[
          { name: 'filter-component', accessor: 'a', filterInput: CustomSelectFilter },
          {
            name: 'filter-html',
            accessor: 'b',
            filterInput: '<input type="text" class="filter-html">',
            html: true
          },
          {
            name: 'filter-element',
            accessor: 'c',
            filterInput: <input className="filter-element"></input>
          }
        ]}
        filterable
      />
    )
    const defaultFilters = getFilters(container)
    expect(defaultFilters).toHaveLength(0)

    const filterHTMLCell = getFilterCells(container)[1]
    expect(filterHTMLCell.innerHTML).toEqual(
      '<div class="rt-td-inner"><div class="rt-text-content"><input type="text" class="filter-html"></div></div>'
    )

    const filterElement = container.querySelector('.filter-element')
    expect(filterElement).toBeVisible()

    const filter = container.querySelector('.filter-component')
    expect(filter).toBeVisible()

    // Case-insensitive
    fireEvent.change(filter, { target: { value: 'Bb' } })
    let rows = getDataRows(container)
    expect(rows).toHaveLength(1)
    expect(getByText('bbb')).toBeVisible()

    // Substring matches
    fireEvent.change(filter, { target: { value: 'c' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(2)
    expect(getByText('aaac')).toBeVisible()
    expect(getByText('CCC')).toBeVisible()

    // No matches
    fireEvent.change(filter, { target: { value: 'cccc' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(0)
    expect(getByText('No rows found')).toBeVisible()

    // Clear filter
    fireEvent.change(filter, { target: { value: '' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(3)
  })
})

describe('searching', () => {
  it('enables searching', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ]
    }
    const { container, rerender } = render(<Reactable {...props} />)
    let searchInput = getSearchInput(container)
    expect(searchInput).toEqual(null)
    rerender(<Reactable {...props} searchable />)
    searchInput = getSearchInput(container)
    expect(searchInput).toBeVisible()
  })

  it('searches numeric columns', () => {
    const { container, getByText } = render(
      <Reactable
        data={{ a: [111, 115, 32.11] }}
        columns={[{ name: 'a', accessor: 'a', type: 'numeric' }]}
        searchable
      />
    )
    const searchInput = getSearchInput(container)

    fireEvent.change(searchInput, { target: { value: '11' } })
    let rows = getDataRows(container)
    expect(rows).toHaveLength(2)
    expect(getByText('111')).toBeVisible()
    expect(getByText('115')).toBeVisible()

    // No matches
    fireEvent.change(searchInput, { target: { value: '5' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(0)
    expect(getByText('No rows found')).toBeVisible()

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(3)
  })

  it('searches string columns', () => {
    const { container, getByText, queryByText } = render(
      <Reactable
        data={{ a: ['aaac', 'bbb', 'CCC'], b: ['ááád', 'bAb', 'CC'] }}
        columns={[
          { name: 'a', accessor: 'a', type: 'factor' },
          { name: 'b', accessor: 'b', type: 'character' }
        ]}
        searchable
      />
    )
    const searchInput = getSearchInput(container)

    // Case-insensitive
    fireEvent.change(searchInput, { target: { value: 'Bb' } })
    let rows = getDataRows(container)
    expect(rows).toHaveLength(1)
    expect(getByText('bbb')).toBeVisible()

    // Substring matches
    fireEvent.change(searchInput, { target: { value: 'c' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(2)
    expect(getByText('aaac')).toBeVisible()
    expect(getByText('CCC')).toBeVisible()

    // No matches
    fireEvent.change(searchInput, { target: { value: 'cccc' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(0)
    expect(getByText('No rows found')).toBeVisible()

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(3)

    // Diacritics
    fireEvent.change(searchInput, { target: { value: 'á' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(1)
    expect(queryByText('ááád')).toBeVisible()
  })

  it('searches other types of columns', () => {
    const { container, getByText } = render(
      <Reactable
        data={{ a: ['ááád', '123', 'acCC', '2018-03-05'] }}
        columns={[{ name: 'a', accessor: 'a' }]}
        searchable
      />
    )
    const searchInput = getSearchInput(container)

    // Case-insensitive
    fireEvent.change(searchInput, { target: { value: 'acc' } })
    let rows = getDataRows(container)
    expect(rows).toHaveLength(1)
    expect(getByText('acCC')).toBeVisible()

    // Substring matches
    fireEvent.change(searchInput, { target: { value: '03-05' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(1)
    expect(getByText('2018-03-05')).toBeVisible()

    // Not locale-sensitive
    fireEvent.change(searchInput, { target: { value: 'aaa' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(0)
    expect(getByText('No rows found')).toBeVisible()

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } })
    rows = getDataRows(container)
    expect(rows).toHaveLength(4)
  })

  it('searching works with column groups', () => {
    const { container, getByText } = render(
      <Reactable
        data={{ a: ['aaac', 'bbb', 'CCC'], b: ['ááád', 'bAb', 'CC'] }}
        columns={[
          { name: 'a', accessor: 'a' },
          { name: 'b', accessor: 'b' }
        ]}
        columnGroups={[
          {
            columns: ['a', 'b'],
            name: 'group-1'
          }
        ]}
        searchable
      />
    )
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'Bb' } })
    let rows = getDataRows(container)
    expect(rows).toHaveLength(1)
    expect(getByText('bbb')).toBeVisible()
  })

  it('ignores columns with searching disabled', () => {
    // Should ignore selection and details columns
    const props = {
      data: { a: [1, 2, 3], b: ['b', 'b', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b', searchable: false }
      ],
      searchable: true
    }
    const { container } = render(<Reactable {...props} />)
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'b' } })
    expect(getDataRows(container)).toHaveLength(0)
  })

  it('ignores hidden columns by default', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['b', 'b', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b', show: false }
      ],
      searchable: true
    }
    const { container } = render(<Reactable {...props} />)
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'b' } })
    expect(getDataRows(container)).toHaveLength(0)
  })

  it('searches hidden columns with searching enabled', () => {
    const props = {
      data: { a: ['a1', 'a2', 'a3'], b: ['b11', 'b12', 'b2'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b', show: false, searchable: true }
      ],
      searchable: true
    }
    const { container, getByText } = render(<Reactable {...props} />)
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'b1' } })
    expect(getDataRows(container)).toHaveLength(2)
    expect(getByText('a1')).toBeVisible()
    expect(getByText('a2')).toBeVisible()
  })

  it('ignores columns without data', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['b', 'b', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' },
        // Fake column for testing. Selection and row details columns now have
        // searching disabled by default, so this shouldn't exist unless searching
        // was manually enabled for the details column.
        { name: '', accessor: '.fake_column' }
      ],
      searchable: true
    }
    const { container } = render(<Reactable {...props} />)
    const searchInput = getSearchInput(container)
    // If a column without data is searched, it should not string match on "undefined"
    fireEvent.change(searchInput, { target: { value: 'undefined' } })
    expect(getDataRows(container)).toHaveLength(0)
  })

  it('searching works when table has no rows', () => {
    const props = {
      data: { a: [], b: [] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      searchable: true
    }
    const { container } = render(<Reactable {...props} />)
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'blargh' } })
    let rows = getDataRows(container)
    expect(rows).toHaveLength(0)
  })

  it('searching works with grouping and sub-rows', () => {
    const props = {
      data: {
        group: ['group-x', 'group-x', 'group-x', 'group-y'],
        a: [1, 1, 2, 41],
        b: ['aaa', 'bbb', 'aaa', 'bbb']
      },
      columns: [
        { name: 'group', accessor: 'group' },
        { name: 'col-a', accessor: 'a', type: 'numeric', aggregate: 'sum', className: 'col-a' },
        { name: 'col-b', accessor: 'b', aggregate: () => 'ccc' }
      ],
      searchable: true,
      pivotBy: ['group']
    }
    const { container } = render(<Reactable {...props} />)
    const searchInput = getSearchInput(container)

    // Numeric column
    expect(getCellsText(container, '.col-a')).toEqual(['4', '41'])
    fireEvent.change(searchInput, { target: { value: '1' } })
    expect(getRows(container)).toHaveLength(1)
    expect(getCellsText(container)).toEqual([
      '\u200bgroup-x (2)',
      '2', // Aggregate functions should work on filtered data
      'ccc'
    ])

    // Non-numeric column
    fireEvent.change(searchInput, { target: { value: 'b' } })
    expect(getCellsText(container)).toEqual([
      '\u200bgroup-x (1)',
      '1',
      'ccc',
      '\u200bgroup-y (1)',
      '41',
      'ccc'
    ])

    // Searching should work on grouped cells
    fireEvent.change(searchInput, { target: { value: 'group-x' } })
    expect(getCellsText(container)).toEqual(['\u200bgroup-x (3)', '4', 'ccc'])
  })

  it('searched state should be available in state info', () => {
    let lastState = {}
    const props = {
      data: { a: ['aaa1', 'aaa2'], b: ['aaa', 'bbb'] },
      columns: [
        { name: 'a', accessor: 'a' },
        {
          name: 'b',
          accessor: 'b',
          cell: (cellInfo, state) => (lastState.cell = state),
          header: (colInfo, state) => (lastState.header = state),
          footer: (colInfo, state) => (lastState.footer = state)
        }
      ],
      details: (rowInfo, state) => (lastState.details = state),
      searchable: true
    }
    const { container } = render(<Reactable {...props} />)
    const searchInput = getSearchInput(container)
    Object.values(lastState).forEach(state => expect(state.searchValue).toEqual(undefined))
    fireEvent.change(searchInput, { target: { value: 'aa' } })
    Object.values(lastState).forEach(state => expect(state.searchValue).toEqual('aa'))
    // When search is cleared, search value should be unset, not an empty string
    fireEvent.change(searchInput, { target: { value: '' } })
    Object.values(lastState).forEach(state => expect(state.searchValue).toEqual(undefined))
  })

  it('searched state persists when data changes', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      searchable: true
    }
    const { container, getByText, rerender } = render(<Reactable {...props} />)
    let searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'b' } })
    let rows = getDataRows(container)
    expect(rows).toHaveLength(1)
    rerender(<Reactable {...props} data={{ a: ['a', 'b', 'c'], b: ['x', 'y', 'bz'] }} />)
    rows = getDataRows(container)
    expect(rows).toHaveLength(2)
    expect(getByText('y')).toBeVisible()
    expect(getByText('bz')).toBeVisible()
    expect(searchInput.value).toEqual('b')
  })

  it('searching updates when columns change', () => {
    const props = {
      data: { a: [111, 115, 32.11] },
      columns: [{ name: 'a', accessor: 'a', type: 'numeric' }],
      searchable: true
    }
    const { container, getByText, rerender } = render(<Reactable {...props} />)
    const searchInput = getSearchInput(container)

    fireEvent.change(searchInput, { target: { value: '11' } })
    expect(getDataRows(container)).toHaveLength(2)
    expect(getByText('111')).toBeVisible()
    expect(getByText('115')).toBeVisible()

    rerender(<Reactable {...props} columns={[{ name: 'a', accessor: 'a', type: 'character' }]} />)
    expect(getDataRows(container)).toHaveLength(3)
    expect(getByText('111')).toBeVisible()
    expect(getByText('115')).toBeVisible()
    expect(getByText('32.11')).toBeVisible()
  })

  it('searched state resets when searchable changes to false', () => {
    const props = {
      data: { a: ['aaa1', 'aaa2'], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      filterable: true
    }
    const { container, getByText, rerender } = render(<Reactable {...props} searchable />)
    let searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'b' } })
    expect(getDataRows(container)).toHaveLength(1)
    expect(getByText('aaa2')).toBeVisible()

    // All other state should persist, including filtered state
    let filter = getFilters(container)[0]
    fireEvent.change(filter, { target: { value: 'a' } })

    rerender(<Reactable {...props} />)
    expect(getDataRows(container)).toHaveLength(2)
    expect(getSearchInput(container)).toEqual(null)
    filter = getFilters(container)[0]
    expect(filter.value).toEqual('a')

    rerender(<Reactable {...props} searchable />)
    expect(getDataRows(container)).toHaveLength(2)
    searchInput = getSearchInput(container)
    expect(searchInput.value).toEqual('')

    fireEvent.change(searchInput, { target: { value: 'b' } })
    rerender(<Reactable {...props} />)
    expect(getDataRows(container)).toHaveLength(2)
  })

  it('search language', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }],
      searchable: true
    }
    const { container, rerender } = render(<Reactable {...props} />)
    const searchInput = getSearchInput(container)
    expect(searchInput.placeholder).toEqual('Search')
    expect(searchInput).toHaveAttribute('aria-label', 'Search')

    rerender(
      <Reactable
        {...props}
        language={{ searchPlaceholder: '_search...', searchLabel: '_Search' }}
      />
    )
    expect(searchInput.placeholder).toEqual('_search...')
    expect(searchInput).toHaveAttribute('aria-label', '_Search')
  })

  it('custom search method', () => {
    const props = {
      data: { a: ['aaa1', 'aaa2', 'aaa3'], b: ['a', 'b', 'c'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      searchable: true,
      searchMethod: function exactTextAndRowIndexMatch(rows, columnIds, filterValue) {
        expect(rows).toHaveLength(3)
        expect(columnIds).toEqual(['a', 'b'])
        const [text, index] = filterValue.split(',')
        return rows.filter(row => {
          return columnIds.some(id => {
            return row.values[id] === text && row.index === Number(index)
          })
        })
      }
    }
    const { container, getByText } = render(<Reactable {...props} />)
    const searchInput = getSearchInput(container)

    fireEvent.change(searchInput, { target: { value: 'a' } })
    expect(getDataRows(container)).toHaveLength(0)
    fireEvent.change(searchInput, { target: { value: 'aaa2' } })
    expect(getDataRows(container)).toHaveLength(0)
    fireEvent.change(searchInput, { target: { value: 'aaa2,1' } })
    expect(getDataRows(container)).toHaveLength(1)
    expect(getByText('aaa2')).toBeVisible()
    fireEvent.change(searchInput, { target: { value: '' } })
    expect(getDataRows(container)).toHaveLength(3)
  })
})

describe('row selection', () => {
  beforeEach(() => {
    window.Shiny = {
      onInputChange: jest.fn(),
      addCustomMessageHandler: jest.fn(),
      bindAll: jest.fn(),
      unbindAll: jest.fn()
    }
  })

  afterEach(() => {
    delete window.Shiny
  })

  it('selection is disabled by default', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }]
    }
    const { container } = render(<Reactable {...props} />)
    const headers = getHeaders(container)
    expect(headers).toHaveLength(1)
    expect(getSelectRowCheckboxes(container)).toHaveLength(0)
    expect(getSelectRowRadios(container)).toHaveLength(0)
  })

  it('selection column headers have cell role', () => {
    const props = {
      data: { a: [1, 2], b: [3, 4] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      selection: 'multiple'
    }
    const { container } = render(<Reactable {...props} />)
    const headers = getHeaders(container)
    expect(headers).toHaveLength(3)
    expect(headers[0]).toHaveAttribute('role', 'cell')
    expect(headers[1]).toHaveAttribute('role', 'columnheader')
    expect(headers[2]).toHaveAttribute('role', 'columnheader')
  })

  it('multiple selection', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }],
      selection: 'multiple',
      selectionId: 'selected'
    }
    const { container, rerender } = render(<Reactable {...props} />)
    expect(getSelectRowCheckboxes(container)).toHaveLength(3)
    expect(window.Shiny.onInputChange).toHaveBeenCalledWith('selected', [])
    const selectRowCheckboxes = getSelectRowCheckboxes(container)
    expect(selectRowCheckboxes).toHaveLength(3)
    const selectAllCheckbox = selectRowCheckboxes[0]
    const selectRow1Checkbox = selectRowCheckboxes[1]
    const selectRow2Checkbox = selectRowCheckboxes[2]
    expect(selectAllCheckbox).toHaveAttribute('aria-label', 'Select all rows')
    expect(selectRow1Checkbox).toHaveAttribute('aria-label', 'Select row')
    expect(selectRow2Checkbox).toHaveAttribute('aria-label', 'Select row')
    const rows = getRows(container)
    rows.forEach(row => expect(row).not.toHaveClass('rt-tr-selected'))

    fireEvent.click(selectRow2Checkbox)
    expect(selectRow1Checkbox.checked).toEqual(false)
    expect(selectRow2Checkbox.checked).toEqual(true)
    expect(selectAllCheckbox.checked).toEqual(false)
    fireEvent.click(selectRow1Checkbox)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(true)
    expect(selectAllCheckbox.checked).toEqual(true)

    expect(selectAllCheckbox).toHaveAttribute('aria-label', 'Select all rows')
    expect(selectRow1Checkbox).toHaveAttribute('aria-label', 'Select row')
    // Selected row indexes should be sorted numerically, not by selection order
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [1, 2])
    rows.forEach(row => expect(row).toHaveClass('rt-tr-selected'))

    fireEvent.click(selectAllCheckbox)
    expect(selectAllCheckbox.checked).toEqual(false)
    expect(selectRow1Checkbox.checked).toEqual(false)
    expect(selectRow2Checkbox.checked).toEqual(false)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [])
    rows.forEach(row => expect(row).not.toHaveClass('rt-tr-selected'))

    fireEvent.click(selectAllCheckbox)
    expect(selectAllCheckbox.checked).toEqual(true)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(true)
    fireEvent.click(selectAllCheckbox)

    // Language
    rerender(
      <Reactable
        {...props}
        language={{
          selectAllRowsLabel: '_Select all rows',
          selectRowLabel: '_Select row'
        }}
      />
    )
    expect(selectAllCheckbox).toHaveAttribute('aria-label', '_Select all rows')
    expect(selectRow2Checkbox).toHaveAttribute('aria-label', '_Select row')

    // Theme
    rerender(
      <Reactable
        {...props}
        theme={{
          rowSelectedStyle: {
            color: 'orange'
          }
        }}
      />
    )
    expect(selectRow1Checkbox).toHaveAttribute('aria-label', 'Select row')
    fireEvent.click(selectRow1Checkbox)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(rows[0]).toHaveClass('rt-tr-selected')
    expect(rows[0]).toHaveStyle('color: orange')
    expect(rows[1]).not.toHaveClass('rt-tr-selected')
    expect(rows[1]).not.toHaveStyle('color: orange')
  })

  it('multiple selection with sub rows', () => {
    const props = {
      data: { a: ['x', 'x', 'y', 'y'], b: [1, 1, 2, 41] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      selection: 'multiple',
      selectionId: 'selected',
      pivotBy: ['a'],
      defaultExpanded: true
    }
    const { container, getAllByLabelText, getByLabelText, rerender } = render(
      <Reactable {...props} />
    )
    expect(getSelectRowCheckboxes(container)).toHaveLength(7)
    expect(window.Shiny.onInputChange).toHaveBeenCalledWith('selected', [])
    const selectAllSubRowsCheckboxes = getAllByLabelText('Select all rows in group')
    expect(selectAllSubRowsCheckboxes).toHaveLength(2)
    const selectRowCheckboxes = getAllByLabelText('Select row')
    expect(selectRowCheckboxes).toHaveLength(4)
    const rows = getRows(container)
    rows.forEach(row => expect(row).not.toHaveClass('rt-tr-selected'))

    fireEvent.click(selectAllSubRowsCheckboxes[0])
    expect(selectAllSubRowsCheckboxes[0].checked).toEqual(true)
    expect(selectRowCheckboxes[0].checked).toEqual(true)
    expect(selectRowCheckboxes[1].checked).toEqual(true)
    expect(selectRowCheckboxes[2].checked).toEqual(false)
    expect(selectRowCheckboxes[3].checked).toEqual(false)
    expect(selectAllSubRowsCheckboxes[0]).toHaveAttribute('aria-label', 'Select all rows in group')
    expect(selectRowCheckboxes[0]).toHaveAttribute('aria-label', 'Select row')
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [1, 2])
    rows.forEach((row, i) => {
      if (i < 3) {
        expect(row).toHaveClass('rt-tr-selected')
      } else {
        expect(row).not.toHaveClass('rt-tr-selected')
      }
    })

    fireEvent.click(selectAllSubRowsCheckboxes[0])
    expect(selectAllSubRowsCheckboxes[0].checked).toEqual(false)
    expect(selectRowCheckboxes[0].checked).toEqual(false)
    expect(selectRowCheckboxes[1].checked).toEqual(false)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [])
    rows.forEach(row => expect(row).not.toHaveClass('rt-tr-selected'))

    // Should be able to select all grouped rows
    const selectAllCheckbox = getByLabelText('Select all rows')
    fireEvent.click(selectAllCheckbox)
    selectAllSubRowsCheckboxes.forEach(checkbox => expect(checkbox.checked).toEqual(true))
    selectRowCheckboxes.forEach(checkbox => expect(checkbox.checked).toEqual(true))
    fireEvent.click(selectAllCheckbox)

    // Selection columns should always be first, even before grouped columns
    const headers = getHeaders(container)
    expect([...headers].map(header => header.textContent)).toEqual(['\u200b', 'a', 'b'])

    // Language
    rerender(
      <Reactable
        {...props}
        language={{
          selectAllSubRowsLabel: '_Select all rows in group'
        }}
      />
    )
    expect(selectAllSubRowsCheckboxes[0]).toHaveAttribute('aria-label', '_Select all rows in group')
  })

  it('multiple selection of sub rows works when not paginating sub rows', () => {
    // Known issue with original useRowSelect hook: when paginateExpandedRows = false,
    // sub rows aren't selected when selecting the parent row.
    // https://github.com/tannerlinsley/react-table/issues/2908
    const props = {
      data: { a: ['x', 'x', 'y', 'y'], b: [1, 1, 2, 41] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      selection: 'multiple',
      pivotBy: ['a'],
      defaultExpanded: true
    }
    const { getAllByLabelText } = render(<Reactable {...props} />)
    const selectAllSubRowsCheckboxes = getAllByLabelText('Select all rows in group')
    expect(selectAllSubRowsCheckboxes).toHaveLength(2)
    const selectRowCheckboxes = getAllByLabelText('Select row')
    expect(selectRowCheckboxes).toHaveLength(4)

    fireEvent.click(selectAllSubRowsCheckboxes[0])
    expect(selectAllSubRowsCheckboxes[0].checked).toEqual(true)
    expect(selectRowCheckboxes[0].checked).toEqual(true)
    expect(selectRowCheckboxes[1].checked).toEqual(true)
    expect(selectRowCheckboxes[2].checked).toEqual(false)
    expect(selectRowCheckboxes[3].checked).toEqual(false)
  })

  it('multiple selection select all checkbox should not render when table has no rows', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'col-a', accessor: 'a' }],
      selection: 'multiple',
      searchable: true
    }
    const { container } = render(<Reactable {...props} />)
    expect(getSelectRowCheckboxes(container)).toHaveLength(3)
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'nonono' } })
    expect(getDataRows(container)).toHaveLength(0)
    expect(getSelectRowCheckboxes(container)).toHaveLength(0)
  })

  it('single selection', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }],
      selection: 'single',
      selectionId: 'selected'
    }
    const { container, rerender } = render(<Reactable {...props} />)
    const selectRowRadios = getSelectRowRadios(container)
    expect(selectRowRadios).toHaveLength(2)
    expect(window.Shiny.onInputChange).toHaveBeenCalledWith('selected', [])
    const selectRow1Radio = selectRowRadios[0]
    const selectRow2Radio = selectRowRadios[1]

    fireEvent.click(selectRow1Radio)
    expect(selectRow1Radio.checked).toEqual(true)
    expect(selectRow2Radio.checked).toEqual(false)
    expect(selectRow1Radio).toHaveAttribute('aria-label', 'Select row')
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [1])

    fireEvent.click(selectRow2Radio)
    expect(selectRow1Radio.checked).toEqual(false)
    expect(selectRow2Radio.checked).toEqual(true)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [2])

    // De-selection should work
    fireEvent.click(selectRow2Radio)
    expect(selectRow1Radio.checked).toEqual(false)
    expect(selectRow2Radio.checked).toEqual(false)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [])

    // Language
    rerender(
      <Reactable
        {...props}
        selection="single"
        language={{
          selectRowLabel: '_Select row'
        }}
      />
    )
    expect(selectRow2Radio).toHaveAttribute('aria-label', '_Select row')
  })

  it('defaultSelected', () => {
    const props = {
      data: { a: [1, 2, 3] },
      columns: [{ name: 'a', accessor: 'a' }],
      selection: 'multiple',
      selectionId: 'selected',
      defaultSelected: [1, 0]
    }
    const { container } = render(<Reactable {...props} />)
    const selectRowCheckboxes = getSelectRowCheckboxes(container)
    expect(selectRowCheckboxes).toHaveLength(4)
    const selectAllCheckbox = selectRowCheckboxes[0]
    const selectRow1Checkbox = selectRowCheckboxes[1]
    const selectRow2Checkbox = selectRowCheckboxes[2]
    const selectRow3Checkbox = selectRowCheckboxes[3]
    expect(selectAllCheckbox.checked).toEqual(false)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(true)
    expect(selectRow3Checkbox.checked).toEqual(false)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [1, 2])
  })

  it('defaultSelected works on filtered rows', () => {
    const props = {
      data: { a: [1, 2, 3] },
      columns: [{ name: 'a', accessor: 'a' }],
      selection: 'multiple',
      searchable: true
    }
    const { container, rerender } = render(<Reactable {...props} />)
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'no' } })
    expect(getDataRows(container)).toHaveLength(0)
    rerender(<Reactable {...props} defaultSelected={[0, 1]} />)
    fireEvent.change(searchInput, { target: { value: '' } })
    expect(getDataRows(container)).toHaveLength(3)
    const selectRowCheckboxes = getSelectRowCheckboxes(container)
    const selectRow1Checkbox = selectRowCheckboxes[1]
    const selectRow2Checkbox = selectRowCheckboxes[2]
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(true)
  })

  it('defaultSelected handles invalid rows', () => {
    const props = {
      data: { a: [1, 2, 3] },
      columns: [{ name: 'a', accessor: 'a' }],
      selection: 'multiple',
      defaultSelected: [3]
    }
    const { container } = render(<Reactable {...props} />)
    const selectRowCheckboxes = getSelectRowCheckboxes(container)
    selectRowCheckboxes.forEach(checkbox => expect(checkbox.checked).toEqual(false))
  })

  it('single selection works with filtered rows', () => {
    const props = {
      data: { a: ['a-row0', 'b-row1'] },
      columns: [{ name: 'a', accessor: 'a' }],
      selection: 'single',
      searchable: true
    }
    const { container } = render(<Reactable {...props} />)
    let selectRowRadios = getSelectRowRadios(container)
    expect(selectRowRadios).toHaveLength(2)

    fireEvent.click(selectRowRadios[0])
    expect(selectRowRadios[0].checked).toEqual(true)
    expect(selectRowRadios[1].checked).toEqual(false)

    // Selected rows that have been filtered out should be deselected when
    // another row is selected.
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'b-row1' } })
    selectRowRadios = getSelectRowRadios(container)
    expect(selectRowRadios).toHaveLength(1)
    fireEvent.click(selectRowRadios[0])

    fireEvent.change(searchInput, { target: { value: '' } })
    selectRowRadios = getSelectRowRadios(container)
    expect(selectRowRadios).toHaveLength(2)
    expect(selectRowRadios[0].checked).toEqual(false)
    expect(selectRowRadios[1].checked).toEqual(true)
  })

  it('multiple selection works with filtered rows', () => {
    const props = {
      data: { a: ['a-row0-group0', 'b-row1-group0', 'c-row2-group1'] },
      columns: [{ name: 'a', accessor: 'a' }],
      selection: 'multiple',
      searchable: true
    }
    const { container } = render(<Reactable {...props} />)

    // The select all checkbox should only select rows that are currently in
    // the table, and not filtered out.
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'group0' } })
    const selectAllCheckbox = getSelectRowCheckboxes(container)[0]
    fireEvent.click(selectAllCheckbox)
    expect(selectAllCheckbox.checked).toEqual(true)

    fireEvent.change(searchInput, { target: { value: '' } })
    expect(selectAllCheckbox.checked).toEqual(false)

    const selectRowCheckboxes = getSelectRowCheckboxes(container)
    expect(selectRowCheckboxes[1].checked).toEqual(true)
    expect(selectRowCheckboxes[2].checked).toEqual(true)
    expect(selectRowCheckboxes[3].checked).toEqual(false)
  })

  it('table updates when defaultSelected changes', () => {
    const props = {
      data: { a: [1, 2, 3] },
      columns: [{ name: 'a', accessor: 'a' }],
      selection: 'multiple',
      selectionId: 'selected',
      defaultSelected: [1, 0]
    }
    const { container, rerender } = render(<Reactable {...props} />)
    const selectRowCheckboxes = getSelectRowCheckboxes(container)
    expect(selectRowCheckboxes).toHaveLength(4)
    const selectAllCheckbox = selectRowCheckboxes[0]
    const selectRow1Checkbox = selectRowCheckboxes[1]
    const selectRow2Checkbox = selectRowCheckboxes[2]
    const selectRow3Checkbox = selectRowCheckboxes[3]
    expect(selectAllCheckbox.checked).toEqual(false)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(true)
    expect(selectRow3Checkbox.checked).toEqual(false)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [1, 2])
    fireEvent.click(selectAllCheckbox)

    rerender(<Reactable {...props} defaultSelected={[0]} />)
    expect(selectAllCheckbox.checked).toEqual(false)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(false)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [1])

    // Clear selection
    rerender(<Reactable {...props} defaultSelected={undefined} />)
    expect(selectAllCheckbox.checked).toEqual(false)
    expect(selectRow1Checkbox.checked).toEqual(false)
    expect(selectRow2Checkbox.checked).toEqual(false)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [])

    // Should allow multiple defaultSelected even when using single selection
    rerender(<Reactable {...props} selection="single" defaultSelected={[1, 2]} />)
    expect(selectRow1Checkbox.checked).toEqual(false)
    expect(selectRow2Checkbox.checked).toEqual(true)
    expect(selectRow3Checkbox.checked).toEqual(true)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [2, 3])
  })

  it('selected state persists when data changes', () => {
    // This really tests that selected state persists when data changes via groupBy.
    // Selected state should be reset when the actual data changes through dataKey
    // or updateReactable.
    const props = {
      data: { a: [1, 2, 3] },
      columns: [{ name: 'a', accessor: 'a' }],
      selection: 'multiple',
      selectionId: 'selected'
    }
    const { container, rerender } = render(<Reactable {...props} />)
    const selectRowCheckboxes = getSelectRowCheckboxes(container)
    expect(selectRowCheckboxes).toHaveLength(4)
    const selectAllCheckbox = selectRowCheckboxes[0]
    const selectRow1Checkbox = selectRowCheckboxes[1]
    const selectRow2Checkbox = selectRowCheckboxes[2]
    const selectRow3Checkbox = selectRowCheckboxes[3]
    fireEvent.click(selectRow1Checkbox)
    fireEvent.click(selectRow3Checkbox)
    expect(selectAllCheckbox.checked).toEqual(false)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(false)
    expect(selectRow3Checkbox.checked).toEqual(true)
    expect(window.Shiny.onInputChange).toHaveBeenCalledTimes(3)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [1, 3])

    rerender(<Reactable {...props} data={{ a: [2, 4, 6] }} />)
    expect(selectAllCheckbox.checked).toEqual(false)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(false)
    expect(selectRow3Checkbox.checked).toEqual(true)
    expect(window.Shiny.onInputChange).toHaveBeenCalledTimes(4)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [1, 3])
  })

  it('selected rows only update on row selection', () => {
    const props = {
      data: { a: ['aaa', 'bbb'] },
      columns: [{ name: 'col-a', accessor: 'a' }],
      selection: 'multiple',
      selectionId: 'selected',
      searchable: true
    }
    const { container, getAllByLabelText, getByLabelText, getByText } = render(
      <Reactable {...props} />
    )
    expect(getSelectRowCheckboxes(container)).toHaveLength(3)
    const selectAllCheckbox = getByLabelText('Select all rows')
    const selectRowCheckboxes = getAllByLabelText('Select row')
    const selectRow1Checkbox = selectRowCheckboxes[0]
    const selectRow2Checkbox = selectRowCheckboxes[1]
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [])

    fireEvent.click(selectAllCheckbox)
    expect(selectAllCheckbox.checked).toEqual(true)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(true)
    expect(window.Shiny.onInputChange).toHaveBeenLastCalledWith('selected', [1, 2])
    expect(window.Shiny.onInputChange).toHaveBeenCalledTimes(2)

    // Table state changes (e.g., sorting) should not update selected rows
    fireEvent.click(getByText('col-a'))
    expect(window.Shiny.onInputChange).toHaveBeenCalledTimes(2)

    // Selected rows should not change when rows are filtered
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'aaa' } })
    expect(getDataRows(container)).toHaveLength(1)
    expect(window.Shiny.onInputChange).toHaveBeenCalledTimes(2)
  })

  it('works without Shiny', () => {
    delete window.Shiny
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }],
      selection: 'multiple',
      selectionId: 'selected'
    }
    const { container, getAllByLabelText, getByLabelText } = render(<Reactable {...props} />)
    expect(getSelectRowCheckboxes(container)).toHaveLength(3)
    const selectAllCheckbox = getByLabelText('Select all rows')
    const selectRowCheckboxes = getAllByLabelText('Select row')
    const selectRow1Checkbox = selectRowCheckboxes[0]
    const selectRow2Checkbox = selectRowCheckboxes[1]

    fireEvent.click(selectAllCheckbox)
    expect(selectAllCheckbox.checked).toEqual(true)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(true)
  })

  it('multiple selection cells are clickable', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }],
      selection: 'multiple'
    }
    const { container } = render(<Reactable {...props} />)
    const selectRowCheckboxes = getSelectRowCheckboxes(container)
    expect(selectRowCheckboxes).toHaveLength(3)
    const selectAllCheckbox = selectRowCheckboxes[0]
    const selectRow1Checkbox = selectRowCheckboxes[1]
    const selectRow2Checkbox = selectRowCheckboxes[2]

    const selectRowCells = getSelectRowCells(container)
    expect(selectRowCells).toHaveLength(3)
    const selectAllCell = selectRowCells[0]
    const selectRow1Cell = selectRowCells[1]
    const selectRow2Cell = selectRowCells[2]

    fireEvent.click(selectAllCell)
    expect(selectAllCheckbox.checked).toEqual(true)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(true)

    fireEvent.click(selectRow1Cell)
    expect(selectAllCheckbox.checked).toEqual(false)
    expect(selectRow1Checkbox.checked).toEqual(false)
    expect(selectRow2Checkbox.checked).toEqual(true)

    fireEvent.click(selectRow2Cell)
    expect(selectAllCheckbox.checked).toEqual(false)
    expect(selectRow1Checkbox.checked).toEqual(false)
    expect(selectRow2Checkbox.checked).toEqual(false)
  })

  it('multiple selection cells are clickable with sub rows', () => {
    const props = {
      data: { a: ['x', 'x', 'y', 'y'], b: [1, 1, 2, 41] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      selection: 'multiple',
      pivotBy: ['a'],
      defaultExpanded: true
    }
    const { container, getAllByLabelText } = render(<Reactable {...props} />)
    const selectAllCheckboxes = getAllByLabelText('Select all rows in group')
    expect(selectAllCheckboxes).toHaveLength(2)
    const selectRowCheckboxes = getAllByLabelText('Select row')
    const selectRow1Checkbox = selectRowCheckboxes[0]
    const selectRow2Checkbox = selectRowCheckboxes[1]

    const selectRowCells = getSelectRowCells(container)
    expect(selectRowCells).toHaveLength(7)
    const selectAllGroup1Cell = selectRowCells[1]

    fireEvent.click(selectAllGroup1Cell)
    expect(selectAllCheckboxes[0].checked).toEqual(true)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(true)

    fireEvent.click(selectAllGroup1Cell)
    expect(selectAllCheckboxes[0].checked).toEqual(false)
    expect(selectRow1Checkbox.checked).toEqual(false)
    expect(selectRow2Checkbox.checked).toEqual(false)
  })

  it('single selection cells are clickable', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }],
      selection: 'single'
    }
    const { container } = render(<Reactable {...props} />)
    const selectRowRadios = getSelectRowRadios(container)
    expect(selectRowRadios).toHaveLength(2)
    const selectRow1Radio = selectRowRadios[0]
    const selectRow2Radio = selectRowRadios[1]

    const selectRowCells = getSelectRowCells(container)
    expect(selectRowCells).toHaveLength(2)
    const selectRow1Cell = selectRowCells[0]
    const selectRow2Cell = selectRowCells[1]

    fireEvent.click(selectRow2Cell)
    expect(selectRow1Radio.checked).toEqual(false)
    expect(selectRow2Radio.checked).toEqual(true)

    fireEvent.click(selectRow1Cell)
    expect(selectRow1Radio.checked).toEqual(true)
    expect(selectRow2Radio.checked).toEqual(false)

    fireEvent.click(selectRow1Cell)
    expect(selectRow1Radio.checked).toEqual(false)
    expect(selectRow2Radio.checked).toEqual(false)
  })

  it('selects on row click', () => {
    const props = {
      data: { a: ['aaa1', 'aaa2'] },
      columns: [{ name: 'a', accessor: 'a' }],
      onClick: 'select',
      selection: 'single'
    }
    const { getAllByLabelText, getByText, rerender } = render(<Reactable {...props} />)
    const selectRowRadios = getAllByLabelText('Select row')
    expect(selectRowRadios).toHaveLength(2)
    const selectRow1Radio = selectRowRadios[0]
    const selectRow2Radio = selectRowRadios[1]

    fireEvent.click(getByText('aaa1'))
    expect(selectRow1Radio.checked).toEqual(true)
    expect(selectRow2Radio.checked).toEqual(false)

    fireEvent.click(getByText('aaa2'))
    expect(selectRow1Radio.checked).toEqual(false)
    expect(selectRow2Radio.checked).toEqual(true)

    // Should work fine with select inputs
    fireEvent.click(selectRow2Radio)
    expect(selectRow1Radio.checked).toEqual(false)
    expect(selectRow2Radio.checked).toEqual(false)

    rerender(<Reactable {...props} selection="multiple" />)
    fireEvent.click(getByText('aaa1'))
    fireEvent.click(getByText('aaa2'))
    expect(selectRow1Radio.checked).toEqual(true)
    expect(selectRow2Radio.checked).toEqual(true)
  })

  it('selects all sub rows on row click', () => {
    const props = {
      data: { a: ['aaa1', 'aaa2'], b: ['bbb1', 'bbb1'] },
      columns: [
        { name: 'a', accessor: 'a', aggregate: () => 'a-aggregated' },
        { name: 'b', accessor: 'b' }
      ],
      pivotBy: ['b'],
      selection: 'multiple',
      onClick: 'select'
    }
    const { getByLabelText, getAllByLabelText, getByText } = render(<Reactable {...props} />)
    // Clicking on expandable cell should not toggle selection
    fireEvent.click(getByText('bbb1 (2)'))
    const selectAllCheckbox = getByLabelText('Select all rows in group')
    const selectRowCheckboxes = getAllByLabelText('Select row')
    const selectRow1Checkbox = selectRowCheckboxes[0]
    const selectRow2Checkbox = selectRowCheckboxes[1]
    expect(selectAllCheckbox.checked).toEqual(false)
    expect(selectRow1Checkbox.checked).toEqual(false)
    expect(selectRow2Checkbox.checked).toEqual(false)

    fireEvent.click(getByText('a-aggregated'))
    expect(selectAllCheckbox.checked).toEqual(true)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(true)
  })

  it('does not select sub rows on row click for single selection', () => {
    const props = {
      data: { a: ['aaa1', 'aaa2'], b: ['bbb1', 'bbb1'] },
      columns: [
        { name: 'a', accessor: 'a', aggregate: () => 'a-aggregated' },
        { name: 'b', accessor: 'b' }
      ],
      pivotBy: ['b'],
      selection: 'single',
      onClick: 'select',
      defaultExpanded: true
    }
    const { getAllByLabelText, getByText } = render(<Reactable {...props} />)
    const selectRowCheckboxes = getAllByLabelText('Select row')
    const selectRow1Checkbox = selectRowCheckboxes[0]
    const selectRow2Checkbox = selectRowCheckboxes[1]
    expect(selectRow1Checkbox.checked).toEqual(false)
    expect(selectRow2Checkbox.checked).toEqual(false)

    fireEvent.click(getByText('a-aggregated'))
    expect(selectRow1Checkbox.checked).toEqual(false)
    expect(selectRow2Checkbox.checked).toEqual(false)
  })

  it('ignores pad rows on row click', () => {
    const props = {
      data: { a: ['aaa1', 'aaa2'] },
      columns: [{ name: 'a', accessor: 'a' }],
      selection: 'single',
      onClick: 'select',
      minRows: 5
    }
    const { container, getAllByLabelText } = render(<Reactable {...props} />)
    const padRows = getPadRows(container)
    fireEvent.click(getCells(padRows[0])[0])
    const selectRowRadios = getAllByLabelText('Select row')
    expect(selectRowRadios).toHaveLength(2)
    const selectRow1Radio = selectRowRadios[0]
    const selectRow2Radio = selectRowRadios[1]
    expect(selectRow1Radio.checked).toEqual(false)
    expect(selectRow2Radio.checked).toEqual(false)
  })

  it('selection cells can still be clicked with other click actions', () => {
    const props = {
      data: { a: ['aaa1', 'aaa2'] },
      columns: [{ name: 'a', accessor: 'a' }],
      onClick: () => {
        throw new Error('should not be called')
      },
      selection: 'multiple'
    }
    const { container } = render(<Reactable {...props} />)
    const selectRowCells = getSelectRowCells(container)
    expect(selectRowCells).toHaveLength(3)
    const selectRow1Cell = selectRowCells[1]
    const selectRow2Cell = selectRowCells[2]
    fireEvent.click(selectRow1Cell)
    fireEvent.click(selectRow2Cell)
    const selectRowCheckboxes = getSelectRowCheckboxes(container)
    expect(selectRowCheckboxes).toHaveLength(3)
    selectRowCheckboxes.forEach(checkbox => expect(checkbox.checked).toEqual(true))
  })

  it('selected state should be available in cellInfo, rowInfo, and state', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['a', 'b', 'c'] },
      columns: [
        {
          name: 'a',
          accessor: 'a',
          cell: (cellInfo, state) => {
            return `${cellInfo.value} selected? ${
              cellInfo.selected ? 'yes' : 'no'
            }. selected: ${JSON.stringify(state.selected)}`
          },
          details: (rowInfo, state) => {
            return `row ${rowInfo.index} selected? ${
              rowInfo.selected ? 'yes' : 'no'
            }. selected: ${JSON.stringify(state.selected)}`
          },
          className: 'col-a'
        },
        { name: 'b', accessor: 'b' }
      ],
      selection: 'multiple',
      rowClassName: (rowInfo, state) => {
        if (rowInfo.selected && state.selected.includes(rowInfo.index)) {
          return 'i-am-selected'
        }
      },
      rowStyle: (rowInfo, state) => {
        if (rowInfo.selected && state.selected.includes(rowInfo.index)) {
          return { backgroundColor: 'red' }
        }
      },
      defaultExpanded: true
    }
    const { container, getAllByLabelText, getByText } = render(<Reactable {...props} />)

    expect(getCellsText(container, '.col-a')).toEqual([
      '\u200b1 selected? no. selected: []',
      '\u200b2 selected? no. selected: []',
      '\u200b3 selected? no. selected: []'
    ])

    const selectRow1Checkbox = getAllByLabelText('Select row')[0]
    fireEvent.click(selectRow1Checkbox)

    expect(getCellsText(container, '.col-a')).toEqual([
      '\u200b1 selected? yes. selected: [0]',
      '\u200b2 selected? no. selected: [0]',
      '\u200b3 selected? no. selected: [0]'
    ])
    const rows = getRows(container)
    expect(rows[0]).toHaveClass('i-am-selected')
    expect(rows[1]).not.toHaveClass('i-am-selected')
    expect(rows[0]).toHaveStyle('background-color: red')
    expect(rows[1]).not.toHaveStyle('background-color: red')
    expect(getByText('row 0 selected? yes. selected: [0]')).toBeVisible()
    expect(getByText('row 1 selected? no. selected: [0]')).toBeVisible()
  })

  it('selection column can be customized', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [
        { name: 'a', accessor: 'a' },
        {
          name: '',
          accessor: '.selection',
          selectable: true,
          className: 'cell-cls',
          headerClassName: 'header-cls',
          style: { color: 'blue' },
          headerStyle: { color: 'orange' },
          width: 222
        }
      ],
      selection: 'multiple'
    }
    const { container } = render(<Reactable {...props} />)
    const selectRowCells = getSelectRowCells(container)
    expect(selectRowCells).toHaveLength(3)
    selectRowCells.forEach(cell => expect(cell).toHaveStyle('width: 222px'))
    const selectAllCell = selectRowCells[0]
    const selectRow1Cell = selectRowCells[1]
    const selectRow2Cell = selectRowCells[2]
    expect(selectAllCell).toHaveClass('header-cls')
    expect(selectRow1Cell).toHaveClass('cell-cls')
    expect(selectRow2Cell).toHaveClass('cell-cls')
    expect(selectAllCell).toHaveStyle('color: orange')
    expect(selectRow1Cell).toHaveStyle('color: blue')
    expect(selectRow2Cell).toHaveStyle('color: blue')

    // Selection columns should always be first
    const headers = getHeaders(container)
    expect([...headers].map(header => header.textContent)).toEqual(['\u200b', 'a'])
  })

  it('row selection columns should not be sortable, filterable, or searchable', () => {
    const props = {
      data: { a: [1, 2], '.selection': ['aaa', 'bbb'] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        {
          name: '',
          accessor: '.selection',
          selectable: true,
          filterable: true,
          searchable: true,
          sortable: true
        }
      ],
      selection: 'multiple',
      searchable: true
    }
    const { container } = render(<Reactable {...props} />)
    const sortableHeaders = getSortableHeaders(container)
    expect(sortableHeaders).toHaveLength(1)
    const filters = getFilters(container)
    expect(filters).toHaveLength(0)
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'aaa' } })
    expect(getDataRows(container)).toHaveLength(0)
  })

  it('row selection column works with column groups', () => {
    const props = {
      data: { a: [1, 2], b: [3, 4], c: ['a', 'b'] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        { name: 'col-b', accessor: 'b' },
        { name: 'col-c', accessor: 'c' },
        {
          name: '',
          accessor: '.selection',
          selectable: true
        }
      ],
      columnGroups: [
        { columns: ['b'], name: 'group-b' },
        { columns: ['a', '.selection'], name: 'group-sel' }
      ],
      selection: 'multiple'
    }
    const { container } = render(<Reactable {...props} />)
    const columnHeaders = getColumnHeaders(container)
    expect([...columnHeaders].map(header => header.textContent)).toEqual([
      '\u200b', // Selection column should still be first
      'col-a',
      'col-b',
      'col-c'
    ])
    const groupHeaders = getGroupHeaders(container)
    expect(groupHeaders).toHaveLength(2)
    expect(groupHeaders[0]).toHaveAttribute('aria-colspan', '2')
    expect(groupHeaders[1]).toHaveAttribute('aria-colspan', '1')
    expect([...groupHeaders].map(header => header.textContent)).toEqual(['group-sel', 'group-b'])
    expect(getUngroupedHeaders(container)).toHaveLength(1)
    expect(getSelectRowCells(container)).toHaveLength(3)
  })

  it('row selection column works with split column groups', () => {
    const props = {
      data: { a: [1, 2], b: [3, 4], c: ['a', 'b'] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        { name: 'col-b', accessor: 'b' },
        { name: 'col-c', accessor: 'c' },
        {
          name: '',
          accessor: '.selection',
          selectable: true
        }
      ],
      columnGroups: [
        { columns: ['a'], name: 'group-a' },
        { columns: ['b', '.selection'], name: 'group-sel' }
      ],
      selection: 'multiple'
    }
    const { container } = render(<Reactable {...props} />)
    const columnHeaders = getColumnHeaders(container)
    expect([...columnHeaders].map(header => header.textContent)).toEqual([
      '\u200b', // Selection column should still be first
      'col-a',
      'col-b',
      'col-c'
    ])
    const groupHeaders = getGroupHeaders(container)
    expect(groupHeaders).toHaveLength(3)
    expect(groupHeaders[0]).toHaveAttribute('aria-colspan', '1')
    expect(groupHeaders[1]).toHaveAttribute('aria-colspan', '1')
    expect(groupHeaders[2]).toHaveAttribute('aria-colspan', '1')
    expect([...groupHeaders].map(header => header.textContent)).toEqual([
      'group-sel',
      'group-a',
      'group-sel'
    ])
    expect(getUngroupedHeaders(container)).toHaveLength(1)
    expect(getSelectRowCells(container)).toHaveLength(3)
  })
})

describe('expandable row details', () => {
  it('renders row details', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: '', accessor: '.details', details: rowInfo => `row details: ${rowInfo.index}` },
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    let rowGroups = getRowGroups(container)
    rowGroups.forEach(rowGroup => expect(rowGroup.children).toHaveLength(1))
    let rowDetails = getRowDetails(container)
    expect(rowDetails).toHaveLength(0)

    const expanders = getExpanders(container)
    expect(expanders).toHaveLength(2)
    expanders.forEach(expander => {
      expect(expander).toHaveAttribute('aria-label', 'Toggle details')
      expect(expander).toHaveAttribute('aria-expanded', 'false')
    })
    const expanderIcons = getExpanderIcons(container)
    expanderIcons.forEach(icon => expect(icon).not.toHaveClass('rt-expander-open'))
    const expandableCells = getExpandableCells(container)
    expect(expandableCells).toHaveLength(2)

    fireEvent.click(expanders[0])
    expect(expanderIcons[0]).toHaveClass('rt-expander-open')
    rowDetails = getRowDetails(container)
    expect(rowDetails).toHaveLength(1)
    expect(rowDetails[0].textContent).toEqual('row details: 0')
    // Row details should be in row groups
    rowGroups = getRowGroups(container)
    expect(rowGroups[0].children[1]).toEqual(rowDetails[0])

    fireEvent.click(expanders[1])
    rowDetails = getRowDetails(container)
    expect(rowDetails).toHaveLength(2)
    expect(rowDetails[1].textContent).toEqual('row details: 1')
    rowGroups = getRowGroups(container)
    expect(rowGroups[1].children[1]).toEqual(rowDetails[1])

    expanders.forEach(expander => {
      expect(expander).toHaveAttribute('aria-label', 'Toggle details')
      expect(expander).toHaveAttribute('aria-expanded', 'true')
    })
    expanderIcons.forEach(icon => expect(icon).toHaveClass('rt-expander-open'))

    // Row details should collapse
    fireEvent.click(expanders[0])
    expect(expanders[0]).toHaveAttribute('aria-label', 'Toggle details')
    expect(expanders[0]).toHaveAttribute('aria-expanded', 'false')
    expect(expanderIcons[0]).not.toHaveClass('rt-expander-open')
    expect(getRowDetails(container)).toHaveLength(1)

    // Expandable cells should be clickable
    fireEvent.click(expandableCells[0])
    expect(getRowDetails(container)).toHaveLength(2)
    fireEvent.click(expandableCells[0])
    expect(getRowDetails(container)).toHaveLength(1)
  })

  it('row details render function (JS)', () => {
    const assertProps = (rowInfo, state) => {
      expect(rowInfo.index >= 0).toEqual(true)
      expect(rowInfo.viewIndex >= 0).toEqual(true)
      expect(rowInfo.level).toEqual(0)
      expect(rowInfo.aggregated).toBeFalsy()
      expect(rowInfo.expanded).toEqual(true)
      expect(rowInfo.selected).toEqual(false)
      expect(rowInfo.subRows).toEqual([])
      expect(rowInfo.values).toEqual(
        [
          { a: 1, b: 'a' },
          { a: 2, b: 'b' }
        ][rowInfo.index]
      )
      expect(rowInfo.row).toEqual(
        [
          { a: 1, b: 'a' },
          { a: 2, b: 'b' }
        ][rowInfo.index]
      )
      expect(state.page).toEqual(0)
      expect(state.pageSize).toEqual(10)
      expect(state.pages).toEqual(1)
      expect(state.sorted).toEqual([])
      expect(state.groupBy).toEqual([])
      expect(state.filters).toEqual([])
      expect(state.searchValue).toEqual(undefined)
      expect(state.selected).toEqual([])
      expect(state.pageRows).toEqual([
        { a: 1, b: 'a' },
        { a: 2, b: 'b' }
      ])
      expect(state.sortedData).toEqual([
        { a: 1, b: 'a' },
        { a: 2, b: 'b' }
      ])
      expect(state.data).toEqual([
        { a: 1, b: 'a' },
        { a: 2, b: 'b' }
      ])
    }
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        {
          name: 'b',
          accessor: 'b',
          details: (rowInfo, state) => {
            assertProps(rowInfo, state)
            return `row details: ${rowInfo.values.a}`
          }
        }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const expanders = getExpanders(container)
    fireEvent.click(expanders[0])
    fireEvent.click(expanders[1])
    const rowDetails = getRowDetails(container)
    expect(rowDetails[0].textContent).toEqual('row details: 1')
    expect(rowDetails[1].textContent).toEqual('row details: 2')
  })

  it('row details render function (JS) as html', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        {
          name: 'b',
          accessor: 'b',
          html: true,
          details: rowInfo => `<span>row details: ${rowInfo.values.a}</span>`
        }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const expanders = getExpanders(container)
    fireEvent.click(expanders[0])
    fireEvent.click(expanders[1])
    const rowDetails = getRowDetails(container)
    expect(rowDetails).toHaveLength(2)
    expect(rowDetails[0].innerHTML).toEqual('<span>row details: 1</span>')
    expect(rowDetails[1].innerHTML).toEqual('<span>row details: 2</span>')
  })

  it('row details render function (R)', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        {
          name: 'b',
          accessor: 'b',
          html: true,
          details: ['<span>row details: 1</span>', '<span>row details: 2</span>']
        }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const expanders = getExpanders(container)
    fireEvent.click(expanders[0])
    fireEvent.click(expanders[1])
    const rowDetails = getRowDetails(container)
    expect(rowDetails).toHaveLength(2)
    expect(rowDetails[0].innerHTML).toEqual('<span>row details: 1</span>')
    expect(rowDetails[1].innerHTML).toEqual('<span>row details: 2</span>')
  })

  it('renders conditional row details', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b', details: ['row details: 1', null] }
      ]
    }
    const { container, getByText, queryByText } = render(<Reactable {...props} />)
    const expanders = getExpanders(container)
    expect(expanders).toHaveLength(1)

    expect(queryByText('row details: 1')).toEqual(null)
    fireEvent.click(expanders[0])
    expect(getByText('row details: 1')).toBeVisible()
  })

  it('renders empty row details', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b', details: ['', ''] }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const expanders = getExpanders(container)
    expect(expanders).toHaveLength(2)
    fireEvent.click(expanders[0])
    fireEvent.click(expanders[1])
  })

  it('renders multiple row details', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a', details: ['detail-a1', 'detail-a2'] },
        { name: 'b', accessor: 'b', details: ['detail-b1', 'detail-b2'] }
      ]
    }
    const { container, getByText, queryByText } = render(<Reactable {...props} />)
    const expanders = getExpanders(container)
    expect(expanders).toHaveLength(4)

    fireEvent.click(expanders[0])
    expect(getByText('detail-a1')).toBeVisible()
    expect(queryByText('detail-b1')).toEqual(null)

    // Row 1, col b
    fireEvent.click(expanders[1])
    expect(getByText('detail-b1')).toBeVisible()
    expect(queryByText('detail-a1')).toEqual(null)

    // Row 2, col a
    fireEvent.click(expanders[2])
    expect(getByText('detail-a2')).toBeVisible()
    expect(queryByText('detail-b2')).toEqual(null)

    // Row 2, col b
    fireEvent.click(expanders[3])
    expect(getByText('detail-b2')).toBeVisible()
    expect(queryByText('detail-a2')).toEqual(null)
  })

  it('expander-only columns have expected classes and styles', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], c: ['c', 'd'] },
      columns: [
        {
          name: '',
          accessor: '.details',
          className: 'expander-no-content',
          style: { color: 'blue' },
          details: ['detail-1', null]
        },
        {
          name: '',
          accessor: '.details2',
          className: 'expander-with-content',
          cell: () => 'content',
          details: ['detail-2', null]
        },
        { name: 'c', accessor: 'c' }
      ]
    }
    const { container, getByText } = render(<Reactable {...props} />)
    expect(getExpanders(container)).toHaveLength(2)

    let expanderCells = container.querySelectorAll('.expander-no-content')
    expect(expanderCells).toHaveLength(2)
    fireEvent.click(expanderCells[0])
    expect(getByText('detail-1')).toBeVisible()
    // Expander-only cells without content should have special styles
    expect(expanderCells[0]).toHaveStyle('text-overflow: clip; user-select: none; color: blue')
    expect(expanderCells[1]).not.toHaveStyle('text-overflow: clip; user-select: none')

    // Expander-only cells with content should not have special styles
    expanderCells = container.querySelectorAll('.expander-with-content')
    expect(expanderCells).toHaveLength(2)
    expect(expanderCells[0]).not.toHaveStyle('text-overflow: clip; user-select: none')
  })

  it('does not render row details for pad rows', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        {
          name: 'b',
          accessor: 'b',
          details: rowInfo => `row details: ${rowInfo.values.a}`
        }
      ],
      minRows: 6
    }
    const { container } = render(<Reactable {...props} />)
    const expanders = getExpanders(container)
    expect(expanders).toHaveLength(2)
    fireEvent.click(expanders[0])
    fireEvent.click(expanders[1])
    const rowDetails = getRowDetails(container)
    expect(rowDetails).toHaveLength(2)
    expect(rowDetails[0].textContent).toEqual('row details: 1')
    expect(rowDetails[1].textContent).toEqual('row details: 2')
  })

  it('row expanded state persists across sorting, filtering, and pagination changes', () => {
    const props = {
      data: { a: ['cell-1', 'cell-2'], b: ['b', 'a'] },
      columns: [
        {
          name: 'col-a',
          accessor: 'a',
          filterable: true,
          details: ['row-details-1', 'row-details-2']
        },
        { name: 'col-b', accessor: 'b' }
      ],
      defaultPageSize: 1
    }
    const { container, getByText, queryByText } = render(<Reactable {...props} />)
    let expanders = getExpanders(container)
    expect(expanders).toHaveLength(1)

    // Pagination
    fireEvent.click(expanders[0])
    expect(getByText('row-details-1')).toBeVisible()
    fireEvent.click(getNextButton(container))
    expect(queryByText('row-details-1')).toEqual(null)
    expect(queryByText('row-details-2')).toEqual(null)
    fireEvent.click(getPrevButton(container))
    expect(getByText('row-details-1')).toBeVisible()
    fireEvent.click(expanders[0])
    expect(queryByText('row-details-1')).toEqual(null)

    // Sorting
    fireEvent.click(expanders[0])
    expect(getByText('row-details-1')).toBeVisible()
    fireEvent.click(getByText('col-b'))
    expect(queryByText('row-details-1')).toEqual(null)
    expect(queryByText('row-details-2')).toEqual(null)
    fireEvent.click(getByText('col-b'))
    expect(getByText('row-details-1')).toBeVisible()
    fireEvent.click(expanders[0])
    expect(queryByText('row-details-1')).toEqual(null)

    // Filtering
    fireEvent.click(expanders[0])
    expect(getByText('row-details-1')).toBeVisible()
    const filter = getFilters(container)[0]
    fireEvent.change(filter, { target: { value: 'cell-1' } })
    expect(getByText('row-details-1')).toBeVisible()
    fireEvent.change(filter, { target: { value: 'cell-2' } })
    expect(queryByText('row-details-1')).toEqual(null)
    expect(queryByText('row-details-2')).toEqual(null)
    fireEvent.change(filter, { target: { value: '' } })
    expect(getByText('row-details-1')).toBeVisible()
    fireEvent.click(expanders[0])
    expect(queryByText('row-details-1')).toEqual(null)
  })

  it('row expanded state persists when data changes', () => {
    // This really tests that expanded state persists when data changes via groupBy.
    // Expanded state should be reset when the actual data changes through dataKey
    // or updateReactable.
    const props = {
      data: { a: [1, 2, 3], b: ['x', 'x', 'z'] },
      columns: [
        {
          name: 'a',
          accessor: 'a',
          details: rowInfo => `row details: ${rowInfo.index}-${rowInfo.values.a}-a`
        },
        { name: 'b', accessor: 'b' }
      ]
    }
    const { container, getByText, rerender } = render(<Reactable {...props} />)
    const expanders = getExpanders(container)
    expect(expanders).toHaveLength(3)
    fireEvent.click(expanders[0])
    fireEvent.click(expanders[1])
    expect(getRowDetails(container)).toHaveLength(2)
    expect(getByText('row details: 0-1-a')).toBeVisible()
    rerender(<Reactable {...props} data={{ a: [22, 44, 66], b: ['x', 'y', 'z'] }} />)
    expect(getRowDetails(container)).toHaveLength(2)
    expect(getByText('row details: 0-22-a')).toBeVisible()
  })

  it('handles Shiny elements in row details content', () => {
    window.Shiny = { bindAll: jest.fn(), unbindAll: jest.fn(), addCustomMessageHandler: jest.fn() }
    const props = {
      data: { a: [1, 2, 3], b: ['a', 'b', 'c'] },
      columns: [
        { name: 'a', accessor: 'a', details: ['details-a-1', null, 'details-a-3'] },
        { name: 'b', accessor: 'b', details: ['details-b-1', null, 'details-b-3'] }
      ],
      defaultPageSize: 2
    }
    const { container, getByText } = render(<Reactable {...props} />)
    const expanders = getExpanders(container)
    expect(expanders).toHaveLength(2)
    fireEvent.click(expanders[0])
    expect(window.Shiny.bindAll).toHaveBeenCalledTimes(1)
    expect(window.Shiny.unbindAll).toHaveBeenCalledTimes(0)
    fireEvent.click(expanders[0])
    expect(window.Shiny.bindAll).toHaveBeenCalledTimes(1)
    expect(window.Shiny.unbindAll).toHaveBeenCalledTimes(1)

    // Content should update properly when expanding another column while one
    // column is already expanded.
    fireEvent.click(expanders[0])
    expect(window.Shiny.bindAll).toHaveBeenCalledTimes(2)
    expect(window.Shiny.unbindAll).toHaveBeenCalledTimes(1)
    fireEvent.click(expanders[1])
    expect(window.Shiny.bindAll).toHaveBeenCalledTimes(3)
    expect(window.Shiny.unbindAll).toHaveBeenCalledTimes(2)
    fireEvent.click(expanders[0])
    expect(window.Shiny.bindAll).toHaveBeenCalledTimes(4)
    expect(window.Shiny.unbindAll).toHaveBeenCalledTimes(3)

    // Row details content should be cleaned up properly when changing page
    expect(getByText('details-a-1')).toBeVisible()
    fireEvent.click(getNextButton(container))
    expect(window.Shiny.unbindAll).toHaveBeenCalledTimes(4)

    // Content should update properly when changing page
    fireEvent.click(getExpanders(container)[0])
    expect(getByText('details-a-3')).toBeVisible()
    expect(window.Shiny.bindAll).toHaveBeenCalledTimes(5)
    expect(window.Shiny.unbindAll).toHaveBeenCalledTimes(4)
    fireEvent.click(getPrevButton(container))
    expect(getByText('details-a-1')).toBeVisible()
    expect(window.Shiny.bindAll).toHaveBeenCalledTimes(6)
    expect(window.Shiny.unbindAll).toHaveBeenCalledTimes(5)

    delete window.Shiny
  })

  it('row details work with column groups', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'col-a', accessor: 'a', details: ['row-details-1', 'row-details-2'] },
        { name: 'col-b', accessor: 'b' }
      ],
      columnGroups: [{ columns: ['a', 'b'] }]
    }
    const { container, getByText } = render(<Reactable {...props} />)
    let expanders = getExpanders(container)
    expect(expanders).toHaveLength(2)
    fireEvent.click(expanders[0])
    expect(getByText('row-details-1')).toBeVisible()
    fireEvent.click(expanders[1])
    expect(getByText('row-details-2')).toBeVisible()
  })

  it('row details do not use manual expanded key', () => {
    // react-table uses an 'expanded' column to control expanded state by default
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], expanded: [true, true] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b', details: () => 'details' },
        { name: 'expanded', accessor: 'expanded' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const rowDetails = getRowDetails(container)
    expect(rowDetails).toHaveLength(0)
  })

  it('row details work with grouping', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], c: ['x', 'y'] },
      columns: [
        { name: 'col-a', accessor: 'a', details: ['r-row-details', 'r-row-details'] },
        { name: 'col-b', accessor: 'b', details: () => 'js-row-details' },
        { name: 'col-c', accessor: 'c' }
      ],
      pivotBy: ['c']
    }
    const { container, getByText, queryByText } = render(<Reactable {...props} />)
    let expanders = getExpanders(container)
    expect(expanders).toHaveLength(2)
    expect(getRows(container)).toHaveLength(2)

    // Expand grouped cell
    fireEvent.click(expanders[0])
    expect(getRows(container)).toHaveLength(3)
    // Row details should not be shown for grouped rows (not supported currently)
    expect(queryByText('r-row-details')).toEqual(null)
    expect(queryByText('js-row-details')).toEqual(null)

    // Expand details
    expanders = getExpanders(container)
    expect(expanders).toHaveLength(4)
    fireEvent.click(expanders[1]) // Expand col-a
    expect(getByText('r-row-details')).toBeVisible()
    fireEvent.click(expanders[2]) // Expand col-b
    expect(getByText('js-row-details')).toBeVisible()

    // Aggregated cells in columns with JS row details should not be clickable
    const cells = getCells(container)
    const aggregatedCell = cells[2]
    expect(aggregatedCell.textContent).toEqual('')
    fireEvent.click(aggregatedCell)
    expect(getByText('js-row-details')).toBeVisible()

    // Placeholder cells under grouped cells should not be clickable
    const groupedChildCell = cells[3]
    expect(groupedChildCell.textContent).toEqual('')
    fireEvent.click(groupedChildCell)
    expect(getByText('js-row-details')).toBeVisible()
  })

  it('expanders have aria labels', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'col-a', accessor: 'a', details: rowInfo => `row details: ${rowInfo.values.a}` },
        { name: 'col-b', accessor: 'b' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const expanders = getExpanders(container)
    expect(expanders).toHaveLength(2)
    expect(expanders[0]).toHaveAttribute('aria-label', 'Toggle details')
    expect(expanders[0]).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(expanders[0])
    expect(expanders[0]).toHaveAttribute('aria-expanded', 'true')
  })

  it('defaultExpanded works with row details', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['cell-b-0', 'cell-b-1', 'cell-b-2'], c: [3, 4, 5] },
      columns: [
        { name: 'a', accessor: 'a', details: [null, 'details: 1-a', 'details: 2-a'] },
        { name: 'b', accessor: 'b', details: rowInfo => `details: ${rowInfo.index}-b` },
        { name: 'c', accessor: 'c', details: rowInfo => `details: ${rowInfo.index}-c` }
      ],
      defaultExpanded: true
    }
    const { container, getByText, queryByText, rerender } = render(<Reactable {...props} />)
    expect(getByText('details: 1-a')).toBeVisible()
    expect(getByText('details: 2-a')).toBeVisible()

    // defaultExpanded should work with conditional row details
    expect(getRowDetails(container)).toHaveLength(2)

    // Only the first column should be expanded when there are multiple row details
    expect(queryByText('details: 0-b')).toEqual(null)
    expect(queryByText('details: 1-c')).toEqual(null)

    // Should update when prop changes
    rerender(<Reactable {...props} defaultExpanded={undefined} />)
    expect(queryByText('details:')).toEqual(null)
    expect(getRowDetails(container)).toHaveLength(0)
    rerender(<Reactable {...props} defaultExpanded={true} />)
    expect(getByText('details: 1-a')).toBeVisible()
    expect(getByText('details: 2-a')).toBeVisible()
    rerender(<Reactable {...props} defaultExpanded={false} />)
    expect(getRowDetails(container)).toHaveLength(0)
  })

  it('defaultExpanded works with column groups', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'col-a', accessor: 'a', details: ['row-details-1', 'row-details-2'] },
        { name: 'col-b', accessor: 'b' }
      ],
      columnGroups: [{ columns: ['a', 'b'] }],
      defaultExpanded: true
    }
    const { getByText } = render(<Reactable {...props} />)
    expect(getByText('row-details-1')).toBeVisible()
    expect(getByText('row-details-2')).toBeVisible()
  })

  it('defaultExpanded expands the first details column when there are multiple', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'col-a', accessor: 'a', details: ['details-a-1', 'details-a-2'] },
        { name: 'col-b', accessor: 'b', details: ['details-b-1', 'details-b-2'] }
      ],
      columnGroups: [{ columns: ['a', 'b'] }],
      defaultExpanded: true
    }
    const { container, getByText, queryByText } = render(<Reactable {...props} />)
    expect(getByText('details-a-1')).toBeVisible()
    expect(getByText('details-a-2')).toBeVisible()
    expect(queryByText('details-b-1')).toBeFalsy()
    expect(queryByText('details-b-2')).toBeFalsy()
    expect(getRowDetails(container)).toHaveLength(2)
  })

  it('defaultExpanded does not error when there are no expandable rows', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        { name: 'col-b', accessor: 'b' }
      ],
      defaultExpanded: true
    }
    const { container } = render(<Reactable {...props} />)
    expect(getRowDetails(container)).toHaveLength(0)
  })

  it('styles do not bleed through to nested tables', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [
        {
          name: 'a',
          accessor: 'a',
          details: [
            null,
            <Reactable
              key="nested"
              data={{ a: [1, 2, 3] }}
              columns={[{ name: 'a', accessor: 'a' }]}
              rowClassName="nested-row"
              className="nested"
            />
          ]
        }
      ],
      striped: true,
      highlight: true,
      defaultExpanded: true
    }
    const { container } = render(<Reactable {...props} />)
    const rows = container.querySelectorAll('.nested-row')
    expect(rows).toHaveLength(3)
    rows.forEach(row => expect(row).not.toHaveClass('rt-tr-striped'))
    rows.forEach(row => expect(row).not.toHaveClass('rt-tr-highlight'))
    const headerRows = getHeaderRows(container.querySelector('.nested'))
    expect(headerRows).toHaveLength(1)
    expect(headerRows[0]).not.toHaveClass('rt-tr-striped')
    expect(headerRows[0]).not.toHaveClass('rt-tr-highlight')
  })

  it('expanders language', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a', details: rowInfo => `row details: ${rowInfo.values.a}` }
      ],
      language: {
        detailsExpandLabel: '_Toggle details'
      }
    }
    const { container } = render(<Reactable {...props} />)
    const expanders = getExpanders(container)
    expect(expanders[0]).toHaveAttribute('aria-label', '_Toggle details')
    fireEvent.click(expanders[0])
    expect(expanders[0]).toHaveAttribute('aria-label', '_Toggle details')
  })
})

describe('grouping and aggregation', () => {
  it('renders grouped rows', () => {
    const props = {
      data: { a: [1, 2, 1], b: ['a', 'b', 'c'], c: ['x', 'y', 'z'] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        { name: 'col-b', accessor: 'b' },
        { name: 'col-c', accessor: 'c' }
      ],
      pivotBy: ['a']
    }
    const { container } = render(<Reactable {...props} />)
    const expanders = getExpanders(container)
    expect(expanders).toHaveLength(2)
    expect(getRows(container)).toHaveLength(2)
    expect(expanders[0]).toHaveAttribute('aria-label', 'Toggle group')
    expect(expanders[1]).toHaveAttribute('aria-label', 'Toggle group')
    expect(expanders[0]).toHaveAttribute('aria-expanded', 'false')
    expect(expanders[1]).toHaveAttribute('aria-expanded', 'false')

    const expandableCells = getExpandableCells(container)
    expect(expandableCells).toHaveLength(2)
    expect(expandableCells[0].textContent).toEqual('\u200b1 (2)')
    expect(expandableCells[1].textContent).toEqual('\u200b2 (1)')

    // Expand grouped cell
    fireEvent.click(expanders[0])
    expect(getRows(container)).toHaveLength(4)
    fireEvent.click(getExpanders(container)[1])
    expect(getRows(container)).toHaveLength(5)
    expect(expanders[0]).toHaveAttribute('aria-label', 'Toggle group')
    expect(expanders[0]).toHaveAttribute('aria-expanded', 'true')
    expect(getExpanders(container)[1]).toHaveAttribute('aria-label', 'Toggle group')
    expect(getExpanders(container)[1]).toHaveAttribute('aria-expanded', 'true')

    // Expandable cells should be clickable
    fireEvent.click(expandableCells[0])
    expect(getRows(container)).toHaveLength(3)
    fireEvent.click(expandableCells[0])
    expect(getRows(container)).toHaveLength(5)

    expect(getCellsText(container)).toEqual([
      '\u200b1 (2)',
      '',
      '',
      '',
      'a',
      'x',
      '',
      'c',
      'z',
      '\u200b2 (1)',
      '',
      '',
      '',
      'b',
      'y'
    ])
  })

  it('renders grouped rows with multiple groupBy', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['a', 'b', 'c'], c: ['x', 'x', 'z'] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        { name: 'col-b', accessor: 'b' },
        { name: 'col-c', accessor: 'c' }
      ],
      pivotBy: ['c', 'a']
    }
    const { container, getByText } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(2)
    expect(getExpanders(container)).toHaveLength(2)
    expect(getExpandableCells(container)).toHaveLength(4)
    const headers = getHeaders(container)
    expect([...headers].map(header => header.textContent)).toEqual(['col-c', 'col-a', 'col-b'])

    fireEvent.click(getByText('x (2)'))
    fireEvent.click(getByText('z (1)'))
    expect(getRows(container)).toHaveLength(5)
    expect(getExpanders(container)).toHaveLength(5)
    expect(getExpandableCells(container)).toHaveLength(10)

    fireEvent.click(getExpanders(container)[1]) // 1 (1)
    fireEvent.click(getExpanders(container)[2]) // 2 (1)
    fireEvent.click(getExpanders(container)[4]) // 3 (1)
    expect(getRows(container)).toHaveLength(8)

    expect(getCellsText(container)).toEqual([
      '\u200bx (2)', // 1
      '',
      '',
      '', // 2
      '\u200b1 (1)',
      '',
      '', // 3
      '',
      'a',
      '', // 4
      '\u200b2 (1)',
      '',
      '', // 5
      '',
      'b',
      '\u200bz (1)', // 6
      '',
      '',
      '', // 7
      '\u200b3 (1)',
      '',
      '', // 8
      '',
      'c'
    ])
  })

  it('grouped cells use JS cell render functions', () => {
    const props = {
      data: { a: [1, 2, 1], b: ['a', 'b', 'c'], c: ['x', 'y', 'z'] },
      columns: [
        {
          name: 'col-a',
          accessor: 'a',
          className: 'col-grouped',
          cell: (cellInfo, state) => {
            return (
              `${cellInfo.value}: aggregated=${cellInfo.aggregated}, ` +
              `isGrouped=${cellInfo.isGrouped}, row=${cellInfo.index}, ` +
              `page=${state.page}`
            )
          }
        },
        { name: 'col-b', accessor: 'b' },
        { name: 'col-c', accessor: 'c' }
      ],
      pivotBy: ['a']
    }
    const { container } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(2)
    expect(getCellsText(container, '.col-grouped')).toEqual([
      // cellInfo.aggregated should be the same as row.aggregated,
      // NOT cell.isAggregated, which is false for grouped columns.
      '\u200b1: aggregated=true, isGrouped=true, row=0, page=0 (2)',
      '\u200b2: aggregated=true, isGrouped=true, row=1, page=0 (1)'
    ])
  })

  it('grouped cells do not use R cell render functions', () => {
    // Grouped cells could support R cell render functions, but they currently
    // do not because the row index of a grouped cell does not correspond to
    // any specific row in the data.
    const props = {
      data: { a: [1, 2, 1], b: ['a', 'b', 'c'] },
      columns: [
        {
          name: 'col-a',
          accessor: 'a',
          className: 'col-grouped',
          cell: ['not-shown', 'not-shown', 'not-shown']
        },
        { name: 'col-b', accessor: 'b' }
      ],
      pivotBy: ['a']
    }
    const { container } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(2)
    expect(getCellsText(container, '.col-grouped')).toEqual(['\u200b1 (2)', '\u200b2 (1)'])
  })

  it('grouped cell render function', () => {
    const props = {
      data: { a: ['a', '', null], b: [1, 2, 3] },
      columns: [
        {
          name: 'col-a',
          accessor: 'a',
          na: 'missing',
          cell: () => 'overridden',
          grouped: (cellInfo, state) => {
            const rows = [
              { a: 'a', b: null, _subRows: [{ a: 'a', b: 1 }] },
              { a: '', b: null, _subRows: [{ a: '', b: 2 }] },
              { a: null, b: null, _subRows: [{ a: null, b: 3 }] }
            ]
            expect(cellInfo.column.id).toEqual('a')
            expect(cellInfo.column.name).toEqual('col-a')
            expect(cellInfo.index >= 0).toEqual(true)
            expect(cellInfo.viewIndex >= 0).toEqual(true)
            expect(cellInfo.page).toEqual(0)
            expect(cellInfo.value).toEqual(['a', '', 'missing'][cellInfo.index])
            expect(cellInfo.aggregated).toEqual(true)
            expect(cellInfo.filterValue).toEqual(undefined)
            expect(cellInfo.level).toEqual(0)
            expect(cellInfo.expanded).toBeFalsy()
            expect(cellInfo.selected).toEqual(false)
            expect(cellInfo.row).toEqual(
              [
                { a: 'a', b: null },
                { a: '', b: null },
                { a: null, b: null }
              ][cellInfo.index]
            )
            expect(cellInfo.subRows).toEqual(rows[cellInfo.index]._subRows)
            expect(state.page).toEqual(0)
            expect(state.pageSize).toEqual(10)
            expect(state.pages).toEqual(1)
            expect(state.sorted).toEqual([])
            expect(state.groupBy).toEqual(['a'])
            expect(state.filters).toEqual([])
            expect(state.searchValue).toEqual(undefined)
            expect(state.selected).toEqual([])
            expect(state.pageRows).toEqual(rows)
            expect(state.sortedData).toEqual(rows)
            expect(state.data).toEqual([
              { a: 'a', b: 1 },
              { a: '', b: 2 },
              { a: null, b: 3 }
            ])
            return cellInfo.value
          },
          className: 'col-a'
        },
        { name: 'col-b', accessor: 'b' }
      ],
      pivotBy: ['a']
    }
    const { container } = render(<Reactable {...props} />)
    expect(getCellsText(container, '.col-a')).toEqual(['\u200ba', '\u200b\u200b', '\u200bmissing'])
  })

  it('aggregates values', () => {
    let aggregateCount = 0
    const props = {
      data: { a: [1, 2, 1], b: ['a', 'b', 'c'], c: ['x', 'x', 'z'] },
      columns: [
        { name: 'col-a', accessor: 'a', type: 'numeric', aggregate: 'sum' },
        {
          name: 'col-b',
          accessor: 'b',
          aggregate: (values, rows, aggregatedRows) => {
            if (aggregateCount === 0) {
              expect(values).toEqual(['a', 'b'])
              expect(rows).toEqual([
                { a: 1, b: 'a', c: 'x' },
                { a: 2, b: 'b', c: 'x' }
              ])
              expect(aggregatedRows).toEqual([
                { a: 1, b: 'a', c: 'x' },
                { a: 2, b: 'b', c: 'x' }
              ])
            } else {
              expect(values).toEqual(['c'])
              expect(rows).toEqual([{ a: 1, b: 'c', c: 'z' }])
              expect(aggregatedRows).toEqual([{ a: 1, b: 'c', c: 'z' }])
            }
            aggregateCount++
            return values.join(', ')
          }
        },
        { name: 'col-c', accessor: 'c' }
      ],
      pivotBy: ['c']
    }
    const { container } = render(<Reactable {...props} />)
    expect(aggregateCount).toEqual(2)
    expect(getCellsText(container)).toEqual(['\u200bx (2)', '3', 'a, b', '\u200bz (1)', '1', 'c'])
  })

  it('aggregates values with multiple groupBy columns', () => {
    let aggregateCount = 0
    const props = {
      data: { a: ['a', 'a', 'b'], b: [1, 2, 3], c: ['x', 'x', 'x'] },
      columns: [
        {
          name: 'col-a',
          accessor: 'a',
          // Aggregate functions should work for columns in groupBy, as long as
          // they aren't the first groupBy column.
          aggregate: values => {
            return values.join(', ')
          }
        },
        {
          name: 'col-b',
          accessor: 'b',
          aggregate: (values, rows, aggregatedRows) => {
            if (aggregateCount === 0) {
              // Sub-group a (2)
              expect(values).toEqual([1, 2])
              expect(rows).toEqual([
                { a: 'a', b: 1, c: 'x' },
                { a: 'a', b: 2, c: 'x' }
              ])
              expect(aggregatedRows).toEqual([
                { a: 'a', b: 1, c: 'x' },
                { a: 'a', b: 2, c: 'x' }
              ])
            } else if (aggregateCount === 1) {
              // Sub-group b (1)
              expect(values).toEqual([3])
              expect(rows).toEqual([{ a: 'b', b: 3, c: 'x' }])
              expect(aggregatedRows).toEqual([{ a: 'b', b: 3, c: 'x' }])
            } else {
              // Group x (2): should have all leaf rows
              expect(values).toEqual([1, 2, 3])
              expect(rows).toEqual([
                { a: 'a', b: 1, c: 'x' },
                { a: 'a', b: 2, c: 'x' },
                { a: 'b', b: 3, c: 'x' }
              ])
              expect(aggregatedRows).toEqual([
                { a: 'a', b: 3, c: 'x' },
                { a: 'b', b: 3, c: 'x' }
              ])
            }
            aggregateCount++
            return values.reduce((a, b) => a + b, 0)
          }
        },
        {
          name: 'col-c',
          accessor: 'c',
          // Aggregate function should not be called for non-aggregated groupBy columns
          // (the first groupBy column).
          aggregate: () => {
            throw new Error('should not be called')
          }
        }
      ],
      pivotBy: ['c', 'a']
    }
    const { container } = render(<Reactable {...props} />)
    expect(aggregateCount).toEqual(3)
    fireEvent.click(getExpanders(container)[0])
    expect(getCellsText(container)).toEqual([
      '\u200bx (2)',
      'a, a, b',
      '6',
      '',
      '\u200ba (2)',
      '3',
      '',
      '\u200bb (1)',
      '3'
    ])
  })

  it('aggregated values update when filtering', () => {
    const props = {
      data: { a: ['a', 'a', 'b'], b: [1, 2, 3], c: ['x', 'x', 'x'] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        {
          name: 'col-b',
          accessor: 'b',
          aggregate: (values, rows, aggregatedRows) => {
            return `${values} ${rows.map(row => row.b)} ${aggregatedRows.map(row => row.b)}`
          }
        },
        { name: 'col-c', accessor: 'c' }
      ],
      pivotBy: ['c'],
      searchable: true
    }
    const { container } = render(<Reactable {...props} />)
    fireEvent.change(getSearchInput(container), { target: { value: 'a' } })
    expect(getCellsText(container)).toEqual(['\u200bx (2)', '', '1,2 1,2 1,2'])
  })

  it('renders aggregated cells', () => {
    const props = {
      data: {
        groupA: ['a', 'a'],
        groupB: [3, 4],
        a: [1, 2],
        b: ['x', 'x'],
        c: [1, 2],
        d: ['g', 'h'],
        e: [1, 2],
        f: [1, 2]
      },
      columns: [
        { name: 'col-groupA', accessor: 'groupA' },
        {
          // Aggregated cell renderers should work for aggregated cells in groupBy
          // columns, as long as they aren't the first groupBy column.
          name: 'col-groupB',
          accessor: 'groupB',
          type: 'numeric',
          aggregate: 'sum'
        },
        { name: 'col-a', accessor: 'a', aggregate: 'unique' },
        { name: 'col-b', accessor: 'b', aggregated: () => 123 },
        { name: 'col-c', accessor: 'c', aggregated: () => true },
        {
          // HTML rendering
          name: 'col-d',
          accessor: 'd',
          aggregated: () => '<div>col-d</div>',
          html: true
        },
        {
          // React elements and HTML rendering should not clash
          name: 'col-e',
          accessor: 'e',
          aggregated: function Aggregated() {
            return <div>col-e</div>
          },
          html: true
        },
        {
          // Formatters should not apply to empty aggregate values
          name: 'col-f',
          accessor: 'f',
          format: { aggregated: { prefix: '!!', date: true } }
        }
      ],
      pivotBy: ['groupA', 'groupB']
    }
    const { container } = render(<Reactable {...props} />)
    expect(getCellsText(container)).toEqual([
      '\u200ba (2)',
      '7',
      '1, 2',
      '123',
      'true',
      'col-d',
      'col-e',
      ''
    ])
  })

  it('aggregated cell render function', () => {
    let isExpanded = false
    let aggregatedCount = 0
    const props = {
      data: { a: ['a', 'a', 'b'], b: [1, 2, 3], c: ['x', 'x', 'x'], d: [1, 2, 3] },
      columns: [
        {
          name: 'col-a',
          accessor: 'a',
          // Aggregated cell renderers should work for aggregated cells in groupBy
          // columns, as long as they aren't the first groupBy column.
          aggregated: cellInfo => {
            expect(cellInfo.value).toEqual(null)
            return 'agg-a'
          }
        },
        {
          name: 'col-b',
          accessor: 'b',
          type: 'numeric',
          aggregate: 'mean',
          aggregated: (cellInfo, state) => {
            const rows = [
              {
                c: 'x',
                a: null,
                b: 2,
                d: null,
                _subRows: [
                  {
                    a: 'a',
                    b: 1.5,
                    c: 'x',
                    d: null,
                    _subRows: [
                      { a: 'a', b: 1, c: 'x', d: 1 },
                      { a: 'a', b: 2, c: 'x', d: 2 }
                    ]
                  },
                  { a: 'b', b: 3, c: 'x', d: null, _subRows: [{ a: 'b', b: 3, c: 'x', d: 3 }] }
                ]
              }
            ]

            // First row, unexpanded
            if (!isExpanded) {
              expect(cellInfo.column.id).toEqual('b')
              expect(cellInfo.column.name).toEqual('col-b')
              expect(cellInfo.index).toEqual(0)
              expect(cellInfo.viewIndex).toEqual(0)
              expect(cellInfo.page).toEqual(0)
              expect(cellInfo.value).toEqual(2)
              expect(cellInfo.aggregated).toEqual(true)
              expect(cellInfo.filterValue).toEqual(undefined)
              expect(cellInfo.level).toEqual(0)
              expect(cellInfo.expanded).toBeFalsy()
              expect(cellInfo.selected).toEqual(false)
              expect(cellInfo.row).toEqual({ c: 'x', a: null, b: 2, d: null })
              expect(cellInfo.subRows).toEqual(rows[0]._subRows)
              expect(state.page).toEqual(0)
              expect(state.pageSize).toEqual(10)
              expect(state.pages).toEqual(1)
              expect(state.sorted).toEqual([])
              expect(state.groupBy).toEqual(['c', 'a'])
              expect(state.filters).toEqual([])
              expect(state.searchValue).toEqual(undefined)
              expect(state.selected).toEqual([])
              expect(state.pageRows).toEqual(rows)
              expect(state.sortedData).toEqual(rows)
              expect(state.data).toEqual([
                { a: 'a', b: 1, c: 'x', d: 1 },
                { a: 'a', b: 2, c: 'x', d: 2 },
                { a: 'b', b: 3, c: 'x', d: 3 }
              ])
            }

            // First row, expanded
            if (isExpanded && cellInfo.level === 0) {
              expect(cellInfo.expanded).toEqual(true)
            }

            // Two child rows when expanded
            if (cellInfo.level > 0) {
              expect(cellInfo.index === 0 || cellInfo.index === 1).toEqual(true)
              expect(cellInfo.value).toEqual([1.5, 3][cellInfo.index])
              expect(cellInfo.aggregated).toEqual(true)
              expect(cellInfo.level).toEqual(1)
              expect(cellInfo.expanded).toBeFalsy()
              expect(cellInfo.selected).toEqual(false)
              expect(cellInfo.row).toEqual(
                [
                  { a: 'a', b: 1.5, c: 'x', d: null },
                  { a: 'b', b: 3, c: 'x', d: null }
                ][cellInfo.index]
              )
              expect(cellInfo.subRows.length).toEqual([2, 1][cellInfo.index])
              expect(state.page).toEqual(0)
              expect(state.pageSize).toEqual(10)
              expect(state.pages).toEqual(1)
              expect(state.sorted).toEqual([])
              expect(state.groupBy).toEqual(['c', 'a'])
              expect(state.filters).toEqual([])
              expect(state.searchValue).toEqual(undefined)
              expect(state.selected).toEqual([])
              expect(state.pageRows).toEqual([rows[0], rows[0]._subRows[0], rows[0]._subRows[1]])
              expect(state.sortedData).toEqual([rows[0], rows[0]._subRows[0], rows[0]._subRows[1]])
              expect(state.data).toEqual([
                { a: 'a', b: 1, c: 'x', d: 1 },
                { a: 'a', b: 2, c: 'x', d: 2 },
                { a: 'b', b: 3, c: 'x', d: 3 }
              ])
              aggregatedCount++
            }

            return `mean: ${cellInfo.value}`
          }
        },
        {
          name: 'col-c',
          accessor: 'c',
          // Aggregated cell renderer should not be called for non-aggregated groupBy columns
          // (the first groupBy column).
          aggregated: () => {
            throw new Error('should not be called')
          }
        },
        {
          name: 'col-d',
          accessor: 'd',
          aggregated: cellInfo => {
            expect(cellInfo.value).toEqual(null)
            return 'agg-d'
          },
          html: true
        }
      ],
      pivotBy: ['c', 'a'],
      paginateSubRows: true
    }
    const { container } = render(<Reactable {...props} />)
    isExpanded = true
    fireEvent.click(getExpanders(container)[0])
    expect(aggregatedCount).toEqual(2)
    expect(getCellsText(container)).toEqual([
      '\u200bx (2)',
      'agg-a',
      'mean: 2',
      'agg-d',
      '',
      '\u200ba (2)',
      'mean: 1.5',
      'agg-d',
      '',
      '\u200bb (1)',
      'mean: 3',
      'agg-d'
    ])
  })

  it('leaf rows should have a nesting depth > 0', () => {
    const props = {
      data: { a: ['a', 'a', 'b'], b: [1, 2, 3], c: ['x', 'x', 'x'], d: [1, 2, 3] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        {
          name: 'col-b',
          accessor: 'b',
          cell: cellInfo => cellInfo.depth,
          aggregated: cellInfo => cellInfo.depth,
          className: 'col-b'
        },
        { name: 'col-c', accessor: 'c' },
        { name: 'col-d', accessor: 'd' }
      ],
      pivotBy: ['c', 'a'],
      defaultExpanded: true
    }
    const { container } = render(<Reactable {...props} />)
    expect(getCellsText(container, '.col-b')).toEqual(['0', '1', '2', '2', '1', '2'])
  })

  it('aggregated cell formatting', () => {
    const props = {
      data: { a: ['a', 'a', 'b'], b: [1, 2, 3], c: ['x', 'x', 'x'], d: [1, 2, 3] },
      columns: [
        { name: 'col-a', accessor: 'a', format: { cell: { suffix: '__cell_a' } } },
        {
          name: 'col-b',
          accessor: 'b',
          format: { cell: { suffix: '__cell' }, aggregated: { prefix: 'agg__' } },
          aggregate: () => '',
          // Formatting should be applied before aggregated cell renderers
          aggregated: cellInfo => `${cellInfo.value}b-${cellInfo.level}-${cellInfo.index}`,
          className: 'col-b'
        },
        { name: 'col-c', accessor: 'c' },
        { name: 'col-d', accessor: 'd' }
      ],
      pivotBy: ['c', 'a'],
      defaultExpanded: true
    }
    const { container, getByText } = render(<Reactable {...props} />)
    expect(getByText('a__cell_a (2)')).toBeVisible()
    expect(getByText('b__cell_a (1)')).toBeVisible()
    expect(getCellsText(container, '.col-b')).toEqual([
      'agg__b-0-0',
      'agg__b-1-0',
      '1__cell',
      '2__cell',
      'agg__b-1-1',
      '3__cell'
    ])
  })

  it('applies classes and styles to aggregated cells', () => {
    let isExpanded = false
    const assertProps = (rowInfo, colInfo, state) => {
      // Check props for initial state only (one row)
      if (isExpanded) {
        return
      }
      expect(colInfo.id).toEqual('b')
      expect(colInfo.name).toEqual('col-b')
      expect(rowInfo.index).toEqual(0)
      expect(rowInfo.viewIndex).toEqual(0)
      expect(rowInfo.aggregated).toEqual(true)
      expect(rowInfo.level).toEqual(0)
      expect(rowInfo.expanded).toBeFalsy()
      expect(rowInfo.selected).toEqual(false)
      expect(rowInfo.values).toEqual({ c: 'x', a: null, b: 2, d: null })
      expect(rowInfo.row).toEqual({ c: 'x', a: null, b: 2, d: null })
      expect(rowInfo.subRows).toEqual([
        {
          a: 'a',
          b: 1.5,
          c: 'x',
          d: null,
          _subRows: [
            { a: 'a', b: 1, c: 'x', d: 1 },
            { a: 'a', b: 2, c: 'x', d: 2 }
          ]
        },
        { a: 'b', b: 3, c: 'x', d: null, _subRows: [{ a: 'b', b: 3, c: 'x', d: 3 }] }
      ])
      expect(state.page).toEqual(0)
      expect(state.pageSize).toEqual(10)
      expect(state.pages).toEqual(1)
      expect(state.sorted).toEqual([])
      expect(state.groupBy).toEqual(['c', 'a'])
      expect(state.filters).toEqual([])
      expect(state.searchValue).toEqual(undefined)
      expect(state.selected).toEqual([])
      expect(state.pageRows).toEqual([
        {
          c: 'x',
          a: null,
          b: 2,
          d: null,
          _subRows: [
            {
              a: 'a',
              b: 1.5,
              c: 'x',
              d: null,
              _subRows: [
                { b: 1, d: 1, a: 'a', c: 'x' },
                { b: 2, d: 2, a: 'a', c: 'x' }
              ]
            },
            { a: 'b', b: 3, c: 'x', d: null, _subRows: [{ b: 3, d: 3, a: 'b', c: 'x' }] }
          ]
        }
      ])
      expect(state.sortedData).toEqual(state.pageRows)
    }
    const props = {
      data: { a: ['a', 'a', 'b'], b: [1, 2, 3], c: ['x', 'x', 'x'], d: [1, 2, 3] },
      columns: [
        {
          name: 'col-a',
          accessor: 'a',
          className: rowInfo => {
            return rowInfo.aggregated ? 'grouped-a' : 'ungrouped-a'
          },
          style: { color: '#aaa' }
        },
        {
          name: 'col-b',
          accessor: 'b',
          type: 'numeric',
          aggregate: 'mean',
          className: (rowInfo, colInfo, state) => {
            assertProps(rowInfo, colInfo, state)
            return rowInfo.aggregated ? 'grouped-b' : 'ungrouped-b'
          },
          style: (rowInfo, colInfo, state) => {
            assertProps(rowInfo, colInfo, state)
            return { color: '#bbb' }
          }
        },
        { name: 'col-c', accessor: 'c' },
        { name: 'col-d', accessor: 'd' }
      ],
      pivotBy: ['c', 'a']
    }
    const { container, getByText } = render(<Reactable {...props} />)
    // Expand group x (2)
    isExpanded = true
    fireEvent.click(getByText('x (2)'))
    // Grouped cells in groupBy columns should be styled
    const groupedCellsA = getCells(container, '.grouped-a')
    expect(groupedCellsA).toHaveLength(3)
    groupedCellsA.forEach(cell => expect(cell).toHaveStyle('color: #aaa'))
    // Grouped cells in regular columns should be styled
    const groupedCellsB = getCells(container, '.grouped-b')
    expect(groupedCellsB).toHaveLength(3)
    groupedCellsB.forEach(cell => expect(cell).toHaveStyle('color: #bbb'))

    // Expand the second group
    fireEvent.click(getByText('a (2)'))
    // Ungrouped cells should be styled
    const ungroupedCellsA = getCells(container, '.ungrouped-a')
    expect(ungroupedCellsA).toHaveLength(2)
    ungroupedCellsA.forEach(cell => expect(cell).toHaveStyle('color: #aaa'))
  })

  it('applies row classes and styles to aggregated rows', () => {
    let isExpanded = false
    const assertProps = (rowInfo, state) => {
      // Check props for initial state only (one row)
      if (isExpanded) {
        return
      }
      expect(rowInfo.index).toEqual(0)
      expect(rowInfo.viewIndex).toEqual(0)
      expect(rowInfo.aggregated).toEqual(true)
      expect(rowInfo.level).toEqual(0)
      expect(rowInfo.expanded).toBeFalsy()
      expect(rowInfo.selected).toEqual(false)
      expect(rowInfo.values).toEqual({ c: 'x', a: null, b: 2, d: null })
      expect(rowInfo.row).toEqual({ c: 'x', a: null, b: 2, d: null })
      expect(rowInfo.subRows).toEqual([
        {
          a: 'a',
          b: 1.5,
          c: 'x',
          d: null,
          _subRows: [
            { a: 'a', b: 1, c: 'x', d: 1 },
            { a: 'a', b: 2, c: 'x', d: 2 }
          ]
        },
        { a: 'b', b: 3, c: 'x', d: null, _subRows: [{ a: 'b', b: 3, c: 'x', d: 3 }] }
      ])
      expect(state.page).toEqual(0)
      expect(state.pageSize).toEqual(10)
      expect(state.pages).toEqual(1)
      expect(state.sorted).toEqual([])
      expect(state.groupBy).toEqual(['c', 'a'])
      expect(state.filters).toEqual([])
      expect(state.searchValue).toEqual(undefined)
      expect(state.selected).toEqual([])
      expect(state.pageRows).toEqual([
        {
          c: 'x',
          a: null,
          b: 2,
          d: null,
          _subRows: [
            {
              a: 'a',
              b: 1.5,
              c: 'x',
              d: null,
              _subRows: [
                { b: 1, d: 1, a: 'a', c: 'x' },
                { b: 2, d: 2, a: 'a', c: 'x' }
              ]
            },
            { a: 'b', b: 3, c: 'x', d: null, _subRows: [{ b: 3, d: 3, a: 'b', c: 'x' }] }
          ]
        }
      ])
      expect(state.sortedData).toEqual(state.pageRows)
      expect(state.data).toEqual([
        { a: 'a', b: 1, c: 'x', d: 1 },
        { a: 'a', b: 2, c: 'x', d: 2 },
        { a: 'b', b: 3, c: 'x', d: 3 }
      ])
    }
    const props = {
      data: { a: ['a', 'a', 'b'], b: [1, 2, 3], c: ['x', 'x', 'x'], d: [1, 2, 3] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        { name: 'col-b', accessor: 'b', type: 'numeric', aggregate: 'mean' },
        { name: 'col-c', accessor: 'c' },
        { name: 'col-d', accessor: 'd' }
      ],
      pivotBy: ['c', 'a'],
      rowClassName: (rowInfo, colInfo, state) => {
        assertProps(rowInfo, colInfo, state)
        return rowInfo.aggregated ? 'grouped' : 'ungrouped'
      },
      rowStyle: (rowInfo, colInfo, state) => {
        assertProps(rowInfo, colInfo, state)
        return { color: '#bbb' }
      }
    }
    const { container, getByText } = render(<Reactable {...props} />)
    // Expand first group
    isExpanded = true
    fireEvent.click(getByText('x (2)'))
    // Grouped cells in groupBy columns should be styled
    const groupedRows = getRows(container, '.grouped')
    expect(groupedRows).toHaveLength(3)
    groupedRows.forEach(row => expect(row).toHaveStyle('color: #bbb'))

    // Expand second group
    fireEvent.click(getByText('a (2)'))
    // Ungrouped rows should be styled
    const ungroupedRows = getRows(container, '.ungrouped')
    expect(ungroupedRows).toHaveLength(2)
    ungroupedRows.forEach(row => expect(row).toHaveStyle('color: #bbb'))
  })

  it('header render functions and footer render functions can access sub rows', () => {
    const assertProps = (colInfo, state) => {
      const { column, data } = colInfo
      expect(column.id).toEqual('a')
      expect(column.name).toEqual('col-a')
      expect(column.filterValue).toEqual(undefined)
      const expectedRows = [
        {
          c: 'x',
          a: null,
          b: null,
          _subRows: [
            {
              a: 'a',
              b: null,
              c: 'x',
              _subRows: [
                { b: 1, a: 'a', c: 'x' },
                { b: 2, a: 'a', c: 'x' }
              ]
            },
            { a: 'b', b: null, c: 'x', _subRows: [{ b: 3, a: 'b', c: 'x' }] }
          ]
        }
      ]
      expect(data).toEqual(expectedRows)
      expect(state.page).toEqual(0)
      expect(state.pageSize).toEqual(10)
      expect(state.pages).toEqual(1)
      expect(state.sorted).toEqual([])
      expect(state.groupBy).toEqual(['c', 'a'])
      expect(state.filters).toEqual([])
      expect(state.searchValue).toEqual(undefined)
      expect(state.pageRows).toEqual(expectedRows)
      expect(state.sortedData).toEqual(expectedRows)
      expect(state.data).toEqual([
        { a: 'a', b: 1, c: 'x' },
        { a: 'a', b: 2, c: 'x' },
        { a: 'b', b: 3, c: 'x' }
      ])
    }
    const props = {
      data: { a: ['a', 'a', 'b'], b: [1, 2, 3], c: ['x', 'x', 'x'] },
      columns: [
        {
          name: 'col-a',
          accessor: 'a',
          header: (colInfo, state) => {
            assertProps(colInfo, state)
            return `header_${colInfo.data.length}_${colInfo.data[0]._subRows.length}`
          },
          footer: (colInfo, state) => {
            assertProps(colInfo, state)
            return `footer_${colInfo.data.length}_${colInfo.data[0]._subRows.length}`
          },
          headerClassName: 'header-a',
          footerClassName: 'footer-a'
        },
        { name: 'col-b', accessor: 'b' },
        { name: 'col-c', accessor: 'c' }
      ],
      pivotBy: ['c', 'a']
    }
    const { container } = render(<Reactable {...props} />)
    expect(container.querySelector('.header-a').textContent).toEqual('header_1_2')
    expect(container.querySelector('.footer-a').textContent).toEqual('footer_1_2')
  })

  it('non-expander grouped cells should expand grouped rows when clicked', () => {
    const getNonExpanderCells = container => {
      const expandableCells = [...getExpandableCells(container)]
      return expandableCells.filter(cell => cell.textContent === '')
    }
    const props = {
      data: { a: [1, 2, 3], b: ['b--a', 'b--b', 'b--c'], c: ['x', 'x', 'z'] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        { name: 'col-b', accessor: 'b' },
        { name: 'col-c', accessor: 'c' }
      ],
      pivotBy: ['c', 'a']
    }
    const { container, getByText } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(2)
    expect(getExpanders(container)).toHaveLength(2)
    expect(getExpandableCells(container)).toHaveLength(4)
    expect(getNonExpanderCells(container)).toHaveLength(2)

    expect(getNonExpanderCells(container)[0]).toEqual(getExpandableCells(container)[1])
    expect(getNonExpanderCells(container)[1]).toEqual(getExpandableCells(container)[3])

    fireEvent.click(getNonExpanderCells(container)[0]) // Aggregated cell for column a, group x (2)
    expect(getRows(container)).toHaveLength(4)
    expect(getExpandableCells(container)).toHaveLength(8)
    expect(getNonExpanderCells(container)).toHaveLength(4)
    expect(getByText('1 (1)')).toBeVisible()
    expect(getByText('2 (1)')).toBeVisible()

    fireEvent.click(getNonExpanderCells(container)[3]) // Aggregated cell for column a, group z (1)
    expect(getRows(container)).toHaveLength(5)
    expect(getExpandableCells(container)).toHaveLength(10)
    expect(getNonExpanderCells(container)).toHaveLength(5)
    expect(getByText('3 (1)')).toBeVisible()

    fireEvent.click(getNonExpanderCells(container)[1]) // Placeholder for column c, group 1 (1)
    expect(getByText('b--a')).toBeVisible()
    fireEvent.click(getNonExpanderCells(container)[2]) // Placeholder for column c, group 2 (1)
    expect(getByText('b--b')).toBeVisible()
    fireEvent.click(getNonExpanderCells(container)[4]) // Placeholder for column c, group 3 (1)
    expect(getByText('b--c')).toBeVisible()

    // No other grouped cells (for leaf rows) should be expandable
    expect(getExpandableCells(container)).toHaveLength(10)
    expect(getNonExpanderCells(container)).toHaveLength(5)

    // Non-expander cells should collapse rows
    fireEvent.click(getNonExpanderCells(container)[0]) // Aggregated cell for column a, group x (2)
    fireEvent.click(getNonExpanderCells(container)[1]) // Aggregated cell for column a, group z (1)
    expect(getRows(container)).toHaveLength(2)
    expect(getNonExpanderCells(container)).toHaveLength(2)
  })

  it('table updates when groupBy changes', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        { name: 'col-b', accessor: 'b' }
      ]
    }
    const { container, rerender } = render(<Reactable {...props} />)
    expect(getExpanders(container)).toHaveLength(0)
    expect(getRows(container)).toHaveLength(2)

    rerender(<Reactable {...props} pivotBy={['b']} />)
    expect(getExpanders(container)).toHaveLength(2)
  })

  it('row expanded state persists when groupBy changes', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], c: ['x', 'y'] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        { name: 'col-b', accessor: 'b' },
        { name: 'col-c', accessor: 'c' }
      ],
      pivotBy: ['c']
    }
    const { container, rerender } = render(<Reactable {...props} />)
    const expanders = getExpanders(container)
    expect(expanders).toHaveLength(2)
    expect(getRows(container)).toHaveLength(2)

    fireEvent.click(expanders[0])
    expect(getRows(container)).toHaveLength(3)

    // Adding groupBy columns
    rerender(<Reactable {...props} pivotBy={['c', 'b']} />)
    expect(getExpanders(container)).toHaveLength(3)
    expect(getRows(container)).toHaveLength(3)

    // Removing groupBy columns
    rerender(<Reactable {...props} pivotBy={['c']} />)
    expect(getExpanders(container)).toHaveLength(2)
    expect(getRows(container)).toHaveLength(3)
  })

  it('row expanded state persists by row ID when groupBy changes', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'], c: ['x', 'y'] },
      columns: [
        { name: 'col-a', accessor: 'a', details: ['row-details-1', 'row-details-2'] },
        { name: 'col-b', accessor: 'b' },
        { name: 'col-c', accessor: 'c' }
      ]
    }
    const { container, getByText, queryByText, rerender } = render(<Reactable {...props} />)
    let expanders = getExpanders(container)
    expect(expanders).toHaveLength(2)
    expect(getRows(container)).toHaveLength(2)

    // Expanded state should not persist by relative row index (like in v6).
    // Details row expansion should not transfer to grouped rows.
    fireEvent.click(expanders[0])
    expect(queryByText('row-details-1')).toBeVisible()
    expect(getRows(container)).toHaveLength(2)
    rerender(<Reactable {...props} pivotBy={['c']} />)
    expect(queryByText('row-details-1')).toBeFalsy()
    expect(getRows(container)).toHaveLength(2)

    // Details row should still be expanded
    expanders = getExpanders(container)
    expect(expanders).toHaveLength(2)
    fireEvent.click(expanders[0])
    expect(getRows(container)).toHaveLength(3)
    expect(getByText('row-details-1')).toBeVisible()
  })

  it('table updates when defaultExpanded changes', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['a', 'b', 'c'], c: ['x', 'x', 'z'] },
      columns: [
        { name: 'a', accessor: 'a', details: rowInfo => `row details: ${rowInfo.index}-a` },
        { name: 'b', accessor: 'b' },
        { name: 'c', accessor: 'c' }
      ],
      pivotBy: ['c'],
      defaultExpanded: true
    }
    const { container, rerender } = render(<Reactable {...props} />)
    expect(getExpanders(container)).toHaveLength(5)
    expect(getRows(container)).toHaveLength(5)

    rerender(<Reactable {...props} defaultExpanded={false} />)
    expect(getExpanders(container)).toHaveLength(2)
    expect(getRows(container)).toHaveLength(2)

    rerender(<Reactable {...props} defaultExpanded={true} />)
    expect(getExpanders(container)).toHaveLength(5)
    expect(getRows(container)).toHaveLength(5)
  })

  it('defaultExpanded works with grouped rows and row details', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['a', 'b', 'c'], c: ['x', 'x', 'z'] },
      columns: [
        { name: 'a', accessor: 'a', details: rowInfo => `row details: ${rowInfo.index}-a` },
        { name: 'b', accessor: 'b' },
        { name: 'c', accessor: 'c' }
      ],
      pivotBy: ['c'],
      defaultExpanded: true
    }
    const { container, getByText, rerender } = render(<Reactable {...props} />)
    expect(getExpanders(container)).toHaveLength(5)
    expect(getRows(container)).toHaveLength(5)
    expect(getByText('row details: 0-a')).toBeVisible()
    expect(getByText('row details: 1-a')).toBeVisible()
    expect(getByText('row details: 2-a')).toBeVisible()

    // When adding new groupBy columns, previous expanded state should persist.
    // New groupBy columns should also be expanded, but this does not currently work.
    rerender(<Reactable {...props} pivotBy={['c', 'b']} />)
    expect(getRows(container)).toHaveLength(5)
    expect(getRowDetails(container)).toHaveLength(0)
    rerender(<Reactable {...props} pivotBy={['c', 'b']} defaultExpanded={false} />)
    expect(getRows(container)).toHaveLength(2)
    rerender(<Reactable {...props} pivotBy={['c', 'b']} defaultExpanded={true} />)
    expect(getRows(container)).toHaveLength(8)
  })

  it('grouped state persists when data changes', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        { name: 'col-b', accessor: 'b' }
      ],
      pivotBy: ['b']
    }
    const { container, rerender } = render(<Reactable {...props} />)
    expect(getExpanders(container)).toHaveLength(2)
    rerender(<Reactable {...props} data={{ a: [1, 2, 3], b: ['a', 'b', 'c'] }} />)
    expect(getExpanders(container)).toHaveLength(3)
  })

  it('groupBy columns work with column groups', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['a', 'b', 'c'], c: ['x', 'x', 'z'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' },
        { name: 'c', accessor: 'c' }
      ],
      columnGroups: [{ columns: ['a', 'c'], name: 'group' }],
      pivotBy: ['c']
    }
    const { container } = render(<Reactable {...props} />)
    const columnHeaders = getColumnHeaders(container)
    expect([...columnHeaders].map(header => header.textContent)).toEqual(['c', 'a', 'b'])
    const groupHeaders = getGroupHeaders(container)
    expect(groupHeaders).toHaveLength(1)
    expect(groupHeaders[0]).toHaveAttribute('aria-colspan', '2')
    expect(getUngroupedHeaders(container)).toHaveLength(1)
  })

  it('groupBy columns work with split column groups', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['a', 'b', 'c'], c: ['x', 'x', 'z'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' },
        { name: 'c', accessor: 'c' }
      ],
      columnGroups: [{ columns: ['c', 'b'], name: 'group' }],
      pivotBy: ['c']
    }
    const { container } = render(<Reactable {...props} />)
    const columnHeaders = getColumnHeaders(container)
    // groupBy columns should still be first
    expect([...columnHeaders].map(header => header.textContent)).toEqual(['c', 'a', 'b'])
    const groupHeaders = getGroupHeaders(container)
    expect(groupHeaders).toHaveLength(2)
    expect(groupHeaders[0]).toHaveAttribute('aria-colspan', '1')
    expect(groupHeaders[1]).toHaveAttribute('aria-colspan', '1')
    expect([...groupHeaders].map(header => header.textContent)).toEqual(['group', 'group'])
    expect(getUngroupedHeaders(container)).toHaveLength(1)
  })

  it('expanders language', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      language: {
        groupExpandLabel: '_Toggle group'
      },
      pivotBy: ['a']
    }
    const { container } = render(<Reactable {...props} />)
    const expanders = getExpanders(container)
    expect(expanders[0]).toHaveAttribute('aria-label', '_Toggle group')
    fireEvent.click(expanders[0])
    expect(expanders[0]).toHaveAttribute('aria-label', '_Toggle group')
  })
})

describe('sub rows', () => {
  it('subRows is a valid column ID', () => {
    const props = {
      data: { a: [1, 2], b: [3, 4], subRows: ['a', 'b'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' },
        { name: 'colSubRows', accessor: 'subRows' }
      ]
    }
    const { container, getByText } = render(<Reactable {...props} />)
    const headers = getHeaders(container)
    expect(headers).toHaveLength(3)
    expect(getByText('colSubRows')).toBeVisible()
  })

  it('handles data with sub rows', () => {
    const props = {
      data: { a: [1, 2], b: [3, 4], '.subRows': [{ a: [5, 6], b: [7, 8] }, null] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' }
      ]
    }
    const { container } = render(<Reactable {...props} />)
    const headers = getHeaders(container)
    expect(headers).toHaveLength(2)
  })
})

describe('cell click actions', () => {
  it('expands row details on click', () => {
    const props = {
      data: { a: ['aaa1', 'aaa2'], b: ['bbb1', 'bbb2'], c: ['ccc1', 'ccc2'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b', details: ['detail-b', null] },
        { name: 'c', accessor: 'c', details: ['detail-c', 'detail-c'] }
      ],
      onClick: 'expand'
    }
    const { container, getByText, queryByText } = render(<Reactable {...props} />)
    const expanders = getExpanders(container)
    expect(expanders).toHaveLength(3)
    fireEvent.click(getByText('aaa1'))
    // Should expand first details column
    expect(getByText('detail-b')).toBeVisible()
    expect(queryByText('detail-c')).toEqual(null)
    // Should work fine with expander buttons
    fireEvent.click(expanders[0])
    expect(queryByText('detail-b')).toEqual(null)
    fireEvent.click(expanders[0])
    expect(getByText('detail-b')).toBeVisible()
    // Collapse row
    fireEvent.click(getByText('aaa1'))
    expect(queryByText('detail-b')).toEqual(null)
  })

  it('expands row details on click with column groups', () => {
    const props = {
      data: { a: ['aaa1', 'aaa2'], b: ['bbb1', 'bbb2'] },
      columns: [
        { name: 'col-a', accessor: 'a', details: ['row-details-1', 'row-details-2'] },
        { name: 'col-b', accessor: 'b' }
      ],
      columnGroups: [{ columns: ['a', 'b'] }],
      onClick: 'expand'
    }
    const { getByText } = render(<Reactable {...props} />)
    fireEvent.click(getByText('bbb1'))
    expect(getByText('row-details-1')).toBeVisible()
    fireEvent.click(getByText('bbb2'))
    expect(getByText('row-details-2')).toBeVisible()
  })

  it('expands grouped rows on click', () => {
    const props = {
      data: { a: [1, 1, 2], b: ['b-a', 'b-b', 'b-c'], c: ['x', 'x', 'x'], d: [1, 2, 3] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        {
          name: 'col-b',
          accessor: 'b',
          aggregated: cellInfo => `b-agg-${cellInfo.level}-${cellInfo.index}`,
          details: () => 'details-b'
        },
        { name: 'col-c', accessor: 'c' },
        {
          name: 'col-d',
          accessor: 'd',
          aggregated: cellInfo => `d-agg-${cellInfo.level}-${cellInfo.index}`
        }
      ],
      pivotBy: ['c', 'a'],
      onClick: 'expand'
    }
    const { container, getByText } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(1)
    // Non-expandable cell should expand and collapse
    fireEvent.click(getByText('b-agg-0-0'))
    expect(getRows(container)).toHaveLength(3)
    fireEvent.click(getByText('b-agg-0-0'))
    expect(getRows(container)).toHaveLength(1)

    // Expandable cells should still work
    const expandableCells = getExpandableCells(container)
    fireEvent.click(expandableCells[1])
    expect(getRows(container)).toHaveLength(3)
    // Expanders should still work
    const expanders = getExpanders(container)
    fireEvent.click(expanders[0])
    expect(getRows(container)).toHaveLength(1)
    fireEvent.click(expanders[0])
    expect(getRows(container)).toHaveLength(3)

    fireEvent.click(getByText('d-agg-1-0'))
    expect(getRows(container)).toHaveLength(5)

    // Clicking should still expand row details
    fireEvent.click(getByText('b-b'))
    expect(getByText('details-b')).toBeVisible()
  })

  it('ignores pad rows on click', () => {
    const props = {
      data: { a: ['aaa1', 'aaa2'] },
      columns: [{ name: 'a', accessor: 'a', details: ['detail-a', 'detail-a', 'detail-a'] }],
      onClick: 'expand',
      minRows: 5
    }
    const { container, queryByText } = render(<Reactable {...props} />)
    const padRows = getPadRows(container)
    fireEvent.click(getCells(padRows[0])[0])
    expect(queryByText('detail-a')).toEqual(null)
  })

  it('custom onClick actions', () => {
    let clickCount = 0
    const props = {
      data: { a: ['aaa1', 'aaa2'], b: ['bbb1', 'bbb2'], c: ['ccc1', 'ccc2'] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        { name: 'col-b', accessor: 'b' },
        { name: 'col-c', accessor: 'c' }
      ],
      onClick: (rowInfo, colInfo, state) => {
        if (clickCount < 2) {
          expect(colInfo.id).toEqual('b')
          expect(colInfo.name).toEqual('col-b')
          expect(rowInfo.index).toEqual(1)
          expect(rowInfo.viewIndex).toEqual(1)
          expect(rowInfo.aggregated).toBeFalsy()
          expect(rowInfo.level).toEqual(0)
          expect(rowInfo.expanded).toBeFalsy()
          expect(rowInfo.selected).toEqual(false)
          expect(rowInfo.values).toEqual({ a: 'aaa2', b: 'bbb2', c: 'ccc2' })
          expect(rowInfo.row).toEqual({ a: 'aaa2', b: 'bbb2', c: 'ccc2' })
          expect(rowInfo.subRows).toEqual([])
          expect(state.page).toEqual(0)
          expect(state.pageSize).toEqual(10)
          expect(state.pages).toEqual(1)
          expect(state.sorted).toEqual([])
          expect(state.groupBy).toEqual([])
          expect(state.filters).toEqual([])
          expect(state.searchValue).toEqual(undefined)
          expect(state.selected).toEqual([])
          expect(state.pageRows).toEqual([
            { a: 'aaa1', b: 'bbb1', c: 'ccc1' },
            { a: 'aaa2', b: 'bbb2', c: 'ccc2' }
          ])
          expect(state.sortedData).toEqual([
            { a: 'aaa1', b: 'bbb1', c: 'ccc1' },
            { a: 'aaa2', b: 'bbb2', c: 'ccc2' }
          ])
          expect(state.data).toEqual([
            { a: 'aaa1', b: 'bbb1', c: 'ccc1' },
            { a: 'aaa2', b: 'bbb2', c: 'ccc2' }
          ])
        } else {
          expect(colInfo.id).toEqual('c')
          expect(rowInfo.index).toEqual(0)
          expect(rowInfo.viewIndex).toEqual(0)
        }
        clickCount++
      },
      minRows: 5
    }
    const { container, getByText } = render(<Reactable {...props} />)

    fireEvent.click(getByText('bbb2'))
    expect(clickCount).toEqual(1)
    fireEvent.click(getByText('bbb2'))
    expect(clickCount).toEqual(2)
    fireEvent.click(getByText('ccc1'))
    expect(clickCount).toEqual(3)

    // Pad rows should not be clickable
    const padRows = getPadRows(container)
    fireEvent.click(getCells(padRows[0])[0])
    expect(clickCount).toEqual(3)
  })
})

describe('pagination', () => {
  it('defaultPageSize', () => {
    const props = {
      data: { a: [1, 2, 3, 4, 5, 6, 7] },
      columns: [{ name: 'a', accessor: 'a' }],
      defaultPageSize: 2
    }
    const { container } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(2)
  })

  it('table updates when defaultPageSize changes', () => {
    const props = {
      data: { a: [1, 2, 3, 4, 5, 6, 7] },
      columns: [{ name: 'a', accessor: 'a' }],
      defaultPageSize: 2
    }
    const { container, rerender } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(2)
    rerender(<Reactable {...props} defaultPageSize={3} />)
    expect(getRows(container)).toHaveLength(3)
    rerender(<Reactable {...props} defaultPageSize={7} />)
    expect(getRows(container)).toHaveLength(7)
  })

  it('shows or hides pagination', () => {
    const props = {
      data: { a: [1, 2], b: ['a', 'b'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ]
    }

    // Auto-hidden if table always fits on one page
    const { container, rerender } = render(<Reactable {...props} defaultPageSize={2} />)
    expect(getPagination(container)).toEqual(null)

    // Auto-shown if default page size causes paging
    rerender(
      <Reactable {...props} defaultPageSize={1} showPageSizeOptions pageSizeOptions={[10, 20]} />
    )
    expect(getPagination(container)).toBeVisible()

    // Auto-shown if page size option causes paging
    rerender(
      <Reactable {...props} defaultPageSize={20} showPageSizeOptions pageSizeOptions={[1, 20]} />
    )
    expect(getPagination(container)).toBeVisible()

    // Force show pagination
    rerender(
      <Reactable
        {...props}
        showPagination
        defaultPageSize={2}
        showPageSizeOptions
        pageSizeOptions={[2]}
      />
    )
    expect(getPagination(container)).toBeVisible()

    // Force hide pagination
    rerender(
      <Reactable
        {...props}
        showPagination={false}
        defaultPageSize={1}
        showPageSizeOptions
        pageSizeOptions={[10, 20]}
      />
    )
    expect(getPagination(container)).toEqual(null)
  })

  it('auto-shown pagination persists after filtering', () => {
    const props = {
      data: { a: [111, 222, 333], b: ['aaa', 'aaa', 'ccc'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b', filterable: true }
      ],
      defaultPageSize: 2,
      searchable: true
    }
    const { container } = render(<Reactable {...props} />)
    expect(getPagination(container)).toBeVisible()

    const filter = getFilters(container)[0]
    fireEvent.change(filter, { target: { value: 'aaa' } })
    expect(getRows(container)).toHaveLength(2)
    expect(getPagination(container)).toBeVisible()

    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: '222' } })
    expect(getRows(container)).toHaveLength(1)
    expect(getPagination(container)).toBeVisible()
  })

  it('auto-shows pagination when expanded rows would cause table to span multiple pages', () => {
    const props = {
      data: {
        group: ['a', 'a', 'a', 'a'],
        a: [111, 111, 222, 33]
      },
      columns: [
        { name: 'group', accessor: 'group' },
        { name: 'col-a', accessor: 'a' }
      ],
      defaultPageSize: 4,
      pivotBy: ['group'],
      paginateSubRows: true,
      searchable: true
    }
    const { container } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(1)
    expect(getPagination(container)).toBeVisible()
    expect(getPageInfo(container).textContent).toEqual('1–1 of 1 rows')

    fireEvent.click(getExpanders(container)[0])
    expect(getRows(container)).toHaveLength(4)
    expect(getPagination(container)).toBeVisible()
    expect(getPageInfo(container).textContent).toEqual('1–4 of 5 rows')

    // Pagination should persist after filtering
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: '222' } })
    expect(getRows(container)).toHaveLength(2)
    expect(getPagination(container)).toBeVisible()
    expect(getPageInfo(container).textContent).toEqual('1–2 of 2 rows')
  })

  it('auto-shown pagination works when data changes', () => {
    const props = {
      data: { a: [1, 2, 3, 4, 5] },
      columns: [{ name: 'col-a', accessor: 'a' }],
      defaultPageSize: 4
    }
    const { container, rerender } = render(<Reactable {...props} />)
    expect(getPagination(container)).toBeVisible()
    expect(getPageInfo(container).textContent).toEqual('1–4 of 5 rows')

    rerender(<Reactable {...props} data={{ a: [1, 2, 3, 4] }} />)
    expect(getPagination(container)).toEqual(null)
  })

  it('page info', () => {
    const props = {
      data: { a: [1, 2, 3, 4, 5], b: ['a', 'b', 'c', 'd', 'e'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      defaultPageSize: 2
    }
    let { container, rerender } = render(<Reactable {...props} />)
    let pageInfo = getPageInfo(container)
    expect(pageInfo.textContent).toEqual('1–2 of 5 rows')
    expect(pageInfo).toHaveAttribute('aria-live', 'polite')

    const nextButton = getNextButton(container)
    fireEvent.click(nextButton)
    expect(pageInfo.textContent).toEqual('3–4 of 5 rows')
    fireEvent.click(nextButton)
    expect(pageInfo.textContent).toEqual('5–5 of 5 rows')

    // Updates on filtering
    rerender(<Reactable {...props} filterable />)
    const filter = getFilters(container)[0]
    fireEvent.change(filter, { target: { value: '11' } })
    expect(pageInfo.textContent).toEqual('0–0 of 0 rows')
    fireEvent.change(filter, { target: { value: '' } })

    // Hide page info
    rerender(<Reactable {...props} showPageInfo={false} />)
    pageInfo = getPageInfo(container)
    expect(pageInfo).toEqual(null)

    // Language
    rerender(
      <Reactable
        {...props}
        showPageInfo
        language={{ pageInfo: '_{rowStart} to {rowEnd} of {rows}' }}
      />
    )
    pageInfo = getPageInfo(container)
    expect(pageInfo.textContent).toEqual('_1 to 2 of 5')
  })

  it('page size options', () => {
    const props = {
      data: { a: [1, 2, 3, 4, 5], b: ['_a1', '_b2', '_c3', '_d4', '_e5'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      defaultPageSize: 2,
      showPageSizeOptions: true,
      pageSizeOptions: [2, 4, 6]
    }
    const { container, rerender } = render(<Reactable {...props} />)
    let pageSizeOptions = getPageSizeOptions(container)
    let pageSizeSelect = getPageSizeSelect(container)
    expect(pageSizeOptions.textContent).toEqual('Show 246')
    expect(pageSizeSelect).toHaveAttribute('aria-label', 'Rows per page')

    // Options
    const options = pageSizeSelect.querySelectorAll('option')
    expect(options).toHaveLength(3)
    options.forEach((option, i) =>
      expect(option.textContent).toEqual(`${props.pageSizeOptions[i]}`)
    )

    // Change page size
    fireEvent.change(pageSizeSelect, { target: { value: 4 } })
    expect(getRows(container)).toHaveLength(4)
    expect(getPageInfo(container).textContent).toEqual('1–4 of 5 rows')

    // Hide page size options
    rerender(<Reactable {...props} showPageSizeOptions={false} />)
    expect(getPageSizeOptions(container)).toEqual(null)

    // No page info shown
    rerender(<Reactable {...props} showPageInfo={false} />)
    expect(getPageSizeOptions(container).textContent).toEqual('Show 246')

    // Language
    rerender(
      <Reactable
        {...props}
        language={{ pageSizeOptions: '_Show {rows}', pageSizeOptionsLabel: '_Rows per page' }}
      />
    )
    pageSizeOptions = getPageSizeOptions(container)
    pageSizeSelect = getPageSizeSelect(container)
    expect(pageSizeOptions.textContent).toEqual('_Show 246')
    expect(pageSizeSelect).toHaveAttribute('aria-label', '_Rows per page')
  })

  it('simple page navigation', () => {
    const props = {
      data: { a: [1, 2, 3, 4, 5], b: ['_a1', '_b2', '_c3', '_d4', '_e5'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      defaultPageSize: 2,
      paginationType: 'simple'
    }
    const { container, queryByText, rerender } = render(<Reactable {...props} />)
    const pageNumbers = getPageNumbers(container)
    const prevButton = getPrevButton(container)
    const nextButton = getNextButton(container)
    expect(pageNumbers.textContent).toEqual('1 of 3')
    expect(queryByText('_e5')).toEqual(null)

    // First page: previous button should be disabled
    expect(prevButton).toHaveAttribute('disabled')
    expect(prevButton).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(prevButton)
    expect(pageNumbers.textContent).toEqual('1 of 3')

    fireEvent.click(nextButton)
    expect(pageNumbers.textContent).toEqual('2 of 3')
    expect(prevButton).not.toHaveAttribute('disabled')
    expect(prevButton).not.toHaveAttribute('aria-disabled')
    expect(nextButton).not.toHaveAttribute('aria-disabled')

    fireEvent.click(nextButton)
    expect(pageNumbers.textContent).toEqual('3 of 3')
    expect(queryByText('_e5')).toBeVisible()

    // Last page: next button should be disabled
    fireEvent.click(nextButton)
    expect(pageNumbers.textContent).toEqual('3 of 3')
    expect(nextButton).toHaveAttribute('disabled')
    expect(nextButton).toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(prevButton)
    expect(pageNumbers.textContent).toEqual('2 of 3')

    // Language
    let language = {
      pageNext: '_Next',
      pagePrevious: '_Previous',
      pageNumbers: '_{page} of {pages}',
      pageNextLabel: '_Next page',
      pagePreviousLabel: '_Previous page'
    }
    rerender(<Reactable {...props} language={language} />)
    expect(prevButton.textContent).toEqual('_Previous')
    expect(nextButton.textContent).toEqual('_Next')
    expect(prevButton).toHaveAttribute('aria-label', '_Previous page')
    expect(nextButton).toHaveAttribute('aria-label', '_Next page')
    expect(pageNumbers.textContent).toEqual('_1 of 3')

    language = {
      pageNext: '',
      pagePrevious: null,
      pageNextLabel: '',
      pagePreviousLabel: null
    }
    rerender(<Reactable {...props} language={language} />)
    expect(prevButton).not.toHaveTextContent()
    expect(nextButton).not.toHaveTextContent()
    expect(prevButton).not.toHaveAttribute('aria-label')
    expect(nextButton).not.toHaveAttribute('aria-label')
  })

  it('page number buttons', () => {
    const props = {
      data: { a: [1, 2, 3, 4, 5], b: ['_a1', '_b2', '_c3', '_d4', '_e5'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      defaultPageSize: 1,
      paginationType: 'numbers'
    }
    const { container, queryAllByText, rerender } = render(<Reactable {...props} />)
    let pageButtons = [...getPageButtons(container)]
    let pageNumberBtns = pageButtons.slice(1, pageButtons.length - 1)
    expect(pageNumberBtns).toHaveLength(5)
    pageNumberBtns.forEach((btn, i) => {
      const page = i + 1
      expect(btn.textContent).toEqual(`${page}`)
      if (page === 1) {
        expect(btn).toHaveAttribute('aria-current', 'page')
        expect(btn).toHaveAttribute('aria-label', `Page ${page} `)
      } else {
        expect(btn).toHaveAttribute('aria-label', `Page ${page}`)
      }
    })

    fireEvent.click(pageNumberBtns[1])
    const pageInfo = getPageInfo(container)
    expect(pageInfo.textContent).toEqual('2–2 of 5 rows')
    expect(pageNumberBtns[0]).not.toHaveClass('rt-page-button-current')
    expect(pageNumberBtns[1]).toHaveClass('rt-page-button-current')
    expect(pageNumberBtns[1]).toHaveAttribute('aria-current', 'page')

    // Changing to the same page should be a no-op
    fireEvent.click(pageNumberBtns[1])
    expect(pageInfo.textContent).toEqual('2–2 of 5 rows')
    expect(pageNumberBtns[1]).toHaveClass('rt-page-button-current')

    fireEvent.click(pageNumberBtns[4])
    expect(pageInfo.textContent).toEqual('5–5 of 5 rows')

    // Should update on external page changes
    const prevButton = getPrevButton(container)
    const nextButton = getNextButton(container)
    fireEvent.click(prevButton)
    expect(pageNumberBtns[3]).toHaveClass('rt-page-button-current')
    fireEvent.click(nextButton)
    expect(pageNumberBtns[4]).toHaveClass('rt-page-button-current')

    // Pages with ellipses
    const data = { a: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
    rerender(<Reactable {...props} data={data} />)
    fireEvent.click(pageNumberBtns[0]) // page 1
    let ellipses = queryAllByText('...')
    expect(ellipses).toHaveLength(1)
    pageButtons = [...getPageButtons(container)]
    fireEvent.click(pageNumberBtns[4]) // page 5
    ellipses = queryAllByText('...')
    expect(ellipses).toHaveLength(2)

    // Language
    rerender(<Reactable {...props} language={{ pageNumberLabel: '_Page {page}' }} />)
    pageButtons = [...getPageButtons(container)]
    pageNumberBtns = pageButtons.slice(1, pageButtons.length - 1)
    pageNumberBtns.forEach((btn, i) => {
      const page = i + 1
      if (btn.hasAttribute('aria-current')) {
        expect(btn).toHaveAttribute('aria-label', `_Page ${page} `)
      } else {
        expect(btn).toHaveAttribute('aria-label', `_Page ${page}`)
      }
    })
  })

  it('page jump', () => {
    const props = {
      data: { a: [1, 2, 3, 4, 5], b: ['_a1', '_b2', '_c3', '_d4', '_e5'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      defaultPageSize: 2,
      paginationType: 'jump'
    }
    const { container, rerender } = render(<Reactable {...props} />)
    const pageJump = getPageJump(container)
    const pageNumbers = getPageNumbers(container)
    expect(pageJump).toHaveAttribute('value', '1')
    expect(pageJump).toHaveAttribute('aria-label', 'Go to page')
    expect(pageNumbers.textContent).toEqual(' of 3')

    const pageInfo = getPageInfo(container)
    fireEvent.change(pageJump, { target: { value: 2 } })
    // Shouldn't change page yet
    expect(pageInfo.textContent).toEqual('1–2 of 5 rows')
    // Should change page on unfocus
    fireEvent.blur(pageJump)
    expect(pageInfo.textContent).toEqual('3–4 of 5 rows')
    fireEvent.change(pageJump, { target: { value: 1 } })
    // Should change page on enter keypress
    fireEvent.keyPress(pageJump, { key: 'Enter', code: 13, charCode: 13 })
    expect(pageInfo.textContent).toEqual('1–2 of 5 rows')

    // Should update on external page changes
    const nextButton = getNextButton(container)
    fireEvent.click(nextButton)
    expect(pageJump).toHaveAttribute('value', '2')

    // Values out of range should be reset to nearest valid value
    fireEvent.change(pageJump, { target: { value: '9' } })
    fireEvent.blur(pageJump)
    expect(pageJump).toHaveAttribute('value', '3')
    fireEvent.change(pageJump, { target: { value: '0' } })
    fireEvent.blur(pageJump)
    expect(pageJump).toHaveAttribute('value', '1')

    // Invalid and blank values should be reset to last value
    fireEvent.change(pageJump, { target: { value: '2' } })
    fireEvent.blur(pageJump)
    fireEvent.change(pageJump, { target: { value: '' } })
    fireEvent.blur(pageJump)
    expect(pageJump).toHaveAttribute('value', '2')
    fireEvent.change(pageJump, { target: { value: 'asdf' } })
    fireEvent.blur(pageJump)
    expect(pageJump).toHaveAttribute('value', '2')

    // Language
    rerender(
      <Reactable
        {...props}
        language={{ pageNumbers: '_{page} of {pages}', pageJumpLabel: '_Go to page' }}
      />
    )
    expect(pageJump).toHaveAttribute('aria-label', '_Go to page')
    expect(pageNumbers.textContent).toEqual('_ of 3')
  })

  it('paginates sub rows', () => {
    const props = {
      data: {
        group: ['a', 'a', 'a', 'a'],
        a: [111, 111, 222, 33]
      },
      columns: [
        { name: 'group', accessor: 'group' },
        { name: 'col-a', accessor: 'a' }
      ],
      defaultPageSize: 2,
      pivotBy: ['group'],
      paginateSubRows: true
    }
    const { container, rerender } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(1)
    expect(getPagination(container)).toBeVisible()

    fireEvent.click(getExpanders(container)[0])
    expect(getRows(container)).toHaveLength(2)
    expect(getPageInfo(container).textContent).toEqual('1–2 of 5 rows')

    // Auto-shown pagination should update when paginateSubRows changes
    rerender(<Reactable {...props} paginateSubRows={false} />)
    expect(getRows(container)).toHaveLength(5)
    expect(getPagination(container)).toEqual(null)
  })

  it('does not paginate sub rows by default', () => {
    const props = {
      data: {
        group: ['a', 'a', 'a', 'a'],
        a: [111, 111, 222, 33]
      },
      columns: [
        { name: 'group', accessor: 'group' },
        { name: 'col-a', accessor: 'a' }
      ],
      defaultPageSize: 2,
      pivotBy: ['group']
    }
    const { container, rerender } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(1)
    expect(getPagination(container)).toEqual(null)

    fireEvent.click(getExpanders(container)[0])
    rerender(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(5)
    expect(getPagination(container)).toEqual(null)
  })

  it('disabling pagination works', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['a', 'b', 'c'] },
      columns: [
        {
          name: 'a',
          accessor: 'a',
          cell: (cellInfo, state) => {
            return `page: ${state.page}, pageSize: ${state.pageSize}, pages: ${state.pages}`
          }
        },
        { name: 'b', accessor: 'b' }
      ],
      pagination: false,
      defaultPageSize: 2
    }

    const { container } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(3)
    expect(getPagination(container)).toEqual(null)
    // Pagination properties should still be present in the API
    expect(getCellsText(container)[0]).toEqual('page: 0, pageSize: 2, pages: 1')
  })

  it('disabling pagination works with visible pagination bar (showPagination)', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['a', 'b', 'c'] },
      columns: [
        {
          name: 'a',
          accessor: 'a',
          cell: (cellInfo, state) => {
            return `page: ${state.page}, pageSize: ${state.pageSize}, pages: ${state.pages}`
          }
        },
        { name: 'b', accessor: 'b' }
      ],
      pagination: false,
      defaultPageSize: 2,
      showPagination: true,
      showPageSizeOptions: true,
      pageSizeOptions: [2, 1]
    }

    const { container } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(3)
    expect(getPagination(container)).toBeVisible()
    expect(getPageInfo(container).textContent).toEqual('1–3 of 3 rows')
    expect(getCellsText(container)[0]).toEqual('page: 0, pageSize: 2, pages: 1')

    // Page size should be changeable, but still be ignored
    const pageSizeSelect = getPageSizeSelect(container)
    fireEvent.change(pageSizeSelect, { target: { value: 1 } })
    expect(pageSizeSelect.value).toEqual('1')
    expect(getRows(container)).toHaveLength(3)
    expect(getPageInfo(container).textContent).toEqual('1–3 of 3 rows')
    expect(getCellsText(container)[0]).toEqual('page: 0, pageSize: 1, pages: 1')
  })

  it('disabling pagination works when data changes', () => {
    const props = {
      data: { a: [1, 2, 3, 4] },
      columns: [{ name: 'a', accessor: 'a' }],
      pagination: false,
      defaultPageSize: 2
    }
    const { container, rerender } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(4)
    rerender(<Reactable {...props} data={{ a: [1, 2, 3, 4, 5, 6, 7] }} />)
    expect(getRows(container)).toHaveLength(7)
  })

  it('disabling pagination works with sub rows (paginateSubRows disabled)', () => {
    const props = {
      data: {
        group: ['a', 'a', 'a', 'a'],
        a: [111, 111, 222, 33]
      },
      columns: [
        { name: 'group', accessor: 'group' },
        { name: 'col-a', accessor: 'a' }
      ],
      pagination: false,
      defaultPageSize: 4,
      pivotBy: ['group'],
      paginateSubRows: false,
      showPagination: true,
      defaultExpanded: true
    }
    const { container } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(5)
    expect(getPageInfo(container).textContent).toEqual('1–1 of 1 rows')
  })

  it('disabling pagination works with sub rows (paginateSubRows enabled)', () => {
    const props = {
      data: {
        group: ['a', 'a', 'a', 'a'],
        a: [111, 111, 222, 33]
      },
      columns: [
        { name: 'group', accessor: 'group' },
        { name: 'col-a', accessor: 'a' }
      ],
      pagination: false,
      defaultPageSize: 4,
      pivotBy: ['group'],
      paginateSubRows: true,
      showPagination: true,
      defaultExpanded: true
    }
    const { container } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(5)
    // Should ignore default page size when pagination is disabled
    expect(getPageInfo(container).textContent).toEqual('1–5 of 5 rows')
  })

  it('current page state resets when data changes (also on sorting, filtering, searching)', () => {
    const props = {
      data: { a: ['aa', 'aa', 'bb', 'cc', 'cc', 'cc', 'cc'] },
      columns: [{ name: 'col-a', accessor: 'a' }],
      defaultPageSize: 2,
      filterable: true,
      searchable: true
    }
    const { container, getByText, rerender } = render(<Reactable {...props} />)
    const pageInfo = getPageInfo(container)
    const nextButton = getNextButton(container)
    expect(pageInfo.textContent).toEqual('1–2 of 7 rows')
    fireEvent.click(nextButton)
    expect(pageInfo.textContent).toEqual('3–4 of 7 rows')

    // Data changes
    rerender(<Reactable {...props} data={{ a: ['aa', 'aa', 'aa', 'bb'] }} />)
    expect(pageInfo.textContent).toEqual('1–2 of 4 rows')

    // Sorting changes
    fireEvent.click(nextButton)
    expect(pageInfo.textContent).toEqual('3–4 of 4 rows')
    fireEvent.click(getByText('col-a'))
    expect(pageInfo.textContent).toEqual('1–2 of 4 rows')

    // Filter changes
    const filter = getFilters(container)[0]
    fireEvent.click(nextButton)
    expect(pageInfo.textContent).toEqual('3–4 of 4 rows')
    fireEvent.change(filter, { target: { value: 'aa' } })
    expect(pageInfo.textContent).toEqual('1–2 of 3 rows')
    fireEvent.change(filter, { target: { value: '' } })

    // Search changes
    const searchInput = getSearchInput(container)
    fireEvent.click(nextButton)
    expect(pageInfo.textContent).toEqual('3–4 of 4 rows')
    fireEvent.change(searchInput, { target: { value: 'aa' } })
    expect(pageInfo.textContent).toEqual('1–2 of 3 rows')
    fireEvent.change(searchInput, { target: { value: '' } })
  })
})

describe('themes', () => {
  it('applies theme styles to the table', () => {
    const props = {
      data: { a: [1, 2], b: ['aa', 'bb'] },
      columns: [
        {
          name: 'colA',
          accessor: 'a',
          footer: 'footer-a',
          className: 'cell-a',
          headerClassName: 'header-a',
          footerClassName: 'footer-a',
          details: () => 'details'
        },
        { name: 'colB', accessor: 'b', footer: 'footer-b' }
      ],
      columnGroups: [{ columns: ['a'], name: 'group-a' }],
      minRows: 4,
      filterable: true,
      searchable: true,
      className: 'my-root',
      rowClassName: 'my-row',
      theme: {
        style: { color: 'red' },
        tableStyle: { border: '1px solid black' },
        tableBodyStyle: { content: '"tableBody"' },
        rowGroupStyle: { content: '"rowGroup"' },
        rowStyle: { content: '"row"' },
        headerStyle: { content: '"header"' },
        groupHeaderStyle: { content: '"groupHeader"' },
        cellStyle: { content: '"cell"' },
        footerStyle: { content: '"footer"' },
        inputStyle: { content: '"input"' }
      }
    }
    const { container } = render(<Reactable {...props} />)

    const rootContainer = getRoot(container)
    expect(rootContainer).toHaveStyleRule('color', 'red')
    // Should work with custom classes
    expect(container.querySelector('.my-root')).toBeVisible()

    const table = getTable(container)
    expect(table).toHaveStyleRule('border', '1px solid black')

    const tbody = getTbody(container)
    expect(tbody).toHaveStyleRule('content', '"tableBody"')

    const rowGroups = getRowGroups(container)
    rowGroups.forEach(rowGroup => expect(rowGroup).toHaveStyleRule('content', '"rowGroup"'))

    const rows = getDataRows(container)
    rows.forEach(row => expect(row).toHaveStyleRule('content', '"row"'))
    // rowStyle should be applied to pad rows as well
    const padRows = getPadRows(container)
    padRows.forEach(row => expect(row).toHaveStyleRule('content', '"row"'))

    const filterRow = getFilterRow(container)
    expect(filterRow).toHaveStyleRule('content', '"row"')

    const headerRows = getHeaderRows(container)
    headerRows.forEach(row => expect(row).not.toHaveStyleRule('content', '"row"'))

    const footerRow = getFooterRow(container)
    expect(footerRow).not.toHaveStyleRule('content', '"row"')

    // Should work with custom classes
    expect(container.querySelectorAll('.my-row')).toHaveLength(4)

    const headers = getColumnHeaders(container)
    headers.forEach(header => expect(header).toHaveStyleRule('content', '"header"'))

    const groupHeaders = getGroupHeaders(container)
    groupHeaders.forEach(header => expect(header).toHaveStyleRule('content', '"groupHeader"'))
    const ungroupedHeaders = getUngroupedHeaders(container)
    ungroupedHeaders.forEach(header => expect(header).toHaveStyleRule('content', '"groupHeader"'))

    const filterCells = getFilterCells(container)
    filterCells.forEach(cell => expect(cell).toHaveStyleRule('content', '"cell"'))
    // cellStyle should be applied to pad cells as well
    const cells = getCells(container)
    cells.forEach(cell => expect(cell).toHaveStyleRule('content', '"cell"'))

    const footers = getFooters(container)
    footers.forEach(footer => expect(footer).toHaveStyleRule('content', '"footer"'))

    // Should work with custom classes
    expect(container.querySelectorAll('.cell-a')).toHaveLength(2)
    expect(container.querySelectorAll('.header-a')).toHaveLength(2) // Includes filter
    expect(container.querySelectorAll('.footer-a')).toHaveLength(1)

    const expanderIcons = getExpanderIcons(container)
    expanderIcons.forEach(expander => {
      expect(expander).toHaveStyleRule('border-top-color', 'red', { target: '::after' })
    })

    const filters = getFilters(container)
    filters.forEach(input => expect(input).toHaveStyleRule('content', '"input"'))
    const searchInput = getSearchInput(container)
    expect(searchInput).toHaveStyleRule('content', '"input"')
  })

  it('applies theme styles to pagination', () => {
    const props = {
      data: { a: [1, 2], b: ['aa', 'bb'] },
      columns: [
        { name: 'colA', accessor: 'a' },
        { name: 'colB', accessor: 'b' }
      ],
      defaultPageSize: 1,
      showPageSizeOptions: true,
      paginationType: 'jump',
      theme: {
        borderColor: 'red',
        borderWidth: 999,
        inputStyle: { content: '"input"' },
        selectStyle: { content: '"select"' },
        paginationStyle: { content: '"pagination"' },
        pageButtonStyle: { content: '"pageButton"' },
        pageButtonCurrentStyle: { color: 'pageButtonCurrent' }
      }
    }
    const { container } = render(<Reactable {...props} />)

    const pagination = getPagination(container)
    expect(pagination).toHaveStyleRule('content', '"pagination"')
    expect(pagination).toHaveStyleRule('border-top-color', 'red')
    expect(pagination).toHaveStyleRule('border-top-width', '999px')
    expect(pagination).toHaveStyleRule('content', '"select"', { target: '.rt-page-size-select' })
    expect(pagination).toHaveStyleRule('content', '"input"', { target: '.rt-page-jump' })
    expect(pagination).toHaveStyleRule('content', '"pageButton"', { target: '.rt-page-button' })
    expect(pagination).toHaveStyleRule('color', 'pageButtonCurrent', {
      target: '.rt-page-button-current'
    })
  })

  it('applies cell padding styles correctly', () => {
    const props = {
      data: { a: [1, 2], b: ['aa', 'bb'] },
      columns: [
        { name: 'colA', accessor: 'a', footer: 'footer-a' },
        { name: 'colB', accessor: 'b', footer: 'footer-b' }
      ],
      columnGroups: [{ columns: ['a'], name: 'group-a' }],
      minRows: 4,
      filterable: true,
      theme: {
        cellPadding: '99px'
      }
    }
    const { container } = render(<Reactable {...props} />)

    const assertHeader = el => {
      const innerEl = el.querySelector('.rt-th-inner')
      expect(innerEl).toBeVisible()
      expect(el).not.toHaveStyleRule('padding', '99px')
      expect(innerEl).toHaveStyleRule('padding', '99px')
    }
    const assertCell = el => {
      const innerEl = el.querySelector('.rt-td-inner')
      expect(innerEl).toBeVisible()
      expect(el).not.toHaveStyleRule('padding', '99px')
      expect(innerEl).toHaveStyleRule('padding', '99px')
    }

    const headers = getColumnHeaders(container)
    headers.forEach(assertHeader)

    const groupHeaders = getGroupHeaders(container)
    groupHeaders.forEach(assertHeader)
    const ungroupedHeaders = getUngroupedHeaders(container)
    ungroupedHeaders.forEach(assertHeader)

    const filterCells = getFilterCells(container)
    filterCells.forEach(assertCell)

    const cells = getCells(container) // Includes pad cells
    cells.forEach(assertCell)

    const footers = getFooters(container)
    footers.forEach(assertCell)
  })

  it('theme styles are scoped to their tables', () => {
    const props = {
      data: { a: [] },
      columns: [{ name: 'a', accessor: 'a' }]
    }
    const { container } = render(
      <div>
        <Reactable {...props} className="tbl-a" theme={{ style: { background: 'blue' } }} />
        <Reactable
          {...props}
          className="tbl-b"
          theme={{ style: { background: 'red', color: 'red' } }}
        />
      </div>
    )
    const tableA = container.querySelector('.tbl-a')
    const tableB = container.querySelector('.tbl-b')
    expect(tableA).toHaveStyleRule('background', 'blue')
    expect(tableB).toHaveStyleRule('background', 'red')
    expect(tableA).not.toHaveStyleRule('color', 'red')
    expect(tableB).toHaveStyleRule('color', 'red')
  })
})

describe('updateReactable updates table state from Shiny', () => {
  beforeEach(() => {
    window.Shiny = {
      onInputChange: jest.fn(),
      addCustomMessageHandler: jest.fn(),
      bindAll: jest.fn(),
      unbindAll: jest.fn()
    }
  })

  afterEach(() => {
    delete window.Shiny
  })

  it('updates selected rows', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }],
      selection: 'multiple',
      selectionId: 'selected'
    }
    const { getAllByLabelText, getByLabelText } = render(
      <div data-reactable-output="shiny-output-container">
        <Reactable {...props} />
      </div>
    )

    const [outputId, updateState] = window.Shiny.addCustomMessageHandler.mock.calls[0]
    expect(outputId).toEqual('__reactable__shiny-output-container')

    act(() => updateState({ selected: [1, 0] }))
    expect(window.Shiny.onInputChange).toHaveBeenCalledWith('selected', [1, 2])
    expect(window.Shiny.onInputChange).toHaveBeenCalledWith(
      'shiny-output-container__reactable__selected',
      [1, 2]
    )
    let selectAllCheckbox = getByLabelText('Select all rows')
    let selectRowCheckboxes = getAllByLabelText('Select row')
    let selectRow1Checkbox = selectRowCheckboxes[0]
    let selectRow2Checkbox = selectRowCheckboxes[1]
    expect(selectAllCheckbox.checked).toEqual(true)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(true)

    window.Shiny.onInputChange.mockReset()
    act(() => updateState({ selected: [] }))
    expect(window.Shiny.onInputChange).toHaveBeenCalledWith('selected', [])
    expect(window.Shiny.onInputChange).toHaveBeenCalledWith(
      'shiny-output-container__reactable__selected',
      []
    )
    expect(selectAllCheckbox.checked).toEqual(false)
    expect(selectRow1Checkbox.checked).toEqual(false)
    expect(selectRow2Checkbox.checked).toEqual(false)
  })

  it('handles invalid selected rows', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }],
      selection: 'multiple'
    }
    const { container } = render(
      <div data-reactable-output="shiny-output-container">
        <Reactable {...props} />
      </div>
    )

    const [outputId, updateState] = window.Shiny.addCustomMessageHandler.mock.calls[0]
    expect(outputId).toEqual('__reactable__shiny-output-container')

    act(() => updateState({ selected: [4] }))
    expect(window.Shiny.onInputChange).toHaveBeenCalledWith(
      'shiny-output-container__reactable__selected',
      []
    )
    const selectRowCheckboxes = getSelectRowCheckboxes(container)
    selectRowCheckboxes.forEach(checkbox => expect(checkbox.checked).toEqual(false))
  })

  it('updates expanded rows', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a', details: ['detail-1', 'detail-2'] }]
    }
    const { getByText, queryByText } = render(
      <div data-reactable-output="shiny-output-container">
        <Reactable {...props} />
      </div>
    )

    const [outputId, updateState] = window.Shiny.addCustomMessageHandler.mock.calls[0]
    expect(outputId).toEqual('__reactable__shiny-output-container')

    act(() => updateState({ expanded: true }))
    expect(getByText('detail-1')).toBeVisible()
    expect(getByText('detail-2')).toBeVisible()

    act(() => updateState({ expanded: false }))
    expect(queryByText('detail-1')).toEqual(null)
    expect(queryByText('detail-2')).toEqual(null)
  })

  it('updates current page', () => {
    const props = {
      data: { a: [1, 2, 3] },
      columns: [{ name: 'a', accessor: 'a' }],
      defaultPageSize: 1
    }
    const { getByText } = render(
      <div data-reactable-output="shiny-output-container">
        <Reactable {...props} />
      </div>
    )

    const [outputId, updateState] = window.Shiny.addCustomMessageHandler.mock.calls[0]
    expect(outputId).toEqual('__reactable__shiny-output-container')
    expect(getByText('1–1 of 3 rows')).toBeVisible()

    act(() => updateState({ page: 2 }))
    expect(getByText('3–3 of 3 rows')).toBeVisible()
    expect(window.Shiny.onInputChange).toHaveBeenCalledWith(
      'shiny-output-container__reactable__page',
      3
    )

    act(() => updateState({ page: 0 }))
    expect(getByText('1–1 of 3 rows')).toBeVisible()

    // Should round out-of-bounds page indexes to nearest valid page
    act(() => updateState({ page: 999 }))
    expect(getByText('3–3 of 3 rows')).toBeVisible()
    act(() => updateState({ page: -5 }))
    expect(getByText('1–1 of 3 rows')).toBeVisible()
  })

  it('updates data', () => {
    const props = {
      data: { a: ['c1', 'c2', 'c3', 'c4'] },
      columns: [{ name: 'a', accessor: 'a' }],
      defaultPageSize: 3
    }
    const { getByText, queryByText, rerender } = render(
      <div data-reactable-output="shiny-output-container">
        <Reactable {...props} />
      </div>
    )

    const [outputId, updateState] = window.Shiny.addCustomMessageHandler.mock.calls[0]
    expect(outputId).toEqual('__reactable__shiny-output-container')

    expect(getByText('c1')).toBeVisible()
    act(() => updateState({ data: { a: ['newc1', 'newc2', 'newc3'] } }))
    expect(getByText('newc1')).toBeVisible()
    expect(getByText('newc2')).toBeVisible()
    expect(getByText('newc3')).toBeVisible()

    // After updating data, rerendering with new data should work
    rerender(<Reactable {...props} data={{ a: ['b1', 'b2', 'b'] }} />)
    expect(getByText('b1')).toBeVisible()
    expect(queryByText('newc1')).toBeFalsy()
  })

  it('updates data, selected, expanded, and current page state', () => {
    const props = {
      data: { a: ['a1', 'a2', 'a3'] },
      columns: [{ name: 'a', accessor: 'a', details: ['detail-1', 'detail-2', 'detail-3'] }],
      defaultPageSize: 1,
      selection: 'multiple'
    }
    const { getByLabelText, getByText } = render(
      <div data-reactable-output="shiny-output-container">
        <Reactable {...props} />
      </div>
    )

    const [outputId, updateState] = window.Shiny.addCustomMessageHandler.mock.calls[0]
    expect(outputId).toEqual('__reactable__shiny-output-container')

    // Known issue: when updating data and current page at the same time in act(), the
    // current page does not update correctly. Suppress the console error about act()
    // for now.
    const originalError = console.error
    console.error = jest.fn()
    updateState({ data: { a: ['c1', 'c2', 'c3'] }, selected: [2], expanded: true, page: 2 })
    console.error = originalError
    expect(getByText('c3')).toBeVisible()
    expect(getByLabelText('Select row')).toBeChecked()
    expect(getByText('detail-3')).toBeVisible()
    expect(getByText('3–3 of 3 rows')).toBeVisible()
  })

  it('does not enable updateState for tables that are not Shiny outputs', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }]
    }
    // Static rendered tables in Shiny have no parent element with a data-reactable-output ID
    render(
      <div>
        <Reactable {...props} />
      </div>
    )
    expect(window.Shiny.addCustomMessageHandler).not.toHaveBeenCalled()
  })

  it('does not enable updateState for nested tables, which are not Shiny bound', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }],
      nested: true
    }
    render(
      <div data-reactable-output="not-a-shiny-output-container">
        <Reactable {...props} />
      </div>
    )
    expect(window.Shiny.addCustomMessageHandler).not.toHaveBeenCalled()
  })

  it('does not enable updateState when Shiny is not initialized', () => {
    window.Shiny = undefined
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }]
    }
    render(
      <div data-reactable-output="not-a-shiny-output-container">
        <Reactable {...props} />
      </div>
    )
    // Should not call Shiny.addCustomMessageHandler
  })
})

describe('getReactableState gets table state from Shiny', () => {
  beforeEach(() => {
    window.Shiny = {
      onInputChange: jest.fn(),
      addCustomMessageHandler: jest.fn(),
      bindAll: jest.fn(),
      unbindAll: jest.fn()
    }
  })

  afterEach(() => {
    delete window.Shiny
  })

  it('calls Shiny.onInputChange when table state changes', () => {
    const props = {
      data: { a: [1, 2, 3, 4] },
      columns: [{ name: 'a', accessor: 'a' }],
      selection: 'multiple',
      defaultPageSize: 2,
      showPageSizeOptions: true,
      pageSizeOptions: [2, 4]
    }
    const { container, getAllByLabelText } = render(
      <div data-reactable-output="tbl">
        <Reactable {...props} />
      </div>
    )

    // Initial state
    expect(window.Shiny.onInputChange).toHaveBeenNthCalledWith(1, 'tbl__reactable__page', 1)
    expect(window.Shiny.onInputChange).toHaveBeenNthCalledWith(2, 'tbl__reactable__pageSize', 2)
    expect(window.Shiny.onInputChange).toHaveBeenNthCalledWith(3, 'tbl__reactable__pages', 2)
    expect(window.Shiny.onInputChange).toHaveBeenNthCalledWith(4, 'tbl__reactable__selected', [])
    window.Shiny.onInputChange.mockReset()

    // Selected rows
    const selectRow2Checkbox = getAllByLabelText('Select row')[1]
    fireEvent.click(selectRow2Checkbox)
    expect(window.Shiny.onInputChange).toHaveBeenNthCalledWith(1, 'tbl__reactable__page', 1)
    expect(window.Shiny.onInputChange).toHaveBeenNthCalledWith(2, 'tbl__reactable__pageSize', 2)
    expect(window.Shiny.onInputChange).toHaveBeenNthCalledWith(3, 'tbl__reactable__pages', 2)
    expect(window.Shiny.onInputChange).toHaveBeenNthCalledWith(4, 'tbl__reactable__selected', [2])
    window.Shiny.onInputChange.mockReset()

    // Current page
    fireEvent.click(getNextButton(container))
    expect(window.Shiny.onInputChange).toHaveBeenNthCalledWith(1, 'tbl__reactable__page', 2)
    expect(window.Shiny.onInputChange).toHaveBeenNthCalledWith(2, 'tbl__reactable__pageSize', 2)
    expect(window.Shiny.onInputChange).toHaveBeenNthCalledWith(3, 'tbl__reactable__pages', 2)
    expect(window.Shiny.onInputChange).toHaveBeenNthCalledWith(4, 'tbl__reactable__selected', [2])
    window.Shiny.onInputChange.mockReset()

    // Pages, page size
    const pageSizeSelect = getPageSizeSelect(container)
    fireEvent.change(pageSizeSelect, { target: { value: 4 } })
    expect(window.Shiny.onInputChange).toHaveBeenNthCalledWith(1, 'tbl__reactable__page', 1)
    expect(window.Shiny.onInputChange).toHaveBeenNthCalledWith(2, 'tbl__reactable__pageSize', 4)
    expect(window.Shiny.onInputChange).toHaveBeenNthCalledWith(3, 'tbl__reactable__pages', 1)
    expect(window.Shiny.onInputChange).toHaveBeenNthCalledWith(4, 'tbl__reactable__selected', [2])
    window.Shiny.onInputChange.mockReset()
  })

  it('does not send state when table is not a Shiny output', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }]
    }
    // Static rendered tables in Shiny have no parent element with a data-reactable-output ID
    render(
      <div>
        <Reactable {...props} />
      </div>
    )
    expect(window.Shiny.onInputChange).not.toHaveBeenCalled()
  })

  it('does not send state for nested tables, which are not Shiny bound', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }],
      nested: true
    }
    render(
      <div data-reactable-output="not-a-shiny-output-container">
        <Reactable {...props} />
      </div>
    )
    expect(window.Shiny.onInputChange).not.toHaveBeenCalled()
  })

  it('does not send state when Shiny is not fully initialized', () => {
    // When static widgets are rendered in Shiny apps, Shiny may be defined
    // but not fully initialized.
    window.Shiny.onInputChange = undefined
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }]
    }
    render(
      <div data-reactable-output="not-a-shiny-output-container">
        <Reactable {...props} />
      </div>
    )
    // Should not call Shiny.onInputChange

    window.Shiny = undefined
    render(
      <div data-reactable-output="not-a-shiny-output-container">
        <Reactable {...props} />
      </div>
    )
  })
})

describe('Crosstalk', () => {
  let mockSelection, mockFilter

  beforeEach(() => {
    mockSelection = { on: jest.fn(), close: jest.fn(), set: jest.fn() }
    mockFilter = { on: jest.fn(), close: jest.fn() }
    window.crosstalk = {
      SelectionHandle: jest.fn().mockReturnValueOnce(mockSelection),
      FilterHandle: jest.fn().mockReturnValueOnce(mockFilter)
    }
  })

  afterEach(() => {
    mockSelection = null
    mockFilter = null
    delete window.crosstalk
  })

  it('handles selection changes', () => {
    const props = {
      data: { a: [111, 222, 333], b: ['aaa', 'bbb', 'ccc'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      crosstalkKey: ['key1', 'key2', 'key3'],
      crosstalkGroup: 'group'
    }

    const { container, getByText, unmount } = render(<Reactable {...props} />)
    expect(window.crosstalk.SelectionHandle).toHaveBeenCalledTimes(1)
    expect(window.crosstalk.SelectionHandle).toHaveBeenCalledWith('group')
    expect(mockSelection.on).toHaveBeenCalledTimes(1)

    const [selectionType, onSelection] = mockSelection.on.mock.calls[0]
    expect(selectionType).toEqual('change')

    // Select one value
    act(() => onSelection({ sender: 'some other widget', value: ['key2'] }))
    expect(getRows(container)).toHaveLength(1)
    expect(getByText('bbb')).toBeVisible()

    // Clear selection
    act(() => onSelection({ sender: 'some other widget', value: [] }))
    expect(getRows(container)).toHaveLength(3)

    // Select multiple values
    act(() => onSelection({ sender: 'some other widget', value: ['key3', 'key1', 'key2'] }))
    expect(getRows(container)).toHaveLength(3)

    // Clear selection
    act(() => onSelection({ sender: 'some other widget', value: null }))
    expect(getRows(container)).toHaveLength(3)

    // Should ignore selections from same sender
    act(() => onSelection({ sender: mockSelection, value: ['key2'] }))
    expect(getRows(container)).toHaveLength(3)

    // Should cleanup
    unmount()
    expect(mockSelection.close).toHaveBeenCalledTimes(1)
  })

  it('handles initial selection value', () => {
    const props = {
      data: { a: [111, 222, 333], b: ['aaa', 'bbb', 'ccc'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      crosstalkKey: ['key1', 'key2', 'key3'],
      crosstalkGroup: 'group'
    }

    mockSelection.value = ['key2']
    const { container, getByText } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(1)
    expect(getByText('bbb')).toBeVisible()

    const onSelection = mockSelection.on.mock.calls[0][1]
    act(() => onSelection({ sender: 'some other widget', value: [] }))
    expect(getRows(container)).toHaveLength(3)
  })

  it('handles filter changes', () => {
    const props = {
      data: { a: [111, 222, 333], b: ['aaa', 'bbb', 'ccc'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      crosstalkKey: ['key1', 'key2', 'key3'],
      crosstalkGroup: 'group'
    }
    const { container, getByText, unmount } = render(<Reactable {...props} />)
    expect(window.crosstalk.FilterHandle).toHaveBeenCalledTimes(1)
    expect(window.crosstalk.FilterHandle).toHaveBeenCalledWith('group')
    expect(mockFilter.on).toHaveBeenCalledTimes(1)

    const [filterType, onFilter] = mockFilter.on.mock.calls[0]
    expect(filterType).toEqual('change')

    // Filter one value
    act(() => onFilter({ sender: 'some other widget', value: ['key2'] }))
    expect(getRows(container)).toHaveLength(1)
    expect(getByText('bbb')).toBeVisible()

    // Filter multiple values
    act(() => onFilter({ sender: 'some other widget', value: ['key3', 'key1'] }))
    expect(getRows(container)).toHaveLength(2)
    expect(getByText('ccc')).toBeVisible()
    expect(getByText('aaa')).toBeVisible()

    // Clear filter
    act(() => onFilter({ sender: 'some other widget', value: null }))
    expect(getRows(container)).toHaveLength(3)

    // Should ignore selections from same sender
    act(() => onFilter({ sender: mockFilter, value: ['key2'] }))
    expect(getRows(container)).toHaveLength(3)

    // Should cleanup
    unmount()
    expect(mockFilter.close).toHaveBeenCalledTimes(1)
  })

  it('handles initial filter value', () => {
    const props = {
      data: { a: [111, 222, 333], b: ['aaa', 'bbb', 'ccc'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      crosstalkKey: ['key1', 'key2', 'key3'],
      crosstalkGroup: 'group'
    }

    mockFilter.filteredKeys = ['key2']
    const { container, getByText } = render(<Reactable {...props} />)
    expect(getRows(container)).toHaveLength(1)
    expect(getByText('bbb')).toBeVisible()

    const onFilter = mockFilter.on.mock.calls[0][1]
    act(() => onFilter({ sender: 'some other widget', value: null }))
    expect(getRows(container)).toHaveLength(3)
  })

  it('handles both selection and filter changes', () => {
    const props = {
      data: { a: [111, 222, 333], b: ['aaa', 'bbb', 'ccc'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      crosstalkKey: ['key1', 'key2', 'key3'],
      crosstalkGroup: 'group'
    }
    const { container, getByText } = render(<Reactable {...props} />)

    const onSelection = mockSelection.on.mock.calls[0][1]
    const onFilter = mockFilter.on.mock.calls[0][1]

    // Filter with existing selection
    act(() => onSelection({ sender: 'some other widget', value: ['key2'] }))
    act(() => onFilter({ sender: 'some other widget', value: ['key2', 'key3'] }))
    expect(getRows(container)).toHaveLength(1)
    expect(getByText('bbb')).toBeVisible()

    // Selection with existing filter
    act(() => onFilter({ sender: 'some other widget', value: ['key1', 'key3'] }))
    act(() => onSelection({ sender: 'some other widget', value: ['key3'] }))
    expect(getRows(container)).toHaveLength(1)
    expect(getByText('ccc')).toBeVisible()

    // Clear selection and filter
    act(() => onSelection({ sender: 'some other widget', value: [] }))
    expect(getRows(container)).toHaveLength(2)
    act(() => onFilter({ sender: 'some other widget', value: null }))
    expect(getRows(container)).toHaveLength(3)
  })

  it('sends selection changes', () => {
    const props = {
      data: { a: [111, 222, 333], b: ['aaa', 'bbb', 'ccc'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      selection: 'multiple',
      crosstalkKey: ['key1', 'key2', 'key3'],
      crosstalkGroup: 'group'
    }
    const { container } = render(<Reactable {...props} />)
    const selectRowCheckboxes = getSelectRowCheckboxes(container)
    const selectAllCheckbox = selectRowCheckboxes[0]
    const selectRow1Checkbox = selectRowCheckboxes[1]
    const selectRow2Checkbox = selectRowCheckboxes[2]

    // Should not set initial selection if there are no default selected rows
    expect(mockSelection.set).toHaveBeenCalledTimes(0)

    fireEvent.click(selectRow2Checkbox)
    expect(mockSelection.set).toHaveBeenLastCalledWith(['key2'])
    fireEvent.click(selectRow1Checkbox)
    expect(mockSelection.set).toHaveBeenLastCalledWith(['key1', 'key2'])
    fireEvent.click(selectAllCheckbox)
    expect(mockSelection.set).toHaveBeenLastCalledWith(['key1', 'key2', 'key3'])
    fireEvent.click(selectAllCheckbox)
    expect(mockSelection.set).toHaveBeenLastCalledWith([])
    expect(mockSelection.set).toHaveBeenCalledTimes(4)
  })

  it('sends selection changes for defaultSelected rows', () => {
    const props = {
      data: { a: [111, 222, 333], b: ['aaa', 'bbb', 'ccc'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      selection: 'multiple',
      defaultSelected: [2, 0],
      crosstalkKey: ['key1', 'key2', 'key3'],
      crosstalkGroup: 'group'
    }
    const { rerender } = render(<Reactable {...props} />)
    expect(mockSelection.set).toHaveBeenLastCalledWith(['key1', 'key3'])
    expect(mockSelection.set).toHaveBeenCalledTimes(1)

    rerender(<Reactable {...props} defaultSelected={[1]} />)
    expect(mockSelection.set).toHaveBeenLastCalledWith(['key2'])
    expect(mockSelection.set).toHaveBeenCalledTimes(3)
  })

  it('clears selection filter on selection from table', () => {
    const props = {
      data: { a: [111, 222, 333], b: ['aaa', 'bbb', 'ccc'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      selection: 'multiple',
      crosstalkKey: ['key1', 'key2', 'key3'],
      crosstalkGroup: 'group'
    }
    const { container, getByText } = render(<Reactable {...props} />)
    const onSelection = mockSelection.on.mock.calls[0][1]
    const onFilter = mockFilter.on.mock.calls[0][1]

    act(() => onFilter({ sender: 'some other widget', value: ['key2', 'key3'] }))
    act(() => onSelection({ sender: 'some other widget', value: ['key2'] }))
    expect(getRows(container)).toHaveLength(1)
    expect(getByText('bbb')).toBeVisible()

    const selectRowCheckboxes = getSelectRowCheckboxes(container)
    const selectRow2Checkbox = selectRowCheckboxes[1]

    fireEvent.click(selectRow2Checkbox)
    act(() => onSelection({ sender: mockSelection, value: ['key2'] }))
    expect(mockSelection.set).toHaveBeenLastCalledWith(['key2'])
    expect(getRows(container)).toHaveLength(2)
    expect(getByText('bbb')).toBeVisible()
    expect(getByText('ccc')).toBeVisible()
  })

  it('clears selected state on selection changes from other widgets', () => {
    const props = {
      data: { a: [111, 222, 333], b: ['aaa', 'bbb', 'ccc'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      selection: 'multiple',
      searchable: true,
      crosstalkKey: ['key1', 'key2', 'key3'],
      crosstalkGroup: 'group'
    }
    const { container } = render(<Reactable {...props} />)
    const onSelection = mockSelection.on.mock.calls[0][1]
    const selectRowCheckboxes = getSelectRowCheckboxes(container)
    const selectRow1Checkbox = selectRowCheckboxes[1]
    const selectRow2Checkbox = selectRowCheckboxes[2]

    fireEvent.click(selectRow1Checkbox)
    fireEvent.click(selectRow2Checkbox)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(selectRow2Checkbox.checked).toEqual(true)

    act(() => onSelection({ sender: 'some other widget', value: null }))
    expect(selectRow1Checkbox.checked).toEqual(false)
    expect(selectRow2Checkbox.checked).toEqual(false)

    // Should clear selection on rows that are not visible and have been filtered out
    fireEvent.click(selectRow1Checkbox)
    expect(selectRow1Checkbox.checked).toEqual(true)
    fireEvent.change(getSearchInput(container), { target: { value: 'bbb' } })
    expect(getRows(container)).toHaveLength(1)
    getSelectRowCheckboxes(container).forEach(checkbox => expect(checkbox.checked).toEqual(false))
    act(() => onSelection({ sender: 'some widget far, far away', value: ['key1', 'key2'] }))
    fireEvent.change(getSearchInput(container), { target: { value: '' } })
    expect(getRows(container)).toHaveLength(2)
    getSelectRowCheckboxes(container).forEach(checkbox => expect(checkbox.checked).toEqual(false))
  })

  it('handles missing keys', () => {
    // crosstalkKey can be null when there are no rows in the table
    const props = {
      data: { a: [], b: [] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      crosstalkKey: null,
      crosstalkGroup: 'group'
    }

    render(<Reactable {...props} />)
    expect(window.crosstalk.SelectionHandle).toHaveBeenCalledTimes(1)
    expect(window.crosstalk.SelectionHandle).toHaveBeenCalledWith('group')
    expect(mockSelection.on).toHaveBeenCalledTimes(1)
  })

  it('does not create filter/selection handles when Crosstalk is not used', () => {
    const props = {
      data: { a: [1, 2] },
      columns: [{ name: 'a', accessor: 'a' }]
    }
    render(<Reactable {...props} />)
    expect(window.crosstalk.FilterHandle).not.toHaveBeenCalled()
    expect(window.crosstalk.SelectionHandle).not.toHaveBeenCalled()

    window.crosstalk = undefined
    render(<Reactable {...props} crosstalkGroup="group" />)
  })

  it('Crosstalk filtering works with column groups', () => {
    const props = {
      data: { a: [111, 222, 333], b: ['aaa', 'bbb', 'ccc'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      columnGroups: [{ name: 'group-a', columns: ['a', 'b'] }],
      crosstalkKey: ['key1', 'key2', 'key3'],
      crosstalkGroup: 'group'
    }
    const { container, getByText } = render(<Reactable {...props} />)
    expect(window.crosstalk.FilterHandle).toHaveBeenCalledTimes(1)
    expect(window.crosstalk.FilterHandle).toHaveBeenCalledWith('group')
    expect(mockFilter.on).toHaveBeenCalledTimes(1)

    const [filterType, onFilter] = mockFilter.on.mock.calls[0]
    expect(filterType).toEqual('change')

    // Filter one value
    act(() => onFilter({ sender: 'some other widget', value: ['key2'] }))
    expect(getRows(container)).toHaveLength(1)
    expect(getByText('bbb')).toBeVisible()
  })

  it('Crosstalk filtering works with grouping and sub-rows', () => {
    const props = {
      data: {
        group: ['group-x', 'group-x', 'group-x', 'group-y'],
        a: [1, 1, 2, 41],
        b: ['aaa', 'bbb', 'aaa', 'bbb']
      },
      columns: [
        { name: 'group', accessor: 'group' },
        { name: 'col-a', accessor: 'a', type: 'numeric', aggregate: 'sum', className: 'col-a' },
        { name: 'col-b', accessor: 'b', aggregate: () => 'ccc' }
      ],
      pivotBy: ['group'],
      crosstalkKey: ['key1', 'key2', 'key3', 'key4'],
      crosstalkGroup: 'group'
    }
    const { container } = render(<Reactable {...props} />)
    expect(window.crosstalk.FilterHandle).toHaveBeenCalledTimes(1)
    expect(window.crosstalk.FilterHandle).toHaveBeenCalledWith('group')
    expect(mockFilter.on).toHaveBeenCalledTimes(1)

    const [filterType, onFilter] = mockFilter.on.mock.calls[0]
    expect(filterType).toEqual('change')

    act(() => onFilter({ sender: 'some other widget', value: ['key1', 'key2'] }))
    expect(getRows(container)).toHaveLength(1)
    expect(getCellsText(container)).toEqual([
      '\u200bgroup-x (2)',
      '2', // Aggregate functions should work on filtered data
      'ccc'
    ])
  })

  it('does not show hidden Crosstalk column used for filtering', () => {
    const props = {
      data: { a: [111, 222, 333], b: ['aaa', 'bbb', 'ccc'], c: [5, 6, 7] },
      columns: [
        { name: 'col-a', accessor: 'a' },
        { name: 'col-b', accessor: 'b' },
        { name: 'col-c', accessor: 'c', show: false }
      ],
      columnGroups: [{ name: 'group-a', columns: ['a', 'b'] }],
      crosstalkKey: ['key1', 'key2', 'key3'],
      crosstalkGroup: 'group'
    }
    const { container, queryByText, rerender } = render(<Reactable {...props} />)
    expect(getColumnHeaders(container)).toHaveLength(2)
    expect(getGroupHeaders(container)).toHaveLength(1)

    // Hidden columns should still work
    expect(queryByText('col-c')).toBeFalsy()

    // Crosstalk column should stay hidden on rerender (in case hidden columns are reset)
    rerender(<Reactable {...props} defaultSelected={[1, 2]} />)
    expect(getColumnHeaders(container)).toHaveLength(2)
    expect(getGroupHeaders(container)).toHaveLength(1)
  })

  it('handles errors from setting Crosstalk selection', () => {
    const props = {
      data: { a: [111, 222, 333], b: ['aaa', 'bbb', 'ccc'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      selection: 'multiple',
      crosstalkKey: ['key1', 'key2', 'key3'],
      crosstalkGroup: 'group'
    }
    const { container } = render(<Reactable {...props} />)
    const selectRowCheckboxes = getSelectRowCheckboxes(container)
    const selectRow1Checkbox = selectRowCheckboxes[1]

    mockSelection.set = () => {
      throw new Error('error setting selection')
    }

    const originalError = console.error
    console.error = jest.fn()
    fireEvent.click(selectRow1Checkbox)
    expect(selectRow1Checkbox.checked).toEqual(true)
    expect(console.error).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenLastCalledWith(
      'Error selecting Crosstalk keys:',
      new Error('error setting selection')
    )
    console.error = originalError
  })

  it('handles errors from closing Crosstalk handles', () => {
    const props = {
      data: { a: [111, 222, 333], b: ['aaa', 'bbb', 'ccc'] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      selection: 'multiple',
      crosstalkKey: ['key1', 'key2', 'key3'],
      crosstalkGroup: 'group'
    }
    const { unmount } = render(<Reactable {...props} />)

    mockSelection.close = () => {
      throw new Error('error closing selection handle')
    }
    mockFilter.close = () => {
      throw new Error('error closing filter handle')
    }

    const originalError = console.error
    console.error = jest.fn()
    unmount()
    expect(console.error).toHaveBeenCalledTimes(2)
    expect(console.error).toHaveBeenNthCalledWith(
      1,
      'Error closing Crosstalk selection handle:',
      new Error('error closing selection handle')
    )
    expect(console.error).toHaveBeenNthCalledWith(
      2,
      'Error closing Crosstalk filter handle:',
      new Error('error closing filter handle')
    )
    console.error = originalError
  })
})

describe('reactable JavaScript API', () => {
  it('getInstance errs on invalid or non-existent instance', () => {
    expect(() => getInstance('does-not-exist')).toThrow(
      `reactable instance 'does-not-exist' not found`
    )
    expect(() => reactable.getState('does-not-exist')).toThrow(
      `reactable instance 'does-not-exist' not found`
    )
    expect(() => getInstance('')).toThrow('A reactable table ID must be provided')
    expect(() => getInstance()).toThrow('A reactable table ID must be provided')
  })

  it('getInstance works when table has an elementId', () => {
    const props = {
      data: { a: [111, 222] },
      columns: [{ name: 'a', accessor: 'a' }],
      elementId: 'my-tbl'
    }
    render(<Reactable {...props} />)
    const instance = getInstance('my-tbl')
    expect(instance).toBeTruthy()
    expect(instance.state).toBeTruthy()
  })

  it('getInstance works when table is a Shiny output', () => {
    const props = {
      data: { a: [111, 222] },
      columns: [{ name: 'a', accessor: 'a' }]
    }
    render(
      <div data-reactable-output="shiny-output-tbl">
        <Reactable {...props} />
      </div>
    )
    const instance = getInstance('shiny-output-tbl')
    expect(instance).toBeTruthy()
    expect(instance.state).toBeTruthy()
  })

  it('getInstance allows elementId to override Shiny output ID', () => {
    const props = {
      data: { a: [111, 222] },
      columns: [{ name: 'a', accessor: 'a' }],
      elementId: 'my-tbl'
    }
    render(
      <div data-reactable-output="shiny-output-tbl">
        <Reactable {...props} />
      </div>
    )
    const instance = getInstance('my-tbl')
    expect(instance).toBeTruthy()
    expect(instance.state).toBeTruthy()
    expect(() => getInstance('shiny-output-tbl')).toThrow(
      `reactable instance 'shiny-output-tbl' not found`
    )
  })

  it('instance is cleaned up when table unmounts', () => {
    const props = {
      data: { a: [111, 222] },
      columns: [{ name: 'a', accessor: 'a' }],
      elementId: 'my-table'
    }
    const { unmount } = render(<Reactable {...props} />)
    expect(getInstance('my-table')).toBeTruthy()
    unmount()
    expect(() => getInstance('my-table')).toThrow(`reactable instance 'my-table' not found`)
  })

  it('Reactable.getState', () => {
    const props = {
      data: { a: ['aaa1', 'bbb2'] },
      columns: [{ name: 'a', accessor: 'a' }],
      elementId: 'my-tbl'
    }
    render(<Reactable {...props} />)
    const state = reactable.getState('my-tbl')
    expect(state.page).toEqual(0)
    expect(state.pageSize).toEqual(10)
    expect(state.pages).toEqual(1)
    expect(state.sorted).toEqual([])
    expect(state.groupBy).toEqual([])
    expect(state.filters).toEqual([])
    expect(state.searchValue).toEqual(undefined)
    expect(state.selected).toEqual([])
    expect(state.pageRows).toEqual([{ a: 'aaa1' }, { a: 'bbb2' }])
    expect(state.sortedData).toEqual([{ a: 'aaa1' }, { a: 'bbb2' }])
    expect(state.data).toEqual([{ a: 'aaa1' }, { a: 'bbb2' }])
  })

  it('Reactable.setFilter', () => {
    const props = {
      data: { a: ['aaa1', 'bbb2'] },
      columns: [{ name: 'a', accessor: 'a' }],
      elementId: 'my-tbl'
    }
    const { container } = render(<Reactable {...props} />)
    expect(reactable.getState('my-tbl').filters).toEqual([])

    act(() => reactable.setFilter('my-tbl', 'a', 'bb'))
    expect(reactable.getState('my-tbl').filters).toEqual([{ id: 'a', value: 'bb' }])
    expect(getDataRows(container)).toHaveLength(1)

    // Empty value should not clear filter
    act(() => reactable.setFilter('my-tbl', 'a', ''))
    expect(reactable.getState('my-tbl').filters).toEqual([{ id: 'a', value: '' }])
    expect(getDataRows(container)).toHaveLength(2)

    // Clear filter
    act(() => reactable.setFilter('my-tbl', 'a', undefined))
    expect(reactable.getState('my-tbl').filters).toEqual([])
    expect(getDataRows(container)).toHaveLength(2)
  })

  it('Reactable.setAllFilters', () => {
    const props = {
      data: { a: ['aaa1', 'bbb2'] },
      columns: [{ name: 'a', accessor: 'a' }],
      elementId: 'my-tbl'
    }
    const { container } = render(<Reactable {...props} />)
    expect(reactable.getState('my-tbl').filters).toEqual([])

    act(() => reactable.setAllFilters('my-tbl', [{ id: 'a', value: 'cc' }]))
    expect(reactable.getState('my-tbl').filters).toEqual([{ id: 'a', value: 'cc' }])
    expect(getDataRows(container)).toHaveLength(0)

    act(() => reactable.setAllFilters('my-tbl', []))
    expect(reactable.getState('my-tbl').filters).toEqual([])
    expect(getDataRows(container)).toHaveLength(2)
  })

  it('Reactable.setSearch', () => {
    const props = {
      data: { a: ['aaa1', 'bbb2'] },
      columns: [{ name: 'a', accessor: 'a' }],
      elementId: 'my-tbl'
    }
    const { container } = render(<Reactable {...props} />)
    expect(reactable.getState('my-tbl').searchValue).toEqual(undefined)

    act(() => reactable.setSearch('my-tbl', 'aaa'))
    expect(reactable.getState('my-tbl').searchValue).toEqual('aaa')
    expect(getDataRows(container)).toHaveLength(1)

    // Empty value should not clear search
    act(() => reactable.setSearch('my-tbl', ''))
    expect(reactable.getState('my-tbl').searchValue).toEqual('')
    expect(getDataRows(container)).toHaveLength(2)

    // Clear search
    act(() => reactable.setSearch('my-tbl', undefined))
    expect(reactable.getState('my-tbl').searchValue).toEqual(undefined)
    expect(getDataRows(container)).toHaveLength(2)
  })

  it('Reactable.toggleGroupBy', () => {
    const props = {
      data: { a: ['aa', 'aa', 'bb'], b: [1, 2, 3] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      elementId: 'my-tbl'
    }
    const { container } = render(<Reactable {...props} />)
    expect(reactable.getState('my-tbl').groupBy).toEqual([])

    act(() => reactable.toggleGroupBy('my-tbl', 'a'))
    expect(reactable.getState('my-tbl').groupBy).toEqual(['a'])
    expect(getRows(container)).toHaveLength(2)
    expect(getExpanders(container)).toHaveLength(2)

    act(() => reactable.toggleGroupBy('my-tbl', 'a'))
    expect(reactable.getState('my-tbl').groupBy).toEqual([])
    expect(getRows(container)).toHaveLength(3)
    expect(getExpanders(container)).toHaveLength(0)

    act(() => reactable.toggleGroupBy('my-tbl', 'b'))
    act(() => reactable.toggleGroupBy('my-tbl', 'a'))
    expect(reactable.getState('my-tbl').groupBy).toEqual(['b', 'a'])
  })

  it('Reactable.setGroupBy', () => {
    const props = {
      data: { a: ['aa', 'aa', 'bb'], b: [1, 2, 3] },
      columns: [
        { name: 'a', accessor: 'a' },
        { name: 'b', accessor: 'b' }
      ],
      elementId: 'my-tbl'
    }
    const { container } = render(<Reactable {...props} />)
    expect(reactable.getState('my-tbl').groupBy).toEqual([])

    act(() => reactable.setGroupBy('my-tbl', ['a']))
    expect(reactable.getState('my-tbl').groupBy).toEqual(['a'])
    expect(getRows(container)).toHaveLength(2)
    expect(getExpanders(container)).toHaveLength(2)

    act(() => reactable.setGroupBy('my-tbl', []))
    expect(reactable.getState('my-tbl').groupBy).toEqual([])
    expect(getRows(container)).toHaveLength(3)
    expect(getExpanders(container)).toHaveLength(0)

    act(() => reactable.setGroupBy('my-tbl', ['b', 'a']))
    expect(reactable.getState('my-tbl').groupBy).toEqual(['b', 'a'])
  })

  it('Reactable.toggleAllRowsExpanded', () => {
    const props = {
      data: { a: ['aa', 'aa', 'bb'] },
      columns: [{ name: 'a', accessor: 'a', details: ['detail', 'detail', 'detail'] }],
      elementId: 'my-tbl'
    }
    const { queryAllByText } = render(<Reactable {...props} />)
    expect(queryAllByText('detail')).toHaveLength(0)

    act(() => reactable.toggleAllRowsExpanded('my-tbl'))
    expect(queryAllByText('detail')).toHaveLength(3)

    act(() => reactable.toggleAllRowsExpanded('my-tbl', true))
    expect(queryAllByText('detail')).toHaveLength(3)

    act(() => reactable.toggleAllRowsExpanded('my-tbl'))
    expect(queryAllByText('detail')).toHaveLength(0)

    act(() => reactable.toggleAllRowsExpanded('my-tbl', true))
    expect(queryAllByText('detail')).toHaveLength(3)

    act(() => reactable.toggleAllRowsExpanded('my-tbl', false))
    expect(queryAllByText('detail')).toHaveLength(0)
  })

  it('Reactable.downloadDataCSV', () => {
    const props = {
      data: { a: ['a11', 'a12', 'a23'], b: [2, 3, 3] },
      columns: [
        { name: 'a', accessor: 'a' },
        // Should include hidden columns
        { name: 'b', accessor: 'b', show: false },
        // Should ignore columns without data
        { name: '', accessor: '.selection' },
        { name: '', accessor: '.details' }
      ],
      searchable: true,
      elementId: 'my-tbl'
    }
    const { container, rerender } = render(<Reactable {...props} />)

    reactable.downloadDataCSV('my-tbl')
    expect(downloadCSV).toHaveBeenCalledTimes(1)
    expect(downloadCSV).toHaveBeenLastCalledWith('a,b\na11,2\na12,3\na23,3\n', 'data.csv')

    reactable.downloadDataCSV('my-tbl', 'my_custom_filename.csv')
    expect(downloadCSV).toHaveBeenCalledTimes(2)
    expect(downloadCSV).toHaveBeenLastCalledWith(
      'a,b\na11,2\na12,3\na23,3\n',
      'my_custom_filename.csv'
    )

    // Should download filtered data
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'a1' } })
    // Should ignore sort order and use original order of data
    const sortableHeaders = getSortableHeaders(container)
    fireEvent.click(sortableHeaders[0])
    reactable.downloadDataCSV('my-tbl')
    expect(downloadCSV).toHaveBeenCalledTimes(3)
    expect(downloadCSV).toHaveBeenLastCalledWith('a,b\na11,2\na12,3\n', 'data.csv')

    // Should use flattened rows and exclude aggregated rows when grouped
    rerender(<Reactable {...props} pivotBy={['b']} />)
    reactable.downloadDataCSV('my-tbl')
    expect(downloadCSV).toHaveBeenCalledTimes(4)
    expect(downloadCSV).toHaveBeenLastCalledWith('a,b\na11,2\na12,3\n', 'data.csv')
  })
})
