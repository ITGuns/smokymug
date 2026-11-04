/* C9 / board H06 (4 Nov 2026): the home Reviews section keeps itself fresh.
   Pure helpers so the selection rule is unit tested, not just eyeballed. */

import type { Review } from "@/db/schema";

/** Cards on the home carousel: the count the section shipped with (6 seeded summaries). */
export const HOME_REVIEW_LIMIT = 6;
/** Reviews rated below this never show on the site. */
export const GOOD_RATING = 4;
/** Admin nudge: the newest review shown is older than this. */
export const STALE_AFTER_DAYS = 90;

export const REVIEW_SOURCES = ["Google", "Yelp", "Facebook", "Tripadvisor", "Other"] as const;
export type ReviewSource = (typeof REVIEW_SOURCES)[number];

/** Seeded theme summaries carry no rating; they were picked as very positive, so they count as good. */
export const isGoodReview = (r: Pick<Review, "rating">) => r.rating == null || r.rating >= GOOD_RATING;

/** Newest dated first, undated (seeded) after, then the old manual order. */
export function compareReviews(a: Review, b: Review): number {
  if (a.reviewDate !== b.reviewDate) {
    if (!a.reviewDate) return 1;
    if (!b.reviewDate) return -1;
    return a.reviewDate < b.reviewDate ? 1 : -1;
  }
  return a.displayOrder - b.displayOrder || b.id - a.id;
}

/** What the home page shows: visible, good, newest first, capped. A new good review pushes the oldest off. */
export function selectHomeReviews(rows: Review[], limit = HOME_REVIEW_LIMIT): Review[] {
  return rows
    .filter((r) => r.active && isGoodReview(r))
    .sort(compareReviews)
    .slice(0, limit);
}

/** Whole days from `from` to `to`, both YYYY-MM-DD. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export type Freshness =
  | { state: "fresh"; newest: string; days: number }
  | { state: "stale"; newest: string; days: number }
  | { state: "undated" };

/** Freshness of what the home page shows today (YYYY-MM-DD in the restaurant's timezone). */
export function reviewFreshness(shown: Review[], today: string): Freshness {
  const newest = shown.map((r) => r.reviewDate).filter((d): d is string => !!d).sort().pop();
  if (!newest) return { state: "undated" };
  const days = daysBetween(newest, today);
  return { state: days > STALE_AFTER_DAYS ? "stale" : "fresh", newest, days };
}

/** "Sam D." -> "SD", "H&A" stays. Used for the avatar when admin types a name. */
export function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1 && words[0].length <= 3) return words[0].toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** "2026-10-03" -> "Oct 2026". Fixed locale and UTC so server and client render the same text. */
export function reviewMonth(ymd: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${ymd}T00:00:00Z`));
}
