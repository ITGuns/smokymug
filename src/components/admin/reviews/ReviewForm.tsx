"use client";

import { useState } from "react";
import { saveReview } from "@/actions/reviews";
import { useToast } from "@/components/admin/toast";
import { useAction } from "@/components/admin/useAction";
import { Btn, Checkbox, Field, Input, Select, Textarea } from "@/components/admin/ui";
import type { Review } from "@/db/schema";
import { REVIEW_SOURCES } from "@/lib/reviews";

/** Add (review = null) or edit one review. Everything is copied from the platform, nothing is made up here. */
export function ReviewForm({ review, today, onDone }: { review: Review | null; today: string; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({
    reviewerName: review?.reviewerName ?? "",
    platform: review?.platform ?? "",
    rating: review?.rating != null ? String(review.rating) : "",
    reviewDate: review?.reviewDate ?? "",
    body: review?.body ?? "",
    active: review?.active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { busy, run } = useAction();
  const set = (patch: Partial<typeof f>) => setF((prev) => ({ ...prev, ...patch }));

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const res = await run(() => saveReview({ ...f, id: review?.id }));
    if (res.ok) {
      toast.success(review ? "Review saved" : "Review added", "Live on the home page now if it's one of the newest good ones.");
      onDone();
    } else {
      setErrors(res.fieldErrors ?? {});
      toast.error(res.error);
    }
  };

  const err = (k: keyof typeof f) => errors[k];

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {review && !review.adminAdded && !review.body && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-[13px] text-sky-800">
          This is a starter summary ({review.themes.join(", ")}). Fill in the details from the original review on {review.platform}.
        </p>
      )}
      <Field label="Reviewer name" htmlFor="rv-name" error={err("reviewerName")} hint="As it appears on the review, for example a first name and last initial." required>
        <Input id="rv-name" value={f.reviewerName} onChange={(e) => set({ reviewerName: e.target.value })} maxLength={60} required aria-invalid={!!err("reviewerName") || undefined} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Posted on" htmlFor="rv-source" error={err("platform")} required>
          <Select id="rv-source" value={f.platform} onChange={(e) => set({ platform: e.target.value })} required aria-invalid={!!err("platform") || undefined}>
            <option value="" disabled>Pick a site</option>
            {REVIEW_SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Stars" htmlFor="rv-rating" error={err("rating")} required>
          <Select id="rv-rating" value={f.rating} onChange={(e) => set({ rating: e.target.value })} required aria-invalid={!!err("rating") || undefined}>
            <option value="" disabled>Pick a rating</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? "star" : "stars"}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Review date" htmlFor="rv-date" error={err("reviewDate")} hint="The date shown on the review. The newest good reviews go on the home page." required>
        <Input id="rv-date" type="date" value={f.reviewDate} max={today} onChange={(e) => set({ reviewDate: e.target.value })} required aria-invalid={!!err("reviewDate") || undefined} />
      </Field>
      <Field label="Review text" htmlFor="rv-body" error={err("body")} hint="Paste it as written. Up to 1,000 characters." required>
        <Textarea id="rv-body" value={f.body} onChange={(e) => set({ body: e.target.value })} maxLength={1000} rows={6} required aria-invalid={!!err("body") || undefined} />
      </Field>
      <Checkbox checked={f.active} onChange={(v) => set({ active: v })} label="Show on the website" />
      <div className="flex justify-end gap-2 pt-2">
        <Btn type="button" variant="ghost" onClick={onDone}>Cancel</Btn>
        <Btn type="submit" variant="primary" loading={busy}>{review ? "Save" : "Add review"}</Btn>
      </div>
    </form>
  );
}
