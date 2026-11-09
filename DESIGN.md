# The Smoky Mug: design contract (discovery Rev 1)

Source: `SmokyMug-Dev-Handoff-INTERNAL.pdf` Rev 1, 17 Oct 2026 (Genrou), built from
Dan Lee's marked-up discovery board. This file encodes the client's own choices;
where this file and the handoff disagree, the handoff wins. Where the handoff and
the board disagree, ask Genrou. Do not invent beyond it.

## Status of these values

Palette and font are **PROPOSED** (handoff Q1/Q2, Dan has not supplied hex values or
the Roadstore file). They ship as CSS design tokens so the final values are a
one-line change. Roadstore (demo file) has set the headings and CTAs since 9 Nov
2026; the licensed webfont must replace it before launch (section 2).

## 1. Color tokens (PROPOSED; brick-orange scheme per Guns, amended 2 Nov 2026)

Guns's calls: 1 Nov chat, "the teal was too much, teal should be accents only,
back to the brick orange." 2 Nov chat (screenshot with circles on Book a Table
and Explore Menu): those CTAs go brick orange "para mas naka highlight", and
"more teal accents sa color scheme". Net scheme: ember owns every ACTION, teal
owns the quiet INFO layer. Q1 (Dan's own palette pick) is still open; the
board's COLOR CHOICE box was left empty.

| Token | Hex | Use |
|---|---|---|
| `--color-ember-600` (brick orange) | `#A54F1F` | Action color: ALL primary CTAs (Book a Table, Explore Menu, Order Now), links, hovers, tags |
| `--color-ember-300/400/500` | `#F0A06A` `#E07A3A` `#C8642A` | Hovers on dark, highlights, event dots, focus ring (500) |
| `--color-charcoal-950/900` | `#0F0D0B` `#161311` | Header, footer, dark sections, panels; ink on cream |
| `--color-wood-700` | `#52321C` | Warm dark sections (catering teaser + inquiry) |
| `--color-cream-100` | `#F6EEE1` | Page background |
| `--color-teal-600` (on light) / `--color-teal-300` (on dark) | `#0B5D5E` `#8FC0BC` | Secondary accent, info layer: section eyebrows + micro-labels sitewide, hours borders, calendar today-ring + date chips, header pin, hero "Brewed slow.", selection |
| `--color-red-*` | `#B3261E` scale | Admin/error contexts only, no longer a site brand accent |

Rules (2 Nov):
- Ember = action. If it's clickable emphasis or a CTA, it's ember. Both header
  and hero CTAs are solid ember so they pop off the dark surfaces.
- Teal = information. Eyebrows, micro-labels, today markers, hours accents.
  Teal is never a button fill or a hover.
- Gold/sage/brick keep their semantic jobs (stars/info tags, open/dietary,
  closed/error).
- Ember exceptions that are brand emphasis, not info: the Featured tag on the
  menu's featured dish, and single accent words inside display headlines
  (ember-300). The hero headline's accent line stays teal.
- Deliberate secondary: inside the contact page's Events & catering card the
  primary action is the inquiry, so its Book a Table stays the dark variant.
- Order actions keep ONE consistent color (NW04 change 3, the client's own
  sketch note): every Order Now stays brick ember wherever it appears,
  including beside Book a Table / Explore Menu once the SpotOn orderUrl lands
  (Q8). This supersedes the 2 Nov "Order Now goes dark" note; the client's
  direction outranks DESIGN-STANDARD 3.2/3.3 here.
- **Amended 9 Nov 2026 (Dan's review, FEEDBACK-client-review-9nov.md):** teal and
  ember may color display text. Second lines of headings (teal: Visit,
  catering, FoodStory), the home intro tagline span (ember), the calendar month
  (ember) and in-month date numbers (teal; today's ring moves to ember so it
  stays distinct), and hover on interactive text (nav, footer, menu tabs,
  catering cards: ember). Body copy stays ink. Red stays admin/errors only.

## 2. Typography (handoff 6.2)

- **Amended 9 Nov 2026 (row 16):** Roadstore replaces Rye behind
  `--font-western`, loaded with next/font/local from `src/fonts/Roadstore.ttf`,
  and now sets public page headings (h1/h2 inside `main#main`) and western
  CTAs. Fallback is Bebas Neue, then Impact. The file is the dafont demo
  (personal use only): it is caps only, its 2/4/6/8 are blank and 3/5/7/9 plus
  `! # $ & ? @` carry a watermark, so a unicode-range limits it to the clean
  glyphs and Bebas fills the rest. Buy the Almarkha Type Standard Webfont
  license (almarkhatype.com/product/roadstore) and swap in the full file
  before launch; then drop the unicode-range. Text font: Instrument Sans
  stays (humanist grotesque, generous x-height, quiet under condensed caps,
  the DESIGN-STANDARD sans class). Fraunces stays the serif accent for item
  names; the Rye notes below are history.

- Headings: Roadstore via `--font-western` (9 Nov 2026, above). Keep the
  fallback stack; layout must not shift if the font fails to load.
- Buttons (Guns 2 Nov: "use roadhouse font on the buttons... or at least a
  children font of that"): filled CTA variants (primary/light/dark) use
  `--font-western` (Rye from 2 Nov to 9 Nov 2026, Roadstore since). Single
  400 weight, so no `font-semibold` on western buttons (faux bold). Quiet utility variants (secondary/ghost/outline:
  booking steps, cancel dialogs, downloads) keep the UI sans via the Button
  `face` default; the western subset also lacks their U+2190 back-arrow. Page CTAs
  that happen to use a quiet variant (home View Full Menu, Visit Get Directions
  and Email) pass `face="western"` (3 Nov, "buttons generally").
- Bigger headings, optimized for mobile:
  - H1 `clamp(2.25rem, 6vw, 4rem)`
  - H2 `clamp(1.75rem, 4.5vw, 2.75rem)`
  - Body ≥ `1.0625rem` on mobile (min 17px), line length 45–75ch. Test at 390px.
- No dropped letters: `overflow-wrap: anywhere` on email/URL strings only, and
  `min-width: 0` on their flex/grid containers. Emails never break as "gmail.co / m".

## 3. Shape, spacing, photos, buttons (handoff 6.3)

- Corners: 16px radius on cards, panels, images.
- Buttons: L4-A pill. Exception: **Book a Table is a soft square** (10–12px radius).
- NO brick texture on CTAs. A literal running-bond texture shipped 2 Nov and
  Guns pulled it 3 Nov: "color lang na brick orange". Brick orange is the
  COLOR; primary CTAs are a plain ember fill. Do not re-add a texture without
  Guns asking for one.
- Spacing: Standard. Keep the current rhythm, do not tighten or loosen.
- Photos: full color. Text over a photo needs a scrim/gradient to 4.5:1. Photos
  without text stay unfiltered.
- Menu page headers: photo background + scrim, one photo per menu (placeholders
  until Dan supplies photos, Q7).

## 4. Layouts chosen by Dan

- **L1-A hero**: full photo, text left. No large logo in the hero (C1).
- **L2-D menu** (built 1 Nov): tabs + search kept; featured dish in its own
  column beside the list (photo side ~40%, sticky on desktop; stacks on top on
  phones); the list is clean rows (name, short description, price right), no
  photo per row, no card shadows; badges/OPTIONS as small text in the row,
  Order Now bottom left when the SpotOn URL exists. Featured = first item in
  each tab (Q10 default) until Genrou clears an admin pin.
- **Navigation**: desktop L3-A: logo left; inline links Menus, Our Story,
  Catering, Calendar, Contact (P1, Pol 3 Nov: Calendar replaces Gallery in the
  top bar, the drawer and the footer; /gallery stays, reached from the home
  gallery section and the sitemap. NW03-3, 4 Nov: the first link is "Menus" to
  /menus in the top bar and the footer, active on /menus, /menus/* and /menu;
  the phone sticky bar keeps "Menu" to /menu, P5); right side [Book a Table] [ORDER NOW], ORDER
  NOW rightmost (board H01: the nav phone became Book a Table, the old button
  became ORDER NOW). Compressed mode (collapse by FIT, not device; test 1024px):
  hamburger left, logo centered, left slide-out drawer (85% width, max 360px,
  scrim, closes on scrim/Esc/link tap, traps focus, locks body scroll); drawer
  CTAs in the same order. Top bar keeps ONLY the phone number in both modes.
  Drawer phone rule (L3-3, board "Retain only the top bar phone number", 4 Nov):
  the drawer info card carries status, address and social links but no phone;
  the top utility strip is the only phone in the header. Drawer menus (B3 kept,
  4 Nov): the "Menus" accordion lists "All menus" (/menus) first, then Express
  Catering and Holiday Preorder only while each switch is on, then "Full menu"
  and the display-menu tabs (/menu?category=...), as before.
  Header sticky. Fit measured 3 Nov at 1024px with Specials on and Order Now
  showing: 912 of 928px, one line.
- **Order Now routing (NW03-2, 3 Nov)**: "Order Now buttons from other pages go
  directly to main Restaurant Menu". Header, drawer and hero Order Now link to
  /menu and always show; the SpotOn ordering link sits on every menu item and
  the featured dish (NW04), hidden until the URL is set. Alternative reading
  (header/hero Order Now straight to SpotOn, handoff C2) is recorded in
  FEEDBACK-client-review-3nov.md for Pol.
- **Explore Menu (board H01 + NW03-1, 3 Nov; switches 4 Nov)**: the hero drop
  lists `orderingMenus()` from `src/lib/ordering-menus.ts`: Restaurant (/menu),
  Express Catering (/menus/express-catering while its switch is on, else
  /catering), and Holiday Preorder (/menus/holiday-preorders) only while the
  holiday switch is on and its pickup window is not over: 2 or 3 options.
- **L4-A buttons** (pill; Book a Table soft square). Both header CTAs are solid
  ember (no texture, no color change in this round).
- **L5-A gallery**: masonry, no fixed heights, no gap taller than one row at
  1280px. Admin (4 Nov, full CRUD per Pol): add photo (JPG/PNG/WebP up to 3 MB,
  type checked against the file bytes), edit description, category and "show on
  the website", remove (seeded `/images` files are never deleted; uploaded files
  only when nothing else references them), and drag-to-reorder. GA03 (3 Nov,
  "Format Auto Adjust/Arrange", "Minimize Negative Space"): after mount the grid
  is split into balanced columns (`src/lib/masonry.ts`: shortest column first,
  then moves/swaps between any two columns below the top row), so the admin's
  first photos stay on the top row in order while lower rows follow the admin
  order more loosely. Seeded set at 1280px: 20px column spread; 920 random
  add/remove sets all under 80px. No cropping: tiles keep their ratios.
- **Signature grid (H04, board "Utilize Empty Space", 4 Nov)**: the home
  Signature section keeps its cap of 8 featured items (the count the client
  approved; H04 asked for no holes, not more cards), and the spans come from
  the count (`src/lib/signature-grid.ts`, unit tested for 1 to 8 with and
  without a photo lead). lg (12 cols): the photo lead is 7 wide and
  two rows tall with two 5-wide cards beside it; with one other card it is one
  row tall; alone it is full width. Every other card packs into balanced rows
  of up to 4 (5 cards = 3 + 2, never 4 + 1). md (6 cols): lead full width, then
  rows of 2, an odd last card full width. Below md it stays a swipe carousel.
  No empty cell at 1280 or 768 for any count.
- **Reviews (C9, board H06 "keep reviews fresh to the most recent good
  review", 4 Nov)**: admin CRUD at /admin/reviews (reviewer name, posted on
  Google/Yelp/Facebook/Tripadvisor/Other, 1 to 5 stars, review date, text up
  to 1,000 characters, show on the website; hide/show; delete). No manual
  order: the home section shows the 6 newest visible reviews rated 4 stars or
  more, so a new good review pushes the oldest off. The seeded theme summaries
  have no date or rating, count as good, and sort after every dated review.
  Admin (reviews page and dashboard) nudges when the newest review shown is
  older than 90 days, or when none shown has a date. Review content is only
  ever copied from the platform by Dan; nothing is invented in seed, tests or
  copy (test rows are named "QA reviewer ..."). The new columns live on
  `reviews` and are read defensively: before `db:push` the home page falls
  back to the old columns and admin shows the db:push note. `db:reseed
  --force` keeps admin-added reviews (`admin_added = true`) and replaces only
  the seeded summaries; edits made to a seeded summary are reset by a reseed,
  so add the real review as a new one to keep it.
- **L6-A calendar** (built 1 Nov, NW01, base scope): /calendar month grid with
  hover highlight + pop-out covering the grid (X exits), "List by date" panel
  whose rows drop open; hovering or focusing a list row lights that day's
  square in the grid (NW01 sketch note, built 3 Nov); phone stack = list on
  top, calendar below. Admin CRUD at /admin/calendar. Event-type icons +
  legend (B6, board L6 "3 or 4 small icons ... Icon design legend") built 3 Nov
  on Pol's strict-markup order: four types in `src/lib/event-kinds.ts` (Live
  music, Specials, Pop-up, Community: the words the site already used, waiting
  on Dan to confirm or rename); a typed event shows its icon in the day square
  (untyped keeps the dot), its label in the list row and pop-out, and a legend
  sits under the grid. Icons use the existing ember token, no new colors.
- **Special Events (NW02, base scope, built 1 Nov)**: /special-events 404s
  while the admin switch is off; title/subtitle and the flyer grid are edited
  at /admin/special-events. While the switch is on, a "Specials" link renders
  right after Calendar in the top bar, the phone drawer and the footer Explore
  column, and disappears when it is off (NW02 "nav link" per the
  service-agreement Excalidraw, built 3 Nov; label pending Q11). This covers
  the old D2 CHECK; Genrou confirms the label only.
- **BK02 reservations box (built 3 Nov, Pol's order is the sign-off)**: /book is
  a 16px card framing the SpotOn reservations link set in Admin, Settings,
  with a plain "Open reservations" link and the phone under it; until the link
  is set it is a "Call us to book" card. Every Book a Table still goes to
  /book. The native wizard is hidden behind `site_settings.booking_wizard`
  (default off, also after `db:reseed`); its "Online booking enabled" pause
  still applies inside it, and its server actions refuse while it is off. /book
  alone sends a CSP whose frame-src allows https (middleware, `src/lib/csp.ts`).
- **CA03 dual paper trail (built 3 Nov)**: Admin, Settings, "Catering inquiry
  copies" (up to 10 addresses). Each inquiry is emailed to the catering email
  with those copies, via Resend, only once RESEND_API_KEY and
  INQUIRY_FROM_EMAIL are set (NEEDS-INFRA for Guns). Until then inquiries are
  saved only, as before. Plain-text body, guest as Reply-To.
- **New settings are read defensively**: `site_settings` and `event_kinds` are
  separate small tables; while they are missing (prod before `npm run
  db:push`) every page renders with the defaults and admin shows a db:push
  note instead of failing. `db:reseed --force` neither wipes nor resets them
  (default row inserted only if none exists).
- **Phase 2 built (Pol, 4 Nov 2026)**: Pol ordered phase 2 built now, as ORDER
  REQUESTS only: no card payments, no payment fields, no SpotOn or Toast API;
  the guest pays at pickup or through SpotOn and staff confirm every request by
  hand. The handoff lists this as the separate $500 ordering build, so Genrou
  must be told before it is pushed. Contract: `docs/phase2-ordering-spec.md`.
- **NW03 Menus page (/menus, built 4 Nov)**: standard header, then a dark band
  with the board heading "MENUS." and three photo tiles (16px radius, scrim to
  4.5:1, the whole tile is one link): ALL DAY CRAFT TEX MEX & BBQ with
  "Breakfast Lunch Dinner Brunch Cafe Bar" stacked (links to /menu); EXPRESS
  CATERING with its admin subtitle, default "Breakfast burrito packs. Sandwich
  Packs. Taco Bars" (links to /menus/express-catering while on, else
  /catering); HOLIDAY PREORDERS with its admin subtitle (links to
  /menus/holiday-preorders while on; while off it stays visible as a plain
  tile, not a link, showing the subtitle or "Not taking holiday preorders right
  now."). Desktop: ALL DAY on the left spanning two rows, the other two stacked
  on the right (the sketch). Phones: one column in that order. Tile photos
  default to Dan's own catering/BBQ photos in /public/images and are
  replaceable in admin.
- **Ordering pages (/menus/express-catering, /menus/holiday-preorders)**: one
  page component; each 404s while its switch is off (the /special-events
  convention). Dark band: h1 "Express Catering" or "Holiday Preorders", the
  admin subtitle, and "Order requests only. Nothing is charged online: you pay
  at pickup or through SpotOn." Then the item list in the L2-D row language
  (name, description, price note, price or "Price on request" at the right, no
  card shadows, optional small photo) with a labelled quantity per row, and the
  request panel (sticky beside the list on desktop, below it on phones): name,
  phone, email, pickup date, pickup time (30-minute slots inside store hours,
  never the last 30 minutes, lead time 48h express / 72h holiday, holiday only
  inside its pickup window), notes, estimate, one factual privacy line, Send
  request. Pickup only. Confirmation replaces the form in place ("Request
  received.", reference EC-/HP-number, no promise of acceptance or timing).
  Nothing is emailed to the guest; staff get a plain-text email (copies BCC)
  once the mail provider is set up.
- **CA01 (built 4 Nov)**: the catering hero shows "Order Express Catering Now"
  (ember, same as every order action) between Plan Your Event and See services,
  only while the Express Catering switch is on.
- **Admin, phase 2**: Menu, "Express + Holiday" (/admin/menu/ordering): one
  card per ordering menu with its on/off switch (both default OFF; switching
  on is refused with no active items, and for holiday without a pickup window
  that is not over), subtitle, lead time, holiday pickup window, tile photo,
  then the item list (add, edit, show/hide, reorder, delete); plus the ALL DAY
  tile photo. Orders (/admin/orders, sidebar badge = new requests): requests
  inbox (filters, "Not emailed" tag, mail banner, 180-day retention after
  pickup), detail at /admin/orders/[id] (contact, lines, status, internal note,
  delete), and a Catering inquiries tab (list, detail, delete). Dashboard card
  with the new count and the next pickups. All four tables are new and read
  defensively: before `db:push` the site renders with both menus off and admin
  shows the db:push note.
- **Menu item scheduling (D1, board MB03 "Add scheduling menu Items in the
  admin panel", built 4 Nov)**: two kinds of schedule, kept apart on purpose.
  (1) Day and time rules (Availability: Always, Specific days, Specific days +
  times, Seasonal) already existed and were already editable in the item
  editor; they never hide an item, they drive the "Fri & Sat only" style
  badges and "available now". A time window must end after it starts (store
  hours end before midnight, so no overnight windows). (2) New: a "Schedule"
  section in the item editor with Show from / Show until dates (both
  optional, both days inclusive, restaurant timezone from the same clock as
  the store status) and a Clear dates button. Outside the dates the item is
  left off the public menu, its search, the featured picks, the home
  Signature grid and the admin dashboard's featured preview. The admin list
  tags the item "Scheduled · from <date>" (not on yet, purple), "Ends <date>"
  (on, with an end, purple) or "Ended <date>" (gray); the editor adds "Not on
  the website today". Dates were chosen over more day/time rules because the
  day/time half of "scheduling" was already built, and a limited or seasonal
  item that appears and disappears by itself is the part an owner could not
  do. Storage is a side table (`menu_item_schedules`, one row while a date is
  set) so every existing menu_items read, including the site layout's on
  every page, works on prod before `db:push`; until then the site shows every
  item and saving dates returns the db:push note (saves without dates work).
  The filter runs per request after the menu cache, so a start or end date
  takes effect at local midnight without a menu save. `db:reseed --force`
  rebuilds the menu tables, so it wipes every schedule typed in admin, like
  every other menu edit.

## 4b. Confirmed from the client's board markup (captured 2026-10-30)

Source: FEEDBACK-discovery-board.md. The client marked choices as green X's on the
option circles; these confirm the layouts above (L1-A, L2-D, L4-A, L5-A, L6-A) plus
the dials: corners Round 16px, spacing Standard, photos full color except under
text (keep scrims where type sits on photos), headings Bigger with copy sized up
on mobile. Client copy now seeded: hero tagline, footer tagline, intro paragraph,
menu H1 ends "Brew.", gallery subline, catering contact bookings.smokymug@gmail.com.
Order Now on menu rows: anchored bottom left in the featured-action color (brick
orange since 1 Nov), tags and Options one row up; hidden until the SpotOn URL is
set (Q8).

## 5. Motion

Keep the existing restrained motion system (smoke layers, reveals, carousels);
reduced-motion support stays. No new heavy animation work is in this handoff.

Stable elements (4 Nov, do not undo): motion components render the same element
on the server, in hydration, and whether motion is playing, paused by the header
toggle, or reduced by the OS. Never branch to a plain element on reduced motion:
swapping the component type re-mounts the whole subtree, so the pause toggle reset
the gallery marquee and would wipe a typed form. Anything that starts hidden carries
`data-reveal`, and globals.css pins it shown for `prefers-reduced-motion` and for
`:root[data-motion="paused"]`. Things that keep moving (marquee, carousel, Ken Burns,
parallax) read `usePrefersReducedMotion()` and stop through their props, not through
MotionConfig, which an element already on the page never re-reads. Guarded by
`tests/e2e/public/motion-pause.spec.ts`.

## 6. Cross-cutting acceptance (handoff §8–9)

- Test at 320, 390, 768, 1024, 1280px. No horizontal scroll, no clipped text.
- Contrast 4.5:1, visible focus, keyboard nav for the nav + Explore Menu dropdown,
  alt text on photos.
- WebP images, lazy-load below the fold.
- Every new setting editable in the admin panel; no dev needed for routine edits.
- Change log: record each change under its handoff ID (A1–E1).

## Out of scope: do not build

SpotOn/Toast API work, online card payments of any kind (no card fields,
deposits, stored payment data or checkout), POS/menu/inventory sync, customer
accounts and customer emails, delivery orders, whole-site redesign. Pol 4 Nov:
on-site order REQUESTS are built (phase 2, above); card payments, SpotOn/Toast
API and POS sync stay out. Pol's rule (3 Nov): a CHECK item is in scope when
the client's own board markup asks for it, and his instruction is the
sign-off. Built on that basis: B6 icons, C13 dual paper trail, C14/BK02 SpotOn
box. C9 reviews freshness (H06) and D1 scheduled menu items (MB03) built 4 Nov
(Pol ordered every board instruction built). Phase 2 (NW03 Menus page, Express Catering and Holiday Preorder
ordering pages, CA01 button) built 4 Nov as order requests. Palette decided
(Pol, 3 Nov, S3-4b): solid brick orange stays, no textures, no color changes.
No longer gated: D2 (NW02 Specials link), C12 "Brew." (menu H1, 30 Oct).
