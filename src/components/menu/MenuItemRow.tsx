"use client";

import type { AvailabilityInfo } from "@/lib/availability";
import type { ItemNode } from "@/lib/data/menu";
import { DietaryBadge, Pill } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { PriceTag } from "./PriceTag";

/** B2 (L2-D): clean list row: name, short description, price at the right.
 *  No photo per row, no card shadow. Dietary badges, availability tags and
 *  OPTIONS stay as small text inside the row (NW04: they sit one spot up,
 *  above Order Now, which anchors bottom left once the SpotOn URL is set). */
export function MenuItemRow({
  item,
  signature = false,
  availability,
  happyHourNow,
  onOpen,
  orderUrl,
}: {
  item: ItemNode;
  /** Row 4 (9 Nov): this row is also the tab's featured dish */
  signature?: boolean;
  availability: AvailabilityInfo | undefined;
  happyHourNow: boolean;
  onOpen: (slug: string) => void;
  orderUrl?: string | null;
}) {
  const customizable = item.modifierGroups.length > 0;
  const unavailableToday = availability && !availability.availableToday;
  const isSignature = item.featured || signature;
  const hasMeta =
    isSignature || Boolean(availability?.label) || (happyHourNow && item.happyHourEligible) || item.dietaryTags.length > 0 || customizable;

  return (
    <div className="group">
      <button type="button" onClick={() => onOpen(item.slug)} aria-haspopup="dialog" className="block w-full text-left focus-visible:outline-offset-4">
        <div className="flex items-baseline justify-between gap-4">
          <h4 className="font-display text-[1.25rem] font-semibold leading-[1.15] text-charcoal-900 transition-colors group-hover:text-ember-600">
            {item.name}
          </h4>
          <PriceTag item={item} className="shrink-0" />
        </div>
        {item.description && <p className="mt-1.5 max-w-2xl text-[14.5px] leading-relaxed text-charcoal-700">{item.description}</p>}
        {!item.description && item.notes && <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-charcoal-500">{item.notes}</p>}
        {hasMeta && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {isSignature && <Pill tone="ember">Signature</Pill>}
            {availability?.label && <Pill tone={unavailableToday ? "brick" : "gold"}>{availability.label}</Pill>}
            {happyHourNow && item.happyHourEligible && <Pill tone="sage">Happy hour</Pill>}
            {item.dietaryTags.map((t) => (
              <DietaryBadge key={t} tag={t} size="xs" />
            ))}
            {customizable && (
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-charcoal-500 transition-colors group-hover:text-ember-600">
                Options
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 5l5 5-5 5" />
                </svg>
              </span>
            )}
          </div>
        )}
      </button>
      {orderUrl && (
        <div className="mt-3">
          <ButtonLink href={orderUrl} size="sm" arrow>
            Order Now
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
