import "server-only";
import { getClock, storeStatus, type Clock, type StoreStatus } from "./availability";
import { getBookingSettings, getHours, getRestaurant } from "./data/restaurant";
import { phoneHref } from "./format";
import type { Hours, RestaurantInfo } from "@/db/schema";

export type SiteChrome = {
  restaurant: RestaurantInfo;
  hours: Hours[];
  clock: Clock;
  status: StoreStatus;
  phoneHref: string;
};

export async function getSiteChrome(): Promise<SiteChrome> {
  const [restaurant, hours, settings] = await Promise.all([getRestaurant(), getHours(), getBookingSettings()]);
  const clock = getClock(settings.timezone);
  return { restaurant, hours, clock, status: storeStatus(hours, clock), phoneHref: phoneHref(restaurant.phone) };
}

export function mapsUrl(r: RestaurantInfo): string {
  const q = encodeURIComponent(`${r.name}, ${r.addressLine1}, ${r.city}, ${r.state} ${r.zip}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function mapsEmbedUrl(r: RestaurantInfo): string {
  const q = encodeURIComponent(`${r.addressLine1}, ${r.city}, ${r.state} ${r.zip}`);
  return `https://maps.google.com/maps?q=${q}&z=15&output=embed`;
}
