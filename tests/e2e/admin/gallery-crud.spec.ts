import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { crc32, deflateSync } from "node:zlib";
import { closePool, query } from "../helpers/db";
import { expectToast, gotoReady } from "../helpers/ui";

/** Every photo this spec creates starts with this, so cleanup is exact. */
const PREFIX = "QA gallery ";
const created = new Set<string>();

/** A solid-colour RGB PNG built in memory, so the spec ships no fixture file. */
function png(width: number, height: number, rgb: [number, number, number]): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: width * 3 }, (_, i) => rgb[i % 3]))]);
  const pixels = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(pixels)), chunk("IEND", Buffer.alloc(0))]);
}

type Row = { id: number; file: string; alt: string; tag: string; width: number; height: number; active: boolean };
const photoByAlt = async (alt: string) => (await query<Row>(`select id, file, alt, tag, width, height, active from gallery_images where alt = $1`, [alt]))[0];
const uploadCount = async (file: string) => (await query<{ n: number }>(`select count(*)::int as n from uploads where name = $1`, [file.replace(/^\/uploads\//, "")]))[0].n;

/** Safety net for a run that failed mid-way. Rows removed here skip revalidation, so /gallery can show them until the next admin change. */
async function cleanup() {
  const rows = await query<{ file: string }>(`select file from gallery_images where alt like $1`, [`${PREFIX}%`]);
  await query(`delete from special_event_images where alt like $1`, [`${PREFIX}%`]);
  await query(`delete from gallery_images where alt like $1`, [`${PREFIX}%`]);
  const names = [...new Set([...created, ...rows.map((r) => r.file)])].map((f) => f.replace(/^\/uploads\//, ""));
  if (names.length) await query(`delete from uploads where name = any($1::text[])`, [names]);
}

const orderList = (page: Page) => page.getByRole("list", { name: "Gallery photo order" }).getByRole("listitem");

async function addPhoto(page: Page, alt: string, tag: string, size: [number, number]): Promise<Row> {
  await gotoReady(page, "/admin/gallery");
  await page.getByRole("button", { name: "+ Add photo" }).click();
  const drawer = page.getByRole("dialog", { name: "Add a photo" });
  await drawer.getByLabel("Photo").setInputFiles({ name: "qa-photo.png", mimeType: "image/png", buffer: png(size[0], size[1], [184, 84, 40]) });
  await expect(drawer.getByText(`${size[0]} × ${size[1]} px`)).toBeVisible();
  await drawer.getByLabel("Description").fill(alt);
  await drawer.getByLabel("Category").selectOption(tag);
  await drawer.getByRole("button", { name: "Add photo", exact: true }).click();
  await expectToast(page, "Photo added");
  const row = await photoByAlt(alt);
  expect(row).toBeTruthy();
  created.add(row.file);
  return row;
}

async function removePhoto(page: Page, alt: string) {
  await gotoReady(page, "/admin/gallery");
  await orderList(page).filter({ hasText: alt }).getByRole("button", { name: /^Remove photo \d+$/ }).click();
  const confirm = page.getByRole("alertdialog", { name: "Remove this photo?" });
  await confirm.getByRole("button", { name: "Remove photo" }).click();
  await expectToast(page, "Photo removed");
  await expect(orderList(page).filter({ hasText: alt })).toHaveCount(0);
}

/** Column bottoms of the GA03 masonry, from layout heights (transforms from the enter animation don't count). */
const columnSpread = (page: Page) =>
  page.locator("[data-gallery-grid] > div > ul").evaluateAll((uls) => {
    const hs = uls.map((u) => (u as HTMLElement).offsetHeight);
    return hs.length > 1 ? Math.max(...hs) - Math.min(...hs) : -1;
  });

test.describe("Admin gallery add, edit and remove", () => {
  test.beforeAll(cleanup);
  test.afterAll(async () => {
    await cleanup();
    await closePool();
  });

  test("an uploaded photo shows on /gallery, takes edits, and removing it deletes its stored file", async ({ page, request }) => {
    const before = (await query<{ n: number }>(`select count(*)::int as n from gallery_images`))[0].n;
    const alt = `${PREFIX}upload ${Date.now()}`;
    const photo = await addPhoto(page, alt, "tacos", [60, 90]);
    expect(photo).toMatchObject({ tag: "tacos", width: 60, height: 90, active: true });
    expect(photo.file).toMatch(/^\/uploads\/[0-9a-f-]{36}\.png$/);
    const served = await request.get(photo.file);
    expect(served.status()).toBe(200);
    expect(served.headers()["content-type"]).toBe("image/png");

    // Appended at the end of the admin order.
    await expect(orderList(page)).toHaveCount(before + 1);
    await expect(orderList(page).last()).toContainText(alt);
    await expect(orderList(page).last()).toContainText("Tacos");
    const thumb = orderList(page).last().locator("img");
    await expect.poll(() => thumb.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);

    // Public gallery: rendered, decoded, filterable, and the GA03 columns still end together.
    await gotoReady(page, "/gallery");
    const tile = page.locator("[data-gallery-grid]").getByRole("img", { name: alt, exact: true });
    await tile.scrollIntoViewIfNeeded();
    await expect.poll(() => tile.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    await expect(page.locator("[data-gallery-grid] > div > ul")).toHaveCount(4);
    await expect.poll(() => columnSpread(page)).toBeLessThan(80);
    await page.getByRole("tab", { name: "Tacos" }).click();
    await expect(page.locator("[data-gallery-grid]").getByRole("img", { name: alt, exact: true })).toBeVisible();

    // Edit: description, category and visibility.
    const edited = `${PREFIX}edited ${Date.now()}`;
    await gotoReady(page, "/admin/gallery");
    await orderList(page).filter({ hasText: alt }).getByRole("button", { name: /^Edit photo \d+$/ }).click();
    const drawer = page.getByRole("dialog", { name: "Edit photo" });
    await expect(drawer.getByText("60 × 90 px")).toBeVisible();
    await drawer.getByLabel("Description").fill(edited);
    await drawer.getByLabel("Category").selectOption("drinks");
    await drawer.getByRole("button", { name: "Save", exact: true }).click();
    await expectToast(page, "Photo saved");
    expect(await photoByAlt(edited)).toMatchObject({ id: photo.id, tag: "drinks", active: true, width: 60, height: 90 });
    await expect(orderList(page).filter({ hasText: edited })).toContainText("Drinks");

    await gotoReady(page, "/gallery");
    await page.getByRole("tab", { name: "Drinks" }).click();
    await expect(page.locator("[data-gallery-grid]").getByRole("img", { name: edited, exact: true })).toBeVisible();
    await expect(page.locator("[data-gallery-grid]").getByRole("img", { name: alt, exact: true })).toHaveCount(0);

    // Hide it: off the public gallery, still in the admin list.
    await gotoReady(page, "/admin/gallery");
    await orderList(page).filter({ hasText: edited }).getByRole("button", { name: /^Edit photo \d+$/ }).click();
    await page.getByRole("dialog", { name: "Edit photo" }).getByLabel("Show on the website").uncheck();
    await page.getByRole("dialog", { name: "Edit photo" }).getByRole("button", { name: "Save", exact: true }).click();
    await expectToast(page, "Photo saved");
    await expect(orderList(page).filter({ hasText: edited })).toContainText("Hidden");
    await gotoReady(page, "/gallery");
    await expect(page.locator("[data-gallery-grid] img").first()).toBeVisible();
    await expect(page.getByRole("img", { name: edited, exact: true })).toHaveCount(0);

    // Remove: gone from admin, public gallery, the table, and the stored bytes.
    await removePhoto(page, edited);
    expect(await photoByAlt(edited)).toBeUndefined();
    expect(await uploadCount(photo.file)).toBe(0);
    expect((await request.get(photo.file)).status()).toBe(404);
    expect((await query<{ n: number }>(`select count(*)::int as n from gallery_images`))[0].n).toBe(before);
    await gotoReady(page, "/gallery");
    await expect(page.locator("[data-gallery-grid] img").first()).toBeVisible();
    await expect(page.getByRole("img", { name: edited, exact: true })).toHaveCount(0);
    await expect.poll(() => columnSpread(page)).toBeLessThan(80);
  });

  test("removing a photo keeps its stored file while a Special Events flyer still uses it", async ({ page, request }) => {
    const alt = `${PREFIX}shared ${Date.now()}`;
    const photo = await addPhoto(page, alt, "catering", [120, 80]);
    await query(`insert into special_event_images (file, alt, display_order) values ($1, $2, 999)`, [photo.file, `${PREFIX}flyer`]);

    await removePhoto(page, alt);
    expect(await photoByAlt(alt)).toBeUndefined();
    expect(await uploadCount(photo.file)).toBe(1);
    expect((await request.get(photo.file)).status()).toBe(200);

    await query(`delete from special_event_images where alt = $1`, [`${PREFIX}flyer`]);
    await query(`delete from uploads where name = $1`, [photo.file.replace(/^\/uploads\//, "")]);
    created.delete(photo.file);
  });

  test("the admin gallery page and photo drawer have no serious or critical axe violations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    // Scope: this page's content and the drawer. The shared admin sidebar is not part of this feature.
    const scan = async () => {
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).exclude("aside").analyze();
      const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      return blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes, e.g. ${v.nodes[0]?.target.join(" ")}`);
    };
    await gotoReady(page, "/admin/gallery");
    expect(await scan()).toEqual([]);
    await page.getByRole("button", { name: "+ Add photo" }).click();
    await expect(page.getByRole("dialog", { name: "Add a photo" }).getByLabel("Description")).toBeVisible();
    await page.waitForTimeout(500);
    expect(await scan()).toEqual([]);
  });
});
