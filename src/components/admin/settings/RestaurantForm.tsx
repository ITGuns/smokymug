"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveRestaurantInfo } from "@/actions/settings";
import type { RestaurantInfo } from "@/db/schema";
import { useToast } from "@/components/admin/toast";
import { Btn, Card, Field, Input, Textarea } from "@/components/admin/ui";

export function RestaurantForm({ info }: { info: RestaurantInfo }) {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState({
    name: info.name, tagline: info.tagline, category: info.category, description: info.description, addressLine1: info.addressLine1, city: info.city, state: info.state, zip: info.zip,
    neighborhood: info.neighborhood ?? "", phone: info.phone, email: info.email, website: info.website ?? "", instagramUrl: info.instagramUrl ?? "", facebookUrl: info.facebookUrl ?? "",
    giftCardUrl: info.giftCardUrl ?? "", giftCardBalanceUrl: info.giftCardBalanceUrl ?? "", loyaltyUrl: info.loyaltyUrl ?? "", marketingSignupUrl: info.marketingSignupUrl ?? "", brunchReservationUrl: info.brunchReservationUrl ?? "",
    features: info.features.join("\n"), cafeSummary: info.cafeSummary ?? "", bbqSummary: info.bbqSummary ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const t = (k: keyof typeof f) => ({ id: `r-${k}`, value: f[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value }), error: !!errors[k] });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await saveRestaurantInfo({ ...f, features: f.features.split("\n").map((x) => x.trim()).filter(Boolean) });
    setBusy(false);
    if (res.ok) {
      toast.success("Restaurant info saved");
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card title="Restaurant information" description="Used across the website, footer, contact page and structured data." actions={<Btn type="submit" variant="primary" loading={busy}>Save info</Btn>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="r-name" error={errors.name} required><Input {...t("name")} required /></Field>
          <Field label="Category" htmlFor="r-category" error={errors.category}><Input {...t("category")} /></Field>
          <Field label="Tagline" htmlFor="r-tagline" error={errors.tagline} className="sm:col-span-2" required><Input {...t("tagline")} required /></Field>
          <Field label="Description (SEO)" htmlFor="r-description" error={errors.description} className="sm:col-span-2"><Textarea {...t("description")} /></Field>
          <Field label="Address" htmlFor="r-addressLine1" error={errors.addressLine1} required><Input {...t("addressLine1")} required /></Field>
          <Field label="Neighborhood" htmlFor="r-neighborhood" error={errors.neighborhood}><Input {...t("neighborhood")} /></Field>
          <Field label="City" htmlFor="r-city" error={errors.city} required><Input {...t("city")} required /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="State" htmlFor="r-state" error={errors.state} required><Input {...t("state")} required /></Field>
            <Field label="ZIP" htmlFor="r-zip" error={errors.zip} required><Input {...t("zip")} required /></Field>
          </div>
          <Field label="Phone" htmlFor="r-phone" error={errors.phone} required><Input {...t("phone")} required /></Field>
          <Field label="Email" htmlFor="r-email" error={errors.email} required><Input type="email" {...t("email")} required /></Field>
          <Field label="Cafe summary" htmlFor="r-cafeSummary" error={errors.cafeSummary} className="sm:col-span-2"><Input {...t("cafeSummary")} /></Field>
          <Field label="BBQ summary" htmlFor="r-bbqSummary" error={errors.bbqSummary} className="sm:col-span-2"><Input {...t("bbqSummary")} /></Field>
          <Field label="Features (one per line)" htmlFor="r-features" className="sm:col-span-2"><Textarea {...t("features")} className="min-h-[140px]" /></Field>
        </div>
      </Card>
      <Card title="Links" description="External services: Toast gift cards & loyalty, TablesReady, social profiles.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Website" htmlFor="r-website" error={errors.website}><Input {...t("website")} /></Field>
          <Field label="Instagram" htmlFor="r-instagramUrl" error={errors.instagramUrl}><Input {...t("instagramUrl")} /></Field>
          <Field label="Facebook" htmlFor="r-facebookUrl" error={errors.facebookUrl}><Input {...t("facebookUrl")} /></Field>
          <Field label="Gift card purchase URL" htmlFor="r-giftCardUrl" error={errors.giftCardUrl}><Input {...t("giftCardUrl")} /></Field>
          <Field label="Gift card balance URL" htmlFor="r-giftCardBalanceUrl" error={errors.giftCardBalanceUrl}><Input {...t("giftCardBalanceUrl")} /></Field>
          <Field label="Loyalty signup URL" htmlFor="r-loyaltyUrl" error={errors.loyaltyUrl}><Input {...t("loyaltyUrl")} /></Field>
          <Field label="Email list signup URL" htmlFor="r-marketingSignupUrl" error={errors.marketingSignupUrl}><Input {...t("marketingSignupUrl")} /></Field>
          <Field label="Brunch reservations URL (TablesReady)" htmlFor="r-brunchReservationUrl" error={errors.brunchReservationUrl}><Input {...t("brunchReservationUrl")} /></Field>
        </div>
      </Card>
    </form>
  );
}
