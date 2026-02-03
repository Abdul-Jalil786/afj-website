import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

interface AboutSectionProps {
  title?: string;
  content?: string;
  image?: string;
  features?: string[];
  cta?: {
    text: string;
    href: string;
  };
}

export function AboutSection({
  title = "About AFJ Limited",
  content = "Since 2006, AFJ Limited has been at the forefront of providing quality transportation services across the UK. We are committed to safety, reliability, and exceptional customer service in everything we do.",
  image = "/images/about.jpg",
  features = [
    "18+ years of industry experience",
    "Fully trained and DBS checked drivers",
    "Modern, well-maintained fleet",
    "24/7 customer support",
    "Competitive pricing",
    "Full insurance coverage",
  ],
  cta = { text: "Learn More About Us", href: "/about" },
}: AboutSectionProps) {
  return (
    <section className="py-20">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="relative">
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
              <Image
                src={image}
                alt="About AFJ Limited"
                fill
                className="object-cover"
              />
            </div>
            {/* Decorative Element */}
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-green/10 rounded-2xl -z-10" />
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-navy/10 rounded-2xl -z-10" />
          </div>

          {/* Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-6">
              {title}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {content}
            </p>

            {/* Features List */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {cta && (
              <Button asChild size="lg">
                <Link href={cta.href}>{cta.text}</Link>
              </Button>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
