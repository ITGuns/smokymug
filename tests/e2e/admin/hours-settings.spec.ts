import { expect, test } from "@playwright/test";
import { dayButtonName, nextWeekday } from "../helpers/dates";
import { cleanupAll, closePool, QA, query } from "../helpers/db";
import { expectToast, gotoReady } from "../helpers/ui";

test.describe("Admin hours & settings", () => {
  test.afterAll(async () => {
    await cleanupAll();
    await query(`update hours set closes_at = '12:00' where category = 'store' and day_of_week = 1`);
    await query(`update booking_settings set max_party_size = 10, bookings_enabled = true where id = 1`);
    await closePool();
  });

  test("store hours edits flow to the public site, then revert", async ({ page, browser }) => {
    await gotoReady(page, "/admin/hours");
    const mondayClose = page.getByLabel("Monday closes");
    await expect(mondayClose).toHaveValue("12:00");
    await mondayClose.fill("13:00");
    await page.getByRole("button", { name: "Save store hours" }).click();
    await expectToast(page, "Store hours saved");

    const pub = await browser.newPage();
    await pub.goto("/contact");
    await expect(pub.locator("main")).toContainText("7 AM – 1 PM");
    await pub.close();

    await mondayClose.fill("12:00");
    await page.getByRole("button", { name: "Save store hours" }).click();
    await expectToast(page, "Store hours saved");
    await expect(mondayClose).toHaveValue("12:00");
  });

  test("blackout dates close booking for that day", async ({ page, browser }) => {
    const saturday = nextWeekday(6, 16);
    await gotoReady(page, "/admin/hours");
    await page.getByRole("button", { name: "+ Add date" }).click();
    const d = page.getByRole("dialog", { name: "Add a date override" });
    await d.getByLabel("Date").fill(saturday);
    await d.getByLabel("Reason").fill(`${QA.prefix}blackout`);
    await d.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("status")).toContainText("Date saved");
    await expect(page.locator("main")).toContainText(`${QA.prefix}blackout`);

    const pub = await browser.newPage();
    await pub.goto("/book");
    const btn = pub.getByRole("button", { name: dayButtonName(saturday) });
    if (!(await btn.isVisible())) await pub.getByRole("button", { name: "Next month" }).click();
    await expect(btn).toBeDisabled();
    await pub.close();

    await page.locator("main li", { hasText: `${QA.prefix}blackout` }).getByRole("button", { name: "Remove" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click();
    await expect(page.getByRole("status")).toContainText("Override removed");
  });

  test("booking rules: pausing online booking and party limits apply immediately", async ({ page, browser }) => {
    await gotoReady(page, "/admin/settings");
    await page.getByLabel("Max party size (online)").fill("8");
    await page.getByRole("switch", { name: "Online booking enabled" }).click();
    await page.getByRole("button", { name: "Save rules" }).click();
    await expectToast(page, "Booking rules saved");

    const pub = await browser.newPage();
    await pub.goto("/book");
    await expect(pub.getByRole("heading", { name: "Online booking is paused" })).toBeVisible();
    await pub.close();

    await page.getByRole("switch", { name: "Online booking enabled" }).click();
    await page.getByRole("button", { name: "Save rules" }).click();
    await expectToast(page, "Booking rules saved");

    const pub2 = await browser.newPage();
    await pub2.goto("/book");
    await pub2.locator("button[aria-pressed]:not([disabled])").first().click();
    await expect(pub2.getByRole("heading", { name: "How many guests?" })).toBeVisible();
    await expect(pub2.locator("button[aria-pressed]")).toHaveCount(8);
    await pub2.close();

    await page.getByLabel("Max party size (online)").fill("10");
    await page.getByRole("button", { name: "Save rules" }).click();
    await expectToast(page, "Booking rules saved");
  });

  test("restaurant info validation and password rules", async ({ page }) => {
    await gotoReady(page, "/admin/settings");
    const email = page.locator("#r-email");
    const original = await email.inputValue();
    await email.fill("a@b"); // passes the browser check, fails server validation
    await page.getByRole("button", { name: "Save info" }).click();
    await expect(page.getByRole("status")).toContainText("Please check the highlighted fields");
    await email.fill(original);

    await page.getByLabel("Current password").fill("wrong-password-here");
    await page.getByLabel("New password", { exact: true }).fill("long-enough-password-1");
    await page.getByLabel("Confirm new password").fill("long-enough-password-2");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByRole("status")).toContainText("don't match");
  });
});
