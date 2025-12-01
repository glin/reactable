# Sticky Selection Column

### Using inline styles

``` r
reactable(
  MASS::Cars93,
  selection = "multiple",
  columns = list(
    .selection = colDef(
      style = list(position = "sticky", left = 0, background = "#fff", zIndex = 1),
      headerStyle = list(position = "sticky", left = 0, background = "#fff", zIndex = 1),
      width = 45
    ),
    Manufacturer = colDef(
      style = list(position = "sticky", left = 45, background = "#fff", zIndex = 1),
      headerStyle = list(position = "sticky", left = 45, background = "#fff", zIndex = 1)
    )
  ),
  onClick = "select",
  wrap = FALSE
)
```

### Using CSS

``` r
reactable(
  MASS::Cars93,
  selection = "multiple",
  columns = list(
    .selection = colDef(
      class = "sticky left-col-1",
      headerClass = "sticky left-col-1",
      width = 45
    ),
    Manufacturer = colDef(
      class = "sticky left-col-2",
      headerClass = "sticky left-col-2"
    ),
    Model = colDef(
      class = "sticky left-col-3",
      headerClass = "sticky left-col-3"
    )
  ),
  onClick = "select",
  wrap = FALSE
)
```

``` css
.sticky {
  position: sticky !important;
  background: #fff;
  z-index: 1;
}

.left-col-1 {
  left: 0;
}

.left-col-2 {
  left: 45px;
}

.left-col-3 {
  left: 145px;
  border-right: 1px solid #eee !important;
}
```
