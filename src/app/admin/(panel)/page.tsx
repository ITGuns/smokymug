import Link from "next/link";
import { Btn, Card, EmptyState, Stat, StatusBadge } from "@/components/admin/ui";
import { getClock, storeStatus, hoursFor } from "@/lib/availability";
import { HOURS_CATEGORY_LABELS } from "@/lib/constants";
import { flattenItems, readMenuTree } from "@/lib/data/menu";
import { dashboardStats } from "@/lib/data/reservations";
import { readBookingSettings, readHours } from "@/lib/data/restaurant";
import { longDate, money, shortDate, time12 } from "@/lib/format";
import type { HoursCategory } from "@/db/schema";

export default async function DashboardPage() {
  const settings = await readBookingSettings();
  const clock = getClock(settings.timezone);
  const [hours, stats, tree] = await Promise.all([readHours(), dashboardStats(clock.date), readMenuTree(true)]);
  const status = storeStatus(hours, clock);
  const featured = flattenItems(tree).filter((i) => i.featured && i.active).slice(0, 8);
  const cats: HoursCategory[] = ["store", "breakfast", "bbq", "brunch", "happy_hour", "cafe_drinks"];

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wide text-zinc-500">{longDate(clock.date, { weekday: true, year: true })}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Today at a glance</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/menu?new=1"><Btn variant="primary">+ Add Menu Item</Btn></Link>
          <Link href="/admin/reservations"><Btn>View Reservations</Btn></Link>
          <Link href="/admin/hours"><Btn>Edit Hours</Btn></Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Reservations today" value={stats.today.total} hint={`${stats.today.covers} covers`} />
        <Stat label="Confirmed" value={stats.today.confirmed} tone="good" />
        <Stat label="Pending" value={stats.today.pending} tone={stats.today.pending ? "warn" : "default"} hint={stats.pendingCount ? `${stats.pendingCount} pending upcoming` : undefined} />
        <Stat label="Cancelled" value={stats.today.cancelled} tone={stats.today.cancelled ? "bad" : "default"} />
        <Stat label="Upcoming (active)" value={stats.upcomingCount} hint={settings.bookingsEnabled ? "Online booking on" : "Online booking paused"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Today's reservations" description={`${stats.today.total} total`} className="xl:col-span-2" padded={false} actions={<Link href={`/admin/reservations?view=day&date=${clock.date}`} className="text-[13px] font-medium text-zinc-600 hover:text-zinc-900">Day view →</Link>}>
          {stats.todayList.length === 0 ? (
            <div className="p-5"><EmptyState title="No reservations today" body="New bookings from the website will show up here." /></div>
          ) : (
            <table className="w-full text-[14px]">
              <thead className="bg-zinc-50 text-left text-[12px] uppercase tracking-wide text-zinc-500">
                <tr><th className="px-5 py-2 font-medium">Time</th><th className="px-3 py-2 font-medium">Guest</th><th className="px-3 py-2 font-medium">Party</th><th className="px-3 py-2 font-medium">Status</th><th className="px-5 py-2 font-medium">Phone</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {stats.todayList.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-2.5 font-medium tabular-nums text-zinc-900">{time12(r.time)}</td>
                    <td className="px-3 py-2.5"><Link href={`/admin/reservations?view=list&q=${r.confirmationCode}`} className="font-medium text-zinc-900 hover:underline">{r.firstName} {r.lastName}</Link><span className="ml-2 text-[12px] text-zinc-400">{r.confirmationCode}</span></td>
                    <td className="px-3 py-2.5 tabular-nums">{r.partySize}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-2.5 text-zinc-600">{r.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Today's hours" description={`${status.label} · ${status.detail}`}>
            <dl className="divide-y divide-zinc-100">
              {cats.map((c) => {
                const row = hoursFor(hours, c, clock.dayOfWeek);
                const text = !row || row.isClosed ? "Closed" : `${row.opensAt ? time12(row.opensAt, { compact: true }) : "Open"} – ${row.closesAt ? time12(row.closesAt, { compact: true }) : "close"}`;
                return (
                  <div key={c} className="flex items-baseline justify-between py-2 text-[13px]">
                    <dt className="text-zinc-600">{HOURS_CATEGORY_LABELS[c]}</dt>
                    <dd className={text === "Closed" ? "text-zinc-400" : "font-medium tabular-nums text-zinc-900"}>{text}</dd>
                  </div>
                );
              })}
            </dl>
            <Link href="/admin/hours" className="mt-3 inline-block text-[13px] font-medium text-zinc-600 hover:text-zinc-900">Edit hours →</Link>
          </Card>

          <Card title="Upcoming" description="Next active reservations" padded={false}>
            {stats.upcoming.length === 0 ? (
              <div className="p-5"><EmptyState title="Nothing upcoming" /></div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {stats.upcoming.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13px]">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900">{r.firstName} {r.lastName} · {r.partySize}</p>
                      <p className="text-zinc-500">{shortDate(r.date)} · {time12(r.time)}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card title="Featured menu items" description="Shown in the homepage signature section" className="mt-6" padded={false} actions={<Link href="/admin/menu?featured=1" className="text-[13px] font-medium text-zinc-600 hover:text-zinc-900">Manage →</Link>}>
        {featured.length === 0 ? (
          <div className="p-5"><EmptyState title="No featured items" body="Mark items as featured from the menu editor." /></div>
        ) : (
          <ul className="grid gap-px bg-zinc-100 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((i) => (
              <li key={i.id} className="flex items-center gap-3 bg-white px-4 py-3">
                <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                  {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-zinc-900">{i.name}</span>
                  <span className="block text-[12px] text-zinc-500">{i.categoryName} · {i.price == null ? (i.priceNote ?? "varies") : money(i.price)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
