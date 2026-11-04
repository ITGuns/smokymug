# Phase 2 ordering: spec (NW03 Menus page, Express Catering, Holiday Preorders, CA01)

Status: BUILT 4 Nov 2026 (uncommitted at the time of writing; main session commits). Written before any
build work, as the triage requires (data model and threat surface first). The build follows this file; where
the build has to deviate, update this file in the same commit.

Build record (4 Nov 2026). Open questions answered by Pol: P1 commit locally only (main session pushes;
Genrou already knows the board), P2 yes, P3 yes, P5 yes, P6 yes (catering too), P7 yes, P8 yes, P9 yes.
G1 to G10: the defaults below. Deviations from this file, and why:
- P4 overridden (handoff B3 "Drawer Menu expands to the display menus"): the drawer accordion, titled
  "Menus", lists "All menus" (/menus), then Express Catering and Holiday Preorder only while each switch is
  on, then "Full menu" and the six display-menu tabs as before. `getMenuTree` stays in the site layout.
- Aesthetic order from Pol (match the existing site): /menus and both ordering pages use the /menu header
  pattern (photo, scrim, teal eyebrow, display h1, lead). /menus adds the eyebrow "Three menus" (NW03's own
  panel title) and a one-line lead; the ordering pages add a factual "Pickup only ... Order at least N hours
  ahead." line and, on Express, a link to the catering inquiry for delivery or full service (G4).
- `readOrderingSettings(today)` takes the restaurant-timezone date (needed for "holiday off once the window
  is over"); `toOrderingSettings()` is the pure part.
- Admin item photos must be `/images/<file>` or `/uploads/<file>` (stricter than "starts with / not //").
- The idempotency key is looked up before the daily DB limit, so a retry of a stored request is never
  refused; the phone limit compares the last 10 digits; the hourly email cap counts rows created in the
  last hour with `notify_status = 'sent'`; only non-sent mail outcomes are logged.
- Catering inquiries get no automatic purge: 3.5 defines retention for order requests only. Staff delete
  them from the new tab (P8). Open for Pol/Genrou.
- The reservation insert log in `actions/booking.ts` had the same PII leak as catering (5.7) and was fixed
  with it.
- Catering inquiry detail lives at `/admin/orders/catering/[id]`; the Orders page has two tabs.

INTERNAL. Section 1 quotes commercial terms from Genrou's internal handoff. Do not copy it into
BUILD-NOTES-for-Dan.md, the before/after PDF, or anything else the client sees.

Sources read for this spec (cite these, not memory):
- Client board: NW03 panel and CA01 panel (session images `17.png`, `11.png`; transcription in the session
  scratchpad `screenshot-requirements.md`, sections S4 NW03 and S9 CA01). Repo copies of the same:
  FEEDBACK-discovery-board.md:130-131 and :196-204, FEEDBACK-client-review-3nov.md:95-99, :129, :165-166.
- Genrou's developer handoff, Rev 1, 17 Oct 2026 (`SmokyMug-Dev-Handoff-INTERNAL.pdf`; text extract in the
  session scratchpad `handoff-text.txt`): page 1 lines 12-18, Q4 at lines 144-153, drawer note at line 438.
- Current code, cited as `file:line` throughout. Line numbers are against commit 0ac25a0 (HEAD, 4 Nov).
  A concurrent gallery worker has uncommitted edits that shift `src/lib/validation.ts` down by about one
  line and move the upload checks out of `src/actions/menu.ts` into a new `src/lib/uploads.ts`
  (`readImageUpload`, `uploadPath`); `uploadImage(formData)` keeps its signature and its guard. Re-read
  both files before building.

---

## 0. Decisions at a glance

| Topic | Decision |
|---|---|
| What gets built | Order REQUESTS for two menus (Express Catering, Holiday Preorders), the /menus landing page, Explore Menu third option, CA01 button, header/footer "Menus" links, admin CRUD for items, settings and requests. |
| Payments | None online. No card fields, no payment provider, no SpotOn API. Copy says payment is at pickup or through SpotOn. |
| Data model | New admin-owned tables (`ordering_settings`, `order_items`, `order_requests`, `order_request_lines`). Do NOT reuse `menu_categories`/`menu_items` (evidence in 3.1). |
| Settings home | New one-row `ordering_settings` table, NOT new columns on `site_settings` (evidence in 3.3). |
| Routes | `/menus`, `/menus/express-catering`, `/menus/holiday-preorders`; admin `/admin/orders` (+ `/admin/orders/[id]`) and `/admin/menu/ordering`. |
| Holiday off | Explore option hidden, tile stays visible but is not a link (shows the editable subtitle), page 404s like /special-events, submit refuses. |
| Express off (new switch, recommended) | Links keep pointing to /catering as today, CA01 button hidden, page 404s. Default off so the deploy never shows an empty ordering page. |
| Validation | zod on every field; server re-checks every item, price and quantity against the DB; pickup date/time checked against store hours, date overrides, lead time and the holiday window with one shared pure function. |
| Abuse | Honeypot checked BEFORE zod (silent fake success), in-memory IP limit (same helper as catering), DB-backed per-email/phone limit (works across serverless instances), card-number guard on notes, hourly cap on notification emails. |
| Mail | Store first, email second via `after()`; plain text; staff copies as BCC; never email the guest; notify outcome saved on the row and shown in admin. |

---

## 1. Scope

### 1.1 In scope (Pol, 4 Nov 2026)

Pol's decisions this build implements: build phase 2 now ("everything on the excalidraw must be done");
order REQUESTS only, NO online card payments (payment at pickup or through SpotOn); header, hero and drawer
Order Now stay on /menu.

From the client's board:
- NW03 sketch: a "MENUS." page with three photo-background tiles: ALL DAY CRAFT TEX MEX & BBQ (Breakfast,
  Lunch, Dinner, Brunch, Cafe, Bar; "This whole box links to this page", the /menu page), EXPRESS CATERING
  ("Breakfast burrito packs. Sandwich Packs. Taco Bars", links to the catering express ordering page),
  HOLIDAY PREORDERS ("subtitle needs edit capacity. Link needs toggle (on/off)", links to the holiday
  ordering page).
- NW03-1: Explore Menu drops into 2 to 3 options (Restaurant, Express Catering, Holiday Preorder; the third
  only while holiday preorders are active).
- NW03-2: Order Now buttons from other pages go to the main Restaurant Menu (already live, keep).
- NW03-3: the Menus page is reached from the "Menus" buttons in the top bar header or footer only.
- NW03-4: the page was inactive until the two ordering pages exist. They are now in scope.
- CA01: catering hero gets "Order Express Catering Now" next to Plan Your Event, linking to the Express
  Catering ordering page.

### 1.2 Scope conflict (record, and tell Genrou)

Genrou's handoff (Rev 1, 17 Oct, page 1, `handoff-text.txt` line 15) lists as out of scope: "ordering on our
own site (that is the separate $500 ordering build, not yet sent to the client)". Its Q4 row
(`handoff-text.txt` lines 149-151) repeats "Ordering on our own site is out of scope (separate $500 build)".
DESIGN.md:212 still says "Out of scope: do not build ... on-site ordering", and DESIGN.md:162-171 marks the
NW03 page "PHASE 2, do not build yet".

Pol overrode this on 4 Nov: build it now, as order requests only. Consequences:
1. Genrou must be told before any of this reaches Dan. It is an unquoted deliverable the agency planned to
   sell separately. Whether it is bundled, invoiced, or counted against the 3-hour monthly change cap
   (handoff line 17-18) is Pol's and Genrou's call, not the build's.
2. Before the first `.tsx` edit, amend DESIGN.md: §4 NW03 entry (built, per this spec) and the "Out of
   scope" paragraph (record "Pol 4 Nov: order requests built; card payments, SpotOn/Toast API and POS sync
   stay out"). The design-gate hook needs DESIGN.md to be the real contract, not a stale one.
3. BUILD-NOTES-for-Dan.md:72-80 ("Coming in phase 2") moves to the built section only after deploy, and it
   must not mention price or scope terms.
4. The $500 build was never specified in the repo. This build covers request intake only. If Genrou's $500
   scope included more (payments, POS sync, delivery), that remainder is still undefined and still unsold.

### 1.3 Explicitly out

- Online payment of any kind: no card fields, no Stripe/Square/SpotOn checkout, no deposits, no stored
  payment data. (The order form also rejects card numbers typed into the notes, see 5.6.)
- SpotOn API or Toast API work, POS sync, menu sync, inventory sync.
- Customer accounts, order lookup pages, or any customer-facing email or SMS. The restaurant contacts the
  guest itself.
- Delivery orders (default: pickup only; see open question G4). Tax, tips, fees, discounts.
- Automatic acceptance. Every request stays "new" until staff act on it.
- Per-day capacity caps (default none; open question G8).

---

## 2. Routes and pages

### 2.1 Public routes

| Route | What | Notes |
|---|---|---|
| `/menus` | NW03 landing page: "MENUS." heading band, three photo tiles | Always on once deployed. Static entry in `src/app/sitemap.ts`. |
| `/menus/express-catering` | Express Catering list + request form | 404 while Express is off. |
| `/menus/holiday-preorders` | Holiday Preorders list + request form | 404 while Holiday is off. |
| `/menu` | Unchanged restaurant menu | The ALL DAY tile and every Order Now still land here. |

Why `/menus/<slug>`: the tiles live on /menus (NW03 sketch), the slugs read like the tile titles, and one
dynamic segment `src/app/(site)/menus/[menu]/page.tsx` with a two-key allowlist
(`express-catering` -> `express`, `holiday-preorders` -> `holiday`, anything else `notFound()`) serves both
pages from one component and one form. `/catering/express` was rejected because Holiday Preorders would
then need a different parent.

Not in the sitemap: the two ordering pages. Same reason as `src/app/sitemap.ts:11-12` (static sitemap, no DB
at build time, the pages 404 while switched off). Add only `/menus`.

### 2.2 Header, drawer, footer (NW03-3)

- Desktop nav `src/components/site/Header.tsx:15-21`: first item becomes `{ href: "/menus", label: "Menus" }`.
  Active state (`Header.tsx:227`, exact match today) becomes: active on `/menus`, `/menus/*` and `/menu`.
- Header CTAs `Header.tsx:253-258` unchanged: Book a Table, then Order Now to /menu (NW03-2).
- Drawer filter `Header.tsx:354` drops `"/menu"` from the list because the accordion renders it. Change the
  filter to `"/menus"`, or the Menus link appears twice in the drawer.
- Drawer accordion `Header.tsx:314-350`: today it lists "Full menu" plus every menu category (from
  `src/app/(site)/layout.tsx:16`). Recommended: the accordion is titled "Menus" and lists "All menus"
  (/menus) then the same ordering-menu list as Explore Menu (Restaurant, Express Catering, Holiday Preorder
  when on). Evidence: the handoff drawer note says "Menu (expanding to the three menus)"
  (`handoff-text.txt` line 438), and NW03 defines the three menus. Open question P4.
- Footer `src/components/site/Footer.tsx:9-10`: first link becomes `{ href: "/menus", label: "Menus" }`.
  The Specials insertion at `Footer.tsx:35` (`slice(0, 4)`) is unaffected.
- Phone sticky bar `src/components/site/MobileCta.tsx:29` keeps "Menu" to /menu. NW03-3 says header or
  footer ONLY (open question P5).
- Other page CTAs keep /menu: `FoodStory.tsx:33` "See the full menu", `Signature.tsx:39` "View Full Menu",
  hero and drawer Order Now (`Hero.tsx:98`, `Header.tsx:379`).
- Fit check: DESIGN.md:105-106 records the 1024px bar at 912 of 928px with Specials on and Order Now
  showing. "Menus" adds one letter (about 10px at `lg:tracking-[0.14em]`). Re-measure at 1024 with Specials
  on; if it overflows, tighten the `lg` gap at `Header.tsx:225`, never wrap.

### 2.3 Explore Menu (NW03-1)

`src/lib/ordering-menus.ts:10-13` is a constant today and `Hero.tsx:13,96` imports it into a client
component. Change it to a pure function and pass the result down as a prop:

```ts
// src/lib/ordering-menus.ts
export function orderingMenus(s: { expressOn: boolean; holidayOn: boolean }): { label: string; href: string }[] {
  return [
    { label: "Restaurant", href: "/menu" },
    { label: "Express Catering", href: s.expressOn ? "/menus/express-catering" : "/catering" },
    ...(s.holidayOn ? [{ label: "Holiday Preorder", href: "/menus/holiday-preorders" }] : []),
  ];
}
```

The home page (`src/app/(site)/page.tsx:45`) reads the ordering settings server-side and passes
`menus={orderingMenus(...)}` to `<Hero>`; `Hero.tsx:96` renders `<MenuDropdown links={menus} />`. The
drawer accordion uses the same function. Labels are the board's words (NW03-1 says "Holiday Preorder",
singular, in the drop; the tile says "HOLIDAY PREORDERS").

### 2.4 /menus page (NW03 sketch)

- Standard header, then a band with the heading "MENUS." (board copy, with the period).
- Desktop: ALL DAY tile on the left spanning two rows; EXPRESS CATERING and HOLIDAY PREORDERS stacked on the
  right (the sketch's layout). Phones: one column in that order. No dead space at any breakpoint.
- Every tile: photo background with a scrim so text hits 4.5:1 (DESIGN.md:82-83), 16px radius
  (DESIGN.md:75). The whole tile is the link (one `<a>` per tile, accessible name = tile title).
- ALL DAY CRAFT TEX MEX & BBQ: the six words "Breakfast, Lunch, Dinner, Brunch, Cafe, Bar" stacked; links to
  /menu.
- EXPRESS CATERING: subtitle = admin text, default the board copy "Breakfast burrito packs. Sandwich Packs.
  Taco Bars". Links to `/menus/express-catering` when Express is on, else `/catering`.
- HOLIDAY PREORDERS: subtitle = admin text. When on: links to `/menus/holiday-preorders`. When off: see 2.6.
- Tile photos default to Dan's own photos already in the repo (from his old site): ALL DAY
  `/images/bbq-platter-mac.jpg` (`Hero.tsx:18`), EXPRESS `/images/catering-taco-platter.png`
  (`catering/page.tsx:37`, alt from `seed-data/restaurant.ts:202`), HOLIDAY `/images/catering-pork-butt.png`
  (`seed-data/restaurant.ts:204`, matches his "Christmas pork butts" line at `seed-data/restaurant.ts:224`).
  Admin can replace each (ImageUpload). Dan's own tile photos are still requested (G5).

### 2.5 CA01 button

`src/app/(site)/catering/page.tsx:48-51`: insert `Order Express Catering Now` between "Plan Your Event" and
"See services" (the board arrow points between them), `href="/menus/express-catering"`, rendered only while
Express is on. Ember fill: DESIGN.md:46-50 says every order action keeps the one brick color, and the
client's direction outranks DESIGN-STANDARD there. "See services" stays the dark variant. The page is a
server component already (`catering/page.tsx:26`), so it reads the setting directly.

### 2.6 Holiday preorders switched off (recommendation with evidence)

| Surface | Off behavior | Evidence |
|---|---|---|
| Explore Menu drop + drawer | Option not rendered (2 options) | NW03-1 "2 to 3 options (depending on whether holiday preorder menu is active)" |
| /menus tile | Still visible, NOT a link (rendered as a `<div>`, not focusable), shows the admin subtitle, or "Not taking holiday preorders right now." when empty | The board note sits inside the tile: "subtitle needs edit capacity. Link needs toggle (on/off)". The LINK toggles and the subtitle carries the message (for example "Back for Thanksgiving"). Pol's rule is a strict reading of the board. |
| /menus/holiday-preorders | `notFound()` (404) | The handoff's only on/off page convention is "a Special Events toggle that returns 404 when off" (`handoff-text.txt` line 13), built at `special-events/page.tsx:22`. One gate for page and action; no stale preorder form can be indexed or submitted off-season. |
| Submit action | Refuses: "Holiday preorders are closed right now. Call us at {phone}." | A tab left open when staff switch it off must not create a request. |
| Sitemap | Absent | `sitemap.ts:11-12` reasoning. |

Rejected: hiding the tile (contradicts "Link needs toggle"; strict reading wins) and a 200 "closed" page
(adds a second toggle convention for no client ask). Alternative is open question P3.

### 2.7 Express Catering switch (not on the board, recommended)

The code reaches prod on every push to main (memory: Guns's Vercel auto-deploys) while the packs can only be
typed in after deploy. Without a switch, prod would show an empty ordering page linked from the hero, the
tile and CA01. So `express_enabled` (default false):
- Off: Explore option and tile link to `/catering` (today's behavior, `ordering-menus.ts:7`); CA01 hidden;
  `/menus/express-catering` 404s; submit refuses.
- On: everything points at `/menus/express-catering`; CA01 shows.
- Admin refuses to switch a menu on while it has zero active items ("Add at least one item first"). Holiday
  also refuses without a pickup window (from and to dates, to not in the past).
- If staff deactivate every item while a menu is on, the page shows "Nothing listed right now. Call us at
  {phone}." and no form.

Open question P2.

### 2.8 Ordering page layout (both menus)

- Header band: h1 "Express Catering" or "Holiday Preorders", the admin subtitle, and one fixed line:
  "Order requests only. Nothing is charged online: you pay at pickup or through SpotOn."
- Item list in the L2-D row language (DESIGN.md:90-95: name, short description, price right, no card
  shadows): name, description, `price_note` (for example a serving size Dan supplies), price or "Price on
  request" (`money()` at `src/lib/format.ts:4` returns "" for null, so the label is explicit), optional
  photo, and a labelled quantity input ("Quantity for {name}", min 0, max item max).
- Request panel (sticky beside the list on desktop, below it on phones): name, phone, email, pickup date
  (native date input, min/max from the rules), pickup time (select of valid slots for that date), notes,
  estimate line, "Send request" button, and under it "We'll confirm by phone or email. Your order isn't
  final until we do."
- Estimate: shown only when every chosen line has a price: "Estimated total before tax: $X". Otherwise
  "Some items are priced on request. We'll confirm the total." The server computes the stored estimate; the
  client figure is display only.
- Motion: follow DESIGN.md:190-199 (stable elements). The form must not sit inside anything that swaps
  element type on reduced motion or the pause toggle, or typed input is wiped.
- Hydration: "today" and the slot list come from server props (restaurant-timezone clock), never from
  `new Date()` during render.

---

## 3. Data model

### 3.1 Reuse the menu system? No (evidence)

| Option | Verdict | Evidence |
|---|---|---|
| A. Ordering categories inside `menu_categories` with a new `kind` column | Reject | (1) `readMenuTree` selects every column (`src/lib/data/menu.ts:30`) and the site layout calls `getMenuTree()` on every public page (`src/app/(site)/layout.tsx:15`). Until prod runs `db:push`, a new column throws Postgres 42703 on every page, which breaks the "never throw on /menus, hero and header paths" rule. (2) `db:reseed --force` deletes `menu_categories`, `menu_sections`, `menu_items` (`src/db/seed.ts:27`), and Guns's prod steps include `db:reseed` (GUNS-PROD-RESEED.md "Steps"): Dan's packs and holiday menu would be wiped on every reseed. (3) Every tree consumer would need a kind filter or catering packs leak into the restaurant menu: drawer links (`layout.tsx:16`), /menu (`menu/page.tsx:65`), home featured (`menu.ts:90`), admin dashboard featured (`admin/(panel)/page.tsx:14-16`). (4) Item fields do not fit: availability types, happy hour, small/large and bottle prices, modifiers (`schema.ts:280-296`) versus the needed min/max quantity; `ItemEditor.tsx` is bound to `menuItemInput` (`validation.ts:147-171`). |
| B. Side table mapping category id to ordering menu (the `event_kinds` pattern, `schema.ts:398-403`) | Reject | Fixes (1) only. Still wiped by reseed (cascade from `seed.ts:27`), still needs the filters in (3), still the field mismatch in (4). |
| C. New admin-owned `order_items` table | **Recommend** | No existing read touches it, so a missing table cannot break any current page. Never in the reseed delete list. Fields fit the job. Reuse what does fit: `ImageUpload` (`src/components/admin/menu/ImageUpload.tsx`) and `uploadImage` (`src/actions/menu.ts:318-330`, already guarded), the `cents` parser (`validation.ts:63-74`, export it), `money()` (`format.ts:4`), the single-statement reorder SQL pattern (`menu.ts:31-40`, with `order_items` as a constant table name), admin primitives (`src/components/admin/ui.tsx`), `useAction` and toasts. |

### 3.2 Tables (drizzle, in `src/db/schema.ts`)

Conventions copied from the file: `autoId()` and `timestamps` (`schema.ts:34-38`), dates as `YYYY-MM-DD`
text and times as `HH:MM` text (`schema.ts:168-171`), money as integer cents with null = no price
(`schema.ts:280-281`), DB check constraints mirroring app checks (`schema.ts:185-187`).

```ts
export const ORDER_MENUS = ["express", "holiday"] as const;
export type OrderMenu = (typeof ORDER_MENUS)[number];
export const ORDER_REQUEST_STATUSES = ["new", "confirmed", "completed", "declined", "cancelled"] as const;
export const NOTIFY_STATUSES = ["pending", "sent", "failed", "off", "skipped"] as const;

/** Phase 2 (Pol 4 Nov): one row, id 1. Own table so no existing all-columns read can break;
 *  every read falls back to defaults (both menus OFF) while it is missing. Admin-owned:
 *  never seeded, never wiped by db:reseed. */
export const orderingSettings = pgTable("ordering_settings", {
  id: integer("id").primaryKey(),
  expressEnabled: boolean("express_enabled").notNull().default(false),
  expressSubtitle: text("express_subtitle"),          // null = board copy
  expressLeadHours: integer("express_lead_hours").notNull().default(48),
  holidayEnabled: boolean("holiday_enabled").notNull().default(false),
  holidaySubtitle: text("holiday_subtitle"),
  holidayPickupFrom: text("holiday_pickup_from"),     // YYYY-MM-DD
  holidayPickupTo: text("holiday_pickup_to"),         // YYYY-MM-DD
  holidayLeadHours: integer("holiday_lead_hours").notNull().default(72),
  tileImageAllDay: text("tile_image_all_day"),        // null = code default photo
  tileImageExpress: text("tile_image_express"),
  tileImageHoliday: text("tile_image_holiday"),
  ...timestamps,
}, (t) => [
  check("ordering_lead_check", sql`${t.expressLeadHours} between 0 and 336 and ${t.holidayLeadHours} between 0 and 336`),
]);

/** Express Catering packs and Holiday Preorder items. Admin-owned; nothing seeded (no invented
 *  packs, contents or prices). price null = "Price on request". */
export const orderItems = pgTable("order_items", {
  id: autoId(),
  menu: text("menu").$type<OrderMenu>().notNull(),
  name: text("name").notNull(),
  description: text("description"),                   // pack contents, Dan's words
  price: integer("price"),                            // cents
  priceNote: text("price_note"),                      // e.g. a serving size Dan gives
  image: text("image"),
  imageAlt: text("image_alt"),
  minQty: integer("min_qty").notNull().default(1),
  maxQty: integer("max_qty").notNull().default(20),
  active: boolean("active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  ...timestamps,
}, (t) => [
  index("order_items_menu_idx").on(t.menu, t.displayOrder),
  check("order_items_menu_check", sql`${t.menu} in ('express', 'holiday')`),
  check("order_items_qty_check", sql`${t.minQty} >= 1 and ${t.maxQty} >= ${t.minQty} and ${t.maxQty} <= 100`),
  check("order_items_price_check", sql`${t.price} is null or ${t.price} >= 0`),
]);

/** A guest's pickup request. PII: name, email, phone, notes. Never a payment record. */
export const orderRequests = pgTable("order_requests", {
  id: autoId(),
  menu: text("menu").$type<OrderMenu>().notNull(),
  status: text("status").notNull().default("new"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  pickupDate: text("pickup_date").notNull(),
  pickupTime: text("pickup_time").notNull(),
  notes: text("notes"),
  estimatedTotal: integer("estimated_total"),         // cents; null when any line is price-on-request
  idempotencyKey: text("idempotency_key").notNull(),
  notifyStatus: text("notify_status").notNull().default("pending"),
  internalNotes: text("internal_notes"),              // staff only
  ...timestamps,
}, (t) => [
  uniqueIndex("order_requests_idem_idx").on(t.idempotencyKey),
  index("order_requests_status_pickup_idx").on(t.status, t.pickupDate),
  index("order_requests_created_idx").on(t.createdAt),
  index("order_requests_email_idx").on(t.email),
  check("order_requests_menu_check", sql`${t.menu} in ('express', 'holiday')`),
  check("order_requests_status_check", sql`${t.status} in ('new', 'confirmed', 'completed', 'declined', 'cancelled')`),
  check("order_requests_notify_check", sql`${t.notifyStatus} in ('pending', 'sent', 'failed', 'off', 'skipped')`),
]);

/** Line items, snapshotted: later price edits or item deletes never rewrite a request. */
export const orderRequestLines = pgTable("order_request_lines", {
  id: autoId(),
  requestId: integer("request_id").notNull().references(() => orderRequests.id, { onDelete: "cascade" }),
  itemId: integer("item_id").references(() => orderItems.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  unitPrice: integer("unit_price"),
  priceNote: text("price_note"),
  quantity: integer("quantity").notNull(),
}, (t) => [
  index("order_request_lines_request_idx").on(t.requestId),
  check("order_request_lines_qty_check", sql`${t.quantity} between 1 and 100`),
]);
```

No foreign key points at any menu table (those are wiped by reseed, `seed.ts:27`).

Reference shown to guest and staff: computed, not stored: `EC-${1000 + id}` (express) or `HP-${1000 + id}`
(holiday), same shape as `generateConfirmationCode` (`src/lib/booking.ts:139-141`). It is not a secret and
there is no lookup endpoint, so sequential numbers expose nothing but rough volume.

Statuses (admin labels): `new` "New", `confirmed` "Confirmed", `completed` "Picked up", `declined`
"Declined", `cancelled` "Cancelled". Staff can move between any of them; nothing is sent to the guest on a
status change (staff call or email themselves).

`notify_status`: `pending` (stored, email not tried yet), `sent`, `failed` (provider error or timeout),
`off` (no mail provider configured), `skipped` (hourly email cap hit, see 4.3).

### 3.3 Where the settings live, and why not `site_settings`

`readSiteSettings` selects every column (`src/lib/data/site-settings.ts:22`) and on a missing column
(42703, `src/lib/db-errors.ts:4`) returns the defaults with `available: false` (`site-settings.ts:26`).
Adding the holiday fields as `site_settings` columns would, on prod before `db:push`, blank the live SpotOn
reservations link on /book and empty the CA03 copy list, on top of hiding ordering. A separate one-row table
read with a try/catch default is the pattern `schema.ts:405-409` documents and the 3 Nov hard rule in the
screenshot requirements asks for.

`src/lib/data/ordering.ts` (`import "server-only"`), modelled on `site-settings.ts:10-31`:

```ts
export type OrderingSettings = {
  available: boolean;            // false = table missing (prod before db:push)
  expressOn: boolean; expressSubtitle: string; expressLeadHours: number;
  holidayOn: boolean; holidaySubtitle: string; holidayPickupFrom: string | null; holidayPickupTo: string | null;
  holidayLeadHours: number;
  tiles: { allDay: string; express: string; holiday: string };
};
// Defaults: both menus off, express subtitle = board copy, holiday subtitle "", lead 48/72,
// tile photos as in 2.4. readOrderingSettings(): row 1 or defaults; isMissingSchema(err) ->
// { ...DEFAULTS, available: false }; any other error rethrows (same as site-settings.ts:25-28).
// holidayOn is also false when the window is missing or already over, whatever the switch says.
```

Read it uncached, one tiny row per request, like `site-settings.ts:7-9` (a toggle or an e2e write applies
at once). Callers: site layout (drawer + footer need the toggles), home page (Explore Menu), /menus, the
ordering pages, catering page (CA01), the submit action, admin pages.

Other defensive reads in the same module:
- `readOrderItems(menu, { activeOnly })`: missing table returns `[]` (page then shows the empty state).
- `countNewOrderRequests()` for the admin sidebar badge and dashboard: missing table returns 0 and the
  dashboard card is hidden. The admin layout (`admin/(panel)/layout.tsx:13-15`) must not crash before
  `db:push`.
- Admin writes on a missing table return `fail(NEEDS_DB_PUSH, { code: "needs_db_push" })`
  (`db-errors.ts:17`, same as `actions/site-settings.ts:29-31`); the admin page shows the db:push note.
- The public submit on a missing table returns "We can't take requests online right now. Please call us at
  {phone}." and never throws.

Future columns: a new column on any of these four tables re-creates the 42703 hazard for its all-columns
reads. Add a new small table, or make that read tolerate the missing column, as above.

### 3.4 Reseed behavior

- `src/db/seed.ts:27` force-delete list: do NOT add any of the four tables. A `db:reseed` keeps settings,
  items and requests.
- `seed.ts` inserts nothing for them: no default settings row (reads default when the row is missing; the
  first admin save upserts row 1 like `actions/site-settings.ts:22-27`), no items (nothing invented).
- Side effect to know: reseed re-inserts `restaurant_info` (`seed.ts:33`), so the order email's "To"
  (catering email) returns to the seeded address after a reseed.

### 3.5 Retention

Default (open question G6): requests whose pickup date is more than 180 days in the past are deleted with
their lines. No cron exists (`vercel.json` has none), so the purge runs as one `delete` when an admin opens
/admin/orders, and the page says "Requests are kept for 180 days after pickup." Staff can delete any request
at any time. Supabase backups keep deleted rows for the backup window; say so if anyone asks.

---

## 4. Flows

### 4.1 Customer request (server action `submitOrderRequest`, file `src/actions/order-request.ts`)

The file holds this one public action and nothing else (every export of a `"use server"` file is a callable
endpoint; admin actions live in a separate file, 4.5).

Input schema `orderRequestInput` in `src/lib/validation.ts`, reusing `ymd` (`validation.ts:5-14`), `hhmm`
(`:15`), `phone` (`:17-22`), `emptyToNull` (`:23-30`):

```ts
export const orderRequestInput = z.object({
  menu: z.enum(ORDER_MENUS),
  lines: z.array(z.object({
    itemId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().min(1).max(100),
  })).min(1, "Pick at least one item").max(20)
    .refine((l) => new Set(l.map((x) => x.itemId)).size === l.length, "Each item once"),
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.email("Enter a valid email").max(120),
  phone,                                              // required for pickup orders
  pickupDate: ymd,
  pickupTime: hhmm,
  notes: emptyToNull(500).refine((v) => !v || !looksLikeCardNumber(v),
    "Please don't put card details here. You pay at pickup or through SpotOn."),
  idempotencyKey: z.string().trim().min(8).max(64),   // same as reservationInput, validation.ts:95
  website: z.string().max(200).optional(),            // honeypot, checked BEFORE parse
});
```

Order of checks (cheap first, stop at the first failure):

1. In-memory limit: ``rateLimit(`order:${await clientKey()}`, 5, 10 * 60_000)``, the same helper and numbers
   as catering (`src/actions/catering.ts:14-16`, `src/lib/rate-limit.ts:7`). Fail: "Too many requests from
   this connection. Please call us at {phone}."
2. Honeypot: if `raw.website` is a non-empty string, return a fake success (`{ ok: true, data: { reference:
   null } }`) with no write and no email. Check it before zod. In catering today the honeypot branch is
   unreachable: `website: z.string().max(0)` (`validation.ts:110`) makes a filled honeypot fail the parse,
   so `catering.ts:19` never runs and bots get field errors instead of a silent success (open question P7).
3. zod parse. Fail: "Please check the highlighted fields." with `fieldErrors(...)` (`validation.ts:350-357`).
4. Settings (`readOrderingSettings`): table missing or the menu off -> refuse with the closed message.
5. Items: load `order_items` where `id in (lineIds)`, `menu = input.menu`, `active = true`. Every line must
   match a row; every quantity within that row's `minQty..maxQty`; total units across lines at most 200.
   Mismatch: "One of these items just changed. Reload the page and try again." Prices come from these rows
   only; any client-sent price or total is ignored.
6. Pickup: `isValidPickup(date, time, ctx)` from `src/lib/pickup.ts` (4.2). Fail on the field: "That pickup
   time isn't available. Pick another."
7. DB abuse check (works across serverless instances, unlike step 1): at most 3 requests with the same
   lowercased email in the last 24 hours, and at most 3 with the same phone digits in the last 24 hours
   (statuses new or confirmed). Fail: "You've sent a few requests already today. Please call us at {phone}."
8. Write in one transaction: insert `order_requests` (estimated total = sum of `unitPrice * quantity`, or
   null if any line has no price) and its `order_request_lines` snapshots. A unique violation on
   `idempotency_key` (double click, retry) returns the existing request's reference instead of a second row.
9. Respond `{ ok: true, data: { reference } }` right away.
10. Then, in `after()` (as `catering.ts:25-35`): send the staff email (4.3) and update `notify_status`.

Every failure path that touches the DB catches the error, logs only a fixed string plus the Postgres code
(5.7), and returns "We couldn't send your request. Please call us at {phone}." The guest never sees a stack
or a 500.

### 4.2 Pickup rules (`src/lib/pickup.ts`, pure, shared by server and client)

```ts
type PickupCtx = {
  hours: Hours[];                // getHours()
  overrides: DateOverride[];     // readDateOverrides(clock.date), src/lib/data/booking.ts:10
  clock: Clock;                  // getClock(bookingSettings.timezone), src/lib/availability.ts:14
  leadHours: number;             // express_lead_hours or holiday_lead_hours
  maxDaysAhead: number;          // 60, same as booking_settings default (schema.ts:114)
  window?: { from: string; to: string };   // holiday only
};
export function pickupSlots(date: string, ctx: PickupCtx): string[];   // "HH:MM" list, [] = no pickup that day
export function isValidPickup(date: string, time: string, ctx: PickupCtx): boolean; // slots.includes(time)
export function firstPickupDate(ctx: PickupCtx): string | null;        // for the date input min
```

Rules:
- Date between `clock.date` and `addDays(clock.date, maxDaysAhead)` (`format.ts:56`); for holiday also
  inside `[window.from, window.to]`.
- Opening window for the date: a `date_overrides` row for that date wins (`schema.ts:137-150`): `closed`
  means no slots, start/end means those hours. Otherwise the store row for that weekday via
  `resolveWindow(hours, hoursFor(hours, "store", dayOfWeek(date)))` (`availability.ts:37-53`,
  `format.ts:47`). Same precedence as `storeStatus` (`availability.ts:68-91`).
- Slots every 30 minutes from opening (rounded up to the half hour) to 30 minutes before closing. Pickup
  hours themselves are a Dan question (G3); this default is the conservative reading.
- Lead time: `daysBetween(clock.date, date) * 1440 + toMinutes(time) - clock.minutes >= leadHours * 60`.
  Everything is in restaurant-local minutes; the one-hour error on the two DST change days is accepted.
- The client renders slots from the same function with server-provided `hours`, `overrides`, `clock`, so the
  list matches what the server will accept. The server re-runs it on submit.

### 4.3 Staff email (store first, email second)

Extend `src/lib/inquiry-mail.ts`:
- Keep `inquiryMailConfig()` (`inquiry-mail.ts:11-15`): nothing is sent until `RESEND_API_KEY` and
  `INQUIRY_FROM_EMAIL` exist (still NEEDS-INFRA for Guns). With no config, `notify_status = 'off'`.
- Add `buildOrderRequestEmail(req, lines, to, copies, from)`: plain text only (like `inquiry-mail.ts:32`),
  `to: [cateringEmail ?? email]` (same address rule as `catering.ts:30`), staff copies from the CA03 list
  (`site_settings.inquiry_cc`, read with `readSiteSettings()`), `reply_to: guest email`, subject through
  `oneLine()` (`inquiry-mail.ts:30`): `Order request EC-1042: Express Catering, pickup Fri Nov 21 11:30 AM`.
  Body: reference, menu, pickup date and time, each line (qty, name, unit price or "price on request"),
  estimate or "total to confirm", guest name, phone, email, notes, and "Reply to this email to answer the
  guest. Every request is also in the admin panel under Orders."
- Copies go as `bcc`, not `cc` (open question P6). With CC, a staff member who hits Reply All sends the
  guest every internal address on the list (Reply-To puts the guest in To, the CC list stays). BCC keeps the
  paper trail and leaks nothing.
- Make the send return an outcome instead of `void` (`inquiry-mail.ts:60-76` returns nothing today):
  `Promise<"sent" | "failed">`, with `Idempotency-Key: order-request/{id}` and the existing 8s timeout.
- Hourly cap on these emails: if 20 order emails were already sent in the last hour, mark `skipped` and do
  not call the provider. This protects the Resend quota (shared with catering inquiries) from a flood; the
  requests are still stored.
- After the send, `update order_requests set notify_status = $outcome`. If that update fails, log code only.
- Never email the guest. No confirmation email, no status emails. This removes the "use the restaurant as a
  spam relay to any address" vector entirely.

Partial failure surfaces in admin, not to the guest (the guest's request is stored either way):
- Orders list: a "Not emailed" tag on rows with `failed`, `skipped` or `off`.
- Orders page banner when no mail provider is configured: "Email alerts are not set up. New requests only
  show here." The ordering settings card shows the same warning next to each on/off switch.

### 4.4 Confirmation screen (draft copy, owner voice, for Dan to adjust)

Rendered in place of the form, `role="status"`, focus moved to the heading (as `CateringForm.tsx:37`):

> **Request received.**
> This is a request, not a confirmed order yet. We'll look it over and reach out by phone or email to
> confirm what we can do for {weekday, month day} at {time}.
> No payment now. You pay at pickup or through SpotOn.
> Your reference is {EC-1042}. Questions? Call us at {phone}.

No promise of acceptance, no promise of timing ("soon", "within an hour"), no exclamation marks.

The honeypot fake success shows the same screen without a reference line.

### 4.5 Admin

All pages sit under `src/app/admin/(panel)/`, whose layout calls `requireAdminPage()`
(`admin/(panel)/layout.tsx:13`). Every action lives in `src/actions/ordering-admin.ts` and starts with the
`guard()` pattern (`actions/menu.ts:15-22`), which calls `requireAdmin()` (`src/lib/auth.ts:79-83`, checks
the signature AND the session version). Every id argument is parsed with `z.number().int().positive()`
before use (`updateReservationStatus` at `actions/reservations.ts:24` does not validate its id; do not copy
that).

| Page | What | Actions (all guarded) |
|---|---|---|
| `/admin/orders` | Requests inbox. Filters: status (default New + Confirmed), menu, pickup date range. Columns: reference, received, pickup date and time, guest name, menu, line summary, estimate, status, "Not emailed" tag. Retention purge runs here (3.5). | `deleteOrderRequest(id)` with a confirm dialog |
| `/admin/orders/[id]` | Detail: full contact (tel: and mailto: links), lines, notes as plain text, estimate, notify status, internal note | `updateOrderRequestStatus(id, status)` (zod enum), `saveOrderRequestNote(id, note)` (max 500), `deleteOrderRequest(id)` |
| `/admin/menu/ordering` | Two cards (Express Catering, Holiday Preorders). Each: on/off switch, subtitle, lead time, holiday pickup window, tile photo, mail warning; then the item list with add/edit/delete/reorder/active. Plus the ALL DAY tile photo. | `saveOrderingSettings(raw)` (refuses enabling with zero active items or a missing/past holiday window), `saveOrderItem(raw)`, `deleteOrderItem(id)`, `setOrderItemActive(id, bool)`, `reorderOrderItems(menu, ids)`; photos via the existing `uploadImage` |

Sidebar (`src/components/admin/Sidebar.tsx:8-26`): add top-level "Orders" (`/admin/orders`) with a badge of
`new` requests (same treatment as `pendingCount`, `Sidebar.tsx:47-49`), and a Menu child "Express +
Holiday" (`/admin/menu/ordering`) after Modifiers (`Sidebar.tsx:15-19`).

Dashboard (`admin/(panel)/page.tsx`): an "Order requests" card with the new count and the next 5 pickups,
linking to /admin/orders. Hidden while the table is missing.

Admin item input `orderItemInput`: name 1-120, description up to 600, `price` via the exported `cents`
parser (blank = null = "Price on request"), priceNote up to 60, image up to 300 and must start with `/`
but not `//` (only `/images/...` and `/uploads/...` render through next/image under the current
`remotePatterns`, `next.config.ts:22-27`), imageAlt up to 200 (required when an image is set), minQty and
maxQty integers 1-100 with max >= min, active boolean. Settings input: subtitles up to 200, lead hours
0-336, holiday dates via `ymd` with to >= from.

After admin writes: `revalidatePath("/menus")`, the two ordering pages, `/` and `/catering` (reads are
uncached, so this only drops any rendered output).

---

## 5. Threat surface

### 5.1 PII stored, and who can read it

| Data | Where | Who can read |
|---|---|---|
| Guest name, email, phone, pickup date/time, notes, lines | `order_requests`, `order_request_lines` in Guns's Supabase | Any signed-in admin (single role: `schema.ts:457` `role` defaults to "admin" and `requireAdmin` checks no role); Supabase project owners |
| Same, in the staff email | Resend (processor) and the catering inbox plus the BCC list | Those mailboxes |
| Never | Vercel logs, client bundles of public pages, URLs | Nobody |

Notes are free text and may hold allergy or dietary details. The form does not ask for them; the label is
"Anything we should know?". Public pages receive only public item fields (id, name, description, price,
priceNote, image, imageAlt, min/max), never request data. There is no GET route or API route for requests.

There is no privacy notice anywhere on the site today (no "privacy" string under `src/`), and reservations
and catering already collect the same PII. Open question G7.

### 5.2 Spam and abuse

- Honeypot before parse, silent fake success (4.1 step 2).
- IP limit 5 per 10 minutes. Best effort only: `rate-limit.ts:1-4` is an in-memory map, one per serverless
  instance, so parallel instances each keep their own count. `clientKey()` uses the first
  `x-forwarded-for` hop (`auth.ts:96-100`), which the hosting edge sets; off Vercel it is spoofable.
- DB-backed limit: 3 per email and 3 per phone per 24 hours (4.1 step 7). This is the layer that holds
  across instances.
- Hard caps: 20 lines, 100 per line (and the item's own max), 200 units total, notes 500 chars, name 100,
  email 120, phone 25 (`validation.ts:21`).
- Email cap: 20 order emails per hour, then `skipped` (4.3).
- Fake requests with someone else's phone or email cause at most a staff call to that person. Nothing is
  ever sent to the guest address, so the form cannot be used to mail third parties.
- The public action body limit is the site-wide 4 MB (`next.config.ts:32`, set for photo uploads). zod caps
  every field after the body is read; acceptable at this traffic, noted.
- No global "stop taking requests" breaker: it would let one attacker switch ordering off for everyone.

### 5.3 Injection

- Email headers: Resend takes JSON, no raw header assembly. `reply_to` is a zod-validated email (CR/LF
  cannot pass `z.email()`); subject text goes through `oneLine()` (strips control characters, caps length,
  `inquiry-mail.ts:30`). Body is `text` only, never `html`.
- HTML/XSS: React escapes all output; admin renders guest text as text nodes, no `dangerouslySetInnerHTML`,
  no auto-linking of URLs in notes (a phishing link stays inert text).
- SQL: drizzle parameters only. The only raw SQL pattern (`menu.ts:38`, `sql.raw(table)`) takes a constant
  table name; the new reorder keeps that rule. No user input in `sql.raw`.
- CSV: there is no export in this build. If one is added later, prefix cells that start with `=`, `+`, `-`
  or `@`.

### 5.4 Authz on every admin action

- Pages: `requireAdminPage()` via the panel layout. Middleware (`src/middleware.ts:19-35`) only checks the
  JWT signature, not the session version, so it is a first fence, not the check.
- Actions: each exported function in `ordering-admin.ts` calls `guard()` first, including reads that return
  PII (if any read is exported from a `"use server"` file, it is a public endpoint and must be guarded).
  Data readers stay in `src/lib/data/ordering.ts` behind `import "server-only"`, never exported from an
  action file.
- Ids validated, statuses validated against the enum, and every update/delete checks the row existed
  (`returning()`), answering "That request no longer exists. Reload the page." otherwise.
- Test: a signed-out context gets the login redirect on `/admin/orders` and `/admin/menu/ordering`.

### 5.5 CSRF posture

Server actions are POST only and Next.js aborts an action whose `Origin` host differs from `Host` /
`X-Forwarded-Host` unless listed in `serverActions.allowedOrigins` (Next.js data-security docs and
`action-handler.ts`, checked via context7 on 4 Nov). The admin cookie is `HttpOnly`, `SameSite=Lax`,
`Secure` in production (`auth.ts:32-38`). `allowedOrigins` is not set (`next.config.ts:29-33`) and must stay
unset. CSP keeps `form-action 'self'` (`next.config.ts:15`). A request with no `Origin` header is let
through (the docs say so); that only matters for the public action, which carries no credentials, so the
protection there is validation and the limits above, not CSRF.

### 5.6 No card data

- No payment fields anywhere; the copy says payment is at pickup or through SpotOn.
- `looksLikeCardNumber(notes)`: any run of 13 to 19 digits (spaces or hyphens allowed between digits) that
  passes the Luhn check is rejected with a field error ("Please don't put card details here..."). Rejected,
  not stripped, so a card number is never stored even when a guest volunteers one. The name field gets the
  same check.
- Staff are told (admin copy on the Orders page) never to type card numbers into the internal note.

### 5.7 Logging (no PII in logs)

Drizzle wraps query failures in `DrizzleQueryError`, whose message is "Failed query: ... params: ..."
(`node_modules/drizzle-orm/errors.js:10-13`): logging the error object writes the guest's name, email,
phone and notes into Vercel logs. `catering.ts:38` (`console.error("catering inquiry failed", err)`) does
exactly that today (open question P7). New code logs only:
``console.error(`order request: insert failed (pg ${pgCode(err)})`)`` and
``console.error(`order request #${id}: mail ${outcome}`)``. No request bodies, no emails, no phone numbers.

### 5.8 Deletion

Per-request delete in admin (lines cascade), the 180-day purge (3.5), and item deletes set
`order_request_lines.item_id` to null while the snapshot keeps the name and price.

---

## 6. Content Dan must supply (nothing is invented)

| Item | Needed for | Until then |
|---|---|---|
| Express Catering packs: names, what is in each (Breakfast burrito packs, Sandwich Packs, Taco Bars are his tile words, not a product list), serving sizes, prices, minimums | `order_items` (express) | Express stays OFF; links keep going to /catering. A pack entered without a price shows "Price on request". |
| Holiday menu: items, contents, prices, pickup dates, how far ahead to order | `order_items` (holiday), window, lead time | Holiday stays OFF; tile shows the subtitle he gives, or "Not taking holiday preorders right now." His existing copy mentions "Superbowl wings, Thanksgiving turkeys, Christmas pork butts" (`seed-data/restaurant.ts:224`), which is a hint for him, not seed data. |
| Lead times and pickup hours for each menu | `express_lead_hours`, `holiday_lead_hours`, slot rule | Defaults 48h and 72h, slots every 30 min in store hours except the last 30 min. Both menus are off until he reviews them. |
| Tile photos (one per tile) | /menus | His old-site photos listed in 2.4. |
| Holiday subtitle text | /menus tile and holiday page | Empty. |
| How "pay through SpotOn" works for him (payment link, in store only) | Confirmation copy | Copy says "at pickup or through SpotOn" with no link. |

Ask list wording for Guns to send goes into BUILD-NOTES-for-Dan.md "Built and waiting on your content" once
deployed.

---

## 7. Test plan and rollout

### 7.1 Unit (vitest, `tests/unit/ordering.test.ts`)

- `pickupSlots` / `isValidPickup`: open day; closed weekday; override closed; override special hours; lead
  time crossing midnight and crossing two days; holiday window edges (from, to, outside); beyond 60 days;
  last slot is close minus 30; a time off the 30-minute grid is rejected.
- `orderRequestInput`: empty lines; 21 lines; duplicate item ids; quantity 0 and 101; notes 501 chars;
  phone missing; bad date `2026-11-31`; card number in notes rejected (Luhn valid), a 16-digit order number
  that fails Luhn accepted; honeypot field accepted by the schema.
- `orderingMenus`: 2 options with both off (Express to /catering), 2 with express on, 3 with holiday on.
- `buildOrderRequestEmail`: CR/LF in the name never reaches the subject; copies are `bcc`; the To address is
  not repeated in bcc (case-insensitive, as `inquiry-mail.ts:48`); guest only in `reply_to`; text only; "price
  on request" lines.
- Estimate: null when any line has no price; correct cents sum otherwise.
- `readOrderingSettings` with a mocked 42P01 and 42703 error returns defaults with `available: false`;
  other errors rethrow.

### 7.2 E2E (playwright; `tests/e2e/public/ordering.spec.ts`, `tests/e2e/admin/ordering.spec.ts`)

Helpers: `setOrdering({...})` upsert into `ordering_settings` (like `tests/e2e/helpers/site-settings.ts`);
QA items named `QA ...`; QA guest emails `@qa.smokymug.test` (`helpers/db.ts:39-42`). Extend `cleanupAll()`
(`helpers/db.ts:44-53`) with `order_requests` by email domain and `order_items` by `QA ` prefix, and
`global.teardown.ts` with both toggles back off. The suite keeps refusing Supabase hosts (`helpers/db.ts:6-26`).

Public:
- Both off: `/menus` shows three tiles; ALL DAY href `/menu`; EXPRESS href `/catering`; HOLIDAY is not a
  link and shows its subtitle; `/menus/express-catering` and `/menus/holiday-preorders` return 404; Explore
  Menu shows exactly Restaurant and Express Catering (update `home.spec.ts:21-24`); CA01 absent.
- Express on (with a QA item): tile, Explore option and CA01 point to `/menus/express-catering`; submit a
  full request; confirmation shows a reference and "pay at pickup or through SpotOn"; DB has one request,
  one line, server-computed estimate, `notify_status = 'off'` (no mail env in tests).
- Validation: no items; past date; a closed date (insert a QA `date_overrides` row, cleaned by the existing
  `reason like 'QA %'` rule, `helpers/db.ts:51`); quantity above the item max (posted directly); an item
  deactivated between page load and submit gives the "just changed" error.
- Honeypot filled: confirmation shown, zero rows written.
- Holiday on with a window: third Explore option present; dates outside the window rejected; inside
  accepted. Switch off with the page open: submit refused.
- Price null renders "Price on request" and the estimate line says the total will be confirmed.
- Header "Menus" (desktop) and footer "Menus" go to `/menus`; header, drawer and hero Order Now still go to
  `/menu`. Update `home.spec.ts:14` (nav labels) and `calendar.spec.ts:34` (footer list) to "Menus".
- Mobile project: drawer "Menus" lists the ordering menus, toggles respected, no duplicate Menus link.
- a11y: add `/menus` to `PAGES` (`a11y.spec.ts:11`), plus both ordering pages scanned with their toggles on
  inside the ordering spec (reduced motion, same `expectNoBlockingViolations`). Add `/menus` to the warm
  list in `auth.setup.ts:9`.
- Hydration probe: on `/`, `/menus`, both ordering pages and `/catering`, collect console errors and assert
  none match `/hydrat|did not match|server rendered/i`.
- Motion pause: type into the order form, toggle the header pause, the typed values remain (extend
  `motion-pause.spec.ts`).
- Sitemap contains `/menus` (extend `misc.spec.ts:47`).

Admin:
- Create an item with a blank price, see it public as "Price on request"; edit; reorder; deactivate; delete.
- Enabling a menu with zero active items is refused; holiday without a window is refused.
- Orders list shows the QA request with the "Not emailed" tag and the mail banner; detail shows lines and
  contact; status change persists; internal note saves; delete removes request and lines.
- Signed-out context: `/admin/orders` and `/admin/menu/ordering` redirect to login.

### 7.3 Gate (exit codes from files)

The repo is npm (`package.json:5-21`), not pnpm. Run each step with output to a log and its exit code to a
file outside the repo, then read the `.exit` files, never a piped tail (memory: a `| tail` once ate a failing
exit code):

```bash
G="$SCRATCH/gate-phase2"; mkdir -p "$G"
npm run typecheck > "$G/typecheck.log" 2>&1; echo $? > "$G/typecheck.exit"
npm run lint      > "$G/lint.log"      2>&1; echo $? > "$G/lint.exit"
npm run test      > "$G/unit.log"      2>&1; echo $? > "$G/unit.exit"
npm run build     > "$G/build.log"     2>&1; echo $? > "$G/build.exit"
npm run test:e2e  > "$G/e2e.log"       2>&1; echo $? > "$G/e2e.exit"
npm audit --audit-level=high > "$G/audit.log" 2>&1; echo $? > "$G/audit.exit"
git diff --check  > "$G/diffcheck.log" 2>&1; echo $? > "$G/diffcheck.exit"
```

Then a fresh manual click-through at 390, 1024 and 1280: home Explore Menu (2 and 3 options), hero Order
Now, header Menus, drawer Menus, footer Menus, each /menus tile, a full Express request, a full Holiday
request, holiday off (tile and 404), CA01 on and off, admin items CRUD, admin settings switches, admin
Orders list/detail/status/note/delete, dashboard card, sidebar badge. Report it as done, blocked or not
applicable. Close with the ui-finish-gate-reviewer lens against DESIGN.md and `web-design-guidelines` on
the changed UI files. Local commit only; Pol pushes.

### 7.4 Prod rollout

New tables only, so the migration is separate from the deploy and the order between them is safe:

1. Guns, on his machine (GUNS-PROD-RESEED.md traps apply: BOTH `DATABASE_URL` and `DIRECT_URL` set to prod,
   `drizzle.config.ts:12` prefers `DIRECT_URL`): back up, then `npm run db:push`. Expected plan: CREATE TABLE
   for `ordering_settings`, `order_items`, `order_requests`, `order_request_lines`, their indexes, checks and
   two foreign keys. If it lists any DROP, any ALTER of an existing table, or a data-loss prompt, stop and
   send Pol the output.
2. No `db:reseed` (nothing is seeded). No cache purge (all new reads are uncached).
3. Pol pushes main; Vercel deploys.
4. If the deploy lands before step 1: the site renders, both menus read as off, Express links stay on
   /catering, the holiday tile is unlinked, both ordering pages 404, the submit answers "call us", and
   admin shows the db:push note on the ordering page. Nothing throws.
5. Smoke on prod: /menus renders three tiles; Explore Menu shows 2 options; `/menus/holiday-preorders` 404s;
   `/admin/menu/ordering` loads without the db:push note.
6. Content entry (Dan's packs, holiday items, lead times, window), then the switches.
7. Mail: order alerts depend on the same NEEDS-INFRA `RESEND_API_KEY` + `INQUIRY_FROM_EMAIL`. Until they
   exist, staff must check Admin, Orders; say this to Dan before switching a menu on.
8. Rollback: revert the commit. The tables stay and are harmless (nothing else reads them).

Record the db:push step in CHANGELOG-discovery.md and a short "Phase 2 prod steps" note for Guns (the 3 Nov
sheet is reseed-specific; this round needs only step 1).

---

## 8. Open questions (each has a default so the build can proceed)

For Pol:

| # | Question | Default the build uses |
|---|---|---|
| P1 | Commercial handling of the "$500 ordering build" now that it is built (1.2) | Build proceeds and is committed locally; Pol tells Genrou before pushing. |
| P2 | Add an Express Catering on/off switch (not on the board) | Yes, default off; links stay on /catering while off (2.7). |
| P3 | Holiday off: tile visible but unlinked, or hidden | Visible and unlinked, showing the subtitle (strict reading of "Link needs toggle"). |
| P4 | Drawer accordion: ordering menus or the six menu tabs | "All menus" plus the ordering menus (handoff line 438). |
| P5 | Phone sticky bar "Menu" button | Stays "Menu" to /menu (NW03-3 says header or footer only). |
| P6 | Staff copies as BCC, for order requests and also for catering inquiries | BCC for both (one-line change in `inquiry-mail.ts:48-52`; stops the Reply All leak). |
| P7 | Fix the two catering defects found here in the same build: unreachable honeypot (`validation.ts:110` vs `catering.ts:19`) and PII in the error log (`catering.ts:38`) | Yes, separate small commit. |
| P8 | Catering inquiries are stored with PII but have no admin view or delete anywhere (only `catering.ts:22` touches the table) | Add a read and delete tab for them on /admin/orders, separate commit. |
| P9 | Allow switching a menu on while no mail provider is configured | Allow, with the warning on the switch and the Orders banner. |

For Genrou and Dan:

| # | Question | Default |
|---|---|---|
| G1 | Express Catering packs: contents, sizes, prices, minimums | Nothing seeded; Express off; unpriced items show "Price on request". |
| G2 | Holiday items, pickup dates, order-by time | Nothing seeded; Holiday off. |
| G3 | Lead time and pickup hours per menu | 48h express, 72h holiday; 30-minute slots in store hours, not the last 30 minutes. |
| G4 | Pickup only, or delivery for Express Catering | Pickup only; delivery goes through the catering inquiry form. |
| G5 | Tile photos | His old-site photos (2.4). |
| G6 | How long to keep requests | 180 days after the pickup date, then deleted. |
| G7 | Privacy line under the forms (the site has none; same lawyer question as Speed Trap) | One factual line, flagged for Genrou: "We use your name, phone and email only to confirm this request." |
| G8 | Limits per item per pickup day (for example a fixed number of turkeys) | None; staff confirm each request by hand. |
| G9 | What "pay through SpotOn" means in practice | Copy names it with no link. |
| G10 | Holiday subtitle text and whether the Explore option label "Holiday Preorder" (singular, NW03-1) should match the tile's plural | Board wording in each place. |

---

## Appendix: file plan for the build

New:
- `src/lib/pickup.ts`, `src/lib/data/ordering.ts`
- `src/actions/order-request.ts` (public submit only), `src/actions/ordering-admin.ts` (guarded)
- `src/app/(site)/menus/page.tsx`, `src/app/(site)/menus/[menu]/page.tsx`
- `src/components/ordering/MenusTiles.tsx`, `OrderItemRow.tsx`, `OrderRequestForm.tsx` (client)
- `src/app/admin/(panel)/orders/page.tsx`, `src/app/admin/(panel)/orders/[id]/page.tsx`,
  `src/app/admin/(panel)/menu/ordering/page.tsx`, `src/components/admin/ordering/*`
- `tests/unit/ordering.test.ts`, `tests/e2e/public/ordering.spec.ts`, `tests/e2e/admin/ordering.spec.ts`,
  `tests/e2e/helpers/ordering.ts`

Changed:
- `src/db/schema.ts` (four tables, types), `src/lib/validation.ts` (inputs; export `cents`),
  `src/lib/inquiry-mail.ts` (order email, bcc, send outcome), `src/lib/ordering-menus.ts` (function)
- `src/app/(site)/layout.tsx` (read ordering settings, pass to Header and Footer; `getMenuTree` there is only
  for the drawer links and can go if P4 lands), `Header.tsx`, `Footer.tsx`, `Hero.tsx`,
  `src/app/(site)/page.tsx`, `src/app/(site)/catering/page.tsx`, `src/app/sitemap.ts`
- `src/components/admin/Sidebar.tsx`, `src/app/admin/(panel)/layout.tsx` and `page.tsx`
- `tests/e2e/helpers/db.ts`, `tests/e2e/global.teardown.ts`, `tests/e2e/auth.setup.ts`,
  `tests/e2e/public/a11y.spec.ts`, `home.spec.ts`, `calendar.spec.ts`, `misc.spec.ts`, `motion-pause.spec.ts`
- Docs: DESIGN.md (§4 NW03, Out of scope, before UI code), CHANGELOG-discovery.md,
  FEEDBACK-client-review-3nov.md (NW03 rows and S9 to DONE once verified), BUILD-NOTES-for-Dan.md (after
  deploy), a Phase 2 prod note for Guns.

Not touched: `src/db/seed.ts` force list (`seed.ts:27`), the gallery admin (another worker owns it), any
SpotOn or payment code.
