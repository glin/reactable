# Contributing

## Development

### Prerequisites

- [R](https://www.r-project.org/) \>= 3.1
- [Node.js](https://nodejs.org) LTS

### Installation

Install dependencies for R:

``` r
# install.packages("devtools")
devtools::install_dev_deps()
```

Install dependencies for JavaScript:

``` bash
npm install
```

### Building

Build the JS/CSS bundle (outputs to `inst/htmlwidgets`):

``` bash
npm run build
```

Then load (`devtools::load_all()`) or reinstall the package.

These generated files should be added in their own separate commit,
preferably only once per branch.

### Testing

Run R tests:

``` r
devtools::test()

# With test coverage (requires DT)
# install.packages("DT")
covr::report()
```

Run JavaScript tests:

``` bash
npm test

# With test coverage
npm run test:cover

# Update test snapshots
npm run test:update
```

### Linting and Formatting

Lint and format the JS/CSS:

``` bash
npm run lint
npm run format
```
