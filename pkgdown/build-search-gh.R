# Build search index for GitHub Pages (served at /reactable).
# build-docs.R must be run first.
pkgdown::build_search(override = list(url = "/reactable"))
