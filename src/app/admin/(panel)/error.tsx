"use client";

import { useEffect } from "react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("admin error boundary:", error.digest ?? error.message);
  }, [error]);
  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
      <h2 className="text-[16px] font-semibold text-zinc-900">This panel hit an error</h2>
      <p className="mt-2 text-[14px] text-zinc-600">Your work up to the last save is safe. Reload the panel; if it keeps failing, check the database connection.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-4 text-[13px] font-semibold text-white transition hover:bg-zinc-700"
      >
        Reload panel
      </button>
    </div>
  );
}
