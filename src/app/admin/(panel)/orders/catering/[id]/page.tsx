import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CateringInquiryDelete } from "@/components/admin/ordering/OrderDetailActions";
import { Card, PageHeader } from "@/components/admin/ui";
import { readCateringInquiry } from "@/lib/data/ordering";
import { formatRelative, longDate, phoneHref } from "@/lib/format";

export const metadata: Metadata = { title: "Catering inquiry" };

/** P8 (4 Nov): one catering inquiry, read-only, with delete. */
export default async function AdminCateringInquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const raw = (await params).id;
  const id = /^\d{1,9}$/.test(raw) ? Number(raw) : 0;
  const q = id > 0 ? await readCateringInquiry(id) : null;
  if (!q) notFound();

  const rows: [string, React.ReactNode][] = [
    ["Name", q.name],
    [
      "Email",
      <a key="e" href={`mailto:${q.email}`} className="break-all font-medium text-zinc-900 underline">
        {q.email}
      </a>,
    ],
    [
      "Phone",
      q.phone ? (
        <a key="p" href={phoneHref(q.phone)} className="font-medium text-zinc-900 underline">
          {q.phone}
        </a>
      ) : (
        "Not given"
      ),
    ],
    ["Occasion", q.occasion],
    ["Event date", q.eventDate ? longDate(q.eventDate, { weekday: true, year: true }) : "Not given"],
    ["Guests", q.guestCount ?? "Not given"],
    ["Service", q.serviceType],
  ];

  return (
    <>
      <Link href="/admin/orders?tab=catering" className="mb-3 inline-block text-[13px] font-medium text-zinc-600 hover:text-zinc-900">
        ← All catering inquiries
      </Link>
      <PageHeader title={`Catering inquiry · ${q.name}`} description={`Received ${formatRelative(q.createdAt)}. Reply by email or phone; the website sends nothing to the guest.`} actions={<CateringInquiryDelete id={q.id} name={q.name} />} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Details" className="xl:col-span-1">
          <dl className="space-y-2 text-[14px]">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[12px] uppercase tracking-wide text-zinc-500">{k}</dt>
                <dd className="text-zinc-900">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card title="Message" className="xl:col-span-2">
          {q.message ? <p className="whitespace-pre-wrap text-[14px] text-zinc-800">{q.message}</p> : <p className="text-[14px] text-zinc-500">No message.</p>}
        </Card>
      </div>
    </>
  );
}
