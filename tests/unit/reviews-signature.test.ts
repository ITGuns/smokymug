import { describe, expect, it } from "vitest";
import type { Review } from "@/db/schema";
import { daysBetween, HOME_REVIEW_LIMIT, initialsFor, reviewFreshness, reviewMonth, selectHomeReviews } from "@/lib/reviews";
import { balancedRows, SIGNATURE_MAX, signatureSpans } from "@/lib/signature-grid";
import { reviewInput } from "@/lib/validation";

// Shapes only: every name and text here is a QA placeholder, not a review.
let nextId = 1;
const row = (over: Partial<Review> = {}): Review => ({
  id: nextId++,
  reviewerInitials: "QA",
  platform: "Google",
  themes: [],
  sentiment: null,
  displayOrder: 0,
  active: true,
  reviewerName: null,
  rating: null,
  reviewDate: null,
  body: null,
  adminAdded: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...over,
});

describe("home review selection (C9)", () => {
  const seeded = Array.from({ length: 6 }, (_, i) => row({ displayOrder: i }));

  it("keeps the seeded order when nothing is dated", () => {
    expect(selectHomeReviews(seeded).map((r) => r.id)).toEqual(seeded.map((r) => r.id));
  });

  it("puts a new good review first and drops the oldest past the cap", () => {
    const fresh = row({ rating: 5, reviewDate: "2026-11-01", adminAdded: true, reviewerName: "QA one", body: "QA text" });
    const out = selectHomeReviews([...seeded, fresh]);
    expect(out).toHaveLength(HOME_REVIEW_LIMIT);
    expect(out[0].id).toBe(fresh.id);
    expect(out.map((r) => r.id)).not.toContain(seeded[5].id);
  });

  it("orders dated reviews newest first and skips hidden or under-4-star ones", () => {
    const older = row({ rating: 4, reviewDate: "2026-03-01" });
    const newer = row({ rating: 5, reviewDate: "2026-09-01" });
    const low = row({ rating: 3, reviewDate: "2026-10-30" });
    const hidden = row({ rating: 5, reviewDate: "2026-10-31", active: false });
    const out = selectHomeReviews([older, low, hidden, newer, ...seeded]);
    expect(out.slice(0, 2).map((r) => r.id)).toEqual([newer.id, older.id]);
    expect(out.map((r) => r.id)).not.toContain(low.id);
    expect(out.map((r) => r.id)).not.toContain(hidden.id);
  });

  it("flags the section as stale after 90 days, and undated when nothing shown has a date", () => {
    expect(reviewFreshness(seeded, "2026-11-04")).toEqual({ state: "undated" });
    expect(reviewFreshness([row({ reviewDate: "2026-08-06" })], "2026-11-04")).toEqual({ state: "fresh", newest: "2026-08-06", days: 90 });
    expect(reviewFreshness([row({ reviewDate: "2026-08-05" })], "2026-11-04")).toEqual({ state: "stale", newest: "2026-08-05", days: 91 });
    expect(daysBetween("2026-02-28", "2026-03-01")).toBe(1);
  });

  it("derives initials and formats the month without the server timezone", () => {
    expect(initialsFor("QA Tester")).toBe("QT");
    expect(initialsFor("  qa  ")).toBe("QA");
    expect(initialsFor("H&A")).toBe("H&A");
    expect(reviewMonth("2026-10-01")).toBe("Oct 2026");
  });
});

describe("review validation (C9)", () => {
  const today = "2026-11-04";
  const ok = { reviewerName: " QA Tester ", platform: "Yelp", rating: "5", reviewDate: "2026-11-04", body: " QA body ", active: true };

  it("accepts a review, trims text and coerces the rating", () => {
    expect(reviewInput(today).parse(ok)).toEqual({ reviewerName: "QA Tester", platform: "Yelp", rating: 5, reviewDate: "2026-11-04", body: "QA body", active: true });
  });

  it("rejects out-of-range ratings, future or junk dates, unknown sources and missing or long text", () => {
    const bad = (patch: Record<string, unknown>) => reviewInput(today).safeParse({ ...ok, ...patch }).success;
    expect(bad({ rating: "0" })).toBe(false);
    expect(bad({ rating: "6" })).toBe(false);
    expect(bad({ rating: "4.5" })).toBe(false);
    expect(bad({ rating: "" })).toBe(false);
    expect(bad({ reviewDate: "2026-11-05" })).toBe(false);
    expect(bad({ reviewDate: "2026-02-30" })).toBe(false);
    expect(bad({ reviewDate: "1999-01-01" })).toBe(false);
    expect(bad({ platform: "Instagram" })).toBe(false);
    expect(bad({ body: "   " })).toBe(false);
    expect(bad({ body: "x".repeat(1001) })).toBe(false);
    expect(bad({ body: "x".repeat(1000) })).toBe(true);
    expect(bad({ reviewerName: "" })).toBe(false);
    expect(bad({ reviewerName: "x".repeat(61) })).toBe(false);
  });
});

describe("signature grid spans (H04)", () => {
  it("balances rows", () => {
    expect(balancedRows(5, 4)).toEqual([3, 2]);
    expect(balancedRows(9, 4)).toEqual([3, 3, 3]);
    expect(balancedRows(0, 4)).toEqual([]);
  });

  /** Simulates the CSS grid: every row must be exactly full. The tall lead fills 7 columns of the first two rows. */
  const rowsFull = (cols: number, spans: number[], leadCols = 0, leadRows = 0) => {
    const rows: number[] = [];
    let r = 0;
    for (let i = 0; i < leadRows; i++) rows.push(leadCols);
    for (const s of spans) {
      while ((rows[r] ?? 0) + s > cols) r++;
      rows[r] = (rows[r] ?? 0) + s;
    }
    return rows.every((n) => n === cols);
  };

  for (let total = 1; total <= SIGNATURE_MAX; total++) {
    for (const hasLead of [true, false]) {
      it(`${total} item${total === 1 ? "" : "s"} ${hasLead ? "with" : "without"} a photo lead leave no empty cell at md or lg`, () => {
        const rest = hasLead ? total - 1 : total;
        const { lead, cards } = signatureSpans(rest, hasLead);
        expect(cards).toHaveLength(rest);
        // md: lead is a full 6-column row of its own.
        expect(rowsFull(6, cards.map((c) => c.md))).toBe(true);
        // lg
        const leadCols = lead === "full" ? 12 : lead ? 7 : 0;
        const leadRows = lead === "tall" ? 2 : lead ? 1 : 0;
        expect(rowsFull(12, cards.map((c) => c.lg), leadCols, leadRows)).toBe(true);
      });
    }
  }

  it("keeps the shipped layout for the old 7-item case", () => {
    expect(signatureSpans(6, true)).toEqual({ lead: "tall", cards: [5, 5, 3, 3, 3, 3].map((lg) => ({ md: 3, lg })) });
  });
});
