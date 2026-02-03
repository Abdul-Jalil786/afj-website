"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

interface Testimonial {
  name: string;
  role?: string;
  company?: string;
  content: string;
  rating?: number;
  image?: string;
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-5 w-5",
            star <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300"
          )}
        />
      ))}
    </div>
  );
}

export function TestimonialsSlider({
  testimonials = defaultTestimonials,
  title = "What Our Clients Say",
  subtitle = "Trusted by organizations across the UK",
}: TestimonialsSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  return (
    <section className="py-20 bg-white">
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
                  key={index}
                  className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-4"
                >
                  <div className="bg-gray-50 rounded-2xl p-8 h-full flex flex-col">
                    {/* Quote Icon */}
                    <Quote className="h-10 w-10 text-green/20 mb-4" />

                    {/* Rating */}
                    {testimonial.rating && (
                      <div className="mb-4">
                        <StarRating rating={testimonial.rating} />
                      </div>
                    )}

                    {/* Content */}
                    <p className="text-gray-700 mb-6 flex-1 leading-relaxed">
                      "{testimonial.content}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center">
                      {testimonial.image ? (
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
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

        {/* Dots */}
        <div className="flex justify-center space-x-2 mt-8">
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
        </div>
      </Container>
    </section>
  );
}
