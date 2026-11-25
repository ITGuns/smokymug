import type { NextConfig } from "next";

// Conservative CSP: inline script/style stay allowed (Next runtime + Tailwind),
// but foreign scripts, frames and form targets are locked out. unsafe-eval is dev-only (HMR).
// 25 Nov 2026: Google Analytics 4 and SpotOn hosts added (same list as src/lib/csp.ts, which a unit test compares).
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://*.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.squarespace-cdn.com https://static1.squarespace.com http://static1.squarespace.com https://*.google-analytics.com https://*.googletagmanager.com https://*.g.doubleclick.net https://www.google.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://*.googletagmanager.com https://*.g.doubleclick.net https://www.google.com https://*.spoton.com",
  "frame-src https://maps.google.com https://www.google.com https://*.spoton.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Keep the DB driver + ORM out of the webpack server bundle; bundling them breaks row mapping in production.
  serverExternalPackages: ["pg"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.squarespace-cdn.com" },
      { protocol: "http", hostname: "static1.squarespace.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["motion"],
    // Default is 1 MB, which rejects most phone photos sent to the image-upload action.
    serverActions: { bodySizeLimit: "4mb" },
  },
  // Dan, 16 Nov: the old site's /holiday preorder page is linked from outside
  // (www.smokymug.com/holiday). Until the December holiday phase ships, send it
  // to catering. Temporary (307), so browsers do not cache it once a real
  // /holiday page exists.
  async redirects() {
    return [
      { source: "/holiday", destination: "/catering", permanent: false },
      // 25 Nov 2026, launch prep: addresses the old Squarespace site used. /home-1 is its home page
      // in its sitemap; /giftcards and /cart no longer exist there but old links and search results
      // may still point at them. Temporary, in case a gift card page is built later.
      { source: "/home-1", destination: "/", permanent: true },
      { source: "/giftcards", destination: "/#programs", permanent: false },
      { source: "/cart", destination: "/", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
