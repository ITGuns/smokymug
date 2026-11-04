import type { MenuTree } from "@/lib/data/menu";
import { shortDate } from "./format";

/** D1 / board MB03: a menu item's optional show-from / show-until dates
 *  (YYYY-MM-DD, restaurant timezone, both days inclusive; null = open-ended).
 *  `today` always comes from getClock() with the restaurant's timezone, the one
 *  time source the store status and hours already use. */
export type ItemSchedule = { showFrom: string | null; showUntil: string | null };

export const NO_SCHEDULE: ItemSchedule = { showFrom: null, showUntil: null };

/** True when the item belongs on the public menu on `today`. Missing fields
 *  (a cached tree from before this column existed) count as open-ended. */
export function onSchedule(s: Partial<ItemSchedule>, today: string): boolean {
  if (s.showFrom && today < s.showFrom) return false;
  if (s.showUntil && today > s.showUntil) return false;
  return true;
}

/** The public menu as of `today`: items outside their dates are left out, so the
 *  menu, its search, the featured picks and the home grid all skip them. Sections
 *  and categories stay, even when emptied, like an emptied section does today. */
export function scheduledMenu(tree: MenuTree, today: string): MenuTree {
  return {
    ...tree,
    categories: tree.categories.map((c) => ({
      ...c,
      sections: c.sections.map((s) => ({ ...s, items: s.items.filter((i) => onSchedule(i, today)) })),
    })),
  };
}

export type ScheduleTag = { label: string; tone: "purple" | "gray"; hidden: boolean };

/** Admin list and editor label. null = no date affects the item any more. */
export function scheduleTag(s: Partial<ItemSchedule>, today: string): ScheduleTag | null {
  if (s.showFrom && today < s.showFrom) return { label: `Scheduled · from ${shortDate(s.showFrom)}`, tone: "purple", hidden: true };
  if (s.showUntil && today > s.showUntil) return { label: `Ended ${shortDate(s.showUntil)}`, tone: "gray", hidden: true };
  if (s.showUntil) return { label: `Ends ${shortDate(s.showUntil)}`, tone: "purple", hidden: false };
  return null;
}
