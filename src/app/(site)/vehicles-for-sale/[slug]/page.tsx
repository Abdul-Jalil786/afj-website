import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Car,
  Fuel,
  Gauge,
  Users,
  Calendar,
  ArrowLeft,
  CheckCircle,
  Phone,
  Mail,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Vehicle {
  id: string;
  title: string;
  slug: string;
  price: number;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  seats: number;
  color: string;
  registration: string;
  description: string;
  features: string[];
  images: string[];
  status: "available" | "reserved" | "sold";
}

const vehicles: Record<string, Vehicle> = {
  "2022-ford-transit-custom-minibus": {
    id: "1",
    title: "2022 Ford Transit Custom Minibus",
    slug: "2022-ford-transit-custom-minibus",
    price: 35000,
    year: 2022,
    mileage: 28000,
    fuelType: "Diesel",
    transmission: "Manual",
    seats: 9,
    color: "White",
    registration: "AB22 XYZ",
    description:
      "This excellent Ford Transit Custom minibus is in superb condition throughout. Well maintained with full service history, this vehicle is perfect for school transport or private hire operations. Features include air conditioning, Bluetooth connectivity, and reversing sensors.",
    features: [
      "Air Conditioning",
      "Bluetooth Connectivity",
      "Reversing Sensors",
      "Electric Windows",
      "Central Locking",
      "Full Service History",
      "12 Months MOT",
      "3 Month Warranty Included",
      "Rear Privacy Glass",
      "Tow Bar Fitted",
    ],
    images: [
      "/images/vehicles/transit-custom-1.jpg",
      "/images/vehicles/transit-custom-2.jpg",
      "/images/vehicles/transit-custom-3.jpg",
      "/images/vehicles/transit-custom-4.jpg",
    ],
    status: "available",
  },
  "2021-mercedes-sprinter-516-wav": {
    id: "2",
    title: "2021 Mercedes Sprinter 516 WAV",
    slug: "2021-mercedes-sprinter-516-wav",
    price: 48000,
    year: 2021,
    mileage: 42000,
    fuelType: "Diesel",
    transmission: "Automatic",
    seats: 16,
    color: "Silver",
    registration: "CD21 ABC",
    description:
      "Premium Mercedes Sprinter 516 wheelchair accessible vehicle. Features a PLS tail lift, space for 2 wheelchairs, and 14 seated passengers. Ideal for patient transport services or accessible group travel. Automatic transmission for smooth, comfortable journeys.",
    features: [
      "PLS Tail Lift",
      "2 Wheelchair Positions",
      "Automatic Transmission",
      "Air Conditioning",
      "CCTV System",
      "PA System",
      "USB Charging Points",
      "Wheelchair Tracking",
      "Full Service History",
      "M1 Certification",
    ],
    images: [
      "/images/vehicles/sprinter-wav-1.jpg",
      "/images/vehicles/sprinter-wav-2.jpg",
      "/images/vehicles/sprinter-wav-3.jpg",
      "/images/vehicles/sprinter-wav-4.jpg",
    ],
    status: "available",
  },
};

export function generateStaticParams() {
  return Object.keys(vehicles).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = vehicles[slug];

  if (!vehicle) {
    return { title: "Vehicle Not Found" };
  }

  return {
    title: vehicle.title,
    description: vehicle.description.slice(0, 160),
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vehicle = vehicles[slug];

  if (!vehicle) {
    notFound();
  }

  return (
    <>
      {/* Back Link */}
      <section className="py-4 bg-gray-50">
        <Container>
          <Link
            href="/vehicles-for-sale"
            className="inline-flex items-center text-muted-foreground hover:text-green transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Vehicles
          </Link>
        </Container>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gallery */}
            <div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden mb-4">
                <Image
                  src={vehicle.images[0]}
                  alt={vehicle.title}
                  fill
                  className="object-cover"
                  priority
                />
                {vehicle.status === "reserved" && (
                  <Badge variant="warning" className="absolute top-4 right-4">
                    Reserved
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {vehicle.images.slice(1).map((image, index) => (
                  <div
                    key={index}
                    className="relative h-24 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <Image
                      src={image}
                      alt={`${vehicle.title} - Image ${index + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div>
              <h1 className="text-3xl font-bold text-navy mb-4">
                {vehicle.title}
              </h1>

              <p className="text-4xl font-bold text-green mb-6">
                £{vehicle.price.toLocaleString()}
              </p>

              {/* Key Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Calendar className="h-5 w-5 mx-auto mb-2 text-green" />
                  <div className="text-sm text-muted-foreground">Year</div>
                  <div className="font-semibold">{vehicle.year}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Gauge className="h-5 w-5 mx-auto mb-2 text-green" />
                  <div className="text-sm text-muted-foreground">Mileage</div>
                  <div className="font-semibold">
                    {vehicle.mileage.toLocaleString()} mi
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Fuel className="h-5 w-5 mx-auto mb-2 text-green" />
                  <div className="text-sm text-muted-foreground">Fuel</div>
                  <div className="font-semibold">{vehicle.fuelType}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Users className="h-5 w-5 mx-auto mb-2 text-green" />
                  <div className="text-sm text-muted-foreground">Seats</div>
                  <div className="font-semibold">{vehicle.seats}</div>
                </div>
              </div>

              {/* Additional Specs */}
              <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Transmission</span>
                  <span className="font-medium">{vehicle.transmission}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Color</span>
                  <span className="font-medium">{vehicle.color}</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Button size="lg" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Call to Enquire
                </Button>
                <Button variant="outline" size="lg" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Enquiry
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Description & Features */}
      <section className="py-12 bg-gray-50">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-navy mb-4">Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                {vehicle.description}
              </p>
            </div>

            {/* Features */}
            <div>
              <h2 className="text-2xl font-bold text-navy mb-4">Features</h2>
              <div className="grid grid-cols-2 gap-3">
                {vehicle.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green mr-2 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Contact Card */}
      <section className="py-12">
        <Container>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="text-xl font-bold text-navy mb-2">
                    Interested in this vehicle?
                  </h3>
                  <p className="text-muted-foreground">
                    Contact our sales team for more information or to arrange a
                    viewing.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg">
                    <a href="tel:+441211234567">
                      <Phone className="h-4 w-4 mr-2" />
                      0121 123 4567
                    </a>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/contact">Send Enquiry</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>
    </>
  );
}
