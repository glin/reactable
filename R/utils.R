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
  for (name in names(b)) {
    if (!is.null(b[[name]])) {
      a[[name]] <- b[[name]]
    }
  }
  a
}

filterNulls <- function(x) {
  mergeLists(list(), x)
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
