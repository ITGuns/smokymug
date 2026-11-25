import type { RestaurantInfo } from "@/db/schema";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { NewTabCue } from "@/components/ui/NewTabCue";
import { ButtonLink } from "@/components/ui/Button";
import { programsHeading } from "@/lib/programs";

export function Programs({ restaurant: r }: { restaurant: RestaurantInfo }) {
  const cards = [
    { href: r.giftCardUrl, title: "Buy a Gift Card", body: "e-Gift cards for client appreciation, Airbnb welcomes, birthdays and holidays.", cta: "Buy online" },
    { href: r.giftCardBalanceUrl, title: "Check Gift Card Balance", body: "Look up the remaining value on a Smoky Mug gift card.", cta: "Check balance" },
    // 24 Nov: loyalty moved to SpotOn (Dan's link); the body is that sign-up page's own line. The old "$2 credit" was the previous program's offer.
    { href: r.loyaltyUrl, title: "Join Loyalty", body: "Earn 1 spot for every dollar spent when you join our loyalty program.", cta: "Activate rewards" },
    { href: r.marketingSignupUrl, title: "Join the Email List", body: "Product and event news, food photos, monthly coupons and deals.", cta: "Sign up" },
  ].filter((c) => c.href);
  // Each card shows only while its link is set in Admin, Settings. With no gift card links
  // (24 Nov: Dan's new vendor links are still coming) the heading stops promising gift cards.
  if (cards.length === 0) return null;
  const heading = programsHeading(r);
  const columns = cards.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : cards.length === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:max-w-3xl";

  // One link (24 Nov: loyalty only) reads as a single band: a lone card left most of a
  // desktop row empty and stacked "Loyalty" over "Join Loyalty". The grid returns at two.
  if (cards.length === 1) {
    const c = cards[0];
    return (
      <section id="programs" className="scroll-mt-24 bg-cream-100 py-16 lg:py-20">
        <div className="container-site flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <Reveal>
            <h2 className="font-display text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.05] text-charcoal-900 display-sharp">{heading}</h2>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-charcoal-700">{c.body}</p>
          </Reveal>
          <Reveal delay={0.1} className="shrink-0">
            <ButtonLink href={c.href!} size="lg" arrow>
              {c.title}
            </ButtonLink>
          </Reveal>
        </div>
      </section>
    );
  }

  return (
    <section id="programs" className="scroll-mt-24 bg-cream-100 py-20 lg:py-28">
      <div className="container-site">
        <Reveal>
          <h2 className="font-display text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.05] text-charcoal-900 display-sharp">{heading}</h2>
        </Reveal>
        <RevealGroup className={`mt-10 grid gap-4 ${columns}`}>
          {cards.map((c) => (
            <RevealItem key={c.title}>
              <a
                href={c.href!}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-2xl border border-charcoal-900/8 bg-cream-50 p-6 shadow-card transition-all duration-500 hover:-translate-y-1 hover:border-ember-600/50 hover:shadow-lift"
              >
                <h3 className="font-display text-2xl font-semibold leading-tight text-charcoal-900">{c.title}</h3>
                <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-charcoal-700">{c.body}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-ember-600">
                  {c.cta}
                  <span className="transition-transform group-hover:translate-x-1">↗</span>
                </span>
                <NewTabCue />
              </a>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
