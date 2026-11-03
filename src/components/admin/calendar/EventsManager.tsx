"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteEvent, saveEvent } from "@/actions/events";
import type { SiteEvent } from "@/db/schema";
import { ConfirmDialog, Drawer } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { useAction } from "@/components/admin/useAction";
import { Btn, Card, Checkbox, EmptyState, Field, Input, Select, Tag, Textarea } from "@/components/admin/ui";
import { EVENT_KINDS, eventKindLabel, type EventKind } from "@/lib/event-kinds";
import { longDate, time12 } from "@/lib/format";

/** NW01 admin: full CRUD for calendar events, plus the optional event type
 *  (B6, in scope per Pol 3 Nov) that picks the icon on /calendar. */
export function EventsManager({ events, kinds, today }: { events: SiteEvent[]; kinds: Record<number, EventKind>; today: string }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<SiteEvent | null | "new">(null);
  const [deleting, setDeleting] = useState<SiteEvent | null>(null);
  const { busy, run } = useAction();

  const upcoming = events.filter((e) => e.date >= today);
  const past = events.filter((e) => e.date < today).reverse();

  const remove = async () => {
    if (!deleting) return;
    const res = await run(() => deleteEvent(deleting.id));
    setDeleting(null);
    if (res.ok) {
      toast.success("Event removed");
      router.refresh();
    } else toast.error(res.error);
  };

  const row = (e: SiteEvent) => (
    <li key={e.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-[14px]">
      <span className="w-44 font-medium text-zinc-900">{longDate(e.date, { weekday: true, year: true })}</span>
      <span className="min-w-0 flex-1 truncate text-zinc-700">{e.title}</span>
      {kinds[e.id] && <Tag tone="blue">{eventKindLabel(kinds[e.id])}</Tag>}
      {e.startTime && (
        <span className="text-zinc-500">
          {time12(e.startTime)}
          {e.endTime ? ` – ${time12(e.endTime)}` : ""}
        </span>
      )}
      {!e.active && <Tag tone="gray">Hidden</Tag>}
      <Btn size="sm" onClick={() => setEditing(e)}>Edit</Btn>
      <Btn size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleting(e)}>Remove</Btn>
    </li>
  );

  return (
    <div className="space-y-6">
      <Card
        title="Upcoming events"
        description="Guests see these on /calendar, in the month grid and the list."
        padded={false}
        actions={<Btn size="sm" variant="primary" onClick={() => setEditing("new")}>+ Add event</Btn>}
      >
        {upcoming.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Nothing scheduled" body="Add live music nights, specials, pop-ups or community events." action={<Btn variant="primary" onClick={() => setEditing("new")}>+ Add event</Btn>} />
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">{upcoming.map(row)}</ul>
        )}
      </Card>

      {past.length > 0 && (
        <Card title="Past events" description="Kept for reuse; they no longer show on the site calendar unless a guest browses back." padded={false}>
          <ul className="divide-y divide-zinc-100">{past.map(row)}</ul>
        </Card>
      )}

      <Drawer open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add an event" : "Edit event"} width="max-w-md">
        {editing !== null && (
          <EventForm key={editing === "new" ? "new" : editing.id} e={editing === "new" ? null : editing} kind={editing === "new" ? null : (kinds[editing.id] ?? null)} onDone={() => { setEditing(null); router.refresh(); }} />
        )}
      </Drawer>
      <ConfirmDialog
        open={!!deleting}
        title="Remove this event?"
        body="It disappears from the public calendar immediately. This can't be undone."
        confirmLabel="Remove"
        loading={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function EventForm({ e, kind, onDone }: { e: SiteEvent | null; kind: EventKind | null; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({
    title: e?.title ?? "",
    date: e?.date ?? "",
    startTime: e?.startTime ?? "",
    endTime: e?.endTime ?? "",
    description: e?.description ?? "",
    linkUrl: e?.linkUrl ?? "",
    linkLabel: e?.linkLabel ?? "",
    active: e?.active ?? true,
    kind: (kind ?? "") as EventKind | "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { busy, run } = useAction();

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const res = await run(() => saveEvent({ id: e?.id, ...f }));
    if (res.ok) {
      if (res.data.kindSkipped) toast.success("Event saved", "The event type needs a one-time database update (npm run db:push) before it can be stored.");
      else toast.success("Event saved", "Live on the website now.");
      onDone();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Title" htmlFor="e-title" error={errors.title} required>
        <Input id="e-title" value={f.title} onChange={(ev) => setF({ ...f, title: ev.target.value })} placeholder="Live music: The Pit Crew" required />
      </Field>
      <Field label="Date" htmlFor="e-date" error={errors.date} required>
        <Input id="e-date" type="date" value={f.date} onChange={(ev) => setF({ ...f, date: ev.target.value })} required />
      </Field>
      <Field label="Type" htmlFor="e-kind" error={errors.kind} hint="Picks the small icon on the public calendar">
        <Select id="e-kind" value={f.kind} onChange={(ev) => setF({ ...f, kind: ev.target.value as EventKind | "" })}>
          <option value="">No type</option>
          {EVENT_KINDS.map((k) => (
            <option key={k.key} value={k.key}>
              {k.label}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Starts" htmlFor="e-start" error={errors.startTime} hint="Leave blank for all-day">
          <Input id="e-start" type="time" value={f.startTime} onChange={(ev) => setF({ ...f, startTime: ev.target.value })} />
        </Field>
        <Field label="Ends" htmlFor="e-end" error={errors.endTime}>
          <Input id="e-end" type="time" value={f.endTime} onChange={(ev) => setF({ ...f, endTime: ev.target.value })} />
        </Field>
      </div>
      <Field label="Details" htmlFor="e-desc" error={errors.description} hint="Shown in the pop-out and the list">
        <Textarea id="e-desc" value={f.description} onChange={(ev) => setF({ ...f, description: ev.target.value })} maxLength={600} />
      </Field>
      <Field label="Link" htmlFor="e-link" error={errors.linkUrl} hint="Optional: tickets, Instagram post, menu…">
        <Input id="e-link" value={f.linkUrl} onChange={(ev) => setF({ ...f, linkUrl: ev.target.value })} placeholder="https://…" />
      </Field>
      <Field label="Link label" htmlFor="e-link-label" error={errors.linkLabel}>
        <Input id="e-link-label" value={f.linkLabel} onChange={(ev) => setF({ ...f, linkLabel: ev.target.value })} placeholder="Details" />
      </Field>
      <Checkbox checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Show on the website" />
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onDone}>Cancel</Btn>
        <Btn type="submit" variant="primary" loading={busy}>Save</Btn>
      </div>
    </form>
  );
}
