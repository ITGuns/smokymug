import { expect, test } from "@playwright/test";

test.describe("Menu", () => {
  test("lists categories with real items, prices and modifiers", async ({ page }) => {
    await page.goto("/menu");
    const cats = page.getByRole("navigation", { name: "Menu categories" }).getByRole("button");
    await expect(cats).toHaveText(["Breakfast", "Craft Barbecue", "Sunday Brunch", "Bar & Happy Hour", "Cafe + Drinks"]);

    const burrito = page.locator("button[aria-haspopup='dialog']", { hasText: "Breakfast Burrito" }).first();
    await expect(burrito).toContainText("$6.95");
    await expect(burrito).toContainText("egg + potatoes + cheddar + hatch green chiles + salsa roja");

    await cats.filter({ hasText: "Craft Barbecue" }).click();
    await expect(page.getByRole("heading", { name: "Craft Barbecue", level: 2 })).toBeVisible();
    await expect(page.getByText("Wed–Sat 11:30am–9pm")).toBeVisible();
    const mac = page.locator("button[aria-haspopup='dialog']", { hasText: "Hatch Chile Mac n Cheese" });
    await expect(mac).toContainText("$6.50");
    await expect(mac).toContainText("$11");
    await expect(page.locator("button[aria-haspopup='dialog']", { hasText: "Spare Ribs - 1/2 lb" })).toContainText("Fri & Sat only");
    await expect(page.getByRole("heading", { name: "Meat Market" })).toBeVisible();

    await cats.filter({ hasText: "Bar & Happy Hour" }).click();
    const wine = page.locator("button[aria-haspopup='dialog']", { hasText: "House Red - Vegas Altas Tempranillo" });
    await expect(wine).toContainText("$9");
    await expect(wine).toContainText("$30 btl");
  });

  test("item modal shows modifiers with upcharges and closes with Escape", async ({ page }) => {
    await page.goto("/menu?category=craft-barbecue");
    await page.locator("button[aria-haspopup='dialog']", { hasText: "3 Tacos" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "3 Tacos" })).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Choose Your Fillings" })).toBeVisible();
    await expect(dialog.getByText(/^Pork Belly/)).toBeVisible();
    await expect(dialog.getByText("+$1", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Top It! #1")).toBeVisible();
    await expect(page).toHaveURL(/item=three-tacos/);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page).not.toHaveURL(/item=/);
  });

  test("deep links open the item directly", async ({ page }) => {
    await page.goto("/menu?item=brisket-taco");
    await expect(page.getByRole("dialog").getByRole("heading", { name: "Brisket Taco" })).toBeVisible();
    await expect(page.getByRole("dialog")).toContainText("$12");
  });

  test("search spans every category and filters narrow the results", async ({ page }) => {
    await page.goto("/menu");
    await page.getByRole("searchbox", { name: "Search the menu" }).fill("brisket");
    await expect(page.getByRole("status")).toContainText(/\d+ items for “brisket”/);
    await expect(page.locator("button[aria-haspopup='dialog']", { hasText: "Brisket Sandwich" })).toBeVisible();
    await expect(page.locator("button[aria-haspopup='dialog']", { hasText: "Brisket Benedict" })).toBeVisible();
    await expect(page.locator("button[aria-haspopup='dialog']", { hasText: "Drip Coffee" })).toHaveCount(0);

    await page.getByRole("searchbox", { name: "Search the menu" }).fill("");
    await page.getByRole("button", { name: /^Filters/ }).click();
    await page.getByRole("button", { name: "Vegan", exact: true }).click();
    await expect(page.locator("button[aria-haspopup='dialog']").filter({ has: page.getByRole("heading", { name: "Everything Bagel", exact: true }) })).toBeVisible();
    await expect(page.locator("button[aria-haspopup='dialog']", { hasText: "Breakfast Sandwich" })).toHaveCount(0);
    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(page.locator("button[aria-haspopup='dialog']", { hasText: "Breakfast Sandwich" })).toBeVisible();

    await page.getByRole("searchbox", { name: "Search the menu" }).fill("zzzz-nothing");
    await expect(page.getByRole("status")).toContainText("No items match");
  });
});
