"use server";

import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { revalidateContent } from "@/lib/revalidate";
import { galleryOrderInput } from "@/lib/validation";
import { fail, type ActionResult } from "./types";

// B5 scope: reorder only. Upload, delete, crop, captions, tags and active toggles
// need a separate scope sign-off before they get actions here.

const { galleryImages } = schema;

async function guard(): Promise<ActionResult<never> | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return fail("Your session has expired. Please sign in again.", { code: "unauthorized" });
  }
}

/** Sets display_order to each id's position in `ids`, which must name every gallery image exactly once. */
export async function reorderGalleryImages(ids: number[]): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = galleryOrderInput.safeParse(ids);
  if (!parsed.success) return fail("That photo order isn't valid. Reload the page and try again.", { code: "invalid" });
  const order = parsed.data;

  const matched = await db.transaction(async (tx) => {
    // Row locks serialise two admins saving at once; the set check rejects stale or partial lists.
    const rows = await tx.select({ id: galleryImages.id }).from(galleryImages).for("update");
    const existing = new Set(rows.map((r) => r.id));
    if (rows.length !== order.length || !order.every((id) => existing.has(id))) return false;
    await tx.execute(
      sql`update gallery_images as g set display_order = v.ord - 1, updated_at = now() from unnest(${`{${order.join(",")}}`}::int[]) with ordinality as v(id, ord) where g.id = v.id`,
    );
    return true;
  });
  if (!matched) return fail("The gallery changed since this page loaded. Reload the page and try again.", { code: "stale" });

  revalidateContent();
  return { ok: true, data: undefined };
}
