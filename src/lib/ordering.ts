import type { NotifyStatus, OrderMenu, OrderRequestStatus } from "@/db/schema";
import { EXPRESS_PATH, HOLIDAY_PATH } from "./ordering-menus";

/**
 * Phase 2 order requests (docs/phase2-ordering-spec.md). Pure helpers shared by
 * the public form, the server action and admin. Nothing here touches the DB.
 */

export const ORDER_MENU_INFO: Record<OrderMenu, { slug: string; path: string; title: string; refPrefix: string }> = {
  express: { slug: "express-catering", path: EXPRESS_PATH, title: "Express Catering", refPrefix: "EC" },
  holiday: { slug: "holiday-preorders", path: HOLIDAY_PATH, title: "Holiday Preorders", refPrefix: "HP" },
};

/** Two-key allowlist for /menus/[menu]; anything else is a 404. */
export function menuFromSlug(slug: string): OrderMenu | null {
  if (slug === ORDER_MENU_INFO.express.slug) return "express";
  if (slug === ORDER_MENU_INFO.holiday.slug) return "holiday";
  return null;
}

/** Shown to guest and staff. Not a secret (there is no lookup endpoint). */
export function orderReference(menu: OrderMenu, id: number): string {
  return `${ORDER_MENU_INFO[menu].refPrefix}-${1000 + id}`;
}

export const ORDER_STATUS_LABELS: Record<OrderRequestStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  completed: "Picked up",
  declined: "Declined",
  cancelled: "Cancelled",
};

export const NOTIFY_LABELS: Record<NotifyStatus, string> = {
  pending: "Email pending",
  sent: "Emailed",
  failed: "Email failed",
  off: "Email alerts not set up",
  skipped: "Email skipped (hourly cap)",
};

/** Rows that never reached the staff inbox get a "Not emailed" tag in admin. */
export const notEmailed = (s: NotifyStatus) => s === "failed" || s === "skipped" || s === "off";

/** Hard caps (spec 5.2). */
export const MAX_LINES = 20;
export const MAX_LINE_QTY = 100;
export const MAX_TOTAL_UNITS = 200;
/** Per email and per phone, rolling 24 hours (statuses new or confirmed). */
export const DAILY_REQUESTS_PER_CONTACT = 3;
/** Order alert emails per rolling hour before the rest are marked skipped. */
export const HOURLY_EMAIL_CAP = 20;
/** Requests older than this many days past pickup are purged when admin opens Orders. */
export const RETENTION_DAYS = 180;

/** Luhn checksum over a digit string. */
function luhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Spec 5.6: any run of 13 to 19 digits (single spaces or hyphens allowed between them) that passes Luhn. */
export function looksLikeCardNumber(text: string): boolean {
  for (const m of text.matchAll(/\d(?:[ -]?\d)*/g)) {
    const digits = m[0].replace(/\D/g, "");
    if (digits.length >= 13 && digits.length <= 19 && luhn(digits)) return true;
  }
  return false;
}

/** Honeypot (spec 4.1 step 2): checked on the raw body BEFORE zod, so a bot gets a silent success. */
export function honeypotHit(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const v = (raw as { website?: unknown }).website;
  return typeof v === "string" && v.trim() !== "";
}

export type PricedLine = { itemId: number; name: string; unitPrice: number | null; priceNote: string | null; quantity: number };
export type OrderItemRow = { id: number; name: string; price: number | null; priceNote: string | null; minQty: number; maxQty: number };

/**
 * Spec 4.1 step 5: the server re-checks every line against the DB rows (already
 * filtered to this menu and active). Prices come from the rows only; a
 * client-sent price is never read.
 */
export function priceLines(
  requested: { itemId: number; quantity: number }[],
  rows: OrderItemRow[],
): { ok: true; lines: PricedLine[] } | { ok: false; reason: "changed" | "quantity" | "total" } {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const lines: PricedLine[] = [];
  for (const l of requested) {
    const row = byId.get(l.itemId);
    if (!row) return { ok: false, reason: "changed" };
    if (l.quantity < row.minQty || l.quantity > row.maxQty) return { ok: false, reason: "quantity" };
    lines.push({ itemId: row.id, name: row.name, unitPrice: row.price, priceNote: row.priceNote, quantity: l.quantity });
  }
  if (lines.reduce((n, l) => n + l.quantity, 0) > MAX_TOTAL_UNITS) return { ok: false, reason: "total" };
  return { ok: true, lines };
}

/** Cents, or null as soon as any line is price-on-request. */
export function estimateTotal(lines: { unitPrice: number | null; quantity: number }[]): number | null {
  if (!lines.length) return null;
  let total = 0;
  for (const l of lines) {
    if (l.unitPrice == null) return null;
    total += l.unitPrice * l.quantity;
  }
  return total;
}
