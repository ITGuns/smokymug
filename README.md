# The Smoky Mug — website, reservations & menu CMS

Production-grade restaurant site for **The Smoky Mug** (2930 North Avenue, Richmond VA): a public marketing site with a fully structured menu, a real reservation system, and a staff control panel for managing the menu, hours and bookings without touching code.

All restaurant content — menu items, prices, modifiers, hours, links, photography, review themes — is seeded from `smokymug_scrape.md`. Nothing is invented.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React 19, Server Actions), TypeScript |
| Styling | Tailwind CSS v4, Fraunces / Manrope / Bebas Neue via `next/font` |
| Motion | `motion` (Framer Motion 12) — carousels, parallax, split-text, drag-to-reorder |
| Database | Supabase Postgres via Drizzle ORM (`postgres` driver, Supavisor transaction pooler). Admin image uploads are stored in a `bytea` table so deployments need no disk or bucket. |
| Auth | Signed HttpOnly JWT session cookie (`jose`), scrypt password hashes, middleware-protected `/admin`, server-side `requireAdmin()` on every mutation |
| Validation | Zod on every server action; typed field errors returned to forms |

## Quick start

```bash
npm install
cp .env.example .env.local        # Supabase pooler URLs, SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run setup                     # downloads photography → pushes schema → seeds the full menu + admin user
npm run dev                       # http://localhost:3000  ·  admin at /admin
```

`npm run db:reseed` wipes and re-seeds menu/content tables without deleting reservations. `DATABASE_URL` should be the **transaction pooler** (port 6543); `DIRECT_URL` the **session pooler** (port 5432) used by `drizzle-kit push` and the seed. The Supabase direct host is IPv6-only, which Vercel cannot reach, so always use the pooler.

## Deployment

Hosted on Vercel (`vercel.json` pins functions to `bom1`, next to the Supabase `ap-south-1` database). Required env vars on Vercel: `DATABASE_URL`, `SESSION_SECRET`, optionally `NEXT_PUBLIC_SITE_URL` (falls back to `VERCEL_PROJECT_PRODUCTION_URL`). Pushes to `main` on GitHub deploy automatically once the repo is connected to the Vercel project.

## What's inside

**Public** — `/` (hero image carousel, story, signature dishes, hours, reviews, catering, gallery marquee, programs, map) · `/menu` (5 categories / 28 sections / 140 items with search, dietary + "available now" filters, item detail modal with modifiers) · `/book` (5-step wizard → stored reservation → confirmation with calendar links) · `/book/[code]?t=…` (view / cancel) · `/catering` (inquiry form) · `/gallery` (masonry + swipeable lightbox) · `/contact`.

**Admin** (`/admin`, login required) — Dashboard · Reservations (list / calendar / day views, status changes, edit, delete, staff-created bookings) · Menu items (drag-and-drop ordering, item editor with image upload, dietary tags, availability rules, modifier assignment, feature/hide/duplicate/archive/delete) · Categories · Modifiers · Hours (all 8 service windows, weekly reservation windows, blackout dates / special hours) · Settings (booking rules, restaurant info & links, password).

## Availability engine

`src/lib/availability.ts` resolves each menu category against the hours table (`store`, `breakfast`, `bbq`, `brunch`, `happy_hour`, …) and each item's own rule (`always | days | schedule | seasonal`) to produce *Available now* / *Fri & Sat only* / *Seasonal* badges. Categories and items are never hidden from admins; the public menu shows badges instead.

`src/lib/booking.ts` computes reservation slots from the weekly windows + date overrides + booking settings (slot interval, turn time, max bookings / covers per overlapping window, lead time, party limits) and re-checks availability inside the write transaction so two guests can't take the last seat.

## Data caveats carried over from the scrape

The old site's copy and menu images disagree in two places; both are editable under **Admin → Hours** rather than hard-coded:

- Happy Hour: website says Wed–Sat, bar menu image says Wed–Sun. Seeded as Wed–Sat (Sunday store hours end 2:30 PM).
- Breakfast: website says Tue–Sat ’til 11:30, menu image says Mon–Sat, Breakfast Grill Wed–Sat. Seeded per the hours table with notes preserved.

Reservation windows/rules were **not** in the scrape (the old site only linked to TablesReady for brunch); defaults are derived from store hours and fully editable.

## Environment

See `.env.example`. Uploaded menu images are stored in the `uploads` table and served from `/uploads/*` with long-lived cache headers.
