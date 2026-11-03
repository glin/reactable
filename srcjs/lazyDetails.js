import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

// One message handler, with table and request identities preventing stale replies
// from binding to a newly opened panel. Requests are batched so expand-all does
// not overwrite sibling requests in Shiny's input queue.
const managers = new Map()
let shinyConnection
let nextRequest = 0
const pending = new Map()
let flushTimer
const outputCompletions = new WeakMap()

function send(config, event) {
  const events = pending.get(config.inputId) || []
  events.push({ table: config.id, ...event })
  pending.set(config.inputId, events)
  if (flushTimer == null) {
    flushTimer = setTimeout(() => {
      flushTimer = null
      for (const [inputId, requests] of pending) {
        // Shiny simplifies array inputs, which can flatten a single request and
        // coerce its numeric row index to a string. Preserve the JSON structure.
        window.Shiny.setInputValue(inputId, JSON.stringify(requests), { priority: 'event' })
      }
      pending.clear()
    }, 0)
  }
}

function connect() {
  if (shinyConnection === window.Shiny) return
  shinyConnection = window.Shiny
  window.Shiny.addCustomMessageHandler('__reactable_lazy__', message => {
    managers.get(message.table)?.registered(message)
  })
  // Delegate HTML/dependency rendering to Shiny, but also observe its completion.
  // In recent Shiny versions dependencies load asynchronously: collapse can run
  // before renderValue finishes binding inputs into an already detached panel.
  const htmlBinding = window.Shiny.outputBindings
    .getBindings()
    .find(({ binding }) => binding.name === 'shiny.htmlOutput').binding
  const binding = Object.create(htmlBinding)
  binding.find = scope => window.jQuery(scope).find('.rt-lazy-output')
  binding.renderValue = function (element, value) {
    const complete = () => outputCompletions.get(element)?.()
    try {
      return Promise.resolve(htmlBinding.renderValue.call(this, element, value)).then(
        complete,
        error => {
          complete()
          throw error
        }
      )
    } catch (error) {
      complete()
      throw error
    }
  }
  binding.onValueError = function (element, error) {
    htmlBinding.onValueError.call(this, element, error)
    outputCompletions.get(element)?.()
  }
  window.Shiny.outputBindings.register(binding, 'reactable.lazyDetails')
}

function unbindPanel(panel) {
  panel.host.querySelectorAll('.reactable.html-widget').forEach(element => {
    ReactDOM.unmountComponentAtNode(element)
  })
  window.Shiny.unbindAll(panel.host)
}

export function createLazyDetails(config) {
  if (!config) return null
  const panels = new Map()
  let disposed = false
  let removalObserver

  const manager = {
    observe(element) {
      if (!window.MutationObserver) return
      removalObserver = new window.MutationObserver(() => {
        // Shiny can remove dynamic UI without unmounting the htmlwidget's React
        // root. Hidden routes remain connected, and retained virtual panels
        // deliberately remain alive while detached.
        if (!element.isConnected && !element.closest('[data-reactable-lazy-retained]')) {
          manager.dispose()
        }
      })
      removalObserver.observe(document.documentElement, { childList: true, subtree: true })
    },
    mount(rowId, index, column, container) {
      if (disposed) return
      connect()
      managers.set(config.id, manager)
      const key = JSON.stringify([rowId, column])
      let panel = panels.get(key)
      if (!panel) {
        const request = `r${++nextRequest}`
        const host = document.createElement('div')
        host.setAttribute('data-reactable-lazy-retained', '')
        const loading = document.createElement('div')
        loading.className = 'rt-details-loading'
        loading.setAttribute('role', 'status')
        loading.textContent = 'Calculating details...'
        host.setAttribute('aria-busy', 'true')
        host.appendChild(loading)
        panel = { key, rowId, column, request, host, loading, output: null, binding: false }
        panels.set(key, panel)
        send(config, { action: 'open', request, index: index + 1, column })
      }
      container.appendChild(panel.host)
      manager.bind(panel)
      // Dependencies may finish while this expanded panel is offscreen. The
      // htmlwidget scanner only visits connected DOM, so initialize any widgets
      // it missed when the panel returns. Already bound widgets are skipped.
      if (panel.output && window.HTMLWidgets) window.HTMLWidgets.staticRender()
    },
    registered(message) {
      const panel = [...panels.values()].find(panel => panel.request === message.request)
      if (!panel || disposed || panel.output) return
      const output = document.createElement('div')
      output.id = message.outputId
      output.className = 'rt-lazy-output'
      panel.output = output
      panel.host.appendChild(output)
      outputCompletions.set(output, () => {
        if (panel.closed) {
          unbindPanel(panel)
        } else {
          panel.loading.remove()
          panel.host.setAttribute('aria-busy', 'false')
        }
      })
      manager.bind(panel)
    },
    bind(panel) {
      if (!panel.output || panel.binding || !panel.host.isConnected) return
      panel.binding = true
      Promise.resolve(window.Shiny.bindAll(panel.host))
        .then(() => {
          // bindAll can finish after a fast collapse. Release any bindings it
          // attached after close() performed its initial cleanup.
          if (panel.closed) unbindPanel(panel)
        })
        .catch(error => {
          panel.loading.textContent = 'Could not display details. Close and reopen to retry.'
          panel.host.setAttribute('aria-busy', 'false')
          console.error('reactable lazy details:', error)
        })
    },
    retain(expanded, expandedColumns, visibleColumns) {
      for (const panel of panels.values()) {
        const column =
          expandedColumns[panel.rowId] != null
            ? expandedColumns[panel.rowId]
            : visibleColumns.find(column => column.details)?.id
        if (
          !expanded[panel.rowId] ||
          column !== panel.column ||
          !visibleColumns.some(column => column.id === panel.column)
        ) {
          manager.close(panel)
        }
      }
    },
    close(panel) {
      panels.delete(panel.key)
      panel.closed = true
      // Nested htmlwidgets create independent React roots. Unmount those roots
      // as well as Shiny bindings, including roots retained offscreen.
      unbindPanel(panel)
      panel.host.removeAttribute('data-reactable-lazy-retained')
      panel.host.remove()
      send(config, { action: 'close', request: panel.request })
    },
    dispose() {
      if (disposed) return
      disposed = true
      removalObserver?.disconnect()
      for (const panel of [...panels.values()]) manager.close(panel)
      if (managers.get(config.id) === manager) managers.delete(config.id)
      send(config, { action: 'dispose' })
    }
  }
  return manager
}

// React owns the empty slot; Shiny owns its retained child DOM. A virtual row
// unmount detaches the DOM but does not close the logical expanded detail.
export function LazyRowDetails({ manager, rowId, index, column }) {
  const container = React.useRef(null)
  React.useLayoutEffect(() => {
    const element = container.current
    manager.mount(rowId, index, column, element)
    return () => {
      while (element.firstChild) element.removeChild(element.firstChild)
    }
  }, [manager, rowId, index, column])
  return <div className="rt-tr-details" ref={container} />
}

LazyRowDetails.propTypes = {
  manager: PropTypes.object.isRequired,
  rowId: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  column: PropTypes.string.isRequired
}
