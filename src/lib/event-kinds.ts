/** B6 / board L6: "3 or 4 small icons that could denote a type of event -
 *  Icon design legend". Dan named no types, so these four reuse the words the
 *  site already uses for events ("live music nights, specials, pop-ups or
 *  community events") and wait on his confirm or rename (build notes). The
 *  key is what the database stores; label and icon can change freely. */
export const EVENT_KINDS = [
  { key: "music", label: "Live music" },
  { key: "special", label: "Specials" },
  { key: "popup", label: "Pop-up" },
  { key: "community", label: "Community" },
] as const;

export type EventKind = (typeof EVENT_KINDS)[number]["key"];

export const EVENT_KIND_KEYS = EVENT_KINDS.map((k) => k.key) as [EventKind, ...EventKind[]];

export function isEventKind(v: unknown): v is EventKind {
  return typeof v === "string" && (EVENT_KIND_KEYS as readonly string[]).includes(v);
}

export function eventKindLabel(kind: EventKind): string {
  return EVENT_KINDS.find((k) => k.key === kind)?.label ?? kind;
}

/** 20x20 stroke icons (currentColor), one per kind. */
export const EVENT_KIND_ICON: Record<EventKind, string[]> = {
  // music note
  music: ["M8 15V4.5l8-2V13", "M8 15a2.2 2.2 0 1 1-4.4 0A2.2 2.2 0 0 1 8 15z", "M16 13a2.2 2.2 0 1 1-4.4 0 2.2 2.2 0 0 1 4.4 0z"],
  // price tag
  special: ["M3 10.5V4a1 1 0 0 1 1-1h6.5L17 9.5 10.5 16z", "M7 6.5h.01"],
  // market awning / pop-up stand
  popup: ["M3 7l1.5-4h11L17 7", "M3 7c0 1.4 1.1 2 2.3 2S7.7 8.4 7.7 7c0 1.4 1.1 2 2.3 2s2.3-.6 2.3-2c0 1.4 1.1 2 2.3 2S17 8.4 17 7", "M4.5 9v8h11V9", "M8.5 17v-4h3v4"],
  // two people
  community: ["M7.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z", "M2.5 17c0-2.8 2.2-5 5-5s5 2.2 5 5", "M13.5 9.5a2 2 0 1 0 0-4", "M14.5 12.2c1.8.5 3 2.1 3 4.3"],
};
