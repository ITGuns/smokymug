"use client";

import { useState } from "react";
import { cancelReservation, type PublicReservation } from "@/actions/booking";
import { Button } from "@/components/ui/Button";
import { Confirmation } from "./Confirmation";

export function ManageReservation({ reservation, token, restaurant, turnTime }: { reservation: PublicReservation; token: string; restaurant: { name: string; addressLine1: string; city: string; state: string; zip: string; phone: string }; turnTime: number }) {
  const [r, setR] = useState(reservation);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancellable = r.status === "pending" || r.status === "confirmed";

  const cancel = async () => {
    setBusy(true);
    setError(null);
    const res = await cancelReservation(r.confirmationCode, token);
    setBusy(false);
    if (res.ok) {
      setR(res.data);
      setConfirming(false);
    } else setError(res.error);
  };

  return (
    <div>
      <Confirmation reservation={r} restaurant={restaurant} turnTime={turnTime} heading="Your reservation" />
      {cancellable && (
        <div className="mx-auto mt-8 max-w-xl rounded-[22px] border border-charcoal-900/10 bg-cream-50 p-6 text-center">
          {!confirming ? (
            <>
              <p className="text-[14px] text-charcoal-700">Plans changed?</p>
              <Button variant="outline" size="sm" className="mt-3 text-brick-600" onClick={() => setConfirming(true)}>Cancel this reservation</Button>
            </>
          ) : (
            <div role="alertdialog" aria-labelledby="cancel-title">
              <p id="cancel-title" className="font-semibold text-charcoal-900">Cancel reservation #{r.confirmationCode}?</p>
              <p className="mt-1 text-[14px] text-charcoal-700">This releases your table. You can always book again.</p>
              {error && <p className="mt-3 text-[13px] font-medium text-brick-600">{error}</p>}
              <div className="mt-4 flex justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={cancel} disabled={busy}>{busy ? "Cancelling…" : "Yes, cancel it"}</Button>
                <Button size="sm" variant="ghost" className="text-charcoal-700" onClick={() => setConfirming(false)} disabled={busy}>Keep it</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
