"use client";

import Image from "next/image";
import type { AvailabilityInfo } from "@/lib/availability";
import type { ItemNode } from "@/lib/data/menu";
import { DietaryBadge, Pill } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { PriceTag } from "./PriceTag";
import { cn } from "@/lib/cn";

export function MenuItemCard({
  item,
  availability,
  happyHourNow,
  onOpen,
  orderUrl,
}: {
  item: ItemNode;
  availability: AvailabilityInfo | undefined;
  happyHourNow: boolean;
  onOpen: (slug: string) => void;
  orderUrl?: string | null;
}) {
  const hasImage = Boolean(item.image);
  const customizable = item.modifierGroups.length > 0;
  const unavailableToday = availability && !availability.availableToday;

  return (
    <div className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-charcoal-900/8 bg-cream-50 shadow-card transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-teal-600/40 hover:shadow-lift">
      <button
        type="button"
        onClick={() => onOpen(item.slug)}
        aria-haspopup="dialog"
        className="flex flex-1 flex-col text-left focus-visible:outline-offset-4"
      >
        {hasImage && (
          <div className="relative aspect-[16/10] overflow-hidden bg-charcoal-800">
            <Image src={item.image!} alt={item.imageAlt ?? item.name} fill sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw" className="object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.05]" />
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              {item.featured && <Pill tone="ember">Signature</Pill>}
              {availability?.label && <Pill tone="light">{availability.label}</Pill>}
            </div>
          </div>
        )}
        <div className={cn("flex flex-1 flex-col p-5", orderUrl && "pb-3")}>
          {!hasImage && (item.featured || availability?.label || (happyHourNow && item.happyHourEligible)) && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {item.featured && <Pill tone="ember">Signature</Pill>}
              {availability?.label && <Pill tone={unavailableToday ? "brick" : "gold"}>{availability.label}</Pill>}
              {happyHourNow && item.happyHourEligible && <Pill tone="sage">Happy hour</Pill>}
            </div>
          )}
          <div className="flex items-start justify-between gap-4">
            <h4 className="font-display text-[1.35rem] font-semibold leading-[1.15] text-charcoal-900 group-hover:text-teal-600">{item.name}</h4>
            <PriceTag item={item} className="shrink-0" />
          </div>
          {item.description && <p className="mt-2 text-[14.5px] leading-relaxed text-charcoal-700">{item.description}</p>}
          {!item.description && item.notes && <p className="mt-2 text-[14px] leading-relaxed text-charcoal-500">{item.notes}</p>}
          {/* NW04: tags and Options sit one spot up, above the Order Now row */}
          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <div className="flex flex-wrap gap-1.5">
              {item.dietaryTags.map((t) => (
                <DietaryBadge key={t} tag={t} size="xs" />
              ))}
            </div>
            {customizable && (
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-charcoal-500 transition-colors group-hover:text-teal-600">
                Options
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 5l5 5-5 5" />
                </svg>
              </span>
            )}
          </div>
        </div>
      </button>
      {/* NW04 (Q8): Order Now anchored bottom left on every card, hidden until the
          SpotOn URL is set; red keeps the featured-action color consistent */}
      {orderUrl && (
        <div className="px-5 pb-5">
          <ButtonLink href={orderUrl} size="sm" arrow>
            Order Now
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
