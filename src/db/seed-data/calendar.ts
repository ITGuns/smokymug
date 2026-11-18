import type { EventIconName } from "../../lib/event-icons";
import type { EventKind } from "../../lib/event-kinds";

/**
 * Dan's "Upcoming events" list (16 Nov 2026), word for word. Titles are his
 * words; his times go in the time fields. The seed adds this list and the
 * closures below once (the first seed that finds none of these events) and
 * never deletes, so whatever Dan adds, edits or deletes in Admin survives every
 * later seed and reseed. GUNS-PROD-RESEED.md says so. The run-once step is
 * seedRound16Nov in src/db/seed.ts. `kind` (19 Nov 2026) goes to event_kinds, not
 * events: fillEventKinds in seed.ts types each of these that is still untyped.
 * `icon` (19 Nov 2026, Pol: icons match the activity) goes to event_icons the same
 * way: fillEventIcons sets it only on a seeded event with no icon row yet.
 */
export const EVENTS: {
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  kind: EventKind;
  icon: EventIconName;
}[] = [
  ...["2026-11-18", "2026-11-25", "2026-12-02", "2026-12-09", "2026-12-16", "2026-12-23"].map((date) => ({
    title: "Trivia",
    date,
    startTime: "19:00",
    endTime: "21:00",
    kind: "trivia" as const,
    icon: "Brain" as const,
  })),
  { title: "Closed Thanksgiving", date: "2026-11-26", startTime: null, endTime: null, kind: "hours", icon: "Ban" },
  { title: "Community Art Circle", date: "2026-11-29", startTime: "17:00", endTime: "20:00", kind: "community", icon: "Palette" },
  { title: 'Brookland Park Blvd "Walk the Block"', date: "2026-12-18", startTime: null, endTime: null, kind: "community", icon: "Footprints" },
  { title: "Early closure at 12pm", date: "2026-12-24", startTime: null, endTime: null, kind: "hours", icon: "Clock" },
  { title: "Closed", date: "2026-12-25", startTime: null, endTime: null, kind: "hours", icon: "Ban" },
  { title: "Closed", date: "2026-12-26", startTime: null, endTime: null, kind: "hours", icon: "Ban" },
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
