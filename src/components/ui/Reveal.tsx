"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

/*
 * Always the same motion element, on the server, in hydration, and whether motion
 * is playing, paused (header toggle) or reduced (OS). Never branch to a plain
 * element here: swapping the component type re-mounts the whole subtree, which
 * reset the gallery marquee and would wipe a typed form on every pause/resume
 * (found 4 Nov). Reduced and paused visitors are handled in CSS instead: the
 * [data-reveal] pin in globals.css holds opacity 1 / no transform / no filter over
 * the hidden variant, from first paint for the media query. Why CSS and not
 * MotionConfig: motion reads reducedMotion only when an element mounts (so the
 * toggle never reaches reveals already on the page), and even then it makes
 * transforms instant, never the opacity fade.
 */
const variants: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] },
  }),
};

export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
  amount = 0.25,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span" | "p" | "h2" | "h3" | "figure";
  amount?: number;
}) {
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag data-reveal="" className={className} variants={variants} initial="hidden" whileInView="show" viewport={{ once: true, amount }} custom={delay}>
      {children}
    </Tag>
  );
}

/** Staggers direct children. Same element in every motion mode (see the note above). */
export function RevealGroup({ children, className, stagger = 0.08 }: { children: ReactNode; className?: string; stagger?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div data-reveal="" className={className} variants={variants}>
      {children}
    </motion.div>
  );
}
