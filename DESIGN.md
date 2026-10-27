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

## 1. Color tokens (PROPOSED, WCAG AA checked in the handoff)

| Token | Hex | Use |
|---|---|---|
| `--color-teal-600` (`--teal`) | `#0B5D5E` | Primary brand: headers, links, section accents |
| `--color-teal-800` (`--teal-deep`) | `#07403F` | Footer, dark panels, hover states |
| `--color-red-600` (`--red`) | `#B3261E` | Accent ONLY: buttons, tags, small highlights |
| `--color-cream-100` | `#F6EEE1` | Page background |
| `--color-charcoal-900` (ink) | `#161311` | Body text on cream |

Rules (handoff 6.1):
- Red is an accent only. Teal carries the page.
- Never red text on teal.
- Replace the old ember/orange accent everywhere on the public site; no leftover
  orange except where Dan chose to keep it.

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
- **L2-D menu**: tabs, featured dish, list. Featured = first item in each tab
  (Q10 default) until Genrou clears an admin pin.
- **Navigation**: desktop L3-A (logo left, inline links, ORDER NOW + Book a Table
  right). Compressed mode (collapse by FIT, not device; test 1024px): hamburger
  left, logo centered, left slide-out drawer (85% width, max 360px, scrim, closes
  on scrim/Esc/link tap, traps focus, locks body scroll). Top bar keeps ONLY the
  phone number in both modes. Header sticky.
- **L4-A buttons** (pill; Book a Table soft square). ORDER NOW is the primary
  header button; Book a Table secondary.
- **L5-A gallery**: masonry, no fixed heights, no gap taller than one row at
  1280px. Admin drag-to-reorder (reorder only; anything more is CHECK).
- **L6-A calendar**: month grid with pop-out. Event-type icons are CHECK — do not
  build without scope sign-off.

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
