"use server";

import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getClock } from "@/lib/availability";
import { readBookingSettings } from "@/lib/data/restaurant";
import { isMissingSchema, NEEDS_DB_PUSH } from "@/lib/db-errors";
import { revalidateContent } from "@/lib/revalidate";
import { initialsFor } from "@/lib/reviews";
import { fieldErrors, reviewIdInput, reviewInput, reviewVisibilityInput } from "@/lib/validation";
import { fail, type ActionResult } from "./types";

// C9 / board H06 (4 Nov 2026): admin CRUD for the home Reviews section.

const { reviews } = schema;
const STALE = "That review no longer exists. Reload the page.";

async function guard(): Promise<ActionResult<never> | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return fail("Your session has expired. Please sign in again.", { code: "unauthorized" });
  }
}

/** Runs a write; a database still missing the C9 columns gets the db:push message instead of a crash. */
async function write<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    if (isMissingSchema(err)) return fail(NEEDS_DB_PUSH, { code: "needs_db_push" });
    throw err;
  }
}

export async function saveReview(input: unknown): Promise<ActionResult<{ id: number }>> {
  const g = await guard();
  if (g) return g;
  const { timezone } = await readBookingSettings();
  const parsed = reviewInput(getClock(timezone).date).safeParse(input);
  if (!parsed.success) return fail("Check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const { id, ...data } = parsed.data;
  const values = { ...data, reviewerInitials: initialsFor(data.reviewerName) };

  return write(async () => {
    if (id) {
      const [row] = await db.update(reviews).set({ ...values, updatedAt: new Date().toISOString() }).where(eq(reviews.id, id)).returning({ id: reviews.id });
      if (!row) return fail(STALE, { code: "stale" });
      revalidateContent();
      return { ok: true, data: row };
    }
    const [row] = await db.insert(reviews).values({ ...values, themes: [], adminAdded: true }).returning({ id: reviews.id });
    revalidateContent();
    return { ok: true, data: row };
  });
}

export async function setReviewVisible(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = reviewVisibilityInput.safeParse(input);
  if (!parsed.success) return fail(STALE);
  const { id, active } = parsed.data;
  const [row] = await db.update(reviews).set({ active, updatedAt: new Date().toISOString() }).where(eq(reviews.id, id)).returning({ id: reviews.id });
  if (!row) return fail(STALE, { code: "stale" });
  revalidateContent();
  return { ok: true, data: undefined };
}

export async function deleteReview(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = reviewIdInput.safeParse(input);
  if (!parsed.success) return fail(STALE);
  await db.delete(reviews).where(eq(reviews.id, parsed.data));
  revalidateContent();
  return { ok: true, data: undefined };
}
