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
  // C8: the Cafe Fare window stays off the public service chips.
  // R2-03: Taco Tuesdays shows as its own chip, right after Tex Mex.
  const cats: HoursCategory[] = ["breakfast", "bbq", "tex_mex", "taco_tuesday", "brunch", "happy_hour", "cafe_drinks"];
  const dark = tone === "dark";
  return (
    <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {cats.map((c) => {
        const rows = summarizeHours(hours, c);
        if (!rows.length) return null;
        return (
          // Teal border: info accent, part of the 2 Nov secondary-accent set
          <li key={c} className={cn("flex flex-col gap-0.5 border-l-2 pl-3", dark ? "border-teal-400/70" : "border-teal-500/60")}>
            <span className={cn("eyebrow", dark ? "text-cream-100/60" : "text-charcoal-500")}>{HOURS_CATEGORY_LABELS[c]}</span>
            {/* Rows 8/9 (Dan, 9 Nov): the admin-editable note is the public line for these two chips */}
            <span className={cn("text-[15px]", dark ? "text-cream-50" : "text-charcoal-900")}>
              {c === "cafe_drinks" && rows[0].note ? rows[0].note : rows.map((r) => `${r.days} ${r.hours}`).join(" · ")}
            </span>
            {c === "taco_tuesday" && rows[0].note && (
              <span className={cn("text-[14px]", dark ? "text-cream-100/70" : "text-charcoal-500")}>{rows[0].note}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
