import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
  test("renders hero, navigation and every section from the database", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/The Smoky Mug \| Texas Craft BBQ/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Smoked low. Brewed slow.");
    await expect(page.getByText("Richmond's Best Texas Craft BBQ + Cafe in Brookland Park!").first()).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const label of ["Menu", "Our Story", "Catering", "Gallery", "Contact"]) await expect(nav.getByRole("link", { name: label })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "Book a Table" })).toBeVisible();
    await expect(page.getByRole("banner")).toContainText("2930 North Avenue");
    await expect(page.getByRole("banner")).toContainText("(804) 562-3722");

    for (const heading of ["Cafe & Craft Barbecue & Tex-Mex Kitchen", "Best authentic wood-fired smokehouse in Richmond.", "Signature plates", "Hours", "Catering & events", "Gallery", "Gift cards & loyalty", "Visit us in Brookland Park."]) {
      const h = page.locator("main").getByRole("heading", { name: heading, exact: true });
      await h.scrollIntoViewIfNeeded();
      await expect(h).toBeVisible();
    }
    await expect(page.getByRole("link", { name: /Hatch Chile Mac n Cheese/ })).toBeVisible();
    await expect(page.locator("footer")).toContainText("Tue–Thu");
    await expect(page.locator("footer").getByRole("link", { name: "Gift Cards" })).toHaveAttribute("href", "https://www.toasttab.com/thesmokymug/giftcards");
    await expect(page.locator("footer").getByRole("link", { name: "Instagram" }).first()).toHaveAttribute("href", "https://www.instagram.com/thesmokymug");
    await expect(page.locator('iframe[title^="Map showing"]')).toBeVisible();
  });

  test("exposes Restaurant structured data and metadata", async ({ page }) => {
    await page.goto("/");
    const json = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(json!);
    expect(data["@type"]).toBe("Restaurant");
    expect(data.telephone).toBe("(804) 562-3722");
    expect(data.address.streetAddress).toBe("2930 North Avenue");
    expect(data.openingHoursSpecification.length).toBe(7);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^http:\/\/localhost:3000\/?$/);
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "The Smoky Mug");
  });

  test("scroll-triggered photo reveals actually reveal (regression)", async ({ page }) => {
    await page.goto("/");
    const intro = page.locator("#story");
    await intro.scrollIntoViewIfNeeded();
    const layer = intro.locator("[style*='clip-path']").first();
    await expect(layer).toHaveAttribute("style", /inset\(0%/, { timeout: 8_000 });
    const story = page.getByRole("heading", { name: "Best authentic wood-fired smokehouse in Richmond." }).locator("xpath=ancestor::section[1]");
    await story.scrollIntoViewIfNeeded();
    await expect(story.locator("img").first()).toBeVisible();
    await expect(story.locator("[style*='clip-path']").first()).toHaveAttribute("style", /inset\(0%/, { timeout: 8_000 });
  });

  test("hero carousel advances and can be controlled", async ({ page }) => {
    await page.goto("/");
    const hero = page.getByRole("region", { name: "Photo carousel" }).first();
    const tabs = hero.getByRole("tab");
    await expect(tabs).toHaveCount(5);
    await tabs.nth(2).click();
    await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
  });

  test("has no critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && !/favicon|404/.test(m.text()) && errors.push(m.text()));
    await page.goto("/");
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });
});
