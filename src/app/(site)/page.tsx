import {
  HeroCarousel,
  TrustBadges,
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
      <TrustBadges />
      <ServiceCards />
      <AboutSection />
      <StatsSection />
      <TestimonialsSlider />
      <PartnerLogos />
      <CTASection />
    </>
  );
}
