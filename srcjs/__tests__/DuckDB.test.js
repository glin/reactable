import React from 'react'
import reactR from 'reactR'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

// Must mock before importing DuckDBEngine (which imports @duckdb/duckdb-wasm)
jest.mock('@duckdb/duckdb-wasm', () => ({}))

import { Reactable } from '../Reactable'
import { DuckDBEngine } from '../DuckDBEngine'

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
      expect(mockEngine.query).toHaveBeenCalledWith(
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

  it('queries with sortBy when a column header is clicked', async () => {
    const mockEngine = createMockEngine(20)

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
        engine="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        showPagination
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    await waitFor(() => {
      expect(mockEngine.init).toHaveBeenCalled()
    })

    // Click a sortable header
    const headers = getSortableHeaders(container)
    fireEvent.click(headers[0])

    await waitFor(() => {
      expect(mockEngine.query).toHaveBeenCalledWith(
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
      expect(mockEngine.query).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: [{ id: 'a', desc: true }]
        })
      )
    })
  })

  it('queries with filters when a column filter is typed', async () => {
    const mockEngine = createMockEngine(20)

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
        engine="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        showPagination
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    await waitFor(() => {
      expect(mockEngine.init).toHaveBeenCalled()
    })

    // Type in the first column filter
    const filters = getFilters(container)
    fireEvent.change(filters[0], { target: { value: '10' } })

    await waitFor(() => {
      expect(mockEngine.query).toHaveBeenCalledWith(
        expect.objectContaining({
          pageIndex: 0,
          filters: [{ id: 'a', value: '10' }]
        })
      )
    })
  })

  it('queries with searchValue when global search is typed', async () => {
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
        searchable
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    await waitFor(() => {
      expect(mockEngine.init).toHaveBeenCalled()
    })

    // Type in the global search input
    const searchInput = getSearchInput(container)
    fireEvent.change(searchInput, { target: { value: 'row5' } })

    await waitFor(() => {
      expect(mockEngine.query).toHaveBeenCalledWith(
        expect.objectContaining({
          searchValue: 'row5'
        })
      )
    })
  })

  it('updates row count when filter reduces results', async () => {
    const mockEngine = createMockEngine(20)

    // Override query to return fewer rows when filters are applied
    mockEngine.query.mockImplementation(({ pageIndex, pageSize, filters }) => {
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
        engine="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        showPagination
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    await waitFor(() => {
      expect(mockEngine.init).toHaveBeenCalled()
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
    const mockEngine = createMockEngine(20)

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
        engine="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        showPagination
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    await waitFor(() => {
      expect(mockEngine.init).toHaveBeenCalled()
    })

    // Type a filter to trigger a query
    const filters = getFilters(container)
    fireEvent.change(filters[0], { target: { value: '5' } })

    await waitFor(() => {
      expect(mockEngine.query).toHaveBeenCalledWith(
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
    const mockEngine = createMockEngine(20)

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
        engine="duckdb"
        arrowData="mock-base64-arrow-data"
        defaultPageSize={5}
        showPagination
        serverRowCount={20}
        serverMaxRowCount={20}
      />
    )

    await waitFor(() => {
      expect(mockEngine.init).toHaveBeenCalled()
    })

    // Navigate to page 2
    const nextButton = getNextButton(container)
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(mockEngine.query).toHaveBeenCalledWith(expect.objectContaining({ pageIndex: 1 }))
    })

    // Apply a filter - should reset to page 0
    const filters = getFilters(container)
    fireEvent.change(filters[0], { target: { value: '1' } })

    await waitFor(() => {
      expect(mockEngine.query).toHaveBeenCalledWith(
        expect.objectContaining({
          pageIndex: 0,
          filters: [{ id: 'a', value: '1' }]
        })
      )
    })
  })
})

// Unit tests for the DuckDBEngine class itself, with a mock conn.
// These test the actual query() method code path (SQL building, prepared statement
// usage) rather than just verifying that Reactable calls the mock with the right args.
describe('DuckDBEngine.query', () => {
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
    const engine = new DuckDBEngine()
    engine.conn = conn

    const result = await engine.query({
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
    const engine = new DuckDBEngine()
    engine.conn = conn

    await engine.query({
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
    const engine = new DuckDBEngine()
    engine.conn = conn

    const columns = [
      { id: 'price', type: 'numeric' },
      { id: 'name', type: 'character' }
    ]

    await engine.query({
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
    const engine = new DuckDBEngine()
    engine.conn = conn

    const columns = [
      { id: 'a', type: 'numeric' },
      { id: 'b', type: 'character' },
      { id: 'c', type: 'character', disableGlobalFilter: true }
    ]

    await engine.query({
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
    const engine = new DuckDBEngine()
    engine.conn = conn

    const columns = [
      { id: 'a', type: 'numeric' },
      { id: 'b', type: 'character' }
    ]

    await engine.query({
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
    const engine = new DuckDBEngine()
    engine.conn = conn

    await engine.query({
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

describe('DuckDBEngine.escapeIdentifier', () => {
  const engine = new DuckDBEngine()

  it('wraps simple names in double quotes', () => {
    expect(engine.escapeIdentifier('name')).toBe('"name"')
  })

  it('escapes existing double quotes', () => {
    expect(engine.escapeIdentifier('col"name')).toBe('"col""name"')
  })

  it('handles names with multiple special characters', () => {
    expect(engine.escapeIdentifier('a "b" c')).toBe('"a ""b"" c"')
  })
})
