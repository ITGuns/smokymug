/**
 * Board H01 ("Should be dropdown routing to the 3 separate ordering menus") +
 * NW03-1 ("drops into 2 to 3 options (depending on whether holiday preorder
 * menu is active): Restaurant, Express Catering, Holiday Preorder"). Phase 2,
 * built 4 Nov 2026 (docs/phase2-ordering-spec.md 2.3):
 * - Restaurant: /menu (the NW03 "All Day" tile links to this page too).
 * - Express Catering: its ordering page while its switch is on, else /catering.
 * - Holiday Preorder: listed only while its switch is on.
 */
export type OrderingSwitches = { expressOn: boolean; holidayOn: boolean };

export const EXPRESS_PATH = "/menus/express-catering";
export const HOLIDAY_PATH = "/menus/holiday-preorders";

export function orderingMenus(s: OrderingSwitches): { label: string; href: string }[] {
  return [
    { label: "Restaurant", href: "/menu" },
    { label: "Express Catering", href: s.expressOn ? EXPRESS_PATH : "/catering" },
    ...(s.holidayOn ? [{ label: "Holiday Preorder", href: HOLIDAY_PATH }] : []),
  ];
}

/** Drawer "Menus" accordion (P4 override, 4 Nov): the ordering pages that are on, nothing else. */
export function liveOrderingLinks(s: OrderingSwitches): { label: string; href: string }[] {
  return [
    ...(s.expressOn ? [{ label: "Express Catering", href: EXPRESS_PATH }] : []),
    ...(s.holidayOn ? [{ label: "Holiday Preorder", href: HOLIDAY_PATH }] : []),
  ];
}
