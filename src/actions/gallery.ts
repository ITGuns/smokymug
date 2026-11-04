"use server";

import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { revalidateContent } from "@/lib/revalidate";
import { readImageUpload, uploadNameFromPath, uploadPath } from "@/lib/uploads";
import { fieldErrors, galleryOrderInput, galleryPhotoEditInput, galleryPhotoIdInput, galleryPhotoNewInput } from "@/lib/validation";
import { fail, type ActionResult } from "./types";

// Admin gallery CRUD (4 Nov 2026, full-CRUD standing order): add, edit
// (description, category, show/hide), remove and reorder. Crop and captions are not built.

const { galleryImages, uploads, specialEventImages, menuItems, restaurantInfo, events } = schema;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

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

/**
 * Adds one photo at the end of the order. FormData: file, alt, tag, active ("true"/"false"),
 * width, height. The file goes into `uploads` (same checks as menu photos and flyers) and the
 * gallery row is written in the same transaction, so a failed save leaves no orphaned file.
 */
export async function addGalleryImage(formData: FormData): Promise<ActionResult<{ id: number }>> {
  const g = await guard();
  if (g) return g;
  const parsed = galleryPhotoNewInput.safeParse({
    alt: formData.get("alt"),
    tag: formData.get("tag"),
    active: formData.get("active") !== "false",
    width: formData.get("width"),
    height: formData.get("height"),
  });
  if (!parsed.success) return fail("Please check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const file = await readImageUpload(formData.get("file"));
  if (!file.ok) return fail(file.error, { fieldErrors: { file: file.error } });
  const d = parsed.data;

  const id = await db.transaction(async (tx) => {
    await tx.insert(uploads).values(file.upload);
    const { rows } = await tx.execute<{ m: number }>(sql`select coalesce(max(display_order), -1)::int as m from gallery_images`);
    const [row] = await tx
      .insert(galleryImages)
      .values({ file: uploadPath(file.upload.name), alt: d.alt, tag: d.tag, width: d.width, height: d.height, active: d.active, displayOrder: (rows[0]?.m ?? -1) + 1 })
      .returning({ id: galleryImages.id });
    return row.id;
  });
  revalidateContent();
  return { ok: true, data: { id } };
}

export async function updateGalleryImage(input: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = galleryPhotoEditInput.safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const { id, alt, tag, active } = parsed.data;
  const updated = await db.update(galleryImages).set({ alt, tag, active, updatedAt: new Date().toISOString() }).where(eq(galleryImages.id, id)).returning({ id: galleryImages.id });
  if (!updated.length) return fail("That photo was removed. Reload the page.", { code: "stale" });
  revalidateContent();
  return { ok: true, data: undefined };
}

/**
 * Removes the gallery row. Seeded photos point at static files under /public/images, and
 * nothing here touches the file system. An uploaded photo's bytes in `uploads` are deleted
 * too, unless another record still mentions that file. Already-removed ids succeed quietly.
 */
export async function deleteGalleryImage(id: unknown): Promise<ActionResult> {
  const g = await guard();
  if (g) return g;
  const parsed = galleryPhotoIdInput.safeParse(id);
  if (!parsed.success) return fail("That photo isn't valid. Reload the page and try again.", { code: "invalid" });

  await db.transaction(async (tx) => {
    const [row] = await tx.delete(galleryImages).where(eq(galleryImages.id, parsed.data)).returning({ file: galleryImages.file });
    const name = row ? uploadNameFromPath(row.file) : null;
    if (name && !(await uploadInUse(tx, name))) await tx.delete(uploads).where(eq(uploads.name, name));
  });
  revalidateContent();
  return { ok: true, data: undefined };
}

/** Every column an admin can point at an upload: another gallery row, a Special Events flyer,
 *  a menu item photo, the logo or share image, an event link. Substring match, so absolute
 *  URLs to the same file count as a reference too; when in doubt the bytes are kept. */
async function uploadInUse(tx: Tx, name: string): Promise<boolean> {
  const { rows } = await tx.execute<{ used: boolean }>(sql`select
    exists (select 1 from ${galleryImages} where position(${name} in ${galleryImages.file}) > 0)
    or exists (select 1 from ${specialEventImages} where position(${name} in ${specialEventImages.file}) > 0)
    or exists (select 1 from ${menuItems} where position(${name} in ${menuItems.image}) > 0)
    or exists (select 1 from ${restaurantInfo} where position(${name} in concat_ws(' ', ${restaurantInfo.logoUrl}, ${restaurantInfo.ogImageUrl})) > 0)
    or exists (select 1 from ${events} where position(${name} in ${events.linkUrl}) > 0) as used`);
  return rows[0]?.used ?? true;
}
