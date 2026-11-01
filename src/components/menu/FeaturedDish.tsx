"use client";

import Image from "next/image";
import type { AvailabilityInfo } from "@/lib/availability";
import type { ItemNode } from "@/lib/data/menu";
import { money } from "@/lib/format";

/** B2 (L2-D): the tab's featured dish, a large photo in its own column beside
 *  the clean list (the board draws the photo side at roughly 40% width; on the
 *  phone it stacks on top of the list). Q10 default: the first item in the tab;
 *  the admin "pin" control is CHECK and not built. */
export function FeaturedDish({ item, availability, onOpen }: { item: ItemNode; availability?: AvailabilityInfo; onOpen: (slug: string) => void }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => onOpen(item.slug)}
      className="group block w-full text-left focus-visible:outline-offset-4"
    >
      <div className="relative overflow-hidden rounded-2xl bg-charcoal-900 text-cream-50 shadow-card transition-shadow duration-500 hover:shadow-lift">
        {item.image && (
          <div className="relative aspect-[16/10] overflow-hidden lg:aspect-[4/3]">
            <Image
              src={item.image}
              alt={item.imageAlt ?? item.name}
              fill
              sizes="(min-width: 1024px) 38vw, 100vw"
              className="object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.04]"
            />
          </div>
        )}
        <div className="flex flex-col gap-3 p-6 lg:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-full bg-ember-600 px-3 font-label text-[12px] tracking-[0.18em] text-cream-50">Featured</span>
            {availability?.label && (
              <span className="inline-flex h-7 items-center rounded-full bg-cream-50/15 px-3 font-label text-[12px] tracking-[0.18em] text-cream-50">
                {availability.label}
              </span>
            )}
          </div>
          <div className="flex items-start justify-between gap-6">
            <h3 className="font-display text-2xl font-semibold leading-tight lg:text-3xl">{item.name}</h3>
            <span className="shrink-0 font-label text-xl tracking-wide lg:text-2xl">
              {item.price != null ? money(item.price) : (item.priceNote ?? "Varies")}
              {item.price != null && item.largePrice != null && <span className="text-cream-100/70"> / {money(item.largePrice)}</span>}
            </span>
          </div>
          {item.description && <p className="text-[15px] leading-relaxed text-cream-100/85">{item.description}</p>}
          <span className="mt-1 text-[13px] font-semibold text-ember-300 transition group-hover:text-cream-50">View details →</span>
        </div>
      </div>
    </button>
  );
}
