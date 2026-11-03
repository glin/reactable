"""Run against lifecycle-app.R with Shiny >= 1.7.5 (async HTML dependencies)."""
import asyncio
import json
import sys
from playwright.async_api import async_playwright, expect


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = await browser.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        requested = asyncio.Event()
        release = asyncio.Event()

        async def delay_dependency(route):
            requested.set()
            await release.wait()
            await route.continue_()

        await page.route("**/lazy-review-slow-1.0.0/slow.js", delay_dependency)
        await page.goto(sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3847")
        expander = page.locator("#table .rt-expander-button").first
        await expander.press("Enter")
        await expect(expander).to_have_attribute("aria-expanded", "true")
        await asyncio.wait_for(requested.wait(), 15)
        await page.evaluate("window.closedHost = document.querySelector('[data-reactable-lazy-retained]')")
        await expect(page.locator('[data-reactable-lazy-retained]')).to_have_attribute("aria-busy", "true")
        await expander.click()
        await expect(expander).to_have_attribute("aria-expanded", "false")
        release.set()
        await page.wait_for_function("window.lazyDependencyLoaded === true")
        # Wait for both HTML insertion and the subsequent binding/cleanup turn.
        await page.wait_for_function("closedHost.querySelector('#lazy_input') !== null")
        await page.wait_for_timeout(200)
        assert await page.evaluate("closedHost.querySelectorAll('.shiny-bound-input').length") == 0
        assert await page.evaluate("closedHost.hasAttribute('data-reactable-lazy-retained')") is False
        await expander.click()
        await expect(page.locator('#lazy_input')).to_be_visible()
        await expect(page.locator('[data-reactable-lazy-retained]').first).to_have_attribute("aria-busy", "false")
        await page.locator('#table .ReactTable').nth(1).locator('.rt-expander-button').click()
        await expect(page.locator('.rt-lazy-output').last).to_have_text('child')
        await expander.click()
        await expect(page.locator('#lazy_input')).to_have_count(0)
        # A dependency can also finish while an expanded panel is paged out.
        await page.close()
        page = await browser.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        requested.clear()
        release.clear()
        await page.route("**/lazy-review-slow-1.0.0/slow.js", delay_dependency)
        await page.goto(sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3847")
        await page.locator("#table .rt-expander-button").first.click()
        await asyncio.wait_for(requested.wait(), 15)
        await page.get_by_role("button", name="Next page", exact=True).click()
        release.set()
        await page.wait_for_function("window.lazyDependencyLoaded === true")
        await page.wait_for_timeout(200)
        await page.get_by_role("button", name="Previous page", exact=True).click()
        await expect(page.locator('#table .ReactTable')).to_have_count(2)
        await page.locator('#table .ReactTable').nth(1).locator('.rt-expander-button').click()
        await expect(page.locator('.rt-lazy-output').last).to_have_text('child')
        assert not errors, errors
        print(json.dumps({"result": "passed", "delayed_dependency_cleanup": True, "reopening": True, "offscreen_dependency": True,
                          "browser_errors": errors}, indent=2))
        await browser.close()


asyncio.run(main())
