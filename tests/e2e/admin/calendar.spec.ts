import { expect, test } from "@playwright/test";
import { closePool, query } from "../helpers/db";
import { expectToast, gotoReady } from "../helpers/ui";

const TITLE = "QA Live Music Night";
const pad = (n: number) => String(n).padStart(2, "0");

test.afterAll(async () => {
  await query(`delete from events where title like 'QA %'`);
  await closePool();
});

test("an admin event goes live on the public calendar and can be removed", async ({ page }) => {
  // The 15th of next month: always in the future, always inside one month view.
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  const date = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-15`;
  const monthParam = `${next.getFullYear()}-${pad(next.getMonth() + 1)}`;

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
  await page.getByRole("button", { name: /: 1 event$/ }).click();
  const popout = page.getByRole("dialog");
  await expect(popout).toContainText(TITLE);
  await expect(popout).toContainText("Live music");
  await expect(popout).toContainText("7:00 PM – 10:00 PM");
  await page.getByRole("button", { name: "Back to calendar view" }).click();
  await expect(popout).toBeHidden();

  // Remove it in admin; the public calendar goes back to empty.
  await gotoReady(page, "/admin/calendar");
  await page.getByRole("listitem").filter({ hasText: TITLE }).getByRole("button", { name: "Remove" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click();
  await expectToast(page, "Event removed");
  await page.goto(`/calendar?month=${monthParam}`);
  await expect(page.getByText(/Nothing on the calendar for /)).toBeVisible();
});
