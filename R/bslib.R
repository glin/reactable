supplyBsThemeDefaults <- function(instance) {
  if (system.file(package = "bslib") == "") {
    return(instance)
  }
  theme <- bslib::bs_current_theme()
  if (!bslib::is_bs_theme(theme)) {
    return(instance)
  }
  # If a bslib theme is relevant, supply new reactableTheme() defaults
  # based on the relevant Bootstrap Sass variables
  themeVars <- getThemeVars(theme)
  for (x in names(themeVars)) {
    instance$x$tag$attribs$theme[[x]] <-
      instance$x$tag$attribs$theme[[x]] %||% themeVars[[x]]
  }
  styleVals <- getStyleVals(theme)
  for (x in names(styleVals)) {
    vals <- styleVals[[x]]
    if (isTRUE(is.na(vals))) next # failed to parse Sass rules
    instance$x$tag$attribs$theme[[x]] <- utils::modifyList(
      vals, instance$x$tag$attribs$theme[[x]] %||% list()
    )
  }

  instance
}


getThemeVars <- function(theme) {
  map <- if (is_bs3(theme)) bsVariableMap3 else bsVariableMap
  vars <- bslib::bs_get_variables(theme, as.character(map))
  vars <- setNames(vars, names(map))
  vars[!is.na(vars)]
}

# Map the non-style reactableTheme() settings to main Bootstrap Sass variables
bsVariableMap <- c(
  color	= "table-color",
  borderColor	= "table-border-color",
  borderWidth	= "table-border-width",
  stripedColor = "table-accent-bg",
  highlightColor = "primary",
  cellPadding	= "table-cell-padding"
)

bsVariableMap3 <- c(
  color	= "text-color",
  borderColor	= "table-border-color",
  stripedColor = "table-bg-accent",
  highlightColor = "brand-primary",
  cellPadding	= "table-cell-padding"
)


getStyleVals <- function(theme) {
  lapply(bsStyleMap, computeStyles, theme = theme)
}

computeStyles <- function(x, theme) {
  # Handle BS3isms (without requiring a different bsStyleMap)
  if (is_bs3(theme)) {
    theme <- bslib::bs_add_variables(
      theme, "input-border-width" = "1px",
      "pagination-border-width" = "1px",
      "pagination-border-color" = "$pagination-border",
      "pagination-hover-border-color" = "$pagination-hover-border",
      "pagination-active-border-color" = "$pagination-active-border",
      .where = "declarations"
    )
  }
  # Try to compile the Sass rules. Note that an error could happen
  # if Bootstrap Sass variables change in future versions.
  # (In that case, we'll need to update accordingly to support BS5+)
  prop_string <- paste0(names(x), ":", x, collapse = ";")
  res <- try(
    sass::sass_partial(
      paste0(".fake-selector{", prop_string, "}"),
      theme, options = sass::sass_options(output_style = "compressed")
    ),
    silent = TRUE
  )
  if (inherits(res, "try-error")) {
    warning(
      "Failed to compute the following Sass rule(s) '", prop_string, "'. ",
      "{reactable}'s theming defaults may not reflect the {bslib} theme.",
      call. = FALSE
    )
    return(NA)
  }
  matches <- regmatches(res, regexec(".fake-selector\\s*\\{(.+)\\}", res))
  asReactStyle(matches[[1]][2])
}

bsStyleMap <- list(
  style = list(
    fontFamily = "$font-family-base",
    backgroundColor = "if($table-bg==null or alpha($table-bg)==0, $body-bg, $table-bg)"
  ),
  headerStyle = list(
    fontFamily = "$headings-font-family"
  ),
  rowHighlightStyle = list(
    color = "color-contrast($primary)"
  ),
  inputStyle = list(
    color = "$input-color",
    backgroundColor = "$input-bg",
    border = "$input-border-width solid $input-border-color"
  ),
  pageButtonStyle = list(
    color = "$pagination-color",
    backgroundColor = "$pagination-bg",
    border = "$pagination-border-width solid $pagination-border-color"
  ),
  pageButtonHoverStyle = list(
    color = "$pagination-hover-color",
    backgroundColor = "$pagination-hover-bg",
    border = "$pagination-border-width solid $pagination-hover-border-color"
  ),
  pageButtonActiveStyle = list(
    color = "$pagination-active-color",
    backgroundColor = "$pagination-active-bg",
    border = "$pagination-border-width solid $pagination-active-border-color"
  ),
  pageButtonCurrentStyle = list(
    color = "$pagination-active-color",
    backgroundColor = "$pagination-active-bg",
    border = "$pagination-border-width solid $pagination-active-border-color"
  )
)

is_bs3 <- function(theme) {
  "3" %in% bslib::theme_version(theme)
}
