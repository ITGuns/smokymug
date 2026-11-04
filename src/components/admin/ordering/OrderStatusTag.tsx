import { Tag } from "@/components/admin/ui";
import type { OrderRequestStatus } from "@/db/schema";
import { ORDER_STATUS_LABELS } from "@/lib/ordering";

const TONE: Record<OrderRequestStatus, "amber" | "green" | "blue" | "red" | "gray"> = {
  new: "amber",
  confirmed: "green",
  completed: "blue",
  declined: "red",
  cancelled: "gray",
};

export function OrderStatusTag({ status }: { status: OrderRequestStatus }) {
  return <Tag tone={TONE[status]}>{ORDER_STATUS_LABELS[status]}</Tag>;
}
