import { describe, expect, it } from "vitest";
import { categoryOpenNow, getClock, isHappyHour, itemAvailability, storeStatus, summarizeHours } from "@/lib/availability";
import { category, clock, item, storeHours } from "./fixtures";

describe("getClock", () => {
  it("resolves the restaurant's local date/time", () => {
    const c = getClock("America/New_York", new Date("2026-09-26T23:30:00Z")); // 7:30 PM EDT Saturday
    expect(c).toMatchObject({ date: "2026-09-26", time: "19:30", minutes: 1170, dayOfWeek: 6 });
    const next = getClock("America/New_York", new Date("2026-09-27T03:30:00Z")); // still Saturday 11:30 PM local
    expect(next.date).toBe("2026-09-26");
  });
});

describe("storeStatus", () => {
  it("is open during store hours and reports closing time", () => {
    expect(storeStatus(storeHours, clock({ dayOfWeek: 3, minutes: 600 }))).toMatchObject({ isOpen: true, label: "Open now", detail: "Closes 9 PM" });
  });
  it("flags closing soon within an hour of close", () => {
    expect(storeStatus(storeHours, clock({ dayOfWeek: 3, time: "20:30", minutes: 1230 })).label).toBe("Closing soon");
  });
  it("points to the next opening when closed", () => {
    expect(storeStatus(storeHours, clock({ dayOfWeek: 3, time: "06:00", minutes: 360 })).detail).toBe("Opens today at 7 AM");
    expect(storeStatus(storeHours, clock({ dayOfWeek: 1, time: "13:00", minutes: 780 })).detail).toBe("Opens tomorrow at 7 AM");
  });
});

describe("isHappyHour", () => {
  it("is true only inside the happy hour window", () => {
    expect(isHappyHour(storeHours, clock({ dayOfWeek: 3, minutes: 16 * 60 }))).toBe(true);
    expect(isHappyHour(storeHours, clock({ dayOfWeek: 3, minutes: 19 * 60 }))).toBe(false);
    expect(isHappyHour(storeHours, clock({ dayOfWeek: 1, minutes: 16 * 60 }))).toBe(false);
  });
});

describe("itemAvailability", () => {
  const bbq = category();
  it("follows the category's hours for always-available items", () => {
    expect(itemAvailability(item(), bbq, storeHours, clock({ dayOfWeek: 3, minutes: 13 * 60 }))).toMatchObject({ availableNow: true, availableToday: true, label: null });
    expect(itemAvailability(item(), bbq, storeHours, clock({ dayOfWeek: 3, minutes: 9 * 60 })).availableNow).toBe(false);
    expect(itemAvailability(item(), bbq, storeHours, clock({ dayOfWeek: 1, minutes: 13 * 60 })).availableToday).toBe(false); // no BBQ Monday
  });
  it("respects Fri/Sat-only items", () => {
    const ribs = item({ availabilityType: "days", availableDays: [5, 6], availabilityNote: "Fri & Sat only" });
    expect(itemAvailability(ribs, bbq, storeHours, clock({ dayOfWeek: 3, minutes: 13 * 60 }))).toMatchObject({ availableToday: false, availableNow: false, label: "Fri & Sat only" });
    expect(itemAvailability(ribs, bbq, storeHours, clock({ dayOfWeek: 6, minutes: 13 * 60 }))).toMatchObject({ availableToday: true, availableNow: true });
  });
  it("derives a label from the days when none is given and applies end times", () => {
    const grill = item({ availabilityType: "days", availableDays: [3, 4, 5, 6], availableEndTime: "11:30" });
    const breakfast = category({ hoursCategory: "breakfast" });
    expect(itemAvailability(grill, breakfast, storeHours, clock({ dayOfWeek: 3, minutes: 10 * 60 }))).toMatchObject({ availableNow: true, label: "Wed–Sat only" });
    expect(itemAvailability(grill, breakfast, storeHours, clock({ dayOfWeek: 3, minutes: 12 * 60 })).availableNow).toBe(false);
  });
  it("marks seasonal and inactive items", () => {
    expect(itemAvailability(item({ availabilityType: "seasonal" }), bbq, storeHours, clock()).label).toBe("Seasonal");
    expect(itemAvailability(item({ active: false }), bbq, storeHours, clock())).toMatchObject({ availableNow: false, label: "Currently unavailable" });
  });
});

describe("categoryOpenNow", () => {
  it("uses custom days/times when no hours category is linked", () => {
    const cat = category({ hoursCategory: null, availableDays: [0], startTime: "09:30", endTime: "14:30" });
    expect(categoryOpenNow(cat, storeHours, clock({ dayOfWeek: 0, minutes: 11 * 60 }))).toBe(true);
    expect(categoryOpenNow(cat, storeHours, clock({ dayOfWeek: 0, minutes: 15 * 60 }))).toBe(false);
    expect(categoryOpenNow(cat, storeHours, clock({ dayOfWeek: 1, minutes: 11 * 60 }))).toBe(false);
  });
});

describe("summarizeHours", () => {
  it("groups consecutive days with identical hours", () => {
    const rows = summarizeHours(storeHours, "store");
    expect(rows.map((r) => `${r.days} ${r.hours}`)).toEqual(["Mon 7 AM – 12 PM", "Tue–Thu 7 AM – 9 PM", "Fri 7 AM – 10 PM", "Sat 8 AM – 10 PM", "Sun 9:30 AM – 2:30 PM"]);
  });
  it("renders 'from opening' windows as ’til", () => {
    expect(summarizeHours(storeHours, "breakfast")[0].hours).toBe("’til 11:30 AM");
  });
});
