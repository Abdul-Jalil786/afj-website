import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bus,
  Ambulance,
  Car,
  Wrench,
  Settings,
  GraduationCap,
  CheckCircle,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CTASection } from "@/components/sections";
import { generateBreadcrumbJsonLd } from "@/lib/utils";

interface ServiceData {
  title: string;
  slug: string;
  description: string;
  icon: LucideIcon;
  image: string;
  features: {
    title: string;
    description: string;
  }[];
  benefits: string[];
  process?: {
    step: number;
    title: string;
    description: string;
  }[];
}

const servicesData: Record<string, ServiceData> = {
  "home-to-school": {
    title: "Home-to-School Transport",
    slug: "home-to-school",
    description:
      "Our Home-to-School transport service provides safe, reliable, and caring transportation for students with special educational needs and disabilities (SEND). We understand that every child is unique, and our trained staff are dedicated to ensuring a comfortable and stress-free journey to and from school.",
    icon: Bus,
    image: "/images/services/home-to-school.jpg",
    features: [
      {
        title: "Trained Passenger Assistants",
        description:
          "All our passenger assistants are fully trained in safeguarding, first aid, and working with children with additional needs.",
      },
      {
        title: "Wheelchair Accessible Vehicles",
        description:
          "Our fleet includes a range of wheelchair accessible vehicles with secure restraint systems for safe travel.",
      },
      {
        title: "DBS Checked Staff",
        description:
          "Every member of our team undergoes enhanced DBS checks and regular safeguarding training.",
      },
      {
        title: "GPS Tracking",
        description:
          "Real-time GPS tracking allows parents and schools to monitor vehicle locations for peace of mind.",
      },
      {
        title: "Consistent Routes",
        description:
          "We maintain consistent routes and drivers to help children feel comfortable and secure.",
      },
      {
        title: "Flexible Scheduling",
        description:
          "We accommodate varying school schedules, after-school clubs, and special events.",
      },
    ],
    benefits: [
      "Dedicated transport coordinators",
      "24/7 emergency support",
      "Regular driver and vehicle assessments",
      "Parent and school communication portals",
      "Tailored individual travel plans",
      "Full insurance coverage",
    ],
    process: [
      {
        step: 1,
        title: "Assessment",
        description:
          "We conduct a thorough assessment of each child's needs to create a personalized travel plan.",
      },
      {
        step: 2,
        title: "Vehicle & Staff Matching",
        description:
          "We match the appropriate vehicle and trained staff to ensure the best care for your child.",
      },
      {
        step: 3,
        title: "Route Planning",
        description:
          "Our team plans efficient routes that minimize travel time while ensuring safety.",
      },
      {
        step: 4,
        title: "Service Delivery",
        description:
          "Regular, reliable transport with ongoing communication and quality monitoring.",
      },
    ],
  },
  nepts: {
    title: "Non-Emergency Patient Transport",
    slug: "nepts",
    description:
      "Our Non-Emergency Patient Transport Service (NEPTS) provides compassionate and professional transport for patients attending medical appointments, hospital discharges, and routine healthcare visits. We are CQC registered and committed to delivering the highest standards of patient care.",
    icon: Ambulance,
    image: "/images/services/nepts.jpg",
    features: [
      {
        title: "CQC Registered",
        description:
          "We are fully registered with the Care Quality Commission, ensuring compliance with healthcare standards.",
      },
      {
        title: "Trained Medical Staff",
        description:
          "Our crews include trained healthcare assistants who can provide appropriate care during transport.",
      },
      {
        title: "Stretcher Transport",
        description:
          "We offer stretcher ambulance services for patients who need to travel lying down.",
      },
      {
        title: "Wheelchair Services",
        description:
          "Our vehicles are equipped to safely transport wheelchair users with proper securing equipment.",
      },
      {
        title: "Bariatric Transport",
        description:
          "Specialized vehicles and equipment for patients requiring bariatric support.",
      },
      {
        title: "Hospital Discharge",
        description:
          "Coordinated discharge services to help patients get home safely and comfortably.",
      },
    ],
    benefits: [
      "Door-to-door service",
      "Assistance with mobility aids",
      "Comfortable, clean vehicles",
      "Punctual and reliable",
      "Trained in patient handling",
      "Dignity and respect guaranteed",
    ],
  },
  "private-hire": {
    title: "Private Hire",
    slug: "private-hire",
    description:
      "Our Private Hire service offers premium transportation solutions for corporate clients, special events, airport transfers, and executive travel. With our modern fleet and professional chauffeurs, we ensure every journey is comfortable, punctual, and stress-free.",
    icon: Car,
    image: "/images/services/private-hire.jpg",
    features: [
      {
        title: "Executive Vehicles",
        description:
          "Premium vehicles including Mercedes, BMW, and luxury MPVs for comfortable travel.",
      },
      {
        title: "Airport Transfers",
        description:
          "Reliable airport pickup and drop-off services with flight monitoring.",
      },
      {
        title: "Corporate Accounts",
        description:
          "Dedicated account management and simplified billing for business clients.",
      },
      {
        title: "Event Transportation",
        description:
          "Group transportation for conferences, weddings, and corporate events.",
      },
      {
        title: "Meet & Greet",
        description:
          "Professional meet and greet service at airports and venues.",
      },
      {
        title: "24/7 Availability",
        description: "Round-the-clock service for early flights and late events.",
      },
    ],
    benefits: [
      "Professional chauffeurs",
      "Complimentary WiFi",
      "Refreshments available",
      "Child seats on request",
      "Fixed pricing available",
      "Last-minute bookings welcome",
    ],
  },
  "fleet-maintenance": {
    title: "Fleet Maintenance",
    slug: "fleet-maintenance",
    description:
      "Our Fleet Maintenance division provides comprehensive servicing, repairs, and MOT testing for commercial and passenger vehicles. With our team of experienced technicians and fully equipped workshop, we keep your fleet running safely and efficiently.",
    icon: Wrench,
    image: "/images/services/fleet-maintenance.jpg",
    features: [
      {
        title: "MOT Testing",
        description:
          "Authorized MOT testing station for Class IV, V, and VII vehicles.",
      },
      {
        title: "Routine Servicing",
        description:
          "Scheduled maintenance programs to keep your vehicles in optimal condition.",
      },
      {
        title: "Emergency Repairs",
        description:
          "Fast-response breakdown and repair services to minimize downtime.",
      },
      {
        title: "Parts Supply",
        description:
          "Access to genuine and quality aftermarket parts for all major manufacturers.",
      },
      {
        title: "Tail Lift Servicing",
        description:
          "LOLER compliant tail lift inspections, servicing, and repairs.",
      },
      {
        title: "Fleet Management",
        description:
          "Comprehensive fleet management including maintenance scheduling and compliance tracking.",
      },
    ],
    benefits: [
      "Experienced technicians",
      "Competitive pricing",
      "Quick turnaround times",
      "Courtesy vehicles available",
      "Full diagnostic capabilities",
      "Warranty on all work",
    ],
  },
  "vehicle-conversions": {
    title: "Vehicle Conversions",
    slug: "vehicle-conversions",
    description:
      "Our Vehicle Conversions service specializes in adapting vehicles for wheelchair accessibility, installing tail lifts, and creating bespoke modifications for passenger and commercial use. All work meets strict safety and compliance standards.",
    icon: Settings,
    image: "/images/services/vehicle-conversions.jpg",
    features: [
      {
        title: "Wheelchair Access Conversions",
        description:
          "Professional installation of ramps, lowered floors, and wheelchair securing systems.",
      },
      {
        title: "Tail Lift Installation",
        description:
          "Supply and fitting of tail lifts for passenger and commercial vehicles.",
      },
      {
        title: "Interior Modifications",
        description:
          "Custom seating configurations, tracking systems, and interior adaptations.",
      },
      {
        title: "Safety Compliance",
        description:
          "All conversions meet M1 and IVA standards with full certification.",
      },
      {
        title: "Minibus Conversions",
        description:
          "Converting vehicles to minibuses with appropriate seating and safety features.",
      },
      {
        title: "Accessible Vehicle Repairs",
        description:
          "Specialist repairs and refurbishment of accessible vehicles.",
      },
    ],
    benefits: [
      "Full certification provided",
      "Manufacturer-approved parts",
      "Experienced conversion specialists",
      "Competitive lead times",
      "Aftercare support",
      "Design consultation included",
    ],
  },
  training: {
    title: "Training",
    slug: "training",
    description:
      "Our Training Academy offers comprehensive driver training programs including MiDAS, PATS, first aid certification, and safeguarding courses. We help transport operators develop skilled, confident, and compliant drivers.",
    icon: GraduationCap,
    image: "/images/services/training.jpg",
    features: [
      {
        title: "MiDAS Certification",
        description:
          "Nationally recognized minibus driver awareness training for organizations.",
      },
      {
        title: "PATS Training",
        description:
          "Passenger Assistant Training Scheme for those supporting passengers with additional needs.",
      },
      {
        title: "First Aid Courses",
        description:
          "Emergency first aid at work and pediatric first aid certifications.",
      },
      {
        title: "Safeguarding Training",
        description:
          "Essential safeguarding awareness for all staff working with vulnerable groups.",
      },
      {
        title: "Wheelchair Handling",
        description:
          "Safe wheelchair handling and vehicle securing techniques.",
      },
      {
        title: "Bespoke Training",
        description:
          "Customized training programs designed for your organization's specific needs.",
      },
    ],
    benefits: [
      "Experienced trainers",
      "Flexible scheduling",
      "On-site training available",
      "Certification included",
      "Refresher courses",
      "Competitive group rates",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(servicesData).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = servicesData[slug];

  if (!service) {
    return {
      title: "Service Not Found",
    };
  }

  return {
    title: service.title,
    description: service.description.slice(0, 160),
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = servicesData[slug];

  if (!service) {
    notFound();
  }

  const IconComponent = service.icon;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://afjltd.co.uk";

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Services", url: "/services" },
    { name: service.title, url: `/services/${slug}` },
  ]);

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.title,
    provider: {
      "@id": `${baseUrl}/#organization`,
    },
    areaServed: {
      "@type": "Place",
      name: "Birmingham, West Midlands",
    },
    description: service.description,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-navy">
        <div className="absolute inset-0 opacity-30">
          <Image
            src={service.image}
            alt={service.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/70" />
        <Container className="relative z-10">
          <Link
            href="/services"
            className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Link>

          <div className="flex items-center mb-6">
            <div className="w-16 h-16 rounded-xl bg-green flex items-center justify-center mr-6">
              <IconComponent className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {service.title}
            </h1>
          </div>

          <p className="text-xl text-white/80 max-w-3xl">{service.description}</p>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <Container>
          <h2 className="text-3xl font-bold text-navy mb-12 text-center">
            What We Offer
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-navy mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-navy mb-8">
                Why Choose Us?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {service.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image
                src={service.image}
                alt={service.title}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Process Section (if available) */}
      {service.process && (
        <section className="py-20">
          <Container>
            <h2 className="text-3xl font-bold text-navy mb-12 text-center">
              How It Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {service.process.map((step) => (
                <div key={step.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-green text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-navy mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      <CTASection
        title={`Ready to Get Started with ${service.title}?`}
        description="Contact us today to discuss your requirements and receive a personalized quote."
      />
    </>
  );
}
