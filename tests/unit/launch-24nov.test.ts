import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { RESTAURANT } from "@/db/seed-data/restaurant";
import { analyticsHostAllowed, analyticsId, analyticsSnippet, DEFAULT_GA_ID } from "@/lib/analytics";
import { buildCsp } from "@/lib/csp";
import { programsHeading } from "@/lib/programs";

// Dan's 24 Nov email (FEEDBACK-client-review-24nov.md)
describe("Google Analytics tag", () => {
  it("uses Dan's measurement ID on the Vercel production deployment only", () => {
    expect(DEFAULT_GA_ID).toBe("G-T90P9WP3GQ");
    expect(analyticsId({ VERCEL_ENV: "production" })).toBe("G-T90P9WP3GQ");
    expect(analyticsId({})).toBeNull();
    expect(analyticsId({ NODE_ENV: "production" })).toBeNull();
    expect(analyticsId({ VERCEL_ENV: "preview" })).toBeNull();
    expect(analyticsId({ ENABLE_ANALYTICS: "1" })).toBe("G-T90P9WP3GQ");
  });

  it("takes an override, and refuses anything that is not a GA4 ID", () => {
    expect(analyticsId({ VERCEL_ENV: "production", NEXT_PUBLIC_GA_ID: "G-ABC1234567" })).toBe("G-ABC1234567");
    expect(analyticsId({ VERCEL_ENV: "production", NEXT_PUBLIC_GA_ID: "off" })).toBeNull();
    expect(analyticsId({ VERCEL_ENV: "production", NEXT_PUBLIC_GA_ID: "" })).toBeNull();
    expect(analyticsId({ VERCEL_ENV: "production", NEXT_PUBLIC_GA_ID: "G-X');alert(1)//" })).toBeNull();
  });

  it("runs only on the restaurant's own domain, not on the demo address", () => {
    expect(analyticsHostAllowed("www.smokymug.com", {})).toBe(true);
    expect(analyticsHostAllowed("smokymug.com", {})).toBe(true);
    expect(analyticsHostAllowed("SmokyMug.com.", {})).toBe(true);
    for (const host of ["smokymug.vercel.app", "localhost", "evil-smokymug.com", "smokymug.com.evil.test", "www.smokymug.co"]) {
      expect(analyticsHostAllowed(host, {}), host).toBe(false);
    }
    expect(analyticsHostAllowed("localhost", { ENABLE_ANALYTICS: "1" })).toBe(true);
    // The browser-side check inside the loader agrees with the function above
    const snippet = analyticsSnippet("G-T90P9WP3GQ", {});
    const source = snippet.match(/if\(!\((\/.+?\/i)\.test\(location\.hostname\)\)\)return;/)![1];
    const re = new RegExp(source.slice(1, -2), "i");
    for (const [host, ok] of [["www.smokymug.com", true], ["smokymug.com", true], ["smokymug.vercel.app", false], ["xsmokymug.com", false], ["smokymug.com.evil.test", false]] as const) {
      expect(re.test(host), host).toBe(ok);
    }
    expect(snippet).toContain("https://www.googletagmanager.com/gtag/js?id=G-T90P9WP3GQ");
    expect(snippet).toContain("gtag('config','G-T90P9WP3GQ')");
  });

  it("is allowed by the content security policy on every public page", () => {
    for (const csp of [buildCsp({ dev: false }), buildCsp({ dev: false, frameAnyHttps: true })]) {
      expect(csp).toMatch(/script-src [^;]*https:\/\/\*\.googletagmanager\.com/);
      expect(csp).toMatch(/img-src [^;]*https:\/\/\*\.google-analytics\.com/);
    }
    expect(buildCsp({ dev: false })).toMatch(/connect-src [^;]*https:\/\/\*\.google-analytics\.com [^;]*https:\/\/\*\.analytics\.google\.com/);
    // The hosts a browser test saw this property actually call: every hit goes to
    // analytics.google.com (no subdomain), with pings to doubleclick and www.google.com.
    const siteWide = buildCsp({ dev: false });
    const directive = (name: string) => ` ${siteWide.split("; ").find((d) => d.startsWith(name + " "))} `;
    for (const host of ["https://analytics.google.com", "https://*.g.doubleclick.net", "https://www.google.com"]) {
      expect(directive("connect-src"), host).toContain(` ${host} `);
    }
    for (const host of ["https://*.g.doubleclick.net", "https://www.google.com"]) expect(directive("img-src"), host).toContain(` ${host} `);
    expect(buildCsp({ dev: false, frameAnyHttps: true })).toMatch(/connect-src 'self' https:;/);
  });

  it("the SpotOn reservations box is allowed on every page, not only on a direct load of /book", () => {
    // A click on Book a Table changes the page without a new document, so the first page's policy applies.
    for (const csp of [buildCsp({ dev: false }), buildCsp({ dev: true })]) {
      expect(csp).toMatch(/frame-src [^;]*https:\/\/\*\.spoton\.com/);
      expect(csp).toMatch(/connect-src [^;]*https:\/\/\*\.spoton\.com/);
    }
  });
});

describe("old Squarespace addresses", () => {
  it("land somewhere on the new site", async () => {
    const redirects = await nextConfig.redirects!();
    const to = (source: string) => redirects.find((r) => r.source === source);
    expect(to("/home-1")).toMatchObject({ destination: "/", permanent: true });
    expect(to("/giftcards")).toMatchObject({ destination: "/#programs", permanent: false });
    expect(to("/cart")).toMatchObject({ destination: "/", permanent: false });
    expect(to("/holiday")).toMatchObject({ destination: "/catering", permanent: false });
  });
});

describe("gift cards and loyalty links", () => {
  it("seed carries Dan's SpotOn loyalty link and no Toast links", () => {
    expect(RESTAURANT.loyaltyUrl).toBe("https://l.spoton.com/XGR6MV");
    expect(RESTAURANT.giftCardUrl).toBeNull();
    expect(RESTAURANT.giftCardBalanceUrl).toBeNull();
    expect(RESTAURANT.marketingSignupUrl).toBeNull();
    expect(JSON.stringify(RESTAURANT)).not.toContain("toasttab");
  });

  it("the section heading names only what is linked", () => {
    const none = { giftCardUrl: null, giftCardBalanceUrl: null, loyaltyUrl: null };
    expect(programsHeading({ ...none, loyaltyUrl: "https://l.spoton.com/XGR6MV" })).toBe("Loyalty");
    expect(programsHeading({ ...none, giftCardUrl: "https://x.test/g", loyaltyUrl: "https://x.test/l" })).toBe("Gift cards & loyalty");
    expect(programsHeading({ ...none, giftCardBalanceUrl: "https://x.test/b" })).toBe("Gift cards");
    expect(programsHeading(none)).toBe("Stay in touch");
  });
});
