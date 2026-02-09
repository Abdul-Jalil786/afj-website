# CLAUDE.md — AFJ Limited Digital Platform

## Project Overview

This repository is the **single source of truth** for AFJ Limited's entire digital presence. It contains the company website (www.afjltd.co.uk), SEO strategy, blog content, social media publishing pipeline, and customer engagement tools — all managed from this repo using Claude Code.

- **Company:** AFJ Limited
- **Website:** https://www.afjltd.co.uk
- **Tech Stack:** Astro + Tailwind CSS
- **Hosting:** Railway
- **Social Platforms:** Facebook, LinkedIn
- **Domain Registrar/DNS:** Cloudflare
- **Previous Platform:** WordPress (Phlox theme + Elementor)

---

## Tech Stack

| Choice | Why |
|--------|-----|
| **Astro** | Content-first framework. Zero JS by default = blazing fast pages. Built-in markdown support for blog posts. Perfect for SEO-heavy service websites. |
| **Tailwind CSS** | Utility-first CSS. No bloated stylesheets. Consistent design system. Mobile-first responsive out of the box. |
| **Railway** | Already in use. Simple Git-based deploys. Custom domain support. Auto-deploys on push to `main`. |
| **Markdown** | All content (pages, blog posts, case studies) written in `.md` files. Easy to write, version-controlled, no CMS needed. |

---

## Repository Structure

```
afj-website/
│
├── CLAUDE.md                              # THIS FILE — project instructions for Claude Code
├── README.md                              # Public repo documentation
├── package.json                           # Astro + dependencies
├── astro.config.mjs                       # Astro configuration
├── tailwind.config.mjs                    # Tailwind configuration
├── tsconfig.json                          # TypeScript config
├── .env.example                           # Environment variable template
├── .gitignore
│
├── wordpress-export/                      # MIGRATED CONTENT FROM WORDPRESS
│   ├── *.xml                              # WordPress content export (pages, posts)
│   ├── media-urls.csv                     # All media file URLs for download
│   └── theme-reference/                   # Screenshots of old theme (for reference only)
│
├── src/                                   # WEBSITE SOURCE CODE
│   ├── layouts/                           # Page layouts
│   │   ├── BaseLayout.astro               # HTML head, nav, footer wrapper
│   │   ├── PageLayout.astro               # Standard page (About, Contact, etc.)
│   │   └── BlogLayout.astro               # Blog post layout with sidebar
│   │
│   ├── components/                        # Reusable UI components
│   │   ├── Header.astro                   # Navigation bar (dark navy background)
│   │   ├── Footer.astro                   # Footer with offices, services, social links
│   │   ├── Hero.astro                     # Hero banner with image slider
│   │   ├── ServiceCard.astro              # Service overview card (white card, shadow)
│   │   ├── TestimonialSlider.astro        # Customer testimonials carousel
│   │   ├── CTABanner.astro                # Call-to-action sections
│   │   ├── ContactForm.astro              # Contact form (name, email, phone, message)
│   │   ├── BookingButton.astro            # "Book Now!" red CTA button
│   │   ├── FAQ.astro                      # Accordion FAQ component
│   │   ├── StatsCounter.astro             # Key stats (700+ students, 18+ years, etc.)
│   │   ├── CoreValues.astro               # Core Values / Vision / Mission cards
│   │   ├── TeamSection.astro              # Team/about section
│   │   ├── FleetGallery.astro             # Vehicle/fleet photo gallery
│   │   ├── AccreditationBadges.astro      # CQC, council accreditation logos
│   │   ├── SocialSidebar.astro            # Floating social media icons (right side)
│   │   ├── BlogCard.astro                 # Blog post preview card
│   │   ├── Breadcrumbs.astro              # SEO breadcrumb navigation
│   │   ├── SEOHead.astro                  # Meta tags, Open Graph, schema markup
│   │   └── CookieBanner.astro             # GDPR cookie consent
│   │
│   ├── pages/                             # ROUTES — each file = a page URL
│   │   ├── index.astro                    # Homepage — www.afjltd.co.uk/
│   │   ├── about.astro                    # About Us — /about
│   │   ├── contact.astro                  # Contact — /contact
│   │   ├── careers.astro                  # Careers — /careers
│   │   ├── vehicles-for-sale.astro        # Vehicles for Sale — /vehicles-for-sale
│   │   ├── faq.astro                      # FAQ — /faq
│   │   ├── privacy-policy.astro           # Privacy Policy — /privacy-policy
│   │   ├── carbon-reduction-plan.astro    # Carbon Reduction Plan — /carbon-reduction-plan
│   │   ├── services/
│   │   │   ├── index.astro                # Services overview — /services
│   │   │   ├── send-transport.astro       # Home to School Transport — /services/send-transport
│   │   │   ├── patient-transport.astro    # Non-Emergency Patient Transport — /services/patient-transport
│   │   │   ├── fleet-maintenance.astro    # Fleet Maintenance — /services/fleet-maintenance
│   │   │   ├── vehicle-conversions.astro  # Vehicle Conversions — /services/vehicle-conversions
│   │   │   ├── driver-training.astro      # Driver, ACA & PA Training — /services/driver-training
│   │   │   ├── private-hire.astro         # Private Minibus Hire — /services/private-hire
│   │   │   ├── executive-minibus.astro    # Executive Minibus Hire — /services/executive-minibus
│   │   │   └── airport-transfers.astro    # Airport Transfers — /services/airport-transfers
│   │   ├── blog/
│   │   │   ├── index.astro                # Blog listing — /blog
│   │   │   └── [...slug].astro            # Dynamic blog post pages — /blog/post-title
│   │   ├── areas/                         # Local SEO landing pages
│   │   │   ├── birmingham.astro           # /areas/birmingham
│   │   │   ├── manchester.astro           # /areas/manchester
│   │   │   ├── sandwell.astro             # /areas/sandwell
│   │   │   ├── coventry.astro             # /areas/coventry
│   │   │   └── west-midlands.astro        # /areas/west-midlands
│   │   └── 404.astro                      # Custom 404 page
│   │
│   ├── content/                           # MARKDOWN CONTENT (Astro Content Collections)
│   │   ├── config.ts                      # Content collection schemas
│   │   ├── blog/                          # Blog posts
│   │   │   └── drafts/                    # Unpublished drafts
│   │   ├── case-studies/                  # Customer case studies
│   │   └── testimonials/
│   │       └── testimonials.json          # Customer testimonials data
│   │
│   ├── styles/
│   │   └── global.css                     # Tailwind base + custom styles
│   │
│   └── assets/
│       ├── images/
│       │   ├── logo/
│       │   │   ├── afj-logo.svg           # Main circular AFJ Limited logo (navy/green)
│       │   │   ├── afj-logo-small.svg     # Small logo for sticky header
│       │   │   └── afj-favicon.ico        # Browser tab icon
│       │   ├── hero/                      # Hero slider images
│       │   ├── fleet/                     # Vehicle photos
│       │   ├── team/                      # Team photos
│       │   ├── services/                  # Service-specific images
│       │   ├── accreditations/            # CQC, council logos
│       │   └── blog/                      # Blog featured images
│       └── og-images/                     # Open Graph social sharing images
│
├── public/
│   ├── robots.txt
│   ├── favicon.ico
│   └── documents/
│       ├── afj-brochure.pdf
│       └── carbon-reduction-plan.pdf
│
├── seo/                                   # SEO STRATEGY & TRACKING
│   ├── keywords/
│   │   ├── primary-keywords.csv
│   │   ├── long-tail-keywords.csv
│   │   └── local-seo-keywords.csv
│   ├── schema-markup/
│   │   ├── local-business.json
│   │   ├── services.json
│   │   ├── faq.json
│   │   └── breadcrumb.json
│   ├── competitor-analysis.md
│   ├── content-calendar.csv
│   └── redirects.json                     # WordPress URL → new URL mapping
│
├── social-media/                          # SOCIAL MEDIA CONTENT & AUTOMATION
│   ├── config/
│   │   ├── posting-schedule.json
│   │   └── brand-voice.md
│   ├── content/
│   │   ├── facebook/
│   │   │   ├── templates/
│   │   │   │   ├── service-highlight.md
│   │   │   │   ├── job-vacancy.md
│   │   │   │   ├── testimonial-share.md
│   │   │   │   ├── blog-share.md
│   │   │   │   └── community-update.md
│   │   │   └── YYYY-MM-DD-post-title.md
│   │   ├── linkedin/
│   │   │   ├── templates/
│   │   │   │   ├── company-update.md
│   │   │   │   ├── contract-win.md
│   │   │   │   ├── industry-insight.md
│   │   │   │   ├── recruitment.md
│   │   │   │   └── thought-leadership.md
│   │   │   └── YYYY-MM-DD-post-title.md
│   │   └── campaigns/
│   ├── media/
│   │   ├── templates/
│   │   ├── graphics/
│   │   └── photos/
│   └── scripts/
│       ├── publish-facebook.py
│       ├── publish-linkedin.py
│       ├── cross-post.py
│       ├── schedule.py
│       └── analytics.py
│
├── customer-engagement/
│   ├── forms/
│   │   ├── contact-config.json
│   │   └── quote-request-config.json
│   ├── email/
│   │   ├── templates/
│   │   └── auto-responses.json
│   └── reviews/
│       ├── review-request-templates.md
│       └── review-response-templates.md
│
├── scripts/
│   ├── migrate-wordpress.py               # Parse WordPress XML → Astro content
│   ├── download-media.py                  # Download images from media-urls.csv
│   ├── generate-sitemap.py
│   ├── optimise-images.sh
│   ├── setup-redirects.py
│   └── lighthouse-audit.sh
│
└── .github/
    └── workflows/
        ├── deploy.yml
        ├── lighthouse.yml
        └── broken-links.yml
```

---

## Brand Identity (Extracted from Current WordPress Site)

### Site Details
- **Site Title:** AFJ Limited
- **Tagline:** Your Partner in Safe, Reliable Transport Solutions
- **Strapline (Footer):** Empowering Mobility, Ensuring Accessibility
- **Copyright:** © {Year} AFJ Limited. All rights reserved.

### Logo
- **Primary logo:** Circular badge — navy blue background with green accent ring, white "AFJ" text, "Limited" in smaller text below. Width: 80px in header.
- **Secondary logo:** Smaller version of the same logo, used when header becomes sticky on scroll.
- **Favicon:** Mini AFJ logo (512x512px source)
- Logo files should be sourced from the WordPress media export and saved to `src/assets/images/logo/`

### Colour Palette (Elementor Global Colors)

```javascript
// tailwind.config.mjs — extend colors
module.exports = {
  theme: {
    extend: {
      colors: {
        'afj-primary':     '#2D3748',  // Primary — dark navy/slate (header background, dark sections)
        'afj-secondary':   '#4A5568',  // Secondary — charcoal grey
        'afj-text':        '#1A202C',  // Text — near-black for body copy
        'afj-accent':      '#38A169',  // Accent — green (icons, highlights)
        'afj-green':       '#2F855A',  // Green — used for headings ("Home To School Transport")
        'afj-white':       '#FFFFFF',  // White
        'afj-light-white': '#F7FAFC',  // lightWhite — off-white backgrounds
        'afj-dark-blue':   '#1A365D',  // darkBlue — deep navy (footer, dark sections)
        'afj-sky-blue':    '#3182CE',  // sky blue — links, accents
        'afj-red':         '#E53E3E',  // Book Now button, CTAs
        'afj-cqc-green':   '#00A651',  // CQC Good rating badge
      }
    }
  }
}
```

> **IMPORTANT:** These hex values are estimated from screenshots. On first build, Claude Code should inspect the live site at www.afjltd.co.uk or the WordPress export to extract exact hex values using browser dev tools or computed styles. Update this section with the precise values.

### Typography

The site uses Elementor's typography system with settings for:
- **Body** — default paragraph text
- **Heading 1 (H1)** — largest headings (page titles)
- **Heading 2 (H2)** — section headings
- **Heading 3 (H3)** — sub-section headings
- **Heading 4 (H4)** — card titles, smaller headings
- **Heading 5 (H5)** — smallest headings

> Claude Code should extract the exact font families and sizes from the WordPress export or live site CSS. For the Astro rebuild, use a clean professional font stack. Recommended: **Inter** or **Plus Jakarta Sans** for body, same or **bold weight** for headings. The current site headings appear to use a clean sans-serif in green colour for service page titles.

### Navigation Structure

**Main Menu (Header):**
```
Home
About ▾ (dropdown)
Services ▾ (dropdown)
  ├── Home to School Transport Services
  ├── Non-Emergency Patient Transport
  ├── Fleet Maintenance
  ├── Private Hire
  ├── Vehicle Conversion
  └── Training
Resources ▾ (dropdown)
Careers
Contact
Vehicles for Sale
[Book Now!] ← Red CTA button
```

**Footer Navigation:**
```
Services Column:
  ├── Home to School Transport Services
  ├── Non-Emergency Patient Transport
  ├── Fleet Maintenance
  ├── Private Hire
  ├── Vehicle Conversion
  └── Training

Links:
  ├── Privacy Policy
  └── Carbon Reduction Plan
```

**Social Media Icons (floating right sidebar + footer):**
- Facebook
- LinkedIn
- Instagram
- Twitter/X
- YouTube

### Homepage Structure

The homepage features:
1. **Hero Slider** — rotating banner with service highlights, each slide has:
   - Large green heading (service name)
   - Description paragraph
   - "Read More →" button (dark with green arrow)
   - Photo on the right side
   - Navigation arrows (< >) bottom right
2. **Core Values / Vision / Mission** — three white cards in a row with icons
3. Additional sections below (services overview, stats, testimonials, CTA)

**Hero Slider Content (from screenshots):**
- Slide 1: "Home To School Transport" + minibus photo
- Slide 2: "Non-Emergency Patient Transport Services (NEPTS)" + ambulance team photo
- Slide 3: "Minibus & Ambulance Conversion Services" + conversion workshop photo
- Slide 4: "Private Minibus Hire Services" + Mercedes minibus photo
- Slide 5: "Fleet Maintenance" + workshop/engine photo
- Slide 6: "Driver, ACA and PA Training Services" + training classroom photo

---

## Contact Details

### Head Office — Birmingham
- **Address:** AFJ Business Center, 2-18 Forster Street, Nechells, Birmingham, B7 4JD
- **Phone:** 0121 689 1000
- **Email (General):** info@afjltd.co.uk
- **Email (Sales):** sales@afjltd.co.uk

### Contact Form Fields
The contact page form includes:
- Full name (text input)
- Email Address* (required, email input)
- Phone (tel input with country code selector, placeholder: 07400 123456)
- Message* (required, textarea)
- Submit button: "Submit your message"

---

## Agent Roles for Claude Code

When working in this repo, Claude Code should operate with these specialised perspectives:

### 1. SEO Strategist
**Goal:** Get AFJ ranking on page 1 for target keywords in Birmingham and Manchester.

- Research and maintain keyword lists in `seo/keywords/`
- Write meta titles (max 60 chars) and descriptions (max 155 chars) for every page
- Create JSON-LD structured data in `seo/schema-markup/`
- Build monthly content calendars in `seo/content-calendar.csv`
- Ensure every page has: primary keyword in H1, secondary keywords in H2s, internal links, optimised images with alt text
- Create location-specific landing pages in `src/pages/areas/`
- Set up redirect map from old WordPress URLs in `seo/redirects.json`
- Monitor competitor content (Green Destinations, Travel SOS, National Express)

**Priority Keywords:**

| Service | Primary Keywords | Local Modifiers |
|---------|-----------------|-----------------|
| SEND Transport | SEND school transport, SEN transport provider, special needs school bus, home to school transport | Birmingham, Manchester, West Midlands, North West |
| NEPTS | patient transport service, non-emergency ambulance, hospital transport, NHS patient transport | Birmingham, NHS, West Midlands |
| Fleet | fleet maintenance Birmingham, vehicle conversion, wheelchair vehicle conversion | Birmingham, West Midlands |
| Training | driver CPC training, passenger assistant training, ambulance care assistant training | Birmingham, West Midlands |
| Private Hire | minibus hire Birmingham, private minibus hire, executive minibus hire | Birmingham, West Midlands |
| General | transport company Birmingham, accessible transport, council transport provider | Birmingham, Manchester, Sandwell, Coventry |

### 2. Content Writer
**Goal:** Create high-quality, SEO-optimised content that converts visitors into enquiries.

- Write blog posts (800–1500 words) saved to `src/content/blog/`
- Write service page copy highlighting key differentiators
- Create case studies from council/NHS contracts
- Write FAQ content targeting "People Also Ask" queries
- Ensure all content follows brand voice (see Brand Guidelines below)
- Add internal links between related pages
- Write alt text for every image

**Blog Post Frontmatter Template:**
```markdown
---
title: "Your SEO-Optimised Title Here"
description: "Meta description under 155 characters with primary keyword."
pubDate: 2026-02-09
author: "AFJ Limited"
image: "../assets/images/blog/featured-image.jpg"
imageAlt: "Descriptive alt text for the featured image"
tags: ["SEND transport", "Birmingham", "school transport"]
draft: false
---
```

### 3. Social Media Manager
**Goal:** Build AFJ's presence on Facebook and LinkedIn. Drive website traffic. Build trust with councils, NHS, parents, and potential employees.

- Create platform-specific posts in `social-media/content/facebook/` and `social-media/content/linkedin/`
- Facebook = warmer, community-focused; LinkedIn = professional, B2B, industry authority
- Cross-post blog content using `social-media/scripts/cross-post.py`
- Plan campaigns around key dates (back to school, NHS awareness weeks, recruitment drives)

**Posting Schedule:**
| Day | Facebook | LinkedIn |
|-----|----------|----------|
| Monday | Service highlight | Industry insight / thought leadership |
| Wednesday | Community story / testimonial | Company update / contract news |
| Friday | Behind-the-scenes / team spotlight | Recruitment / career opportunity |

**Facebook Post Template:**
```markdown
---
platform: facebook
date: YYYY-MM-DD
time: "10:00"
type: service-highlight | testimonial | blog-share | job-vacancy | community-update
image: /social-media/media/graphics/filename.png
link: https://www.afjltd.co.uk/page
---

[Post copy — warm, community-focused, 100-200 words]

📞 0121 689 1000
🌐 www.afjltd.co.uk

#SENDTransport #Birmingham #AFJLimited #SpecialNeeds #SchoolTransport
```

**LinkedIn Post Template:**
```markdown
---
platform: linkedin
date: YYYY-MM-DD
time: "08:30"
type: company-update | contract-win | industry-insight | recruitment | thought-leadership
image: /social-media/media/graphics/filename.png
link: https://www.afjltd.co.uk/page
---

[Post copy — professional, thought-leadership, 150-300 words]

#PatientTransport #FleetManagement #Birmingham #TransportIndustry #SEND
```

### 4. Web Developer
**Goal:** Build a fast, accessible, mobile-first website that ranks well and converts visitors.

- Build and maintain Astro components in `src/components/`
- Ensure every page scores 90+ on Lighthouse
- Implement contact form with fields matching current site (name, email*, phone, message*)
- Set up analytics (GA4 + Google Search Console)
- Configure Railway deployment with custom domain (www.afjltd.co.uk)
- Handle WordPress → Astro migration (content, redirects, images)
- Implement the floating social sidebar (Facebook, LinkedIn, Instagram, Twitter, YouTube)
- Recreate the hero image slider from the current homepage
- Ensure responsive design with mobile-first approach

**Astro Configuration:**
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.afjltd.co.uk',
  integrations: [
    tailwind(),
    sitemap(),
  ],
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
```

### 5. Customer Engagement Specialist
**Goal:** Turn website visitors into leads and customers into advocates.

- Design contact and quote request forms matching current form fields
- Create Google review request and response templates
- Set up automated email responses for form submissions
- Draft FAQ content for common customer questions
- Create lead nurture email sequences for tender/procurement contacts

---

## Brand Guidelines

### Voice & Tone
- **Professional** but approachable — trusted by councils and the NHS, but not corporate-stiff
- **Caring** — our passengers are vulnerable people (children with special needs, patients). Always show empathy
- **Community-focused** — Birmingham business, proud of our roots, invested in local communities
- **Confident** — 18+ years experience, CQC Good rating, 700+ students daily. State facts, don't oversell
- **Inclusive** — our services exist to make transport accessible for everyone

### Key Differentiators (Always Highlight)
1. **Established 2006** — 18+ years of experience
2. **CQC rated "Good"** — quality-assured patient transport
3. **700+ students transported daily** — proven scale
4. **In-house everything** — vehicle maintenance, conversions, and QualSafe-approved training
5. **Council & NHS accredited** — Birmingham, Manchester, and beyond
6. **DBS-checked staff** — every driver and passenger assistant
7. **In-house ambulance conversions** — only UK PTS provider that builds its own ambulances
8. **Same pricing year-round** — no bank holiday or seasonal surcharges

### Writing Rules
- Use British English (colour, organise, specialise, centre)
- Write "AFJ Limited" or "AFJ" — never "Afj" or "afj"
- Use "passenger assistant" not "escort" or "carer"
- Use "SEND" not "SEN" when referring to current terminology
- Always capitalise service names: "Home to School Transport", "Patient Transport Service"
- Phone: 0121 689 1000
- Address: AFJ Business Center, 2-18 Forster Street, Nechells, Birmingham, B7 4JD
- General email: info@afjltd.co.uk
- Sales email: sales@afjltd.co.uk
- Website: www.afjltd.co.uk

---

## Company Information (for Content)

### Core Values
AFJ Limited prioritises integrity, continuous improvement, passenger-centricity, operational excellence, environmental stewardship, collaborative innovation, safety first, and stakeholder engagement in their transport operations.

### Vision
At AFJ Limited, our vision is to excel in delivering reliable, innovative, and customer-centric transport solutions while prioritising safety, sustainability, and collaboration.

### Mission
At AFJ Limited, our mission is to provide high-quality, compliant transport services with a customer-centric approach, fostering community engagement and sustainability for a positive impact on society.

### Services

**1. Home to School Transport (SEND)**
- Over 700 students transported daily
- Birmingham and Manchester council contracts
- DBS-checked drivers and passenger assistants
- Wheelchair-accessible 16-seater minibuses
- Real-time tracking via in-house ERP system
- Council-accredited across West Midlands and North West
- Eco-friendly fleet with low-carbon emission vehicles

**2. Non-Emergency Patient Transport (NEPTS)**
- CQC rated "Good"
- NHS trust contracts across West Midlands and North West
- Stretcher, wheelchair, carry-chair, and ambulatory patients
- Services: Renal dialysis, discharge, bariatric, long-distance
- Trained Ambulance Care Assistants (ACAs)
- In-house ambulance conversions — only UK PTS provider that builds its own ambulances
- Same pricing year-round including bank holidays
- Works with NHS trusts, hospitals, clinics on contracted and ad-hoc basis

**3. Fleet Maintenance**
- In-house vehicle maintenance workshop
- Comprehensive fleet maintenance and car repair services
- Skilled technicians and state-of-the-art facilities
- Minimising downtime, maximising vehicle lifespan
- Serving businesses with fleets and individual car owners in Birmingham

**4. Vehicle Conversions**
- Wheelchair-accessible vehicle conversions (16-seater minibuses)
- Ambulance conversions with wipe-clean surfaces and infection control
- Luxury minibus conversions (leather seats, coffee machines, surround sound, etc.)
- All conversions VOSA certified
- Mercedes, VW, Ford, Renault, LDV, Toyota Hi Ace and more
- Ramps and wheelchair lifts (inboard and under-floor options)

**5. Driver, ACA & PA Training**
- QualSafe-approved training programmes
- Driver CPC courses
- Ambulance Care Assistant (ACA) training
- Passenger Assistant (PA) certification
- In-house training facilities

**6. Private Minibus Hire**
- Modern fleet of 16-seater wheelchair-accessible minibuses
- Corporate events, school trips, days out, group travel
- Experienced drivers
- Flexible and convenient booking

**7. Executive Minibus Hire**
- Luxury minibus hire with driver
- Corporate travel, events, race days (Cheltenham, Royal Ascot, Warwick)
- Airport transfers (Birmingham Airport)
- Hotel transfers

### Testimonials (from current site)

> "AFJ Travel helped me out of a hole, having forgotten to book the minibus for Cheltenham I contacted AFJ and they managed to arrange travel at a very competitive price. I needed to change some of the arrangements just before our travel date and nothing was too much trouble. On the day the driver was extremely accommodating and again nothing was too much trouble. We will be using them again next year."

> "Booked AFJ Travel for my stag weekend, the booking and the reasonable price with AFJ were perfect for us. From Birmingham to Bournemouth, Second stop Bournemouth to Torquay. Our driver Khan for the weekend was an ultimate legend! Added humour to our journey from start to finish and fully embraced our madness, much appreciated. Would rebook with AFJ Travel anytime."

> "I used AFJ for a stag do to Wales and back and they were awesome. Our driver Steve was so good I would have paid a lot more to have kept him around for the whole weekend."

### Areas Served
Birmingham, Greater Manchester, West Midlands, North West, Sandwell, Coventry

---

## Deployment & Workflow

### Git Workflow
```
main          ← production (auto-deploys to Railway)
├── dev       ← development/staging
├── content/* ← blog posts and page content branches
└── feature/* ← new features and components
```

### Railway Setup
Railway auto-deploys when you push to `main`. For a static Astro site:
- **Build command:** `npm run build`
- **Output directory:** `dist/`

### Custom Domain Setup
1. In Railway dashboard → Settings → Custom Domain → add `www.afjltd.co.uk`
2. In Cloudflare DNS → CNAME record: `www` → Railway's provided domain
3. Cloudflare Page Rule: redirect `afjltd.co.uk` → `www.afjltd.co.uk`

### WordPress Migration (First Task)

When Claude Code first runs in this repo, the priority is migrating content from WordPress:

1. **Parse the WordPress XML export** in `wordpress-export/` to extract all page content, blog posts, and metadata
2. **Download all media** from `wordpress-export/media-urls.csv` and organise into `src/assets/images/` by category
3. **Create Astro pages** with the migrated content for every existing page
4. **Set up redirects** from old WordPress URLs to new clean URLs in `seo/redirects.json`
5. **Extract and optimise images** — compress, resize, convert to WebP where appropriate

---

## Claude Code Commands

### Initial Migration
```powershell
# First run — read instructions and plan migration
claude "Read CLAUDE.md. Examine the wordpress-export/ folder — parse the XML export to understand the site structure, pages, and content. Look at media-urls.csv for all images. Create a detailed migration plan listing every page and how it maps to the new Astro structure. Don't build anything yet — just give me the plan."

# After reviewing the plan — build everything
claude "Go ahead and scaffold the full Astro project. Migrate all content from the WordPress export using real content, not placeholders. Set up all layouts, components, pages, and content collections as defined in CLAUDE.md."
```

### Website Development
```powershell
# Build a specific page
claude "Build the SEND Transport service page. Use the service info from CLAUDE.md and any content from the WordPress export. Include hero, key stats, FAQ, testimonials, and a quote request CTA."

# Create a component
claude "Create the hero image slider component matching the current homepage layout — green heading on the left, service description, Read More button, and photo on the right with navigation arrows."

# Dev server
npm run dev    # http://localhost:4321

# Build
npm run build
```

### Content & SEO
```powershell
# Write a blog post
claude "Write an SEO-optimised blog post about 'How to Choose a SEND Transport Provider in Birmingham'. Target keyword: 'SEND school transport Birmingham'. Save to src/content/blog/"

# Local SEO page
claude "Create a location landing page for Birmingham targeting 'transport company Birmingham' and 'SEND transport Birmingham'. Save to src/pages/areas/birmingham.astro"

# Schema markup
claude "Create JSON-LD LocalBusiness schema for AFJ Limited including all services, CQC rating, areas served, contact details, and both email addresses. Save to seo/schema-markup/"

# SEO audit
claude "Audit all pages for SEO. Check meta titles, descriptions, H1 tags, image alt text, internal links, keyword usage. Output a report with action items."

# Content calendar
claude "Create a 3-month content calendar (March-May 2026) with weekly blog topics and social media themes. Save to seo/content-calendar.csv"
```

### Social Media
```powershell
# Weekly posts
claude "Create this week's social media posts. 3 Facebook posts (Mon/Wed/Fri) and 3 LinkedIn posts (Mon/Wed/Fri) following the schedule in CLAUDE.md. Save to social-media/content/"

# Cross-post blog
claude "Take the latest blog post and create Facebook + LinkedIn posts promoting it. Adapt tone for each platform."

# Campaign
claude "Plan a 'Back to School September 2026' campaign for Facebook and LinkedIn. 8 posts over 4 weeks."

# Publish
python social-media/scripts/publish-facebook.py --file social-media/content/facebook/[file].md
python social-media/scripts/publish-linkedin.py --file social-media/content/linkedin/[file].md
```

### Multi-Agent Reviews
```powershell
# Full site review
claude "Review the entire site. Agent 1: SEO audit. Agent 2: accessibility and mobile. Agent 3: content quality and brand voice. Agent 4: page speed performance."
```

---

## Social Media API Setup

### Facebook Page Publishing
1. Create a Facebook App at developers.facebook.com
2. Get Page Access Token with `pages_manage_posts` and `pages_read_engagement`
3. Store in `.env` as `FACEBOOK_PAGE_ID` and `FACEBOOK_ACCESS_TOKEN`

### LinkedIn Company Page Publishing
1. Create a LinkedIn App at linkedin.com/developers
2. Request `w_organization_social` permission
3. Get Organization ID from company page admin
4. Store in `.env` as `LINKEDIN_ORG_ID` and `LINKEDIN_ACCESS_TOKEN`

---

## Environment Variables

```env
# Railway
RAILWAY_TOKEN=

# Site
SITE_URL=https://www.afjltd.co.uk

# Facebook
FACEBOOK_PAGE_ID=
FACEBOOK_ACCESS_TOKEN=

# LinkedIn
LINKEDIN_ORG_ID=
LINKEDIN_ACCESS_TOKEN=

# Forms
FORMSPREE_ENDPOINT=
# or
WEB3FORMS_API_KEY=

# Analytics
GA4_MEASUREMENT_ID=
GOOGLE_SEARCH_CONSOLE_VERIFICATION=

# Email notifications
NOTIFICATION_EMAIL=info@afjltd.co.uk
```

---

## Getting Started

```powershell
# 1. You should already have the repo cloned with wordpress-export/ and CLAUDE.md

# 2. Copy env file and fill in credentials
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Open Claude Code
claude

# 5. Tell Claude to read instructions and plan migration
# "Read CLAUDE.md and examine wordpress-export/. Create a migration plan."

# 6. Start development
npm run dev
# http://localhost:4321

# 7. Deploy
git add . && git commit -m "feat: initial astro site with migrated content" && git push origin main
# Railway auto-deploys
```

---

## Important Rules

1. **Never commit API keys or credentials** — use `.env`, ensure `.gitignore` covers sensitive files
2. **All images must be optimised** — use Astro's built-in image optimisation, target WebP format
3. **Blog posts start as drafts** — `draft: true` in frontmatter, review, then set `false` and push
4. **Social posts need review** — save to platform folder, review, then publish via script
5. **British English everywhere** — colour, organise, specialise, centre
6. **Meaningful commit messages** — `blog: add SEND transport guide`, `social: schedule week 7`, `fix: contact form validation`
7. **Mobile-first** — design for mobile, scale up to desktop
8. **Accessibility** — alt text on all images, heading hierarchy, ARIA labels, colour contrast
9. **Page speed** — sub-2-second load times, zero unnecessary JS, use Astro's defaults
10. **Test before deploy** — `npm run build` locally, check for errors before pushing to main
11. **Preserve existing SEO** — set up redirects from all old WordPress URLs to prevent broken links and lost rankings
