import React from 'react'
import reactR from 'reactR'
import { render, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import { Reactable } from '../Reactable'

import { getRows, getCellsText, getPageInfo, getNextButton, getRoot } from './utils/test-utils'

jest.mock('reactR')
reactR.hydrate = (components, tag) => tag

afterEach(() => {
  jest.clearAllMocks()
  delete window.__ReactableDuckDB
})

// Helper to create a mock DuckDB engine that returns predictable data
function createMockEngine(totalRows = 20) {
  const allRows = Array.from({ length: totalRows }, (_, i) => ({
    a: i + 1,
    b: `row${i + 1}`
  }))

  const mockEngine = {
    totalRowCount: totalRows,
    init: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockImplementation(({ pageIndex, pageSize }) => {
      const start = pageIndex * pageSize
      const rows = allRows.slice(start, start + pageSize)
      return Promise.resolve({ rows, rowCount: totalRows })
    }),
    destroy: jest.fn().mockResolvedValue(undefined)
  }

  window.__ReactableDuckDB = {
    DuckDBEngine: jest.fn().mockReturnValue(mockEngine),
    wasmBasePath: '/mock/path/'
  }

  return mockEngine
}

const baseColumns = [
  { name: 'colA', id: 'a', type: 'numeric' },
  { name: 'colB', id: 'b' }
]

describe('DuckDB engine', () => {
  it('renders pre-rendered first page immediately', () => {
    createMockEngine(20)

    // Simulate pre-rendered first page data (column-oriented, as R's toJSON produces)
    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        engine="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    // First page should render immediately without waiting for DuckDB
    expect(getRows(container)).toHaveLength(5)
    expect(getCellsText(container)).toEqual([
      '1',
      'row1',
      '2',
      'row2',
      '3',
      'row3',
      '4',
      'row4',
      '5',
      'row5'
    ])
  })

  it('skips initial DuckDB query when first page is pre-rendered', async () => {
    const mockEngine = createMockEngine(20)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        engine="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    // Wait for DuckDB to initialize
    await waitFor(() => {
      expect(mockEngine.init).toHaveBeenCalledWith('mock-base64-arrow-data', '/mock/path/')
    })

    // The initial page 0 query should NOT have been made (pre-rendered data is used instead)
    expect(mockEngine.query).not.toHaveBeenCalled()
  })

  it('queries DuckDB on page navigation', async () => {
    const mockEngine = createMockEngine(20)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        engine="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        showPagination
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    // First page renders immediately
    expect(getRows(container)).toHaveLength(5)

    // Wait for DuckDB init
    await waitFor(() => {
      expect(mockEngine.init).toHaveBeenCalled()
    })

    // Navigate to next page
    const nextButton = getNextButton(container)
    act(() => {
      nextButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await waitFor(() => {
      expect(mockEngine.query).toHaveBeenCalledWith({ pageIndex: 1, pageSize: 5 })
    })

    await waitFor(() => {
      expect(getCellsText(container)).toEqual([
        '6',
        'row6',
        '7',
        'row7',
        '8',
        'row8',
        '9',
        'row9',
        '10',
        'row10'
      ])
    })
  })

  it('shows correct page info immediately with pre-rendered data', () => {
    createMockEngine(50)

    const firstPageData = {
      a: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      b: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        engine="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={10}
        showPagination
        serverRowCount={50}
        serverMaxRowCount={50}
      />
    )

    // Page info should show immediately (not after async DuckDB init)
    const pageInfo = getPageInfo(container)
    expect(pageInfo).toHaveTextContent('1–10 of 50 rows')
  })

  it('cleans up DuckDB engine on unmount', async () => {
    const mockEngine = createMockEngine(5)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { unmount } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        engine="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={5}
        serverMaxRowCount={5}
      />
    )

    await waitFor(() => {
      expect(mockEngine.init).toHaveBeenCalled()
    })

    unmount()
    expect(mockEngine.destroy).toHaveBeenCalled()
  })

  it('handles empty data (0 rows)', async () => {
    createMockEngine(0)

    // Empty pre-rendered data (column-oriented with empty arrays)
    const emptyData = { a: [], b: [] }

    const { container } = render(
      <Reactable
        data={emptyData}
        columns={baseColumns}
        engine="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={10}
        serverRowCount={0}
        serverMaxRowCount={0}
      />
    )

    const rows = getRows(container, ':not(.rt-tr-pad)')
    expect(rows).toHaveLength(0)
  })

  it('renders without DuckDB when engine is not set', () => {
    const props = {
      data: { a: [1, 2, 3], b: ['x', 'y', 'z'] },
      columns: baseColumns,
      defaultPageSize: 10
    }
    const { container } = render(<Reactable {...props} />)
    const root = getRoot(container)
    expect(root).toBeVisible()
    // Data should be rendered normally from the data prop
    expect(getCellsText(container)).toEqual(['1', 'x', '2', 'y', '3', 'z'])

    // __ReactableDuckDB should not have been accessed
    expect(window.__ReactableDuckDB).toBeUndefined()
  })

  it('logs error when __ReactableDuckDB is not available', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const firstPageData = { a: [1], b: ['row1'] }

    render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        engine="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={1}
        serverMaxRowCount={1}
      />
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'DuckDB-WASM engine not loaded. Make sure the duckdb-wasm dependency is included.'
      )
    })

    consoleSpy.mockRestore()
  })

  it('handles DuckDB initialization failure gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const mockEngine = {
      totalRowCount: 0,
      init: jest.fn().mockRejectedValue(new Error('WASM load failed')),
      query: jest.fn(),
      destroy: jest.fn().mockResolvedValue(undefined)
    }

    window.__ReactableDuckDB = {
      DuckDBEngine: jest.fn().mockReturnValue(mockEngine),
      wasmBasePath: '/mock/path/'
    }

    const firstPageData = { a: [1], b: ['row1'] }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        engine="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={1}
        serverMaxRowCount={1}
      />
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'DuckDB-WASM initialization failed:',
        expect.any(Error)
      )
    })

    // Table should still render with pre-rendered data
    const root = getRoot(container)
    expect(root).toBeVisible()
    expect(getRows(container)).toHaveLength(1)

    consoleSpy.mockRestore()
  })
})
