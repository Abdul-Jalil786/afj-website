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
    default: "SEND Transport Birmingham | Patient Transport Services | AFJ Limited",
    template: "%s | AFJ Limited",
  },
  description:
    "AFJ Limited provides SEND home-to-school transport and patient transport services in Birmingham & West Midlands. ISO 9001 certified, CQC registered. Fleet maintenance, vehicle conversions & driver training since 2006.",
  keywords: [
    "SEND transport Birmingham",
    "patient transport West Midlands",
    "school transport provider Birmingham",
    "fleet maintenance Birmingham",
    "vehicle conversions West Midlands",
    "driver training Birmingham",
    "NHS transport services",
    "council transport provider",
    "home to school transport",
    "NEPTS",
    "private hire Birmingham",
    "wheelchair accessible transport",
  ],
  authors: [{ name: "AFJ Limited" }],
  creator: "AFJ Limited",
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "AFJ Limited",
    title: "SEND Transport Birmingham | Patient Transport Services | AFJ Limited",
    description:
      "SEND home-to-school transport and patient transport services in Birmingham & West Midlands since 2006. ISO 9001 certified, CQC registered.",
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
    site: "@AFJLimited",
    title: "SEND Transport Birmingham | Patient Transport Services | AFJ Limited",
    description:
      "SEND home-to-school transport and patient transport services in Birmingham & West Midlands since 2006.",
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
        telephone: "+44-121-689-1000",
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
      telephone: "+44-121-689-1000",
      email: "info@afjltd.co.uk",
      address: {
        "@type": "PostalAddress",
        streetAddress: "AFJ Business Centre, 2-18 Forster Street",
        addressLocality: "Nechells, Birmingham",
        postalCode: "B7 4JD",
        addressRegion: "West Midlands",
        addressCountry: "GB",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 52.4930,
        longitude: -1.8780,
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "06:00",
          closes: "19:00",
        },
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Saturday"],
          opens: "09:00",
          closes: "13:00",
        },
      ],
      priceRange: "££",
      serviceArea: {
        "@type": "GeoCircle",
        geoMidpoint: {
          "@type": "GeoCoordinates",
          latitude: 52.4930,
          longitude: -1.8780,
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
        <link rel="preconnect" href="https://cdn.sanity.io" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
