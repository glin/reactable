import React from 'react'
import * as ReactDOMServer from 'react-dom/server'
import TestRenderer from 'react-test-renderer'
import createEmotionServer from '@emotion/server/create-instance'

import Reactable from './Reactable'
import { ReactableData } from './Reactable'
import { evaluateStringMember } from './htmlwidgets'
import './intl-polyfill'
import { getEmotion } from './theme'

// Provide React as a global for users that call React externally in custom JS render functions.
// Although `global` may not necessarily be available in V8, it is in reactable's V8 context,
// and Webpack transforms this to a portable assignment that doesn't assume `global` exists anyway.
global.React = React

const cache = getEmotion().cache
const { extractCritical } = createEmotionServer(cache)

// Render to HTML for static rendering
export function renderToHTML(inputJson) {
  const input = JSON.parse(inputJson)

  const props = input.props
  // Table data comes through double-serialized, first with reactable's custom serialization
  // options, and then with the htmlwidgets default serialization.
  props.data = JSON.parse(props.data)

  // Resolve strings marked as JavaScript literals to objects
  if (input.evals) {
    for (let key of input.evals) {
      evaluateStringMember(props, key)
    }
  }

  const { html, css, ids } = extractCritical(
    ReactDOMServer.renderToString(<Reactable {...props} />)
  )
  return { html, css, ids }
}

let initialProps
export function setInitialProps(inputJson) {
  const start = Date.now()
  const input = JSON.parse(inputJson)
  const { props, evals } = input
  // Resolve strings marked as JavaScript literals to objects
  if (evals) {
    for (let key of evals) {
      evaluateStringMember(props, key)
    }
  }
  initialProps = props
  const end = Date.now()
  debugLog('setInitialProps() JSON parse time: ', end - start)
  debugLog('setInitialProps() initial props: ', JSON.stringify(initialProps, null, 2))
}

let testRenderer

// Render to JSON data for server-side data processing
export function renderToData(inputJson) {
  const input = JSON.parse(inputJson)
  debugLog('renderToData() input: ', JSON.stringify(input, null, 2))
  const { props, evals } = input

  // Resolve strings marked as JavaScript literals to objects, e.g., searchMethod
  if (evals) {
    for (let key of evals) {
      evaluateStringMember(props, key)
    }
  }

  let result
  const setResolvedData = data => {
    result = data
  }

  if (!testRenderer) {
    const start = Date.now()
    testRenderer = TestRenderer.create(
      <ReactableData {...initialProps} {...props} setResolvedData={setResolvedData} />
    )
    const end = Date.now()
    debugLog('TestRenderer create time: ', end - start)
  } else {
    const start = Date.now()
    testRenderer.update(
      <ReactableData {...initialProps} {...props} setResolvedData={setResolvedData} />
    )
    const end = Date.now()
    debugLog('TestRenderer update time: ', end - start)
  }

  return result
}

// Only used for testing
export function resetTestRenderer() {
  initialProps = null
  testRenderer = null
}

let debugLoggingEnabled
export function enableDebugLogging(enabled = true) {
  debugLoggingEnabled = enabled
}

function debugLog(...args) {
  if (!debugLoggingEnabled) {
    return
  }
  console.log('DEBUG ', ...args)
}
