import type { DietaryTag } from "@/db/schema";
import { DIETARY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";

const dietaryStyles: Record<DietaryTag, string> = {
  vegetarian: "bg-sage-500/15 text-sage-700 ring-sage-500/30",
  "vegetarian-option": "bg-sage-500/10 text-sage-700 ring-sage-500/25",
  vegan: "bg-sage-600/20 text-sage-700 ring-sage-600/35",
  "vegan-option": "bg-sage-600/10 text-sage-700 ring-sage-600/25",
  "gluten-free": "bg-teal-600/15 text-teal-700 ring-teal-600/35",
  "gluten-free-option": "bg-teal-600/8 text-teal-700 ring-teal-600/25",
  "non-alcoholic": "bg-charcoal-900/8 text-charcoal-700 ring-charcoal-900/15",
};

export function DietaryBadge({ tag, size = "sm", onDark = false, className }: { tag: DietaryTag; size?: "xs" | "sm"; onDark?: boolean; className?: string }) {
  const meta = DIETARY_LABELS[tag];
  return (
    <span
      title={meta.description}
      aria-label={meta.description}
      className={cn(
        "inline-flex items-center rounded-full font-label tracking-[0.12em] ring-1 ring-inset",
        size === "xs" ? "h-5 px-1.5 text-[11px]" : "h-6 px-2 text-[12px]",
        onDark ? "bg-cream-50/15 text-cream-50 ring-cream-50/30" : dietaryStyles[tag],
        className,
      )}
    >
      {meta.short}
    </span>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ember" | "emberOnDark" | "sage" | "gold" | "brick" | "dark" | "light";
  className?: string;
}) {
  /* Rev 1 retheme (handoff 6.1): tone keys are legacy names kept so call sites
     don't break. "ember"/"emberOnDark" now render the red accent tag, "gold"
     renders a teal info tag. Red is tags/highlights only; never red text on teal. */
  const tones = {
    neutral: "bg-charcoal-900/6 text-charcoal-700 ring-charcoal-900/10",
    ember: "bg-red-600 text-cream-50 ring-red-600",
    emberOnDark: "bg-red-500 text-cream-50 ring-red-300/50",
    sage: "bg-sage-500/15 text-sage-700 ring-sage-500/30",
    gold: "bg-teal-600/10 text-teal-700 ring-teal-600/25",
    brick: "bg-brick-600/10 text-brick-600 ring-brick-600/25",
    dark: "bg-teal-800 text-cream-100 ring-teal-800",
    light: "bg-cream-50/90 text-charcoal-900 ring-cream-300 backdrop-blur",
  };
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
