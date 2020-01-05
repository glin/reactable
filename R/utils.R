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

is.htmlDependency <- function(x) {
  inherits(x, "html_dependency")
}

# Test both shiny.tag.list and regular lists of tags
isTagList <- function(x) {
  inherits(x, "shiny.tag.list") || (is.list(x) && all(sapply(x, is.tag)))
}

asReactTag <- function(x) {
  if (is.htmlwidget(x)) {
    if (inherits(x, "reactable")) {
      # Extract tag for subtables / child tables
      x$x$tag <- htmltools::tagAppendAttributes(x$x$tag, isChild = TRUE)
      return(asReactTag(x$x$tag))
    } else {
      tags <- htmltools::as.tags(x)
      tags <- asReactTag(tags)
      # Add a key for proper widget rerenders
      tags <- reactR::React$WidgetContainer(tags, key = digest::digest(x))
      return(tags)
    }
  }

  # Unnest and wrap tag lists in fragments for proper hydration
  if (isTagList(x)) {
    x <- unnestTagList(x)
    # Preserve HTML dependencies
    deps <- htmltools::htmlDependencies(x)
    # Collect inline HTML dependencies
    inlineDeps <- sapply(x, is.htmlDependency)
    if (any(inlineDeps)) {
      deps <- c(deps, x[inlineDeps])
      x[inlineDeps] <- NULL
    }
    x <- lapply(x, asReactTag)
    x <- do.call(reactR::React$Fragment, x)
    return(htmltools::attachDependencies(x, deps))
  }

  if (!is.tag(x)) {
    # Nodes should be strings for proper hydration
    if (!is.null(x) && !is.character(x)) {
      x <- format(x)
    }
    return(x)
  }

  # Unnest tag lists for proper hydration
  x$children <- unnestTagList(x$children)
  # Preserve HTML dependencies
  deps <- htmltools::htmlDependencies(x$children)
  # Collect inline HTML dependencies
  inlineDeps <- sapply(x$children, is.htmlDependency)
  if (any(inlineDeps)) {
    deps <- c(deps, x$children[inlineDeps])
    x$children[inlineDeps] <- NULL
  }
  x <- htmltools::attachDependencies(x, deps, append = TRUE)
  # Filter null elements for proper hydration
  x$children <- filterNulls(x$children)
  x$children <- lapply(x$children, asReactTag)
  x$attribs <- asReactAttributes(x$attribs)
  x
}

# Recursively unnest tag lists
unnestTagList <- function(x) {
  isList <- function(x) {
    # Ignore HTML tags/widgets/dependencies, which are technically lists
    is.list(x) && !is.tag(x) && !is.htmlwidget(x) && !is.htmlDependency(x)
  }

  if (!isList(x)) {
    return(x)
  }

  # Preserve HTML dependencies of tag lists
  htmlDeps <- htmltools::htmlDependencies(x)

  tags <- Reduce(function(a, b) {
    if (is.null(b)) {
      return(a)
    }
    if (isTagList(b)) {
      # Preserve HTML dependencies of nested tag lists
      deps <- htmltools::htmlDependencies(b)
      if (!is.null(deps)) {
        htmlDeps <<- c(htmlDeps, deps)
      }
      b <- unnestTagList(b)
    }
    # Merge without losing attributes
    if (isList(b)) {
      c(a, b)
    } else {
      c(a, list(b))
    }
  }, x, list())

  htmltools::attachDependencies(tags, htmlDeps)
}

asReactAttributes <- function(attribs) {
  reactAttribs <- list(
    autofocus = "autoFocus",
    autocomplete = "autoComplete",
    autoplay = "autoPlay",
    charset = "charSet",
    checked = "defaultChecked",
    class = "className",
    colspan = "colSpan",
    crossorigin = "crossOrigin",
    enctype = "encType",
    "for" = "htmlFor",
    formaction = "formAction",
    formenctype = "formEncType",
    formmethod = "formMethod",
    formnovalidate = "formNoValidate",
    formtarget = "formTarget",
    frameborder = "frameBorder",
    hreflang = "hrefLang",
    "http-equiv" = "httpEquiv",
    inputmode = "inputMode",
    maxlength = "maxLength",
    mediagroup = "mediaGroup",
    minlength = "minLength",
    novalidate = "noValidate",
    radiogroup = "radioGroup",
    readonly = "readOnly",
    rowspan = "rowSpan",
    spellcheck = "spellCheck",
    srcdoc = "srcDoc",
    srclang = "srcLang",
    tabindex = "tabIndex",
    usemap = "useMap",
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

# Call function with a variable number of args.
# Args default to NULL if not supplied.
callFunc <- function(func, ...) {
  args <- list(...)
  numArgs <- length(formals(func))
  do.call(func, args[seq_len(numArgs)])
}
