import "server-only";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db, schema } from "@/db";
import type { SiteEvent, SpecialEventImage, SpecialEventsSettings } from "@/db/schema";
import { isMissingSchema } from "@/lib/db-errors";
import { isEventKind, type EventKind } from "@/lib/event-kinds";
import { CONTENT_TAG } from "./restaurant";

const { events, specialEvents, specialEventImages } = schema;

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

/** B6: event id → type. Uncached and defensive: a database without the
 *  event_kinds table (prod before db:push) shows every event untyped. */
export async function readEventKinds(): Promise<Record<number, EventKind>> {
  try {
    const rows = await db.select().from(schema.eventKinds);
    const out: Record<number, EventKind> = {};
    for (const r of rows) if (isEventKind(r.kind)) out[r.eventId] = r.kind;
    return out;
  } catch (err) {
    if (isMissingSchema(err)) return {};
    throw err;
  }
}

/* ---- Cached reads (public site), invalidated via revalidateTag(CONTENT_TAG) ---- */

export const getEventsBetween = cache(
  unstable_cache((from: string, to: string) => readEventsBetween(from, to), ["events-range"], { tags: [CONTENT_TAG] }),
);
export const getSpecialEvents = cache(unstable_cache(() => readSpecialEvents(), ["special-events"], { tags: [CONTENT_TAG] }));
