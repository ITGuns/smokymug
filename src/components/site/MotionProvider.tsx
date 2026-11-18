"use client";

import { Pause, Play } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { MotionConfig } from "motion/react";

type MotionPause = { paused: boolean; toggle: () => void };
const MotionPauseContext = createContext<MotionPause>({ paused: false, toggle: () => {} });
export const useMotionPause = () => useContext(MotionPauseContext);

/**
 * Two jobs: honour the OS reduced-motion setting (motion/react ignores it unless
 * told; the CSS override in globals.css only covers CSS animations), and drive the
 * header's play/pause toggle. Pausing flips MotionConfig to "always" (motion
 * reads that only when an element mounts), stops marquees, carousels and
 * parallax through usePrefersReducedMotion, and sets data-motion="paused" on
 * <html> so globals.css freezes pure-CSS animation (smoke layers, ticker) and
 * pins [data-reveal] elements shown. Nothing swaps elements on toggle, so no
 * subtree re-mounts (Reveal.tsx). The choice is remembered per browser.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("sm-motion") === "paused") setPaused(true);
    } catch {
      /* storage blocked: default to playing */
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = paused ? "paused" : "";
    try {
      localStorage.setItem("sm-motion", paused ? "paused" : "playing");
    } catch {
      /* fine: the toggle still works for this page view */
    }
  }, [paused]);

  return (
    <MotionConfig reducedMotion={paused ? "always" : "user"}>
      <MotionPauseContext.Provider value={{ paused, toggle: () => setPaused((v) => !v) }}>{children}</MotionPauseContext.Provider>
    </MotionConfig>
  );
}

export function MotionToggle({ className }: { className?: string }) {
  const { paused, toggle } = useMotionPause();
  return (
    <button
      type="button"
      aria-pressed={paused}
      aria-label={paused ? "Resume animations" : "Pause animations"}
      title={paused ? "Resume animations" : "Pause animations"}
      onClick={toggle}
      className={className}
    >
      {paused ? (
        <Play aria-hidden className="h-4 w-4" fill="currentColor" />
      ) : (
        <Pause aria-hidden className="h-4 w-4" fill="currentColor" />
      )}
    </button>
  );
}
