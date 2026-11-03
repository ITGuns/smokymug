/**
 * Content-Security-Policy builder. next.config.ts sends the site-wide policy;
 * middleware swaps in the /book variant, whose frame-src also allows any
 * https origin because the SpotOn reservations link (BK02) is set in admin
 * and its host is not known at build time. tests/unit/csp.test.ts checks the
 * site-wide string still matches next.config.ts.
 */
export function buildCsp({ dev, frameAnyHttps = false }: { dev: boolean; frameAnyHttps?: boolean }): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.squarespace-cdn.com https://static1.squarespace.com http://static1.squarespace.com",
    "font-src 'self' data:",
    "connect-src 'self'",
    `frame-src https://maps.google.com https://www.google.com${frameAnyHttps ? " https:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; ");
}
