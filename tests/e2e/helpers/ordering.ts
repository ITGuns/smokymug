import type { Page } from "@playwright/test";
import { QA, query } from "./db";
import { addDays, todayInZone } from "./dates";

/**
 * Phase 2 ordering helpers. ordering_settings is read uncached by the app, so these
 * writes apply on the next request. Every row the suite makes is tagged: items are
 * named "QA ...", guests use @qa.smokymug.test, so cleanup is exact.
 */

type Settings = Partial<{
  express_enabled: boolean;
  holiday_enabled: boolean;
  express_subtitle: string | null;
  holiday_subtitle: string | null;
  holiday_pickup_from: string | null;
  holiday_pickup_to: string | null;
  express_lead_hours: number;
  holiday_lead_hours: number;
}>;

export async function setOrdering(patch: Settings) {
  const cols = Object.keys(patch);
  const vals = Object.values(patch);
  try {
    await query(
      `insert into ordering_settings (id, ${cols.join(", ")}) values (1, ${cols.map((_, i) => `$${i + 1}`).join(", ")})
       on conflict (id) do update set ${cols.map((c) => `${c} = excluded.${c}`).join(", ")}`,
      vals,
    );
  } catch (err) {
    if ((err as { code?: string }).code === "42P01") throw new Error("ordering_settings is missing on the e2e database. Run `npm run db:push` first.");
    throw err;
  }
}

/** Shipped defaults: both menus off, no subtitles, no window, default leads. */
export const resetOrdering = () =>
  setOrdering({ express_enabled: false, holiday_enabled: false, express_subtitle: null, holiday_subtitle: null, holiday_pickup_from: null, holiday_pickup_to: null, express_lead_hours: 48, holiday_lead_hours: 72 });

export async function insertOrderItem(menu: "express" | "holiday", name: string, o: { price?: number | null; minQty?: number; maxQty?: number; active?: boolean; priceNote?: string | null } = {}) {
  const [row] = await query<{ id: number }>(
    `insert into order_items (menu, name, description, price, price_note, min_qty, max_qty, active, display_order)
     values ($1, $2, $3, $4, $5, $6, $7, $8, 0) returning id`,
    [menu, `${QA.prefix}${name}`, `${QA.prefix}contents for ${name}`, o.price === undefined ? 12000 : o.price, o.priceNote ?? null, o.minQty ?? 1, o.maxQty ?? 10, o.active ?? true],
  );
  return row.id;
}

export async function cleanupOrdering() {
  await query(`delete from order_requests where email like $1`, [`%@${QA.emailDomain}`]);
  await query(`delete from order_items where name like $1`, [`${QA.prefix}%`]);
}

export async function requestsFor(email: string) {
  return query<{ id: number; menu: string; estimated_total: number | null; notify_status: string; pickup_date: string; pickup_time: string; status: string }>(
    `select id, menu, estimated_total, notify_status, pickup_date, pickup_time, status from order_requests where email = $1 order by id`,
    [email],
  );
}

export async function linesFor(requestId: number) {
  return query<{ name: string; quantity: number; unit_price: number | null }>(`select name, quantity, unit_price from order_request_lines where request_id = $1 order by id`, [requestId]);
}

/** The in-memory limiter keys on the first x-forwarded-for hop; a fresh address per test keeps runs independent. */
export async function freshClient(page: Page, n: number) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.77.${n}.${Math.floor(Math.random() * 250) + 1}` });
}

/**
 * Rewrites the next order-request server action call ("posted directly"): the
 * client form validates first, so this is how the suite proves the SERVER
 * re-checks quantities, dates and the honeypot on its own.
 */
export async function rewriteNextSubmit(page: Page, path: string, mutate: (args: Record<string, unknown>) => void) {
  let used = false;
  await page.route(`**${path}`, async (route) => {
    const req = route.request();
    // One rewrite per call; everything else falls through to earlier handlers or the network
    if (used || req.method() !== "POST" || !req.headers()["next-action"]) return route.fallback();
    used = true;
    const args = JSON.parse(req.postData() ?? "[]") as Record<string, unknown>[];
    mutate(args[0]);
    return route.continue({ postData: JSON.stringify(args) });
  });
}

/** A pickup window a few days out, inside the 60-day cap. */
export function holidayWindow() {
  const today = todayInZone();
  return { from: addDays(today, 5), to: addDays(today, 7) };
}
