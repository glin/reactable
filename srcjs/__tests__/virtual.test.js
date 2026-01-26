import React from 'react'
import reactR from 'reactR'
import { render, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import { Reactable } from '../Reactable'
import {
  getRoot,
  getTable,
  getTbody,
  getRows,
  getDataRows,
  getRowGroups,
  getNoData,
  getPagination,
  getSelectRowCheckboxes,
  getHeaderRows,
  getSortableHeaders,
  getCells,
  getFilters,
  getSearchInput,
  getExpanderIcons,
  getRowDetails,
  getVirtualSpacer
} from './utils/test-utils'

jest.mock('reactR')
reactR.hydrate = (components, tag) => tag

// Mock scroll element for virtualizer - provide dimensions
beforeAll(() => {
  // Mock getBoundingClientRect - return appropriate height based on element type
  Element.prototype.getBoundingClientRect = jest.fn(function () {
    // Row groups should return row height (36px default, 30px compact)
    if (this.classList && this.classList.contains('rt-tr-group')) {
      // Check if compact mode by looking for rt-compact class on ancestor
      const isCompact = this.closest && this.closest('.rt-compact')
      const rowHeight = isCompact ? 30 : 36
      return {
        width: 500,
        height: rowHeight,
        top: 0,
        left: 0,
        bottom: rowHeight,
        right: 500
      }
    }
    // Table container
    return {
      width: 500,
      height: 400,
      top: 0,
      left: 0,
      bottom: 400,
      right: 500
    }
  })

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

      // Should have a spacer div inside tbody
      const spacerDiv = getVirtualSpacer(container)
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

      // Virtual mode should still have the spacer div even without explicit height
      const spacerDiv = getVirtualSpacer(container)
      expect(spacerDiv).toHaveStyle('position: relative')
    })

    it('renders all rows when dataset is small', () => {
      const props = {
        data: { a: [1, 2, 3, 4, 5] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

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
      expect(tbody).toHaveClass('rt-tbody-no-data')

      const noData = getNoData(container)
      expect(noData).toBeInTheDocument()
      expect(noData.textContent).toBe('No rows found')
    })
  })

  describe('ARIA attributes', () => {
    it('adds aria-rowcount and aria-rowindex in virtual mode', () => {
      const props = {
        data: { a: Array.from({ length: 100 }, (_, i) => i + 1) },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const table = getTable(container)
      // aria-rowcount = 100 data rows + 1 header row
      expect(table).toHaveAttribute('aria-rowcount', '101')

      const headerRows = getHeaderRows(container)
      expect(headerRows[0]).toHaveAttribute('aria-rowindex', '1')

      const dataRows = getRows(container)
      // First data row should have aria-rowindex = 2 (after header row)
      expect(dataRows[0]).toHaveAttribute('aria-rowindex', '2')
    })

    it('does not add ARIA attributes in non-virtual mode', () => {
      const props = {
        data: { a: [1, 2, 3] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: false
      }
      const { container } = render(<Reactable {...props} />)

      const table = getTable(container)
      expect(table).not.toHaveAttribute('aria-rowcount')

      const headerRows = getHeaderRows(container)
      expect(headerRows[0]).not.toHaveAttribute('aria-rowindex')

      const dataRows = getDataRows(container)
      dataRows.forEach(row => {
        expect(row).not.toHaveAttribute('aria-rowindex')
      })
    })

    it('handles aria-rowcount with column groups (multiple header rows)', () => {
      const props = {
        data: {
          a: Array.from({ length: 50 }, (_, i) => i + 1),
          b: Array.from({ length: 50 }, (_, i) => i + 1)
        },
        columns: [
          { name: 'a', id: 'a' },
          { name: 'b', id: 'b' }
        ],
        columnGroups: [{ name: 'Group', columns: ['a', 'b'] }],
        virtual: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const table = getTable(container)
      // aria-rowcount = 50 data rows + 2 header rows (group header + column header)
      expect(table).toHaveAttribute('aria-rowcount', '52')

      const headerRows = getHeaderRows(container)
      expect(headerRows[0]).toHaveAttribute('aria-rowindex', '1')
      expect(headerRows[1]).toHaveAttribute('aria-rowindex', '2')

      const dataRows = getRows(container)
      // First data row should have aria-rowindex = 3 (after 2 header rows)
      expect(dataRows[0]).toHaveAttribute('aria-rowindex', '3')
    })

    it('aria-rowcount excludes pad rows', () => {
      const props = {
        data: { a: [1, 2, 3, 4, 5] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        pagination: true,
        defaultPageSize: 5,
        minRows: 10,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const table = getTable(container)
      // aria-rowcount should only count data rows + header rows, not pad rows
      // aria-rowcount = 5 data rows + 1 header row = 6
      expect(table).toHaveAttribute('aria-rowcount', '6')

      // Verify pad rows exist but don't have aria-rowindex
      const rowGroups = getRowGroups(container)
      expect(rowGroups).toHaveLength(10) // 5 data + 5 pad

      const padRows = Array.from(rowGroups).filter(rg => rg.hasAttribute('aria-hidden'))
      expect(padRows).toHaveLength(5)

      // Pad rows should not have aria-rowindex on their tr elements
      padRows.forEach(padRow => {
        const tr = padRow.querySelector('.rt-tr')
        expect(tr).not.toHaveAttribute('aria-rowindex')
      })
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

      // Should not render all 100 rows on the page - only visible + overscan
      const rowGroups = getRowGroups(container)
      expect(rowGroups.length).toBeLessThan(100)
    })

    it('renders pad rows when minRows exceeds page size', () => {
      const props = {
        data: { a: [1, 2, 3, 4, 5] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        pagination: true,
        defaultPageSize: 5,
        minRows: 10,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const rowGroups = getRowGroups(container)
      // Should have 5 data rows + 5 pad rows = 10 total
      expect(rowGroups).toHaveLength(10)

      // All rows (data + pad) should be absolutely positioned
      rowGroups.forEach(rowGroup => {
        expect(rowGroup.style.position).toBe('absolute')
        expect(rowGroup.style.transform).toMatch(/translateY\(\d+px\)/)
      })

      // Pad rows should have aria-hidden
      const padRows = Array.from(rowGroups).filter(rg => rg.hasAttribute('aria-hidden'))
      expect(padRows).toHaveLength(5)

      // Pad rows should contain rt-tr-pad class
      padRows.forEach(padRow => {
        const tr = padRow.querySelector('.rt-tr')
        expect(tr).toHaveClass('rt-tr-pad')
      })
    })

    it('does not render pad rows when data rows exceed minRows', () => {
      const props = {
        data: { a: Array.from({ length: 20 }, (_, i) => i + 1) },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        pagination: true,
        defaultPageSize: 20,
        minRows: 5,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const rowGroups = getRowGroups(container)
      // No pad rows should be present
      const padRows = Array.from(rowGroups).filter(rg => rg.hasAttribute('aria-hidden'))
      expect(padRows).toHaveLength(0)
    })
  })

  describe('styling', () => {
    it('applies striped and highlight row styles', () => {
      const props = {
        data: { a: [1, 2, 3, 4, 5, 6] },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        striped: true,
        highlight: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const rows = getRows(container)
      // Striped applies to even-indexed rows (0, 2, 4)
      expect(rows[0]).toHaveClass('rt-tr-striped')
      expect(rows[1]).not.toHaveClass('rt-tr-striped')
      expect(rows[2]).toHaveClass('rt-tr-striped')
      // Highlight applies to all rows
      rows.forEach(row => expect(row).toHaveClass('rt-tr-highlight'))
    })

    it('applies compact mode with correct row height', () => {
      const rowCount = 100
      const rowHeight = 30 // compact row height
      const props = {
        data: { a: Array.from({ length: rowCount }, (_, i) => i + 1) },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        compact: true,
        pagination: false,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      const root = getRoot(container)
      expect(root).toHaveClass('rt-compact')

      // Spacer height should use compact row height
      const spacerDiv = getVirtualSpacer(container)
      const expectedHeight = rowCount * rowHeight
      expect(spacerDiv).toHaveStyle(`height: ${expectedHeight}px`)
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

    it('row selection works with virtual scrolling', () => {
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
      // 1 select-all + 5 row checkboxes
      expect(checkboxes).toHaveLength(6)

      // Default selected rows
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
      const sortableHeaders = getSortableHeaders(container)
      fireEvent.click(sortableHeaders[0])

      // Check that rows are sorted
      const cells = getCells(container)
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
      const filters = getFilters(container)
      fireEvent.change(filters[0], { target: { value: '1' } })

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
      const searchInput = getSearchInput(container)
      fireEvent.change(searchInput, { target: { value: 'red' } })

      // Should show rows with 'red': apple and cherry
      const rowGroups = getRowGroups(container)
      expect(rowGroups).toHaveLength(2)
    })
  })

  describe('non-virtual mode', () => {
    it('does not virtualize when virtual=false or undefined', () => {
      // Test virtual=false
      const { container: container1 } = render(
        <Reactable
          data={{ a: [1, 2, 3, 4, 5] }}
          columns={[{ name: 'a', id: 'a' }]}
          virtual={false}
          height={400}
        />
      )
      expect(getVirtualSpacer(container1)).not.toBeInTheDocument()

      // Test default (virtual undefined)
      const { container: container2 } = render(
        <Reactable
          data={{ a: [1, 2, 3, 4, 5] }}
          columns={[{ name: 'a', id: 'a' }]}
          height={400}
        />
      )
      expect(getVirtualSpacer(container2)).not.toBeInTheDocument()
    })
  })

  describe('DOM structure', () => {
    it('has correct DOM structure with spacer div in virtual mode', () => {
      const rowCount = 100
      const rowHeight = 36 // default row height
      const props = {
        data: { a: Array.from({ length: rowCount }, (_, i) => i + 1) },
        columns: [{ name: 'a', id: 'a' }],
        virtual: true,
        pagination: false,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      // Root and table structure
      expect(getRoot(container)).toBeInTheDocument()
      expect(getTable(container)).toBeInTheDocument()

      // Tbody with virtual spacer
      const tbody = getTbody(container)
      expect(tbody).toHaveClass('rt-tbody')

      // Spacer div inside tbody with correct height
      const spacerDiv = getVirtualSpacer(container)
      expect(spacerDiv).toBeInTheDocument()
      expect(spacerDiv).toHaveStyle('position: relative')
      expect(spacerDiv).toHaveStyle(`height: ${rowCount * rowHeight}px`)

      // Row groups inside spacer
      expect(getRowGroups(container).length).toBeGreaterThan(0)
    })
  })

  describe('groupBy with virtual', () => {
    it('renders grouped table with virtual scrolling', () => {
      const props = {
        data: {
          category: ['A', 'A', 'B', 'B', 'C'],
          value: [1, 2, 3, 4, 5]
        },
        columns: [
          { name: 'category', id: 'category' },
          { name: 'value', id: 'value' }
        ],
        groupBy: ['category'],
        defaultExpanded: true,
        paginateSubRows: true,
        virtual: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      // Virtual mode should have the spacer div
      const spacerDiv = getVirtualSpacer(container)
      expect(spacerDiv).toHaveStyle('position: relative')

      // With defaultExpanded, should show group headers + sub-rows
      const rowGroups = getRowGroups(container)
      // 3 groups + 5 sub-rows = 8 total rows (all visible with small dataset)
      expect(rowGroups.length).toBeGreaterThan(3)
    })
  })

  describe('details with virtual', () => {
    it('renders and expands row details with virtual scrolling', () => {
      const props = {
        data: { a: [1, 2, 3, 4, 5] },
        columns: [
          {
            name: 'a',
            id: 'a',
            details: ['Detail 1', 'Detail 2', 'Detail 3', 'Detail 4', 'Detail 5']
          }
        ],
        virtual: true,
        height: 400
      }
      const { container } = render(<Reactable {...props} />)

      // Should render rows with expanders
      const expanders = getExpanderIcons(container)
      expect(expanders.length).toBeGreaterThan(0)

      // Initially no details visible
      expect(getRowDetails(container)).toHaveLength(0)

      // Click first expander
      fireEvent.click(expanders[0])

      // Now details should be visible
      expect(getRowDetails(container)).toHaveLength(1)
    })
  })
})
