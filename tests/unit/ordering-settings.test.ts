import { beforeEach, describe, expect, it, vi } from "vitest";

/* readOrderingSettings must never break a public page on a database without the
   phase 2 tables (prod before db:push): 42P01 / 42703 give the defaults with
   available: false; any other error still throws (spec 3.3, 7.1). */

const fail = vi.hoisted(() => ({ error: null as unknown, row: null as unknown }));
vi.mock("@/db", () => {
  const chain = {
    from: () => chain,
    where: () => chain,
    limit: () => (fail.error ? Promise.reject(fail.error) : Promise.resolve(fail.row ? [fail.row] : [])),
  };
  return { db: { select: () => chain }, schema: { orderingSettings: { id: "id" }, orderItems: {}, orderRequests: {}, orderRequestLines: {}, cateringInquiries: {}, dateOverrides: {} } };
});

const { readOrderingSettings, toOrderingSettings, EXPRESS_SUBTITLE_DEFAULT, TILE_DEFAULTS } = await import("@/lib/data/ordering");

const row = (over = {}) => ({
  id: 1,
  expressEnabled: true,
  expressSubtitle: null,
  expressLeadHours: 48,
  holidayEnabled: true,
  holidaySubtitle: "Back for Thanksgiving",
  holidayPickupFrom: "2026-11-25",
  holidayPickupTo: "2026-11-26",
  holidayLeadHours: 72,
  tileImageAllDay: null,
  tileImageExpress: "/uploads/x.jpg",
  tileImageHoliday: null,
  createdAt: "",
  updatedAt: "",
  ...over,
});

describe("readOrderingSettings", () => {
  beforeEach(() => {
    fail.error = null;
    fail.row = null;
  });
  it("missing table (42P01) or column (42703, wrapped by Drizzle) gives defaults, both menus off", async () => {
    fail.error = { code: "42P01" };
    const a = await readOrderingSettings("2026-11-04");
    expect(a).toMatchObject({ available: false, expressOn: false, holidayOn: false, expressSubtitle: EXPRESS_SUBTITLE_DEFAULT, tiles: TILE_DEFAULTS });
    fail.error = { message: "Failed query", cause: { code: "42703" } };
    expect((await readOrderingSettings("2026-11-04")).available).toBe(false);
  });
  it("any other error rethrows", async () => {
    fail.error = { code: "08006", message: "connection failure" };
    await expect(readOrderingSettings("2026-11-04")).rejects.toMatchObject({ code: "08006" });
  });
  it("no row yet: defaults, available", async () => {
    expect(await readOrderingSettings("2026-11-04")).toMatchObject({ available: true, expressOn: false, holidayOn: false, expressLeadHours: 48, holidayLeadHours: 72, row: null });
  });
  it("a saved row: switches, subtitles and tile overrides apply", async () => {
    fail.row = row();
    const s = await readOrderingSettings("2026-11-04");
    expect(s).toMatchObject({ expressOn: true, holidayOn: true, expressSubtitle: EXPRESS_SUBTITLE_DEFAULT, holidaySubtitle: "Back for Thanksgiving" });
    expect(s.tiles).toEqual({ allDay: TILE_DEFAULTS.allDay, express: "/uploads/x.jpg", holiday: TILE_DEFAULTS.holiday });
  });
});

describe("toOrderingSettings: holiday is off once its window is missing or over, whatever the switch says", () => {
  it("window over", () => {
    const s = toOrderingSettings(row(), "2026-11-27");
    expect(s.holidayEnabled).toBe(true);
    expect(s.holidayOn).toBe(false);
  });
  it("window missing", () => {
    expect(toOrderingSettings(row({ holidayPickupTo: null }), "2026-11-04").holidayOn).toBe(false);
  });
  it("last pickup day is today: still on", () => {
    expect(toOrderingSettings(row(), "2026-11-26").holidayOn).toBe(true);
  });
});
