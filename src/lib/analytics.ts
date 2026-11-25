/**
 * Google Analytics 4 (Dan, 24 Nov: "here's that analytics key : G-T90P9WP3GQ", the same
 * property the old Squarespace site reports to).
 *
 * Two gates:
 * 1. Server: the tag is rendered only on the Vercel production deployment, on public pages.
 *    Not in local dev, CI, preview builds or /admin.
 * 2. Browser: the tag starts only when the page is open on the restaurant's own domain
 *    (smokymug.com or www.smokymug.com). The demo address smokymug.vercel.app is also the
 *    Vercel production deployment, and visits there by the team must not land in Dan's
 *    reports. Tracking therefore begins by itself the moment the domain points here.
 *
 * NEXT_PUBLIC_GA_ID overrides the ID; set it to "off" to switch the tag off.
 * ENABLE_ANALYTICS=1 forces both gates open (used to verify the tag locally).
 */
export const DEFAULT_GA_ID = "G-T90P9WP3GQ";
export const ANALYTICS_DOMAIN = "smokymug.com";

type Env = Record<string, string | undefined>;

export function analyticsId(env: Env = process.env): string | null {
  const live = env.VERCEL_ENV === "production" || env.ENABLE_ANALYTICS === "1";
  if (!live) return null;
  const id = (env.NEXT_PUBLIC_GA_ID ?? DEFAULT_GA_ID).trim();
  // The ID is written into an inline script, so accept only the GA4 shape.
  return /^G-[A-Z0-9]{6,14}$/.test(id) ? id : null;
}

/** True when the tag may run on this hostname. */
export function analyticsHostAllowed(hostname: string, env: Env = process.env): boolean {
  if (env.ENABLE_ANALYTICS === "1") return true;
  const h = hostname.toLowerCase().replace(/\.$/, "");
  return h === ANALYTICS_DOMAIN || h === `www.${ANALYTICS_DOMAIN}`;
}

/** The inline loader: checks the hostname in the browser, then loads gtag.js. */
export function analyticsSnippet(id: string, env: Env = process.env): string {
  const anyHost = env.ENABLE_ANALYTICS === "1";
  const hostTest = anyHost ? "true" : `/^(www\\.)?${ANALYTICS_DOMAIN.replace(".", "\\.")}$/i.test(location.hostname)`;
  return `(function(){if(!(${hostTest}))return;var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${id}';document.head.appendChild(s);window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${id}');})();`;
}
