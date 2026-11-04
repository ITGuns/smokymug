"use client";

import { useState } from "react";
import { saveOrderItem } from "@/actions/ordering-admin";
import { ImageUpload } from "@/components/admin/menu/ImageUpload";
import { useToast } from "@/components/admin/toast";
import { useAction } from "@/components/admin/useAction";
import { Btn, centsToInput, Checkbox, Field, Input, Textarea } from "@/components/admin/ui";
import type { OrderItem, OrderMenu } from "@/db/schema";

/** Add (item = null) or edit one Express Catering pack or Holiday Preorder item. Dan's words and prices only. */
export function OrderItemForm({ menu, item, onDone }: { menu: OrderMenu; item: OrderItem | null; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({
    name: item?.name ?? "",
    description: item?.description ?? "",
    price: centsToInput(item?.price),
    priceNote: item?.priceNote ?? "",
    image: item?.image ?? "",
    imageAlt: item?.imageAlt ?? "",
    minQty: String(item?.minQty ?? 1),
    maxQty: String(item?.maxQty ?? 20),
    active: item?.active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { busy, run } = useAction();
  const set = (patch: Partial<typeof f>) => setF((prev) => ({ ...prev, ...patch }));

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const res = await run(() => saveOrderItem({ ...f, id: item?.id, menu }));
    if (res.ok) {
      toast.success(item ? "Item saved" : "Item added", f.active ? "Live on the ordering page while its switch is on." : "Hidden from the website.");
      onDone();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };

  const err = (k: keyof typeof f) => errors[k];
  const id = (k: string) => `oi-${k}`;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Name" htmlFor={id("name")} error={err("name")} required>
        <Input id={id("name")} value={f.name} onChange={(e) => set({ name: e.target.value })} maxLength={120} required aria-invalid={!!err("name") || undefined} />
      </Field>
      <Field label="What's in it" htmlFor={id("description")} error={err("description")} hint="Pack contents or a short description.">
        <Textarea id={id("description")} value={f.description} onChange={(e) => set({ description: e.target.value })} maxLength={600} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price ($)" htmlFor={id("price")} error={err("price")} hint='Leave blank to show "Price on request".'>
          <Input id={id("price")} inputMode="decimal" value={f.price} onChange={(e) => set({ price: e.target.value })} placeholder="e.g. 120" aria-invalid={!!err("price") || undefined} />
        </Field>
        <Field label="Price note" htmlFor={id("priceNote")} error={err("priceNote")} hint="For example a serving size.">
          <Input id={id("priceNote")} value={f.priceNote} onChange={(e) => set({ priceNote: e.target.value })} maxLength={60} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Minimum per order" htmlFor={id("minQty")} error={err("minQty")} required>
          <Input id={id("minQty")} type="number" min={1} max={100} value={f.minQty} onChange={(e) => set({ minQty: e.target.value })} aria-invalid={!!err("minQty") || undefined} />
        </Field>
        <Field label="Maximum per order" htmlFor={id("maxQty")} error={err("maxQty")} required>
          <Input id={id("maxQty")} type="number" min={1} max={100} value={f.maxQty} onChange={(e) => set({ maxQty: e.target.value })} aria-invalid={!!err("maxQty") || undefined} />
        </Field>
      </div>
      <Field label="Photo" error={err("image")} hint="Optional. Shows as a small photo beside the item.">
        <ImageUpload value={f.image} onChange={(v) => set({ image: v })} />
      </Field>
      {f.image && (
        <Field label="Photo description" htmlFor={id("imageAlt")} error={err("imageAlt")} hint="Read out by screen readers." required>
          <Input id={id("imageAlt")} value={f.imageAlt} onChange={(e) => set({ imageAlt: e.target.value })} maxLength={200} aria-invalid={!!err("imageAlt") || undefined} />
        </Field>
      )}
      <Checkbox checked={f.active} onChange={(v) => set({ active: v })} label="Show on the website" />
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="submit" variant="primary" loading={busy}>
          {item ? "Save item" : "Add item"}
        </Btn>
      </div>
    </form>
  );
}
