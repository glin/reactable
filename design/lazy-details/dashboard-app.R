library(shiny)
library(reactable)

if (!"lazyDetails" %in% names(formals(reactable))) {
  stop("Install reactable from this checkout before running this app.")
}

# Deterministic synthetic data: no network calls, external assets, or chart packages.
n <- 10000L
i <- seq_len(n)
regions <- c("North America", "Europe", "Asia Pacific", "Latin America")
accounts <- data.frame(
  id = sprintf("AC-%05d", i),
  account = paste(rep(c("Meridian", "Nova", "Aster", "Summit", "Vertex", "Orbit", "Atlas", "Lumen"), length.out = n),
    rep(c("Commerce", "Labs", "Collective", "Systems", "Studio", "Works", "Group"), each = 8, length.out = n),
    sprintf("%04d", i)),
  region = rep(regions, length.out = n),
  segment = rep(c("Enterprise", "Growth", "Scale"), length.out = n),
  revenue = round(18000 + (i * 7919 %% 940000) + 8000 * sin(i)),
  growth = round(0.04 + 0.19 * sin(i * 0.71), 3),
  health = round(68 + 30 * abs(sin(i * 0.17))),
  status = ifelse(i %% 13 == 0, "Needs attention", ifelse(i %% 5 == 0, "Accelerating", "Healthy"))
)
money <- function(x) paste0("$", format(round(x), big.mark = ",", scientific = FALSE, trim = TRUE))
compact <- function(x) {
  if (x >= 1e9) sprintf("$%.2fB", x / 1e9) else if (x >= 1e6) sprintf("$%.1fM", x / 1e6)
  else if (x >= 1e3) sprintf("$%.1fK", x / 1e3) else money(x)
}
percent <- function(x) sprintf("%+.1f%%", 100 * x)
markets <- c("United States", "United Kingdom", "Germany", "Canada", "Japan", "France",
  "Australia", "Netherlands", "Brazil", "Singapore", "Sweden", "Mexico")

series <- function(seed, scale = 1) {
  day <- seq_len(180)
  scale * pmax(50, 120 + day * (0.28 + abs(sin(seed)) * 0.6) +
    28 * sin(day / 8 + seed) + 15 * cos(day / 3.3 + seed / 2))
}

line_chart <- function(y, label, color = "#6ee7c8", comparison = NULL) {
  w <- 680; h <- 220; left <- 44; right <- 16; top <- 18; bottom <- 32
  hi <- max(c(y, comparison)) * 1.12
  xs <- seq(left, w - right, length.out = length(y))
  ys <- h - bottom - y / hi * (h - top - bottom)
  path <- paste(sprintf("%.1f,%.1f", xs, ys), collapse = " ")
  grid <- paste(vapply(seq(0, hi, length.out = 5), function(v) {
    pos <- h - bottom - v / hi * (h - top - bottom)
    sprintf('<line x1="44" x2="664" y1="%.1f" y2="%.1f" stroke="#263446"/><text x="36" y="%.1f" text-anchor="end" fill="#8c9aaf" font-size="10">%s</text>',
      pos, pos, pos + 4, compact(v))
  }, character(1)), collapse = "")
  previous <- if (!is.null(comparison)) sprintf(
    '<polyline points="%s" fill="none" stroke="#72829c" stroke-width="2" stroke-dasharray="5 5"/>',
    paste(sprintf("%.1f,%.1f", xs, h - bottom - comparison / hi * (h - top - bottom)), collapse = " ")) else ""
  dots <- paste(vapply(seq(1, length(y), by = 7), function(k) sprintf(
    '<circle cx="%.1f" cy="%.1f" r="5" fill="transparent"><title>Day %s: %s</title></circle>',
    xs[k], ys[k], k, money(y[k])), character(1)), collapse = "")
  HTML(sprintf(paste0('<svg class="trend-chart" viewBox="0 0 680 220" role="img" aria-label="%s">',
    '%s<polygon points="44,188 %s 664,188" fill="%s" opacity="0.08"/>%s',
    '<polyline points="%s" fill="none" stroke="%s" stroke-width="3" stroke-linejoin="round"/>%s',
    '<text x="44" y="212" fill="#8c9aaf" font-size="11">180 days ago</text>',
    '<text x="664" y="212" text-anchor="end" fill="#8c9aaf" font-size="11">Today</text></svg>'),
    htmltools::htmlEscape(label, attribute = TRUE), grid, path, color, previous, path, color, dots))
}

kpi <- function(label, value, caption, accent = "") {
  div(class = paste("kpi", accent), span(class = "eyebrow", label), strong(value), span(class = "kpi-caption", caption))
}
bars <- function(values, labels, color = "#aaa0ff") {
  div(class = "bar-list", lapply(seq_along(values), function(k) {
    div(class = "bar-row", div(class = "bar-label", span(labels[k]), strong(money(values[k]))),
      div(class = "bar-track", div(class = "bar-fill", style = sprintf("width:%.1f%%;background:%s", 100 * values[k] / max(values), color))))
  }))
}
panel <- function(title, subtitle, ..., class = "") {
  div(class = paste("chart-panel", class), div(class = "panel-heading", h4(title), span(subtitle)), ...)
}

table_theme <- reactableTheme(
  color = "#dce5f2", backgroundColor = "#111c2b", borderColor = "#273448", highlightColor = "#1a2b3d",
  cellPadding = "13px 16px", headerStyle = list(background = "#172335", color = "#9baac0", fontSize = "11px",
    textTransform = "uppercase", letterSpacing = "0.08em", fontWeight = 600),
  searchInputStyle = list(background = "#0e1826", color = "#dce5f2", border = "1px solid #334359"),
  pageButtonStyle = list(color = "#a9b8cd"), pageButtonCurrentStyle = list(background = "#243e49", color = "#6ee7c8"),
  style = list(fontFamily = "inherit", fontSize = "13px")
)

dashboard_benchmark <- function(build, data = accounts[seq_len(50), ]) {
  measure <- function(lazy) {
    calculated <- 0L
    start <- proc.time()[["elapsed"]]
    widget <- reactable(data, theme = table_theme, lazyDetails = lazy, details = function(index) {
      calculated <<- calculated + 1L
      # Benchmark serialization only: capture identical HTML in both modes.
      # These samples are never displayed, so nested lazy registrations are not
      # mounted inside an eager parent (an unsupported live configuration).
      htmltools::HTML(as.character(build(data[index, ], index)))
    })
    bytes <- nchar(reactable:::toJSON(widget$x), type = "bytes")
    list(seconds = unname(proc.time()[["elapsed"]] - start), bytes = bytes, dashboards = calculated)
  }
  lazy <- measure(TRUE)
  eager <- measure(FALSE)
  list(sample_rows = nrow(data), lazy = lazy, eager = eager, payload_ratio = eager$bytes / lazy$bytes,
    note = "Measured on 50 identical accounts; market and receipt descendants remain lazy in both cases. Not a measured 10,000-row eager run.")
}

css <- "
:root{color-scheme:dark}body{margin:0;background:#0b1320;color:#dce5f2;font-family:Inter,system-ui,-apple-system,sans-serif}
*{box-sizing:border-box}a{color:inherit}.container-fluid{padding:0}.shell{display:grid;grid-template-columns:210px minmax(0,1fr);min-height:100vh}
.sidebar{background:#0e1826;border-right:1px solid #243044;padding:32px 22px}.brand{font-size:23px;letter-spacing:4px;font-weight:750;color:#6ee7c8}
.brand-sub{font-size:10px;letter-spacing:2px;color:#7e90a9;margin:8px 0 46px}.nav-item{display:block;text-decoration:none;padding:12px 14px;margin:5px 0;color:#9aaac0;border-radius:8px}
.nav-item:hover,.nav-item.active{background:#1b343b;color:#6ee7c8;text-decoration:none}.sidebar-note{font-size:12px;color:#8595aa;line-height:1.8;margin-top:50px}
.main{padding:30px 38px;max-width:1900px;width:100%}.topbar{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #243044;padding-bottom:22px;margin-bottom:28px}
.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:1.6px;color:#8f9eb3}.pill{display:inline-block;padding:5px 10px;border:1px solid #375649;border-radius:30px;color:#6ee7c8;font-size:11px;background:#142d28}
.page-heading{display:flex;justify-content:space-between;gap:20px;align-items:center;margin-bottom:25px}h1{font-size:32px;font-weight:650;letter-spacing:-1px;margin:7px 0 10px}h2{font-size:21px;margin:0 0 8px}h3{font-size:17px;margin:0}h4{font-size:14px;margin:0}h5{font-size:14px;color:#6ee7c8;margin:0 0 12px}.muted{color:#93a2b8;font-size:13px;line-height:1.7}
.kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-bottom:22px}.kpi{border:1px solid #273448;border-radius:11px;padding:20px;background:#111e2e;display:flex;flex-direction:column;gap:10px}.kpi strong{font-size:28px;font-weight:650;letter-spacing:-1px}.kpi-caption{font-size:11px;color:#8e9db3}.kpi.mint strong{color:#6ee7c8}.kpi.violet strong{color:#b4a5ff}
.charts-grid{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(260px,1fr);gap:18px;margin-bottom:20px}.chart-panel{background:#111c2b;border:1px solid #273448;border-radius:11px;padding:21px;min-width:0}.panel-heading{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:20px}.panel-heading>span{font-size:11px;color:#8f9eb3}.trend-chart{width:100%;height:auto;display:block}.legend{display:flex;gap:18px;font-size:11px;color:#9aaac0;margin-top:8px}.legend span::before{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:#6ee7c8;margin-right:6px}.legend span+span::before{background:#72829c}
.bar-row{margin:18px 0}.bar-label{display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;color:#a9b7ca}.bar-label strong{color:#dce5f2;font-weight:500}.bar-track{height:6px;background:#243044;border-radius:10px;overflow:hidden}.bar-fill{height:6px;border-radius:10px}.section-heading{display:flex;justify-content:space-between;align-items:center;margin:26px 0 15px}.table-card{border:1px solid #273448;border-radius:11px;overflow:hidden;background:#111c2b}.toolbar{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:18px 20px;border-bottom:1px solid #273448}.controls{display:flex;align-items:center;gap:18px}.form-group,.checkbox{margin:0}.checkbox label{font-size:12px;color:#a4b3c8}.form-control{background:#172335;color:#dce5f2;border-color:#334359}.btn-default{background:#1c3440;border:1px solid #355564;color:#a7f0dc;border-radius:7px;padding:9px 15px}.btn-default:hover{background:#2a4d58;color:white;border-color:#6ee7c8}
.rt-tr-details{padding:0!important}.account-dashboard,.market-dashboard{padding:25px;background:#0d1725;border-left:3px solid #6ee7c8}.market-dashboard{background:#111a2a;border-color:#b4a5ff}.dashboard-title{display:flex;align-items:start;justify-content:space-between;gap:15px;margin-bottom:20px}.dashboard-title .eyebrow{display:block;margin-bottom:7px}.account-dashboard .kpi strong,.market-dashboard .kpi strong{font-size:23px}.account-dashboard .kpi,.market-dashboard .kpi{padding:16px}.insight{padding:16px;background:#17302e;color:#b2dfd4;border:1px solid #2d5149;border-radius:8px;font-size:12px;line-height:1.8;margin-bottom:20px}.receipt{padding:22px;background:#182337;border-left:3px solid #f5bc7b}.receipt-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.receipt-grid strong{display:block;margin-top:7px}.status{display:inline-block;border-radius:30px;padding:4px 9px;font-size:10px;background:#183a31;color:#8be8c2}.status.warn{background:#3b2d21;color:#f5bc7b}.status.fast{background:#2b2645;color:#bdadff}.account-name{font-weight:600;color:#e7edf7}.account-id{display:block;font-size:10px;color:#7e90a9;margin-top:3px}.health-meter{display:flex;align-items:center;gap:9px}.health-track{display:inline-block;width:65px;background:#263448;border-radius:5px;height:4px}.health-fill{display:block;background:#6ee7c8;height:4px;border-radius:5px}
.performance{margin-top:24px}.perf-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.perf-stat{padding:17px;border:1px solid #2b4150;border-radius:9px;background:#101f2c}.perf-stat strong{font-size:22px;color:#6ee7c8;display:block;margin:7px 0}.perf-stat span{font-size:11px;color:#98a9be}.event-list{margin-top:15px;max-height:220px;overflow:auto;font-family:monospace;font-size:11px}.event-line{display:grid;grid-template-columns:90px 1fr 80px;gap:15px;border-top:1px solid #223347;padding:10px;color:#8fa5b9}.event-line strong{color:#c4d8e7;font-weight:400}.empty-log{padding:16px;color:#7f9ab0;font-size:12px}.footer{font-size:11px;color:#75859d;padding:25px 0}.rt-search{margin:14px 18px!important}.rt-pagination{padding:12px}.rt-expander:after{border-top-color:#6ee7c8!important}.rt-details-loading{padding:24px;color:#6ee7c8}
.comparison{margin-top:16px;background:#172537;padding:20px;border:1px solid #32475e;border-radius:10px}.comparison-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin:16px 0}.comparison-grid strong{display:block;font-size:25px;color:#b4a5ff;margin:7px 0}.comparison-grid span{color:#8fa5b9;font-size:12px}
.main .btn-default{background:#1c3440;border:1px solid #355564;color:#a7f0dc}.main .btn-default:hover{background:#2a4d58;color:white;border-color:#6ee7c8}
@media(max-width:1100px){.shell{grid-template-columns:1fr}.sidebar{display:none}.main{padding:20px}.charts-grid{grid-template-columns:1fr}.kpi-grid,.perf-grid{grid-template-columns:repeat(2,1fr)}.page-heading,.toolbar{flex-wrap:wrap}.receipt-grid{grid-template-columns:1fr}}
"

ui <- fluidPage(tags$head(tags$style(HTML(css))),
  div(class = "shell",
    tags$aside(class = "sidebar", div(class = "brand", "ATLAS"), div(class = "brand-sub", "PORTFOLIO INTELLIGENCE"),
      a(class = "nav-item active", href = "#overview", "◈  Overview"),
      a(class = "nav-item", href = "#directory", "▤  Account directory"),
      a(class = "nav-item", href = "#performance", "↗  Live performance"),
      div(class = "sidebar-note", span(class = "pill", "10,000 accounts"), br(), br(),
        "Explore the portfolio.", br(), "Open an account.", br(), "Follow the story deeper.")),
    tags$main(class = "main",
      div(class = "topbar", span(class = "eyebrow", "Workspace / Revenue operations"), span(class = "pill", "●  Synthetic data · live Shiny")),
      div(id = "overview", class = "page-heading",
        div(span(class = "eyebrow", "THE BIG PICTURE"), h1("A portfolio of possibilities."),
          p(class = "muted", "10,000 accounts. 120,000 market dashboards. 3.6 million transaction receipts. Explore one at a time.")),
        actionButton("refresh", "↻  Refresh portfolio")),
      div(class = "kpi-grid",
        kpi("Portfolio revenue", compact(sum(accounts$revenue)), "Trailing 180 days", "mint"),
        kpi("Accounts", "10,000", "Four regions · three segments"),
        kpi("Average health", sprintf("%.0f / 100", mean(accounts$health)), "Customer success index"),
        kpi("Dashboards built at startup", "0", "Only opened details are calculated", "violet")),
      div(class = "charts-grid",
        panel("Portfolio momentum", "180-day revenue", line_chart(series(8, 38000), "Portfolio revenue trend")),
        panel("Regional contribution", "Trailing revenue", bars(tapply(accounts$revenue, accounts$region, sum),
          names(tapply(accounts$revenue, accounts$region, sum))))),
      div(id = "directory", class = "section-heading", h3("Account directory"), span(class = "muted", "Open any row to reveal its dashboard")),
      div(class = "table-card",
        div(class = "toolbar", div(class = "controls", selectInput("region", NULL, c("All regions", regions), width = "180px", selectize = FALSE),
          checkboxInput("virtual", "Virtual scrolling", TRUE)), span(class = "pill", "Three levels of lazy details")),
        reactableOutput("portfolio")),
      div(id = "performance", class = "performance", div(class = "section-heading", h3("The work behind the view"),
        actionButton("benchmark", "Compare eager vs lazy · 50 rows")), uiOutput("telemetry"), uiOutput("comparison"), uiOutput("eventLog")),
      div(class = "footer", "ATLAS / Demonstration data. Dashboard charts are generated in R when opened; no external services or chart packages.")
    )
  )
)

server <- function(input, output, session) {
  stats <- reactiveVal(list(account = 0L, market = 0L, receipt = 0L, durations = numeric(), history = list()))
  initial <- reactiveVal(list(ms = 0, bytes = 0, rows = 0))
  comparison <- reactiveVal(NULL)
  timed <- function(kind, identity, build) {
    start <- proc.time()[["elapsed"]]
    content <- build()
    ms <- 1000 * (proc.time()[["elapsed"]] - start)
    s <- isolate(stats())
    s[[kind]] <- s[[kind]] + 1L
    if (kind == "account") s$durations <- c(s$durations, ms)
    s$history <- tail(c(s$history, list(list(kind = kind, identity = identity, ms = ms))), 30)
    stats(s)
    content
  }

  receipt <- function(account, market, tx) timed("receipt", tx$transaction, function() {
    div(class = "receipt", h5(paste("Transaction", tx$transaction)),
      div(class = "receipt-grid",
        div(span(class = "eyebrow", "Account / market"), strong(paste(account$account, market, sep = " / "))),
        div(span(class = "eyebrow", "Settlement"), strong(paste(money(tx$amount), "·", tx$method))),
        div(span(class = "eyebrow", "Audit trail"), strong(paste("Approved → Captured →", tx$status)))),
      p(class = "muted", "Synthetic receipt calculated on demand. Close and reopen to generate a fresh snapshot."))
  })

  market_dashboard <- function(account, market, seed, revenue) timed("market", paste(account$id, market, sep = " / "), function() {
    y <- series(seed, revenue / sum(series(seed)))
    tx <- data.frame(transaction = sprintf("%s-M%02d-T%03d", account$id, (seed - 1) %% 12 + 1, seq_len(30)),
      date = as.character(as.Date("2026-09-15") - seq_len(30)),
      amount = round(revenue / 90 * (0.5 + abs(sin(seq_len(30) + seed))), 2),
      method = rep(c("Card", "Bank transfer", "Wallet"), length.out = 30),
      status = rep(c("Settled", "Settled", "Settled", "Pending"), length.out = 30))
    div(class = "market-dashboard", div(class = "dashboard-title", div(span(class = "eyebrow", "MARKET DEEP DIVE"),
      h2(market), span(class = "muted", account$account)), span(class = "pill", "Level 2 / Market")),
      div(class = "kpi-grid", kpi("Revenue", money(revenue), "180-day market total", "mint"),
        kpi("Conversion", sprintf("%.1f%%", 2.6 + abs(sin(seed)) * 2.1), "Sessions to purchase"),
        kpi("Average order", money(mean(tx$amount)), "Sample of 30 transactions"),
        kpi("Settlement rate", "97.8%", "Last 30 days", "violet")),
      div(class = "charts-grid", panel("Market revenue", "Daily · 180 days", line_chart(y, paste(market, "revenue"), "#b4a5ff")),
        panel("Payment mix", "Revenue by payment method", bars(tapply(tx$amount, tx$method, sum), names(tapply(tx$amount, tx$method, sum)), "#f5bc7b"))),
      div(class = "section-heading", h4("Transaction ledger"), span(class = "muted", "Expand a transaction for its receipt")),
      reactable(tx, lazyDetails = TRUE, defaultPageSize = 5, theme = table_theme,
        columns = list(transaction = colDef(name = "Transaction", minWidth = 190), date = colDef(name = "Date"),
          amount = colDef(name = "Amount", format = colFormat(currency = "USD", digits = 2)),
          method = colDef(name = "Method"), status = colDef(name = "Status")),
        details = function(index) receipt(account, market, tx[index, ])))
  })

  account_dashboard <- function(account, seed) timed("account", account$id, function() {
    y <- series(seed, account$revenue / sum(series(seed)))
    mix <- 0.4 + abs(sin(seq_along(markets) * seed * 0.1))
    market_data <- data.frame(market = markets, revenue = round(account$revenue * mix / sum(mix)),
      growth = round(0.05 + 0.2 * sin(seed + seq_along(markets)), 3),
      orders = round(300 + 900 * abs(cos(seed + seq_along(markets)))),
      conversion = round(0.025 + 0.02 * abs(sin(seed + seq_along(markets))), 3))
    div(class = "account-dashboard", `data-account-id` = account$id,
      div(class = "dashboard-title", div(span(class = "eyebrow", paste(account$id, " / ", account$region)),
        h2(account$account), span(class = "muted", paste(account$segment, "account · Revenue intelligence"))),
        span(class = "pill", "Level 1 / Account")),
      div(class = "kpi-grid", kpi("Account revenue", money(account$revenue), "Trailing 180 days", "mint"),
        kpi("Revenue growth", percent(account$growth), "Compared with previous period"),
        kpi("Active markets", "12", "Each contains a separate dashboard"),
        kpi("Account health", paste(account$health, "/ 100"), account$status, "violet")),
      div(class = "charts-grid", panel("Revenue trajectory", "Daily performance", line_chart(y, paste(account$account, "revenue"),
        comparison = y * (0.78 + 0.08 * cos(seq_along(y) / 30))),
        div(class = "legend", span("Current period"), span("Previous period · synthetic"))),
        panel("Acquisition channels", "Revenue attribution", bars(account$revenue * c(0.38, 0.27, 0.21, 0.14),
          c("Organic search", "Direct", "Partner network", "Paid campaigns")))),
      div(class = "insight", strong("Portfolio signal / "), sprintf(
        "%s contributes %s across 12 markets. %s leads this account's revenue mix. Open a market below to explore its trend, payment mix, and transaction receipts.",
        account$account, money(account$revenue), market_data$market[which.max(market_data$revenue)])),
      div(class = "section-heading", h4("Market performance"), span(class = "muted", "12 markets · dashboards calculated on expansion")),
      reactable(market_data, lazyDetails = TRUE, defaultPageSize = 6, theme = table_theme, highlight = TRUE,
        columns = list(market = colDef(name = "Market", minWidth = 160), revenue = colDef(name = "Revenue", format = colFormat(currency = "USD", digits = 0)),
          growth = colDef(name = "Growth", format = colFormat(percent = TRUE, digits = 1)), orders = colDef(name = "Orders", format = colFormat(separators = TRUE)),
          conversion = colDef(name = "Conversion", format = colFormat(percent = TRUE, digits = 1))),
        details = function(index) market_dashboard(account, market_data$market[index], seed * 12 + index, market_data$revenue[index])))
  })

  output$portfolio <- renderReactable({
    input$refresh
    data <- accounts
    if (input$region != "All regions") data <- data[data$region == input$region, ]
    virtual <- isTRUE(input$virtual)
    start <- proc.time()[["elapsed"]]
    widget <- reactable(data, lazyDetails = TRUE, searchable = TRUE, highlight = TRUE, theme = table_theme,
      virtual = virtual, pagination = !virtual, height = if (virtual) 640 else NULL, defaultPageSize = 10,
      columns = list(
        id = colDef(show = FALSE),
        account = colDef(name = "Account", minWidth = 220, html = TRUE, cell = JS(
          "function(info) { return '<span class=\"account-name\">' + info.value + '</span><span class=\"account-id\">' + info.row.id + '</span>'; }")),
        region = colDef(name = "Region", minWidth = 140), segment = colDef(name = "Segment"),
        revenue = colDef(name = "Revenue", format = colFormat(currency = "USD", digits = 0), minWidth = 115),
        growth = colDef(name = "Growth", format = colFormat(percent = TRUE, digits = 1)),
        health = colDef(name = "Health", html = TRUE, cell = JS(
          "function(info) { return '<span class=\"health-meter\">' + info.value + '<span class=\"health-track\"><span class=\"health-fill\" style=\"width:' + info.value + '%\"></span></span></span>'; }")),
        status = colDef(name = "Status", minWidth = 135, html = TRUE, cell = JS(
          "function(info) { var cls = info.value === 'Needs attention' ? 'warn' : info.value === 'Accelerating' ? 'fast' : ''; return '<span class=\"status ' + cls + '\">' + info.value + '</span>'; }"))),
      details = function(index) {
        account <- data[index, ]
        account_dashboard(account, as.integer(sub("AC-", "", account$id)))
      })
    bytes <- nchar(reactable:::toJSON(widget$x), type = "bytes")
    initial(list(ms = 1000 * (proc.time()[["elapsed"]] - start), bytes = bytes, rows = nrow(data)))
    widget
  })

  output$telemetry <- renderUI({
    invalidateLater(1000, session)
    s <- stats(); init <- initial()
    registry <- session$userData$reactableLazyDetails
    active <- if (is.null(registry)) 0L else sum(vapply(ls(registry$tables), function(id) length(ls(registry$tables[[id]]$panels)), integer(1)))
    average <- if (length(s$durations)) sprintf("%.0f ms", mean(s$durations)) else "—"
    div(class = "perf-grid", `data-rows` = init$rows, `data-accounts-built` = s$account,
      `data-markets-built` = s$market, `data-receipts-built` = s$receipt, `data-active-panels` = active,
      div(class = "perf-stat", span("Initial table build + serialization"), strong(sprintf("%.0f ms", init$ms)),
        span(sprintf("%s rows · %.2f MB widget JSON", format(init$rows, big.mark = ","), init$bytes / 1e6))),
      div(class = "perf-stat", span("Account dashboards calculated"), strong(paste(s$account, "/", format(init$rows, big.mark = ","))),
        span(paste("Average observed build:", average))),
      div(class = "perf-stat", span("Deeper details calculated"), strong(paste(s$market, "markets /", s$receipt, "receipts")),
        span("Unopened descendants do no dashboard work")),
      div(class = "perf-stat", span("Currently retained panels"), strong(active), span("Collapse a parent to release its descendants")))
  })
  output$eventLog <- renderUI({
    history <- stats()$history
    if (!length(history)) return(div(class = "empty-log", "No detail callbacks have run. Your portfolio is ready to explore."))
    div(class = "event-list", lapply(rev(history), function(event) {
      div(class = "event-line", span(toupper(event$kind)), strong(event$identity), span(sprintf("%.0f ms", event$ms)))
    }))
  })
  run_benchmark <- function() {
    saved <- isolate(stats())
    registry <- session$userData$reactableLazyDetails
    existing <- if (is.null(registry)) character() else ls(registry$tables)
    on.exit({
      stats(saved)
      registry <- session$userData$reactableLazyDetails
      if (!is.null(registry)) {
        for (id in setdiff(ls(registry$tables), existing)) reactable:::destroyLazyTable(registry, id)
      }
    }, add = TRUE)
    dashboard_benchmark(account_dashboard)
  }
  observeEvent(input$benchmark, { comparison(run_benchmark()) })
  output$comparison <- renderUI({
    result <- comparison()
    if (is.null(result)) return(NULL)
    div(class = "comparison", h4("Same 50 accounts. Same dashboard content."),
      div(class = "comparison-grid",
        div(span("Eager build + serialization"), strong(sprintf("%.0f ms", 1000 * result$eager$seconds)),
          span(sprintf("%.1f KB · %s dashboards calculated", result$eager$bytes / 1000, result$eager$dashboards))),
        div(span("Lazy build + serialization"), strong(sprintf("%.0f ms", 1000 * result$lazy$seconds)),
          span(sprintf("%.1f KB · zero dashboards calculated", result$lazy$bytes / 1000))),
        div(span("Reduction in initial widget JSON"), strong(sprintf("%.0f×", result$payload_ratio)), span("Measured in this session"))),
      p(class = "muted", "Market and receipt descendants remain lazy in both cases. This is a 50-row sample, not an eager 10,000-row benchmark. Sample callbacks are excluded from the exploration counters."))
  })
}

shinyApp(ui, server)
