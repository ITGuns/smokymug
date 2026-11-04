/**
 * CA03 "dual paper trail": email each catering inquiry, and (phase 2) each
 * order request, to the catering address with the admin's extra addresses as
 * BCC copies. BCC, not CC (P6, 4 Nov): with Reply-To set to the guest, a staff
 * member who hits Reply All would otherwise send the guest every internal
 * address on the list. Nothing is sent until a mail provider is configured
 * (NEEDS-INFRA): RESEND_API_KEY plus INQUIRY_FROM_EMAIL, a sender on a domain
 * verified in that Resend account. Nothing is ever emailed to the guest.
 */

import type { OrderMenu } from "@/db/schema";
import { longDate, money, shortDate, time12 } from "./format";
import { ORDER_MENU_INFO, orderReference } from "./ordering";

export type InquiryMailConfig = { apiKey: string; from: string };
export type MailOutcome = "sent" | "failed";

export function inquiryMailConfig(env: Record<string, string | undefined> = process.env): InquiryMailConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.INQUIRY_FROM_EMAIL?.trim();
  return apiKey && from ? { apiKey, from } : null;
}

export type InquiryForMail = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  occasion: string;
  eventDate?: string | null;
  guestCount?: number | null;
  serviceType: string;
  message?: string | null;
};

/** One line, no control characters, bounded: user text never reaches a header raw. */
const oneLine = (s: string, max = 80) => s.replace(/[\r\n\t\u0000-\u001f]+/g, " ").trim().slice(0, max);

/** Staff copies minus the To address (case-insensitive), as BCC. */
function copiesFor(to: string, copies: string[]) {
  const bcc = copies.filter((c) => c.toLowerCase() !== to.toLowerCase());
  return bcc.length ? { bcc } : {};
}

/** Plain-text body only, so nothing the guest typed is ever rendered as HTML. */
export function buildInquiryEmail(q: InquiryForMail, to: string, copies: string[], from: string) {
  const lines = [
    `New catering inquiry #${q.id}`,
    "",
    `Name: ${q.name}`,
    `Email: ${q.email}`,
    q.phone ? `Phone: ${q.phone}` : null,
    `Occasion: ${q.occasion}`,
    q.eventDate ? `Event date: ${q.eventDate}` : null,
    q.guestCount != null ? `Guests: ${q.guestCount}` : null,
    `Service: ${q.serviceType}`,
    q.message ? `\nMessage:\n${q.message}` : null,
    "",
    "Reply to this email to answer the guest directly. All inquiries are also saved in the admin panel.",
  ].filter((l): l is string => l !== null);
  return {
    from,
    to: [to],
    ...copiesFor(to, copies),
    reply_to: q.email,
    subject: oneLine(`Catering inquiry: ${q.name}, ${q.occasion}`, 120),
    text: lines.join("\n"),
  };
}

export type OrderRequestForMail = {
  id: number;
  menu: OrderMenu;
  name: string;
  email: string;
  phone: string;
  pickupDate: string;
  pickupTime: string;
  notes?: string | null;
  estimatedTotal: number | null;
};
export type OrderLineForMail = { name: string; quantity: number; unitPrice: number | null; priceNote?: string | null };

/** Phase 2 staff alert (spec 4.3): plain text, guest only in reply_to, copies as BCC. */
export function buildOrderRequestEmail(req: OrderRequestForMail, lines: OrderLineForMail[], to: string, copies: string[], from: string) {
  const ref = orderReference(req.menu, req.id);
  const title = ORDER_MENU_INFO[req.menu].title;
  const pickupShort = `${shortDate(req.pickupDate).replace(",", "")} ${time12(req.pickupTime)}`;
  const body = [
    `Order request ${ref} (${title})`,
    "",
    `Pickup: ${longDate(req.pickupDate)} at ${time12(req.pickupTime)}`,
    "",
    "Items:",
    ...lines.map((l) => `  ${l.quantity} x ${oneLine(l.name, 120)}, ${l.unitPrice == null ? "price on request" : `${money(l.unitPrice, { always: true })} each`}${l.priceNote ? ` (${oneLine(l.priceNote, 60)})` : ""}`),
    req.estimatedTotal == null ? "Total to confirm: some items are priced on request." : `Estimate before tax: ${money(req.estimatedTotal, { always: true })}`,
    "",
    `Name: ${oneLine(req.name, 100)}`,
    `Phone: ${oneLine(req.phone, 25)}`,
    `Email: ${req.email}`,
    req.notes ? `\nNotes:\n${req.notes}` : null,
    "",
    "Reply to this email to answer the guest. Every request is also in the admin panel under Orders.",
  ].filter((l): l is string => l !== null);
  return {
    from,
    to: [to],
    ...copiesFor(to, copies),
    reply_to: req.email,
    subject: oneLine(`Order request ${ref}: ${title}, pickup ${pickupShort}`, 120),
    text: body.join("\n"),
  };
}

/** Best effort: a failed or slow send is logged (status only, never the payload) and never fails the request. */
async function postEmail(payload: object, idempotencyKey: string, config: InquiryMailConfig, label: string): Promise<MailOutcome> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`${label}: mail provider answered ${res.status}`);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error(`${label}: mail send failed (${err instanceof Error ? err.name : "error"})`);
    return "failed";
  }
}

export function sendInquiryEmail(q: InquiryForMail, to: string, copies: string[], config: InquiryMailConfig): Promise<MailOutcome> {
  return postEmail(buildInquiryEmail(q, to, copies, config.from), `catering-inquiry/${q.id}`, config, `catering inquiry #${q.id}`);
}

export function sendOrderRequestEmail(req: OrderRequestForMail, lines: OrderLineForMail[], to: string, copies: string[], config: InquiryMailConfig): Promise<MailOutcome> {
  return postEmail(buildOrderRequestEmail(req, lines, to, copies, config.from), `order-request/${req.id}`, config, `order request #${req.id}`);
}
