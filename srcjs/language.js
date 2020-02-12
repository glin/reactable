export const defaultLanguage = {
  // Sorting
  sortLabel: 'Sort {name}',

  // Filters
  filterPlaceholder: null,
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
  pageInfo: '{rowStart}–{rowEnd} of {rows} rows',
  pageSizeOptions: 'Show {rows}',
  pageNextLabel: 'Next page',
  pagePreviousLabel: 'Previous page',
  pageNumberLabel: 'Page {page}',
  pageJumpLabel: 'Go to page',
  pageSizeOptionsLabel: 'Rows per page',
  pageNavLabel: 'Pagination',

  // Column groups
  defaultGroupHeader: 'Grouped',

  // Row details
  detailsExpandLabel: 'Expand details',
  detailsCollapseLabel: 'Collapse details',

  // Selection
  selectAllRowsLabel: 'Select all rows',
  deselectAllRowsLabel: 'Deselect all rows',
  selectAllSubRowsLabel: 'Select all rows in group',
  deselectAllSubRowsLabel: 'Deselect all rows in group',
  selectRowLabel: 'Select row {row}',
  deselectRowLabel: 'Deselect row {row}'
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
