"use client";

import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/Button";

/** Shown inside the site chrome when a server render fails (database outage etc.).
    No data access here: everything must work with the request already broken. */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("site error boundary:", error.digest ?? error.message);
  }, [error]);
  return (
    <section className="flex min-h-[70svh] items-center bg-cream-100 pt-28">
      <div className="container-site max-w-xl py-20 text-center">
        <p className="eyebrow text-teal-600">Something went wrong</p>
        <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3rem)] font-semibold text-charcoal-900">
          We couldn&apos;t load this page.
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-charcoal-700">
          Give it another try in a moment. If you&apos;re after a table or takeout right now, call us at{" "}
          <a href="tel:+18045623722" className="font-semibold text-teal-600 hover:underline">
            (804) 562-3722
          </a>
          .
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-6 text-[15px] font-semibold text-cream-50 transition hover:bg-red-500"
          >
            Try again
          </button>
          <ButtonLink href="/" variant="outline" className="text-charcoal-900">
            Back home
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
