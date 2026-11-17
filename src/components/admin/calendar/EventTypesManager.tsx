"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addEventKindType, deleteEventKindType, renameEventKindType } from "@/actions/event-kind-types";
import { ConfirmDialog, Drawer } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { useAction } from "@/components/admin/useAction";
import { Btn, Card, Field, Input } from "@/components/admin/ui";
import { EventKindIcon } from "@/components/calendar/EventKindIcon";
import { NEEDS_DB_PUSH } from "@/lib/db-errors";
import type { KindOption } from "@/lib/event-kinds";

// Audit F11 (18 Nov 2026): the list the event form's Type picks from. Add, rename,
// and remove a type only while no event uses it (the server checks that too).

export function EventTypesManager({ types, uses, available }: { types: KindOption[]; uses: Record<string, number>; available: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<KindOption | "new" | null>(null);
  const [removing, setRemoving] = useState<KindOption | null>(null);
  const removeAction = useAction();

  const remove = async () => {
    if (!removing) return;
    const { key } = removing;
    const res = await removeAction.run(() => deleteEventKindType(key));
    setRemoving(null);
    if (res.ok) {
      toast.success("Event type removed");
      router.refresh();
    } else toast.error(res.error);
  };

  return (
    <>
      <Card
        title="Event types"
        description="The Type list on each event. A type picks the small icon on the public calendar; new types get a star."
        actions={available && <Btn size="sm" variant="primary" onClick={() => setEditing("new")}>+ Add type</Btn>}
        padded={false}
      >
        {!available && <p className="m-5 rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">{NEEDS_DB_PUSH}</p>}
        {types.length === 0 ? (
          <p className="px-5 py-4 text-[13px] text-zinc-500">No event types yet. Events show without an icon until you add one.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {types.map((t) => {
              const n = uses[t.key] ?? 0;
              return (
                <li key={t.key} className="flex flex-wrap items-center gap-3 px-5 py-2.5">
                  <EventKindIcon kind={t.key} className="text-zinc-500" />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-zinc-900">{t.label}</span>
                  <span className="text-[12px] text-zinc-500">{n ? `Used by ${n} event${n === 1 ? "" : "s"}` : "Not used"}</span>
                  {available && (
                    <div className="ml-auto flex shrink-0 gap-1">
                      <Btn size="sm" aria-label={`Rename ${t.label}`} onClick={() => setEditing(t)}>Rename</Btn>
                      {n === 0 && <Btn size="sm" variant="dangerGhost" aria-label={`Remove ${t.label}`} onClick={() => setRemoving(t)}>Remove</Btn>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Drawer open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add an event type" : "Rename event type"} width="max-w-md">
        {editing !== null && (
          <TypeForm key={editing === "new" ? "new" : editing.key} type={editing === "new" ? null : editing} onDone={() => { setEditing(null); router.refresh(); }} />
        )}
      </Drawer>
      <ConfirmDialog
        open={!!removing}
        title={`Remove ${removing?.label ?? "this type"}?`}
        body="No event uses it, so nothing on the calendar changes. It leaves the Type list."
        confirmLabel="Remove type"
        loading={removeAction.busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}

/** Add (type = null) or rename one type. The key stays as first made, so events keep their type. */
function TypeForm({ type, onDone }: { type: KindOption | null; onDone: () => void }) {
  const toast = useToast();
  const [label, setLabel] = useState(type?.label ?? "");
  const [error, setError] = useState<string>();
  const { busy, run } = useAction();

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const res = await run(() => (type ? renameEventKindType({ key: type.key, label }) : addEventKindType({ label })));
    if (res.ok) {
      toast.success(type ? "Event type renamed" : "Event type added", type ? undefined : "Pick it on any event above.");
      onDone();
    } else {
      setError(res.fieldErrors?.label);
      toast.error(res.error);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name" htmlFor="kt-label" error={error} hint="Shown in the calendar legend and on the event." required>
        <Input id="kt-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} required error={!!error} aria-invalid={!!error || undefined} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onDone}>Cancel</Btn>
        <Btn type="submit" variant="primary" loading={busy}>{type ? "Save" : "Add type"}</Btn>
      </div>
    </form>
  );
}
