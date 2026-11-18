import {
  Ban,
  Beer,
  BookOpen,
  Brain,
  Clock,
  Coffee,
  Dog,
  Drumstick,
  Film,
  Flame,
  Footprints,
  Gamepad2,
  Gift,
  Heart,
  Mic,
  Music,
  Palette,
  PartyPopper,
  Snowflake,
  Sun,
  Ticket,
  TreePine,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { saysClosed } from "./calendar-closures";
import { EVENT_KIND_FALLBACK_ICON, eventKindIcon } from "./event-kinds";

/** 19 Nov 2026 (Pol: "match the icons with the context or activity"): the icons Admin can
 *  pin on one event, so its calendar marker shows what happens there (Community Art Circle a
 *  palette, Walk the Block footprints), not only its type. `name` is the lucide-react export
 *  and what event_icons.icon stores; `label` is what the admin picker shows. The picker, the
 *  server check and the calendar all read this list, so adding an icon here is the whole change. */
export const EVENT_ICONS = [
  { name: "Palette", label: "Art", icon: Palette },
  { name: "Footprints", label: "Walk", icon: Footprints },
  { name: "Brain", label: "Trivia", icon: Brain },
  { name: "Music", label: "Live music", icon: Music },
  { name: "Mic", label: "Open mic", icon: Mic },
  { name: "Clock", label: "Early closure", icon: Clock },
  { name: "Ban", label: "Closed", icon: Ban },
  { name: "Drumstick", label: "BBQ", icon: Drumstick },
  { name: "TreePine", label: "Holiday", icon: TreePine },
  { name: "Coffee", label: "Coffee", icon: Coffee },
  { name: "Flame", label: "Smoker", icon: Flame },
  { name: "Beer", label: "Drinks", icon: Beer },
  { name: "PartyPopper", label: "Party", icon: PartyPopper },
  { name: "Gift", label: "Gift cards", icon: Gift },
  { name: "Trophy", label: "Contest", icon: Trophy },
  { name: "Gamepad2", label: "Games", icon: Gamepad2 },
  { name: "BookOpen", label: "Book club", icon: BookOpen },
  { name: "Film", label: "Movie night", icon: Film },
  { name: "Dog", label: "Dog friendly", icon: Dog },
  { name: "Sun", label: "Patio", icon: Sun },
  { name: "Snowflake", label: "Winter", icon: Snowflake },
  { name: "Heart", label: "Fundraiser", icon: Heart },
  { name: "Ticket", label: "Ticketed", icon: Ticket },
  { name: "Users", label: "Community", icon: Users },
] as const satisfies readonly { name: string; label: string; icon: LucideIcon }[];

export type EventIconName = (typeof EVENT_ICONS)[number]["name"];

const NAMES: readonly string[] = EVENT_ICONS.map((i) => i.name);

/** True only for a name on the list (so "constructor" and other object keys fail). */
export function isEventIcon(v: unknown): v is EventIconName {
  return typeof v === "string" && NAMES.includes(v);
}

export function eventIconComponent(name: string | null | undefined): LucideIcon | undefined {
  return EVENT_ICONS.find((i) => i.name === name)?.icon;
}

/** What the calendar draws for one event and the words its legend entry carries. */
export type EventMarker = { icon: LucideIcon; label: string; source: "own" | "closed" | "type" | "other" };

export const CLOSED_MARKER: EventMarker = { icon: Ban, label: "Closed", source: "closed" };

/** One rule for the month grid, the list, the pop-out and the legend; the first match wins:
 *  1. the event's own icon (its legend label is the event's title; Ban reads "Closed"),
 *  2. Ban when the title says "Closed",
 *  3. the type's icon, labelled with the type's name,
 *  4. Star, labelled "Other". */
export function eventMarker(
  title: string,
  own: string | null | undefined,
  kind: string | null | undefined,
  typeLabel: string | undefined,
): EventMarker {
  const icon = isEventIcon(own) ? eventIconComponent(own) : undefined;
  if (icon) return own === "Ban" ? CLOSED_MARKER : { icon, label: title, source: "own" };
  if (saysClosed(title)) return CLOSED_MARKER;
  if (kind && typeLabel) return { icon: eventKindIcon(kind), label: typeLabel, source: "type" };
  return { icon: EVENT_KIND_FALLBACK_ICON, label: "Other", source: "other" };
}

/** The words beside an event's icon in the list and the pop-out: the type's name or
 *  "Closed", left out when the title already says it (a "Trivia" event typed Trivia).
 *  An event's own icon needs none: its title sits right above it. */
export function markerText(m: EventMarker, title: string): string | undefined {
  if (m.source !== "type" && m.source !== "closed") return undefined;
  return m.label.trim().toLowerCase() === title.trim().toLowerCase() ? undefined : m.label;
}

/** The legend: one entry per icon and label the visible month draws, in date order, then
 *  "Other", then "Closed" last. A type with no event this month is left out, and every
 *  icon on the grid has an entry. */
export function calendarLegend(markers: readonly EventMarker[], hasClosures: boolean): EventMarker[] {
  const named = markers.filter((m) => m.source === "own" || m.source === "type");
  const other = markers.filter((m) => m.source === "other");
  const closed = hasClosures || markers.some((m) => m.source === "closed") ? [CLOSED_MARKER] : [];
  return [...named, ...other, ...closed].filter(
    (m, i, all) => all.findIndex((x) => x.icon === m.icon && x.label === m.label) === i,
  );
}
