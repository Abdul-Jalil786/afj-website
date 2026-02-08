import { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "AFJ Limited terms of service. Booking terms, service conditions, liability, and governing law for our transport services in Birmingham & West Midlands.",
};

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://afjltd.co.uk";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: baseUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Terms of Service",
      item: `${baseUrl}/terms-of-service`,
    },
  ],
};

export default function TermsOfServicePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="py-16 bg-navy">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-white/80">
              Last updated: February 2026
            </p>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section className="py-16">
        <Container size="sm">
          <div className="prose prose-lg max-w-none prose-headings:text-navy prose-a:text-green">
            <h2>1. Introduction</h2>
            <p>
              These terms of service (&quot;Terms&quot;) govern your use of the AFJ
              Limited website and our transport services. By using our website or
              engaging our services, you agree to be bound by these Terms.
            </p>
            <p>
              AFJ Limited is a company registered in England and Wales,
              operating from AFJ Business Centre, 2-18 Forster Street, Nechells,
              Birmingham B7 4JD.
            </p>

            <h2>2. Our Services</h2>
            <p>AFJ Limited provides the following services:</p>
            <ul>
              <li>Home-to-School SEND Transport</li>
              <li>Non-Emergency Patient Transport Services (NEPTS)</li>
              <li>Private Hire and Corporate Transport</li>
              <li>Fleet Maintenance and Servicing</li>
              <li>Vehicle Conversions and Adaptations</li>
              <li>Driver Training and Certification (MiDAS, PATS)</li>
            </ul>
            <p>
              All services are subject to availability and may vary depending on
              your location and requirements.
            </p>

            <h2>3. Booking Terms</h2>
            <h3>3.1 Making a Booking</h3>
            <p>
              Bookings can be made via our website contact form, booking form,
              telephone (0121 689 1000), or email (bookings@afjltd.co.uk). A
              booking is confirmed only when you receive written confirmation
              from us.
            </p>
            <h3>3.2 Pricing</h3>
            <p>
              All prices quoted are exclusive of VAT unless otherwise stated. We
              reserve the right to adjust pricing if the journey details change
              from those originally provided. A confirmed quote will be provided
              before any journey commences.
            </p>
            <h3>3.3 Cancellations</h3>
            <p>
              Cancellations made more than 24 hours before the scheduled journey
              will not incur a charge. Cancellations made less than 24 hours
              before the journey may be subject to a cancellation fee of up to
              100% of the quoted price. We reserve the right to cancel any
              booking where safety concerns arise.
            </p>
            <h3>3.4 Amendments</h3>
            <p>
              Changes to bookings should be communicated as soon as possible.
              Amendments may affect pricing and are subject to vehicle and driver
              availability.
            </p>

            <h2>4. Passenger Responsibilities</h2>
            <ul>
              <li>
                Be ready at the agreed pick-up location at the scheduled time.
              </li>
              <li>Wear seatbelts at all times during the journey.</li>
              <li>
                Treat our vehicles and staff with respect. Any abusive behaviour
                may result in termination of the journey.
              </li>
              <li>
                Inform us in advance of any special requirements, medical
                conditions, or accessibility needs.
              </li>
              <li>
                Not consume alcohol or use illegal substances in our vehicles.
              </li>
            </ul>

            <h2>5. Our Responsibilities</h2>
            <p>We commit to:</p>
            <ul>
              <li>Providing safe, clean, and well-maintained vehicles.</li>
              <li>
                Employing fully trained, DBS-checked, and licensed drivers.
              </li>
              <li>
                Operating in accordance with all relevant regulations including
                CQC, DVSA, and local authority requirements.
              </li>
              <li>
                Maintaining appropriate insurance cover for all journeys.
              </li>
              <li>
                Responding to booking enquiries within 2 hours during business
                hours.
              </li>
            </ul>

            <h2>6. Liability</h2>
            <h3>6.1 Our Liability</h3>
            <p>
              We maintain comprehensive insurance cover for all passengers during
              transit. Our liability for loss or damage to personal property is
              limited to items directly caused by our negligence.
            </p>
            <h3>6.2 Limitation of Liability</h3>
            <p>
              To the maximum extent permitted by law, AFJ Limited shall not be
              liable for any indirect, consequential, or special damages arising
              from the use of our services. Our total liability shall not exceed
              the value of the service provided.
            </p>
            <h3>6.3 Force Majeure</h3>
            <p>
              We shall not be liable for any delay or failure to perform our
              obligations where such delay or failure results from circumstances
              beyond our reasonable control, including but not limited to severe
              weather, road closures, traffic incidents, or vehicle breakdown.
            </p>

            <h2>7. Intellectual Property</h2>
            <p>
              All content on this website, including text, images, logos, and
              design, is the property of AFJ Limited or our licensors and is
              protected by copyright and intellectual property laws. You may not
              reproduce, distribute, or use any content without our prior
              written permission.
            </p>

            <h2>8. Website Use</h2>
            <p>
              You agree to use our website lawfully and not to engage in any
              activity that could damage, disable, or impair the website. We
              reserve the right to restrict access to any user who violates
              these Terms.
            </p>

            <h2>9. Third-Party Links</h2>
            <p>
              Our website may contain links to third-party websites. We are not
              responsible for the content or privacy practices of these external
              sites.
            </p>

            <h2>10. Complaints</h2>
            <p>
              If you are dissatisfied with any aspect of our service, please
              contact us at{" "}
              <a href="mailto:info@afjltd.co.uk">info@afjltd.co.uk</a> or call{" "}
              <a href="tel:+441216891000">0121 689 1000</a>. We aim to resolve
              all complaints within 10 working days.
            </p>

            <h2>11. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the
              laws of England and Wales. Any disputes arising from these Terms
              shall be subject to the exclusive jurisdiction of the courts of
              England and Wales.
            </p>

            <h2>12. Changes to These Terms</h2>
            <p>
              We reserve the right to update these Terms at any time. Changes
              will be posted on this page with an updated revision date.
              Continued use of our website or services constitutes acceptance of
              the updated Terms.
            </p>

            <h2>13. Contact Us</h2>
            <p>
              For any questions about these Terms, please contact us:
            </p>
            <ul>
              <li>
                Email:{" "}
                <a href="mailto:info@afjltd.co.uk">info@afjltd.co.uk</a>
              </li>
              <li>
                Phone: <a href="tel:+441216891000">0121 689 1000</a>
              </li>
              <li>
                Address: AFJ Business Centre, 2-18 Forster Street, Nechells,
                Birmingham B7 4JD
              </li>
            </ul>
          </div>
        </Container>
      </section>
    </>
  );
}
