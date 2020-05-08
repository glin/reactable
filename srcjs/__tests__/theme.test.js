import { createTheme } from '../theme'

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
      color: 'color',
      backgroundColor: 'backgroundColor',
      style: 'style',

      '.rt-table': {
        borderColor: 'tableBorderColor',
        borderWidth: 'tableBorderWidth',
        tableStyle: 'tableStyle'
      },

      '.rt-th, .rt-td': {
        padding: 'cellPadding'
      },

      '.rt-th': {
        borderColor: 'headerBorderColor',
        borderWidth: 'headerBorderWidth',
        headerStyle: 'headerStyle'
      },

      '.rt-tbody': {
        tableBodyStyle: 'tableBodyStyle'
      },

      '.rt-td': {
        borderColor: 'cellBorderColor',
        borderWidth: 'cellBorderWidth',
        cellStyle: 'cellStyle'
      },

      '.rt-tfoot-td': {
        borderColor: 'footerBorderColor',
        borderWidth: 'footerBorderWidth',
        footerStyle: 'footerStyle'
      },

      '.rt-th-group': {
        groupHeaderStyle: 'groupHeaderStyle'
      },

      '.rt-th.-headerGroup::after': {
        backgroundColor: 'groupHeaderBorderColor',
        height: 'groupHeaderBorderWidth'
      },

      '.rt-tr-group': {
        rowGroupStyle: 'rowGroupStyle'
      },

      '.rt-tr': {
        rowStyle: 'rowStyle'
      },

      '.rt-tr-striped': {
        backgroundColor: 'stripedColor',
        rowStripedStyle: 'rowStripedStyle'
      },

      '.rt-tr-highlight:hover': {
        backgroundColor: 'highlightColor',
        rowHighlightStyle: 'rowHighlightStyle'
      },

      '.rt-tr-selected': {
        rowSelectedStyle: 'rowSelectedStyle'
      },

      '.rt-td-filter': {
        borderColor: 'cellBorderColor',
        borderWidth: 'cellBorderWidth'
      },

      '.rt-expander::after': {
        borderTopColor: 'color'
      },

      '.rt-pagination': {
        paginationStyle: 'paginationStyle',
        borderTopColor: 'cellBorderColor',
        borderTopWidth: 'cellBorderWidth'
      },

      '.rt-filter': {
        inputStyle: 'inputStyle',
        filterInputStyle: 'filterInputStyle'
      },

      '.rt-search': {
        inputStyle: 'inputStyle',
        searchInputStyle: 'searchInputStyle'
      },

      '.rt-page-jump': {
        inputStyle: 'inputStyle'
      },

      '.rt-page-size-select': {
        selectStyle: 'selectStyle'
      },

      '@supports (-moz-appearance: none)': {
        '.rt-page-size-select': {
          backgroundImage:
            `url('data:image/svg+xml;charset=US-ASCII,` +
            `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">` +
            `<path fill="color" d="M24 1.5l-12 21-12-21h24z"/></svg>')`
        }
      },

      '.rt-page-button-content': {
        pageButtonStyle: 'pageButtonStyle'
      },

      '.rt-page-button:not(:disabled):hover > .rt-page-button-content': {
        pageButtonHoverStyle: 'pageButtonHoverStyle'
      },

      '.rt-page-button:not(:disabled):active > .rt-page-button-content': {
        pageButtonActiveStyle: 'pageButtonActiveStyle'
      },

      '.rt-page-button:focus > .rt-page-button-content': {
        pageButtonHoverStyle: 'pageButtonHoverStyle'
      },

      '.rt-page-button-current > .rt-page-button-content': {
        pageButtonCurrentStyle: 'pageButtonCurrentStyle'
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
    expect(theme.color).toEqual('blue')
  })

  test('expander color', () => {
    let options = {
      color: '#555 hsl(0, 0%, 25%)',
      style: { color: 'blue' }
    }
    let theme = createTheme(options)
    expect(theme['.rt-expander::after']).toEqual({ borderTopColor: 'blue' })
    for (let prop of ['tableStyle', 'tableBodyStyle', 'rowStyle', 'cellStyle']) {
      options[prop] = { color: `${prop}-color` }
      theme = createTheme(options)
      expect(theme['.rt-expander::after']).toEqual({ borderTopColor: `${prop}-color` })
    }
  })

  test('Firefox select color', () => {
    // Color should be URL encoded (including parentheses)
    let options = {
      color: '#555 hsl(0, 0%, 25%)'
    }
    let theme = createTheme(options)
    expect(theme['@supports (-moz-appearance: none)']).toEqual({
      '.rt-page-size-select': {
        backgroundImage:
          `url('data:image/svg+xml;charset=US-ASCII,` +
          `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">` +
          `<path fill="%23555%20hsl%280%2C%200%25%2C%2025%25%29" d="M24 1.5l-12 21-12-21h24z"/></svg>')`
      }
    })

    // Defaults
    for (let prop of ['style', 'selectStyle']) {
      options[prop] = { color: `${prop}-color` }
      theme = createTheme(options)
      const url = theme['@supports (-moz-appearance: none)']['.rt-page-size-select'].backgroundImage
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
      '.rt-table': {
        borderColor: 'borderColor',
        borderWidth: 'borderWidth'
      },

      '.rt-th': {
        borderColor: 'borderColor',
        borderWidth: 'borderWidth'
      },

      '.rt-td': {
        borderColor: 'borderColor',
        borderWidth: 'borderWidth'
      },

      '.rt-tfoot-td': {
        borderColor: 'borderColor',
        borderWidth: 'borderWidth'
      },

      '.rt-th-group::after': {
        backgroundColor: 'borderColor',
        height: 'borderWidth'
      },

      '.rt-td-filter': {
        borderColor: 'borderColor',
        borderWidth: 'borderWidth'
      },

      '.rt-pagination': {
        borderTopColor: 'borderColor',
        borderTopWidth: 'borderWidth'
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
    expect(theme.background).toEqual('background')
    expect(theme['.rt-th'].borderColor).toEqual('#fff')
    expect(theme['.rt-th'].borderWidth).toBeUndefined()
    expect(theme['.rt-table']).toBeUndefined()
    expect(theme['.rt-tr-striped']).toBeUndefined()
    expect(createTheme()).toBeNull()
  })
})
