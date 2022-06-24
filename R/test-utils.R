getAttribs <- function(widget) {
  widget$x$tag$attribs
}

getAttrib <- function(widget, name) {
  widget$x$tag$attribs[[name]]
}
