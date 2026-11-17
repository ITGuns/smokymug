import "server-only";
import { asc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db, schema } from "@/db";
import type { CateringPackage } from "@/db/schema";
import { CATERING_PACKAGES } from "@/db/seed-data/admin-lists";
import { isMissingSchema } from "@/lib/db-errors";
import { CONTENT_TAG } from "./restaurant";

const { cateringPackages } = schema;

/** Audit F12 (18 Nov 2026). Admin read: every package in order, hidden ones too.
 *  null = the table is missing on this database (prod before db:push). */
export async function readCateringPackages(): Promise<CateringPackage[] | null> {
  try {
    return await db.select().from(cateringPackages).orderBy(asc(cateringPackages.displayOrder), asc(cateringPackages.id));
  } catch (err) {
    if (isMissingSchema(err)) return null;
    throw err;
  }
}

export type PublicCateringPackage = Pick<CateringPackage, "id" | "name" | "blurb" | "priceLine" | "includes">;

/** /catering: the visible packages. Until db:push adds the table, the printed
 *  four show, exactly as before. */
async function readVisibleCateringPackages(): Promise<PublicCateringPackage[]> {
  const rows: Omit<CateringPackage, "createdAt" | "updatedAt">[] =
    (await readCateringPackages()) ?? CATERING_PACKAGES.map((p, i) => ({ ...p, id: -(i + 1) }));
  return rows.filter((p) => p.visible).map(({ id, name, blurb, priceLine, includes }) => ({ id, name, blurb, priceLine, includes }));
}

export const getCateringPackages = cache(unstable_cache(() => readVisibleCateringPackages(), ["catering-packages"], { tags: [CONTENT_TAG] }));
