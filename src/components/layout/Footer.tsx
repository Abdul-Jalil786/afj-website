import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { Container } from "@/components/ui/container";

const services = [
  { label: "Home-to-School Transport", href: "/services/home-to-school" },
  { label: "Non-Emergency Patient Transport", href: "/services/nepts" },
  { label: "Private Hire", href: "/services/private-hire" },
  { label: "Fleet Maintenance", href: "/services/fleet-maintenance" },
  { label: "Vehicle Conversions", href: "/services/vehicle-conversions" },
  { label: "Training", href: "/services/training" },
];

const quickLinks = [
  { label: "About Us", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Blog", href: "/resources/blog" },
  { label: "Vehicles for Sale", href: "/vehicles-for-sale" },
  { label: "Contact", href: "/contact" },
  { label: "Book Now", href: "/book-now" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Cookie Policy", href: "/cookie-policy" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy text-white">
      {/* Main Footer */}
      <div className="py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Company Info */}
            <div>
              <Link href="/" className="inline-block mb-6">
                <span className="text-2xl font-bold">
                  AFJ<span className="text-green">.</span> Limited
                </span>
              </Link>
              <p className="text-white/70 mb-6">
                Providing quality transportation services across the UK since
                2006. We are committed to safety, reliability, and exceptional
                customer service.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-white/70 hover:text-green transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-white/70 hover:text-green transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-white/70 hover:text-green transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-white/70 hover:text-green transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold mb-6">Our Services</h3>
              <ul className="space-y-3">
                {services.map((service) => (
                  <li key={service.href}>
                    <Link
                      href={service.href}
                      className="text-white/70 hover:text-green transition-colors"
                    >
                      {service.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-white/70 hover:text-green transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-6">Contact Us</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <MapPin className="h-5 w-5 text-green mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-white/70">
                    AFJ Business Centre
                    <br />
                    2-18 Forster Street, Nechells
                    <br />
                    Birmingham B7 4JD
                  </span>
                </li>
                <li>
                  <a
                    href="tel:+441216891000"
                    className="flex items-center text-white/70 hover:text-green transition-colors"
                  >
                    <Phone className="h-5 w-5 text-green mr-3 flex-shrink-0" />
                    0121 689 1000
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:info@afjltd.co.uk"
                    className="flex items-center text-white/70 hover:text-green transition-colors"
                  >
                    <Mail className="h-5 w-5 text-green mr-3 flex-shrink-0" />
                    info@afjltd.co.uk
                  </a>
                </li>
              </ul>
              <div className="mt-4 text-sm text-white/60">
                <p className="font-medium text-white/80">Office Hours:</p>
                <p>Mon - Fri: 6:00am - 7:00pm</p>
                <p>Saturday: 9:00am - 1:00pm</p>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-6">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-white/60 text-sm">
              &copy; {currentYear} AFJ Limited. All rights reserved.
            </p>
            <ul className="flex space-x-6">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 text-sm hover:text-green transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </div>
    </footer>
  );
}
