import "server-only";
import { randomUUID } from "node:crypto";

/**
 * Admin image uploads (menu photos, Special Events flyers, gallery photos), stored
 * in the `uploads` table and served by /uploads/[file]. The browser's declared type
 * is checked against the file's own signature bytes, so a renamed non-image is refused.
 */
const TYPES = new Map<string, { ext: string; matches: (b: Buffer) => boolean }>([
  ["image/jpeg", { ext: ".jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff }],
  ["image/png", { ext: ".png", matches: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) }],
  ["image/webp", { ext: ".webp", matches: (b) => b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP" }],
]);

/** Stays under the 4 MB server-action body limit in next.config.ts (form encoding adds overhead). */
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

export type ImageUpload = { name: string; mime: string; size: number; data: Buffer };

export async function readImageUpload(file: FormDataEntryValue | null): Promise<{ ok: true; upload: ImageUpload } | { ok: false; error: string }> {
  if (!(file instanceof File)) return { ok: false, error: "Choose an image to upload." };
  const type = TYPES.get(file.type);
  if (!type) return { ok: false, error: "Use a JPG, PNG or WebP image." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Image must be under 3 MB." };
  const data = Buffer.from(await file.arrayBuffer());
  if (!type.matches(data)) return { ok: false, error: "That file isn't a readable JPG, PNG or WebP image." };
  return { ok: true, upload: { name: `${randomUUID()}${type.ext}`, mime: file.type, size: data.length, data } };
}

export const uploadPath = (name: string) => `/uploads/${name}`;

/** "/uploads/<name>" gives the upload's name; seeded "/images/..." files and remote URLs give null. */
export function uploadNameFromPath(path: string): string | null {
  const m = /^\/uploads\/([a-zA-Z0-9._-]{1,120})$/.exec(path);
  return m ? m[1] : null;
}
