/**
 * GA03 ("Format Auto Adjust/Arrange", "Minimize Negative Space"): split items
 * into `columns` lists whose heights end close together. Heights come from the
 * known aspect ratios, so the result is the same at any column width.
 *
 * 1. Shortest-column placement in admin order (keeps the first rows in the
 *    order set by the gallery drag-to-reorder).
 * 2. Then moves or swaps between the tallest and the shortest column, using
 *    only items from the second half of the list, while that narrows the gap.
 *
 * `ratios[i]` = height / width of item i; `gap` = vertical gap / column width.
 * Returns item indexes per column, each column in ascending (admin) order.
 */
export function balanceColumns(ratios: number[], columns: number, gap = 0): number[][] {
  const n = Math.max(1, Math.floor(columns));
  const cols: number[][] = Array.from({ length: n }, () => []);
  const h = new Array<number>(n).fill(0);
  const cost = (i: number) => ratios[i] + gap;

  ratios.forEach((_, i) => {
    const c = h.indexOf(Math.min(...h));
    cols[c].push(i);
    h[c] += cost(i);
  });

  const movable = (i: number) => i >= ratios.length / 2;
  for (let round = 0; round < 200; round++) {
    const hi = h.indexOf(Math.max(...h));
    const lo = h.indexOf(Math.min(...h));
    const spread = h[hi] - h[lo];
    let best: { gap: number; a: number; b?: number } | null = null;
    for (const a of cols[hi].filter(movable)) {
      const moved = Math.abs(h[hi] - cost(a) - (h[lo] + cost(a)));
      if (moved < spread - 1e-9 && (!best || moved < best.gap)) best = { gap: moved, a };
      for (const b of cols[lo].filter(movable)) {
        const d = cost(a) - cost(b);
        if (d <= 0) continue;
        const swapped = Math.abs(h[hi] - d - (h[lo] + d));
        if (swapped < spread - 1e-9 && (!best || swapped < best.gap)) best = { gap: swapped, a, b };
      }
    }
    if (!best) break;
    cols[hi] = cols[hi].filter((x) => x !== best.a);
    cols[lo].push(best.a);
    h[hi] -= cost(best.a);
    h[lo] += cost(best.a);
    if (best.b != null) {
      const b = best.b;
      cols[lo] = cols[lo].filter((x) => x !== b);
      cols[hi].push(b);
      h[lo] -= cost(b);
      h[hi] += cost(b);
    }
  }
  return cols.map((c) => [...c].sort((x, y) => x - y));
}
