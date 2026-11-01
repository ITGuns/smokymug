"use client";

import Image from "next/image";
import type { AvailabilityInfo } from "@/lib/availability";
import type { ItemNode } from "@/lib/data/menu";
import { DietaryBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";

/** B2 (L2-D): the tab's featured dish, a large photo in its own column beside
 *  the clean list (the board draws the photo side at roughly 40% width; on the
 *  phone it stacks on top of the list). It keeps everything a list row shows:
 *  dietary badges, OPTIONS, and the Order Now button once the SpotOn URL is
 *  set (Q8). The admin "pin" control is CHECK and not built (Q10). */
export function FeaturedDish({
  item,
  availability,
  happyHourNow,
  onOpen,
  orderUrl,
}: {
  item: ItemNode;
  availability?: AvailabilityInfo;
  happyHourNow: boolean;
  onOpen: (slug: string) => void;
  orderUrl?: string | null;
}) {
  const customizable = item.modifierGroups.length > 0;
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-charcoal-900 text-cream-50 shadow-card transition-shadow duration-500 hover:shadow-lift">
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => onOpen(item.slug)}
        className="block w-full text-left focus-visible:outline-offset-[-3px]"
      >
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
        <div className={cn("flex flex-col gap-3 p-6 lg:p-7", orderUrl && "pb-3 lg:pb-3")}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-full bg-ember-600 px-3 font-label text-[12px] tracking-[0.18em] text-cream-50">Featured</span>
            {availability?.label && (
              <span className="inline-flex h-7 items-center rounded-full bg-cream-50/15 px-3 font-label text-[12px] tracking-[0.18em] text-cream-50">
                {availability.label}
              </span>
            )}
            {happyHourNow && item.happyHourEligible && (
              <span className="inline-flex h-7 items-center rounded-full bg-cream-50/15 px-3 font-label text-[12px] tracking-[0.18em] text-cream-50">
                Happy hour
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
          {(item.dietaryTags.length > 0 || customizable) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {item.dietaryTags.map((t) => (
                <DietaryBadge key={t} tag={t} size="xs" onDark />
              ))}
              {customizable && (
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-cream-100/70 transition-colors group-hover:text-ember-300">
                  Options
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 5l5 5-5 5" />
                  </svg>
                </span>
              )}
            </div>
          )}
          <span className="mt-1 text-[13px] font-semibold text-ember-300 transition group-hover:text-cream-50">View details →</span>
        </div>
      </button>
      {/* NW04: Order Now bottom left, a sibling of the modal button so links don't nest */}
      {orderUrl && (
        <div className="px-6 pb-6 lg:px-7">
          <ButtonLink href={orderUrl} size="sm" arrow>
            Order Now
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
