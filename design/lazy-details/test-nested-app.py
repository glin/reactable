import json
import re
import sys
from playwright.sync_api import sync_playwright, expect

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1200, "height": 1100})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3847", wait_until="networkidle")
    log = page.locator("#events")
    expect(log).to_contain_text("Calculations: 0", timeout=30000)
    outer = page.locator("#cars > .ReactTable")
    if outer.count() == 0:
        outer = page.locator("#cars .ReactTable").first
    # Locate direct row expanders through the row's expander cell, excluding nested rows.
    def expander(table, index=0):
        return table.locator(":scope > .rt-table > .rt-tbody > .rt-tr-group > .rt-tr > .rt-td .rt-expander-button").nth(index)
    def count(n):
        expect(log).to_contain_text(re.compile(rf"^Calculations: {n}(?:\n|$)"), timeout=15000)
    expander(outer).click()
    count(1)
    expect(log).to_contain_text("Mazda RX4")
    system = page.locator("#cars .ReactTable").nth(1)
    expect(system).to_be_visible()
    expander(system).click()
    count(2)
    checks = page.locator("#cars .ReactTable").nth(2)
    expander(checks).click()
    count(3)
    expect(page.locator(".check-result")).to_have_text("Checked: Mazda RX4 / Engine / Condition")
    expander(checks, 1).click()
    count(4)
    expander(checks).click()
    count(4)
    expander(checks).click()
    count(5)
    expander(system).click()
    expect(page.locator(".check-result")).to_have_count(0)
    expander(system).click()
    count(6)
    checks = page.locator("#cars .ReactTable").nth(2)
    expander(checks).click()
    count(7)
    expander(outer).click()
    expect(page.locator("#cars .ReactTable")).to_have_count(1)
    expander(outer).click()
    count(8)
    expander(outer, 1).click()
    count(9)
    expect(page.locator("#cars .ReactTable")).to_have_count(3)
    page.locator("#refresh").click()
    expect(page.locator("#cars .ReactTable")).to_have_count(1)
    count(9)
    expander(outer).click()
    count(10)
    assert not errors, errors
    page.screenshot(path="/tmp/reactable-nested-test.png", full_page=True)
    page.locator("#refresh").click()
    expect(page.locator("#cars .ReactTable")).to_have_count(1)
    total = 10
    groups = ":scope > .rt-table > .rt-tbody > .rt-tr-group"
    for car in range(4):
        expander(outer, car).click()
        total += 1
        count(total)
        system = outer.locator(groups).nth(car).locator(".ReactTable").first
        for item in range(3):
            expander(system, item).click()
            total += 1
            count(total)
            checks = system.locator(groups).nth(item).locator(".ReactTable").first
            for check in range(3):
                expander(checks, check).click()
                total += 1
                count(total)
    expect(page.locator(".check-result")).to_have_count(36)
    assert not errors, errors
    for car in range(4):
        expander(outer, car).click()
    expect(page.locator("#cars .ReactTable")).to_have_count(1)
    count(total)
    print(json.dumps({"result": "passed", "calculations": total, "leaf_panels_tested": 36, "browser_errors": errors}, indent=2))
    browser.close()
