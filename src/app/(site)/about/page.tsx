import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle,
  Award,
  Users,
  Shield,
  Target,
  Eye,
  Heart,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CTASection } from "@/components/sections";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about AFJ Limited - providing quality transportation services across the UK since 2006. Discover our mission, values, and commitment to excellence.",
};

const values = [
  {
    icon: Shield,
    title: "Safety First",
    description:
      "Safety is at the heart of everything we do. We maintain the highest standards to ensure the wellbeing of our passengers and staff.",
  },
  {
    icon: Award,
    title: "Excellence",
    description:
      "We strive for excellence in every journey, continuously improving our services to exceed expectations.",
  },
  {
    icon: Heart,
    title: "Compassion",
    description:
      "We treat every passenger with dignity, respect, and genuine care, understanding that each journey matters.",
  },
  {
    icon: Users,
    title: "Teamwork",
    description:
      "Our success comes from the dedication and collaboration of our entire team working together.",
  },
];

const milestones = [
  { year: "2006", event: "AFJ Limited founded in Birmingham" },
  { year: "2008", event: "Expanded to Home-to-School transport services" },
  { year: "2010", event: "Launched Non-Emergency Patient Transport" },
  { year: "2012", event: "Opened Fleet Maintenance division" },
  { year: "2015", event: "Achieved ISO 9001 certification" },
  { year: "2018", event: "Expanded vehicle conversion services" },
  { year: "2020", event: "Launched driver training academy" },
  { year: "2024", event: "Fleet expanded to over 150 vehicles" },
];

const accreditations = [
  "ISO 9001:2015 Quality Management",
  "MiDAS Accredited Training Centre",
  "ROSPA Gold Award",
  "CQC Registered",
  "DVSA Approved",
  "Enhanced DBS Checked Staff",
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 bg-navy">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/images/about-hero.jpg"
            alt="About AFJ Limited"
            fill
            className="object-cover"
          />
        </div>
        <Container className="relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              About AFJ Limited
            </h1>
            <p className="text-xl text-white/80">
              For over 18 years, we have been providing exceptional
              transportation services across the UK, built on a foundation of
              safety, reliability, and genuine care.
            </p>
          </div>
        </Container>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Mission */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center mb-4">
                <Target className="h-8 w-8 text-green mr-3" />
                <h2 className="text-2xl font-bold text-navy">Our Mission</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To provide safe, reliable, and compassionate transportation
                services that make a positive difference in people's lives. We
                are committed to delivering exceptional service while
                maintaining the highest standards of safety and professionalism.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center mb-4">
                <Eye className="h-8 w-8 text-green mr-3" />
                <h2 className="text-2xl font-bold text-navy">Our Vision</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To be the leading provider of specialist transportation services
                in the UK, recognized for our unwavering commitment to safety,
                quality, and customer satisfaction. We aim to set the industry
                standard for excellence.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These values guide everything we do and define who we are as a
              company.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-7 w-7 text-green" />
                  </div>
                  <h3 className="text-lg font-semibold text-navy mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Company History */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-6">
                Our Journey
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Founded in 2006, AFJ Limited has grown from a small local
                transport company to one of the UK's trusted providers of
                specialist transportation services. Our journey has been marked
                by continuous growth, innovation, and an unwavering commitment
                to our customers.
              </p>

              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-20 flex-shrink-0">
                      <span className="text-green font-bold">
                        {milestone.year}
                      </span>
                    </div>
                    <div className="flex-1 pl-4 border-l-2 border-green/30">
                      <p className="text-gray-700">{milestone.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative h-[500px] rounded-2xl overflow-hidden">
                <Image
                  src="/images/company-history.jpg"
                  alt="AFJ Limited History"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Accreditations */}
      <section className="py-20">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
              Accreditations & Certifications
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our commitment to excellence is recognized through numerous
              industry accreditations and certifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {accreditations.map((accreditation, index) => (
              <div
                key={index}
                className="flex items-center bg-gray-50 rounded-lg p-4"
              >
                <CheckCircle className="h-5 w-5 text-green mr-3 flex-shrink-0" />
                <span className="text-gray-700">{accreditation}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Team Section Placeholder */}
      <section className="py-20 bg-navy">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Our Leadership Team
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Our experienced leadership team brings decades of industry
              expertise and a shared passion for delivering exceptional service.
            </p>
            <Button asChild variant="outlineWhite" size="lg">
              <Link href="/contact">Get in Touch</Link>
            </Button>
          </div>
        </Container>
      </section>

      <CTASection
        title="Join Our Team"
        description="We're always looking for talented individuals to join our growing team. Check out our current opportunities."
        primaryCta={{ text: "View Careers", href: "/careers" }}
        secondaryCta={{ text: "Contact Us", href: "/contact" }}
      />
    </>
  );
}
