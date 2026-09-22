import type { Hours, RestaurantInfo } from "@/db/schema";
import { HoursTable } from "@/components/site/HoursTable";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { mapsEmbedUrl, mapsUrl } from "@/lib/site";

export function Visit({ restaurant: r, hours, phoneHref, todayDow, compact = false }: { restaurant: RestaurantInfo; hours: Hours[]; phoneHref: string; todayDow: number; compact?: boolean }) {
  return (
    <section id="visit" className="relative scroll-mt-20 bg-cream-50 py-24 lg:py-32">
      <div className="container-site grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <h2 className="font-display text-[clamp(2.2rem,4.4vw,3.8rem)] font-semibold leading-[1.02] text-charcoal-900 display-sharp">
              Visit us in Brookland Park.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-charcoal-700">
              In the historic Brookland Park Boulevard business corridor, Northside Richmond. Covered porch is dog-friendly.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 space-y-6">
            <div>
              <p className="eyebrow text-charcoal-500">Address</p>
              <a href={mapsUrl(r)} target="_blank" rel="noopener noreferrer" className="mt-1 block font-display text-2xl font-medium text-charcoal-900 hover:text-ember-600">
                {r.addressLine1}
                <br />
                {r.city}, {r.state} {r.zip}
              </a>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="eyebrow text-charcoal-500">Phone</p>
                <a href={phoneHref} className="mt-1 block text-lg font-semibold text-charcoal-900 hover:text-ember-600">
                  {r.phone}
                </a>
              </div>
              <div>
                <p className="eyebrow text-charcoal-500">Email</p>
                <a href={`mailto:${r.email}`} className="mt-1 block break-all text-lg font-semibold text-charcoal-900 hover:text-ember-600">
                  {r.email}
                </a>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <ButtonLink href={mapsUrl(r)} variant="secondary" arrow>
                Get Directions
              </ButtonLink>
              <ButtonLink href={phoneHref} variant="outline" className="text-charcoal-900">
                Call
              </ButtonLink>
              <ButtonLink href={`mailto:${r.email}`} variant="outline" className="text-charcoal-900">
                Email
              </ButtonLink>
            </div>
            <div className="flex gap-4 pt-2 text-[14px] font-semibold text-charcoal-700">
              {r.instagramUrl && (
                <a href={r.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ember-600">
                  Instagram ↗
                </a>
              )}
              {r.facebookUrl && (
                <a href={r.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ember-600">
                  Facebook ↗
                </a>
              )}
            </div>
          </Reveal>
          {!compact && (
            <Reveal delay={0.15} className="mt-10 border-t border-charcoal-900/10 pt-6">
              <p className="eyebrow text-charcoal-500">Hours</p>
              <HoursTable hours={hours} todayDow={todayDow} className="mt-2" />
            </Reveal>
          )}
        </div>
        <Reveal delay={0.1} className="lg:col-span-7" amount={0.2}>
          <div className="relative h-[360px] overflow-hidden rounded-[28px] bg-cream-200 shadow-card sm:h-[460px] lg:h-full lg:min-h-[560px]">
            <iframe
              title={`Map showing ${r.name} at ${r.addressLine1}, ${r.city}`}
              src={mapsEmbedUrl(r)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full border-0 grayscale-[35%] contrast-[1.05]"
              allowFullScreen
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
