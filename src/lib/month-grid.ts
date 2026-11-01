/** Pure month math for the /calendar page (NW01). Client-safe, no Date-locale
 *  traps: everything works on "YYYY-MM-DD" strings and a {year, month} pair. */

export type MonthRef = { year: number; month: number }; // month is 1-12

const pad = (n: number) => String(n).padStart(2, "0");

export function monthKey({ year, month }: MonthRef): string {
  return `${year}-${pad(month)}`;
}

/** "2026-11" → {2026, 11}; anything malformed or out of range → fallback. */
export function parseMonthParam(v: string | string[] | undefined, fallback: MonthRef): MonthRef {
  if (typeof v !== "string" || !/^\d{4}-\d{2}$/.test(v)) return fallback;
  const [year, month] = v.split("-").map(Number);
  if (month < 1 || month > 12 || year < 2000 || year > 2100) return fallback;
  return { year, month };
}

export function addMonths({ year, month }: MonthRef, delta: number): MonthRef {
  const i = year * 12 + (month - 1) + delta;
  return { year: Math.floor(i / 12), month: (((i % 12) + 12) % 12) + 1 };
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function monthLabel({ year, month }: MonthRef): string {
  return `${MONTHS[month - 1]} ${year}`;
}

export function daysInMonth({ year, month }: MonthRef): number {
  // Day 0 of the next month = last day of this month (Date.UTC handles Dec→Jan).
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** First and last date of the month, inclusive, as YYYY-MM-DD. */
export function monthBounds(ref: MonthRef): { from: string; to: string } {
  return { from: `${monthKey(ref)}-01`, to: `${monthKey(ref)}-${pad(daysInMonth(ref))}` };
}

export type GridCell = { date: string; day: number; inMonth: boolean };

/** Full weeks covering the month, Sunday-first (35 or 42 cells). */
export function monthGridCells(ref: MonthRef): GridCell[] {
  const first = new Date(Date.UTC(ref.year, ref.month - 1, 1));
  const start = new Date(first);
  start.setUTCDate(1 - first.getUTCDay());
  const total = Math.ceil((first.getUTCDay() + daysInMonth(ref)) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return {
      date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
      day: d.getUTCDate(),
      inMonth: d.getUTCMonth() === ref.month - 1,
    };
  });
}
