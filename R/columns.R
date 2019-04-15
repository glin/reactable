#' Column definitions
#'
#' @param name Column name.
#' @param aggregate Aggregate function name or JS callback.
#' @param sortable Enable sorting? Overrides the table option.
#' @param resizable Enable column resizing? Overrides the table option.
#' @param filterable Enable column filtering? Overrides the table option.
#' @param show Show the column? Defaults to `TRUE`.
#' @param defaultSortOrder Default sort order. Either `"asc"` for ascending
#'   order or `"desc"` for descending order. Overrides the table option.
#' @param format Named list of column format options. See `colFormat()`. Names
#'   can be `"cell"` for standard cells or `"aggregated"` for aggregated cells.
#' @param render Named list of render functions. Names can be `"cell"` for
#'   standard cells or `"aggregated"` for aggregated cells.
#' @param minWidth Min width of the column in pixels.
#' @param maxWidth Max width of the column in pixels.
#' @param width Fixed width of the column in pixels. Overrides minWidth and maxWidth.
#' @param align Column alignment. One of `"left"`, `"right"`, `"center"`.
#' @param class Additional CSS classes to apply to cells.
#' @param style Named list of inline styles to apply to cells.
#' @param headerClass Additional CSS classes to apply to the header.
#' @param headerStyle Named list of inline styles to apply to the header.
#' @export
colDef <- function(name = NULL, aggregate = NULL, sortable = NULL,
                   resizable = NULL, filterable = NULL, show = TRUE,
                   defaultSortOrder = NULL, format = NULL, render = NULL,
                   minWidth = NULL, maxWidth = NULL, width = NULL,
                   align = NULL, class = NULL, style = NULL, headerClass = NULL,
                   headerStyle = NULL) {

  if (!is.null(name) && !is.character(name)) {
    stop("`name` must be a character")
  }
  if (!is.null(aggregate) && !is.character(aggregate) && !is.JS(aggregate)) {
    stop("`aggregate` must be a character or JS callback")
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
  if (!is.null(show) && !is.logical(show)) {
    stop("`show` must be TRUE or FALSE")
  }
  if (!is.null(defaultSortOrder) && !isSortOrder(defaultSortOrder)) {
    stop('`defaultSortOrder` must be "asc" or "desc"')
  }
  if (!is.null(format)) {
    if (!isNamedList(format) || !names(format) %in% c("cell", "aggregated")) {
      stop('`format` must be a list with names "cell" or "aggregated"')
    }
    for (opts in format) {
      if (!is.colFormat(opts)) {
        stop("`format` must be a list of column formatting options")
      }
    }
  }
  if (!is.null(render)) {
    if (!isNamedList(render) || !names(render) %in% c("cell", "aggregated")) {
      stop('`render` must be a list with names "cell" or "aggregated"')
    }
    for (func in render) {
      if (!is.JS(func)) {
        stop("render function must be a JS callback")
      }
    }
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
  if (!is.null(class) && !is.character(class)) {
    stop("`class` must be a character")
  }
  if (!is.null(style) && !isNamedList(style)) {
    stop("`style` must be a named list")
  }
  if (!is.null(headerClass) && !is.character(headerClass)) {
    stop("`headerClass` must be a character")
  }
  if (!is.null(headerStyle) && !isNamedList(headerStyle)) {
    stop("`headerStyle` must be a named list")
  }
  if (!is.null(align)) {
    if (!isTRUE(align %in% c("left", "right", "center"))) {
      stop('`align` must be one of "left", "right", "center"')
    }
    style <- mergeLists(style, list(textAlign = align))
  }

  structure(
    list(
      Header = name,
      aggregate = aggregate,
      sortable = sortable,
      resizable = resizable,
      filterable = filterable,
      show = if (!show) FALSE,
      defaultSortDesc = if (!is.null(defaultSortOrder)) isDescOrder(defaultSortOrder),
      format = format,
      render = render,
      minWidth = minWidth,
      maxWidth = maxWidth,
      width = width,
      className = class,
      style = style,
      headerClassName = headerClass,
      headerStyle = headerStyle
    ),
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
#' @param headerClass Additional CSS classes to apply to the header.
#' @param headerStyle Named list of inline styles to apply to the header.
#' @export
colGroup <- function(name, columns, headerClass = NULL, headerStyle = NULL) {
  if (!is.character(columns)) {
    stop("`columns` must be a character vector")
  }
  group <- colDef(name = name, headerClass = headerClass, headerStyle = headerStyle)
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
#' @param digits Max number of decimal places to round numbers.
#' @param separators Whether to use grouping separators for numbers, such as
#'   thousands separators or thousand/lakh/crore separators. The format is
#'   locale-dependent. Defaults to `FALSE`.
#' @param currency Currency format. An ISO 4217 currency code such as `"USD"`
#'   for the US dollar, `"EUR"` for the euro, or `"CNY"` for the Chinese RMB.
#'   The format is locale-dependent.
#' @param locales Locales to use for number formatting. A character vector of
#'   BCP 47 language tags, such as `"en-US"` for English (United States),
#'   `"hi"` for Hindi, or `"sv-SE"` for Swedish (Sweden). Defaults to the locale
#'   of the browser.
#' @export
colFormat <- function(prefix = NULL, suffix = NULL, digits = NULL,
                      separators = FALSE, currency = NULL, locales = NULL) {
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
  if (!is.null(currency) && !is.character(currency)) {
    stop("`currency` must be a character string")
  }
  if (!is.null(locales) && !is.character(locales)) {
    stop("`locales` must be a character string")
  }

  options <- list(
    prefix = prefix,
    suffix = suffix,
    digits = digits,
    separators = if (separators) TRUE,
    currency = currency,
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
