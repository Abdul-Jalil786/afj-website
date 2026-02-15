# SYSTEM-MAP.md — AFJ Limited Digital Platform

> Living document. Updated every time a feature is built, modified, or planned.
> Last updated: 2026-02-15

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
| **Domain/DNS** | Cloudflare (DNS, SSL, Zero Trust auth) |
| **AI Provider** | Anthropic Haiku 4.5 (swappable to Groq + Llama) |
| **Repo** | `afj-website` on `main` branch |
| **Node** | v20.x LTS |
| **Package Manager** | npm |

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

### Phase 4 — Content Calendar Dashboard (`32f9044`)
- **Content Calendar** internal dashboard at `/content-calendar`
- Interactive month calendar with colour-coded content dots
- Blog post table parsed from `seo/content-calendar.csv` with status toggles
- Blog creation form that pushes `.md` files to GitHub via API (auto-deploys via Railway)
- Social media weekly schedule with email reminder buttons
- Template reference cards for all 10 social media templates
- **API endpoint** `POST /api/blog/create` — creates blog posts via GitHub API
- **API endpoint** `POST /api/notify` — sends email reminders via Resend API
- Both endpoints secured with `DASHBOARD_SECRET` header auth

### Phase 5 — Foundation Activation (2026-02-15) ← LATEST
- **Contact form** wired to Web3Forms API via `fetch()` with success/error UI states, honeypot bot protection
- **Google Analytics 4** added to BaseLayout.astro — production-only, loads via `GA4_MEASUREMENT_ID` env var
- **Google Search Console** verification meta tag in SEOHead.astro via `GOOGLE_SEARCH_CONSOLE_VERIFICATION` env var
- **WordPress redirect map** — 50+ 301 redirects from old WordPress URLs to new Astro routes
  - All 16 blog posts mapped from `/yyyy/mm/dd/slug` → `/blog/slug`
  - All service pages mapped (e.g. `/home-to-school-transport` → `/services/send-transport`)
  - Misc WordPress artifacts, Elementor pages, and legacy paths mapped
  - Dynamic wildcard patterns (wp-content/*, category/*, etc.) documented for Cloudflare rules
- **astro.config.mjs** loads redirects from `seo/redirects.json` at build time

### Phase 6 — Manager CMS with AI (PLANNED)
- **Admin dashboard** at `/admin` protected by Cloudflare Zero Trust
- Department-based access control (Operations, Training, Fleet, Marketing, Management)
- **AI blog draft generator** — managers enter title + key points, Haiku generates draft in brand voice
- **NL page update system** — managers describe changes in plain English, AI generates diff for approval
- **Approval workflow** — optional review step before content goes live
- **LLM abstraction layer** — swappable between Anthropic Haiku and Groq/Llama

### Phase 7 — Customer-Facing Innovation (PLANNED)
- **Intelligent quote wizard** at `/quote` with service-specific guided flows
- **Programmatic SEO** — 20-25 additional area pages with real local school/hospital data
- **Public compliance dashboard** at `/compliance` with live trust signals
- **Testimonial/case study engine** — one input creates testimonial card + full case study

### Phase 8 — SEO & Automation (PLANNED)
- JSON-LD schema markup (LocalBusiness, services, FAQ, breadcrumbs)
- Social media publishing automation (Facebook, LinkedIn APIs)
- Email auto-responses for form submissions
- WordPress redirect map deployment

### Phase 9 — CI/CD & Quality (PLANNED)
- GitHub Actions: Lighthouse audits, broken link checks, deploy validation
- WebP image conversion audit
- WCAG 2.1 AA accessibility audit
- Core Web Vitals monitoring

### Phase 10 — Future Integration (PLANNED, pending Telemex)
- Council self-service portal with route and student data
- Parent notification system (real-time transport updates)
- Fleet performance dashboard with live data

---

## 3. Architecture Map

### Public Pages (29 current + planned expansions)

```
CURRENT LIVE ROUTES (29):
/                               Homepage (hero slider, core values, services, stats)
/about                          About Us
/contact                        Contact form → Web3Forms → info@afjltd.co.uk
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

PLANNED PUBLIC ROUTES:
/quote                          Intelligent quote wizard (multi-step, service-specific)
/compliance                     Public compliance dashboard (CQC, DBS, MOT, insurance)
/areas/solihull                  Programmatic SEO (example — 20-25 new area pages)
/areas/walsall                  
/areas/wolverhampton            
/areas/dudley                   
/areas/stoke-on-trent           
/areas/derby                    
... (additional areas based on service coverage data)
```

### Internal Tools & Admin (Cloudflare Zero Trust protected)

```
CURRENT:
/image-library                  Image browser with bulk rename tool
/content-calendar               Content calendar dashboard

PLANNED:
/admin                          Manager CMS dashboard home
/admin/content                  AI-assisted content editor (blog drafting)
/admin/pages                    NL page update requests (describe → diff → approve)
/admin/approvals                Pending content approval queue
/admin/compliance               Compliance data editor
/admin/testimonials             Testimonial/case study creator
```

### API Endpoints

```
CURRENT:
POST /api/blog/create           Creates blog .md file via GitHub API → auto-deploys
POST /api/notify                Sends email reminder via Resend API

PLANNED:
POST /api/ai/draft              AI blog draft generation (Haiku/Groq)
POST /api/ai/page-edit          AI page content update (NL → diff)
POST /api/ai/seo-generate       AI local SEO page generation
POST /api/quote/estimate        Intelligent quote estimation (rule-based)
GET  /api/compliance/status     Compliance dashboard data from JSON
POST /api/testimonial/create    Create testimonial + case study from raw feedback
```

### Components (27 current + planned)

```
Layouts:
  BaseLayout.astro              HTML shell, fonts, meta, GA4
  Header.astro                  Navigation bar (dark navy)
  Footer.astro                  Footer with offices, services, social links
  Breadcrumbs.astro             SEO breadcrumb navigation

Core:
  Hero.astro                    Hero banner with image slider
  SEOHead.astro                 Meta tags, Open Graph, JSON-LD schema
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
  ContactForm.astro             Contact form → Web3Forms

Social Impact (7):
  SocialImpactHero.astro
  ImpactDashboard.astro
  LeadershipMessages.astro
  CSRFramework.astro
  UKHealthMap.astro
  PartnerCharities.astro
  SDGAlignment.astro

Admin (PLANNED, 4):
  ContentEditor.astro           Rich text editor with AI draft button
  AIPreview.astro               Shows AI-generated content diff for approval
  ApprovalCard.astro            Pending approval item display
  DepartmentNav.astro           Department-filtered navigation

Quote Wizard (PLANNED, 3):
  QuoteWizard.astro             Multi-step form container
  ServiceSelector.astro         Service type picker with icons
  EstimateDisplay.astro         Price range display with CTA
```

### Library Modules (PLANNED)

```
src/lib/
  llm.ts                        LLM provider abstraction (Anthropic ↔ Groq swappable)
  prompts.ts                    System prompts with brand voice guidelines
  quote-engine.ts               Rule-based quote estimation
  github.ts                     GitHub API helper (create files, PRs)
```

### Data Files

```
CURRENT:
src/content/blog/*.md           16 published blog posts (Astro content collection)
src/content/testimonials/       Testimonials JSON
seo/content-calendar.csv        24 planned blog posts (W1–W12, Feb–May 2026)
social-media/content/           10 social media templates (5 Facebook, 5 LinkedIn)
public/images/                  All site images (optimised, descriptive filenames)
public/documents/               PDFs (brochure, carbon reduction plan)
public/social-impact-report/    Social Impact Report assets

PLANNED:
src/data/compliance.json        Compliance status (CQC, DBS, MOT, insurance)
src/data/departments.json       Department → page mapping for admin access control
src/data/quote-rules.json       Quote estimation rules and price ranges per service
src/data/area-data/schools.json Local school data for programmatic SEO
src/data/area-data/hospitals.json Local hospital data for NEPTS SEO pages
src/data/area-data/areas.json   Area metadata (councils, distances, populations)
seo/redirects.json              WordPress old URL → new URL mapping
seo/schema-markup/*.json        JSON-LD structured data templates
```

### External Integrations

```
CURRENT:
GitHub API          → Blog post creation from dashboard (needs GITHUB_TOKEN)
Resend API          → Email notifications (needs RESEND_API_KEY)
Railway             → Auto-deploy on push to main
Cloudflare          → DNS, SSL, domain management
Google Fonts        → Inter font family

PLANNED:
Cloudflare Zero Trust → Authentication for /admin/* routes
Anthropic API       → Haiku 4.5 for AI content features
Groq API            → Alternative LLM provider (Llama 3.3 70B)
Web3Forms           → Contact form submission handling
Google Analytics    → GA4 tracking
Google Search Console → SEO verification and monitoring
Facebook Graph API  → Social media auto-publishing
LinkedIn API        → Social media auto-publishing
```

---

## 4. Current System Status

### Live & Working ✅
- All 29 public pages render and build successfully
- Blog with 16 published posts
- Hero slider with 6 service slides
- Contact form wired to Web3Forms (needs `WEB3FORMS_API_KEY` on Railway)
- Google Analytics 4 integrated (needs `GA4_MEASUREMENT_ID` on Railway)
- Google Search Console verification (needs `GOOGLE_SEARCH_CONSOLE_VERIFICATION` on Railway)
- 50+ WordPress 301 redirects active in build
- Cookie consent banner
- Social sidebar
- SEO meta tags and Open Graph
- Sitemap generation (excludes internal pages)
- Image library internal tool
- Content calendar dashboard UI

### Needs Environment Variables to Activate ⚙️
| Feature | Env Vars Required | Status |
|---------|-------------------|--------|
| Contact form submission | `WEB3FORMS_API_KEY` | Code integrated, needs token on Railway |
| Google Analytics | `GA4_MEASUREMENT_ID` | Code integrated, needs ID on Railway |
| Search Console | `GOOGLE_SEARCH_CONSOLE_VERIFICATION` | Code integrated, needs verification string |
| Blog creation via dashboard | `GITHUB_TOKEN`, `GITHUB_REPO`, `DASHBOARD_SECRET` | UI built, needs tokens |
| Email notifications | `RESEND_API_KEY`, `DASHBOARD_SECRET` | UI built, needs tokens |
| AI content features | `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY` | Not built yet |
| Facebook publishing | `FACEBOOK_PAGE_ID`, `FACEBOOK_ACCESS_TOKEN` | Scripts not built |
| LinkedIn publishing | `LINKEDIN_ORG_ID`, `LINKEDIN_ACCESS_TOKEN` | Scripts not built |

### Not Yet Built 🔨
| Feature | Priority | Phase | Dependencies |
|---------|----------|-------|-------------|
| ~~Contact form backend (Web3Forms)~~ | ~~HIGH~~ | ~~5~~ | ~~DONE — code integrated, needs token~~ |
| ~~WordPress redirect map~~ | ~~HIGH~~ | ~~5~~ | ~~DONE — 50+ redirects in seo/redirects.json~~ |
| LLM abstraction layer | HIGH | 6 | LLM_API_KEY |
| Admin dashboard with Cloudflare Zero Trust | HIGH | 6 | Cloudflare Access config |
| AI blog draft generator | HIGH | 6 | LLM layer |
| NL page update system | HIGH | 6 | LLM layer, GitHub API |
| Approval workflow | MEDIUM | 6 | Admin dashboard |
| Intelligent quote wizard | HIGH | 7 | Quote rules data |
| Programmatic SEO pages (20-25 areas) | HIGH | 7 | Area data (schools, hospitals) |
| Public compliance dashboard | MEDIUM | 7 | compliance.json |
| Testimonial/case study engine | MEDIUM | 7 | Admin dashboard, LLM |
| JSON-LD schema markup | MEDIUM | 8 | None |
| Social media publishing scripts | MEDIUM | 8 | Facebook/LinkedIn API tokens |
| Email auto-responses | LOW | 8 | Resend API |
| CI/CD workflows (Lighthouse, link checks) | LOW | 9 | GitHub Actions config |
| WebP image conversion | LOW | 9 | Build script |
| WCAG 2.1 AA audit | LOW | 9 | Manual review |
| Council self-service portal | FUTURE | 10 | Telemex fleet system |
| Parent notification system | FUTURE | 10 | Telemex fleet system |
| Fleet performance dashboard | FUTURE | 10 | Telemex fleet system |

---

## 5. Data Flow Diagrams

### Blog Post Creation (Current)
```
Manager → Content Calendar UI → POST /api/blog/create
  → GitHub API (create .md file in src/content/blog/)
  → Railway detects push to main
  → Railway rebuilds Astro site
  → New blog post live on /blog/[slug]
```

### Blog Post Creation (Planned — with AI)
```
Manager → /admin/content → enters title + key points
  → POST /api/ai/draft → LLM (Haiku) generates markdown draft
  → Manager reviews/edits in preview
  → Manager clicks "Publish" (or "Submit for Approval")
  → If approval required: email to Jay → Jay approves in /admin/approvals
  → POST /api/blog/create → GitHub API → Railway auto-deploy → live
```

### Page Content Update (Planned)
```
Manager → /admin/pages → types "Add electric vehicle servicing to fleet maintenance page"
  → POST /api/ai/page-edit → LLM reads current page content + instruction
  → Returns diff showing proposed changes
  → Manager reviews diff → approves
  → GitHub API commits change → Railway auto-deploy → live
```

### Quote Request (Planned)
```
Customer → /quote → selects service type
  → Answers 3-5 service-specific questions
  → POST /api/quote/estimate → rule-based calculation from quote-rules.json
  → Returns estimated price range
  → Customer can submit full quote request → Web3Forms → info@afjltd.co.uk
```

### Contact Form (Planned)
```
Customer → /contact → fills form (name, email, phone, message)
  → Web3Forms API → info@afjltd.co.uk
  → Auto-response email to customer via Resend
```

---

## 6. Security Model

### Authentication
| Route Pattern | Auth Method | Who |
|---------------|------------|-----|
| `/admin/*` | Cloudflare Zero Trust (email-based) | AFJ managers by department |
| `/api/*` (from admin) | Cloudflare Access JWT header | Authenticated managers |
| `/api/*` (programmatic) | `DASHBOARD_SECRET` header | Automated scripts, Claude Code |
| `/image-library` | Cloudflare Zero Trust | Jay only |
| `/content-calendar` | Cloudflare Zero Trust | Jay only |
| All other routes | Public | Everyone |

### Secret Management
- All secrets stored as Railway environment variables (never committed to repo)
- `DASHBOARD_SECRET` rotated quarterly
- GitHub PAT scoped to repo-only access
- LLM API keys have usage limits set at provider level

### Data Protection
- No user data stored in the repository
- Contact form submissions go directly to Web3Forms (GDPR compliant)
- Cloudflare handles SSL termination
- No cookies beyond essential GDPR consent cookie and Cloudflare access cookie

---

## 7. Environment Variables Reference

```env
# === REQUIRED ===
SITE_URL=https://www.afjltd.co.uk
DASHBOARD_SECRET=                           # API endpoint authentication

# === CONTENT MANAGEMENT ===
GITHUB_TOKEN=                               # GitHub PAT with repo scope
GITHUB_REPO=                                # Format: owner/afj-website

# === AI FEATURES ===
LLM_PROVIDER=anthropic                      # 'anthropic' or 'groq'
LLM_MODEL=claude-haiku-4-5-20251001         # Model identifier
LLM_API_KEY=                                # API key for chosen provider
LLM_MAX_TOKENS=2048                         # Default max tokens

# === EMAIL ===
RESEND_API_KEY=                             # Resend.com API key
NOTIFICATION_EMAIL=info@afjltd.co.uk

# === FORMS ===
WEB3FORMS_API_KEY=                          # Contact form submissions

# === ANALYTICS ===
GA4_MEASUREMENT_ID=                         # Google Analytics 4
GOOGLE_SEARCH_CONSOLE_VERIFICATION=         # Search Console

# === SOCIAL MEDIA (future) ===
FACEBOOK_PAGE_ID=
FACEBOOK_ACCESS_TOKEN=
LINKEDIN_ORG_ID=
LINKEDIN_ACCESS_TOKEN=

# === RAILWAY ===
RAILWAY_TOKEN=
```

---

## 8. File Counts Summary

| Category | Current | Planned |
|----------|---------|---------|
| Public pages | 29 routes | ~55 routes (with area expansion) |
| Internal tools | 2 | 2 + admin dashboard (6 routes) |
| API endpoints | 2 | 8 |
| Components | 27 | 34 |
| Library modules | 0 | 4 |
| Data files | 3 | 10 |
| Blog posts (published) | 16 | 40+ |
| Blog posts (planned) | 24 | 24 (in content calendar) |
| Social media templates | 10 | 10 |
| Local SEO area pages | 5 | 25-30 |
| Service pages | 8 | 8 |
| CI/CD workflows | 0 | 3 |

---

## 9. Competitive Advantages When Complete

| Feature | AFJ | Typical Competitor |
|---------|-----|--------------------|
| Quote response time | Instant estimate on website | "Call us" or generic form |
| Content freshness | AI-assisted weekly blog posts | Rarely updated |
| Local SEO coverage | 25-30 area-specific pages | 1 generic "areas" page |
| Compliance transparency | Public real-time dashboard | PDF on request |
| Manager self-service | AI-powered content updates | Developer/agency dependency |
| Schema markup | Full JSON-LD structured data | Basic or none |
| Social media | Automated publishing pipeline | Manual posting |
| Trust signals | Live accreditation display | Static logos |
