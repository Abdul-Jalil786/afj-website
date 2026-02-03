"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Car, Fuel, Gauge, Users, Calendar, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CTASection } from "@/components/sections";
import { client, vehiclesQuery, urlFor } from "@/lib/sanity";

interface SanityImage {
  asset: {
    _ref: string;
  };
  alt?: string;
}

interface Vehicle {
  _id: string;
  title: string;
  slug: { current: string };
  price: number;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  seats: number;
  mainImage?: SanityImage;
  status: "available" | "reserved" | "sold";
  featured: boolean;
}

// Fallback data when Sanity is not configured
const fallbackVehicles: Vehicle[] = [
  {
    _id: "1",
    title: "2022 Ford Transit Custom Minibus",
    slug: { current: "2022-ford-transit-custom-minibus" },
    price: 35000,
    year: 2022,
    mileage: 28000,
    fuelType: "Diesel",
    transmission: "Manual",
    seats: 9,
    status: "available",
    featured: true,
  },
  {
    _id: "2",
    title: "2021 Mercedes Sprinter 516 WAV",
    slug: { current: "2021-mercedes-sprinter-516-wav" },
    price: 48000,
    year: 2021,
    mileage: 42000,
    fuelType: "Diesel",
    transmission: "Automatic",
    seats: 16,
    status: "available",
    featured: true,
  },
  {
    _id: "3",
    title: "2020 Peugeot Boxer WAV",
    slug: { current: "2020-peugeot-boxer-wav" },
    price: 28000,
    year: 2020,
    mileage: 55000,
    fuelType: "Diesel",
    transmission: "Manual",
    seats: 6,
    status: "available",
    featured: false,
  },
  {
    _id: "4",
    title: "2022 Vauxhall Vivaro Combi",
    slug: { current: "2022-vauxhall-vivaro-combi" },
    price: 32000,
    year: 2022,
    mileage: 35000,
    fuelType: "Diesel",
    transmission: "Manual",
    seats: 9,
    status: "reserved",
    featured: false,
  },
  {
    _id: "5",
    title: "2019 Renault Master Minibus",
    slug: { current: "2019-renault-master-minibus" },
    price: 24000,
    year: 2019,
    mileage: 68000,
    fuelType: "Diesel",
    transmission: "Manual",
    seats: 17,
    status: "available",
    featured: false,
  },
  {
    _id: "6",
    title: "2021 VW Transporter Shuttle",
    slug: { current: "2021-vw-transporter-shuttle" },
    price: 38000,
    year: 2021,
    mileage: 31000,
    fuelType: "Diesel",
    transmission: "Automatic",
    seats: 9,
    status: "available",
    featured: false,
  },
];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(fallbackVehicles);
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicleType, setVehicleType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [seatRange, setSeatRange] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const fetchedVehicles = await client.fetch(vehiclesQuery);
        if (fetchedVehicles && fetchedVehicles.length > 0) {
          setVehicles(fetchedVehicles);
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        // Keep fallback data
      } finally {
        setIsLoading(false);
      }
    }
    fetchVehicles();
  }, []);

  const getImageUrl = (image?: SanityImage) => {
    if (!image?.asset) return "/images/vehicles/placeholder.jpg";
    return urlFor(image).width(800).height(600).auto("format").url();
  };

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!vehicle.title.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Vehicle type filter
      if (vehicleType !== "all") {
        const title = vehicle.title.toLowerCase();
        if (vehicleType === "minibus" && !title.includes("minibus") && !title.includes("shuttle") && !title.includes("combi")) {
          return false;
        }
        if (vehicleType === "wav" && !title.includes("wav") && !title.includes("wheelchair")) {
          return false;
        }
      }

      // Price filter
      if (priceRange !== "all") {
        switch (priceRange) {
          case "under-25k":
            if (vehicle.price >= 25000) return false;
            break;
          case "25k-35k":
            if (vehicle.price < 25000 || vehicle.price > 35000) return false;
            break;
          case "35k-50k":
            if (vehicle.price < 35000 || vehicle.price > 50000) return false;
            break;
          case "over-50k":
            if (vehicle.price <= 50000) return false;
            break;
        }
      }

      // Seat filter
      if (seatRange !== "all") {
        switch (seatRange) {
          case "1-8":
            if (vehicle.seats > 8) return false;
            break;
          case "9-12":
            if (vehicle.seats < 9 || vehicle.seats > 12) return false;
            break;
          case "13-17":
            if (vehicle.seats < 13 || vehicle.seats > 17) return false;
            break;
          case "17+":
            if (vehicle.seats <= 17) return false;
            break;
        }
      }

      return true;
    });
  }, [vehicles, searchQuery, vehicleType, priceRange, seatRange]);

  const featuredVehicles = filteredVehicles.filter((v) => v.featured);
  const availableVehicles = filteredVehicles.filter((v) => v.status !== "sold");

  return (
    <>
      {/* Hero Section */}
      <section className="py-20 bg-navy">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Vehicles for Sale
            </h1>
            <p className="text-xl text-white/80">
              Quality pre-owned minibuses, wheelchair accessible vehicles, and
              commercial transport vehicles. All vehicles are fully serviced and
              come with warranty options.
            </p>
          </div>
        </Container>
      </section>

      {/* Filters */}
      <section className="py-8 border-b">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger>
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="minibus">Minibus</SelectItem>
                <SelectItem value="wav">Wheelchair Accessible</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger>
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Price</SelectItem>
                <SelectItem value="under-25k">Under £25,000</SelectItem>
                <SelectItem value="25k-35k">£25,000 - £35,000</SelectItem>
                <SelectItem value="35k-50k">£35,000 - £50,000</SelectItem>
                <SelectItem value="over-50k">Over £50,000</SelectItem>
              </SelectContent>
            </Select>
            <Select value={seatRange} onValueChange={setSeatRange}>
              <SelectTrigger>
                <SelectValue placeholder="Seats" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="1-8">1-8 Seats</SelectItem>
                <SelectItem value="9-12">9-12 Seats</SelectItem>
                <SelectItem value="13-17">13-17 Seats</SelectItem>
                <SelectItem value="17+">17+ Seats</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Container>
      </section>

      {/* Featured Vehicles */}
      {featuredVehicles.length > 0 && (
        <section className="py-12 bg-gray-50">
          <Container>
            <h2 className="text-2xl font-bold text-navy mb-8">
              Featured Vehicles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredVehicles.map((vehicle) => (
                <Link
                  key={vehicle._id}
                  href={`/vehicles-for-sale/${vehicle.slug.current}`}
                  className="group"
                >
                  <Card className="border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="relative h-64">
                      <Image
                        src={getImageUrl(vehicle.mainImage)}
                        alt={vehicle.mainImage?.alt || vehicle.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <Badge className="absolute top-4 left-4">Featured</Badge>
                      {vehicle.status === "reserved" && (
                        <Badge variant="warning" className="absolute top-4 right-4">
                          Reserved
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-navy mb-2 group-hover:text-green transition-colors">
                        {vehicle.title}
                      </h3>
                      <p className="text-2xl font-bold text-green mb-4">
                        £{vehicle.price.toLocaleString()}
                      </p>
                      <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex flex-col items-center">
                          <Calendar className="h-4 w-4 mb-1" />
                          {vehicle.year}
                        </div>
                        <div className="flex flex-col items-center">
                          <Gauge className="h-4 w-4 mb-1" />
                          {(vehicle.mileage / 1000).toFixed(0)}k mi
                        </div>
                        <div className="flex flex-col items-center">
                          <Fuel className="h-4 w-4 mb-1" />
                          {vehicle.fuelType}
                        </div>
                        <div className="flex flex-col items-center">
                          <Users className="h-4 w-4 mb-1" />
                          {vehicle.seats} seats
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* All Vehicles */}
      <section className="py-12">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-navy">All Vehicles</h2>
            <p className="text-muted-foreground">
              {availableVehicles.length} vehicles available
            </p>
          </div>

          {availableVehicles.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              No vehicles match your search criteria. Try adjusting the filters.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableVehicles.map((vehicle) => (
                <Link
                  key={vehicle._id}
                  href={`/vehicles-for-sale/${vehicle.slug.current}`}
                  className="group"
                >
                  <Card className="border-0 shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <div className="relative h-48">
                      <Image
                        src={getImageUrl(vehicle.mainImage)}
                        alt={vehicle.mainImage?.alt || vehicle.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {vehicle.status === "reserved" && (
                        <Badge variant="warning" className="absolute top-3 right-3">
                          Reserved
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-navy mb-2 group-hover:text-green transition-colors line-clamp-1">
                        {vehicle.title}
                      </h3>
                      <p className="text-xl font-bold text-green mb-3">
                        £{vehicle.price.toLocaleString()}
                      </p>
                      <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                        <div className="text-center">
                          <Calendar className="h-3 w-3 mx-auto mb-0.5" />
                          {vehicle.year}
                        </div>
                        <div className="text-center">
                          <Gauge className="h-3 w-3 mx-auto mb-0.5" />
                          {(vehicle.mileage / 1000).toFixed(0)}k
                        </div>
                        <div className="text-center">
                          <Fuel className="h-3 w-3 mx-auto mb-0.5" />
                          {vehicle.fuelType}
                        </div>
                        <div className="text-center">
                          <Users className="h-3 w-3 mx-auto mb-0.5" />
                          {vehicle.seats}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>

      <CTASection
        title="Looking for Something Specific?"
        description="Can't find what you're looking for? Contact us with your requirements and we'll help you find the perfect vehicle."
        primaryCta={{ text: "Contact Us", href: "/contact" }}
        secondaryCta={{ text: "Call Now", href: "tel:+441211234567" }}
      />
    </>
  );
}
