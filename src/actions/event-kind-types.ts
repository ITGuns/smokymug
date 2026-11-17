"use server";

import { and, eq, ne, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { isMissingSchema, NEEDS_DB_PUSH } from "@/lib/db-errors";
import { revalidateContent } from "@/lib/revalidate";
import { slugify } from "@/lib/slug";
import { eventKindTypeAddInput, eventKindTypeKeyInput, eventKindTypeRenameInput, fieldErrors } from "@/lib/validation";
import { fail, type ActionResult } from "./types";

// Audit F11 (18 Nov 2026): the event types Admin, Calendar picks from. Add, rename,
// and remove only while no event uses the type. The key is made once from the first
// name and never changes, so renaming keeps every event's type and the built-in icons.

const { eventKindTypes } = schema;

async function guard(): Promise<ActionResult<never> | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return fail("Your session has expired. Please sign in again.", { code: "unauthorized" });
  }
}

/** A database without the table (prod before db:push) is told so, never a 500. */
async function withTable<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    if (isMissingSchema(err)) return fail(NEEDS_DB_PUSH, { code: "needs_db_push" });
    throw err;
  }
}

const sameLabel = (label: string) => sql`lower(${eventKindTypes.label}) = lower(${label})`;
const exists = () => fail("Check the highlighted fields.", { fieldErrors: { label: "That type already exists" } });

export async function addEventKindType(input: unknown): Promise<ActionResult<{ key: string }>> {
  const g = await guard();
  if (g) return g;
  const parsed = eventKindTypeAddInput.safeParse(input);
  if (!parsed.success) return fail("Check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const { label } = parsed.data;
  const key = slugify(label).slice(0, 60).replace(/-+$/, "");
  if (!key) return fail("Check the highlighted fields.", { fieldErrors: { label: "Use at least one letter or number" } });

  return withTable(async () => {
    const taken = await db
      .select({ key: eventKindTypes.key })
      .from(eventKindTypes)
      .where(or(eq(eventKindTypes.key, key), sameLabel(label)))
      .limit(1);
    if (taken.length) return exists();
    const [row] = await db
      .insert(eventKindTypes)
      .values({ key, label, displayOrder: sql`(select coalesce(max(display_order), -1) + 1 from event_kind_types)` })
      .onConflictDoNothing()
      .returning({ key: eventKindTypes.key });
    if (!row) return exists();
    revalidateContent();
    return { ok: true, data: { key: row.key } };
  });
}

export async function renameEventKindType(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = eventKindTypeRenameInput.safeParse(input);
  if (!parsed.success) return fail("Check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const { key, label } = parsed.data;

  return withTable(async () => {
    const taken = await db
      .select({ key: eventKindTypes.key })
      .from(eventKindTypes)
      .where(and(ne(eventKindTypes.key, key), sameLabel(label)))
      .limit(1);
    if (taken.length) return exists();
    const [row] = await db
      .update(eventKindTypes)
      .set({ label, updatedAt: new Date().toISOString() })
      .where(eq(eventKindTypes.key, key))
      .returning({ key: eventKindTypes.key });
    if (!row) return fail("That type was removed. Reload the page.", { code: "stale" });
    revalidateContent();
    return { ok: true, data: undefined };
  });
}

/** Removes a type only while no event uses it; the check and the delete are one statement. */
export async function deleteEventKindType(key: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = eventKindTypeKeyInput.safeParse(key);
  if (!parsed.success) return fail("That type was removed. Reload the page.", { code: "stale" });
  const k = parsed.data;

  return withTable(async () => {
    const { rows } = await db.execute(
      sql`delete from event_kind_types where key = ${k} and not exists (select 1 from event_kinds where kind = ${k}) returning key`,
    );
    if (!rows.length) {
      const still = await db.select({ key: eventKindTypes.key }).from(eventKindTypes).where(eq(eventKindTypes.key, k)).limit(1);
      if (still.length) return fail("Events still use this type. Change their type first, then remove it.", { code: "in_use" });
    }
    revalidateContent();
    return { ok: true, data: undefined };
  });
}
