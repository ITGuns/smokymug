import { describe, expect, it } from "vitest";
import { addMonths, daysInMonth, monthBounds, monthGridCells, monthKey, monthLabel, parseMonthParam } from "@/lib/month-grid";

const NOV = { year: 2026, month: 11 };

describe("parseMonthParam", () => {
  it("accepts YYYY-MM and rejects everything else", () => {
    expect(parseMonthParam("2026-11", NOV)).toEqual({ year: 2026, month: 11 });
    expect(parseMonthParam("2027-01", NOV)).toEqual({ year: 2027, month: 1 });
    for (const bad of [undefined, "", "2026-13", "2026-00", "1999-05", "2101-05", "nov-2026", "2026-1", ["2026-11"]] as const) {
      expect(parseMonthParam(bad as string | string[] | undefined, NOV)).toEqual(NOV);
    }
  });
});

describe("addMonths", () => {
  it("rolls across year boundaries both ways", () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(addMonths(NOV, -11)).toEqual({ year: 2025, month: 12 });
    expect(addMonths(NOV, 14)).toEqual({ year: 2028, month: 1 });
  });
});

describe("month facts", () => {
  it("knows month lengths, labels, keys and bounds", () => {
    expect(daysInMonth({ year: 2026, month: 2 })).toBe(28);
    expect(daysInMonth({ year: 2028, month: 2 })).toBe(29); // leap
    expect(daysInMonth(NOV)).toBe(30);
    expect(monthLabel(NOV)).toBe("November 2026");
    expect(monthKey({ year: 2027, month: 3 })).toBe("2027-03");
    expect(monthBounds(NOV)).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(monthBounds({ year: 2026, month: 12 })).toEqual({ from: "2026-12-01", to: "2026-12-31" });
  });
});

describe("monthGridCells", () => {
  it("November 2026 starts on a Sunday and fits exactly five weeks", () => {
    const cells = monthGridCells(NOV);
    expect(cells).toHaveLength(35);
    expect(cells[0]).toEqual({ date: "2026-11-01", day: 1, inMonth: true });
    expect(cells[34]).toEqual({ date: "2026-12-05", day: 5, inMonth: false });
    expect(cells.filter((c) => c.inMonth)).toHaveLength(30);
  });

  it("August 2026 needs six weeks and pads both ends", () => {
    const cells = monthGridCells({ year: 2026, month: 8 });
    expect(cells).toHaveLength(42);
    // Aug 1 2026 is a Saturday: six leading July cells.
    expect(cells.slice(0, 6).every((c) => !c.inMonth)).toBe(true);
    expect(cells[6]).toEqual({ date: "2026-08-01", day: 1, inMonth: true });
    expect(cells.at(-1)).toEqual({ date: "2026-09-05", day: 5, inMonth: false });
  });

  it("dates are consecutive across the whole grid", () => {
    const cells = monthGridCells({ year: 2028, month: 2 });
    for (let i = 1; i < cells.length; i++) {
      const prev = new Date(`${cells[i - 1].date}T00:00:00Z`).getTime();
      const cur = new Date(`${cells[i].date}T00:00:00Z`).getTime();
      expect(cur - prev).toBe(86_400_000);
    }
  });
});
