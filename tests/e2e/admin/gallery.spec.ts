import { expect, test } from "@playwright/test";
import { closePool, query } from "../helpers/db";
import { expectToast, gotoReady } from "../helpers/ui";

type Row = { id: number; alt: string };
const currentOrder = () => query<Row>(`select id, alt from gallery_images order by display_order, id`);

test.describe("Admin gallery order", () => {
  let original: Row[] = [];

  test.beforeAll(async () => {
    original = await currentOrder();
  });
  test.afterAll(async () => {
    // Safety net: put the starting order back even if the test failed mid-way.
    if (original.length) {
      await query(`update gallery_images as g set display_order = v.ord - 1 from unnest($1::int[]) with ordinality as v(id, ord) where g.id = v.id`, [original.map((r) => r.id)]);
    }
    await closePool();
  });

  test("photos render, a move persists across reload, and the order restores", async ({ page }) => {
    expect(original.length).toBeGreaterThan(1);
    const [first, second] = original;

    await gotoReady(page, "/admin/gallery");
    await expect(page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Gallery" })).toHaveAttribute("aria-current", "page");
    const rows = page.getByRole("list", { name: "Gallery photo order" }).getByRole("listitem");
    await expect(rows).toHaveCount(original.length);
    await expect(rows.nth(0)).toContainText(first.alt);
    await expect(rows.nth(1)).toContainText(second.alt);
    const thumb = rows.nth(0).locator("img");
    await expect(thumb).toBeVisible();
    await expect.poll(() => thumb.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);

    // Move the first photo down one place.
    await rows.nth(0).getByRole("button", { name: "Move photo 1 down" }).click();
    await expectToast(page, "Gallery order saved");
    expect((await currentOrder()).slice(0, 2).map((r) => r.id)).toEqual([second.id, first.id]);

    await page.reload();
    await expect(rows.nth(0)).toContainText(second.alt);
    await expect(rows.nth(1)).toContainText(first.alt);

    // Move it back up and confirm the full original order is restored.
    await rows.nth(1).getByRole("button", { name: "Move photo 2 up" }).click();
    await expectToast(page, "Gallery order saved");
    expect((await currentOrder()).map((r) => r.id)).toEqual(original.map((r) => r.id));
    await page.reload();
    await expect(rows.nth(0)).toContainText(first.alt);
  });
});
