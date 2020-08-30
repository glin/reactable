#' Column definitions
#'
#' Use `colDef()` to customize the columns in a table.
#'
#' @param name Column header name.
#' @param aggregate Aggregate function to use when rows are grouped. The name
#'   of a built-in aggregate function or a custom [JS()] aggregate function.
#'   Built-in aggregate functions are: `"mean"`, `"sum"`, `"max"`, `"min"`,
#'   `"median"`, `"count"`, `"unique"`, and `"frequency"`.
#'
#'   To enable row grouping, use the `groupBy` argument in [reactable()].
#' @param sortable Enable sorting? Overrides the table option.
#' @param resizable Enable column resizing? Overrides the table option.
#' @param filterable Enable column filtering? Overrides the table option.
#' @param show Show the column? Defaults to `TRUE`.
#' @param defaultSortOrder Default sort order. Either `"asc"` for ascending
#'   order or `"desc"` for descending order. Overrides the table option.
#' @param sortNALast Always sort missing values ([NA] or [NaN]) last?
#' @param format Column formatting options. A [colFormat()] object to
#'   format all cells, or a named list of [colFormat()] objects to format standard
#'   cells (`"cell"`) and aggregated cells (`"aggregated"`) separately.
#' @param cell Custom cell renderer. An R function that takes the cell value,
#'   row index, and column name as arguments, or a [JS()] function that takes a
#'   cell info object as an argument.
#' @param aggregated Custom aggregated cell renderer. A [JS()] function that takes
#'   a cell info object as an argument.
#' @param header Custom header renderer. An R function that takes the header value
#'   and column name as arguments, or a [JS()] function that takes a column info
#'   object as an argument.
#' @param footer Footer content or render function. Render functions can be an
#'   R function that takes two arguments, the column values and column name, or a
#'   [JS()] function that takes a column info object as an argument.
#' @param details Additional content to display when expanding a row. An R function
#'   that takes a row index argument or a [JS()] function that takes a row info object
#'   as an argument. Cannot be used on a grouping column.
#' @param html Render content as HTML? Raw HTML strings are escaped by default.
#' @param na String to display for missing values (i.e. [NA] or [NaN]).
#'   By default, missing values are displayed as blank cells.
#' @param minWidth Minimum width of the column in pixels. Defaults to 100.
#' @param maxWidth Maximum width of the column in pixels.
#' @param width Fixed width of the column in pixels. Overrides `minWidth` and `maxWidth`.
#' @param align Column alignment. One of `"left"`, `"right"`, `"center"`.
#' @param class Additional CSS classes to apply to cells. Can also be an R function
#'   that takes the cell value, row index, and column name as arguments, or a [JS()]
#'   function that takes a row info object, column info object, and table state
#'   object as arguments.
#'
#'   Note that R functions cannot apply classes to aggregated cells.
#' @param style Inline styles to apply to cells. A named list or character string.
#'   Can also be an R function that takes the cell value and row index as arguments,
#'   or a [JS()] function that takes a row info object, column info object, and
#'   table state object as arguments.
#'
#'   Note that R functions cannot apply styles to aggregated cells.
#'   If `style` is a named list, property names should be camelCased.
#' @param headerClass Additional CSS classes to apply to the header.
#' @param headerStyle Inline styles to apply to the header. A named list or
#'   character string.
#'
#'   Note that if `headerStyle` is a named list, property names should be camelCased.
#' @param footerClass Additional CSS classes to apply to the footer.
#' @param footerStyle Inline styles to apply to the footer. A named list or
#'   character string.
#'
#'   Note that if `footerStyle` is a named list, property names should be camelCased.
#' @return A column definition object that can be used to customize columns
#'   in `reactable()`.
#'
#' @examples
#' reactable(
#'   iris,
#'   columns = list(
#'     Sepal.Length = colDef(name = "Sepal Length"),
#'     Sepal.Width = colDef(filterable = TRUE),
#'     Petal.Length = colDef(show = FALSE),
#'     Petal.Width = colDef(defaultSortOrder = "desc")
#'   )
#' )
#'
#' @export
colDef <- function(name = NULL, aggregate = NULL, sortable = NULL,
                   resizable = NULL, filterable = NULL, show = TRUE,
                   defaultSortOrder = NULL, sortNALast = FALSE, format = NULL,
                   cell = NULL, aggregated = NULL, header = NULL, footer = NULL,
                   details = NULL, html = FALSE, na = "", minWidth = NULL,
                   maxWidth = NULL, width = NULL, align = NULL, class = NULL,
                   style = NULL, headerClass = NULL, headerStyle = NULL,
                   footerClass = NULL, footerStyle = NULL) {

  if (!is.null(name) && !is.character(name)) {
    stop("`name` must be a character string")
  }
  if (!is.null(aggregate)) {
    if (is.character(aggregate) && !is.JS(aggregate)) {
      aggregators <- c("mean", "sum", "max", "min", "median", "count",
                       "unique", "frequency")
      if (!aggregate %in% aggregators) {
        stop("`aggregate` must be a valid aggregate function")
      }
    } else if (!is.JS(aggregate)) {
      stop("`aggregate` must be a character string or JS function")
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
  if (!is.logical(sortNALast)) {
    stop("`sortNALast` must be TRUE or FALSE")
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
    stop("`cell` renderer must be an R function or JS function")
  }
  if (!is.null(aggregated) && !is.JS(aggregated)) {
    stop("`aggregated` renderer must be a JS function")
  }
  if (!is.null(details) && !is.function(details) && !is.JS(details) && !is.list(details)) {
    stop("`details` renderer must be an R function or JS function")
  }
  if (!is.logical(html)) {
    stop("`html` must be TRUE or FALSE")
  }
  if (!is.character(na)) {
    stop("`na` must be a character string")
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
  if (!is.null(class) && !is.character(class) && !is.JS(class) && !is.function(class)) {
    stop("`class` must be a character string, JS function, or R function")
  }
  if (!is.null(style) && !isNamedList(style) && !is.character(style) &&
      !is.JS(style) && !is.function(style)) {
    stop("`style` must be a named list, character string, JS function, or R function")
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
      name = name,
      aggregate = aggregate,
      sortable = sortable,
      resizable = resizable,
      filterable = filterable,
      show = if (!show) FALSE,
      defaultSortDesc = if (!is.null(defaultSortOrder)) isDescOrder(defaultSortOrder),
      sortNALast = if (sortNALast) TRUE,
      format = format,
      cell = cell,
      aggregated = aggregated,
      header = header,
      footer = footer,
      details = details,
      html = if (html) TRUE,
      na = if (na != "") na,
      minWidth = minWidth,
      maxWidth = maxWidth,
      width = width,
      align = align,
      className = class,
      style = if (is.function(style) || is.JS(style)) style else asReactStyle(style),
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
#' Use `colGroup()` to create column groups in a table.
#'
#' @param name Column group header name.
#' @param columns Character vector of column names in the group.
#' @param header Custom header renderer. An R function that takes the header value
#'   as an argument, or a [JS()] function that takes a column info object as an argument.
#' @param html Render header content as HTML? Raw HTML strings are escaped by default.
#' @param align Column group header alignment. One of `"left"`, `"right"`, `"center"`.
#' @param headerClass Additional CSS classes to apply to the header.
#' @param headerStyle Inline styles to apply to the header. A named list or
#'   character string.
#'
#'   Note that if `headerStyle` is a named list, property names should be camelCased.
#' @return A column group definition object that can be used to create column
#'   groups in `reactable()`.
#'
#' @examples
#' reactable(
#'   iris,
#'   columns = list(
#'     Sepal.Length = colDef(name = "Length"),
#'     Sepal.Width = colDef(name = "Width"),
#'     Petal.Length = colDef(name = "Length"),
#'     Petal.Width = colDef(name = "Width")
#'   ),
#'   columnGroups = list(
#'     colGroup(name = "Sepal", columns = c("Sepal.Length", "Sepal.Width")),
#'     colGroup(name = "Petal", columns = c("Petal.Length", "Petal.Width"))
#'   )
#' )
#'
#' @export
colGroup <- function(name = NULL, columns = NULL, header = NULL, html = FALSE,
                     align = NULL, headerClass = NULL, headerStyle = NULL) {
  if (!is.null(name) && !is.character(name)) {
    stop("`name` must be a character string")
  }
  if (!is.null(columns)) {
    if (!is.character(columns)) {
      stop("`columns` must be a character vector")
    } else {
      # Ensure column IDs are serialized as an array
      columns <- as.list(columns)
    }
  }

  group <- tryCatch({
    colDef(
      name = name,
      header = header,
      html = html,
      align = align,
      headerClass = headerClass,
      headerStyle = headerStyle
    )
  }, error = function(e) e)

  if (inherits(group, "error")) {
    stop(group$message)
  }

  group$columns <- columns
  structure(group, class = "colGroup")
}

is.colGroup <- function(x) {
  inherits(x, "colGroup")
}

#' Column formatting options
#'
#' Use `colFormat()` to add data formatting to a column.
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
#' @param locales Locales to use for number, date, time, and currency formatting.
#'   A character vector of BCP 47 language tags, such as `"en-US"` for English
#'   (United States), `"hi"` for Hindi, or `"sv-SE"` for Swedish (Sweden).
#'   Defaults to the locale of the user's browser.
#'
#'   Multiple locales may be specified to provide a fallback language in case
#'   a locale is unsupported. When multiple locales are specified, the first
#'   supported locale will be used.
#'
#'   See [here](https://docs.microsoft.com/en-us/openspecs/office_standards/ms-oe376/6c085406-a698-4e12-9d4d-c3b0ee3dbc4a)
#'   for a list of common BCP 47 language tags.
#' @return A column format object that can be used to customize data formatting
#'   in `colDef()`.
#'
#' @seealso Custom cell rendering in [colDef()] to customize data formatting
#'   beyond what the built-in formatters provide.
#'
#' @examples
#' data <- data.frame(
#'   price_USD = c(123456.56, 132, 5650.12),
#'   price_INR = c(350, 23208.552, 1773156.4),
#'   number_FR = c(123456.56, 132, 5650.12),
#'   temp = c(22, NA, 31),
#'   percent = c(0.9525556, 0.5, 0.112),
#'   date = as.Date(c("2019-01-02", "2019-03-15", "2019-09-22"))
#' )
#'
#' reactable(data, columns = list(
#'   price_USD = colDef(format = colFormat(prefix = "$", separators = TRUE, digits = 2)),
#'   price_INR = colDef(format = colFormat(currency = "INR", separators = TRUE, locales = "hi-IN")),
#'   number_FR = colDef(format = colFormat(locales = "fr-FR")),
#'   temp = colDef(format = colFormat(suffix = " \u00b0C")),
#'   percent = colDef(format = colFormat(percent = TRUE, digits = 1)),
#'   date = colDef(format = colFormat(date = TRUE, locales = "en-GB"))
#' ))
#'
#' # Date formatting
#' datetimes <- as.POSIXct(c("2019-01-02 3:22:15", "2019-03-15 09:15:55", "2019-09-22 14:20:00"))
#' data <- data.frame(
#'   datetime = datetimes,
#'   date = datetimes,
#'   time = datetimes,
#'   time_24h = datetimes,
#'   datetime_pt_BR = datetimes
#' )
#'
#' reactable(data, columns = list(
#'   datetime = colDef(format = colFormat(datetime = TRUE)),
#'   date = colDef(format = colFormat(date = TRUE)),
#'   time = colDef(format = colFormat(time = TRUE)),
#'   time_24h = colDef(format = colFormat(time = TRUE, hour12 = FALSE)),
#'   datetime_pt_BR = colDef(format = colFormat(datetime = TRUE, locales = "pt-BR"))
#' ))
#'
#' # Currency formatting
#' data <- data.frame(
#'   USD = c(12.12, 2141.213, 0.42, 1.55, 34414),
#'   EUR = c(10.68, 1884.27, 0.37, 1.36, 30284.32),
#'   INR = c(861.07, 152122.48, 29.84, 110, 2444942.63),
#'   JPY = c(1280, 226144, 44.36, 164, 3634634.61),
#'   MAD = c(115.78, 20453.94, 4.01, 15, 328739.73)
#' )
#'
#' reactable(data, columns = list(
#'   USD = colDef(
#'     format = colFormat(currency = "USD", separators = TRUE, locales = "en-US")
#'   ),
#'   EUR = colDef(
#'     format = colFormat(currency = "EUR", separators = TRUE, locales = "de-DE")
#'   ),
#'   INR = colDef(
#'     format = colFormat(currency = "INR", separators = TRUE, locales = "hi-IN")
#'   ),
#'   JPY = colDef(
#'     format = colFormat(currency = "JPY", separators = TRUE, locales = "ja-JP")
#'   ),
#'   MAD = colDef(
#'     format = colFormat(currency = "MAD", separators = TRUE, locales = "ar-MA")
#'   )
#' ))
#'
#' # Formatting aggregated cells
#' data <- data.frame(
#'   States = state.name,
#'   Region = state.region,
#'   Area = state.area
#' )
#'
#' reactable(data, groupBy = "Region", columns = list(
#'   States = colDef(
#'     aggregate = "count",
#'     format = list(
#'       aggregated = colFormat(suffix = " states")
#'     )
#'   ),
#'   Area = colDef(
#'     aggregate = "sum",
#'     format = colFormat(suffix = " mi\u00b2", separators = TRUE)
#'   )
#' ))
#'
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
    if (!is.numeric(digits) || digits < 0 || digits > 18) {
      stop("`digits` must be a number between 0 and 18")
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
