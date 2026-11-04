import { describe, expect, it } from "vitest";
import { getClock, itemAvailability } from "@/lib/availability";
import type { CategoryNode, ItemNode, MenuTree } from "@/lib/data/menu";
import { onSchedule, scheduledMenu, scheduleTag } from "@/lib/menu-schedule";
import { menuItemInput } from "@/lib/validation";
import { category, clock, item, storeHours } from "./fixtures";

// D1 / board MB03: show-from / show-until dates on menu items.

describe("onSchedule (both days inclusive, restaurant-local dates)", () => {
  it("no dates: always on the menu", () => {
    expect(onSchedule({ showFrom: null, showUntil: null }, "2026-11-04")).toBe(true);
    expect(onSchedule({}, "2026-11-04")).toBe(true); // a cached tree from before the table existed
  });
  it("show from: hidden the day before, shown on the day and after", () => {
    const s = { showFrom: "2026-11-20", showUntil: null };
    expect(onSchedule(s, "2026-11-19")).toBe(false);
    expect(onSchedule(s, "2026-11-20")).toBe(true);
    expect(onSchedule(s, "2027-03-01")).toBe(true);
  });
  it("show until: shown through the last day, hidden the day after", () => {
    const s = { showFrom: null, showUntil: "2026-11-30" };
    expect(onSchedule(s, "2026-11-30")).toBe(true);
    expect(onSchedule(s, "2026-12-01")).toBe(false);
  });
  it("a one-day range shows on that day only", () => {
    const s = { showFrom: "2026-11-26", showUntil: "2026-11-26" };
    expect(["2026-11-25", "2026-11-26", "2026-11-27"].map((d) => onSchedule(s, d))).toEqual([false, true, false]);
  });
  it("ranges across the new year compare as dates", () => {
    const s = { showFrom: "2026-12-15", showUntil: "2027-01-05" };
    expect(onSchedule(s, "2026-12-31")).toBe(true);
    expect(onSchedule(s, "2027-01-05")).toBe(true);
    expect(onSchedule(s, "2027-01-06")).toBe(false);
  });
  it("uses the restaurant's date, not UTC: late evening in Richmond is still the last day", () => {
    const s = { showFrom: null, showUntil: "2026-11-30" };
    // 11:30 PM EST on Nov 30 is already Dec 1 in UTC
    expect(onSchedule(s, getClock("America/New_York", new Date("2026-12-01T04:30:00Z")).date)).toBe(true);
    // midnight EST: the first minute of Dec 1
    expect(onSchedule(s, getClock("America/New_York", new Date("2026-12-01T05:00:00Z")).date)).toBe(false);
  });
  it("starts at local midnight across the DST change (Nov 1 2026, EDT to EST)", () => {
    const s = { showFrom: "2026-11-01", showUntil: null };
    expect(onSchedule(s, getClock("America/New_York", new Date("2026-11-01T03:59:00Z")).date)).toBe(false); // 11:59 PM EDT Oct 31
    expect(onSchedule(s, getClock("America/New_York", new Date("2026-11-01T04:00:00Z")).date)).toBe(true); // 12:00 AM EDT Nov 1
  });
});

describe("scheduledMenu", () => {
  const node = (id: number, over: Partial<ItemNode> = {}): ItemNode => ({
    ...item({ id, name: `Item ${id}`, slug: `item-${id}` }),
    showFrom: null,
    showUntil: null,
    modifierGroups: [],
    categoryId: 1,
    categorySlug: "craft-barbecue",
    categoryName: "Craft Barbecue",
    sectionName: "Plates",
    ...over,
  });
  const tree = (items: ItemNode[]): MenuTree => {
    const cat: CategoryNode = {
      ...category(),
      sections: [{ id: 1, categoryId: 1, name: "Plates", slug: "plates", description: null, sectionType: "items", linkedModifierGroupId: null, displayOrder: 0, active: true, createdAt: "", updatedAt: "", linkedGroup: null, items }],
    };
    return { categories: [cat], groups: [] };
  };

  it("leaves out items outside their dates and keeps the rest in order", () => {
    const t = tree([node(1), node(2, { showFrom: "2026-11-20" }), node(3, { showUntil: "2026-11-03" }), node(4, { showFrom: "2026-11-01", showUntil: "2026-11-30" })]);
    const out = scheduledMenu(t, "2026-11-04");
    expect(out.categories[0].sections[0].items.map((i) => i.id)).toEqual([1, 4]);
  });
  it("keeps emptied sections and categories, and never mutates the cached tree", () => {
    const t = tree([node(1, { showFrom: "2027-01-01" })]);
    const out = scheduledMenu(t, "2026-11-04");
    expect(out.categories).toHaveLength(1);
    expect(out.categories[0].sections[0].items).toEqual([]);
    expect(t.categories[0].sections[0].items).toHaveLength(1);
  });
});

describe("scheduleTag (admin list label)", () => {
  const today = "2026-11-04";
  it("upcoming: Scheduled with the first day", () => {
    expect(scheduleTag({ showFrom: "2026-11-20", showUntil: "2026-11-30" }, today)).toEqual({ label: "Scheduled · from Fri, Nov 20", tone: "purple", hidden: true });
  });
  it("on the menu with an end: Ends with the last day", () => {
    expect(scheduleTag({ showFrom: null, showUntil: "2026-11-30" }, today)).toEqual({ label: "Ends Mon, Nov 30", tone: "purple", hidden: false });
    expect(scheduleTag({ showFrom: today, showUntil: today }, today)?.label).toBe("Ends Wed, Nov 4");
  });
  it("past the end: Ended, hidden", () => {
    expect(scheduleTag({ showFrom: null, showUntil: "2026-11-03" }, today)).toEqual({ label: "Ended Tue, Nov 3", tone: "gray", hidden: true });
  });
  it("no label when no date affects the item", () => {
    expect(scheduleTag({ showFrom: null, showUntil: null }, today)).toBeNull();
    expect(scheduleTag({ showFrom: "2026-11-01", showUntil: null }, today)).toBeNull();
  });
});

describe("menuItemInput: schedule and time fields", () => {
  const base = { sectionId: 1, name: "Pumpkin Spice Latte" };
  it("blank dates become null (cleared)", () => {
    expect(menuItemInput.parse({ ...base, showFrom: "", showUntil: "" })).toMatchObject({ showFrom: null, showUntil: null });
    expect(menuItemInput.parse(base)).toMatchObject({ showFrom: null, showUntil: null });
  });
  it("accepts one-sided and same-day ranges", () => {
    expect(menuItemInput.parse({ ...base, showFrom: "2026-11-20" })).toMatchObject({ showFrom: "2026-11-20", showUntil: null });
    expect(menuItemInput.safeParse({ ...base, showFrom: "2026-11-26", showUntil: "2026-11-26" }).success).toBe(true);
  });
  it("rejects a last day before the first day, on the Show until field", () => {
    const r = menuItemInput.safeParse({ ...base, showFrom: "2026-11-20", showUntil: "2026-11-19" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path.join("."))).toEqual(["showUntil"]);
  });
  it("rejects impossible or malformed dates", () => {
    expect(menuItemInput.safeParse({ ...base, showFrom: "2026-02-30" }).success).toBe(false);
    expect(menuItemInput.safeParse({ ...base, showUntil: "11/30/2026" }).success).toBe(false);
  });
  it("rejects time windows that end at or before the start (no overnight windows)", () => {
    const timed = { ...base, availabilityType: "schedule", availableDays: [5, 6] };
    expect(menuItemInput.safeParse({ ...timed, availableStartTime: "11:00", availableEndTime: "14:00" }).success).toBe(true);
    const same = menuItemInput.safeParse({ ...timed, availableStartTime: "11:00", availableEndTime: "11:00" });
    expect(same.error?.issues.map((i) => i.path.join("."))).toEqual(["availableEndTime"]);
    expect(menuItemInput.safeParse({ ...timed, availableStartTime: "22:00", availableEndTime: "02:00" }).success).toBe(false);
    expect(menuItemInput.safeParse({ ...timed, availableStartTime: "9:00" }).success).toBe(false); // HH:MM only
  });
  it("ignores leftover times on rules that don't use them", () => {
    expect(menuItemInput.safeParse({ ...base, availabilityType: "always", availableStartTime: "22:00", availableEndTime: "02:00" }).success).toBe(true);
  });
});

describe("day/time window boundaries (existing rule, badges only)", () => {
  const brunch = category({ hoursCategory: null, availableDays: null, startTime: null, endTime: null });
  const lunch = item({ availabilityType: "schedule", availableDays: [3], availableStartTime: "11:00", availableEndTime: "14:00" });
  it("start is inclusive, end is exclusive", () => {
    const at = (minutes: number) => itemAvailability(lunch, brunch, storeHours, clock({ dayOfWeek: 3, minutes })).availableNow;
    expect([at(10 * 60 + 59), at(11 * 60), at(13 * 60 + 59), at(14 * 60)]).toEqual([false, true, true, false]);
  });
  it("other days: not today", () => {
    expect(itemAvailability(lunch, brunch, storeHours, clock({ dayOfWeek: 4, minutes: 12 * 60 })).availableToday).toBe(false);
  });
});
