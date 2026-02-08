import { Metadata } from "next";
import { generateBreadcrumbJsonLd } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join AFJ Limited, Birmingham's trusted transport provider. Driving, operations & maintenance jobs available. Competitive pay, full training, career progression.",
};

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: "Home", url: "/" },
  { name: "Careers", url: "/careers" },
]);

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
