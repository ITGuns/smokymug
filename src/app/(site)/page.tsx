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
import { Ticker } from "@/components/home/Ticker";
import { Visit } from "@/components/home/Visit";
import { itemAvailability } from "@/lib/availability";
import { getFeaturedItems, getMenuTree } from "@/lib/data/menu";
import { getGallery, getReviews } from "@/lib/data/restaurant";
import { getSiteChrome } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "The Smoky Mug | Texas Craft BBQ + Cafe in Brookland Park, Richmond VA" },
  description:
    "Cafe & Craft Barbecue & Tex-Mex Kitchen in Northside Richmond, VA. Coffee and elevated cafe fare served every day. Top class brisket, pulled pork, ribs, and more smoked on site and plated through a unique rotating Tex-mex menu.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [{ restaurant, hours, status, phoneHref, clock }, featured, tree, gallery, reviews] = await Promise.all([
    getSiteChrome(),
    getFeaturedItems(),
    getMenuTree(),
    getGallery(),
    getReviews(),
  ]);

  const catById = new Map(tree.categories.map((c) => [c.id, c]));
  const featuredItems: FeaturedItem[] = featured.slice(0, 8).map((item) => {
    const a = itemAvailability(item, catById.get(item.categoryId)!, hours, clock);
    return { ...item, availabilityLabel: a.label, availableNow: a.availableNow };
  });

  const blurb = restaurant.description.replace(/^Cafe & Craft Barbecue & Tex-Mex Kitchen in Northside Richmond, VA\.\s*/i, "");

  return (
    <>
      <Hero tagline={restaurant.tagline} status={status} addressShort={`${restaurant.addressLine1} · Brookland Park, RVA`} />
      <Ticker items={["Texas craft brisket", "Homemade tortillas", "Specialty lattes", "Taco Tuesday", "Happy hour Wed–Sat", "Sunday brunch", "Dog-friendly porch"]} />
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
