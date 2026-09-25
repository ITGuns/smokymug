import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { Magnetic } from "@/components/motion/Magnetic";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/* Captions are the restaurant's own photo captions from the source site. */
const PHOTOS = [
  { src: "/images/brisket-smoker.jpg", alt: "Texas Craft BBQ Smoked Brisket, Slow Cooked in Wood-fire Smoker", caption: "Brisket, slow cooked in the wood-fire smoker", span: "md:col-span-7", aspect: "aspect-[4/3] md:aspect-[16/10]" },
  { src: "/images/spare-ribs-rack.jpg", alt: "Smoked Full Rack Pork Spare Ribs, Slow Cooked", caption: "Full rack pork spare ribs", span: "md:col-span-5", aspect: "aspect-[4/3] md:aspect-auto md:self-stretch" },
  { src: "/images/brisket-taco.jpg", alt: "Tex Mex Brisket Taco on Fresh Homemade Tortilla", caption: "Brisket taco on a homemade tortilla", span: "md:col-span-4", aspect: "aspect-[4/3]" },
  { src: "/images/beef-ribs.jpg", alt: "Texas Craft BBQ Smoked Beef Ribs, Slow Cooked", caption: "Smoked beef ribs", span: "md:col-span-4", aspect: "aspect-[4/3]" },
  { src: "/images/latte-art-2.jpg", alt: "Cafe Latte Art on Specialty Latte", caption: "Latte art on a specialty latte", span: "md:col-span-4", aspect: "aspect-[4/3]" },
];

export function FoodStory({ bbqSummary }: { bbqSummary: string | null }) {
  return (
    <section className="grain relative overflow-hidden bg-charcoal-950 py-24 text-cream-50 lg:py-32">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-ember-400/40 to-transparent" />
      <div className="container-site relative z-[2]">
        <div className="grid items-end gap-8 lg:grid-cols-12">
          <SplitText
            as="h2"
            animate={false}
            stagger={0.04}
            lines={[{ text: "Best authentic wood-fired" }, { text: "smokehouse in Richmond.", className: "text-ember-300" }]}
            className="font-display text-[clamp(2.2rem,4.4vw,4rem)] font-semibold leading-[1.02] display-sharp lg:col-span-8"
          />
          <Reveal className="flex flex-col items-start gap-5 lg:col-span-4 lg:items-end lg:text-right">
            {bbqSummary && <p className="max-w-sm text-[15px] leading-relaxed text-cream-100/70">{bbqSummary}</p>}
            <Magnetic className="inline-block">
              <ButtonLink href="/menu" variant="light" arrow>
                See the full menu
              </ButtonLink>
            </Magnetic>
          </Reveal>
        </div>

        <div tabIndex={0} aria-label="Food photos" className="scrollbar-none -mx-5 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 focus-visible:outline-2 focus-visible:outline-ember-400 sm:-mx-8 sm:px-8 md:mx-0 md:grid md:grid-cols-12 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
          {PHOTOS.map((p, i) => (
            <ParallaxImage
              key={p.src}
              src={p.src}
              alt={p.alt}
              sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 80vw"
              className={cn("w-[80vw] shrink-0 snap-start rounded-[24px] md:w-auto", p.span, p.aspect)}
              speed={0.12 + i * 0.04}
              reveal={i % 2 ? "left" : "up"}
            >
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-charcoal-950/70 via-transparent to-transparent" />
              <span className="absolute inset-x-5 bottom-5 text-[13px] font-medium text-cream-50 text-shadow-hero">{p.caption}</span>
            </ParallaxImage>
          ))}
        </div>
        <p className="mt-4 text-[12px] uppercase tracking-[0.16em] text-cream-100/70 md:hidden">Swipe →</p>
      </div>
    </section>
  );
}
