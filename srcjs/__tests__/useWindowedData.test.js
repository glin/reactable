import React from 'react'
import { render, act } from '@testing-library/react'

import { useWindowedData } from '../useWindowedData'

// Test wrapper component that exposes hook return values via a ref
function HookWrapper({ hookProps, resultRef }) {
  const result = useWindowedData(hookProps)
  resultRef.current = result
  return null
}

describe('useWindowedData', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns disabled state when not enabled', () => {
    const resultRef = { current: null }
    render(
      <HookWrapper
        resultRef={resultRef}
        hookProps={{
          enabled: false,
          fetchData: jest.fn(),
          onBufferChange: jest.fn()
        }}
      />
    )

    expect(resultRef.current.totalRowCount).toBe(0)
    expect(resultRef.current.onRangeChange).toBeNull()
    expect(resultRef.current.isLoading).toBe(false)
  })

  it('uses initialTotalRowCount when disabled', () => {
    const resultRef = { current: null }
    render(
      <HookWrapper
        resultRef={resultRef}
        hookProps={{
          enabled: false,
          fetchData: jest.fn(),
          onBufferChange: jest.fn(),
          initialTotalRowCount: 5000
        }}
      />
    )

    expect(resultRef.current.totalRowCount).toBe(5000)
  })

  it('fetches initial buffer at offset 0 when enabled', async () => {
    const fetchData = jest.fn().mockResolvedValue({
      rows: Array.from({ length: 500 }, (_, i) => ({ id: i })),
      rowCount: 10000
    })
    const onBufferChange = jest.fn()
    const resultRef = { current: null }

    render(
      <HookWrapper
        resultRef={resultRef}
        hookProps={{
          enabled: true,
          fetchData,
          onBufferChange,
          bufferSize: 500
        }}
      />
    )

    await act(async () => {})

    expect(fetchData).toHaveBeenCalledWith(0, 500)
    expect(onBufferChange).toHaveBeenCalledWith(
      expect.objectContaining({
        start: 0,
        end: 500,
        rowCount: 10000
      })
    )
  })

  it('updates totalRowCount from fetch result', async () => {
    const fetchData = jest.fn().mockResolvedValue({
      rows: Array.from({ length: 100 }, (_, i) => ({ id: i })),
      rowCount: 5000
    })
    const resultRef = { current: null }

    render(
      <HookWrapper
        resultRef={resultRef}
        hookProps={{
          enabled: true,
          fetchData,
          onBufferChange: jest.fn(),
          bufferSize: 100
        }}
      />
    )

    await act(async () => {})

    expect(resultRef.current.totalRowCount).toBe(5000)
  })

  it('refetches from offset 0 when resetDeps change', async () => {
    const fetchData = jest.fn().mockResolvedValue({
      rows: [{ id: 1 }],
      rowCount: 100
    })
    const onBufferChange = jest.fn()
    const resultRef = { current: null }

    let sortBy = []
    const { rerender } = render(
      <HookWrapper
        resultRef={resultRef}
        hookProps={{
          enabled: true,
          fetchData,
          onBufferChange,
          bufferSize: 500,
          resetDeps: sortBy
        }}
      />
    )

    await act(async () => {})
    expect(fetchData).toHaveBeenCalledTimes(1)

    // Change resetDeps (simulates sort change)
    sortBy = [{ id: 'col1', desc: false }]
    rerender(
      <HookWrapper
        resultRef={resultRef}
        hookProps={{
          enabled: true,
          fetchData,
          onBufferChange,
          bufferSize: 500,
          resetDeps: sortBy
        }}
      />
    )

    await act(async () => {})
    expect(fetchData).toHaveBeenCalledTimes(2)
    expect(fetchData).toHaveBeenLastCalledWith(0, 500)
  })

  it('discards stale fetch results', async () => {
    let resolveFirst
    let resolveSecond
    const fetchData = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveFirst = () =>
              resolve({
                rows: [{ id: 'first' }],
                rowCount: 100
              })
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveSecond = () =>
              resolve({
                rows: [{ id: 'second' }],
                rowCount: 200
              })
          })
      )
    const onBufferChange = jest.fn()
    const resultRef = { current: null }

    let deps = ['a']
    const { rerender } = render(
      <HookWrapper
        resultRef={resultRef}
        hookProps={{
          enabled: true,
          fetchData,
          onBufferChange,
          resetDeps: deps
        }}
      />
    )

    // First fetch is pending
    expect(fetchData).toHaveBeenCalledTimes(1)

    // Trigger a second fetch (deps change)
    deps = ['b']
    rerender(
      <HookWrapper
        resultRef={resultRef}
        hookProps={{
          enabled: true,
          fetchData,
          onBufferChange,
          resetDeps: deps
        }}
      />
    )
    expect(fetchData).toHaveBeenCalledTimes(2)

    // Resolve second fetch first
    await act(async () => {
      resolveSecond()
    })
    expect(onBufferChange).toHaveBeenCalledTimes(1)
    expect(onBufferChange).toHaveBeenCalledWith(
      expect.objectContaining({ rows: [{ id: 'second' }] })
    )

    // Resolve first fetch (should be ignored as stale)
    await act(async () => {
      resolveFirst()
    })
    // Should still only have been called once (stale result discarded)
    expect(onBufferChange).toHaveBeenCalledTimes(1)
  })

  it('debounces range-triggered fetches', async () => {
    jest.useFakeTimers()

    const fetchData = jest.fn().mockResolvedValue({
      rows: Array.from({ length: 500 }, (_, i) => ({ id: i })),
      rowCount: 10000
    })
    const resultRef = { current: null }

    render(
      <HookWrapper
        resultRef={resultRef}
        hookProps={{
          enabled: true,
          fetchData,
          onBufferChange: jest.fn(),
          bufferSize: 500,
          bufferPadding: 100,
          debounceMs: 150
        }}
      />
    )

    // Wait for initial fetch
    await act(async () => {
      jest.advanceTimersByTime(0)
    })
    expect(fetchData).toHaveBeenCalledTimes(1)

    // Simulate range change near buffer edge
    act(() => {
      resultRef.current.onRangeChange({ startIndex: 380, endIndex: 410 })
    })

    // Should not fetch immediately
    expect(fetchData).toHaveBeenCalledTimes(1)

    // Advance past debounce time
    act(() => {
      jest.advanceTimersByTime(200)
    })

    // Now should have fetched (near end of buffer at 500, padding=100)
    expect(fetchData).toHaveBeenCalledTimes(2)
  })

  it('does not fetch when range is well within buffer', async () => {
    jest.useFakeTimers()

    const fetchData = jest.fn().mockResolvedValue({
      rows: Array.from({ length: 500 }, (_, i) => ({ id: i })),
      rowCount: 10000
    })
    const resultRef = { current: null }

    render(
      <HookWrapper
        resultRef={resultRef}
        hookProps={{
          enabled: true,
          fetchData,
          onBufferChange: jest.fn(),
          bufferSize: 500,
          bufferPadding: 100,
          debounceMs: 150
        }}
      />
    )

    await act(async () => {
      jest.advanceTimersByTime(0)
    })
    expect(fetchData).toHaveBeenCalledTimes(1)

    // Range well within buffer (buffer is 0-500, padding is 100)
    act(() => {
      resultRef.current.onRangeChange({ startIndex: 200, endIndex: 220 })
    })

    act(() => {
      jest.advanceTimersByTime(200)
    })

    // Should NOT have fetched again
    expect(fetchData).toHaveBeenCalledTimes(1)
  })
})
