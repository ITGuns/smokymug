import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Fraunces, Instrument_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Smoky Mug | Texas Craft BBQ + Cafe in Brookland Park, Richmond VA",
    template: "%s | The Smoky Mug",
  },
  description:
    "Cafe & Craft Barbecue & Tex-Mex Kitchen in Northside Richmond, VA. Coffee and elevated cafe fare served every day. Top class brisket, pulled pork, ribs, and more smoked on site and plated through a unique rotating Tex-mex menu.",
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
    <html lang="en" className={`${fraunces.variable} ${sans.variable} ${bebas.variable}`}>
      <body>{children}</body>
    </html>
  );
}
