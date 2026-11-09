import type { Metadata } from "next";
import Image from "next/image";
import { CateringForm } from "@/components/catering/CateringForm";
import { EmailLink } from "@/components/site/EmailLink";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { SplitText } from "@/components/motion/SplitText";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { CATERING } from "@/db/seed-data/restaurant";
import { readOrderingSettings } from "@/lib/data/ordering";
import { getRestaurant } from "@/lib/data/restaurant";
import { EXPRESS_PATH } from "@/lib/ordering-menus";
import { getSiteChrome } from "@/lib/site";

export const metadata: Metadata = {
  title: "Catering",
  description: "Delicious and customizable BBQ catering for any special occasion or event in Northside Brookland Park Richmond, VA. We offer full service, delivery, and pick up, or rent our restaurant to host your event!",
  alternates: { canonical: "/catering" },
};

const ICONS: Record<string, React.ReactNode> = {
  Parties: <path d="M4 20l4-12 4 6 4-8 4 14M2 20h20" />,
  Professional: <path d="M3 8h18v12H3zM8 8V5h8v3M3 13h18" />,
  Holiday: <path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6L7.1 18.2l.9-5.5-4-3.9L9.5 8z" />,
  "Full Service": <path d="M3 17h18M5 17a7 7 0 0 1 14 0M12 8V6M10 6h4" />,
};

export default async function CateringPage() {
  const [r, { clock }] = await Promise.all([getRestaurant(), getSiteChrome()]);
  const cateringEmail = r.cateringEmail ?? r.email;
  // CA01 (phase 2): the express ordering button shows only while its switch is on
  const { expressOn } = await readOrderingSettings(clock.date);
  return (
    <>
      <section className="relative isolate flex min-h-[80svh] items-end overflow-hidden bg-charcoal-950 text-cream-50">
        {/* Row 12 (Dan, 9 Nov): one still image slot, his board photo; a later "party-centric" photo swaps this one file */}
        <div className="absolute inset-0 -z-10">
          <Image src="/images/catering-board.jpg" alt="Catering board: sliced brisket and smoked meats, pulled pork, sausage, mac and cheese, greens, slaw, pickles, flour tortillas and sauces on a tray" fill priority sizes="100vw" className="object-cover object-[50%_45%]" />
          <div aria-hidden className="absolute inset-0 z-[2] bg-gradient-to-t from-charcoal-950 via-charcoal-950/55 to-charcoal-950/25" />
        </div>
        <div className="container-site relative z-10 pb-20 pt-40">
          <SplitText as="h1" delay={0.2} lines={[{ text: "Catering &" }, { text: "events.", className: "text-ember-300" }]} className="mt-4 font-display text-[clamp(3rem,8vw,7rem)] font-semibold leading-[0.95] tracking-[-0.02em] display-wonk text-shadow-hero" />
          <p className="mt-6 max-w-xl text-lg text-cream-100/85">{CATERING.quote}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="#inquiry" size="lg" arrow>Plan Your Event</ButtonLink>
            {/* CA01: "Order Express Catering Now" next to Plan Your Event (board arrow sits
                between the two); ember like every order action (NW04 change 3) */}
            {/* The full label is 334px: it wraps to two lines at 320/360 instead of clipping */}
            {expressOn && (
              <ButtonLink href={EXPRESS_PATH} size="lg" arrow wrap>
                Order Express Catering Now
              </ButtonLink>
            )}
            <ButtonLink href="#services" size="lg" variant="dark">See services</ButtonLink>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-20 bg-cream-100 py-24 lg:py-32">
        <div className="container-site">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-teal-600">What we cater</p>
            <h2 className="mt-4 font-display text-[clamp(2.2rem,4.6vw,4rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-charcoal-900 display-sharp">Parties, professional events, holidays. <span className="text-teal-600">Or rent the whole restaurant.</span></h2>
          </Reveal>
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATERING.categories.map((c) => (
              <RevealItem key={c.name} className="group flex h-full flex-col rounded-2xl border border-charcoal-900/8 bg-cream-50 p-6 shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-600/10 text-teal-600">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[c.name]}</svg>
                </span>
                <h3 className="mt-5 font-display text-2xl font-semibold text-charcoal-900 transition-colors group-hover:text-ember-600">{c.name}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-charcoal-700">{c.description}</p>
              </RevealItem>
            ))}
          </RevealGroup>

          <div className="mt-16 grid items-center gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <p className="eyebrow text-teal-600">Cater your way</p>
              <ul className="mt-5 space-y-4">
                {CATERING.serviceTypes.map((s, i) => (
                  <li key={s} className="flex gap-4 border-l-2 border-teal-500/60 pl-4">
                    <span className="font-label text-2xl leading-none text-teal-600">0{i + 1}</span>
                    <span className="text-[16px] text-charcoal-800">{s}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[14px] leading-relaxed text-charcoal-500">{CATERING.note}</p>
            </Reveal>
            <div className="grid grid-cols-2 gap-4 lg:col-span-7">
              <ParallaxImage src="/images/catering-brisket-taco-guac.png" alt="Brisket taco, chips n guac, guacamole" sizes="(min-width:1024px) 30vw, 50vw" className="aspect-[4/5] rounded-2xl shadow-lift" speed={0.16} />
              <ParallaxImage src="/images/bbq-platter-full.jpg" alt="Texas craft barbecue platter with smoked meats and homemade sides" sizes="(min-width:1024px) 30vw, 50vw" className="mt-10 aspect-[4/5] rounded-2xl shadow-lift" speed={0.24} />
            </div>
          </div>
        </div>
      </section>

      <section id="inquiry" className="grain relative scroll-mt-20 overflow-hidden bg-wood-700 py-24 text-cream-50 lg:py-32">
        <div className="container-site relative z-[2] grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="eyebrow text-teal-300">Plan your event</p>
              <h2 className="mt-4 font-display text-[clamp(2.2rem,4.6vw,4rem)] font-semibold leading-[1.02] tracking-[-0.02em] display-sharp">Tell us the occasion, the date, and the headcount.</h2>
              <p className="mt-5 text-[15px] leading-relaxed text-cream-100/75">We&apos;ll reply with a catering menu and a quote. Pick-up, delivery, or full service with setup, line service and cleanup.</p>
              {/* Board CA03: catering inquiries use the bookings address */}
              <div className="mt-8 min-w-0 space-y-2 text-[15px]">
                <a href={`tel:+1${r.phone.replace(/\D/g, "")}`} className="block font-semibold hover:text-ember-300">{r.phone}</a>
                <EmailLink email={cateringEmail} className="block font-semibold hover:text-ember-300" />
              </div>
            </Reveal>
            <Reveal delay={0.15} className="relative mt-10 hidden aspect-[4/3] overflow-hidden rounded-2xl lg:block">
              <Image src="/images/sausage-prep.jpg" alt="Preparing homemade smoked sausage" fill sizes="30vw" className="object-cover" />
            </Reveal>
          </div>
          <Reveal delay={0.1} className="rounded-2xl bg-cream-100 p-6 text-charcoal-900 shadow-lift sm:p-8 lg:col-span-7">
            <CateringForm email={cateringEmail} phone={r.phone} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
