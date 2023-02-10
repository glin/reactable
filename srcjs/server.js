import React from 'react'
import * as ReactDOMServer from 'react-dom/server'
import createEmotionServer from '@emotion/server/create-instance'

import Reactable from './Reactable'
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
