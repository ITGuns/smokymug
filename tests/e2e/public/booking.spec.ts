import { expect, test } from "@playwright/test";
import { bookThrough } from "../helpers/booking";
import { dayButtonName, longDate, nextWeekday } from "../helpers/dates";
import { cleanupAll, closePool, insertReservations, QA, reservationByCode } from "../helpers/db";

test.describe("Reservations", () => {
  test.afterAll(async () => {
    await cleanupAll();
    await closePool();
  });

  test("guest books, views and cancels a table", async ({ page }) => {
    const date = nextWeekday(6); // Saturday
    const email = `qa-book@${QA.emailDomain}`;
    await bookThrough(page, { date, party: 3, time: "6:30 PM", first: "QA", last: "Guest", email, phone: "(804) 555-0142", requests: "QA run" });

    await expect(page.getByText(longDate(date)).first()).toBeVisible();
    await expect(page.getByText("3 guests").first()).toBeVisible();
    await page.getByRole("button", { name: "Confirm reservation" }).click();

    await expect(page.getByRole("heading", { name: "You're booked!" })).toBeVisible();
    const code = (await page.locator("main .font-label.text-2xl").textContent())!.replace("#", "").trim();
    expect(code).toMatch(/^SM-\d{4,}$/);
    await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();
    const gcal = page.getByRole("link", { name: "Add to Google Calendar" });
    await expect(gcal).toHaveAttribute("href", /calendar\.google\.com.*ctz=America%2FNew_York/);

    const row = await reservationByCode(code);
    expect(row).toMatchObject({ status: "confirmed", party_size: 3, email, source: "web" });

    // Manage page from the confirmation link
    await page.getByRole("link", { name: "View / manage reservation" }).click();
    await page.waitForURL(/\/book\/SM-\d+/);
    await expect(page.getByRole("heading", { name: "Your reservation" })).toBeVisible();
    await expect(page.getByText(`#${code}`)).toBeVisible();
    await page.getByRole("button", { name: "Cancel this reservation" }).click();
    await page.getByRole("button", { name: "Yes, cancel it" }).click();
    await expect(page.getByRole("heading", { name: "Reservation cancelled" })).toBeVisible();
    expect((await reservationByCode(code)).status).toBe("cancelled");

    // Tampered token is rejected
    await page.goto(`/book/${code}?t=wrong`);
    await expect(page.getByText("We couldn't find that reservation.")).toBeVisible();
  });

  test("large parties are held as pending", async ({ page }) => {
    const date = nextWeekday(5); // Friday
    await bookThrough(page, { date, party: 8, time: "7:00 PM", first: "QA", last: "Large", email: `qa-large@${QA.emailDomain}`, phone: "(804) 555-0143" });
    await expect(page.getByText(/Parties of \d+\+ are submitted as a request/)).toBeVisible();
    await page.getByRole("button", { name: "Confirm reservation" }).click();
    await expect(page.getByRole("heading", { name: "You're booked!" })).toBeVisible();
    await expect(page.getByText("Pending", { exact: true })).toBeVisible();
  });

  test("validates guest details without losing input", async ({ page }) => {
    const date = nextWeekday(4); // Thursday
    await page.goto("/book");
    const day = page.getByRole("button", { name: dayButtonName(date) });
    if (!(await day.isVisible())) await page.getByRole("button", { name: "Next month" }).click();
    await day.click();
    await page.locator("button[aria-pressed]").filter({ has: page.locator("span.font-display", { hasText: /^2$/ }) }).click();
    await page.getByRole("button", { name: "12:00 PM", exact: true }).click();
    await page.getByLabel(/^First name/).fill("QA");
    await page.getByLabel(/^Email/).fill("not-an-email");
    await page.getByLabel(/^Phone/).fill("12");
    await page.getByRole("button", { name: "Review reservation" }).click();
    await expect(page.getByText("Last name is required")).toBeVisible();
    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page.getByText("Enter a valid phone number")).toBeVisible();
    await expect(page.getByLabel(/^First name/)).toHaveValue("QA"); // input preserved
  });

  test("closed days are not selectable and full slots are disabled", async ({ page }) => {
    const monday = nextWeekday(1);
    const saturday = nextWeekday(6, 9);
    await insertReservations([1, 2, 3, 4].map(() => ({ date: saturday, time: "18:00", partySize: 2 })));

    await page.goto("/book");
    const mon = page.getByRole("button", { name: dayButtonName(monday) });
    if (!(await mon.isVisible())) await page.getByRole("button", { name: "Next month" }).click();
    await expect(mon).toBeDisabled();
    await expect(mon).toHaveAccessibleName(/unavailable/);

    await page.goto("/book");
    const sat = page.getByRole("button", { name: dayButtonName(saturday) });
    if (!(await sat.isVisible())) await page.getByRole("button", { name: "Next month" }).click();
    await sat.click();
    await page.locator("button[aria-pressed]").filter({ has: page.locator("span.font-display", { hasText: /^2$/ }) }).click();
    await expect(page.getByRole("heading", { name: "Pick a time" })).toBeVisible();
    await expect(page.getByRole("button", { name: "6:00 PM", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "6:30 PM", exact: true })).toBeDisabled(); // within the 90-minute turn
    await expect(page.getByRole("button", { name: "8:00 PM", exact: true })).toBeEnabled();
  });
});
