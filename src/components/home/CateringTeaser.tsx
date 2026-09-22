import { ImageCarousel } from "@/components/motion/ImageCarousel";
import { Magnetic } from "@/components/motion/Magnetic";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { Reveal } from "@/components/ui/Reveal";
import { Pill } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { CATERING } from "@/db/seed-data/restaurant";

const SERVICES = ["Pick-up", "Delivery", "Full service", "Restaurant rental"];

export function CateringTeaser() {
  return (
    <section className="grain relative overflow-hidden bg-wood-700 py-24 text-cream-50 lg:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_20%,rgb(224_122_58/0.25),transparent_70%)]" />
      <div className="container-site relative z-[2] grid items-center gap-12 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-6">
          <Reveal>
            <h2 className="font-display text-[clamp(2.4rem,4.8vw,4.2rem)] font-semibold leading-[1.02] display-sharp">Catering & events</h2>
            <blockquote className="mt-6 max-w-lg border-l-2 border-ember-400 pl-5 font-display text-xl italic leading-relaxed text-cream-100/85 sm:text-2xl">
              {CATERING.quote}
            </blockquote>
            <ul className="mt-6 flex flex-wrap gap-2">
              {SERVICES.map((s) => (
                <li key={s}>
                  <Pill tone="light" className="h-8 px-3 normal-case tracking-normal text-[13px] font-medium">{s}</Pill>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-3">
            <Magnetic>
              <ButtonLink href="/catering" arrow>
                Plan Your Event
              </ButtonLink>
            </Magnetic>
            <ButtonLink href="/catering#services" variant="dark">
              See services
            </ButtonLink>
          </Reveal>
        </div>
        <div className="order-1 lg:order-2 lg:col-span-6">
          <div className="grid grid-cols-5 gap-4">
            <Reveal className="col-span-3 aspect-[4/5] overflow-hidden rounded-[26px] shadow-lift" amount={0.2}>
              <ImageCarousel
                className="h-full w-full"
                interval={4500}
                sizes="(min-width: 1024px) 30vw, 60vw"
                showCaption
                slides={[
                  { src: "/images/catering-full-service.png", alt: "Full service catering for parties and special events", caption: "Full service catering for parties and special events" },
                  { src: "/images/catering-brisket-taco-guac.png", alt: "Brisket taco, chips n guac, guacamole", caption: "Brisket taco, chips n guac" },
                  { src: "/images/catering-taco-platter.png", alt: "Tex Mex taco platter with homemade tortillas, smoked meats and sides", caption: "Tex Mex taco platter" },
                ]}
                overlay={<div aria-hidden className="absolute inset-0 z-[2] bg-gradient-to-t from-charcoal-950/60 via-transparent to-transparent" />}
              />
            </Reveal>
            <div className="col-span-2 flex flex-col gap-4">
              <ParallaxImage src="/images/catering-taco-platter.png" alt="Tex Mex taco platter with homemade tortillas, smoked meats and sides" sizes="(min-width: 1024px) 20vw, 40vw" className="aspect-[4/5] rounded-[22px] shadow-lift" speed={0.22} />
              <ParallaxImage src="/images/catering-pork-butt.png" alt="Herb smoked pork butt, wood-fired smoked BBQ" sizes="(min-width: 1024px) 20vw, 40vw" className="aspect-[4/5] rounded-[22px] shadow-lift" speed={0.3} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
