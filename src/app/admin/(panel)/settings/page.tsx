import type { Metadata } from "next";
import { BookingSettingsForm } from "@/components/admin/settings/BookingSettingsForm";
import { PasswordForm } from "@/components/admin/settings/PasswordForm";
import { RestaurantForm } from "@/components/admin/settings/RestaurantForm";
import { SiteExtrasForm } from "@/components/admin/settings/SiteExtrasForm";
import { PageHeader } from "@/components/admin/ui";
import { readBookingSettings, readRestaurant } from "@/lib/data/restaurant";
import { readSiteSettings } from "@/lib/data/site-settings";
import { inquiryMailConfig } from "@/lib/inquiry-mail";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [settings, info, site] = await Promise.all([readBookingSettings(), readRestaurant(), readSiteSettings()]);
  return (
    <>
      <PageHeader title="Settings" description="Restaurant details, booking rules and your account." />
      <div className="space-y-8">
        <SiteExtrasForm
          available={site.available}
          reservationsUrl={site.reservationsUrl}
          bookingWizard={site.bookingWizard}
          inquiryCc={site.inquiryCc}
          inquiryTo={info.cateringEmail ?? info.email}
          mailConfigured={inquiryMailConfig() !== null}
        />
        <BookingSettingsForm settings={settings} />
        <RestaurantForm info={info} />
        <PasswordForm />
      </div>
    </>
  );
}
