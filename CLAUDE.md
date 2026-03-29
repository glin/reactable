## Public Documentation

When writing documentation, wrap lines at 120 characters for prose.

When updating `NEWS.md`, do not use line breaks for long sentences. Keep each bullet point or paragraph on a single line regardless of length.

When updating `NEWS.md`, group similar items together (e.g., all JavaScript API additions) and sort features by significance, with the most important and impactful features listed first.

When documenting new features in vignettes, add a version callout to indicate when the feature was introduced. Use the current package version from the `DESCRIPTION` file. For example:

```
::: {.callout}
New in v0.4.5.9000
:::
```

## Development Workflow

1. **Update design docs**: When using Plan Mode or for major features, write planning and design docs into the `design/` directory. Use `design/virtual-scrolling/` as a model. Ensure that features consider accessibility (targeting WCAG 2.2 at a minimum) and include a test plan. Also create an Rmd file with examples of different test cases. Use MASS::Cars93 or mtcars datasets for examples unless another built-in R dataset is more appropriate.
   - **Ask questions**: When writing design docs, ask clarifying questions about ambiguous design decisions, naming choices, scope, and behavior before finalizing the plan. This leads to much better designs.
   - **Reuse existing code**: Before writing new logic, search the codebase for existing implementations of similar behavior. Reuse and delegate to existing code paths rather than duplicating logic (e.g., if header click sorting already computes the right state, call into that same code path from the API).
2. **Make changes**
   - **Parameter ordering**: When adding parameters to an existing function that mirrors another function (e.g., `updateReactable()` mirrors `reactable()`), order new parameters to roughly match the order of associated features/parameters in the parent function.
3. **Document R API**: Always run `devtools::document()` in R after making any changes to roxygen comments or exported functions. This updates `NAMESPACE`, `man/` pages, and ensures the documentation stays in sync.
4. **Format**: Format JavaScript code using `prettier`.
5. **Lint**: Lint JavaScript code using `eslint`.
6. **Update docs**: Update `NEWS.md` and `vignettes/examples.Rmd`. Check if any updates should be made to the existing Rmd docs under `vignettes/`.
7. **Commit**: Never commit built files in `inst/htmlwidgets/` together with source code changes. Always commit built files as separate, standalone commits, and only when prompted to do so.

## JavaScript API in HTML Documents

JavaScript API calls like `Reactable.onStateChange()` that reference a reactable instance cannot run in an inline
`<script>` tag because the widget may not have rendered yet. Use `htmlwidgets::onStaticRenderComplete()` for static
widgets (Rmd/HTML documents) or `htmlwidgets::onRender()` for Shiny outputs to ensure the instance exists first.
Button `onclick` handlers are fine since they run on user interaction, after the widget is already rendered.

## JavaScript Code Style

Use `Boolean()` for boolean coercion instead of `!!`. For example, use `Boolean(column && column.sortDescFirst)` rather than `!!(column && column.sortDescFirst)`.

## JavaScript Tests

When adding JavaScript tests, use JSX syntax.

## Bumping Package Version

When bumping the package version and the previous version is a development version (4th version component is 9000 or above, e.g., `0.4.5.9000`), search for all version callouts in the docs (e.g., "New in v0.4.5.9000") and update them to the new package version. Search in `vignettes/` for callouts like `::: {.callout}` followed by version strings.

## Adding New Files

When adding new files that are not meant to be included in the R package (e.g., development tools, test fixtures, documentation sources), add them to `.Rbuildignore`.

## Browser Testing

Use `agent-browser` for end-to-end testing in the browser. Run `agent-browser --help` for all commands.

### Generating test HTML files

To generate a standalone HTML file with a reactable table for browser testing, use `htmltools::save_html()`:

```r
Rscript -e "library(reactable); library(htmltools); w <- reactable(mtcars[1:10, ]); f <- tempfile(fileext = '.html'); save_html(w, file = f); cat(f)"
```

This creates a self-contained HTML file that can be opened directly in `agent-browser`. Use the printed temp file path
with `agent-browser open`.

### Core workflow

1. `agent-browser --allow-file-access open file:///path/to/file.html` — Open a local HTML file
2. `agent-browser snapshot -i` — Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` — Interact using refs
4. Re-snapshot after page changes

Use `--allow-file-access` when opening local `file://` URLs (knitted Rmd output, test HTML files). This is required
for the widget's JavaScript to load local resources.

Useful commands for testing reactable widgets:

- `agent-browser snapshot -i` — List interactive elements (pagination buttons, sort headers, filter inputs)
- `agent-browser screenshot [path]` — Take a screenshot (use `--full` for full page)
- `agent-browser get text <sel>` — Get text content of an element
- `agent-browser eval <js>` — Run JavaScript (e.g., check `Reactable.getState()`)
- `agent-browser wait --text "some text"` — Wait for text to appear after an interaction
- `agent-browser wait --load networkidle` — Wait for page to finish loading (useful after opening HTML files)

## Adding Library Dependencies

When adding a new JS library dependency that gets shipped to users (included in `inst/htmlwidgets` files):

1. **Consider bundle size**: Evaluate the impact on bundle size and whether the functionality justifies the increase.
2. **Update Authors@R**: Add the library author to the `Authors@R` field in the `DESCRIPTION` file with the appropriate role (typically `"ctb"` for contributor and `"cph"` for copyright holder).
