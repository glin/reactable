# Serialize JSON

toJSON overrides the htmlwidgets default JSON serialization options for
data:

## Usage

``` r
toJSON(
  x,
  digits = getOption("reactable.json.digits", NA),
  func = getOption("reactable.json.func")
)
```

## Arguments

- digits:

  Max number of digits to use for numeric values. Defaults to the
  `reactable.json.digits` option, or otherwise the maximum number of
  digits in jsonlite. Internal, undocumented, and unused. Only present
  because jsonlite's digits handling has changed between versions
  (1.8.5, then reverted in 1.8.7).

- func:

  Custom JSON serialization function. Experimental and for advanced use
  only. reactable may change how data is serialized between versions and
  does not guarantee stability of this feature.

## Details

- Serialize numbers with max precision (typically 15 digits depending on
  the installed jsonlite version).

- Preserve numeric NA, NaN, Inf, and -Inf as strings. String NAs are
  still serialized as `null`.

- Serialize both datetimes and dates as ISO 8601 in UTC timezone.
