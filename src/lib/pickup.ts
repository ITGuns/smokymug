import type { DateOverride, Hours } from "@/db/schema";
import { hoursFor, resolveWindow, type Clock } from "./availability";
import { dayOfWeek, fromMinutes, toMinutes } from "./format";

/**
 * Phase 2 pickup rules (docs/phase2-ordering-spec.md 4.2). Pure: the server
 * action validates with it and the order form renders its slot list from the
 * same function with server-provided hours, overrides and clock, so the list a
 * guest sees is the list the server accepts. Everything is restaurant-local
 * minutes (the one-hour error on the two DST change days is accepted).
 */

export const SLOT_MINUTES = 30;
/** Same as the booking_settings default (schema.ts maxDaysInAdvance). */
export const PICKUP_MAX_DAYS_AHEAD = 60;

export type PickupCtx = {
  hours: Hours[];
  overrides: DateOverride[];
  clock: Clock;
  leadHours: number;
  maxDaysAhead: number;
  /** Holiday only: pickup dates inclusive. */
  window?: { from: string; to: string } | null;
};

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const utc = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
export const daysBetween = (from: string, to: string) => Math.round((utc(to) - utc(from)) / 86_400_000);
const plusDays = (ymd: string, n: number) => new Date(utc(ymd) + n * 86_400_000).toISOString().slice(0, 10);

/** First date the form may offer (today, or the holiday window's first day). */
export function earliestPickupDate(ctx: PickupCtx): string {
  return ctx.window && ctx.window.from > ctx.clock.date ? ctx.window.from : ctx.clock.date;
}

/** Last date the form may offer (60 days out, or the holiday window's last day if sooner). */
export function lastPickupDate(ctx: PickupCtx): string {
  const cap = plusDays(ctx.clock.date, ctx.maxDaysAhead);
  return ctx.window && ctx.window.to < cap ? ctx.window.to : cap;
}

/** Opening minutes for a date: a date override wins (same precedence as storeStatus), else the weekly store row. */
function openingWindow(date: string, ctx: PickupCtx): { open: number; close: number } | null {
  const o = ctx.overrides.find((x) => x.date === date);
  if (o?.closed) return null;
  if (o?.startTime && o.endTime) return { open: toMinutes(o.startTime), close: toMinutes(o.endTime) };
  return resolveWindow(ctx.hours, hoursFor(ctx.hours, "store", dayOfWeek(date)));
}

/** "HH:MM" pickup slots for a date; [] = no pickup that day. */
export function pickupSlots(date: string, ctx: PickupCtx): string[] {
  if (!YMD.test(date) || date < earliestPickupDate(ctx) || date > lastPickupDate(ctx)) return [];
  const win = openingWindow(date, ctx);
  if (!win) return [];
  const minutesUntilDay = daysBetween(ctx.clock.date, date) * 1440 - ctx.clock.minutes;
  const lead = ctx.leadHours * 60;
  const slots: string[] = [];
  // From opening rounded up to the half hour, to 30 minutes before closing.
  for (let t = Math.ceil(win.open / SLOT_MINUTES) * SLOT_MINUTES; t <= win.close - SLOT_MINUTES; t += SLOT_MINUTES) {
    if (minutesUntilDay + t >= lead) slots.push(fromMinutes(t));
  }
  return slots;
}

export function isValidPickup(date: string, time: string, ctx: PickupCtx): boolean {
  return pickupSlots(date, ctx).includes(time);
}

/** The first date with at least one slot, for the date input's min; null = nothing bookable. */
export function firstPickupDate(ctx: PickupCtx): string | null {
  const last = lastPickupDate(ctx);
  for (let d = earliestPickupDate(ctx); d <= last; d = plusDays(d, 1)) {
    if (pickupSlots(d, ctx).length) return d;
  }
  return null;
}
