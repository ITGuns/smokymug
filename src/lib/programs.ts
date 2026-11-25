import type { RestaurantInfo } from "@/db/schema";

/** Heading for the home "programs" section: it names only what is actually linked in
 *  Admin, Settings, so an empty gift card link never leaves a "Gift cards" promise behind. */
export function programsHeading(r: Pick<RestaurantInfo, "giftCardUrl" | "giftCardBalanceUrl" | "loyaltyUrl">): string {
  const gift = Boolean(r.giftCardUrl || r.giftCardBalanceUrl);
  if (gift && r.loyaltyUrl) return "Gift cards & loyalty";
  if (gift) return "Gift cards";
  if (r.loyaltyUrl) return "Loyalty";
  return "Stay in touch";
}
