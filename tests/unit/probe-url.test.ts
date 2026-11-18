import { describe, expect, it } from "vitest";
import { probeUrl } from "@/lib/probe-url";

// BK02 fallback (18 Nov 2026): the /book frame swaps for the link and phone
// only when the reservations host cannot be reached.
const URL = "https://reserve.example.test/restaurant/1";

describe("probeUrl", () => {
  it("is true when the host answers, with a no-cors, uncached, credential-free request", async () => {
    const seen: RequestInit[] = [];
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      seen.push(init);
      return new Response(null, { status: 200 });
    }) as unknown as typeof fetch;
    expect(await probeUrl(URL, { fetchImpl })).toBe(true);
    expect(seen[0]).toMatchObject({ mode: "no-cors", cache: "no-store", credentials: "omit" });
  });

  it("is false when the network request fails", async () => {
    const fetchImpl = (async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    expect(await probeUrl(URL, { fetchImpl })).toBe(false);
  });

  it("is false when the host does not answer before the timeout", async () => {
    const fetchImpl = ((_url: string, init: RequestInit) =>
      new Promise((_, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      })) as unknown as typeof fetch;
    expect(await probeUrl(URL, { fetchImpl, timeoutMs: 20 })).toBe(false);
  });
});
