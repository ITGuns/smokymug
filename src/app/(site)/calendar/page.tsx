import type { Metadata } from "next";
import { EventsCalendar } from "@/components/calendar/EventsCalendar";
import { calendarClosures } from "@/lib/calendar-closures";
import { getEventsBetween, readDateOverridesBetween, readEventIcons, readEventKinds, readEventKindTypes } from "@/lib/data/events";
import { addMonths, monthBounds, monthKey, monthLabel, parseMonthParam } from "@/lib/month-grid";
import { getSiteChrome } from "@/lib/site";

export const metadata: Metadata = {
  title: "Calendar",
  description:
    "Events and special programming at The Smoky Mug: what's happening at the smokehouse and cafe in Brookland Park, Northside Richmond, VA.",
  alternates: { canonical: "/calendar" },
};

/** NW01 (base scope): month grid + list by date + pop-out details; the list
 *  stacks on top on phones. Board copy: "What's happening?" / "Events and
 *  special programming: Do things. Meet people." Event-type icons + legend
 *  (B6, board L6) built 3 Nov per Pol's strict-markup order. */
export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const [{ clock }, params] = await Promise.all([getSiteChrome(), searchParams]);
  const [y, m] = clock.date.split("-").map(Number);
  const ref = parseMonthParam(params.month, { year: y, month: m });
  const { from, to } = monthBounds(ref);
  const [events, allKinds, allIcons, overrides, { types }] = await Promise.all([
    getEventsBetween(from, to),
    readEventKinds(),
    readEventIcons(),
    readDateOverridesBetween(from, to),
    readEventKindTypes(),
  ]);
  // F10: closed dates from Admin, Hours show here too, without a second entry
  const closures = calendarClosures(overrides, events);
  // Only this month's types travel to the client, and only types still listed in Admin (F11)
  const known = new Set(types.map((t) => t.key));
  const kinds = Object.fromEntries(events.filter((e) => known.has(allKinds[e.id])).map((e) => [e.id, allKinds[e.id]]));
  // 19 Nov 2026: and only this month's own icons (readEventIcons keeps names on the list)
  const icons = Object.fromEntries(events.filter((e) => allIcons[e.id]).map((e) => [e.id, allIcons[e.id]]));

  return (
    <>
      <section className="grain relative overflow-hidden bg-charcoal-950 pb-12 pt-32 text-cream-50 md:pt-40">
        <div aria-hidden className="pointer-events-none absolute -right-24 top-0 h-[420px] w-[420px] rounded-full bg-ember-500/15 blur-3xl" />
        <div className="container-site relative z-[2]">
          <p className="eyebrow text-teal-300">Calendar</p>
          <h1 className="mt-4 font-display text-[clamp(2.8rem,7vw,6rem)] font-semibold leading-[0.95] tracking-[-0.02em] display-wonk">
            What&apos;s happening?
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-cream-100/75 md:text-base">
            Events and special programming: Do things. Meet people.
          </p>
        </div>
      </section>

      <section className="bg-cream-100 py-12 lg:py-16">
        <div className="container-site">
          <EventsCalendar
            month={ref}
            label={monthLabel(ref)}
            prevMonth={monthKey(addMonths(ref, -1))}
            nextMonth={monthKey(addMonths(ref, 1))}
            today={clock.date}
            events={events}
            kinds={kinds}
            icons={icons}
            types={types}
            closures={closures}
          />
        </div>
      </section>
    </>
  );
}
