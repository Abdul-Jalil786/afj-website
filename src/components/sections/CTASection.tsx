import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

interface CTASectionProps {
  title?: string;
  description?: string;
  primaryCta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
}

export function CTASection({
  title = "Ready to Get Started?",
  description = "Contact us today to discuss your transportation needs. Our team is ready to help you find the perfect solution.",
  primaryCta = { text: "Book Now", href: "/book-now" },
  secondaryCta = { text: "Contact Us", href: "/contact" },
}: CTASectionProps) {
  return (
    <section className="py-20 bg-green">
      <Container>
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {title}
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            {description}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="xl" variant="secondary">
              <Link href={primaryCta.href}>{primaryCta.text}</Link>
            </Button>
            <Button asChild size="xl" variant="outlineWhite">
              <Link href={secondaryCta.href}>{secondaryCta.text}</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
