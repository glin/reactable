import createEmotion from '@emotion/css/create-instance'

import { isBrowser, removeEmptyProps } from './utils'

export function createTheme(options) {
  if (!options) return null
  let {
    color,
    backgroundColor,
    borderColor,
    borderWidth,
    stripedColor,
    highlightColor,
    cellPadding,
    style,

    tableBorderColor = borderColor,
    tableBorderWidth = borderWidth,
    tableStyle,

    headerBorderColor = borderColor,
    headerBorderWidth = borderWidth,
    headerStyle,

    groupHeaderBorderColor = borderColor,
    groupHeaderBorderWidth = borderWidth,
    groupHeaderStyle,

    tableBodyStyle,

    rowGroupStyle,

    rowStyle,
    rowStripedStyle,
    rowHighlightStyle,
    rowSelectedStyle,

    cellBorderColor = borderColor,
    cellBorderWidth = borderWidth,
    cellStyle,

    footerBorderColor = borderColor,
    footerBorderWidth = borderWidth,
    footerStyle,

    inputStyle,
    filterInputStyle,
    searchInputStyle,

    selectStyle,

    paginationStyle,
    pageButtonStyle,
    pageButtonHoverStyle,
    pageButtonActiveStyle,
    pageButtonCurrentStyle
  } = options

  const expanderColor = getFirstDefinedProp(
    [cellStyle, rowStyle, tableBodyStyle, tableStyle, style],
    'color',
    color
  )
  const selectColor = getFirstDefinedProp([selectStyle, style], 'color', color)

  // Allow easier override of header border width in an outlined/bordered table
  headerBorderWidth = getFirstDefinedProp([headerStyle], 'borderWidth', headerBorderWidth)

  let css = {
    style: {
      color,
      backgroundColor,
      ...style
    },

    tableStyle: {
      borderColor: tableBorderColor,
      borderWidth: tableBorderWidth,
      ...tableStyle
    },

    headerStyle: {
      borderColor: headerBorderColor,
      borderWidth: headerBorderWidth,
      padding: cellPadding,
      ...headerStyle,
      '.rt-bordered &, .rt-outlined &': {
        borderWidth: headerBorderWidth
      }
    },

    groupHeaderStyle: {
      // For vertical borders
      borderColor: groupHeaderBorderColor,
      borderWidth: groupHeaderBorderWidth,
      padding: cellPadding,
      ...groupHeaderStyle,
      // For horizontal borders
      '&::after': {
        backgroundColor: groupHeaderBorderColor,
        height: groupHeaderBorderWidth
      },
      '.rt-bordered &': {
        borderWidth: groupHeaderBorderWidth
      }
    },

    tableBodyStyle,

    rowGroupStyle,

    rowStyle: {
      ...rowStyle,
      '&.rt-tr-striped': {
        backgroundColor: stripedColor,
        ...rowStripedStyle
      },
      '&.rt-tr-striped-sticky': {
        backgroundColor: stripedColor,
        ...rowStripedStyle
      },
      '&.rt-tr-highlight:hover': {
        backgroundColor: highlightColor,
        ...rowHighlightStyle
      },
      '&.rt-tr-highlight-sticky:hover': {
        backgroundColor: highlightColor,
        ...rowHighlightStyle
      },
      '&.rt-tr-selected': {
        ...rowSelectedStyle
      }
    },

    cellStyle: {
      borderColor: cellBorderColor,
      borderWidth: cellBorderWidth,
      padding: cellPadding,
      ...cellStyle
    },

    footerStyle: {
      borderColor: footerBorderColor,
      borderWidth: footerBorderWidth,
      padding: cellPadding,
      ...footerStyle
    },

    filterCellStyle: {
      borderColor: cellBorderColor,
      borderWidth: cellBorderWidth,
      padding: cellPadding,
      ...cellStyle
    },

    expanderStyle: {
      '&::after': {
        borderTopColor: expanderColor
      }
    },

    filterInputStyle: {
      ...inputStyle,
      ...filterInputStyle
    },

    searchInputStyle: {
      ...inputStyle,
      ...searchInputStyle
    },

    paginationStyle: {
      borderTopColor: cellBorderColor,
      borderTopWidth: cellBorderWidth,
      ...paginationStyle,

      '.rt-page-jump': {
        ...inputStyle
      },

      '.rt-page-size-select': {
        ...selectStyle,
        '@supports (-moz-appearance: none)': {
          backgroundImage:
            selectColor &&
            `url('data:image/svg+xml;charset=US-ASCII,` +
              `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">` +
              // Colors should be URL encoded since they may contain # or parentheses
              `<path fill="${urlEncode(selectColor)}" d="M24 1.5l-12 21-12-21h24z"/></svg>')`
        }
      },

      '.rt-page-button': {
        ...pageButtonStyle
      },
      '.rt-page-button:not(:disabled):hover': {
        ...pageButtonHoverStyle
      },
      '.rt-page-button:not(:disabled):active': {
        ...pageButtonActiveStyle
      },
      '.rt-keyboard-active & .rt-page-button:not(:disabled):focus': {
        ...pageButtonHoverStyle
      },
      '.rt-page-button-current': {
        ...pageButtonCurrentStyle
      }
    }
  }

  removeEmptyProps(css)

  return css
}

function getFirstDefinedProp(objects, prop, defaultVal) {
  const found = objects.find(x => x && x[prop] != null)
  return found ? found[prop] : defaultVal
}

// URL encoder that escapes parentheses (for data URLs)
function urlEncode(str) {
  return encodeURIComponent(str).replace('(', '%28').replace(')', '%29')
}

// Defer Emotion initialization until DOM is loaded and theming is used
let emotion
export function getEmotion() {
  if (emotion) {
    return emotion
  }
  // Emotion appends style tags to head by default. Instead, we insert styles
  // immediately after the reactable stylesheet for two reasons:
  //
  // 1. Some HTML documents (pkgdown) may place htmlDependencies in the body
  //    instead of head, causing Emotion theme styles in head to come before the
  //    the reactable stylesheet and not override default styles properly.
  //    R Markdown and Shiny put htmlDependencies in head properly.
  // 2. User styles in head may be overrided by the theme since Emotion appends to
  //    the end of head, after any existing styles in head. This is not as important
  //    as reason 1, however.
  let container
  let insertionPoint
  if (isBrowser()) {
    for (let link of document.querySelectorAll('link')) {
      const filename = link.href.substring(link.href.lastIndexOf('/') + 1)
      if (link.rel === 'stylesheet' && filename === 'reactable.css') {
        container = link.parentElement
        insertionPoint = link
        break
      }
    }
  }
  emotion = createEmotion({
    // Class prefix and unique key to prevent conflicts with other Emotion instances
    key: 'reactable',
    container: container,
    insertionPoint: insertionPoint
  })
  return emotion
}

// Reset Emotion instance and styles, intended for testing use only
export function resetEmotion() {
  if (emotion) {
    emotion.flush()
    emotion = null
  }
}

// Emotion css wrapper that returns null instead of an unused class
export function css(...args) {
  const emotion = getEmotion()
  args = args.filter(arg => arg != null)
  return args.length ? emotion.css(args) : null
}
