"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getClock } from "@/lib/availability";
import { countActiveItems } from "@/lib/data/ordering";
import { readBookingSettings } from "@/lib/data/restaurant";
import { isMissingSchema, NEEDS_DB_PUSH } from "@/lib/db-errors";
import { EXPRESS_PATH, HOLIDAY_PATH } from "@/lib/ordering-menus";
import {
  fieldErrors,
  orderIdInput,
  orderingSettingsInput,
  orderItemActiveInput,
  orderItemInput,
  orderItemsOrderInput,
  orderNoteInput,
  orderStatusInput,
} from "@/lib/validation";
import { fail, type ActionResult } from "./types";

/**
 * Phase 2 admin (docs/phase2-ordering-spec.md 4.5, 5.4). Every export is a
 * public endpoint, so each one calls guard() first (requireAdmin checks the
 * signature AND the session version) and validates every id before use.
 */

const { orderingSettings, orderItems, orderRequests, cateringInquiries } = schema;
const now = () => new Date().toISOString();
const GONE_REQUEST = "That request no longer exists. Reload the page.";
const GONE_ITEM = "That item no longer exists. Reload the page.";
const GONE_INQUIRY = "That inquiry no longer exists. Reload the page.";

async function guard(): Promise<ActionResult<never> | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return fail("Your session has expired. Please sign in again.", { code: "unauthorized" });
  }
}

/** A database without the phase 2 tables gets the db:push message instead of a crash. */
async function write<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    if (isMissingSchema(err)) return fail(NEEDS_DB_PUSH, { code: "needs_db_push" });
    throw err;
  }
}

/** Reads are uncached; this only drops any rendered output of the public pages. */
function revalidateOrdering() {
  for (const p of ["/menus", EXPRESS_PATH, HOLIDAY_PATH, "/", "/catering"]) revalidatePath(p);
}

/* ---------------- Settings ---------------- */

export async function saveOrderingSettings(raw: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = orderingSettingsInput.safeParse(raw);
  if (!parsed.success) return fail("Check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const d = parsed.data;

  return write(async () => {
    let patch: Partial<typeof orderingSettings.$inferInsert>;
    if (d.menu === "allDay") {
      patch = { tileImageAllDay: d.tileImage ?? null };
    } else {
      // Spec 2.7: never switch a menu on with nothing to order, or holiday without a live window.
      if (d.enabled && (await countActiveItems(d.menu)) === 0) {
        return fail("Add at least one item first.", { fieldErrors: { enabled: "Add at least one item (and show it on the website) before switching this on." } });
      }
      if (d.menu === "express") {
        patch = { expressEnabled: d.enabled, expressSubtitle: d.subtitle ?? null, expressLeadHours: d.leadHours, tileImageExpress: d.tileImage ?? null };
      } else {
        if (d.enabled) {
          const today = getClock((await readBookingSettings()).timezone).date;
          if (!d.pickupFrom || !d.pickupTo) return fail("Set the pickup dates first.", { fieldErrors: { pickupFrom: "Set the first and last pickup day before switching this on." } });
          if (d.pickupTo < today) return fail("The pickup dates are over.", { fieldErrors: { pickupTo: "The last pickup day has passed. Set new dates." } });
        }
        patch = {
          holidayEnabled: d.enabled,
          holidaySubtitle: d.subtitle ?? null,
          holidayLeadHours: d.leadHours,
          holidayPickupFrom: d.pickupFrom,
          holidayPickupTo: d.pickupTo,
          tileImageHoliday: d.tileImage ?? null,
        };
      }
    }
    await db
      .insert(orderingSettings)
      .values({ id: 1, ...patch })
      .onConflictDoUpdate({ target: orderingSettings.id, set: { ...patch, updatedAt: now() } });
    revalidateOrdering();
    return { ok: true, data: undefined };
  });
}

/* ---------------- Items ---------------- */

export async function saveOrderItem(raw: unknown): Promise<ActionResult<{ id: number }>> {
  const g = await guard();
  if (g) return g;
  const parsed = orderItemInput.safeParse(raw);
  if (!parsed.success) return fail("Check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const { id, ...d } = parsed.data;
  const values = {
    menu: d.menu,
    name: d.name,
    description: d.description ?? null,
    price: d.price,
    priceNote: d.priceNote ?? null,
    image: d.image ?? null,
    imageAlt: d.image ? (d.imageAlt ?? null) : null,
    minQty: d.minQty,
    maxQty: d.maxQty,
    active: d.active,
  };

  return write(async () => {
    if (id) {
      const [row] = await db.update(orderItems).set({ ...values, updatedAt: now() }).where(eq(orderItems.id, id)).returning({ id: orderItems.id });
      if (!row) return fail(GONE_ITEM, { code: "stale" });
      revalidateOrdering();
      return { ok: true, data: row };
    }
    const [{ next }] = await db
      .select({ next: sql<number>`coalesce(max(${orderItems.displayOrder}), -1)::int + 1` })
      .from(orderItems)
      .where(eq(orderItems.menu, d.menu));
    const [row] = await db.insert(orderItems).values({ ...values, displayOrder: next }).returning({ id: orderItems.id });
    revalidateOrdering();
    return { ok: true, data: row };
  });
}

export async function setOrderItemActive(raw: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = orderItemActiveInput.safeParse(raw);
  if (!parsed.success) return fail(GONE_ITEM);
  return write(async () => {
    const [row] = await db.update(orderItems).set({ active: parsed.data.active, updatedAt: now() }).where(eq(orderItems.id, parsed.data.id)).returning({ id: orderItems.id });
    if (!row) return fail(GONE_ITEM, { code: "stale" });
    revalidateOrdering();
    return { ok: true, data: undefined };
  });
}

export async function deleteOrderItem(raw: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = orderIdInput.safeParse(raw);
  if (!parsed.success) return fail(GONE_ITEM);
  return write(async () => {
    // Request lines keep their snapshot; their item_id is set null by the foreign key.
    const [row] = await db.delete(orderItems).where(eq(orderItems.id, parsed.data)).returning({ id: orderItems.id });
    if (!row) return fail(GONE_ITEM, { code: "stale" });
    revalidateOrdering();
    return { ok: true, data: undefined };
  });
}

/** Single-statement reorder (the menu.ts pattern): display_order = position in `ids`, within one menu. */
export async function reorderOrderItems(raw: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = orderItemsOrderInput.safeParse(raw);
  if (!parsed.success) return fail("That order didn't make sense. Reload the page.");
  const { menu, ids } = parsed.data;
  const literal = `{${ids.join(",")}}`;
  return write(async () => {
    await db.execute(
      sql`update order_items as m set display_order = v.ord - 1, updated_at = now() from unnest(${literal}::int[]) with ordinality as v(id, ord) where m.id = v.id and m.menu = ${menu}`,
    );
    revalidateOrdering();
    return { ok: true, data: undefined };
  });
}

/* ---------------- Requests ---------------- */

export async function updateOrderRequestStatus(raw: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = orderStatusInput.safeParse(raw);
  if (!parsed.success) return fail("Pick a status.");
  return write(async () => {
    const [row] = await db.update(orderRequests).set({ status: parsed.data.status, updatedAt: now() }).where(eq(orderRequests.id, parsed.data.id)).returning({ id: orderRequests.id });
    if (!row) return fail(GONE_REQUEST, { code: "stale" });
    return { ok: true, data: undefined };
  });
}

export async function saveOrderRequestNote(raw: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = orderNoteInput.safeParse(raw);
  if (!parsed.success) return fail("Check the note.", { fieldErrors: fieldErrors(parsed.error) });
  return write(async () => {
    const [row] = await db
      .update(orderRequests)
      .set({ internalNotes: parsed.data.note ?? null, updatedAt: now() })
      .where(eq(orderRequests.id, parsed.data.id))
      .returning({ id: orderRequests.id });
    if (!row) return fail(GONE_REQUEST, { code: "stale" });
    return { ok: true, data: undefined };
  });
}

export async function deleteOrderRequest(raw: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = orderIdInput.safeParse(raw);
  if (!parsed.success) return fail(GONE_REQUEST);
  return write(async () => {
    const [row] = await db.delete(orderRequests).where(eq(orderRequests.id, parsed.data)).returning({ id: orderRequests.id });
    if (!row) return fail(GONE_REQUEST, { code: "stale" });
    return { ok: true, data: undefined };
  });
}

/* ---------------- Catering inquiries (P8) ---------------- */

export async function deleteCateringInquiry(raw: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = orderIdInput.safeParse(raw);
  if (!parsed.success) return fail(GONE_INQUIRY);
  const [row] = await db.delete(cateringInquiries).where(eq(cateringInquiries.id, parsed.data)).returning({ id: cateringInquiries.id });
  if (!row) return fail(GONE_INQUIRY, { code: "stale" });
  return { ok: true, data: undefined };
}
