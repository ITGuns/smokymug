"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteCateringInquiry, deleteOrderRequest } from "@/actions/ordering-admin";
import { ConfirmDialog } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { useAction } from "@/components/admin/useAction";
import { Btn, Card, EmptyState, Tag } from "@/components/admin/ui";
import type { CateringInquiry } from "@/db/schema";
import type { OrderRequestWithLines } from "@/lib/data/ordering";
import { formatRelative, money, shortDate, time12 } from "@/lib/format";
import { notEmailed, ORDER_MENU_INFO, orderReference } from "@/lib/ordering";
import { OrderStatusTag } from "./OrderStatusTag";

/** Phase 2 Orders inbox (spec 4.5): one row per request, delete behind a confirm. */
export function OrderRequestsTable({ rows, filtered }: { rows: OrderRequestWithLines[]; filtered: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [removing, setRemoving] = useState<OrderRequestWithLines | null>(null);
  const { busy, run } = useAction();

  const remove = async () => {
    if (!removing) return;
    const res = await run(() => deleteOrderRequest(removing.id));
    setRemoving(null);
    if (res.ok) {
      toast.success("Request deleted");
      router.refresh();
    } else toast.error(res.error);
  };

  if (rows.length === 0) {
    return <EmptyState title={filtered ? "No requests match these filters" : "No order requests yet"} body="Requests from Express Catering and Holiday Preorders land here." />;
  }

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-[14px]">
          <thead className="bg-zinc-50 text-left text-[12px] uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Request</th>
              <th className="px-3 py-2 font-medium">Pickup</th>
              <th className="px-3 py-2 font-medium">Guest</th>
              <th className="px-3 py-2 font-medium">Items</th>
              <th className="px-3 py-2 font-medium">Estimate</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => {
              const ref = orderReference(r.menu, r.id);
              return (
                <tr key={r.id} className="align-top hover:bg-zinc-50" data-order-row={ref}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${r.id}`} className="font-medium text-zinc-900 hover:underline">
                      {ref}
                    </Link>
                    <p className="text-[12px] text-zinc-500">{ORDER_MENU_INFO[r.menu].title}</p>
                    <p className="text-[12px] text-zinc-500">Received {formatRelative(r.createdAt)}</p>
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    <p className="font-medium text-zinc-900">{shortDate(r.pickupDate)}</p>
                    <p className="text-zinc-600">{time12(r.pickupTime)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-zinc-900">{r.name}</p>
                    <p className="text-zinc-600">{r.phone}</p>
                  </td>
                  <td className="max-w-[260px] px-3 py-3 text-zinc-700">{r.lines.map((l) => `${l.quantity} x ${l.name}`).join(", ")}</td>
                  <td className="px-3 py-3 tabular-nums text-zinc-700">{r.estimatedTotal == null ? "To confirm" : money(r.estimatedTotal)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <OrderStatusTag status={r.status} />
                      {notEmailed(r.notifyStatus) && <Tag tone="red">Not emailed</Tag>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Btn size="sm" variant="dangerGhost" aria-label={`Delete request ${ref}`} onClick={() => setRemoving(r)}>
                        Delete
                      </Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={!!removing}
        title={`Delete request ${removing ? orderReference(removing.menu, removing.id) : ""}?`}
        body="The request and its items are removed for good. The guest is not told."
        confirmLabel="Delete request"
        loading={busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </Card>
  );
}

/** P8 (4 Nov): catering inquiries were stored with PII but had no admin view. List + delete. */
export function CateringInquiriesTable({ rows }: { rows: CateringInquiry[] }) {
  const router = useRouter();
  const toast = useToast();
  const [removing, setRemoving] = useState<CateringInquiry | null>(null);
  const { busy, run } = useAction();

  const remove = async () => {
    if (!removing) return;
    const res = await run(() => deleteCateringInquiry(removing.id));
    setRemoving(null);
    if (res.ok) {
      toast.success("Inquiry deleted");
      router.refresh();
    } else toast.error(res.error);
  };

  if (rows.length === 0) return <EmptyState title="No catering inquiries yet" body="Inquiries from the catering page form land here." />;

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-[14px]">
          <thead className="bg-zinc-50 text-left text-[12px] uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Guest</th>
              <th className="px-3 py-2 font-medium">Occasion</th>
              <th className="px-3 py-2 font-medium">Event date</th>
              <th className="px-3 py-2 font-medium">Guests</th>
              <th className="px-3 py-2 font-medium">Service</th>
              <th className="px-3 py-2 font-medium">Received</th>
              <th className="px-4 py-2 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((q) => (
              <tr key={q.id} className="align-top hover:bg-zinc-50" data-inquiry-row={q.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/catering/${q.id}`} className="font-medium text-zinc-900 hover:underline">
                    {q.name}
                  </Link>
                  <p className="text-zinc-600">{q.email}</p>
                </td>
                <td className="px-3 py-3 text-zinc-700">{q.occasion}</td>
                <td className="px-3 py-3 tabular-nums text-zinc-700">{q.eventDate ? shortDate(q.eventDate) : "Not given"}</td>
                <td className="px-3 py-3 tabular-nums text-zinc-700">{q.guestCount ?? "Not given"}</td>
                <td className="px-3 py-3 text-zinc-700">{q.serviceType}</td>
                <td className="px-3 py-3 text-zinc-600">{formatRelative(q.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Btn size="sm" variant="dangerGhost" aria-label={`Delete inquiry from ${q.name}`} onClick={() => setRemoving(q)}>
                      Delete
                    </Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={!!removing}
        title="Delete this inquiry?"
        body="It is removed for good. The guest is not told."
        confirmLabel="Delete inquiry"
        loading={busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </Card>
  );
}
