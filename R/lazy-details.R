# One request observer per Shiny session, shared by top-level and nested tables.
# Callbacks and rendered outputs never enter the widget's JSON payload.
lazyDetailsRegistry <- function(session) {
  session <- session$rootScope()
  registry <- session$userData$reactableLazyDetails
  if (!is.null(registry)) return(registry)
  registry <- new.env(parent = emptyenv())
  registry$tables <- new.env(parent = emptyenv())
  registry$outputs <- new.env(parent = emptyenv())
  registry$counter <- 0L
  registry$current <- NULL
  registry$inputId <- session$ns("__reactable_lazy__")
  session$userData$reactableLazyDetails <- registry
  registry$observer <- shiny::observeEvent(session$input[["__reactable_lazy__"]], {
    requests <- session$input[["__reactable_lazy__"]]
    if (!is.list(requests)) return()
    for (request in requests) lazyDetailsRequest(registry, request)
  }, ignoreInit = TRUE, domain = session)
  session$onSessionEnded(function() {
    for (id in ls(registry$tables)) destroyLazyTable(registry, id)
    registry$observer$destroy()
  })
  registry
}

registerLazyDetails <- function(callbacks, rowCount, session) {
  registry <- lazyDetailsRegistry(session)
  registry$counter <- registry$counter + 1L
  id <- paste0("table", registry$counter)
  parent <- registry$current
  outputId <- NULL
  if (is.null(parent)) {
    info <- shiny::getCurrentOutputInfo(session = session)
    if (!is.null(info$name)) {
      # Shiny output info already contains the fully namespaced output name.
      outputId <- info$name
      old <- registry$outputs[[outputId]]
      if (!is.null(old)) destroyLazyTable(registry, old)
      registry$outputs[[outputId]] <- id
    }
  }
  entry <- new.env(parent = emptyenv())
  entry$callbacks <- callbacks
  entry$rowCount <- rowCount
  entry$session <- session
  entry$panels <- new.env(parent = emptyenv())
  entry$outputId <- outputId
  entry$parent <- parent
  registry$tables[[id]] <- entry
  if (!is.null(parent)) {
    panel <- registry$tables[[parent$table]]$panels[[parent$request]]
    panel$children <- c(panel$children, id)
  }
  list(id = id, inputId = registry$inputId)
}

destroyLazyPanel <- function(registry, table, request) {
  entry <- registry$tables[[table]]
  if (is.null(entry)) return(invisible(NULL))
  panel <- entry$panels[[request]]
  if (is.null(panel)) return(invisible(NULL))
  for (child in panel$children) destroyLazyTable(registry, child)
  entry$session$output[[panel$outputId]] <- NULL
  rm(list = request, envir = entry$panels)
  invisible(NULL)
}

destroyLazyTable <- function(registry, id) {
  entry <- registry$tables[[id]]
  if (is.null(entry)) return(invisible(NULL))
  for (request in ls(entry$panels)) destroyLazyPanel(registry, id, request)
  if (!is.null(entry$outputId) && identical(registry$outputs[[entry$outputId]], id)) {
    rm(list = entry$outputId, envir = registry$outputs)
  }
  rm(list = id, envir = registry$tables)
  invisible(NULL)
}

lazyDetailsString <- function(x) {
  is.character(x) && length(x) == 1L && !is.na(x) && nzchar(x)
}

lazyDetailsRequest <- function(registry, request) {
  if (!is.list(request) || !lazyDetailsString(request$table)) return(invisible(NULL))
  entry <- registry$tables[[request$table]]
  # A rerender or parent collapse invalidates all requests for that table.
  if (is.null(entry)) return(invisible(NULL))
  if (identical(request$action, "dispose")) {
    destroyLazyTable(registry, request$table)
    return(invisible(NULL))
  }
  if (!lazyDetailsString(request$request) || !grepl("^r[0-9]+$", request$request)) {
    return(invisible(NULL))
  }
  if (identical(request$action, "close")) {
    destroyLazyPanel(registry, request$table, request$request)
    return(invisible(NULL))
  }
  if (!identical(request$action, "open")) return(invisible(NULL))
  index <- request$index
  if (!is.numeric(index) || length(index) != 1L || is.na(index) ||
      !is.finite(index) || index != floor(index) || index < 1 || index > entry$rowCount ||
      !lazyDetailsString(request$column) || is.null(entry$callbacks[[request$column]])) {
    return(invisible(NULL))
  }
  if (!is.null(entry$panels[[request$request]])) return(invisible(NULL))

  panel <- new.env(parent = emptyenv())
  panel$children <- character()
  panel$outputId <- paste0("__reactable_lazy_", request$table, "_", request$request)
  entry$panels[[request$request]] <- panel
  oldContext <- registry$current
  registry$current <- list(table = request$table, request = request$request)
  on.exit({ registry$current <- oldContext }, add = TRUE)

  session <- entry$session
  shiny::withReactiveDomain(session, {
    content <- tryCatch(shiny::isolate({
      callFunc(entry$callbacks[[request$column]], as.integer(index), request$column)
    }), error = function(e) {
      # Discard children constructed before a failed callback.
      for (child in panel$children) destroyLazyTable(registry, child)
      panel$children <- character()
      if (inherits(e, "shiny.silent.error")) {
        msg <- conditionMessage(e)
        if (!nzchar(msg)) return(NULL)
        return(htmltools::div(class = "shiny-output-error-validation", msg))
      }
      message("reactable lazy details: ", conditionMessage(e))
      htmltools::div(class = "shiny-output-error", role = "alert",
        if (isTRUE(getOption("shiny.sanitize.errors", FALSE))) {
          "An error occurred while calculating these details."
        } else conditionMessage(e)
      )
    })
    # renderUI supplies Shiny's normal HTML dependency and htmlwidget handling.
    # It captures a snapshot, so reactive reads above do not create a permanent
    # reactive computation. Closing the panel removes this output explicitly.
    session$output[[panel$outputId]] <- shiny::renderUI({ content })
    session$sendCustomMessage("__reactable_lazy__", list(
      table = request$table, request = request$request,
      outputId = session$ns(panel$outputId)
    ))
  })
  invisible(NULL)
}
