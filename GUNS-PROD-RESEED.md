# Prod database steps for Guns (updated 9 Nov 2026)

Why: prod still runs the 23 Sep seed, so Dan's board copy, the 2026 menu and
the hours updates are not live, and the new features from the 3-4 Nov rounds
need their tables. The code deploys from main on every push; only the database
is behind. Pol pushes code; you run these on your machine.

Run these AFTER Pol confirms the 9 Nov round is pushed and deployed. The seed
on main must carry it (Southwestern spelling, Meat Market "per 1/2 lb", the new
breakfast and Cafe drinks windows, Sunday 8 AM); a reseed from an older main
would need a second reseed later, which wipes Dan's admin entries again. The site is
safe in the meantime: every new table and column is read defensively, so pages
render and new admin screens show a "needs db:push" note until you run step 1.

Do the reseed ONCE, now, before Dan starts entering content in admin. After
that, never reseed prod again without exporting what he typed (see "What the
reseed replaces").

## Before you start
1. Back up the prod database (Supabase dashboard backup, or `pg_dump`).
2. Write down anything typed into prod admin since 23 Sep that you want to
   keep from the list under "What the reseed replaces" (Settings like the
   catering email or ordering link, booking settings and windows, gallery
   photos and their order, menu edits). Re-enter it after the reseed.

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

### What `db:push` should show (all additive)
- New tables: `site_settings`, `event_kinds` (3 Nov round, if not pushed yet),
  `menu_item_schedules`, `ordering_settings`, `order_items`, `order_requests`,
  `order_request_lines` (4 Nov round), with their foreign keys and checks.
- New columns on `reviews`: `reviewer_name`, `rating`, `review_date`, `body`,
  `admin_added` (default false).
- If it lists ANY `DROP`, `ALTER ... TYPE`, renamed column or data-loss
  warning, stop and send Pol the output.

### What the reseed replaces (wiped, then reloaded from the repo)
Menu (categories, sections, items, modifiers) and with it any menu item
Show from / Show until schedules, hours, booking settings and windows,
restaurant Settings (copy, catering email, ordering link), gallery photos and
their order (including photos uploaded in admin), and the seeded review
summaries.

### What the reseed keeps
Reservations, admin users, calendar events and their event types, Special
Events flyers and switch, reviews typed in admin, the SpotOn reservations link
and catering CC list (site settings), all ordering data (Express Catering and
Holiday Preorder items, requests, switches), catering inquiries, uploads, date
overrides.

## After the reseed: refresh the live site's cache
The site caches content and the menu separately. In prod admin:
1. Settings: change nothing, press Save (refreshes copy, hours, events). Do
   this even if the pages already look right: the cached menu tree keeps
   serving the old names until a save or a purge.
2. Menu: open any item, press Save (refreshes the menu).
Or in Vercel: Project Settings, Data Cache, Purge.

## Check
- Home hero subhead: "Craft Tex Mex & Barbecue Restaurant." on one line,
  "Coffee, cocktail, and pastry programs included." on the next.
- Home intro starts "A morning to night Tex-Mex experience".
- Service windows list Taco Tuesdays; the menu has a Tex Mex tab.
- 9 Nov round: Sunday opens 8 AM; breakfast Monday til 12 PM, Tuesday to
  Sunday til 11:30 AM; Cafe drinks every day til 7 PM or close if earlier; the
  Tuesday line reads "Tex Mex all day (Taco Tuesday). No Craft BBQ on
  Tuesdays."; the menu says "Southwestern" (one word) and "per 1/2 lb" under
  Meat Market; item descriptions use commas and "&", no "+" separators.
- Nav shows Menus and Calendar (no Gallery); /menus shows the three tiles.
- Admin shows Reviews, Orders, Gallery with "+ Add photo", and Menu items have
  a Schedule section; none of them shows a "needs db:push" note.

## Expected until Dan sends links or content (not bugs)
- /book shows a "Call us to book" card. Paste Dan's SpotOn Reserve link in
  Admin, Settings, Reservations (SpotOn) and it becomes the SpotOn box.
- Menu items show no Order Now until the SpotOn ordering link is entered in
  Admin, Settings, Online ordering URL (SpotOn). Header and hero Order Now
  already go to the menu page.
- Express Catering and Holiday Preorders stay switched off (Admin, Menu,
  "Express + Holiday") until Dan's packs and holiday items are entered; until then the
  Express tile links to the catering inquiry and the holiday tile is not a link.
- Catering inquiry copies and order request emails send nothing until you add
  `RESEND_API_KEY` and `INQUIRY_FROM_EMAIL` (a verified Resend sender) to the
  Vercel environment and redeploy. Requests are still saved and visible in
  Admin, Orders.
- The calendar and Specials pages stay empty or hidden until events and flyers
  are entered in Admin.
