/**
 * Content-Security-Policy builder. next.config.ts sends the site-wide policy;
 * middleware swaps in the /book variant, whose frame-src also allows any
 * https origin because the SpotOn reservations link (BK02) is set in admin
 * and its host is not known at build time. The same variant widens
 * connect-src to https: (18 Nov 2026) so ReservationsFrame can probe that
 * host and fall back to the link and phone when it is unreachable; every
 * other page keeps connect-src to this site plus Google Analytics.
 * tests/unit/board-3nov.test.ts checks the site-wide string still matches
 * next.config.ts.
 *
 * 25 Nov 2026: a policy belongs to the document that was loaded, and a click on
 * "Book a Table" inside the site changes the page without loading a new document,
 * so the /book variant alone left the SpotOn box blocked for most visitors (they
 * saw the fallback card). SpotOn's hosts are therefore allowed on every page;
 * the /book variant still covers any other host set in Admin on a direct load.
 *
 * 25 Nov 2026: Google Analytics 4 (src/components/site/Analytics.tsx) needs
 * the three GA lines below: Google's published CSP list for GA4, plus the hosts
 * Dan's property was seen calling in a browser test (analytics.google.com with no
 * subdomain, and stats.g.doubleclick.net and www.google.com, which the tag uses
 * because the property is linked to Google Ads). Outside the US one audience
 * ping goes to a country domain (www.google.com.ph and so on), which CSP cannot
 * wildcard; it stays blocked there. Page views and events are not affected.
 */
const SPOTON = "https://*.spoton.com";
const GA_SCRIPT = "https://*.googletagmanager.com";
const GA_IMG = "https://*.google-analytics.com https://*.googletagmanager.com https://*.g.doubleclick.net https://www.google.com";
const GA_CONNECT = "https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://*.googletagmanager.com https://*.g.doubleclick.net https://www.google.com";

export function buildCsp({ dev, frameAnyHttps = false }: { dev: boolean; frameAnyHttps?: boolean }): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} ${GA_SCRIPT}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://images.squarespace-cdn.com https://static1.squarespace.com http://static1.squarespace.com ${GA_IMG}`,
    "font-src 'self' data:",
    `connect-src 'self' ${frameAnyHttps ? "https:" : `${GA_CONNECT} ${SPOTON}`}`,
    `frame-src https://maps.google.com https://www.google.com ${frameAnyHttps ? "https:" : SPOTON}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; ");
}
