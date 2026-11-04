import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { closePool, query } from "../helpers/db";
import { expectToast, gotoReady } from "../helpers/ui";

// C9 / board H06: admin reviews CRUD and the self-refreshing home section.
// Every row here is a QA placeholder (name starts "QA "), never a real or made-up guest review.

const PREFIX = "QA reviewer ";
const BODY = "QA placeholder text for the automated test. Not a guest review.";
const HOME_LIMIT = 6;

/** Safety net for a run that failed mid-way. Rows removed here skip revalidation, so / can show them until the next admin change. */
const cleanup = () => query(`delete from reviews where reviewer_name like $1`, [`${PREFIX}%`]);

const rowsList = (page: Page) => page.getByRole("list", { name: "Reviews" }).getByRole("listitem");
const homeCards = (page: Page) => page.locator("[data-review-card]");
const nudge = (page: Page) => page.locator("[data-review-nudge]");

/** Good, visible, non-QA reviews: what the home page draws from besides ours. */
async function others() {
  return (
    await query<{ n: number; newest: string | null }>(
      `select count(*)::int as n, max(review_date) as newest from reviews
       where active and (rating is null or rating >= 4) and (reviewer_name is null or reviewer_name not like $1)`,
      [`${PREFIX}%`],
    )
  )[0];
}

const shift = (ymd: string, days: number) => new Date(Date.parse(`${ymd}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

async function fillForm(page: Page, dialog: string, f: { name?: string; source?: string; stars?: string; date?: string; body?: string }) {
  const d = page.getByRole("dialog", { name: dialog });
  if (f.name != null) await d.getByLabel("Reviewer name").fill(f.name);
  if (f.source) await d.getByLabel("Posted on").selectOption(f.source);
  if (f.stars) await d.getByLabel("Stars").selectOption(f.stars);
  if (f.date != null) await d.getByLabel("Review date").fill(f.date);
  if (f.body != null) await d.getByLabel("Review text").fill(f.body);
  return d;
}

async function editRow(page: Page, name: string, f: Parameters<typeof fillForm>[2]) {
  await gotoReady(page, "/admin/reviews");
  await rowsList(page).filter({ hasText: name }).getByRole("button", { name: `Edit review by ${name}` }).click();
  const d = await fillForm(page, "Edit review", f);
  await d.getByRole("button", { name: "Save", exact: true }).click();
  await expectToast(page, "Review saved");
}

test.describe("Admin reviews", () => {
  test.beforeAll(cleanup);
  test.afterAll(async () => {
    await cleanup();
    await closePool();
  });

  test("a new good review leads the home section, edits move it, and delete removes it", async ({ page }) => {
    const before = await others();
    const name = `${PREFIX}${Date.now()}`;

    await gotoReady(page, "/admin/reviews");
    if (!before.newest) await expect(nudge(page)).toContainText("None of the reviews on the home page has a date yet");

    // Add
    await page.getByRole("button", { name: "+ Add review" }).click();
    const today = (await page.getByRole("dialog", { name: "Add a review" }).getByLabel("Review date").getAttribute("max"))!;
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const add = await fillForm(page, "Add a review", { name, source: "Google", stars: "5", date: today, body: BODY });
    await add.getByRole("button", { name: "Add review", exact: true }).click();
    await expectToast(page, "Review added");
    const [created] = await query<{ id: number; rating: number; review_date: string; admin_added: boolean; reviewer_initials: string; active: boolean }>(
      `select id, rating, review_date, admin_added, reviewer_initials, active from reviews where reviewer_name = $1`,
      [name],
    );
    expect(created).toMatchObject({ rating: 5, review_date: today, admin_added: true, reviewer_initials: "QR", active: true });
    await expect(rowsList(page).first()).toContainText(name);
    await expect(rowsList(page).filter({ hasText: name })).toContainText("On home page");
    await expect(nudge(page)).toHaveCount(0);

    // Home: first card, cap kept.
    await gotoReady(page, "/");
    await expect(homeCards(page)).toHaveCount(Math.min(HOME_LIMIT, before.n + 1));
    await expect(homeCards(page).first()).toContainText(name);
    await expect(homeCards(page).first().getByRole("img", { name: "Rated 5 out of 5 stars" })).toBeAttached();

    // Edit to 3 stars: off the home page, flagged in admin.
    await editRow(page, name, { stars: "3" });
    await expect(rowsList(page).filter({ hasText: name })).toContainText("Under 4 stars, not shown");
    await gotoReady(page, "/");
    await expect(homeCards(page)).toHaveCount(Math.min(HOME_LIMIT, before.n));
    await expect(homeCards(page).filter({ hasText: name })).toHaveCount(0);

    // Back to 5 stars but 120 days old: shown again, and admin nudges for a fresher one.
    const old = shift(today, -120);
    await editRow(page, name, { stars: "5", date: old });
    if (!before.newest || before.newest < old) await expect(nudge(page)).toContainText("The newest review on the home page is 120 days old");
    await gotoReady(page, "/admin");
    if (!before.newest || before.newest < shift(today, -90)) await expect(page.getByRole("link", { name: "Add a review →" })).toBeVisible();
    await gotoReady(page, "/");
    await expect(homeCards(page).first()).toContainText(name);

    // Hide, then delete.
    await gotoReady(page, "/admin/reviews");
    await rowsList(page).filter({ hasText: name }).getByRole("button", { name: `Hide review by ${name}` }).click();
    await expectToast(page, "Review hidden");
    await expect(rowsList(page).filter({ hasText: name })).toContainText("Hidden");
    await rowsList(page).filter({ hasText: name }).getByRole("button", { name: `Delete review by ${name}` }).click();
    await page.getByRole("alertdialog", { name: "Delete this review?" }).getByRole("button", { name: "Delete review" }).click();
    await expectToast(page, "Review deleted");
    await expect(rowsList(page).filter({ hasText: name })).toHaveCount(0);
    expect(await query(`select id from reviews where id = $1`, [created.id])).toEqual([]);
    await gotoReady(page, "/");
    await expect(homeCards(page)).toHaveCount(Math.min(HOME_LIMIT, before.n));
    await expect(homeCards(page).filter({ hasText: name })).toHaveCount(0);
  });

  test("the form refuses missing fields and a future date", async ({ page }) => {
    await gotoReady(page, "/admin/reviews");
    await page.getByRole("button", { name: "+ Add review" }).click();
    const d = page.getByRole("dialog", { name: "Add a review" });
    await d.getByRole("button", { name: "Add review", exact: true }).click();
    await expect(d.getByText("Enter the reviewer's name")).toBeVisible();
    await expect(d.getByText("Pick a star rating")).toBeVisible();
    await expect(d.getByText("Paste the review text")).toBeVisible();
    await fillForm(page, "Add a review", { name: `${PREFIX}future`, source: "Yelp", stars: "5", date: "2099-01-01", body: BODY });
    await d.getByRole("button", { name: "Add review", exact: true }).click();
    await expect(d.getByText("The review date can't be in the future")).toBeVisible();
    expect(await query(`select id from reviews where reviewer_name = $1`, [`${PREFIX}future`])).toEqual([]);
  });

  test("the admin reviews page and drawer have no serious or critical axe violations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const scan = async () => {
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).exclude("aside").analyze();
      return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes, e.g. ${v.nodes[0]?.target.join(" ")}`);
    };
    await gotoReady(page, "/admin/reviews");
    expect(await scan()).toEqual([]);
    await page.getByRole("button", { name: "+ Add review" }).click();
    await expect(page.getByRole("dialog", { name: "Add a review" }).getByLabel("Review text")).toBeVisible();
    await page.waitForTimeout(500);
    expect(await scan()).toEqual([]);
  });
});
