import Link from "next/link";
import type { Hours, RestaurantInfo } from "@/db/schema";
import { Logo } from "./Logo";
import { HoursTable } from "./HoursTable";
import { mapsUrl } from "@/lib/site";

const LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/book", label: "Book a Table" },
  { href: "/catering", label: "Catering" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function Footer({ restaurant: r, hours, phoneHref, todayDow }: { restaurant: RestaurantInfo; hours: Hours[]; phoneHref: string; todayDow: number }) {
  const year = new Date().getFullYear();
  return (
    <footer className="grain relative overflow-hidden bg-charcoal-950 pb-28 pt-16 text-cream-100 lg:pb-12 lg:pt-20">
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-ember-500/10 blur-3xl" />
      <div className="container-site relative z-[2] grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <Logo invert width={170} />
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-cream-100/70">{r.tagline}</p>
          <address className="mt-6 not-italic text-[15px] leading-relaxed text-cream-100/85">
            <a href={mapsUrl(r)} target="_blank" rel="noopener noreferrer" className="hover:text-cream-50">
              {r.addressLine1}
              <br />
              {r.city}, {r.state} {r.zip}
            </a>
            <br />
            <a href={phoneHref} className="mt-2 inline-block hover:text-cream-50">
              {r.phone}
            </a>
            <br />
            <a href={`mailto:${r.email}`} className="hover:text-cream-50">
              {r.email}
            </a>
          </address>
          <div className="mt-6 flex gap-3">
            {r.instagramUrl && (
              <a
                href={r.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-50/15 text-cream-100 transition hover:border-ember-400 hover:text-ember-300"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
            )}
            {r.facebookUrl && (
              <a
                href={r.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-50/15 text-cream-100 transition hover:border-ember-400 hover:text-ember-300"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
                  <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.4H7.4V14h2.8v8h3.3z" />
                </svg>
              </a>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="eyebrow text-ember-300">Explore</h2>
          <ul className="mt-5 space-y-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[15px] text-cream-100/85 transition hover:text-cream-50">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h2 className="eyebrow text-ember-300">Programs</h2>
          <ul className="mt-5 space-y-3">
            {r.giftCardUrl && (
              <li>
                <a href={r.giftCardUrl} target="_blank" rel="noopener noreferrer" className="text-[15px] text-cream-100/85 transition hover:text-cream-50">
                  Gift Cards
                </a>
              </li>
            )}
            {r.giftCardBalanceUrl && (
              <li>
                <a href={r.giftCardBalanceUrl} target="_blank" rel="noopener noreferrer" className="text-[15px] text-cream-100/85 transition hover:text-cream-50">
                  Check Balance
                </a>
              </li>
            )}
            {r.loyaltyUrl && (
              <li>
                <a href={r.loyaltyUrl} target="_blank" rel="noopener noreferrer" className="text-[15px] text-cream-100/85 transition hover:text-cream-50">
                  Loyalty
                </a>
              </li>
            )}
            {r.marketingSignupUrl && (
              <li>
                <a href={r.marketingSignupUrl} target="_blank" rel="noopener noreferrer" className="text-[15px] text-cream-100/85 transition hover:text-cream-50">
                  Email List
                </a>
              </li>
            )}
            {r.instagramUrl && (
              <li>
                <a href={r.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[15px] text-cream-100/85 transition hover:text-cream-50">
                  Instagram
                </a>
              </li>
            )}
            {r.facebookUrl && (
              <li>
                <a href={r.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-[15px] text-cream-100/85 transition hover:text-cream-50">
                  Facebook
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="lg:col-span-4">
          <h2 className="eyebrow text-ember-300">Hours</h2>
          <HoursTable hours={hours} tone="dark" className="mt-4" todayDow={todayDow} />
          <p className="mt-3 text-[13px] text-cream-100/50">BBQ may sell out early. Call ahead or follow Instagram.</p>
        </div>
      </div>
      <div className="container-site relative z-[2] mt-14 flex flex-col gap-3 border-t border-cream-50/10 pt-6 text-[13px] text-cream-100/45 sm:flex-row sm:items-center sm:justify-between">
        <span>
          © {year} {r.name}. {r.neighborhood?.split("(")[0].trim()}, Richmond, VA.
        </span>
        <Link href="/admin" className="hover:text-cream-100/80">
          Staff login
        </Link>
      </div>
    </footer>
  );
}
