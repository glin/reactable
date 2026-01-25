import React from 'react'
import reactR from 'reactR'
import { render, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import { Reactable } from '../Reactable'

jest.mock('reactR')
reactR.hydrate = (components, tag) => tag

// Helper functions
const getRoot = container => container.querySelector('.Reactable.ReactTable')
const getTable = container => container.querySelector('.rt-table')
const getTbody = container => container.querySelector('.rt-tbody')
const getRows = container => container.querySelectorAll('.rt-tbody .rt-tr')
const getDataRows = container => container.querySelectorAll('.rt-tbody .rt-tr:not(.rt-tr-pad)')
const getRowGroups = container => container.querySelectorAll('.rt-tbody .rt-tr-group')
const getNoData = container => container.querySelector('.rt-no-data')
const getPagination = container => container.querySelector('.rt-pagination')
const getSelectRowCheckboxes = container =>
  container.querySelectorAll('.rt-select-input[type="checkbox"]')
const getSelectRowRadios = container => container.querySelectorAll('.rt-select-input[type="radio"]')

// Mock scroll element for virtualizer - provide dimensions
beforeAll(() => {
  // Mock getBoundingClientRect for the table element
  Element.prototype.getBoundingClientRect = jest.fn(() => ({
    width: 500,
    height: 400,
    top: 0,
    left: 0,
    bottom: 400,
    right: 500
  }))

  // Mock offsetHeight and scrollHeight for scroll calculations
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: function () {
      return this.classList.contains('rt-table') ? 400 : 36
    }
  })

  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get: function () {
      return this.classList.contains('rt-table') ? 400 : 36
    }
  })

  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: function () {
      return this.classList.contains('rt-table') ? 400 : 36
    }
  })
})

describe('virtual scrolling', () => {
  describe('basic functionality', () => {
    it('renders table with virtual=true', () => {
      const props = {
        data: { a: Array.from({ length: 100 }, (_, i) => i + 1) },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const tbody = getTbody(container)
      expect(tbody).toHaveClass('rt-tbody-virtual')

      // Should have a spacer div inside tbody
      const spacerDiv = tbody.querySelector(':scope > div')
      expect(spacerDiv).toBeInTheDocument()
      expect(spacerDiv).toHaveStyle('position: relative')
      expect(spacerDiv).toHaveStyle('width: 100%')
    })

    it('renders rows with absolute positioning in virtual mode', () => {
      const props = {
        data: { a: Array.from({ length: 100 }, (_, i) => i + 1) },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const rowGroups = getRowGroups(container)
      // Should render some rows (visible + overscan)
      expect(rowGroups.length).toBeGreaterThan(0)

      // Rows should have transform style for positioning
      rowGroups.forEach(rowGroup => {
        expect(rowGroup.style.position).toBe('absolute')
        expect(rowGroup.style.transform).toMatch(/translateY\(\d+px\)/)
      })
    })

    it('works without explicit height', () => {
      const props = {
        data: { a: Array.from({ length: 50 }, (_, i) => i + 1) },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true
      }
      const { container } = render(<Reactable {...props} />)

      const tbody = getTbody(container)
      expect(tbody).toHaveClass('rt-tbody-virtual')
    })

    it('renders all rows when dataset is small', () => {
      const props = {
        data: { a: [1, 2, 3, 4, 5] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const tbody = getTbody(container)
      expect(tbody).toHaveClass('rt-tbody-virtual')

      // With only 5 rows, all should be rendered
      const rowGroups = getRowGroups(container)
      expect(rowGroups).toHaveLength(5)
    })

    it('shows no data message when empty', () => {
      const props = {
        data: { a: [] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const tbody = getTbody(container)
      expect(tbody).toHaveClass('rt-tbody-virtual')
      expect(tbody).toHaveClass('rt-tbody-no-data')

      const noData = getNoData(container)
      expect(noData).toBeInTheDocument()
      expect(noData.textContent).toBe('No rows found')
    })
  })

  describe('pagination with virtual', () => {
    it('works with pagination enabled', () => {
      const props = {
        data: { a: Array.from({ length: 100 }, (_, i) => i + 1) },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        pagination: true,
        defaultPageSize: 50,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const tbody = getTbody(container)
      expect(tbody).toHaveClass('rt-tbody-virtual')

      // Pagination should be present
      const pagination = getPagination(container)
      expect(pagination).toBeInTheDocument()
    })

    it('virtualizes rows on each page', () => {
      const props = {
        data: { a: Array.from({ length: 200 }, (_, i) => i + 1) },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        pagination: true,
        defaultPageSize: 100,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const tbody = getTbody(container)
      expect(tbody).toHaveClass('rt-tbody-virtual')

      // Should not render all 100 rows on the page - only visible + overscan
      const rowGroups = getRowGroups(container)
      expect(rowGroups.length).toBeLessThan(100)
    })
  })

  describe('styling', () => {
    it('applies striped row styles', () => {
      const props = {
        data: { a: [1, 2, 3, 4, 5, 6] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        striped: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const rows = getRows(container)
      expect(rows[0]).toHaveClass('rt-tr-striped')
      expect(rows[1]).not.toHaveClass('rt-tr-striped')
      expect(rows[2]).toHaveClass('rt-tr-striped')
      expect(rows[3]).not.toHaveClass('rt-tr-striped')
    })

    it('applies highlight row styles', () => {
      const props = {
        data: { a: [1, 2, 3, 4] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        highlight: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const rows = getDataRows(container)
      rows.forEach(row => expect(row).toHaveClass('rt-tr-highlight'))
    })

    it('applies compact mode', () => {
      const props = {
        data: { a: [1, 2, 3, 4] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        compact: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const root = getRoot(container)
      expect(root).toHaveClass('rt-compact')

      const tbody = getTbody(container)
      expect(tbody).toHaveClass('rt-tbody-virtual')
    })

    it('applies custom row className', () => {
      const props = {
        data: { a: [1, 2, 3] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        rowClassName: 'custom-row',
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const rows = getRows(container)
      rows.forEach(row => expect(row).toHaveClass('custom-row'))
    })

    it('applies row className from function', () => {
      const props = {
        data: { a: [1, 2, 3] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        rowClassName: (rowInfo, state) => {
          if (rowInfo && rowInfo.index === 0) return 'first-row'
          return 'other-row'
        },
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const rows = getRows(container)
      expect(rows[0]).toHaveClass('first-row')
      expect(rows[1]).toHaveClass('other-row')
      expect(rows[2]).toHaveClass('other-row')
    })

    it('applies custom row style', () => {
      const props = {
        data: { a: [1, 2, 3] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        rowStyle: { backgroundColor: 'red' },
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const rows = getRows(container)
      rows.forEach(row => expect(row).toHaveStyle('background-color: red'))
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

    it('multiple selection works with virtual scrolling', () => {
      const props = {
        data: { a: [1, 2, 3, 4, 5] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        selection: 'multiple',
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const checkboxes = getSelectRowCheckboxes(container)
      // 1 select-all + 5 row checkboxes
      expect(checkboxes).toHaveLength(6)

      // Click first row checkbox
      fireEvent.click(checkboxes[1])
      expect(checkboxes[1].checked).toBe(true)

      const rows = getRows(container)
      expect(rows[0]).toHaveClass('rt-tr-selected')
    })

    it('single selection works with virtual scrolling', () => {
      const props = {
        data: { a: [1, 2, 3, 4, 5] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        selection: 'single',
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const radios = getSelectRowRadios(container)
      expect(radios).toHaveLength(5)

      // Click first row radio
      fireEvent.click(radios[0])
      expect(radios[0].checked).toBe(true)

      const rows = getRows(container)
      expect(rows[0]).toHaveClass('rt-tr-selected')

      // Click second row radio - first should be deselected
      fireEvent.click(radios[1])
      expect(radios[0].checked).toBe(false)
      expect(radios[1].checked).toBe(true)
    })

    it('default selected rows work with virtual scrolling', () => {
      const props = {
        data: { a: [1, 2, 3, 4, 5] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        selection: 'multiple',
        defaultSelected: [0, 2],
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const checkboxes = getSelectRowCheckboxes(container)
      expect(checkboxes[1].checked).toBe(true) // Row 0
      expect(checkboxes[2].checked).toBe(false) // Row 1
      expect(checkboxes[3].checked).toBe(true) // Row 2

      const rows = getRows(container)
      expect(rows[0]).toHaveClass('rt-tr-selected')
      expect(rows[1]).not.toHaveClass('rt-tr-selected')
      expect(rows[2]).toHaveClass('rt-tr-selected')
    })
  })

  describe('sorting and filtering', () => {
    it('sorting works with virtual scrolling', () => {
      const props = {
        data: { a: [3, 1, 2, 5, 4] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      // Click header to sort
      const header = container.querySelector('.rt-th[aria-sort]')
      fireEvent.click(header)

      // Check that rows are sorted
      const cells = container.querySelectorAll('.rt-tbody .rt-td')
      expect(cells[0].textContent).toBe('1')
      expect(cells[1].textContent).toBe('2')
      expect(cells[2].textContent).toBe('3')
    })

    it('filtering works with virtual scrolling', () => {
      const props = {
        data: { a: [1, 2, 3, 4, 5, 10, 20, 30] },
        columns: [{ name: 'a', id: 'a', filterable: true }],
        virtual: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      // Enter filter value
      const filterInput = container.querySelector('.rt-filter')
      fireEvent.change(filterInput, { target: { value: '1' } })

      // Should only show rows containing '1': 1, 10
      const rowGroups = getRowGroups(container)
      expect(rowGroups).toHaveLength(2)
    })

    it('global search works with virtual scrolling', () => {
      const props = {
        data: {
          a: ['apple', 'banana', 'cherry', 'date'],
          b: ['red', 'yellow', 'red', 'brown']
        },
        columns: [
          { name: 'a', id: 'a' },
          { name: 'b', id: 'b' }
        ],
        virtual: true,
        searchable: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      // Enter search value
      const searchInput = container.querySelector('.rt-search')
      fireEvent.change(searchInput, { target: { value: 'red' } })

      // Should show rows with 'red': apple and cherry
      const rowGroups = getRowGroups(container)
      expect(rowGroups).toHaveLength(2)
    })
  })

  describe('non-virtual mode', () => {
    it('does not apply virtual class when virtual=false', () => {
      const props = {
        data: { a: [1, 2, 3, 4, 5] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: false,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const tbody = getTbody(container)
      expect(tbody).not.toHaveClass('rt-tbody-virtual')
    })

    it('does not apply virtual class by default', () => {
      const props = {
        data: { a: [1, 2, 3, 4, 5] },
        columns: [{ name: 'a', id: 'a' }],
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const tbody = getTbody(container)
      expect(tbody).not.toHaveClass('rt-tbody-virtual')
    })
  })

  describe('DOM structure', () => {
    it('has correct DOM structure in virtual mode', () => {
      const props = {
        data: { a: [1, 2, 3, 4, 5] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      // Root structure
      const root = getRoot(container)
      expect(root).toBeInTheDocument()

      // Table structure
      const table = getTable(container)
      expect(table).toBeInTheDocument()

      // Tbody with virtual class
      const tbody = getTbody(container)
      expect(tbody).toHaveClass('rt-tbody')
      expect(tbody).toHaveClass('rt-tbody-virtual')

      // Spacer div inside tbody
      const spacerDiv = tbody.querySelector(':scope > div')
      expect(spacerDiv).toBeInTheDocument()
      expect(spacerDiv).toHaveStyle('position: relative')

      // Row groups inside spacer
      const rowGroups = spacerDiv.querySelectorAll('.rt-tr-group')
      expect(rowGroups.length).toBeGreaterThan(0)
    })

    it('spacer div has correct total height', () => {
      const rowCount = 100
      const rowHeight = 36 // default row height
      const props = {
        data: { a: Array.from({ length: rowCount }, (_, i) => i + 1) },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        pagination: false, // Disable pagination to show all rows
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const tbody = getTbody(container)
      const spacerDiv = tbody.querySelector(':scope > div')

      // Total height should be rowCount * rowHeight
      const expectedHeight = rowCount * rowHeight
      expect(spacerDiv).toHaveStyle(`height: ${expectedHeight}px`)
    })

    it('spacer div has correct total height in compact mode', () => {
      const rowCount = 100
      const rowHeight = 30 // compact row height
      const props = {
        data: { a: Array.from({ length: rowCount }, (_, i) => i + 1) },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        compact: true,
        pagination: false, // Disable pagination to show all rows
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const tbody = getTbody(container)
      const spacerDiv = tbody.querySelector(':scope > div')

      // Total height should be rowCount * compact rowHeight
      const expectedHeight = rowCount * rowHeight
      expect(spacerDiv).toHaveStyle(`height: ${expectedHeight}px`)
    })
  })
})
