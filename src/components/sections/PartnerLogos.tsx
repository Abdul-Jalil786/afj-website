"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/container";

interface Partner {
  name: string;
  logo: string;
  url?: string;
}

interface PartnerLogosProps {
  partners?: Partner[];
  title?: string;
}

const defaultPartners: Partner[] = [
  { name: "MiDAS", logo: "/images/partners/midas.png" },
  { name: "DVSA", logo: "/images/partners/dvsa.png" },
  { name: "CQC", logo: "/images/partners/cqc.png" },
  { name: "NHS", logo: "/images/partners/nhs.png" },
  { name: "CPT", logo: "/images/partners/cpt.png" },
  { name: "ROSPA", logo: "/images/partners/rospa.png" },
];

export function PartnerLogos({
  partners = defaultPartners,
  title = "Trusted by Leading Organizations",
}: PartnerLogosProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.5;

    const scroll = () => {
      scrollPosition += scrollSpeed;

      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }

      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    const handleMouseEnter = () => cancelAnimationFrame(animationId);
    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(scroll);
    };

    scrollContainer.addEventListener("mouseenter", handleMouseEnter);
    scrollContainer.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      scrollContainer.removeEventListener("mouseenter", handleMouseEnter);
      scrollContainer.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Duplicate partners for seamless scrolling
  const duplicatedPartners = [...partners, ...partners];

  return (
    <section className="py-16 bg-gray-50">
      <Container>
        <h2 className="text-2xl md:text-3xl font-bold text-navy text-center mb-10">
          {title}
        </h2>
      </Container>

      <div
        ref={scrollRef}
        className="flex overflow-hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex items-center gap-16 px-8">
          {duplicatedPartners.map((partner, index) => (
            <div
              key={`${partner.name}-${index}`}
              className="flex-shrink-0 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
            >
              {partner.url ? (
                <a
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="relative w-32 h-16 flex items-center justify-center">
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      width={128}
                      height={64}
                      className="object-contain max-h-full"
                    />
                  </div>
                </a>
              ) : (
                <div className="relative w-32 h-16 flex items-center justify-center">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={128}
                    height={64}
                    className="object-contain max-h-full"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
