/** Audit F10 (18 Nov 2026): a closed date is entered once, in Admin, Hours, and shows
 *  on the public /calendar as well as blocking bookings. Special-hours overrides
 *  (closed = false) are not closures. A day that already has an event saying "Closed"
 *  (closures used to be entered twice) keeps only that event, so nothing shows twice. */
export type CalendarClosure = { date: string; label: string };

const SAYS_CLOSED = /\bclosed\b/i;

export function calendarClosures(
  overrides: readonly { date: string; closed: boolean; reason: string | null }[],
  events: readonly { date: string; title: string }[],
): CalendarClosure[] {
  const saidClosed = new Set(events.filter((e) => SAYS_CLOSED.test(e.title)).map((e) => e.date));
  return overrides
    .filter((o) => o.closed && !saidClosed.has(o.date))
    .map((o) => ({ date: o.date, label: o.reason?.trim() || "Closed" }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** The line under a closure's label: "Closed all day", or "All day" when the label already says it. */
export function closedNote(c: CalendarClosure): string {
  return c.label === "Closed" ? "All day" : "Closed all day";
}
