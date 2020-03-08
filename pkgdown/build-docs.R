pkgdown::build_site()

index_html <- xml2::read_html("docs/index.html")

example <- xml2::xml_find_first(index_html, ".//*/comment()[contains(., 'pkgdown:example')]/following-sibling::*")

rmarkdown::render("pkgdown/example.Rmd", output_dir = "docs")
example_html <- xml2::read_html("docs/example.html")
widget_html <- xml2::xml_find_first(example_html, ".//*[contains(@class, 'reactable')]")
widget_deps <- xml2::xml_find_all(example_html, ".//script")

for (dep in rev(widget_deps)) {
  xml2::xml_add_sibling(example, dep)
}
xml2::xml_replace(example, widget_html)

xml2::write_html(index_html, "docs/index.html")
