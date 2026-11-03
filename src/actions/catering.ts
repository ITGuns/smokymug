"use server";

import { after } from "next/server";
import { db, schema } from "@/db";
import { clientKey } from "@/lib/auth";
import { readSiteSettings } from "@/lib/data/site-settings";
import { readRestaurant } from "@/lib/data/restaurant";
import { inquiryMailConfig, sendInquiryEmail } from "@/lib/inquiry-mail";
import { rateLimit } from "@/lib/rate-limit";
import { cateringInput, fieldErrors, type CateringInput } from "@/lib/validation";
import { fail, type ActionResult } from "./types";

export async function submitCateringInquiry(raw: CateringInput): Promise<ActionResult<{ id: number }>> {
  const key = await clientKey();
  const rl = rateLimit(`catering:${key}`, 5, 10 * 60_000);
  if (!rl.ok) return fail("Too many submissions. Please try again shortly.");
  const parsed = cateringInput.safeParse(raw);
  if (!parsed.success) return fail("Please check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  if (parsed.data.website) return { ok: true, data: { id: 0 } }; // honeypot hit: pretend success
  const { website: _hp, ...data } = parsed.data;
  try {
    const [row] = await db.insert(schema.cateringInquiries).values(data).returning({ id: schema.cateringInquiries.id });
    // CA03: email the catering address + admin CC list, after the response and
    // only once a mail provider is configured (no-op until then)
    const mail = inquiryMailConfig();
    if (mail) {
      after(async () => {
        try {
          const [info, site] = await Promise.all([readRestaurant(), readSiteSettings()]);
          await sendInquiryEmail({ id: row.id, ...data }, info.cateringEmail ?? info.email, site.inquiryCc, mail);
        } catch (err) {
          console.error(`catering inquiry #${row.id}: mail step failed`, err instanceof Error ? err.message : err);
        }
      });
    }
    return { ok: true, data: { id: row.id } };
  } catch (err) {
    console.error("catering inquiry failed", err);
    return fail("We couldn't send your inquiry. Please email or call us directly.");
  }
}
