import { expect, test } from "@playwright/test";
import { closePool } from "./helpers/db";
import { cleanupOrdering, holidayWindow, insertOrderItem, resetOrdering, setOrdering } from "./helpers/ordering";

test.describe("Mobile layout", () => {
  test("home: hamburger menu, sticky booking bar, no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    await page.getByRole("button", { name: "Open menu" }).click();
    const mobileNav = page.getByRole("navigation", { name: "Mobile" });
    await expect(mobileNav.getByRole("link", { name: "Catering" })).toBeVisible();
    await expect(page.locator("#mobile-nav")).toContainText("2930 North Avenue");
    const menu = page.locator("#mobile-nav");
    // Measure only after the slide-in finishes; mid-animation boxes read sub-pixel short.
    await expect
      .poll(() => menu.evaluate((el) => getComputedStyle(el).transform))
      .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    await expect(menu.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://www.instagram.com/thesmokymug");
    await expect(menu.getByRole("link", { name: "Facebook" })).toHaveAttribute("href", "https://www.facebook.com/thesmokymug");
    await expect(menu.getByRole("link", { name: /^Email / })).toHaveAttribute("href", "mailto:thesmokymug@gmail.com");
    // L3-3: the top utility strip is the only phone in the header, so the drawer has none.
    await expect(menu.locator('a[href^="tel:"]')).toHaveCount(0);
    await expect(page.locator("header").locator('a[href^="tel:"]:visible')).toHaveCount(1);
    for (const name of ["Instagram", "Facebook", /^Email /]) {
      const box = await menu.getByRole("link", { name }).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await expect(page.locator("main")).toHaveAttribute("inert", "");
    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-nav")).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
    await expect(page.locator("main")).not.toHaveAttribute("inert");

    const bar = page.locator(".fixed.inset-x-0.bottom-0");
    await expect(bar.getByRole("link", { name: "Book a Table" })).toBeVisible();
    const box = await bar.getByRole("link", { name: "Book a Table" }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test("open menu covers the page (inert), and same-page links or rotating to desktop close it", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("#mobile-nav");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(nav).toBeVisible();
    await expect(page.locator("main")).toHaveAttribute("inert", "");
    await expect(page.locator("body > footer")).toHaveAttribute("inert", "");
    await expect(page.locator(".fixed.inset-x-0.bottom-0").first()).toHaveAttribute("inert", "");

    // A link to the current page doesn't change the pathname but must still close the menu.
    await nav.getByRole("link", { name: "Our Story" }).click();
    await expect(nav).toHaveCount(0);
    await expect(page.locator("main")).not.toHaveAttribute("inert");

    // Rotating a tablet past the lg breakpoint hides the menu; the page must not stay inert.
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(nav).toBeVisible();
    await page.setViewportSize({ width: 1180, height: 820 });
    await expect(nav).toHaveCount(0);
    await expect(page.locator("main")).not.toHaveAttribute("inert");
    await expect(page.locator("body > footer")).not.toHaveAttribute("inert");
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
  });

  test("menu: category chips scroll, sections collapse, cards stack", async ({ page }) => {
    await page.goto("/menu");
    const nav = page.getByRole("navigation", { name: "Menu categories" });
    const scrollable = await nav.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(scrollable).toBe(true);
    const toggle = page.getByRole("button", { name: "Hide" }).first();
    await toggle.click();
    await expect(page.getByRole("button", { name: "Show" }).first()).toBeVisible();
    const card = page.locator("button[aria-haspopup='dialog']").first();
    const width = (await card.boundingBox())!.width;
    expect(width).toBeGreaterThan(300);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test("drawer Menus: All menus + live ordering pages above the display menus, one Menus entry (phase 2)", async ({ page }) => {
    const openMenus = async () => {
      await page.getByRole("button", { name: "Open menu" }).click();
      const drawer = page.locator("#mobile-nav");
      await expect(drawer).toBeVisible();
      await drawer.getByRole("button", { name: "Menus" }).click();
      return drawer;
    };
    try {
      await page.goto("/");
      let drawer = await openMenus();
      // Both switches off: no ordering pages listed, the display menus are still there (B3)
      await expect(drawer.getByRole("link", { name: "All menus" })).toHaveAttribute("href", "/menus");
      await expect(drawer.getByRole("link", { name: "Full menu" })).toHaveAttribute("href", "/menu");
      await expect(drawer.locator('a[href^="/menu?category="]').first()).toBeVisible();
      await expect(drawer.getByRole("link", { name: "Express Catering" })).toHaveCount(0);
      await expect(drawer.getByRole("link", { name: "Holiday Preorder" })).toHaveCount(0);
      await expect(drawer.locator('a[href="/menus"]')).toHaveCount(1);
      await expect(drawer.getByRole("link", { name: "Order Now" })).toHaveAttribute("href", "/menu");

      const win = holidayWindow();
      await insertOrderItem("express", "Drawer Pack");
      await insertOrderItem("holiday", "Drawer Turkey");
      await setOrdering({ express_enabled: true, holiday_enabled: true, holiday_pickup_from: win.from, holiday_pickup_to: win.to });
      await page.goto("/");
      drawer = await openMenus();
      await expect(drawer.getByRole("link", { name: "Express Catering" })).toHaveAttribute("href", "/menus/express-catering");
      await expect(drawer.getByRole("link", { name: "Holiday Preorder" })).toHaveAttribute("href", "/menus/holiday-preorders");
      const order = await drawer.locator("ul a").evaluateAll((els) => els.slice(0, 4).map((e) => e.textContent?.trim()));
      expect(order).toEqual(["All menus", "Express Catering", "Holiday Preorder", "Full menu"]);
    } finally {
      await resetOrdering();
      await cleanupOrdering();
      await closePool();
    }
  });

  test("booking wizard hides the desktop rail and keeps touch targets large", async ({ page }) => {
    await page.goto("/book");
    await expect(page.locator("aside")).toBeHidden();
    // Scoped to main: the header's animation pause toggle is also a button[aria-pressed]
    const enabledDay = page.locator("main button[aria-pressed]:not([disabled])").first();
    const box = await enabledDay.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(38);
    await enabledDay.click();
    await expect(page.getByRole("heading", { name: "How many guests?" })).toBeVisible();
  });
});
