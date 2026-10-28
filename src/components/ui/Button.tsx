import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "light" | "dark";
type Size = "sm" | "md" | "lg";
/* B4: buttons are L4-A pills; Book a Table is the one soft square (handoff 6.3) */
type Shape = "pill" | "soft";

const base =
  "group/btn inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-tight transition-all duration-300 ease-out-expo select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
const variants: Record<Variant, string> = {
  primary: "bg-red-600 text-cream-50 shadow-[0_8px_24px_-8px_rgb(143_30_24/0.7)] hover:bg-red-500 hover:shadow-glow",
  secondary: "bg-teal-800 text-cream-50 hover:bg-teal-700",
  ghost: "bg-transparent text-current hover:bg-teal-900/5",
  outline: "border border-current/30 text-current hover:border-current hover:bg-current/5",
  light: "bg-cream-50 text-charcoal-900 hover:bg-white",
  dark: "bg-teal-950/70 text-cream-50 backdrop-blur border border-cream-50/15 hover:bg-teal-900",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-[15px]",
  lg: "h-13 px-8 text-base",
};
const shapes: Record<Shape, string> = {
  pill: "rounded-full",
  soft: "rounded-[10px]",
};

type Common = { variant?: Variant; size?: Size; shape?: Shape; className?: string; children: ReactNode; arrow?: boolean };

export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={cn("h-4 w-4 transition-transform duration-300 ease-out-expo group-hover/btn:translate-x-1", className)}
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

export function Button({ variant = "primary", size = "md", shape = "pill", className, children, arrow, ...rest }: Common & ComponentProps<"button">) {
  return (
    <button className={cn(base, variants[variant], sizes[size], shapes[shape], className)} {...rest}>
      {children}
      {arrow && <Arrow />}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  shape = "pill",
  className,
  children,
  arrow,
  href,
  ...rest
}: Common & Omit<ComponentProps<typeof Link>, "className" | "children">) {
  const external = typeof href === "string" && /^https?:/.test(href);
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], shapes[shape], className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}
