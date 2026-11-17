/**
 * Dan's "Upcoming events" list (16 Nov 2026), word for word. Titles are his
 * words; his times go in the time fields. The seed adds this list and the
 * closures below once (the first seed that finds none of these events) and
 * never deletes, so whatever Dan adds, edits or deletes in Admin survives every
 * later seed and reseed. GUNS-PROD-RESEED.md says so. The run-once step is
 * seedRound16Nov in src/db/seed.ts.
 */
export const EVENTS: { title: string; date: string; startTime: string | null; endTime: string | null }[] = [
  ...["2026-11-18", "2026-11-25", "2026-12-02", "2026-12-09", "2026-12-16", "2026-12-23"].map((date) => ({
    title: "Trivia",
    date,
    startTime: "19:00",
    endTime: "21:00",
  })),
  { title: "Closed Thanksgiving", date: "2026-11-26", startTime: null, endTime: null },
  { title: "Community Art Circle", date: "2026-11-29", startTime: "17:00", endTime: "20:00" },
  { title: 'Brookland Park Blvd "Walk the Block"', date: "2026-12-18", startTime: null, endTime: null },
  { title: "Early closure at 12pm", date: "2026-12-24", startTime: null, endTime: null },
  { title: "Closed", date: "2026-12-25", startTime: null, endTime: null },
  { title: "Closed", date: "2026-12-26", startTime: null, endTime: null },
];

/**
 * The same closures as store-hours exceptions, so the header badge, booking
 * dates and pickup windows follow them. Inserted only where the date has no
 * exception yet (date is unique), so an admin edit wins. Dec 24 opens at the
 * usual Thursday time (07:00) and closes at noon.
 */
export const DATE_OVERRIDES: { date: string; closed: boolean; startTime: string | null; endTime: string | null; reason: string | null }[] = [
  { date: "2026-11-26", closed: true, startTime: null, endTime: null, reason: "Thanksgiving" },
  { date: "2026-12-24", closed: false, startTime: "07:00", endTime: "12:00", reason: "Early closure at 12pm" },
  { date: "2026-12-25", closed: true, startTime: null, endTime: null, reason: null },
  { date: "2026-12-26", closed: true, startTime: null, endTime: null, reason: null },
];
