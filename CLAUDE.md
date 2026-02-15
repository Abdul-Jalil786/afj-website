# CLAUDE.md — AFJ Limited Digital Platform

> This is the primary instruction file for Claude Code working on the AFJ website.
> Read this ENTIRE file before making any changes. Follow all rules strictly.
> Last updated: 2026-02-15

---

## CURRENT SPRINT

> **Update this section before every coding session.**

**Tier 1 — COMPLETE (2026-02-15)**
All code committed and pushed. Environment variables need setting on Railway before features activate:
- WEB3FORMS_API_KEY (contact form)
- GA4_MEASUREMENT_ID (analytics)
- GOOGLE_SEARCH_CONSOLE_VERIFICATION (search console)
- GITHUB_TOKEN, GITHUB_REPO, DASHBOARD_SECRET, RESEND_API_KEY (content calendar)

**Tier 2 Part 1 — COMPLETE (2026-02-15): LLM Layer & Prompts**
- `src/lib/llm.ts` — LLM provider abstraction (Anthropic/Groq switchable)
- `src/lib/prompts.ts` — System prompts with brand voice (BLOG_DRAFT, PAGE_EDIT, TESTIMONIAL, SEO_PAGE)
- `src/pages/api/ai/test.ts` — Test endpoint for LLM layer verification
- `.env.example` updated with LLM_PROVIDER, LLM_MODEL, LLM_API_KEY, LLM_MAX_TOKENS

**Tier 2 Part 2 — COMPLETE (2026-02-15): Admin Dashboard**
- `src/data/departments.json` — Department config (Management, Operations, Training, Fleet, Marketing)
- `src/layouts/AdminLayout.astro` — Admin-specific layout with simplified nav
- `src/pages/admin/index.astro` — Dashboard home with quick action cards
- `src/pages/admin/content.astro` — AI blog draft creator (generate, preview, edit, publish)
- `src/pages/admin/pages.astro` — NL page update interface (describe change, preview diff, apply)
- `src/pages/admin/approvals.astro` — Approval queue for pending content
- `src/pages/api/ai/draft.ts` — AI blog draft generation endpoint
- `src/pages/api/ai/page-edit.ts` — AI page edit endpoint (reads file from GitHub, generates diff)
- `/admin/*` excluded from sitemap
- All admin pages server-rendered (prerender = false)

**Tier 2 Part 3 — COMPLETE (2026-02-15): Approval Workflow & Email Notifications**
- `src/pages/api/admin/approval.ts` — Full approval API (GET list, POST submit, PUT approve/reject)
- Pending items stored as JSON files in `pending/` directory via GitHub API
- Email notifications on submit (to NOTIFICATION_EMAIL), approve, and reject (to author) via Resend
- Non-management users: Submit for Approval button on content.astro and pages.astro
- Management users: Direct Publish/Apply buttons (bypass approval queue)
- `src/pages/admin/approvals.astro` — Dynamic loading of pending items with Approve/Reject/Preview
- Rejection modal with optional feedback reason
- Content preview modal

**Tier 3 Part 1 — COMPLETE (2026-02-15): Intelligent Quote Wizard**
- `src/data/quote-rules.json` — Estimation rules for 5 services (SEND, NEPTS, Private Hire, Airport, Executive)
- `src/lib/quote-engine.ts` — `estimateQuote(service, answers)` returning `{ low, high, currency, perUnit }`
- `src/pages/quote/index.astro` — 4-step public wizard (service → questions → estimate → Web3Forms contact)
- `src/pages/api/quote/estimate.ts` — Public endpoint (no auth) for price estimation
- "Get a Quote" button added to Header.astro (desktop + mobile)
- Progress indicator, back navigation, mobile-responsive

**Tier 3 Part 2 — COMPLETE (2026-02-15): Programmatic SEO — 25 Local Area Pages**
- `src/data/area-data/areas.json` — 25 areas with metadata (slug, council, population, distance, region, services)
- `src/data/area-data/schools.json` — 3-5 real SEND schools per area with postcodes
- `src/data/area-data/hospitals.json` — 2-3 real hospitals/clinics per area with NHS trust names
- `src/pages/areas/[slug].astro` — Dynamic template with getStaticPaths generating all 25 pages
- Each page: hero, intro, SEND schools section, NEPTS hospitals section, services grid, "Why Choose AFJ", fleet gallery, accreditations, FAQ (5 unique questions), quote CTA, adjacent area links, JSON-LD
- Removed 5 static area pages (birmingham/manchester/sandwell/coventry/west-midlands) — all handled by dynamic template
- `src/pages/areas/index.astro` — Updated to show all 25 areas grouped by 7 regions
- Sitemap auto-includes all 25 area pages
- Existing area URLs preserved with identical structure

**Tier 3 Part 3 — COMPLETE (2026-02-15): Compliance Dashboard & Testimonial Engine**
- `src/data/compliance.json` — 8 compliance items (CQC, DBS, MOT, Insurance, Certs, Accessibility, Safeguarding, Carbon)
- `src/pages/compliance.astro` — Public compliance dashboard grouped by category with status indicators
- `src/pages/api/compliance/status.ts` — Public GET endpoint returning compliance JSON (for future council portal)
- `src/pages/admin/compliance.astro` — Admin compliance editor (operations + management only)
- `src/pages/api/admin/compliance.ts` — Admin POST endpoint saving compliance via GitHub API
- `src/pages/api/ai/testimonial.ts` — AI testimonial/case study generation endpoint using TESTIMONIAL_SYSTEM_PROMPT
- `src/pages/admin/testimonials.astro` — Admin testimonial creator (paste feedback → AI generates → publish/blog)
- AdminLayout nav updated with Compliance and Testimonials links
- Admin dashboard index updated with Compliance Editor and Testimonials quick action cards

**Tier 4 — COMPLETE (2026-02-15): SEO & Automation**
- SEOHead.astro now injects global `LocalBusiness` JSON-LD schema on every page (both offices, geo, opening hours, sameAs)
- Homepage schema enhanced with `hasOfferCatalog` listing all 8 services, Manchester office, geo coordinates
- All 8 service pages already had `Service` schema — confirmed in place
- FAQ page already had `FAQPage` schema — confirmed in place
- Breadcrumbs component already emits `BreadcrumbList` schema — confirmed in place
- `seo/schema-markup/local-business.json` updated with both offices, correct social links
- `social-media/scripts/facebook-publish.py` — standalone script: reads blog .md, generates FB post via Anthropic API, publishes via Graph API
- `social-media/scripts/linkedin-publish.py` — standalone script: same pattern for LinkedIn organisation page via UGC Post API
- Both scripts: `--dry-run` mode, fallback templates, structured logging, no external Python dependencies
- `src/pages/api/contact/submit.ts` — POST endpoint handling full contact flow: Web3Forms + Resend notification + auto-response email to customer
- ContactForm.astro updated to POST JSON to `/api/contact/submit` instead of direct Web3Forms submission
- Auto-response includes 24h response promise, link to quote wizard, contact details

**Tier 5 — COMPLETE (2026-02-15): CI/CD & Quality**
- `.github/workflows/lighthouse.yml` — Lighthouse CI on PR: audits 4 pages (homepage, SEND transport, blog post, quote), posts results table as PR comment, fails if below thresholds (perf 85, a11y 90, bp 85, seo 90)
- `.github/workflows/broken-links.yml` — Weekly broken link checker using linkinator, creates/updates GitHub issue with `broken-links` label
- `.github/workflows/deploy-validate.yml` — Post-deploy validation: checks 8 key pages return HTTP 200, validates sitemap-index.xml, sends Resend email alert on failure
- `scripts/image-audit.mjs` — Image optimization audit: scans `public/images/` for files > 500 KB, reports critical/large/moderate, optional `--convert` flag creates WebP versions via sharp
- Accessibility fixes: skip-to-content link in BaseLayout, alt text on ServiceCard images, aria-hidden on Footer decorative SVGs, focus management on CookieBanner, main-content id on AdminLayout

**All Tiers 1-5 complete. Monitoring and content production phase. Tier 6 pending Telemex readiness.**

**Quote Wizard Overhaul — COMPLETE (2026-02-16)**
- Enterprise portal badge "Enterprise / Contract" with e-portal CTA and per-service descriptions
- Real driving distance via Postcodes.io + OSRM with hardcoded matrix fallback
- Driver hours pricing model replacing flat 1.75x return multiplier
- Same-day return: waiting time at £13/hr, DVSA break (9+ pax, 4.5h+ driving)
- Different-day return: two one-way trips, double deadhead, return date + pickup time
- Deadhead from nearest base (Birmingham B7 4JD / Manchester M35 0BR) at £13/hr when >30mi
- Luggage dropdown, wheelchair toggle, peak surcharges (time/day/bank holiday stacking)
- Multi-stop support (up to 2 stops with autocomplete), regular booking 10% discount
- Airport: arrival/departure toggle with 45-min arrival waiting, executive tier (+30%), vehicle class
- Minimum booking floors (private-hire £35, airport £45)
- Itemised quote breakdown: base journey, return, deadhead, waiting, DVSA break, stops, meet & greet, arrival, subtotal, surcharges, discounts, total — all displayed as individual line items
- Custom toggle labels (toggleLabels), conditional field visibility (showWhen)
- Flags: heavy luggage, wheelchair accessible, executive vehicle badges on estimate

**Do NOT touch:** ContactForm (stable), BaseLayout GA4 (stable), SEOHead (stable), redirects (stable), Content calendar dashboard (stable), Social Impact Report components (stable), LLM layer (stable), prompts library (stable), Admin dashboard pages (stable), approval API (stable), Quote wizard (stable), Area data files (stable), Compliance data (stable), Testimonial engine (stable), Schema markup (stable), Social media scripts (stable), GitHub Actions workflows (stable)

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Company** | AFJ Limited |
| **Website** | https://www.afjltd.co.uk |
| **Industry** | Transport — SEND school transport, non-emergency patient transport (NEPTS), private hire, fleet services |
| **Clients** | Birmingham City Council, Manchester City Council, Sandwell Council, Coventry Council, NHS trusts, schools, private customers |
| **Scale** | 700+ students transported daily, 47+ drivers, fleet of minibuses and accessible vehicles |

---

## 2. Tech Stack & Architecture

| Layer | Technology | Notes |
|-------|------------|-------|
| **Framework** | Astro (v4.x) | Static pages + server-rendered API endpoints |
| **Styling** | Tailwind CSS | Utility-first, no custom CSS files unless absolutely necessary |
| **Hosting** | Railway | Auto-deploys on push to `main` branch |
| **Adapter** | `@astrojs/node` | Standalone mode for Railway |
| **DNS/CDN** | Cloudflare | DNS, SSL, domain management, Zero Trust for auth |
| **Auth** | Cloudflare Zero Trust | Used for internal tools and admin access |
| **LLM API** | Anthropic (Haiku 4.5) | Content generation, NL commands — swap-ready for Groq/Llama |
| **Email** | Resend API | Notifications, reminders |
| **Forms** | Web3Forms | Contact form submissions |
| **Repo** | `afj-website` on `main` branch | Feature branches for development |
| **Node** | v20.x LTS | Pin this version |
| **Package Manager** | npm | Use `package-lock.json`, no yarn/pnpm |

---

## 3. Architectural Decisions (DO NOT OVERRIDE)

These decisions are final. Do not suggest alternatives unless Jay explicitly asks.

1. **Astro over Next.js** — We need static pages with minimal JS. The site is content-heavy, not interactive. Astro's island architecture gives us server endpoints where needed without shipping a React runtime to users.

2. **Railway over Vercel** — Railway supports the Node adapter for server-rendered API endpoints. Vercel's free tier has limitations with server functions. Railway auto-deploys on push to `main`.

3. **No traditional CMS** — We are NOT using Keystatic, Decap, Strapi, or any headless CMS. The repository IS the CMS. Content is managed through markdown files, JSON data, and the admin dashboard. AI handles the translation from human intent to code changes.

4. **Cloudflare Zero Trust for auth** — No custom auth system, no password databases, no JWT tokens for user login. Cloudflare Access handles all authentication for internal tools. Managers authenticate via their email through Cloudflare's identity provider.

5. **Haiku-first for AI features** — Use Anthropic Haiku 4.5 (`claude-haiku-4-5-20251001`) for all AI-powered features (content generation, NL commands, SEO content). Abstract the LLM provider behind a config so we can swap to Groq + Llama 3.3 70B if costs become a concern. Never hardcode the model or provider.

6. **All images in `public/images/`** — Do NOT use Astro's built-in image optimization. Railway has memory constraints during build. All images are pre-optimized and served from `public/images/` with descriptive filenames.

7. **Server endpoints for API routes only** — Pages are static (pre-rendered at build time). Only `/api/*` routes use server-side rendering. Do not add `export const prerender = false` to pages unless there's a specific server-side requirement.

---

## 4. Brand Voice & Terminology

### Always Use
- "SEND transport" (not "SEN transport" or "special needs transport")
- "Non-emergency patient transport" or "NEPTS" (not "ambulance service" or "medical transport")
- "AFJ Limited" or "AFJ" (not "AFJ Ltd" in body copy, though "AFJ Ltd" is acceptable in legal/footer contexts)
- "Students" (not "children" or "pupils" when referring to SEND transport users)
- "Fleet maintenance" (not "vehicle repair" or "garage services")
- "Professional driver training" (not just "driver training")

### Tone
- Professional but approachable
- Confident without being boastful
- Community-focused — emphasise social impact, local employment, care for vulnerable people
- Data-driven where possible — use specific numbers ("700+ students daily", "18+ years of service")

### Never Say
- "We're the best" or "leading provider" without qualification
- "Cheap" or "budget" — use "cost-effective" or "value for money"
- "Disabled" as a noun — always "people with disabilities" or "students with additional needs"
- Generic AI filler phrases: "In today's fast-paced world", "It goes without saying", "At the end of the day"

---

## 5. File Structure

```
afj-website/
├── CLAUDE.md                       # THIS FILE — read first
├── SYSTEM-MAP.md                   # Architecture map and project status
├── src/
│   ├── pages/
│   │   ├── index.astro             # Homepage
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── careers.astro
│   │   ├── faq.astro
│   │   ├── vehicles-for-sale.astro
│   │   ├── privacy-policy.astro
│   │   ├── carbon-reduction-plan.astro
│   │   ├── social-impact.astro
│   │   ├── blog/
│   │   │   ├── index.astro         # Blog listing
│   │   │   └── [slug].astro        # Dynamic blog posts
│   │   ├── services/
│   │   │   ├── index.astro         # Services overview
│   │   │   ├── send-transport.astro
│   │   │   ├── patient-transport.astro
│   │   │   ├── fleet-maintenance.astro
│   │   │   ├── vehicle-conversions.astro
│   │   │   ├── driver-training.astro
│   │   │   ├── private-hire.astro
│   │   │   ├── executive-minibus.astro
│   │   │   └── airport-transfers.astro
│   │   ├── areas/
│   │   │   ├── index.astro
│   │   │   ├── birmingham.astro
│   │   │   ├── manchester.astro
│   │   │   ├── sandwell.astro
│   │   │   ├── coventry.astro
│   │   │   └── west-midlands.astro
│   │   ├── admin/                  # 🆕 Manager CMS (Cloudflare Zero Trust protected)
│   │   │   ├── index.astro         # Dashboard home
│   │   │   ├── content.astro       # Content editor with AI drafting
│   │   │   ├── pages.astro         # Page update requests (NL → code)
│   │   │   └── approvals.astro     # Pending content approval queue
│   │   ├── api/
│   │   │   ├── blog/
│   │   │   │   └── create.ts       # POST — create blog via GitHub API
│   │   │   ├── notify.ts           # POST — email via Resend
│   │   │   ├── ai/
│   │   │   │   ├── draft.ts        # 🆕 POST — AI blog draft generation
│   │   │   │   ├── page-edit.ts    # 🆕 POST — AI page content update
│   │   │   │   └── seo-generate.ts # 🆕 POST — AI local SEO page generation
│   │   │   ├── quote/
│   │   │   │   └── estimate.ts     # 🆕 POST — intelligent quote estimation
│   │   │   └── compliance/
│   │   │       └── status.ts       # 🆕 GET — compliance dashboard data
│   │   ├── quote/
│   │   │   └── index.astro         # 🆕 Intelligent quote wizard
│   │   ├── compliance.astro        # 🆕 Public compliance dashboard
│   │   ├── image-library.astro     # Internal tool
│   │   └── content-calendar.astro  # Internal tool
│   ├── components/
│   │   ├── layout/
│   │   │   ├── BaseLayout.astro
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   └── Breadcrumbs.astro
│   │   ├── core/
│   │   │   ├── Hero.astro
│   │   │   ├── SEOHead.astro
│   │   │   ├── CookieBanner.astro
│   │   │   └── SocialSidebar.astro
│   │   ├── content/
│   │   │   ├── ServiceCard.astro
│   │   │   ├── BlogCard.astro
│   │   │   ├── TestimonialSlider.astro
│   │   │   ├── FAQ.astro
│   │   │   ├── StatsCounter.astro
│   │   │   ├── CoreValues.astro
│   │   │   ├── TeamSection.astro
│   │   │   ├── FleetGallery.astro
│   │   │   ├── AccreditationBadges.astro
│   │   │   ├── CTABanner.astro
│   │   │   ├── BookingButton.astro
│   │   │   ├── BookingForm.astro
│   │   │   └── ContactForm.astro
│   │   ├── social-impact/
│   │   │   ├── SocialImpactHero.astro
│   │   │   ├── ImpactDashboard.astro
│   │   │   ├── LeadershipMessages.astro
│   │   │   ├── CSRFramework.astro
│   │   │   ├── UKHealthMap.astro
│   │   │   ├── PartnerCharities.astro
│   │   │   └── SDGAlignment.astro
│   │   ├── admin/                  # 🆕 Manager CMS components
│   │   │   ├── ContentEditor.astro
│   │   │   ├── AIPreview.astro
│   │   │   ├── ApprovalCard.astro
│   │   │   └── DepartmentNav.astro
│   │   └── quote/                  # 🆕 Quote wizard components
│   │       ├── QuoteWizard.astro
│   │       ├── ServiceSelector.astro
│   │       └── EstimateDisplay.astro
│   ├── content/
│   │   ├── blog/*.md               # Blog posts (Astro content collection)
│   │   └── testimonials/           # Testimonials JSON
│   ├── lib/
│   │   ├── llm.ts                  # 🆕 LLM provider abstraction (Haiku / Groq switchable)
│   │   ├── prompts.ts              # 🆕 System prompts for AI features (brand voice baked in)
│   │   ├── quote-engine.ts         # 🆕 Quote estimation logic
│   │   └── github.ts               # GitHub API helper for content creation
│   └── data/
│       ├── compliance.json         # 🆕 Compliance status data
│       ├── departments.json        # 🆕 Department → page mapping for admin
│       ├── area-data/              # 🆕 Local data for programmatic SEO pages
│       │   ├── schools.json
│       │   ├── hospitals.json
│       │   └── areas.json
│       └── quote-rules.json        # 🆕 Quote estimation rules and ranges
├── seo/
│   ├── content-calendar.csv        # 24 planned blog posts
│   ├── redirects.json              # 🆕 WordPress → new URL mapping
│   └── schema-markup/              # 🆕 JSON-LD structured data templates
│       ├── local-business.json
│       ├── services.json
│       ├── faq.json
│       └── breadcrumbs.json
├── social-media/
│   ├── content/                    # 10 social media templates
│   └── scripts/                    # 🆕 Publishing automation
│       ├── facebook-publish.py
│       └── linkedin-publish.py
├── public/
│   ├── images/                     # All site images (pre-optimized)
│   ├── documents/                  # PDFs
│   └── social-impact-report/       # Social Impact Report assets
└── .github/
    └── workflows/                  # 🆕 CI/CD
        ├── lighthouse.yml
        ├── broken-links.yml
        └── deploy-validate.yml
```

---

## 6. Component → Page Matrix

> Which components are used where. Check this before editing ANY component.

| Component | Used On |
|-----------|---------|
| BaseLayout | ALL pages |
| Header | ALL pages (via BaseLayout) |
| Footer | ALL pages (via BaseLayout) |
| SEOHead | ALL pages (via BaseLayout) |
| CookieBanner | ALL pages (via BaseLayout) |
| SocialSidebar | ALL pages (via BaseLayout) |
| Hero | Homepage, About, Services overview |
| Breadcrumbs | All subpages (not homepage) |
| ServiceCard | Homepage, Services overview |
| BlogCard | Homepage, Blog listing |
| TestimonialSlider | Homepage, About |
| FAQ | FAQ page, individual service pages |
| StatsCounter | Homepage |
| CoreValues | Homepage, About |
| TeamSection | About |
| FleetGallery | Fleet Maintenance, Vehicle Conversions |
| AccreditationBadges | Homepage, About, SEND Transport, Patient Transport |
| CTABanner | All service pages, area pages |
| BookingButton | Header, service pages |
| BookingForm | Private Hire, Executive Minibus, Airport Transfers |
| ContactForm | Contact page |
| SocialImpact* (7) | Social Impact page only |

**Rule:** If you change a component used on 3+ pages, test ALL affected pages before committing.

---

## 7. DO NOT TOUCH List

These files are stable, recently fixed, or intentionally structured. Do not modify without explicit instruction from Jay.

| File/Pattern | Reason |
|-------------|--------|
| `src/pages/social-impact.astro` | Complex interactive page, thoroughly tested |
| `src/components/social-impact/*` | 7 interconnected components, fragile |
| `src/pages/content-calendar.astro` | Working dashboard, do not refactor |
| `src/pages/image-library.astro` | Working tool, do not refactor |
| `public/images/*` | Images are manually curated with descriptive names |
| `Hero.astro` slider logic | Slider timing and transitions are intentionally set |
| `Header.astro` navigation structure | Mobile menu behaviour is carefully tuned |

---

## 8. LLM Provider Abstraction

All AI features MUST use the abstraction layer in `src/lib/llm.ts`. Never call an LLM API directly from an endpoint.

```typescript
// src/lib/llm.ts — PATTERN TO FOLLOW
// This file abstracts the LLM provider so we can swap between:
// - Anthropic Haiku 4.5 (default, reliable, low cost)
// - Groq + Llama 3.3 70B (alternative, very fast, even cheaper)
// - Any future provider

interface LLMConfig {
  provider: 'anthropic' | 'groq';
  model: string;
  apiKey: string;
  maxTokens?: number;
}

interface LLMRequest {
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens?: number;
}

// Environment variable determines provider:
// LLM_PROVIDER=anthropic (default)
// LLM_PROVIDER=groq

// All prompts live in src/lib/prompts.ts with brand voice baked in
// All API calls go through this single abstraction
// All error handling and retries are centralised here
```

**Config via environment variables:**
```env
LLM_PROVIDER=anthropic                    # or 'groq'
LLM_MODEL=claude-haiku-4-5-20251001       # or 'llama-3.3-70b-versatile'
LLM_API_KEY=                              # Anthropic or Groq API key
LLM_MAX_TOKENS=2048                       # Default max tokens
```

---

## 9. Admin Dashboard Architecture

The admin system at `/admin/*` is protected by Cloudflare Zero Trust.

### Access Groups (configured in Cloudflare dashboard)
| Group | Email Pattern | Access |
|-------|---------------|--------|
| Management | jay@afjltd.co.uk | Full access — all departments, approvals |
| Operations | ops-*@afjltd.co.uk | SEND Transport, NEPTS, Areas pages |
| Training | training-*@afjltd.co.uk | Driver Training page, training blog posts |
| Fleet | fleet-*@afjltd.co.uk | Fleet Maintenance, Vehicle Conversions, Vehicles for Sale |
| Marketing | marketing-*@afjltd.co.uk | All blog posts, social media, SEO pages |

### Department → Page Mapping
Stored in `src/data/departments.json`. Each department can only edit pages assigned to them. Management group can edit everything.

### Content Workflow
1. Manager logs in via Cloudflare Zero Trust
2. Sees dashboard filtered to their department
3. **Create blog post:** Fill in title + key points → AI generates draft → manager reviews/edits → submit
4. **Update page content:** Type what they want changed in plain English → AI generates a diff → manager approves → pushes to GitHub → auto-deploys
5. **Approval queue** (optional): If enabled, content goes to "pending" state → Jay gets email notification → approves/rejects → then deploys

### API Security
All `/api/*` endpoints check:
1. `DASHBOARD_SECRET` header for programmatic access
2. Cloudflare Access JWT (`Cf-Access-Jwt-Assertion` header) for admin dashboard requests
3. Department permissions from `departments.json`

---

## 10. Quote Wizard Architecture

The quote wizard at `/quote` is a public-facing multi-step form.

### User Flow
1. Select service type (SEND, NEPTS, Private Hire, Airport Transfer, Executive Minibus)
2. Answer service-specific questions (3-5 questions per service)
3. Receive instant estimated range ("£X – £Y per journey")
4. Option to submit full quote request (goes to info@afjltd.co.uk)

### Service-Specific Questions
| Service | Questions |
|---------|-----------|
| SEND Transport | Number of students, pickup area/postcode, school name, accessibility needs, contract duration |
| NEPTS | Pickup postcode, hospital/clinic, wheelchair accessible?, regular or one-off, time of day |
| Private Hire | Date, pickup/dropoff, passenger count, luggage, return journey? |
| Airport Transfer | Airport, terminal, flight number, date/time, passengers, meet & greet? |
| Executive Minibus | Event type, date, pickup/dropoff, passengers, hours needed |

### Estimation Logic
Stored in `src/data/quote-rules.json`. Rule-based, not AI-powered (no need for LLM here — simple distance × rate × factors). The quote is an estimate range to set expectations, not a binding price.

---

## 11. Programmatic SEO Strategy

### Current: 5 area pages
Birmingham, Manchester, Sandwell, Coventry, West Midlands

### Target: 25-30 area pages
Expand to cover every borough and district served. Each page is unique because it contains:
- Actual school names in the area (from `src/data/area-data/schools.json`)
- Hospital/clinic names for NEPTS (from `src/data/area-data/hospitals.json`)
- Local council information
- Distance/travel times from AFJ's Birmingham base
- Service-specific content generated by AI but reviewed before publish

### Generation Process
1. Populate `area-data/*.json` with real local data (schools, hospitals, councils)
2. Run AI generation script to create draft area pages
3. Review and approve each page
4. Pages follow identical template structure to existing area pages
5. All pages interlink and reference the parent `/areas` page

---

## 12. Compliance Dashboard

Public page at `/compliance` showing real-time trust signals.

### Data Source
`src/data/compliance.json` — updated manually by operations team (future: automated from fleet management system when Telemex is ready).

### Display Items
| Item | Example Display |
|------|----------------|
| CQC Rating | Good (inspected March 2025) |
| DBS Checks | All 47 drivers checked ✓ |
| Fleet MOT Pass Rate | 98% first-time pass |
| Insurance Status | Fully insured — policy renewed Jan 2026 |
| Driver Certifications | All drivers MiDAS and PATS certified |
| Vehicle Accessibility | 85% of fleet wheelchair accessible |
| Safeguarding | Level 3 safeguarding trained staff |

### Update Process
Operations manager logs into admin dashboard → updates compliance figures → JSON file updates via GitHub API → auto-deploys.

---

## 13. Error Handling & Logging

### API Endpoints
- All `/api/*` endpoints return consistent JSON: `{ success: boolean, data?: any, error?: string }`
- HTTP status codes: 200 (success), 400 (bad request), 401 (unauthorized), 500 (server error)
- Log errors to Railway's built-in logging (console.error with structured data)
- Never expose internal error messages to the client

### AI Features
- If LLM API fails, show user-friendly fallback: "AI drafting is temporarily unavailable. You can still write your content manually."
- Retry once on timeout (5 second delay)
- Log all LLM API calls with: timestamp, endpoint, token count, latency, success/failure

### GitHub API
- If blog creation fails, save draft locally and notify user: "Your draft has been saved. We'll retry publishing shortly."
- Never leave the user with a blank screen or unexplained error

---

## 14. Testing & Validation

### Before Every Commit
1. `npm run build` must complete without errors
2. Check all affected pages render correctly (refer to Component → Page Matrix)
3. API endpoints return expected responses
4. No console errors in browser

### Before Deploying New Features
1. Test on mobile viewport (375px width)
2. Test with Cloudflare Zero Trust access (admin pages)
3. Verify Railway build completes successfully
4. Check that sitemap excludes internal pages (`/admin/*`, `/image-library`, `/content-calendar`)

### Lighthouse Targets
| Metric | Target |
|--------|--------|
| Performance | > 90 |
| Accessibility | > 95 |
| Best Practices | > 90 |
| SEO | > 95 |

---

## 15. Environment Variables (Complete Reference)

```env
# === REQUIRED (site won't function fully without these) ===
SITE_URL=https://www.afjltd.co.uk
DASHBOARD_SECRET=                           # Secret key for API endpoint auth

# === CONTENT MANAGEMENT ===
GITHUB_TOKEN=                               # GitHub PAT with repo scope
GITHUB_REPO=                                # Format: owner/afj-website

# === AI FEATURES ===
LLM_PROVIDER=anthropic                      # 'anthropic' or 'groq'
LLM_MODEL=claude-haiku-4-5-20251001         # Model identifier
LLM_API_KEY=                                # API key for chosen provider
LLM_MAX_TOKENS=2048                         # Default max tokens per request

# === EMAIL ===
RESEND_API_KEY=                             # Resend.com API key
NOTIFICATION_EMAIL=info@afjltd.co.uk        # Where notifications go

# === FORMS ===
WEB3FORMS_API_KEY=                          # Web3Forms API key for contact form

# === ANALYTICS ===
GA4_MEASUREMENT_ID=                         # Google Analytics 4
GOOGLE_SEARCH_CONSOLE_VERIFICATION=         # Search Console verification

# === SOCIAL MEDIA (future) ===
FACEBOOK_PAGE_ID=
FACEBOOK_ACCESS_TOKEN=
LINKEDIN_ORG_ID=
LINKEDIN_ACCESS_TOKEN=

# === RAILWAY ===
RAILWAY_TOKEN=                              # Railway deployment token
```

---

## 16. Common Troubleshooting

| Problem | Solution |
|---------|----------|
| Railway build fails with memory error | Check image sizes in `public/images/`. Remove any > 2MB. Do NOT enable Astro image optimization — it causes OOM. |
| Blog post not appearing after deploy | Clear Railway build cache. Check that the `.md` file has correct frontmatter (title, date, description, image required). |
| Cloudflare Zero Trust login loop | Check that the access policy matches the email domain exactly. Ensure the application URL includes the path prefix. |
| API endpoint returns 500 | Check Railway logs. Most common cause is missing environment variable. |
| Fonts not loading | Google Fonts are loaded via `<link>` in BaseLayout. Check for CSP headers blocking fonts.googleapis.com. |
| Hero slider not advancing | Check `setInterval` in Hero.astro — timing is set to 5000ms. Do not change without testing on mobile. |
| GitHub API rate limit | PAT has 5000 requests/hour. If hitting limits, check for loops in content creation code. |

---

## 17. Git Workflow

1. **Feature branches:** `feature/admin-dashboard`, `feature/quote-wizard`, etc.
2. **Commit messages:** Descriptive, present tense: "Add AI draft endpoint for blog posts"
3. **Pull to main:** Only merge when feature is tested and working
4. **Never force push to main** — Railway auto-deploys from main
5. **Tag releases:** `v1.0`, `v1.1`, etc. for major milestones

---

## 18. Implementation Priority Order

This is the build sequence. Complete each tier before starting the next.

### Tier 1 — Activate What's Built (Week 1)
- [ ] Set environment variables on Railway (GITHUB_TOKEN, GITHUB_REPO, RESEND_API_KEY, DASHBOARD_SECRET)
- [ ] Connect Web3Forms to contact form
- [ ] Add GA4 tracking code
- [ ] Verify Google Search Console
- [ ] Build WordPress redirect map (`seo/redirects.json`)

### Tier 2 — Manager CMS (Weeks 2-4)
- [ ] Build LLM abstraction layer (`src/lib/llm.ts`)
- [ ] Build prompts library with brand voice (`src/lib/prompts.ts`)
- [ ] Create `/admin` dashboard shell with Cloudflare Zero Trust
- [ ] Build department-based navigation and access control
- [ ] Build AI blog draft generator (form → AI draft → review → publish)
- [ ] Build NL page update system (describe change → AI diff → approve → deploy)
- [ ] Build approval workflow with email notifications
- [ ] Create `src/data/departments.json` mapping

### Tier 3 — Customer-Facing Innovation (Weeks 5-8)
- [ ] Build intelligent quote wizard at `/quote`
- [ ] Create `src/data/quote-rules.json` with estimation logic
- [ ] Build programmatic SEO page generator
- [ ] Populate `src/data/area-data/` with school and hospital data
- [ ] Generate 20-25 additional area pages
- [ ] Build public compliance dashboard at `/compliance`
- [ ] Create `src/data/compliance.json`
- [ ] Build testimonial/case study engine in admin

### Tier 4 — SEO & Schema (Weeks 9-10)
- [ ] Build JSON-LD schema markup for LocalBusiness
- [ ] Add service schema to all service pages
- [ ] Add FAQ schema to FAQ page and service pages
- [ ] Add breadcrumb schema
- [ ] Implement social media publishing scripts (Facebook, LinkedIn)
- [ ] Build email auto-responses for form submissions

### Tier 5 — CI/CD & Monitoring (Weeks 11-12)
- [ ] GitHub Actions: Lighthouse audit on PR
- [ ] GitHub Actions: Broken link checker weekly
- [ ] GitHub Actions: Deploy validation
- [ ] Performance optimization: WebP conversion audit
- [ ] Accessibility audit: WCAG 2.1 AA compliance

### Tier 6 — Future (When Telemex Ready)
- [ ] Council self-service portal
- [ ] Parent notification system
- [ ] Fleet performance dashboard
- [ ] Live route status integration
