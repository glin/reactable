import { createTheme, css } from '../theme'

describe('createTheme', () => {
  test('handles empty options', () => {
    expect(createTheme()).toEqual(null)
  })

  test('produces correct theme with all options specified', () => {
    const options = {
      color: 'color',
      backgroundColor: 'backgroundColor',
      borderColor: 'borderColor',
      borderWidth: 'borderWidth',
      stripedColor: 'stripedColor',
      highlightColor: 'highlightColor',
      cellPadding: 'cellPadding',
      style: { style: 'style' },

      tableBorderColor: 'tableBorderColor',
      tableBorderWidth: 'tableBorderWidth',
      tableStyle: { tableStyle: 'tableStyle' },

      headerBorderColor: 'headerBorderColor',
      headerBorderWidth: 'headerBorderWidth',
      headerStyle: { headerStyle: 'headerStyle' },

      groupHeaderBorderColor: 'groupHeaderBorderColor',
      groupHeaderBorderWidth: 'groupHeaderBorderWidth',
      groupHeaderStyle: { groupHeaderStyle: 'groupHeaderStyle' },

      tableBodyStyle: { tableBodyStyle: 'tableBodyStyle' },

      rowGroupStyle: { rowGroupStyle: 'rowGroupStyle' },

      rowStyle: { rowStyle: 'rowStyle' },
      rowStripedStyle: { rowStripedStyle: 'rowStripedStyle' },
      rowHighlightStyle: { rowHighlightStyle: 'rowHighlightStyle' },
      rowSelectedStyle: { rowSelectedStyle: 'rowSelectedStyle' },

      cellBorderColor: 'cellBorderColor',
      cellBorderWidth: 'cellBorderWidth',
      cellStyle: { cellStyle: 'cellStyle' },

      footerBorderColor: 'footerBorderColor',
      footerBorderWidth: 'footerBorderWidth',
      footerStyle: { footerStyle: 'footerStyle' },

      inputStyle: { inputStyle: 'inputStyle' },
      filterInputStyle: { filterInputStyle: 'filterInputStyle' },
      searchInputStyle: { searchInputStyle: 'searchInputStyle' },

      selectStyle: { selectStyle: 'selectStyle' },

      paginationStyle: { paginationStyle: 'paginationStyle' },
      pageButtonStyle: { pageButtonStyle: 'pageButtonStyle' },
      pageButtonHoverStyle: { pageButtonHoverStyle: 'pageButtonHoverStyle' },
      pageButtonActiveStyle: { pageButtonActiveStyle: 'pageButtonActiveStyle' },
      pageButtonCurrentStyle: { pageButtonCurrentStyle: 'pageButtonCurrentStyle' }
    }

    const theme = createTheme(options)
    const expected = {
      style: {
        color: 'color',
        backgroundColor: 'backgroundColor',
        style: 'style'
      },

      tableStyle: {
        borderColor: 'tableBorderColor',
        borderWidth: 'tableBorderWidth',
        tableStyle: 'tableStyle'
      },

      headerStyle: {
        borderColor: 'headerBorderColor',
        borderWidth: 'headerBorderWidth',
        padding: 'cellPadding',
        headerStyle: 'headerStyle',
        '.rt-bordered &, .rt-outlined &': {
          borderWidth: 'headerBorderWidth'
        }
      },

      groupHeaderStyle: {
        borderColor: 'groupHeaderBorderColor',
        borderWidth: 'groupHeaderBorderWidth',
        groupHeaderStyle: 'groupHeaderStyle',
        '&::after': {
          backgroundColor: 'groupHeaderBorderColor',
          height: 'groupHeaderBorderWidth'
        },
        '.rt-bordered &': {
          borderWidth: 'groupHeaderBorderWidth'
        }
      },

      tableBodyStyle: {
        tableBodyStyle: 'tableBodyStyle'
      },

      cellStyle: {
        borderColor: 'cellBorderColor',
        borderWidth: 'cellBorderWidth',
        padding: 'cellPadding',
        cellStyle: 'cellStyle'
      },

      footerStyle: {
        borderColor: 'footerBorderColor',
        borderWidth: 'footerBorderWidth',
        padding: 'cellPadding',
        footerStyle: 'footerStyle'
      },

      rowGroupStyle: {
        rowGroupStyle: 'rowGroupStyle'
      },

      rowStyle: {
        rowStyle: 'rowStyle',
        '&.rt-tr-striped': {
          backgroundColor: 'stripedColor',
          rowStripedStyle: 'rowStripedStyle'
        },
        '&.rt-tr-highlight:hover': {
          backgroundColor: 'highlightColor',
          rowHighlightStyle: 'rowHighlightStyle'
        },
        '&.rt-tr-selected': {
          rowSelectedStyle: 'rowSelectedStyle'
        }
      },

      filterCellStyle: {
        borderColor: 'cellBorderColor',
        borderWidth: 'cellBorderWidth',
        padding: 'cellPadding',
        cellStyle: 'cellStyle'
      },

      expanderStyle: {
        '&::after': {
          borderTopColor: 'color'
        }
      },

      filterInputStyle: {
        inputStyle: 'inputStyle',
        filterInputStyle: 'filterInputStyle'
      },

      searchInputStyle: {
        inputStyle: 'inputStyle',
        searchInputStyle: 'searchInputStyle'
      },

      paginationStyle: {
        borderTopColor: 'cellBorderColor',
        borderTopWidth: 'cellBorderWidth',
        paginationStyle: 'paginationStyle',

        '.rt-page-jump': {
          inputStyle: 'inputStyle'
        },

        '.rt-page-size-select': {
          selectStyle: 'selectStyle',
          '@supports (-moz-appearance: none)': {
            backgroundImage:
              `url('data:image/svg+xml;charset=US-ASCII,` +
              `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">` +
              `<path fill="color" d="M24 1.5l-12 21-12-21h24z"/></svg>')`
          }
        },

        '.rt-page-button': {
          pageButtonStyle: 'pageButtonStyle'
        },
        '.rt-page-button:not(:disabled):hover': {
          pageButtonHoverStyle: 'pageButtonHoverStyle'
        },
        '.rt-page-button:not(:disabled):active': {
          pageButtonActiveStyle: 'pageButtonActiveStyle'
        },
        '.rt-keyboard-active & .rt-page-button:not(:disabled):focus': {
          pageButtonHoverStyle: 'pageButtonHoverStyle'
        },
        '.rt-page-button-current': {
          pageButtonCurrentStyle: 'pageButtonCurrentStyle'
        }
      }
    }

    expect(theme).toEqual(expected)
  })

  test('color', () => {
    const options = {
      color: '#555 hsl(0, 0%, 25%)',
      style: { color: 'blue' }
    }
    const theme = createTheme(options)
    expect(theme.style.color).toEqual('blue')
  })

  test('expander color', () => {
    let options = {
      color: '#555 hsl(0, 0%, 25%)',
      style: { color: 'blue' }
    }
    let theme = createTheme(options)
    expect(theme.expanderStyle['&::after']).toEqual({ borderTopColor: 'blue' })
    for (let prop of ['tableStyle', 'tableBodyStyle', 'rowStyle', 'cellStyle']) {
      options[prop] = { color: `${prop}-color` }
      theme = createTheme(options)
      expect(theme.expanderStyle['&::after']).toEqual({ borderTopColor: `${prop}-color` })
    }
  })

  test('Firefox select color', () => {
    // Color should be URL encoded (including parentheses)
    let options = {
      color: '#555 hsl(0, 0%, 25%)'
    }
    let theme = createTheme(options)
    expect(
      theme.paginationStyle['.rt-page-size-select']['@supports (-moz-appearance: none)']
    ).toEqual({
      backgroundImage:
        `url('data:image/svg+xml;charset=US-ASCII,` +
        `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">` +
        `<path fill="%23555%20hsl%280%2C%200%25%2C%2025%25%29" d="M24 1.5l-12 21-12-21h24z"/></svg>')`
    })

    // Defaults
    for (let prop of ['style', 'selectStyle']) {
      options[prop] = { color: `${prop}-color` }
      theme = createTheme(options)
      const url =
        theme.paginationStyle['.rt-page-size-select']['@supports (-moz-appearance: none)']
          .backgroundImage
      expect(url.includes(`fill="${prop}-color"`)).toEqual(true)
    }
  })

  test('borderColor and borderWidth', () => {
    const options = {
      borderColor: 'borderColor',
      borderWidth: 'borderWidth'
    }
    const theme = createTheme(options)
    const expected = {
      tableStyle: {
        borderColor: 'borderColor',
        borderWidth: 'borderWidth'
      },

      headerStyle: {
        borderColor: 'borderColor',
        borderWidth: 'borderWidth',
        '.rt-bordered &, .rt-outlined &': {
          borderWidth: 'borderWidth'
        }
      },

      cellStyle: {
        borderColor: 'borderColor',
        borderWidth: 'borderWidth'
      },

      footerStyle: {
        borderColor: 'borderColor',
        borderWidth: 'borderWidth'
      },

      groupHeaderStyle: {
        borderColor: 'borderColor',
        borderWidth: 'borderWidth',
        '&::after': {
          backgroundColor: 'borderColor',
          height: 'borderWidth'
        },
        '.rt-bordered &': {
          borderWidth: 'borderWidth'
        }
      },

      filterCellStyle: {
        borderColor: 'borderColor',
        borderWidth: 'borderWidth'
      },

      paginationStyle: {
        borderTopColor: 'borderColor',
        borderTopWidth: 'borderWidth'
      }
    }

    expect(theme).toEqual(expected)
  })

  test('header borderWidth', () => {
    const options = {
      headerBorderWidth: 'headerBorderWidth',
      headerStyle: {
        borderWidth: 'headerStyleBorderWidth'
      }
    }
    const theme = createTheme(options)
    const expected = {
      headerStyle: {
        borderWidth: 'headerStyleBorderWidth',
        '.rt-bordered &, .rt-outlined &': {
          borderWidth: 'headerStyleBorderWidth'
        }
      }
    }
    expect(theme).toEqual(expected)
  })

  test('handles unspecified theme options', () => {
    const options = {
      style: { background: 'background' },
      headerBorderColor: '#fff'
    }
    const theme = createTheme(options)
    expect(theme.style.background).toEqual('background')
    expect(theme.headerStyle.borderColor).toEqual('#fff')
    expect(theme.headerStyle.borderWidth).toBeUndefined()
    expect(theme.tableStyle).toBeUndefined()
    expect(createTheme()).toBeNull()
  })
})

test('css', () => {
  expect(css()).toEqual(null)
  expect(css(null)).toEqual(null)
  expect(css(undefined, null)).toEqual(null)
  expect(css('')).toMatch(/.+/)
  expect(css({})).toMatch(/.+/)
  expect(css('', {})).toMatch(/.+/)
})
