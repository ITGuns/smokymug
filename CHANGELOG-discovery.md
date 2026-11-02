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
  relative) on all site CTA buttons (`ui/Button` base + the Explore Menu
  trigger). Single 400 weight, Fraunces fallback, one-token swap to Roadstore
  when Dan supplies the file. Headings unchanged (still Fraunces per Q2).

## Open inputs still needed (handoff §4)

Q1 final teal/red values · Q2 Roadstore file + license · Q4 confirm dropdown
target · Q5 confirm flip direction · Q6 "Brew" definition · Q7 replacement hero
photo + menu header photos · Q8 SpotOn ordering + reservation links · Q9 hours
conflicts · Q11 specials label · Q12/Q13 scope calls.
