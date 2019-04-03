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
