"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

interface HeroSlide {
  headline: string;
  subheadline?: string;
  image: string;
  cta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
}

interface HeroCarouselProps {
  slides?: HeroSlide[];
}

const defaultSlides: HeroSlide[] = [
  {
    headline: "Quality Transportation Services Since 2006",
    subheadline:
      "Providing safe, reliable, and professional transport solutions across the UK",
    image: "/images/placeholder.svg",
    cta: { text: "Our Services", href: "/services" },
    secondaryCta: { text: "Contact Us", href: "/contact" },
  },
  {
    headline: "Home-to-School Transport",
    subheadline:
      "Safe and reliable transport for students with special educational needs",
    image: "/images/placeholder.svg",
    cta: { text: "Learn More", href: "/services/home-to-school" },
    secondaryCta: { text: "Book Now", href: "/book-now" },
  },
  {
    headline: "Non-Emergency Patient Transport",
    subheadline:
      "Compassionate care for patients requiring medical appointments",
    image: "/images/placeholder.svg",
    cta: { text: "Our NEPTS Service", href: "/services/nepts" },
    secondaryCta: { text: "Get a Quote", href: "/contact" },
  },
];

function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}

export function HeroCarousel({ slides = defaultSlides }: HeroCarouselProps) {
  const prefersReducedMotion = useReducedMotion();
  const autoplayPlugin = useMemo(
    () => Autoplay({ delay: 6000, stopOnInteraction: false }),
    []
  );
  const autoplayRef = useRef(autoplayPlugin);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    autoplayRef.current,
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(!prefersReducedMotion);

  // Respect prefers-reduced-motion
  useEffect(() => {
    if (prefersReducedMotion) {
      autoplayRef.current.stop();
      setIsPlaying(false);
    }
  }, [prefersReducedMotion]);

  const toggleAutoplay = useCallback(() => {
    if (isPlaying) {
      autoplayRef.current.stop();
      setIsPlaying(false);
    } else {
      autoplayRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <section className="relative -mt-20" aria-roledescription="carousel" aria-label="Hero slides">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => (
            <div
              key={index}
              className="flex-[0_0_100%] min-w-0 relative"
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${slides.length}`}
            >
              {/* Background Image */}
              <div className="relative h-[600px] md:h-[700px] lg:h-[800px]">
                <div className="absolute inset-0 bg-navy">
                  {slide.image && (
                    <Image
                      src={slide.image}
                      alt={slide.headline}
                      fill
                      className="object-cover opacity-40"
                      priority={index === 0}
                    />
                  )}
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/70 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex items-center">
                  <Container>
                    <div className="max-w-2xl pt-20">
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                        {slide.headline}
                      </h1>
                      {slide.subheadline && (
                        <p className="text-lg md:text-xl text-white/80 mb-8">
                          {slide.subheadline}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4">
                        {slide.cta && (
                          <Button asChild size="xl">
                            <Link href={slide.cta.href}>{slide.cta.text}</Link>
                          </Button>
                        )}
                        {slide.secondaryCta && (
                          <Button asChild variant="outlineWhite" size="xl">
                            <Link href={slide.secondaryCta.href}>
                              {slide.secondaryCta.text}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Container>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors hidden md:block"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors hidden md:block"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots and Pause/Play */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-colors",
              selectedIndex === index ? "bg-green" : "bg-white/50 hover:bg-white/75"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
        <button
          onClick={toggleAutoplay}
          className="ml-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
          aria-label={isPlaying ? "Pause carousel" : "Play carousel"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
      </div>
    </section>
  );
}
