import {
  HeroCarousel,
  ServiceCards,
  AboutSection,
  StatsSection,
  PartnerLogos,
  TestimonialsSlider,
  CTASection,
} from "@/components/sections";

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <ServiceCards />
      <AboutSection />
      <StatsSection />
      <TestimonialsSlider />
      <PartnerLogos />
      <CTASection />
    </>
  );
}
