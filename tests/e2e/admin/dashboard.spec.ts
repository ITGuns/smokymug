import { expect, test } from "@playwright/test";
import { gotoReady } from "../helpers/ui";

test.describe("Admin dashboard & shell", () => {
  test("dashboard shows today's stats, hours and quick actions", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Today at a glance" })).toBeVisible();
    for (const label of ["Reservations today", "Confirmed", "Pending", "Cancelled", "Upcoming (active)"]) await expect(page.getByText(label, { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Today's hours" })).toBeVisible();
    await expect(page.getByText("Store hours", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "+ Add Menu Item" })).toHaveAttribute("href", "/admin/menu?new=1");
    await expect(page.getByRole("heading", { name: "Featured menu items" })).toBeVisible();
    await expect(page.getByText("Hatch Chile Mac n Cheese")).toBeVisible();
  });

  test("sidebar navigates and toggles render inside their tracks (regression)", async ({ page }) => {
    await gotoReady(page, "/admin");
    const nav = page.getByRole("navigation", { name: "Admin" });
    await nav.getByRole("link", { name: "Settings" }).click();
    await page.waitForURL(/\/admin\/settings/);
    await page.waitForLoadState("networkidle");
    const toggle = page.getByRole("switch", { name: "Online booking enabled" });
    const track = await toggle.boundingBox();
    const knob = await toggle.locator("span").boundingBox();
    expect(knob!.x).toBeGreaterThanOrEqual(track!.x);
    expect(knob!.x + knob!.width).toBeLessThanOrEqual(track!.x + track!.width + 0.5);
    expect(await toggle.getAttribute("aria-checked")).toBe("true");
  });

  test("sign out ends the session", async ({ page, request }) => {
    await page.goto("/admin");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    const res = await page.request.get("/admin", { maxRedirects: 0 });
    expect(res.status()).toBe(307);
  });
});
