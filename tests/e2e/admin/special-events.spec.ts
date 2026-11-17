import { expect, test } from "@playwright/test";
import { closePool, query } from "../helpers/db";
import { expectToast, gotoReady } from "../helpers/ui";

test.afterAll(async () => {
  // Safety net: the switch must never stay on after the suite.
  await query(`update special_events set enabled = false, title = 'Specials & Events', subtitle = null where id = 1`);
  // A failed flyer test can leave its flyer and upload behind
  await query(`delete from uploads where '/uploads/' || name in (select file from special_event_images where alt = 'QA flyer')`);
  await query(`delete from special_event_images where alt = 'QA flyer'`);
  await closePool();
});

test("a saved flyer drops its Unsaved tag, and removing it drops its upload", async ({ page }) => {
  const uploads = async () => Number((await query<{ n: string }>(`select count(*) as n from uploads`))[0].n);
  const start = await uploads();
  await gotoReady(page, "/admin/special-events");
  // A real JPEG: several public/images/*.jpg files are WebP inside, which the upload check refuses
  await page.locator("input[type=file]").setInputFiles("public/images/catering-board.jpg");
  await expect(page.getByText("Unsaved", { exact: true })).toHaveCount(1);
  await page.getByPlaceholder("Describe the image (required)").last().fill("QA flyer");
  await page.getByRole("button", { name: "Save flyers" }).click();
  await expectToast(page, "Flyers saved");
  await expect(page.getByText("Unsaved", { exact: true })).toHaveCount(0);
  expect(await uploads()).toBe(start + 1);

  await gotoReady(page, "/admin/special-events");
  const alts = page.getByPlaceholder("Describe the image (required)");
  await expect(alts.last()).toHaveValue("QA flyer");
  await page.locator("li").filter({ has: alts }).last().getByRole("button", { name: "Remove", exact: true }).click();
  await page.getByRole("button", { name: "Save flyers" }).click();
  await expectToast(page, "Flyers saved");
  expect(await uploads()).toBe(start);
  expect(await query(`select id from special_event_images where alt = 'QA flyer'`)).toHaveLength(0);
});

test("the Special Events switch drives /special-events (NW02)", async ({ page, request }) => {
  expect((await request.get("/special-events")).status()).toBe(404);

  await gotoReady(page, "/admin/special-events");
  await page.getByRole("switch", { name: "Show the Special Events page" }).click();
  // getByLabel("Title") would substring-match "Subtitle" too; target the ids.
  await page.locator("#se-title").fill("QA Specials Board");
  await page.locator("#se-subtitle").fill("QA subtitle: flyers land below.");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expectToast(page, "Page settings saved");

  await page.goto("/special-events");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("QA Specials Board");
  await expect(page.getByText("QA subtitle: flyers land below.")).toBeVisible();
  await expect(page.getByText(/Flyers and menus land here soon/)).toBeVisible();
  // NW02 "nav link": the Specials link exists in the top bar and footer while on...
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Specials" })).toBeVisible();
  await expect(page.locator("footer h2:has-text('Explore') + ul").getByRole("link", { name: "Specials" })).toBeVisible();

  await gotoReady(page, "/admin/special-events");
  await page.getByRole("switch", { name: "Show the Special Events page" }).click();
  await page.getByRole("button", { name: "Save settings" }).click();
  await expectToast(page, "Page settings saved");
  expect((await request.get("/special-events")).status()).toBe(404);
  // ...and disappears everywhere once the switch is off again.
  await page.goto("/");
  // Guard: the header actually rendered, so the zero-count checks below mean something
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Catering" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Specials" })).toHaveCount(0);
  await expect(page.locator("footer").getByRole("link", { name: "Specials" })).toHaveCount(0);
});
