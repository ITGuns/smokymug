import { z } from "zod";
import { AVAILABILITY_TYPES, DIETARY_TAGS, HOURS_CATEGORIES, RESERVATION_STATUSES } from "@/db/schema";

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)");
const optionalHhmm = z.union([hhmm, z.literal(""), z.null()]).transform((v) => (v ? v : null));
const phone = z
  .string()
  .trim()
  .min(7, "Enter a phone number")
  .max(25)
  .regex(/^[\d\s()+.-]+$/, "Enter a valid phone number");
const emptyToNull = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v ? v : null))
    .nullable()
    .optional();

/** cents from a dollar string / number; "" → null */
const cents = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v, ctx) => {
    if (v === "" || v == null) return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(/[$,\s]/g, ""));
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: "custom", message: "Enter a valid price" });
      return z.NEVER;
    }
    return Math.round(n * 100);
  });

const daysArray = z
  .array(z.coerce.number().int().min(0).max(6))
  .transform((a) => [...new Set(a)].sort())
  .nullable()
  .optional();

/* ---------------- Public ---------------- */

export const reservationInput = z.object({
  date: ymd,
  time: hhmm,
  partySize: z.coerce.number().int().min(1).max(50),
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  email: z.email("Enter a valid email").max(120),
  phone,
  specialRequests: emptyToNull(500),
  seatingPreference: emptyToNull(60),
  occasion: emptyToNull(60),
  idempotencyKey: z.string().trim().min(8).max(64),
});
export type ReservationInput = z.infer<typeof reservationInput>;

export const cateringInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.email("Enter a valid email").max(120),
  phone: z.union([phone, z.literal("")]).transform((v) => (v ? v : null)),
  occasion: z.string().trim().min(1, "Tell us the occasion").max(120),
  eventDate: z.union([ymd, z.literal("")]).transform((v) => (v ? v : null)),
  guestCount: z
    .union([z.coerce.number().int().min(1).max(5000), z.literal("")])
    .transform((v) => (v === "" ? null : v)),
  serviceType: z.string().trim().min(1, "Choose a service type").max(60),
  message: emptyToNull(2000),
  website: z.string().max(0).optional(), // honeypot
});
export type CateringInput = z.infer<typeof cateringInput>;

export const loginInput = z.object({
  email: z.email().max(120),
  password: z.string().min(1).max(200),
});

/* ---------------- Admin: menu ---------------- */

export const categoryInput = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().max(80).optional(),
  description: emptyToNull(500),
  hoursNote: emptyToNull(200),
  hoursCategory: z.union([z.enum(HOURS_CATEGORIES), z.literal("")]).transform((v) => (v ? v : null)),
  availableDays: daysArray,
  startTime: optionalHhmm.optional(),
  endTime: optionalHhmm.optional(),
  active: z.coerce.boolean().default(true),
});

export const sectionInput = z.object({
  id: z.coerce.number().int().optional(),
  categoryId: z.coerce.number().int(),
  name: z.string().trim().min(1).max(80),
  description: emptyToNull(300),
  sectionType: z.enum(["items", "addons"]).default("items"),
  linkedModifierGroupId: z
    .union([z.coerce.number().int(), z.literal(""), z.null()])
    .transform((v) => (v === "" || v == null ? null : v))
    .optional(),
  active: z.coerce.boolean().default(true),
});

export const menuItemInput = z.object({
  id: z.coerce.number().int().optional(),
  sectionId: z.coerce.number().int(),
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z.string().trim().max(120).optional(),
  description: emptyToNull(600),
  price: cents,
  largePrice: cents,
  bottlePrice: cents,
  priceNote: emptyToNull(60),
  image: emptyToNull(300),
  imageAlt: emptyToNull(200),
  dietaryTags: z.array(z.enum(DIETARY_TAGS)).default([]),
  availabilityType: z.enum(AVAILABILITY_TYPES).default("always"),
  availableDays: daysArray,
  availableStartTime: optionalHhmm.optional(),
  availableEndTime: optionalHhmm.optional(),
  availabilityNote: emptyToNull(80),
  happyHourEligible: z.coerce.boolean().default(false),
  happyHourNote: emptyToNull(160),
  notes: emptyToNull(300),
  featured: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(true),
  modifierGroupIds: z.array(z.coerce.number().int()).default([]),
});
export type MenuItemInput = z.infer<typeof menuItemInput>;

export const modifierGroupInput = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(1).max(80),
  description: emptyToNull(200),
  required: z.coerce.boolean().default(false),
  minSelections: z.coerce.number().int().min(0).max(20).default(0),
  maxSelections: z.coerce.number().int().min(1).max(20).default(1),
  active: z.coerce.boolean().default(true),
});

export const modifierInput = z.object({
  id: z.coerce.number().int().optional(),
  groupId: z.coerce.number().int(),
  name: z.string().trim().min(1).max(80),
  description: emptyToNull(200),
  priceAdjustment: cents.transform((v) => v ?? 0),
  dietaryTags: z.array(z.enum(DIETARY_TAGS)).default([]),
  availabilityNote: emptyToNull(80),
  availableDays: daysArray,
  active: z.coerce.boolean().default(true),
});

/* ---------------- Admin: hours + booking ---------------- */

export const hoursRowInput = z.object({
  category: z.enum(HOURS_CATEGORIES),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  opensAt: optionalHhmm,
  closesAt: optionalHhmm,
  isClosed: z.coerce.boolean().default(false),
  note: emptyToNull(300),
});

export const bookingSettingsInput = z.object({
  slotIntervalMinutes: z.coerce.number().int().min(5).max(120),
  turnTimeMinutes: z.coerce.number().int().min(15).max(360),
  minPartySize: z.coerce.number().int().min(1).max(50),
  maxPartySize: z.coerce.number().int().min(1).max(50),
  largePartyThreshold: z.coerce.number().int().min(1).max(51),
  maxBookingsPerSlot: z.coerce.number().int().min(1).max(100),
  maxCoversPerSlot: z.coerce.number().int().min(1).max(500),
  minLeadTimeMinutes: z.coerce.number().int().min(0).max(10080),
  maxDaysInAdvance: z.coerce.number().int().min(1).max(365),
  autoConfirm: z.coerce.boolean().default(true),
  bookingsEnabled: z.coerce.boolean().default(true),
  seatingPreferences: z.array(z.string().trim().min(1).max(60)).default([]),
  occasions: z.array(z.string().trim().min(1).max(60)).default([]),
});

export const bookingWindowInput = z.object({
  id: z.coerce.number().int().optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: hhmm,
  endTime: hhmm,
  label: emptyToNull(60),
  active: z.coerce.boolean().default(true),
});

export const dateOverrideInput = z.object({
  id: z.coerce.number().int().optional(),
  date: ymd,
  closed: z.coerce.boolean().default(true),
  startTime: optionalHhmm.optional(),
  endTime: optionalHhmm.optional(),
  reason: emptyToNull(160),
});

export const restaurantInfoInput = z.object({
  name: z.string().trim().min(1).max(100),
  tagline: z.string().trim().min(1).max(200),
  category: z.string().trim().max(120),
  description: z.string().trim().max(1000),
  addressLine1: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(60),
  state: z.string().trim().min(2).max(20),
  zip: z.string().trim().min(3).max(12),
  neighborhood: emptyToNull(200),
  phone: z.string().trim().min(7).max(25),
  email: z.email().max(120),
  website: emptyToNull(200),
  instagramUrl: emptyToNull(200),
  facebookUrl: emptyToNull(200),
  giftCardUrl: emptyToNull(200),
  giftCardBalanceUrl: emptyToNull(200),
  loyaltyUrl: emptyToNull(200),
  marketingSignupUrl: emptyToNull(200),
  brunchReservationUrl: emptyToNull(200),
  features: z.array(z.string().trim().min(1).max(120)).default([]),
  cafeSummary: emptyToNull(300),
  bbqSummary: emptyToNull(300),
});

/* ---------------- Admin: reservations ---------------- */

export const adminReservationInput = z.object({
  id: z.coerce.number().int().optional(),
  date: ymd,
  time: hhmm,
  partySize: z.coerce.number().int().min(1).max(100),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.email().max(120),
  phone,
  specialRequests: emptyToNull(500),
  seatingPreference: emptyToNull(60),
  occasion: emptyToNull(60),
  internalNotes: emptyToNull(500),
  status: z.enum(RESERVATION_STATUSES).default("confirmed"),
});

export const statusInput = z.enum(RESERVATION_STATUSES);

/** Flatten zod issues into { field: message } */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
