"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Navigation } from "./Navigation";
import { MobileMenu } from "./MobileMenu";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "Home-to-School Transport", href: "/services/home-to-school" },
      { label: "Non-Emergency Patient Transport", href: "/services/nepts" },
      { label: "Private Hire", href: "/services/private-hire" },
      { label: "Fleet Maintenance", href: "/services/fleet-maintenance" },
      { label: "Vehicle Conversions", href: "/services/vehicle-conversions" },
      { label: "Training", href: "/services/training" },
    ],
  },
  { label: "Vehicles for Sale", href: "/vehicles-for-sale" },
  { label: "Blog", href: "/resources/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-navy shadow-lg py-2"
            : "bg-navy/90 backdrop-blur-sm py-4"
        )}
      >
        <Container>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-white font-bold text-2xl">
                AFJ<span className="text-green">.</span>
              </div>
              <span className="text-white text-sm hidden sm:block">Limited</span>
            </Link>

            {/* Desktop Navigation */}
            <Navigation items={navItems} className="hidden lg:flex" />

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Phone Number */}
              <a
                href="tel:+441onal"
                className="hidden md:flex items-center text-white hover:text-green transition-colors"
              >
                <Phone className="h-4 w-4 mr-2" />
                <span className="text-sm">0121 123 4567</span>
              </a>

              {/* Book Now CTA */}
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/book-now">Book Now</Link>
              </Button>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden text-white p-2"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        items={navItems}
      />
    </>
  );
}
