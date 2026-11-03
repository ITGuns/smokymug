/**
 * Board H01 ("Should be dropdown routing to the 3 separate ordering menus") +
 * NW03-1 ("drops into 2 to 3 options ... Restaurant, Express Catering, Holiday
 * Preorder"). What each option opens today, while NW03's ordering pages are
 * phase 2:
 * - Restaurant: /menu (the NW03 "All Day" tile links to this page).
 * - Express Catering: /catering, until the Express Catering ordering page exists.
 * - Holiday Preorder: not listed; its page and its on/off toggle are phase 2.
 */
export const ORDERING_MENUS: { label: string; href: string }[] = [
  { label: "Restaurant", href: "/menu" },
  { label: "Express Catering", href: "/catering" },
];
