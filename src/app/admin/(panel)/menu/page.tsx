import type { Metadata } from "next";
import { Suspense } from "react";
import { MenuManager } from "@/components/admin/menu/MenuManager";
import { PageHeader } from "@/components/admin/ui";
import { getClock } from "@/lib/availability";
import { readMenuTree } from "@/lib/data/menu";
import { readBookingSettings } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Menu" };

export default async function AdminMenuPage() {
  const [tree, settings] = await Promise.all([readMenuTree(true), readBookingSettings()]);
  // D1: "today" for the Scheduled / Ends labels, in the restaurant's timezone (same clock as the public menu)
  const today = getClock(settings.timezone).date;
  const itemCount = tree.categories.reduce((n, c) => n + c.sections.reduce((m, s) => m + s.items.length, 0), 0);
  return (
    <>
      <PageHeader title="Menu items" description={`${itemCount} items across ${tree.categories.length} categories. Changes go live on the website immediately.`} />
      <Suspense>
        <MenuManager categories={tree.categories} groups={tree.groups} today={today} />
      </Suspense>
    </>
  );
}
