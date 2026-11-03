import type { Metadata } from "next";
import { EventsManager } from "@/components/admin/calendar/EventsManager";
import { PageHeader } from "@/components/admin/ui";
import { getClock } from "@/lib/availability";
import { readEventKinds, readEvents } from "@/lib/data/events";
import { readBookingSettings } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Calendar" };

export default async function AdminCalendarPage() {
  const [events, kinds, settings] = await Promise.all([readEvents(), readEventKinds(), readBookingSettings()]);
  const clock = getClock(settings.timezone);
  return (
    <>
      <PageHeader title="Calendar" description="Events shown on the public Calendar page. Inactive events stay here but never show on the site." />
      <EventsManager events={events} kinds={kinds} today={clock.date} />
    </>
  );
}
