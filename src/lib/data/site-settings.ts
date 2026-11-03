import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";
import { isMissingSchema } from "@/lib/db-errors";

/** BK02 + CA03 settings. Read uncached (one tiny row per request) so a fresh
 *  `db:push` or an e2e toggle applies at once, and read defensively: while the
 *  table is missing every setting counts as unset and pages still render. */
export type SiteSettings = {
  /** false = the site_settings table does not exist on this database yet */
  available: boolean;
  reservationsUrl: string | null;
  bookingWizard: boolean;
  inquiryCc: string[];
};

export const SITE_SETTINGS_DEFAULTS: SiteSettings = { available: true, reservationsUrl: null, bookingWizard: false, inquiryCc: [] };

export async function readSiteSettings(): Promise<SiteSettings> {
  try {
    const [row] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.id, 1)).limit(1);
    if (!row) return SITE_SETTINGS_DEFAULTS;
    return { available: true, reservationsUrl: row.reservationsUrl, bookingWizard: row.bookingWizard, inquiryCc: row.inquiryCc ?? [] };
  } catch (err) {
    if (isMissingSchema(err)) return { ...SITE_SETTINGS_DEFAULTS, available: false };
    throw err;
  }
}

export const getSiteSettings = cache(readSiteSettings);

/** The native wizard is reachable only while this is on (BK02 hid it). */
export async function bookingWizardOn(): Promise<boolean> {
  return (await getSiteSettings()).bookingWizard;
}
