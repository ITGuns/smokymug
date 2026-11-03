import { expect, test } from "@playwright/test";
import { closePool, query } from "../helpers/db";
import { expectToast, gotoReady } from "../helpers/ui";

// BK02 + CA03 settings (3 Nov). The wizard switch is left as the suite set it (on).
test.afterAll(async () => {
  await query(`update site_settings set reservations_url = null, inquiry_cc = '[]'::jsonb where id = 1`);
  await closePool();
});

test("admin sets the SpotOn reservations link and the catering inquiry copies", async ({ page }) => {
  await gotoReady(page, "/admin/settings");

  // Reservations: a bare domain is refused, a full https link is stored
  const url = page.getByLabel("SpotOn reservations link");
  await url.fill("spoton.com/qa");
  await page.getByRole("button", { name: "Save reservations" }).click();
  await expect(page.getByText("Enter a full link starting with https://")).toBeVisible();
  await url.fill("https://example.com/qa-reserve");
  await page.getByRole("button", { name: "Save reservations" }).click();
  await expectToast(page, "Reservations saved");
  const [row] = await query<{ reservations_url: string; booking_wizard: boolean }>(`select reservations_url, booking_wizard from site_settings where id = 1`);
  expect(row.reservations_url).toBe("https://example.com/qa-reserve");
  expect(row.booking_wizard).toBe(true);

  // Dual paper trail: invalid address refused, valid list saved (deduped, lowercased)
  const cc = page.getByLabel(/Copy these addresses/);
  await cc.fill("not-an-email");
  await page.getByRole("button", { name: "Save copies" }).click();
  await expect(page.getByText("One of these is not a valid email address")).toBeVisible();
  await cc.fill("QA-one@qa.smokymug.test\nqa-two@qa.smokymug.test, qa-one@qa.smokymug.test");
  await page.getByRole("button", { name: "Save copies" }).click();
  await expectToast(page, "Inquiry copies saved");
  const [cfg] = await query<{ inquiry_cc: string[] }>(`select inquiry_cc from site_settings where id = 1`);
  expect(cfg.inquiry_cc).toEqual(["qa-one@qa.smokymug.test", "qa-two@qa.smokymug.test"]);
});
