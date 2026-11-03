# The Smoky Mug — design contract (discovery Rev 1)

Source: `SmokyMug-Dev-Handoff-INTERNAL.pdf` Rev 1, 17 Oct 2026 (Genrou), built from
Dan Lee's marked-up discovery board. This file encodes the client's own choices;
where this file and the handoff disagree, the handoff wins. Where the handoff and
the board disagree, ask Genrou. Do not invent beyond it.

## Status of these values

Palette and font are **PROPOSED** (handoff Q1/Q2, Dan has not supplied hex values or
the Roadstore file). They ship as CSS design tokens so the final values are a
one-line change. Roadstore is NOT shipped until a web license is confirmed; the
existing Fraunces display stack stays as the heading face until then.

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

## 2. Typography (handoff 6.2)

- Headings: Roadstore **when licensed** (Q2); until then the current Fraunces stack.
  Keep a fallback stack; layout must not shift if the font fails to load.
- Buttons (Guns 2 Nov: "use roadhouse font on the buttons... or at least a
  children font of that"): filled CTA variants (primary/light/dark) use
  `--font-western` = **Rye** (Google Fonts, free), the closest Roadstore
  relative we can ship today. Single 400 weight, so no `font-semibold` on
  western buttons (faux bold). Quiet utility variants (secondary/ghost/outline:
  booking steps, cancel dialogs, downloads) keep the UI sans via the Button
  `face` default; Rye's subset also lacks their U+2190 back-arrow. Page CTAs
  that happen to use a quiet variant (home View Full Menu, Visit Get Directions
  and Email) pass `face="western"` (3 Nov, "buttons generally"). Swap the
  family to Roadstore in one token when the license lands.
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
- Spacing: Standard — keep the current rhythm, do not tighten or loosen.
- Photos: full color. Text over a photo needs a scrim/gradient to 4.5:1. Photos
  without text stay unfiltered.
- Menu page headers: photo background + scrim, one photo per menu (placeholders
  until Dan supplies photos, Q7).

## 4. Layouts chosen by Dan

- **L1-A hero**: full photo, text left. No large logo in the hero (C1).
- **L2-D menu** (built 1 Nov): tabs + search kept; featured dish in its own
  column beside the list (photo side ~40%, sticky on desktop; stacks on top on
  phones); the list is clean rows — name, short description, price right, no
  photo per row, no card shadows; badges/OPTIONS as small text in the row,
  Order Now bottom left when the SpotOn URL exists. Featured = first item in
  each tab (Q10 default) until Genrou clears an admin pin.
- **Navigation**: desktop L3-A: logo left; inline links Menu, Our Story,
  Catering, Calendar, Contact (P1, Pol 3 Nov: Calendar replaces Gallery in the
  top bar, the drawer and the footer; /gallery stays, reached from the home
  gallery section and the sitemap); right side [Book a Table] [ORDER NOW], ORDER
  NOW rightmost (board H01: the nav phone became Book a Table, the old button
  became ORDER NOW). Compressed mode (collapse by FIT, not device; test 1024px):
  hamburger left, logo centered, left slide-out drawer (85% width, max 360px,
  scrim, closes on scrim/Esc/link tap, traps focus, locks body scroll); drawer
  CTAs in the same order. Top bar keeps ONLY the phone number in both modes.
  Header sticky. Fit measured 3 Nov at 1024px with Specials on and Order Now
  showing: 912 of 928px, one line.
- **Order Now routing (NW03-2, 3 Nov)**: "Order Now buttons from other pages go
  directly to main Restaurant Menu". Header, drawer and hero Order Now link to
  /menu and always show; the SpotOn ordering link sits on every menu item and
  the featured dish (NW04), hidden until the URL is set. Alternative reading
  (header/hero Order Now straight to SpotOn, handoff C2) is recorded in
  FEEDBACK-client-review-3nov.md for Pol.
- **Explore Menu (board H01 + NW03-1, 3 Nov)**: the hero drop lists the ordering
  menus from `src/lib/ordering-menus.ts`: Restaurant (/menu) and Express
  Catering (/catering until its ordering page exists). Holiday Preorder joins
  when its page and on/off toggle are built (phase 2).
- **L4-A buttons** (pill; Book a Table soft square). Both header CTAs are solid
  ember (no texture, no color change in this round).
- **L5-A gallery**: masonry, no fixed heights, no gap taller than one row at
  1280px. Admin drag-to-reorder (reorder only). GA03 (3 Nov, "Format Auto
  Adjust/Arrange", "Minimize Negative Space"): after mount the grid is split
  into balanced columns (`src/lib/masonry.ts`: shortest column first, then
  moves/swaps among the second half of the list), so the admin's first photos
  stay on the top row. Column bottom spread measured 1280/1024/768/390: 325/97/
  73/54px before, 74/16/7/10px after. No cropping: tiles keep their ratios.
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
- **NW03 Menus landing page (PHASE 2, do not build yet)**: a "Menus." page of
  three photo tiles: All Day Craft Tex Mex & BBQ (links to /menu), Express
  Catering (links to a catering express ordering page, phase 2 build), and
  Holiday Preorders (admin-editable subtitle + on/off toggle, links to a
  holiday ordering page, phase 2 build). The Explore Menu drop and the Order
  Now routing are already live (above); phase 2 adds the page itself, the two
  ordering pages, the Holiday Preorder option + toggle, the CA01 "Order Express
  Catering Now" button, and top-bar/footer "Menus" links that land on it. The
  sketch's own note: "This page isn't active until phase 2 (ordering catering
  express, ordering holiday preorder) are built."

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

SpotOn/Toast API work, on-site ordering, whole-site redesign. Pol's rule (3 Nov):
a CHECK item is in scope when the client's own board markup asks for it, and his
instruction is the sign-off. Built on that basis: B6 icons, C13 dual paper
trail, C14/BK02 SpotOn box. Still unbuilt although the board asks for them (not
in the screenshots Pol sent; his call): C9 reviews freshness (H06), D1 scheduled
menu items (MB03). Phase 2: the NW03 Menus page, the Express Catering and
Holiday Preorder ordering pages, the CA01 button. Palette decided (Pol, 3 Nov,
S3-4b): solid brick orange stays, no textures, no color changes. No longer gated:
D2 (NW02 Specials link), C12 "Brew." (menu H1, 30 Oct).
