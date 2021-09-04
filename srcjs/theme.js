import { css as emotionCss } from '@emotion/css'

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
      '&.rt-tr-highlight:hover': {
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

// Remove undefined/null properties and empty objects
function removeEmptyProps(obj) {
  for (let [key, value] of Object.entries(obj)) {
    if (typeof value === 'object') {
      removeEmptyProps(value)
      if (Object.keys(value).length === 0) {
        delete obj[key]
      }
    } else if (value == null) {
      delete obj[key]
    }
  }
}

// Emotion css wrapper that returns null instead of an unused class
export function css(...args) {
  args = args.filter(arg => arg != null)
  return args.length ? emotionCss(args) : null
}
