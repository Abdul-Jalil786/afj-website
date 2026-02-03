import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AFJ Limited - Quality Transportation Services",
    template: "%s | AFJ Limited",
  },
  description:
    "AFJ Limited provides quality transportation services across the UK including Home-to-School transport, Non-Emergency Patient Transport, Private Hire, Fleet Maintenance, Vehicle Conversions, and Training since 2006.",
  keywords: [
    "transportation",
    "home to school transport",
    "NEPTS",
    "patient transport",
    "private hire",
    "fleet maintenance",
    "vehicle conversions",
    "driver training",
    "UK transport",
    "Birmingham transport",
  ],
  authors: [{ name: "AFJ Limited" }],
  creator: "AFJ Limited",
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "AFJ Limited",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
