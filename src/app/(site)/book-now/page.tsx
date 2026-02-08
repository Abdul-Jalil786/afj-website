import { Metadata } from "next";
import { Phone, Clock, Shield, CheckCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { BookingForm } from "@/components/forms";
import { generateBreadcrumbJsonLd } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Book Now",
  description:
    "Book transport with AFJ Limited Birmingham. Private hire, airport transfers, corporate transport. Quick response within 2 hours.",
};

const benefits = [
  {
    icon: Clock,
    title: "Quick Response",
    description: "We'll respond to your booking request within 2 hours during business hours.",
  },
  {
    icon: Shield,
    title: "Fully Insured",
    description: "All our vehicles and journeys are fully insured for your peace of mind.",
  },
  {
    icon: CheckCircle,
    title: "Confirmed Pricing",
    description: "Receive a confirmed quote before your journey - no hidden fees.",
  },
];

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: "Home", url: "/" },
  { name: "Book Now", url: "/book-now" },
]);

export default function BookNowPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero Section */}
      <section className="py-16 bg-navy">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Book Your Transport
            </h1>
            <p className="text-xl text-white/80">
              Request a quote for your journey. Fill in the form below and our
              team will get back to you with pricing and availability.
            </p>
          </div>
        </Container>
      </section>

      {/* Booking Form Section */}
      <section className="py-16">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <BookingForm />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Benefits */}
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-12 h-12 rounded-lg bg-green/10 flex items-center justify-center mr-4 flex-shrink-0">
                    <benefit.icon className="h-6 w-6 text-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}

              {/* Contact Card */}
              <Card className="border-0 shadow-md bg-navy text-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Prefer to Speak to Someone?
                  </h3>
                  <p className="text-white/80 text-sm mb-4">
                    Our booking team is available to help with your enquiry.
                  </p>
                  <a
                    href="tel:+441216891000"
                    className="flex items-center text-green hover:text-green-light transition-colors"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    <span className="font-semibold">0121 689 1000</span>
                  </a>
                  <div className="mt-4 pt-4 border-t border-white/20 text-sm text-white/60">
                    <p>Mon - Fri: 6:00 AM - 7:00 PM</p>
                    <p>Sat: 9:00 AM - 1:00 PM</p>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ */}
              <div className="space-y-4">
                <h3 className="font-semibold text-navy">Common Questions</h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">
                      How far in advance should I book?
                    </p>
                    <p className="text-muted-foreground">
                      We recommend booking at least 48 hours in advance, though
                      we can sometimes accommodate last-minute requests.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-700">
                      Can I amend or cancel my booking?
                    </p>
                    <p className="text-muted-foreground">
                      Yes, you can amend or cancel up to 24 hours before your
                      journey without charge.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-700">
                      What payment methods do you accept?
                    </p>
                    <p className="text-muted-foreground">
                      We accept card payments, bank transfer, and cash. Corporate
                      accounts are also available.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
