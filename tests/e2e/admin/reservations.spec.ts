import { expect, test } from "@playwright/test";
import { nextWeekday } from "../helpers/dates";
import { cleanupAll, closePool, QA, query } from "../helpers/db";
import { gotoReady } from "../helpers/ui";

test.describe("Admin reservations", () => {
  test.afterAll(async () => {
    await cleanupAll();
    await closePool();
  });

  test("staff can create, confirm, edit, view by day and delete a reservation", async ({ page }) => {
    const date = nextWeekday(5);
    const email = `qa-admin@${QA.emailDomain}`;
    await gotoReady(page, "/admin/reservations");
    await page.getByRole("button", { name: "+ New reservation" }).click();
    const drawer = page.getByRole("dialog", { name: "New reservation" });
    await drawer.getByLabel("Date").fill(date);
    await drawer.getByLabel("Time").fill("19:00");
    await drawer.getByLabel("Party size").fill("2");
    await drawer.getByLabel("First name").fill("QA");
    await drawer.getByLabel("Last name").fill("Staff");
    await drawer.getByLabel("Email").fill(email);
    await drawer.getByLabel("Phone").fill("(804) 555-0155");
    await drawer.getByLabel("Status").selectOption("pending");
    await drawer.getByLabel("Internal notes (staff only)").fill("QA note");
    await drawer.getByRole("button", { name: "Create reservation" }).click();
    await expect(page.getByRole("status")).toContainText("Reservation created");

    const row = page.locator("tbody tr", { hasText: "QA Staff" });
    await expect(row).toContainText("Pending");
    await expect(row).toContainText("QA note");
    await row.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByRole("status")).toContainText("Marked confirmed");
    await expect(row).toContainText("Confirmed");

    await row.getByRole("button", { name: "Edit" }).click();
    const edit = page.getByRole("dialog", { name: /Edit SM-/ });
    await edit.getByLabel("Party size").fill("5");
    await edit.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("status")).toContainText("Reservation updated");
    await expect(row.locator("td").nth(1)).toHaveText("5");

    await page.getByRole("tab", { name: "Day" }).click();
    await page.getByLabel("Day", { exact: true }).fill(date);
    await expect(page.locator("main")).toContainText("QA Staff");
    await expect(page.locator("main")).toContainText("party of 5");

    await page.getByRole("tab", { name: "Calendar" }).click();
    await expect(page.getByRole("tablist", { name: "Slides" }).or(page.locator("main"))).toBeVisible();

    await page.getByRole("tab", { name: "List" }).click();
    await page.getByPlaceholder("Search name, email, phone, code").fill("qa-admin");
    await page.getByRole("button", { name: "Search" }).click();
    const found = page.locator("tbody tr", { hasText: "QA Staff" });
    await found.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("status")).toContainText("Reservation deleted");
    expect(await query(`select 1 from reservations where email = $1`, [email])).toHaveLength(0);
  });
});
