import { describe, expect, it } from "vitest";
import * as lucide from "lucide-react";
import { EVENTS } from "@/db/seed-data/calendar";
import { CLOSED_MARKER, EVENT_ICONS, calendarLegend, eventMarker, isEventIcon, markerText } from "@/lib/event-icons";
import { EVENT_KIND_FALLBACK_ICON, eventKindIcon } from "@/lib/event-kinds";
import { eventInputFor } from "@/lib/validation";

// 19 Nov 2026 (Pol: "match the icons with the context or activity"): each event can
// carry its own calendar icon from a fixed list, checked on the server.

describe("EVENT_ICONS allowlist", () => {
  it("has 24 unique names, each a real lucide-react export", () => {
    const names = EVENT_ICONS.map((i) => i.name);
    expect(names).toHaveLength(24);
    expect(new Set(names).size).toBe(24);
    for (const i of EVENT_ICONS) expect(i.icon).toBe((lucide as Record<string, unknown>)[i.name]);
  });

  it("accepts only names on the list", () => {
    expect(isEventIcon("Palette")).toBe(true);
    for (const v of ["palette", "constructor", "toString", "", "Star", "Skull", null, undefined, 3]) {
      expect(isEventIcon(v)).toBe(false);
    }
  });
});

describe("event form icon field (server check)", () => {
  const input = eventInputFor(["music"]);
  const base = { title: "QA", date: "2026-11-20" };

  it("keeps a listed icon and turns empty into null (use the type's icon)", () => {
    expect(input.parse({ ...base, icon: "Palette" }).icon).toBe("Palette");
    expect(input.parse({ ...base, icon: "" }).icon).toBeNull();
    expect(input.parse({ ...base, icon: null }).icon).toBeNull();
    expect(input.parse(base).icon).toBeNull();
  });

  it("rejects a name that is not on the list, as a field error", () => {
    for (const icon of ["Skull", "palette", "constructor"]) {
      const r = input.safeParse({ ...base, icon });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0].path).toEqual(["icon"]);
        expect(r.error.issues[0].message).toBe("Pick an icon from the list");
      }
    }
  });
});

describe("eventMarker order", () => {
  it("1. the event's own icon wins, labelled with the title", () => {
    expect(eventMarker("Community Art Circle", "Palette", "community", "Community")).toEqual({
      icon: lucide.Palette,
      label: "Community Art Circle",
      source: "own",
    });
  });

  it("an own Ban reads Closed", () => {
    expect(eventMarker("Closed Thanksgiving", "Ban", "hours", "Hours")).toBe(CLOSED_MARKER);
  });

  it("2. Ban when the title says Closed and no own icon", () => {
    expect(eventMarker("Closed", null, "hours", "Hours")).toBe(CLOSED_MARKER);
  });

  it("3. the type's icon, labelled with the type", () => {
    expect(eventMarker("Walk the Block", null, "community", "Community")).toEqual({
      icon: eventKindIcon("community"),
      label: "Community",
      source: "type",
    });
  });

  it("4. Star, Other, for no type (or a type the list no longer has)", () => {
    const other = { icon: EVENT_KIND_FALLBACK_ICON, label: "Other", source: "other" };
    expect(eventMarker("Pop in", null, undefined, undefined)).toEqual(other);
    expect(eventMarker("Pop in", null, "gone", undefined)).toEqual(other);
  });

  it("an unknown stored name falls through to the type", () => {
    expect(eventMarker("Trivia", "Skull", "trivia", "Trivia").source).toBe("type");
  });
});

describe("markerText", () => {
  it("shows the type or Closed, but not when the title already says it", () => {
    expect(markerText(eventMarker("Pub quiz", null, "trivia", "Trivia"), "Pub quiz")).toBe("Trivia");
    expect(markerText(eventMarker("Trivia", null, "trivia", "Trivia"), "Trivia")).toBeUndefined();
    expect(markerText(eventMarker("Closed Thanksgiving", "Ban", null, undefined), "Closed Thanksgiving")).toBe("Closed");
    expect(markerText(eventMarker("Closed", null, "hours", "Hours"), "Closed")).toBeUndefined();
  });

  it("shows nothing for an own icon or Other", () => {
    expect(markerText(eventMarker("Community Art Circle", "Palette", null, undefined), "Community Art Circle")).toBeUndefined();
    expect(markerText(eventMarker("Pop in", null, null, undefined), "Pop in")).toBeUndefined();
  });
});

describe("calendarLegend", () => {
  const art = eventMarker("Community Art Circle", "Palette", "community", "Community");
  const trivia = eventMarker("Trivia", null, "trivia", "Trivia");
  const music = eventMarker("Porch set", null, "music", "Live music");
  const other = eventMarker("Pop in", null, null, undefined);
  const closed = eventMarker("Closed", null, "hours", "Hours");

  it("one entry per icon and label, in date order, then Other, then Closed last", () => {
    const legend = calendarLegend([closed, trivia, other, art, trivia, music, trivia], false);
    expect(legend.map((m) => m.label)).toEqual(["Trivia", "Community Art Circle", "Live music", "Other", "Closed"]);
  });

  it("leaves out types with no event this month", () => {
    expect(calendarLegend([trivia], false).map((m) => m.label)).toEqual(["Trivia"]);
  });

  it("adds Closed for a closed day from Hours even with no Closed event", () => {
    expect(calendarLegend([trivia], true).map((m) => m.label)).toEqual(["Trivia", "Closed"]);
  });

  it("is empty for an empty month", () => {
    expect(calendarLegend([], false)).toEqual([]);
  });
});

describe("seeded event icons", () => {
  const iconOf = (title: string) => [...new Set(EVENTS.filter((e) => e.title === title).map((e) => e.icon))];

  it("match the activity", () => {
    expect(iconOf("Trivia")).toEqual(["Brain"]);
    expect(iconOf("Community Art Circle")).toEqual(["Palette"]);
    expect(iconOf('Brookland Park Blvd "Walk the Block"')).toEqual(["Footprints"]);
    expect(iconOf("Early closure at 12pm")).toEqual(["Clock"]);
    expect(iconOf("Closed Thanksgiving")).toEqual(["Ban"]);
    expect(iconOf("Closed")).toEqual(["Ban"]);
  });

  it("are all on the list", () => {
    for (const e of EVENTS) expect(isEventIcon(e.icon)).toBe(true);
  });
});
