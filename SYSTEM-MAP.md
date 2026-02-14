# SYSTEM-MAP.md — AFJ Limited Digital Platform

> Living document. Updated every time a feature is built, modified, or planned.
> Last updated: 2026-02-14

---

## 1. Project Overview

| Field | Value |
|-------|-------|
| **Company** | AFJ Limited |
| **Website** | https://www.afjltd.co.uk |
| **Framework** | Astro (static + server-rendered endpoints) |
| **Styling** | Tailwind CSS |
| **Hosting** | Railway (auto-deploys on push to `main`) |
| **Adapter** | `@astrojs/node` (standalone mode) |
| **Domain/DNS** | Cloudflare |
| **Repo** | `afj-website` on `main` branch |

---

## 2. What's Been Built (Changelog)

Chronological record of every major feature, based on git history.

### Phase 0 — Legacy (removed)
- Initial Next.js 14 + Sanity CMS build (commits `9d94eb5`–`d8d7d85`)
- Analytics, cookie consent, social sharing, OG images, CI/CD pipeline
- **Replaced entirely** in Phase 1

### Phase 1 — Astro Migration (`6934510`)
- Clean slate: WordPress XML export + CLAUDE.md created
- Full Astro site migrated from WordPress content
- All pages, layouts, components, blog posts, and images ported
- Node adapter added for Railway deployment
- Images moved to `public/` for production loading

### Phase 2 — Polish & Fixes (`0d7f368`–`6f3d1f9`)
- Comprehensive site audit: images, social links, OG image, embedded map
- Hero layout improvements: bigger images, wider layout, proper grid fill
- Blog renamed to "News" in navigation

### Phase 3 — Content & Pages (`5afd91e`–`40b6964`)
- **Social Impact Report** page with interactive dashboard, leadership messages, CSR framework, UK health map, partner charities, and SDG alignment components
- **Image library** internal tool at `/image-library` with bulk rename capability
- Image renaming to descriptive filenames across all pages
- Duplicate image removal and unused image integration
- **5 local SEO landing pages**: Birmingham, Manchester, Sandwell, Coventry, West Midlands

### Phase 4 — Content Calendar Dashboard (`32f9044`) ← LATEST
- **Content Calendar** internal dashboard at `/content-calendar`
- Interactive month calendar with colour-coded content dots
- Blog post table parsed from `seo/content-calendar.csv` with status toggles (Draft/Scheduled/Published)
- Blog creation form that pushes `.md` files to GitHub via API (auto-deploys via Railway)
- Social media weekly schedule with email reminder buttons
- Template reference cards for all 10 social media templates
- **API endpoint** `POST /api/blog/create` — creates blog posts via GitHub API
- **API endpoint** `POST /api/notify` — sends email reminders via Resend API
- Both endpoints secured with `DASHBOARD_SECRET` header auth

---

## 3. Architecture Map

### Public Pages (29 routes)

```
/                               Homepage (hero slider, core values, services, stats)
/about                          About Us
/contact                        Contact form (name, email, phone, message)
/careers                        Careers page
/faq                            FAQ with accordion
/vehicles-for-sale              Vehicle sales listing
/privacy-policy                 Privacy policy
/carbon-reduction-plan          Carbon reduction plan
/social-impact                  Social Impact Report (interactive)
/blog                           Blog/News listing (16 published posts)
/blog/[slug]                    Dynamic blog post pages
/services                       Services overview
/services/send-transport        Home to School Transport (SEND)
/services/patient-transport     Non-Emergency Patient Transport
/services/fleet-maintenance     Fleet Maintenance
/services/vehicle-conversions   Vehicle Conversions
/services/driver-training       Driver, ACA & PA Training
/services/private-hire          Private Minibus Hire
/services/executive-minibus     Executive Minibus Hire
/services/airport-transfers     Airport Transfers
/areas                          Areas served overview
/areas/birmingham               Local SEO — Birmingham
/areas/manchester               Local SEO — Manchester
/areas/sandwell                 Local SEO — Sandwell
/areas/coventry                 Local SEO — Coventry
/areas/west-midlands            Local SEO — West Midlands
/404                            Custom 404 page
```

### Internal Tools (not indexed, not in sitemap)

```
/image-library                  Image browser with bulk rename tool
/content-calendar               Content calendar dashboard (calendar, blog creator, social schedule, templates)
```

### API Endpoints (server-rendered)

```
POST /api/blog/create           Creates blog .md file via GitHub API → auto-deploys
POST /api/notify                Sends email reminder via Resend API
```

### Components (27)

```
Layouts:
  BaseLayout.astro              HTML shell, fonts, meta
  (PageLayout, BlogLayout)      Referenced in CLAUDE.md, may need building

Core:
  Header.astro                  Navigation bar (dark navy)
  Footer.astro                  Footer with offices, services, social links
  Hero.astro                    Hero banner with image slider
  Breadcrumbs.astro             SEO breadcrumb navigation
  SEOHead.astro                 Meta tags, Open Graph, schema
  CookieBanner.astro            GDPR cookie consent
  SocialSidebar.astro           Floating social media icons

Content:
  ServiceCard.astro             Service overview card
  BlogCard.astro                Blog post preview card
  TestimonialSlider.astro       Testimonials carousel
  FAQ.astro                     Accordion FAQ
  StatsCounter.astro            Key stats (700+ students, 18+ years)
  CoreValues.astro              Vision / Mission / Values cards
  TeamSection.astro             Team/about section
  FleetGallery.astro            Vehicle photo gallery
  AccreditationBadges.astro     CQC, council logos
  CTABanner.astro               Call-to-action sections
  BookingButton.astro           "Book Now!" red CTA
  BookingForm.astro             Booking form
  ContactForm.astro             Contact form

Social Impact (6):
  SocialImpactHero.astro
  ImpactDashboard.astro
  LeadershipMessages.astro
  CSRFramework.astro
  UKHealthMap.astro
  PartnerCharities.astro
  SDGAlignment.astro
```

### Content Sources

```
src/content/blog/*.md           16 published blog posts (Astro content collection)
seo/content-calendar.csv        24 planned blog posts (W1–W12, Feb–May 2026)
src/content/testimonials/       Testimonials JSON
social-media/content/           10 social media templates (5 Facebook, 5 LinkedIn)
public/images/                  All site images (optimised, descriptive filenames)
public/documents/               PDFs (brochure, carbon reduction plan)
public/social-impact-report/    Social Impact Report assets
```

### External Integrations

```
GitHub API          → Blog post creation from dashboard (needs GITHUB_TOKEN)
Resend API          → Email notifications for content due dates (needs RESEND_API_KEY)
Railway             → Auto-deploy on push to main
Cloudflare          → DNS, SSL, domain management
Google Fonts        → Inter font family
```

---

## 4. Current System Status

### Live & Working
- All 29 public pages render and build successfully
- Blog with 16 published posts
- Hero slider with 6 service slides
- Contact form UI (frontend only)
- Cookie consent banner
- Social sidebar
- SEO meta tags and Open Graph
- Sitemap generation (excludes internal pages)
- Image library internal tool
- Content calendar dashboard UI

### Needs Environment Variables to Activate
| Feature | Env Vars Required | Status |
|---------|-------------------|--------|
| Blog creation via dashboard | `GITHUB_TOKEN`, `GITHUB_REPO`, `DASHBOARD_SECRET` | UI built, needs tokens |
| Email notifications | `RESEND_API_KEY`, `DASHBOARD_SECRET` | UI built, needs tokens |
| Contact form submission | `FORMSPREE_ENDPOINT` or `WEB3FORMS_API_KEY` | Frontend only, no backend |
| Google Analytics | `GA4_MEASUREMENT_ID` | Not integrated |
| Search Console | `GOOGLE_SEARCH_CONSOLE_VERIFICATION` | Not integrated |
| Facebook publishing | `FACEBOOK_PAGE_ID`, `FACEBOOK_ACCESS_TOKEN` | Scripts not built |
| LinkedIn publishing | `LINKEDIN_ORG_ID`, `LINKEDIN_ACCESS_TOKEN` | Scripts not built |

### Not Yet Built
- Contact form backend (submission handling)
- Social media publishing scripts (`social-media/scripts/`)
- Email auto-responses for form submissions
- Google review request/response system
- CI/CD workflows (Lighthouse audits, broken link checks)
- WordPress redirect map (`seo/redirects.json`)

---

## 5. Roadmap — What's Next

Priority order based on business impact:

### Immediate (High Priority)
1. **Configure env vars** — Set `GITHUB_TOKEN`, `GITHUB_REPO`, `RESEND_API_KEY`, `DASHBOARD_SECRET` on Railway to activate the content calendar dashboard fully
2. **Contact form backend** — Connect Formspree or Web3Forms so the contact form actually sends submissions to info@afjltd.co.uk
3. **Google Analytics + Search Console** — Add GA4 tracking and verify domain with Search Console for SEO data
4. **Blog content production** — 24 planned posts in `seo/content-calendar.csv` ready to write (Feb–May 2026)

### Short-Term
5. **WordPress redirect map** — Build `seo/redirects.json` mapping old WordPress URLs to new routes to preserve SEO value
6. **Schema markup** — Create JSON-LD structured data for LocalBusiness, services, FAQ, and breadcrumbs (`seo/schema-markup/`)
7. **Social media publishing automation** — Build the Python scripts in `social-media/scripts/` for Facebook and LinkedIn API publishing
8. **Email auto-responses** — Set up automated email replies for contact form and quote request submissions

### Medium-Term
9. **Competitor analysis** — Document and monitor competitor content (Green Destinations, Travel SOS, National Express)
10. **Customer engagement system** — Google review request templates, response templates, lead nurture email sequences
11. **CI/CD workflows** — GitHub Actions for Lighthouse audits, broken link checks, auto-deploy validation
12. **Additional local SEO pages** — Expand beyond the 5 current area pages based on search data

### Long-Term
13. **CMS integration** — Evaluate whether a headless CMS (e.g. Keystatic, Decap) would be better than direct GitHub API for non-technical content editors
14. **Performance optimisation** — WebP image conversion, lazy loading audit, Core Web Vitals monitoring
15. **Accessibility audit** — Full WCAG 2.1 AA compliance review

---

## 6. Environment Variables Reference

```env
# Railway
RAILWAY_TOKEN=                              # Railway deployment token

# Site
SITE_URL=https://www.afjltd.co.uk          # Canonical site URL

# Facebook Publishing
FACEBOOK_PAGE_ID=                           # Facebook Page ID
FACEBOOK_ACCESS_TOKEN=                      # Page access token (pages_manage_posts)

# LinkedIn Publishing
LINKEDIN_ORG_ID=                            # LinkedIn company page org ID
LINKEDIN_ACCESS_TOKEN=                      # OAuth token (w_organization_social)

# Forms
FORMSPREE_ENDPOINT=                         # Formspree form endpoint
WEB3FORMS_API_KEY=                          # Or Web3Forms API key

# Analytics
GA4_MEASUREMENT_ID=                         # Google Analytics 4 measurement ID
GOOGLE_SEARCH_CONSOLE_VERIFICATION=         # Search Console verification string

# Email
NOTIFICATION_EMAIL=info@afjltd.co.uk        # Where notifications are sent

# Content Calendar Dashboard
GITHUB_TOKEN=                               # GitHub PAT with repo scope
GITHUB_REPO=                                # Format: owner/repo-name
RESEND_API_KEY=                             # Resend.com API key (free tier: 100/day)
DASHBOARD_SECRET=                           # Secret key for API endpoint auth
```

---

## 7. File Counts Summary

| Category | Count |
|----------|-------|
| Public pages | 29 routes |
| Internal tools | 2 (/image-library, /content-calendar) |
| API endpoints | 2 (blog create, notify) |
| Components | 27 |
| Blog posts (published) | 16 |
| Blog posts (planned) | 24 |
| Social media templates | 10 (5 FB, 5 LI) |
| Local SEO area pages | 5 |
| Service pages | 8 |
