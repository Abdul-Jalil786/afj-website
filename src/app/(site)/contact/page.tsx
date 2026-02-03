import { Metadata } from "next";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "@/components/forms";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with AFJ Limited. Contact us for transportation enquiries, quotes, or any questions about our services.",
};

const contactInfo = [
  {
    icon: Phone,
    title: "Phone",
    details: ["0121 123 4567", "0800 123 4567 (Freephone)"],
    action: { label: "Call Now", href: "tel:+441211234567" },
  },
  {
    icon: Mail,
    title: "Email",
    details: ["info@afjltd.co.uk", "bookings@afjltd.co.uk"],
    action: { label: "Send Email", href: "mailto:info@afjltd.co.uk" },
  },
  {
    icon: MapPin,
    title: "Address",
    details: ["123 Transport Way", "Birmingham, B1 1AB", "United Kingdom"],
    action: {
      label: "Get Directions",
      href: "https://maps.google.com/?q=Birmingham+B1+1AB",
    },
  },
  {
    icon: Clock,
    title: "Office Hours",
    details: [
      "Monday - Friday: 8:00 AM - 6:00 PM",
      "Saturday: 9:00 AM - 1:00 PM",
      "Sunday: Closed",
    ],
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-20 bg-navy">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-white/80">
              Have a question or need a quote? We're here to help. Get in touch
              with our team today.
            </p>
          </div>
        </Container>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 -mt-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-green/10 flex items-center justify-center mb-4">
                    <info.icon className="h-6 w-6 text-green" />
                  </div>
                  <h3 className="text-lg font-semibold text-navy mb-3">
                    {info.title}
                  </h3>
                  <div className="space-y-1 mb-4">
                    {info.details.map((detail, detailIndex) => (
                      <p key={detailIndex} className="text-sm text-muted-foreground">
                        {detail}
                      </p>
                    ))}
                  </div>
                  {info.action && (
                    <a
                      href={info.action.href}
                      className="text-sm font-medium text-green hover:underline"
                      target={info.action.href.startsWith("http") ? "_blank" : undefined}
                      rel={info.action.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {info.action.label} →
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Contact Form & Map Section */}
      <section className="py-16">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-navy mb-2">
                Send Us a Message
              </h2>
              <p className="text-muted-foreground mb-8">
                Fill out the form below and we'll get back to you within 24
                hours.
              </p>
              <ContactForm />
            </div>

            {/* Map */}
            <div>
              <h2 className="text-2xl font-bold text-navy mb-2">Find Us</h2>
              <p className="text-muted-foreground mb-8">
                Visit our headquarters in Birmingham, conveniently located with
                easy access to major transport links.
              </p>
              <div className="relative h-[400px] lg:h-full min-h-[400px] rounded-2xl overflow-hidden bg-gray-100">
                {/* Placeholder for Google Maps - in production, use actual embed */}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2430.2584869085407!2d-1.8987399!3d52.4814199!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4870942d1b417173%3A0xca81fef0aeee7998!2sBirmingham!5e0!3m2!1sen!2suk!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="AFJ Limited Location"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Find quick answers to common questions about our services.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "What areas do you cover?",
                answer:
                  "We provide services across the UK, with primary operations in the Midlands region. Contact us to discuss your specific requirements.",
              },
              {
                question: "How do I request a quote?",
                answer:
                  "You can request a quote by filling out the contact form above, calling us directly, or emailing our team. We aim to respond within 24 hours.",
              },
              {
                question: "Are your drivers DBS checked?",
                answer:
                  "Yes, all our drivers undergo enhanced DBS checks and receive regular safeguarding training to ensure the safety of all passengers.",
              },
              {
                question: "Do you provide wheelchair accessible vehicles?",
                answer:
                  "Yes, our fleet includes a range of wheelchair accessible vehicles equipped with ramps, tail lifts, and secure restraint systems.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-navy mb-2">{faq.question}</h3>
                <p className="text-muted-foreground text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
