"use client";

import { Phone } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function MobileCta({ phoneHref }: { phoneHref: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/book")) return null;
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 lg:hidden",
        "border-t border-cream-50/10 bg-charcoal-950/90 backdrop-blur-xl",
        "pb-[max(env(safe-area-inset-bottom),12px)] pt-3",
      )}
    >
      <div className="container-site flex items-center gap-3">
        <a
          href={phoneHref}
          aria-label="Call the restaurant"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cream-50/15 text-cream-50"
        >
          <Phone aria-hidden className="h-5 w-5" strokeWidth={1.8} />
        </a>
        <Link
          href="/menu"
          className="flex h-12 flex-1 items-center justify-center rounded-full border border-cream-50/15 font-western text-[15px] tracking-[0.02em] text-cream-50"
        >
          Menu
        </Link>
        {/* Same treatment as every primary CTA (ember fill + western face):
            on phones this bar is the only Book a Table outside the drawer */}
        <Link
          href="/book"
          className="flex h-12 flex-[1.4] items-center justify-center rounded-[10px] bg-ember-600 font-western text-[15px] tracking-[0.02em] text-cream-50 shadow-[0_8px_24px_-8px_rgb(165_79_31/0.8)]"
        >
          Book a Table
        </Link>
      </div>
    </div>
  );
}
