# Client review, 3 Nov 2026: compliance matrix

Sources: the screenshots Pol sent on 2-3 Nov 2026.
- S1: chat screenshot, 2 Nov 7:13-7:14 PM (live hero with red circles on the header Book a Table and the hero Explore Menu).
- S2: Guns, 2 Nov 9:53 PM ("color lang na brick orange pre").
- S3: Dan's written review, relayed by Guns 3 Nov 9:02 AM ("comments sa client", "bad review").
- S4: the "NEW PAGES AND FEATURES TO SKETCH" section (NW01-NW04) of the discovery board; S14/S15 are larger copies.
- S5-S8 (addendum): the board's markup legend, the L6 calendar choice, the H01 hero/nav markup, the H02 intro markup.
- S9-S13 + P1 (addendum 2): CA01, CA03, GA03, the footer, BK02, and Pol's direct order "change gallery nav to
  calendar nav on everything footer header side panels".
- The full board is `D:\Downloads\Untitled-2026-10-28-0519.excalidraw` (same canvas as FEEDBACK-discovery-board.md,
  439 text elements).

Pol's rule for this round: be STRICT on every client mark; an item DESIGN.md or the handoff called CHECK is in
scope when the client's own markup asks for it, and that instruction is the sign-off. Palette decided 3 Nov: solid
brick orange stays, no textures, no color changes. Prod gets `db:push` + `db:reseed --force` after this round
ships (steps: GUNS-PROD-RESEED.md).

Live checks: read-only Playwright against https://smokymug.vercel.app on 3 Nov 2026 (evening, PHT). Repo state:
`main` at 7980ee1 plus uncommitted work. Nothing here is committed or deployed, so "live" below means the site as
it stood on 3 Nov.

## 0. Transcription check (against the originals)

The numbered list is accurate. Corrections:
- S1: the message opens "guns gamay nalang jud kaayo" ("Guns, just a little more"), so it is addressed TO Guns;
  the sender's name is not in the crop. The hero in that screenshot still shows the OLD subhead and dark buttons.
- S1-3: the image only asks "Dili ma gamit tung roadhouse na font?" ("Can't we use that roadhouse font?").
  "Buttons generally, or a close relative" is Pol's instruction, not in the image.
- S2: a first line "checking" precedes the two quoted lines (no instruction content).
- S4 / NW03: the Express Catering tile reads "Breakfast burrito packs. Sandwich Packs. Taco Bars" (periods).
- S4 / NW03: the menu-page thumbnail at the top carries a blue handwritten "Brew." after the heading (MB01 mark).
- S4 / NW04: the sketch draws five ORDER NOW chips, all bottom left, with arrows moving the tag/OPTIONS row up.
- S5: the "H01 CHANGES" box (make the headline bigger, move See menu, remove Gallery) is the board's printed
  example, not a client instruction. Pol's P1 is what removes Gallery from the nav.
- S7: the circle around the old hero's [Book a Table] [Explore Menu] pair carries one label, "Should be dropdown
  routing to the 3 separate ordering menus".
- S12: "CALENDAR" is written over "Gallery" in the footer Explore column (read with P1: replace, not add).

## 1. What matters most (ranked by cost of getting it wrong)

1. **Prod data is still the 23 Sep seed.** Live hero subhead, intro, footer copy, service windows, catering email
   and the whole menu match the original seed (menu: 127 of 127 item names and first prices identical to commit
   59313a6). This is the main cause of "changes ignored" (S3-1, S3-2) and "incomplete menu" (S3-5). Pol decided
   the reseed; section 4 stays as the record and the after-reseed check list.
2. **New settings must not break prod before Guns runs db:push.** `site_settings` (SpotOn link, wizard switch,
   inquiry copies) and `event_kinds` are new small tables, read defensively. Verified with both tables missing:
   every page renders, /book shows the phone card, admin shows a db:push note, an event saves without its type.
3. **/book is now the SpotOn box (BK02).** The custom wizard is hidden by default (also after a reseed) and its
   server actions refuse while hidden. Until Dan sends the SpotOn reservations link, /book is a "Call us to book"
   card.
4. **Order Now routing is a reading of NW03-2** (header/hero Order Now go to /menu, menu items go to SpotOn). The
   alternative reading is in section 5 for Pol.
5. **Uncommitted work is not on prod** until Guns or Pol commits and deploys.

## 2. Matrix

Status key: DONE, PARTIAL, MISSING, PHASE-2, NEEDS-CLIENT-INPUT, NEEDS-POL-DECISION. "(unc.)" = built in the
working tree, not yet deployed. Items with two halves are split into a/b rows.

### 2a. Chat and review (S1-S3)

| ID | Instruction (short) | Status | Repo evidence | Live prod, 3 Nov | Note / next step |
|---|---|---|---|---|---|
| S1-1 | Circled Book a Table + Explore Menu go brick orange | DONE | `src/components/site/Header.tsx:247` (primary), `src/components/site/MenuDropdown.tsx` trigger (bg-ember-600) | Both computed `rgb(165,79,31)` (#A54F1F), Rye | |
| S1-2 | More teal accents | DONE | DESIGN.md §1; `src/components/home/Hero.tsx` "Brewed slow." teal-300; eyebrows teal | Hero line and footer eyebrows teal | |
| S1-3 | Roadstore look on the circled buttons and buttons generally, or a close relative | DONE (stand-in) | `src/app/globals.css:77` (Rye); `src/components/ui/Button.tsx:23-30`; `src/components/home/Signature.tsx:39`, `src/components/home/Visit.tsx:45,48` (unc.) | Header, hero, catering CTAs in Rye | Real Roadstore: Dan's file + license (Q2) |
| S2-1 | Brick orange is the colour only, no texture | DONE | 7980ee1; DESIGN.md §3 | `background-image: none` on every CTA | |
| S3-1 | "Absent most of the changes discussed in my onboarding call" | PARTIAL | Board + verbal items in the repo | Prod content = 23 Sep seed | Handoff §11 verbal list: teal + red accents (Pol kept brick orange, S3-4b); Roadstore (Rye, Q2); copy sheet (E1, not done); photo per menu header (one placeholder, Q7); specials top-bar link (built, unc.). Reseed fixes the content part |
| S3-2 | Copy changes from the Excalidraw ignored | PARTIAL | All board copy in the repo (section 3) | Code-held copy live; database-held copy not | Fixed by the reseed (section 4) |
| S3-3a | "There's no calendar page as was discussed" | DONE | `src/app/(site)/calendar/page.tsx`; top-bar, drawer and footer link `Header.tsx:19`, `Footer.tsx:14` (unc., P1) | /calendar 200 but footer-only, empty | Now in every nav (P1); event types added (S6-2) |
| S3-3b | Reservation page "won't need built in this same way" | DONE (unc.) | Resolved by BK02 (S13 row) | Native wizard live | See S13 |
| S3-4a | "Why was the button changed to a brick overlay?" | DONE | 7980ee1 | No texture | Build notes answer it |
| S3-4b | "Changes made to style that made the site less good" | DONE (decided) | Pol, 3 Nov: keep solid brick orange, no textures, no color changes | Brick-orange CTAs, teal accents | Dan's onboarding words were "Teal coloring integrated, red accents" (handoff §11); Guns/Pol own the reply |
| S3-5 | Launching with an incorrect/incomplete menu he must fix himself | PARTIAL | 2026 menu in `src/db/seed-data/menu.ts`; 17 printed doubts marked `TODO 2026-menu`; `HoursEditor.tsx:19-21` (unc.) | Pre-2026 menu: 5 tabs, 140 items, no Tex Mex | Reseed loads it; Dan answers yes/no on the doubts only |
| S3-6 | Build notes must say there is more to come | PARTIAL | Draft `BUILD-NOTES-for-Dan.md` | n/a | Guns sends after the reseed |
| S3-6a | Blank event page, loadable with images/flyers | DONE (switched off) | `src/app/(site)/special-events/page.tsx:22`; `SpecialEventsManager.tsx` | 404 (switch off) | Switch on when flyers arrive, or now as a blank page: Guns/Dan |
| S3-6b | Menu breakdown: a) SpotOn ordering, b) catering + holiday pages | PARTIAL | a) SpotOn Order Now on every menu item, hidden until the link is set; b) NW03 phase 2 built 4 Nov (order requests, switches off until Dan's items are in) | No Order Now | a) NEEDS-CLIENT-INPUT (Q8 link); b) DONE (unc.), content NEEDS-CLIENT-INPUT (G1, G2) |

### 2b. New pages sketch (S4, NW01-NW04)

| ID | Instruction (short) | Status | Repo evidence | Live prod, 3 Nov | Note |
|---|---|---|---|---|---|
| NW01 copy | "What's happening?" / "Events and special programming: Do things. Meet people." | DONE | `calendar/page.tsx:32,35` | Live, verbatim | |
| NW01 hover | "(hover highlights date square)" | DONE (unc.) | `src/components/calendar/EventsCalendar.tsx` (hoveredDate) | Not live | Verified: hover and keyboard focus light the square |
| NW01-1 | Stack on mobile: list on top, calendar below | DONE | `EventsCalendar.tsx` (flex-col, lg:order-2) | Live | 390px: list top 436px, grid 569px |
| NW01-2 | List click, drop expands details | DONE | `EventsCalendar.tsx` | Live | Verified |
| NW01-3 | Calendar click pops out details to cover | DONE | `EventsCalendar.tsx` (absolute inset-0) | Live | Verified |
| NW01-4 | X to exit to calendar view | DONE | `EventsCalendar.tsx:67-75` focus fix (unc.) | Live (fix not yet) | Focus returns to the day square |
| NW02 copy | [TITLE] [subtitle] + image uploads | DONE | `special-events/page.tsx` | 404 (off) | Dan's title/subtitle: NEEDS-CLIENT-INPUT |
| NW02-1 | Title and subtitle editable in Admin | DONE | `SpecialEventsManager.tsx`; `src/actions/events.ts` | Admin | e2e special-events.spec.ts |
| NW02-2 | Image boxes added/removed/uploaded | DONE | `SpecialEventsManager.tsx`; uploads in the DB | Admin | |
| NW02 switch | On/off switch | DONE | `special-events/page.tsx:22` | 404 while off | |
| NW02 nav link | Nav link | DONE (unc.) | `Header.tsx:73`, `Footer.tsx:35` | Not live | Specials right after Calendar in top bar, drawer, footer while on (verified) |
| NW03 tiles | "MENUS." page with three photo tiles | DONE (unc., 4 Nov phase 2) | `src/app/(site)/menus/page.tsx`, `src/components/ordering/MenusTiles.tsx` | n/a | Board copy verbatim; holiday tile unlinked while off (verified) |
| NW03-1 | Explore Menu drops into 2-3 options | DONE (unc.) | `src/lib/ordering-menus.ts` (`orderingMenus`); `Hero.tsx:96` | Drop lists the menu tabs | Restaurant (/menu), Express Catering (its page while on, else /catering), Holiday Preorder while on: 2 or 3 options (verified) |
| NW03-2 | Order Now from other pages goes directly to main Restaurant Menu | DONE (unc.), reading flagged | `Header.tsx:256` (desktop), `Header.tsx:379` (drawer), `Hero.tsx:98` | Order Now hidden (URL unset) | Built as /menu; alternative in section 5 |
| NW03-3 | Page lands from header/footer "Menus" only | DONE (unc., 4 Nov phase 2) | `Header.tsx` NAV, `Footer.tsx` LINKS | Top bar "Menu" | Header and footer "Menus" to /menus; Order Now stays /menu (verified) |
| NW03-4 | Not active until phase 2 is built | DONE (unc., 4 Nov phase 2) | `src/app/(site)/menus/[menu]/page.tsx`, `docs/phase2-ordering-spec.md` | n/a | Both ordering pages built as order requests (no payments); each 404s while its admin switch is off |
| NW04 | SpotOn link on every Order button (show where each one sits) | NEEDS-CLIENT-INPUT | Featured dish `FeaturedDish.tsx:90`; every menu row `MenuItemRow.tsx:61` | None visible | Waits on the SpotOn ordering link (Q8). Header/drawer/hero Order Now now go to /menu (NW03-2) |
| NW04-1 | "Bottom of box" options and notations go one spot up | DONE | `MenuItemRow.tsx:42-59` | n/a until link | Verified with a QA URL |
| NW04-2 | Order Now anchored bottom left | DONE | `MenuItemRow.tsx:61-67`; `FeaturedDish.tsx:89-96` | n/a | Verified |
| NW04-3 | Featured action colour consistency | DONE | Primary ButtonLink everywhere | n/a | Verified ember on every Order Now |

### 2c. Board markups (S5-S8)

| ID | Instruction (short) | Status | Repo evidence | Live prod, 3 Nov | Note |
|---|---|---|---|---|---|
| S5 | Legend: circle = this, arrow = move, cross out = remove, green X = choice | DONE | Applied to every row below | n/a | Its H01 CHANGES box is an example |
| S6-1 | L6-A month grid with pop-out (green X) | DONE | `EventsCalendar.tsx` | Live | |
| S6-2 | "3 or 4 small icons that could denote a type of event - Icon design legend" (was CHECK B6) | DONE (unc.) | `src/lib/event-kinds.ts`; icons in squares, list, pop-out, legend `EventsCalendar.tsx:158, 263, 273, 316`; admin Type field `src/components/admin/calendar/EventsManager.tsx:131`; table `event_kinds` (`src/db/schema.ts:398`) | No icons | Types: Live music, Specials, Pop-up, Community (the site's own event words). NEEDS-CLIENT-INPUT: Dan confirms or renames |
| S7-1 | Nav: phone → Book a Table, old button → ORDER NOW; ORDER NOW rightmost | DONE (unc.) | `Header.tsx:253,256`; drawer `Header.tsx:376,379` | [Book a Table] only (Order Now hidden) | Order Now now always shows (NW03-2) |
| S7-2 | Strip phone circled green (keep) | DONE | `Header.tsx` utility strip | Live | |
| S7-3 | Large hero logo crossed out | DONE | `Hero.tsx` (C1) | Live | |
| S7-4 | Subhead → "Craft Tex Mex & Barbecue Restaurant / Coffee, cocktail, and pastry programs included" | PARTIAL | `src/db/seed-data/restaurant.ts:8`; two lines `Hero.tsx` | Old subhead | Reseed |
| S7-5 | Hero buttons: "dropdown routing to the 3 separate ordering menus" | DONE (unc.) | `MenuDropdown.tsx` + `src/lib/ordering-menus.ts`; hero Order Now `Hero.tsx:98` | Drop lists menu tabs | 2 of 3 menus exist today; see NW03-1 |
| S8-1 | Heading → "All-Day Craft, Tex-Mex & Barbecue Kitchen" | DONE | `src/components/home/Intro.tsx:13` | Live | |
| S8-2 | Intro paragraph → Dan's text | PARTIAL | `restaurant.ts:17` | Old paragraph | Reseed |
| S8-3 | The Cafe / The Pit: "Flip positioning" | DONE | `Intro.tsx:19-26` (Pit first) | Live | |
| S8-4 | Sausage photo: "Change with another photo" | DONE (placeholder) | `Intro.tsx:64-67` (latte-art-1) | Live | Real photo from Dan: Q7 |
| S8-5 | Marquee "HAPPY HOUR TUE-SAT" vs service windows "Wed-Sat" | PARTIAL | Marquee `src/app/(site)/page.tsx` Ticker "Happy hour Tue–Sat"; hours seed Tue-Sat (`restaurant.ts:118-123`) | Marquee Tue-Sat, service windows Wed-Sat | Source: the 2026 bar page says Tue-Sat 3-6pm; the old 23 Sep hours on prod say Wed-Sat. Consistent after the reseed. The 2026 BBQ/Tex Mex pages say "daily": question 4 in the build notes |

### 2d. Addendum 2 (P1, S9-S15) and the hard requirement

| ID | Instruction (short) | Status | Repo evidence | Live prod, 3 Nov | Note |
|---|---|---|---|---|---|
| P1 | Gallery → Calendar in header, drawer and footer | DONE (unc.) | `Header.tsx:15-21`; `Footer.tsx:9-16`; e2e `tests/e2e/public/home.spec.ts`, `calendar.spec.ts` | Gallery in nav, Calendar footer-only | Specials after Calendar; /gallery still linked from the home gallery section and the sitemap. Fit at 1024 with Specials + Order Now: 912 of 928px |
| S12 | Footer: "CALENDAR" written over "Gallery" | DONE (unc.) | `Footer.tsx:14` | Calendar + Gallery both listed | Same change as P1 |
| S9 | CA01 "Order Express Catering Now" after phase 2 | DONE (unc., 4 Nov phase 2) | `src/app/(site)/catering/page.tsx` hero | n/a | Between Plan Your Event and See services, ember, only while Express Catering is on (verified) |
| S10 | CA03 "Dual paper trail": admin list of emails copied on inquiries (was CHECK C13) | DONE (unc.); sending NEEDS-INFRA | Admin card `src/components/admin/settings/SiteExtrasForm.tsx`; action `src/actions/site-settings.ts`; send path `src/lib/inquiry-mail.ts`, `src/actions/catering.ts:25-35` | No inquiry email at all (inquiries only saved) | No mail was sent before (confirmed in code). Sends via Resend only once RESEND_API_KEY + INQUIRY_FROM_EMAIL are set; Guns creates the account + verified sender. Nothing invented |
| S11 | GA03 "Format Auto Adjust/Arrange", "Minimize Negative Space" | DONE (unc.) | `src/lib/masonry.ts`; `src/components/gallery/GalleryExplorer.tsx:99,148` | 1280px column bottoms 325px apart | Spread at 1280/1024/768/390: 325/97/73/54px before, 74/16/7/10px after (same 24 seeded photos); no cropping |
| S13 | BK02 "Integrate SpotOn Reservations basically a box with the spotOn reservation interface" (was CHECK C14) | DONE (unc.); link NEEDS-CLIENT-INPUT | `src/components/booking/ReservationsBox.tsx`; `src/app/(site)/book/page.tsx:38-53`; wizard gate `src/actions/booking.ts:49,54,59`; CSP `src/middleware.ts:13`, `src/lib/csp.ts` | Native wizard | Phone card until the link is set; iframe + "Open reservations" link + phone after. Book a Table CTAs still go to /book |
| S15 | Menu heading: add "Brew." | DONE | `src/app/(site)/menu/page.tsx:47` | Live "...Bar. Brew." | Handoff Q6 only asks what "Brew" means as a menu section; it does not argue against the heading |
| HARD | New settings read defensively before prod db:push | DONE | `src/lib/data/site-settings.ts`; `src/lib/data/events.ts` (readEventKinds); `src/lib/db-errors.ts` | n/a | Verified with both tables missing (section 7) |
| Board CHECK asks outside the screenshots | C9 reviews freshness (H06), D1 scheduled menu items (MB03) | DONE (unc., 4 Nov) | C9: `src/actions/reviews.ts`, `src/lib/reviews.ts`; D1: `src/lib/menu-schedule.ts`, `src/components/admin/menu/ItemEditor.tsx` (Schedule section), table `menu_item_schedules` | n/a | Pol ordered every board instruction built (4 Nov). Both need `npm run db:push` on prod before admin can save them; see CHANGELOG-discovery.md, 4 Nov round |

Counts (56 rows): DONE 43 (of which 16 uncommitted, 1 font stand-in, 1 switched off, 1 placeholder photo,
1 decision), PARTIAL 8, MISSING 0, PHASE-2 4, NEEDS-CLIENT-INPUT 1 (NW04 link; other rows also wait on Dan, see
notes), NEEDS-POL-DECISION 0.

## 3. S3-2 copy check: every copy instruction found

Searched: the S4-S15 images, FEEDBACK-discovery-board.md, and the board file itself
(`D:\Downloads\Untitled-2026-10-28-0519.excalidraw`: 19 blue, 13 red and 4 green client text marks, all
accounted for below; the three red notes at the top are the board's own "how to mark up" example). No
.excalidraw file in the repo.

| # | Dan's words (board) | Panel | Where in the repo | Verbatim? | Live 3 Nov |
|---|---|---|---|---|---|
| 1 | "Craft Tex Mex & Barbecue Restaurant / Coffee, cocktail, and pastry programs included" | H01 subhead | `src/db/seed-data/restaurant.ts:8` (DB: Settings, Tagline) | Yes, periods added to split the two lines | NO: "Richmond's Best Texas Craft BBQ + Cafe in Brookland Park!" |
| 2 | "All-Day Craft, Tex-Mex & Barbecue Kitchen" | H02 heading | `src/components/home/Intro.tsx:13` (code) | Yes | YES |
| 3 | "A morning to night Tex-Mex experience including slow smoked brisket, pulled pork, ribs, and more. Accompanied by a full epsresso bar, pastry program, and crafted cocktails" | H02 intro | `restaurant.ts:17` (DB: Settings, Description) | Yes, "espresso" fixed, final period | NO: old "Coffee and elevated cafe fare served every day..." |
| 4 | "Taco Tuesdays Tues 11:30AM - 9PM" | H05 | `restaurant.ts:111` (DB: Hours, Taco Tuesdays) | Yes | NO |
| 5 | "Craft Tex-Mex & Barbecue Restaurant. Kitchen + Cafe + Bar Breakfast + Lunch + Dinner." | H11 footer | `restaurant.ts:11` (DB: Settings, Footer tagline) | Yes, three lines as drawn | NO: footer repeats the old hero line |
| 6 | "Brew." appended to "Breakfast. Barbecue. Brunch. Bar." | MB01 (also S4/S15) | `src/app/(site)/menu/page.tsx:47` (code) | Yes | YES |
| 7 | "Add 'Brew'" | MD01 cafe view | Same H1 (one header for every tab) | Yes | YES |
| 8 | "[want to confirm all menu matches newest menu send - pdf in email]" | MB01 | `src/db/seed-data/menu.ts` (2026 menu) | Yes | NO: pre-2026 menu |
| 9 | "bookings.smokymug@gmail.com" | CA03 | `restaurant.ts:26` (DB: Settings, Catering inquiries email) | Yes | NO: catering page shows thesmokymug@gmail.com |
| 10 | "Eat with your eyes. Then come give your mouth a turn." | GA01 | `src/app/(site)/gallery/page.tsx:25` (code) | Yes | YES |
| 11 | "CALENDAR" over "Gallery" in the footer | BK03 / S12 | `Footer.tsx:14` (Gallery removed, unc.) | Yes | Calendar YES, Gallery still listed |
| 12 | "Replace with Book a Table" / "Replace with ORDER NOW" | H01 nav | `Header.tsx:247-252` (unc.) | Yes | Book a Table YES; ORDER NOW hidden |
| 13 | "Cafe Fare, Wed-Sat 'til 3 PM" crossed out | H05 | `src/components/site/HoursTable.tsx:42` leaves cafe_fare out | n/a | Home/contact YES; /menu Breakfast note still prints "Cafe Fare" (reseed) |
| 14 | "Integrate hours copy in worksheet" | H05 (green) | Copy sheet (E1) not made yet | n/a | NEEDS-CLIENT-INPUT via the copy sheet |
| 15 | "What's happening?" / "Events and special programming: Do things. Meet people." | NW01 | `calendar/page.tsx:32,35` | Yes | YES |
| 16 | NW03 tile copy: "MENUS.", "ALL DAY CRAFT TEX MEX & BBQ", "Breakfast Lunch Dinner Brunch Cafe Bar", "EXPRESS CATERING", "Breakfast burrito packs. Sandwich Packs. Taco Bars", "HOLIDAY PREORDERS" | NW03 | `src/app/(site)/menus/page.tsx` | n/a | DONE (4 Nov phase 2), verbatim |
| 17 | "Order Express Catering Now" | CA01 | `src/app/(site)/catering/page.tsx` | n/a | DONE (4 Nov phase 2), verbatim |
| 18 | "Should be dropdown routing to the 3 separate ordering menus" | H01 hero | `src/lib/ordering-menus.ts` (Restaurant, Express Catering) (unc.) | n/a | 2 of 3 menus exist |

Verdict: nothing from the board was ignored in the repo. Five database-held items (1, 3, 4, 5, 9) and the menu
(8, 13) never reached prod; the reseed loads them.

## 4. Prod vs repo: stale fields (record, and the after-reseed check list)

Pol decided on 3 Nov to run `db:push` + `db:reseed --force` on prod after this round ships. The lists below
are what the reseed changes; after it, every "Type this" value should be on the live site. After the reseed,
/book shows the "Call us to book" card until the SpotOn link is entered in Admin, Settings (the new tables are
neither wiped nor reset by the reseed).

Evidence that prod content is the untouched 23 Sep seed: menu names and first prices match commit 59313a6
127/127; tagline, description, hours and gallery order match the 23 Sep seed. Admin-only values (booking rules,
booking windows) cannot be seen publicly; note them before the reseed.

### A. Admin, Settings, "Restaurant information"

| Field | Live now | After the reseed |
|---|---|---|
| Tagline | Richmond's Best Texas Craft BBQ + Cafe in Brookland Park! | `Craft Tex Mex & Barbecue Restaurant. Coffee, cocktail, and pastry programs included.` |
| Footer tagline (three lines) | empty (footer repeats the tagline) | `Craft Tex-Mex & Barbecue Restaurant.` / `Kitchen + Cafe + Bar` / `Breakfast + Lunch + Dinner.` |
| Description (home intro + SEO) | Cafe & Craft Barbecue & Tex-Mex Kitchen in Northside Richmond, VA. Coffee and elevated cafe fare served every day. Top class brisket, pulled pork, ribs, and more smoked on site and plated through a unique rotating Tex-mex menu. | `All-Day Craft, Tex-Mex & Barbecue Kitchen in Northside Richmond, VA. A morning to night Tex-Mex experience including slow smoked brisket, pulled pork, ribs, and more. Accompanied by a full espresso bar, pastry program, and crafted cocktails.` (the home page hides the first sentence) |
| Catering inquiries email | empty (catering page shows thesmokymug@gmail.com) | `bookings.smokymug@gmail.com` |
| Category (not shown on the site) | Cafe & Craft Barbecue & Tex-Mex Kitchen | `All-Day Craft, Tex-Mex & Barbecue Kitchen` |

### B. Admin, Hours

| Category | Live now | After the reseed |
|---|---|---|
| Breakfast | Mon 'til 12:00, Tue-Sat 'til 11:30 | Mon-Sat 'til 11:30 |
| Craft barbecue | Tue-Sat 11:30-21:00 | Wed-Sat 11:30-21:00 |
| Tex Mex | none | Tue-Sat 11:30-21:00 |
| Taco Tuesdays | none | Tue 11:30-21:00 |
| Happy hour | Wed-Sat 15:00-18:00 | Tue-Sat 15:00-18:00 |
| Cafe fare, Wine Wednesdays | old rows (not shown publicly) | none |

### C. Menu

Live vs the 2026 seed (by item name): 5 tabs vs 6 (Tex Mex missing), 43 seeded items missing on prod, 38 old
items on prod that are not on the 2026 menu, 19 price changes on shared names, a rebuilt section layout and the
modifier groups. Too long to hand-enter; the reseed loads it. Reseed keeps reservations, blackout and
special-hours dates, calendar events and their types, Special Events (switch and flyers), the new site settings,
uploads and admin users; it rewrites the menu, restaurant Settings, hours, booking rules and windows, gallery and
reviews. Then press Save once in Admin, Menu and Admin, Settings (or purge the Vercel data cache).

## 5. Decisions taken in this round, with the evidence

**BK02 reservations box (S13, resolves S3-3b).** The earlier recommendation (links only) is superseded by Pol's
strict-markup order. Built shape: iframe of the admin-set SpotOn link in a 16px card, "Open reservations" link
and phone under it (SpotOn may refuse framing; the link still works), "Call us to book" card while unset. The
wizard is hidden behind a new switch, `site_settings.booking_wizard`, default off. Why a new switch and not the
existing "Online booking enabled": prod and the seed both have that one ON, so using it alone would keep the
wizard public until someone flips it and would turn it back on at every reseed. The existing switch still pauses
the wizard when the new one shows it. Server actions (`fetchSlots`, `fetchBookableDates`, `createReservation`)
refuse while the wizard is hidden, so nothing can book through hidden code. CSP: the SpotOn host is unknown at
build time, so /book alone (middleware) allows https frames; every other page keeps the old policy (checked on
`next start` and in an e2e). Not checked: whether Vercel's edge keeps the middleware header the same way.

**NW03-2 Order Now (S7-1, S7-5).** Reading built: header, drawer and hero Order Now link to /menu and always
show. Evidence: (1) NW03-2 says "go directly to main Restaurant Menu", and NW04 says "SpotOn link" when it means
SpotOn; (2) the NW03 sketch's "All Day" tile, the Restaurant option, "links to this page" with an arrow to the
/menu screenshot; (3) "from other pages" contrasts with the Menus landing page, a page on our site; (4) the NW04
sketch puts SpotOn ORDER NOW chips only on menu items. Alternative reading (Pol's call): header/hero Order Now go
straight to the SpotOn ordering link and hide until it is set, as the 17 Oct handoff C2 ("ORDER NOW goes to the
live SpotOn link") and Q4 ("Order Now stays a SpotOn link") said. Switching is a three-line change (`Header.tsx:250,
373`, `Hero.tsx:98`).

**Explore Menu options (S7-5, NW03-1).** Restaurant → /menu (the NW03 tile's own target). Express Catering →
/catering, the existing catering page, until its ordering page exists (phase 2). Holiday Preorder is left out:
its page and its on/off toggle are both phase 2, and NW03-1 says the drop has 2 options while it is inactive.

**Event types (S6-2).** Dan named none. Live music, Specials, Pop-up and Community are the words the site already
uses (admin: "Add live music nights, specials, pop-ups or community events"; public calendar: "pop-ups and
specials"; Dan's subtitle: "Meet people"). Listed in the build notes for him to confirm or rename.

**Dual paper trail (S10).** Code check first: inquiries were saved to `catering_inquiries` and emailed to nobody.
Built: the admin CC list (up to 10, deduped) and a send path through Resend's HTTP API (no new dependency), off
until RESEND_API_KEY and INQUIRY_FROM_EMAIL exist. NEEDS-INFRA for Guns: create the account, verify a sending
domain, set both env vars on Vercel. If he picks another provider, only `src/lib/inquiry-mail.ts` changes.

**Reseed safety.** `site_settings` and `event_kinds` are not in the reseed's delete list on purpose (admin-owned,
like calendar events): a typed SpotOn link, CC list and event types survive `db:reseed --force`. The reseed only
inserts the default settings row when none exists, so after a fresh reseed /book is the SpotOn box with the
wizard hidden.

## 6. Code changes (both rounds, uncommitted)

First round: `Signature.tsx:39`, `Visit.tsx:45,48` (Rye on page CTAs); `EventsCalendar.tsx:67-75` (focus back
after X); `RestaurantForm.tsx:44` (description label + hint); `HoursEditor.tsx:19-21` (help text).

Board round:
- Nav: `Header.tsx:15-21` (Calendar replaces Gallery), `:73` (Specials after Calendar), `:247-252` (Book a
  Table, then Order Now to /menu), `:369-375` (drawer, same order); `Footer.tsx:9-16`; `src/app/(site)/layout.tsx`
  (no order link to the header).
- Hero: `Hero.tsx:96-102` (ordering-menu drop + Order Now to /menu); `MenuDropdown.tsx` (renders the given
  options only); `src/lib/ordering-menus.ts`; `src/app/(site)/page.tsx` (props).
- Event types: `src/lib/event-kinds.ts`, `src/components/calendar/EventKindIcon.tsx`, `EventsCalendar.tsx`
  (icons, labels, legend), `EventsManager.tsx` (Type field), `src/actions/events.ts` (saveKind),
  `src/lib/data/events.ts` (readEventKinds), both calendar pages.
- Reservations box: `ReservationsBox.tsx`, `book/page.tsx`, `src/actions/booking.ts` (gate),
  `src/middleware.ts` + `src/lib/csp.ts` (/book CSP), `BookingSettingsForm.tsx` (switch description).
- Settings: `src/db/schema.ts` (site_settings, event_kinds), `src/lib/data/site-settings.ts`,
  `src/lib/db-errors.ts`, `src/actions/site-settings.ts`, `SiteExtrasForm.tsx`, admin settings page,
  `src/lib/validation.ts`, `src/db/seed.ts` + `seed-data/restaurant.ts` (default row).
- Mail: `src/lib/inquiry-mail.ts`, `src/actions/catering.ts`.
- Gallery: `src/lib/masonry.ts`, `GalleryExplorer.tsx`.
- `src/app/(site)/template.tsx`: one element on server and client (reduced-motion hydration fix).
- Tests: `tests/unit/board-3nov.test.ts` (15); e2e: `public/reservations-box.spec.ts`,
  `admin/site-settings.spec.ts`, `global.teardown.ts`, `helpers/site-settings.ts`; updated `auth.setup.ts`,
  `home.spec.ts`, `calendar.spec.ts` (both), `misc.spec.ts`, `playwright.config.ts` (teardown project).

## 7. Verification and what is not verified

- Typecheck 0 errors; lint 0 errors (10 old warnings); vitest 81/81 (66 old + 15 new); `git diff --check`
  clean; `next build` passes in a throwaway copy (the running dev server owns `.next`); `next start` on that
  build: /book CSP has `frame-src ... https:`, / keeps the old CSP, one header each.
- `npm audit --audit-level=high`: 1 high, NOT 0 (postcss inside next 15.x, known since 28 Oct; fix is next 16).
- Tables missing (before local `db:push`): all public pages 200; /book phone card, no wizard; admin settings show
  the db:push note with saves disabled; an event saved with a type returns the db:push hint and renders untyped;
  no page errors.
- Local `npm run db:push`: exactly CREATE TABLE event_kinds, CREATE TABLE site_settings, one foreign key.
- Click-through after the push (http://localhost:3107, Pol's running preview, not restarted; every state
  restored): nav labels and order at 1024/1100/1280 with Specials on and Order Now showing (912/928, 912/1004,
  1034/1184px, one line); footer and drawer lists; drawer CTA order; hero drop (Restaurant /menu, Express Catering
  /catering); hero and header Order Now /menu; no SpotOn Order Now on menu rows while unset; /book phone card,
  then a QA SpotOn URL framed with the fallback link, no horizontal scroll at 390px, then cleared; CC list saved,
  reloaded, cleared; four typed QA events showing icons, labels, legend and the pop-out, then removed; gallery
  spread numbers above, filter and lightbox still work.
- Found while verifying, pre-existing: reduced-motion visitors got a hydration error on every page. FIXED in
  the follow-up passes the same night: SplitText, ImageCarousel, Reveal, ParallaxImage and Marquee now render
  the same markup on server and client, the page fade is held visible by CSS for reduced motion, and pause or
  resume no longer re-mounts anything (tests/e2e/public/motion-pause.spec.ts). See the CHANGELOG 3 Nov rows.
- Verified after the follow-ups (GOAT verifier, 4 Nov): full gate green (64 e2e passed, 0 failed, 0 flaky;
  a11y, motion-pause and mobile specs 56/56 over three runs with retries off), npm audit 0 high, and a final
  side-by-side check of every screenshot item on the local site.
- Not verified: Vercel's edge handling of the /book CSP header; whether SpotOn allows framing of Dan's link
  (fallback link covers it); a real inquiry email (no provider key exists).
- Line references in the tables were taken mid-round and drift by a few lines (for example the header Book a
  Table / Order Now pair now sits at `Header.tsx:253,256`, drawer `:376,379`); search the named file for the
  label when a number is off.
