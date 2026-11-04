import { test as teardown } from "@playwright/test";
import { closePool } from "./helpers/db";
import { cleanupOrdering, setOrdering } from "./helpers/ordering";
import { setBookingWizard, setReservationsUrl } from "./helpers/site-settings";

// Back to the shipped default after the suite: /book shows the SpotOn box (BK02).
teardown("restore the reservations defaults", async () => {
  await setBookingWizard(false);
  await setReservationsUrl(null);
  await closePool();
});

// Phase 2: both ordering switches back off and no QA requests or items left behind.
teardown("restore the ordering defaults", async () => {
  await setOrdering({ express_enabled: false, holiday_enabled: false });
  await cleanupOrdering();
  await closePool();
});
