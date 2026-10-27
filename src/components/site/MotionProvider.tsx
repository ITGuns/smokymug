"use client";

import { MotionConfig } from "motion/react";

/** motion/react ignores the OS reduced-motion setting unless told to honour it;
    the CSS override in globals.css only covers CSS animations. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
