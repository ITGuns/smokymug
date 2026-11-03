import { EVENT_KIND_ICON, type EventKind } from "@/lib/event-kinds";
import { cn } from "@/lib/cn";

/** Decorative: every place it shows also carries the type as text or an aria-label. */
export function EventKindIcon({ kind, className }: { kind: EventKind; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={cn("h-4 w-4 shrink-0", className)} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {EVENT_KIND_ICON[kind].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
