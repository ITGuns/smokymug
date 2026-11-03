# Discovery changes — project log (handoff Rev 1, 17 Oct 2026)

Branch `discovery-r1`. Every change below is logged under its handoff ID per §8.
Hrs column left for the team to fill against the 3-hour cap (this round was one
automated dev session). Status: BUILT, DEFAULT (OPEN item built with the handoff's
stated default behind a named setting), HELD (not built, per handoff rules).

| ID | Status | What was done | Hrs |
|---|---|---|---|
| A1 | DEFAULT (Q1) | Teal/red theme as PROPOSED tokens in `src/app/globals.css` (`--color-teal-*`, `--color-red-*`; teal-600 #0B5D5E, teal-800 #07403F, red-600 #B3261E, cream #F6EEE1, ink #161311). One-line change when Dan supplies real values. Site-wide sweep off the old ember/orange accent. | |
| A2 | HELD (Q2) | Roadstore NOT shipped (no file, no license). Headings stay on the existing Fraunces stack, swap point is `--font-display` in globals.css + `src/app/layout.tsx`. | |
| A3 | BUILT | 16px radius on cards/panels/images (`rounded-2xl`); buttons stay pills (L4-A); Book a Table soft square (10px) via a `shape="soft"` button variant. Standard spacing untouched. | |
| A4 | BUILT | Photos stay full color; text-over-photo panels carry scrims (hero, menu header, featured cards). | |
| A5 | BUILT | Body floor raised to 17px (`globals.css` base layer); heading scale verified at 390px. | |
| A6 | DEFAULT (Q7) | Menu page header: photo background + scrim (`src/app/(site)/menu/page.tsx`), placeholder `bbq-platter-full.jpg` until Dan's photos arrive. | |
| B1/C1 | BUILT | Hero L1-A kept (full photo, text left); large hero logo removed (`src/components/home/Hero.tsx`). | |
| B2 | DEFAULT (Q10) | Menu L2-D: category tabs + featured-dish card above the list (`MenuExplorer.tsx`). Featured = first item in the tab; admin pin is CHECK, not built. | |
| B3 | BUILT | Nav: desktop inline L3-A; below lg (1024px, collapse-by-fit) hamburger left + centered logo + left slide-out drawer (85% / max 360px, scrim, Esc, link-tap close, focus containment, body scroll lock). Drawer Menu expands to the display menus. Phone lives only in the top strip, in both modes. | |
| B4 | BUILT | L4-A pills; ORDER NOW primary (red) in header; Book a Table secondary soft square. | |
| B5 | BUILT | Admin → Gallery: drag-to-reorder for gallery images (new `src/actions/gallery.ts`, `src/app/admin/(panel)/gallery/`). Reorder ONLY; crop/captions/positions remain CHECK. Public masonry auto-fill verified. | |
| B6 | HELD (CHECK) | Calendar event icons not built; needs Genrou scope sign-off. | |
| C2 | DEFAULT (Q8) | Nav phone removed; Book a Table + ORDER NOW in the bar. New admin setting "Online ordering URL (SpotOn)" (`restaurant_info.order_url`); ORDER NOW renders only once the link is entered (opens new tab, `rel=noopener`). | |
| C3 | DEFAULT (Q4) | Explore Menu is a keyboard/touch dropdown (`src/components/site/MenuDropdown.tsx`) routing to the site's display menus, not online ordering. NOTE: this build has five menu views (Breakfast / Craft Barbecue / Sunday Brunch / Bar & Happy Hour / Cafe + Drinks), not the three (In House / Delivery / Catering) the handoff names — flagged for Genrou. | |
| C4 | BUILT | H02 heading set exactly to "All-Day Craft, Tex-Mex & Barbecue Kitchen"; intro paragraph kept. | |
| C5 | DEFAULT (Q5) | Cafe/Pit columns swapped: The Pit reads first. | |
| C6 | DEFAULT (Q7) | Sausage photo replaced with gallery placeholder (`latte-art-1.jpg`), same crop; swap when Dan's photo arrives. | |
| C7 | BUILT | Signature plates grid re-packed (four 3-col cards on the lower rows); no empty cells at 1280/768/390. | |
| C8 | BUILT + DEFAULT (Q9) | "Cafe Fare" line removed from the public service-window chips (hours row kept in DB for availability logic). Hours already flow from the single admin hours table to top strip, H05 and footer. Current live-site hours stay until Q9 is answered. | |
| C9 | HELD (CHECK Q12) | Reviews freshness system not built. | |
| C10 | BUILT | Footer tagline is its own editable string (`restaurant_info.footer_tagline`, falls back to the main tagline); current copy left in place for the copy sheet. | |
| C11 | BUILT | Contact blocks: email first, phone second; Call button removed; emails wrap (`wrap-anywhere` + `min-w-0`) instead of dropping letters, checked at 320/390/768/1280. | |
| C12 | BUILT (30 Oct) | "Brew." appended to the menu H1 per the client's board marks (MB01/MD01), answering Q6 in the client's favor. | |
| C13 | HELD (CHECK Q13) | Extra inquiry emails not built. | |
| C14 | HELD (CHECK Q8) | SpotOn reservations box not built; native booking remains as currently shipped. | |
| D1 | HELD (CHECK) | Menu-item scheduling not built. NOTE for scope call: items already support availability rules (`always/days/schedule/seasonal`) — D1 may be a smaller delta than the handoff assumes. | |
| D2 | HELD (CHECK Q11) | Specials top-bar link not built. (The Special Events toggle + page it extends was built 1 Nov, base scope — see the audit-fix section below.) | |
| E1 | PENDING | Copy sheet regeneration happens after demo recapture (phase 6-7, separate session). | |

## Repo-vs-handoff baseline mismatches (for Genrou)

The handoff assumes the demo-spec baseline (three menus, Special Events toggle +
404, SpotOn links only, reservations behind a feature flag). This repository is a
fuller build: one structured menu with six categories, a native reservation
system (admin-managed, `bookingsEnabled` pause toggle, no 404), and Toast (not
SpotOn) links seeded for gift cards/loyalty. Defaults above were applied against
the repo as it exists; where the two disagree, Genrou decides. (1 Nov: the
Special Events toggle + page and the calendar are now built, base scope.)
Still for Genrou: the base-scope phrase "gallery admin" - the gallery admin does
reorder only (B5); upload/remove/alt-edit is not in the agreed CHECK set either.
Say whether it belongs in base; the upload pipeline from Special Events flyers
can be reused in under an hour. Also note: catering inquiries save to a table
and notify nobody by email yet, so C13's "copy extra recipients" has no mail to
copy until an email path is cleared.

## Hardening pass (28 Oct 2026, after a full repo audit)

Applied on top of the discovery changes: next 15.5.25 → 15.5.28 (critical image
optimizer CVE) + non-breaking `npm audit fix`; JSON-LD `<` escaping (stored-XSS
via admin-edited text); production guard against placeholder/short
`SESSION_SECRET`; timing-safe manage-token compare + same-origin check on
`/admin/logout`; booking lead time measured in absolute minutes (was today-only;
regression test added); server-action body limit 4 MB + client-side 3 MB image
check and upload error handling; `pg` pool error listener; `error.tsx` for site,
admin and global; `MotionConfig reducedMotion="user"`; danger dialogs focus
Cancel; working ESLint flat-config gate (`npm run lint`, 0 errors).

Known remaining advisory: 1 high in postcss vendored inside next 15.x; the only
fix is next 16 (breaking), owner's call. Bigger audit recommendations (catering
inquiries admin + alerts, durable rate limiting, transactional email, caching/
region strategy, session revocation, CI) are in the dev report, not built.

## Audit engineering pass (28 Oct 2026, second batch)

Safe-bucket items from the audit, built on request: session versioning (password
change revokes every other admin session; all admins re-log once after deploy);
header play/pause motion toggle (both nav modes, persisted, pauses CSS + motion
animation); open/closed status honours today's blackout or special-hours
override; shared `useAction`/`runAction` error handling across all 15 admin
editors; shared `useFocusTrap` on the nav drawer, gallery lightbox, admin
drawers and confirm dialogs (stacked Escape handling); calendar-valid dates +
http(s)-only link validation; DB CHECK constraints + partial unique index on
active bookings; e2e suite refuses Supabase hosts without `E2E_ALLOW_REMOTE=1`
and the hardcoded fallback admin password is removed (rotate if it was ever
real); GitHub Actions CI (checks + e2e on a Postgres service container);
conservative CSP on every route; optional `DATABASE_CA_CERT` pins Supabase TLS.

Deploy notes: run `npm run db:push` (new column + constraints; the unique
active-booking index fails to apply if existing duplicate active bookings
exist, so dedupe first if push complains), and expect one forced re-login for
all admins. Gate: tsc 0, lint 0 errors, vitest 60, build clean, e2e suite green
(one known timing flake on the drawer rotate test, passes on retry).

## 2026 menu (28 Oct 2026, from "2026 New Menu (FINAL).pdf")

Full menu content replaced in the seed: 6 categories / 32 sections / 144 items /
32 modifier groups. Structural changes: Tex Mex is its own menu view (Tue-Sat
11:30-9, new `tex_mex` hours category; tacos/nachos moved out of BBQ), BBQ is
Wed-Sat only, breakfast is "South Western Breakfast" 'til 11:30 daily, bar
drops Wine Wednesday, happy hour seeded Tue-Sat 3-6. Surviving items keep
slugs/images/featured flags; apply with `npm run db:reseed` (wipes and reseeds
menu/content, keeps reservations; admin menu edits made since the last seed are
lost, and the Next data cache holds the old menu until the next deploy or a
cache clear).

Confirm with Dan (printed in the PDF exactly as entered, flagged with
`// TODO 2026-menu:` in the seed): hot Black Eye 5.95|4.75 (S dearer than L),
hot Mocha 4.75|5.50, hot Matcha Latte 6.25|7.95, iced Matcha Latte 4.35|8.05,
Dirty Soda single 4.75; happy hour Tue-Sat (bar page) vs "daily" (BBQ/Tex Mex
pages); Meat Market units no longer printed; sampler choice count assumed 4.

## Client board feedback applied (30 Oct 2026, from FEEDBACK-discovery-board.md)

The client's Excalidraw markup was captured in full to FEEDBACK-discovery-board.md;
the small, unambiguous site changes were applied the same day:

- Copy (client's blue markup, verbatim): hero tagline "Craft Tex Mex & Barbecue
  Restaurant. Coffee, cocktail, and pastry programs included."; footer tagline
  "Craft Tex-Mex & Barbecue Restaurant. Kitchen + Cafe + Bar. Breakfast + Lunch +
  Dinner."; intro paragraph ("A morning to night Tex-Mex experience...", espresso
  spelling fixed); menu H1 now ends "Brew." (MB01/MD01); gallery subline "Eat with
  your eyes. Then come give your mouth a turn." All seeded: apply with
  `npm run db:reseed` + cache clear, same caveats as the 2026 menu entry.
- Catering contact (CA03): new `catering_email` column + admin Settings field
  ("Catering inquiries email", falls back to the main email), seeded with
  bookings.smokymug@gmail.com; the catering page and form hint use it.
  Schema change: run `npm run db:push` before reseeding.
- NW04 order buttons: menu item cards show a red "Order Now" pill anchored bottom
  left (tags/Options row sits above it) once the SpotOn URL is set in Settings;
  hidden until then (Q8 still open). Card markup restructured (button + link
  siblings) so the modal click target and the order link don't nest.
- Visit/Contact email now breaks at the @ (never mid-word) via <wbr> (H10/CO02).
  Follow-up same day: extracted as <EmailLink> (wrap-break-word + <wbr>) and used
  for every rendered address (Visit, footer, catering); the old wrap-anywhere
  utility (which allowed mid-word breaks) is removed. Responsive sweep of all six
  public pages at 320/390/768px found no horizontal overflow and no mid-word
  wraps; stacking verified by forcing a 150px container (breaks exactly at the @).
- Verified already satisfied by the rebuild, no change: hero logo stamp removed
  (red X = C1), H02 heading/intro flip (C4/C5), Call button removed + email/phone
  swap (C11), signature grid packs full width (C7/H04), gallery masonry bottoms
  within 95px at desktop (GA03), bigger headings + 17px body floor (dials).
- NOT built (still gated): CHECK items C9/C13/C14/D1/B6 (client confirmed wanting
  them on the board; Genrou's written scope sign-off still required), hours edits
  (board conflicts with the 2026 menu, Q9), phase-2 pages NW01/NW02/NW03 and the
  CA01 Express Catering button, footer Calendar link (no /calendar page yet).

## Live-site audit fixes + brick-orange revert (1 Nov 2026)

Trigger: Genrou's `SmokyMug-Live-Site-Audit-INTERNAL.pdf` (checked 1 Nov against
Rev 1, Rev 2 and the board) plus Guns's chat instruction the same evening. The
audit's eight "missing Rev 2 items" split two ways: five (R2-01/02/04/08 and the
Tex Mex window) were already in this repo's seed data and are invisible on the
live site only because prod has not run `npm run db:reseed`; three (plus B2 and
NW02) were real build gaps. The 30 Oct entry above wrongly filed NW01/NW02 as
phase-2: the dev handoff page 1 lists calendar and the Special Events toggle in
the BASE build, and its acceptance list includes "Menu L2-D". Corrected below.

- Theme (Guns, 1 Nov: "teal too much, accents only, back to the brick orange"):
  site-wide revert to the original warm scheme — charcoal dark surfaces, ember
  (brick orange) CTAs/accents/eyebrows, wood catering sections, gold stars/info
  tags. Teal kept ONLY as: hero "Brewed slow." line, footer column eyebrows,
  text selection. Red is admin/error only now. Supersedes Rev 1 item A1;
  DESIGN.md §1 rewritten. Q1 (Dan's palette) still open.
- B2 menu L2-D (audit section A, was missed): /menu rebuilt — featured dish in
  a sticky ~40% column beside the list (stacks on top on phones), clean list
  rows (name, description, price right; no photos, no card shadows; badges +
  OPTIONS small in the row; Order Now bottom left when the SpotOn URL exists).
  `MenuItemCard.tsx` replaced by `MenuItemRow.tsx` + `FeaturedDish.tsx`.
- R2-14 / NW01 calendar (was missed, base scope): /calendar built per the board
  sketch — month grid with hover highlight, click pops details out OVER the
  grid with an X to exit, "List by date" panel with drop-open rows, phone stack
  list-first, month navigation via ?month=YYYY-MM. New `events` table +
  /admin/calendar CRUD. No invented events are seeded. B6 event-type icons
  remain CHECK and unbuilt.
- R2-10: footer Explore column gains CALENDAR between Catering and Gallery.
- NW02 Special Events (was missed, base scope): `special_events` +
  `special_event_images` tables, /special-events page (404 while the switch is
  off, per dev spec), /admin/special-events (toggle, title, subtitle, flyer
  uploads with reorder). D2 top-bar specials link remains CHECK and unbuilt.
- R2-01: hero subhead now renders as two lines (one per sentence), matching the
  board's line break. R2-04: footer tagline stored and rendered as three lines
  (admin field is a textarea; line breaks preserved).
- R2-03: new `taco_tuesday` hours category + seeded window "Taco Tuesdays,
  Tues 11:30AM - 9PM" on the public service chips, right after Tex Mex. It
  overlaps the Tex Mex Tuesday window on purpose; Genrou reconciles under Q9.
  Wine Wednesdays stays retired (2026 menu dropped it; audit asked to confirm).
- Audit section B answers: R2-12 header ORDER NOW and R2-11 hero ORDER NOW were
  already built and are dark only because `order_url` is unset (Q8) — same for
  R2-17 card buttons, now row buttons. R2-13 Explore Menu dropdown kept as the
  menu-tab list until Genrou decides (NW03 target is phase 2). C14 SpotOn box
  stays CHECK. C8's menu-tab "Cafe Fare" note: already gone - the 2026 menu
  seed replaced the breakfast note, so a prod reseed removes it from the live
  menu page too.
- Audit section D answers (admin items the auditor could not see): gallery drag
  reorder EXISTS; D1 scheduled menu items, C13 extra catering recipients and C9
  reviews freshness are NOT built (CHECK); the Special Events switch and
  calendar admin now exist (this entry).
- Deploy notes for Guns: `npm run db:push` (new tables + hours category), then
  `npm run db:reseed`, then redeploy (or hit save in admin) so the Next data
  cache revalidates. Admins may need to sign in again. BE PRECISE about what
  reseed does: it KEEPS reservations, calendar events, Special Events flyers
  and the Special Events switch; it WIPES AND RESEEDS everything else content-
  side - the whole menu (admin menu edits lost), restaurant Settings including
  any `order_url` / catering email already typed in, hours, booking windows and
  booking settings (`bookingsEnabled` returns to on), gallery images and their
  drag order, and reviews. If anything was hand-edited in prod admin, note it
  down first and re-enter it after the reseed.

## CTA + accent polish (2 Nov 2026, Guns's screenshot round)

Guns's chat, 2 Nov (screenshot with red circles on the header Book a Table and
the hero Explore Menu): make the circled buttons brick orange "para mas naka
highlight", add "more teal accents sa color scheme", and "dili ma gamit tung
roadhouse na font?" on the buttons.

- Both circled CTAs are now solid ember-600 (brick orange): header/drawer Book
  a Table dropped its charcoal `secondary` variant for primary; the hero
  Explore Menu trigger swapped its dark-glass pill for the primary ember style
  (`Header.tsx`, `MenuDropdown.tsx`). Shapes unchanged (soft square vs pill).
- Teal promoted from "three spots only" to the site's secondary accent, the
  info layer: all section eyebrows + micro-labels (19 swapped ember→teal),
  Intro pit/cafe labels, menu hours notes, ServiceHours left borders, calendar
  date chips + today ring, header address pin. Ember keeps every action:
  CTAs, links, hovers, nav underline, event dots. Rule written into
  DESIGN.md §1 (Rules, 2 Nov).
- Buttons wear the Roadstore look: Q2's license is still unresolved, so
  `--font-western` ships **Rye** (Google Fonts, free, closest Roadstore
  relative) on the site's filled CTA buttons (`ui/Button` + the Explore Menu
  trigger). Single 400 weight, Fraunces fallback, one-token swap to Roadstore
  when Dan supplies the file. Headings unchanged (still Fraunces per Q2).
- Brick running-bond texture on every primary CTA (`brick-texture` utility in
  globals.css): inline SVG mortar tile over the ember fill, no image requests.
  PULLED 3 Nov on Guns's check ("color lang na brick orange"): brick orange
  means the color, so CTAs returned to the plain ember fill. The rest of this
  section (colors, teal layer, Rye, finish-gate fixes) stands.
- An opus finish-gate review ran before push and its findings landed: the
  phone sticky-bar Menu/Book a Table got the full treatment; the mortar tile
  re-centered off button middles so no line crosses a label; utility/flow
  buttons (booking steps, cancel dialog, calendar/.ics) returned to the UI
  sans via a variant-derived Button `face` default (Rye also lacks their
  back-arrow glyph); leftover ember info-accents went teal (catering
  how-it-works + icon chips, calendar pop-out times, home Service windows
  label); stray CTAs joined the rule (book/[code] hand-built pill became a
  ButtonLink, HoursSection + contact Book a Table are soft squares, label
  casing fixed); primary hover darkened to ember-700 (contrast); and the
  "one brick primary per cluster" Order Now decision is written into
  DESIGN.md §1 pending Guns's confirm before the SpotOn URL goes in.

## NW Excalidraw round (3 Nov 2026)

Source: the "NEW PAGES AND FEATURES TO SKETCH" Excalidraw (service-agreement
follow-up; the file the client referenced in his 3 Nov review), received from
Guns 3 Nov. NW01 and NW02 were already built 1 Nov and match the sketch; this
round adds the two details the sketch has that the build lacked, and records
NW03/NW04.

- NW01: hovering or focusing a "List by date" row now lights that day's
  square in the month grid (the sketch's "hover highlights date square" note).
- NW02: a "Specials" link renders in the top bar (between Catering and
  Gallery), the phone drawer and the footer Explore column while the admin
  Special Events switch is on, and disappears when it is off (the sketch's
  "nav link"). This covers the old D2 CHECK via the service-agreement doc;
  Genrou confirms only the label (Q11). E2E asserts the link appears and
  disappears with the switch.
- NW04 verified as already built: notations sit above the Order Now row,
  Order Now anchors bottom-left (menu rows + featured dish), one consistent
  order-action color. Per NW04 change 3, the 2 Nov "Order Now goes dark when
  Q8 lands" note is WITHDRAWN: Order Now stays brick ember everywhere
  (DESIGN.md §1 updated).
- NW03 (Menus landing page: All Day tile + Express Catering + Holiday
  Preorders, Explore Menu becoming a 2-3 option drop): recorded in DESIGN.md
  §4 as PHASE 2 per the sketch's own note, not built. Needs scoping.
- Nav fit: with Specials on AND Order Now live (Q8, settable in admin without
  a deploy) the desktop bar measured 1084px at 1024 and wrapped "Our Story".
  Below xl the nav now uses a 16px gap, 0.14em tracking and nowrap links
  (measured 997px worst case with real Bebas/Rye); xl and up keep the original
  spacing.
- Opus finish-gate review of this round: FIX-FIRST; findings applied
  (layout prop bug, nav fit, hover state reset on month change, handlers moved
  to the row so the expanded panel keeps the highlight, class ternary instead
  of cascade-order reliance, e2e guard, stale CHECK comments). Its prod-schema
  concern was disproven by evidence: live /special-events returned 404, not
  500, on 3 Nov, so both new tables already exist on prod.
  Known, not fixed: the spec's afterAll resets the switch by SQL (no cache
  revalidation), so a mid-test failure can leave a stale Specials link in a
  reused local dev server until `.next` is cleared.

## Client review round (3 Nov 2026)

Source: Dan's written review relayed by Guns 3 Nov, plus Guns's 2 Nov chats and the NW board section. Full
matrix, live-vs-repo evidence and the stale prod list: FEEDBACK-client-review-3nov.md. Draft client notes:
BUILD-NOTES-for-Dan.md (Guns sends).

- Finding: prod content is the untouched 23 Sep seed (menu 127/127 names and prices identical to 59313a6; old
  tagline, intro, footer, hours). Board copy and the 2026 menu are in the repo but were never loaded on prod.
- S1-3: page CTAs on quiet variants (home View Full Menu, Visit Get Directions + Email) now wear the western
  face (`face="western"`); booking-flow utilities keep the sans.
- NW01-4: closing the calendar pop-out hands focus back to the day square (it was lost while the grid was
  still inert).
- Admin: Settings "Description (SEO)" is now "Description (home intro + SEO)" with a hint, since it drives the
  home intro; Hours help no longer asks the owner to settle old scrape conflicts (S3-5).
- Superseded the same night by the board-markup round below: S3-3b is resolved by BK02 (SpotOn box), S3-4b is
  decided (Pol: keep solid brick orange, no textures, no color changes), and Calendar is in every nav (P1).

## Board markup round (3 Nov 2026, late): strict build of the client's own marks

Sign-off: Pol's order with the board screenshots (S5-S15) was to be STRICT on every client mark, and that items
DESIGN.md or the handoff called CHECK are in scope when the client's markup asks for them. That instruction is the
written sign-off for B6, C13 and C14 below (replacing "until Genrou signs off"). Colors untouched (palette
decided: solid brick orange stays).

| ID | What was built |
|---|---|
| P1 / board footer | Calendar replaces Gallery in the top bar, the phone drawer and the footer Explore column. Specials (switch on) follows Calendar. /gallery stays (home gallery section, sitemap). |
| H01 nav (S7-1) | Header right side is [Book a Table] [ORDER NOW], ORDER NOW rightmost; the drawer uses the same order. |
| NW03-2 | Header, drawer and hero Order Now link to /menu and always show ("go directly to main Restaurant Menu"). Menu items keep the SpotOn link (NW04), hidden until set. Alternative reading flagged in the matrix. |
| H01 hero (S7-5) / NW03-1 | Explore Menu drops to the ordering menus: Restaurant (/menu), Express Catering (/catering until its page exists). Holiday Preorder waits on its phase-2 page + toggle. |
| B6 / L6 (S6-2) | Event types (Live music, Specials, Pop-up, Community; Dan to confirm/rename) set in Admin, Calendar; icon in the day square, label in the list and pop-out, legend under the grid. New table `event_kinds`. |
| C13 / CA03 (S10) | Admin, Settings, "Catering inquiry copies" (up to 10). No inquiry email existed before; each inquiry is now emailed to the catering address with those copies via Resend, gated on RESEND_API_KEY + INQUIRY_FROM_EMAIL (unset = saved only, as before). NEEDS-INFRA: Guns picks/creates the provider account and a verified sender. |
| C14 / BK02 (S13) | /book is the SpotOn box: iframe of the admin-set link, "Open reservations" link + phone under it, "Call us to book" card until the link is set. The native wizard is hidden behind `site_settings.booking_wizard` (default off, stays off after reseed) and its server actions refuse while off. /book alone allows https frames in its CSP. |
| GA03 (S11) | Balanced gallery columns (shortest column, then evened out; top row keeps the admin order). Column-bottom spread at 1280/1024/768/390px: 325/97/73/54 → 74/16/7/10px. |
| S15 "Brew." | Already on the menu H1 since 30 Oct (handoff Q6 only asked what "Brew" means as a menu section; it does not argue against the heading). No change. |
| Found in verification | `(site)/template.tsx` branched on reduced motion while rendering, which broke hydration on every page for reduced-motion visitors; it now renders one element and leaves the slide to MotionConfig. Still open (pre-existing, not touched): the home, gallery and catering heroes (SplitText, ImageCarousel) show the same mismatch for reduced-motion visitors only. |
| npm audit high (verification) | Cleared without leaving Next 15: package.json `overrides` pins next's own postcss to 8.5.32 (it shipped 8.4.31; GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849). The tree now has one postcss, 8.5.32, and the build still emits the Tailwind CSS. A plain `npm install` kept the stale lock entry, so that one entry was dropped from package-lock.json and reinstalled. Drop the override once the repo moves to a Next whose own postcss is past 8.5.22. Still open, dev-only: 18 moderates (eslint/minimatch chain, drizzle-kit/esbuild). |
| Reduced-motion hydration (closes the "still open" note above) | New `src/components/motion/usePrefersReducedMotion.ts`: false on the server and during hydration, the OS setting right after (useSyncExternalStore). SplitText and ImageCarousel use it, and so do Reveal/RevealGroup, ParallaxImage (its clip now snaps open, duration 0) and Marquee, which showed the same mismatch once the hero one was gone. Reduced-motion visitors end up on the same static markup as intended before; normal motion is unchanged. Dev and prod build: /, /gallery, /catering log zero hydration errors with and without reduced motion. Found, not fixed: the header pause toggle does not stop the home carousel or the marquee (prod build, paused: slide 0 to 1 in 8s, strip kept moving), although MotionProvider's comment says it does. |

Data and deploy notes (for Guns):
- New tables `site_settings` and `event_kinds`, read defensively: until `npm run db:push` runs on prod, the site
  renders with the defaults (/book = phone card, events untyped) and admin shows a "needs db:push" note instead of
  saving. Local push printed exactly two CREATE TABLE statements and one foreign key, nothing else.
- `db:reseed --force` does not wipe either table; it inserts the default `site_settings` row (SpotOn box, wizard
  off, no copies) only when none exists, so a typed SpotOn link and CC list survive a reseed.
- E2E: auth.setup turns the wizard on for the suite (the booking specs drive it), global.teardown turns it off and
  clears the link; `public/reservations-box.spec.ts` covers the box, `admin/site-settings.spec.ts` the two new
  admin cards, `admin/calendar.spec.ts` the event type.

- Header pause toggle now really stops the hero carousel auto-advance and the marquee: `usePrefersReducedMotion`
  also returns true while paused (reads `useMotionPause`; false on server, during hydration, and outside the provider).
- 4 Nov a11y flake on / (135 contrast nodes, 4 of 6 runs): MotionConfig "user" drops only transforms, so `(site)/template.tsx`
  still faded the whole page body in from the SSR opacity 0 after hydration and axe scanned it translucent; the wrapper
  now has `motion-reduce:opacity-100! motion-reduce:transform-none!` (static from first paint, same markup). Found, not
  fixed: pause/resume swaps Reveal between motion.div and div, which re-mounts its subtree (gallery marquee snaps back).
- 4 Nov pause/resume re-mount fix (closes the note above): Reveal, RevealGroup and SplitText render the same motion element in every mode (no plain-element branch), so the toggle re-mounts nothing; reduced/paused visitors get reveals from a `[data-reveal]` CSS pin in globals.css (opacity 1, no transform/filter/transition, `!important`, for the media query and `:root[data-motion="paused"]`), which `(site)/template.tsx` now shares (paused visitors also lose the page fade). Not MotionConfig: motion reads `reducedMotion` only when an element mounts. Also the ImageCarousel Ken Burns layer eased back over 8s after Pause; its transition is now 0 while paused/reduced. Guard: `tests/e2e/public/motion-pause.spec.ts`. Found by the a11y x5 gate: Header's `[pathname]` effect ran `setOpen(false)` on mount too, cancelling an "Open menu" tap made right after hydration (5 of 30 immediate taps stayed shut on the old code); it now skips the mount run (0 of 40). Still open, pre-existing: `mobile.spec.ts` hamburger test measures the social links mid-slide (43.99999px, also seen 1 Nov), masked by the config's 1 retry.

## Open inputs still needed (handoff §4)

Q1 final teal/red values · Q2 Roadstore file + license · Q4 confirm dropdown
target · Q5 confirm flip direction · Q6 "Brew" definition · Q7 replacement hero
photo + menu header photos · Q8 SpotOn ordering + reservation links · Q9 hours
conflicts · Q11 specials label · Q12/Q13 scope calls.
