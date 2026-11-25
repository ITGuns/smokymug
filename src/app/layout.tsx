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
// Rye (25 Nov 2026): display face for headings and CTAs. Dan, 12 Nov: "I like Rye as well.
// Wonder if I can get that input to see the look?"; 24 Nov: "I don't see Rye as the font. Did I
// miss my window?". Rye is SIL Open Font licensed (src/fonts/Rye-LICENSE-OFL.txt), free for
// commercial use, so it also lifts the Roadstore license launch gate. Self-hosted so the
// size-adjust below is possible: Rye is far wider than the condensed Roadstore the heading
// sizes were tuned for, and size-adjust scales its glyphs in one place instead of in every
// heading class. Characters outside the latin file fall through to Bebas Neue.
const rye = localFont({
  src: "../fonts/Rye-Regular-latin.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-rye",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "size-adjust", value: "82%" }],
});
// Same file at its natural size for button labels. The 82% above is for headings (line
// counts); at 13 to 16px it left CTA labels smaller than the nav beside them and broke up
// Rye's inline detail on 1x screens. This is the Rye size Dan saw on the buttons 2 to 9 Nov.
const ryeLabel = localFont({
  src: "../fonts/Rye-Regular-latin.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-rye-label",
  display: "swap",
  adjustFontFallback: false,
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
    <html lang="en" className={`${fraunces.variable} ${sans.variable} ${bebas.variable} ${rye.variable} ${ryeLabel.variable}`}>
      <body>{children}</body>
    </html>
  );
}
