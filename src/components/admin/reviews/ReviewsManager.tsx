"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteReview, setReviewVisible } from "@/actions/reviews";
import { ConfirmDialog, Drawer } from "@/components/admin/overlays";
import { useToast } from "@/components/admin/toast";
import { useAction } from "@/components/admin/useAction";
import { Btn, Card, EmptyState, Tag } from "@/components/admin/ui";
import type { Review } from "@/db/schema";
import { NEEDS_DB_PUSH } from "@/lib/db-errors";
import { cn } from "@/lib/cn";
import { compareReviews, GOOD_RATING, STALE_AFTER_DAYS, type Freshness } from "@/lib/reviews";
import { ReviewForm } from "./ReviewForm";

// C9 / board H06 (4 Nov 2026): add, edit, hide and delete reviews. No manual
// order: the home page picks the newest good ones itself.

type Props = { reviews: Review[]; shownIds: number[]; freshness: Freshness; today: string; available: boolean };

export function ReviewsManager({ reviews, shownIds, freshness, today, available }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<Review | "new" | null>(null);
  const [removing, setRemoving] = useState<Review | null>(null);
  const removeAction = useAction();
  const toggleAction = useAction();
  const shown = new Set(shownIds);
  const list = [...reviews].sort(compareReviews);

  const remove = async () => {
    if (!removing) return;
    const res = await removeAction.run(() => deleteReview(removing.id));
    setRemoving(null);
    if (res.ok) {
      toast.success("Review deleted", "It's off the home page.");
      router.refresh();
    } else toast.error(res.error);
  };

  const toggle = async (r: Review) => {
    const res = await toggleAction.run(() => setReviewVisible({ id: r.id, active: !r.active }));
    if (res.ok) {
      toast.success(r.active ? "Review hidden" : "Review shown");
      router.refresh();
    } else toast.error(res.error);
  };

  const addButton = (
    <Btn size="sm" variant="primary" disabled={!available} onClick={() => setEditing("new")}>
      + Add review
    </Btn>
  );

  return (
    <>
      {!available && <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">{NEEDS_DB_PUSH}</p>}
      {available && <FreshnessNote freshness={freshness} />}

      {list.length === 0 ? (
        <EmptyState title="No reviews yet" body="Copy a recent good review from Google or Yelp. It shows on the home page right away." action={addButton} />
      ) : (
        <Card title="All reviews" description="Newest first. Rows marked On home page are the ones guests see now." actions={addButton} padded={false}>
          <ul className="divide-y divide-zinc-100" aria-label="Reviews">
            {list.map((r) => (
              <ReviewRow key={r.id} review={r} onHome={shown.has(r.id)} busy={toggleAction.busy} canEdit={available} onEdit={() => setEditing(r)} onToggle={() => void toggle(r)} onRemove={() => setRemoving(r)} />
            ))}
          </ul>
        </Card>
      )}

      <Drawer open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add a review" : "Edit review"} width="max-w-md">
        {editing !== null && (
          <ReviewForm key={editing === "new" ? "new" : editing.id} review={editing === "new" ? null : editing} today={today} onDone={() => { setEditing(null); router.refresh(); }} />
        )}
      </Drawer>
      <ConfirmDialog
        open={!!removing}
        title="Delete this review?"
        body="It comes off the home page right away and can't be brought back here. To keep it for later, use Hide instead."
        confirmLabel="Delete review"
        loading={removeAction.busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}

function FreshnessNote({ freshness }: { freshness: Freshness }) {
  if (freshness.state === "fresh") return null;
  const text =
    freshness.state === "undated"
      ? "None of the reviews on the home page has a date yet. Add a recent good review from Google or Yelp so the section shows guests what people are saying now."
      : `The newest review on the home page is ${freshness.days} days old. Add a recent good review from Google or Yelp to keep the section fresh (the nudge shows after ${STALE_AFTER_DAYS} days).`;
  return (
    <p role="note" data-review-nudge className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
      {text}
    </p>
  );
}

type RowProps = { review: Review; onHome: boolean; busy: boolean; canEdit: boolean; onEdit: () => void; onToggle: () => void; onRemove: () => void };

function ReviewRow({ review: r, onHome, busy, canEdit, onEdit, onToggle, onRemove }: RowProps) {
  const name = r.reviewerName ?? r.reviewerInitials;
  const summary = r.body ?? r.themes.join(", ");
  const low = r.rating != null && r.rating < GOOD_RATING;
  return (
    <li className={cn("flex flex-wrap items-start gap-3 px-4 py-3 sm:flex-nowrap", !r.active && "opacity-60")}>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]">
          <span className="font-medium text-zinc-900">{name}</span>
          <span className="text-zinc-500">{r.platform}</span>
          <span className="tabular-nums text-zinc-600">{r.rating != null ? `${r.rating} of 5 stars` : "No rating"}</span>
          <span className="tabular-nums text-zinc-500">{r.reviewDate ?? "No date"}</span>
        </p>
        {summary && <p className="mt-1 line-clamp-2 text-[13px] text-zinc-600">{summary}</p>}
        <p className="mt-1.5 flex flex-wrap gap-1.5">
          {onHome && <Tag tone="green">On home page</Tag>}
          {!r.active && <Tag>Hidden</Tag>}
          {r.active && low && <Tag tone="amber">Under {GOOD_RATING} stars, not shown</Tag>}
          {!r.adminAdded && <Tag tone="blue">Starter summary</Tag>}
        </p>
      </div>
      <div className="ml-auto flex shrink-0 gap-1">
        <Btn size="sm" aria-label={`Edit review by ${name}`} disabled={!canEdit} onClick={onEdit}>Edit</Btn>
        <Btn size="sm" variant="ghost" aria-label={`${r.active ? "Hide" : "Show"} review by ${name}`} disabled={busy} onClick={onToggle}>{r.active ? "Hide" : "Show"}</Btn>
        <Btn size="sm" variant="dangerGhost" aria-label={`Delete review by ${name}`} onClick={onRemove}>Delete</Btn>
      </div>
    </li>
  );
}
