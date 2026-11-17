import { expect, test } from "@playwright/test";
import { longDate } from "../helpers/dates";
import { closePool, query } from "../helpers/db";
import { expectToast, gotoReady } from "../helpers/ui";

const TITLE = "QA Live Music Night";

test.afterAll(async () => {
  await query(`delete from events where title like 'QA %'`);
  await closePool();
});

test("an admin event goes live on the public calendar and can be removed", async ({ page }) => {
  // Audit F4 (18 Nov 2026): a far-future month no seed touches, so the checks below
  // hold on a seeded database and an empty one alike.
  const date = "2099-03-15";
  const monthParam = "2099-03";
  const dayButton = page.getByRole("button", { name: `${longDate(date)}: 1 event`, exact: true });

  await gotoReady(page, "/admin/calendar");
  await page.getByRole("button", { name: "+ Add event" }).first().click();
  await page.getByLabel("Title").fill(TITLE);
  await page.getByLabel("Date").fill(date);
  await page.getByLabel("Starts").fill("19:00");
  await page.getByLabel("Ends").fill("22:00");
  await page.getByLabel("Details").fill("QA: live set on the porch. Delete me.");
  // B6 / board L6: event type picks the icon on the public calendar
  await page.getByLabel("Type").selectOption("music");
  await page.getByLabel("Link", { exact: true }).fill("https://www.instagram.com/thesmokymug");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expectToast(page, "Event saved");
  await expect(page.getByRole("listitem").filter({ hasText: TITLE })).toContainText("Live music");

  // Public list panel: the row expands with details and the link.
  await page.goto(`/calendar?month=${monthParam}`);
  const listRow = page.getByRole("button", { name: new RegExp(TITLE) });
  await expect(listRow).toBeVisible();
  await expect(listRow).toContainText("Live music");
  await expect(page.getByRole("list", { name: "Event types" })).toContainText("Live music");
  await listRow.click();
  await expect(page.getByText("QA: live set on the porch. Delete me.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Details/ })).toHaveAttribute("href", "https://www.instagram.com/thesmokymug");

  // Month grid: the day pops out over the calendar and the X exits (NW01).
  await dayButton.click();
  const popout = page.getByRole("dialog");
  await expect(popout).toContainText(TITLE);
  await expect(popout).toContainText("Live music");
  await expect(popout).toContainText("7:00 PM – 10:00 PM");
  await page.getByRole("button", { name: "Back to calendar view" }).click();
  await expect(popout).toBeHidden();

  // Remove it in admin; the event and its day button leave the public calendar.
  await gotoReady(page, "/admin/calendar");
  await page.getByRole("listitem").filter({ hasText: TITLE }).getByRole("button", { name: "Remove" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click();
  await expectToast(page, "Event removed");
  await page.goto(`/calendar?month=${monthParam}`);
  await expect(page.getByRole("heading", { name: "March 2099" })).toBeVisible();
  await expect(page.getByText(TITLE)).toHaveCount(0);
  await expect(page.getByRole("button", { name: new RegExp(`^${longDate(date)}:`) })).toHaveCount(0);
});
