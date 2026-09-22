"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveHoursCategory } from "@/actions/hours";
import type { Hours, HoursCategory } from "@/db/schema";
import { HOURS_CATEGORIES } from "@/db/schema";
import { useToast } from "@/components/admin/toast";
import { Btn, Card, Input } from "@/components/admin/ui";
import { DAY_NAMES, HOURS_CATEGORY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";

type Row = { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean; note: string };
const ORDER = [1, 2, 3, 4, 5, 6, 0];

const HELP: Partial<Record<HoursCategory, string>> = {
  store: "Drives the open/closed indicator, footer, structured data and every 'from opening' window below.",
  breakfast: "Leave 'opens' blank to mean 'from store opening'. The scrape notes conflicting copy (website: Tue–Sat; menu image: Mon–Sat, grill Wed–Sat). Set what's true.",
  happy_hour: "Website copy says Wed–Sat; the bar menu image says Wed–Sun. Add Sunday here if you run it.",
  cafe_drinks: "'til 7pm (or close, if earlier). The earlier of this and store close is used.",
};

function toRows(rows: Hours[], category: HoursCategory): Row[] {
  return ORDER.map((d) => {
    const r = rows.find((h) => h.category === category && h.dayOfWeek === d);
    return r ? { dayOfWeek: d, opensAt: r.opensAt ?? "", closesAt: r.closesAt ?? "", isClosed: r.isClosed, note: r.note ?? "" } : { dayOfWeek: d, opensAt: "", closesAt: "", isClosed: true, note: "" };
  });
}

export function HoursEditor({ hours }: { hours: Hours[] }) {
  const router = useRouter();
  const toast = useToast();
  const [category, setCategory] = useState<HoursCategory>("store");
  const [state, setState] = useState<Record<HoursCategory, Row[]>>(() => Object.fromEntries(HOURS_CATEGORIES.map((c) => [c, toRows(hours, c)])) as Record<HoursCategory, Row[]>);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const rows = state[category];
  const update = (i: number, patch: Partial<Row>) => setState({ ...state, [category]: rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) });

  const save = async () => {
    setBusy(true);
    setErrors({});
    const payload = rows.filter((r) => !(r.isClosed && !r.note)).map((r) => ({ ...r, opensAt: r.opensAt || null, closesAt: r.closesAt || null }));
    const res = await saveHoursCategory(category, payload);
    setBusy(false);
    if (res.ok) {
      toast.success(`${HOURS_CATEGORY_LABELS[category]} saved`, "Live on the website now.");
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };

  const copyToAll = (i: number) => {
    const src = rows[i];
    setState({ ...state, [category]: rows.map((r) => ({ ...r, opensAt: src.opensAt, closesAt: src.closesAt, isClosed: src.isClosed })) });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="lg:sticky lg:top-8 lg:self-start" aria-label="Hours categories">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {HOURS_CATEGORIES.map((c) => (
            <li key={c}>
              <button type="button" onClick={() => setCategory(c)} className={cn("w-full whitespace-nowrap rounded-lg px-3 py-2 text-left text-[14px] font-medium transition", c === category ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100")}>
                {HOURS_CATEGORY_LABELS[c]}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <Card title={HOURS_CATEGORY_LABELS[category]} description={HELP[category] ?? "Leave 'opens' blank to inherit the store opening time for that day."} padded={false} actions={<Btn variant="primary" onClick={save} loading={busy}>Save {HOURS_CATEGORY_LABELS[category].toLowerCase()}</Btn>}>
        <table className="w-full text-[14px]">
          <thead className="bg-zinc-50 text-left text-[12px] uppercase tracking-wide text-zinc-500">
            <tr><th className="px-4 py-2 font-medium">Day</th><th className="px-3 py-2 font-medium">Closed</th><th className="px-3 py-2 font-medium">Opens</th><th className="px-3 py-2 font-medium">Closes</th><th className="px-3 py-2 font-medium">Note</th><th className="px-3 py-2" /></tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r, i) => (
              <tr key={r.dayOfWeek} className={cn(r.isClosed && "bg-zinc-50/60")}>
                <td className="px-4 py-2 font-medium text-zinc-900">{DAY_NAMES[r.dayOfWeek]}</td>
                <td className="px-3 py-2"><input type="checkbox" checked={r.isClosed} onChange={(e) => update(i, { isClosed: e.target.checked })} className="h-4 w-4 accent-zinc-900" aria-label={`${DAY_NAMES[r.dayOfWeek]} closed`} /></td>
                <td className="px-3 py-2"><Input type="time" value={r.opensAt} onChange={(e) => update(i, { opensAt: e.target.value })} disabled={r.isClosed} className="w-32" error={!!errors[`${r.dayOfWeek}.opensAt`]} aria-label={`${DAY_NAMES[r.dayOfWeek]} opens`} placeholder="from open" /></td>
                <td className="px-3 py-2"><Input type="time" value={r.closesAt} onChange={(e) => update(i, { closesAt: e.target.value })} disabled={r.isClosed} className="w-32" error={!!errors[`${r.dayOfWeek}.closesAt`]} aria-label={`${DAY_NAMES[r.dayOfWeek]} closes`} />{errors[`${r.dayOfWeek}.closesAt`] && <p className="text-[11px] text-red-600">{errors[`${r.dayOfWeek}.closesAt`]}</p>}</td>
                <td className="px-3 py-2"><Input value={r.note} onChange={(e) => update(i, { note: e.target.value })} placeholder="Optional" aria-label={`${DAY_NAMES[r.dayOfWeek]} note`} /></td>
                <td className="px-3 py-2 text-right"><Btn size="sm" variant="ghost" onClick={() => copyToAll(i)} title="Copy these times to every day">Copy to all</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
