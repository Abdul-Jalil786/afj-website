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

### Phase 9.6 — Accessibility Hardening (2026-02-16)
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

### Phase 10 — Full Codebase Audit & Cleanup (2026-02-16/17)
Systematic audit of the entire codebase covering pricing, security, admin, accessibility, SEO, and project structure.

**Pricing fixes (12 issues):**
- Different-day return surcharge double-counting fixed
- Empty multi-stop locations filtered
- Negative quote protection (clamp to 0)
- Return date validation (must be after outbound)
- Airport rates verified proportional to distance
- Zero passenger edge case validation
- Return time validation (30-min minimum gap for same-day)
- 2027 bank holidays added and verified against gov.uk
- Distance matrix fallback logging
- Airport direction toggle label clarified
- Rounding consistency: `round2()` helper on all cost components
- Regular discount label clarified for SEPARATE returns

**Security fixes (6 issues):**
- Cloudflare JWT verification via jose library (`src/lib/cf-auth.ts`)
- `authenticateRequest()` replaces inline auth in all 13 API endpoints
- In-memory rate limiting (`src/lib/rate-limit.ts`) — contact: 5/15min, quote: 30/15min
- Request body size validation (`src/lib/validate-body.ts`) — 50KB default, 200KB for large content
- XSS: shared `escapeHtml()` from `src/lib/utils.ts` in all email templates
- GitHub error messages no longer leak to client in blog/create.ts

**Admin fixes (7 issues):**
- Management-only role check on POST /api/admin/pricing
- Management + operations role check on POST /api/admin/compliance
- `<script>` tag rejection in page-apply.ts content validation
- Audit log refactored to JSON lines (.jsonl) with 5MB rotation
- Hardcoded fallback email `admin@afjltd.co.uk` → `unknown` in 7 admin pages
- Pricing preview UX: changed fields highlighted in amber
- Apply Change button functional via `/api/admin/page-apply`

**Accessibility fixes (10 issues):**
- FleetGallery lightbox: full focus trap, prev/next nav, keyboard controls, focus restoration
- FAQ accordion: proper ARIA (aria-labelledby, aria-controls, aria-hidden on icons)
- CookieBanner: sr-only heading, focus-visible on all 4 buttons
- ContactForm: `aria-atomic="true"` on all aria-live regions
- Quote wizard: `aria-atomic="true"` on validation messages
- ServiceCard: `aria-hidden="true"` on decorative SVGs
- Hero: `aria-hidden="true"` on placeholder SVG and nav arrow SVGs
- Header desktop dropdown: focus-visible outlines on links
- AdminLayout: focus-visible outlines on all nav links (desktop + mobile)
- Desktop dropdown keyboard navigation (Enter/Space/Arrow/Escape)

**Quote engine fixes (4 issues):**
- Empty `destDeadhead` guard (skip API call when destinationPostcode is empty)
- Field validation on `/api/quote/estimate` (service key whitelist, string type, length limits)
- Distance matrix expanded: Sheffield (S), Leeds (LS), London (LDN) with full rows/columns
- London postcode areas (E, EC, N, NW, SE, SW, W, WC) mapped to LDN key
- Airport rates added for S, LS, LDN areas
- City lookup updated: sheffield→S, leeds→LS, london→LDN

**SEO fixes (4 issues):**
- Blog route: `[...slug].astro` → `[slug].astro` (prevents nested path matches)
- Blog post rendering: `post.render()` → `render(post)` (Astro v5 API)
- Blog slug resolution: `post.slug || post.id` (Astro v5 glob loader compat)
- Admin pages: `noindex, nofollow` meta tag via AdminLayout
- Blog index schema: `CollectionPage` with `ItemList` (done in prior session)
- Manchester postcode M35 0BR (done in prior session)

**Dependency audit:**
- 5 moderate lodash vulnerabilities (dev-only, @astrojs/check chain) — accepted risk

### Phase 11 — Pricing Intelligence System (2026-02-17)
Complete pipeline for quote tracking, conversion analytics, and AI-powered pricing recommendations.

**Quote Logging:**
- `src/lib/quote-log.ts` — append-only JSONL logger (mirrors audit-log.ts pattern, 5MB rotation)
- All website quotes (`/api/quote/estimate`) and James-chat quotes (`/api/chat`) logged automatically
- Log path: `data/quote-log.jsonl` (gitignored, persists on Railway)
- Privacy: first 4 chars of postcodes only, no IPs

**Conversion Tracking (`/admin/conversions`):**
- Dashboard metrics: weekly/monthly quotes, conversion rate, avg value, top routes, busiest days
- Filterable table: date range, service, source (website/james-chat/phone), status
- Slide-out panel: mark converted (booking value, customer name) or lost (reason)
- Manual phone booking entry form
- API: `GET /api/admin/conversions` (filtered log + metrics), `PUT` (convert/lose), `POST` (phone booking)

**Vehicle Tiers 1-48 Passengers:**
- New bands: "1-4" (Saloon car) and "34-48" (Full-size coach) for private-hire and airport
- Per-tier multipliers: { "1-4": 0.85, "5-8": 1.0, "9-16": 1.3, "17-24": 1.6, "25-33": 2.0, "34-48": 2.8 }
- Per-tier minimum booking floors (backward-compatible typeof check for number vs object)
- Admin pricing page updated: per-tier minimum inputs, expanded preview dropdown

**Weekly Market Research Agent:**
- `scripts/market-research-agent.mjs` — standalone Node.js script (no Astro runtime needed)
- Reads `quote-rules.json` + `data/quote-log.jsonl` (last 7 days)
- Calls Anthropic Haiku for structured analysis (recommendations, tier analysis, minimum floor analysis)
- Saves to `src/data/reports/pricing-report.json`
- Handles <5 quotes gracefully (baseline report without AI call)
- `.github/workflows/market-research.yml` — Sunday 22:00 UTC cron + manual trigger
- Requires `LLM_API_KEY` as GitHub repository secret

**Pricing Intelligence Admin (`/admin/pricing-intelligence`):**
- Latest report header with status badge (pending/reviewed)
- Key metrics: quotes, converted, conversion rate, average value
- AI market insights section
- Recommendations list with priority badges (high/medium/low) and type tags
- "Test This" panel: 5 standard test journeys, side-by-side current vs recommended pricing
- Approve/reject workflow per recommendation (persisted via GitHub API)
- Tier analysis and minimum floor analysis sections
- API: `GET /api/admin/pricing-report` (read), `PUT` (approve/reject)

### Phase 12 — Automated Monitoring Agents (2026-02-17) ← LATEST
5 automated monitoring agents with shared utilities, GitHub Actions workflows, email reports, and admin dashboard.

**Shared Infrastructure:**
- `scripts/agent-utils.mjs` — shared utility module: callHaiku, sendReportEmail (Resend), saveReport/loadReport, updateHistory (90-day cap), gradeFromIssues (A-F scale), fetchWithTimeout, createGitHubIssue, parseAIJSON, HTML email template helpers
- `scripts/run-all-agents.mjs` — convenience script to run all 5 agents in sequence (supports subset: `node scripts/run-all-agents.mjs security performance`)

**Security Agent (daily 3:00 UTC):**
- `scripts/security-agent.mjs` + `.github/workflows/security-agent.yml`
- Checks: auth enforcement on 5 admin endpoints (expects 401/403), security headers (6 headers across 4 pages), info leakage on 3 endpoints (server paths, stack traces, sensitive keywords), SSL/HTTPS status
- AI analysis via Haiku: summary, recommendations, risk level
- Creates GitHub issues on CRITICAL findings (unprotected admin endpoints, SSL failure)
- Always emails report via Resend

**SEO Agent (daily 4:00 UTC):**
- `scripts/seo-agent.mjs` + `.github/workflows/seo-agent.yml`
- Fetches sitemap-index.xml → crawls all sitemap URLs → checks each page for: HTTP status, title/description/OG meta tags, canonical, JSON-LD schema, response time
- Checks broken internal links (samples 30 unique paths from first 5 pages)
- AI analysis via Haiku: summary, recommendations, quick wins
- Always emails report via Resend

**Marketing Agent (weekly Monday 7:00 UTC):**
- `scripts/marketing-agent.mjs` + `.github/workflows/marketing-agent.yml`
- Reads blog posts (.md files), service pages, area pages, content calendar
- AI analysis via Haiku: content gaps (with priority), blog ideas (with target keywords), social media post suggestions (LinkedIn/Facebook), newsletter topics, content freshness assessment, overall assessment
- Grades based on blog freshness (30/60 day thresholds) and content gap count
- Always emails report via Resend

**Competitor Agent (weekly Sunday 21:00 UTC):**
- `scripts/competitor-agent.mjs` + `.github/workflows/competitor-agent.yml`
- Crawls 4 competitors (National Express, Arriva, HCT Group, Go Goodwins) defined in `src/data/competitors.json`
- Checks `/`, `/services`, `/about`, `/contact` for each — extracts title, description, content hash (SHA-256 of body text)
- Compares hashes against `src/data/reports/competitor-hashes.json` to detect content changes
- AI analysis via Haiku: competitive landscape summary, per-competitor assessment (strengths/weaknesses/threat level), opportunities, recommendations
- Always emails report via Resend

**Performance Agent (daily 6:00 UTC):**
- `scripts/performance-agent.mjs` + `.github/workflows/performance-agent.yml`
- NO AI — pure programmatic checks
- Endpoint health: 12 public pages (status + response time), 4 admin pages (expects redirect/403), 1 API endpoint
- SSL verification, content integrity (keyword checks on 4 key pages)
- Only emails on failures (grade D or F) — no daily noise
- Workflow does NOT need `LLM_API_KEY`

**Report Files:**
- `src/data/reports/{security,seo,marketing,competitor,performance}-report.json` — latest report per agent
- `src/data/reports/history.json` — 90-day capped grade history for all agents (used by trend indicators)
- `src/data/reports/competitor-hashes.json` — content hash tracking for change detection across runs

**Admin Dashboard (`/admin/monitoring`):**
- Management-only page with 6-agent card grid (security, SEO, marketing, competitor, performance, pricing intelligence)
- Each card: grade badge (A-F with colour), trend indicator (improving/stable/declining), schedule, last run, AI-powered flag, expandable report details
- 90-day grade history table at bottom with recent grades and summaries
- AdminLayout nav updated with Monitoring link

**GitHub Actions:**
- All 5 workflows include `workflow_dispatch` for manual triggering
- Security agent has `issues: write` permission for GitHub issue creation
- All workflows auto-commit report files and push to main

### Phase 12.1 — Security Headers Middleware (2026-02-17)
- `src/middleware.ts` — Astro middleware applying 6 security headers to every response (public, admin, API)
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- Strict-Transport-Security: max-age=31536000; includeSubDomains
- Content-Security-Policy: allowlists for Google Analytics, Google Tag Manager, Cloudflare CDN, Google Fonts, Web3Forms, Postcodes.io, OSRM, Anthropic API, OpenAI API, Google reCAPTCHA iframe

### Phase 13 — Future Integration (PLANNED, pending Telemex)
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
/admin/conversions              Quote conversion tracking (management only)
/admin/pricing-intelligence     AI pricing recommendations (management only)
/admin/monitoring                Monitoring dashboard — 6 agents (management only)
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
GET  /api/admin/conversions     Quote log with filters + computed metrics
PUT  /api/admin/conversions     Mark quote as converted or lost
POST /api/admin/conversions     Manual phone booking entry
GET  /api/admin/pricing-report  Read latest AI pricing report
PUT  /api/admin/pricing-report  Approve/reject recommendation
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
  audit-log.ts                  Append-only JSON lines audit log (data/audit-log.jsonl, 5MB rotation)
  quote-log.ts                  Quote logging (append-only JSONL, 5MB rotation, fire-and-forget)
                                  appendQuoteLog, readQuoteLog, updateQuoteLogEntry, generateQuoteId
  quote-engine.ts               Quote estimation engine — cost-per-mile + charge-out-rate model,
                                  three-tier return pricing (split/wait/separate), OSRM + Postcodes.io,
                                  deadhead rolled into journey, DVSA breaks, multi-stop chaining,
                                  per-leg surcharges for different-day, regular discount, minimum floors,
                                  airport fixed-rate unchanged, full itemised breakdown
  cf-auth.ts                    Cloudflare Access JWT verification via jose (JWKS cache, dev-mode fallback)
  rate-limit.ts                 In-memory rate limiter (per-IP, auto-cleanup, configurable per endpoint)
  validate-body.ts              Request body size validation (50KB default, 200KB large)
  utils.ts                      Shared utilities (escapeHtml)

src/middleware.ts                Astro middleware — security headers on all responses
                                  (X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
                                   Permissions-Policy, HSTS, CSP)
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
                                  minimum booking, 16-area distance matrix (incl. S, LS, LDN),
                                  airport rates (15 areas × 9 airports), city lookup,
                                  base postcodes with lat/lng, bank holidays 2026-2027,
                                  service questions with showWhen, toggleLabels, luggage, wheelchair
src/data/competitors.json        4 competitors with URLs and service tiers (National Express, Arriva, HCT, Go Goodwins)
src/data/quote-log.json         Empty placeholder (actual log at data/quote-log.jsonl, gitignored)
src/data/reports/pricing-report.json  AI-generated weekly pricing report (recommendations, tier analysis)
src/data/reports/security-report.json  Daily security scan report (auth, headers, leakage, SSL)
src/data/reports/seo-report.json      Daily SEO scan report (sitemap, meta, links, schema)
src/data/reports/marketing-report.json Weekly marketing analysis (gaps, ideas, social, newsletter)
src/data/reports/competitor-report.json Weekly competitor crawl (pages, changes, AI analysis)
src/data/reports/performance-report.json Daily performance/uptime (health, admin, APIs, SSL)
src/data/reports/history.json          90-day grade history for all agents (A-F scale)
src/data/reports/competitor-hashes.json Content hash tracking for competitor change detection
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
- Quote logging (website + James-chat, async fire-and-forget)
- Conversion tracking admin with metrics dashboard
- Vehicle tiers 1-48 pax with per-tier minimums
- Weekly market research agent (GitHub Actions cron)
- Pricing intelligence admin with AI recommendations + Test This panel
- 5 automated monitoring agents (security, SEO, marketing, competitor, performance)
- Monitoring admin dashboard with 6-agent card grid, grade history, trend indicators
- Email reports via Resend (all agents except performance on success-only)
- Competitor crawling with content hash change detection (4 competitors)
- GitHub issue creation on critical security findings
- Security headers middleware on all responses (CSP, HSTS, X-Frame-Options, etc.)

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
| Market research agent | `LLM_API_KEY` (GitHub repo secret) | Workflow built, needs secret |
| Monitoring agents | `LLM_API_KEY`, `SITE_URL`, `RESEND_API_KEY`, `NOTIFICATION_EMAIL` (GitHub repo secrets) | Workflows built, need secrets |

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

### Pricing Intelligence Pipeline (Current)
```
Website/Chat quotes → POST /api/quote/estimate or /api/chat
  → quote-log.ts appends to data/quote-log.jsonl (async, fire-and-forget)

Weekly (Sunday 22:00 UTC via GitHub Actions):
  → scripts/market-research-agent.mjs
    → Reads quote-rules.json (current pricing) + quote-log.jsonl (last 7 days)
    → Calls Anthropic Haiku with structured analysis prompt
    → Generates recommendations, tier analysis, minimum floor analysis
    → Saves to src/data/reports/pricing-report.json
    → Git commit + push → Railway auto-deploy

Admin review:
  → /admin/pricing-intelligence → view recommendations + metrics
    → "Test This" → runs 5 standard journeys via /api/quote/estimate
    → Approve → PUT /api/admin/pricing-report (marks approved)
    → Reject → PUT /api/admin/pricing-report (marks rejected + optional reason)

Manual conversion tracking:
  → /admin/conversions → view all quotes
    → Mark converted (booking value) or lost (reason) → PUT /api/admin/conversions
    → Add phone booking → POST /api/admin/conversions
```

### Automated Monitoring Pipeline (Current)
```
GitHub Actions cron triggers:
  → security-agent.mjs (daily 3am)
      → fetchWithTimeout() checks admin endpoints, headers, leakage, SSL
      → callHaiku() AI analysis
      → saveReport() → security-report.json
      → updateHistory() → history.json (90-day cap)
      → sendReportEmail() → Resend → NOTIFICATION_EMAIL
      → createGitHubIssue() on CRITICAL findings

  → seo-agent.mjs (daily 4am)
      → fetchSitemap() → crawl all URLs → checkPage() meta/schema/response time
      → checkBrokenLinks() sample internal links
      → callHaiku() AI analysis
      → saveReport() + updateHistory() + sendReportEmail()

  → marketing-agent.mjs (weekly Mon 7am)
      → readdirSync() blog posts, services, areas, content calendar
      → callHaiku() content gap analysis + recommendations
      → saveReport() + updateHistory() + sendReportEmail()

  → competitor-agent.mjs (weekly Sun 9pm)
      → loadCompetitors() from src/data/competitors.json
      → crawlCompetitor() × 4 → content hash (SHA-256)
      → detectChanges() vs competitor-hashes.json
      → callHaiku() competitive analysis
      → saveReport() + saveHashes() + updateHistory() + sendReportEmail()

  → performance-agent.mjs (daily 6am)
      → checkEndpointHealth() 12 pages + checkAdminProtection() 4 admin routes
      → checkAPIs() + checkSSL() + checkContentIntegrity()
      → saveReport() + updateHistory()
      → sendReportEmail() ONLY on grade D/F (failures only)

  → All workflows: git add reports → git commit → git push → Railway auto-deploy

Admin review:
  → /admin/monitoring → 6-agent card grid with grades + trends
    → Expandable report details per agent
    → 90-day grade history table
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
| `/api/*` (from admin) | Cloudflare Access JWT (verified via jose JWKS) | Authenticated managers |
| `/api/*` (programmatic) | `DASHBOARD_SECRET` header | Automated scripts, Claude Code |
| `/api/contact/submit` | Rate limited (5/15min per IP) | Public |
| `/api/quote/estimate` | Rate limited (30/15min per IP) + field validation | Public |
| `/image-library` | Cloudflare Zero Trust | Jay only |
| `/content-calendar` | Cloudflare Zero Trust | Jay only |
| All other routes | Public | Everyone |

All API endpoints validate request body size (50KB default, 200KB for large content).
All admin API endpoints use `authenticateRequest()` from `src/lib/cf-auth.ts`.
All responses include security headers via `src/middleware.ts` (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).

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

# === GITHUB ACTIONS SECRETS (repo Settings → Secrets → Actions) ===
# LLM_API_KEY                              # For AI-powered agents (security, SEO, marketing, competitor, pricing)
# SITE_URL                                 # https://www.afjltd.co.uk (all monitoring agents)
# RESEND_API_KEY                           # Agent email reports
# NOTIFICATION_EMAIL                       # Agent email recipient
```

---

## 8. File Counts Summary

| Category | Current | Planned |
|----------|---------|---------|
| Public pages | 55+ routes | — |
| Internal tools | 2 + admin dashboard (9 routes) | — |
| API endpoints | 16 | — |
| Components | 27 | — |
| Library modules | 11 | — |
| Data files | 22 | — |
| Blog posts (published) | 16 | 40+ |
| Blog posts (planned) | 24 | 24 (in content calendar) |
| Social media templates | 10 | — |
| Social media scripts | 2 (Facebook, LinkedIn) | — |
| Local SEO area pages | 25 | — |
| Service pages | 8 | — |
| JSON-LD schemas | 4 types (LocalBusiness, Service, FAQPage, BreadcrumbList) | — |
| CI/CD workflows | 9 (Lighthouse, broken links, deploy validation, market research, security, SEO, marketing, competitor, performance) | — |
| Scripts | 10 (image-audit, download-media, migrate-wordpress, market-research-agent, agent-utils, security/seo/marketing/competitor/performance-agent, run-all-agents) | — |

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
| Pricing intelligence | AI-powered weekly analysis with conversion tracking | Manual spreadsheet reviews |
| Automated monitoring | 6 agents: security, SEO, marketing, competitor, performance, pricing | No automated monitoring |
| Competitive intelligence | Weekly AI-powered competitor crawling with change detection | Ad-hoc manual checks |
