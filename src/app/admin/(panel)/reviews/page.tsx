import type { Metadata } from "next";
import { ReviewsManager } from "@/components/admin/reviews/ReviewsManager";
import { PageHeader } from "@/components/admin/ui";
import { getClock } from "@/lib/availability";
import { readAllReviews, readBookingSettings } from "@/lib/data/restaurant";
import { GOOD_RATING, HOME_REVIEW_LIMIT, reviewFreshness, selectHomeReviews } from "@/lib/reviews";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsAdminPage() {
  const [{ rows, available }, settings] = await Promise.all([readAllReviews(), readBookingSettings()]);
  const today = getClock(settings.timezone).date;
  const shown = selectHomeReviews(rows);
  return (
    <>
      <PageHeader
        title="Reviews"
        description={`The home page shows the ${HOME_REVIEW_LIMIT} newest reviews rated ${GOOD_RATING} stars or more. Add a new good review and the oldest one drops off on its own. Changes go live immediately.`}
      />
      <ReviewsManager reviews={rows} shownIds={shown.map((r) => r.id)} freshness={reviewFreshness(shown, today)} today={today} available={available} />
    </>
  );
}
