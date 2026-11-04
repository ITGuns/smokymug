import { sql } from "drizzle-orm";
import { boolean, check, customType, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Shared vocab                                                        */
/* ------------------------------------------------------------------ */

export const DIETARY_TAGS = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "vegetarian-option",
  "vegan-option",
  "gluten-free-option",
  "non-alcoholic",
] as const;
export type DietaryTag = (typeof DIETARY_TAGS)[number];

export const AVAILABILITY_TYPES = ["always", "days", "schedule", "seasonal"] as const;
export type AvailabilityType = (typeof AVAILABILITY_TYPES)[number];

export const RESERVATION_STATUSES = ["pending", "confirmed", "cancelled", "completed", "no_show"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

// R2-03 / board H05: taco_tuesday is its own public window ("Taco Tuesdays,
// Tues 11:30AM - 9PM"); it overlaps the Tex Mex Tuesday window on purpose
// until Genrou reconciles the hours (Q9).
export const HOURS_CATEGORIES = ["store", "breakfast", "cafe_fare", "cafe_drinks", "bbq", "tex_mex", "taco_tuesday", "brunch", "happy_hour", "wine_wednesday"] as const;
export type HoursCategory = (typeof HOURS_CATEGORIES)[number];

export const SECTION_TYPES = ["items", "addons"] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
};
const autoId = () => integer("id").primaryKey().generatedByDefaultAsIdentity();
const jsonArray = <T>(name: string) => jsonb(name).$type<T>().notNull().default(sql`'[]'::jsonb`);

export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/* ------------------------------------------------------------------ */
/* Restaurant + settings                                               */
/* ------------------------------------------------------------------ */

export const restaurantInfo = pgTable("restaurant_info", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  // C10: the footer tagline is its own editable string (falls back to tagline),
  // so the copy-sheet replacement can't ripple into the hero.
  footerTagline: text("footer_tagline"),
  category: text("category").notNull(),
  description: text("description").notNull(),
  addressLine1: text("address_line1").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  neighborhood: text("neighborhood"),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  // Board CA03: catering inquiries address (falls back to email when empty)
  cateringEmail: text("catering_email"),
  website: text("website"),
  instagramUrl: text("instagram_url"),
  facebookUrl: text("facebook_url"),
  giftCardUrl: text("gift_card_url"),
  giftCardBalanceUrl: text("gift_card_balance_url"),
  loyaltyUrl: text("loyalty_url"),
  marketingSignupUrl: text("marketing_signup_url"),
  brunchReservationUrl: text("brunch_reservation_url"),
  // C2/Q8: SpotOn online-ordering link. ORDER NOW buttons hide while this is empty.
  orderUrl: text("order_url"),
  logoUrl: text("logo_url"),
  ogImageUrl: text("og_image_url"),
  features: jsonArray<string[]>("features"),
  cafeSummary: text("cafe_summary"),
  bbqSummary: text("bbq_summary"),
  ...timestamps,
});

export const hours = pgTable(
  "hours",
  {
    id: autoId(),
    category: text("category").$type<HoursCategory>().notNull(),
    /** 0 = Sunday … 6 = Saturday */
    dayOfWeek: integer("day_of_week").notNull(),
    /** "HH:MM" 24h; null = "from opening" */
    opensAt: text("opens_at"),
    closesAt: text("closes_at"),
    isClosed: boolean("is_closed").notNull().default(false),
    note: text("note"),
    ...timestamps,
  },
  (t) => [uniqueIndex("hours_category_day_idx").on(t.category, t.dayOfWeek)],
);

export const bookingSettings = pgTable("booking_settings", {
  id: integer("id").primaryKey(),
  slotIntervalMinutes: integer("slot_interval_minutes").notNull().default(30),
  turnTimeMinutes: integer("turn_time_minutes").notNull().default(90),
  minPartySize: integer("min_party_size").notNull().default(1),
  maxPartySize: integer("max_party_size").notNull().default(10),
  largePartyThreshold: integer("large_party_threshold").notNull().default(7),
  maxBookingsPerSlot: integer("max_bookings_per_slot").notNull().default(4),
  maxCoversPerSlot: integer("max_covers_per_slot").notNull().default(24),
  minLeadTimeMinutes: integer("min_lead_time_minutes").notNull().default(60),
  maxDaysInAdvance: integer("max_days_in_advance").notNull().default(60),
  autoConfirm: boolean("auto_confirm").notNull().default(true),
  bookingsEnabled: boolean("bookings_enabled").notNull().default(true),
  seatingPreferences: jsonArray<string[]>("seating_preferences"),
  occasions: jsonArray<string[]>("occasions"),
  timezone: text("timezone").notNull().default("America/New_York"),
  ...timestamps,
});

export const bookingWindows = pgTable(
  "booking_windows",
  {
    id: autoId(),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    label: text("label"),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("booking_windows_day_idx").on(t.dayOfWeek)],
);

export const dateOverrides = pgTable(
  "date_overrides",
  {
    id: autoId(),
    /** YYYY-MM-DD */
    date: text("date").notNull(),
    closed: boolean("closed").notNull().default(true),
    startTime: text("start_time"),
    endTime: text("end_time"),
    reason: text("reason"),
    ...timestamps,
  },
  (t) => [uniqueIndex("date_overrides_date_idx").on(t.date)],
);

/* ------------------------------------------------------------------ */
/* Reservations                                                        */
/* ------------------------------------------------------------------ */

export const reservations = pgTable(
  "reservations",
  {
    id: autoId(),
    confirmationCode: text("confirmation_code").notNull(),
    manageToken: text("manage_token").notNull(),
    idempotencyKey: text("idempotency_key"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    partySize: integer("party_size").notNull(),
    /** YYYY-MM-DD */
    date: text("date").notNull(),
    /** HH:MM */
    time: text("time").notNull(),
    specialRequests: text("special_requests"),
    seatingPreference: text("seating_preference"),
    occasion: text("occasion"),
    status: text("status").$type<ReservationStatus>().notNull().default("pending"),
    source: text("source").notNull().default("web"),
    internalNotes: text("internal_notes"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("reservations_code_idx").on(t.confirmationCode),
    uniqueIndex("reservations_idem_idx").on(t.idempotencyKey),
    index("reservations_date_idx").on(t.date, t.time),
    index("reservations_status_idx").on(t.status),
    // Integrity the app also checks; the DB enforces it against raw writes and races.
    check("reservations_party_size_check", sql`${t.partySize} between 1 and 50`),
    check("reservations_status_check", sql`${t.status} in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')`),
    uniqueIndex("reservations_active_slot_idx")
      .on(t.email, t.date, t.time)
      .where(sql`${t.status} in ('pending', 'confirmed')`),
  ],
);

/* ------------------------------------------------------------------ */
/* Menu                                                                */
/* ------------------------------------------------------------------ */

export const menuCategories = pgTable(
  "menu_categories",
  {
    id: autoId(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    hoursNote: text("hours_note"),
    hoursCategory: text("hours_category").$type<HoursCategory>(),
    availableDays: jsonb("available_days").$type<number[]>(),
    startTime: text("start_time"),
    endTime: text("end_time"),
    displayOrder: integer("display_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex("menu_categories_slug_idx").on(t.slug)],
);

export const modifierGroups = pgTable("modifier_groups", {
  id: autoId(),
  key: text("key"),
  name: text("name").notNull(),
  description: text("description"),
  required: boolean("required").notNull().default(false),
  minSelections: integer("min_selections").notNull().default(0),
  maxSelections: integer("max_selections").notNull().default(1),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const modifiers = pgTable(
  "modifiers",
  {
    id: autoId(),
    groupId: integer("group_id")
      .notNull()
      .references(() => modifierGroups.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    /** cents; 0 = included */
    priceAdjustment: integer("price_adjustment").notNull().default(0),
    dietaryTags: jsonArray<DietaryTag[]>("dietary_tags"),
    availabilityNote: text("availability_note"),
    availableDays: jsonb("available_days").$type<number[]>(),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("modifiers_group_idx").on(t.groupId)],
);

export const menuSections = pgTable(
  "menu_sections",
  {
    id: autoId(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => menuCategories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    sectionType: text("section_type").$type<SectionType>().notNull().default("items"),
    linkedModifierGroupId: integer("linked_modifier_group_id").references(() => modifierGroups.id, { onDelete: "set null" }),
    displayOrder: integer("display_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("menu_sections_category_idx").on(t.categoryId), uniqueIndex("menu_sections_cat_slug_idx").on(t.categoryId, t.slug)],
);

export const menuItems = pgTable(
  "menu_items",
  {
    id: autoId(),
    sectionId: integer("section_id")
      .notNull()
      .references(() => menuSections.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    /** cents; null = variable price (see priceNote) */
    price: integer("price"),
    largePrice: integer("large_price"),
    bottlePrice: integer("bottle_price"),
    priceNote: text("price_note"),
    image: text("image"),
    imageAlt: text("image_alt"),
    dietaryTags: jsonArray<DietaryTag[]>("dietary_tags"),
    availabilityType: text("availability_type").$type<AvailabilityType>().notNull().default("always"),
    availableDays: jsonb("available_days").$type<number[]>(),
    availableStartTime: text("available_start_time"),
    availableEndTime: text("available_end_time"),
    availabilityNote: text("availability_note"),
    happyHourEligible: boolean("happy_hour_eligible").notNull().default(false),
    happyHourNote: text("happy_hour_note"),
    notes: text("notes"),
    featured: boolean("featured").notNull().default(false),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("menu_items_section_idx").on(t.sectionId), uniqueIndex("menu_items_slug_idx").on(t.slug), index("menu_items_featured_idx").on(t.featured)],
);

/** D1 / board MB03 (4 Nov 2026): optional show-from / show-until dates for
 *  limited or seasonal items. Outside them the item is left off the public
 *  menu, its search, the featured picks and the home grid. A side table, not
 *  columns on menu_items: the site layout reads every menu_items column on
 *  every page, and prod may run this code before its `db:push`; reads fall
 *  back to "no schedule" while the table is missing. A row exists only while
 *  a date is set. Rows go with their item, so `db:reseed --force` (which
 *  rebuilds menu_items) wipes every schedule typed in admin. */
export const menuItemSchedules = pgTable(
  "menu_item_schedules",
  {
    itemId: integer("item_id")
      .primaryKey()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    /** YYYY-MM-DD in the restaurant's timezone: first day shown. null = no start date. */
    showFrom: text("show_from"),
    /** YYYY-MM-DD: last day shown (inclusive). null = no end date. */
    showUntil: text("show_until"),
  },
  (t) => [
    check("menu_item_schedules_set_check", sql`${t.showFrom} is not null or ${t.showUntil} is not null`),
    check("menu_item_schedules_order_check", sql`${t.showFrom} is null or ${t.showUntil} is null or ${t.showUntil} >= ${t.showFrom}`),
  ],
);

export const menuItemModifierGroups = pgTable(
  "menu_item_modifier_groups",
  {
    itemId: integer("item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    groupId: integer("group_id")
      .notNull()
      .references(() => modifierGroups.id, { onDelete: "cascade" }),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.itemId, t.groupId] })],
);

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

export const galleryImages = pgTable("gallery_images", {
  id: autoId(),
  file: text("file").notNull(),
  alt: text("alt").notNull(),
  caption: text("caption"),
  tag: text("tag").notNull().default("bbq"),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  sourceUrl: text("source_url"),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const reviews = pgTable("reviews", {
  id: autoId(),
  reviewerInitials: text("reviewer_initials").notNull(),
  platform: text("platform").notNull(),
  themes: jsonArray<string[]>("themes"),
  sentiment: text("sentiment"),
  displayOrder: integer("display_order").notNull().default(0),
  /** Show on site. */
  active: boolean("active").notNull().default(true),
  /* C9/H06 (4 Nov 2026): real reviews entered in admin. All nullable so the
     seeded theme summaries (no date, rating or text) stay valid. Read with the
     db-errors fallback in lib/data/reviews.ts until prod runs db:push. */
  reviewerName: text("reviewer_name"),
  rating: integer("rating"),
  /** YYYY-MM-DD, the date on the platform. */
  reviewDate: text("review_date"),
  body: text("body"),
  /** true = typed in admin. A reseed only replaces the seeded rows (false). */
  adminAdded: boolean("admin_added").notNull().default(false),
  ...timestamps,
});

export const cateringInquiries = pgTable("catering_inquiries", {
  id: autoId(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  occasion: text("occasion").notNull(),
  eventDate: text("event_date"),
  guestCount: integer("guest_count"),
  serviceType: text("service_type").notNull(),
  message: text("message"),
  status: text("status").notNull().default("new"),
  ...timestamps,
});

/** NW01 (base scope): events shown on /calendar. The event type (B6 icons)
 *  lives in `event_kinds` below, not here: prod may run this code before its
 *  `db:push`, and every events read selects all of these columns. */
export const events = pgTable(
  "events",
  {
    id: autoId(),
    title: text("title").notNull(),
    /** YYYY-MM-DD */
    date: text("date").notNull(),
    /** "HH:MM" 24h; null = all day (or see description) */
    startTime: text("start_time"),
    endTime: text("end_time"),
    description: text("description"),
    linkUrl: text("link_url"),
    linkLabel: text("link_label"),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("events_date_idx").on(t.date)],
);

/** NW02 (base scope): the Special Events page switch and its editable copy.
 *  While `enabled` is false, /special-events returns 404 (dev spec); while it
 *  is true, the header and footer show a Specials link (NW02, built 3 Nov). */
export const specialEvents = pgTable("special_events", {
  id: integer("id").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  ...timestamps,
});

/** B6 / board L6 (in scope per Pol, 3 Nov): one optional type per event, shown
 *  as an icon on /calendar with a legend. Side table so a prod database without
 *  it still renders the calendar (reads fall back to "no type"). Admin-owned:
 *  `db:reseed` neither seeds nor wipes it; rows go when their event goes. */
export const eventKinds = pgTable("event_kinds", {
  eventId: integer("event_id")
    .primaryKey()
    .references(() => events.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
});

/** Settings added 3 Nov (BK02 SpotOn box, CA03 dual paper trail). One row,
 *  id 1, in its own table so the site chrome's all-columns reads never touch
 *  it; every read falls back to the defaults while the table is missing
 *  (prod before `db:push`). Admin-owned: `db:reseed` inserts the default row
 *  only if none exists and never wipes it. */
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey(),
  /** BK02: SpotOn reservations link, framed on /book (null = phone card). */
  reservationsUrl: text("reservations_url"),
  /** The native booking wizard on /book. Off by default (BK02 crossed it out);
   *  the e2e suite turns it on for its own runs. */
  bookingWizard: boolean("booking_wizard").notNull().default(false),
  /** CA03: extra addresses copied on every catering inquiry email. */
  inquiryCc: jsonArray<string[]>("inquiry_cc"),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/* Phase 2 ordering (Pol 4 Nov 2026): order REQUESTS, never payments.   */
/* Spec: docs/phase2-ordering-spec.md. All four tables are new, so no   */
/* existing all-columns read can break; reads fall back while missing. */
/* Admin-owned: never seeded, never in the db:reseed delete list.       */
/* ------------------------------------------------------------------ */

export const ORDER_MENUS = ["express", "holiday"] as const;
export type OrderMenu = (typeof ORDER_MENUS)[number];
export const ORDER_REQUEST_STATUSES = ["new", "confirmed", "completed", "declined", "cancelled"] as const;
export type OrderRequestStatus = (typeof ORDER_REQUEST_STATUSES)[number];
export const NOTIFY_STATUSES = ["pending", "sent", "failed", "off", "skipped"] as const;
export type NotifyStatus = (typeof NOTIFY_STATUSES)[number];

/** One row, id 1. Every read falls back to the defaults (both menus OFF) while it is missing. */
export const orderingSettings = pgTable(
  "ordering_settings",
  {
    id: integer("id").primaryKey(),
    expressEnabled: boolean("express_enabled").notNull().default(false),
    /** null = the board copy */
    expressSubtitle: text("express_subtitle"),
    expressLeadHours: integer("express_lead_hours").notNull().default(48),
    holidayEnabled: boolean("holiday_enabled").notNull().default(false),
    holidaySubtitle: text("holiday_subtitle"),
    /** YYYY-MM-DD */
    holidayPickupFrom: text("holiday_pickup_from"),
    holidayPickupTo: text("holiday_pickup_to"),
    holidayLeadHours: integer("holiday_lead_hours").notNull().default(72),
    /** null = the code default photo */
    tileImageAllDay: text("tile_image_all_day"),
    tileImageExpress: text("tile_image_express"),
    tileImageHoliday: text("tile_image_holiday"),
    ...timestamps,
  },
  (t) => [check("ordering_lead_check", sql`${t.expressLeadHours} between 0 and 336 and ${t.holidayLeadHours} between 0 and 336`)],
);

/** Express Catering packs and Holiday Preorder items. Nothing seeded; price null = "Price on request". */
export const orderItems = pgTable(
  "order_items",
  {
    id: autoId(),
    menu: text("menu").$type<OrderMenu>().notNull(),
    name: text("name").notNull(),
    description: text("description"),
    /** cents */
    price: integer("price"),
    priceNote: text("price_note"),
    image: text("image"),
    imageAlt: text("image_alt"),
    minQty: integer("min_qty").notNull().default(1),
    maxQty: integer("max_qty").notNull().default(20),
    active: boolean("active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("order_items_menu_idx").on(t.menu, t.displayOrder),
    check("order_items_menu_check", sql`${t.menu} in ('express', 'holiday')`),
    check("order_items_qty_check", sql`${t.minQty} >= 1 and ${t.maxQty} >= ${t.minQty} and ${t.maxQty} <= 100`),
    check("order_items_price_check", sql`${t.price} is null or ${t.price} >= 0`),
  ],
);

/** A guest's pickup request. PII: name, email, phone, notes. Never a payment record. */
export const orderRequests = pgTable(
  "order_requests",
  {
    id: autoId(),
    menu: text("menu").$type<OrderMenu>().notNull(),
    status: text("status").$type<OrderRequestStatus>().notNull().default("new"),
    name: text("name").notNull(),
    /** stored lowercased */
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    pickupDate: text("pickup_date").notNull(),
    pickupTime: text("pickup_time").notNull(),
    notes: text("notes"),
    /** cents; null when any line is price-on-request */
    estimatedTotal: integer("estimated_total"),
    idempotencyKey: text("idempotency_key").notNull(),
    notifyStatus: text("notify_status").$type<NotifyStatus>().notNull().default("pending"),
    /** staff only */
    internalNotes: text("internal_notes"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("order_requests_idem_idx").on(t.idempotencyKey),
    index("order_requests_status_pickup_idx").on(t.status, t.pickupDate),
    index("order_requests_created_idx").on(t.createdAt),
    index("order_requests_email_idx").on(t.email),
    check("order_requests_menu_check", sql`${t.menu} in ('express', 'holiday')`),
    check("order_requests_status_check", sql`${t.status} in ('new', 'confirmed', 'completed', 'declined', 'cancelled')`),
    check("order_requests_notify_check", sql`${t.notifyStatus} in ('pending', 'sent', 'failed', 'off', 'skipped')`),
  ],
);

/** Line items, snapshotted: later price edits or item deletes never rewrite a request. */
export const orderRequestLines = pgTable(
  "order_request_lines",
  {
    id: autoId(),
    requestId: integer("request_id")
      .notNull()
      .references(() => orderRequests.id, { onDelete: "cascade" }),
    itemId: integer("item_id").references(() => orderItems.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    unitPrice: integer("unit_price"),
    priceNote: text("price_note"),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_request_lines_request_idx").on(t.requestId), check("order_request_lines_qty_check", sql`${t.quantity} between 1 and 100`)],
);

/** NW02: uploaded flyers/menus shown as the Special Events image grid. */
export const specialEventImages = pgTable("special_event_images", {
  id: autoId(),
  file: text("file").notNull(),
  alt: text("alt").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  ...timestamps,
});

/** Admin-uploaded images, stored in Postgres so deployments need no disk or bucket. */
export const uploads = pgTable(
  "uploads",
  {
    id: autoId(),
    name: text("name").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    data: bytea("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uploads_name_idx").on(t.name)],
);

/* ------------------------------------------------------------------ */
/* Admin auth                                                          */
/* ------------------------------------------------------------------ */

export const adminUsers = pgTable(
  "admin_users",
  {
    id: autoId(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    /** scrypt: salt:hash (hex) */
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("admin"),
    /** Bumped on password change; sessions carrying an older value are rejected. */
    sessionVersion: integer("session_version").notNull().default(1),
    lastLoginAt: text("last_login_at"),
    ...timestamps,
  },
  (t) => [uniqueIndex("admin_users_email_idx").on(t.email)],
);

/* ------------------------------------------------------------------ */
/* Inferred types                                                      */
/* ------------------------------------------------------------------ */

export type RestaurantInfo = typeof restaurantInfo.$inferSelect;
export type Hours = typeof hours.$inferSelect;
export type BookingSettings = typeof bookingSettings.$inferSelect;
export type BookingWindow = typeof bookingWindows.$inferSelect;
export type DateOverride = typeof dateOverrides.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type MenuCategory = typeof menuCategories.$inferSelect;
export type MenuSection = typeof menuSections.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
export type MenuItemSchedule = typeof menuItemSchedules.$inferSelect;
export type ModifierGroup = typeof modifierGroups.$inferSelect;
export type Modifier = typeof modifiers.$inferSelect;
export type GalleryImage = typeof galleryImages.$inferSelect;
export type SiteEvent = typeof events.$inferSelect;
export type SpecialEventsSettings = typeof specialEvents.$inferSelect;
export type SpecialEventImage = typeof specialEventImages.$inferSelect;
export type SiteSettingsRow = typeof siteSettings.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type CateringInquiry = typeof cateringInquiries.$inferSelect;
export type OrderingSettingsRow = typeof orderingSettings.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderRequest = typeof orderRequests.$inferSelect;
export type OrderRequestLine = typeof orderRequestLines.$inferSelect;
export type Upload = typeof uploads.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
