import { expect, test } from "@playwright/test";
import { closePool, query } from "../helpers/db";
import { expectToast, gotoReady } from "../helpers/ui";

test.afterAll(async () => {
  // Safety net: the switch must never stay on after the suite.
  await query(`update special_events set enabled = false, title = 'Specials & Events', subtitle = null where id = 1`);
  await closePool();
});

test("the Special Events switch drives /special-events (NW02)", async ({ page, request }) => {
  expect((await request.get("/special-events")).status()).toBe(404);

  await gotoReady(page, "/admin/special-events");
  await page.getByRole("switch", { name: "Show the Special Events page" }).click();
  await page.getByLabel("Title").fill("QA Specials Board");
  await page.getByLabel("Subtitle").fill("QA subtitle: flyers land below.");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expectToast(page, "Page settings saved");

  await page.goto("/special-events");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("QA Specials Board");
  await expect(page.getByText("QA subtitle: flyers land below.")).toBeVisible();
  await expect(page.getByText(/Flyers and menus land here soon/)).toBeVisible();

  await gotoReady(page, "/admin/special-events");
  await page.getByRole("switch", { name: "Show the Special Events page" }).click();
  await page.getByRole("button", { name: "Save settings" }).click();
  await expectToast(page, "Page settings saved");
  expect((await request.get("/special-events")).status()).toBe(404);
});
