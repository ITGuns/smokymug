import type { BookingSettings, BookingWindow, Hours, MenuCategory, MenuItem } from "@/db/schema";
import type { Clock } from "@/lib/availability";

export const settings = (over: Partial<BookingSettings> = {}): BookingSettings => ({
  id: 1,
  slotIntervalMinutes: 30,
  turnTimeMinutes: 90,
  minPartySize: 1,
  maxPartySize: 10,
  largePartyThreshold: 7,
  maxBookingsPerSlot: 4,
  maxCoversPerSlot: 24,
  minLeadTimeMinutes: 60,
  maxDaysInAdvance: 60,
  autoConfirm: true,
  bookingsEnabled: true,
  seatingPreferences: [],
  occasions: [],
  timezone: "America/New_York",
  createdAt: "",
  updatedAt: "",
  ...over,
});

export const window = (dayOfWeek: number, startTime: string, endTime: string, label: string | null = null): BookingWindow => ({
  id: dayOfWeek * 10,
  dayOfWeek,
  startTime,
  endTime,
  label,
  active: true,
  createdAt: "",
  updatedAt: "",
});

/** Wednesday 2026-09-23 10:00 in the restaurant's zone. */
export const clock = (over: Partial<Clock> = {}): Clock => ({ date: "2026-09-23", time: "10:00", minutes: 600, dayOfWeek: 3, ...over });

export const hoursRow = (category: Hours["category"], dayOfWeek: number, opensAt: string | null, closesAt: string | null, isClosed = false): Hours => ({
  id: 0,
  category,
  dayOfWeek,
  opensAt,
  closesAt,
  isClosed,
  note: null,
  createdAt: "",
  updatedAt: "",
});

export const category = (over: Partial<MenuCategory> = {}): MenuCategory => ({
  id: 1,
  name: "Craft Barbecue",
  slug: "craft-barbecue",
  description: null,
  hoursNote: null,
  hoursCategory: "bbq",
  availableDays: null,
  startTime: null,
  endTime: null,
  displayOrder: 0,
  active: true,
  createdAt: "",
  updatedAt: "",
  ...over,
});

export const item = (over: Partial<MenuItem> = {}): MenuItem => ({
  id: 1,
  sectionId: 1,
  name: "Brisket",
  slug: "brisket",
  description: null,
  price: 1700,
  largePrice: null,
  bottlePrice: null,
  priceNote: null,
  image: null,
  imageAlt: null,
  dietaryTags: [],
  availabilityType: "always",
  availableDays: null,
  availableStartTime: null,
  availableEndTime: null,
  availabilityNote: null,
  happyHourEligible: false,
  happyHourNote: null,
  notes: null,
  featured: false,
  active: true,
  displayOrder: 0,
  createdAt: "",
  updatedAt: "",
  ...over,
});

/** Store hours matching the seed. */
export const storeHours: Hours[] = [
  hoursRow("store", 1, "07:00", "12:00"),
  hoursRow("store", 2, "07:00", "21:00"),
  hoursRow("store", 3, "07:00", "21:00"),
  hoursRow("store", 4, "07:00", "21:00"),
  hoursRow("store", 5, "07:00", "22:00"),
  hoursRow("store", 6, "08:00", "22:00"),
  hoursRow("store", 0, "09:30", "14:30"),
  hoursRow("bbq", 2, "11:30", "21:00"),
  hoursRow("bbq", 3, "11:30", "21:00"),
  hoursRow("bbq", 4, "11:30", "21:00"),
  hoursRow("bbq", 5, "11:30", "21:00"),
  hoursRow("bbq", 6, "11:30", "21:00"),
  hoursRow("brunch", 0, "09:30", "14:30"),
  hoursRow("happy_hour", 3, "15:00", "18:00"),
  hoursRow("breakfast", 3, null, "11:30"),
];
