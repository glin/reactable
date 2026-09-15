import React from 'react'
import { render, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { Reactable, getInstance } from '../Reactable'
import { createLazyDetails, LazyRowDetails } from '../lazyDetails'
import { getExpanders, getHeaders } from './utils/test-utils'

let handlers
let htmlBinding
let outputBinding
const config = { id: 'table1', inputId: '__reactable_lazy__' }
const columns = [{ id: 'value', name: 'Value', details: { lazy: true } }]
const requests = () => window.Shiny.setInputValue.mock.calls.flatMap(call => JSON.parse(call[1]))
const flush = () =>
  act(() => {
    jest.runOnlyPendingTimers()
  })

beforeEach(() => {
  jest.useFakeTimers()
  handlers = {}
  htmlBinding = { name: 'shiny.htmlOutput', renderValue: jest.fn(), onValueError: jest.fn() }
  window.Shiny = {
    setInputValue: jest.fn(),
    onInputChange: jest.fn(),
    addCustomMessageHandler: jest.fn((name, handler) => {
      handlers[name] = handler
    }),
    bindAll: jest.fn(() => Promise.resolve()),
    unbindAll: jest.fn(),
    outputBindings: {
      getBindings: () => [{ binding: htmlBinding }],
      register: binding => {
        outputBinding = binding
      }
    }
  }
})
afterEach(() => {
  jest.useRealTimers()
})

test('no startup work, one request per expansion, fresh request on reopening', () => {
  const { container, unmount } = render(
    <Reactable data={{ value: ['A', 'B'] }} columns={columns} lazyDetails={config} />
  )
  flush()
  expect(requests()).toEqual([])
  fireEvent.click(getExpanders(container)[0])
  flush()
  const first = requests()[0]
  expect(first).toMatchObject({ action: 'open', index: 1, column: 'value', table: 'table1' })
  fireEvent.click(getExpanders(container)[0])
  flush()
  expect(requests()[1]).toMatchObject({ action: 'close', request: first.request })
  fireEvent.click(getExpanders(container)[0])
  flush()
  expect(requests()[2].request).not.toBe(first.request)
  unmount()
  flush()
  expect(requests().at(-1).action).toBe('dispose')
})

test('a new lazy registration resets expanded panels even when data is unchanged', () => {
  const props = { data: { value: ['A'] }, columns, lazyDetails: config }
  const { container, rerender, unmount } = render(<Reactable {...props} />)
  fireEvent.click(getExpanders(container)[0])
  flush()
  expect(requests().filter(request => request.action === 'open')).toHaveLength(1)
  rerender(<Reactable {...props} lazyDetails={{ ...config, id: 'table2' }} />)
  flush()
  expect(getExpanders(container)[0]).toHaveAttribute('aria-expanded', 'false')
  expect(requests().filter(request => request.action === 'open')).toHaveLength(1)
  expect(requests()).toContainEqual({ table: 'table1', action: 'dispose' })
  unmount()
  flush()
})

test('sorting requests the original data index', () => {
  const { container, unmount } = render(
    <Reactable data={{ value: ['B', 'A'] }} columns={columns} lazyDetails={config} />
  )
  fireEvent.click(getHeaders(container)[0])
  fireEvent.click(getExpanders(container)[0])
  flush()
  expect(requests()[0].index).toBe(2)
  unmount()
  flush()
})

test('expand-all batches sibling requests without dropping them', () => {
  const { unmount } = render(
    <Reactable
      data={{ value: ['A', 'B', 'C'] }}
      columns={columns}
      lazyDetails={config}
      defaultExpanded
    />
  )
  flush()
  expect(
    requests()
      .filter(request => request.action === 'open')
      .map(request => request.index)
  ).toEqual([1, 2, 3])
  unmount()
  flush()
})

test('late registration after collapse cannot bind to the reopened panel', () => {
  const { container, unmount } = render(
    <Reactable data={{ value: ['A'] }} columns={columns} lazyDetails={config} />
  )
  fireEvent.click(getExpanders(container)[0])
  flush()
  const first = requests()[0]
  fireEvent.click(getExpanders(container)[0])
  flush()
  fireEvent.click(getExpanders(container)[0])
  flush()
  const second = requests()[2]
  act(() => handlers.__reactable_lazy__({ ...first, outputId: 'old' }))
  expect(container.querySelector('#old')).toBeNull()
  act(() => handlers.__reactable_lazy__({ ...second, outputId: 'new' }))
  expect(container.querySelector('#new')).not.toBeNull()
  expect(window.Shiny.bindAll).toHaveBeenCalledTimes(1)
  unmount()
  flush()
})

test('an offscreen remount retains the same detail DOM and calculation', () => {
  const manager = createLazyDetails(config)
  const { container, rerender, unmount } = render(
    <LazyRowDetails manager={manager} rowId="0" index={0} column="value" />
  )
  flush()
  act(() => handlers.__reactable_lazy__({ ...requests()[0], outputId: 'retained' }))
  const node = container.querySelector('#retained')
  rerender(<div />)
  rerender(<LazyRowDetails manager={manager} rowId="0" index={0} column="value" />)
  flush()
  expect(container.querySelector('#retained')).toBe(node)
  expect(requests()).toHaveLength(1)
  expect(window.Shiny.bindAll).toHaveBeenCalledTimes(1)
  unmount()
  manager.dispose()
  flush()
})

test('table identities isolate replies and disposal', () => {
  const first = createLazyDetails(config)
  const second = createLazyDetails({ ...config, id: 'table2' })
  const { container, unmount } = render(
    <>
      <LazyRowDetails manager={first} rowId="0" index={0} column="value" />
      <LazyRowDetails manager={second} rowId="0" index={0} column="value" />
    </>
  )
  flush()
  const open = requests().filter(request => request.table === 'table2')[0]
  first.dispose()
  flush()
  act(() => handlers.__reactable_lazy__({ ...open, outputId: 'second' }))
  expect(container.querySelector('#second')).not.toBeNull()
  unmount()
  second.dispose()
  flush()
})

test('switching details columns closes the previous panel', () => {
  const manager = createLazyDetails(config)
  const { unmount } = render(
    <LazyRowDetails manager={manager} rowId="0" index={0} column="value" />
  )
  flush()
  manager.retain({ 0: true }, { 0: 'other' }, [{ id: 'other', details: { lazy: true } }])
  flush()
  expect(requests()[1].action).toBe('close')
  unmount()
  manager.dispose()
  flush()
})

test('client-only data replacement is rejected for lazy callbacks', () => {
  const { unmount } = render(
    <Reactable
      data={{ value: ['A'] }}
      columns={columns}
      elementId="lazy-test"
      lazyDetails={config}
    />
  )
  expect(() => getInstance('lazy-test').setData({ value: ['B'] })).toThrow('rerendering')
  unmount()
  flush()
})

test('asynchronous binding finishing after collapse is cleaned up', async () => {
  let finishBinding
  window.Shiny.bindAll.mockImplementation(
    () =>
      new Promise(resolve => {
        finishBinding = resolve
      })
  )
  const manager = createLazyDetails(config)
  const { unmount } = render(
    <LazyRowDetails manager={manager} rowId="0" index={0} column="value" />
  )
  flush()
  act(() => handlers.__reactable_lazy__({ ...requests()[0], outputId: 'async' }))
  manager.retain({}, {}, columns)
  expect(window.Shiny.unbindAll).toHaveBeenCalledTimes(1)
  await act(async () => {
    finishBinding()
    await Promise.resolve()
  })
  expect(window.Shiny.unbindAll).toHaveBeenCalledTimes(2)
  unmount()
  manager.dispose()
  flush()
})

test('removing dynamic UI disposes the registration', async () => {
  const manager = createLazyDetails(config)
  const host = document.createElement('div')
  document.body.appendChild(host)
  manager.observe(host)
  host.remove()
  await act(async () => {
    await Promise.resolve()
  })
  flush()
  expect(requests().at(-1)).toMatchObject({ table: 'table1', action: 'dispose' })
})

test('dependency rendering that finishes after reopening cleans only the closed panel', async () => {
  let finishRendering
  htmlBinding.renderValue.mockImplementation(
    () =>
      new Promise(resolve => {
        finishRendering = resolve
      })
  )
  const { container, unmount } = render(
    <Reactable data={{ value: ['A'] }} columns={columns} lazyDetails={config} />
  )
  fireEvent.click(getExpanders(container)[0])
  flush()
  act(() => handlers.__reactable_lazy__({ ...requests()[0], outputId: 'delayed' }))
  const output = container.querySelector('#delayed')
  const host = output.parentElement
  let rendering
  act(() => {
    rendering = outputBinding.renderValue(output, { html: 'detail', deps: [] })
  })
  expect(host).toHaveAttribute('aria-busy', 'true')
  fireEvent.click(getExpanders(container)[0])
  fireEvent.click(getExpanders(container)[0])
  flush()
  const currentHost = container.querySelector('[data-reactable-lazy-retained]')
  window.Shiny.unbindAll.mockClear()
  await act(async () => {
    finishRendering()
    await rendering
  })
  expect(window.Shiny.unbindAll).toHaveBeenCalledWith(host)
  expect(window.Shiny.unbindAll).not.toHaveBeenCalledWith(currentHost)
  expect(host).not.toHaveAttribute('data-reactable-lazy-retained')
  unmount()
  flush()
})

test('loading status ends after native HTML rendering completes, including synchronous Shiny', async () => {
  const manager = createLazyDetails(config)
  const { container, unmount } = render(
    <LazyRowDetails manager={manager} rowId="0" index={0} column="value" />
  )
  flush()
  act(() => handlers.__reactable_lazy__({ ...requests()[0], outputId: 'ready' }))
  const output = container.querySelector('#ready')
  await act(async () => {
    await outputBinding.renderValue(output, null)
  })
  expect(htmlBinding.renderValue).toHaveBeenCalledWith(output, null)
  expect(output.parentElement).toHaveAttribute('aria-busy', 'false')
  expect(container.querySelector('[role="status"]')).toBeNull()
  unmount()
  manager.dispose()
  flush()
})
