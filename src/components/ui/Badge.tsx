import type { DietaryTag } from "@/db/schema";
import { DIETARY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";

const dietaryStyles: Record<DietaryTag, string> = {
  vegetarian: "bg-sage-500/15 text-sage-700 ring-sage-500/30",
  "vegetarian-option": "bg-sage-500/10 text-sage-700 ring-sage-500/25",
  vegan: "bg-sage-600/20 text-sage-700 ring-sage-600/35",
  "vegan-option": "bg-sage-600/10 text-sage-700 ring-sage-600/25",
  "gluten-free": "bg-gold-400/25 text-wood-700 ring-gold-500/40",
  "gluten-free-option": "bg-gold-400/15 text-wood-700 ring-gold-500/30",
  "non-alcoholic": "bg-charcoal-900/8 text-charcoal-700 ring-charcoal-900/15",
};

export function DietaryBadge({ tag, size = "sm", className }: { tag: DietaryTag; size?: "xs" | "sm"; className?: string }) {
  const meta = DIETARY_LABELS[tag];
  return (
    <span
      title={meta.description}
      aria-label={meta.description}
      className={cn(
        "inline-flex items-center rounded-full font-label tracking-[0.12em] ring-1 ring-inset",
        size === "xs" ? "h-5 px-1.5 text-[11px]" : "h-6 px-2 text-[12px]",
        dietaryStyles[tag],
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
  tone?: "neutral" | "ember" | "sage" | "gold" | "brick" | "dark" | "light";
  className?: string;
}) {
  const tones = {
    neutral: "bg-charcoal-900/6 text-charcoal-700 ring-charcoal-900/10",
    ember: "bg-ember-500/12 text-ember-600 ring-ember-500/30",
    sage: "bg-sage-500/15 text-sage-700 ring-sage-500/30",
    gold: "bg-gold-400/25 text-wood-700 ring-gold-500/40",
    brick: "bg-brick-600/10 text-brick-600 ring-brick-600/25",
    dark: "bg-charcoal-900 text-cream-100 ring-charcoal-900",
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
