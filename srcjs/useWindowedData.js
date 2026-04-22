import React from 'react'

const DEFAULT_BUFFER_SIZE = 500
const DEFAULT_BUFFER_PADDING = 100
const DEFAULT_DEBOUNCE_MS = 150

/**
 * Hook for windowed/virtual fetching of backend data.
 *
 * Only fetches rows around the visible viewport instead of all rows at once.
 * Used when virtual = TRUE and pagination = FALSE with a backend (DuckDB or server-side).
 *
 * @param {Object} options
 * @param {boolean} options.enabled - Whether windowed fetching is active
 * @param {Function} options.fetchData - async (offset, limit) => { rows, rowCount }
 * @param {Function} options.onBufferChange - Called with { start, end, rows, rowCount } when buffer changes
 * @param {number} [options.initialTotalRowCount=0] - Initial total row count (from pre-rendered data)
 * @param {number} [options.bufferSize=500] - Number of rows per buffer
 * @param {number} [options.bufferPadding=100] - Trigger refetch when visible range is within this many rows of edge
 * @param {number} [options.debounceMs=150] - Debounce time for scroll-triggered fetches
 * @param {Array} [options.resetDeps=[]] - When these change, reset buffer and fetch from row 0
 * @param {Array} [options.refetchDeps=[]] - When these change, refetch at current position
 * @returns {{ totalRowCount: number, onRangeChange: Function|null, isLoading: boolean }}
 */
export function useWindowedData({
  enabled,
  fetchData,
  onBufferChange,
  initialTotalRowCount = 0,
  bufferSize = DEFAULT_BUFFER_SIZE,
  bufferPadding = DEFAULT_BUFFER_PADDING,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  resetDeps = [],
  refetchDeps = []
}) {
  const [totalRowCount, setTotalRowCount] = React.useState(initialTotalRowCount)
  const [isLoading, setIsLoading] = React.useState(false)

  const bufferRef = React.useRef(null) // { start, end }
  const fetchDataRef = React.useRef(fetchData)
  fetchDataRef.current = fetchData
  const onBufferChangeRef = React.useRef(onBufferChange)
  onBufferChangeRef.current = onBufferChange
  const fetchIdRef = React.useRef(0)
  const debounceTimerRef = React.useRef(null)

  const doFetch = React.useCallback(
    offset => {
      fetchIdRef.current++
      const fetchId = fetchIdRef.current
      setIsLoading(true)

      fetchDataRef.current(offset, bufferSize).then(
        result => {
          if (fetchId !== fetchIdRef.current) return // stale
          const buffer = {
            start: offset,
            end: offset + result.rows.length,
            rows: result.rows,
            rowCount: result.rowCount
          }
          bufferRef.current = { start: buffer.start, end: buffer.end }
          setTotalRowCount(result.rowCount)
          setIsLoading(false)
          onBufferChangeRef.current(buffer)
        },
        err => {
          if (fetchId !== fetchIdRef.current) return
          console.error('Windowed fetch failed:', err)
          setIsLoading(false)
        }
      )
    },
    [bufferSize]
  )

  // Fetch when resetDeps or refetchDeps change.
  // - resetDeps change (sort/filter/search): fetch from offset 0
  // - refetchDeps change (expand/collapse): fetch at current buffer position
  // - Initial mount: fetch from offset 0
  const resetDepsKey = JSON.stringify(resetDeps)
  const refetchDepsKey = JSON.stringify(refetchDeps)
  const prevResetKeyRef = React.useRef(resetDepsKey)
  const prevRefetchKeyRef = React.useRef(refetchDepsKey)

  React.useEffect(() => {
    if (!enabled) return

    const resetChanged = resetDepsKey !== prevResetKeyRef.current
    const refetchChanged = refetchDepsKey !== prevRefetchKeyRef.current
    prevResetKeyRef.current = resetDepsKey
    prevRefetchKeyRef.current = refetchDepsKey

    if (resetChanged) {
      // Sort/filter/search changed: invalidate buffer, fetch from start
      bufferRef.current = null
      doFetch(0)
    } else if (refetchChanged) {
      // Expand/collapse changed: refetch at current position
      const currentStart = bufferRef.current?.start ?? 0
      doFetch(currentStart)
    } else {
      // Initial mount
      doFetch(0)
    }
  }, [enabled, resetDepsKey, refetchDepsKey, doFetch])

  // Handle visible range changes from VirtualTbody (debounced)
  const onRangeChange = React.useCallback(
    range => {
      if (!enabled || !range) return

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        const { startIndex, endIndex } = range
        const currentBuffer = bufferRef.current

        if (!currentBuffer) return

        // Check if visible range is near buffer edges or completely outside
        const nearStart = startIndex < currentBuffer.start + bufferPadding
        const nearEnd = endIndex > currentBuffer.end - bufferPadding
        const outsideBuffer = endIndex < currentBuffer.start || startIndex > currentBuffer.end

        if (!nearStart && !nearEnd && !outsideBuffer) return

        // Center new buffer on visible range
        const visibleCenter = Math.floor((startIndex + endIndex) / 2)
        const newStart = Math.max(0, visibleCenter - Math.floor(bufferSize / 2))

        // Skip if the new start is the same as the current buffer (e.g., initial mount)
        if (newStart === currentBuffer.start) return

        doFetch(newStart)
      }, debounceMs)
    },
    [enabled, bufferSize, bufferPadding, debounceMs, doFetch]
  )

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  if (!enabled) {
    return { totalRowCount: initialTotalRowCount, onRangeChange: null, isLoading: false }
  }

  return { totalRowCount, onRangeChange, isLoading }
}
