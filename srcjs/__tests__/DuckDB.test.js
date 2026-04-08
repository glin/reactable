import React from 'react'
import reactR from 'reactR'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

// Must mock before importing DuckDBBackend (which imports @duckdb/duckdb-wasm)
jest.mock('@duckdb/duckdb-wasm', () => ({}))

// Mock apache-arrow DataType for temporal type detection
jest.mock('apache-arrow', () => ({
  DataType: {
    isDate: type => type && type._arrowType === 'date',
    isTimestamp: type => type && type._arrowType === 'timestamp'
  }
}))

import { Reactable } from '../Reactable'
import { DuckDBBackend } from '../DuckDBBackend'

import {
  getRows,
  getCellsText,
  getPageInfo,
  getPagination,
  getNextButton,
  getRoot,
  getSortableHeaders,
  getFilters,
  getSearchInput,
  getSelectRowCheckboxes
} from './utils/test-utils'

jest.mock('reactR')
reactR.hydrate = (components, tag) => tag

afterEach(() => {
  jest.clearAllMocks()
  delete window.__ReactableDuckDB
  delete window.__ReactableParquet
})

// Helper to create a mock DuckDB backend that returns predictable data
function createMockBackend(totalRows = 20) {
  const allRows = Array.from({ length: totalRows }, (_, i) => ({
    a: i + 1,
    b: `row${i + 1}`,
    __state: { id: String(i), index: i }
  }))

  const mockBackend = {
    totalRowCount: totalRows,
    init: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockImplementation(({ pageIndex, pageSize }) => {
      if (pageSize == null) {
        return Promise.resolve({ rows: allRows, rowCount: totalRows })
      }
      const start = pageIndex * pageSize
      const rows = allRows.slice(start, start + pageSize)
      return Promise.resolve({ rows, rowCount: totalRows })
    }),
    queryRowIds: jest.fn().mockImplementation(() => {
      // By default, return all row IDs (no filtering in mock)
      return Promise.resolve(allRows.map(row => row.__state.id))
    }),
    destroy: jest.fn().mockResolvedValue(undefined)
  }

  window.__ReactableDuckDB = {
    DuckDBBackend: jest.fn().mockReturnValue(mockBackend),
    wasmBasePath: '/mock/path/'
  }

  return mockBackend
}

const baseColumns = [
  { name: 'colA', id: 'a', type: 'numeric' },
  { name: 'colB', id: 'b' }
]

describe('DuckDB backend', () => {
  it('renders pre-rendered first page immediately', async () => {
    createMockBackend(20)

    // Simulate pre-rendered first page data (column-oriented, as R's toJSON produces)
    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
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

    // Flush async DuckDB init to avoid act() warnings
    await act(async () => {})
  })

  it('skips initial DuckDB query when first page is pre-rendered', async () => {
    const mockBackend = createMockBackend(20)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    // Wait for DuckDB to initialize
    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalledWith({
        arrowBase64: 'mock-base64-arrow-data',
        parquetUrl: null,
        wasmBasePath: '/mock/path/'
      })
    })

    // The initial page 0 query should NOT have been made (pre-rendered data is used instead)
    expect(mockBackend.query).not.toHaveBeenCalled()
  })

  it('queries DuckDB on page navigation', async () => {
    const mockBackend = createMockBackend(20)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
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
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Navigate to next page
    const nextButton = getNextButton(container)
    act(() => {
      nextButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({ pageIndex: 1, pageSize: 5 })
      )
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

  it('shows correct page info immediately with pre-rendered data', async () => {
    createMockBackend(50)

    const firstPageData = {
      a: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      b: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
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

    // Flush async DuckDB init to avoid act() warnings
    await act(async () => {})
  })

  it('cleans up DuckDB backend on unmount', async () => {
    const mockBackend = createMockBackend(5)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { unmount } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={5}
        serverMaxRowCount={5}
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Flush async DuckDB init state updates before unmounting
    await act(async () => {})

    unmount()
    expect(mockBackend.destroy).toHaveBeenCalled()
  })

  it('handles empty data (0 rows)', async () => {
    createMockBackend(0)

    // Empty pre-rendered data (column-oriented with empty arrays)
    const emptyData = { a: [], b: [] }

    const { container } = render(
      <Reactable
        data={emptyData}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={10}
        serverRowCount={0}
        serverMaxRowCount={0}
      />
    )

    const rows = getRows(container, ':not(.rt-tr-pad)')
    expect(rows).toHaveLength(0)

    // Flush async DuckDB init to avoid act() warnings
    await act(async () => {})
  })

  it('renders without DuckDB when backend is not set', () => {
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
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={1}
        serverMaxRowCount={1}
      />
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'DuckDB-WASM backend not loaded. Make sure the duckdb-wasm dependency is included.'
      )
    })

    consoleSpy.mockRestore()
  })

  it('handles DuckDB initialization failure gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const mockBackend = {
      totalRowCount: 0,
      init: jest.fn().mockRejectedValue(new Error('WASM load failed')),
      query: jest.fn(),
      destroy: jest.fn().mockResolvedValue(undefined)
    }

    window.__ReactableDuckDB = {
      DuckDBBackend: jest.fn().mockReturnValue(mockBackend),
      wasmBasePath: '/mock/path/'
    }

    const firstPageData = { a: [1], b: ['row1'] }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
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

  it('initializes with Parquet URL when parquetId is provided', async () => {
    const mockBackend = createMockBackend(20)

    // Register a Parquet URL via the locator mechanism
    window.__ReactableParquet = {
      abc12345: 'http://localhost/lib/reactable-parquet-abc12345-1/reactable-data-abc12345.parquet'
    }

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        parquetId="abc12345"
        defaultPageSize={5}
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalledWith({
        arrowBase64: undefined,
        parquetUrl:
          'http://localhost/lib/reactable-parquet-abc12345-1/reactable-data-abc12345.parquet',
        wasmBasePath: '/mock/path/'
      })
    })
  })

  it('logs error when parquetId is provided but Parquet URL is not registered', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    createMockBackend(20)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        parquetId="missing-id"
        defaultPageSize={5}
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Parquet sidecar file not found for parquetId: missing-id')
      )
    })

    consoleSpy.mockRestore()
  })

  it('queries with sortBy when a column header is clicked', async () => {
    const mockBackend = createMockBackend(20)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const sortableColumns = [
      { name: 'colA', id: 'a', type: 'numeric', sortable: true },
      { name: 'colB', id: 'b', sortable: true }
    ]

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={sortableColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        showPagination
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Click a sortable header
    const headers = getSortableHeaders(container)
    fireEvent.click(headers[0])

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({
          pageIndex: 0,
          pageSize: 5,
          sortBy: [{ id: 'a', desc: undefined }]
        })
      )
    })

    // Click same header again to reverse sort
    fireEvent.click(headers[0])

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: [{ id: 'a', desc: true }]
        })
      )
    })
  })

  it('queries with filters when a column filter is typed', async () => {
    const mockBackend = createMockBackend(20)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const filterableColumns = [
      { name: 'colA', id: 'a', type: 'numeric', filterable: true },
      { name: 'colB', id: 'b', filterable: true }
    ]

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={filterableColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        showPagination
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Type in the first column filter
    const filters = getFilters(container)
    fireEvent.change(filters[0], { target: { value: '10' } })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({
          pageIndex: 0,
          filters: [{ id: 'a', value: '10' }]
        })
      )
    })
  })

  it('queries with searchValue when global search is typed', async () => {
    const mockBackend = createMockBackend(20)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        showPagination
        searchable
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Type in the global search input
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'row5' } })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({
          searchValue: 'row5'
        })
      )
    })
  })

  it('global search excludes virtual columns like .selection', async () => {
    const mockBackend = createMockBackend(20)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={[
          // .selection column: searchable false, like the R colDef generates
          { name: '', id: '.selection', searchable: false, selectable: true },
          ...baseColumns
        ]}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        showPagination
        searchable
        selection="multiple"
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'test' } })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({
          searchValue: 'test',
          // The .selection column should be in the columns list but with
          // disableGlobalFilter set, so it won't be included in SQL search
          columns: expect.arrayContaining([
            expect.objectContaining({ id: '.selection', disableGlobalFilter: true })
          ])
        })
      )
    })
  })

  it('updates row count when filter reduces results', async () => {
    const mockBackend = createMockBackend(20)

    // Override query to return fewer rows when filters are applied
    mockBackend.query.mockImplementation(({ pageIndex, pageSize, filters }) => {
      if (filters && filters.length > 0) {
        const filteredRows = [{ a: 10, b: 'row10' }]
        return Promise.resolve({ rows: filteredRows, rowCount: 1 })
      }
      const start = pageIndex * pageSize
      const allRows = Array.from({ length: 20 }, (_, i) => ({ a: i + 1, b: `row${i + 1}` }))
      return Promise.resolve({ rows: allRows.slice(start, start + pageSize), rowCount: 20 })
    })

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const filterableColumns = [
      { name: 'colA', id: 'a', type: 'numeric', filterable: true },
      { name: 'colB', id: 'b', filterable: true }
    ]

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={filterableColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        showPagination
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Initially shows 20 rows total
    expect(getPageInfo(container)).toHaveTextContent('1–5 of 20 rows')

    // Filter to get 1 result
    const filters = getFilters(container)
    fireEvent.change(filters[0], { target: { value: '10' } })

    await waitFor(() => {
      expect(getPageInfo(container)).toHaveTextContent('1–1 of 1 rows')
    })
  })

  it('does not auto-hide pagination when filter returns 0 results', async () => {
    const mockBackend = createMockBackend(20)

    // Override query to return 0 rows when filters are applied
    mockBackend.query.mockImplementation(({ pageIndex, pageSize, filters }) => {
      if (filters && filters.length > 0) {
        return Promise.resolve({ rows: [], rowCount: 0 })
      }
      const start = pageIndex * pageSize
      const allRows = Array.from({ length: 20 }, (_, i) => ({ a: i + 1, b: `row${i + 1}` }))
      return Promise.resolve({ rows: allRows.slice(start, start + pageSize), rowCount: 20 })
    })

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const filterableColumns = [
      { name: 'colA', id: 'a', type: 'numeric', filterable: true },
      { name: 'colB', id: 'b', filterable: true }
    ]

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={filterableColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Pagination should be visible initially (20 rows > page size of 5)
    expect(getPagination(container)).toBeVisible()
    expect(getPageInfo(container)).toHaveTextContent('1–5 of 20 rows')

    // Filter to get 0 results
    const filters = getFilters(container)
    fireEvent.change(filters[0], { target: { value: 'nonexistent' } })

    await waitFor(() => {
      expect(getPageInfo(container)).toHaveTextContent('0–0 of 0 rows')
    })

    // Pagination should still be visible (not auto-hidden) because the table
    // had more rows than the page size before filtering
    expect(getPagination(container)).toBeVisible()
  })

  it('passes columns with type info to query for filter behavior', async () => {
    const mockBackend = createMockBackend(20)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const filterableColumns = [
      { name: 'colA', id: 'a', type: 'numeric', filterable: true },
      { name: 'colB', id: 'b', filterable: true }
    ]

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={filterableColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        showPagination
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Type a filter to trigger a query
    const filters = getFilters(container)
    fireEvent.change(filters[0], { target: { value: '5' } })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({
          columns: expect.arrayContaining([
            expect.objectContaining({ id: 'a', type: 'numeric' }),
            expect.objectContaining({ id: 'b' })
          ])
        })
      )
    })
  })

  it('resets to first page when sort or filter changes', async () => {
    const mockBackend = createMockBackend(20)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const sortableFilterableColumns = [
      { name: 'colA', id: 'a', type: 'numeric', sortable: true, filterable: true },
      { name: 'colB', id: 'b', sortable: true, filterable: true }
    ]

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={sortableFilterableColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        showPagination
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Navigate to page 2
    const nextButton = getNextButton(container)
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(expect.objectContaining({ pageIndex: 1 }))
    })

    // Apply a filter - should reset to page 0
    const filters = getFilters(container)
    fireEvent.change(filters[0], { target: { value: '1' } })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({
          pageIndex: 0,
          filters: [{ id: 'a', value: '1' }]
        })
      )
    })
  })

  it('does not skip initial query when groupBy is set', async () => {
    const mockBackend = createMockBackend(20)

    // Override query to return grouped data
    mockBackend.query.mockImplementation(({ groupBy }) => {
      if (groupBy && groupBy.length > 0) {
        return Promise.resolve({
          rows: [
            {
              a: 'group1',
              b: null,
              '.subRows': [{ a: 'group1', b: 'row1' }],
              __state: { id: 'a:group1', grouped: true }
            },
            {
              a: 'group2',
              b: null,
              '.subRows': [{ a: 'group2', b: 'row2' }],
              __state: { id: 'a:group2', grouped: true }
            }
          ],
          rowCount: 2
        })
      }
      return Promise.resolve({ rows: [{ a: 1, b: 'x' }], rowCount: 1 })
    })

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const groupableColumns = [
      { name: 'colA', id: 'a', type: 'numeric' },
      { name: 'colB', id: 'b' }
    ]

    render(
      <Reactable
        data={firstPageData}
        columns={groupableColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        groupBy={['a']}
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    // Wait for DuckDB to initialize
    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Initial query should NOT have been skipped because groupBy is set
    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({
          groupBy: ['a']
        })
      )
    })
  })

  it('fetches all rows when pagination is disabled', async () => {
    const mockBackend = createMockBackend(20)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        pagination={false}
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    // Wait for DuckDB to init and query
    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({
          pageIndex: 0,
          pageSize: null
        })
      )
    })

    // All 20 rows should be rendered
    expect(getRows(container)).toHaveLength(20)
  })

  it('does not skip initial query when pagination is disabled', async () => {
    const mockBackend = createMockBackend(20)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        pagination={false}
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    // Wait for DuckDB to initialize
    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Initial query should NOT have been skipped because pagination is disabled
    // (pre-rendered data is only a subset)
    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalled()
    })
  })

  it('defaultSelected selects correct rows when pre-rendered data has __state', async () => {
    const mockBackend = createMockBackend(10)

    // Pre-rendered data with __state (like R generates for DuckDB client mode).
    // Simulates defaultSorted reordering: display order is row5, row3, row1, row4, row2
    // but __state.id preserves original indices.
    const firstPageData = {
      a: [50, 30, 10, 40, 20],
      b: ['row5', 'row3', 'row1', 'row4', 'row2'],
      __state: {
        id: ['4', '2', '0', '3', '1'],
        index: [4, 2, 0, 3, 1]
      }
    }

    // defaultSelected = [0, 1] means original rows 0 and 1 (row1 and row2)
    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={10}
        serverMaxRowCount={10}
        selection="multiple"
        defaultSelected={[0, 1]}
      />
    )

    // Wait for DuckDB to initialize
    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Row 0 is at display position 3 (row1), row 1 is at display position 5 (row2)
    const checkboxes = getSelectRowCheckboxes(container)
    // checkboxes[0] = select-all, checkboxes[1..5] = rows in display order
    expect(checkboxes[1].checked).toBe(false) // row5 (id=4) - not selected
    expect(checkboxes[2].checked).toBe(false) // row3 (id=2) - not selected
    expect(checkboxes[3].checked).toBe(true) // row1 (id=0) - selected
    expect(checkboxes[4].checked).toBe(false) // row4 (id=3) - not selected
    expect(checkboxes[5].checked).toBe(true) // row2 (id=1) - selected
  })

  it('preserves row selections across page navigation', async () => {
    const mockBackend = createMockBackend(10)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={10}
        serverMaxRowCount={10}
        selection="multiple"
      />
    )

    // Wait for DuckDB to initialize
    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Select first row on page 1 (index 1 skips the header "select all" checkbox)
    const checkboxes = getSelectRowCheckboxes(container)
    expect(checkboxes).toHaveLength(6) // 1 header + 5 rows
    fireEvent.click(checkboxes[1])
    expect(checkboxes[1].checked).toBe(true)

    // Navigate to page 2
    await act(async () => {
      fireEvent.click(getNextButton(container))
    })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(expect.objectContaining({ pageIndex: 1 }))
    })

    // Select first row on page 2
    const page2Checkboxes = getSelectRowCheckboxes(container)
    fireEvent.click(page2Checkboxes[1])
    expect(page2Checkboxes[1].checked).toBe(true)

    // Navigate back to page 1
    const prevButton = container.querySelector('.rt-prev-button')
    await act(async () => {
      fireEvent.click(prevButton)
    })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(expect.objectContaining({ pageIndex: 0 }))
    })

    // First row on page 1 should still be selected
    const page1Checkboxes = getSelectRowCheckboxes(container)
    expect(page1Checkboxes[1].checked).toBe(true)
  })

  it('select-all selects rows across all pages', async () => {
    const mockBackend = createMockBackend(10)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={10}
        serverMaxRowCount={10}
        selection="multiple"
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Click select-all checkbox (async: queries DuckDB for all matching row IDs)
    const checkboxes = getSelectRowCheckboxes(container)
    await act(async () => {
      fireEvent.click(checkboxes[0])
    })

    // queryRowIds should have been called to fetch all matching row IDs
    expect(mockBackend.queryRowIds).toHaveBeenCalled()

    // All rows on current page should be selected
    await waitFor(() => {
      const updatedCheckboxes = getSelectRowCheckboxes(container)
      expect(updatedCheckboxes[0].checked).toBe(true)
      for (let i = 1; i <= 5; i++) {
        expect(updatedCheckboxes[i].checked).toBe(true)
      }
    })

    // Navigate to page 2
    await act(async () => {
      fireEvent.click(getNextButton(container))
    })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(expect.objectContaining({ pageIndex: 1 }))
    })

    // Rows on page 2 should also be selected (cross-page select-all via explicit IDs)
    const page2Checkboxes = getSelectRowCheckboxes(container)
    expect(page2Checkboxes[0].checked).toBe(true) // select-all still checked
    for (let i = 1; i <= 5; i++) {
      expect(page2Checkboxes[i].checked).toBe(true)
    }
  })

  it('select-all checkbox is not checked when only current page rows are selected', async () => {
    const mockBackend = createMockBackend(10)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={10}
        serverMaxRowCount={10}
        selection="multiple"
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Select all 5 rows on the current page individually
    const checkboxes = getSelectRowCheckboxes(container)
    for (let i = 1; i <= 5; i++) {
      fireEvent.click(checkboxes[i])
    }

    // All page rows are checked, but select-all should NOT be checked
    // because only 5 of 10 total rows are selected
    await waitFor(() => {
      const updatedCheckboxes = getSelectRowCheckboxes(container)
      for (let i = 1; i <= 5; i++) {
        expect(updatedCheckboxes[i].checked).toBe(true)
      }
      expect(updatedCheckboxes[0].checked).toBe(false)
    })
  })

  it('deselecting a row after select-all keeps other rows selected', async () => {
    const mockBackend = createMockBackend(10)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={10}
        serverMaxRowCount={10}
        selection="multiple"
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Select all
    await act(async () => {
      fireEvent.click(getSelectRowCheckboxes(container)[0])
    })

    await waitFor(() => {
      expect(getSelectRowCheckboxes(container)[0].checked).toBe(true)
    })

    // Deselect the first row
    fireEvent.click(getSelectRowCheckboxes(container)[1])
    expect(getSelectRowCheckboxes(container)[1].checked).toBe(false)

    // Select-all checkbox should now be indeterminate (not checked, not unchecked)
    expect(getSelectRowCheckboxes(container)[0].checked).toBe(false)

    // Other rows should still be selected
    for (let i = 2; i <= 5; i++) {
      expect(getSelectRowCheckboxes(container)[i].checked).toBe(true)
    }

    // Navigate to page 2 - rows should still be selected (explicit IDs persist)
    await act(async () => {
      fireEvent.click(getNextButton(container))
    })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(expect.objectContaining({ pageIndex: 1 }))
    })

    const page2Checkboxes = getSelectRowCheckboxes(container)
    for (let i = 1; i <= 5; i++) {
      expect(page2Checkboxes[i].checked).toBe(true)
    }
  })

  it('deselect-all after select-all clears all selections', async () => {
    const mockBackend = createMockBackend(10)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={10}
        serverMaxRowCount={10}
        selection="multiple"
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Select all
    await act(async () => {
      fireEvent.click(getSelectRowCheckboxes(container)[0])
    })

    await waitFor(() => {
      expect(getSelectRowCheckboxes(container)[0].checked).toBe(true)
    })

    // Deselect all (click select-all again when all are selected)
    await act(async () => {
      fireEvent.click(getSelectRowCheckboxes(container)[0])
    })

    await waitFor(() => {
      expect(getSelectRowCheckboxes(container)[0].checked).toBe(false)
    })

    // All rows should be deselected
    for (let i = 1; i <= 5; i++) {
      expect(getSelectRowCheckboxes(container)[i].checked).toBe(false)
    }

    // Navigate to page 2 - rows should also be deselected
    await act(async () => {
      fireEvent.click(getNextButton(container))
    })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(expect.objectContaining({ pageIndex: 1 }))
    })

    const page2Checkboxes = getSelectRowCheckboxes(container)
    for (let i = 1; i <= 5; i++) {
      expect(page2Checkboxes[i].checked).toBe(false)
    }
  })

  it('deselect-all on filtered view only deselects filtered rows', async () => {
    const mockBackend = createMockBackend(10)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={10}
        serverMaxRowCount={10}
        selection="multiple"
        searchable
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Select all (stores IDs "0"-"9")
    await act(async () => {
      fireEvent.click(getSelectRowCheckboxes(container)[0])
    })

    await waitFor(() => {
      expect(getSelectRowCheckboxes(container)[0].checked).toBe(true)
    })

    // Filter the table
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'row1' } })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({ searchValue: 'row1' })
      )
    })

    // Mock queryRowIds to return only filtered row IDs (simulating filter match)
    mockBackend.queryRowIds.mockImplementationOnce(() => {
      return Promise.resolve(['0', '1'])
    })

    // Deselect all on filtered view - should only deselect filtered rows
    await act(async () => {
      fireEvent.click(getSelectRowCheckboxes(container)[0])
    })

    // Wait for the async deselect to complete
    await waitFor(() => {
      expect(getSelectRowCheckboxes(container)[0].checked).toBe(false)
    })

    // Clear the filter to see all rows again
    fireEvent.change(searchInput, { target: { value: '' } })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({ searchValue: undefined })
      )
    })

    // Rows "0" and "1" should be deselected, but rows "2"-"9" should still be selected
    const checkboxes = getSelectRowCheckboxes(container)
    expect(checkboxes[1].checked).toBe(false) // row 0 - deselected
    expect(checkboxes[2].checked).toBe(false) // row 1 - deselected
    expect(checkboxes[3].checked).toBe(true) // row 2 - still selected
    expect(checkboxes[4].checked).toBe(true) // row 3 - still selected
    expect(checkboxes[5].checked).toBe(true) // row 4 - still selected
  })

  it('selections persist through search filter changes', async () => {
    const mockBackend = createMockBackend(10)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={10}
        serverMaxRowCount={10}
        selection="multiple"
        searchable
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Select all (queries backend for all 10 row IDs: "0"-"9")
    await act(async () => {
      fireEvent.click(getSelectRowCheckboxes(container)[0])
    })

    await waitFor(() => {
      expect(getSelectRowCheckboxes(container)[0].checked).toBe(true)
    })

    // Change search filter - explicit selections should persist
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'row1' } })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({ searchValue: 'row1' })
      )
    })

    // After filter change, the rows that were selected (by explicit ID) should
    // still be selected on the current page if their IDs are still in state
    const updatedCheckboxes = getSelectRowCheckboxes(container)
    // All rows on the filtered page should still be checked because their IDs
    // (from __state.id) are still in selectedRowIds
    for (let i = 1; i < updatedCheckboxes.length; i++) {
      expect(updatedCheckboxes[i].checked).toBe(true)
    }
  })

  it('select-all queries backend for filtered row IDs', async () => {
    const mockBackend = createMockBackend(10)

    // Mock queryRowIds to return only even-indexed rows (simulating filtered results)
    mockBackend.queryRowIds.mockImplementation(() => {
      return Promise.resolve(['0', '2', '4', '6', '8'])
    })

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const filterableColumns = [
      { name: 'colA', id: 'a', type: 'numeric', filterable: true },
      { name: 'colB', id: 'b', filterable: true }
    ]

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={filterableColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={10}
        serverMaxRowCount={10}
        selection="multiple"
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Select all with filter active - should call queryRowIds
    await act(async () => {
      fireEvent.click(getSelectRowCheckboxes(container)[0])
    })

    expect(mockBackend.queryRowIds).toHaveBeenCalled()

    // Only even-indexed rows should be selected on the current page.
    // Page has rows with __state.id "0","1","2","3","4".
    // Only "0","2","4" are in the selected set.
    await waitFor(() => {
      const checkboxes = getSelectRowCheckboxes(container)
      expect(checkboxes[1].checked).toBe(true) // row 0
      expect(checkboxes[2].checked).toBe(false) // row 1
      expect(checkboxes[3].checked).toBe(true) // row 2
      expect(checkboxes[4].checked).toBe(false) // row 3
      expect(checkboxes[5].checked).toBe(true) // row 4
    })
  })

  it('selections persist through sort changes', async () => {
    const mockBackend = createMockBackend(10)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const sortableColumns = [
      { name: 'colA', id: 'a', type: 'numeric', sortable: true },
      { name: 'colB', id: 'b', sortable: true }
    ]

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={sortableColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={10}
        serverMaxRowCount={10}
        selection="multiple"
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Select all (stores explicit IDs "0"-"9")
    await act(async () => {
      fireEvent.click(getSelectRowCheckboxes(container)[0])
    })

    await waitFor(() => {
      expect(getSelectRowCheckboxes(container)[0].checked).toBe(true)
    })

    // Sort by column A - selections should persist
    const headers = getSortableHeaders(container)
    await act(async () => {
      fireEvent.click(headers[0])
    })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: [{ id: 'a', desc: undefined }]
        })
      )
    })

    // All rows should still be selected after sort
    const sortedCheckboxes = getSelectRowCheckboxes(container)
    expect(sortedCheckboxes[0].checked).toBe(true) // select-all
    for (let i = 1; i <= 5; i++) {
      expect(sortedCheckboxes[i].checked).toBe(true)
    }
  })

  it('filtered select-all persists after clearing filter, only selected rows remain checked', async () => {
    const mockBackend = createMockBackend(10)

    // Mock queryRowIds to return only 3 specific row IDs (simulating filtered results)
    mockBackend.queryRowIds.mockImplementation(() => {
      return Promise.resolve(['1', '4', '7'])
    })

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        serverRowCount={10}
        serverMaxRowCount={10}
        selection="multiple"
        searchable
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Filter first, then select-all on filtered results
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'xyz' } })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({ searchValue: 'xyz' })
      )
    })

    // Select all on filtered view - gets IDs [1, 4, 7] from queryRowIds
    await act(async () => {
      fireEvent.click(getSelectRowCheckboxes(container)[0])
    })

    await waitFor(() => {
      expect(mockBackend.queryRowIds).toHaveBeenCalled()
    })

    // Clear the search filter
    fireEvent.change(searchInput, { target: { value: '' } })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({ searchValue: undefined })
      )
    })

    // After clearing filter, only the 3 originally-selected rows should be checked.
    // Page has rows with __state.id "0","1","2","3","4" - only "1" and "4" are in selected set.
    const checkboxes = getSelectRowCheckboxes(container)
    expect(checkboxes[0].checked).toBe(false) // select-all should NOT be checked
    expect(checkboxes[1].checked).toBe(false) // row 0 - not selected
    expect(checkboxes[2].checked).toBe(true) // row 1 - selected
    expect(checkboxes[3].checked).toBe(false) // row 2 - not selected
    expect(checkboxes[4].checked).toBe(false) // row 3 - not selected
    expect(checkboxes[5].checked).toBe(true) // row 4 - selected
  })
})

// Unit tests for the DuckDBBackend class itself, with a mock conn.
// These test the actual query() method code path (SQL building, prepared statement
// usage) rather than just verifying that Reactable calls the mock with the right args.
describe('DuckDBBackend.query', () => {
  // Create a mock conn that mimics the real DuckDB-WASM AsyncDuckDBConnection API.
  // The mock prepared statement's query() accepts variadic params (matching the real API).
  function createMockConn(dataRows = [], countValue = 0, { schemaFields = [] } = {}) {
    const mockStmt = {
      query: jest.fn().mockResolvedValue({
        schema: { fields: schemaFields },
        toArray: () => dataRows.map(r => ({ toJSON: () => r }))
      }),
      close: jest.fn()
    }
    const mockCountStmt = {
      query: jest.fn().mockResolvedValue({
        schema: { fields: [] },
        toArray: () => [{ n: countValue }]
      }),
      close: jest.fn()
    }
    let callCount = 0
    const conn = {
      prepare: jest.fn().mockImplementation(() => {
        callCount++
        // First prepare call is the data query, second is the count query
        return Promise.resolve(callCount % 2 === 1 ? mockStmt : mockCountStmt)
      })
    }
    return { conn, mockStmt, mockCountStmt }
  }

  it('builds basic pagination query', async () => {
    const { conn, mockStmt, mockCountStmt } = createMockConn([{ a: 1, b: 'x' }], 10)
    const backend = new DuckDBBackend()
    backend.conn = conn

    const result = await backend.query({
      pageIndex: 2,
      pageSize: 5,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns: []
    })

    expect(conn.prepare).toHaveBeenCalledWith('SELECT * FROM reactable_data LIMIT 5 OFFSET 10')
    expect(conn.prepare).toHaveBeenCalledWith('SELECT COUNT(*) AS n FROM reactable_data')
    // Prepared statement query() is called with no params (no filters)
    expect(mockStmt.query).toHaveBeenCalledWith()
    expect(mockCountStmt.query).toHaveBeenCalledWith()
    expect(mockStmt.close).toHaveBeenCalled()
    expect(mockCountStmt.close).toHaveBeenCalled()
    expect(result).toEqual({ rows: [{ a: 1, b: 'x' }], rowCount: 10 })
  })

  it('extracts _reactable_rowid into __state for stable row IDs', async () => {
    const { conn } = createMockConn(
      [
        { a: 1, b: 'x', _reactable_rowid: 42 },
        { a: 2, b: 'y', _reactable_rowid: 99 }
      ],
      100
    )
    const backend = new DuckDBBackend()
    backend.conn = conn

    const result = await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns: []
    })

    expect(result.rows).toEqual([
      { a: 1, b: 'x', __state: { id: '42', index: 42 } },
      { a: 2, b: 'y', __state: { id: '99', index: 99 } }
    ])
  })

  it('skips LIMIT/OFFSET when pageSize is null', async () => {
    const { conn } = createMockConn([{ a: 1, b: 'x' }], 10)
    const backend = new DuckDBBackend()
    backend.conn = conn

    await backend.query({
      pageIndex: 0,
      pageSize: null,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns: []
    })

    expect(conn.prepare).toHaveBeenCalledWith('SELECT * FROM reactable_data')
    expect(conn.prepare).toHaveBeenCalledWith('SELECT COUNT(*) AS n FROM reactable_data')
  })

  it('builds sort query with ORDER BY', async () => {
    const { conn } = createMockConn([], 0)
    const backend = new DuckDBBackend()
    backend.conn = conn

    await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [
        { id: 'price', desc: true },
        { id: 'name', desc: false }
      ],
      filters: [],
      searchValue: undefined,
      columns: []
    })

    expect(conn.prepare).toHaveBeenCalledWith(
      'SELECT * FROM reactable_data ORDER BY "price" DESC NULLS LAST, "name" ASC NULLS LAST LIMIT 10 OFFSET 0'
    )
  })

  it('builds column filter query with WHERE clause and passes params to query()', async () => {
    const { conn, mockStmt, mockCountStmt } = createMockConn([], 0)
    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'price', type: 'numeric' },
      { id: 'name', type: 'character' }
    ]

    await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [
        { id: 'price', value: '50' },
        { id: 'name', value: 'ford' }
      ],
      searchValue: undefined,
      columns
    })

    // Numeric column uses LIKE (starts-with), text column uses ILIKE (substring)
    expect(conn.prepare).toHaveBeenCalledWith(
      expect.stringContaining(
        `WHERE CAST("price" AS VARCHAR) LIKE ? || '%' AND CAST("name" AS VARCHAR) ILIKE '%' || ? || '%'`
      )
    )
    // Params are passed as variadic args to stmt.query(), not via bind()
    expect(mockStmt.query).toHaveBeenCalledWith('50', 'ford')
    expect(mockCountStmt.query).toHaveBeenCalledWith('50', 'ford')
  })

  it('builds global search query with OR-joined WHERE clause', async () => {
    const { conn, mockStmt } = createMockConn([], 0)
    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'a', type: 'numeric' },
      { id: 'b', type: 'character' },
      { id: 'c', type: 'character', disableGlobalFilter: true }
    ]

    await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: 'test',
      columns
    })

    // Column 'c' is excluded from search (disableGlobalFilter: true)
    expect(conn.prepare).toHaveBeenCalledWith(
      expect.stringContaining(
        `WHERE (CAST("a" AS VARCHAR) LIKE ? || '%' OR CAST("b" AS VARCHAR) ILIKE '%' || ? || '%')`
      )
    )
    // One param per searchable column
    expect(mockStmt.query).toHaveBeenCalledWith('test', 'test')
  })

  it('combines filters, search, and sort in a single query', async () => {
    const { conn, mockStmt } = createMockConn([], 0)
    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'a', type: 'numeric' },
      { id: 'b', type: 'character' }
    ]

    await backend.query({
      pageIndex: 1,
      pageSize: 5,
      sortBy: [{ id: 'a', desc: true }],
      filters: [{ id: 'b', value: 'xyz' }],
      searchValue: 'hello',
      columns
    })

    const dataSql = conn.prepare.mock.calls[0][0]
    // Has WHERE with filter AND search
    expect(dataSql).toContain(`CAST("b" AS VARCHAR) ILIKE '%' || ? || '%'`)
    expect(dataSql).toContain(
      `(CAST("a" AS VARCHAR) LIKE ? || '%' OR CAST("b" AS VARCHAR) ILIKE '%' || ? || '%')`
    )
    // Has ORDER BY
    expect(dataSql).toContain('ORDER BY "a" DESC NULLS LAST')
    // Has LIMIT/OFFSET
    expect(dataSql).toContain('LIMIT 5 OFFSET 5')
    // Params: filter value, then search value per searchable column
    expect(mockStmt.query).toHaveBeenCalledWith('xyz', 'hello', 'hello')
  })

  it('escapes column names with special characters', async () => {
    const { conn } = createMockConn([], 0)
    const backend = new DuckDBBackend()
    backend.conn = conn

    await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [{ id: 'col "quoted"', desc: false }],
      filters: [],
      searchValue: undefined,
      columns: []
    })

    expect(conn.prepare).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY "col ""quoted""" ASC NULLS LAST')
    )
  })

  it('converts Date columns from epoch ms to ISO date strings', async () => {
    const schemaFields = [
      { name: 'id', type: {} },
      { name: 'date_col', type: { _arrowType: 'date' } },
      { name: 'label', type: {} }
    ]
    const dataRows = [
      { id: 1, date_col: 1541376000000, label: 'a' }, // 2018-11-05
      { id: 2, date_col: 1542240000000, label: 'b' }, // 2018-11-15
      { id: 3, date_col: null, label: 'c' }
    ]
    const { conn } = createMockConn(dataRows, 3, { schemaFields })
    const backend = new DuckDBBackend()
    backend.conn = conn

    const result = await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns: []
    })

    expect(result.rows[0].date_col).toBe('2018-11-05')
    expect(result.rows[1].date_col).toBe('2018-11-15')
    expect(result.rows[2].date_col).toBeNull()
    // Non-date columns are unchanged
    expect(result.rows[0].id).toBe(1)
    expect(result.rows[0].label).toBe('a')
  })

  it('converts Timestamp columns from epoch ms to ISO datetime strings', async () => {
    const schemaFields = [
      { name: 'id', type: {} },
      { name: 'ts_col', type: { _arrowType: 'timestamp' } }
    ]
    const dataRows = [
      { id: 1, ts_col: 1541376000000 }, // 2018-11-05T00:00:00.000Z
      { id: 2, ts_col: 1541419265000 } // 2018-11-05T12:01:05.000Z
    ]
    const { conn } = createMockConn(dataRows, 2, { schemaFields })
    const backend = new DuckDBBackend()
    backend.conn = conn

    const result = await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns: []
    })

    expect(result.rows[0].ts_col).toBe('2018-11-05T00:00:00.000Z')
    expect(result.rows[1].ts_col).toBe('2018-11-05T12:01:05.000Z')
  })
})

describe('DuckDBBackend.escapeIdentifier', () => {
  const backend = new DuckDBBackend()

  it('wraps simple names in double quotes', () => {
    expect(backend.escapeIdentifier('name')).toBe('"name"')
  })

  it('escapes existing double quotes', () => {
    expect(backend.escapeIdentifier('col"name')).toBe('"col""name"')
  })

  it('handles names with multiple special characters', () => {
    expect(backend.escapeIdentifier('a "b" c')).toBe('"a ""b"" c"')
  })
})

describe('DuckDBBackend.query with groupBy', () => {
  // Create a mock conn that tracks all prepared statements and their SQL.
  // Each call to conn.prepare() returns a mock statement. The resolver function
  // determines the result based on the SQL string.
  function createGroupMockConn(resolver) {
    const stmts = []
    const conn = {
      prepare: jest.fn().mockImplementation(sql => {
        const result = resolver(sql)
        const stmt = {
          sql,
          query: jest.fn().mockImplementation((...params) => {
            stmt.lastParams = params
            return Promise.resolve(result)
          }),
          close: jest.fn(),
          lastParams: null
        }
        stmts.push(stmt)
        return Promise.resolve(stmt)
      })
    }
    return { conn, stmts }
  }

  function arrowResult(rows) {
    return {
      schema: { fields: [] },
      toArray: () => rows.map(r => ({ ...r, toJSON: () => r }))
    }
  }

  it('builds GROUP BY query with aggregate functions', async () => {
    const { conn, stmts } = createGroupMockConn(sql => {
      if (sql.includes('COUNT(DISTINCT')) return arrowResult([{ n: 3 }])
      if (sql.includes('GROUP BY')) {
        return arrowResult([
          { Manufacturer: 'Acura', Price: 49.8 },
          { Manufacturer: 'Audi', Price: 66.8 }
        ])
      }
      // Sub-row query
      return arrowResult([
        { Manufacturer: 'Acura', Model: 'Integra', Price: 15.9 },
        { Manufacturer: 'Acura', Model: 'Legend', Price: 33.9 },
        { Manufacturer: 'Audi', Model: '90', Price: 29.1 },
        { Manufacturer: 'Audi', Model: '100', Price: 37.7 }
      ])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'Manufacturer', type: 'character' },
      { id: 'Model', type: 'character' },
      { id: 'Price', type: 'numeric', aggregate: 'sum' }
    ]

    const result = await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns,
      groupBy: ['Manufacturer']
    })

    // Should have generated a GROUP BY query with SUM
    const groupSql = stmts.find(s => s.sql.includes('GROUP BY'))
    expect(groupSql).toBeTruthy()
    expect(groupSql.sql).toContain('SUM("Price") AS "Price"')
    expect(groupSql.sql).toContain('GROUP BY "Manufacturer"')
    expect(groupSql.sql).toContain('LIMIT 10 OFFSET 0')

    // Should have generated a count query
    const countSql = stmts.find(s => s.sql.includes('COUNT(DISTINCT'))
    expect(countSql).toBeTruthy()
    expect(countSql.sql).toContain('COUNT(DISTINCT "Manufacturer")')

    // Result should have grouped rows with .subRows and __state
    expect(result.rowCount).toBe(3)
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({
      Manufacturer: 'Acura',
      Price: 49.8,
      __state: { id: 'Manufacturer:Acura', grouped: true }
    })
    expect(result.rows[0]['.subRows']).toHaveLength(2)
    expect(result.rows[0]['.subRows'][0]).toMatchObject({ Model: 'Integra', Price: 15.9 })
  })

  it('maps all supported aggregate functions to SQL', async () => {
    const { conn, stmts } = createGroupMockConn(sql => {
      if (sql.includes('COUNT(DISTINCT')) return arrowResult([{ n: 1 }])
      if (sql.includes('GROUP BY')) return arrowResult([{ grp: 'A' }])
      return arrowResult([])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'grp', type: 'character' },
      { id: 'c1', type: 'numeric', aggregate: 'sum' },
      { id: 'c2', type: 'numeric', aggregate: 'mean' },
      { id: 'c3', type: 'numeric', aggregate: 'max' },
      { id: 'c4', type: 'numeric', aggregate: 'min' },
      { id: 'c5', type: 'numeric', aggregate: 'median' },
      { id: 'c6', type: 'numeric', aggregate: 'count' },
      { id: 'c7', type: 'character', aggregate: 'unique' }
    ]

    await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns,
      groupBy: ['grp']
    })

    const groupSql = stmts.find(s => s.sql.includes('GROUP BY'))
    expect(groupSql.sql).toContain('SUM("c1") AS "c1"')
    expect(groupSql.sql).toContain('AVG("c2") AS "c2"')
    expect(groupSql.sql).toContain('MAX("c3") AS "c3"')
    expect(groupSql.sql).toContain('MIN("c4") AS "c4"')
    expect(groupSql.sql).toContain('MEDIAN("c5") AS "c5"')
    expect(groupSql.sql).toContain('COUNT("c6") AS "c6"')
    expect(groupSql.sql).toContain('STRING_AGG(DISTINCT CAST("c7" AS VARCHAR), \', \') AS "c7"')
  })

  it('computes frequency aggregate from sub-rows', async () => {
    const { conn } = createGroupMockConn(sql => {
      if (sql.includes('COUNT(DISTINCT')) return arrowResult([{ n: 1 }])
      if (sql.includes('GROUP BY')) return arrowResult([{ grp: 'A' }])
      return arrowResult([
        { grp: 'A', type: 'Small' },
        { grp: 'A', type: 'Small' },
        { grp: 'A', type: 'Large' }
      ])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'grp', type: 'character' },
      { id: 'type', type: 'character', aggregate: 'frequency' }
    ]

    const result = await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns,
      groupBy: ['grp']
    })

    // frequency should be computed from sub-rows, not SQL
    expect(result.rows[0].type).toContain('Small (2)')
    expect(result.rows[0].type).toContain('Large (1)')
  })

  it('fetches sub-rows for visible groups using IN clause', async () => {
    const { conn, stmts } = createGroupMockConn(sql => {
      if (sql.includes('COUNT(DISTINCT')) return arrowResult([{ n: 2 }])
      if (sql.includes('GROUP BY')) {
        return arrowResult([{ cat: 'A' }, { cat: 'B' }])
      }
      return arrowResult([
        { cat: 'A', val: 1 },
        { cat: 'B', val: 2 }
      ])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'cat', type: 'character' },
      { id: 'val', type: 'numeric' }
    ]

    await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns,
      groupBy: ['cat']
    })

    // Sub-row query should use IN() with the group values
    const subSql = stmts.find(s => s.sql.includes('IN'))
    expect(subSql).toBeTruthy()
    expect(subSql.sql).toContain('"cat" IN (?, ?)')
    expect(subSql.lastParams).toEqual(['A', 'B'])
  })

  it('sorts groups by group column', async () => {
    const { conn, stmts } = createGroupMockConn(sql => {
      if (sql.includes('COUNT(DISTINCT')) return arrowResult([{ n: 2 }])
      if (sql.includes('GROUP BY')) return arrowResult([{ grp: 'B' }, { grp: 'A' }])
      return arrowResult([])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'grp', type: 'character' },
      { id: 'val', type: 'numeric' }
    ]

    await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [{ id: 'grp', desc: true }],
      filters: [],
      searchValue: undefined,
      columns,
      groupBy: ['grp']
    })

    const groupSql = stmts.find(s => s.sql.includes('GROUP BY'))
    expect(groupSql.sql).toContain('ORDER BY "grp" DESC NULLS LAST')
  })

  it('sorts groups by aggregated column', async () => {
    const { conn, stmts } = createGroupMockConn(sql => {
      if (sql.includes('COUNT(DISTINCT')) return arrowResult([{ n: 2 }])
      if (sql.includes('GROUP BY'))
        return arrowResult([
          { grp: 'B', val: 10 },
          { grp: 'A', val: 20 }
        ])
      return arrowResult([])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'grp', type: 'character' },
      { id: 'val', type: 'numeric', aggregate: 'sum' }
    ]

    await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [{ id: 'val', desc: false }],
      filters: [],
      searchValue: undefined,
      columns,
      groupBy: ['grp']
    })

    const groupSql = stmts.find(s => s.sql.includes('GROUP BY'))
    expect(groupSql.sql).toContain('ORDER BY SUM("val") ASC NULLS LAST')
  })

  it('applies filters to grouped queries', async () => {
    const { conn, stmts } = createGroupMockConn(sql => {
      if (sql.includes('COUNT(DISTINCT')) return arrowResult([{ n: 1 }])
      if (sql.includes('GROUP BY')) return arrowResult([{ grp: 'A' }])
      return arrowResult([])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'grp', type: 'character' },
      { id: 'val', type: 'numeric' }
    ]

    await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [{ id: 'val', value: '5' }],
      searchValue: undefined,
      columns,
      groupBy: ['grp']
    })

    const groupSql = stmts.find(s => s.sql.includes('GROUP BY'))
    expect(groupSql.sql).toContain('CAST("val" AS VARCHAR) LIKE ? || \'%\'')
    expect(groupSql.lastParams).toEqual(['5'])
  })

  it('skips columns without aggregate in GROUP BY select', async () => {
    const { conn, stmts } = createGroupMockConn(sql => {
      if (sql.includes('COUNT(DISTINCT')) return arrowResult([{ n: 1 }])
      if (sql.includes('GROUP BY')) return arrowResult([{ grp: 'A' }])
      return arrowResult([])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'grp', type: 'character' },
      { id: 'name', type: 'character' }, // no aggregate
      { id: 'val', type: 'numeric', aggregate: 'sum' }
    ]

    await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns,
      groupBy: ['grp']
    })

    const groupSql = stmts.find(s => s.sql.includes('GROUP BY'))
    // "name" should NOT be in the SELECT (no aggregate)
    expect(groupSql.sql).not.toContain('"name"')
    // "val" should be in the SELECT with SUM
    expect(groupSql.sql).toContain('SUM("val")')
  })

  it('does not sort by non-aggregated column in GROUP BY', async () => {
    const { conn, stmts } = createGroupMockConn(sql => {
      if (sql.includes('COUNT(DISTINCT')) return arrowResult([{ n: 1 }])
      if (sql.includes('GROUP BY')) return arrowResult([{ grp: 'A' }])
      return arrowResult([])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'grp', type: 'character' },
      { id: 'name', type: 'character' } // no aggregate
    ]

    await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [{ id: 'name', desc: false }],
      filters: [],
      searchValue: undefined,
      columns,
      groupBy: ['grp']
    })

    const groupSql = stmts.find(s => s.sql.includes('GROUP BY'))
    // Should NOT have ORDER BY for non-aggregated column
    expect(groupSql.sql).not.toContain('ORDER BY')
  })

  it('returns empty rows when no groups match', async () => {
    const { conn } = createGroupMockConn(sql => {
      if (sql.includes('COUNT(DISTINCT')) return arrowResult([{ n: 0 }])
      if (sql.includes('GROUP BY')) return arrowResult([])
      return arrowResult([])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const result = await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns: [{ id: 'grp', type: 'character' }],
      groupBy: ['grp']
    })

    expect(result.rows).toEqual([])
    expect(result.rowCount).toBe(0)
  })

  it('handles multi-level grouping', async () => {
    const callLog = []
    const { conn } = createGroupMockConn(sql => {
      callLog.push(sql)
      if (sql.includes('COUNT(DISTINCT')) return arrowResult([{ n: 2 }])
      if (sql.includes('GROUP BY "region"') && !sql.includes('"region" = ?')) {
        return arrowResult([{ region: 'East' }, { region: 'West' }])
      }
      if (sql.includes('GROUP BY "city"') && sql.includes('"region" = ?')) {
        return arrowResult([{ city: 'NYC' }, { city: 'Boston' }])
      }
      // Leaf rows
      return arrowResult([
        { region: 'East', city: 'NYC', val: 10 },
        { region: 'East', city: 'Boston', val: 20 }
      ])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'region', type: 'character' },
      { id: 'city', type: 'character' },
      { id: 'val', type: 'numeric', aggregate: 'sum' }
    ]

    const result = await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns,
      groupBy: ['region', 'city']
    })

    // Top-level groups
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0].__state).toEqual({ id: 'region:East', grouped: true })

    // Second-level: each region has sub-rows grouped by city
    expect(result.rows[0]['.subRows']).toBeDefined()
    expect(result.rows[0]['.subRows'].length).toBeGreaterThan(0)
    expect(result.rows[0]['.subRows'][0].__state).toEqual({ id: 'city:NYC', grouped: true })
    expect(result.rows[0]['.subRows'][0]['.subRows']).toBeDefined()
  })

  it('falls back to flat query when groupBy is empty', async () => {
    const { conn, stmts } = createGroupMockConn(sql => {
      if (sql.includes('COUNT(*)')) return arrowResult([{ n: 5 }])
      return arrowResult([{ a: 1, b: 'x' }])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const result = await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns: [{ id: 'a', type: 'numeric' }, { id: 'b' }],
      groupBy: []
    })

    // Should use flat SELECT *, not GROUP BY
    expect(stmts[0].sql).toContain('SELECT *')
    expect(stmts[0].sql).not.toContain('GROUP BY')
    expect(result.rows).toEqual([{ a: 1, b: 'x' }])
  })
})
