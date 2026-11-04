"use server";

import { after } from "next/server";
import { db, schema } from "@/db";
import { clientKey } from "@/lib/auth";
import { readSiteSettings } from "@/lib/data/site-settings";
import { readRestaurant } from "@/lib/data/restaurant";
import { pgCode } from "@/lib/db-errors";
import { inquiryMailConfig, sendInquiryEmail } from "@/lib/inquiry-mail";
import { honeypotHit } from "@/lib/ordering";
import { rateLimit } from "@/lib/rate-limit";
import { cateringInput, fieldErrors, type CateringInput } from "@/lib/validation";
import { fail, type ActionResult } from "./types";

export async function submitCateringInquiry(raw: CateringInput): Promise<ActionResult<{ id: number }>> {
  const key = await clientKey();
  const rl = rateLimit(`catering:${key}`, 5, 10 * 60_000);
  if (!rl.ok) return fail("Too many submissions. Please try again shortly.");
  // P7 (4 Nov): honeypot on the raw body BEFORE the parse, so a bot gets the silent success
  // (the old schema rule max(0) rejected it first and handed back field errors instead).
  if (honeypotHit(raw)) return { ok: true, data: { id: 0 } };
  const parsed = cateringInput.safeParse(raw);
  if (!parsed.success) return fail("Please check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const { website: _hp, ...data } = parsed.data;
  try {
    const [row] = await db.insert(schema.cateringInquiries).values(data).returning({ id: schema.cateringInquiries.id });
    // CA03: email the catering address + the admin copy list (BCC), after the response and
    // only once a mail provider is configured (no-op until then)
    const mail = inquiryMailConfig();
    if (mail) {
      after(async () => {
        try {
          const [info, site] = await Promise.all([readRestaurant(), readSiteSettings()]);
          await sendInquiryEmail({ id: row.id, ...data }, info.cateringEmail ?? info.email, site.inquiryCc, mail);
        } catch (err) {
          console.error(`catering inquiry #${row.id}: mail step failed (pg ${pgCode(err)})`);
        }
      });
    }
    return { ok: true, data: { id: row.id } };
  } catch (err) {
    // P7 (4 Nov): never log the error object. DrizzleQueryError's message carries the
    // insert params, i.e. the guest's name, email, phone and message.
    console.error(`catering inquiry: insert failed (pg ${pgCode(err)})`);
    return fail("We couldn't send your inquiry. Please email or call us directly.");
  }
}
