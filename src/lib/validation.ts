import { z } from "zod";
import { AVAILABILITY_TYPES, DIETARY_TAGS, HOURS_CATEGORIES, ORDER_MENUS, ORDER_REQUEST_STATUSES, RESERVATION_STATUSES } from "@/db/schema";
import { looksLikeCardNumber, MAX_LINE_QTY, MAX_LINES } from "@/lib/ordering";
import { EVENT_KIND_KEYS } from "@/lib/event-kinds";
import { GALLERY_TAG_KEYS } from "@/lib/gallery-tags";
import { REVIEW_SOURCES } from "@/lib/reviews";

const ymd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
  // Round-trip through Date.UTC: 2026-11-31 rolls over to Dec 1 and is rejected instead of booking the wrong weekday.
  // Zod 4 still runs this after a failed regex, so it must not throw on junk (NaN parts just compare false).
  .refine((v) => {
    const [y, m, d] = v.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }, "Invalid date");
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

function isHttpUrl(v: string): boolean {
  try {
    const { protocol } = new URL(v);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
/** Optional email: "" → null, otherwise a valid address. */
const optionalEmail = (max = 120) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((v) => !v || z.email().safeParse(v).success, "Enter a valid email")
    .transform((v) => (v ? v : null))
    .nullable()
    .optional();

/** External link: "" → null, otherwise an absolute http(s) URL. A bare "smokymug.com" would render as a broken relative link. */
const optionalHttpUrl = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((v) => !v || isHttpUrl(v), "Enter a full link starting with https://")
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
  // Honeypot. The action checks it on the raw body BEFORE this parse (P7, 4 Nov), so a
  // bot gets the silent success; max(0) here used to turn that into field errors instead.
  website: z.string().max(200).optional(),
});
export type CateringInput = z.infer<typeof cateringInput>;

/* ---------------- Public: phase 2 order requests ---------------- */

const CARD_MESSAGE = "Please don't put card details here. You pay at pickup or through SpotOn.";

export const orderRequestInput = z.object({
  menu: z.enum(ORDER_MENUS),
  lines: z
    .array(
      z.object({
        itemId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(MAX_LINE_QTY, `Up to ${MAX_LINE_QTY} of one item`),
      }),
    )
    .min(1, "Pick at least one item")
    .max(MAX_LINES, `Up to ${MAX_LINES} different items per request`)
    .refine((l) => new Set(l.map((x) => x.itemId)).size === l.length, "Each item once"),
  name: z
    .string("Name is required")
    .trim()
    .min(1, "Name is required")
    .max(100)
    .refine((v) => !looksLikeCardNumber(v), CARD_MESSAGE),
  email: z.email("Enter a valid email").max(120),
  phone,
  pickupDate: ymd,
  pickupTime: hhmm,
  notes: emptyToNull(500).refine((v) => !v || !looksLikeCardNumber(v), CARD_MESSAGE),
  idempotencyKey: z.string().trim().min(8).max(64),
  website: z.string().max(200).optional(), // honeypot, checked BEFORE parse
});
export type OrderRequestInput = z.infer<typeof orderRequestInput>;

/* ---------------- Admin: phase 2 ordering ---------------- */

/** Only paths next/image renders under the current remotePatterns (next.config.ts). */
const sitePhoto = z
  .string()
  .trim()
  .max(300)
  .refine((v) => !v || (/^\/(images|uploads)\/[\w.-]+$/.test(v) && !v.includes("..")), "Upload a photo or pick one from the library")
  .transform((v) => (v ? v : null))
  .nullable()
  .optional();
const optionalYmd = z
  .union([ymd, z.literal(""), z.null()])
  .optional()
  .transform((v) => (v ? v : null));
const leadHours = z.coerce.number("Enter a number of hours").int("Whole hours only").min(0, "0 or more").max(336, "Up to 336 hours (14 days)");

export const orderItemInput = z
  .object({
    id: z.number().int().positive().optional(),
    menu: z.enum(ORDER_MENUS),
    name: z.string("Name is required").trim().min(1, "Name is required").max(120),
    description: emptyToNull(600),
    price: cents,
    priceNote: emptyToNull(60),
    image: sitePhoto,
    imageAlt: emptyToNull(200),
    minQty: z.coerce.number("Enter a number").int("Whole numbers only").min(1, "At least 1").max(MAX_LINE_QTY, `Up to ${MAX_LINE_QTY}`),
    maxQty: z.coerce.number("Enter a number").int("Whole numbers only").min(1, "At least 1").max(MAX_LINE_QTY, `Up to ${MAX_LINE_QTY}`),
    active: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.maxQty < v.minQty) ctx.addIssue({ code: "custom", path: ["maxQty"], message: "Must be at least the minimum" });
    if (v.image && !v.imageAlt) ctx.addIssue({ code: "custom", path: ["imageAlt"], message: "Describe the photo" });
  });

export const orderingSettingsInput = z
  .discriminatedUnion("menu", [
    z.object({ menu: z.literal("express"), enabled: z.boolean(), subtitle: emptyToNull(200), leadHours, tileImage: sitePhoto }),
    z.object({
      menu: z.literal("holiday"),
      enabled: z.boolean(),
      subtitle: emptyToNull(200),
      leadHours,
      pickupFrom: optionalYmd,
      pickupTo: optionalYmd,
      tileImage: sitePhoto,
    }),
    z.object({ menu: z.literal("allDay"), tileImage: sitePhoto }),
  ])
  .superRefine((v, ctx) => {
    if (v.menu === "holiday" && v.pickupFrom && v.pickupTo && v.pickupTo < v.pickupFrom) {
      ctx.addIssue({ code: "custom", path: ["pickupTo"], message: "The last pickup day can't be before the first" });
    }
  });
export type OrderingSettingsInput = z.infer<typeof orderingSettingsInput>;

const recordId = z.number().int().positive();
export const orderIdInput = recordId;
export const orderStatusInput = z.object({ id: recordId, status: z.enum(ORDER_REQUEST_STATUSES) });
export const orderNoteInput = z.object({
  id: recordId,
  note: emptyToNull(500).refine((v) => !v || !looksLikeCardNumber(v), "Never store card numbers here."),
});
export const orderItemActiveInput = z.object({ id: recordId, active: z.boolean() });
export const orderItemsOrderInput = z.object({
  menu: z.enum(ORDER_MENUS),
  ids: z
    .array(recordId)
    .min(1)
    .max(500)
    .refine((ids) => new Set(ids).size === ids.length, "Each item once"),
});

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

export const menuItemInput = z
  .object({
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
    /** D1 / board MB03: optional dates, both days inclusive; "" clears. */
    showFrom: optionalYmd,
    showUntil: optionalYmd,
  })
  .superRefine((v, ctx) => {
    if (v.showFrom && v.showUntil && v.showUntil < v.showFrom) {
      ctx.addIssue({ code: "custom", path: ["showUntil"], message: "The last day can't be before the first day" });
    }
    // Store hours end before midnight, and a window that runs past it (22:00 to 02:00)
    // would read as never available, so the end must come after the start. Only the
    // rules that use times are checked: the editor keeps hidden times in its state.
    const timed = v.availabilityType === "days" || v.availabilityType === "schedule";
    if (timed && v.availableStartTime && v.availableEndTime && v.availableEndTime <= v.availableStartTime) {
      ctx.addIssue({ code: "custom", path: ["availableEndTime"], message: "End time must be after the start time" });
    }
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
  footerTagline: emptyToNull(200),
  category: z.string().trim().max(120),
  description: z.string().trim().max(1000),
  addressLine1: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(60),
  state: z.string().trim().min(2).max(20),
  zip: z.string().trim().min(3).max(12),
  neighborhood: emptyToNull(200),
  phone: z.string().trim().min(7).max(25),
  email: z.email().max(120),
  cateringEmail: optionalEmail(120),
  website: optionalHttpUrl(200),
  instagramUrl: optionalHttpUrl(200),
  facebookUrl: optionalHttpUrl(200),
  giftCardUrl: optionalHttpUrl(200),
  giftCardBalanceUrl: optionalHttpUrl(200),
  loyaltyUrl: optionalHttpUrl(200),
  marketingSignupUrl: optionalHttpUrl(200),
  brunchReservationUrl: optionalHttpUrl(200),
  orderUrl: optionalHttpUrl(200),
  features: z.array(z.string().trim().min(1).max(120)).default([]),
  cafeSummary: emptyToNull(300),
  bbqSummary: emptyToNull(300),
});

/* ---------------- Admin: calendar + special events ---------------- */

export const eventInput = z.object({
  id: z.coerce.number().int().optional(),
  title: z.string().trim().min(1, "Title is required").max(120),
  date: ymd,
  startTime: optionalHhmm.optional(),
  endTime: optionalHhmm.optional(),
  description: emptyToNull(600),
  linkUrl: optionalHttpUrl(300),
  linkLabel: emptyToNull(60),
  active: z.coerce.boolean().default(true),
  /** B6 event type; "" = no type */
  kind: z
    .union([z.enum(EVENT_KIND_KEYS), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v ? v : null)),
});
export type EventInput = z.infer<typeof eventInput>;

/** BK02: SpotOn reservations link + the native-wizard switch. */
export const reservationSettingsInput = z.object({
  reservationsUrl: optionalHttpUrl(500),
  bookingWizard: z.coerce.boolean().default(false),
});

/** CA03: extra inquiry recipients, one per line or comma-separated (max 10). */
export const inquiryCopiesInput = z.object({
  inquiryCc: z
    .string()
    .max(2000)
    .transform((s) => [...new Set(s.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))])
    .refine((list) => list.length <= 10, "Up to 10 addresses")
    .refine((list) => list.every((e) => z.email().safeParse(e).success), "One of these is not a valid email address"),
});

export const specialEventsInput = z.object({
  enabled: z.coerce.boolean(),
  title: z.string().trim().min(1, "Title is required").max(120),
  subtitle: emptyToNull(300),
});

/** Full flyer set, in display order; existing rows carry their id. */
export const specialEventImagesInput = z
  .array(
    z.object({
      id: z.coerce.number().int().optional(),
      file: z.string().trim().min(1).max(300),
      alt: z.string().trim().min(1, "Describe the image").max(200),
    }),
  )
  .max(60);

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

/** Full gallery order: every image id once, first id = first photo shown. */
export const galleryOrderInput = z
  .array(z.number().int().positive())
  .min(1, "The gallery order can't be empty")
  .max(1000)
  .refine((ids) => new Set(ids).size === ids.length, "Each photo can appear only once");

const galleryPhotoFields = {
  alt: z.string("Describe the photo").trim().min(1, "Describe the photo").max(200, "Keep it under 200 characters"),
  tag: z.enum(GALLERY_TAG_KEYS, "Pick a category"),
  active: z.boolean(),
};
/** GA03's masonry lays tiles out from width/height, so a new photo carries the pixel size the admin's browser decoded (EXIF rotation applied). */
const photoSide = z.coerce.number("We couldn't read the photo's size. Choose it again.").int().min(1, "We couldn't read the photo's size. Choose it again.").max(20_000, "That photo is too large. Resize it and try again.");

export const galleryPhotoNewInput = z.object({ ...galleryPhotoFields, width: photoSide, height: photoSide });
export const galleryPhotoEditInput = z.object({ id: z.number().int().positive(), ...galleryPhotoFields });
export const galleryPhotoIdInput = z.number().int().positive();

/** C9 reviews: copied from Google, Yelp and the like. today = YYYY-MM-DD in the
 *  restaurant's timezone, so a review can't be dated in the future. */
export const reviewInput = (today: string) =>
  z.object({
    id: z.number().int().positive().optional(),
    reviewerName: z.string("Enter the reviewer's name").trim().min(1, "Enter the reviewer's name").max(60, "Keep it under 60 characters"),
    platform: z.enum(REVIEW_SOURCES, "Pick where the review was posted"),
    rating: z.coerce.number("Pick a star rating").int("Pick a star rating").min(1, "Pick a star rating").max(5, "Pick a star rating"),
    reviewDate: ymd.refine((d) => d <= today, "The review date can't be in the future").refine((d) => d >= "2015-01-01", "Check the year"),
    body: z.string("Paste the review text").trim().min(1, "Paste the review text").max(1000, "Keep it under 1,000 characters"),
    active: z.boolean(),
  });
export const reviewVisibilityInput = z.object({ id: z.number().int().positive(), active: z.boolean() });
export const reviewIdInput = z.number().int().positive();

/** Flatten zod issues into { field: message } */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
