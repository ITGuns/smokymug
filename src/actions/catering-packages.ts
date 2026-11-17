"use server";

import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { isMissingSchema, NEEDS_DB_PUSH } from "@/lib/db-errors";
import { revalidateContent } from "@/lib/revalidate";
import { cateringPackageIdInput, cateringPackageInput, cateringPackageOrderInput, fieldErrors } from "@/lib/validation";
import { fail, type ActionResult } from "./types";

// Audit F12 (18 Nov 2026): the catering packages on /catering, edited in Admin,
// Catering. Add, edit, show or hide, remove and reorder, like the gallery.

const { cateringPackages } = schema;

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

/** Creates (no id, added at the end) or updates one package. */
export async function saveCateringPackage(input: unknown): Promise<ActionResult<{ id: number }>> {
  const g = await guard();
  if (g) return g;
  const parsed = cateringPackageInput.safeParse(input);
  if (!parsed.success) return fail("Check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const { id, ...data } = parsed.data;

  return withTable(async () => {
    let row: { id: number } | undefined;
    if (id) {
      [row] = await db
        .update(cateringPackages)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(cateringPackages.id, id))
        .returning({ id: cateringPackages.id });
      if (!row) return fail("That package was removed. Reload the page.", { code: "stale" });
    } else {
      [row] = await db
        .insert(cateringPackages)
        .values({ ...data, displayOrder: sql`(select coalesce(max(display_order), -1) + 1 from catering_packages)` })
        .returning({ id: cateringPackages.id });
    }
    revalidateContent();
    return { ok: true, data: { id: row.id } };
  });
}

export async function deleteCateringPackage(id: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = cateringPackageIdInput.safeParse(id);
  if (!parsed.success) return fail("That package was removed. Reload the page.", { code: "stale" });

  return withTable(async () => {
    // Already gone (another tab removed it) counts as done.
    await db.delete(cateringPackages).where(eq(cateringPackages.id, parsed.data));
    revalidateContent();
    return { ok: true, data: undefined };
  });
}

/** Sets display_order to each id's position in `ids`, which must name every package exactly once. */
export async function reorderCateringPackages(ids: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = cateringPackageOrderInput.safeParse(ids);
  if (!parsed.success) return fail("That package order isn't valid. Reload the page and try again.", { code: "invalid" });
  const order = parsed.data;

  return withTable(async () => {
    const matched = await db.transaction(async (tx) => {
      // Row locks serialise two admins saving at once; the set check rejects stale or partial lists.
      const rows = await tx.select({ id: cateringPackages.id }).from(cateringPackages).for("update");
      const existing = new Set(rows.map((r) => r.id));
      if (rows.length !== order.length || !order.every((i) => existing.has(i))) return false;
      await tx.execute(
        sql`update catering_packages as c set display_order = v.ord - 1, updated_at = now() from unnest(${`{${order.join(",")}}`}::int[]) with ordinality as v(id, ord) where c.id = v.id`,
      );
      return true;
    });
    if (!matched) return fail("The packages changed since this page loaded. Reload the page and try again.", { code: "stale" });
    revalidateContent();
    return { ok: true, data: undefined };
  });
}
