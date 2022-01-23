export const defaultLanguage = {
  // Sorting
  sortLabel: 'Sort {name}',

  // Filters
  filterPlaceholder: '',
  filterLabel: 'Filter {name}',

  // Search
  searchPlaceholder: 'Search',
  searchLabel: 'Search',

  // Tables
  noData: 'No rows found',

  // Pagination
  pageNext: 'Next',
  pagePrevious: 'Previous',
  pageNumbers: '{page} of {pages}',
  pageInfo: `{rowStart}${String.fromCharCode(0x2013)}{rowEnd} of {rows} rows`,
  pageSizeOptions: 'Show {rows}',
  pageNextLabel: 'Next page',
  pagePreviousLabel: 'Previous page',
  pageNumberLabel: 'Page {page}',
  pageJumpLabel: 'Go to page',
  pageSizeOptionsLabel: 'Rows per page',

  // Column groups
  defaultGroupHeader: 'Grouped',
  groupExpandLabel: 'Toggle group',
  groupCollapseLabel: 'Toggle group',

  // Row details
  detailsExpandLabel: 'Toggle details',
  detailsCollapseLabel: 'Toggle details',

  // Selection
  selectAllRowsLabel: 'Select all rows',
  selectAllSubRowsLabel: 'Select all rows in group',
  selectRowLabel: 'Select row',

  // Deprecated in v0.2.3.9000
  deselectAllRowsLabel: 'Deselect all rows',
  deselectAllSubRowsLabel: 'Deselect all rows in group',
  deselectRowLabel: 'Deselect row'
}

export function renderTemplate(template, params = {}) {
  if (!template || !params) {
    return template
  }
  const keys = Object.keys(params)
  const separator = '(' + keys.map(key => `{${key}}`).join('|') + ')'
  const strings = template.split(new RegExp(separator))
  const templateParams = keys.reduce((obj, key) => {
    obj[`{${key}}`] = params[key]
    return obj
  }, {})
  const rendered = strings.map(s => (templateParams[s] != null ? templateParams[s] : s))
  if (rendered.some(val => typeof val === 'object')) {
    return rendered
  }
  return rendered.join('')
}
