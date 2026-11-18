import { expect, test } from "@playwright/test";
import { closePool } from "../helpers/db";
import { setBookingWizard, setReservationsUrl } from "../helpers/site-settings";
import { SITE_SETTINGS } from "../../../src/db/seed-data/restaurant";

// BK02: with the wizard off (the shipped default) /book is the SpotOn box.
// The rest of the suite runs with the wizard on (auth.setup.ts), so restore that.
test.describe("Book a Table: SpotOn reservations box (BK02)", () => {
  test.beforeAll(async () => setBookingWizard(false));
  test.afterAll(async () => {
    await setReservationsUrl(SITE_SETTINGS.reservationsUrl);
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

  test("unreachable host: the plain link and the phone, no frame", async ({ page }) => {
    // .invalid never resolves (RFC 2606), so the reachability probe fails and the frame gives way to the card
    const url = "https://qa-reservations.invalid/";
    await setReservationsUrl(url);
    await page.goto("/book");
    await expect(page.locator('iframe[title="SpotOn reservations"]')).toHaveCount(0);
    const link = page.getByRole("link", { name: /Open reservations/ });
    await expect(link).toHaveAttribute("href", url);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("link", { name: "(804) 562-3722" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "When are you coming in?" })).toHaveCount(0);
  });

  test("Book a Table CTAs still lead to /book", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").getByRole("link", { name: "Book a Table" })).toHaveAttribute("href", "/book");
  });
});
