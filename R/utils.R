#' @importFrom htmlwidgets JS
#' @export
htmlwidgets::JS

mergeLists <- function(a, b) {
  if (is.null(a)) {
    a <- list()
  }
  if (is.null(b)) {
    b <- list()
  }
  for (i in seq_along(b)) {
    name <- names(b[i])
    if (is.null(name) || name == "") {
      a <- c(a, b[i])
    } else if (!is.null(b[[i]])) {
      a[[name]] <- b[[i]]
    }
  }
  a
}

filterNulls <- function(x) {
  Filter(Negate(is.null), x)
}

is.JS <- function(x) {
  inherits(x, class(JS("")))
}

isNamedList <- function(x) {
  if (!is.list(x)) {
    return(FALSE)
  }
  if (length(x) >= 1 && is.null(names(x))) {
    return(FALSE)
  }
  if (any(names(x) == "")) {
    return(FALSE)
  }
  TRUE
}

is.Date <- function(x) {
  inherits(x, "Date")
}

is.POSIXct <- function(x) {
  inherits(x, "POSIXct")
}

is.POSIXlt <- function(x) {
  inherits(x, "POSIXlt")
}

is.tag <- function(x) {
  inherits(x, "shiny.tag")
}

is.htmlwidget <- function(x) {
  inherits(x, "htmlwidget")
}

# Test both shiny.tag.list and regular lists of tags
isTagList <- function(x) {
  is.list(x) && all(sapply(x, is.tag))
}

asReactTag <- function(x) {
  if (is.htmlwidget(x)) {
    return(asReactTag(x$x$tag))
  }
  if (!is.tag(x)) {
    return(x)
  }
  # Unnest tag lists for proper hydration
  if (is.list(x$children) && any(sapply(x$children, isTagList))) {
    x$children <- unlist(x$children, recursive = FALSE)
  }
  x$children <- lapply(x$children, asReactTag)
  # Filter null elements for proper hydration
  x$children <- filterNulls(x$children)
  x$attribs <- asReactAttributes(x$attribs)
  x
}

asReactAttributes <- function(attribs) {
  reactAttribs <- list(
    autofocus = "autoFocus",
    autocomplete = "autoComplete",
    checked = "defaultChecked",
    class = "className",
    colspan = "colSpan",
    "for" = "htmlFor",
    formaction = "formAction",
    formenctype = "formEncType",
    formmethod = "formMethod",
    formnovalidate = "formNoValidate",
    formtarget = "formTarget",
    frameborder = "frameBorder",
    maxlength = "maxLength",
    minlength = "minLength",
    radiogroup = "radioGroup",
    readonly = "readOnly",
    rowspan = "rowSpan",
    spellcheck = "spellCheck",
    tabindex = "tabIndex",
    value = "defaultValue"
  )

  for (name in names(attribs)) {
    if (!is.null(reactAttribs[[name]])) {
      attribs[[reactAttribs[[name]]]] <- attribs[[name]]
      attribs[[name]] <- NULL
    }
  }

  style <- attribs$style
  if (!is.null(style) && is.character(style)) {
    attribs$style <- asReactStyle(style)
  }

  attribs
}

asReactStyle <- function(style) {
  if (!is.character(style)) {
    return(style)
  }
  pairs <- strsplit(unlist(strsplit(style, ";")), ":")
  if (length(pairs) > 0) {
    pairs <- Reduce(function(props, pair) {
      if (length(pair) == 2) {
        name <- trimws(pair[[1]])
        value <- trimws(pair[[2]])
        props[[name]] <- value
      }
      props
    }, pairs, list())
  }
  pairs
}

# Backport for R 3.1
trimws <- function(x) {
  x <- sub("[ \t\r\n]+$", "", x, perl = TRUE)
  sub("^[ \t\r\n]+", "", x, perl = TRUE)
}
