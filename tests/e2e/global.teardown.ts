import { test as teardown } from "@playwright/test";
import { closePool } from "./helpers/db";
import { setBookingWizard, setReservationsUrl } from "./helpers/site-settings";

// Back to the shipped default after the suite: /book shows the SpotOn box (BK02).
teardown("restore the reservations defaults", async () => {
  await setBookingWizard(false);
  await setReservationsUrl(null);
  await closePool();
});
