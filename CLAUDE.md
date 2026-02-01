## Public Documentation

When updating `NEWS.md`, do not use line breaks for long sentences. Keep each bullet point or paragraph on a single line regardless of length.

## Development Workflow

1. **Update design docs**: When using Plan Mode or for major features, write planning and design docs into the `design/` directory. Use `design/virtual-scrolling/` as a model. Ensure that features consider accessibility and include a test plan. Also create an Rmd file with examples of different test cases. Use mtcars dataset for examples unless another dataset is more appropriate.
2. **Make changes**
3. **Document R API**: Run `devtools::document()` in R when making any changes to the R API (roxygen comments).
4. **Format**: Format JavaScript code using `prettier`.
5. **Lint**: Lint JavaScript code using `eslint`.
6. **Update docs**: Update `NEWS.md` and `vignettes/examples.Rmd`. Check if any updates should be made to the existing Rmd docs under `vignettes/`.

## Adding New Files

When adding new files that are not meant to be included in the R package (e.g., development tools, test fixtures, documentation sources), add them to `.Rbuildignore`.

## Adding Library Dependencies

When adding a new JS library dependency that gets shipped to users (included in `inst/htmlwidgets` files):

1. **Consider bundle size**: Evaluate the impact on bundle size and whether the functionality justifies the increase.
2. **Update Authors@R**: Add the library author to the `Authors@R` field in the `DESCRIPTION` file with the appropriate role (typically `"ctb"` for contributor and `"cph"` for copyright holder).
