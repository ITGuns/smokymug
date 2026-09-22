"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Logo } from "./Logo";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/#story", label: "Our Story" },
  { href: "/catering", label: "Catering" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export type HeaderProps = {
  status: { isOpen: boolean; label: string; detail: string };
  phone: string;
  phoneHref: string;
  address: string;
  hoursToday: string;
  instagramUrl?: string | null;
};

function StatusDot({ isOpen, className }: { isOpen: boolean; className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2", isOpen ? "text-sage-400" : "text-cream-300/50", className)}>
      {isOpen && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />}
      <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
    </span>
  );
}

export function Header({ status, phone, phoneHref, address, hoursToday, instagramUrl }: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const overHero = pathname === "/" || pathname === "/catering" || pathname === "/gallery";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = scrolled || !overHero || open;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Utility strip (desktop) */}
      <div
        aria-hidden={scrolled}
        className={cn(
          "hidden overflow-hidden transition-[max-height,opacity] duration-500 ease-out-expo lg:block",
          scrolled ? "max-h-0 opacity-0" : "max-h-10 opacity-100",
          solid && !scrolled ? "bg-charcoal-950" : "bg-charcoal-950/55 backdrop-blur-md",
        )}
      >
        <div className="container-site flex h-9 items-center justify-between font-label text-[12.5px] tracking-[0.16em] text-cream-100/70">
          <span className="inline-flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-ember-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {address}
          </span>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-2">
              <StatusDot isOpen={status.isOpen} />
              <span className="text-cream-50">{status.label}</span>
              <span>· Today {hoursToday}</span>
            </span>
            <a href={phoneHref} className="text-cream-50 transition hover:text-ember-300">
              {phone}
            </a>
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="transition hover:text-ember-300">
                Instagram
              </a>
            )}
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-cream-50/15 to-transparent" />
      </div>

      {/* Main bar */}
      <div
        className={cn(
          "transition-[background-color,box-shadow,backdrop-filter] duration-500",
          solid
            ? "bg-charcoal-950/88 shadow-[0_1px_0_rgb(255_255_255/0.07),0_12px_40px_-20px_rgb(0_0_0/0.6)] backdrop-blur-xl"
            : "bg-gradient-to-b from-charcoal-950/70 via-charcoal-950/25 to-transparent",
        )}
      >
        <div className="container-site flex h-[68px] items-center justify-between gap-6 md:h-[82px]">
          <Link href="/" className="relative z-10 shrink-0" aria-label="The Smoky Mug home">
            <Logo invert width={110} priority className="md:hidden" />
            <Logo invert width={136} priority className="hidden md:block" />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="group relative py-2 nav-label text-cream-100/85 transition-colors hover:text-cream-50"
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-0 -bottom-0.5 h-[2px] origin-left bg-ember-400 transition-transform duration-500 ease-out-expo",
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <a href={phoneHref} className="hidden whitespace-nowrap nav-label text-[14px] text-cream-100/75 transition hover:text-cream-50 xl:block">
              {phone}
            </a>
            <ButtonLink href="/book" size="sm" className="h-10 px-5" arrow>
              Book a Table
            </ButtonLink>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ButtonLink href="/book" size="sm" className="h-9 px-4 text-[13px]">
              Book
            </ButtonLink>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-cream-50/15 text-cream-50"
            >
              <span className="relative block h-3.5 w-5">
                <span className={cn("absolute left-0 top-0 h-0.5 w-5 rounded bg-current transition-all duration-300", open && "top-[6px] rotate-45")} />
                <span className={cn("absolute left-0 top-[6px] h-0.5 w-5 rounded bg-current transition-all duration-300", open && "opacity-0")} />
                <span className={cn("absolute left-0 top-[12px] h-0.5 w-5 rounded bg-current transition-all duration-300", open && "top-[6px] -rotate-45")} />
              </span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grain fixed inset-0 top-[68px] z-40 overflow-y-auto bg-charcoal-950 lg:hidden"
          >
            <div className="container-site relative z-[2] flex min-h-full flex-col pb-10 pt-2">
              <nav aria-label="Mobile" className="flex flex-col">
                {NAV.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center justify-between border-b border-cream-50/10 py-5 font-display text-[2.1rem] font-medium text-cream-50 display-sharp"
                    >
                      {item.label}
                      <span className="font-label text-lg tracking-[0.2em] text-ember-400">→</span>
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-8 space-y-5">
                <ButtonLink href="/book" size="lg" className="w-full" arrow>
                  Book a Table
                </ButtonLink>
                <div className="grid gap-4 rounded-[20px] border border-cream-50/10 p-5 text-[14px] text-cream-100/75">
                  <p className="flex items-center gap-2">
                    <StatusDot isOpen={status.isOpen} />
                    <span className="font-semibold text-cream-50">{status.label}</span>
                    <span>· Today {hoursToday}</span>
                  </p>
                  <p>{address}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 font-label text-[14px] tracking-[0.16em]">
                    <a href={phoneHref} className="text-cream-50">{phone}</a>
                    {instagramUrl && (
                      <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-cream-100/75">Instagram</a>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
