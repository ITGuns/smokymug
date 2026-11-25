"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { NewTabCue } from "@/components/ui/NewTabCue";
import { probeUrl } from "@/lib/probe-url";

/**
 * The SpotOn frame, server-rendered as before. On mount a probe checks the
 * reservations host is reachable; if it fails or times out (SpotOn, its CDN
 * or the visitor's network down), the frame is swapped for the plain link and
 * the phone, so nobody is left looking at a broken grey box. The CSP allows
 * the probe and the frame for SpotOn on every page, and for any https host on
 * a direct load of /book (src/lib/csp.ts).
 */
export function ReservationsFrame({ url, phone, tel }: { url: string; phone: string; tel: string }) {
  const [unreachable, setUnreachable] = useState(false);

  useEffect(() => {
    let live = true;
    probeUrl(url).then((ok) => {
      if (live && !ok) setUnreachable(true);
    });
    return () => {
      live = false;
    };
  }, [url]);

  if (unreachable) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-charcoal-900/10 bg-cream-50 p-8 text-center shadow-card">
        <ButtonLink href={url} shape="soft">
          Open reservations ↗
        </ButtonLink>
        <p className="mt-5 text-[15px] text-charcoal-700">
          or call{" "}
          <a href={tel} className="font-semibold text-charcoal-900">
            {phone}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-2xl border border-charcoal-900/10 bg-cream-50 shadow-card">
        <iframe
          src={url}
          title="SpotOn reservations"
          className="block h-[760px] w-full border-0"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        />
      </div>
      <p className="mt-5 text-center text-[15px] text-charcoal-700">
        Box not loading?{" "}
        <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-ember-600 underline-offset-4 hover:underline">
          Open reservations ↗
          <NewTabCue />
        </a>{" "}
        or call{" "}
        <a href={tel} className="font-semibold text-charcoal-900">
          {phone}
        </a>
        .
      </p>
    </div>
  );
}
