import type { DietaryTag, HoursCategory, ReservationStatus } from "@/db/schema";

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const DIETARY_LABELS: Record<DietaryTag, { label: string; short: string; description: string }> = {
  vegetarian: { label: "Vegetarian", short: "V", description: "Vegetarian" },
  vegan: { label: "Vegan", short: "VG", description: "Vegan" },
  "gluten-free": { label: "Gluten-free", short: "GF", description: "Gluten-free" },
  "vegetarian-option": { label: "Vegetarian option", short: "V*", description: "Vegetarian option available" },
  "vegan-option": { label: "Vegan option", short: "VG*", description: "Vegan option available" },
  "gluten-free-option": { label: "GF option", short: "GF*", description: "Gluten-free option available" },
  "non-alcoholic": { label: "Non-alcoholic", short: "N.A.", description: "Non-alcoholic" },
};

export const DIETARY_FILTERS = [
  { key: "vegetarian", label: "Vegetarian", matches: ["vegetarian", "vegetarian-option", "vegan", "vegan-option"] },
  { key: "vegan", label: "Vegan", matches: ["vegan", "vegan-option"] },
  { key: "gluten-free", label: "Gluten-free", matches: ["gluten-free", "gluten-free-option"] },
  { key: "non-alcoholic", label: "Non-alcoholic", matches: ["non-alcoholic"] },
] as const satisfies ReadonlyArray<{ key: string; label: string; matches: readonly DietaryTag[] }>;

export type DietaryFilterKey = (typeof DIETARY_FILTERS)[number]["key"];

export const HOURS_CATEGORY_LABELS: Record<HoursCategory, string> = {
  store: "Store hours",
  breakfast: "Breakfast",
  cafe_fare: "Cafe fare",
  cafe_drinks: "Cafe + drinks",
  bbq: "Craft barbecue",
  brunch: "Sunday brunch",
  happy_hour: "Happy hour",
  wine_wednesday: "Wine Wednesdays",
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

export const SERVICE_TYPES = ["Pick-up", "Delivery", "Full service", "Restaurant rental", "Not sure yet"] as const;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3107");
