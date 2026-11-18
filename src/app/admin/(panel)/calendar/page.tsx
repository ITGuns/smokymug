import type { Metadata } from "next";
import { EventsManager } from "@/components/admin/calendar/EventsManager";
import { EventTypesManager } from "@/components/admin/calendar/EventTypesManager";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth";
import { getClock } from "@/lib/availability";
import { readEventIcons, readEventKinds, readEventKindTypes, readEvents } from "@/lib/data/events";
import { readBookingSettings } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Calendar" };

export default async function AdminCalendarPage() {
  await requireAdminPage();
  const [events, kinds, icons, { types, available }, settings] = await Promise.all([
    readEvents(),
    readEventKinds(),
    readEventIcons(),
    readEventKindTypes(),
    readBookingSettings(),
  ]);
  const clock = getClock(settings.timezone);
  // How many events use each type: a used type can be renamed but not removed (F11).
  const counts = new Map<string, number>();
  for (const k of Object.values(kinds)) counts.set(k, (counts.get(k) ?? 0) + 1);
  const uses = Object.fromEntries(types.map((t) => [t.key, counts.get(t.key) ?? 0]));
  return (
    <>
      <PageHeader title="Calendar" description="Events shown on the public Calendar page. Inactive events stay here but never show on the site." />
      <div className="space-y-6">
        <EventsManager events={events} kinds={kinds} icons={icons} types={types} today={clock.date} />
        <EventTypesManager types={types} uses={uses} available={available} />
      </div>
    </>
  );
}
