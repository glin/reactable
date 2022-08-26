/*
 * Adapted from reactR 0.4.4 (https://github.com/react-R/reactR/blob/v0.4.4/srcjs/widget.js)
 * Copyright 2018 Kent Russell
 * Licensed under MIT (https://github.com/react-R/reactR/blob/v0.4.4/LICENSE)
 */

import React from 'react'
import ReactDOM from 'react-dom'

// Modified reactWidget() that additionally supports hydration of server-rendered markup.
export function reactWidget(name, type, components) {
  window.HTMLWidgets.widget({
    name: name,
    type: type,
    factory: function (el) {
      return {
        renderValue(value) {
          if (el.hasAttribute('data-react-ssr')) {
            ReactDOM.hydrate(hydrate(components, value.tag), el)
          } else {
            ReactDOM.render(hydrate(components, value.tag), el)
          }
        },
        resize() {
          // resize() is required, but unused
        }
      }
    }
  })
}

// Must be bundled because react-tools.js needs to be run in a browser context
// and can't be sourced at runtime in V8.
export function hydrate(components, tag) {
  if (typeof tag === 'string') return tag
  if (tag.name[0] === tag.name[0].toUpperCase() && !components[tag.name]) {
    throw new Error('Unknown component: ' + tag.name)
  }
  const elem = components[tag.name] || tag.name
  const args = [elem, tag.attribs]
  for (let child of tag.children) {
    args.push(hydrate(components, child))
  }
  return React.createElement(...args)
}
