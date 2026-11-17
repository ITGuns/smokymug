import { describe, expect, it } from "vitest";
import { calendarClosures, closedNote } from "@/lib/calendar-closures";

// Audit F10 (18 Nov 2026): Hours closures show on /calendar without a second entry.

const closed = (date: string, reason: string | null = null) => ({ date, closed: true, reason });

describe("calendarClosures (F10)", () => {
  it("turns closed Hours overrides into closed days, labelled by the reason or Closed", () => {
    expect(calendarClosures([closed("2027-01-09", "Private party"), closed("2027-01-05")], [])).toEqual([
      { date: "2027-01-05", label: "Closed" },
      { date: "2027-01-09", label: "Private party" },
    ]);
  });

  it("leaves special-hours overrides off the calendar", () => {
    const special = { date: "2026-12-24", closed: false, reason: "Early closure at 12pm" };
    expect(calendarClosures([special], [])).toEqual([]);
  });

  it("treats a blank reason as no reason", () => {
    expect(calendarClosures([closed("2027-02-01", "   ")], [])).toEqual([{ date: "2027-02-01", label: "Closed" }]);
  });

  it("does not repeat a closure that already has its own Closed event that day", () => {
    const overrides = [closed("2026-11-26", "Thanksgiving"), closed("2026-12-25"), closed("2026-12-31", "Staff party")];
    const events = [
      { date: "2026-11-26", title: "Closed Thanksgiving" },
      { date: "2026-12-25", title: "Closed" },
      { date: "2026-12-31", title: "Trivia" },
      { date: "2026-12-31", title: "Early closure at 12pm" },
    ];
    expect(calendarClosures(overrides, events)).toEqual([{ date: "2026-12-31", label: "Staff party" }]);
  });
});

describe("closedNote", () => {
  it("does not say Closed twice", () => {
    expect(closedNote({ date: "2027-01-05", label: "Closed" })).toBe("All day");
    expect(closedNote({ date: "2027-01-09", label: "Private party" })).toBe("Closed all day");
  });
});
