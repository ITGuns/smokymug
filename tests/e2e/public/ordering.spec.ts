import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { closePool, QA, query } from "../helpers/db";
import { addDays, todayInZone } from "../helpers/dates";
import { cleanupOrdering, freshClient, holidayWindow, insertOrderItem, linesFor, requestsFor, resetOrdering, rewriteNextSubmit, setOrdering } from "../helpers/ordering";

/**
 * Phase 2 order requests (docs/phase2-ordering-spec.md 7.2, public half): the
 * /menus tiles and links, Explore Menu with 2 or 3 options, CA01, both forms
 * (happy path, validation, honeypot, quantity cap, lead time, holiday window,
 * switched off mid-session), a11y and hydration on the new pages.
 */

const EXPRESS = "/menus/express-catering";
const HOLIDAY = "/menus/holiday-preorders";
const HYDRATION = /hydrat|did not match|didn't match|server rendered|server html/i;
let n = 0;
const guest = (tag: string) => ({ email: `qa-order-${tag}-${Date.now()}@${QA.emailDomain}`, phone: `(804) 555-${String(1000 + ++n * 37).slice(-4)}` });

// Long CRUD walks against the dev server: more than the 90s default per test
test.describe.configure({ mode: "serial", timeout: 240_000 });

test.beforeAll(async () => {
  await cleanupOrdering();
  await resetOrdering();
});
test.afterAll(async () => {
  await resetOrdering();
  await cleanupOrdering();
  await query(`delete from date_overrides where reason like $1`, [`${QA.prefix}%`]);
  await closePool();
});

/** The form's own alert (Next's route announcer is a role="alert" too). */
const formAlert = (page: Page) => page.locator('form p[role="alert"]');

/** Watches console output for hydration warnings on every page the test opens. */
function watchHydration(page: Page) {
  const msgs: string[] = [];
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && msgs.push(m.text()));
  page.on("pageerror", (e) => msgs.push(e.message));
  return () => msgs.filter((m) => HYDRATION.test(m));
}

// By id: the header's social links carry "Email ..." labels too
async function fillContact(page: Page, g: { email: string; phone: string }) {
  await page.locator("#or-name").fill("QA Guest");
  await page.locator("#or-phone").fill(g.phone);
  await page.locator("#or-email").fill(g.email);
}

/** Picks the first open pickup day (the date input's min) and its first slot. */
async function pickFirstSlot(page: Page) {
  const date = page.locator("#or-date");
  const first = await date.getAttribute("min");
  expect(first).toBeTruthy();
  await date.fill(first!);
  const time = page.locator("#or-time");
  await expect(time).toBeEnabled();
  const value = await time.locator("option").nth(1).getAttribute("value");
  await time.selectOption(value!);
  return { date: first!, time: value! };
}

test("both switches off: tiles, links, Explore Menu, 404s and no CA01 button", async ({ page, request }) => {
  const hydration = watchHydration(page);
  await page.goto("/menus");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("MENUS.");
  const allDay = page.getByRole("link", { name: "ALL DAY CRAFT TEX MEX & BBQ" });
  await expect(allDay).toHaveAttribute("href", "/menu");
  for (const w of ["Breakfast", "Lunch", "Dinner", "Brunch", "Cafe", "Bar"]) await expect(allDay.getByText(w, { exact: true })).toBeVisible();
  const express = page.getByRole("link", { name: "EXPRESS CATERING" });
  await expect(express).toHaveAttribute("href", "/catering");
  await expect(express).toContainText("Breakfast burrito packs. Sandwich Packs. Taco Bars");
  // Holiday off: the tile stays, unlinked, with the off line
  await expect(page.getByRole("link", { name: "HOLIDAY PREORDERS" })).toHaveCount(0);
  const holidayTile = page.locator('[data-tile="holiday"]');
  await expect(holidayTile).toContainText("HOLIDAY PREORDERS");
  await expect(holidayTile).toContainText("Not taking holiday preorders right now.");
  expect(await holidayTile.evaluate((el) => el.tagName)).toBe("DIV");

  // NW03-3: header and footer "Menus" land here; every Order Now stays on /menu (NW03-2)
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Menus" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("footer h2:has-text('Explore') + ul").getByRole("link", { name: "Menus" })).toHaveAttribute("href", "/menus");
  await expect(page.getByRole("banner").getByRole("link", { name: "Order Now" })).toHaveAttribute("href", "/menu");

  expect((await request.get(EXPRESS)).status()).toBe(404);
  expect((await request.get(HOLIDAY)).status()).toBe(404);

  await page.goto("/");
  await page.getByRole("button", { name: "Explore Menu" }).click();
  const drop = page.locator("a", { hasText: /^(Restaurant|Express Catering|Holiday Preorder)$/ });
  await expect(drop).toHaveText(["Restaurant", "Express Catering"]);
  await expect(page.getByRole("link", { name: "Express Catering", exact: true })).toHaveAttribute("href", "/catering");
  await page.keyboard.press("Escape");
  await expect(page.locator("main").getByRole("link", { name: "Order Now" }).first()).toHaveAttribute("href", "/menu");

  await page.goto("/catering");
  await expect(page.getByRole("link", { name: "Plan Your Event" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Order Express Catering Now" })).toHaveCount(0);
  expect(hydration()).toEqual([]);
});

test("express on: tile, Explore option and CA01 point to the page, and a full request is stored", async ({ page }) => {
  const priced = await insertOrderItem("express", "Taco Bar", { price: 12000, maxQty: 10, priceNote: "Serves 10" });
  const onRequest = await insertOrderItem("express", "Burrito Pack", { price: null, minQty: 2, maxQty: 20 });
  await setOrdering({ express_enabled: true });
  const hydration = watchHydration(page);

  await page.goto("/menus");
  await expect(page.getByRole("link", { name: "EXPRESS CATERING" })).toHaveAttribute("href", EXPRESS);
  await page.goto("/");
  await page.getByRole("button", { name: "Explore Menu" }).click();
  await expect(page.getByRole("link", { name: "Express Catering", exact: true })).toHaveAttribute("href", EXPRESS);
  await page.keyboard.press("Escape");
  await page.goto("/catering");
  // CA01: between Plan Your Event and See services
  const hero = page.locator("section").first();
  await expect(hero.getByRole("link")).toHaveText([/Plan Your Event/, /Order Express Catering Now/, /See services/]);
  // The full label (334px on one line) wraps at 320 instead of running out of the overflow-hidden hero
  await page.setViewportSize({ width: 320, height: 740 });
  const ca01 = (await hero.getByRole("link", { name: "Order Express Catering Now" }).boundingBox())!;
  expect(ca01.x + ca01.width).toBeLessThanOrEqual(320);
  await page.setViewportSize({ width: 1360, height: 900 });
  await hero.getByRole("link", { name: "Order Express Catering Now" }).click();
  await expect(page).toHaveURL(new RegExp(`${EXPRESS}$`));

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Express Catering");
  await expect(page.getByText("Order requests only. Nothing is charged online: you pay at pickup or through SpotOn.")).toBeVisible();
  const pricedRow = page.locator(`[data-order-item="${priced}"]`);
  const requestRow = page.locator(`[data-order-item="${onRequest}"]`);
  await expect(pricedRow).toContainText("$120");
  await expect(requestRow).toContainText("Price on request");

  // + from 0 jumps to the item's minimum
  await page.getByRole("button", { name: "More QA Burrito Pack" }).click();
  await expect(page.getByLabel("Quantity for QA Burrito Pack")).toHaveValue("2");
  await expect(page.locator("[data-order-estimate]")).toHaveText("Some items are priced on request. We'll confirm the total.");
  await page.getByRole("button", { name: "Fewer QA Burrito Pack" }).click();
  await expect(page.getByLabel("Quantity for QA Burrito Pack")).toHaveValue("0");

  await page.getByLabel("Quantity for QA Taco Bar").fill("2");
  // One money format on the page: money() as on the item rows ($120), not forced cents
  await expect(page.locator("[data-order-estimate]")).toHaveText("Estimated total before tax: $240");

  const g = guest("express");
  await freshClient(page, 1);
  await fillContact(page, g);
  const slot = await pickFirstSlot(page);
  // 48h lead: the first open day is at least two days out
  expect(slot.date >= addDays(todayInZone(), 2)).toBe(true);
  await page.locator("#or-notes").fill("QA: no onions please");
  await page.getByRole("button", { name: "Send request" }).click();

  const done = page.locator("[data-order-confirmation]");
  const heading = done.getByRole("heading", { name: "Request received." });
  await expect(heading).toBeFocused();
  // Scrolled in under the fixed header (scroll-mt), and shown at once for reduced motion / paused
  const header = (await page.locator("header.fixed").boundingBox())!;
  await expect.poll(async () => (await heading.boundingBox())!.y).toBeGreaterThanOrEqual(header.y + header.height);
  await expect(done).toHaveAttribute("data-reveal", "");
  await expect(done).toContainText("You pay at pickup or through SpotOn.");
  const ref = await done.locator("[data-order-reference]").textContent();
  expect(ref).toMatch(/^EC-\d+$/);

  const rows = await requestsFor(g.email);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ menu: "express", estimated_total: 24000, notify_status: "off", pickup_date: slot.date, pickup_time: slot.time, status: "new" });
  expect(ref).toBe(`EC-${1000 + rows[0].id}`);
  expect(await linesFor(rows[0].id)).toEqual([{ name: "QA Taco Bar", quantity: 2, unit_price: 12000 }]);
  expect(hydration()).toEqual([]);
});

test("client validation: no items, missing contact, a closed day", async ({ page }) => {
  await freshClient(page, 2);
  await page.goto(EXPRESS);
  await page.getByRole("button", { name: "Send request" }).click();
  // Nothing in the panel is highlighted for an empty pick, so the alert names the problem
  await expect(formAlert(page)).toHaveText("Pick at least one item");
  await expect(page.getByText("Pick at least one item")).toHaveCount(2);
  await expect(page.getByText("Name is required")).toBeVisible();
  await expect(page.getByText("Enter a valid email")).toBeVisible();
  await expect(page.getByText("Pick a pickup date")).toBeVisible();

  // A past day, and a day closed by a QA date override, offer no slots
  await page.locator("#or-date").fill(addDays(todayInZone(), -1));
  await expect(page.locator("#or-time")).toBeDisabled();
  const closed = addDays(todayInZone(), 4);
  await query(`insert into date_overrides (date, closed, reason) values ($1, true, 'QA closed for pickup test') on conflict (date) do nothing`, [closed]);
  await page.reload();
  await page.locator("#or-date").fill(closed);
  await expect(page.locator("#or-time option").first()).toHaveText("No pickup that day");
  await page.getByLabel("Quantity for QA Taco Bar").fill("1");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(formAlert(page)).toHaveText("Please check the highlighted fields.");
  await expect(page.getByText("No pickup that day. Pick another date.")).toBeVisible();
  await query(`delete from date_overrides where reason = 'QA closed for pickup test'`);
});

test("server re-checks: quantity cap, item max, lead time, an item changed after load", async ({ page }) => {
  const g = guest("server");
  await freshClient(page, 3);
  await page.goto(EXPRESS);
  await page.getByLabel("Quantity for QA Taco Bar").fill("2");
  await fillContact(page, g);
  await pickFirstSlot(page);

  // Over the 100 hard cap (posted directly): zod refuses it on the line
  await rewriteNextSubmit(page, EXPRESS, (a) => ((a.lines as { quantity: number }[])[0].quantity = 150));
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(formAlert(page)).toHaveText("Please check the highlighted fields.");
  await expect(page.getByText("Up to 100 of one item")).toBeVisible();

  // Above this item's own max (10), still under the cap: the DB re-check refuses it
  await rewriteNextSubmit(page, EXPRESS, (a) => ((a.lines as { quantity: number }[])[0].quantity = 15));
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(formAlert(page)).toHaveText("One of these items just changed. Reload the page and try again.");

  // Inside the 48h lead time (tomorrow at noon): the server's pickup rules refuse it
  await rewriteNextSubmit(page, EXPRESS, (a) => {
    a.pickupDate = addDays(todayInZone(), 1);
    a.pickupTime = "12:00";
  });
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(formAlert(page)).toHaveText("That pickup time isn't available. Pick another.");

  // The item is switched off between page load and submit
  await query(`update order_items set active = false where name = 'QA Taco Bar'`);
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(formAlert(page)).toHaveText("One of these items just changed. Reload the page and try again.");
  await query(`update order_items set active = true where name = 'QA Taco Bar'`);

  expect(await requestsFor(g.email)).toHaveLength(0);
});

test("honeypot filled: the same success screen, nothing stored", async ({ page }) => {
  const g = guest("bot");
  await freshClient(page, 4);
  await page.goto(EXPRESS);
  await page.getByLabel("Quantity for QA Taco Bar").fill("1");
  await fillContact(page, g);
  await pickFirstSlot(page);
  await rewriteNextSubmit(page, EXPRESS, (a) => (a.website = "http://spam.example"));
  await page.getByRole("button", { name: "Send request" }).click();
  const done = page.locator("[data-order-confirmation]");
  await expect(done.getByRole("heading", { name: "Request received." })).toBeVisible();
  await expect(done.locator("[data-order-reference]")).toHaveCount(0);
  expect(await requestsFor(g.email)).toHaveLength(0);
});

test("holiday on with a window: third Explore option, window enforced, switched off mid-session", async ({ page }) => {
  await insertOrderItem("holiday", "Smoked Turkey", { price: 8900, maxQty: 5 });
  const win = holidayWindow();
  await setOrdering({ holiday_enabled: true, holiday_pickup_from: win.from, holiday_pickup_to: win.to, holiday_subtitle: "QA back for the holidays" });
  const hydration = watchHydration(page);

  await page.goto("/");
  await page.getByRole("button", { name: "Explore Menu" }).click();
  await expect(page.locator("a", { hasText: /^(Restaurant|Express Catering|Holiday Preorder)$/ })).toHaveText(["Restaurant", "Express Catering", "Holiday Preorder"]);
  await expect(page.getByRole("link", { name: "Holiday Preorder", exact: true })).toHaveAttribute("href", HOLIDAY);
  await page.keyboard.press("Escape");

  await page.goto("/menus");
  const tile = page.getByRole("link", { name: "HOLIDAY PREORDERS" });
  await expect(tile).toHaveAttribute("href", HOLIDAY);
  await expect(tile).toContainText("QA back for the holidays");
  await tile.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Holiday Preorders");
  await expect(page.locator("#or-date")).toHaveAttribute("min", win.from);
  await expect(page.locator("#or-date")).toHaveAttribute("max", win.to);

  const g = guest("holiday");
  await freshClient(page, 5);
  await page.getByLabel("Quantity for QA Smoked Turkey").fill("1");
  await fillContact(page, g);
  await pickFirstSlot(page);
  // A day after the window (posted directly) is refused...
  await rewriteNextSubmit(page, HOLIDAY, (a) => (a.pickupDate = addDays(win.to, 1)));
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(formAlert(page)).toHaveText("That pickup time isn't available. Pick another.");
  // ...the day inside it is accepted
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.locator("[data-order-reference]")).toHaveText(/^HP-\d+$/);
  expect(await requestsFor(g.email)).toHaveLength(1);

  // Staff switch holiday off while a guest has the page open: the submit is refused
  const g2 = guest("holiday-late");
  await page.goto(HOLIDAY);
  await page.getByLabel("Quantity for QA Smoked Turkey").fill("1");
  await fillContact(page, g2);
  await pickFirstSlot(page);
  await setOrdering({ holiday_enabled: false });
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(formAlert(page)).toContainText("Holiday preorders are closed right now.");
  expect(await requestsFor(g2.email)).toHaveLength(0);
  expect(hydration()).toEqual([]);
});

test("accessibility: both ordering pages (switches on) have no serious or critical violations", async ({ page }) => {
  const win = holidayWindow();
  await setOrdering({ express_enabled: true, holiday_enabled: true, holiday_pickup_from: win.from, holiday_pickup_to: win.to });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of [EXPRESS, HOLIDAY]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    // Scan with a validation error showing too, so the error styling is checked
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(formAlert(page)).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    const summary = blocking.map((v) => `${path} ${v.id} (${v.impact}): ${v.nodes.length} nodes, e.g. ${v.nodes[0]?.target.join(" ")}`);
    expect(summary, summary.join("\n")).toEqual([]);
  }
  await resetOrdering();
});

test("a long menu: the request form still reveals with motion on", async ({ page }) => {
  // 15 items make the form taller than 4 phone screens: a 25% in-view threshold could never be met
  for (let i = 1; i <= 15; i++) await insertOrderItem("express", `Long Pack ${String(i).padStart(2, "0")}`, { price: 1000 });
  await setOrdering({ express_enabled: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(EXPRESS);
  const form = page.locator("main form");
  expect((await form.boundingBox())!.height).toBeGreaterThan(4 * 844);
  await page.getByRole("button", { name: "Send request" }).scrollIntoViewIfNeeded();
  await expect.poll(() => form.evaluate((f) => getComputedStyle(f.closest("[data-reveal]")!).opacity)).toBe("1");
  await query(`delete from order_items where name like $1`, [`${QA.prefix}Long Pack%`]);
  await resetOrdering();
});
