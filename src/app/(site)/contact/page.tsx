import type { Metadata } from "next";
import { Visit } from "@/components/home/Visit";
import { ServiceHours } from "@/components/site/HoursTable";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { getSiteChrome } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch for catering, events, or questions. Serving Northside Brookland Park Richmond, VA with genuine tex-mex BBQ smoked meats and artisanally crafted cafe beverages.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const { restaurant, hours, phoneHref, clock, status } = await getSiteChrome();
  return (
    <>
      <section className="grain relative overflow-hidden bg-charcoal-950 pb-12 pt-32 text-cream-50 md:pt-40">
        <div className="container-site relative z-[2]">
          <p className="eyebrow text-ember-300">Contact & visit</p>
          <h1 className="mt-4 font-display text-[clamp(2.8rem,7vw,6rem)] font-semibold leading-[0.95] tracking-[-0.02em] display-wonk">Come say hi.</h1>
          <p className="mt-4 flex items-center gap-2 text-[15px] text-cream-100/70">
            <span className={`inline-block h-2 w-2 rounded-full ${status.isOpen ? "bg-sage-400" : "bg-brick-500"}`} />
            <span className="font-semibold text-cream-50">{status.label}</span> · {status.detail}
          </p>
        </div>
      </section>
      <Visit restaurant={restaurant} hours={hours} phoneHref={phoneHref} todayDow={clock.dayOfWeek} />
      <section className="bg-cream-200/60 py-20 lg:py-28">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow text-ember-600">Service windows</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-charcoal-900">When each kitchen is running.</h2>
            <div className="mt-6"><ServiceHours hours={hours} /></div>
            <p className="mt-6 text-[13px] text-charcoal-500">BBQ may sell out early. Call ahead or check Instagram. Sunday brunch reservations recommended.</p>
          </Reveal>
          <Reveal delay={0.1} className="rounded-[24px] bg-charcoal-900 p-7 text-cream-50 shadow-lift lg:col-span-5">
            <p className="eyebrow text-ember-300">Events & catering</p>
            <h2 className="mt-3 font-display text-3xl font-semibold">Planning something?</h2>
            <p className="mt-3 text-[15px] text-cream-100/75">Parties, professional lunches, holidays, restaurant rental. Send us the occasion and headcount and we&apos;ll send a menu.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/catering#inquiry" arrow>Catering inquiry</ButtonLink>
              <ButtonLink href="/book" variant="dark">Book a table</ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
