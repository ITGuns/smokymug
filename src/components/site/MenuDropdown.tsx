"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";
import type { MenuLink } from "./Header";
import { cn } from "@/lib/cn";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * C3: "Explore Menu" as a keyboard- and touch-friendly dropdown listing the display
 * menus (Q4 default: the site's own menu pages, not online ordering).
 * Disclosure pattern: Enter/Space/ArrowDown open and focus the list, arrows cycle,
 * Esc closes and returns focus, outside tap closes.
 */
export function MenuDropdown({ links, label = "Explore Menu", className }: { links: MenuLink[]; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<number | null>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  // Focus requested by a keyboard open runs after the list has rendered.
  useEffect(() => {
    if (open && pendingFocus.current != null) {
      focusItem(pendingFocus.current);
      pendingFocus.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const items = () => Array.from(listRef.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);

  const focusItem = (index: number) => {
    const list = items();
    if (!list.length) return;
    list[((index % list.length) + list.length) % list.length].focus();
  };

  const close = (refocus = false) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  };

  // Older engines report "Down"/"Up" instead of "ArrowDown"/"ArrowUp".
  const isDown = (k: string) => k === "ArrowDown" || k === "Down";
  const isUp = (k: string) => k === "ArrowUp" || k === "Up";

  const onButtonKeyDown = (e: React.KeyboardEvent) => {
    if (isDown(e.key) || isUp(e.key)) {
      e.preventDefault();
      if (open) {
        focusItem(isUp(e.key) ? -1 : 0);
      } else {
        pendingFocus.current = isUp(e.key) ? -1 : 0;
        setOpen(true);
      }
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    const list = items();
    const current = list.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (isDown(e.key)) {
      e.preventDefault();
      focusItem(current + 1);
    } else if (isUp(e.key)) {
      e.preventDefault();
      focusItem(current - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusItem(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusItem(-1);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
        className="group/btn inline-flex h-13 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-cream-50/15 bg-teal-950/70 px-8 text-base font-semibold tracking-tight text-cream-50 backdrop-blur transition-all duration-300 ease-out-expo select-none hover:bg-teal-900 active:scale-[0.98]"
      >
        {label}
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className={cn("h-4 w-4 transition-transform duration-300 ease-out-expo", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>
      {/* No exit animation: the panel must unmount with `open`, or an invisible
          copy keeps intercepting clicks over the hero buttons. */}
      {open && (
          <motion.div
            ref={listRef}
            id={listId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease }}
            onKeyDown={onListKeyDown}
            className="absolute bottom-full left-0 z-20 mb-2 min-w-[240px] rounded-2xl border border-cream-50/10 bg-teal-950/95 p-2 shadow-lift backdrop-blur-xl"
          >
            <Link
              href="/menu"
              onClick={() => close()}
              className="block rounded-xl px-4 py-2.5 text-[15px] font-semibold text-cream-50 transition hover:bg-cream-50/10"
            >
              Full menu
            </Link>
            {links.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                onClick={() => close()}
                className="block rounded-xl px-4 py-2.5 text-[15px] text-cream-100/85 transition hover:bg-cream-50/10 hover:text-cream-50"
              >
                {m.label}
              </Link>
            ))}
          </motion.div>
      )}
    </div>
  );
}
