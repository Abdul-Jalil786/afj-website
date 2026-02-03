import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://afjltd.co.uk";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
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
    title: "AFJ Limited - Quality Transportation Services",
    description:
      "Quality transportation services across the UK since 2006. Home-to-School transport, Patient Transport, Private Hire, and more.",
    url: baseUrl,
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AFJ Limited - Quality Transportation Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AFJ Limited - Quality Transportation Services",
    description:
      "Quality transportation services across the UK since 2006.",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add these when you have the verification codes
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "AFJ Limited",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/images/logo.png`,
        width: 120,
        height: 40,
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+44-121-123-4567",
        contactType: "customer service",
        areaServed: "GB",
        availableLanguage: "English",
      },
      sameAs: [
        // Add social media URLs when available
      ],
    },
    {
      "@type": "LocalBusiness",
      "@id": `${baseUrl}/#localbusiness`,
      name: "AFJ Limited",
      image: `${baseUrl}/images/og-image.jpg`,
      url: baseUrl,
      telephone: "+44-121-123-4567",
      email: "info@afjltd.co.uk",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Birmingham",
        addressLocality: "Birmingham",
        addressRegion: "West Midlands",
        addressCountry: "GB",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 52.4862,
        longitude: -1.8904,
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "08:00",
          closes: "18:00",
        },
      ],
      priceRange: "££",
      serviceArea: {
        "@type": "GeoCircle",
        geoMidpoint: {
          "@type": "GeoCoordinates",
          latitude: 52.4862,
          longitude: -1.8904,
        },
        geoRadius: "50000",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: "AFJ Limited",
      publisher: {
        "@id": `${baseUrl}/#organization`,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
