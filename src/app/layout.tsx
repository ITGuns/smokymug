import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Fraunces, Instrument_Sans } from "next/font/google";
import localFont from "next/font/local";
import { SITE_URL } from "@/lib/constants";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans-body", display: "swap" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas", display: "swap" });
// Roadstore (row 16, 9 Nov 2026): display face for headings and CTAs. The dafont demo copy
// is caps only and stamps a "personal use" mark on most digits and on & ? ! $ @ #, so the
// unicode-range keeps only its clean glyphs; everything else falls through to Bebas Neue.
// Personal-use demo: the foundry Standard Webfont license must be bought before launch.
const roadstore = localFont({
  src: "../fonts/Roadstore.ttf",
  variable: "--font-roadstore",
  display: "swap",
  adjustFontFallback: false,
  declarations: [
    { prop: "unicode-range", value: "U+0020, U+0022, U+0025, U+0027-0031, U+003A-003E, U+0041-007E, U+2013, U+2018-201D, U+2026" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Smoky Mug | Texas Craft BBQ + Cafe in Brookland Park, Richmond VA",
    template: "%s | The Smoky Mug",
  },
  // Board copy (H02/R2-02): the old heading and paragraph were struck by the client.
  description:
    "All-Day Craft, Tex-Mex & Barbecue Kitchen in Northside Richmond, VA. A morning to night Tex-Mex experience including slow smoked brisket, pulled pork, ribs, and more. Accompanied by a full espresso bar, pastry program, and crafted cocktails.",
  openGraph: {
    type: "website",
    siteName: "The Smoky Mug",
    locale: "en_US",
    images: [{ url: "/images/og-square-logo.png", width: 401, height: 401, alt: "The Smoky Mug" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#161311",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${sans.variable} ${bebas.variable} ${roadstore.variable}`}>
      <body>{children}</body>
    </html>
  );
}
