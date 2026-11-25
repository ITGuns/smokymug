import Script from "next/script";
import { analyticsId, analyticsSnippet } from "@/lib/analytics";

/** GA4 tag for the public site (see src/lib/analytics.ts for when it renders and when it
 *  runs). The hosts it talks to are allowed in src/lib/csp.ts. The property counts
 *  client-side page changes on its own (enhanced measurement), so there is no route listener. */
export function Analytics() {
  const id = analyticsId();
  if (!id) return null;
  return (
    <Script id="ga4-init" strategy="afterInteractive">
      {analyticsSnippet(id)}
    </Script>
  );
}
