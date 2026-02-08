"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { client, partnersQuery, urlFor } from "@/lib/sanity";

interface SanityImage {
  asset: {
    _ref: string;
  };
}

interface Partner {
  _id?: string;
  name: string;
  logo: SanityImage | string;
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
  partners: propPartners,
  title = "Trusted by Leading Organizations",
}: PartnerLogosProps) {
  const [partners, setPartners] = useState<Partner[]>(propPartners || defaultPartners);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Fetch partners from Sanity if not provided via props
  useEffect(() => {
    if (propPartners) return; // Skip if partners provided via props

    async function fetchPartners() {
      try {
        const fetchedPartners = await client.fetch(partnersQuery);
        if (fetchedPartners && fetchedPartners.length > 0) {
          setPartners(fetchedPartners);
        }
      } catch (error) {
        console.error("Error fetching partners:", error);
        // Keep default partners
      }
    }
    fetchPartners();
  }, [propPartners]);

  // Intersection Observer for performance - only animate when visible
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(scrollContainer);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Auto-scroll animation - only runs when visible and reduced motion is not preferred
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || !isVisible || prefersReducedMotion) return;

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
  }, [isVisible, prefersReducedMotion]);

  const getLogoUrl = (logo: SanityImage | string) => {
    if (typeof logo === "string") return logo;
    if (logo.asset) return urlFor(logo).width(128).height(64).url();
    return "/images/partners/placeholder.png";
  };

  // Duplicate partners for seamless scrolling (only if animation is active)
  const displayPartners = prefersReducedMotion
    ? partners
    : [...partners, ...partners];

  return (
    <section className="py-16 bg-gray-50">
      <Container>
        <h2 className="text-2xl md:text-3xl font-bold text-navy text-center mb-10">
          {title}
        </h2>
      </Container>

      <div
        ref={scrollRef}
        className={cn(
          "flex",
          prefersReducedMotion
            ? "flex-wrap justify-center gap-8 px-8"
            : "overflow-hidden"
        )}
        style={
          prefersReducedMotion
            ? undefined
            : { scrollbarWidth: "none", msOverflowStyle: "none" }
        }
      >
        <div className={cn(
          "flex items-center gap-16 px-8",
          prefersReducedMotion && "flex-wrap justify-center"
        )}>
          {displayPartners.map((partner, index) => (
            <div
              key={`${partner._id || partner.name}-${index}`}
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
                      src={getLogoUrl(partner.logo)}
                      alt={`${partner.name} logo`}
                      width={128}
                      height={64}
                      className="object-contain max-h-full"
                    />
                  </div>
                </a>
              ) : (
                <div className="relative w-32 h-16 flex items-center justify-center">
                  <Image
                    src={getLogoUrl(partner.logo)}
                    alt={`${partner.name} logo`}
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
