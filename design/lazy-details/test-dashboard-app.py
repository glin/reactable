"""Run against dashboard-app.R. Requires Python Playwright and Chromium."""
import json
import sys
import time
from playwright.sync_api import sync_playwright, expect

URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3847"
GROUPS = (":scope > .rt-table > .rt-tbody > .rt-tr-group, "
          ":scope > .rt-table > .rt-tbody > .rt-virtual-spacer > .rt-tr-group")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1512, "height": 1100})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    began = time.perf_counter()
    page.goto(URL, wait_until="networkidle")
    perf = page.locator(".perf-grid")
    expect(perf).to_have_attribute("data-rows", "10000", timeout=60000)
    expect(perf).to_have_attribute("data-accounts-built", "0")
    expect(perf).to_have_attribute("data-markets-built", "0")
    expect(perf).to_have_attribute("data-receipts-built", "0")
    outer = page.locator("#portfolio .ReactTable").first
    expect(outer.locator(".rt-expander-button").first).to_be_attached(timeout=60000)
    ready_seconds = time.perf_counter() - began
    initial_dom_rows = outer.locator(GROUPS).count()
    assert initial_dom_rows < 100, initial_dom_rows

    def expander(table, index=0):
        return table.locator(GROUPS).nth(index).locator(":scope > .rt-tr > .rt-td .rt-expander-button")

    def counts(account, market, receipt, active=None):
        for attr, value in [("accounts", account), ("markets", market), ("receipts", receipt)]:
            expect(perf).to_have_attribute(f"data-{attr}-built", str(value), timeout=20000)
        if active is not None:
            expect(perf).to_have_attribute("data-active-panels", str(active), timeout=15000)

    began = time.perf_counter()
    expander(outer).click()
    dashboard = page.locator(".account-dashboard").first
    expect(dashboard).to_have_attribute("data-account-id", "AC-00001", timeout=20000)
    expect(dashboard.locator(".trend-chart")).to_have_count(1)
    first_dashboard_seconds = time.perf_counter() - began
    counts(1, 0, 0, 1)
    market_table = dashboard.locator(".ReactTable").first
    expander(market_table).click()
    market = page.locator(".market-dashboard").first
    expect(market.locator("h2")).to_have_text("United States")
    counts(1, 1, 0, 2)
    tx_table = market.locator(".ReactTable").first
    expander(tx_table).click()
    expect(page.locator(".receipt")).to_contain_text("Meridian Commerce 0001 / United States")
    counts(1, 1, 1, 3)

    # Scroll the expanded account out of the virtual viewport, then return.
    outer.locator(":scope > .rt-table").evaluate("el => { el.scrollTop = 12000 }")
    page.wait_for_timeout(1200)
    counts(1, 1, 1, 3)
    outer.locator(":scope > .rt-table").evaluate("el => { el.scrollTop = 0 }")
    expect(page.locator(".receipt")).to_be_attached()
    counts(1, 1, 1, 3)

    expander(outer).click()
    expect(page.locator(".account-dashboard")).to_have_count(0)
    counts(1, 1, 1, 0)
    expander(outer).click()
    counts(2, 1, 1, 1)
    expect(page.locator(".market-dashboard")).to_have_count(0)
    expander(outer).click()
    counts(2, 1, 1, 0)

    # Jump to a distant account: thousands of earlier dashboards remain untouched.
    outer.locator(".rt-search").fill("Atlas Systems 9999")
    expect(outer.locator(GROUPS)).to_have_count(1)
    expander(outer).click()
    expect(page.locator(".account-dashboard")).to_have_attribute("data-account-id", "AC-09999")
    counts(3, 1, 1, 1)
    expander(outer).click()
    outer.locator(".rt-search").fill("")

    # Server filtering resets registrations and preserves correct row identities.
    page.locator("#region").select_option("Europe")
    expect(perf).to_have_attribute("data-rows", "2500")
    counts(3, 1, 1, 0)
    expander(outer).click()
    expect(page.locator(".account-dashboard")).to_have_attribute("data-account-id", "AC-00002")
    counts(4, 1, 1, 1)
    page.locator("#refresh").click()
    expect(page.locator(".account-dashboard")).to_have_count(0)
    counts(4, 1, 1, 0)

    page.locator("#region").select_option("All regions")
    expect(perf).to_have_attribute("data-rows", "10000")
    page.locator("#virtual").uncheck()
    expect(outer.locator(".rt-pagination-info")).to_contain_text("10000", timeout=15000)
    expander(outer).click()
    counts(5, 1, 1, 1)
    dashboard = page.locator(".account-dashboard").first
    expander(dashboard.locator(".ReactTable").first).click()
    counts(5, 2, 1, 2)
    page.locator("#benchmark").click()
    expect(page.locator(".comparison")).to_contain_text("50 dashboards calculated", timeout=30000)
    expect(page.locator(".comparison")).to_contain_text("zero dashboards calculated")
    counts(5, 2, 1, 2)
    page.locator("#overview").scroll_into_view_if_needed()
    page.screenshot(path="/tmp/reactable-dashboard-overview.png", full_page=True)
    dashboard.screenshot(path="/tmp/reactable-dashboard-detail.png")
    assert not errors, errors
    print(json.dumps({
        "result": "passed", "rows": 10000, "initial_dom_rows": initial_dom_rows,
        "ready_seconds": round(ready_seconds, 3),
        "first_dashboard_seconds": round(first_dashboard_seconds, 3),
        "account_builds": 5, "market_builds": 2, "receipt_builds": 1,
        "telemetry": perf.inner_text(), "browser_errors": errors,
        "comparison": page.locator(".comparison").inner_text(),
    }, indent=2))
    browser.close()
