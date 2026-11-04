import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderDetailActions } from "@/components/admin/ordering/OrderDetailActions";
import { OrderStatusTag } from "@/components/admin/ordering/OrderStatusTag";
import { Card, PageHeader, Tag } from "@/components/admin/ui";
import { readOrderRequest } from "@/lib/data/ordering";
import { formatRelative, longDate, money, phoneHref, time12 } from "@/lib/format";
import { NOTIFY_LABELS, notEmailed, ORDER_MENU_INFO, orderReference } from "@/lib/ordering";

export const metadata: Metadata = { title: "Order request" };

/** One request: contact (tel/mailto), lines, notes as plain text, estimate, email outcome, staff actions. */
export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const raw = (await params).id;
  const id = /^\d{1,9}$/.test(raw) ? Number(raw) : 0;
  const r = id > 0 ? await readOrderRequest(id) : null;
  if (!r) notFound();
  const ref = orderReference(r.menu, r.id);

  return (
    <>
      <Link href="/admin/orders" className="mb-3 inline-block text-[13px] font-medium text-zinc-600 hover:text-zinc-900">
        ← All requests
      </Link>
      <PageHeader title={`${ref} · ${r.name}`} description={`${ORDER_MENU_INFO[r.menu].title} · received ${formatRelative(r.createdAt)}`} actions={<OrderStatusTag status={r.status} />} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Pickup" description="Pickup only. Payment happens at pickup or through SpotOn, never on the website.">
            <p className="text-[18px] font-semibold text-zinc-900">
              {longDate(r.pickupDate, { weekday: true, year: true })} at {time12(r.pickupTime)}
            </p>
          </Card>

          <Card title="Items" padded={false}>
            <table className="w-full text-[14px]">
              <thead className="bg-zinc-50 text-left text-[12px] uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Qty</th>
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 text-right font-medium">Each</th>
                  <th className="px-5 py-2 text-right font-medium">Line</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {r.lines.map((l) => (
                  <tr key={l.id}>
                    <td className="px-5 py-2.5 tabular-nums">{l.quantity}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-medium text-zinc-900">{l.name}</span>
                      {l.priceNote && <span className="ml-2 text-[12px] text-zinc-500">{l.priceNote}</span>}
                      {l.itemId == null && <span className="ml-2 text-[12px] text-zinc-500">(item since deleted)</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">{l.unitPrice == null ? "On request" : money(l.unitPrice, { always: true })}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-zinc-900">{l.unitPrice == null ? "To confirm" : money(l.unitPrice * l.quantity, { always: true })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-200">
                  <td colSpan={3} className="px-5 py-3 text-right font-medium text-zinc-700">
                    Estimate before tax
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums text-zinc-900">{r.estimatedTotal == null ? "To confirm" : money(r.estimatedTotal, { always: true })}</td>
                </tr>
              </tfoot>
            </table>
          </Card>

          <Card title="Guest's notes">
            {/* Plain text node: guest text is never rendered as HTML or auto-linked */}
            {r.notes ? <p className="whitespace-pre-wrap text-[14px] text-zinc-800">{r.notes}</p> : <p className="text-[14px] text-zinc-500">No notes.</p>}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Contact">
            <dl className="space-y-2 text-[14px]">
              <div>
                <dt className="text-[12px] uppercase tracking-wide text-zinc-500">Name</dt>
                <dd className="font-medium text-zinc-900">{r.name}</dd>
              </div>
              <div>
                <dt className="text-[12px] uppercase tracking-wide text-zinc-500">Phone</dt>
                <dd>
                  <a href={phoneHref(r.phone)} className="font-medium text-zinc-900 underline">
                    {r.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[12px] uppercase tracking-wide text-zinc-500">Email</dt>
                <dd className="break-all">
                  <a href={`mailto:${r.email}?subject=${encodeURIComponent(`Your order request ${ref}`)}`} className="font-medium text-zinc-900 underline">
                    {r.email}
                  </a>
                </dd>
              </div>
            </dl>
          </Card>
          <Card title="Email alert">
            <p className="flex flex-wrap items-center gap-2 text-[14px] text-zinc-700">
              {NOTIFY_LABELS[r.notifyStatus]}
              {notEmailed(r.notifyStatus) && <Tag tone="red">Not emailed</Tag>}
            </p>
          </Card>
          <OrderDetailActions id={r.id} reference={ref} status={r.status} note={r.internalNotes} />
        </div>
      </div>
    </>
  );
}
