"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Star, Quote, Pause, Play } from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { client, testimonialsQuery, urlFor } from "@/lib/sanity";

interface SanityImage {
  asset: {
    _ref: string;
  };
}

interface Testimonial {
  _id?: string;
  name: string;
  role?: string;
  company?: string;
  content: string;
  rating?: number;
  image?: SanityImage | string;
}

interface TestimonialsSliderProps {
  testimonials?: Testimonial[];
  title?: string;
  subtitle?: string;
}

const defaultTestimonials: Testimonial[] = [
  {
    name: "Sarah Johnson",
    role: "Transport Manager",
    company: "Birmingham City Council",
    content:
      "AFJ Limited has been an invaluable partner for our home-to-school transport services. Their commitment to safety and reliability is second to none.",
    rating: 5,
  },
  {
    name: "Michael Roberts",
    role: "Operations Director",
    company: "Regional NHS Trust",
    content:
      "The patient transport service provided by AFJ is exceptional. Their drivers are compassionate, professional, and always on time.",
    rating: 5,
  },
  {
    name: "Emma Williams",
    role: "HR Manager",
    company: "Corporate Solutions Ltd",
    content:
      "We've used AFJ for corporate events and airport transfers. The service is always impeccable, and their fleet is modern and comfortable.",
    rating: 5,
  },
  {
    name: "David Thompson",
    role: "Fleet Manager",
    company: "Transport Solutions UK",
    content:
      "Their fleet maintenance service has significantly reduced our downtime. The team is knowledgeable and responsive.",
    rating: 5,
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex space-x-1" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-5 w-5",
            star <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300"
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function TestimonialsSlider({
  testimonials: propTestimonials,
  title = "What Our Clients Say",
  subtitle = "Trusted by organizations across the UK",
}: TestimonialsSliderProps) {
  const prefersReducedMotion = useReducedMotion();
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    propTestimonials || defaultTestimonials
  );
  const autoplayPlugin = useMemo(
    () => Autoplay({ delay: 5000, stopOnInteraction: false }),
    []
  );
  const autoplayRef = useRef(autoplayPlugin);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, [
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

  // Fetch testimonials from Sanity if not provided via props
  useEffect(() => {
    if (propTestimonials) return; // Skip if testimonials provided via props

    async function fetchTestimonials() {
      try {
        const fetchedTestimonials = await client.fetch(testimonialsQuery);
        if (fetchedTestimonials && fetchedTestimonials.length > 0) {
          setTestimonials(fetchedTestimonials);
        }
      } catch (error) {
        console.error("Error fetching testimonials:", error);
        // Keep default testimonials
      }
    }
    fetchTestimonials();
  }, [propTestimonials]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

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

  const getImageUrl = (image?: SanityImage | string) => {
    if (!image) return null;
    if (typeof image === "string") return image;
    if (image.asset) return urlFor(image).width(96).height(96).url();
    return null;
  };

  return (
    <section className="py-20 bg-white" aria-roledescription="carousel" aria-label="Client testimonials">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground">{subtitle}</p>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-4">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial._id || index}
                  className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-4"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`Testimonial ${index + 1} of ${testimonials.length}`}
                >
                  <div className="bg-gray-50 rounded-2xl p-8 h-full flex flex-col">
                    {/* Quote Icon */}
                    <Quote className="h-10 w-10 text-green/20 mb-4" aria-hidden="true" />

                    {/* Rating */}
                    {testimonial.rating && (
                      <div className="mb-4">
                        <StarRating rating={testimonial.rating} />
                      </div>
                    )}

                    {/* Content */}
                    <p className="text-gray-700 mb-6 flex-1 leading-relaxed">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>

                    {/* Author */}
                    <div className="flex items-center">
                      {getImageUrl(testimonial.image) ? (
                        <Image
                          src={getImageUrl(testimonial.image)!}
                          alt={`${testimonial.name}, ${testimonial.role || "Client"}`}
                          width={48}
                          height={48}
                          className="rounded-full mr-4"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center mr-4 font-semibold">
                          {testimonial.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-navy">
                          {testimonial.name}
                        </div>
                        {(testimonial.role || testimonial.company) && (
                          <div className="text-sm text-muted-foreground">
                            {testimonial.role}
                            {testimonial.role && testimonial.company && ", "}
                            {testimonial.company}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={scrollPrev}
            className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white shadow-lg hover:bg-gray-50 text-navy p-3 rounded-full transition-colors hidden md:block"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white shadow-lg hover:bg-gray-50 text-navy p-3 rounded-full transition-colors hidden md:block"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Dots and Pause/Play */}
        <div className="flex justify-center items-center space-x-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                selectedIndex === index ? "bg-green" : "bg-gray-300"
              )}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
          <button
            onClick={toggleAutoplay}
            className="ml-2 bg-gray-200 hover:bg-gray-300 text-navy p-2 rounded-full transition-colors"
            aria-label={isPlaying ? "Pause testimonials" : "Play testimonials"}
          >
            {isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </button>
        </div>
      </Container>
    </section>
  );
}
