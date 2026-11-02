import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { getSpecialEvents } from "@/lib/data/events";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSpecialEvents();
  return {
    title: settings.title,
    description: settings.subtitle ?? "Specials and events at The Smoky Mug in Brookland Park, Northside Richmond, VA.",
    alternates: { canonical: "/special-events" },
  };
}

/** NW02 (base scope): title and subtitle are edited in Admin, the grid shows
 *  admin-uploaded flyers/menus, and the page 404s while the switch is off
 *  (dev spec). The D2 top-bar specials link is CHECK-gated and not built. */
export default async function SpecialEventsPage() {
  const { settings, images } = await getSpecialEvents();
  if (!settings.enabled) notFound();

  return (
    <>
      <section className="grain relative overflow-hidden bg-charcoal-950 pb-12 pt-32 text-cream-50 md:pt-40">
        <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-ember-500/15 blur-3xl" />
        <div className="container-site relative z-[2]">
          <p className="eyebrow text-teal-300">Specials &amp; events</p>
          <h1 className="mt-4 font-display text-[clamp(2.8rem,7vw,6rem)] font-semibold leading-[0.95] tracking-[-0.02em] display-wonk">
            {settings.title}
          </h1>
          {settings.subtitle && <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-cream-100/75 md:text-base">{settings.subtitle}</p>}
        </div>
      </section>

      <section className="bg-cream-100 py-12 lg:py-16">
        <div className="container-site">
          {images.length === 0 ? (
            <Reveal className="rounded-2xl border border-dashed border-charcoal-900/15 p-10 text-center text-charcoal-500">
              Flyers and menus land here soon. Check back, or follow us on Instagram.
            </Reveal>
          ) : (
            <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((img) => (
                <RevealItem key={img.id}>
                  <figure className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-charcoal-900/8 bg-cream-50 shadow-card">
                    <Image src={img.file} alt={img.alt} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" className="object-contain" />
                  </figure>
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>
      </section>
    </>
  );
}
