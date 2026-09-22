"use client";

import { motion } from "motion/react";
import { useState } from "react";
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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[24px] bg-charcoal-900 p-8 text-cream-50" role="status">
        <p className="eyebrow text-ember-300">Inquiry sent</p>
        <h3 className="mt-3 font-display text-3xl font-semibold">We&apos;ll be in touch.</h3>
        <p className="mt-3 text-cream-100/75">Thanks, {form.name.split(" ")[0]}. We&apos;ll reply to {form.email} with menu options and pricing. Need it faster? Call {phone}.</p>
      </motion.div>
    );
  }

  const input = (err?: string) =>
    cn("h-12 w-full rounded-full border bg-cream-50 px-4 text-[15px] text-charcoal-900 placeholder:text-charcoal-500/60 focus:outline-none", err ? "border-brick-500" : "border-charcoal-900/12 focus:border-ember-400");

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      {message && <p role="alert" className="rounded-2xl border border-brick-500/30 bg-brick-500/8 px-4 py-3 text-[14px] text-brick-700 sm:col-span-2">{message}</p>}
      <Field label="Your name" error={errors.name}><input className={input(errors.name)} value={form.name} onChange={set("name")} autoComplete="name" required /></Field>
      <Field label="Email" error={errors.email}><input type="email" className={input(errors.email)} value={form.email} onChange={set("email")} autoComplete="email" required /></Field>
      <Field label="Phone" error={errors.phone} optional><input type="tel" className={input(errors.phone)} value={form.phone} onChange={set("phone")} autoComplete="tel" /></Field>
      <Field label="What's the occasion?" error={errors.occasion}><input className={input(errors.occasion)} value={form.occasion} onChange={set("occasion")} placeholder="Birthday, office lunch, wedding…" required /></Field>
      <Field label="Event date" error={errors.eventDate} optional><input type="date" className={input(errors.eventDate)} value={form.eventDate} onChange={set("eventDate")} /></Field>
      <Field label="Number of guests" error={errors.guestCount} optional><input type="number" min={1} inputMode="numeric" className={input(errors.guestCount)} value={form.guestCount} onChange={set("guestCount")} /></Field>
      <Field label="Service type" error={errors.serviceType}>
        <select className={cn(input(errors.serviceType), "appearance-none")} value={form.serviceType} onChange={set("serviceType")} required>
          <option value="">Choose one</option>
          {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <div className="hidden" aria-hidden><label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} /></label></div>
      <Field label="Tell us more" error={errors.message} optional className="sm:col-span-2">
        <textarea rows={4} className="w-full rounded-2xl border border-charcoal-900/12 bg-cream-50 px-4 py-3 text-[15px] text-charcoal-900 placeholder:text-charcoal-500/60 focus:border-ember-400 focus:outline-none" value={form.message} onChange={set("message")} placeholder="Menu ideas, dietary needs, venue details, timing…" />
      </Field>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Button type="submit" size="lg" disabled={status === "busy"} arrow={status !== "busy"}>{status === "busy" ? "Sending…" : "Send inquiry"}</Button>
        <span className="text-[13px] text-charcoal-500">Or email <a href={`mailto:${email}`} className="font-semibold text-charcoal-900">{email}</a></span>
      </div>
    </form>
  );
}

function Field({ label, error, optional, className, children }: { label: string; error?: string; optional?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-semibold text-charcoal-800">{label}{optional && <span className="font-normal text-charcoal-500"> (optional)</span>}</span>
      {children}
      {error && <span className="mt-1 block text-[12px] font-medium text-brick-600">{error}</span>}
    </label>
  );
}
