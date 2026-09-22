import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MobileCta } from "@/components/site/MobileCta";
import { RestaurantJsonLd } from "@/components/site/JsonLd";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { time12 } from "@/lib/format";
import { getSiteChrome } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { restaurant, hours, status, phoneHref, clock } = await getSiteChrome();
  const today = status.today;
  const hoursToday =
    today && !today.isClosed && today.opensAt && today.closesAt
      ? `${time12(today.opensAt, { compact: true })} – ${time12(today.closesAt, { compact: true })}`
      : "Closed";
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ember-500 focus:px-4 focus:py-2 focus:text-cream-50"
      >
        Skip to content
      </a>
      <ScrollProgress />
      <Header
        status={{ isOpen: status.isOpen, label: status.label, detail: status.detail }}
        phone={restaurant.phone}
        phoneHref={phoneHref}
        address={`${restaurant.addressLine1}, ${restaurant.city}, ${restaurant.state}`}
        hoursToday={hoursToday}
        instagramUrl={restaurant.instagramUrl}
      />
      <main id="main">{children}</main>
      <Footer restaurant={restaurant} hours={hours} phoneHref={phoneHref} todayDow={clock.dayOfWeek} />
      <MobileCta phoneHref={phoneHref} />
      <RestaurantJsonLd restaurant={restaurant} hours={hours} />
    </>
  );
}
