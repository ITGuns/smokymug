# Prod database steps for Guns (updated 18 Nov 2026)

Why: prod still runs the 23 Sep seed, so Dan's board copy, the 2026 menu, the
hours updates and his 16 Nov round (Trivia Night, his November and December
events and closures, the SpotOn ordering and reservations links) are not live,
and the new features from the 3-4 Nov rounds need their tables. The code
deploys from main on every push; only the database is behind. Pol pushes code;
you run these on your machine.

Run these AFTER Pol confirms the 16 Nov round is pushed and deployed. The seed
on main must carry it as well as the 9 Nov round (Southwestern spelling, Meat
Market "per 1/2 lb", the breakfast and Cafe drinks windows, Sunday 8 AM); a
reseed from an older main would need a second reseed later, which wipes Dan's
admin entries again. If the reseed already ran from an older main, a plain
`npm run db:seed` from the new main adds the 16 Nov round without wiping
anything (see "The 16 Nov round step"). The site is safe in the meantime:
every new table and column is read defensively, so pages render and new admin
screens show a "needs db:push" note until you run step 1.

18 Nov audit fixes: event types (Admin, Calendar) and the catering packages
(Admin, Catering) moved into two new tables, `event_kind_types` and
`catering_packages`. They need `db:push` too. If the reseed already ran from a
main without them, run `npm run db:push` and then a plain `npm run db:seed`
once they are pushed: that fills the two tables and wipes nothing (see "The
18 Nov step").

Do the reseed ONCE, now, before Dan starts entering content in admin. After
that, never reseed prod again without exporting what he typed (see "What the
reseed replaces").

## Before you start
1. Back up the prod database (Supabase dashboard backup, or `pg_dump`).
2. Write down anything typed into prod admin since 23 Sep that you want to
   keep from the list under "What the reseed replaces" (Settings like the
   catering email or gift card links, booking settings and windows, gallery
   photos and their order, menu edits). Re-enter it after the reseed. The
   SpotOn ordering link is in the seed now, so it needs no re-entry.

## Two traps in your .env.local
- `drizzle-kit` uses `DIRECT_URL` first and only falls back to
  `DATABASE_URL`. BOTH must be the prod Supabase strings, or `db:push`
  silently runs against whatever `DIRECT_URL` points at.
- The seed creates an admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` only when no
  admin exists. Prod already has one, so it skips; just do not point the seed
  at an empty database with a throwaway password set.

## Steps
```bash
git pull
npm run db:push
npm run db:reseed
```
`db:push` comes first: the seed writes to `site_settings`, `events` and
`date_overrides`, and stops with an error if those tables are missing. It
also fills `event_kind_types` and `catering_packages`; if those two are
missing it only warns and skips them, so run `db:push` and `db:seed` again.

### What `db:push` should show (all additive)
- New tables: `site_settings`, `event_kinds` (3 Nov round, if not pushed yet),
  `menu_item_schedules`, `ordering_settings`, `order_items`, `order_requests`,
  `order_request_lines` (4 Nov round), with their foreign keys and checks.
- New columns on `reviews`: `reviewer_name`, `rating`, `review_date`, `body`,
  `admin_added` (default false).
- Nothing for the 16 Nov round: Trivia Night is a new value in the existing
  `hours.category` text column, which has no enum or check.
- 18 Nov audit fixes: two new tables, `event_kind_types` and
  `catering_packages`, with no foreign keys. If `drizzle-kit` asks whether a
  table is created or renamed from another table, pick "create table". A
  rename would turn an existing table into one of these and lose its data.
- If it lists ANY `DROP`, `ALTER ... TYPE`, renamed column or data-loss
  warning, stop and send Pol the output.

### What the reseed replaces (wiped, then reloaded from the repo)
Menu (categories, sections, items, modifiers) and with it any menu item
Show from / Show until schedules, hours (now with the Trivia Night row,
Wednesday 7 to 9 PM), booking settings and windows, restaurant Settings (copy,
catering email, gift card and loyalty links, ordering link: the seed now holds
Dan's SpotOn ordering URL), gallery photos and their order (including photos
uploaded in admin), and the seeded review summaries.

### What the reseed keeps
Reservations, admin users, calendar events and the type picked on each,
the event types list (Admin, Calendar, Event types), the catering packages
(Admin, Catering), Special Events flyers and switch, reviews typed in admin,
the SpotOn reservations link and catering CC list (site settings), all
ordering data (Express Catering and Holiday Preorder items, requests,
switches), catering inquiries, uploads, date overrides.

The reseed wipes exactly these tables: `menu_item_modifier_groups`,
`menu_items`, `menu_sections`, `menu_categories`, `modifiers`,
`modifier_groups`, `hours`, `booking_windows`, `gallery_images`,
`restaurant_info`, `booking_settings`, and the seeded rows of `reviews`.
Every other table is left alone.

### The 16 Nov round step (runs once, adds only)
`db:reseed` and a plain `db:seed` both end with it. On its first run it adds:
- 12 calendar events in Dan's words: Trivia on Nov 18, Nov 25, Dec 2, Dec 9,
  Dec 16 and Dec 23, 7 to 9 PM; Closed Thanksgiving, Nov 26; Community Art
  Circle, Nov 29, 5 to 8 PM; Brookland Park Blvd "Walk the Block", Dec 18;
  Early closure at 12pm, Dec 24; Closed, Dec 25 and Dec 26.
- 4 date overrides (Admin, Hours): closed Nov 26, Dec 25 and Dec 26; Dec 24
  open 7 AM to 12 PM. Dan gave the closing time only, so Dec 24 keeps the usual
  Thursday 7 AM opening; change it in Admin, Hours if he says otherwise.
- The Trivia Night hours row, if there is none.
- The SpotOn reservations link (site settings) and the SpotOn ordering link
  (restaurant settings), each only where the field is empty.

It skips the whole step if any of those events (same date and title) is
already there, so a later seed never brings back an event, closure, hours row
or link Dan deleted, and it never overwrites what he typed. A date that
already has an override typed in admin keeps it. Expected output:
- First run, after a reseed: `16 Nov round: 12 events added, 4 of 4 closures
  added, trivia hours kept, empty links filled.` ("kept" because the reseed
  has just loaded the hours, Trivia Night included.)
- First run, plain `db:seed`: the same line with `trivia hours added`.
- Any later run: `16 Nov round: already seeded once. Events, closures, hours
  and links left as Admin has them.`

### The 18 Nov step (event types and catering packages, adds only)
`db:reseed` and a plain `db:seed` both end with it. It fills each of the two
tables only while that table is empty, and never wipes them:
- Event types: Live music, Specials, Pop-up, Community, in that order (the
  four the calendar already shows).
- Catering packages: Parties, Professional, Holiday, Full Service, with the
  same descriptions /catering shows today, no price lines or included lists.

Expected output:
- First run: `Event types: 4 added. Catering packages: 4 added.`
- Any later run: `Event types: kept as Admin has them. Catering packages: kept
  as Admin has them.`
- Tables not pushed yet: `Event types and catering packages skipped: their
  tables are missing.` Run `npm run db:push`, then `npm run db:seed`.

If Dan ever removes every catering package (or every event type), the next
seed puts the starting four back. To take all the catering cards off the site
for good, hide them in Admin, Catering instead of removing them.

## After the reseed: refresh the live site's cache
The site caches content and the menu separately. In prod admin:
1. Settings: change nothing, press Save (refreshes copy, hours, events,
   event types and catering packages). Do this even if the pages already look
   right: the cached menu tree keeps serving the old names until a save or a
   purge.
2. Menu: open any item, press Save (refreshes the menu).
Or in Vercel: Project Settings, Data Cache, Purge.

## Check
- Home hero subhead: "Craft Tex Mex & Barbecue Restaurant." on one line,
  "Coffee, cocktail, and pastry programs included." on the next.
- Home intro starts "A morning to night Tex-Mex experience".
- 9 Nov round: Sunday opens 8 AM; breakfast Monday til 12 PM, Tuesday to
  Sunday til 11:30 AM; Cafe drinks every day til 7 PM or close if earlier; the menu says "Southwestern" (one word) and "per 1/2 lb" under
  Meat Market; item descriptions use commas and "&", no "+" separators.
- 16 Nov round:
  - Home intro heading on three lines: "All Day", "Craft Tex Mex & BBQ" in
    ember, "Kitchen" (on narrow phones the middle line wraps after "Craft").
  - Service windows in two columns: Breakfast, Tex Mex, Craft BBQ, Brunch,
    Cafe drinks on the left; Happy Hour, Taco Tuesdays, Trivia Night
    (Wednesday 7 to 9 PM) on the right. Admin, Hours lists Trivia Night.
  - The Taco Tuesdays line reads "Happy Hour Tacos All Day. No Craft BBQ
    Menu" (Dan's words). The reseed loads it; no admin step.
  - Header, mobile menu and hero Order Now open the SpotOn ordering page in a
    new tab; menu items show Order Now too.
  - /book shows the SpotOn reservations box.
  - /calendar shows Dan's November and December events; Admin, Hours lists
    the four date overrides.
  - /holiday lands on /catering (a code redirect, no database part).
  - The gift card button reads "Buy online".
- Nav shows Menus and Calendar (no Gallery); /menus shows the three tiles.
- Admin shows Reviews, Orders, Gallery with "+ Add photo", and Menu items have
  a Schedule section; none of them shows a "needs db:push" note.
- 18 Nov audit fixes:
  - /catering shows the same four cards as before, in Dan's words.
  - Admin, Catering lists the four packages with Edit, Remove and the order
    arrows.
  - Admin, Calendar ends with an Event types card listing Live music,
    Specials, Pop-up and Community, and the Type field on an event offers the
    same four. Neither shows a "needs db:push" note.

## Expected until Dan sends links or content (not bugs)
- Gift card and loyalty buttons still go to the old Toast links. When Dan
  sends the SpotOn ones, paste them in Admin, Settings, Links AFTER the
  reseed (the reseed reloads those fields from the seed), or tell Pol so they
  go into the seed first.
- Express Catering and Holiday Preorders stay switched off (Admin, Menu,
  "Express + Holiday") until Dan's packs and holiday items are entered; until then the
  Express tile links to the catering inquiry and the holiday tile is not a link.
- Catering inquiry copies and order request emails send nothing until you add
  `RESEND_API_KEY` and `INQUIRY_FROM_EMAIL` (a verified Resend sender) to the
  Vercel environment and redeploy. Requests are still saved and visible in
  Admin, Orders.
- The Specials page stays off (its switch in Admin, Special Events) until Dan
  has flyers.
