import Link from "next/link";
import {
  Bus,
  Ambulance,
  Car,
  Wrench,
  Settings,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

interface Service {
  title: string;
  slug: string;
  shortDescription: string;
  icon?: string;
}

interface ServiceCardsProps {
  services?: Service[];
  title?: string;
  subtitle?: string;
}

const iconMap: Record<string, LucideIcon> = {
  bus: Bus,
  ambulance: Ambulance,
  car: Car,
  wrench: Wrench,
  settings: Settings,
  "graduation-cap": GraduationCap,
};

const defaultServices: Service[] = [
  {
    title: "Home-to-School Transport",
    slug: "home-to-school",
    shortDescription:
      "Safe and reliable transport for students with special educational needs and disabilities.",
    icon: "bus",
  },
  {
    title: "Non-Emergency Patient Transport",
    slug: "nepts",
    shortDescription:
      "Compassionate patient transport services for medical appointments and hospital visits.",
    icon: "ambulance",
  },
  {
    title: "Private Hire",
    slug: "private-hire",
    shortDescription:
      "Professional private hire services for corporate events, airport transfers, and special occasions.",
    icon: "car",
  },
  {
    title: "Fleet Maintenance",
    slug: "fleet-maintenance",
    shortDescription:
      "Comprehensive fleet maintenance and servicing to keep your vehicles running smoothly.",
    icon: "wrench",
  },
  {
    title: "Vehicle Conversions",
    slug: "vehicle-conversions",
    shortDescription:
      "Expert vehicle conversions including wheelchair accessibility and specialized adaptations.",
    icon: "settings",
  },
  {
    title: "Training",
    slug: "training",
    shortDescription:
      "Professional driver training programs including MiDAS, PATS, and first aid certification.",
    icon: "graduation-cap",
  },
];

export function ServiceCards({
  services = defaultServices,
  title = "Our Services",
  subtitle = "We provide a comprehensive range of transportation services to meet your needs",
}: ServiceCardsProps) {
  return (
    <section className="py-20 bg-gray-50">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const IconComponent = service.icon
              ? iconMap[service.icon] || Bus
              : Bus;

            return (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group"
              >
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-lg bg-green/10 flex items-center justify-center mb-4 group-hover:bg-green transition-colors">
                      <IconComponent className="h-7 w-7 text-green group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-semibold text-navy mb-2 group-hover:text-green transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {service.shortDescription}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
