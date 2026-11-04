import "server-only";
import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db, schema, type DbLike } from "@/db";
import type { BookingSettings, GalleryImage, Hours, RestaurantInfo, Review } from "@/db/schema";
import { isMissingSchema } from "@/lib/db-errors";
import { selectHomeReviews } from "@/lib/reviews";

const { restaurantInfo, hours, reviews, galleryImages, bookingSettings } = schema;

export const CONTENT_TAG = "content";

/** Uncached reads (admin) */
export async function readRestaurant(): Promise<RestaurantInfo> {
  const [row] = await db.select().from(restaurantInfo).where(eq(restaurantInfo.id, 1)).limit(1);
  if (!row) throw new Error("restaurant_info not seeded: run `npm run db:seed`");
  return row;
}
export async function readHours(): Promise<Hours[]> {
  return db.select().from(hours).orderBy(asc(hours.category), asc(hours.dayOfWeek));
}
export async function readBookingSettings(ex: DbLike = db): Promise<BookingSettings> {
  const [row] = await ex.select().from(bookingSettings).where(eq(bookingSettings.id, 1)).limit(1);
  if (!row) throw new Error("booking_settings not seeded: run `npm run db:seed`");
  return row;
}
/** Every review row (admin). available = false: this database has not run
 *  `db:push` for the C9 columns yet, so rows come back in the old shape. */
export async function readAllReviews(): Promise<{ rows: Review[]; available: boolean }> {
  try {
    return { rows: await db.select().from(reviews).orderBy(asc(reviews.displayOrder), asc(reviews.id)), available: true };
  } catch (err) {
    if (!isMissingSchema(err)) throw err;
    const legacy = await db
      .select({
        id: reviews.id,
        reviewerInitials: reviews.reviewerInitials,
        platform: reviews.platform,
        themes: reviews.themes,
        sentiment: reviews.sentiment,
        displayOrder: reviews.displayOrder,
        active: reviews.active,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
      })
      .from(reviews)
      .orderBy(asc(reviews.displayOrder), asc(reviews.id));
    const rows = legacy.map((r) => ({ ...r, reviewerName: null, rating: null, reviewDate: null, body: null, adminAdded: false }));
    return { rows, available: false };
  }
}
/** Home page set (C9): newest good reviews, capped. Falls back to the old columns before db:push. */
export async function readReviews(): Promise<Review[]> {
  return selectHomeReviews((await readAllReviews()).rows);
}
export async function readGallery(includeInactive = false): Promise<GalleryImage[]> {
  return db
    .select()
    .from(galleryImages)
    .where(includeInactive ? undefined : eq(galleryImages.active, true))
    .orderBy(asc(galleryImages.displayOrder), asc(galleryImages.id));
}

/** Cached reads (public site). Invalidated via revalidateTag(CONTENT_TAG). */
export const getRestaurant = cache(unstable_cache(() => readRestaurant(), ["restaurant-info"], { tags: [CONTENT_TAG] }));
export const getHours = cache(unstable_cache(() => readHours(), ["hours"], { tags: [CONTENT_TAG] }));
export const getBookingSettings = cache(unstable_cache(() => readBookingSettings(), ["booking-settings"], { tags: [CONTENT_TAG] }));
export const getReviews = cache(unstable_cache(() => readReviews(), ["reviews"], { tags: [CONTENT_TAG] }));
export const getGallery = cache(unstable_cache(() => readGallery(), ["gallery"], { tags: [CONTENT_TAG] }));
