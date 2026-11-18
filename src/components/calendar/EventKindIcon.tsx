import { createElement } from "react";
import { Ban } from "lucide-react";
import { eventKindIcon } from "@/lib/event-kinds";
import { cn } from "@/lib/cn";

/** Decorative: every place it shows also carries the type as text or an aria-label. */
export function EventKindIcon({ kind, className }: { kind: string; className?: string }) {
  return createElement(eventKindIcon(kind), { "aria-hidden": true, className: cn("h-4 w-4 shrink-0", className), strokeWidth: 2 });
}

/** F10: a closed day (a circle with a slash). Decorative like the type icons. */
export function ClosedIcon({ className }: { className?: string }) {
  return <Ban aria-hidden className={cn("h-4 w-4 shrink-0", className)} strokeWidth={2} />;
}
