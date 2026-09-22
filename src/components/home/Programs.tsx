import type { RestaurantInfo } from "@/db/schema";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";

export function Programs({ restaurant: r }: { restaurant: RestaurantInfo }) {
  const cards = [
    { href: r.giftCardUrl, title: "Buy a Gift Card", body: "e-Gift cards for client appreciation, Airbnb welcomes, birthdays and holidays.", cta: "Buy on Toast" },
    { href: r.giftCardBalanceUrl, title: "Check Gift Card Balance", body: "Look up the remaining value on a Smoky Mug gift card.", cta: "Check balance" },
    { href: r.loyaltyUrl, title: "Join Loyalty", body: "Earn points toward free drinks and food. $2 credit when you sign up.", cta: "Activate rewards" },
    { href: r.marketingSignupUrl, title: "Join the Email List", body: "Product and event news, food photos, monthly coupons and deals.", cta: "Sign up" },
  ].filter((c) => c.href);

  return (
    <section className="bg-cream-100 py-20 lg:py-28">
      <div className="container-site">
        <Reveal>
          <h2 className="font-display text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.05] text-charcoal-900 display-sharp">Gift cards & loyalty</h2>
        </Reveal>
        <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <RevealItem key={c.title}>
              <a
                href={c.href!}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-[22px] border border-charcoal-900/8 bg-cream-50 p-6 shadow-card transition-all duration-500 hover:-translate-y-1 hover:border-ember-400/50 hover:shadow-lift"
              >
                <h3 className="font-display text-2xl font-semibold leading-tight text-charcoal-900">{c.title}</h3>
                <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-charcoal-700">{c.body}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-ember-600">
                  {c.cta}
                  <span className="transition-transform group-hover:translate-x-1">↗</span>
                </span>
              </a>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
