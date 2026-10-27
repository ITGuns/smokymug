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
| C12 | HELD (Q6) | "Brew" not built. | |
| C13 | HELD (CHECK Q13) | Extra inquiry emails not built. | |
| C14 | HELD (CHECK Q8) | SpotOn reservations box not built; native booking remains as currently shipped. | |
| D1 | HELD (CHECK) | Menu-item scheduling not built. NOTE for scope call: items already support availability rules (`always/days/schedule/seasonal`) — D1 may be a smaller delta than the handoff assumes. | |
| D2 | HELD (CHECK Q11) | Specials top-bar link not built. NOTE: no Special Events toggle/page exists in this codebase at all — flag the dev-spec mismatch to Genrou. | |
| E1 | PENDING | Copy sheet regeneration happens after demo recapture (phase 6-7, separate session). | |

## Repo-vs-handoff baseline mismatches (for Genrou)

The handoff assumes the demo-spec baseline (three menus, Special Events toggle +
404, SpotOn links only, reservations behind a feature flag). This repository is a
fuller build: one structured menu with five categories, a native reservation
system (admin-managed, `bookingsEnabled` pause toggle, no 404), no specials page,
and Toast (not SpotOn) links seeded for gift cards/loyalty. Defaults above were
applied against the repo as it exists; where the two disagree, Genrou decides.

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

## Open inputs still needed (handoff §4)

Q1 final teal/red values · Q2 Roadstore file + license · Q4 confirm dropdown
target · Q5 confirm flip direction · Q6 "Brew" definition · Q7 replacement hero
photo + menu header photos · Q8 SpotOn ordering + reservation links · Q9 hours
conflicts · Q11 specials label · Q12/Q13 scope calls.
