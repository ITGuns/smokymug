"use client";

/* eslint-disable @next/next/no-img-element -- admin thumbnails of admin uploads */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteOrderItem, reorderOrderItems, saveOrderingSettings, setOrderItemActive } from "@/actions/ordering-admin";
import { ImageUpload } from "@/components/admin/menu/ImageUpload";
import { ConfirmDialog, Drawer } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { useAction } from "@/components/admin/useAction";
import { Btn, Card, EmptyState, Field, Input, Tag, Toggle } from "@/components/admin/ui";
import type { OrderItem, OrderMenu } from "@/db/schema";
import type { OrderingSettings } from "@/lib/data/ordering";
import { NEEDS_DB_PUSH } from "@/lib/db-errors";
import { money } from "@/lib/format";
import { ORDER_MENU_INFO } from "@/lib/ordering";
import { OrderItemForm } from "./OrderItemForm";

/**
 * Phase 2 admin (docs/phase2-ordering-spec.md 4.5): one card per ordering menu
 * (switch, subtitle, lead time, holiday window, tile photo, then its items) and
 * the ALL DAY tile photo. Both switches ship OFF.
 */
type Props = {
  settings: OrderingSettings;
  items: Record<OrderMenu, OrderItem[]>;
  mailOn: boolean;
  defaults: { expressSubtitle: string; tiles: { allDay: string; express: string; holiday: string } };
};

export function OrderingManager({ settings, items, mailOn, defaults }: Props) {
  return (
    <div className="space-y-6">
      {!settings.available && <p className="rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">{NEEDS_DB_PUSH}</p>}
      <MenuCard menu="express" settings={settings} items={items.express} mailOn={mailOn} defaults={defaults} />
      <MenuCard menu="holiday" settings={settings} items={items.holiday} mailOn={mailOn} defaults={defaults} />
      <AllDayTileCard settings={settings} defaultImage={defaults.tiles.allDay} />
    </div>
  );
}

function MenuCard({ menu, settings: s, items, mailOn, defaults }: { menu: OrderMenu; settings: OrderingSettings; items: OrderItem[]; mailOn: boolean; defaults: Props["defaults"] }) {
  const router = useRouter();
  const toast = useToast();
  const info = ORDER_MENU_INFO[menu];
  const express = menu === "express";
  const row = s.row;
  const [f, setF] = useState({
    enabled: express ? s.expressEnabled : s.holidayEnabled,
    subtitle: (express ? row?.expressSubtitle : row?.holidaySubtitle) ?? "",
    leadHours: String(express ? s.expressLeadHours : s.holidayLeadHours),
    pickupFrom: s.holidayPickupFrom ?? "",
    pickupTo: s.holidayPickupTo ?? "",
    tileImage: (express ? row?.tileImageExpress : row?.tileImageHoliday) ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<OrderItem | "new" | null>(null);
  const [removing, setRemoving] = useState<OrderItem | null>(null);
  const saveAction = useAction();
  const rowAction = useAction();
  const removeAction = useAction();
  const set = (patch: Partial<typeof f>) => setF((prev) => ({ ...prev, ...patch }));
  const live = express ? s.expressOn : s.holidayOn;
  const p = `om-${menu}`;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = express
      ? { menu, enabled: f.enabled, subtitle: f.subtitle, leadHours: f.leadHours, tileImage: f.tileImage }
      : { menu, enabled: f.enabled, subtitle: f.subtitle, leadHours: f.leadHours, pickupFrom: f.pickupFrom, pickupTo: f.pickupTo, tileImage: f.tileImage };
    const res = await saveAction.run(() => saveOrderingSettings(payload));
    if (res.ok) {
      setErrors({});
      toast.success(`${info.title} saved`, f.enabled ? `${info.path} is taking requests.` : `${info.path} is off (404).`);
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const ids = items.map((x) => x.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    const res = await rowAction.run(() => reorderOrderItems({ menu, ids }));
    if (res.ok) router.refresh();
    else toast.error(res.error);
  };

  const toggle = async (item: OrderItem) => {
    const res = await rowAction.run(() => setOrderItemActive({ id: item.id, active: !item.active }));
    if (res.ok) {
      toast.success(item.active ? "Item hidden" : "Item shown");
      router.refresh();
    } else toast.error(res.error);
  };

  const remove = async () => {
    if (!removing) return;
    const res = await removeAction.run(() => deleteOrderItem(removing.id));
    setRemoving(null);
    if (res.ok) {
      toast.success("Item deleted", "Requests already sent keep their copy of it.");
      router.refresh();
    } else toast.error(res.error);
  };

  const statusText = live
    ? `Live: ${info.path} takes requests${express ? ", and Explore Menu, the Menus tile and the catering page button point to it" : " and shows as the third Explore Menu option"}.`
    : f.enabled && !express && !s.holidayOn && s.holidayEnabled
      ? "Switched on, but the last pickup day has passed, so the page is off. Set new pickup dates."
      : express
        ? "Off: Explore Menu and the Menus tile go to /catering, the ordering page returns a 404 and the catering page button is hidden."
        : "Off: the Menus tile shows its subtitle without a link, Explore Menu shows two options, and the ordering page returns a 404.";

  return (
    <Card title={info.title} description={statusText}>
      <form onSubmit={save} className="max-w-2xl space-y-4" aria-label={`${info.title} settings`}>
        <Toggle
          checked={f.enabled}
          onChange={(v) => set({ enabled: v })}
          label={`Take ${info.title} requests`}
          description={mailOn ? "Each request is emailed to the catering address and stays in Orders." : "Email alerts are not set up. New requests only show in Orders."}
          disabled={!s.available}
        />
        {errors.enabled && <p className="text-[12px] font-medium text-red-600">{errors.enabled}</p>}
        <Field label="Subtitle" htmlFor={`${p}-subtitle`} error={errors.subtitle} hint={express ? `Shown on the Menus tile and the page. Empty = "${defaults.expressSubtitle}".` : 'Shown on the Menus tile and the page, for example "Back for Thanksgiving".'}>
          <Input id={`${p}-subtitle`} value={f.subtitle} onChange={(e) => set({ subtitle: e.target.value })} maxLength={200} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Order ahead (hours)" htmlFor={`${p}-lead`} error={errors.leadHours} hint="Earliest pickup from now.">
            <Input id={`${p}-lead`} type="number" min={0} max={336} value={f.leadHours} onChange={(e) => set({ leadHours: e.target.value })} />
          </Field>
          {!express && (
            <>
              <Field label="First pickup day" htmlFor={`${p}-from`} error={errors.pickupFrom}>
                <Input id={`${p}-from`} type="date" value={f.pickupFrom} onChange={(e) => set({ pickupFrom: e.target.value })} />
              </Field>
              <Field label="Last pickup day" htmlFor={`${p}-to`} error={errors.pickupTo}>
                <Input id={`${p}-to`} type="date" value={f.pickupTo} onChange={(e) => set({ pickupTo: e.target.value })} />
              </Field>
            </>
          )}
        </div>
        <p className="text-[12px] text-zinc-500">Pickup times are every 30 minutes inside store hours, never the last 30 minutes, up to 60 days ahead. Closed days in Hours apply.</p>
        <Field label="Menus tile photo" error={errors.tileImage} hint={`Empty = the default photo (${defaults.tiles[menu]}).`}>
          <ImageUpload value={f.tileImage} onChange={(v) => set({ tileImage: v })} />
        </Field>
        <div className="flex justify-end">
          <Btn type="submit" variant="primary" loading={saveAction.busy} disabled={!s.available}>
            Save {info.title}
          </Btn>
        </div>
      </form>

      <div className="mt-6 border-t border-zinc-100 pt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-[14px] font-semibold text-zinc-900">Items</h3>
          <Btn size="sm" variant="primary" disabled={!s.available} onClick={() => setEditing("new")}>
            + Add item
          </Btn>
        </div>
        {items.length === 0 ? (
          <EmptyState title="No items yet" body={`Add what guests can request. ${info.title} can only be switched on once it has a visible item.`} />
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200" aria-label={`${info.title} items`}>
            {items.map((item, i) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
                <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-100">{item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-[14px]">
                    <span className="font-medium text-zinc-900">{item.name}</span>
                    <span className="tabular-nums text-zinc-600">{item.price == null ? "Price on request" : money(item.price)}</span>
                    {item.priceNote && <span className="text-zinc-500">{item.priceNote}</span>}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-zinc-500">
                    <span>
                      Order {item.minQty} to {item.maxQty}
                    </span>
                    {!item.active && <Tag>Hidden</Tag>}
                  </p>
                </div>
                <div className="ml-auto flex shrink-0 gap-1">
                  <Btn size="sm" variant="ghost" aria-label={`Move ${item.name} up`} disabled={i === 0 || rowAction.busy} onClick={() => void move(i, -1)}>
                    ↑
                  </Btn>
                  <Btn size="sm" variant="ghost" aria-label={`Move ${item.name} down`} disabled={i === items.length - 1 || rowAction.busy} onClick={() => void move(i, 1)}>
                    ↓
                  </Btn>
                  <Btn size="sm" aria-label={`Edit ${item.name}`} onClick={() => setEditing(item)}>
                    Edit
                  </Btn>
                  <Btn size="sm" variant="ghost" aria-label={`${item.active ? "Hide" : "Show"} ${item.name}`} disabled={rowAction.busy} onClick={() => void toggle(item)}>
                    {item.active ? "Hide" : "Show"}
                  </Btn>
                  <Btn size="sm" variant="dangerGhost" aria-label={`Delete ${item.name}`} onClick={() => setRemoving(item)}>
                    Delete
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Drawer open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? `Add an item to ${info.title}` : "Edit item"} width="max-w-lg">
        {editing !== null && (
          <OrderItemForm
            key={editing === "new" ? "new" : editing.id}
            menu={menu}
            item={editing === "new" ? null : editing}
            onDone={() => {
              setEditing(null);
              router.refresh();
            }}
          />
        )}
      </Drawer>
      <ConfirmDialog
        open={!!removing}
        title={`Delete ${removing?.name ?? "this item"}?`}
        body="It comes off the ordering page right away. Requests already sent keep their own copy of the name and price. To keep it for later, use Hide instead."
        confirmLabel="Delete item"
        loading={removeAction.busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </Card>
  );
}

function AllDayTileCard({ settings: s, defaultImage }: { settings: OrderingSettings; defaultImage: string }) {
  const router = useRouter();
  const toast = useToast();
  const [image, setImage] = useState(s.row?.tileImageAllDay ?? "");
  const [error, setError] = useState<string | undefined>();
  const { busy, run } = useAction();
  const save = async () => {
    const res = await run(() => saveOrderingSettings({ menu: "allDay", tileImage: image }));
    if (res.ok) {
      setError(undefined);
      toast.success("Tile photo saved");
      router.refresh();
    } else {
      setError(res.fieldErrors?.tileImage);
      toast.error(res.error);
    }
  };
  return (
    <Card title="ALL DAY CRAFT TEX MEX & BBQ tile" description="The Menus page tile that opens the restaurant menu. Its text is the board's and is not edited here.">
      <div className="max-w-2xl space-y-4">
        <Field label="Tile photo" error={error} hint={`Empty = the default photo (${defaultImage}).`}>
          <ImageUpload value={image} onChange={setImage} />
        </Field>
        <div className="flex justify-end">
          <Btn variant="primary" loading={busy} disabled={!s.available} onClick={() => void save()}>
            Save tile photo
          </Btn>
        </div>
      </div>
    </Card>
  );
}
