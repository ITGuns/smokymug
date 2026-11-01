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

## 1. Color tokens (PROPOSED; brick-orange revert ordered by Guns, 1 Nov 2026)

Guns's call, 1 Nov 2026 chat: "the teal was too much, teal should be accents
only, back to the brick orange." This SUPERSEDES the Rev 1 teal-carries-the-page
scheme below the table. Q1 (Dan's own palette pick) is still open; the board's
COLOR CHOICE box was left empty.

| Token | Hex | Use |
|---|---|---|
| `--color-ember-600` (brick orange) | `#A54F1F` | Primary accent: buttons, links, tags, eyebrows on cream |
| `--color-ember-300/400/500` | `#F0A06A` `#E07A3A` `#C8642A` | Hovers, eyebrows on dark, highlights, focus ring (500) |
| `--color-charcoal-950/900` | `#0F0D0B` `#161311` | Header, footer, dark sections, panels; ink on cream |
| `--color-wood-700` | `#52321C` | Warm dark sections (catering teaser + inquiry) |
| `--color-cream-100` | `#F6EEE1` | Page background |
| `--color-teal-300/600` | `#8FC0BC` `#0B5D5E` | ACCENT ONLY: hero "Brewed slow." line, footer eyebrows, text selection |
| `--color-red-*` | `#B3261E` scale | Admin/error contexts only, no longer a site brand accent |

Rules (1 Nov):
- Ember carries the accents, charcoal carries the dark surfaces, cream the page.
- Teal appears ONLY in the three listed spots. Adding teal anywhere else needs
  Guns's say-so.
- Gold/sage/brick keep their semantic jobs (stars/info tags, open/dietary,
  closed/error).

## 2. Typography (handoff 6.2)

- Headings: Roadstore **when licensed** (Q2); until then the current Fraunces stack.
  Keep a fallback stack; layout must not shift if the font fails to load.
- Bigger headings, optimized for mobile:
  - H1 `clamp(2.25rem, 6vw, 4rem)`
  - H2 `clamp(1.75rem, 4.5vw, 2.75rem)`
  - Body ≥ `1.0625rem` on mobile (min 17px), line length 45–75ch. Test at 390px.
- No dropped letters: `overflow-wrap: anywhere` on email/URL strings only, and
  `min-width: 0` on their flex/grid containers. Emails never break as "gmail.co / m".

## 3. Shape, spacing, photos, buttons (handoff 6.3)

- Corners: 16px radius on cards, panels, images.
- Buttons: L4-A pill. Exception: **Book a Table is a soft square** (10–12px radius).
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
- **Navigation**: desktop L3-A (logo left, inline links, ORDER NOW + Book a Table
  right). Compressed mode (collapse by FIT, not device; test 1024px): hamburger
  left, logo centered, left slide-out drawer (85% width, max 360px, scrim, closes
  on scrim/Esc/link tap, traps focus, locks body scroll). Top bar keeps ONLY the
  phone number in both modes. Header sticky.
- **L4-A buttons** (pill; Book a Table soft square). ORDER NOW is the primary
  header button; Book a Table secondary.
- **L5-A gallery**: masonry, no fixed heights, no gap taller than one row at
  1280px. Admin drag-to-reorder (reorder only; anything more is CHECK).
- **L6-A calendar** (built 1 Nov, NW01, base scope): /calendar month grid with
  hover highlight + pop-out covering the grid (X exits), "List by date" panel
  whose rows drop open; phone stack = list on top, calendar below. Admin CRUD
  at /admin/calendar. Event-type icons + legend are CHECK — do not build
  without scope sign-off.
- **Special Events (NW02, base scope, built 1 Nov)**: /special-events 404s
  while the admin switch is off; title/subtitle and the flyer grid are edited
  at /admin/special-events. The D2 top-bar specials link is CHECK — not built.

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

## 6. Cross-cutting acceptance (handoff §8–9)

- Test at 320, 390, 768, 1024, 1280px. No horizontal scroll, no clipped text.
- Contrast 4.5:1, visible focus, keyboard nav for the nav + Explore Menu dropdown,
  alt text on photos.
- WebP images, lazy-load below the fold.
- Every new setting editable in the admin panel; no dev needed for routine edits.
- Change log: record each change under its handoff ID (A1–E1).

## Out of scope — do not build

SpotOn/Toast API work, on-site ordering, whole-site redesign, and every CHECK item
(B6 calendar icons, C9 reviews freshness, C13 dual paper trail, C14 SpotOn
reservations box, D1 scheduled menu items, D2 specials top-bar link) until Genrou
signs off in writing. C12 "Brew" is a hold (Q6).
