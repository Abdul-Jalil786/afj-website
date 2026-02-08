import { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description:
    "AFJ Limited accessibility statement. Our commitment to WCAG 2.1 AA conformance, accessibility features, and how to report issues.",
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
      name: "Accessibility Statement",
      item: `${baseUrl}/accessibility`,
    },
  ],
};

export default function AccessibilityPage() {
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
              Accessibility Statement
            </h1>
            <p className="text-lg text-white/80">
              Our commitment to making this website accessible to everyone.
            </p>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section className="py-16">
        <Container size="sm">
          <div className="prose prose-lg max-w-none prose-headings:text-navy prose-a:text-green">
            <h2>Our Commitment</h2>
            <p>
              AFJ Limited is committed to ensuring digital accessibility for
              people with disabilities. We are continually improving the user
              experience for everyone and applying the relevant accessibility
              standards.
            </p>
            <p>
              We aim to conform to the{" "}
              <a
                href="https://www.w3.org/TR/WCAG21/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Web Content Accessibility Guidelines (WCAG) 2.1
              </a>{" "}
              at Level AA. These guidelines explain how to make web content more
              accessible for people with disabilities and user-friendly for
              everyone.
            </p>

            <h2>Accessibility Features</h2>
            <p>
              This website has been designed with the following accessibility
              features:
            </p>
            <ul>
              <li>
                <strong>Semantic HTML:</strong> We use proper HTML elements
                (headings, landmarks, lists) to ensure screen readers can
                accurately interpret the content structure.
              </li>
              <li>
                <strong>Keyboard navigation:</strong> All interactive elements
                are accessible via keyboard. You can navigate the site using Tab,
                Shift+Tab, Enter, and Escape keys.
              </li>
              <li>
                <strong>Skip to content:</strong> A skip navigation link is
                provided to allow keyboard users to bypass repetitive navigation
                and jump directly to the main content.
              </li>
              <li>
                <strong>Screen reader support:</strong> ARIA labels, live
                regions, and role attributes are used to enhance the experience
                for screen reader users.
              </li>
              <li>
                <strong>Focus indicators:</strong> Visible focus outlines are
                provided for all interactive elements to assist keyboard
                navigation.
              </li>
              <li>
                <strong>Alternative text:</strong> Meaningful alt text is
                provided for images to convey information to users who cannot see
                them.
              </li>
              <li>
                <strong>Colour contrast:</strong> Text and interactive elements
                meet WCAG 2.1 AA colour contrast requirements.
              </li>
              <li>
                <strong>Responsive design:</strong> The website adapts to
                different screen sizes and works well with browser zoom up to
                200%.
              </li>
              <li>
                <strong>Reduced motion:</strong> Animations are reduced for
                users who have indicated a preference for reduced motion in their
                operating system settings.
              </li>
            </ul>

            <h2>Known Limitations</h2>
            <p>
              Despite our best efforts, some areas of the website may not yet be
              fully accessible:
            </p>
            <ul>
              <li>
                Some placeholder images may not have fully descriptive
                alternative text. We are working to replace these with
                meaningful descriptions.
              </li>
              <li>
                A dark mode option is not currently available. We are
                investigating implementation.
              </li>
              <li>
                Some embedded third-party content (e.g. Google Maps) may not
                meet all accessibility requirements. We provide alternative
                access to this information where possible.
              </li>
              <li>
                PDF documents linked from this site may not be fully accessible.
                Please contact us for alternative formats.
              </li>
            </ul>

            <h2>Reporting Accessibility Issues</h2>
            <p>
              We welcome your feedback on the accessibility of this website. If
              you encounter any barriers or have suggestions for improvement,
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
            <p>
              We aim to respond to accessibility feedback within 5 working days
              and to resolve issues within 10 working days where possible.
            </p>

            <h2>Enforcement Procedure</h2>
            <p>
              The Equality and Human Rights Commission (EHRC) is responsible for
              enforcing the Public Sector Bodies (Websites and Mobile
              Applications) Accessibility Regulations 2018. If you are not happy
              with how we respond to your complaint, you can contact the{" "}
              <a
                href="https://www.equalityadvisoryservice.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Equality Advisory and Support Service (EASS)
              </a>
              .
            </p>

            <h2>Technical Information</h2>
            <p>
              This website is built using Next.js and React with semantic HTML5,
              ARIA attributes, and modern CSS. We test with:
            </p>
            <ul>
              <li>Automated accessibility testing tools (axe, Lighthouse)</li>
              <li>Manual keyboard navigation testing</li>
              <li>Screen reader testing (NVDA, VoiceOver)</li>
              <li>Browser zoom testing up to 200%</li>
            </ul>

            <h2>Statement Details</h2>
            <p>
              This statement was prepared on February 2026 and was last reviewed
              on February 2026.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
