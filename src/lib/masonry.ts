/**
 * GA03 ("Format Auto Adjust/Arrange", "Minimize Negative Space"): split items
 * into `columns` lists whose heights end close together. Heights come from the
 * known aspect ratios, so the result is the same at any column width.
 *
 * 1. Shortest-column placement in admin order, so the top row is the admin's
 *    first photos in the order set by the gallery drag-to-reorder.
 * 2. Then, while it narrows the gap between the tallest and shortest column,
 *    moves one photo between any two columns or swaps two, using every photo
 *    except that top row. (Admin add/remove, 4 Nov: limiting this to the second
 *    half of the list left gaps up to ~200px after a single removal.)
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

  // Score after shifting `d` of height from column `from` to column `to`: spread first, then sum of squares as the tie-break.
  const score = (from: number, to: number, d: number): [number, number] => {
    let max = -Infinity;
    let min = Infinity;
    let sq = 0;
    for (let c = 0; c < n; c++) {
      const v = c === from ? h[c] - d : c === to ? h[c] + d : h[c];
      max = Math.max(max, v);
      min = Math.min(min, v);
      sq += v * v;
    }
    return [max - min, sq];
  };
  const better = (a: [number, number], b: [number, number]) => a[0] < b[0] - 1e-9 || (Math.abs(a[0] - b[0]) <= 1e-9 && a[1] < b[1] - 1e-9);
  const movable = (i: number) => i >= n;

  for (let round = 0; round < 200; round++) {
    let best: { s: [number, number]; from: number; to: number; a: number; b?: number } | null = null;
    const current = score(0, 0, 0);
    for (let from = 0; from < n; from++) {
      for (let to = 0; to < n; to++) {
        if (from === to) continue;
        for (const a of cols[from].filter(movable)) {
          const moved = score(from, to, cost(a));
          if (better(moved, best?.s ?? current)) best = { s: moved, from, to, a };
          if (to < from) continue; // each swap pair is tried once
          for (const b of cols[to].filter(movable)) {
            const swapped = score(from, to, cost(a) - cost(b));
            if (better(swapped, best?.s ?? current)) best = { s: swapped, from, to, a, b };
          }
        }
      }
    }
    if (!best) break;
    const { from, to, a, b } = best;
    cols[from] = cols[from].filter((x) => x !== a);
    cols[to] = [...cols[to], a];
    h[from] -= cost(a);
    h[to] += cost(a);
    if (b != null) {
      cols[to] = cols[to].filter((x) => x !== b);
      cols[from] = [...cols[from], b];
      h[to] -= cost(b);
      h[from] += cost(b);
    }
  }
  return cols.map((c) => [...c].sort((x, y) => x - y));
}
