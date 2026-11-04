import type { Metadata } from "next";
import { CateringTeaser } from "@/components/home/CateringTeaser";
import { FoodStory } from "@/components/home/FoodStory";
import { GalleryStrip } from "@/components/home/GalleryStrip";
import { Hero } from "@/components/home/Hero";
import { HoursSection } from "@/components/home/HoursSection";
import { Intro } from "@/components/home/Intro";
import { Programs } from "@/components/home/Programs";
import { Reviews } from "@/components/home/Reviews";
import { Signature, type FeaturedItem } from "@/components/home/Signature";
import { SIGNATURE_MAX } from "@/lib/signature-grid";
import { Ticker } from "@/components/home/Ticker";
import { Visit } from "@/components/home/Visit";
import { itemAvailability } from "@/lib/availability";
import { getFeaturedItems, getMenuTree } from "@/lib/data/menu";
import { readOrderingSettings } from "@/lib/data/ordering";
import { getGallery, getReviews } from "@/lib/data/restaurant";
import { orderingMenus } from "@/lib/ordering-menus";
import { getSiteChrome } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "The Smoky Mug | Texas Craft BBQ + Cafe in Brookland Park, Richmond VA" },
  // Board copy (H02/R2-02): matches the seeded description, not the struck lines.
  description:
    "All-Day Craft, Tex-Mex & Barbecue Kitchen in Northside Richmond, VA. A morning to night Tex-Mex experience including slow smoked brisket, pulled pork, ribs, and more. Accompanied by a full espresso bar, pastry program, and crafted cocktails.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [{ restaurant, hours, status, phoneHref, clock }, gallery, reviews] = await Promise.all([getSiteChrome(), getGallery(), getReviews()]);
  // D1: featured picks skip items outside their show-from/until dates (restaurant-local today).
  // NW03-1: Explore Menu shows 2 or 3 options, per the phase 2 admin switches
  const [featured, tree, ordering] = await Promise.all([getFeaturedItems(clock.date), getMenuTree(clock.date), readOrderingSettings(clock.date)]);

  const catById = new Map(tree.categories.map((c) => [c.id, c]));
  const featuredItems: FeaturedItem[] = featured.slice(0, SIGNATURE_MAX).map((item) => {
    const a = itemAvailability(item, catById.get(item.categoryId)!, hours, clock);
    return { ...item, availabilityLabel: a.label, availableNow: a.availableNow };
  });

  const blurb = restaurant.description.replace(/^All-Day Craft, Tex-Mex & Barbecue Kitchen in Northside Richmond, VA\.\s*/i, "");

  return (
    <>
      <Hero
        tagline={restaurant.tagline}
        status={status}
        addressShort={`${restaurant.addressLine1} · Brookland Park, RVA`}
        menus={orderingMenus(ordering)}
      />
      <Ticker items={["Texas craft brisket", "Homemade tortillas", "Specialty lattes", "Taco Tuesday", "Happy hour Tue–Sat", "Sunday brunch", "Dog-friendly porch"]} />
      <Intro blurb={blurb} cafeSummary={restaurant.cafeSummary} bbqSummary={restaurant.bbqSummary} features={restaurant.features} />
      <FoodStory bbqSummary={restaurant.bbqSummary} />
      <Signature items={featuredItems} />
      <HoursSection hours={hours} todayDow={clock.dayOfWeek} status={status} />
      <Reviews reviews={reviews} />
      <CateringTeaser />
      <GalleryStrip images={gallery.filter((g) => g.tag !== "catering").slice(0, 10)} />
      <Programs restaurant={restaurant} />
      <Visit restaurant={restaurant} hours={hours} phoneHref={phoneHref} todayDow={clock.dayOfWeek} compact />
    </>
  );
}
