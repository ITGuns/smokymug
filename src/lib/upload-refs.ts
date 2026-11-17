import "server-only";
import { inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { uploadNameFromPath } from "@/lib/uploads";

const { galleryImages, uploads, specialEventImages, menuItems, restaurantInfo, events } = schema;
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Every column an admin can point at an upload: a gallery row, a Special Events flyer,
 *  a menu item photo, the logo or share image, an event link. Substring match, so absolute
 *  URLs to the same file count as a reference too; when in doubt the bytes are kept. */
export async function uploadInUse(tx: Tx, name: string): Promise<boolean> {
  const { rows } = await tx.execute<{ used: boolean }>(sql`select
    exists (select 1 from ${galleryImages} where position(${name} in ${galleryImages.file}) > 0)
    or exists (select 1 from ${specialEventImages} where position(${name} in ${specialEventImages.file}) > 0)
    or exists (select 1 from ${menuItems} where position(${name} in ${menuItems.image}) > 0)
    or exists (select 1 from ${restaurantInfo} where position(${name} in concat_ws(' ', ${restaurantInfo.logoUrl}, ${restaurantInfo.ogImageUrl})) > 0)
    or exists (select 1 from ${events} where position(${name} in ${events.linkUrl}) > 0) as used`);
  return rows[0]?.used ?? true;
}

/** Deletes the `uploads` rows behind these paths once nothing references them any more.
 *  Run it inside the transaction, after the referencing rows are removed or changed. */
export async function dropUnusedUploads(tx: Tx, paths: (string | null | undefined)[]): Promise<void> {
  const names = [...new Set(paths.map((p) => (p ? uploadNameFromPath(p) : null)).filter((n): n is string => !!n))];
  const unused: string[] = [];
  for (const name of names) if (!(await uploadInUse(tx, name))) unused.push(name);
  if (unused.length) await tx.delete(uploads).where(inArray(uploads.name, unused));
}
