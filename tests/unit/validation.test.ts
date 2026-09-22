import { describe, expect, it } from "vitest";
import { bookingSettingsInput, cateringInput, fieldErrors, hoursRowInput, menuItemInput, reservationInput } from "@/lib/validation";

const validReservation = {
  date: "2026-09-26",
  time: "19:00",
  partySize: "4",
  firstName: " Ada ",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "(804) 555-0100",
  specialRequests: "",
  seatingPreference: "",
  occasion: "",
  idempotencyKey: "0f3c1b2a-1111-2222-3333-444455556666",
};

describe("reservationInput", () => {
  it("coerces and trims a valid submission", () => {
    const r = reservationInput.parse(validReservation);
    expect(r.partySize).toBe(4);
    expect(r.firstName).toBe("Ada");
    expect(r.specialRequests).toBeNull();
  });
  it("reports field-level errors", () => {
    const r = reservationInput.safeParse({ ...validReservation, email: "nope", phone: "12", time: "7pm", firstName: "" });
    expect(r.success).toBe(false);
    if (r.success) return;
    const errs = fieldErrors(r.error);
    expect(errs.email).toBe("Enter a valid email");
    expect(errs.phone).toBeTruthy();
    expect(errs.time).toBeTruthy();
    expect(errs.firstName).toBe("First name is required");
  });
});

describe("cateringInput", () => {
  it("accepts an inquiry with optional blanks and keeps the honeypot empty", () => {
    const r = cateringInput.parse({ name: "Jo", email: "jo@example.com", phone: "", occasion: "Birthday", eventDate: "", guestCount: "", serviceType: "Delivery", message: "", website: "" });
    expect(r.phone).toBeNull();
    expect(r.guestCount).toBeNull();
    expect(r.eventDate).toBeNull();
  });
  it("rejects a filled honeypot", () => {
    expect(cateringInput.safeParse({ name: "Bot", email: "b@example.com", phone: "", occasion: "x", eventDate: "", guestCount: "", serviceType: "Delivery", message: "", website: "http://spam" }).success).toBe(false);
  });
});

describe("menuItemInput", () => {
  const base = { sectionId: "3", name: "Test", dietaryTags: [], modifierGroupIds: [] };
  it("parses dollar strings into cents and blanks into null", () => {
    const r = menuItemInput.parse({ ...base, price: "$6.95", largePrice: "11", bottlePrice: "" });
    expect(r.price).toBe(695);
    expect(r.largePrice).toBe(1100);
    expect(r.bottlePrice).toBeNull();
    expect(r.availabilityType).toBe("always");
  });
  it("rejects negative or non-numeric prices", () => {
    const r = menuItemInput.safeParse({ ...base, price: "-2" });
    expect(r.success).toBe(false);
    expect(menuItemInput.safeParse({ ...base, price: "abc" }).success).toBe(false);
  });
  it("normalises day lists", () => {
    expect(menuItemInput.parse({ ...base, availabilityType: "days", availableDays: ["6", "5", "5"] }).availableDays).toEqual([5, 6]);
  });
});

describe("hoursRowInput", () => {
  it("accepts blank open time (from store opening) and rejects bad formats", () => {
    expect(hoursRowInput.parse({ category: "breakfast", dayOfWeek: "1", opensAt: "", closesAt: "11:30", isClosed: false })).toMatchObject({ opensAt: null, closesAt: "11:30" });
    expect(hoursRowInput.safeParse({ category: "store", dayOfWeek: 1, opensAt: "7am", closesAt: "12:00" }).success).toBe(false);
  });
});

describe("bookingSettingsInput", () => {
  it("bounds every numeric rule", () => {
    const ok = bookingSettingsInput.safeParse({ slotIntervalMinutes: 30, turnTimeMinutes: 90, minPartySize: 1, maxPartySize: 10, largePartyThreshold: 7, maxBookingsPerSlot: 4, maxCoversPerSlot: 24, minLeadTimeMinutes: 60, maxDaysInAdvance: 60 });
    expect(ok.success).toBe(true);
    expect(bookingSettingsInput.safeParse({ slotIntervalMinutes: 3, turnTimeMinutes: 90, minPartySize: 1, maxPartySize: 10, largePartyThreshold: 7, maxBookingsPerSlot: 4, maxCoversPerSlot: 24, minLeadTimeMinutes: 60, maxDaysInAdvance: 60 }).success).toBe(false);
  });
});
