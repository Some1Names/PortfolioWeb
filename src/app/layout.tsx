import type { Metadata } from "next";
import localFont from "next/font/local";
import { GeistMono } from "geist/font/mono";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

// Orange Avenue is a DEMO font: personal use only. Buy a licence before any commercial use.
const orangeAvenue = localFont({
  src: "../fonts/OrangeAvenue-Regular.otf",
  variable: "--font-display",
  display: "swap",
});

const orangeAvenueOutline = localFont({
  src: "../fonts/OrangeAvenue-Outline.otf",
  variable: "--font-outline",
  display: "swap",
});

export const metadata: Metadata = {
  // the live address (Vercel serves www; yafuu.xyz redirects to it): link previews (the Open Graph
  // and Twitter images) point here
  metadataBase: new URL("https://www.yafuu.xyz"),
  title: "Uefa — Portfolio Vol. 01",
  description:
    "Applied Computer Science (ACS) student at KMUTT building web applications in Next.js and TypeScript, with a focus on motion and visual systems.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the intro's inline script adds data-intro to <html> before React
    // hydrates (this silences only <html>'s own attributes, not its children)
    <html
      lang="en"
      className={`${orangeAvenue.variable} ${orangeAvenueOutline.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
