import { expect, test } from "@playwright/test";
import { cleanupAll, closePool, QA, query } from "../helpers/db";
import { expectToast, gotoReady } from "../helpers/ui";

test.describe("Admin menu CMS", () => {
  test.beforeAll(cleanupAll);
  test.afterAll(async () => {
    await cleanupAll();
    await closePool();
  });

  test("item create → publish → edit price → hide → duplicate → delete", async ({ page, browser }) => {
    const name = `${QA.prefix}Test Plate`;
    await gotoReady(page, "/admin/menu?new=1");
    const drawer = page.getByRole("dialog", { name: "New menu item" });
    await drawer.getByLabel("Item name").fill(name);
    await drawer.getByLabel("Description").fill("temporary QA item");
    await drawer.getByLabel("Base price ($)").fill("12.5");
    await drawer.getByLabel("Category / section").selectOption({ label: "Breakfast Grill" });
    await drawer.getByRole("checkbox", { name: /Vegetarian \(V\)/ }).check();
    await drawer.getByRole("checkbox", { name: /Add to any grill item/ }).check();
    await drawer.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("status")).toContainText("Item created");
    const row = page.locator("main").getByText(name, { exact: true });
    await expect(row).toBeVisible();

    // Public site reflects it immediately
    const pub = await browser.newPage();
    await pub.goto("/menu");
    const card = pub.locator("button[aria-haspopup='dialog']", { hasText: name });
    await expect(card).toContainText("$12.50");
    await card.click();
    await expect(pub.getByRole("dialog").getByRole("heading", { name: "Add to any grill item" })).toBeVisible();
    await pub.keyboard.press("Escape");

    // Edit price (narrow the list to the QA item first)
    await page.getByLabel("Search items").fill("QA Test");
    await expect(page.getByRole("heading", { name: /matching item/ })).toBeVisible();
    await page.getByRole("button", { name: "Edit", exact: true }).first().click();
    const edit = page.getByRole("dialog", { name: `Edit ${name}` });
    await edit.getByLabel("Base price ($)").fill("13");
    await edit.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("status")).toContainText("Item saved");
    await pub.reload();
    await expect(pub.locator("button[aria-haspopup='dialog']", { hasText: name })).toContainText("$13");

    // Hide
    await page.getByRole("button", { name: "Hide", exact: true }).first().click();
    await expect(page.getByRole("status")).toContainText("Item hidden");
    await pub.reload();
    await expect(pub.locator("button[aria-haspopup='dialog']", { hasText: name })).toHaveCount(0);
    await pub.close();

    // Duplicate + delete both
    await page.getByRole("button", { name: "Copy" }).first().click();
    await expect(page.getByRole("status")).toContainText("Duplicated");
    await expect(page.locator("main").getByText(`${name} (copy)`)).toBeVisible();
    for (let i = 0; i < 2; i++) {
      await page.locator("main").getByRole("button", { name: "Delete", exact: true }).first().click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Delete item" }).click();
      await expectToast(page, "Item deleted");
    }
    expect(await query(`select 1 from menu_items where name like $1`, [`${name}%`])).toHaveLength(0);
  });

  test("categories and sections can be created and removed", async ({ page }) => {
    await gotoReady(page, "/admin/menu/categories");
    await page.getByRole("button", { name: "+ New category" }).click();
    const drawer = page.getByRole("dialog", { name: "New category" });
    await drawer.getByLabel("Name").fill(`${QA.prefix}Category`);
    await drawer.getByLabel("Hours line").fill("QA hours");
    await drawer.getByRole("button", { name: "Create category" }).click();
    await expect(page.getByRole("status")).toContainText("Category created");
    const row = page.locator("main div", { hasText: `${QA.prefix}Category` }).last();
    await expect(page.locator("main")).toContainText("/qa-category");

    await page.goto("/admin/menu");
    await page.getByRole("button", { name: `${QA.prefix}Category` }).click();
    await page.getByRole("button", { name: "+ Section" }).click();
    const sec = page.getByRole("dialog", { name: /New section/ });
    await sec.getByLabel("Section name").fill(`${QA.prefix}Section`);
    await sec.getByRole("button", { name: "Create section" }).click();
    await expect(page.getByRole("status")).toContainText("Section created");
    await expect(page.getByRole("heading", { name: `${QA.prefix}Section` })).toBeVisible();

    await page.goto("/admin/menu/categories");
    await page.locator("main div", { hasText: `${QA.prefix}Category` }).getByRole("button", { name: "Delete" }).last().click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete category" }).click();
    await expect(page.getByRole("status")).toContainText("Category deleted");
    expect(await query(`select 1 from menu_categories where slug = 'qa-category'`)).toHaveLength(0);
    void row;
  });

  test("modifier groups and options round-trip", async ({ page }) => {
    await gotoReady(page, "/admin/menu/modifiers");
    await page.getByRole("button", { name: "+ New modifier group" }).click();
    const g = page.getByRole("dialog", { name: "New modifier group" });
    await g.getByLabel("Group name").fill(`${QA.prefix}Group`);
    await g.getByRole("switch", { name: "Required" }).click();
    await g.getByRole("button", { name: "Create group" }).click();
    await expect(page.getByRole("status")).toContainText("Group created");
    await expect(page.locator("main h2", { hasText: `${QA.prefix}Group` })).toBeVisible();

    await page.getByRole("button", { name: "+ Option" }).click();
    const o = page.getByRole("dialog", { name: /New option in/ });
    await o.getByLabel("Option name").fill(`${QA.prefix}Option`);
    await o.getByLabel("Price adjustment ($)").fill("1.25");
    await o.getByRole("checkbox", { name: "Vegan", exact: true }).check();
    await o.getByRole("button", { name: "Add option" }).click();
    await expect(page.getByRole("status")).toContainText("Option added");
    const opt = page.locator("main").getByText(`${QA.prefix}Option`).locator("xpath=ancestor::div[contains(@class,'flex')][1]");
    await expect(page.locator("main")).toContainText("+$1.25");
    await expect(page.locator("main")).toContainText("VG");
    void opt;

    await page.locator("main header").getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Group deleted");
    expect(await query(`select 1 from modifier_groups where name = $1`, [`${QA.prefix}Group`])).toHaveLength(0);
  });
});
