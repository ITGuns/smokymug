import type { Metadata } from "next";
import { Suspense } from "react";
import { MenuExplorer } from "@/components/menu/MenuExplorer";
import { Pill } from "@/components/ui/Badge";
import { isHappyHour, itemAvailability, type AvailabilityInfo } from "@/lib/availability";
import { getMenuTree } from "@/lib/data/menu";
import { getSiteChrome } from "@/lib/site";
import { DAY_NAMES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Cafe & BBQ Menus",
  description:
    "Breakfast sandwich, breakfast burrito, burrito bowl, avocado toast, bagels, lattes, & more! Smoked barbecue brisket, pulled pork, ribs, burnt ends, chicken, mac n cheese, collard greens, vegetarian options, sandwiches, tacos, platters, happy hour drinks.",
  alternates: { canonical: "/menu" },
};

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ category?: string; item?: string }> }) {
  const [{ hours, clock, status }, tree, params] = await Promise.all([getSiteChrome(), getMenuTree(), searchParams]);
  const availability: Record<number, AvailabilityInfo> = {};
  for (const cat of tree.categories) {
    for (const sec of cat.sections) {
      for (const item of sec.items) availability[item.id] = itemAvailability(item, cat, hours, clock);
    }
  }
  const happyHourNow = isHappyHour(hours, clock);
  const itemCount = tree.categories.reduce((n, c) => n + c.sections.reduce((m, s) => m + s.items.length, 0), 0);

  return (
    <>
      <section className="grain relative overflow-hidden bg-charcoal-950 pb-14 pt-32 text-cream-50 md:pt-40">
        <div aria-hidden className="pointer-events-none absolute -right-20 top-0 h-[420px] w-[420px] rounded-full bg-ember-500/15 blur-3xl" />
        <div className="container-site relative z-[2]">
          <p className="eyebrow text-ember-300">The menu</p>
          <h1 className="mt-4 font-display text-[clamp(2.8rem,7vw,6rem)] font-semibold leading-[0.95] tracking-[-0.02em] display-wonk">
            Breakfast. Barbecue. Brunch. Bar.
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Pill tone="light">
              <span className={`h-1.5 w-1.5 rounded-full ${status.isOpen ? "bg-sage-500" : "bg-brick-500"}`} />
              {status.label} · {status.detail}
            </Pill>
            {happyHourNow && <Pill tone="sage">Happy hour right now</Pill>}
            <span className="text-[13px] text-cream-100/60">
              {itemCount} items · {DAY_NAMES[clock.dayOfWeek]} menu
            </span>
          </div>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-cream-100/70">
            Everything is smoked, baked and brewed in-house. Availability badges reflect today&apos;s service windows; BBQ can sell out early.
          </p>
        </div>
      </section>
      <Suspense fallback={<div className="container-site py-20 text-charcoal-500">Loading menu…</div>}>
        <MenuExplorer categories={tree.categories} availability={availability} happyHourNow={happyHourNow} initialCategory={params.category} initialItem={params.item} />
      </Suspense>
    </>
  );
}
