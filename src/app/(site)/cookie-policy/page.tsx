import { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "AFJ Limited cookie policy. Learn about the cookies we use, how to manage them, and your choices regarding cookie consent.",
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
      name: "Cookie Policy",
      item: `${baseUrl}/cookie-policy`,
    },
  ],
};

export default function CookiePolicyPage() {
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
              Cookie Policy
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
            <h2>1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are stored on your device when
              you visit a website. They help the website remember your
              preferences and understand how you interact with the site. Cookies
              are widely used to make websites work more efficiently and to
              provide information to website owners.
            </p>

            <h2>2. Cookies We Use</h2>
            <h3>2.1 Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function correctly.
              They enable basic features such as page navigation and secure
              access. The website cannot function properly without these cookies.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>__next</td>
                  <td>Session management for Next.js framework</td>
                  <td>Session</td>
                </tr>
              </tbody>
            </table>

            <h3>2.2 Analytics Cookies (Future)</h3>
            <p>
              We plan to implement analytics cookies in the future to help us
              understand how visitors interact with our website. These will only
              be set with your explicit consent.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>_ga (planned)</td>
                  <td>Google Analytics - distinguishes unique users</td>
                  <td>2 years</td>
                </tr>
                <tr>
                  <td>_ga_* (planned)</td>
                  <td>Google Analytics 4 - maintains session state</td>
                  <td>2 years</td>
                </tr>
                <tr>
                  <td>_clck (planned)</td>
                  <td>Microsoft Clarity - user session tracking</td>
                  <td>1 year</td>
                </tr>
                <tr>
                  <td>_clsk (planned)</td>
                  <td>Microsoft Clarity - session stitching</td>
                  <td>1 day</td>
                </tr>
              </tbody>
            </table>

            <h2>3. Third-Party Cookies</h2>
            <p>
              Some third-party services embedded on our site may set their own
              cookies:
            </p>
            <ul>
              <li>
                <strong>Google Maps:</strong> Used on our contact page to
                display our location. Google may set cookies to provide map
                functionality and gather usage statistics.
              </li>
            </ul>

            <h2>4. Managing Cookies</h2>
            <p>
              You can control and manage cookies in several ways. Most browsers
              allow you to:
            </p>
            <ul>
              <li>View and delete cookies already stored on your device.</li>
              <li>Block cookies from being set by specific or all websites.</li>
              <li>Set preferences to accept or reject cookies.</li>
            </ul>
            <p>
              Please note that blocking essential cookies may prevent the
              website from functioning correctly.
            </p>
            <h3>Browser-Specific Instructions</h3>
            <ul>
              <li>
                <strong>Chrome:</strong> Settings &gt; Privacy and security &gt;
                Cookies and other site data
              </li>
              <li>
                <strong>Firefox:</strong> Settings &gt; Privacy &amp; Security
                &gt; Cookies and Site Data
              </li>
              <li>
                <strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage
                Website Data
              </li>
              <li>
                <strong>Edge:</strong> Settings &gt; Privacy, search, and
                services &gt; Cookies and site permissions
              </li>
            </ul>

            <h2>5. Consent</h2>
            <p>
              When we introduce analytics cookies, we will implement a cookie
              consent mechanism that will allow you to choose which non-essential
              cookies you wish to accept. Essential cookies do not require
              consent as they are necessary for the website to function.
            </p>

            <h2>6. Changes to This Policy</h2>
            <p>
              We may update this cookie policy from time to time to reflect
              changes in the cookies we use or for operational, legal, or
              regulatory reasons. Please revisit this page periodically to stay
              informed about our use of cookies.
            </p>

            <h2>7. Contact Us</h2>
            <p>
              If you have any questions about our use of cookies, please contact
              us:
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

            <h2>8. More Information</h2>
            <p>
              For more information about cookies and how to manage them, visit{" "}
              <a
                href="https://www.aboutcookies.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                aboutcookies.org
              </a>{" "}
              or{" "}
              <a
                href="https://www.allaboutcookies.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                allaboutcookies.org
              </a>
              .
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
