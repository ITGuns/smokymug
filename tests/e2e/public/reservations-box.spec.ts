import { expect, test } from "@playwright/test";
import { closePool } from "../helpers/db";
import { setBookingWizard, setReservationsUrl } from "../helpers/site-settings";

// BK02: with the wizard off (the shipped default) /book is the SpotOn box.
// The rest of the suite runs with the wizard on (auth.setup.ts), so restore that.
test.describe("Book a Table: SpotOn reservations box (BK02)", () => {
  test.beforeAll(async () => setBookingWizard(false));
  test.afterAll(async () => {
    await setReservationsUrl(null);
    await setBookingWizard(true);
    await closePool();
  });

  test("no SpotOn link yet: a phone card, no wizard", async ({ page }) => {
    await setReservationsUrl(null);
    await page.goto("/book");
    await expect(page.getByRole("heading", { name: "Call us to book" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Call (804) 562-3722" })).toHaveAttribute("href", "tel:+18045623722");
    await expect(page.getByRole("heading", { name: "When are you coming in?" })).toHaveCount(0);
  });

  test("with a SpotOn link: framed box plus a plain link and the phone", async ({ page }) => {
    const url = "https://example.com/qa-reservations";
    await setReservationsUrl(url);
    const res = await page.goto("/book");
    // The admin-set host is unknown at build time, so /book alone allows https frames
    expect(res!.headers()["content-security-policy"]).toMatch(/frame-src [^;]*https:(;|$| )/);
    await expect(page.locator('iframe[title="SpotOn reservations"]')).toHaveAttribute("src", url);
    await expect(page.getByRole("link", { name: /Open reservations/ })).toHaveAttribute("href", url);
    await expect(page.getByRole("link", { name: "(804) 562-3722" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "When are you coming in?" })).toHaveCount(0);
  });

  test("Book a Table CTAs still lead to /book", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").getByRole("link", { name: "Book a Table" })).toHaveAttribute("href", "/book");
  });
});
