import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { cleanupAll, closePool, QA, query } from "../helpers/db";
import { expectToast, openNewItemDrawer } from "../helpers/ui";

// D1 / board MB03: an item's Show from / Show until dates are set, edited and
// cleared in admin; the public menu, its search and the home Signature grid follow.

const NAME = `${QA.prefix}Scheduled Plate`;

/** Today in the restaurant's timezone (booking_settings), the same clock the app uses. */
async function restaurantToday(): Promise<string> {
  const [row] = await query<{ timezone: string }>(`select timezone from booking_settings where id = 1`);
  return new Intl.DateTimeFormat("en-CA", { timeZone: row.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
const shift = (ymd: string, days: number) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const schedules = () =>
  query<{ show_from: string | null; show_until: string | null }>(
    `select s.show_from, s.show_until from menu_item_schedules s join menu_items i on i.id = s.item_id where i.name = $1`,
    [NAME],
  );

/** Is the QA item on the public site? Checks the menu list, the menu search and the home Signature grid. */
async function expectPublic(pub: Page, shown: boolean) {
  const count = shown ? 1 : 0;
  await pub.goto("/menu");
  await expect(pub.locator("button[aria-haspopup='dialog']", { hasText: NAME })).toHaveCount(count);
  await pub.getByRole("searchbox", { name: "Search the menu" }).fill("QA Scheduled");
  await expect(pub.locator("button[aria-haspopup='dialog']", { hasText: NAME })).toHaveCount(count);
  await pub.goto("/");
  await expect(pub.locator("main").getByRole("heading", { name: NAME, exact: true })).toHaveCount(count);
}

/** Serious/critical axe findings inside `include`. The category view's older findings
 *  (zinc-400 counts, ul-of-div drag lists) were fixed 4 Nov; menu.spec.ts guards that view. */
async function blocking(page: Page, include: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).include(include).analyze();
  return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes, e.g. ${v.nodes[0]?.target.join(" ")}`);
}

async function openEditor(page: Page) {
  await page.getByLabel("Search items").fill(NAME);
  await page.getByRole("button", { name: "Edit", exact: true }).first().click();
  return page.getByRole("dialog", { name: `Edit ${NAME}` });
}

test.describe("Admin menu scheduling (D1)", () => {
  test.beforeAll(cleanupAll);
  test.afterAll(async () => {
    await cleanupAll();
    // Rows go with their item (FK cascade): nothing may be left behind
    expect(await query(`select 1 from menu_item_schedules where item_id not in (select id from menu_items)`)).toHaveLength(0);
    await closePool();
  });

  test("set, edit and clear an item's dates; menu, search and home follow", async ({ page, browser }) => {
    test.setTimeout(240_000);
    const today = await restaurantToday();
    const tomorrow = shift(today, 1);
    const yesterday = shift(today, -1);
    const pub = await browser.newPage();

    // Set: a featured item that starts tomorrow is hidden today
    const create = await openNewItemDrawer(page);
    await create.getByLabel("Item name").fill(NAME);
    await create.getByLabel("Base price ($)").fill("11");
    await create.getByLabel("Category / section").selectOption({ label: "Classics" });
    await create.getByRole("switch", { name: "Featured" }).click();
    await create.getByLabel("Show from").fill(tomorrow);
    await expect(create.getByText("Not on the website today")).toBeVisible();
    await create.getByRole("button", { name: "Save changes" }).click();
    await expectToast(page, "Item created");
    expect(await schedules()).toEqual([{ show_from: tomorrow, show_until: null }]);
    await page.getByLabel("Search items").fill(NAME);
    await expect(page.locator("main li", { hasText: NAME }).getByText(/^Scheduled · from /)).toBeVisible();
    // The list in search mode, with the new tag: no serious or critical axe findings
    expect(await blocking(page, "main")).toEqual([]);
    await expectPublic(pub, false);

    // Edit: a range that starts and ends today shows today (both days inclusive)
    let edit = await openEditor(page);
    await expect(edit.getByLabel("Show from")).toHaveValue(tomorrow);
    await edit.getByLabel("Show from").fill(today);
    await edit.getByLabel("Show until").fill(today);
    await edit.getByRole("button", { name: "Save changes" }).click();
    await expectToast(page, "Item saved");
    expect(await schedules()).toEqual([{ show_from: today, show_until: today }]);
    await expect(page.locator("main li", { hasText: NAME }).getByText(/^Ends /)).toBeVisible();
    await expectPublic(pub, true);

    // Validation: the last day can't come before the first
    edit = await openEditor(page);
    await edit.getByLabel("Show until").fill(yesterday);
    await edit.getByRole("button", { name: "Save changes" }).click();
    await expect(edit.getByText("The last day can't be before the first day")).toBeVisible();
    expect(await schedules()).toEqual([{ show_from: today, show_until: today }]);

    // Edit: ended yesterday is hidden, and labelled Ended
    await edit.getByLabel("Show from").fill("");
    await edit.getByRole("button", { name: "Save changes" }).click();
    await expectToast(page, "Item saved");
    expect(await schedules()).toEqual([{ show_from: null, show_until: yesterday }]);
    await expect(page.locator("main li", { hasText: NAME }).getByText(/^Ended /)).toBeVisible();
    await expectPublic(pub, false);

    // Copy keeps the dates (CRUD parity)
    await page.locator("main li", { hasText: NAME }).first().getByRole("button", { name: "Copy" }).click();
    await expectToast(page, "Duplicated");
    expect(
      await query(`select s.show_until from menu_item_schedules s join menu_items i on i.id = s.item_id where i.name = $1`, [`${NAME} (copy)`]),
    ).toEqual([{ show_until: yesterday }]);

    // Clear: no dates, no row, no label, back on the site
    await page.getByLabel("Search items").fill("");
    edit = await openEditor(page);
    await edit.getByRole("button", { name: "Clear dates" }).click();
    await expect(edit.getByLabel("Show until")).toHaveValue("");
    await edit.getByRole("button", { name: "Save changes" }).click();
    await expectToast(page, "Item saved");
    expect(await schedules()).toEqual([]);
    await expect(page.locator("main li", { hasText: NAME }).first().getByText(/^(Ends|Ended|Scheduled) /)).toHaveCount(0);
    await expectPublic(pub, true);
    await pub.close();
  });

  test("the item editor with the Schedule section has no serious or critical axe violations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const drawer = await openNewItemDrawer(page);
    await drawer.getByLabel("Show until").fill("2026-01-01");
    await expect(drawer.getByText(/^Ended /)).toBeVisible();
    await page.waitForTimeout(500);
    expect(await blocking(page, '[role="dialog"]')).toEqual([]);
  });
});
