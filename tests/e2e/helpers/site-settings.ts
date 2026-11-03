import { query } from "./db";

/** site_settings is read uncached by the app, so these writes apply on the next request. */
async function upsert(column: "booking_wizard" | "reservations_url", value: boolean | string | null) {
  try {
    await query(`insert into site_settings (id, ${column}) values (1, $1) on conflict (id) do update set ${column} = excluded.${column}`, [value]);
  } catch (err) {
    if ((err as { code?: string }).code === "42P01") throw new Error("site_settings is missing on the e2e database. Run `npm run db:push` first.");
    throw err;
  }
}

export const setBookingWizard = (on: boolean) => upsert("booking_wizard", on);
export const setReservationsUrl = (url: string | null) => upsert("reservations_url", url);
