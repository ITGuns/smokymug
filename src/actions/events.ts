"use server";

import { eq, notInArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { isMissingSchema } from "@/lib/db-errors";
import type { EventKind } from "@/lib/event-kinds";
import { revalidateContent } from "@/lib/revalidate";
import { eventInput, fieldErrors, specialEventImagesInput, specialEventsInput } from "@/lib/validation";
import { fail, type ActionResult } from "./types";

const { events, eventKinds, specialEvents, specialEventImages } = schema;

async function guard(): Promise<ActionResult<never> | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return fail("Your session has expired. Please sign in again.", { code: "unauthorized" });
  }
}

/* ---------------- Calendar events (NW01) ---------------- */

/** B6: writes the event's type. false = the event_kinds table is missing on
 *  this database (needs db:push), so the type was not stored. */
async function saveKind(eventId: number, kind: EventKind | null): Promise<boolean> {
  try {
    if (kind) {
      await db.insert(eventKinds).values({ eventId, kind }).onConflictDoUpdate({ target: eventKinds.eventId, set: { kind } });
    } else {
      await db.delete(eventKinds).where(eq(eventKinds.eventId, eventId));
    }
    return true;
  } catch (err) {
    if (isMissingSchema(err)) return false;
    throw err;
  }
}

export async function saveEvent(input: unknown): Promise<ActionResult<{ id: number; kindSkipped: boolean }>> {
  const g = await guard();
  if (g) return g;
  const parsed = eventInput.safeParse(input);
  if (!parsed.success) return fail("Check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const { id, kind, ...data } = parsed.data;
  if (data.startTime && data.endTime && data.endTime <= data.startTime)
    return fail("Check the highlighted fields.", { fieldErrors: { endTime: "End must be after start" } });

  let row: { id: number } | undefined;
  if (id) {
    [row] = await db.update(events).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(events.id, id)).returning({ id: events.id });
    if (!row) return fail("That event no longer exists. Reload the page.", { code: "stale" });
  } else {
    [row] = await db.insert(events).values(data).returning({ id: events.id });
  }
  const kindSaved = await saveKind(row.id, kind);
  revalidateContent();
  return { ok: true, data: { id: row.id, kindSkipped: !kindSaved && kind != null } };
}

export async function deleteEvent(id: number): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  if (!Number.isInteger(id)) return fail("That event no longer exists. Reload the page.");
  await db.delete(events).where(eq(events.id, id));
  revalidateContent();
  return { ok: true, data: undefined };
}

/* ---------------- Special Events page (NW02) ---------------- */

export async function saveSpecialEvents(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = specialEventsInput.safeParse(input);
  if (!parsed.success) return fail("Check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  await db
    .insert(specialEvents)
    .values({ id: 1, ...parsed.data })
    .onConflictDoUpdate({ target: specialEvents.id, set: { ...parsed.data, updatedAt: new Date().toISOString() } });
  revalidateContent();
  return { ok: true, data: undefined };
}

/** Replaces the flyer set: rows keep their id, order = array order. */
export async function saveSpecialEventImages(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = specialEventImagesInput.safeParse(input);
  if (!parsed.success) return fail("Check the image list and try again.", { fieldErrors: fieldErrors(parsed.error) });
  const list = parsed.data;

  await db.transaction(async (tx) => {
    const keep = list.filter((i) => i.id != null).map((i) => i.id!) as number[];
    if (keep.length) await tx.delete(specialEventImages).where(notInArray(specialEventImages.id, keep));
    else await tx.delete(specialEventImages);
    for (const [order, img] of list.entries()) {
      if (img.id != null) {
        await tx
          .update(specialEventImages)
          .set({ file: img.file, alt: img.alt, displayOrder: order, updatedAt: new Date().toISOString() })
          .where(eq(specialEventImages.id, img.id));
      } else {
        await tx.insert(specialEventImages).values({ file: img.file, alt: img.alt, displayOrder: order });
      }
    }
  });
  revalidateContent();
  return { ok: true, data: undefined };
}
