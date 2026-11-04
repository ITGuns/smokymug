import type { Metadata } from "next";
import { OrderingManager } from "@/components/admin/ordering/OrderingManager";
import { PageHeader } from "@/components/admin/ui";
import { getClock } from "@/lib/availability";
import { EXPRESS_SUBTITLE_DEFAULT, readOrderingSettings, readOrderItems, TILE_DEFAULTS } from "@/lib/data/ordering";
import { readBookingSettings } from "@/lib/data/restaurant";
import { inquiryMailConfig } from "@/lib/inquiry-mail";

export const metadata: Metadata = { title: "Express + Holiday" };

export default async function AdminOrderingPage() {
  const today = getClock((await readBookingSettings()).timezone).date;
  const [settings, express, holiday] = await Promise.all([readOrderingSettings(today), readOrderItems("express"), readOrderItems("holiday")]);
  return (
    <>
      <PageHeader
        title="Express Catering + Holiday Preorders"
        description="Order requests for pickup. Nothing is charged online: guests pay at pickup or through SpotOn, and staff confirm every request. Both menus stay off until you switch them on."
      />
      <OrderingManager
        settings={settings}
        items={{ express, holiday }}
        mailOn={inquiryMailConfig() !== null}
        defaults={{ expressSubtitle: EXPRESS_SUBTITLE_DEFAULT, tiles: { ...TILE_DEFAULTS } }}
      />
    </>
  );
}
