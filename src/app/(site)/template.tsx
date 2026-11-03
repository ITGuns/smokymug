"use client";

import { motion } from "motion/react";

/** Re-mounts on every route change → soft page transition. Always the same
 *  element on server and client: branching on useReducedMotion() here broke
 *  hydration on every page for reduced-motion visitors (found 3 Nov).
 *  MotionConfig reducedMotion="user" only drops transforms; the opacity fade
 *  still ran, from the SSR opacity:0 until 0.55s after hydration, so the whole
 *  page body sat translucent and axe failed it (4 Nov). The [data-reveal] pin
 *  in globals.css (!important) outranks the inline style and the running fade,
 *  so reduced-motion visitors get a static page from first paint, and paused
 *  visitors (header toggle) get no fade between pages, same markup. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div data-reveal="" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}
