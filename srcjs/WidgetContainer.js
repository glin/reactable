import React from 'react'
import PropTypes from 'prop-types'

import { isBrowser } from './utils'

export default class WidgetContainer extends React.Component {
  componentDidMount() {
    this.staticRender()
  }

  staticRender() {
    if (!window.HTMLWidgets) {
      return
    }
    if (!WidgetContainer.throttled) {
      window.HTMLWidgets.staticRender()
      // Throttle static rendering since it targets the entire document
      WidgetContainer.throttled = true
      if (typeof setTimeout !== 'undefined') {
        setTimeout(() => {
          if (WidgetContainer.lastCall) {
            window.HTMLWidgets.staticRender()
          }
          WidgetContainer.throttled = false
          WidgetContainer.lastCall = false
        })
      }
    } else {
      WidgetContainer.lastCall = true
    }
  }

  render() {
    // Don't serialize HTML widget HTML/scripts when server-side rendering:
    // 1. Most HTML widgets are client-side rendered and wouldn't benefit much from SSR.
    // 2. This keeps the initial HTML payload slim, as the widget script data would be
    //    unnecessarily duplicated.
    // 3. Problems can occur when multiple instances of the same HTML widget type
    //    are embedded in different tables, and the global HTMLWidgets.staticRender()
    //    renders HTML widgets in other tables before those other tables are hydrated
    //    (each table lives in its own React root). When other tables are hydrated,
    //    the HTML widgets there will get wiped out, but not rerendered on the next
    //    staticRender() because the root widget element is already marked as
    //    html-widget-static-bound. This also helps keep the initial HTML payload slim,
    //    as the widget script data would get unnecessarily duplicated.
    if (!isBrowser()) {
      return null
    }
    return this.props.children
  }
}

WidgetContainer.propTypes = {
  children: PropTypes.node
}
