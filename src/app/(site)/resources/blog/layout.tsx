import { Metadata } from "next";
import { generateBreadcrumbJsonLd } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog & Resources",
  description:
    "Latest news, guides & insights from AFJ Limited Birmingham. SEND transport updates, fleet maintenance tips, driver training resources & industry news.",
};

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: "Home", url: "/" },
  { name: "Blog & Resources", url: "/resources/blog" },
]);

export default function BlogLayout({
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
