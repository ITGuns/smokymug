import type { Metadata } from "next";
import { SpecialEventsManager } from "@/components/admin/special-events/SpecialEventsManager";
import { PageHeader } from "@/components/admin/ui";
import { readSpecialEvents } from "@/lib/data/events";

export const metadata: Metadata = { title: "Special Events" };

export default async function AdminSpecialEventsPage() {
  const { settings, images } = await readSpecialEvents();
  return (
    <>
      <PageHeader
        title="Special Events page"
        description="The /special-events page: switch it on or off, edit the copy, and manage the flyer grid. While it's off the page returns a 404."
      />
      <SpecialEventsManager settings={settings} images={images} />
    </>
  );
}
