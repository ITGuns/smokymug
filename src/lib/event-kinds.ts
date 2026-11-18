import { Music, Star, Store, Tag, Users, type LucideIcon } from "lucide-react";

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

/** F11 (18 Nov 2026): the types Admin, Calendar lists (event_kind_types). Any
 *  key may exist there; the four built-in keys keep their icons. */
export type KindOption = { key: string; label: string };

export function eventKindLabel(kind: EventKind): string {
  return EVENT_KINDS.find((k) => k.key === kind)?.label ?? kind;
}

/** One lucide-react icon per kind (18 Nov 2026, mapping in DESIGN.md Icons). */
export const EVENT_KIND_ICON: Record<EventKind, LucideIcon> = {
  music: Music,
  special: Tag,
  popup: Store,
  community: Users,
};

/** F11: a type added in Admin has no icon of its own, so it gets a star. */
export const EVENT_KIND_FALLBACK_ICON: LucideIcon = Star;

export function eventKindIcon(key: string): LucideIcon {
  return isEventKind(key) ? EVENT_KIND_ICON[key] : EVENT_KIND_FALLBACK_ICON;
}
