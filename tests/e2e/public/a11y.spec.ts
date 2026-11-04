import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectNoBlockingViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const summary = blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes, e.g. ${v.nodes[0]?.target.join(" ")}`);
  expect(summary, summary.join("\n")).toEqual([]);
}

// /menus renders with no content set up (tiles fall back to the board copy and default photos).
// The two ordering pages need their switches on and an item, so ordering.spec.ts scans those.
const PAGES = ["/", "/menu", "/menus", "/book", "/catering", "/contact", "/gallery", "/calendar", "/admin/login"];

// Colors are identical with reduced motion; scanning without it lets axe sample
// the ticker/marquee mid-transform and report phantom contrast failures.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

/** networkidle never settles when the Google Maps iframe keeps streaming
 *  (contact + home), so give it a bounded chance and scan anyway. */
async function settled(page: Page) {
  await page.waitForLoadState("load");
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
}

for (const path of PAGES) {
  test(`accessibility: ${path} has no serious or critical violations`, async ({ page }) => {
    await page.goto(path);
    await settled(page);
    await expectNoBlockingViolations(page);
  });
}

test("accessibility: home scrolled (banner collapsed, gallery marquee in view)", async ({ page }) => {
  await page.goto("/");
  await settled(page);
  // Scroll in small steps so every scroll-triggered reveal fires, then let animations finish before scanning.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 450) {
    await page.mouse.wheel(0, 450);
    await page.waitForTimeout(350);
  }
  await page.waitForTimeout(2500);
  await expectNoBlockingViolations(page);
});

test("accessibility: mobile menu open", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.locator("#mobile-nav")).toBeVisible();
  await expectNoBlockingViolations(page);
});
