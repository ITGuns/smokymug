import type { Review } from "@/db/schema";
import { Carousel } from "@/components/motion/Carousel";
import { Reveal } from "@/components/ui/Reveal";

export function Reviews({ reviews }: { reviews: Review[] }) {
  return (
    <section className="relative overflow-hidden bg-cream-100 py-24 lg:py-32">
      <div className="container-site">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-ember-600">What guests keep mentioning</p>
          <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] font-medium leading-[1.1] tracking-[-0.015em] text-charcoal-900 display-sharp">
            Guests keep coming back for the brisket, the homemade tortillas, the specialty lattes, and the hatch chile mac n cheese.
          </h2>
          <p className="mt-4 text-[14px] text-charcoal-500">Themes from reviews on Yelp and Google featured on our site.</p>
        </Reveal>
        <Reveal delay={0.1} className="mt-14" amount={0.15}>
          <Carousel autoplay={5000} ariaLabel="Guest review themes" slideClassName="w-[88%] sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
            {reviews.map((r) => (
              <article key={r.id} className="flex h-full flex-col rounded-[22px] border border-charcoal-900/8 bg-cream-50 p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-charcoal-900 font-label text-[15px] tracking-[0.1em] text-cream-50">
                    {r.reviewerInitials}
                  </span>
                  <span className="eyebrow text-charcoal-500">{r.platform}</span>
                </div>
                <div className="mt-5 flex items-center gap-0.5 text-gold-500" role="img" aria-label="Very positive review, five stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
                      <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L10 14.9l-5.3 2.8 1.1-5.9L1.5 7.7l5.9-.8L10 1.5z" />
                    </svg>
                  ))}
                </div>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {r.themes.map((t) => (
                    <li key={t} className="rounded-full bg-charcoal-900/5 px-2.5 py-1 text-[13px] font-medium text-charcoal-700">
                      {t}
                    </li>
                  ))}
                </ul>
                {r.sentiment && <p className="mt-auto pt-5 text-[13px] italic text-charcoal-500">{r.sentiment}</p>}
              </article>
            ))}
          </Carousel>
        </Reveal>
      </div>
    </section>
  );
}
