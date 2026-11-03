import { expect, test } from "@playwright/test";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

test.describe("Calendar page (NW01)", () => {
  test("renders the board copy and an empty month", async ({ page }) => {
    await page.goto("/calendar");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's happening?");
    await expect(page.getByText("Events and special programming: Do things. Meet people.")).toBeVisible();
    // Nothing is seeded on the calendar, so the list panel shows the empty state.
    await expect(page.getByText(/Nothing on the calendar for /)).toBeVisible();
    // Scoped to main: the footer hours table also contains an exact "Sun".
    await expect(page.locator("main").getByText("Sun", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Next month" })).toBeVisible();
  });

  test("month navigation and deep links work", async ({ page }) => {
    await page.goto("/calendar?month=2027-01");
    await expect(page.getByRole("heading", { name: "January 2027" })).toBeVisible();
    await page.getByRole("link", { name: "Next month" }).click();
    await expect(page).toHaveURL(/month=2027-02/);
    await expect(page.getByRole("heading", { name: "February 2027" })).toBeVisible();
    await page.getByRole("link", { name: "Previous month" }).click();
    await expect(page.getByRole("heading", { name: "January 2027" })).toBeVisible();
    // A junk month param falls back to the current month instead of crashing.
    await page.goto("/calendar?month=zzz");
    const now = new Date();
    await expect(page.getByRole("heading", { name: `${MONTHS[now.getMonth()]} ${now.getFullYear()}` })).toBeVisible();
  });

  test("the footer Explore column has Calendar where Gallery was (board footer, P1)", async ({ page }) => {
    await page.goto("/contact");
    const links = page.locator("footer h2:has-text('Explore') + ul").getByRole("link");
    await expect(links).toHaveText(["Menu", "Book a Table", "Catering", "Calendar", "Contact"]);
    await expect(links.nth(3)).toHaveAttribute("href", "/calendar");
  });

  test("/special-events returns 404 while its admin switch is off (NW02)", async ({ request }) => {
    expect((await request.get("/special-events")).status()).toBe(404);
  });
});
