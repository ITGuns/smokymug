"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { MotionConfig } from "motion/react";

type MotionPause = { paused: boolean; toggle: () => void };
const MotionPauseContext = createContext<MotionPause>({ paused: false, toggle: () => {} });
export const useMotionPause = () => useContext(MotionPauseContext);

/**
 * Two jobs: honour the OS reduced-motion setting (motion/react ignores it unless
 * told; the CSS override in globals.css only covers CSS animations), and drive the
 * header's play/pause toggle. Pausing flips MotionConfig to "always" (stops
 * marquees, carousels and reveals, which all read useReducedMotion) and sets
 * data-motion="paused" on <html> so globals.css freezes pure-CSS animation
 * (smoke layers, ticker). The choice is remembered per browser.
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
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M6 4.5v11l9-5.5-9-5.5z" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M5.5 4h3v12h-3zM11.5 4h3v12h-3z" />
        </svg>
      )}
    </button>
  );
}
