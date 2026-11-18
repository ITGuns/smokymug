import { describe, expect, it } from "vitest";
import { CATERING_PACKAGES, EVENT_KIND_TYPES } from "@/db/seed-data/admin-lists";
import { CATERING } from "@/db/seed-data/restaurant";
import { Music, Star } from "lucide-react";
import { EVENT_KIND_FALLBACK_ICON, EVENT_KINDS, eventKindIcon } from "@/lib/event-kinds";
import { slugify } from "@/lib/slug";
import { EVENTS } from "@/db/seed-data/calendar";
import { cateringPackageInput, cateringPackageOrderInput, eventInputFor, eventKindTypeAddInput } from "@/lib/validation";

// Audit F11 + F12 (18 Nov 2026): the two lists Admin now edits.

describe("F12 catering packages seed", () => {
  it("is the printed catering copy, word for word, in order", () => {
    expect(CATERING_PACKAGES).toEqual(
      CATERING.categories.map((c, i) => ({ name: c.name, blurb: c.description, priceLine: null, includes: [], displayOrder: i, visible: true })),
    );
    expect(CATERING_PACKAGES.map((p) => p.name)).toEqual(["Parties", "Professional", "Holiday", "Full Service"]);
  });
});

describe("F12 catering package input", () => {
  const base = { name: "Parties", blurb: "", priceLine: "", includes: "", visible: true };

  it("splits the included list one per line and drops blank lines", () => {
    const p = cateringPackageInput.parse({ ...base, includes: " Pulled pork \r\n\r\nBrisket\n  \nSides\n" });
    expect(p.includes).toEqual(["Pulled pork", "Brisket", "Sides"]);
    expect(p.blurb).toBeNull();
    expect(p.priceLine).toBeNull();
  });

  it("enforces the limits", () => {
    expect(cateringPackageInput.safeParse({ ...base, name: "  " }).success).toBe(false);
    expect(cateringPackageInput.safeParse({ ...base, name: "x".repeat(61) }).success).toBe(false);
    expect(cateringPackageInput.safeParse({ ...base, priceLine: "x".repeat(81) }).success).toBe(false);
    expect(cateringPackageInput.safeParse({ ...base, includes: Array(31).fill("a").join("\n") }).success).toBe(false);
    expect(cateringPackageInput.safeParse({ ...base, includes: "x".repeat(121) }).success).toBe(false);
    expect(cateringPackageInput.safeParse({ ...base, includes: Array(30).fill("a").join("\n") }).success).toBe(true);
  });

  it("takes a full order with no repeats", () => {
    expect(cateringPackageOrderInput.safeParse([3, 1, 2]).success).toBe(true);
    expect(cateringPackageOrderInput.safeParse([1, 1]).success).toBe(false);
    expect(cateringPackageOrderInput.safeParse([]).success).toBe(false);
  });
});

describe("F11 event types", () => {
  it("seeds the built-in calendar types in the same order", () => {
    expect(EVENT_KIND_TYPES).toEqual(EVENT_KINDS.map((k, i) => ({ key: k.key, label: k.label, displayOrder: i })));
  });

  it("keys each built-in type the way Admin keys a typed label, so a hand-made type lands on its icon", () => {
    expect(slugify("Trivia")).toBe("trivia");
    expect(slugify("Hours")).toBe("hours");
  });

  it("gives every seeded event a built-in type", () => {
    const keys = new Set<string>(EVENT_KINDS.map((k) => k.key));
    for (const e of EVENTS) expect(keys.has(e.kind)).toBe(true);
  });

  it("accepts a type from the table and rejects one that is not listed", () => {
    const input = eventInputFor(["music", "brunch"]);
    const base = { title: "QA", date: "2026-11-20" };
    expect(input.parse({ ...base, kind: "brunch" }).kind).toBe("brunch");
    expect(input.parse({ ...base, kind: "" }).kind).toBeNull();
    expect(input.safeParse({ ...base, kind: "rave" }).success).toBe(false);
    expect(input.safeParse({ ...base, kind: "popup" }).success).toBe(false);
  });

  it("keeps the lucide icons and gives a new type the star", () => {
    expect(eventKindIcon("music")).toBe(Music);
    expect(EVENT_KIND_FALLBACK_ICON).toBe(Star);
    expect(eventKindIcon("brunch")).toBe(Star);
    expect(eventKindIcon("constructor")).toBe(Star);
  });

  it("checks a type name", () => {
    expect(eventKindTypeAddInput.safeParse({ label: "Brunch" }).success).toBe(true);
    expect(eventKindTypeAddInput.safeParse({ label: " " }).success).toBe(false);
    expect(eventKindTypeAddInput.safeParse({ label: "x".repeat(41) }).success).toBe(false);
  });
});
