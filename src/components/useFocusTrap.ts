"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open traps, innermost last. Only the top one reacts to keys, so Escape in a
// confirm dialog stacked over a drawer closes the dialog, not both.
const stack: object[] = [];

/**
 * Modal dialog focus management (WAI-ARIA APG dialog pattern). While `active`:
 * - focus moves into `containerRef` (its `[data-autofocus]` element, else the first
 *   focusable), unless focus is already inside it;
 * - Tab / Shift+Tab wrap inside the container; Escape calls `onClose`;
 * - body scroll is locked.
 * When `active` turns false (or the component unmounts), focus returns to whatever
 * was focused when the trap opened.
 */
export function useFocusTrap(active: boolean, containerRef: RefObject<HTMLElement | null>, { onClose }: { onClose: () => void }) {
  // Latest onClose without re-running the trap (re-running would bounce focus).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!active) return;
    const token = {};
    stack.push(token);
    const lastFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      const el = containerRef.current;
      if (!el || stack[stack.length - 1] !== token) return;
      if (e.key === "Escape") onCloseRef.current();
      if (e.key !== "Tab") return;
      // Skip display:none controls (e.g. arrows hidden on mobile) so the wrap still lands.
      const focusables = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((f) => f.getClientRects().length > 0);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const inside = el.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => {
      const el = containerRef.current;
      if (!el || el.contains(document.activeElement)) return;
      (el.querySelector<HTMLElement>("[data-autofocus]") ?? el.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    }, 30);

    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
      stack.splice(stack.indexOf(token), 1);
      if (!stack.length) document.body.style.overflow = "";
      lastFocused?.focus?.();
    };
  }, [active, containerRef]);
}
