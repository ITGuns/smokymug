import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/ui/Reveal";
import { Pill } from "@/components/ui/Badge";

export function Intro({ blurb, cafeSummary, bbqSummary, features }: { blurb: string; cafeSummary: string | null; bbqSummary: string | null; features: string[] }) {
  return (
    <section id="story" className="relative scroll-mt-20 overflow-hidden bg-cream-100 py-24 lg:py-36">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-ember-400/10 blur-3xl" />
      <div className="container-site grid items-center gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <SplitText
            as="h2"
            animate={false}
            stagger={0.06}
            lines={[{ text: "Cafe &" }, { text: "Craft Barbecue &" }, { text: "Tex-Mex Kitchen", className: "text-wood-600" }]}
            className="font-display text-[clamp(2.4rem,4.6vw,4.2rem)] font-semibold leading-[1.02] text-charcoal-900 display-sharp"
          />
          <Reveal delay={0.1}>
            <p className="mt-7 max-w-md text-[17px] leading-relaxed text-charcoal-700">{blurb}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <dl className="mt-8 grid gap-5 border-t border-charcoal-900/10 pt-7 sm:grid-cols-2">
              <div>
                <dt className="font-label text-[13px] tracking-[0.2em] text-ember-600">The cafe</dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-charcoal-800">{cafeSummary}</dd>
              </div>
              <div>
                <dt className="font-label text-[13px] tracking-[0.2em] text-ember-600">The pit</dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-charcoal-800">{bbqSummary}</dd>
              </div>
            </dl>
          </Reveal>
          <Reveal delay={0.2}>
            <ul className="mt-7 flex flex-wrap gap-2">
              {features.slice(0, 7).map((h) => (
                <li key={h}>
                  <Pill tone="neutral" className="h-8 px-3 normal-case tracking-normal text-[13px] font-medium">
                    {h}
                  </Pill>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Photo collage */}
        <div className="relative mx-auto w-full max-w-[560px] py-10 lg:col-span-7 lg:max-w-none lg:pl-8">
          <ParallaxImage
            src="/images/pitmaster-ryan.jpg"
            alt="Pitmaster Ryan with BBQ smoked meats at the wood-fired smoker"
            sizes="(min-width: 1024px) 520px, 90vw"
            className="ml-auto aspect-[4/5] w-[86%] max-w-[520px] rounded-[28px] shadow-lift"
            speed={0.16}
          >
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-charcoal-950/65 via-transparent to-transparent" />
            <span className="absolute inset-x-6 bottom-6 font-label text-[14px] tracking-[0.2em] text-cream-50">Pitmaster Ryan</span>
          </ParallaxImage>
          <ParallaxImage
            src="/images/brisket-sliced.jpg"
            alt="Texas craft BBQ smoked brisket, sliced"
            sizes="(min-width: 1024px) 260px, 40vw"
            className="absolute bottom-0 left-0 aspect-square w-[44%] max-w-[260px] rounded-[22px] shadow-lift ring-[10px] ring-cream-100"
            speed={0.3}
            reveal="left"
          />
          <ParallaxImage
            src="/images/sausage-hatch-fontina.jpg"
            alt="Homemade smoked BBQ sausage with hatch green chile and fontina"
            sizes="(min-width: 1024px) 190px, 30vw"
            className="absolute right-0 top-0 aspect-[3/4] w-[30%] max-w-[190px] rounded-[20px] shadow-lift ring-[10px] ring-cream-100 lg:-right-4"
            speed={0.36}
          />
        </div>
      </div>
    </section>
  );
}
