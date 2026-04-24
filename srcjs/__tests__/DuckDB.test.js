import React from 'react'
import reactR from 'reactR'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

// Must mock before importing DuckDBBackend (which imports @duckdb/duckdb-wasm)
jest.mock('@duckdb/duckdb-wasm', () => ({}))

// Mock apache-arrow DataType for temporal type detection, and tableFromArrays/tableToIPC for replaceData
jest.mock('apache-arrow', () => ({
  DataType: {
    isDate: type => type && type._arrowType === 'date',
    isTimestamp: type => type && type._arrowType === 'timestamp'
  },
  tableFromArrays: jest.fn().mockReturnValue({ mockArrowTable: true }),
  tableToIPC: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3]))
}))

import { Reactable, getState, setData } from '../Reactable'
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
  getSelectRowCheckboxes,
  getTable,
  getVirtualSpacer
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
        return Promise.resolve({ rows: allRows, rowCount: mockBackend.totalRowCount })
      }
      const start = pageIndex * pageSize
      const rows = allRows.slice(start, start + pageSize)
      return Promise.resolve({ rows, rowCount: mockBackend.totalRowCount })
    }),
    replaceData: jest.fn().mockImplementation(rows => {
      mockBackend.totalRowCount = rows.length
      // Update allRows so subsequent queries return the new data
      allRows.length = 0
      rows.forEach((row, i) => {
        allRows.push({ ...row, __state: { id: String(i), index: i } })
      })
      return Promise.resolve()
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

  it('queries DuckDB when page changes during initialization', async () => {
    // Simulate slow init (e.g., Parquet loading) with a deferred promise
    let resolveInit
    const mockBackend = createMockBackend(20)
    mockBackend.init = jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        resolveInit = resolve
      })
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
        showPagination
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    // First page renders immediately from pre-rendered data
    expect(getRows(container)).toHaveLength(5)
    expect(mockBackend.query).not.toHaveBeenCalled()

    // User clicks next page BEFORE DuckDB is ready
    const nextButton = getNextButton(container)
    act(() => {
      nextButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    // DuckDB init hasn't resolved yet, so no query should fire
    expect(mockBackend.query).not.toHaveBeenCalled()

    // DuckDB finishes initializing
    await act(async () => {
      resolveInit()
    })

    // The query for page 2 should fire despite the skip-initial-query optimization,
    // because the user already navigated away from page 1
    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({ pageIndex: 1, pageSize: 5 })
      )
    })
  })

  it('queries DuckDB when sort changes during initialization', async () => {
    let resolveInit
    const mockBackend = createMockBackend(20)
    mockBackend.init = jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        resolveInit = resolve
      })
    })

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

    // User clicks a column header to sort BEFORE DuckDB is ready
    const headers = getSortableHeaders(container)
    act(() => {
      fireEvent.click(headers[0])
    })

    expect(mockBackend.query).not.toHaveBeenCalled()

    // DuckDB finishes initializing
    await act(async () => {
      resolveInit()
    })

    // The query with the new sort should fire
    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({
          pageIndex: 0,
          sortBy: expect.arrayContaining([expect.objectContaining({ id: 'a' })])
        })
      )
    })
  })

  it('queries DuckDB when filter changes during initialization', async () => {
    let resolveInit
    const mockBackend = createMockBackend(20)
    mockBackend.init = jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        resolveInit = resolve
      })
    })

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    const columnsWithFilter = baseColumns.map(col => ({ ...col, filterable: true }))

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={columnsWithFilter}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        showPagination
        filterable
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    // User types in a filter BEFORE DuckDB is ready
    const filterInputs = getFilters(container)
    fireEvent.change(filterInputs[0], { target: { value: '3' } })

    expect(mockBackend.query).not.toHaveBeenCalled()

    // DuckDB finishes initializing
    await act(async () => {
      resolveInit()
    })

    // The query with the filter should fire
    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(
        expect.objectContaining({
          pageIndex: 0,
          filters: [{ id: 'a', value: '3' }]
        })
      )
    })
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

  it('renders paginateSubRows page with orphan sub-rows whose parent is on another page', async () => {
    const mockBackend = createMockBackend(20)

    // Page 1: group header + 2 sub-rows (of 4 total) fill the page
    // Page 2: remaining 2 sub-rows (orphans - parent header is on page 1) + next group header
    mockBackend.query.mockImplementation(({ pageIndex }) => {
      if (pageIndex === 0) {
        return Promise.resolve({
          rows: [
            {
              a: 'grpA',
              b: null,
              __state: { id: 'a:grpA', grouped: true, subRowCount: 4 }
            },
            { a: 'grpA', b: 'sub1', __state: { id: '0', index: 0, parentId: 'a:grpA' } },
            { a: 'grpA', b: 'sub2', __state: { id: '1', index: 1, parentId: 'a:grpA' } }
          ],
          rowCount: 8
        })
      }
      // Page 2: orphan sub-rows (parent header not on this page) + next group header
      return Promise.resolve({
        rows: [
          { a: 'grpA', b: 'sub3', __state: { id: '2', index: 2, parentId: 'a:grpA' } },
          { a: 'grpA', b: 'sub4', __state: { id: '3', index: 3, parentId: 'a:grpA' } },
          {
            a: 'grpB',
            b: null,
            __state: { id: 'a:grpB', grouped: true, subRowCount: 3 }
          }
        ],
        rowCount: 8
      })
    })

    const firstPageData = { a: ['grpA'], b: [''] }

    const { container } = render(
      <Reactable
        data={firstPageData}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={3}
        showPagination
        groupBy={['a']}
        paginateSubRows
        serverRowCount={8}
        serverMaxRowCount={8}
      />
    )

    // Wait for DuckDB to be ready and page 1 to render
    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(getRows(container)).toHaveLength(3)
    })

    // Navigate to page 2 - should NOT crash despite sub-rows referencing
    // a parent group header that only exists on page 1
    fireEvent.click(getNextButton(container))

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(expect.objectContaining({ pageIndex: 1 }))
    })
    await waitFor(() => {
      expect(getRows(container)).toHaveLength(3)
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

  it('getState().selected reports selections across pages', async () => {
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
        elementId="sel-test"
      />
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Select rows 1 and 3 on page 1 (checkboxes[0] is select-all)
    const checkboxes = getSelectRowCheckboxes(container)
    fireEvent.click(checkboxes[1]) // row index 0
    fireEvent.click(checkboxes[3]) // row index 2
    expect(getState('sel-test').selected).toEqual(expect.arrayContaining([0, 2]))
    expect(getState('sel-test').selected).toHaveLength(2)

    // Navigate to page 2
    await act(async () => {
      fireEvent.click(getNextButton(container))
    })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(expect.objectContaining({ pageIndex: 1 }))
    })

    // Selections from page 1 should still appear in getState().selected
    expect(getState('sel-test').selected).toEqual(expect.arrayContaining([0, 2]))
    expect(getState('sel-test').selected).toHaveLength(2)

    // Select first row on page 2
    const page2Checkboxes = getSelectRowCheckboxes(container)
    fireEvent.click(page2Checkboxes[1]) // row index 5

    // All three selections should be reported
    expect(getState('sel-test').selected).toEqual(expect.arrayContaining([0, 2, 5]))
    expect(getState('sel-test').selected).toHaveLength(3)
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

  it('select-all falls back to current-page selection when backend returns empty rowIds', async () => {
    const mockBackend = createMockBackend(10)
    // Simulate a custom backend that doesn't implement selectAll. Built-in backends
    // (DuckDB, V8, df) always return rowIds; this tests the fallback for custom backends
    // whose reactableServerData(selectAll=TRUE) returns no rowIds field.
    mockBackend.queryRowIds.mockResolvedValue([])

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

    // Click select-all checkbox
    const checkboxes = getSelectRowCheckboxes(container)
    await act(async () => {
      fireEvent.click(checkboxes[0])
    })

    // Should fall back to selecting only current-page rows
    await waitFor(() => {
      const updatedCheckboxes = getSelectRowCheckboxes(container)
      // Current page rows should be selected
      for (let i = 1; i <= 5; i++) {
        expect(updatedCheckboxes[i].checked).toBe(true)
      }
    })

    // Navigate to page 2 - rows there should NOT be selected (only page 1 was selected)
    await act(async () => {
      fireEvent.click(getNextButton(container))
    })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledWith(expect.objectContaining({ pageIndex: 1 }))
    })

    const page2Checkboxes = getSelectRowCheckboxes(container)
    expect(page2Checkboxes[0].checked).toBe(false) // select-all not checked
    for (let i = 1; i <= 5; i++) {
      expect(page2Checkboxes[i].checked).toBe(false) // page 2 rows not selected
    }
  })

  it('select-all falls back to current-page selection when backend errors', async () => {
    const mockBackend = createMockBackend(10)
    // Simulate a custom backend that errors on selectAll (e.g., unhandled parameter)
    mockBackend.queryRowIds.mockRejectedValue(new Error('selectAll not supported'))

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

    // Click select-all checkbox
    const checkboxes = getSelectRowCheckboxes(container)
    await act(async () => {
      fireEvent.click(checkboxes[0])
    })

    // Should fall back to selecting only current-page rows
    await waitFor(() => {
      const updatedCheckboxes = getSelectRowCheckboxes(container)
      for (let i = 1; i <= 5; i++) {
        expect(updatedCheckboxes[i].checked).toBe(true)
      }
    })
  })

  it('Reactable.setData replaces data in DuckDB so sort/filter uses new data', async () => {
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
        elementId="setdata-test"
      />
    )

    // Wait for DuckDB to initialize
    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Replace data with new rows
    const newRows = [
      { a: 100, b: 'new1' },
      { a: 200, b: 'new2' },
      { a: 300, b: 'new3' }
    ]
    await act(async () => {
      setData('setdata-test', newRows)
    })

    // replaceData should have been called on the DuckDB backend
    expect(mockBackend.replaceData).toHaveBeenCalledWith(newRows)

    // After replaceData resolves, a re-query should be triggered (duckdbDataVersion changed).
    // The mock now returns new data since replaceData mutated allRows.
    await waitFor(() => {
      // The query effect re-fires after duckdbDataVersion increments.
      // Last query call should be after replaceData.
      const lastQueryCall = mockBackend.query.mock.calls[mockBackend.query.mock.calls.length - 1]
      expect(lastQueryCall).toBeTruthy()
    })

    // Table should show new data (3 rows)
    expect(getRows(container)).toHaveLength(3)
    expect(getCellsText(container)).toEqual(['100', 'new1', '200', 'new2', '300', 'new3'])
  })

  it('Shiny updateState with data replaces data in DuckDB', async () => {
    window.Shiny = {
      onInputChange: jest.fn(),
      addCustomMessageHandler: jest.fn(),
      bindAll: jest.fn(),
      unbindAll: jest.fn()
    }
    window.HTMLWidgets = { evaluateStringMember: jest.fn() }

    const mockBackend = createMockBackend(10)

    const firstPageData = {
      a: [1, 2, 3, 4, 5],
      b: ['row1', 'row2', 'row3', 'row4', 'row5']
    }

    render(
      <div data-reactable-output="shiny-output-container">
        <Reactable
          data={firstPageData}
          columns={baseColumns}
          backend="duckdb"
          arrowData="mock-base64-arrow-data"
          defaultPageSize={5}
          serverRowCount={10}
          serverMaxRowCount={10}
        />
      </div>
    )

    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Get the updateState handler registered by the Shiny effect
    const [, updateState] = window.Shiny.addCustomMessageHandler.mock.calls[0]

    // Send a data update via Shiny message
    const newData = { a: [100, 200], b: ['new1', 'new2'] }
    await act(async () => {
      updateState({ data: newData })
    })

    // replaceData should have been called on the DuckDB backend
    expect(mockBackend.replaceData).toHaveBeenCalled()

    // After replaceData resolves, a re-query should be triggered
    await waitFor(() => {
      expect(getRows(document.body)).toHaveLength(2)
    })
    expect(getCellsText(document.body)).toEqual(['100', 'new1', '200', 'new2'])

    delete window.Shiny
    delete window.HTMLWidgets
  })

  it('Shiny serverDataUpdated triggers server data re-fetch', async () => {
    window.Shiny = {
      onInputChange: jest.fn(),
      addCustomMessageHandler: jest.fn(),
      bindAll: jest.fn(),
      unbindAll: jest.fn()
    }
    window.HTMLWidgets = { evaluateStringMember: jest.fn() }

    // Use a non-DuckDB server backend (dataURL-based)
    const firstPageData = {
      a: [1, 2, 3],
      b: ['row1', 'row2', 'row3']
    }

    // Mock fetch before rendering (jsdom doesn't provide window.fetch)
    const newData = { a: [10, 20, 30, 40], b: ['a', 'b', 'c', 'd'] }
    window.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: newData, rowCount: 4, maxRowCount: 4 })
    })

    const { container } = render(
      <div data-reactable-output="shiny-output-container">
        <Reactable
          data={firstPageData}
          columns={baseColumns}
          dataURL="http://localhost/data"
          defaultPageSize={10}
          serverRowCount={3}
          serverMaxRowCount={3}
        />
      </div>
    )

    expect(getRows(container)).toHaveLength(3)

    // Get the updateState handler
    const [, updateState] = window.Shiny.addCustomMessageHandler.mock.calls[0]
    // Clear any initial fetch calls
    window.fetch.mockClear()

    // Send serverDataUpdated signal (with initial page data)
    await act(async () => {
      updateState({
        data: newData,
        serverDataUpdated: { serverRowCount: 4, serverMaxRowCount: 4 }
      })
    })

    // serverDataVersion increment should trigger a server re-fetch
    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalled()
    })

    // Table should show the new data (from setNewData or the re-fetch)
    expect(getRows(container)).toHaveLength(4)
    expect(getCellsText(container)).toEqual(['10', 'a', '20', 'b', '30', 'c', '40', 'd'])

    delete window.Shiny
    delete window.HTMLWidgets
    delete window.fetch
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
    expect(groupSql.sql).toContain('STRING_AGG(DISTINCT CAST("c7" AS VARCHAR), \', \' ORDER BY 1) AS "c7"')
  })

  it('rounds numeric SQL aggregates to avoid floating-point precision artifacts', async () => {
    const { conn } = createGroupMockConn(sql => {
      if (sql.includes('COUNT(DISTINCT')) return arrowResult([{ n: 2 }])
      if (sql.includes('GROUP BY')) {
        // Simulate float64 precision artifacts from SQL SUM/AVG
        return arrowResult([
          { mfr: 'Dodge', price: 75.10000000000001, hp: 153.33333333333334 },
          { mfr: 'Ford', price: 20.099999999999998, hp: 120.0 }
        ])
      }
      return arrowResult([])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'mfr', type: 'character' },
      { id: 'price', type: 'numeric', aggregate: 'sum' },
      { id: 'hp', type: 'numeric', aggregate: 'mean' }
    ]

    const result = await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns,
      groupBy: ['mfr']
    })

    // Precision artifacts should be rounded away (12 decimal places)
    expect(result.rows[0].price).toBe(75.1)
    expect(result.rows[0].hp).toBe(153.333333333333)
    expect(result.rows[1].price).toBe(20.1)
    expect(result.rows[1].hp).toBe(120.0)
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

  it('lazy expansion: collapsed groups have empty subRows with subRowCount', async () => {
    const { conn, stmts } = createGroupMockConn(sql => {
      if (sql.includes('COUNT(DISTINCT')) return arrowResult([{ n: 2 }])
      if (sql.includes('GROUP BY')) {
        return arrowResult([
          { Manufacturer: 'Acura', _sub_count: 2 },
          { Manufacturer: 'Audi', _sub_count: 3 }
        ])
      }
      return arrowResult([])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'Manufacturer', type: 'character' },
      { id: 'Model', type: 'character' }
    ]

    const result = await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns,
      groupBy: ['Manufacturer'],
      expanded: {} // nothing expanded
    })

    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]['.subRows']).toEqual([])
    expect(result.rows[0].__state).toEqual({
      id: 'Manufacturer:Acura',
      grouped: true,
      subRowCount: 2
    })
    expect(result.rows[1]['.subRows']).toEqual([])
    expect(result.rows[1].__state).toEqual({
      id: 'Manufacturer:Audi',
      grouped: true,
      subRowCount: 3
    })

    // Should NOT have generated a sub-row IN() query
    const subRowQuery = stmts.find(s => s.sql.includes('IN ('))
    expect(subRowQuery).toBeUndefined()
  })

  it('lazy expansion: expanded group gets sub-rows, collapsed group does not', async () => {
    const { conn, stmts } = createGroupMockConn(sql => {
      if (sql.includes('COUNT(DISTINCT')) return arrowResult([{ n: 2 }])
      if (sql.includes('GROUP BY')) {
        return arrowResult([
          { Manufacturer: 'Acura', _sub_count: 2 },
          { Manufacturer: 'Audi', _sub_count: 3 }
        ])
      }
      // Sub-row query for expanded group only
      return arrowResult([
        { Manufacturer: 'Acura', Model: 'Integra' },
        { Manufacturer: 'Acura', Model: 'Legend' }
      ])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'Manufacturer', type: 'character' },
      { id: 'Model', type: 'character' }
    ]

    const result = await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns,
      groupBy: ['Manufacturer'],
      expanded: { 'Manufacturer:Acura': true } // only Acura expanded
    })

    // Acura: expanded with sub-rows
    expect(result.rows[0].__state).toEqual({ id: 'Manufacturer:Acura', grouped: true })
    expect(result.rows[0]['.subRows']).toHaveLength(2)
    expect(result.rows[0]['.subRows'][0]).toMatchObject({ Model: 'Integra' })

    // Audi: collapsed with subRowCount
    expect(result.rows[1].__state).toEqual({
      id: 'Manufacturer:Audi',
      grouped: true,
      subRowCount: 3
    })
    expect(result.rows[1]['.subRows']).toEqual([])

    // Sub-row query should only include the expanded group
    const subRowQuery = stmts.find(s => s.sql.includes('IN ('))
    expect(subRowQuery).toBeTruthy()
    expect(subRowQuery.lastParams).toEqual(['Acura'])
  })

  it('lazy expansion: multi-level collapsed parent skips sub-group recursion', async () => {
    const { conn, stmts } = createGroupMockConn(sql => {
      if (sql.includes('COUNT(DISTINCT')) return arrowResult([{ n: 2 }])
      if (sql.includes('GROUP BY')) {
        return arrowResult([
          { region: 'East', _sub_count: 5 },
          { region: 'West', _sub_count: 8 }
        ])
      }
      return arrowResult([])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'region', type: 'character' },
      { id: 'city', type: 'character' },
      { id: 'value', type: 'numeric' }
    ]

    const result = await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns,
      groupBy: ['region', 'city'],
      expanded: {} // nothing expanded
    })

    // Both collapsed at top level
    expect(result.rows[0]['.subRows']).toEqual([])
    expect(result.rows[0].__state).toEqual({
      id: 'region:East',
      grouped: true,
      subRowCount: 5
    })
    expect(result.rows[1]['.subRows']).toEqual([])
    expect(result.rows[1].__state).toEqual({
      id: 'region:West',
      grouped: true,
      subRowCount: 8
    })

    // Only 2 SQL statements: GROUP BY + COUNT(DISTINCT) - no sub-group queries
    expect(stmts).toHaveLength(2)
  })

  it('lazy expansion: multi-level expanded parent shows sub-groups', async () => {
    let callCount = 0
    const { conn } = createGroupMockConn(sql => {
      if (sql.includes('COUNT(DISTINCT')) return arrowResult([{ n: 2 }])
      if (sql.includes('GROUP BY')) {
        callCount++
        if (callCount === 1) {
          // Top-level groups (regions)
          return arrowResult([
            { region: 'East', _sub_count: 5 },
            { region: 'West', _sub_count: 8 }
          ])
        }
        // Sub-groups (cities under East)
        return arrowResult([
          { city: 'NYC', _sub_count: 3 },
          { city: 'Boston', _sub_count: 2 }
        ])
      }
      return arrowResult([])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    const columns = [
      { id: 'region', type: 'character' },
      { id: 'city', type: 'character' },
      { id: 'value', type: 'numeric' }
    ]

    const result = await backend.query({
      pageIndex: 0,
      pageSize: 10,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns,
      groupBy: ['region', 'city'],
      expanded: { 'region:East': true } // only East expanded
    })

    // East: expanded, has sub-groups (cities)
    expect(result.rows[0].__state).toEqual({ id: 'region:East', grouped: true })
    expect(result.rows[0]['.subRows']).toHaveLength(2)
    // Sub-groups are collapsed (East is expanded, but cities within East are not)
    expect(result.rows[0]['.subRows'][0].__state).toEqual({
      id: 'city:NYC',
      grouped: true,
      subRowCount: 3
    })
    expect(result.rows[0]['.subRows'][0]['.subRows']).toEqual([])

    // West: collapsed at top level
    expect(result.rows[1].__state).toEqual({
      id: 'region:West',
      grouped: true,
      subRowCount: 8
    })
    expect(result.rows[1]['.subRows']).toEqual([])
  })

  it('paginateSubRows: returns flat group headers with subRowCount when no groups expanded', async () => {
    const { conn } = createGroupMockConn(sql => {
      if (sql.includes('GROUP BY')) {
        return arrowResult([
          { grp: 'A', _sub_count: 5, val: 100 },
          { grp: 'B', _sub_count: 3, val: 200 }
        ])
      }
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
      columns: [
        { id: 'grp', type: 'character' },
        { id: 'val', type: 'numeric', aggregate: 'sum' }
      ],
      groupBy: ['grp'],
      expanded: {},
      paginateSubRows: true
    })

    expect(result.rowCount).toBe(2) // 2 collapsed groups
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({
      grp: 'A',
      val: 100,
      __state: { id: 'grp:A', grouped: true, subRowCount: 5 }
    })
    expect(result.rows[1]).toMatchObject({
      grp: 'B',
      val: 200,
      __state: { id: 'grp:B', grouped: true, subRowCount: 3 }
    })
    // No .subRows property
    expect(result.rows[0]['.subRows']).toBeUndefined()
  })

  it('paginateSubRows: returns group header + sub-row slice when group is expanded', async () => {
    const { conn } = createGroupMockConn(sql => {
      if (sql.includes('GROUP BY')) {
        return arrowResult([
          { grp: 'A', _sub_count: 3, val: 60 },
          { grp: 'B', _sub_count: 2, val: 40 }
        ])
      }
      // Sub-row query for expanded group A
      if (sql.includes('SELECT *') && sql.includes('"grp" = ?')) {
        return arrowResult([
          { grp: 'A', val: 10, _reactable_rowid: 0 },
          { grp: 'A', val: 20, _reactable_rowid: 1 },
          { grp: 'A', val: 30, _reactable_rowid: 2 }
        ])
      }
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
      columns: [
        { id: 'grp', type: 'character' },
        { id: 'val', type: 'numeric', aggregate: 'sum' }
      ],
      groupBy: ['grp'],
      expanded: { 'grp:A': true },
      paginateSubRows: true
    })

    // rowCount = (1 + 3) + 1 = 5 (group A expanded, group B collapsed)
    expect(result.rowCount).toBe(5)
    expect(result.rows).toHaveLength(5)

    // Group A header
    expect(result.rows[0]).toMatchObject({
      grp: 'A',
      val: 60,
      __state: { id: 'grp:A', grouped: true, subRowCount: 3 }
    })
    // Sub-rows of A with parentId
    expect(result.rows[1]).toMatchObject({
      grp: 'A',
      val: 10,
      __state: { id: '0', index: 0, parentId: 'grp:A' }
    })
    expect(result.rows[2]).toMatchObject({
      grp: 'A',
      val: 20,
      __state: { id: '1', index: 1, parentId: 'grp:A' }
    })
    expect(result.rows[3]).toMatchObject({
      grp: 'A',
      val: 30,
      __state: { id: '2', index: 2, parentId: 'grp:A' }
    })
    // Group B header (collapsed)
    expect(result.rows[4]).toMatchObject({
      grp: 'B',
      val: 40,
      __state: { id: 'grp:B', grouped: true, subRowCount: 2 }
    })
  })

  it('paginateSubRows: paginates across group boundaries', async () => {
    const { conn } = createGroupMockConn(sql => {
      if (sql.includes('GROUP BY')) {
        return arrowResult([
          { grp: 'A', _sub_count: 3, val: 60 },
          { grp: 'B', _sub_count: 2, val: 40 }
        ])
      }
      // Sub-row queries - return based on LIMIT/OFFSET in sql
      if (sql.includes('"grp" = ?')) {
        if (sql.includes('LIMIT 1 OFFSET 2')) {
          // Last sub-row of group A on page 1
          return arrowResult([{ grp: 'A', val: 30, _reactable_rowid: 2 }])
        }
        if (sql.includes('LIMIT 1 OFFSET 0')) {
          // First sub-row of group B on page 1
          return arrowResult([{ grp: 'B', val: 15, _reactable_rowid: 3 }])
        }
      }
      return arrowResult([])
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    // Both groups expanded: flattened = [A hdr, A.0, A.1, A.2, B hdr, B.0, B.1] = 7 rows
    // Page 1 (pageIndex=1, pageSize=3) = flat positions [3, 4, 5] = [A.2, B hdr, B.0]
    const result = await backend.query({
      pageIndex: 1,
      pageSize: 3,
      sortBy: [],
      filters: [],
      searchValue: undefined,
      columns: [
        { id: 'grp', type: 'character' },
        { id: 'val', type: 'numeric', aggregate: 'sum' }
      ],
      groupBy: ['grp'],
      expanded: { 'grp:A': true, 'grp:B': true },
      paginateSubRows: true
    })

    expect(result.rowCount).toBe(7) // (1+3) + (1+2)
    expect(result.rows).toHaveLength(3)

    // Last sub-row of A
    expect(result.rows[0]).toMatchObject({
      val: 30,
      __state: { id: '2', index: 2, parentId: 'grp:A' }
    })
    // Group B header
    expect(result.rows[1]).toMatchObject({
      grp: 'B',
      val: 40,
      __state: { id: 'grp:B', grouped: true, subRowCount: 2 }
    })
    // First sub-row of B
    expect(result.rows[2]).toMatchObject({
      val: 15,
      __state: { id: '3', index: 3, parentId: 'grp:B' }
    })
  })

  it('paginateSubRows: multi-level grouping with collapsed top-level groups', async () => {
    // groupBy = ['region', 'type'], all collapsed
    const { conn } = createGroupMockConn(sql => {
      if (sql.includes('GROUP BY')) {
        return arrowResult([
          { region: 'East', _sub_count: 5, _sub_group_count: 2, val: 100 },
          { region: 'West', _sub_count: 3, _sub_group_count: 2, val: 200 }
        ])
      }
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
      columns: [
        { id: 'region', type: 'character' },
        { id: 'type', type: 'character' },
        { id: 'val', type: 'numeric', aggregate: 'sum' }
      ],
      groupBy: ['region', 'type'],
      expanded: {},
      paginateSubRows: true
    })

    expect(result.rowCount).toBe(2)
    expect(result.rows).toHaveLength(2)
    // subRowCount = sub-group count (not leaf count) for non-leaf groups
    expect(result.rows[0]).toMatchObject({
      region: 'East',
      val: 100,
      __state: { id: 'region:East', grouped: true, subRowCount: 2 }
    })
    expect(result.rows[1]).toMatchObject({
      region: 'West',
      val: 200,
      __state: { id: 'region:West', grouped: true, subRowCount: 2 }
    })
  })

  it('paginateSubRows: multi-level grouping with expanded top-level shows sub-groups', async () => {
    // groupBy = ['region', 'type'], East expanded -> shows sub-groups by type
    const { conn } = createGroupMockConn(sql => {
      // Top-level GROUP BY region
      if (sql.includes('GROUP BY "region"') && !sql.includes('"region" = ?')) {
        return arrowResult([
          { region: 'East', _sub_count: 5, _sub_group_count: 2, val: 100 },
          { region: 'West', _sub_count: 3, _sub_group_count: 2, val: 200 }
        ])
      }
      // Sub-group GROUP BY type WHERE region = 'East'
      if (sql.includes('GROUP BY "type"') && sql.includes('"region" = ?')) {
        return arrowResult([
          { type: 'Small', _sub_count: 3, val: 60 },
          { type: 'Large', _sub_count: 2, val: 40 }
        ])
      }
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
      columns: [
        { id: 'region', type: 'character' },
        { id: 'type', type: 'character' },
        { id: 'val', type: 'numeric', aggregate: 'sum' }
      ],
      groupBy: ['region', 'type'],
      expanded: { 'region:East': true },
      paginateSubRows: true
    })

    // East(1) + Small(1) + Large(1) + West(1) = 4
    expect(result.rowCount).toBe(4)
    expect(result.rows).toHaveLength(4)

    // East header - subRowCount = 2 (sub-groups, not leaf rows)
    expect(result.rows[0]).toMatchObject({
      region: 'East',
      val: 100,
      __state: { id: 'region:East', grouped: true, subRowCount: 2 }
    })
    // Sub-group Small (uses path-based ID) - leaf level, so subRowCount is leaf count
    expect(result.rows[1]).toMatchObject({
      type: 'Small',
      val: 60,
      __state: { id: 'region:East.type:Small', grouped: true, subRowCount: 3 }
    })
    // Sub-group Large
    expect(result.rows[2]).toMatchObject({
      type: 'Large',
      val: 40,
      __state: { id: 'region:East.type:Large', grouped: true, subRowCount: 2 }
    })
    // West header (collapsed) - subRowCount = sub-group count
    expect(result.rows[3]).toMatchObject({
      region: 'West',
      val: 200,
      __state: { id: 'region:West', grouped: true, subRowCount: 2 }
    })
  })

  it('paginateSubRows: multi-level with both levels expanded shows leaf rows', async () => {
    // groupBy = ['region', 'type'], East expanded, East.Small expanded -> shows leaf rows
    const { conn } = createGroupMockConn(sql => {
      if (sql.includes('GROUP BY "region"') && !sql.includes('"region" = ?')) {
        return arrowResult([
          { region: 'East', _sub_count: 5, _sub_group_count: 2, val: 100 },
          { region: 'West', _sub_count: 3, _sub_group_count: 2, val: 200 }
        ])
      }
      if (sql.includes('GROUP BY "type"') && sql.includes('"region" = ?')) {
        return arrowResult([
          { type: 'Small', _sub_count: 2, val: 60 },
          { type: 'Large', _sub_count: 3, val: 40 }
        ])
      }
      // Leaf rows for East + Small
      if (sql.includes('SELECT *') && sql.includes('"region" = ?') && sql.includes('"type" = ?')) {
        return arrowResult([
          { region: 'East', type: 'Small', val: 10, _reactable_rowid: 0 },
          { region: 'East', type: 'Small', val: 20, _reactable_rowid: 1 }
        ])
      }
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
      columns: [
        { id: 'region', type: 'character' },
        { id: 'type', type: 'character' },
        { id: 'val', type: 'numeric', aggregate: 'sum' }
      ],
      groupBy: ['region', 'type'],
      expanded: { 'region:East': true, 'region:East.type:Small': true },
      paginateSubRows: true
    })

    // East(1) + Small(1+2) + Large(1) + West(1) = 6
    expect(result.rowCount).toBe(6)
    expect(result.rows).toHaveLength(6)

    expect(result.rows[0].__state).toMatchObject({
      id: 'region:East',
      grouped: true,
      subRowCount: 2
    })
    expect(result.rows[1].__state).toMatchObject({
      id: 'region:East.type:Small',
      grouped: true,
      subRowCount: 2
    })
    // Leaf rows under East.Small
    expect(result.rows[2].__state).toMatchObject({
      id: '0',
      index: 0,
      parentId: 'region:East.type:Small'
    })
    expect(result.rows[3].__state).toMatchObject({
      id: '1',
      index: 1,
      parentId: 'region:East.type:Small'
    })
    // Large sub-group (collapsed)
    expect(result.rows[4].__state).toMatchObject({
      id: 'region:East.type:Large',
      grouped: true,
      subRowCount: 3
    })
    // West (collapsed) - subRowCount = sub-group count
    expect(result.rows[5].__state).toMatchObject({
      id: 'region:West',
      grouped: true,
      subRowCount: 2
    })
  })
})

describe('windowed fetching (virtual + no pagination + DuckDB)', () => {
  // Set up virtual DOM mocks required for @tanstack/react-virtual
  beforeAll(() => {
    Element.prototype.getBoundingClientRect = jest.fn(function () {
      if (this.classList && this.classList.contains('rt-tr-group')) {
        return { width: 500, height: 36, top: 0, left: 0, bottom: 36, right: 500 }
      }
      if (this.classList && this.classList.contains('rt-tr-placeholder')) {
        return { width: 500, height: 36, top: 0, left: 0, bottom: 36, right: 500 }
      }
      return { width: 500, height: 400, top: 0, left: 0, bottom: 400, right: 500 }
    })

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

  // Helper that creates a mock backend with larger row counts for windowed testing.
  // Uses Math.round on offset to handle fractional pageIndex values.
  function createWindowedMockBackend(totalRows = 1000) {
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
        const start = Math.round(pageIndex * pageSize)
        const end = Math.min(start + pageSize, totalRows)
        const rows = allRows.slice(start, end)
        return Promise.resolve({ rows, rowCount: totalRows })
      }),
      queryRowIds: jest.fn().mockResolvedValue(allRows.map(r => r.__state.id)),
      destroy: jest.fn().mockResolvedValue(undefined)
    }

    window.__ReactableDuckDB = {
      DuckDBBackend: jest.fn().mockReturnValue(mockBackend),
      wasmBasePath: '/mock/path/'
    }

    return mockBackend
  }

  it('uses windowed fetching with buffer size instead of fetching all rows', async () => {
    const mockBackend = createWindowedMockBackend(1000)

    render(
      <Reactable
        data={{ a: [1, 2, 3], b: ['row1', 'row2', 'row3'] }}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={10}
        pagination={false}
        virtual
        height={400}
        serverRowCount={1000}
        serverMaxRowCount={1000}
      />
    )

    // Wait for DuckDB to init and first windowed query
    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalled()
    })

    // Should request a buffer (500 rows), not all rows (pageSize: null)
    const queryCall = mockBackend.query.mock.calls[0][0]
    expect(queryCall.pageSize).toBe(500)
    expect(queryCall.pageSize).not.toBeNull()
  })

  it('fetches initial buffer at offset 0', async () => {
    const mockBackend = createWindowedMockBackend(1000)

    render(
      <Reactable
        data={{ a: [1, 2, 3], b: ['row1', 'row2', 'row3'] }}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={10}
        pagination={false}
        virtual
        height={400}
        serverRowCount={1000}
        serverMaxRowCount={1000}
      />
    )

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalled()
    })

    // First fetch should be at offset 0
    const queryCall = mockBackend.query.mock.calls[0][0]
    expect(Math.round(queryCall.pageIndex * queryCall.pageSize)).toBe(0)
  })

  it('renders data rows from the buffer', async () => {
    const mockBackend = createWindowedMockBackend(1000)

    const { container } = render(
      <Reactable
        data={{ a: [1, 2, 3], b: ['row1', 'row2', 'row3'] }}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={10}
        pagination={false}
        virtual
        height={400}
        serverRowCount={1000}
        serverMaxRowCount={1000}
      />
    )

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalled()
    })

    // Should have a virtual spacer (virtual mode is active)
    const spacer = getVirtualSpacer(container)
    expect(spacer).toBeInTheDocument()

    // Rows visible in the viewport should have data content
    const rows = container.querySelectorAll('.rt-tr-group:not(.rt-tr-placeholder)')
    expect(rows.length).toBeGreaterThan(0)
  })

  it('sets aria-rowcount to total row count, not buffer size', async () => {
    const mockBackend = createWindowedMockBackend(1000)

    const { container } = render(
      <Reactable
        data={{ a: [1, 2, 3], b: ['row1', 'row2', 'row3'] }}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={10}
        pagination={false}
        virtual
        height={400}
        serverRowCount={1000}
        serverMaxRowCount={1000}
      />
    )

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalled()
    })

    const table = getTable(container)
    // aria-rowcount should include header rows + total data rows (1000)
    const ariaRowCount = Number(table.getAttribute('aria-rowcount'))
    expect(ariaRowCount).toBeGreaterThan(500)
    expect(ariaRowCount).toBeLessThanOrEqual(1001) // 1000 data + 1 header
  })

  it('placeholder rows have aria-rowindex offset by header row count', async () => {
    const mockBackend = createWindowedMockBackend(1000)

    // Return only 5 rows so most visible virtual items become placeholders
    mockBackend.query.mockImplementation(({ pageSize }) => {
      if (pageSize == null) {
        return Promise.resolve({ rows: [], rowCount: 1000 })
      }
      const rows = Array.from({ length: 5 }, (_, i) => ({
        a: i + 1,
        b: `row${i + 1}`,
        __state: { id: String(i), index: i }
      }))
      return Promise.resolve({ rows, rowCount: 1000 })
    })

    const { container } = render(
      <Reactable
        data={{ a: [1, 2, 3], b: ['row1', 'row2', 'row3'] }}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={10}
        pagination={false}
        virtual
        height={400}
        serverRowCount={1000}
        serverMaxRowCount={1000}
      />
    )

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalled()
    })

    // With only 5 rows in the buffer but 1000 total, virtual items beyond index 4
    // are rendered as placeholders.
    const placeholders = container.querySelectorAll('.rt-tr-placeholder')
    expect(placeholders.length).toBeGreaterThan(0)

    // Header row occupies aria-rowindex=1, so the first data row should be 2.
    // Placeholder rows should never have aria-rowindex=1 (that's the header).
    placeholders.forEach(placeholder => {
      const ariaRowIndex = Number(placeholder.getAttribute('aria-rowindex'))
      // Must be > 1 (offset past the header row)
      expect(ariaRowIndex).toBeGreaterThan(1)
    })

    // All aria-rowindex values across real rows and placeholders should be unique
    const allRows = container.querySelectorAll('.rt-tr-group')
    const ariaIndices = []
    allRows.forEach(row => {
      const idx = row.getAttribute('aria-rowindex')
      if (idx) ariaIndices.push(Number(idx))
    })
    const uniqueIndices = new Set(ariaIndices)
    expect(uniqueIndices.size).toBe(ariaIndices.length)
  })

  it('resets buffer on sort change', async () => {
    const mockBackend = createWindowedMockBackend(1000)

    const { container } = render(
      <Reactable
        data={{ a: [1, 2, 3], b: ['row1', 'row2', 'row3'] }}
        columns={[
          { name: 'colA', id: 'a', type: 'numeric', sortable: true },
          { name: 'colB', id: 'b', sortable: true }
        ]}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={10}
        pagination={false}
        virtual
        height={400}
        serverRowCount={1000}
        serverMaxRowCount={1000}
        sortable
      />
    )

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledTimes(1)
    })

    // Click a sort header
    const sortHeaders = getSortableHeaders(container)
    fireEvent.click(sortHeaders[0])

    // Should trigger a new fetch with sort info
    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledTimes(2)
    })

    const secondCall = mockBackend.query.mock.calls[1][0]
    expect(secondCall.sortBy.length).toBe(1)
    expect(secondCall.sortBy[0].id).toBe('a')
    // Should fetch from offset 0 (reset)
    expect(Math.round(secondCall.pageIndex * secondCall.pageSize)).toBe(0)
  })

  it('resets buffer on filter change', async () => {
    const mockBackend = createWindowedMockBackend(1000)

    const { container } = render(
      <Reactable
        data={{ a: [1, 2, 3], b: ['row1', 'row2', 'row3'] }}
        columns={[
          { name: 'colA', id: 'a', type: 'numeric' },
          { name: 'colB', id: 'b', filterable: true }
        ]}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={10}
        pagination={false}
        virtual
        height={400}
        serverRowCount={1000}
        serverMaxRowCount={1000}
        filterable
      />
    )

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledTimes(1)
    })

    // Type in filter input
    const filters = getFilters(container)
    fireEvent.change(filters[1], { target: { value: 'test' } })

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalledTimes(2)
    })

    const secondCall = mockBackend.query.mock.calls[1][0]
    expect(secondCall.filters.length).toBe(1)
    // Should fetch from offset 0 (reset)
    expect(Math.round(secondCall.pageIndex * secondCall.pageSize)).toBe(0)
  })

  it('does not use windowed fetching when pagination is enabled', async () => {
    const mockBackend = createWindowedMockBackend(1000)

    render(
      <Reactable
        data={{ a: [1, 2, 3, 4, 5], b: ['row1', 'row2', 'row3', 'row4', 'row5'] }}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        pagination
        virtual
        height={400}
        serverRowCount={1000}
        serverMaxRowCount={1000}
      />
    )

    // With pagination enabled, the regular DuckDB query effect should be used, not windowed.
    // The initial query should be skipped (pre-rendered data matches)
    await waitFor(() => {
      expect(mockBackend.init).toHaveBeenCalled()
    })

    // Query should not have been called (pre-rendered first page skip logic)
    expect(mockBackend.query).not.toHaveBeenCalled()
  })

  it('does not use windowed fetching when virtual is off', async () => {
    const mockBackend = createWindowedMockBackend(1000)

    render(
      <Reactable
        data={{ a: [1, 2, 3], b: ['row1', 'row2', 'row3'] }}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={10}
        pagination={false}
        serverRowCount={1000}
        serverMaxRowCount={1000}
      />
    )

    // Without virtual, all rows should be fetched (pageSize: null)
    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalled()
    })

    const queryCall = mockBackend.query.mock.calls[0][0]
    expect(queryCall.pageSize).toBeNull()
  })

  it('renders without error when groupBy is set and data starts empty', async () => {
    // Regression: DuckDB + groupBy + virtual + no pagination starts with empty data
    // (data = [] to avoid showing flat pre-rendered rows). With empty data, pageSize = 0
    // (pagination disabled), and computing Math.ceil(rowCount / 0) = Infinity caused
    // RangeError: Invalid array length in [...new Array(Infinity)].
    const mockBackend = createWindowedMockBackend(1000)

    const { container } = render(
      <Reactable
        data={{ a: [], b: [] }}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={10}
        pagination={false}
        virtual
        height={400}
        groupBy={['a']}
        serverRowCount={1000}
        serverMaxRowCount={1000}
      />
    )

    // Should not throw RangeError. Wait for DuckDB init and windowed query.
    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalled()
    })

    // Table should render (even if initially empty, no crash)
    expect(container.querySelector('.rt-table')).toBeTruthy()
  })

  it('grouped windowed table starts with totalRowCount 0 to avoid placeholder flash', async () => {
    // When groupBy is set, the flat serverRowCount (e.g. 1000) is meaningless for the
    // grouped display (which might have only 10 group headers). Starting with 0 avoids
    // a flash of placeholder rows that shrinks when the real grouped count arrives.
    const mockBackend = createWindowedMockBackend(1000)

    // Delay the query response so we can check the initial render state
    let resolveQuery
    mockBackend.query.mockImplementation(() => {
      return new Promise(resolve => {
        resolveQuery = resolve
      })
    })

    const { container } = render(
      <Reactable
        data={{ a: [], b: [] }}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={10}
        pagination={false}
        virtual
        height={400}
        groupBy={['a']}
        serverRowCount={1000}
        serverMaxRowCount={1000}
      />
    )

    // Wait for the query to be called (after DuckDB init resolves)
    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalled()
    })

    // Before the query resolves, there should be no placeholder rows.
    // VirtualTbody should be in non-windowed mode (virtualRowCount is undefined
    // because totalRowCount is 0).
    expect(container.querySelectorAll('.rt-tr-placeholder').length).toBe(0)

    // The table's aria-rowcount should not reflect the flat serverRowCount (1000).
    // It should be based on the actual data (0 rows + header rows).
    const table = container.querySelector('.rt-table')
    const ariaRowCount = Number(table.getAttribute('aria-rowcount'))
    expect(ariaRowCount).toBeLessThan(1000)

    // Resolve the query with grouped data (10 group headers)
    await act(async () => {
      resolveQuery({
        rows: Array.from({ length: 10 }, (_, i) => ({
          a: `group${i}`,
          b: null,
          __state: { id: `g${i}`, index: i, isGrouped: true }
        })),
        rowCount: 10
      })
    })

    await waitFor(() => {
      // After data arrives, aria-rowcount should reflect the grouped count
      const updatedAriaRowCount = Number(table.getAttribute('aria-rowcount'))
      expect(updatedAriaRowCount).toBeGreaterThan(0)
    })
  })

  it('windowed query includes paginateSubRows for grouped tables', async () => {
    const mockBackend = createWindowedMockBackend(1000)

    render(
      <Reactable
        data={{ a: [], b: [] }}
        columns={baseColumns}
        backend="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={10}
        pagination={false}
        virtual
        height={400}
        groupBy={['a']}
        serverRowCount={1000}
        serverMaxRowCount={1000}
      />
    )

    await waitFor(() => {
      expect(mockBackend.query).toHaveBeenCalled()
    })

    // The windowed query for a grouped table should include paginateSubRows: true
    const queryCall = mockBackend.query.mock.calls[0][0]
    expect(queryCall.paginateSubRows).toBe(true)
  })
})

describe('DuckDBBackend.replaceData', () => {
  function createMockConn() {
    const queries = []
    const conn = {
      query: jest.fn().mockImplementation(sql => {
        queries.push(sql)
        if (sql.includes('COUNT')) {
          return Promise.resolve({
            toArray: () => [{ n: 0 }]
          })
        }
        return Promise.resolve()
      }),
      insertArrowFromIPCStream: jest.fn().mockResolvedValue(undefined)
    }
    return { conn, queries }
  }

  it('atomically replaces table with new data using temp table', async () => {
    const { conn, queries } = createMockConn()
    // Override count to return 2 (for the new data)
    conn.query.mockImplementation(sql => {
      queries.push(sql)
      if (sql.includes('COUNT')) {
        return Promise.resolve({ toArray: () => [{ n: 2 }] })
      }
      return Promise.resolve()
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    await backend.replaceData([
      { a: 10, b: 'x' },
      { a: 20, b: 'y' }
    ])

    // Should use atomic CREATE temp -> DROP old -> RENAME pattern
    expect(queries).toContain('DROP TABLE IF EXISTS reactable_data_new')
    expect(conn.insertArrowFromIPCStream).toHaveBeenCalledWith(
      expect.anything(),
      { name: 'reactable_data_new', create: true }
    )
    expect(queries).toContain('DROP TABLE IF EXISTS reactable_data')
    expect(queries).toContain('DROP VIEW IF EXISTS reactable_data')
    expect(queries).toContain('ALTER TABLE reactable_data_new RENAME TO reactable_data')
    expect(queries).toContain('SELECT COUNT(*) as n FROM reactable_data')
    expect(backend.totalRowCount).toBe(2)
  })

  it('handles empty data by preserving schema from old table', async () => {
    const { conn, queries } = createMockConn()
    const backend = new DuckDBBackend()
    backend.conn = conn

    await backend.replaceData([])

    // Should create new table from old schema, drop old, rename
    expect(queries).toContain(
      'CREATE TABLE reactable_data_new AS SELECT * FROM reactable_data WHERE false'
    )
    expect(queries).toContain('DROP TABLE IF EXISTS reactable_data')
    expect(queries).toContain('DROP VIEW IF EXISTS reactable_data')
    expect(queries).toContain('ALTER TABLE reactable_data_new RENAME TO reactable_data')
    expect(backend.totalRowCount).toBe(0)
    // Should NOT call insertArrowFromIPCStream for empty data
    expect(conn.insertArrowFromIPCStream).not.toHaveBeenCalled()
  })

  it('throws if connection is not initialized', async () => {
    const backend = new DuckDBBackend()
    backend.conn = null
    await expect(backend.replaceData([{ a: 1 }])).rejects.toThrow(
      'DuckDB connection not initialized'
    )
  })

  it('filters out __state and .subRows from row data', async () => {
    const { conn, queries } = createMockConn()
    conn.query.mockImplementation(sql => {
      queries.push(sql)
      if (sql.includes('COUNT')) {
        return Promise.resolve({ toArray: () => [{ n: 1 }] })
      }
      return Promise.resolve()
    })

    const backend = new DuckDBBackend()
    backend.conn = conn

    await backend.replaceData([
      { a: 1, b: 'x', __state: { id: '0' }, '.subRows': [] }
    ])

    // The insertArrowFromIPCStream call should have been made (data is non-empty)
    expect(conn.insertArrowFromIPCStream).toHaveBeenCalled()
    expect(backend.totalRowCount).toBe(1)

    // Verify that only real data columns (plus _reactable_rowid) were passed to tableFromArrays
    const { tableFromArrays } = require('apache-arrow')
    expect(Object.keys(tableFromArrays.mock.calls[0][0])).toEqual(['a', 'b', '_reactable_rowid'])
  })
})
