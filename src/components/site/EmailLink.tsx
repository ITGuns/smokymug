import { cn } from "@/lib/cn";

/**
 * Mailto link that stacks at the @ instead of dropping letters (board H10/CO02).
 * wrap-break-word keeps whole words together; the <wbr> makes the @ the preferred
 * break point, so a long address wraps to "local" / "@domain", never mid-word.
 */
export function EmailLink({ email, className }: { email: string; className?: string }) {
  const at = email.indexOf("@");
  return (
    <a href={`mailto:${email}`} className={cn("wrap-break-word", className)}>
      {at > 0 ? (
        <>
          {email.slice(0, at)}
          <wbr />
          {email.slice(at)}
        </>
      ) : (
        email
      )}
    </a>
  );
}
