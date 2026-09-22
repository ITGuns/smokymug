import type { Hours, HoursCategory } from "@/db/schema";
import { summarizeHours } from "@/lib/availability";
import { HOURS_CATEGORY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function HoursTable({
  hours,
  category = "store",
  className,
  todayDow,
  tone = "light",
}: {
  hours: Hours[];
  category?: HoursCategory;
  className?: string;
  todayDow?: number;
  tone?: "light" | "dark";
}) {
  const rows = summarizeHours(hours, category);
  const dark = tone === "dark";
  return (
    <dl className={cn("divide-y", dark ? "divide-cream-50/10" : "divide-charcoal-900/10", className)}>
      {rows.map((r) => {
        const isToday = todayDow != null && r.days.split("–").length === 1 && r.days === ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][todayDow];
        return (
          <div key={r.days} className={cn("flex items-baseline justify-between gap-6 py-2.5", isToday && "font-semibold")}>
            <dt className={cn("text-[15px]", dark ? "text-cream-100/80" : "text-charcoal-700")}>{r.days}</dt>
            <dd className={cn("font-label text-[17px] tracking-[0.08em]", r.hours === "Closed" ? "text-brick-500" : dark ? "text-cream-50" : "text-charcoal-900")}>
              {r.hours}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Compact "service" chips: breakfast/bbq/brunch/happy hour windows summarised. */
export function ServiceHours({ hours, tone = "light" }: { hours: Hours[]; tone?: "light" | "dark" }) {
  const cats: HoursCategory[] = ["breakfast", "cafe_fare", "bbq", "brunch", "happy_hour", "wine_wednesday", "cafe_drinks"];
  const dark = tone === "dark";
  return (
    <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {cats.map((c) => {
        const rows = summarizeHours(hours, c);
        if (!rows.length) return null;
        return (
          <li key={c} className={cn("flex flex-col gap-0.5 border-l-2 pl-3", dark ? "border-ember-400/70" : "border-ember-500/60")}>
            <span className={cn("eyebrow", dark ? "text-cream-100/60" : "text-charcoal-500")}>{HOURS_CATEGORY_LABELS[c]}</span>
            <span className={cn("text-[15px]", dark ? "text-cream-50" : "text-charcoal-900")}>
              {rows.map((r) => `${r.days} ${r.hours}`).join(" · ")}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
