"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { isMissingSchema, NEEDS_DB_PUSH } from "@/lib/db-errors";
import { fieldErrors, inquiryCopiesInput, reservationSettingsInput } from "@/lib/validation";
import { fail, type ActionResult } from "./types";

const { siteSettings } = schema;

async function guard(): Promise<ActionResult<never> | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return fail("Your session has expired. Please sign in again.", { code: "unauthorized" });
  }
}

/** Upserts row 1 with `patch`; a missing table (no db:push yet) is a friendly error, not a crash. */
async function upsert(patch: Partial<typeof siteSettings.$inferInsert>): Promise<ActionResult> {
  try {
    await db
      .insert(siteSettings)
      .values({ id: 1, ...patch })
      .onConflictDoUpdate({ target: siteSettings.id, set: { ...patch, updatedAt: new Date().toISOString() } });
    return { ok: true, data: undefined };
  } catch (err) {
    if (isMissingSchema(err)) return fail(NEEDS_DB_PUSH, { code: "needs_db_push" });
    throw err;
  }
}

/** BK02: the SpotOn reservations link framed on /book, and the native-wizard switch. */
export async function saveReservationSettings(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = reservationSettingsInput.safeParse(input);
  if (!parsed.success) return fail("Check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const res = await upsert({ reservationsUrl: parsed.data.reservationsUrl ?? null, bookingWizard: parsed.data.bookingWizard });
  if (res.ok) revalidatePath("/book");
  return res;
}

/** CA03 dual paper trail: addresses copied on every catering inquiry email. */
export async function saveInquiryCopies(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = inquiryCopiesInput.safeParse(input);
  if (!parsed.success) return fail("Check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  return upsert({ inquiryCc: parsed.data.inquiryCc });
}
