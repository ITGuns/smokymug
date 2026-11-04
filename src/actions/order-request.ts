"use server";

import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { after } from "next/server";
import { db, schema } from "@/db";
import type { NotifyStatus, OrderMenu } from "@/db/schema";
import { clientKey } from "@/lib/auth";
import { getClock } from "@/lib/availability";
import { loadPickupCtx, readActiveItemsByIds, readOrderingSettings } from "@/lib/data/ordering";
import { getRestaurant, readBookingSettings, readHours, readRestaurant } from "@/lib/data/restaurant";
import { readSiteSettings } from "@/lib/data/site-settings";
import { pgCode } from "@/lib/db-errors";
import { inquiryMailConfig, sendOrderRequestEmail, type InquiryMailConfig, type OrderLineForMail, type OrderRequestForMail } from "@/lib/inquiry-mail";
import { DAILY_REQUESTS_PER_CONTACT, estimateTotal, honeypotHit, HOURLY_EMAIL_CAP, orderReference, priceLines } from "@/lib/ordering";
import { isValidPickup } from "@/lib/pickup";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, orderRequestInput } from "@/lib/validation";
import { fail, type ActionResult } from "./types";

/**
 * Phase 2 (docs/phase2-ordering-spec.md 4.1): the ONE public action for order
 * requests. Every export of a "use server" file is a callable endpoint, so the
 * guarded admin actions live in ordering-admin.ts. Checks run cheap first and
 * stop at the first failure. Logs carry fixed strings and Postgres codes only,
 * never the guest's details (spec 5.7).
 */

const { orderRequests, orderRequestLines } = schema;

async function restaurantPhone(): Promise<string | null> {
  try {
    return (await getRestaurant()).phone;
  } catch {
    return null;
  }
}

export async function submitOrderRequest(raw: unknown): Promise<ActionResult<{ reference: string | null }>> {
  const phone = await restaurantPhone();
  const callUs = phone ? `Please call us at ${phone}.` : "Please call us.";

  // 1. Best-effort per-instance IP limit (same helper and numbers as catering).
  if (!rateLimit(`order:${await clientKey()}`, 5, 10 * 60_000).ok) return fail(`Too many requests from this connection. ${callUs}`, { code: "rate_limited" });
  // 2. Honeypot BEFORE parsing: bots get the same success screen, nothing is written or sent.
  if (honeypotHit(raw)) return { ok: true, data: { reference: null } };
  // 3. Shape.
  const parsed = orderRequestInput.safeParse(raw);
  if (!parsed.success) return fail("Please check the highlighted fields.", { fieldErrors: fieldErrors(parsed.error) });
  const input = parsed.data;

  try {
    const bookingSettings = await readBookingSettings();
    const clock = getClock(bookingSettings.timezone);

    // 4. The menu must be on (a tab left open after staff switch it off creates nothing).
    const settings = await readOrderingSettings(clock.date);
    if (!settings.available) return fail(`We can't take requests online right now. ${callUs}`, { code: "unavailable" });
    if (!(input.menu === "express" ? settings.expressOn : settings.holidayOn)) return fail(closedMessage(input.menu, callUs), { code: "closed" });

    // 5. Items, quantities and prices from the DB only.
    const rows = await readActiveItemsByIds(input.menu, input.lines.map((l) => l.itemId));
    const priced = priceLines(input.lines, rows);
    if (!priced.ok) return fail("One of these items just changed. Reload the page and try again.", { code: `items_${priced.reason}` });

    // 6. Pickup date and time against store hours, overrides, lead time and the holiday window.
    const ctx = await loadPickupCtx(input.menu, settings, await readHours(), clock);
    if (!isValidPickup(input.pickupDate, input.pickupTime, ctx)) {
      const msg = "That pickup time isn't available. Pick another.";
      return fail(msg, { fieldErrors: { pickupTime: msg } });
    }

    // A retry of a request that already landed (double click, flaky network) gets its reference back.
    const existing = await referenceForKey(input.idempotencyKey);
    if (existing) return { ok: true, data: { reference: existing } };

    // 7. DB-backed limit: holds across serverless instances, unlike step 1.
    const email = input.email.toLowerCase();
    const digits = input.phone.replace(/\D/g, "").slice(-10);
    const [recent] = await db
      .select({
        byEmail: sql<number>`count(*) filter (where ${orderRequests.email} = ${email})::int`,
        byPhone: sql<number>`count(*) filter (where right(regexp_replace(${orderRequests.phone}, '[^0-9]', '', 'g'), 10) = ${digits})::int`,
      })
      .from(orderRequests)
      .where(and(gte(orderRequests.createdAt, sql`now() - interval '24 hours'`), inArray(orderRequests.status, ["new", "confirmed"])));
    if ((recent?.byEmail ?? 0) >= DAILY_REQUESTS_PER_CONTACT || (recent?.byPhone ?? 0) >= DAILY_REQUESTS_PER_CONTACT) {
      return fail(`You've sent a few requests already today. ${callUs}`, { code: "daily_limit" });
    }

    // 8. Store first (one transaction), email second.
    const mail = inquiryMailConfig();
    const request = {
      menu: input.menu,
      name: input.name,
      email,
      phone: input.phone,
      pickupDate: input.pickupDate,
      pickupTime: input.pickupTime,
      notes: input.notes ?? null,
      estimatedTotal: estimateTotal(priced.lines),
      idempotencyKey: input.idempotencyKey,
      notifyStatus: (mail ? "pending" : "off") as NotifyStatus,
    };
    let id: number;
    try {
      id = await db.transaction(async (tx) => {
        const [row] = await tx.insert(orderRequests).values(request).returning({ id: orderRequests.id });
        await tx.insert(orderRequestLines).values(priced.lines.map((l) => ({ requestId: row.id, itemId: l.itemId, name: l.name, unitPrice: l.unitPrice, priceNote: l.priceNote, quantity: l.quantity })));
        return row.id;
      });
    } catch (err) {
      if (pgCode(err) === "23505") {
        const ref = await referenceForKey(input.idempotencyKey);
        if (ref) return { ok: true, data: { reference: ref } };
      }
      throw err;
    }

    // 10. After the response: the staff email, then its outcome on the row.
    if (mail) {
      const forMail: OrderRequestForMail = { id, ...request };
      const lines: OrderLineForMail[] = priced.lines;
      after(() => notifyStaff(forMail, lines, mail));
    }
    // 9. Respond right away.
    return { ok: true, data: { reference: orderReference(input.menu, id) } };
  } catch (err) {
    console.error(`order request: failed (pg ${pgCode(err)})`);
    return fail(`We couldn't send your request. ${callUs}`);
  }
}

function closedMessage(menu: OrderMenu, callUs: string): string {
  return menu === "holiday" ? `Holiday preorders are closed right now. ${callUs}` : `Express Catering requests are closed right now. ${callUs}`;
}

async function referenceForKey(key: string): Promise<string | null> {
  const [row] = await db.select({ id: orderRequests.id, menu: orderRequests.menu }).from(orderRequests).where(eq(orderRequests.idempotencyKey, key)).limit(1);
  return row ? orderReference(row.menu, row.id) : null;
}

/** Spec 4.3: hourly cap first (protects the Resend quota shared with catering), then send, then record the outcome. */
async function notifyStaff(req: OrderRequestForMail, lines: OrderLineForMail[], mail: InquiryMailConfig): Promise<void> {
  try {
    const [sent] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(orderRequests)
      .where(and(eq(orderRequests.notifyStatus, "sent"), gte(orderRequests.createdAt, sql`now() - interval '1 hour'`)));
    let outcome: NotifyStatus;
    if ((sent?.n ?? 0) >= HOURLY_EMAIL_CAP) {
      outcome = "skipped";
    } else {
      const [info, site] = await Promise.all([readRestaurant(), readSiteSettings()]);
      outcome = await sendOrderRequestEmail(req, lines, info.cateringEmail ?? info.email, site.inquiryCc, mail);
    }
    await db.update(orderRequests).set({ notifyStatus: outcome }).where(eq(orderRequests.id, req.id));
    if (outcome !== "sent") console.error(`order request #${req.id}: mail ${outcome}`);
  } catch (err) {
    console.error(`order request #${req.id}: mail step failed (pg ${pgCode(err)})`);
  }
}
