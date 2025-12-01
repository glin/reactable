# Internationalization

``` r
reactable(
  iris[1:30, ],
  searchable = TRUE,
  showPageSizeOptions = TRUE,
  language = reactableLang(
    searchPlaceholder = "搜索",
    searchLabel = "搜索",
    noData = "没有匹配结果",
    pageSizeOptions = "显示 {rows}",
    pageInfo = "{rowStart} 至 {rowEnd} 项结果，共 {rows} 项",
    pagePrevious = "上页",
    pageNext = "下页",
    pagePreviousLabel = "",
    pageNextLabel = ""
  )
)
```
