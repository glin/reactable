import React from 'react'
import reactR from 'reactR'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

// Must mock before importing DuckDBBackend (which imports @duckdb/duckdb-wasm)
jest.mock('@duckdb/duckdb-wasm', () => ({}))

import { Reactable } from '../Reactable'
import { DuckDBBackend } from '../DuckDBBackend'

import {
  getRows,
  getCellsText,
  getPageInfo,
  getNextButton,
  getRoot,
  getSortableHeaders,
  getFilters,
  getSearchInput
} from './utils/test-utils'

jest.mock('reactR')
reactR.hydrate = (components, tag) => tag

afterEach(() => {
  jest.clearAllMocks()
  delete window.__ReactableDuckDB
})

// Helper to create a mock DuckDB backend that returns predictable data
function createMockBackend(totalRows = 20) {
  const allRows = Array.from({ length: totalRows }, (_, i) => ({
    a: i + 1,
    b: `row${i + 1}`
  }))

  const mockBackend = {
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
  it('renders pre-rendered first page immediately', () => {
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
      expect(mockBackend.init).toHaveBeenCalledWith('mock-base64-arrow-data', '/mock/path/')
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

  it('shows correct page info immediately with pre-rendered data', () => {
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
              __state: { grouped: true }
            },
            {
              a: 'group2',
              b: null,
              '.subRows': [{ a: 'group2', b: 'row2' }],
              __state: { grouped: true }
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
})

// Unit tests for the DuckDBBackend class itself, with a mock conn.
// These test the actual query() method code path (SQL building, prepared statement
// usage) rather than just verifying that Reactable calls the mock with the right args.
describe('DuckDBBackend.query', () => {
  // Create a mock conn that mimics the real DuckDB-WASM AsyncDuckDBConnection API.
  // The mock prepared statement's query() accepts variadic params (matching the real API).
  function createMockConn(dataRows = [], countValue = 0) {
    const mockStmt = {
      query: jest.fn().mockResolvedValue({
        toArray: () => dataRows.map(r => ({ toJSON: () => r }))
      }),
      close: jest.fn()
    }
    const mockCountStmt = {
      query: jest.fn().mockResolvedValue({
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
      __state: { grouped: true }
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
    expect(result.rows[0].__state).toEqual({ grouped: true })

    // Second-level: each region has sub-rows grouped by city
    expect(result.rows[0]['.subRows']).toBeDefined()
    expect(result.rows[0]['.subRows'].length).toBeGreaterThan(0)
    expect(result.rows[0]['.subRows'][0].__state).toEqual({ grouped: true })
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
