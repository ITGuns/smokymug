"use server";

import { db, schema } from "@/db";
import { clientKey } from "@/lib/auth";
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
    return { ok: true, data: { id: row.id } };
  } catch (err) {
    console.error("catering inquiry failed", err);
    return fail("We couldn't send your inquiry. Please email or call us directly.");
  }
}
