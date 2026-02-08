import { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "AFJ Limited privacy policy. How we collect, use, and protect your personal data under UK GDPR. Your rights and our data processing practices.",
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
      name: "Privacy Policy",
      item: `${baseUrl}/privacy-policy`,
    },
  ],
};

export default function PrivacyPolicyPage() {
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
              Privacy Policy
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
              AFJ Limited (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting
              and respecting your privacy. This policy explains how we collect,
              use, and safeguard your personal data when you visit our website
              or use our services.
            </p>
            <p>
              AFJ Limited is the data controller responsible for your personal
              data. We are registered in England and Wales and operate from AFJ
              Business Centre, 2-18 Forster Street, Nechells, Birmingham B7 4JD.
            </p>

            <h2>2. Data We Collect</h2>
            <p>We may collect the following personal data:</p>
            <ul>
              <li>
                <strong>Contact information:</strong> name, email address,
                telephone number, and postal address when you submit our contact
                or booking forms.
              </li>
              <li>
                <strong>Booking details:</strong> pick-up and drop-off
                locations, dates, times, number of passengers, and any special
                requirements.
              </li>
              <li>
                <strong>Employment data:</strong> CV, employment history,
                qualifications, and references when you apply for a position.
              </li>
              <li>
                <strong>Technical data:</strong> IP address, browser type,
                device information, and pages visited through cookies and
                similar technologies.
              </li>
            </ul>

            <h2>3. How We Use Your Data</h2>
            <p>We use your personal data to:</p>
            <ul>
              <li>Respond to your enquiries and provide quotes.</li>
              <li>Process and manage transport bookings.</li>
              <li>Send service confirmations and updates.</li>
              <li>Process job applications.</li>
              <li>Improve our website and services.</li>
              <li>
                Comply with legal obligations, including health and safety
                requirements.
              </li>
            </ul>
            <p>
              We process your data on the basis of legitimate interest (to
              respond to enquiries), contract performance (to fulfil bookings),
              consent (for marketing), and legal obligation (regulatory
              compliance).
            </p>

            <h2>4. Email Communications</h2>
            <p>
              Contact form submissions and booking requests are processed via
              Resend, a third-party email delivery service. Your data is
              transmitted securely and processed in accordance with their
              privacy policy.
            </p>

            <h2>5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul>
              <li>
                <strong>Sanity CMS:</strong> Content management for our website.
                Sanity processes data in accordance with GDPR.
              </li>
              <li>
                <strong>Google Maps:</strong> Embedded on our contact page to
                display our location. Google may collect usage data subject to
                their privacy policy.
              </li>
              <li>
                <strong>Vercel:</strong> Website hosting provider. Vercel
                processes technical data in accordance with their privacy
                policy.
              </li>
            </ul>

            <h2>6. Data Retention</h2>
            <p>
              We retain your personal data only for as long as necessary to
              fulfil the purposes for which it was collected:
            </p>
            <ul>
              <li>
                <strong>Enquiry data:</strong> 12 months after the last
                communication.
              </li>
              <li>
                <strong>Booking data:</strong> 6 years for financial and legal
                compliance.
              </li>
              <li>
                <strong>Job application data:</strong> 6 months after the
                recruitment process, unless you consent to longer retention.
              </li>
              <li>
                <strong>Technical data:</strong> 12 months.
              </li>
            </ul>

            <h2>7. Your Rights Under UK GDPR</h2>
            <p>Under the UK General Data Protection Regulation, you have the right to:</p>
            <ul>
              <li>
                <strong>Access:</strong> Request a copy of the personal data we
                hold about you.
              </li>
              <li>
                <strong>Rectification:</strong> Request correction of inaccurate
                or incomplete data.
              </li>
              <li>
                <strong>Erasure:</strong> Request deletion of your personal data
                where there is no compelling reason for its continued processing.
              </li>
              <li>
                <strong>Restriction:</strong> Request that we restrict the
                processing of your personal data.
              </li>
              <li>
                <strong>Data portability:</strong> Request transfer of your data
                to another organisation.
              </li>
              <li>
                <strong>Object:</strong> Object to processing based on
                legitimate interests or direct marketing.
              </li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:info@afjltd.co.uk">info@afjltd.co.uk</a> or call{" "}
              <a href="tel:+441216891000">0121 689 1000</a>.
            </p>

            <h2>8. Data Security</h2>
            <p>
              We implement appropriate technical and organisational measures to
              protect your personal data against unauthorised access, alteration,
              disclosure, or destruction. This includes encrypted connections
              (HTTPS), secure hosting, and access controls.
            </p>

            <h2>9. Cookies</h2>
            <p>
              Our website uses essential cookies required for the site to
              function correctly. For more information, please see our{" "}
              <a href="/cookie-policy">Cookie Policy</a>.
            </p>

            <h2>10. Complaints</h2>
            <p>
              If you are unhappy with how we have handled your personal data, you
              have the right to lodge a complaint with the Information
              Commissioner&apos;s Office (ICO):
            </p>
            <ul>
              <li>
                Website:{" "}
                <a
                  href="https://ico.org.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ico.org.uk
                </a>
              </li>
              <li>Telephone: 0303 123 1113</li>
            </ul>

            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Any changes
              will be posted on this page with an updated revision date. We
              encourage you to review this policy periodically.
            </p>

            <h2>12. Contact Us</h2>
            <p>
              For any questions about this privacy policy or our data practices,
              please contact us:
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
