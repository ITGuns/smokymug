# Prod reseed steps for Guns (3 Nov 2026)

Why: prod still runs the 23 Sep seed, so none of Dan's board copy, the 2026
menu, or the hours updates are live. The code is already deployed from main;
only the database is behind. Pol pushes code; you run these on your machine.

Run these AFTER Pol confirms the 3 Nov round is pushed and deployed.

## Before you start
1. Back up the prod database (Supabase dashboard backup, or `pg_dump`).
   The reseed replaces content tables; reservations, admin users, calendar
   events, Special Events flyers and its on/off switch are kept.
2. Write down anything you typed into prod admin that you want to keep:
   Settings (catering email, ordering link), booking settings and windows,
   gallery order, reviews. The reseed resets these to the repo values.

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
`db:push` only adds the two new tables from this round (`site_settings`,
`event_kinds`) plus one foreign key. If it lists any DROP or data-loss
statement, stop and send Pol the output. The site already runs safely before
this step: until the tables exist, settings read as "not set".

## After the reseed: refresh the live site's cache
The site caches content and the menu separately. In prod admin:
1. Settings: change nothing, press Save (refreshes copy, hours, events).
2. Menu: open any item, press Save (refreshes the menu).
Or use Vercel: Project Settings, Data Cache, Purge.

## Check
Home hero subhead reads "Craft Tex Mex & Barbecue Restaurant." on one line and
"Coffee, cocktail, and pastry programs included." on the next; the intro starts
"A morning to night Tex-Mex experience"; service windows list Taco Tuesdays;
the menu has a Tex Mex tab.

## Expected until Dan sends links (not bugs)
- /book shows a "Call us to book" card. Paste Dan's SpotOn Reserve link in
  Admin, Settings, Reservations (SpotOn) and it becomes the SpotOn box.
- Menu items show no Order Now until the SpotOn ordering link is entered in
  Admin, Settings, Online ordering URL (SpotOn). Header and hero Order Now
  already go to the menu page.
- Catering inquiry copies (Admin, Settings) save addresses but send nothing
  until you add `RESEND_API_KEY` and `INQUIRY_FROM_EMAIL` (a verified Resend
  sender) to the Vercel environment and redeploy.
- The calendar and Specials pages stay empty or hidden until events and flyers
  are entered in Admin.
