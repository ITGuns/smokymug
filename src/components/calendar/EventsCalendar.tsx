"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SiteEvent } from "@/db/schema";
import { cn } from "@/lib/cn";
import { longDate, parseDate, time12 } from "@/lib/format";
import { monthGridCells, type MonthRef } from "@/lib/month-grid";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ease = [0.16, 1, 0.3, 1] as const;

function timeRange(e: SiteEvent): string | null {
  if (!e.startTime) return null;
  return e.endTime ? `${time12(e.startTime)} – ${time12(e.endTime)}` : time12(e.startTime);
}

/** "2026-11-14" → "Nov 14" for the list's date chip */
function monthDay(ymd: string): string {
  return parseDate(ymd).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** NW01: month grid (hover highlights the day square; clicking a day with
 *  events pops details out OVER the calendar, X to exit) beside a "List by
 *  date" panel whose rows drop open. On phones the list stacks on top. */
export function EventsCalendar({
  month,
  label,
  prevMonth,
  nextMonth,
  today,
  events,
}: {
  month: MonthRef;
  label: string;
  prevMonth: string;
  nextMonth: string;
  today: string;
  events: SiteEvent[];
}) {
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const cells = useMemo(() => monthGridCells(month), [month]);
  const byDate = useMemo(() => {
    const map = new Map<string, SiteEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  useEffect(() => {
    setOpenDate(null);
    setExpanded(null);
  }, [month.year, month.month]);

  useEffect(() => {
    if (!openDate) return;
    requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenDate(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openDate]);

  const openEvents = openDate ? (byDate.get(openDate) ?? []) : [];

  return (
    <div>
      {/* Month switcher drives both the grid and the list */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-3xl font-semibold text-charcoal-900 lg:text-4xl">{label}</h2>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?month=${prevMonth}`}
            scroll={false}
            aria-label="Previous month"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-charcoal-900/15 text-charcoal-700 transition hover:border-ember-500 hover:text-ember-600"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15l-5-5 5-5" />
            </svg>
          </Link>
          <Link
            href={`/calendar?month=${nextMonth}`}
            scroll={false}
            aria-label="Next month"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-charcoal-900/15 text-charcoal-700 transition hover:border-ember-500 hover:text-ember-600"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 5l5 5-5 5" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Phone stack (NW01 note): list on top, calendar below. Desktop: grid left, list right. */}
      <div className="mt-8 flex flex-col gap-10 lg:grid lg:grid-cols-12 lg:items-start lg:gap-12">
        <section aria-label="List by date" className="lg:order-2 lg:col-span-5">
          <p className="eyebrow text-ember-600">List by date</p>
          {events.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-charcoal-900/15 p-8 text-[15px] text-charcoal-500">
              Nothing on the calendar for {label} yet. Check back soon, or follow us on Instagram for pop-ups and specials.
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-charcoal-900/8">
              {events.map((e) => {
                const open = expanded === e.id;
                const range = timeRange(e);
                return (
                  <li key={e.id} className="py-4 first:pt-0">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setExpanded(open ? null : e.id)}
                      className="group flex w-full items-baseline gap-4 text-left"
                    >
                      <span className="w-16 shrink-0 font-label text-[13px] tracking-[0.14em] text-ember-600">{monthDay(e.date)}</span>
                      <span className="flex-1">
                        <span className="block font-display text-[1.15rem] font-semibold leading-tight text-charcoal-900 transition-colors group-hover:text-ember-600">
                          {e.title}
                        </span>
                        {range && <span className="mt-0.5 block text-[13px] text-charcoal-500">{range}</span>}
                      </span>
                      <svg
                        viewBox="0 0 20 20"
                        className={cn("h-4 w-4 shrink-0 self-center text-charcoal-500 transition-transform", open && "rotate-180")}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M5 8l5 5 5-5" />
                      </svg>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease }}
                          className="overflow-hidden"
                        >
                          <div className="pl-20 pt-2">
                            <p className="text-[13px] text-charcoal-500">{longDate(e.date, { weekday: true, year: true })}</p>
                            {e.description && <p className="mt-1.5 text-[14.5px] leading-relaxed text-charcoal-700">{e.description}</p>}
                            {e.linkUrl && (
                              <a
                                href={e.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-block text-[13px] font-semibold text-ember-600 hover:underline"
                              >
                                {e.linkLabel ?? "Details"} ↗
                              </a>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="relative lg:order-1 lg:col-span-7">
          {/* Plain markup, not an ARIA grid: each day with events is a labelled
              button, which reads better than grid/gridcell semantics here. */}
          <div aria-label={`${label} calendar`}>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((d) => (
                <span key={d} className="pb-2 text-center font-label text-[12px] tracking-[0.18em] text-charcoal-500">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((cell) => {
                const dayEvents = cell.inMonth ? (byDate.get(cell.date) ?? []) : [];
                const has = dayEvents.length > 0;
                const isToday = cell.date === today;
                const base = cn(
                  "relative flex aspect-square flex-col items-start justify-between rounded-xl border p-2 text-[14px] sm:p-2.5",
                  cell.inMonth ? "border-charcoal-900/8 bg-cream-50 text-charcoal-900" : "border-transparent text-charcoal-500/40",
                  isToday && "ring-1 ring-inset ring-ember-500/60",
                );
                if (!has)
                  return (
                    <div key={cell.date} className={base}>
                      <span className="font-semibold">{cell.day}</span>
                    </div>
                  );
                return (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => setOpenDate(cell.date)}
                    aria-label={`${longDate(cell.date, { weekday: true })}: ${dayEvents.length} ${dayEvents.length === 1 ? "event" : "events"}`}
                    className={cn(base, "transition-colors hover:border-ember-500/50 hover:bg-ember-600/10")}
                  >
                    <span className="font-semibold">{cell.day}</span>
                    <span className="flex flex-wrap gap-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span key={e.id} aria-hidden className="h-1.5 w-1.5 rounded-full bg-ember-500" />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* NW01: clicking a day pops details out to cover the calendar; X exits */}
          <AnimatePresence>
            {openDate && (
              <motion.div
                role="dialog"
                aria-label={`Events on ${longDate(openDate, { weekday: true, year: true })}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease }}
                className="absolute inset-0 z-10 overflow-y-auto rounded-2xl bg-charcoal-900 p-6 text-cream-50 shadow-lift sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="eyebrow text-ember-300">{longDate(openDate, { weekday: true, year: true })}</p>
                  <button
                    ref={closeRef}
                    type="button"
                    aria-label="Back to calendar view"
                    onClick={() => setOpenDate(null)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cream-50/20 text-cream-50 transition hover:border-ember-300 hover:text-ember-300"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 5l10 10M15 5L5 15" />
                    </svg>
                  </button>
                </div>
                <ul className="mt-5 space-y-6">
                  {openEvents.map((e) => {
                    const range = timeRange(e);
                    return (
                      <li key={e.id}>
                        <h3 className="font-display text-2xl font-semibold leading-tight">{e.title}</h3>
                        {range && <p className="mt-1 font-label text-[13px] tracking-[0.16em] text-ember-300">{range}</p>}
                        {e.description && <p className="mt-2 text-[14.5px] leading-relaxed text-cream-100/85">{e.description}</p>}
                        {e.linkUrl && (
                          <a
                            href={e.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-[13px] font-semibold text-ember-300 hover:text-cream-50"
                          >
                            {e.linkLabel ?? "Details"} ↗
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
