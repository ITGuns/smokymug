import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderRequestForm } from "@/components/ordering/OrderRequestForm";
import { Reveal } from "@/components/ui/Reveal";
import { loadPickupCtx, readOrderingSettings, readPublicOrderItems } from "@/lib/data/ordering";
import { longDate } from "@/lib/format";
import { menuFromSlug, ORDER_MENU_INFO } from "@/lib/ordering";
import { firstPickupDate } from "@/lib/pickup";
import { getSiteChrome } from "@/lib/site";

type Params = { params: Promise<{ menu: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const menu = menuFromSlug((await params).menu);
  if (!menu) return {};
  const info = ORDER_MENU_INFO[menu];
  return {
    title: info.title,
    description: `${info.title} at The Smoky Mug: send an order request for pickup in Brookland Park, Richmond, VA. You pay at pickup or through SpotOn.`,
    alternates: { canonical: info.path },
  };
}

/**
 * Phase 2 ordering pages (docs/phase2-ordering-spec.md 2.1, 2.8): one page for
 * both menus via a two-key allowlist. Each 404s while its admin switch is off,
 * the same convention as /special-events.
 */
export default async function OrderMenuPage({ params }: Params) {
  const menu = menuFromSlug((await params).menu);
  if (!menu) notFound();
  const { restaurant, hours, clock, phoneHref } = await getSiteChrome();
  const s = await readOrderingSettings(clock.date);
  if (!(menu === "express" ? s.expressOn : s.holidayOn)) notFound();

  const [items, ctx] = await Promise.all([readPublicOrderItems(menu), loadPickupCtx(menu, s, hours, clock)]);
  const info = ORDER_MENU_INFO[menu];
  const subtitle = menu === "express" ? s.expressSubtitle : s.holidaySubtitle;
  const lead = menu === "express" ? s.expressLeadHours : s.holidayLeadHours;

  return (
    <>
      {/* The /menu header pattern: photo + scrim, eyebrow, display h1, lead (DESIGN.md 3) */}
      <section className="grain relative overflow-hidden bg-charcoal-950 pb-14 pt-32 text-cream-50 md:pt-40">
        <Image src={menu === "express" ? s.tiles.express : s.tiles.holiday} alt="" fill priority sizes="100vw" className="object-cover object-[50%_45%]" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/65 to-charcoal-950/45" />
        <div className="container-site relative z-[2]">
          {/* Plain eyebrow: teal is the information layer, never a link (DESIGN.md 1) */}
          <p className="eyebrow text-teal-300">Menus</p>
          <h1 className="mt-4 font-display text-[clamp(2.8rem,7vw,6rem)] font-semibold leading-[0.95] tracking-[-0.02em] display-wonk">{info.title}</h1>
          {subtitle && <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-cream-100/80 md:text-base">{subtitle}</p>}
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-cream-100/80 md:text-base">Order requests only. Nothing is charged online: you pay at pickup or through SpotOn.</p>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-cream-100/80 md:text-base">
            Pickup only
            {menu === "holiday" && s.holidayPickupFrom && s.holidayPickupTo
              ? s.holidayPickupFrom === s.holidayPickupTo
                ? `, on ${longDate(s.holidayPickupFrom)}`
                : `, ${longDate(s.holidayPickupFrom)} to ${longDate(s.holidayPickupTo)}`
              : ""}
            .{lead > 0 && ` Order at least ${lead} hours ahead.`}
            {menu === "express" && (
              <>
                {" "}
                Need delivery or full service?{" "}
                <Link href="/catering#inquiry" className="font-semibold text-cream-50 hover:text-ember-300">
                  Send a catering inquiry
                </Link>
                .
              </>
            )}
          </p>
        </div>
      </section>

      <section className="bg-cream-100 py-12 lg:py-16">
        <div className="container-site">
          {items.length === 0 ? (
            // Same empty-state box as /special-events
            <Reveal className="rounded-2xl border border-dashed border-charcoal-900/15 p-10 text-center text-charcoal-500">
              Nothing listed right now. Call us at{" "}
              <a href={phoneHref} className="font-semibold text-charcoal-900 hover:text-ember-600">
                {restaurant.phone}
              </a>
              .
            </Reveal>
          ) : (
            // Reveal renders one stable element in every motion mode, so the pause toggle never re-mounts the form.
            // amount 0: a long menu makes the form taller than 4 screens, and the default 25% could then never be in view.
            <Reveal amount={0}>
              <OrderRequestForm menu={menu} items={items} ctx={ctx} firstDate={firstPickupDate(ctx)} phone={restaurant.phone} phoneHref={phoneHref} />
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
