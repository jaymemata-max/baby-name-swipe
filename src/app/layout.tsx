import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "./globals.css";

// Bundled with the app so production and CI builds never depend on Google Fonts.
const displayFont = localFont({
  src: "./fonts/fraunces-latin.woff2",
  weight: "400 700",
  variable: "--font-display",
  display: "swap",
});

const bodyFont = localFont({
  src: "./fonts/plus-jakarta-sans-latin.woff2",
  weight: "400 700",
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Baby Names",
  description: "Swipe baby names, match on the ones you both love.",
  applicationName: "Baby Names",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Baby Names",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Baby Names",
    description: "Swipe baby names, match on the ones you both love.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#191217" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
