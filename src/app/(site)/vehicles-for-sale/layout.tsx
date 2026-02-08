import { Metadata } from "next";
import { generateBreadcrumbJsonLd } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Vehicles for Sale",
  description:
    "Quality pre-owned minibuses & wheelchair accessible vehicles for sale in Birmingham. Fully serviced with warranty options. WAVs, minibuses & commercial vehicles.",
};

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: "Home", url: "/" },
  { name: "Vehicles for Sale", url: "/vehicles-for-sale" },
]);

export default function VehiclesLayout({
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
