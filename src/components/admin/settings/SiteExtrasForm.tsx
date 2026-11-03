"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveInquiryCopies, saveReservationSettings } from "@/actions/site-settings";
import { useToast } from "@/components/admin/toast";
import { useAction } from "@/components/admin/useAction";
import { Btn, Card, Field, Input, Textarea, Toggle } from "@/components/admin/ui";

type Props = {
  /** false = this database has not run db:push for the 3 Nov settings yet */
  available: boolean;
  reservationsUrl: string | null;
  bookingWizard: boolean;
  inquiryCc: string[];
  /** where inquiries go (the catering email, else the main email) */
  inquiryTo: string;
  /** a mail provider is configured on the server (RESEND_API_KEY + INQUIRY_FROM_EMAIL) */
  mailConfigured: boolean;
};

const PUSH_NOTE = "These settings need a one-time database update (npm run db:push) before they can be saved. The site works without them.";

/** BK02 reservations box + CA03 dual paper trail (both built 3 Nov). */
export function SiteExtrasForm(p: Props) {
  return (
    <>
      <ReservationsCard {...p} />
      <InquiryCopiesCard {...p} />
    </>
  );
}

function ReservationsCard({ available, reservationsUrl, bookingWizard }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState({ reservationsUrl: reservationsUrl ?? "", bookingWizard });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { busy, run } = useAction();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const res = await run(() => saveReservationSettings(f));
    if (res.ok) {
      toast.success("Reservations saved", "Live on the Book a Table page now.");
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };

  return (
    <form onSubmit={submit}>
      <Card
        title="Reservations (SpotOn)"
        description="The Book a Table page shows your SpotOn reservations in a box, with a plain link under it. Until the link is set, it shows your phone number."
        actions={<Btn type="submit" variant="primary" loading={busy} disabled={!available}>Save reservations</Btn>}
      >
        {!available && <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">{PUSH_NOTE}</p>}
        <div className="grid gap-5">
          <Field label="SpotOn reservations link" htmlFor="s-resUrl" error={errors.reservationsUrl} hint="The web link from your SpotOn Reserve portal, starting with https://">
            <Input id="s-resUrl" value={f.reservationsUrl} onChange={(e) => setF({ ...f, reservationsUrl: e.target.value })} placeholder="https://…" disabled={!available} />
          </Field>
          <Toggle
            checked={f.bookingWizard}
            onChange={(v) => setF({ ...f, bookingWizard: v })}
            label="Use the built-in booking wizard instead"
            description="Off by default. When on, the Book a Table page shows the old step-by-step booking form instead of SpotOn."
            disabled={!available}
          />
        </div>
      </Card>
    </form>
  );
}

function InquiryCopiesCard({ available, inquiryCc, inquiryTo, mailConfigured }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState(inquiryCc.join("\n"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { busy, run } = useAction();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const res = await run(() => saveInquiryCopies({ inquiryCc: list }));
    if (res.ok) {
      toast.success("Inquiry copies saved");
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };

  return (
    <form onSubmit={submit}>
      <Card
        title="Catering inquiry copies"
        description={`Each catering inquiry is emailed to ${inquiryTo}, with a copy to every address listed here.`}
        actions={<Btn type="submit" variant="primary" loading={busy} disabled={!available}>Save copies</Btn>}
      >
        {!available && <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">{PUSH_NOTE}</p>}
        {!mailConfigured && (
          <p className="mb-4 rounded-lg bg-zinc-50 px-4 py-3 text-[13px] text-zinc-600">
            Email sending is not switched on for this site yet, so inquiries are only saved for now. Your list is kept and used as soon as it is.
          </p>
        )}
        <Field label="Copy these addresses (one per line, up to 10)" htmlFor="s-cc" error={errors.inquiryCc}>
          <Textarea id="s-cc" value={list} onChange={(e) => setList(e.target.value)} className="min-h-[96px]" placeholder={"manager@example.com\nevents@example.com"} disabled={!available} />
        </Field>
      </Card>
    </form>
  );
}
