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
      # Extract tag for nested tables
      x$x$tag <- htmltools::tagAppendAttributes(x$x$tag, nested = TRUE)
      tag <- asReactTag(x$x$tag)
      tag <- htmltools::attachDependencies(tag, x$dependencies)
      return(tag)
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
    if (!is.null(x) && (!is.character(x) || is.na(x))) {
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
  x$attribs <- asReactAttributes(x$attribs, x$name)
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

# Transform HTML attributes to React DOM attributes.
# Not all attributes are supported at the moment - notable exceptions are
# some event handler attributes and `selected` attributes for <option> elements.
asReactAttributes <- function(attribs, tagName) {
  htmlAttribs <- list(
    autofocus = "autoFocus",
    autocomplete = "autoComplete",
    autoplay = "autoPlay",
    charset = "charSet",
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
    usemap = "useMap"
  )

  eventAttribs <- list(
    onblur = "onBlur",
    onchange = "onChange",
    onclick = "onClick",
    ondblclick = "onDoubleClick",
    onfocus = "onFocus",
    ongotpointercapture = "onGotPointerCapture",
    onlostpointercapture = "onLostPointerCapture",
    oninput = "onInput",
    onkeydown = "onKeyDown",
    onkeypress = "onKeyPress",
    onkeyup = "onKeyUp",
    onload = "onLoad",
    onmousedown = "onMouseDown",
    onmouseenter = "onMouseEnter",
    onmouseleave = "onMouseLeave",
    onmousemove = "onMouseMove",
    onmouseout = "onMouseOut",
    onmouseover = "onMouseOver",
    onmouseup = "onMouseUp",
    onpointercancel = "onPointerCancel",
    onpointerdown = "onPointerDown",
    onpointerenter = "onPointerEnter",
    onpointerleave = "onPointerLeave",
    onpointermove = "onPointerMove",
    onpointerout = "onPointerOut",
    onpointerover = "onPointerOver",
    onpointerup = "onPointerUp",
    onresize = "onResize",
    onselect = "onSelect",
    ontouchcancel = "onTouchCancel",
    ontouchend = "onTouchEnd",
    ontouchmove = "onTouchMove",
    ontouchstart = "onTouchStart"
  )

  for (name in names(attribs)) {
    # Map HTML attributes to React attributes. Not required as React still accepts
    # the standard attribute names.
    if (!is.null(htmlAttribs[[name]])) {
      attribs[[htmlAttribs[[name]]]] <- attribs[[name]]
      attribs[[name]] <- NULL
    }

    # Transform inline event attributes, ensuring `this` and `event` are in scope.
    if (!is.null(eventAttribs[[name]])) {
      attribs[[eventAttribs[[name]]]] <- JS(sprintf(
        "function(_e){(function(event){%s}).apply(event.target,[_e])}",
        attribs[[name]]
      ))
      attribs[[name]] <- NULL
    }
  }

  # Transform form element attributes to their uncontrolled equivalents, since
  # controlled attributes don't make sense outside of React.
  if (tagName %in% c("input", "select", "textarea")) {
    value <- attribs[["value"]]
    if (!is.null(value)) {
      attribs[["defaultValue"]] <- value
      attribs[["value"]] <- NULL
    }
  }

  if (tagName == "input") {
    checked <- attribs[["checked"]]
    if (!is.null(checked)) {
      checked <- if (is.na(checked)) TRUE else checked
      attribs[["defaultChecked"]] <- checked
      attribs[["checked"]] <- NULL
    }
  }

  style <- attribs[["style"]]
  if (!is.null(style) && is.character(style)) {
    attribs[["style"]] <- asReactStyle(style)
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
