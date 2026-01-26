// Common test helper functions for querying DOM elements

// Root and table structure
export const getRoot = container => container.querySelector('.Reactable.ReactTable')
export const getTable = container => container.querySelector('.rt-table')
export const getThead = container => container.querySelector('.rt-thead')
export const getTbody = container => container.querySelector('.rt-tbody')
export const getTfoot = container => container.querySelector('.rt-tfoot')

// Rows
export const getHeaderRows = container =>
  container.querySelectorAll('.rt-thead .rt-tr:not(.rt-tr-filters)')
export const getFooterRow = container => container.querySelector('.rt-tfoot .rt-tr')
export const getRowGroups = container => container.querySelectorAll('.rt-tbody .rt-tr-group')
export const getRows = (container, selectors = '') =>
  container.querySelectorAll('.rt-tbody .rt-tr' + selectors)
export const getDataRows = container =>
  container.querySelectorAll('.rt-tbody .rt-tr:not(.rt-tr-pad)')
export const getPadRows = container => container.querySelectorAll('.rt-tbody .rt-tr-pad')

// Headers
export const getGroupHeaders = (container, selectors = '') =>
  container.querySelectorAll('.rt-th-group' + selectors)
export const getUngroupedHeaders = container => container.querySelectorAll('.rt-th-group-none')
export const getHeaders = (container, selectors = '') =>
  container.querySelectorAll('.rt-th' + selectors)
export const getColumnHeaders = container => container.querySelectorAll('.rt-tr-header .rt-th')
export const getSortableHeaders = container => container.querySelectorAll('.rt-th[aria-sort]')
export const getResizableHeaders = container => container.querySelectorAll('.rt-th-resizable')
export const getResizers = container => container.querySelectorAll('.rt-resizer')

// Cells
export const getCells = (container, selectors = '') =>
  container.querySelectorAll('.rt-tbody .rt-td' + selectors)
export const getDataCells = (container, selectors = '') =>
  container.querySelectorAll('.rt-tbody .rt-tr:not(.rt-tr-pad) .rt-td' + selectors)
export const getCellsText = (container, selectors) => {
  return [...getCells(container, selectors)].map(cell => cell.textContent)
}
export const getFooters = (container, selectors = '') =>
  container.querySelectorAll('.rt-td.rt-td-footer' + selectors)

// Filters
export const getFilterRow = container => container.querySelector('.rt-thead .rt-tr.rt-tr-filters')
export const getFilterCells = container => container.querySelectorAll('.rt-td-filter')
export const getFilters = container => container.querySelectorAll('.rt-filter')
export const getSearchInput = container => container.querySelector('.rt-search')

// No data
export const getNoData = container => container.querySelector('.rt-no-data')

// Virtual scrolling
export const getVirtualSpacer = container => container.querySelector('.rt-virtual-spacer')

// Expandable rows
export const getExpandableCells = container => container.querySelectorAll('.rt-td-expandable')
export const getExpanders = container => container.querySelectorAll('.rt-expander-button')
export const getExpanderIcons = container => container.querySelectorAll('.rt-expander')
export const getRowDetails = container => container.querySelectorAll('.rt-tr-details')

// Row selection
export const getSelectRowCells = container => container.querySelectorAll('.rt-td-select')
export const getSelectRowRadios = container =>
  container.querySelectorAll('.rt-select-input[type="radio"]')
export const getSelectRowCheckboxes = container =>
  container.querySelectorAll('.rt-select-input[type="checkbox"]')

// Pagination
export const getPagination = container => container.querySelector('.rt-pagination')
export const getPageInfo = container => container.querySelector('.rt-page-info')
export const getPageSizeOptions = container => container.querySelector('.rt-page-size')
export const getPageSizeSelect = container => container.querySelector('.rt-page-size-select')
export const getPrevButton = container => container.querySelector('.rt-prev-button')
export const getNextButton = container => container.querySelector('.rt-next-button')
export const getPageNumbers = container => container.querySelector('.rt-page-numbers')
export const getPageButtons = container => container.querySelectorAll('.rt-page-button')
export const getPageJump = container => container.querySelector('.rt-page-jump')
