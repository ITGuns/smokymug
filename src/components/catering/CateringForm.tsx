"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { submitCateringInquiry } from "@/actions/catering";
import { Button } from "@/components/ui/Button";
import { SERVICE_TYPES } from "@/lib/constants";
import { cn } from "@/lib/cn";

type Form = { name: string; email: string; phone: string; occasion: string; eventDate: string; guestCount: string; serviceType: string; message: string; website: string };
const EMPTY: Form = { name: "", email: "", phone: "", occasion: "", eventDate: "", guestCount: "", serviceType: "", message: "", website: "" };

export function CateringForm({ email, phone }: { email: string; phone: string }) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Audit F8: after a failed send, move focus to the first field that needs fixing.
  useEffect(() => {
    if (Object.keys(errors).length) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errors]);
  const errId = (k: keyof Form) => `catering-${k}-error`;
  const a11y = (k: keyof Form) => (errors[k] ? { "aria-invalid": true, "aria-describedby": errId(k) } : {});
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("busy");
    setErrors({});
    setMessage(null);
    const res = await submitCateringInquiry({ ...form, guestCount: form.guestCount === "" ? "" : Number(form.guestCount) } as never);
    if (res.ok) {
      setStatus("done");
    } else {
      setStatus("error");
      setErrors(res.fieldErrors ?? {});
      setMessage(res.error);
    }
  };

  if (status === "done") {
    return (
      // data-reveal: shown at once for reduced motion / paused (DESIGN.md 5)
      <motion.div data-reveal="" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-charcoal-900 p-8 text-cream-50" role="status">
        <p className="eyebrow text-teal-300">Inquiry sent</p>
        <h3 className="mt-3 font-display text-3xl font-semibold">We&apos;ll be in touch.</h3>
        <p className="mt-3 text-cream-100/75">Thanks, {form.name.split(" ")[0]}. We&apos;ll reply to {form.email} with menu options and pricing. Need it faster? Call {phone}.</p>
      </motion.div>
    );
  }

  const input = (err?: string) =>
    cn("h-12 w-full rounded-full border bg-cream-50 px-4 text-[15px] text-charcoal-900 placeholder:text-charcoal-500/60 focus:outline-none", err ? "border-brick-500" : "border-charcoal-900/12 focus:border-ember-600");

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      {message && <p role="alert" className="rounded-2xl border border-brick-500/30 bg-brick-500/8 px-4 py-3 text-[14px] text-brick-700 sm:col-span-2">{message}</p>}
      <Field label="Your name" error={errors.name} errorId={errId("name")}><input {...a11y("name")} className={input(errors.name)} value={form.name} onChange={set("name")} autoComplete="name" required /></Field>
      <Field label="Email" error={errors.email} errorId={errId("email")}><input {...a11y("email")} type="email" className={input(errors.email)} value={form.email} onChange={set("email")} autoComplete="email" required /></Field>
      <Field label="Phone" error={errors.phone} errorId={errId("phone")} optional><input {...a11y("phone")} type="tel" className={input(errors.phone)} value={form.phone} onChange={set("phone")} autoComplete="tel" /></Field>
      <Field label="What's the occasion?" error={errors.occasion} errorId={errId("occasion")}><input {...a11y("occasion")} className={input(errors.occasion)} value={form.occasion} onChange={set("occasion")} placeholder="Birthday, office lunch, wedding…" required /></Field>
      <Field label="Event date" error={errors.eventDate} errorId={errId("eventDate")} optional><input {...a11y("eventDate")} type="date" className={input(errors.eventDate)} value={form.eventDate} onChange={set("eventDate")} /></Field>
      <Field label="Number of guests" error={errors.guestCount} errorId={errId("guestCount")} optional><input {...a11y("guestCount")} type="number" min={1} inputMode="numeric" className={input(errors.guestCount)} value={form.guestCount} onChange={set("guestCount")} /></Field>
      <Field label="Service type" error={errors.serviceType} errorId={errId("serviceType")}>
        <select {...a11y("serviceType")} className={cn(input(errors.serviceType), "appearance-none")} value={form.serviceType} onChange={set("serviceType")} required>
          <option value="">Choose one</option>
          {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <div className="hidden" aria-hidden><label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} /></label></div>
      <Field label="Tell us more" error={errors.message} errorId={errId("message")} optional className="sm:col-span-2">
        <textarea {...a11y("message")} rows={4} className="w-full rounded-2xl border border-charcoal-900/12 bg-cream-50 px-4 py-3 text-[15px] text-charcoal-900 placeholder:text-charcoal-500/60 focus:border-ember-600 focus:outline-none" value={form.message} onChange={set("message")} placeholder="Menu ideas, dietary needs, venue details, timing…" />
      </Field>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Button type="submit" size="lg" disabled={status === "busy"} arrow={status !== "busy"}>{status === "busy" ? "Sending…" : "Send inquiry"}</Button>
        <span className="text-[13px] text-charcoal-500">Or email <a href={`mailto:${email}`} className="font-semibold text-charcoal-900">{email}</a></span>
      </div>
    </form>
  );
}

/** The error sits outside the label so it is read once, as the field's description. */
function Field({ label, error, errorId, optional, className, children }: { label: string; error?: string; errorId: string; optional?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("block", className)}>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-charcoal-800">{label}{optional && <span className="font-normal text-charcoal-500"> (optional)</span>}</span>
        {children}
      </label>
      {error && <span id={errorId} role="alert" className="mt-1 block text-[12px] font-medium text-brick-600">{error}</span>}
    </div>
  );
}
