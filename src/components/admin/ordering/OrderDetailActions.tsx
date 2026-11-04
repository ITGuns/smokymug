"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteCateringInquiry, deleteOrderRequest, saveOrderRequestNote, updateOrderRequestStatus } from "@/actions/ordering-admin";
import { ConfirmDialog } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { useAction } from "@/components/admin/useAction";
import { Btn, Card, Field, Select, Textarea } from "@/components/admin/ui";
import { ORDER_REQUEST_STATUSES, type OrderRequestStatus } from "@/db/schema";
import { ORDER_STATUS_LABELS } from "@/lib/ordering";

/** Status, internal note and delete for one order request. Nothing is sent to the guest on any change. */
export function OrderDetailActions({ id, reference, status, note }: { id: number; reference: string; status: OrderRequestStatus; note: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [s, setS] = useState<OrderRequestStatus>(status);
  const [n, setN] = useState(note ?? "");
  const [noteError, setNoteError] = useState<string | undefined>();
  const [removing, setRemoving] = useState(false);
  const statusAction = useAction();
  const noteAction = useAction();
  const removeAction = useAction();

  const saveStatus = async () => {
    const res = await statusAction.run(() => updateOrderRequestStatus({ id, status: s }));
    if (res.ok) {
      toast.success("Status saved", "The guest is not notified. Call or email them yourself.");
      router.refresh();
    } else toast.error(res.error);
  };
  const saveNote = async () => {
    const res = await noteAction.run(() => saveOrderRequestNote({ id, note: n }));
    if (res.ok) {
      setNoteError(undefined);
      toast.success("Note saved");
      router.refresh();
    } else {
      setNoteError(res.fieldErrors?.note);
      toast.error(res.error);
    }
  };
  const remove = async () => {
    const res = await removeAction.run(() => deleteOrderRequest(id));
    setRemoving(false);
    if (res.ok) {
      toast.success("Request deleted");
      router.push("/admin/orders");
      router.refresh();
    } else toast.error(res.error);
  };

  return (
    <Card title="Staff">
      <div className="space-y-5">
        <Field label="Status" htmlFor="od-status" hint="Staff only. The guest is not told about status changes.">
          <div className="flex flex-wrap gap-2">
            <Select id="od-status" value={s} onChange={(e) => setS(e.target.value as OrderRequestStatus)} className="w-48">
              {ORDER_REQUEST_STATUSES.map((v) => (
                <option key={v} value={v}>
                  {ORDER_STATUS_LABELS[v]}
                </option>
              ))}
            </Select>
            <Btn variant="primary" loading={statusAction.busy} disabled={s === status} onClick={() => void saveStatus()}>
              Save status
            </Btn>
          </div>
        </Field>
        <Field label="Internal note" htmlFor="od-note" error={noteError} hint="Staff only, up to 500 characters. Never card numbers.">
          <Textarea id="od-note" value={n} onChange={(e) => setN(e.target.value)} maxLength={500} />
        </Field>
        <div className="flex flex-wrap justify-between gap-2">
          <Btn variant="dangerGhost" onClick={() => setRemoving(true)}>
            Delete request
          </Btn>
          <Btn loading={noteAction.busy} onClick={() => void saveNote()}>
            Save note
          </Btn>
        </div>
      </div>
      <ConfirmDialog
        open={removing}
        title={`Delete request ${reference}?`}
        body="The request and its items are removed for good. The guest is not told."
        confirmLabel="Delete request"
        loading={removeAction.busy}
        onConfirm={remove}
        onCancel={() => setRemoving(false)}
      />
    </Card>
  );
}

export function CateringInquiryDelete({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const { busy, run } = useAction();
  const remove = async () => {
    const res = await run(() => deleteCateringInquiry(id));
    setOpen(false);
    if (res.ok) {
      toast.success("Inquiry deleted");
      router.push("/admin/orders?tab=catering");
      router.refresh();
    } else toast.error(res.error);
  };
  return (
    <>
      <Btn variant="dangerGhost" onClick={() => setOpen(true)}>
        Delete inquiry
      </Btn>
      <ConfirmDialog open={open} title={`Delete the inquiry from ${name}?`} body="It is removed for good. The guest is not told." confirmLabel="Delete inquiry" loading={busy} onConfirm={remove} onCancel={() => setOpen(false)} />
    </>
  );
}
