#' @importFrom htmlwidgets JS
#' @export
htmlwidgets::JS

mergeLists <- function(a, b) {
  for (name in names(b)) {
    if (!is.null(b[[name]])) {
      a[[name]] <- b[[name]]
    }
  }
  a
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
