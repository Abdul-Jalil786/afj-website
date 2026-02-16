# SYSTEM-MAP.md — AFJ Limited Digital Platform

> Living document. Updated every time a feature is built, modified, or planned.
> Last updated: 2026-02-17

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
| **Node** | v20.x LTS (Railway) / v24 (local dev) |
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

### Phase 6 — Manager CMS with AI (COMPLETE)
- **LLM abstraction layer** (`src/lib/llm.ts`) — Anthropic/Groq switchable via env vars
- **System prompts library** (`src/lib/prompts.ts`) — brand voice baked in
- **Admin dashboard** at `/admin` protected by Cloudflare Zero Trust
- Department-based access control via `src/data/departments.json`
- **AI blog draft generator** at `/admin/content` — title + key points → Haiku draft → review → publish
- **NL page update system** at `/admin/pages` — describe change → AI diff → approve → deploy
- **Approval workflow** at `/admin/approvals` — pending items via GitHub API, email notifications via Resend

### Phase 7 — Customer-Facing Innovation (COMPLETE)
- **Intelligent quote wizard** at `/quote` — 4-step wizard with instant estimates for 5 services
- **Programmatic SEO** — 25 area pages generated from `src/data/area-data/` via `[slug].astro`
- **Public compliance dashboard** at `/compliance` — 8 compliance items, admin editor at `/admin/compliance`
- **Testimonial/case study engine** at `/admin/testimonials` — AI-powered via TESTIMONIAL_SYSTEM_PROMPT

### Phase 8 — SEO & Automation (COMPLETE)
- **JSON-LD schema markup** — global LocalBusiness on all pages via SEOHead, Service on 8 service pages, FAQPage on FAQ, BreadcrumbList via Breadcrumbs component
- Homepage schema enhanced with both offices, geo, opening hours, hasOfferCatalog
- `seo/schema-markup/*.json` — reference templates (local-business, services, faq, breadcrumb)
- **Social media publishing** — `social-media/scripts/facebook-publish.py` and `linkedin-publish.py`
  - Standalone Python scripts, read blog .md, generate social copy via Anthropic API, publish via platform APIs
  - `--dry-run` mode, fallback templates, no external dependencies
- **Email auto-responses** — `POST /api/contact/submit` handles Web3Forms + Resend notification + customer auto-response
- ContactForm.astro updated to use new endpoint

### Phase 9 — CI/CD & Quality (COMPLETE)
- `.github/workflows/lighthouse.yml` — Lighthouse CI on PR (4 pages, score thresholds, PR comment)
- `.github/workflows/broken-links.yml` — Weekly broken link checker (linkinator, GitHub issue)
- `.github/workflows/deploy-validate.yml` — Post-deploy validation (8 pages, sitemap, Resend alerts)
- `scripts/image-audit.mjs` — Image optimization audit (scan >500KB, WebP conversion via sharp)
- Accessibility fixes: skip-to-content link, ServiceCard alt text, Footer ARIA, CookieBanner focus management

### Phase 9.6 — Accessibility Hardening (2026-02-16) ← LATEST
- **Desktop dropdown keyboard support** — Header.astro Services dropdown now opens with Enter/Space/ArrowDown, navigates with ArrowUp/ArrowDown, closes with Escape; `aria-haspopup` and `aria-expanded` attributes added to trigger link; focus traps within dropdown, focusout closes it
- **Mobile menu Escape handler** — pressing Escape closes mobile menu and restores focus to hamburger button
- **Color contrast fix** — Footer bottom bar changed from `text-gray-400` to `text-gray-300` for WCAG AA compliance on dark background
- **Form validation aria-live** — field-level error messages in ContactForm.astro and quote wizard now have `aria-live="polite"` for screen reader announcements
- **FleetGallery lightbox ARIA** — lightbox overlay now has `role="dialog"`, `aria-modal="true"`, `aria-label="Image lightbox"`
- **FAQ focus-visible styles** — toggle buttons now show `focus-visible:outline-2 focus-visible:outline-afj-accent` for keyboard users
- **Hero decorative SVG** — arrow icon in "Read More" link marked `aria-hidden="true"`; chevron in desktop nav dropdown also marked `aria-hidden="true"`
- **Admin navigation ARIA** — desktop nav gets `aria-label="Admin navigation"`, mobile nav changed from `<div>` to `<nav>` with `aria-label="Admin navigation mobile"`

### Phase 9.5 — Admin Fixes (2026-02-16)
- **Apply Change button functional** — `/admin/pages` Apply Change now commits to GitHub via new `POST /api/admin/page-apply` endpoint (was showing fake success message)
- **Department config hardened** — `getDepartment()` fallback returns `unknown` role with no privileges (was incorrectly granting management access to unrecognised emails); `_comment` added to `departments.json` explaining empty email arrays need populating on staff onboarding
- **Audit logging** — new `src/lib/audit-log.ts` utility, append-only JSON log at `data/audit-log.json` (gitignored); hooked into `blog/create`, `page-edit` (preview), `page-apply`, and `approval` (submit/approve/reject)

### Phase 9.4 — Security Hardening (2026-02-16)
- **Auth bypass fixes** — `/api/ai/test` and `/api/blog/create` now accept Cloudflare Access JWT (`Cf-Access-Jwt-Assertion`) alongside `x-dashboard-secret`, matching the dual-auth pattern used by other protected endpoints
- **XSS escaping in email templates** — `escapeHtml()` applied to all user-provided values (title, reason, name, email, phone, message) before embedding in HTML email bodies in `/api/admin/approval` and `/api/contact/submit`
- **Role-based permission on page-edit** — `/api/ai/page-edit` now checks department from CF JWT; only `management` and `marketing` roles can use the endpoint (returns 403 for others)
- **File path exposure removed** — `/api/ai/page-edit` error responses use generic message instead of exposing server file paths

### Phase 9.3 — Pricing Bug Fixes (2026-02-16)
- **WAIT return deadhead fix** — return leg now uses base→destination distance (`destDeadhead`) instead of base→pickup; total WAIT miles use `deadhead + destDeadhead` instead of `deadhead × 2`
- **Airport arrival waiting rate fix** — uses charge-out rate (£17/hr) instead of driver wage (£13/hr), consistent with all other waiting time calculations
- **Per-leg minimum floor for different-day returns** — minimum fare (£35 private hire / £45 airport) now applies independently to each leg of a `separate` return, not to the combined total
- **DVSA passenger range parsing fix** — `parseInt("9-16")` was returning 9; now extracts maximum value from hyphenated ranges (e.g. "9-16" → 16)
- **DVSA break on one-way trips** — 45-minute break surcharge for 9+ passengers now applies to one-way trips too, not just WAIT returns

### Phase 9.2 — Pricing Refactor + Admin Cost Portal (2026-02-16)
- **Cost-based pricing model** for private hire — replaces baseFare + perMileRate with two admin-configurable inputs:
  - `costPerMile` (£0.45) — combined fuel + wear + insurance + depreciation + compliance
  - `chargeOutRatePerHour` (£17) — what we charge clients per driver hour (vs £13 driver wage)
- **Three-tier return pricing** for private hire:
  - **Split**: pickup near base + gap ≥ minGapForSplitReturnHours → driver returns to base between legs, zero waiting charge
  - **Wait**: pickup far from base OR short gap → driver stays at destination, waiting time charged at charge-out rate
  - **Separate**: different-day return → two independent bookings, surcharges applied per-leg based on each leg's date/time
- **Deadhead rolled into journey miles** — no separate "Driver travel from base" line; deadhead miles/hours included in Journey line
- **Admin pricing portal** at `/admin/pricing` — management-only, 7 sections:
  1. Core Pricing (costPerMile, chargeOutRate, driverWage + margin display)
  2. Operational Thresholds (deadhead threshold, min gap for split return)
  3. Minimum Booking Floors (private hire, airport)
  4. Passenger Multipliers (editable per band)
  5. Surcharges (editable percentages)
  6. Bank Holiday Dates (add/remove)
  7. DVSA Compliance (break threshold, duration, min passengers)
  8. Quote Preview panel (test quotes with current saved values)
- **API endpoints**: `GET /api/admin/pricing` (read config), `POST /api/admin/pricing` (write via GitHub API)
- **Airport transfers unchanged** — keeps fixed-rate model with airport rates table
- Updated passenger multipliers: 17-24 → 1.6 (was 1.7), 25-33 → 2.0 (was 2.1)
- DVSA config moved to top-level `dvsa` object (breakThresholdHours, breakDurationMinutes, minimumPassengers)

### Phase 9.1 — Quote Wizard Overhaul (2026-02-15/16)
- **Postcode/city autocomplete** on quote form text inputs via Postcodes.io API
  - Routing heuristic: `/^[A-Z]{1,2}\d/i` → postcode autocomplete endpoint; else → places search endpoint
  - Debounced 300ms, keyboard navigation (arrows, Enter, Escape), up to 8 suggestions
- **Real driving mileage** via Postcodes.io (lat/lng) + OSRM (road routing)
  - Replaces hardcoded 12-area distance matrix as primary distance source
  - Matrix retained as fallback when APIs fail
- **Driver hours pricing model** replacing flat 1.75x return multiplier for private hire:
  - **Same-day return**: outbound + return mileage + waiting time at £13/hr + deadhead + DVSA break
  - **Different-day return**: two one-way trips + double deadhead, return date + pickup time
  - **One-way**: unchanged core formula + deadhead if applicable
- **Driver deadhead from base**: nearest base (Birmingham B7 4JD / Manchester M35 0BR) → pickup; £13/hr x round trip if >30 miles
- **DVSA compliance**: 45-min break surcharge for 9+ passengers when total driving >4.5 hours
- **Conditional form fields** (`showWhen` system) — questions appear/hide based on other field values
  - Pickup time as actual time input, return journey reveals: same-day toggle, return pickup time, return date
- **Enterprise portal** — "Enterprise / Contract" badge, e-portal CTA, dynamic per-service descriptions
- **Luggage & accessibility**: luggage dropdown (none/light/heavy), wheelchair toggle for both services
- **Peak surcharges**: early morning (<07:00, +15%), late night (>22:00, +15%), Saturday (+10%), Sunday (+20%), bank holiday (+50%) — time + day/holiday stack additively
- **Multi-stop support**: up to 2 stops with postcode autocomplete, distance chained via OSRM, 10-min waiting per stop
- **Regular booking discount**: 10% off for recurring bookings (private-hire only)
- **Airport enhancements**: arrival/departure toggle (45-min waiting cost), executive vehicle class (+30% base), custom toggle labels
- **Minimum booking floors**: private-hire £35, airport £45
- **Itemised quote breakdown**: full cost breakdown table in Step 3
  - Line items: base journey, return, deadhead, waiting, DVSA break, stops, meet & greet, arrival waiting
  - Subtotal, surcharges (amber), regular discount (green), estimated total, price range
  - Flags: heavy luggage, wheelchair accessible, executive vehicle badges
- **Custom toggle labels** (`toggleLabels`) for "One-off"/"Regular", "Departure"/"Arrival" etc.
- **Competitive protection** — school names removed from area pages; replaced with regional SEND capability statements (e.g. "specialist SEND transport across the West Midlands"). Company-wide stats only (700+ students, 18+ years). Hospital names kept (public knowledge).
- **Contact form service pre-fill** — enterprise portal CTA links to `/contact?service=Service+Name`; ContactForm.astro reads the `service` URL parameter and pre-fills the message textarea with "I would like to request a consultation for [Service Name]."

### Phase 10 — Full Codebase Audit & Cleanup (2026-02-16) ← LATEST
Systematic audit of the entire codebase covering pricing, security, admin, accessibility, SEO, and project structure.

**Pricing fixes (12 issues):**
- Different-day return surcharge double-counting fixed
- Empty multi-stop locations filtered
- Negative quote protection (clamp to 0)
- Return date validation (must be after outbound)
- Airport rates verified proportional to distance
- Zero passenger edge case validation
- Return time validation (30-min minimum gap for same-day)
- 2027 bank holidays added
- Distance matrix fallback logging
- Airport direction toggle label clarified
- Rounding consistency: `round2()` helper on all cost components
- Regular discount label clarified for SEPARATE returns

**Security fixes (4 issues):**
- Auth bypass: `/api/ai/test` and `/api/blog/create` accept CF JWT
- XSS: `escapeHtml()` on all user values in email templates
- Permission: `/api/ai/page-edit` restricted to management + marketing
- Path exposure: error responses no longer leak server file paths

**Admin fixes (3 issues):**
- Apply Change button functional via new `/api/admin/page-apply` endpoint
- Department config hardened (unknown email → no privileges)
- Audit logging via `src/lib/audit-log.ts`

**Accessibility fixes (8 issues):**
- Desktop dropdown keyboard navigation (Enter/Space/Arrow/Escape)
- Mobile menu Escape handler
- Footer contrast (WCAG AA)
- Form aria-live on validation errors
- FleetGallery lightbox ARIA (dialog, modal)
- FAQ focus-visible styles
- Decorative SVGs marked aria-hidden
- AdminLayout nav ARIA labels

**SEO & structure fixes (9 issues):**
- BlogLayout SEOHead: now renders OG/Twitter meta tags on all blog posts
- Manchester postcode (M35 0BR) added to LocalBusiness schema
- `src/lib/github.ts`: shared GitHub API utility, 6 API files refactored
- `src/pages/api/ai/seo-generate.ts`: new SEO meta generation endpoint
- Component subdirectories: 20 components → `layout/`, `ui/`, `sections/`, `admin/`
- Blog index schema: `Blog` → `CollectionPage` with `ItemList`
- Social sidebar: removed 3 placeholder links
- Content collections migrated to Astro v5 API (`src/content.config.ts`)
- Testimonials collection added

**Dependency audit:**
- 5 moderate lodash vulnerabilities (dev-only, @astrojs/check chain) — accepted risk

### Phase 11 — Future Integration (PLANNED, pending Telemex)
- Council self-service portal with route and student data
- Parent notification system (real-time transport updates)
- Fleet performance dashboard with live data

---

## 3. Architecture Map

### Public Pages (55+ live routes)

```
LIVE ROUTES:
/                               Homepage (hero slider, core values, services, stats)
/about                          About Us
/contact                        Contact form → /api/contact/submit → Web3Forms + Resend auto-response
/careers                        Careers page
/faq                            FAQ with accordion + FAQPage JSON-LD
/vehicles-for-sale              Vehicle sales listing
/privacy-policy                 Privacy policy
/carbon-reduction-plan          Carbon reduction plan
/social-impact                  Social Impact Report (interactive)
/compliance                     Public compliance dashboard (8 items, grouped by category)
/blog                           Blog/News listing (16 published posts)
/blog/[slug]                    Dynamic blog post pages
/quote                          Intelligent quote wizard (4-step, 5 services)
/services                       Services overview (ItemList JSON-LD)
/services/send-transport        Home to School Transport (SEND) + Service JSON-LD
/services/patient-transport     Non-Emergency Patient Transport + Service JSON-LD
/services/fleet-maintenance     Fleet Maintenance + Service JSON-LD
/services/vehicle-conversions   Vehicle Conversions + Service JSON-LD
/services/driver-training       Driver, ACA & PA Training + Service JSON-LD
/services/private-hire          Private Minibus Hire + Service JSON-LD
/services/executive-minibus     Executive Minibus Hire + Service JSON-LD
/services/airport-transfers     Airport Transfers + Service JSON-LD
/areas                          Areas served overview (25 areas, 7 regions)
/areas/[slug]                   25 programmatic local SEO pages (dynamic template)
/404                            Custom 404 page
+ 50+ WordPress redirect pages (301 → new routes)
```

### Internal Tools & Admin (Cloudflare Zero Trust protected)

```
/image-library                  Image browser with bulk rename tool
/content-calendar               Content calendar dashboard
/admin                          Manager CMS dashboard home
/admin/content                  AI blog draft creator (generate, preview, edit, publish)
/admin/pages                    NL page update interface (describe change → AI diff → apply)
/admin/approvals                Pending content approval queue
/admin/pricing                  Pricing configuration portal (management only)
/admin/compliance               Compliance data editor (operations + management only)
/admin/testimonials             AI testimonial/case study creator
```

### API Endpoints

```
POST /api/blog/create           Creates blog .md file via GitHub API → auto-deploys
POST /api/notify                Sends email reminder via Resend API
POST /api/contact/submit        Contact form: Web3Forms + Resend notification + auto-response
POST /api/ai/draft              AI blog draft generation (Haiku/Groq)
POST /api/ai/page-edit          AI page content update (NL → diff)
POST /api/ai/testimonial        AI testimonial/case study from raw feedback
POST /api/ai/seo-generate       AI SEO meta title, description, keywords generation
POST /api/quote/estimate        Intelligent quote estimation (rule-based, public)
GET  /api/compliance/status     Compliance dashboard data (public, cached)
POST /api/admin/approval        Approval workflow (GET list, POST submit, PUT approve/reject)
GET  /api/admin/pricing         Read current pricing config from quote-rules.json
POST /api/admin/pricing         Update pricing config via GitHub API
POST /api/admin/compliance      Update compliance data via GitHub API
```

### Components (27)

```
src/components/layout/ (4):
  Header.astro                  Navigation bar (dark navy)
  Footer.astro                  Footer with offices, services, social links
  SEOHead.astro                 Meta tags, Open Graph, JSON-LD schema
  Breadcrumbs.astro             SEO breadcrumb navigation

src/components/ui/ (4):
  CookieBanner.astro            GDPR cookie consent
  BookingButton.astro           "Book Now!" red CTA
  SocialSidebar.astro           Floating social media icons (Facebook, LinkedIn)
  CTABanner.astro               Call-to-action sections

src/components/sections/ (12):
  Hero.astro                    Hero banner with image slider
  ServiceCard.astro             Service overview card
  BlogCard.astro                Blog post preview card
  TestimonialSlider.astro       Testimonials carousel
  FAQ.astro                     Accordion FAQ
  StatsCounter.astro            Key stats (700+ students, 18+ years)
  CoreValues.astro              Vision / Mission / Values cards
  TeamSection.astro             Team/about section
  FleetGallery.astro            Vehicle photo gallery
  AccreditationBadges.astro     CQC, council logos
  BookingForm.astro             Booking form
  ContactForm.astro             Contact form → /api/contact/submit

src/components/social-impact/ (7):
  SocialImpactHero.astro
  ImpactDashboard.astro
  LeadershipMessages.astro
  CSRFramework.astro
  UKHealthMap.astro
  PartnerCharities.astro
  SDGAlignment.astro

src/components/admin/ (empty — reserved for future admin components)

Layouts (src/layouts/):
  BaseLayout.astro              HTML shell, fonts, meta, GA4
  PageLayout.astro              Standard page wrapper (SEOHead, Breadcrumbs)
  BlogLayout.astro              Blog post wrapper (SEOHead, sidebar)
  AdminLayout.astro             Admin dashboard wrapper
```

> **Note:** Admin and quote wizard functionality is built inline in page files
> (`/admin/content.astro`, `/admin/pages.astro`, `/quote/index.astro`, etc.)
> rather than as separate reusable components.

### Library Modules

```
src/lib/
  llm.ts                        LLM provider abstraction (Anthropic ↔ Groq swappable)
  prompts.ts                    System prompts with brand voice (BLOG_DRAFT, PAGE_EDIT, TESTIMONIAL, SEO_PAGE)
  github.ts                     Shared GitHub API utility (getFileContent, createOrUpdateFile, deleteFile,
                                  listDirectory, updateFileContent, encodeBase64, decodeBase64)
  audit-log.ts                  Append-only audit log for admin actions (data/audit-log.json)
  quote-engine.ts               Quote estimation engine — cost-per-mile + charge-out-rate model,
                                  three-tier return pricing (split/wait/separate), OSRM + Postcodes.io,
                                  deadhead rolled into journey, DVSA breaks, multi-stop chaining,
                                  per-leg surcharges for different-day, regular discount, minimum floors,
                                  airport fixed-rate unchanged, full itemised breakdown
```

### Data Files

```
src/content/blog/*.md           16 published blog posts (Astro content collection)
src/content/testimonials/       Testimonials JSON
src/data/compliance.json        8 compliance items (CQC, DBS, MOT, insurance, certs, accessibility, safeguarding, carbon)
src/data/departments.json       Department → page mapping for admin access control
src/data/quote-rules.json       Quote rules: cost-per-mile (£0.45), charge-out rate (£17/hr),
                                  driver wage (£13/hr), deadhead threshold (30mi), split return gap (5hr),
                                  DVSA config, passenger multipliers, surcharges (time/day/bank holiday),
                                  minimum booking, distance matrix, airport rates, city lookup,
                                  base postcodes with lat/lng, bank holidays 2026,
                                  service questions with showWhen, toggleLabels, luggage, wheelchair
src/data/area-data/areas.json   25 areas with metadata (slug, council, population, distance, region, services)
src/data/area-data/schools.json 3-5 SEND schools per area with postcodes (not imported by area pages — competitive protection)
src/data/area-data/hospitals.json 2-3 hospitals/clinics per area with NHS trust names
seo/content-calendar.csv        24 planned blog posts (W1–W12, Feb–May 2026)
seo/redirects.json              50+ WordPress old URL → new URL 301 redirects
seo/schema-markup/*.json        JSON-LD structured data templates (local-business, services, faq, breadcrumb)
social-media/content/           10 social media templates (5 Facebook, 5 LinkedIn)
social-media/scripts/           Facebook and LinkedIn publishing scripts (Python)
public/images/                  All site images (optimised, descriptive filenames)
public/documents/               PDFs (brochure, carbon reduction plan)
public/social-impact-report/    Social Impact Report assets
```

### External Integrations

```
BUILT (needs env vars on Railway to activate):
GitHub API          → Blog post creation, approval workflow, compliance updates
Resend API          → Email notifications, auto-responses, approval emails
Anthropic API       → Haiku 4.5 for AI content features (blog drafts, page edits, testimonials)
Groq API            → Alternative LLM provider (Llama 3.3 70B) — swap-ready
Web3Forms           → Contact form submission handling
Google Analytics    → GA4 tracking
Google Search Console → SEO verification and monitoring
Cloudflare Zero Trust → Authentication for /admin/* routes
Facebook Graph API  → Social media auto-publishing (Python script)
LinkedIn API        → Social media auto-publishing (Python script)

ALWAYS ACTIVE (no keys needed):
Railway             → Auto-deploy on push to main
Cloudflare          → DNS, SSL, domain management
Google Fonts        → Inter font family
Postcodes.io        → Postcode autocomplete, places search, lat/lng lookup (free, no key)
OSRM                → Real driving distance and duration via router.project-osrm.org (free, no key)
```

---

## 4. Current System Status

### Live & Working ✅
- 55+ public routes render and build successfully
- 25 programmatic area pages with hospital data and regional SEND capability statements (school names removed for competitive protection)
- Blog with 16 published posts
- Hero slider with 6 service slides
- Contact form → `/api/contact/submit` → Web3Forms + Resend auto-response
- Google Analytics 4 integrated
- Google Search Console verification
- 50+ WordPress 301 redirects active in build
- Cookie consent banner and social sidebar
- Full JSON-LD schema markup (LocalBusiness on all pages, Service, FAQPage, BreadcrumbList)
- Sitemap generation (excludes internal/admin pages)
- Image library and content calendar internal tools
- Admin dashboard with AI blog drafting, NL page editing, approval workflow
- Intelligent quote wizard with cost-based pricing, three-tier returns, postcode autocomplete
- Admin pricing configuration portal at /admin/pricing
- Public compliance dashboard
- AI testimonial/case study generator
- Social media publishing scripts (Facebook, LinkedIn)

### Needs Environment Variables to Activate ⚙️
| Feature | Env Vars Required | Status |
|---------|-------------------|--------|
| Contact form + auto-response | `WEB3FORMS_API_KEY`, `RESEND_API_KEY` | Code complete, needs tokens |
| Google Analytics | `GA4_MEASUREMENT_ID` | Code complete, needs ID |
| Search Console | `GOOGLE_SEARCH_CONSOLE_VERIFICATION` | Code complete, needs string |
| Blog creation + admin | `GITHUB_TOKEN`, `GITHUB_REPO`, `DASHBOARD_SECRET` | Code complete, needs tokens |
| Email notifications | `RESEND_API_KEY`, `DASHBOARD_SECRET` | Code complete, needs tokens |
| AI content features | `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY` | Code complete, needs API key |
| Admin auth | Cloudflare Zero Trust config | Code complete, needs CF config |
| Facebook publishing | `FACEBOOK_PAGE_ID`, `FACEBOOK_ACCESS_TOKEN` | Script built, needs tokens |
| LinkedIn publishing | `LINKEDIN_ORG_ID`, `LINKEDIN_ACCESS_TOKEN` | Script built, needs tokens |

### Not Yet Built 🔨
| Feature | Priority | Phase | Dependencies |
|---------|----------|-------|-------------|
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

### Blog Post Creation (Current — with AI)
```
Manager → /admin/content → enters title + key points
  → POST /api/ai/draft → LLM (Haiku) generates markdown draft
  → Manager reviews/edits in preview
  → Manager clicks "Publish" (or "Submit for Approval")
  → If approval required: email to Jay → Jay approves in /admin/approvals
  → POST /api/blog/create → GitHub API → Railway auto-deploy → live
```

### Page Content Update (Current)
```
Manager → /admin/pages → types "Add electric vehicle servicing to fleet maintenance page"
  → POST /api/ai/page-edit → LLM reads current page content + instruction
  → Returns diff showing proposed changes
  → Manager reviews diff → approves
  → GitHub API commits change → Railway auto-deploy → live
```

### Quote Request (Current)
```
Customer → /quote → selects service type (instant or enterprise)
  → Enterprise services → e-portal CTA (no instant quote)
  → Instant services → answers questions (postcode autocomplete, toggles, multi-stop)
  → POST /api/quote/estimate
    → Postcodes.io (lat/lng) + OSRM (driving distance/duration) [fallback: hardcoded matrix]
    → Multi-stop: chains distance through up to 2 intermediate stops
    → Private hire: cost-per-mile + charge-out-rate model
      → One-way: journey miles × £/mi + driving hours × £/hr (deadhead rolled in if >30mi from base)
      → Same-day return: SPLIT (driver returns to base, no waiting) or WAIT (driver stays, waiting charged)
        → Split conditions: pickup within deadhead threshold + gap ≥ 5 hours
      → Different-day return: two separate bookings, surcharges per-leg
    → Airport: fixed-rate model from airportRates table (unchanged)
    → Applies: passenger multiplier → surcharges (time/day/bank holiday) → regular discount → minimum floor → range spread
    → Returns: full itemised breakdown + price range + return type indicator
  → Estimate screen: journey/return/waiting/DVSA line items + flags + split return message
  → Customer can submit full quote request → Web3Forms → info@afjltd.co.uk
```

### Admin Pricing Config (Current)
```
Admin → /admin/pricing (Cloudflare Zero Trust) → edits cost/rate/thresholds/surcharges
  → Save Changes → POST /api/admin/pricing
    → Merges into quote-rules.json → GitHub API commit → Railway auto-deploy
  → Test Quote Preview → POST /api/quote/estimate with current saved values
```

### Contact Form (Current)
```
Customer → /contact → fills form (name, email, phone, message)
  → POST /api/contact/submit → Web3Forms + Resend notification
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
| Public pages | 55+ routes | — |
| Internal tools | 2 + admin dashboard (6 routes) | — |
| API endpoints | 11 | — |
| Components | 27 | — |
| Library modules | 5 | — |
| Data files | 12 | — |
| Blog posts (published) | 16 | 40+ |
| Blog posts (planned) | 24 | 24 (in content calendar) |
| Social media templates | 10 | — |
| Social media scripts | 2 (Facebook, LinkedIn) | — |
| Local SEO area pages | 25 | — |
| Service pages | 8 | — |
| JSON-LD schemas | 4 types (LocalBusiness, Service, FAQPage, BreadcrumbList) | — |
| CI/CD workflows | 3 (Lighthouse, broken links, deploy validation) | — |
| Scripts | 3 (image-audit, download-media, migrate-wordpress) | — |

---

## 9. Competitive Advantages When Complete

| Feature | AFJ | Typical Competitor |
|---------|-----|--------------------|
| Quote response time | Itemised breakdown with real mileage, driver hours, DVSA, surcharges, multi-stop | "Call us" or generic form |
| Content freshness | AI-assisted weekly blog posts | Rarely updated |
| Local SEO coverage | 25-30 area-specific pages | 1 generic "areas" page |
| Compliance transparency | Public real-time dashboard | PDF on request |
| Manager self-service | AI-powered content updates | Developer/agency dependency |
| Schema markup | Full JSON-LD structured data | Basic or none |
| Social media | Automated publishing pipeline | Manual posting |
| Trust signals | Live accreditation display | Static logos |
