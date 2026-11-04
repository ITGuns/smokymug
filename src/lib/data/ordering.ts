import "server-only";
import { and, asc, desc, eq, gte, inArray, lt, lte, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import type { CateringInquiry, Hours, OrderItem, OrderMenu, OrderRequest, OrderRequestLine, OrderRequestStatus, OrderingSettingsRow } from "@/db/schema";
import type { Clock } from "@/lib/availability";
import { readDateOverrides } from "@/lib/data/booking";
import { isMissingSchema } from "@/lib/db-errors";
import { RETENTION_DAYS } from "@/lib/ordering";
import { PICKUP_MAX_DAYS_AHEAD, type PickupCtx } from "@/lib/pickup";

/**
 * Phase 2 ordering reads (docs/phase2-ordering-spec.md 3.3). Read uncached (one
 * tiny row per request) so a switch or an e2e write applies at once, and read
 * defensively: while a table is missing (prod before `db:push`) both menus
 * count as OFF, lists are empty, and no public page throws.
 */

const { orderingSettings, orderItems, orderRequests, orderRequestLines, cateringInquiries } = schema;

/** Board copy (NW03 sketch), used while the admin subtitle is empty. */
export const EXPRESS_SUBTITLE_DEFAULT = "Breakfast burrito packs. Sandwich Packs. Taco Bars";
export const HOLIDAY_OFF_TEXT = "Not taking holiday preorders right now.";
/** Dan's own photos already in /public/images (spec 2.4, G5). */
export const TILE_DEFAULTS = {
  allDay: "/images/bbq-platter-mac.jpg",
  express: "/images/catering-taco-platter.png",
  holiday: "/images/catering-pork-butt.png",
} as const;

export type OrderingSettings = {
  /** false = the ordering_settings table does not exist on this database yet */
  available: boolean;
  /** The stored switches, as admin set them. */
  expressEnabled: boolean;
  holidayEnabled: boolean;
  /** What the site acts on: holidayOn is also false while the window is missing or over. */
  expressOn: boolean;
  holidayOn: boolean;
  expressSubtitle: string;
  holidaySubtitle: string;
  expressLeadHours: number;
  holidayLeadHours: number;
  holidayPickupFrom: string | null;
  holidayPickupTo: string | null;
  tiles: { allDay: string; express: string; holiday: string };
  /** The raw row for admin forms (null = never saved). */
  row: OrderingSettingsRow | null;
};

/** Pure: row (or none) + today in the restaurant timezone -> settings. Exported for unit tests. */
export function toOrderingSettings(row: OrderingSettingsRow | null, today: string, available = true): OrderingSettings {
  const from = row?.holidayPickupFrom ?? null;
  const to = row?.holidayPickupTo ?? null;
  const holidayEnabled = row?.holidayEnabled ?? false;
  return {
    available,
    expressEnabled: row?.expressEnabled ?? false,
    holidayEnabled,
    expressOn: available && (row?.expressEnabled ?? false),
    holidayOn: available && holidayEnabled && !!from && !!to && to >= today,
    expressSubtitle: row?.expressSubtitle ?? EXPRESS_SUBTITLE_DEFAULT,
    holidaySubtitle: row?.holidaySubtitle ?? "",
    expressLeadHours: row?.expressLeadHours ?? 48,
    holidayLeadHours: row?.holidayLeadHours ?? 72,
    holidayPickupFrom: from,
    holidayPickupTo: to,
    tiles: {
      allDay: row?.tileImageAllDay ?? TILE_DEFAULTS.allDay,
      express: row?.tileImageExpress ?? TILE_DEFAULTS.express,
      holiday: row?.tileImageHoliday ?? TILE_DEFAULTS.holiday,
    },
    row: row ?? null,
  };
}

export async function readOrderingSettings(today: string): Promise<OrderingSettings> {
  try {
    const [row] = await db.select().from(orderingSettings).where(eq(orderingSettings.id, 1)).limit(1);
    return toOrderingSettings(row ?? null, today);
  } catch (err) {
    if (isMissingSchema(err)) return toOrderingSettings(null, today, false);
    throw err;
  }
}

/** Runs a read; a missing table gives `fallback` instead of an error. */
async function orFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isMissingSchema(err)) return fallback;
    throw err;
  }
}

export async function readOrderItems(menu: OrderMenu, opts: { activeOnly?: boolean } = {}): Promise<OrderItem[]> {
  return orFallback(
    () =>
      db
        .select()
        .from(orderItems)
        .where(opts.activeOnly ? and(eq(orderItems.menu, menu), eq(orderItems.active, true)) : eq(orderItems.menu, menu))
        .orderBy(asc(orderItems.displayOrder), asc(orderItems.id)),
    [],
  );
}

/** Spec 5.1: public pages get only public item fields. */
export type PublicOrderItem = Pick<OrderItem, "id" | "name" | "description" | "price" | "priceNote" | "image" | "imageAlt" | "minQty" | "maxQty">;
export async function readPublicOrderItems(menu: OrderMenu): Promise<PublicOrderItem[]> {
  const rows = await readOrderItems(menu, { activeOnly: true });
  return rows.map(({ id, name, description, price, priceNote, image, imageAlt, minQty, maxQty }) => ({ id, name, description, price, priceNote, image, imageAlt, minQty, maxQty }));
}

/** Active items of one menu among `ids` (the submit action's re-check). */
export async function readActiveItemsByIds(menu: OrderMenu, ids: number[]): Promise<OrderItem[]> {
  if (!ids.length) return [];
  return db
    .select()
    .from(orderItems)
    .where(and(eq(orderItems.menu, menu), eq(orderItems.active, true), inArray(orderItems.id, ids)));
}

export async function countActiveItems(menu: OrderMenu): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(orderItems)
    .where(and(eq(orderItems.menu, menu), eq(orderItems.active, true)));
  return row?.n ?? 0;
}

/** Pickup rules context for one menu (spec 4.2). */
export async function loadPickupCtx(menu: OrderMenu, s: OrderingSettings, hours: Hours[], clock: Clock): Promise<PickupCtx> {
  const overrides = await readDateOverrides(clock.date);
  return {
    // Pickup reads only the store rows; the ordering form receives just these.
    hours: hours.filter((h) => h.category === "store"),
    // The form gets these as props: drop the staff-written reason ("Private event ...")
    overrides: overrides.map((o) => ({ ...o, reason: null })),
    clock,
    leadHours: menu === "express" ? s.expressLeadHours : s.holidayLeadHours,
    maxDaysAhead: PICKUP_MAX_DAYS_AHEAD,
    window: menu === "holiday" && s.holidayPickupFrom && s.holidayPickupTo ? { from: s.holidayPickupFrom, to: s.holidayPickupTo } : null,
  };
}

/* ---------------- Admin: requests ---------------- */

/** null = the order tables do not exist yet (admin shows the db:push note, the badge shows nothing). */
export async function countNewOrderRequests(): Promise<number | null> {
  return orFallback(async () => {
    const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(orderRequests).where(eq(orderRequests.status, "new"));
    return row?.n ?? 0;
  }, null);
}

export type OrderRequestWithLines = OrderRequest & { lines: OrderRequestLine[] };

export type OrderFilters = { statuses: OrderRequestStatus[]; menu: OrderMenu | null; from: string | null; to: string | null };

async function withLines(requests: OrderRequest[]): Promise<OrderRequestWithLines[]> {
  if (!requests.length) return [];
  const lines = await db
    .select()
    .from(orderRequestLines)
    .where(inArray(orderRequestLines.requestId, requests.map((r) => r.id)))
    .orderBy(asc(orderRequestLines.id));
  return requests.map((r) => ({ ...r, lines: lines.filter((l) => l.requestId === r.id) }));
}

/** Requests inbox; null = tables missing. Capped at 500 rows (filters narrow it). */
export async function readOrderRequests(f: OrderFilters): Promise<OrderRequestWithLines[] | null> {
  return orFallback(async () => {
    const where: SQL[] = [];
    if (f.statuses.length) where.push(inArray(orderRequests.status, f.statuses));
    if (f.menu) where.push(eq(orderRequests.menu, f.menu));
    if (f.from) where.push(gte(orderRequests.pickupDate, f.from));
    if (f.to) where.push(lte(orderRequests.pickupDate, f.to));
    const rows = await db
      .select()
      .from(orderRequests)
      .where(where.length ? and(...where) : undefined)
      .orderBy(asc(orderRequests.pickupDate), asc(orderRequests.pickupTime), desc(orderRequests.id))
      .limit(500);
    return withLines(rows);
  }, null);
}

export async function readOrderRequest(id: number): Promise<OrderRequestWithLines | null> {
  return orFallback(async () => {
    const [row] = await db.select().from(orderRequests).where(eq(orderRequests.id, id)).limit(1);
    if (!row) return null;
    const [full] = await withLines([row]);
    return full;
  }, null);
}

/** Dashboard: next open pickups from today. null = tables missing. */
export async function readUpcomingPickups(today: string, limit = 5): Promise<OrderRequest[] | null> {
  return orFallback(
    () =>
      db
        .select()
        .from(orderRequests)
        .where(and(inArray(orderRequests.status, ["new", "confirmed"]), gte(orderRequests.pickupDate, today)))
        .orderBy(asc(orderRequests.pickupDate), asc(orderRequests.pickupTime))
        .limit(limit),
    null,
  );
}

/** Spec 3.5: requests whose pickup was more than 180 days ago go, with their lines. Runs when admin opens Orders. */
export async function purgeExpiredOrderRequests(today: string): Promise<number> {
  const [y, m, d] = today.split("-").map(Number);
  const cutoff = new Date(Date.UTC(y, m - 1, d - RETENTION_DAYS)).toISOString().slice(0, 10);
  return orFallback(async () => (await db.delete(orderRequests).where(lt(orderRequests.pickupDate, cutoff)).returning({ id: orderRequests.id })).length, 0);
}

/* ---------------- Admin: catering inquiries (P8) ---------------- */

export async function readCateringInquiries(): Promise<CateringInquiry[]> {
  return db.select().from(cateringInquiries).orderBy(desc(cateringInquiries.createdAt), desc(cateringInquiries.id)).limit(500);
}

export async function readCateringInquiry(id: number): Promise<CateringInquiry | null> {
  const [row] = await db.select().from(cateringInquiries).where(eq(cateringInquiries.id, id)).limit(1);
  return row ?? null;
}
