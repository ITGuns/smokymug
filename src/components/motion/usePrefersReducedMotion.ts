"use client";

import { useSyncExternalStore } from "react";
import { useMotionPause } from "@/components/site/MotionProvider";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * The OS reduced-motion setting, safe to branch markup on. motion/react's
 * useReducedMotion() is null on the server but true on the client's first render,
 * so markup picked from it broke hydration for reduced-motion visitors (found 3 Nov,
 * same bug as the old (site)/template.tsx branch). This reports false on the server
 * and during hydration, so both render the same tree, then React re-renders with
 * the real value straight after hydration. MotionConfig reducedMotion="user" keeps
 * transforms instant meanwhile. Also follows live changes to the setting.
 */
export function usePrefersReducedMotion(): boolean {
  const os = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
  // The header pause toggle counts as reduced motion too. Provider state starts false
  // on server and client, so hydration is unaffected; outside the provider it is false.
  const { paused } = useMotionPause();
  return os || paused;
}
