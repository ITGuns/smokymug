import type { MenuItem } from "@/db/schema";
import { money } from "@/lib/format";
import { cn } from "@/lib/cn";

export function PriceTag({ item, className, size = "md" }: { item: Pick<MenuItem, "price" | "largePrice" | "bottlePrice" | "priceNote">; className?: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl";
  if (item.price == null) {
    return <span className={cn("font-label tracking-wide text-charcoal-500", sz, className)}>{item.priceNote ?? "Varies"}</span>;
  }
  if (item.bottlePrice != null) {
    return (
      <span className={cn("flex flex-col items-end leading-none", className)}>
        <span className={cn("font-label tracking-wide", sz)}>{money(item.price)}</span>
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-500">
          glass · {money(item.bottlePrice)} btl
        </span>
      </span>
    );
  }
  if (item.largePrice != null) {
    return (
      <span className={cn("flex flex-col items-end leading-none", className)}>
        <span className={cn("font-label tracking-wide", sz)}>
          {money(item.price)}
          <span className="text-charcoal-500/70"> / </span>
          {money(item.largePrice)}
        </span>
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-500">{item.priceNote ?? "Small / Large"}</span>
      </span>
    );
  }
  return (
    <span className={cn("flex flex-col items-end leading-none", className)}>
      <span className={cn("font-label tracking-wide", sz)}>{money(item.price)}</span>
      {item.priceNote && <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-500">{item.priceNote}</span>}
    </span>
  );
}
