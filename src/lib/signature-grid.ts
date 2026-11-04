/* H04 (4 Nov 2026, "Utilize Empty Space"): column spans for the home
   Signature grid, derived from the item count so no count from 1 to
   SIGNATURE_MAX leaves an empty cell. md = 6 columns, lg = 12 columns.
   Below md the section is a swipe carousel, so spans don't apply. */

// The home section shows at most 8 featured dishes (the count the client saw and
// approved on the board); H04 asked for no holes, not for more cards.
export const SIGNATURE_MAX = 8;

export type LeadLayout = "full" | "wide" | "tall";
export type CardSpan = { md: 3 | 6; lg: 3 | 4 | 5 | 6 | 12 };

/** Splits `n` cards into rows of at most `max`, sizes as even as possible (5 at max 4 -> 3 + 2). */
export function balancedRows(n: number, max: number): number[] {
  if (n <= 0) return [];
  const rows = Math.ceil(n / max);
  const base = Math.floor(n / rows);
  const extra = n % rows;
  return Array.from({ length: rows }, (_, i) => base + (i < extra ? 1 : 0));
}

const LG_SPAN: Record<number, CardSpan["lg"]> = { 1: 12, 2: 6, 3: 4, 4: 3 };
const MD_SPAN: Record<number, CardSpan["md"]> = { 1: 6, 2: 3 };

/**
 * hasLead = the first item is the big photo card. At lg it fills 7 of 12 columns:
 * - with 2+ other cards it spans two rows and the first two cards (5 columns) sit beside it;
 * - with exactly 1 other card it stays one row tall beside that card;
 * - alone it takes the full row.
 * Every other card packs into balanced rows of up to 4 (lg) and 2 (md).
 * `rest` = how many cards follow the lead (or all cards when there is no lead).
 */
export function signatureSpans(rest: number, hasLead: boolean): { lead: LeadLayout | null; cards: CardSpan[] } {
  const mdSpans = balancedRows(rest, 2).flatMap((size) => Array<CardSpan["md"]>(size).fill(MD_SPAN[size]));
  const lgTail = (n: number) => balancedRows(n, 4).flatMap((size) => Array<CardSpan["lg"]>(size).fill(LG_SPAN[size]));

  let lead: LeadLayout | null = null;
  let lgSpans: CardSpan["lg"][];
  if (!hasLead) lgSpans = lgTail(rest);
  else if (rest === 0) {
    lead = "full";
    lgSpans = [];
  } else if (rest === 1) {
    lead = "wide";
    lgSpans = [5];
  } else {
    lead = "tall";
    lgSpans = [5, 5, ...lgTail(rest - 2)];
  }
  return { lead, cards: lgSpans.map((lg, i) => ({ md: mdSpans[i], lg })) };
}
