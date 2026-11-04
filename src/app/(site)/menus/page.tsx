import type { Metadata } from "next";
import Image from "next/image";
import { MenusTiles } from "@/components/ordering/MenusTiles";
import { HOLIDAY_OFF_TEXT, readOrderingSettings } from "@/lib/data/ordering";
import { EXPRESS_PATH, HOLIDAY_PATH } from "@/lib/ordering-menus";
import { getSiteChrome } from "@/lib/site";

export const metadata: Metadata = {
  title: "Menus",
  description: "All-day craft Tex Mex and BBQ menus at The Smoky Mug, plus Express Catering and Holiday Preorders for pickup in Brookland Park, Richmond, VA.",
  alternates: { canonical: "/menus" },
};

/** NW03 (phase 2, built 4 Nov 2026): reached from the "Menus" links in the top
 *  bar and the footer (NW03-3). Tile links follow the admin switches. */
export default async function MenusPage() {
  const { clock } = await getSiteChrome();
  const s = await readOrderingSettings(clock.date);

  return (
    <>
      {/* "Standard Header" (NW03 sketch): the /menu header pattern, photo + scrim (DESIGN.md 3) */}
      <section className="grain relative overflow-hidden bg-charcoal-950 pb-14 pt-32 text-cream-50 md:pt-40">
        <Image src="/images/brisket-sliced.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[50%_55%]" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/65 to-charcoal-950/45" />
        <div className="container-site relative z-[2]">
          {/* NW03's own panel title: "Three menus" */}
          <p className="eyebrow text-teal-300">Three menus</p>
          {/* No lead line (4 Nov): the builder's "Express Catering for pickup, and Holiday
              Preorders" was not board copy and read wrong while the switches are off */}
          <h1 className="mt-4 font-display text-[clamp(2.8rem,7vw,6rem)] font-semibold leading-[0.95] tracking-[-0.02em] display-wonk">MENUS.</h1>
        </div>
      </section>

      <section className="bg-cream-100 py-12 lg:py-16">
        <div className="container-site">
          <MenusTiles
            tiles={[
              {
                id: "all-day",
                title: ["ALL DAY", "CRAFT TEX MEX", "& BBQ"],
                list: ["Breakfast", "Lunch", "Dinner", "Brunch", "Cafe", "Bar"],
                // "This whole box links to this page" (the restaurant menu)
                href: "/menu",
                image: s.tiles.allDay,
                position: "55% 45%",
              },
              {
                id: "express",
                title: ["EXPRESS", "CATERING"],
                subtitle: s.expressSubtitle,
                href: s.expressOn ? EXPRESS_PATH : "/catering",
                image: s.tiles.express,
                position: "50% 40%",
              },
              {
                id: "holiday",
                title: ["HOLIDAY", "PREORDERS"],
                subtitle: s.holidaySubtitle || (s.holidayOn ? undefined : HOLIDAY_OFF_TEXT),
                // "Link needs toggle (on/off)": while off the tile stays, unlinked
                href: s.holidayOn ? HOLIDAY_PATH : null,
                image: s.tiles.holiday,
                position: "50% 50%",
              },
            ]}
          />
        </div>
      </section>
    </>
  );
}
