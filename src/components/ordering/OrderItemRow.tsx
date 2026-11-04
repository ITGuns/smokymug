"use client";

import Image from "next/image";
import { PriceTag } from "@/components/menu/PriceTag";
import type { PublicOrderItem } from "@/lib/data/ordering";
import { cn } from "@/lib/cn";

/**
 * The /menu row (MenuItemRow, L2-D): name, description, price at the right in
 * PriceTag, no card shadow; an optional small photo; then a labelled quantity
 * with steppers in the DatePicker button style. Prices are display only: the
 * server re-prices every line on submit.
 */
const stepBtn =
  "flex h-11 w-11 items-center justify-center rounded-full border border-charcoal-900/10 text-charcoal-900 transition hover:bg-charcoal-900/5 disabled:opacity-30";

export function OrderItemRow({
  item,
  value,
  onChange,
  error,
  disabled,
}: {
  item: PublicOrderItem;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const qty = Number(value) || 0;
  const inputId = `qty-${item.id}`;
  const hintId = `qty-${item.id}-hint`;
  // + from 0 jumps to the item's minimum; - from the minimum drops back to 0
  const step = (dir: 1 | -1) => {
    const next = dir === 1 ? (qty < item.minQty ? item.minQty : qty + 1) : qty <= item.minQty ? 0 : qty - 1;
    onChange(String(Math.max(0, Math.min(item.maxQty, next))));
  };
  return (
    <li className="flex gap-4 py-5 first:pt-0" data-order-item={item.id}>
      {item.image && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-charcoal-900/5 sm:h-20 sm:w-20">
          <Image src={item.image} alt={item.imageAlt ?? ""} fill sizes="80px" className="object-cover" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-[1.25rem] font-semibold leading-[1.15] text-charcoal-900">{item.name}</h3>
          <PriceTag item={{ price: item.price, largePrice: null, bottlePrice: null, priceNote: item.price == null ? "Price on request" : item.priceNote }} className="shrink-0 text-right" />
        </div>
        {item.description && <p className="mt-1.5 max-w-2xl whitespace-pre-line text-[14.5px] leading-relaxed text-charcoal-700">{item.description}</p>}
        {item.price == null && item.priceNote && <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-500">{item.priceNote}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <button type="button" aria-label={`Fewer ${item.name}`} disabled={disabled || qty <= 0} onClick={() => step(-1)} className={stepBtn}>
              <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 10h10" /></svg>
            </button>
            <label htmlFor={inputId} className="sr-only">
              Quantity for {item.name}
            </label>
            <input
              id={inputId}
              type="number"
              inputMode="numeric"
              min={0}
              max={item.maxQty}
              step={1}
              value={value}
              disabled={disabled}
              placeholder="0"
              aria-describedby={error ? `${hintId} ${inputId}-msg` : hintId}
              aria-invalid={error ? true : undefined}
              onChange={(e) => onChange(e.target.value)}
              className={cn(
                "h-11 w-16 rounded-full border bg-cream-50 text-center text-[15px] font-semibold tabular-nums text-charcoal-900 placeholder:text-charcoal-500/60 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                error ? "border-brick-500" : "border-charcoal-900/12 focus:border-ember-600",
              )}
            />
            <button type="button" aria-label={`More ${item.name}`} disabled={disabled || qty >= item.maxQty} onClick={() => step(1)} className={stepBtn}>
              <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 5v10M5 10h10" /></svg>
            </button>
          </div>
          <span id={hintId} className="text-[13px] text-charcoal-500">
            {item.minQty > 1 ? `Minimum ${item.minQty}, up to ${item.maxQty}` : `Up to ${item.maxQty}`}
          </span>
        </div>
        {error && (
          <p id={`${inputId}-msg`} className="mt-1.5 text-[12px] font-medium text-brick-600">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}
