import "server-only";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db, schema } from "@/db";
import type { SiteEvent, SpecialEventImage, SpecialEventsSettings } from "@/db/schema";
import { isMissingSchema } from "@/lib/db-errors";
import { isEventIcon } from "@/lib/event-icons";
import { EVENT_KINDS, type KindOption } from "@/lib/event-kinds";
import { CONTENT_TAG } from "./restaurant";

const { events, specialEvents, specialEventImages, dateOverrides } = schema;

/* ---- Uncached reads (admin) ---- */

export async function readEvents(): Promise<SiteEvent[]> {
  return db.select().from(events).orderBy(asc(events.date), asc(events.startTime), asc(events.id));
}

export async function readEventsBetween(from: string, to: string): Promise<SiteEvent[]> {
  return db
    .select()
    .from(events)
    .where(and(eq(events.active, true), gte(events.date, from), lte(events.date, to)))
    .orderBy(asc(events.date), asc(events.startTime), asc(events.id));
}

/** Settings row 1; a database that predates the table row (db:push without
 *  reseed) behaves as "switch off" instead of crashing the page. */
export async function readSpecialEvents(): Promise<{ settings: SpecialEventsSettings; images: SpecialEventImage[] }> {
  const [row] = await db.select().from(specialEvents).where(eq(specialEvents.id, 1)).limit(1);
  const settings =
    row ??
    ({ id: 1, enabled: false, title: "Specials & Events", subtitle: null, createdAt: "", updatedAt: "" } satisfies SpecialEventsSettings);
  const images = await db.select().from(specialEventImages).orderBy(asc(specialEventImages.displayOrder), asc(specialEventImages.id));
  return { settings, images };
}

/** B6: event id → type key. Uncached and defensive: a database without the
 *  event_kinds table (prod before db:push) shows every event untyped. Keys are
 *  checked against the type list by the caller (F11). */
export async function readEventKinds(): Promise<Record<number, string>> {
  try {
    const rows = await db.select().from(schema.eventKinds);
    return Object.fromEntries(rows.map((r) => [r.eventId, r.kind]));
  } catch (err) {
    if (isMissingSchema(err)) return {};
    throw err;
  }
}

/** 19 Nov 2026: event id to its own calendar icon (a name on the list in
 *  event-icons.ts). Uncached and defensive like readEventKinds: without the
 *  event_icons table (prod before db:push) no event has one. Rows Admin cleared
 *  (null) and names no longer on the list are left out. */
export async function readEventIcons(): Promise<Record<number, string>> {
  try {
    const rows = await db.select().from(schema.eventIcons);
    return Object.fromEntries(rows.flatMap((r) => (isEventIcon(r.icon) ? [[r.eventId, r.icon]] : [])));
  } catch (err) {
    if (isMissingSchema(err)) return {};
    throw err;
  }
}

/** F11: the event types from Admin, Calendar, in their order. Uncached (the
 *  calendar pages render per request). A database without the table (prod
 *  before db:push) gets the four built-in types, and available = false. */
export async function readEventKindTypes(): Promise<{ types: KindOption[]; available: boolean }> {
  try {
    const types = await db
      .select({ key: schema.eventKindTypes.key, label: schema.eventKindTypes.label })
      .from(schema.eventKindTypes)
      .orderBy(asc(schema.eventKindTypes.displayOrder), asc(schema.eventKindTypes.key));
    return { types, available: true };
  } catch (err) {
    if (isMissingSchema(err)) return { types: EVENT_KINDS.map(({ key, label }) => ({ key, label })), available: false };
    throw err;
  }
}

/** F10: Hours date overrides in a range, for closed days on the public calendar.
 *  Uncached on purpose: saving an override in Admin, Hours does not touch the content tag. */
export async function readDateOverridesBetween(
  from: string,
  to: string,
): Promise<{ date: string; closed: boolean; reason: string | null }[]> {
  return db
    .select({ date: dateOverrides.date, closed: dateOverrides.closed, reason: dateOverrides.reason })
    .from(dateOverrides)
    .where(and(gte(dateOverrides.date, from), lte(dateOverrides.date, to)))
    .orderBy(asc(dateOverrides.date));
}

/* ---- Cached reads (public site), invalidated via revalidateTag(CONTENT_TAG) ---- */

export const getEventsBetween = cache(
  unstable_cache((from: string, to: string) => readEventsBetween(from, to), ["events-range"], { tags: [CONTENT_TAG] }),
);
export const getSpecialEvents = cache(unstable_cache(() => readSpecialEvents(), ["special-events"], { tags: [CONTENT_TAG] }));
