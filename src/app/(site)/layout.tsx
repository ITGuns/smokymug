import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MobileCta } from "@/components/site/MobileCta";
import { MotionProvider } from "@/components/site/MotionProvider";
import { RestaurantJsonLd } from "@/components/site/JsonLd";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { time12 } from "@/lib/format";
import { getSpecialEvents } from "@/lib/data/events";
import { getMenuTree } from "@/lib/data/menu";
import { readOrderingSettings } from "@/lib/data/ordering";
import { liveOrderingLinks } from "@/lib/ordering-menus";
import { getSiteChrome } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [{ restaurant, hours, status, phoneHref, clock }, specials] = await Promise.all([getSiteChrome(), getSpecialEvents()]);
  // D1: the menu read takes the restaurant-local date (scheduled items); the page reuses this same per-request result
  const [tree, ordering] = await Promise.all([getMenuTree(clock.date), readOrderingSettings(clock.date)]);
  const menuLinks = tree.categories.map((c) => ({ label: c.name, href: `/menu?category=${c.slug}` }));
  // Phase 2: the drawer lists the ordering pages that are switched on (P4, 4 Nov)
  const orderingLinks = liveOrderingLinks(ordering);
  const today = status.today;
  const hoursToday =
    today && !today.isClosed && today.opensAt && today.closesAt
      ? `${time12(today.opensAt, { compact: true })} – ${time12(today.closesAt, { compact: true })}`
      : "Closed";
  return (
    <MotionProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ember-600 focus:px-4 focus:py-2 focus:text-cream-50"
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
        facebookUrl={restaurant.facebookUrl}
        email={restaurant.email}
        menuLinks={menuLinks}
        orderingLinks={orderingLinks}
        specialsEnabled={specials.settings.enabled}
      />
      <main id="main">{children}</main>
      <Footer restaurant={restaurant} hours={hours} phoneHref={phoneHref} todayDow={clock.dayOfWeek} specialsEnabled={specials.settings.enabled} />
      <MobileCta phoneHref={phoneHref} />
      <RestaurantJsonLd restaurant={restaurant} hours={hours} />
    </MotionProvider>
  );
}
