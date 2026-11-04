import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "light" | "dark";
type Size = "sm" | "md" | "lg";
/* B4: buttons are L4-A pills; Book a Table is the one soft square (handoff 6.3) */
type Shape = "pill" | "soft";

/* Guns 2 Nov: CTAs carry the saloon display font (Roadstore stand-in, single
   400 weight, so no font-semibold: it would synthesize a faux bold). */
type Face = "western" | "ui";

const base =
  "group/btn inline-flex items-center justify-center gap-2 transition-all duration-300 ease-out-expo select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
const faces: Record<Face, string> = {
  western: "font-western tracking-[0.02em]",
  ui: "font-semibold tracking-tight",
};
/* Finish-gate rule: filled CTA variants wear the western face; quiet utility
   variants (booking steps, cancel dialogs, downloads) keep the UI sans. Rye's
   subset also lacks the U+2190 back-arrow those labels use. Override with `face`. */
const defaultFace: Record<Variant, Face> = {
  primary: "western",
  secondary: "ui",
  ghost: "ui",
  outline: "ui",
  light: "western",
  dark: "western",
};
const variants: Record<Variant, string> = {
  primary: "bg-ember-600 text-cream-50 shadow-[0_8px_24px_-8px_rgb(165_79_31/0.7)] hover:bg-ember-700 hover:shadow-glow",
  secondary: "bg-charcoal-900 text-cream-50 hover:bg-charcoal-700",
  ghost: "bg-transparent text-current hover:bg-charcoal-900/5",
  outline: "border border-current/30 text-current hover:border-current hover:bg-current/5",
  light: "bg-cream-50 text-charcoal-900 hover:bg-white",
  dark: "bg-charcoal-950/70 text-cream-50 backdrop-blur border border-cream-50/15 hover:bg-charcoal-900",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-[15px]",
  lg: "h-13 px-8 text-base",
};
/* `wrap`: a long label breaks onto a second line instead of clipping (CA01 at
   320/360). Its own class sets, not overrides passed in className: cn() only
   joins strings, so of two utilities for one property the stylesheet order wins
   (whitespace-normal sorts before whitespace-nowrap and would lose). */
const wrapSizes: Record<Size, string> = {
  sm: "min-h-9 px-4 py-1.5 text-[13px]",
  md: "min-h-11 px-6 py-2 text-[15px]",
  lg: "min-h-13 px-8 py-3 text-base",
};
const layout = (size: Size, wrap?: boolean) => (wrap ? cn("max-w-full whitespace-normal text-center", wrapSizes[size]) : cn("whitespace-nowrap", sizes[size]));
const shapes: Record<Shape, string> = {
  pill: "rounded-full",
  soft: "rounded-[10px]",
};

type Common = { variant?: Variant; size?: Size; shape?: Shape; face?: Face; className?: string; children: ReactNode; arrow?: boolean; wrap?: boolean };

export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={cn("h-4 w-4 shrink-0 transition-transform duration-300 ease-out-expo group-hover/btn:translate-x-1", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

export function Button({ variant = "primary", size = "md", shape = "pill", face, className, children, arrow, wrap, ...rest }: Common & ComponentProps<"button">) {
  return (
    <button className={cn(base, faces[face ?? defaultFace[variant]], variants[variant], layout(size, wrap), shapes[shape], className)} {...rest}>
      {children}
      {arrow && <Arrow />}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  shape = "pill",
  face,
  className,
  children,
  arrow,
  wrap,
  href,
  ...rest
}: Common & Omit<ComponentProps<typeof Link>, "className" | "children">) {
  const external = typeof href === "string" && /^https?:/.test(href);
  return (
    <Link
      href={href}
      className={cn(base, faces[face ?? defaultFace[variant]], variants[variant], layout(size, wrap), shapes[shape], className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}
