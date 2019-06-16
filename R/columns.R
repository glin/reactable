#' Column definitions
#'
#' @param name Column name.
#' @param aggregate Aggregate function. The name of a built-in aggregate
#'   function or a custom `JS()` aggregate function. Built-in aggregate functions
#'   are: `"mean"`, `"sum"`, `"max"`, `"min"`, `"count"`, `"unique"`, `"frequency"`.
#' @param sortable Enable sorting? Overrides the table option.
#' @param resizable Enable column resizing? Overrides the table option.
#' @param filterable Enable column filtering? Overrides the table option.
#' @param show Show the column? Defaults to `TRUE`.
#' @param defaultSortOrder Default sort order. Either `"asc"` for ascending
#'   order or `"desc"` for descending order. Overrides the table option.
#' @param sortMethod Custom sort method. Specify `"naLast"` to always sort NAs
#'   to the bottom.
#' @param format Column formatting options. A `colFormat()` object to
#'   format all cells, or a named list of `colFormat()` objects to format standard
#'   cells (`"cell"`) and aggregated cells (`"aggregated"`) separately.
#' @param cell Custom cell renderer. A function that takes the cell value and row
#'   index as arguments, or a `JS()` function that takes a cell info object as an
#'   argument.
#' @param aggregated Custom aggregated cell renderer. A `JS()` function that takes
#'   a cell info object as an argument.
#' @param footer Footer content or render function. Render functions can be an
#'   R function that takes two arguments, the column values and column name, or a
#'   `JS()` function that takes one argument, a column info object.
#' @param html Render cells as HTML? HTML strings are escaped by default.
#' @param showNA Show NA values? If `FALSE`, NA values will be left as empty cells.
#'   Defaults to `FALSE`.
#' @param minWidth Min width of the column in pixels.
#' @param maxWidth Max width of the column in pixels.
#' @param width Fixed width of the column in pixels. Overrides minWidth and maxWidth.
#' @param align Column alignment. One of `"left"`, `"right"`, `"center"`.
#' @param class Additional CSS classes to apply to cells.
#' @param style Inline styles to apply to cells. A named list or character string.
#' @param headerClass Additional CSS classes to apply to the header.
#' @param headerStyle Inline styles to apply to the header. A named list or
#'   character string.
#' @param footerClass Additional CSS classes to apply to the footer.
#' @param footerStyle Inline styles to apply to the footer. A named list or
#'   character string.
#' @export
colDef <- function(name = NULL, aggregate = NULL, sortable = NULL,
                   resizable = NULL, filterable = NULL, show = TRUE,
                   defaultSortOrder = NULL, sortMethod = NULL, format = NULL,
                   cell = NULL, aggregated = NULL, footer = NULL, html = FALSE,
                   showNA = FALSE, minWidth = NULL, maxWidth = NULL, width = NULL,
                   align = NULL, class = NULL, style = NULL, headerClass = NULL,
                   headerStyle = NULL, footerClass = NULL, footerStyle = NULL) {

  if (!is.null(name) && !is.character(name)) {
    stop("`name` must be a character string")
  }
  if (!is.null(aggregate)) {
    if (!is.character(aggregate) && !is.JS(aggregate)) {
      stop("`aggregate` must be a character string or JS function")
    }
    aggregators <- c("mean", "sum", "max", "min", "count", "unique", "frequency")
    if (is.character(aggregate) && !aggregate %in% aggregators) {
      stop("`aggregate` must be a valid aggregate function")
    }
  }
  if (!is.null(sortable) && !is.logical(sortable)) {
    stop("`sortable` must be TRUE or FALSE")
  }
  if (!is.null(resizable) && !is.logical(resizable)) {
    stop("`resizable` must be TRUE or FALSE")
  }
  if (!is.null(filterable) && !is.logical(filterable)) {
    stop("`filterable` must be TRUE or FALSE")
  }
  if (!is.logical(show)) {
    stop("`show` must be TRUE or FALSE")
  }
  if (!is.null(defaultSortOrder) && !isSortOrder(defaultSortOrder)) {
    stop('`defaultSortOrder` must be "asc" or "desc"')
  }
  if (!is.null(sortMethod)) {
    methods <- "naLast"
    if (!sortMethod %in% methods) {
      stop(paste("`sortMethod` must be one of:", paste(shQuote(methods)), collapse = ", "))
    }
  }
  if (!is.null(format)) {
    if (!is.colFormat(format) && !isNamedList(format)) {
      stop('`format` must be a column formatting option set or named list')
    }
    if (is.colFormat(format)) {
      format <- list(cell = format, aggregated = format)
    }
    if (any(!names(format) %in% c("cell", "aggregated"))) {
      stop('`format` must have names "cell" or "aggregated"')
    }
    for (opts in format) {
      if (!is.colFormat(opts)) {
        stop("`format` must be a list of column formatting options")
      }
    }
  }
  if (!is.null(cell) && !is.JS(cell) && !is.function(cell)) {
    stop("`cell` renderer must be a JS function or R function")
  }
  if (!is.null(aggregated) && !is.JS(aggregated)) {
    stop("`aggregated` renderer must be a JS function")
  }
  if (!is.logical(html)) {
    stop("`html` must be TRUE or FALSE")
  }
  if (!is.logical(showNA)) {
    stop("`showNA` must be TRUE or FALSE")
  }
  if (!is.null(minWidth) && !is.numeric(minWidth)) {
    stop("`minWidth` must be numeric")
  }
  if (!is.null(maxWidth) && !is.numeric(maxWidth)) {
    stop("`maxWidth` must be numeric")
  }
  if (!is.null(width) && !is.numeric(width)) {
    stop("`width` must be numeric")
  }
  if (!is.null(align)) {
    if (!isTRUE(align %in% c("left", "right", "center"))) {
      stop('`align` must be one of "left", "right", "center"')
    }
  }
  if (!is.null(class) && !is.character(class)) {
    stop("`class` must be a character string")
  }
  if (!is.null(style) && !isNamedList(style) && !is.character(style)) {
    stop("`style` must be a named list or character string")
  }
  if (!is.null(headerClass) && !is.character(headerClass)) {
    stop("`headerClass` must be a character string")
  }
  if (!is.null(headerStyle) && !isNamedList(headerStyle) && !is.character(headerStyle)) {
    stop("`headerStyle` must be a named list or character string")
  }
  if (!is.null(footerClass) && !is.character(footerClass)) {
    stop("`footerClass` must be a character string")
  }
  if (!is.null(footerStyle) && !isNamedList(footerStyle) && !is.character(footerStyle)) {
    stop("`footerStyle` must be a named list or character string")
  }

  structure(
    filterNulls(list(
      Header = name,
      aggregate = aggregate,
      sortable = sortable,
      resizable = resizable,
      filterable = filterable,
      show = if (!show) FALSE,
      defaultSortDesc = if (!is.null(defaultSortOrder)) isDescOrder(defaultSortOrder),
      sortMethod = sortMethod,
      format = format,
      cell = cell,
      aggregated = aggregated,
      footer = footer,
      html = if (html) TRUE,
      showNA = if (showNA) TRUE,
      minWidth = minWidth,
      maxWidth = maxWidth,
      width = width,
      align = align,
      className = class,
      style = asReactStyle(style),
      headerClassName = headerClass,
      headerStyle = asReactStyle(headerStyle),
      footerClassName = footerClass,
      footerStyle = asReactStyle(footerStyle)
    )),
    class = "colDef"
  )
}

is.colDef <- function(x) {
  inherits(x, "colDef")
}

isSortOrder <- function(x) {
  is.character(x) && x %in% c("asc", "desc")
}

isDescOrder <- function(x) {
  is.character(x) && x == "desc"
}

#' Column group definitions
#'
#' @param name Column group name.
#' @param columns Character vector of column names in the group.
#' @param align Column group header alignment. One of `"left"`, `"right"`, `"center"`.
#' @param headerClass Additional CSS classes to apply to the header.
#' @param headerStyle Inline styles to apply to the header. A named list or
#'   character string.
#' @export
colGroup <- function(name, columns, align = NULL, headerClass = NULL, headerStyle = NULL) {
  if (!is.character(columns)) {
    stop("`columns` must be a character vector")
  }
  group <- colDef(
    name = name,
    align = align,
    headerClass = headerClass,
    headerStyle = headerStyle
  )
  group$columns <- columns
  group <- filterNulls(group)
  structure(group, class = "colGroup")
}

is.colGroup <- function(x) {
  inherits(x, "colGroup")
}

#' Column formatting options
#'
#' @param prefix Prefix string.
#' @param suffix Suffix string.
#' @param digits Number of decimal digits to use for numbers.
#' @param separators Whether to use grouping separators for numbers, such as
#'   thousands separators or thousand/lakh/crore separators. The format is
#'   locale-dependent.
#' @param percent Format number as a percentage? The format is locale-dependent.
#' @param currency Currency format. An ISO 4217 currency code such as `"USD"`
#'   for the US dollar, `"EUR"` for the euro, or `"CNY"` for the Chinese RMB.
#'   The format is locale-dependent.
#' @param datetime Format as a locale-dependent date-time?
#' @param date Format as a locale-dependent date?
#' @param time Format as a locale-dependent time?
#' @param hour12 Whether to use 12-hour time (`TRUE`) or 24-hour time (`FALSE`).
#'   The default time convention is locale-dependent.
#' @param locales Locales to use for number and date/time formatting. A character
#'   vector of BCP 47 language tags, such as `"en-US"` for English (United States),
#'   `"hi"` for Hindi, or `"sv-SE"` for Swedish (Sweden). Defaults to the locale
#'   of the browser.
#' @export
colFormat <- function(prefix = NULL, suffix = NULL, digits = NULL,
                      separators = FALSE, percent = FALSE, currency = NULL,
                      datetime = FALSE, date = FALSE, time = FALSE, hour12 = NULL,
                      locales = NULL) {

  if (!is.null(prefix) && !is.character(prefix)) {
    stop("`prefix` must be a character string")
  }
  if (!is.null(suffix) && !is.character(suffix)) {
    stop("`suffix` must be a character string")
  }
  if (!is.null(digits)) {
    if (!is.numeric(digits) || digits < 0 || digits > 20) {
      stop("`digits` must be a number between 0 and 20")
    }
    digits <- as.integer(digits)
  }
  if (!is.logical(separators)) {
    stop("`separators` must be TRUE or FALSE")
  }
  if (!is.logical(percent)) {
    stop("`percent` must be TRUE or FALSE")
  }
  if (!is.null(currency) && !is.character(currency)) {
    stop("`currency` must be a character string")
  }
  if (!is.logical(datetime)) {
    stop("`datetime` must be TRUE or FALSE")
  }
  if (!is.logical(date)) {
    stop("`date` must be TRUE or FALSE")
  }
  if (!is.logical(time)) {
    stop("`time` must be TRUE or FALSE")
  }
  if (!is.null(hour12) && !is.logical(hour12)) {
    stop("`hour12` must be TRUE or FALSE")
  }
  if (!is.null(locales) && !is.character(locales)) {
    stop("`locales` must be a character string")
  }

  options <- list(
    prefix = prefix,
    suffix = suffix,
    digits = digits,
    separators = if (separators) TRUE,
    percent = if (percent) TRUE,
    currency = currency,
    datetime = if (datetime) TRUE,
    date = if (date) TRUE,
    time = if (time) TRUE,
    hour12 = hour12,
    locales = locales
  )
  options <- filterNulls(options)
  structure(options, class = "colFormat")
}

is.colFormat <- function(x) {
  inherits(x, "colFormat")
}

colType <- function(x) {
  if (is.numeric(x)) {
    return("numeric")
  }
  if (is.Date(x) || is.POSIXct(x) || is.POSIXlt(x)) {
    return("Date")
  }
  class(x)
}
