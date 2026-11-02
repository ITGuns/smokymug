import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Fraunces, Instrument_Sans, Rye } from "next/font/google";
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
// Roadstore stand-in on buttons (Guns 2 Nov; Q2 license still open, swap when Dan supplies it)
const rye = Rye({ weight: "400", subsets: ["latin"], variable: "--font-rye", display: "swap" });

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
    <html lang="en" className={`${fraunces.variable} ${sans.variable} ${bebas.variable} ${rye.variable}`}>
      <body>{children}</body>
    </html>
  );
}
