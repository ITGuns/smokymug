import { expect, test } from "@playwright/test";
import { cleanupAll, closePool, QA, query } from "../helpers/db";

test.describe("Catering", () => {
  test.afterAll(async () => {
    await cleanupAll();
    await closePool();
  });

  test("page shows real catering content and the inquiry form stores a lead", async ({ page }) => {
    await page.goto("/catering");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Catering");
    await expect(page.getByText("Superbowl wings, Thanksgiving turkeys, Christmas pork butts")).toBeVisible();
    await expect(page.getByText("Restaurant rental for events")).toBeVisible();

    const email = `qa-catering@${QA.emailDomain}`;
    await page.getByLabel(/^Your name/).fill("QA Planner");
    await page.getByRole("textbox", { name: /^Email/ }).fill(email);
    await page.getByLabel(/^What's the occasion/).fill("QA office lunch");
    await page.getByLabel(/^Number of guests/).fill("40");
    await page.getByLabel(/^Service type/).selectOption("Delivery");
    await page.getByLabel(/^Tell us more/).fill("Automated QA inquiry");
    await page.getByRole("button", { name: "Send inquiry" }).click();
    await expect(page.getByRole("heading", { name: "We'll be in touch." })).toBeVisible();

    const rows = await query<{ occasion: string; guest_count: number; service_type: string }>(`select occasion, guest_count, service_type from catering_inquiries where email = $1`, [email]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ occasion: "QA office lunch", guest_count: 40, service_type: "Delivery" });
  });

  test("rejects an incomplete inquiry with field errors", async ({ page }) => {
    await page.goto("/catering#inquiry");
    await page.getByRole("textbox", { name: /^Email/ }).fill("bad");
    await page.getByRole("button", { name: "Send inquiry" }).click();
    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page.getByText("Choose a service type")).toBeVisible();
  });
});
