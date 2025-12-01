# Convert a reactable widget to HTML tags

This S3 method exists to enable [`reactable()`](reactable.md)'s `static`
rendering option.

## Usage

``` r
# S3 method for class 'reactable'
as.tags(x, standalone = FALSE, ...)
```

## Arguments

- x:

  a [`reactable()`](reactable.md) instance.

- standalone:

  Logical value indicating whether the widget is being rendered in a
  standalone context.

- ...:

  Additional arguments passed to the S3 method.
