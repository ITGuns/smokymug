import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { ReservationsBox } from "@/components/booking/ReservationsBox";
import { getBookableDates } from "@/lib/booking";
import { getBookingSettings, getRestaurant } from "@/lib/data/restaurant";
import { getSiteSettings } from "@/lib/data/site-settings";

export const metadata: Metadata = {
  title: "Book a Table",
  description: "Reserve a table at The Smoky Mug: Texas craft BBQ, Tex-Mex and specialty coffee in Brookland Park, Richmond, VA.",
  alternates: { canonical: "/book" },
};

/** BK02: the public page is the SpotOn reservations box. The native wizard
 *  only renders while Admin, Settings, "Use the built-in booking wizard" is on
 *  (off by default and after every reseed); its own pause switch still applies. */
export default async function BookPage() {
  const [settings, restaurant, site] = await Promise.all([getBookingSettings(), getRestaurant(), getSiteSettings()]);
  const wizard = site.bookingWizard;
  const bookable = wizard ? await getBookableDates() : null;
  const intro = wizard
    ? `Pick a day, tell us how many, grab a time. Parties of ${settings.largePartyThreshold} or more are confirmed by our team; BBQ can sell out early, so come hungry and on time.`
    : site.reservationsUrl
      ? "Pick your time in the reservations box below. BBQ can sell out early, so come hungry and on time."
      : "Call us to reserve. BBQ can sell out early, so come hungry and on time.";
  return (
    <>
      <section className="grain relative overflow-hidden bg-charcoal-950 pb-12 pt-32 text-cream-50 md:pt-40">
        <div aria-hidden className="pointer-events-none absolute -left-20 top-0 h-[420px] w-[420px] rounded-full bg-ember-500/15 blur-3xl" />
        <div className="container-site relative z-[2]">
          <p className="eyebrow text-teal-300">Reservations</p>
          <h1 className="mt-4 font-display text-[clamp(2.8rem,7vw,6rem)] font-semibold leading-[0.95] tracking-[-0.02em] display-wonk">Book a table.</h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-cream-100/70">{intro}</p>
        </div>
      </section>
      <section className="bg-cream-100 py-12 pb-32 lg:py-16">
        <div className="container-site">
          {wizard && bookable ? (
            <BookingWizard
              settings={{
                minPartySize: settings.minPartySize,
                maxPartySize: settings.maxPartySize,
                largePartyThreshold: settings.largePartyThreshold,
                turnTimeMinutes: settings.turnTimeMinutes,
                seatingPreferences: settings.seatingPreferences,
                occasions: settings.occasions,
                bookingsEnabled: settings.bookingsEnabled,
              }}
              bookable={bookable}
              restaurant={{ name: restaurant.name, addressLine1: restaurant.addressLine1, city: restaurant.city, state: restaurant.state, zip: restaurant.zip, phone: restaurant.phone }}
            />
          ) : (
            <ReservationsBox url={site.reservationsUrl} phone={restaurant.phone} />
          )}
        </div>
      </section>
    </>
  );
}
