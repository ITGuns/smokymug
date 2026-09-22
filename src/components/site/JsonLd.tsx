import type { Hours, RestaurantInfo } from "@/db/schema";
import { DAY_NAMES, SITE_URL } from "@/lib/constants";

export function RestaurantJsonLd({ restaurant: r, hours }: { restaurant: RestaurantInfo; hours: Hours[] }) {
  const store = hours.filter((h) => h.category === "store" && !h.isClosed && h.opensAt && h.closesAt);
  const data = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: r.name,
    description: r.description,
    url: SITE_URL,
    telephone: r.phone,
    email: r.email,
    image: `${SITE_URL}/images/bbq-platter-mac.jpg`,
    logo: `${SITE_URL}/images/logo.png`,
    servesCuisine: ["Barbecue", "Tex-Mex", "Cafe"],
    acceptsReservations: "True",
    address: {
      "@type": "PostalAddress",
      streetAddress: r.addressLine1,
      addressLocality: r.city,
      addressRegion: r.state,
      postalCode: r.zip,
      addressCountry: "US",
    },
    sameAs: [r.instagramUrl, r.facebookUrl, r.website].filter(Boolean),
    openingHoursSpecification: store.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_NAMES[h.dayOfWeek],
      opens: h.opensAt,
      closes: h.closesAt,
    })),
    amenityFeature: r.features.map((f) => ({ "@type": "LocationFeatureSpecification", name: f, value: true })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
