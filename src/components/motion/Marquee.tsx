"use client";

import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "motion/react";
import { Children, cloneElement, isValidElement, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Infinite horizontal marquee that can be dragged. Content is rendered twice so
 * the loop is seamless; velocity eases back to the base speed after a drag.
 * The second copy is hidden from assistive tech and removed from the tab order,
 * but stays clickable (so it must not be `inert`). Direct children are expected
 * to be the focusable items (links); they receive tabIndex={-1} in the copy.
 */
export function Marquee({ children, speed = 40, className, pauseOnHover = true }: { children: React.ReactNode; speed?: number; className?: string; pauseOnHover?: boolean }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const dragging = useRef(false);
  const velocity = useRef(0);

  useAnimationFrame((_, delta) => {
    if (reduce || !trackRef.current) return;
    const half = trackRef.current.scrollWidth / 2;
    if (!half) return;
    const base = (hover && pauseOnHover) || focused ? 0 : speed;
    // ease drag momentum back toward base speed
    velocity.current += (base - velocity.current) * Math.min(1, delta / 400);
    if (dragging.current) return;
    let next = x.get() - (velocity.current * delta) / 1000;
    if (next <= -half) next += half;
    if (next > 0) next -= half;
    x.set(next);
  });

  const onDragEnd = (_: unknown, info: { velocity: { x: number } }) => {
    dragging.current = false;
    velocity.current = Math.max(-600, Math.min(600, -info.velocity.x));
  };

  return (
    <div
      className={cn("overflow-hidden", className)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <motion.div
        ref={trackRef}
        style={{ x }}
        drag={reduce ? false : "x"}
        dragMomentum={false}
        onDragStart={() => (dragging.current = true)}
        onDragEnd={onDragEnd}
        onDrag={(_, info) => {
          const half = trackRef.current ? trackRef.current.scrollWidth / 2 : 0;
          let v = x.get();
          if (half && v <= -half) v += half;
          if (half && v > 0) v -= half;
          x.set(v + info.delta.x * 0);
        }}
        className="flex w-max cursor-grab active:cursor-grabbing"
      >
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden>
          {Children.map(children, (child) => (isValidElement<{ tabIndex?: number }>(child) ? cloneElement(child, { tabIndex: -1 }) : child))}
        </div>
      </motion.div>
    </div>
  );
}
