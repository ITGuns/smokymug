"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { submitOrderRequest } from "@/actions/order-request";
import { Button } from "@/components/ui/Button";
import type { OrderMenu } from "@/db/schema";
import type { PublicOrderItem } from "@/lib/data/ordering";
import { cn } from "@/lib/cn";
import { longDate, money, time12 } from "@/lib/format";
import { estimateTotal, MAX_TOTAL_UNITS } from "@/lib/ordering";
import { lastPickupDate, pickupSlots, type PickupCtx } from "@/lib/pickup";
import { OrderItemRow } from "./OrderItemRow";

/**
 * Phase 2 request form (docs/phase2-ordering-spec.md 2.8, 4.4). The item list
 * and the request panel are one form. Slots come from the same pure function the
 * server validates with, fed by server props (no `new Date()` in render, so no
 * hydration drift). Nothing here charges anything: there are no payment fields.
 * Stable element rule (DESIGN.md 5): no motion wrapper around the form, so the
 * header pause toggle can't re-mount it and wipe what the guest typed.
 */

type Contact = { name: string; phone: string; email: string; pickupDate: string; pickupTime: string; notes: string; website: string };
const EMPTY: Contact = { name: "", phone: "", email: "", pickupDate: "", pickupTime: "", notes: "", website: "" };

function newKey(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

type Props = {
  menu: OrderMenu;
  items: PublicOrderItem[];
  ctx: PickupCtx;
  /** First date with a slot (server computed); null = nothing open in the window. */
  firstDate: string | null;
  phone: string;
  phoneHref: string;
};

export function OrderRequestForm({ menu, items, ctx, firstDate, phone, phoneHref }: Props) {
  const [qty, setQty] = useState<Record<number, string>>({});
  const [f, setF] = useState<Contact>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ reference: string | null; date: string; time: string } | null>(null);
  const keyRef = useRef<string | null>(null);
  const doneCardRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);

  const last = lastPickupDate(ctx);
  const slots = useMemo(() => (f.pickupDate ? pickupSlots(f.pickupDate, ctx) : []), [f.pickupDate, ctx]);
  const chosen = items.flatMap((item) => {
    const n = Number(qty[item.id]);
    return Number.isInteger(n) && n > 0 ? [{ item, quantity: n }] : [];
  });
  const units = chosen.reduce((n, c) => n + c.quantity, 0);
  const estimate = estimateTotal(chosen.map((c) => ({ unitPrice: c.item.price, quantity: c.quantity })));

  // The card replaces a much taller form: bring it in under the fixed header
  // (its scroll-mt) first, then focus the heading without a second, header-blind scroll.
  useEffect(() => {
    if (!done) return;
    doneCardRef.current?.scrollIntoView({ block: "start" });
    doneRef.current?.focus({ preventScroll: true });
  }, [done]);

  const set = (k: keyof Contact) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const v = e.target.value;
    setF((prev) => {
      const next = { ...prev, [k]: v };
      // A new date keeps the chosen time only if that day still offers it
      if (k === "pickupDate" && prev.pickupTime && !pickupSlots(v, ctx).includes(prev.pickupTime)) next.pickupTime = "";
      return next;
    });
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    for (const item of items) {
      const raw = qty[item.id];
      if (!raw) continue;
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 0) e[`item-${item.id}`] = "Enter a whole number";
      else if (n > 0 && n < item.minQty) e[`item-${item.id}`] = `The minimum for this one is ${item.minQty}`;
      else if (n > item.maxQty) e[`item-${item.id}`] = `Up to ${item.maxQty} for this one`;
    }
    if (!chosen.length) e.lines = "Pick at least one item";
    else if (units > MAX_TOTAL_UNITS) e.lines = `Up to ${MAX_TOTAL_UNITS} items in one request. Call us for bigger orders.`;
    if (!f.name.trim()) e.name = "Name is required";
    if (f.phone.trim().length < 7) e.phone = "Enter a phone number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Enter a valid email";
    if (!f.pickupDate) e.pickupDate = "Pick a pickup date";
    else if (!slots.length) e.pickupDate = "No pickup that day. Pick another date.";
    if (!f.pickupTime) e.pickupTime = "Pick a pickup time";
    return e;
  };

  /** Server keys "lines.N.quantity" point at the Nth chosen line. */
  const mapServerErrors = (fe: Record<string, string>) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(fe)) {
      const m = /^lines\.(\d+)\./.exec(k);
      if (m && chosen[Number(m[1])]) out[`item-${chosen[Number(m[1])].item.id}`] = v;
      else out[k.split(".")[0]] = v;
    }
    return out;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const local = validate();
    setErrors(local);
    if (Object.keys(local).length) {
      // An empty pick has nothing highlighted in this panel: name the problem instead
      setMessage(local.lines ?? "Please check the highlighted fields.");
      requestAnimationFrame(() => alertRef.current?.focus());
      return;
    }
    setBusy(true);
    setMessage(null);
    keyRef.current ??= newKey();
    try {
      const res = await submitOrderRequest({
        menu,
        lines: chosen.map((c) => ({ itemId: c.item.id, quantity: c.quantity })),
        name: f.name,
        email: f.email.trim(),
        phone: f.phone,
        pickupDate: f.pickupDate,
        pickupTime: f.pickupTime,
        notes: f.notes,
        idempotencyKey: keyRef.current,
        website: f.website,
      });
      if (res.ok) {
        setDone({ reference: res.data.reference, date: f.pickupDate, time: f.pickupTime });
        return;
      }
      setErrors(mapServerErrors(res.fieldErrors ?? {}));
      setMessage(res.error);
      requestAnimationFrame(() => alertRef.current?.focus());
    } catch {
      setMessage(`We couldn't send your request. Please call us at ${phone}.`);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      // Same shape as the catering inquiry's sent state (CateringForm). data-reveal: shown at once for reduced motion / paused (DESIGN.md 5)
      <motion.div
        ref={doneCardRef}
        data-reveal=""
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        role="status"
        className="mx-auto max-w-2xl scroll-mt-32 rounded-2xl bg-charcoal-900 p-8 text-cream-50"
        data-order-confirmation
      >
        <p className="eyebrow text-teal-300">Request sent</p>
        <h2 ref={doneRef} tabIndex={-1} className="mt-3 font-display text-3xl font-semibold focus:outline-none">
          Request received.
        </h2>
        <p className="mt-3 text-cream-100/75">
          This is a request, not a confirmed order yet. We&apos;ll look it over and reach out by phone or email to confirm what we can do for {longDate(done.date)} at {time12(done.time)}.
        </p>
        <p className="mt-3 text-cream-100/75">No payment now. You pay at pickup or through SpotOn.</p>
        <p className="mt-3 text-cream-100/75">
          {done.reference && (
            <>
              Your reference is <strong className="font-semibold text-cream-50" data-order-reference>{done.reference}</strong>.{" "}
            </>
          )}
          Questions? Call us at{" "}
          <a href={phoneHref} className="font-semibold text-cream-50 hover:text-ember-300">
            {phone}
          </a>
          .
        </p>
      </motion.div>
    );
  }

  const input = (err?: string) =>
    cn(
      "h-12 w-full rounded-full border bg-cream-50 px-4 text-[15px] text-charcoal-900 placeholder:text-charcoal-500/60 focus:outline-none",
      err ? "border-brick-500" : "border-charcoal-900/12 focus:border-ember-600",
    );

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-7">
        {/* Same section header and row rhythm as the /menu list (L2-D) */}
        <div className="mb-4 border-b border-charcoal-900/10 pb-3">
          <h2 className="font-display text-2xl font-semibold text-charcoal-900">Pick your items</h2>
          <p className="mt-1 text-[14px] text-charcoal-500">Set a quantity for each one you want.</p>
          {errors.lines && <p className="mt-2 text-[12px] font-medium text-brick-600">{errors.lines}</p>}
        </div>
        <ul className="divide-y divide-charcoal-900/8" aria-label="Items">
          {items.map((item) => (
            <OrderItemRow
              key={item.id}
              item={item}
              value={qty[item.id] ?? ""}
              onChange={(v) => setQty((prev) => ({ ...prev, [item.id]: v }))}
              error={errors[`item-${item.id}`]}
              disabled={busy}
            />
          ))}
        </ul>
      </div>

      <div className="lg:col-span-5">
        {/* Sticky only on viewports tall enough to hold the whole panel: on a short laptop
            (1366x768) a sticky panel hid Send request below the fold */}
        <div className="rounded-2xl border border-charcoal-900/8 bg-cream-50 p-6 shadow-card sm:p-8 lg:top-28 [@media(min-height:60rem)]:lg:sticky">
          <h2 className="font-display text-2xl font-semibold text-charcoal-900">Your request</h2>
          {message && (
            <p ref={alertRef} tabIndex={-1} role="alert" className="mt-4 rounded-2xl border border-brick-500/30 bg-brick-500/8 px-4 py-3 text-[14px] text-brick-700 focus:outline-none">
              {message}
            </p>
          )}

          <div className="mt-5 grid gap-4">
            <Field label="Your name" error={errors.name} htmlFor="or-name">
              <input id="or-name" className={input(errors.name)} value={f.name} onChange={set("name")} autoComplete="name" required aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? "or-name-msg" : undefined} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Field label="Phone" error={errors.phone} htmlFor="or-phone">
                <input id="or-phone" type="tel" className={input(errors.phone)} value={f.phone} onChange={set("phone")} autoComplete="tel" required aria-invalid={errors.phone ? true : undefined} aria-describedby={errors.phone ? "or-phone-msg" : undefined} />
              </Field>
              <Field label="Email" error={errors.email} htmlFor="or-email">
                <input id="or-email" type="email" className={input(errors.email)} value={f.email} onChange={set("email")} autoComplete="email" required aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? "or-email-msg" : undefined} />
              </Field>
            </div>

            {firstDate ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Field label="Pickup date" error={errors.pickupDate} htmlFor="or-date" hint={`First open day: ${longDate(firstDate)}`}>
                  <input id="or-date" type="date" min={firstDate} max={last} className={input(errors.pickupDate)} value={f.pickupDate} onChange={set("pickupDate")} required aria-invalid={errors.pickupDate ? true : undefined} aria-describedby="or-date-msg" />
                </Field>
                <Field label="Pickup time" error={errors.pickupTime} htmlFor="or-time">
                  <select id="or-time" className={cn(input(errors.pickupTime), "appearance-none")} value={f.pickupTime} onChange={set("pickupTime")} disabled={!slots.length} required aria-invalid={errors.pickupTime ? true : undefined} aria-describedby={errors.pickupTime ? "or-time-msg" : undefined}>
                    <option value="">{!f.pickupDate ? "Pick a date first" : slots.length ? "Pick a time" : "No pickup that day"}</option>
                    {slots.map((s) => (
                      <option key={s} value={s}>
                        {time12(s)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-charcoal-900/15 px-4 py-3 text-[15px] text-charcoal-700">
                No pickup times are open right now. Call us at{" "}
                <a href={phoneHref} className="font-semibold text-charcoal-900 hover:text-ember-600">
                  {phone}
                </a>
                .
              </p>
            )}

            <Field label="Anything we should know?" error={errors.notes} htmlFor="or-notes" optional>
              <textarea
                id="or-notes"
                rows={3}
                maxLength={500}
                className={cn("w-full rounded-2xl border bg-cream-50 px-4 py-3 text-[15px] text-charcoal-900 placeholder:text-charcoal-500/60 focus:outline-none", errors.notes ? "border-brick-500" : "border-charcoal-900/12 focus:border-ember-600")}
                value={f.notes}
                onChange={set("notes")}
                aria-invalid={errors.notes ? true : undefined}
                aria-describedby={errors.notes ? "or-notes-msg" : undefined}
              />
            </Field>
            {/* Honeypot: hidden from people and assistive tech; bots fill it */}
            <div className="hidden" aria-hidden>
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} />
              </label>
            </div>
          </div>

          <div className="mt-6 border-t border-charcoal-900/10 pt-5" aria-live="polite">
            {chosen.length > 0 && (
              <ul className="mb-3 space-y-1 text-[14px] text-charcoal-800" aria-label="Your items">
                {chosen.map((c) => (
                  <li key={c.item.id} className="flex justify-between gap-3">
                    <span className="min-w-0">
                      {c.quantity} x {c.item.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-charcoal-600">{c.item.price == null ? "on request" : money(c.item.price * c.quantity)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[15px] font-semibold text-charcoal-900" data-order-estimate>
              {!chosen.length
                ? "No items picked yet."
                : estimate != null
                  ? `Estimated total before tax: ${money(estimate)}`
                  : "Some items are priced on request. We'll confirm the total."}
            </p>
          </div>

          <Button type="submit" size="lg" className="mt-5 w-full" disabled={busy || !firstDate} arrow={!busy}>
            {busy ? "Sending…" : "Send request"}
          </Button>
          <p className="mt-3 text-[13px] leading-relaxed text-charcoal-700">We&apos;ll confirm by phone or email. Your order isn&apos;t final until we do.</p>
          {/* G7 default: one factual line until Genrou clears a privacy notice */}
          <p className="mt-2 text-[13px] leading-relaxed text-charcoal-500">We use your name, phone and email only to confirm this request.</p>
        </div>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, error, hint, optional, children }: { label: string; htmlFor: string; error?: string; hint?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold text-charcoal-800">
        {label}
        {optional && <span className="font-normal text-charcoal-500"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-msg`} className="mt-1 block text-[12px] font-medium text-brick-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-msg`} className="mt-1 block text-[12px] text-charcoal-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
