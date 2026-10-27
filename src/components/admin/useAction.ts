"use client";

import { useCallback, useState } from "react";
import type { ActionResult } from "@/actions/types";

export const ACTION_THREW_MESSAGE = "Something went wrong saving that. Check your connection and try again.";

/**
 * Calls a server action and never throws. Actions report expected failures as
 * `{ ok: false }`, but they can still THROW (revoked session, network drop, 413,
 * DB down). That rejection becomes the same failure shape so callers' existing
 * `res.ok` / `toast.error(res.error)` path handles it.
 */
export async function runAction<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    console.error("Server action threw:", error);
    return { ok: false, error: ACTION_THREW_MESSAGE };
  }
}

/** One boolean busy flag around `runAction`; busy always clears, even on a throw. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async <T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> => {
    setBusy(true);
    try {
      return await runAction(fn);
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, run };
}
