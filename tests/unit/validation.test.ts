import { describe, expect, it } from "vitest";
import { bookingSettingsInput, cateringInput, fieldErrors, galleryOrderInput, hoursRowInput, menuItemInput, reservationInput, restaurantInfoInput } from "@/lib/validation";

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
  it("rejects calendar-impossible dates instead of rolling them over", () => {
    for (const date of ["2026-11-31", "2026-02-30", "2026-02-29", "2026-13-01", "2026-00-10"]) {
      const r = reservationInput.safeParse({ ...validReservation, date });
      expect(r.success, date).toBe(false);
      if (!r.success) expect(fieldErrors(r.error).date).toBe("Invalid date");
    }
  });
  it("accepts a real leap day", () => {
    expect(reservationInput.parse({ ...validReservation, date: "2028-02-29" }).date).toBe("2028-02-29");
  });
  it("reports junk dates as an issue rather than throwing", () => {
    expect(reservationInput.safeParse({ ...validReservation, date: "next friday" }).success).toBe(false);
  });
});

describe("cateringInput", () => {
  it("accepts an inquiry with optional blanks and keeps the honeypot empty", () => {
    const r = cateringInput.parse({ name: "Jo", email: "jo@example.com", phone: "", occasion: "Birthday", eventDate: "", guestCount: "", serviceType: "Delivery", message: "", website: "" });
    expect(r.phone).toBeNull();
    expect(r.guestCount).toBeNull();
    expect(r.eventDate).toBeNull();
  });
  it("applies the calendar check to the optional event date", () => {
    const base = { name: "Jo", email: "jo@example.com", phone: "", occasion: "Birthday", guestCount: "", serviceType: "Delivery", message: "", website: "" };
    expect(cateringInput.safeParse({ ...base, eventDate: "2026-11-31" }).success).toBe(false);
    expect(cateringInput.parse({ ...base, eventDate: "2026-11-30" }).eventDate).toBe("2026-11-30");
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

describe("galleryOrderInput", () => {
  it("accepts a list of distinct positive ids", () => {
    expect(galleryOrderInput.parse([3, 1, 2])).toEqual([3, 1, 2]);
  });
  it("rejects empty, duplicate, non-integer and non-numeric lists", () => {
    expect(galleryOrderInput.safeParse([]).success).toBe(false);
    expect(galleryOrderInput.safeParse([1, 2, 1]).success).toBe(false);
    expect(galleryOrderInput.safeParse([1, 2.5]).success).toBe(false);
    expect(galleryOrderInput.safeParse([0, -1]).success).toBe(false);
    expect(galleryOrderInput.safeParse(["1", "2"]).success).toBe(false);
    expect(galleryOrderInput.safeParse("1,2").success).toBe(false);
  });
});

describe("restaurantInfoInput external links", () => {
  const validInfo = {
    name: "The Smoky Mug",
    tagline: "Coffee and craft barbecue",
    category: "Cafe",
    description: "",
    addressLine1: "1 Main St",
    city: "Richmond",
    state: "VA",
    zip: "23222",
    phone: "(804) 555-0100",
    email: "hello@example.com",
  };
  it("accepts an https link and trims it", () => {
    expect(restaurantInfoInput.parse({ ...validInfo, website: "  https://www.smokymug.com  " }).website).toBe("https://www.smokymug.com");
  });
  it("turns a blank link into null", () => {
    const r = restaurantInfoInput.parse({ ...validInfo, orderUrl: "", instagramUrl: "   " });
    expect(r.orderUrl).toBeNull();
    expect(r.instagramUrl).toBeNull();
  });
  it("rejects a link without a protocol or with a non-http protocol", () => {
    for (const giftCardUrl of ["www.toasttab.com/thesmokymug/giftcards", "smokymug.com", "javascript:alert(1)", "ftp://example.com/file"]) {
      const r = restaurantInfoInput.safeParse({ ...validInfo, giftCardUrl });
      expect(r.success, giftCardUrl).toBe(false);
      if (!r.success) expect(fieldErrors(r.error).giftCardUrl).toBe("Enter a full link starting with https://");
    }
  });
});

describe("bookingSettingsInput", () => {
  it("bounds every numeric rule", () => {
    const ok = bookingSettingsInput.safeParse({ slotIntervalMinutes: 30, turnTimeMinutes: 90, minPartySize: 1, maxPartySize: 10, largePartyThreshold: 7, maxBookingsPerSlot: 4, maxCoversPerSlot: 24, minLeadTimeMinutes: 60, maxDaysInAdvance: 60 });
    expect(ok.success).toBe(true);
    expect(bookingSettingsInput.safeParse({ slotIntervalMinutes: 3, turnTimeMinutes: 90, minPartySize: 1, maxPartySize: 10, largePartyThreshold: 7, maxBookingsPerSlot: 4, maxCoversPerSlot: 24, minLeadTimeMinutes: 60, maxDaysInAdvance: 60 }).success).toBe(false);
  });
});
