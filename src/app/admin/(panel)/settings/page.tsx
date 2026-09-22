import type { Metadata } from "next";
import { BookingSettingsForm } from "@/components/admin/settings/BookingSettingsForm";
import { PasswordForm } from "@/components/admin/settings/PasswordForm";
import { RestaurantForm } from "@/components/admin/settings/RestaurantForm";
import { PageHeader } from "@/components/admin/ui";
import { readBookingSettings, readRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [settings, info] = await Promise.all([readBookingSettings(), readRestaurant()]);
  return (
    <>
      <PageHeader title="Settings" description="Restaurant details, booking rules and your account." />
      <div className="space-y-8">
        <BookingSettingsForm settings={settings} />
        <RestaurantForm info={info} />
        <PasswordForm />
      </div>
    </>
  );
}
