import { expect, test, type Page } from "@playwright/test";
import { cleanupAll, closePool, QA, query } from "../helpers/db";
import { addDays, todayInZone } from "../helpers/dates";
import { cleanupOrdering, holidayWindow, resetOrdering } from "../helpers/ordering";
import { expectToast, gotoReady } from "../helpers/ui";

/**
 * Phase 2 admin (docs/phase2-ordering-spec.md 7.2, admin half): items CRUD and
 * the switches at /admin/menu/ordering, the Orders inbox and detail, the
 * catering inquiries tab (P8), and the signed-out guard.
 */

// Long CRUD walks against the dev server: more than the 90s default per test
test.describe.configure({ mode: "serial", timeout: 240_000 });

test.beforeAll(async () => {
  await cleanupOrdering();
  await resetOrdering();
});
test.afterAll(async () => {
  await resetOrdering();
  await cleanupOrdering();
  await cleanupAll();
  await closePool();
});

const card = (page: Page, title: string) => page.locator("section", { has: page.getByRole("heading", { name: title, exact: true, level: 2 }) });

async function addItem(page: Page, cardTitle: string, name: string, o: { price?: string; max?: string } = {}) {
  await card(page, cardTitle).getByRole("button", { name: "+ Add item" }).click();
  const drawer = page.getByRole("dialog");
  await drawer.locator("#oi-name").fill(name);
  if (o.price !== undefined) await drawer.locator("#oi-price").fill(o.price);
  if (o.max) await drawer.locator("#oi-maxQty").fill(o.max);
  await drawer.getByRole("button", { name: "Add item" }).click();
  await expectToast(page, "Item added");
}

test("items CRUD and the Express switch (refused with no items, live with one)", async ({ page }) => {
  await gotoReady(page, "/admin/menu/ordering");
  const express = card(page, "Express Catering");

  // Switching on with zero active items is refused
  await express.getByRole("switch", { name: "Take Express Catering requests" }).click();
  await express.getByRole("button", { name: "Save Express Catering" }).click();
  await expect(express.getByText("Add at least one item (and show it on the website) before switching this on.")).toBeVisible();
  expect((await query(`select express_enabled from ordering_settings where id = 1`))[0]).toMatchObject({ express_enabled: false });

  // Create with a blank price: "Price on request" in admin and on the public page
  await addItem(page, "Express Catering", "QA Admin Pack", { max: "5" });
  await expect(express.getByRole("listitem").filter({ hasText: "QA Admin Pack" })).toContainText("Price on request");
  await express.getByRole("button", { name: "Save Express Catering" }).click();
  await expectToast(page, "Express Catering saved");
  expect((await query(`select express_enabled from ordering_settings where id = 1`))[0]).toMatchObject({ express_enabled: true });
  await page.goto("/menus/express-catering");
  await expect(page.locator("[data-order-item]").filter({ hasText: "QA Admin Pack" })).toContainText("Price on request");

  // Edit: a price
  await gotoReady(page, "/admin/menu/ordering");
  await express.getByRole("button", { name: "Edit QA Admin Pack" }).click();
  await page.getByRole("dialog").locator("#oi-price").fill("45");
  await page.getByRole("dialog").getByRole("button", { name: "Save item" }).click();
  await expectToast(page, "Item saved");
  await expect(express.getByRole("listitem").filter({ hasText: "QA Admin Pack" })).toContainText("$45");

  // Reorder, hide, delete
  await addItem(page, "Express Catering", "QA Admin Second", { price: "10" });
  await expect(express.getByRole("list", { name: "Express Catering items" }).getByRole("listitem")).toHaveText([/QA Admin Pack/, /QA Admin Second/]);
  await express.getByRole("button", { name: "Move QA Admin Second up" }).click();
  await expect(express.getByRole("list", { name: "Express Catering items" }).getByRole("listitem")).toHaveText([/QA Admin Second/, /QA Admin Pack/]);
  const order = await query<{ name: string }>(`select name from order_items where menu = 'express' and name like 'QA Admin%' order by display_order, id`);
  expect(order.map((r) => r.name)).toEqual(["QA Admin Second", "QA Admin Pack"]);

  await express.getByRole("button", { name: "Hide QA Admin Second" }).click();
  await expectToast(page, "Item hidden");
  await expect(express.getByRole("listitem").filter({ hasText: "QA Admin Second" })).toContainText("Hidden");
  expect((await query(`select active from order_items where name = 'QA Admin Second'`))[0]).toMatchObject({ active: false });

  await express.getByRole("button", { name: "Delete QA Admin Second" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete item" }).click();
  await expectToast(page, "Item deleted");
  await expect(express.getByRole("listitem").filter({ hasText: "QA Admin Second" })).toHaveCount(0);
  expect(await query(`select id from order_items where name = 'QA Admin Second'`)).toHaveLength(0);
});

test("Holiday switch: refused without items, refused without a window, saved with one", async ({ page }) => {
  await gotoReady(page, "/admin/menu/ordering");
  const holiday = card(page, "Holiday Preorders");
  await holiday.getByRole("switch", { name: "Take Holiday Preorders requests" }).click();
  await holiday.getByRole("button", { name: "Save Holiday Preorders" }).click();
  await expect(holiday.getByText("Add at least one item (and show it on the website) before switching this on.")).toBeVisible();

  await addItem(page, "Holiday Preorders", "QA Admin Turkey", { price: "89" });
  await holiday.getByRole("button", { name: "Save Holiday Preorders" }).click();
  await expect(holiday.getByText("Set the first and last pickup day before switching this on.")).toBeVisible();

  const win = holidayWindow();
  await holiday.getByLabel("First pickup day").fill(win.from);
  await holiday.getByLabel("Last pickup day").fill(win.to);
  await holiday.getByLabel("Subtitle").fill("QA back for the holidays");
  await holiday.getByRole("button", { name: "Save Holiday Preorders" }).click();
  await expectToast(page, "Holiday Preorders saved");
  expect((await query(`select holiday_enabled, holiday_pickup_from, holiday_pickup_to, holiday_subtitle from ordering_settings where id = 1`))[0]).toMatchObject({
    holiday_enabled: true,
    holiday_pickup_from: win.from,
    holiday_pickup_to: win.to,
    holiday_subtitle: "QA back for the holidays",
  });
  await page.goto("/menus");
  await expect(page.getByRole("link", { name: "HOLIDAY PREORDERS" })).toHaveAttribute("href", "/menus/holiday-preorders");

  // Both switches back off through the UI
  await gotoReady(page, "/admin/menu/ordering");
  for (const title of ["Express Catering", "Holiday Preorders"]) {
    const c = card(page, title);
    await c.getByRole("switch", { name: `Take ${title} requests` }).click();
    await c.getByRole("button", { name: `Save ${title}` }).click();
    await expectToast(page, `${title} saved`);
  }
  expect((await query(`select express_enabled, holiday_enabled from ordering_settings where id = 1`))[0]).toMatchObject({ express_enabled: false, holiday_enabled: false });
});

async function insertRequest(email: string, pickupDate: string) {
  const [r] = await query<{ id: number }>(
    `insert into order_requests (menu, name, email, phone, pickup_date, pickup_time, notes, estimated_total, idempotency_key, notify_status)
     values ('express', 'QA Admin Guest', $1, '(804) 555-0199', $2, '11:30', 'QA: allergic to peanuts', null, $3, 'off') returning id`,
    [email, pickupDate, `qa-admin-${Date.now()}-${Math.random()}`],
  );
  await query(`insert into order_request_lines (request_id, name, unit_price, quantity) values ($1, 'QA Line A', 4500, 2), ($1, 'QA Line B', null, 1)`, [r.id]);
  return r.id;
}

test("Orders inbox, detail, status, note, delete, retention purge and the dashboard card", async ({ page }) => {
  const email = `qa-admin-order@${QA.emailDomain}`;
  const id = await insertRequest(email, addDays(todayInZone(), 3));
  const old = await insertRequest(`qa-admin-old@${QA.emailDomain}`, addDays(todayInZone(), -200));
  const ref = `EC-${1000 + id}`;

  await gotoReady(page, "/admin");
  const dash = page.locator("section", { has: page.getByRole("heading", { name: "Order requests", exact: true }) });
  await expect(dash.getByRole("link", { name: new RegExp(`^${ref}`) })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: /^Orders/ })).toContainText(/\d/);

  await gotoReady(page, "/admin/orders");
  await expect(page.getByText("Email alerts are not set up. New requests only show here.")).toBeVisible();
  const row = page.locator(`[data-order-row="${ref}"]`);
  await expect(row).toContainText("Not emailed");
  await expect(row).toContainText("2 x QA Line A, 1 x QA Line B");
  await expect(row).toContainText("To confirm");
  // Retention: a pickup 200 days ago was purged when the page opened
  expect(await query(`select id from order_requests where id = $1`, [old])).toHaveLength(0);

  await row.getByRole("link", { name: ref }).click();
  // First hit of a new route compiles on the dev server: allow for it
  await expect(page).toHaveURL(new RegExp(`/admin/orders/${id}$`), { timeout: 60_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(ref, { timeout: 60_000 });
  await expect(page.getByRole("link", { name: "(804) 555-0199" })).toHaveAttribute("href", "tel:+18045550199");
  await expect(page.getByRole("link", { name: email })).toHaveAttribute("href", /^mailto:/);
  await expect(page.getByText("QA: allergic to peanuts")).toBeVisible();
  await expect(page.getByRole("table").getByText("QA Line A", { exact: true })).toBeVisible();

  await page.getByLabel("Status").selectOption("confirmed");
  await page.getByRole("button", { name: "Save status" }).click();
  await expectToast(page, "Status saved");
  expect((await query(`select status from order_requests where id = $1`, [id]))[0]).toMatchObject({ status: "confirmed" });

  await page.getByLabel("Internal note").fill("QA card 4111 1111 1111 1111");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Never store card numbers here.")).toBeVisible();
  await page.getByLabel("Internal note").fill("QA: called, confirmed for pickup");
  await page.getByRole("button", { name: "Save note" }).click();
  await expectToast(page, "Note saved");
  expect((await query(`select internal_notes from order_requests where id = $1`, [id]))[0]).toMatchObject({ internal_notes: "QA: called, confirmed for pickup" });

  await page.getByRole("button", { name: "Delete request" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete request" }).click();
  await expect(page).toHaveURL(/\/admin\/orders$/);
  expect(await query(`select id from order_requests where id = $1`, [id])).toHaveLength(0);
  expect(await query(`select id from order_request_lines where request_id = $1`, [id])).toHaveLength(0);
});

test("Catering inquiries tab: list, detail, delete (P8)", async ({ page }) => {
  const email = `qa-admin-catering@${QA.emailDomain}`;
  const [q] = await query<{ id: number }>(
    `insert into catering_inquiries (name, email, phone, occasion, event_date, guest_count, service_type, message) values ('QA Admin Planner', $1, '(804) 555-0177', 'QA office lunch', null, 30, 'Pickup', 'QA: vegetarian options please') returning id`,
    [email],
  );
  await gotoReady(page, "/admin/orders");
  await page.getByRole("link", { name: "Catering inquiries" }).click();
  await expect(page).toHaveURL(/tab=catering/);
  const row = page.locator(`[data-inquiry-row="${q.id}"]`);
  await expect(row).toContainText("QA office lunch");
  await row.getByRole("link", { name: "QA Admin Planner" }).click();
  await expect(page.getByText("QA: vegetarian options please")).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "Delete inquiry" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete inquiry" }).click();
  await expect(page).toHaveURL(/tab=catering/);
  expect(await query(`select id from catering_inquiries where id = $1`, [q.id])).toHaveLength(0);
});

test("signed out: the ordering admin pages redirect to the login", async ({ playwright, baseURL }) => {
  const anon = await playwright.request.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  for (const p of ["/admin/orders", "/admin/menu/ordering", "/admin/orders/1"]) {
    const res = await anon.get(p, { maxRedirects: 0 });
    expect(res.status(), p).toBe(307);
    expect(res.headers()["location"]).toContain("/admin/login");
  }
  await anon.dispose();
});
