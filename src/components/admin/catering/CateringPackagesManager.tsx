"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteCateringPackage, reorderCateringPackages, saveCateringPackage } from "@/actions/catering-packages";
import { ConfirmDialog, Drawer } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { useAction } from "@/components/admin/useAction";
import { Btn, Card, Checkbox, EmptyState, Field, Input, Spinner, Tag, Textarea } from "@/components/admin/ui";
import type { CateringPackage } from "@/db/schema";
import { cn } from "@/lib/cn";

// Audit F12 (18 Nov 2026): the packages on /catering. Add, edit, show or hide,
// remove and reorder, like the gallery. The page intro and the inquiry form stay in code.

type Dir = "up" | "down";

export function CateringPackagesManager({ packages }: { packages: CateringPackage[] }) {
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState(packages);
  const [editing, setEditing] = useState<CateringPackage | "new" | null>(null);
  const [removing, setRemoving] = useState<CateringPackage | null>(null);
  const { busy: saving, run } = useAction();
  const removeAction = useAction();
  useEffect(() => setList(packages), [packages]);

  const save = async (next: CateringPackage[]) => {
    const res = await run(() => reorderCateringPackages(next.map((p) => p.id)));
    if (res.ok) {
      toast.success("Package order saved");
      router.refresh();
    } else {
      setList(packages);
      toast.error(res.error);
    }
  };

  const move = (index: number, dir: Dir) => {
    const target = dir === "up" ? index - 1 : index + 1;
    if (saving || target < 0 || target >= list.length) return;
    const next = list.map((p, i) => (i === index ? list[target] : i === target ? list[index] : p));
    setList(next);
    refocus(list[index].id, dir);
    void save(next);
  };

  const remove = async () => {
    if (!removing) return;
    const { id } = removing;
    const res = await removeAction.run(() => deleteCateringPackage(id));
    setRemoving(null);
    if (res.ok) {
      // Drop the row now so a reorder made before the refresh lands isn't refused as stale.
      setList((l) => l.filter((x) => x.id !== id));
      toast.success("Package removed", "It's off the catering page.");
      router.refresh();
    } else toast.error(res.error);
  };

  const addButton = (
    <Btn size="sm" variant="primary" onClick={() => setEditing("new")}>
      + Add package
    </Btn>
  );
  const hiddenCount = list.filter((p) => !p.visible).length;

  return (
    <>
      {list.length === 0 ? (
        <EmptyState title="No catering packages yet" body="Packages show as cards under What we cater on /catering. With none, that row is left off." action={addButton} />
      ) : (
        <Card
          title="Packages"
          description={`Top of the list shows first.${hiddenCount ? ` ${hiddenCount} hidden package${hiddenCount === 1 ? " keeps its" : "s keep their"} place but stays off the site.` : ""}`}
          actions={
            <div className="flex shrink-0 items-center gap-3">
              {saving && <span className="flex items-center gap-2 text-[13px] text-zinc-500"><Spinner /> Saving…</span>}
              {addButton}
            </div>
          }
          padded={false}
        >
          <ul className="divide-y divide-zinc-100" aria-label="Catering package order">
            {list.map((p, i) => {
              const position = i + 1;
              return (
                <li key={p.id} className={cn("flex flex-wrap items-center gap-3 bg-white px-4 py-2.5 sm:flex-nowrap", !p.visible && "opacity-60")}>
                  <span className="w-6 shrink-0 text-right text-[12px] tabular-nums text-zinc-500">{position}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[14px] font-medium text-zinc-900">
                      <span className="truncate">{p.name}</span>
                      {!p.visible && <Tag tone="gray" className="shrink-0">Hidden</Tag>}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-zinc-500">
                      {[p.priceLine, p.includes.length ? `${p.includes.length} included line${p.includes.length === 1 ? "" : "s"}` : null, p.blurb].filter(Boolean).join(" · ") || "No details yet"}
                    </p>
                  </div>
                  <div className="ml-auto flex shrink-0 gap-1">
                    <Btn size="sm" variant="ghost" data-move={`${p.id}-up`} aria-label={`Move ${p.name} up`} aria-disabled={saving} disabled={position === 1} onClick={() => move(i, "up")}>↑</Btn>
                    <Btn size="sm" variant="ghost" data-move={`${p.id}-down`} aria-label={`Move ${p.name} down`} aria-disabled={saving} disabled={position === list.length} onClick={() => move(i, "down")}>↓</Btn>
                    <Btn size="sm" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}>Edit</Btn>
                    <Btn size="sm" variant="dangerGhost" aria-label={`Remove ${p.name}`} onClick={() => setRemoving(p)}>Remove</Btn>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Drawer open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add a package" : "Edit package"} width="max-w-md">
        {editing !== null && (
          <PackageForm key={editing === "new" ? "new" : editing.id} pkg={editing === "new" ? null : editing} onDone={() => { setEditing(null); router.refresh(); }} />
        )}
      </Drawer>
      <ConfirmDialog
        open={!!removing}
        title="Remove this package?"
        body="It comes off the catering page right away and can't be brought back here. To keep it for later, edit it and untick Show on the website."
        confirmLabel="Remove package"
        loading={removeAction.busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}

/** React re-inserts the moved row's DOM node, which drops focus; put it back on the arrow the user pressed. */
function refocus(id: number, dir: Dir) {
  requestAnimationFrame(() => {
    const same = document.querySelector<HTMLButtonElement>(`[data-move="${id}-${dir}"]:not(:disabled)`);
    const other = document.querySelector<HTMLButtonElement>(`[data-move="${id}-${dir === "up" ? "down" : "up"}"]`);
    (same ?? other)?.focus();
  });
}

/** Add (pkg = null, lands at the end) or edit one package. */
function PackageForm({ pkg, onDone }: { pkg: CateringPackage | null; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({
    name: pkg?.name ?? "",
    blurb: pkg?.blurb ?? "",
    priceLine: pkg?.priceLine ?? "",
    includes: pkg?.includes.join("\n") ?? "",
    visible: pkg?.visible ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { busy, run } = useAction();

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const res = await run(() => saveCateringPackage({ ...f, id: pkg?.id }));
    if (res.ok) {
      toast.success(pkg ? "Package saved" : "Package added", pkg ? "Live on the catering page now." : "It sits at the end of the list. Move it up to show it sooner.");
      onDone();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name" htmlFor="cp-name" error={errors.name} required>
        <Input id="cp-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={60} required error={!!errors.name} aria-invalid={!!errors.name || undefined} />
      </Field>
      <Field label="Description" htmlFor="cp-blurb" error={errors.blurb} hint="A sentence or two under the name.">
        <Textarea id="cp-blurb" value={f.blurb} onChange={(e) => setF({ ...f, blurb: e.target.value })} maxLength={400} rows={3} error={!!errors.blurb} aria-invalid={!!errors.blurb || undefined} />
      </Field>
      <Field label="Price line" htmlFor="cp-price" error={errors.priceLine} hint="Optional. Shown at the bottom of the card, as you type it.">
        <Input id="cp-price" value={f.priceLine} onChange={(e) => setF({ ...f, priceLine: e.target.value })} maxLength={80} error={!!errors.priceLine} aria-invalid={!!errors.priceLine || undefined} />
      </Field>
      <Field label="Included, one per line" htmlFor="cp-includes" error={errors.includes} hint="Optional. Each line shows as a bullet. Blank lines are skipped.">
        <Textarea id="cp-includes" value={f.includes} onChange={(e) => setF({ ...f, includes: e.target.value })} rows={5} error={!!errors.includes} aria-invalid={!!errors.includes || undefined} />
      </Field>
      <Checkbox checked={f.visible} onChange={(v) => setF({ ...f, visible: v })} label="Show on the website" />
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onDone}>Cancel</Btn>
        <Btn type="submit" variant="primary" loading={busy}>{pkg ? "Save" : "Add package"}</Btn>
      </div>
    </form>
  );
}
