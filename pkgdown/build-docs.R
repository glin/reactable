# Create client-rendered versions of the Examples and Cookbook docs for comparison
examples_src <- readLines("vignettes/examples.Rmd")
examples_src <- sub("options(reactable.static = TRUE)", "options(reactable.static = FALSE)", examples_src, fixed = TRUE)
writeLines(examples_src, "vignettes/examples-no-static.Rmd")

cookbook_src <- readLines("vignettes/cookbook/cookbook.Rmd")
cookbook_src <- sub("options(reactable.static = TRUE)", "options(reactable.static = FALSE)", cookbook_src, fixed = TRUE)
writeLines(cookbook_src, "vignettes/cookbook/cookbook-no-static.Rmd")

pkgdown::build_site()

unlink("vignettes/examples-no-static.Rmd")
unlink("vignettes/cookbook/cookbook-no-static.Rmd")

# Replace example table image in README with an actual table
index_html <- xml2::read_html("docs/index.html")

example <- xml2::xml_find_first(index_html, ".//*/comment()[contains(., 'pkgdown:example')]/following-sibling::*")

rmarkdown::render("pkgdown/example.Rmd", output_dir = "docs")
example_html <- xml2::read_html("docs/example.html")
widget_html <- xml2::xml_find_first(example_html, ".//*[contains(@class, 'reactable')]")
widget_deps <- xml2::xml_find_all(example_html, ".//script|.//link")

for (dep in rev(widget_deps)) {
  xml2::xml_add_sibling(example, dep)
}
xml2::xml_replace(example, widget_html)

xml2::write_html(index_html, "docs/index.html")
