import React from 'react'
import PropTypes from 'prop-types'

import { css } from './theme'
import { defaultLanguage, renderTemplate } from './language'
import { classNames } from './utils'

const PageButton = ({ isCurrent, className, ...props }) => {
  className = classNames(className, 'rt-page-button', isCurrent ? ' rt-page-button-current' : null)
  return (
    <button type="button" className={className} {...props}>
      {props.children}
    </button>
  )
}

PageButton.propTypes = {
  isCurrent: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node
}

// Get visible pages from current page (1-based) and total page count
export function getVisiblePages(page, totalPages) {
  // 6 pages or less
  if (totalPages <= 6) {
    return [...Array(totalPages)].map((_, i) => i + 1)
  }
  if (page <= 4) {
    // First 4 pages: 1 2 3 *4* 5 ... 7
    return [1, 2, 3, 4, 5, totalPages]
  } else if (totalPages - page < 3) {
    // Last 3 pages: 1 ... 4 *5* 6 7
    return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  } else {
    // Middle 3 pages: 1 ... 4 *5* 6 ... 8
    return [1, page - 1, page, page + 1, totalPages]
  }
}

export default class Pagination extends React.Component {
  constructor(props) {
    super(props)
    this.changePage = this.changePage.bind(this)
    this.applyPage = this.applyPage.bind(this)
    this.state = {
      pageJumpValue: props.page + 1,
      prevPage: props.page
    }
  }

  static getDerivedStateFromProps(props, state) {
    // Update page jump value if page changes (e.g. from page size change).
    // Track previous page so we only update on prop changes.
    if (props.page !== state.prevPage) {
      return {
        pageJumpValue: props.page + 1,
        prevPage: props.page
      }
    }
    return null
  }

  changePage(newPage) {
    const currentPage = this.props.page + 1
    if (newPage === currentPage) {
      return
    }
    this.props.onPageChange(newPage - 1)
  }

  applyPage(e) {
    if (e) {
      e.preventDefault()
    }
    const newPage = this.state.pageJumpValue
    if (newPage !== '') {
      this.changePage(newPage)
    } else {
      // Reset page jump if new value is blank or invalid. (Some browsers
      // allow non-numeric characters with input type="number").
      const currentPage = this.props.page + 1
      this.setState({ pageJumpValue: currentPage })
    }
  }

  renderPageInfo({ page, pageSize, pageRowCount, rowCount, language }) {
    const rowStart = Math.min(page * pageSize + 1, rowCount)
    // When pagination is disabled, pageSize is unused and the number of rows
    // on the page can exceed the page size.
    const rowEnd = Math.max(Math.min(page * pageSize + pageSize, rowCount), pageRowCount)
    const pageInfo = renderTemplate(language.pageInfo, { rowStart, rowEnd, rows: rowCount })
    return (
      <div className="rt-page-info" aria-live="polite">
        {pageInfo}
      </div>
    )
  }

  renderPageSizeOptions({ pageSize, pageSizeOptions, onPageSizeChange, language }) {
    const selector = (
      <select
        key="page-size-select"
        className="rt-page-size-select"
        aria-label={language.pageSizeOptionsLabel}
        onChange={e => onPageSizeChange(Number(e.target.value))}
        value={pageSize}
      >
        {pageSizeOptions.map((option, i) => (
          <option key={i} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
    const elements = renderTemplate(language.pageSizeOptions, { rows: selector })
    return <div className="rt-page-size">{elements}</div>
  }

  renderPageJump({ onChange, value, onBlur, onKeyPress, inputType, language }) {
    return (
      <input
        key="page-jump"
        className="rt-page-jump"
        aria-label={language.pageJumpLabel}
        type={inputType}
        onChange={onChange}
        value={value}
        onBlur={onBlur}
        onKeyPress={onKeyPress}
      />
    )
  }

  getPageJumpProperties() {
    return {
      onKeyPress: e => {
        if (e.which === 13 || e.keyCode === 13) {
          this.applyPage()
        }
      },
      onBlur: this.applyPage,
      value: this.state.pageJumpValue,
      onChange: e => {
        const value = e.target.value
        if (value === '') {
          this.setState({ pageJumpValue: value })
          return
        }
        const newPage = Number(value)
        if (!Number.isNaN(newPage)) {
          const nearestValidPage = Math.min(Math.max(newPage, 1), Math.max(this.props.pages, 1))
          this.setState({ pageJumpValue: nearestValidPage })
        }
      },
      inputType: 'number',
      language: this.props.language
    }
  }

  render() {
    const {
      paginationType,
      showPageSizeOptions,
      showPageInfo,
      page,
      pages,
      canPrevious,
      canNext,
      theme,
      language
    } = this.props

    const pageInfo = showPageInfo ? this.renderPageInfo(this.props) : null
    const pageSizeOptions = showPageSizeOptions ? this.renderPageSizeOptions(this.props) : null

    const currentPage = page + 1
    const visiblePages = getVisiblePages(currentPage, pages)

    let pageNumbers
    if (paginationType === 'numbers') {
      let pageButtons = []
      visiblePages.forEach((page, index) => {
        const isCurrent = currentPage === page
        const pageButton = (
          <PageButton
            key={page}
            isCurrent={isCurrent}
            onClick={this.changePage.bind(null, page)}
            // Change aria-label to work around issue with aria-current changes
            // not being recognized in NVDA + Chrome. https://github.com/nvaccess/nvda/issues/10728
            aria-label={renderTemplate(language.pageNumberLabel, { page }) + (isCurrent ? ' ' : '')}
            aria-current={isCurrent ? 'page' : null}
          >
            {page}
          </PageButton>
        )
        if (page - visiblePages[index - 1] > 1) {
          pageButtons.push(
            <span className="rt-page-ellipsis" key={`ellipsis-${page}`} role="separator">
              ...
            </span>
          )
        }
        pageButtons.push(pageButton)
      })
      pageNumbers = pageButtons
    } else {
      const page =
        paginationType === 'jump' ? this.renderPageJump(this.getPageJumpProperties()) : currentPage
      const totalPages = Math.max(pages, 1)
      pageNumbers = (
        <div className="rt-page-numbers">
          {renderTemplate(language.pageNumbers, { page, pages: totalPages })}
        </div>
      )
    }

    const prevButton = (
      <PageButton
        className="rt-prev-button"
        onClick={() => {
          if (!canPrevious) return
          this.changePage(currentPage - 1)
        }}
        disabled={!canPrevious}
        aria-disabled={!canPrevious ? 'true' : null}
        aria-label={language.pagePreviousLabel}
      >
        {language.pagePrevious}
      </PageButton>
    )

    const nextButton = (
      <PageButton
        className="rt-next-button"
        onClick={() => {
          if (!canNext) return
          this.changePage(currentPage + 1)
        }}
        disabled={!canNext}
        aria-disabled={!canNext ? 'true' : null}
        aria-label={language.pageNextLabel}
      >
        {language.pageNext}
      </PageButton>
    )

    return (
      <div className={classNames('rt-pagination', css(theme.paginationStyle))}>
        <div className="rt-pagination-info">
          {pageInfo}
          {pageSizeOptions}
        </div>

        <div className="rt-pagination-nav">
          {prevButton}
          {pageNumbers}
          {nextButton}
        </div>
      </div>
    )
  }
}

Pagination.propTypes = {
  paginationType: PropTypes.oneOf(['numbers', 'jump', 'simple']),
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  showPageSizeOptions: PropTypes.bool,
  showPageInfo: PropTypes.bool,
  page: PropTypes.number.isRequired,
  pages: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  pageRowCount: PropTypes.number.isRequired,
  canPrevious: PropTypes.bool.isRequired,
  canNext: PropTypes.bool.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  rowCount: PropTypes.number.isRequired,
  theme: PropTypes.shape({
    paginationStyle: PropTypes.object
  }),
  language: PropTypes.shape({
    pageNext: PropTypes.string,
    pagePrevious: PropTypes.string,
    pageNumbers: PropTypes.string,
    pageInfo: PropTypes.string,
    pageSizeOptions: PropTypes.string,
    pageNextLabel: PropTypes.string,
    pagePreviousLabel: PropTypes.string,
    pageNumberLabel: PropTypes.string,
    pageJumpLabel: PropTypes.string,
    pageSizeOptionsLabel: PropTypes.string
  })
}

Pagination.defaultProps = {
  paginationType: 'numbers',
  pageSizeOptions: [10, 25, 50, 100],
  showPageInfo: true,
  language: defaultLanguage
}
