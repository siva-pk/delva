import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteHeader } from "@/components/SiteHeader";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://delva.app"),
  title: "Delva — a private focus timer that learns how long things actually take you",
  description:
    "Name a session, say how long you think it'll take. Delva times it and, over weeks, builds a picture of your real pace.",
  openGraph: {
    title: "Delva",
    description:
      "A private focus timer that learns how long things actually take you.",
    url: "https://delva.app",
    siteName: "Delva",
    type: "website",
  },
};

// Typed explicitly rather than with Next's generated `LayoutProps<"/">` global,
// which lives in gitignored build output — `npm run typecheck` on a fresh clone
// fails before anything has been built.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
