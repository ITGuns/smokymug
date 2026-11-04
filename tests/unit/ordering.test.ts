import { afterEach, describe, expect, it, vi } from "vitest";
import type { DateOverride } from "@/db/schema";
import { buildOrderRequestEmail } from "@/lib/inquiry-mail";
import { estimateTotal, honeypotHit, looksLikeCardNumber, menuFromSlug, orderReference, priceLines } from "@/lib/ordering";
import { liveOrderingLinks, orderingMenus } from "@/lib/ordering-menus";
import { firstPickupDate, isValidPickup, pickupSlots, type PickupCtx } from "@/lib/pickup";
import { rateLimit } from "@/lib/rate-limit";
import { orderingSettingsInput, orderItemInput, orderRequestInput } from "@/lib/validation";
import { clock, hoursRow } from "./fixtures";

/* Phase 2 ordering (docs/phase2-ordering-spec.md 7.1). Clock: Wed 2026-09-23 10:00. */

const STORE = [
  hoursRow("store", 1, "07:00", "12:00"),
  hoursRow("store", 2, "07:00", "21:00"),
  hoursRow("store", 3, "07:00", "21:00"),
  hoursRow("store", 4, "07:00", "21:00"),
  hoursRow("store", 5, "07:00", "22:00"),
  hoursRow("store", 6, "08:00", "22:00"),
  hoursRow("store", 0, "09:30", "14:30"),
];
const override = (date: string, o: Partial<DateOverride> = {}): DateOverride => ({ id: 1, date, closed: true, startTime: null, endTime: null, reason: "QA", createdAt: "", updatedAt: "", ...o });
const ctx = (over: Partial<PickupCtx> = {}): PickupCtx => ({ hours: STORE, overrides: [], clock: clock(), leadHours: 0, maxDaysAhead: 60, window: null, ...over });

describe("pickupSlots / isValidPickup (spec 4.2)", () => {
  it("open day: every 30 minutes from opening to 30 minutes before close", () => {
    const s = pickupSlots("2026-09-24", ctx()); // Thu 07:00-21:00
    expect(s[0]).toBe("07:00");
    expect(s.at(-1)).toBe("20:30");
    expect(s).toHaveLength(28);
  });
  it("last slot is close minus 30 (Sunday 14:30 close gives 14:00)", () => {
    expect(pickupSlots("2026-09-27", ctx()).at(-1)).toBe("14:00");
  });
  it("closed weekday gives no slots", () => {
    const hours = STORE.map((h) => (h.dayOfWeek === 1 ? hoursRow("store", 1, null, null, true) : h));
    expect(pickupSlots("2026-09-28", ctx({ hours }))).toEqual([]);
  });
  it("a closed date override wins over the weekly hours", () => {
    expect(pickupSlots("2026-09-24", ctx({ overrides: [override("2026-09-24")] }))).toEqual([]);
  });
  it("special-hours override: opening rounds up to the half hour", () => {
    const s = pickupSlots("2026-09-24", ctx({ overrides: [override("2026-09-24", { closed: false, startTime: "11:15", endTime: "15:00" })] }));
    expect(s[0]).toBe("11:30");
    expect(s.at(-1)).toBe("14:30");
  });
  it("lead time inside today: slots start at now + lead", () => {
    expect(pickupSlots("2026-09-23", ctx({ leadHours: 2 }))[0]).toBe("12:00");
  });
  it("lead time crossing midnight (Wed 20:00 + 12h = Thu 08:00)", () => {
    expect(pickupSlots("2026-09-24", ctx({ clock: clock({ time: "20:00", minutes: 1200 }), leadHours: 12 }))[0]).toBe("08:00");
  });
  it("lead time crossing two days (48h from Wed 10:00: nothing Thu, Fri from 10:00)", () => {
    const c = ctx({ leadHours: 48 });
    expect(pickupSlots("2026-09-24", c)).toEqual([]);
    expect(pickupSlots("2026-09-25", c)[0]).toBe("10:00");
    expect(firstPickupDate(c)).toBe("2026-09-25");
  });
  it("holiday window edges: from and to are inside, the days around them are not", () => {
    const c = ctx({ window: { from: "2026-10-01", to: "2026-10-03" } });
    expect(pickupSlots("2026-09-30", c)).toEqual([]);
    expect(pickupSlots("2026-10-01", c).length).toBeGreaterThan(0);
    expect(pickupSlots("2026-10-03", c).length).toBeGreaterThan(0);
    expect(pickupSlots("2026-10-04", c)).toEqual([]);
    expect(firstPickupDate(c)).toBe("2026-10-01");
  });
  it("nothing past 60 days ahead", () => {
    expect(pickupSlots("2026-11-22", ctx()).length).toBeGreaterThan(0); // day 60, a Sunday
    expect(pickupSlots("2026-11-23", ctx())).toEqual([]); // day 61
  });
  it("a time off the 30-minute grid, or outside the slots, is rejected", () => {
    expect(isValidPickup("2026-09-24", "10:00", ctx())).toBe(true);
    expect(isValidPickup("2026-09-24", "10:15", ctx())).toBe(false);
    expect(isValidPickup("2026-09-24", "20:45", ctx())).toBe(false);
    expect(isValidPickup("2026-09-22", "10:00", ctx())).toBe(false); // yesterday
    expect(isValidPickup("junk", "10:00", ctx())).toBe(false);
  });
});

const validRequest = {
  menu: "express",
  lines: [{ itemId: 4, quantity: 2 }],
  name: "QA Guest",
  email: "guest@example.com",
  phone: "(804) 555-0100",
  pickupDate: "2026-09-25",
  pickupTime: "11:30",
  notes: "",
  idempotencyKey: "abcdef123456",
  website: "",
};

describe("orderRequestInput (spec 4.1)", () => {
  const bad = (patch: Record<string, unknown>) => orderRequestInput.safeParse({ ...validRequest, ...patch }).success;
  it("accepts a normal request and turns empty notes into null", () => {
    const r = orderRequestInput.parse(validRequest);
    expect(r.notes).toBeNull();
    expect(r.lines).toEqual([{ itemId: 4, quantity: 2 }]);
  });
  it("rejects empty, too many and duplicate lines", () => {
    expect(bad({ lines: [] })).toBe(false);
    expect(bad({ lines: Array.from({ length: 21 }, (_, i) => ({ itemId: i + 1, quantity: 1 })) })).toBe(false);
    expect(bad({ lines: [{ itemId: 4, quantity: 1 }, { itemId: 4, quantity: 2 }] })).toBe(false);
  });
  it("rejects quantity 0 and 101", () => {
    expect(bad({ lines: [{ itemId: 4, quantity: 0 }] })).toBe(false);
    expect(bad({ lines: [{ itemId: 4, quantity: 101 }] })).toBe(false);
  });
  it("rejects notes over 500, a missing phone and an impossible date", () => {
    expect(bad({ notes: "x".repeat(501) })).toBe(false);
    expect(bad({ phone: "" })).toBe(false);
    expect(bad({ pickupDate: "2026-11-31" })).toBe(false);
  });
  it("rejects a Luhn-valid card number in the notes or the name, accepts a 16-digit order number that fails Luhn", () => {
    expect(bad({ notes: "my card 4111 1111 1111 1111 thanks" })).toBe(false);
    expect(bad({ name: "5555-5555-5555-4444" })).toBe(false);
    expect(bad({ notes: "PO 1234 5678 1234 5678" })).toBe(true);
    expect(bad({ notes: "call 804-555-0100 after 5" })).toBe(true);
  });
  it("accepts a filled honeypot (the action checks it before parsing)", () => {
    expect(bad({ website: "http://spam.example" })).toBe(true);
    expect(honeypotHit({ ...validRequest, website: "http://spam.example" })).toBe(true);
    expect(honeypotHit({ ...validRequest, website: "   " })).toBe(false);
    expect(honeypotHit(null)).toBe(false);
  });
  it("looksLikeCardNumber ignores short and long digit runs", () => {
    expect(looksLikeCardNumber("4111111111111111")).toBe(true);
    expect(looksLikeCardNumber("411111111111")).toBe(false); // 12 digits
    expect(looksLikeCardNumber("41111111111111111111")).toBe(false); // 20 digits
  });
});

describe("admin inputs", () => {
  const item = { menu: "holiday", name: "QA Turkey", price: "89.5", minQty: "1", maxQty: "10", active: true };
  it("orderItemInput: blank price is null (Price on request), dollars become cents", () => {
    expect(orderItemInput.parse({ ...item, price: "" }).price).toBeNull();
    expect(orderItemInput.parse(item).price).toBe(8950);
  });
  it("orderItemInput: max below min, a photo without a description, and remote photos are refused", () => {
    expect(orderItemInput.safeParse({ ...item, minQty: "5", maxQty: "2" }).success).toBe(false);
    expect(orderItemInput.safeParse({ ...item, image: "/images/brisket-taco.jpg", imageAlt: "" }).success).toBe(false);
    expect(orderItemInput.safeParse({ ...item, image: "https://evil.example/x.jpg", imageAlt: "x" }).success).toBe(false);
    expect(orderItemInput.safeParse({ ...item, image: "//evil.example/x.jpg", imageAlt: "x" }).success).toBe(false);
    expect(orderItemInput.safeParse({ ...item, image: "/uploads/abc-123.webp", imageAlt: "A turkey" }).success).toBe(true);
  });
  it("orderingSettingsInput: lead hours 0 to 336, holiday last day not before the first", () => {
    expect(orderingSettingsInput.safeParse({ menu: "express", enabled: false, subtitle: "", leadHours: "337", tileImage: "" }).success).toBe(false);
    expect(orderingSettingsInput.safeParse({ menu: "holiday", enabled: false, subtitle: "", leadHours: "72", pickupFrom: "2026-11-26", pickupTo: "2026-11-25", tileImage: "" }).success).toBe(false);
    expect(orderingSettingsInput.safeParse({ menu: "holiday", enabled: true, subtitle: "Back for Thanksgiving", leadHours: "72", pickupFrom: "2026-11-25", pickupTo: "2026-11-26", tileImage: "" }).success).toBe(true);
  });
});

describe("orderingMenus (NW03-1) and the drawer links", () => {
  it("both off: 2 options, Express Catering goes to /catering", () => {
    expect(orderingMenus({ expressOn: false, holidayOn: false })).toEqual([
      { label: "Restaurant", href: "/menu" },
      { label: "Express Catering", href: "/catering" },
    ]);
    expect(liveOrderingLinks({ expressOn: false, holidayOn: false })).toEqual([]);
  });
  it("express on: still 2 options, Express Catering goes to its ordering page", () => {
    const m = orderingMenus({ expressOn: true, holidayOn: false });
    expect(m).toHaveLength(2);
    expect(m[1].href).toBe("/menus/express-catering");
  });
  it("holiday on: 3 options, the board's singular label", () => {
    const m = orderingMenus({ expressOn: false, holidayOn: true });
    expect(m.map((x) => x.label)).toEqual(["Restaurant", "Express Catering", "Holiday Preorder"]);
    expect(m[2].href).toBe("/menus/holiday-preorders");
    expect(liveOrderingLinks({ expressOn: false, holidayOn: true })).toEqual([{ label: "Holiday Preorder", href: "/menus/holiday-preorders" }]);
  });
  it("only the two slugs map to a menu", () => {
    expect(menuFromSlug("express-catering")).toBe("express");
    expect(menuFromSlug("holiday-preorders")).toBe("holiday");
    expect(menuFromSlug("express")).toBeNull();
    expect(orderReference("express", 42)).toBe("EC-1042");
    expect(orderReference("holiday", 7)).toBe("HP-1007");
  });
});

describe("server re-pricing and the estimate (spec 4.1 step 5)", () => {
  const rows = [
    { id: 1, name: "Taco Bar", price: 12000, priceNote: "serves 10", minQty: 1, maxQty: 10 },
    { id: 2, name: "Burrito Pack", price: null, priceNote: null, minQty: 2, maxQty: 100 },
  ];
  it("prices come from the rows, never the request", () => {
    const r = priceLines([{ itemId: 1, quantity: 2 }], rows);
    expect(r).toEqual({ ok: true, lines: [{ itemId: 1, name: "Taco Bar", unitPrice: 12000, priceNote: "serves 10", quantity: 2 }] });
  });
  it("an unknown or inactive item, a quantity outside min..max, or over 200 units is refused", () => {
    expect(priceLines([{ itemId: 9, quantity: 1 }], rows)).toEqual({ ok: false, reason: "changed" });
    expect(priceLines([{ itemId: 1, quantity: 11 }], rows)).toEqual({ ok: false, reason: "quantity" });
    expect(priceLines([{ itemId: 2, quantity: 1 }], rows)).toEqual({ ok: false, reason: "quantity" });
    expect(priceLines([{ itemId: 2, quantity: 100 }, { itemId: 1, quantity: 10 }], rows)).toEqual({ ok: true, lines: expect.any(Array) });
    const big = [...rows, { id: 3, name: "Wings", price: 100, priceNote: null, minQty: 1, maxQty: 100 }];
    expect(priceLines([{ itemId: 2, quantity: 100 }, { itemId: 3, quantity: 100 }, { itemId: 1, quantity: 1 }], big)).toEqual({ ok: false, reason: "total" });
  });
  it("estimate: correct cents sum, null when any line is price-on-request or nothing is picked", () => {
    expect(estimateTotal([{ unitPrice: 12000, quantity: 2 }, { unitPrice: 350, quantity: 3 }])).toBe(25050);
    expect(estimateTotal([{ unitPrice: 12000, quantity: 2 }, { unitPrice: null, quantity: 3 }])).toBeNull();
    expect(estimateTotal([])).toBeNull();
  });
});

describe("buildOrderRequestEmail (spec 4.3)", () => {
  const req = {
    id: 42,
    menu: "express" as const,
    name: "QA Guest\r\nBcc: evil@x.com",
    email: "guest@x.com",
    phone: "(804) 555-0100",
    pickupDate: "2026-11-20",
    pickupTime: "11:30",
    notes: "<b>no onions</b>",
    estimatedTotal: null,
  };
  const lines = [
    { name: "Taco Bar", quantity: 2, unitPrice: 12000, priceNote: "serves 10" },
    { name: "Burrito Pack", quantity: 3, unitPrice: null },
  ];
  const mail = buildOrderRequestEmail(req, lines, "bookings@x.com", ["copy@x.com", "BOOKINGS@x.com"], "Site <noreply@x.com>");
  it("subject carries the reference and pickup, and no CR/LF", () => {
    expect(mail.subject).toBe("Order request EC-1042: Express Catering, pickup Fri Nov 20 11:30 AM");
    expect(mail.subject).not.toMatch(/[\r\n]/);
  });
  it("copies go as BCC without repeating the To address; the guest is only reply_to", () => {
    expect(mail.to).toEqual(["bookings@x.com"]);
    expect(mail.bcc).toEqual(["copy@x.com"]);
    expect(mail).not.toHaveProperty("cc");
    expect(mail.reply_to).toBe("guest@x.com");
    expect(JSON.stringify([mail.to, mail.bcc])).not.toContain("guest@x.com");
  });
  it("plain text only, with price-on-request lines and the total to confirm", () => {
    expect(mail).not.toHaveProperty("html");
    expect(mail.text).toContain("2 x Taco Bar, $120.00 each (serves 10)");
    expect(mail.text).toContain("3 x Burrito Pack, price on request");
    expect(mail.text).toContain("Total to confirm");
    expect(mail.text).toContain("Name: QA Guest Bcc: evil@x.com");
  });
});

describe("rateLimit (in-memory, per instance)", () => {
  afterEach(() => vi.useRealTimers());
  it("allows `limit` hits per window, then refuses until the window passes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-04T12:00:00Z"));
    const key = `qa-order-${Math.random()}`;
    for (let i = 0; i < 5; i++) expect(rateLimit(key, 5, 10 * 60_000).ok).toBe(true);
    const blocked = rateLimit(key, 5, 10 * 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(600);
    vi.setSystemTime(new Date("2026-11-04T12:10:01Z"));
    expect(rateLimit(key, 5, 10 * 60_000).ok).toBe(true);
  });
});
