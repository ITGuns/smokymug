"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Logo } from "./Logo";
import { MotionToggle } from "./MotionProvider";
import { SocialLinks } from "./SocialLinks";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/#story", label: "Our Story" },
  { href: "/catering", label: "Catering" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

const ease = [0.16, 1, 0.3, 1] as const;

export type MenuLink = { label: string; href: string };

export type HeaderProps = {
  status: { isOpen: boolean; label: string; detail: string };
  phone: string;
  phoneHref: string;
  address: string;
  hoursToday: string;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  email?: string | null;
  /** C2 / Q8: SpotOn ordering link, editable in Admin → Settings. Button hidden until set. */
  orderUrl?: string | null;
  /** B3: the display menus the drawer's Menu item expands to. */
  menuLinks?: MenuLink[];
};

function StatusDot({ isOpen, className }: { isOpen: boolean; className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2", isOpen ? "text-sage-400" : "text-cream-300/50", className)}>
      {isOpen && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />}
      <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
    </span>
  );
}

export function Header({
  status,
  phone,
  phoneHref,
  address,
  hoursToday,
  instagramUrl,
  facebookUrl,
  email,
  orderUrl,
  menuLinks = [],
}: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
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
    if (!open) setMenuOpen(false);
    // Move focus into the dialog on open (axe/APG: aria-modal needs its focus inside).
    if (open) requestAnimationFrame(() => closeButtonRef.current?.focus());
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // While the drawer is open, everything outside the header (main, footer, the bottom booking
  // bar, the skip link) is behind the scrim: make it inert so keyboard focus can't land there,
  // and let Escape close the drawer.
  useEffect(() => {
    if (!open) return;
    const header = headerRef.current;
    const covered = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== header && !el.contains(header) && !el.inert,
    );
    covered.forEach((el) => (el.inert = true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      menuButtonRef.current?.focus();
    };
    // The drawer only exists below the lg breakpoint; if the viewport crosses it (tablet rotation,
    // window resize) the overlay disappears, so close it rather than leave the page inert behind nothing.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onBreakpoint = () => desktop.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onBreakpoint);
    onBreakpoint();
    return () => {
      covered.forEach((el) => (el.inert = false));
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [open]);

  const solid = scrolled || !overHero || open;
  const close = () => setOpen(false);
  const closeAndFocus = () => {
    setOpen(false);
    menuButtonRef.current?.focus();
  };

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-0 z-50">
      {/* Utility strip — the phone lives here, and only here, in BOTH nav modes (C2/B3) */}
      <div
        inert={scrolled}
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-500 ease-out-expo",
          scrolled ? "max-h-0 opacity-0" : "max-h-10 opacity-100",
          // 85%: keeps the glass look over the hero while the strip's small text
          // still clears 4.5:1 even against the cream page behind a slow-loading photo
          solid && !scrolled ? "bg-teal-950" : "bg-teal-950/85 backdrop-blur-md",
        )}
      >
        {/* Compressed mode: phone only */}
        <div className="flex h-8 items-center justify-center lg:hidden">
          <a href={phoneHref} className="font-label text-[13px] tracking-[0.16em] text-cream-50 transition hover:text-teal-300">
            {phone}
          </a>
        </div>
        <div className="container-site hidden h-9 items-center justify-between font-label text-[12.5px] tracking-[0.16em] text-cream-100/85 lg:flex">
          <span className="inline-flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-teal-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <a href={phoneHref} className="text-cream-50 transition hover:text-teal-300">
              {phone}
            </a>
            <SocialLinks
              instagramUrl={instagramUrl}
              facebookUrl={facebookUrl}
              email={email}
              className="-mr-1.5 -translate-y-px gap-0.5"
              linkClassName="flex h-7 w-7 items-center justify-center rounded-full text-cream-100/80 transition hover:bg-cream-50/10 hover:text-teal-300 focus-visible:outline-offset-1"
              iconClassName="h-[15px] w-[15px]"
            />
            <MotionToggle className="flex h-7 w-7 items-center justify-center rounded-full text-cream-100/80 transition hover:bg-cream-50/10 hover:text-teal-300 focus-visible:outline-offset-1" />
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-cream-50/15 to-transparent" />
      </div>

      {/* Main bar — desktop: L3-A inline. Compressed: hamburger left, logo centered (B3). */}
      <div
        className={cn(
          "transition-[background-color,box-shadow,backdrop-filter] duration-500",
          solid
            ? "bg-teal-950/90 shadow-[0_1px_0_rgb(255_255_255/0.07),0_12px_40px_-20px_rgb(0_0_0/0.6)] backdrop-blur-xl"
            : "bg-gradient-to-b from-teal-950/70 via-teal-950/25 to-transparent",
        )}
      >
        <div className="container-site relative flex h-[68px] items-center justify-between gap-6 md:h-[82px]">
          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="relative z-10 -ml-1 flex h-11 w-11 items-center justify-center rounded-full border border-cream-50/15 text-cream-50 lg:hidden"
          >
            <span className="relative block h-3.5 w-5">
              <span className={cn("absolute left-0 top-0 h-0.5 w-5 rounded bg-current transition-all duration-300", open && "top-[6px] rotate-45")} />
              <span className={cn("absolute left-0 top-[6px] h-0.5 w-5 rounded bg-current transition-all duration-300", open && "opacity-0")} />
              <span className={cn("absolute left-0 top-[12px] h-0.5 w-5 rounded bg-current transition-all duration-300", open && "top-[6px] -rotate-45")} />
            </span>
          </button>

          <Link
            href="/"
            aria-label="The Smoky Mug home"
            className="shrink-0 max-lg:absolute max-lg:left-1/2 max-lg:top-1/2 max-lg:-translate-x-1/2 max-lg:-translate-y-1/2 lg:relative lg:z-10"
          >
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
                      "absolute inset-x-0 -bottom-0.5 h-[2px] origin-left bg-red-400 transition-transform duration-500 ease-out-expo",
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {orderUrl && (
              <ButtonLink href={orderUrl} size="sm" className="h-10 px-5">
                Order Now
              </ButtonLink>
            )}
            <ButtonLink href="/book" variant="secondary" shape="soft" size="sm" className="h-10 px-5" arrow>
              Book a Table
            </ButtonLink>
          </div>

          {/* Same footprint as the hamburger, so the centered logo stays centered */}
          <MotionToggle className="relative z-10 -mr-1 flex h-11 w-11 items-center justify-center rounded-full border border-cream-50/15 text-cream-50 lg:hidden" />
        </div>
      </div>

      {/* Left slide-out drawer (compressed mode, B3): 85% width max 360px, scrim, Esc, link tap */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeAndFocus}
              className="fixed inset-0 z-[55] cursor-default bg-charcoal-950/60 backdrop-blur-[2px] lg:hidden"
            />
            <motion.div
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease }}
              className="grain fixed inset-y-0 left-0 z-[60] w-[85%] max-w-[360px] overflow-y-auto bg-teal-950 lg:hidden"
            >
              <div className="relative z-[2] flex min-h-full flex-col px-6 pb-10 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <Logo invert width={96} />
                  <button
                    ref={closeButtonRef}
                    type="button"
                    aria-label="Close menu"
                    onClick={closeAndFocus}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-cream-50/15 text-cream-50"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 5l10 10M15 5L5 15" />
                    </svg>
                  </button>
                </div>
                <nav aria-label="Mobile" className="flex flex-col">
                  <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05, duration: 0.4, ease }}
                    className="border-b border-cream-50/10"
                  >
                    <button
                      type="button"
                      aria-expanded={menuOpen}
                      onClick={() => setMenuOpen((v) => !v)}
                      className="flex w-full items-center justify-between py-4 font-display text-[1.8rem] font-medium text-cream-50 display-sharp"
                    >
                      Menu
                      <motion.span
                        aria-hidden
                        animate={{ rotate: menuOpen ? 90 : 0 }}
                        className="font-label text-lg tracking-[0.2em] text-red-300"
                      >
                        →
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {menuOpen && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease }}
                          className="overflow-hidden"
                        >
                          <li>
                            <Link href="/menu" onClick={close} className="block py-2.5 pl-4 text-[15px] font-semibold text-cream-50">
                              Full menu
                            </Link>
                          </li>
                          {menuLinks.map((m) => (
                            <li key={m.href}>
                              <Link href={m.href} onClick={close} className="block py-2.5 pl-4 text-[15px] text-cream-100/80 transition hover:text-cream-50">
                                {m.label}
                              </Link>
                            </li>
                          ))}
                          <li aria-hidden className="pb-3" />
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  {NAV.filter((item) => item.href !== "/menu").map((item, i) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease }}
                    >
                      <Link
                        href={item.href}
                        onClick={close}
                        className="flex items-center justify-between border-b border-cream-50/10 py-4 font-display text-[1.8rem] font-medium text-cream-50 display-sharp"
                      >
                        {item.label}
                        <span aria-hidden className="font-label text-lg tracking-[0.2em] text-red-300">
                          →
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </nav>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-7 space-y-4">
                  {orderUrl && (
                    <ButtonLink href={orderUrl} size="lg" className="w-full" onClick={close}>
                      Order Now
                    </ButtonLink>
                  )}
                  <ButtonLink href="/book" variant="secondary" shape="soft" size="lg" className="w-full" arrow onClick={close}>
                    Book a Table
                  </ButtonLink>
                  <div className="grid gap-4 rounded-2xl border border-cream-50/10 p-5 text-[14px] text-cream-100/75">
                    <p className="flex items-center gap-2">
                      <StatusDot isOpen={status.isOpen} />
                      <span className="font-semibold text-cream-50">{status.label}</span>
                      <span>· Today {hoursToday}</span>
                    </p>
                    <p>{address}</p>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <a href={phoneHref} className="font-label text-[15px] tracking-[0.16em] text-cream-50">
                        {phone}
                      </a>
                      <SocialLinks
                        instagramUrl={instagramUrl}
                        facebookUrl={facebookUrl}
                        email={email}
                        className="gap-2"
                        linkClassName="flex h-11 w-11 items-center justify-center rounded-full border border-cream-50/15 text-cream-50 transition hover:border-teal-300 hover:text-teal-300"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
