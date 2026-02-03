import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Bus,
  Ambulance,
  Car,
  Wrench,
  Settings,
  GraduationCap,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CTASection } from "@/components/sections";

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Explore our comprehensive range of transportation services including Home-to-School transport, Non-Emergency Patient Transport, Private Hire, Fleet Maintenance, Vehicle Conversions, and Driver Training.",
};

interface Service {
  title: string;
  slug: string;
  shortDescription: string;
  icon: LucideIcon;
  features: string[];
  image: string;
}

const services: Service[] = [
  {
    title: "Home-to-School Transport",
    slug: "home-to-school",
    shortDescription:
      "Safe and reliable transport for students with special educational needs and disabilities (SEND). Our trained staff ensure every child arrives safely and on time.",
    icon: Bus,
    features: [
      "Trained passenger assistants",
      "Wheelchair accessible vehicles",
      "DBS checked drivers",
      "GPS tracking",
    ],
    image: "/images/services/home-to-school.jpg",
  },
  {
    title: "Non-Emergency Patient Transport",
    slug: "nepts",
    shortDescription:
      "Compassionate patient transport services for medical appointments, hospital discharges, and routine healthcare visits. CQC registered for your peace of mind.",
    icon: Ambulance,
    features: [
      "CQC registered",
      "Trained medical staff",
      "Stretcher transport",
      "Wheelchair services",
    ],
    image: "/images/services/nepts.jpg",
  },
  {
    title: "Private Hire",
    slug: "private-hire",
    shortDescription:
      "Professional private hire services for corporate events, airport transfers, special occasions, and executive travel. Luxury vehicles with experienced chauffeurs.",
    icon: Car,
    features: [
      "Executive vehicles",
      "Airport transfers",
      "Corporate accounts",
      "24/7 availability",
    ],
    image: "/images/services/private-hire.jpg",
  },
  {
    title: "Fleet Maintenance",
    slug: "fleet-maintenance",
    shortDescription:
      "Comprehensive fleet maintenance and servicing to keep your vehicles running smoothly. From routine servicing to MOT preparation and repairs.",
    icon: Wrench,
    features: [
      "MOT testing",
      "Routine servicing",
      "Emergency repairs",
      "Parts supply",
    ],
    image: "/images/services/fleet-maintenance.jpg",
  },
  {
    title: "Vehicle Conversions",
    slug: "vehicle-conversions",
    shortDescription:
      "Expert vehicle conversions including wheelchair accessibility, tail lifts, and specialized adaptations for passenger and commercial vehicles.",
    icon: Settings,
    features: [
      "Wheelchair access",
      "Tail lift installation",
      "Interior modifications",
      "Safety compliance",
    ],
    image: "/images/services/vehicle-conversions.jpg",
  },
  {
    title: "Training",
    slug: "training",
    shortDescription:
      "Professional driver training programs including MiDAS, PATS, first aid certification, and bespoke training courses for transport operators.",
    icon: GraduationCap,
    features: [
      "MiDAS certification",
      "PATS training",
      "First aid courses",
      "Safeguarding",
    ],
    image: "/images/services/training.jpg",
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-20 bg-navy">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our Services
            </h1>
            <p className="text-xl text-white/80">
              We provide a comprehensive range of transportation services
              designed to meet the diverse needs of our clients across the UK.
            </p>
          </div>
        </Container>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <Container>
          <div className="space-y-16">
            {services.map((service, index) => (
              <div
                key={service.slug}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Image */}
                <div
                  className={`relative ${index % 2 === 1 ? "lg:order-2" : ""}`}
                >
                  <div className="relative h-[350px] rounded-2xl overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-lg bg-green/10 flex items-center justify-center mr-4">
                      <service.icon className="h-6 w-6 text-green" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-navy">
                      {service.title}
                    </h2>
                  </div>

                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {service.shortDescription}
                  </p>

                  <ul className="grid grid-cols-2 gap-2 mb-6">
                    {service.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center text-sm text-gray-700"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-green mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button asChild>
                    <Link href={`/services/${service.slug}`}>
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CTASection />
    </>
  );
}
