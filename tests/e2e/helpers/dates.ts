/** Restaurant-timezone date helpers for picking bookable days. */
import { DATE_OVERRIDES } from "../../../src/db/seed-data/calendar";

/** Seeded closures and reduced-hours days: the date picker disables or trims them, so tests skip them. */
const OVERRIDDEN = new Set(DATE_OVERRIDES.map((o) => o.date));
export function todayInZone(tz = "America/New_York"): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (t: string) => p.find((x) => x.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export function weekday(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Next date (at least `minDaysAhead` out) that falls on `dow` and has no seeded override. */
export function nextWeekday(dow: number, minDaysAhead = 2): string {
  let d = addDays(todayInZone(), minDaysAhead);
  while (weekday(d) !== dow || OVERRIDDEN.has(d)) d = addDays(d, 1);
  return d;
}

/** Matches the date picker button for a day whether or not it is marked unavailable. */
export function dayButtonName(ymd: string): RegExp {
  return new RegExp(`^${longDate(ymd)}( \\(unavailable\\))?$`);
}

export function longDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
