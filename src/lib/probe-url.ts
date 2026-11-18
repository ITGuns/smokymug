/**
 * BK02 fallback (18 Nov 2026): can the browser reach this URL at all? A
 * no-cors fetch resolves on any HTTP answer (the response is opaque, which is
 * fine: only reachability matters) and rejects on a network failure. Chrome
 * fires an iframe's load event even for its own error page, so the frame
 * cannot tell us this itself. Resolves true or false, never throws.
 */
export async function probeUrl(
  url: string,
  { timeoutMs = 8000, fetchImpl = fetch }: { timeoutMs?: number; fetchImpl?: typeof fetch } = {},
): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    await fetchImpl(url, { mode: "no-cors", cache: "no-store", credentials: "omit", signal: ctrl.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
