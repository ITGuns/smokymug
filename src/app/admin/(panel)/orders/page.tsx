import type { Metadata } from "next";
import Link from "next/link";
import { CateringInquiriesTable, OrderRequestsTable } from "@/components/admin/ordering/OrdersInbox";
import { Btn, Card, Input, PageHeader, Select } from "@/components/admin/ui";
import { ORDER_MENUS, ORDER_REQUEST_STATUSES, type OrderMenu, type OrderRequestStatus } from "@/db/schema";
import { getClock } from "@/lib/availability";
import { purgeExpiredOrderRequests, readCateringInquiries, readOrderRequests } from "@/lib/data/ordering";
import { readBookingSettings } from "@/lib/data/restaurant";
import { NEEDS_DB_PUSH } from "@/lib/db-errors";
import { cn } from "@/lib/cn";
import { inquiryMailConfig } from "@/lib/inquiry-mail";
import { ORDER_MENU_INFO, ORDER_STATUS_LABELS, RETENTION_DAYS } from "@/lib/ordering";

export const metadata: Metadata = { title: "Orders" };

type Search = { tab?: string; status?: string; menu?: string; from?: string; to?: string };
const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Phase 2 Orders (docs/phase2-ordering-spec.md 4.5) + the catering inquiries tab (P8). */
export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const tab = sp.tab === "catering" ? "catering" : "requests";
  const today = getClock((await readBookingSettings()).timezone).date;
  const mailOn = inquiryMailConfig() !== null;

  // Filters come from the URL; anything unexpected falls back to the default view.
  const status = sp.status === "all" || (ORDER_REQUEST_STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status! : "open";
  const statuses: OrderRequestStatus[] = status === "open" ? ["new", "confirmed"] : status === "all" ? [] : [status as OrderRequestStatus];
  const menu = (ORDER_MENUS as readonly string[]).includes(sp.menu ?? "") ? (sp.menu as OrderMenu) : null;
  const from = sp.from && YMD.test(sp.from) ? sp.from : null;
  const to = sp.to && YMD.test(sp.to) ? sp.to : null;

  // Spec 3.5: no cron exists, so the retention purge runs when this page opens.
  await purgeExpiredOrderRequests(today);
  const [requests, inquiries] = await Promise.all([tab === "requests" ? readOrderRequests({ statuses, menu, from, to }) : null, tab === "catering" ? readCateringInquiries() : []]);

  return (
    <>
      <PageHeader
        title="Orders"
        description={`Order requests from Express Catering and Holiday Preorders, plus catering inquiries. Nothing here was paid online. Requests are kept for ${RETENTION_DAYS} days after pickup. Never type card numbers into notes.`}
      />

      <nav aria-label="Orders sections" className="mb-5 inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5">
        {[
          { key: "requests", label: "Order requests", href: "/admin/orders" },
          { key: "catering", label: "Catering inquiries", href: "/admin/orders?tab=catering" },
        ].map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={tab === t.key ? "page" : undefined}
            className={cn("flex h-8 items-center rounded-md px-3 text-[13px] font-medium transition", tab === t.key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900")}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {!mailOn && <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">Email alerts are not set up. New requests only show here.</p>}

      {tab === "catering" ? (
        <CateringInquiriesTable rows={inquiries} />
      ) : requests === null ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">{NEEDS_DB_PUSH}</p>
      ) : (
        <>
          <Card className="mb-4">
            <form method="get" action="/admin/orders" className="flex flex-wrap items-end gap-3" aria-label="Filter requests">
              <label className="flex flex-col gap-1.5 text-[13px] font-medium text-zinc-700">
                Status
                <Select name="status" defaultValue={status} className="w-44">
                  <option value="open">New + Confirmed</option>
                  {ORDER_REQUEST_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABELS[s]}
                    </option>
                  ))}
                  <option value="all">All</option>
                </Select>
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-medium text-zinc-700">
                Menu
                <Select name="menu" defaultValue={menu ?? ""} className="w-44">
                  <option value="">Both menus</option>
                  {ORDER_MENUS.map((m) => (
                    <option key={m} value={m}>
                      {ORDER_MENU_INFO[m].title}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-medium text-zinc-700">
                Pickup from
                <Input type="date" name="from" defaultValue={from ?? ""} className="w-40" />
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-medium text-zinc-700">
                Pickup to
                <Input type="date" name="to" defaultValue={to ?? ""} className="w-40" />
              </label>
              <Btn type="submit" variant="primary">
                Filter
              </Btn>
              <Link href="/admin/orders" className="h-10 content-center px-2 text-[13px] font-medium text-zinc-600 hover:text-zinc-900">
                Reset
              </Link>
            </form>
          </Card>
          <OrderRequestsTable rows={requests} filtered={status !== "open" || !!menu || !!from || !!to} />
        </>
      )}
    </>
  );
}
