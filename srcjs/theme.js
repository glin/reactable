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

  let css = {
    color,
    backgroundColor,
    ...style,

    '.rt-table': {
      borderColor: tableBorderColor,
      borderWidth: tableBorderWidth,
      ...tableStyle
    },

    '.rt-th, .rt-td': {
      padding: cellPadding
    },

    '.rt-th': {
      borderColor: headerBorderColor,
      borderWidth: headerBorderWidth,
      ...headerStyle
    },

    '.rt-tbody': {
      ...tableBodyStyle
    },

    '.rt-td': {
      borderColor: cellBorderColor,
      borderWidth: cellBorderWidth,
      ...cellStyle
    },

    '.rt-tfoot-td': {
      borderColor: footerBorderColor,
      borderWidth: footerBorderWidth,
      ...footerStyle
    },

    '.rt-th.-headerGroup': {
      ...groupHeaderStyle
    },

    '.rt-th.-headerGroup::after': {
      backgroundColor: groupHeaderBorderColor,
      height: groupHeaderBorderWidth
    },

    '.rt-tr-group': {
      ...rowGroupStyle
    },

    '.rt-tr': {
      ...rowStyle
    },

    '.rt-tr-striped': {
      backgroundColor: stripedColor,
      ...rowStripedStyle
    },

    '.rt-tr-highlight:hover': {
      backgroundColor: highlightColor,
      ...rowHighlightStyle
    },

    '.rt-tr-selected': {
      ...rowSelectedStyle
    },

    '.rt-td-filter': {
      borderColor: cellBorderColor,
      borderWidth: cellBorderWidth
    },

    '.rt-expander::after': {
      borderTopColor: expanderColor
    },

    '.rt-pagination': {
      borderTopColor: cellBorderColor,
      borderTopWidth: cellBorderWidth,
      ...paginationStyle
    },

    '.rt-filter': {
      ...inputStyle,
      ...filterInputStyle
    },

    '.rt-search': {
      ...inputStyle,
      ...searchInputStyle
    },

    '.rt-page-jump': {
      ...inputStyle
    },

    '.rt-page-size-select': {
      ...selectStyle
    },

    '@supports (-moz-appearance: none)': {
      '.rt-page-size-select': {
        backgroundImage:
          selectColor &&
          `url('data:image/svg+xml;charset=US-ASCII,` +
            `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">` +
            // Colors should be URL encoded since they may contain # or parentheses
            `<path fill="${urlEncode(selectColor)}" d="M24 1.5l-12 21-12-21h24z"/></svg>')`
      }
    },

    '.rt-page-button-content': {
      ...pageButtonStyle
    },

    '.rt-page-button:not(:disabled):hover > .rt-page-button-content': {
      ...pageButtonHoverStyle
    },

    '.rt-page-button:not(:disabled):active > .rt-page-button-content': {
      ...pageButtonActiveStyle
    },

    '.rt-page-button:focus > .rt-page-button-content': {
      ...pageButtonHoverStyle
    },

    '.rt-page-button-current > .rt-page-button-content': {
      ...pageButtonCurrentStyle
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
