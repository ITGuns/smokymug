import { describe, expect, it } from "vitest";
import { buildIcs, googleCalendarUrl } from "@/lib/calendar";
import { hashPassword, verifyPassword } from "@/lib/password";
import { slugify } from "@/lib/slug";
import { applyFilters, itemMatches, matchesDietary } from "@/components/menu/menu-filter";
import type { CategoryNode, ItemNode } from "@/lib/data/menu";
import { category, item } from "./fixtures";

describe("password hashing", () => {
  it("verifies the right password and rejects others", () => {
    const stored = hashPassword("correct horse battery");
    expect(stored).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
    expect(verifyPassword("correct horse battery", stored)).toBe(true);
    expect(verifyPassword("wrong", stored)).toBe(false);
    expect(verifyPassword("anything", "garbage")).toBe(false);
  });
});

describe("slugify", () => {
  it("makes URL-safe slugs", () => {
    expect(slugify("Hatch Chile Mac n Cheese")).toBe("hatch-chile-mac-n-cheese");
    expect(slugify("Biscuits 'n Hatch Gravy")).toBe("biscuits-n-hatch-gravy");
    expect(slugify("Burgers & Wings")).toBe("burgers-and-wings");
    expect(slugify("P.B.L.T.")).toBe("p-b-l-t");
  });
});

describe("calendar links", () => {
  const event = { title: "The Smoky Mug: table for 4", description: "Reservation SM-1001", location: "2930 North Avenue", date: "2026-09-26", time: "19:00", durationMinutes: 90, uid: "SM-1001@smokymug", url: "https://smokymug.vercel.app/book/SM-1001" };
  it("builds a Google Calendar URL in the restaurant timezone", () => {
    const u = new URL(googleCalendarUrl(event));
    expect(u.searchParams.get("dates")).toBe("20260926T190000/20260926T203000");
    expect(u.searchParams.get("ctz")).toBe("America/New_York");
    expect(u.searchParams.get("text")).toBe(event.title);
  });
  it("builds a valid ICS with TZID and escaping", () => {
    const ics = buildIcs({ ...event, description: "Party of 4; bring cake, please" });
    expect(ics).toContain("DTSTART;TZID=America/New_York:20260926T190000");
    expect(ics).toContain("DTEND;TZID=America/New_York:20260926T203000");
    expect(ics).toContain("DESCRIPTION:Party of 4\; bring cake\\, please");
    expect(ics.split("\r\n").at(-1)).toBe("END:VCALENDAR");
  });
});

describe("menu filters", () => {
  const node = (over: Partial<ItemNode>): ItemNode => ({ ...item(), modifierGroups: [], categoryId: 1, categorySlug: "craft-barbecue", categoryName: "Craft Barbecue", sectionName: "Sides", ...over });
  const slaw = node({ id: 1, name: "Tejano Slaw", dietaryTags: ["gluten-free-option", "vegetarian"] });
  const beans = node({ id: 2, name: "Refried Beans", dietaryTags: ["vegan"] });
  const brisket = node({ id: 3, name: "Brisket Sandwich", description: "smoked brisket", dietaryTags: ["gluten-free-option"] });
  const availability = { 1: { availableNow: true, availableToday: true, label: null, detail: null }, 2: { availableNow: false, availableToday: true, label: null, detail: null }, 3: { availableNow: true, availableToday: true, label: null, detail: null } };

  it("matches dietary filters including *-option tags and vegan⊂vegetarian", () => {
    expect(matchesDietary(slaw.dietaryTags, ["vegetarian"])).toBe(true);
    expect(matchesDietary(beans.dietaryTags, ["vegetarian"])).toBe(true);
    expect(matchesDietary(slaw.dietaryTags, ["vegan"])).toBe(false);
    expect(matchesDietary(brisket.dietaryTags, ["gluten-free"])).toBe(true);
  });
  it("searches name, description, section and category", () => {
    const f = { query: "brisket", dietary: [], availableNow: false, featured: false } as const;
    expect(itemMatches(brisket, { ...f, dietary: [] }, availability)).toBe(true);
    expect(itemMatches(slaw, { ...f, dietary: [] }, availability)).toBe(false);
    expect(itemMatches(slaw, { query: "sides", dietary: [], availableNow: false, featured: false }, availability)).toBe(true);
  });
  it("applies availability and empties sections without matches", () => {
    const tree: CategoryNode[] = [{ ...category(), sections: [{ id: 1, categoryId: 1, name: "Sides", slug: "sides", description: null, sectionType: "items", linkedModifierGroupId: null, displayOrder: 0, active: true, createdAt: "", updatedAt: "", linkedGroup: null, items: [slaw, beans, brisket] }] }];
    const out = applyFilters(tree, { query: "", dietary: ["vegan"], availableNow: true, featured: false }, availability);
    expect(out[0].itemCount).toBe(0); // beans is vegan but not available now
    const out2 = applyFilters(tree, { query: "", dietary: ["vegan"], availableNow: false, featured: false }, availability);
    expect(out2[0].sections[0].items.map((i) => i.name)).toEqual(["Refried Beans"]);
  });
});
