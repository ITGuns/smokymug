import { expect, test } from "@playwright/test";

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
    await page.getByRole("button", { name: "Close menu" }).click();

    const bar = page.locator(".fixed.inset-x-0.bottom-0");
    await expect(bar.getByRole("link", { name: "Book a Table" })).toBeVisible();
    const box = await bar.getByRole("link", { name: "Book a Table" }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
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

  test("booking wizard hides the desktop rail and keeps touch targets large", async ({ page }) => {
    await page.goto("/book");
    await expect(page.locator("aside")).toBeHidden();
    const enabledDay = page.locator("button[aria-pressed]:not([disabled])").first();
    const box = await enabledDay.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(38);
    await enabledDay.click();
    await expect(page.getByRole("heading", { name: "How many guests?" })).toBeVisible();
  });
});
