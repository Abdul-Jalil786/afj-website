# CLAUDE.md — AFJ Limited Digital Platform

> This is the primary instruction file for Claude Code working on the AFJ website.
> Read this ENTIRE file before making any changes. Follow all rules strictly.
> Last updated: 2026-02-17 (security headers middleware)

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
- Custom toggle labels (toggleLabels), conditional field visibility (showWhen)
- Luggage dropdown, wheelchair toggle, multi-stop support (up to 2 stops with autocomplete)
- Airport: arrival/departure toggle, executive tier (+30%), meet & greet, fixed-rate model unchanged

**Pricing Refactor + Admin Cost Portal — COMPLETE (2026-02-16)**
- Cost-per-mile + charge-out-rate model replaces baseFare + perMileRate for private hire
- Three-tier return pricing:
  - **Split**: pickup near base + gap ≥ 5 hours → driver returns to base, zero waiting charge
  - **Wait**: pickup far from base OR short gap → driver stays, waiting charged at £17/hr
  - **Separate**: different-day → two independent bookings, per-leg surcharges
- Deadhead rolled into journey miles (not shown as separate line to customer)
- Admin pricing portal at `/admin/pricing` (management only):
  - Core pricing (costPerMile, chargeOutRate, driverWage + margin display)
  - Operational thresholds, minimum floors, passenger multipliers, surcharges, bank holidays, DVSA
  - Quote preview panel for testing changes before saving
- `GET /api/admin/pricing` and `POST /api/admin/pricing` endpoints (GitHub API commit)
- Flags: heavy luggage, wheelchair accessible, executive vehicle badges on estimate

**Pricing Bug Fixes — COMPLETE (2026-02-16)**
- WAIT return deadhead: return leg now uses base→destination distance (`destDeadhead`) instead of base→pickup
- Airport arrival waiting: uses charge-out rate (£17/hr) instead of driver wage (£13/hr)
- Per-leg minimum floor: different-day returns apply minimum (£35/£45) per-leg, not combined total
- DVSA passenger parsing: extracts max from ranges like "9-16" → 16 (was stopping at hyphen → 9)
- DVSA break on one-way trips: 45-min break surcharge for 9+ passengers now applies to one-way trips too

**Security Hardening — COMPLETE (2026-02-16)**
- Auth bypass: `/api/ai/test` and `/api/blog/create` now accept CF JWT alongside `x-dashboard-secret`
- XSS: `escapeHtml()` on all user values in email templates (`/api/admin/approval`, `/api/contact/submit`)
- Permission: `/api/ai/page-edit` restricted to management + marketing roles via CF JWT (403 for others)
- Path exposure: `/api/ai/page-edit` error responses no longer expose server file paths

**Admin Fixes — COMPLETE (2026-02-16)**
- Apply Change button: now commits to GitHub via new `/api/admin/page-apply` endpoint (was a no-op)
- Department config: `getDepartment()` fallback returns `unknown` with no privileges (was granting management)
- Audit logging: `src/lib/audit-log.ts` logs admin actions to `data/audit-log.json` (gitignored); hooked into blog/create, page-edit, page-apply, approval (submit/approve/reject)

**Accessibility Hardening — COMPLETE (2026-02-16)**
- Desktop dropdown keyboard: Enter/Space/ArrowDown opens, ArrowUp/ArrowDown navigates, Escape closes; `aria-haspopup` + `aria-expanded` on trigger
- Mobile menu Escape: closes menu + restores focus to hamburger button
- Footer contrast: bottom bar `text-gray-400` → `text-gray-300` (WCAG AA)
- Form aria-live: field-level error messages in ContactForm + quote wizard have `aria-live="polite"`
- FleetGallery lightbox: `role="dialog"`, `aria-modal="true"`, `aria-label="Image lightbox"`
- FAQ focus-visible: toggle buttons show `focus-visible:outline-2 focus-visible:outline-afj-accent`
- Hero + nav decorative SVGs: arrow/chevron icons marked `aria-hidden="true"`
- AdminLayout nav: desktop `aria-label="Admin navigation"`, mobile changed `<div>` → `<nav>` with `aria-label`

**SEO & Project Structure Cleanup — COMPLETE (2026-02-16)**
- BlogLayout now renders `<SEOHead>` in head slot (was imported but unused — blog posts had no OG/Twitter meta)
- Manchester office postcode (M35 0BR) added to LocalBusiness schema in SEOHead.astro + local-business.json
- `src/lib/github.ts` — shared GitHub API utility (getFileContent, createOrUpdateFile, deleteFile, listDirectory, updateFileContent); 6 API files refactored to use it
- `src/pages/api/ai/seo-generate.ts` — new endpoint: generates SEO meta title, description, keywords via LLM
- Component subdirectories: 20 flat components reorganised into `layout/` (4), `ui/` (4), `sections/` (12), `admin/` (empty); ~86 import paths updated across 29 files
- Blog index schema changed from `Blog` to `CollectionPage` with `ItemList` of posts
- Social sidebar: removed 3 placeholder links (Instagram, X, YouTube); kept Facebook + LinkedIn
- Content collections migrated to Astro v5 API: `src/content.config.ts` with `glob()` and `file()` loaders (replaces old `src/content/config.ts`); testimonials collection added
- `npm audit`: 5 moderate vulnerabilities in lodash chain (lodash → yaml-language-server → @astrojs/check). Dev-only dependency, no runtime exposure. `npm audit fix --force` would downgrade @astrojs/check — accepted risk.

**James AI Chat Assistant — COMPLETE (2026-02-16)**
- `src/components/ui/ChatCharacter.astro` — SVG chauffeur character with 4 animated moods (idle, talking, thinking, waving)
- `src/components/ui/ChatWidget.astro` — Full chat UI with vanilla JS, floating bubble, 20-message cap, 500-char input
- `src/pages/api/chat.ts` — Chat POST endpoint with 3-layer rate limiting (per-IP/min, per-IP/hr, global/hr)
- `src/lib/chat-log.ts` — Append-only JSONL analytics (first message only, no IPs)
- `src/lib/prompts.ts` — Added CHAT_ASSISTANT_SYSTEM_PROMPT (James persona)
- `src/lib/llm.ts` — Added generateChat() multi-turn function with callLLM() refactor
- Voice input (speech-to-text) via Web Speech API with en-GB, interim results, auto-send
- OpenAI TTS natural voice output (model: tts-1, voice: ash) via `/api/tts` proxy endpoint
- `src/pages/api/tts.ts` — TTS endpoint with rate limiting + daily 50,000-char usage cap
- `src/lib/tts-usage.ts` — Daily character usage tracker (falls back to browser TTS when exceeded)
- Audio caching in sessionStorage, replay buttons on James messages, browser TTS fallback
- OPENAI_API_KEY env var needed for TTS (chat LLM stays on Anthropic/Haiku)
- `src/lib/james-knowledge.ts` — Auto-builds knowledge base from website content at Vite bundle time
- Uses `import.meta.glob(?raw)` to read all public .astro pages and blog .md files
- Imports areas.json, compliance.json, quote-rules.json for structured data
- Extracts: services, FAQ Q&A, compliance, areas served, careers, vehicles, blog titles, quote wizard info
- `CHAT_ASSISTANT_SYSTEM_PROMPT` now uses `SITE_KNOWLEDGE` instead of hardcoded content
- James only knows what is on the website — nothing more, nothing less

**Quote via Chat — COMPLETE (2026-02-16)**
- James can now help customers get instant price estimates through conversation
- QUOTE ASSISTANCE instructions appended to system prompt in `src/pages/api/chat.ts`
- James collects journey details naturally (pickup, destination, date, time, passengers, return)
- LLM outputs `[QUOTE_REQUEST:{...}]` tag → chat.ts detects it via regex
- `estimateQuote()` called directly server-side (no HTTP round-trip to `/api/quote/estimate`)
- `mapQuoteRequest()` converts James's JSON to quote engine format (service names, passenger range keys, return type)
- Only `estimate.low` and `estimate.high` exposed to customer — James NEVER sees cost-per-mile, driver wages, charge-out rates, or internal breakdowns
- Quotable services: private hire, airport transfers, executive minibus
- SEND/NEPTS → redirected to contact (contract-based)
- Fleet maintenance, vehicle conversions, driver training → redirected to contact (bespoke)
- Error handling: if quote engine fails, friendly fallback directs to `/quote` or contact
- Uses existing rate limits — no extra limits needed

**Pricing Intelligence System — COMPLETE (2026-02-17)**
- Quote logging: `src/lib/quote-log.ts` — append-only JSONL logger (5MB rotation, fire-and-forget)
- All website quotes (`/api/quote/estimate`) and James-chat quotes (`/api/chat`) log automatically to `data/quote-log.jsonl`
- Log entry: id, timestamp, service, pickup (4 chars only), destination (4 chars only), passengers, date, time, returnType, quoteLow/High/Total, source (website|james-chat|phone), converted, customerName, notes
- Conversion tracking admin at `/admin/conversions` (management only):
  - Dashboard metrics: weekly/monthly quotes, conversion rate, avg value, top routes, busiest days
  - Filterable/sortable quote table with date range, service, source, status filters
  - Slide-out panel to mark quotes as converted (with booking value) or lost (with reason)
  - Manual phone booking entry form (creates pre-converted entry with source "phone")
- `src/pages/api/admin/conversions.ts` — GET (filtered log + computed metrics), PUT (convert/lose), POST (phone booking)
- Vehicle tiers expanded 1-48 passengers:
  - New bands: "1-4" (Saloon car) and "34-48" (Full-size coach) for private-hire and airport
  - Per-tier passenger multipliers: { "1-4": 0.85, "5-8": 1.0, "9-16": 1.3, "17-24": 1.6, "25-33": 2.0, "34-48": 2.8 }
  - Per-tier minimum booking floors (backward-compatible: `typeof` check for number vs object)
  - Admin pricing page updated with per-tier minimum inputs and expanded preview dropdown
- Weekly market research agent: `scripts/market-research-agent.mjs`
  - Reads `quote-rules.json` + `data/quote-log.jsonl`, analyses pricing performance
  - Calls Anthropic Haiku with structured prompt, generates recommendations with reasoning
  - Handles <5 quotes gracefully (baseline report, no AI call)
  - Saves structured report to `src/data/reports/pricing-report.json`
  - `.github/workflows/market-research.yml` — Sunday 22:00 UTC cron + manual trigger
  - Requires `LLM_API_KEY` as GitHub repository secret
- Pricing intelligence admin at `/admin/pricing-intelligence` (management only):
  - Latest report display with key metrics (quotes, conversions, rate, avg value)
  - AI market insights section
  - Recommendations list with priority badges (high/medium/low) and type tags
  - "Test This" panel: runs 5 standard test journeys, shows side-by-side current vs recommended pricing
  - Approve/reject workflow per recommendation (persisted to report JSON via GitHub API)
  - Tier analysis breakdown and minimum floor analysis sections
  - Top routes display
- `src/pages/api/admin/pricing-report.ts` — GET (read report), PUT (approve/reject recommendation)
- AdminLayout nav updated: Conversions + Intelligence links added after Pricing

**Automated Monitoring Agents — COMPLETE (2026-02-17)**
- 5 monitoring agents with shared utility module (`scripts/agent-utils.mjs`):
  - `scripts/security-agent.mjs` — Daily 3:00 UTC: auth enforcement on admin endpoints, security headers, info leakage, SSL, AI analysis. Creates GitHub issues on CRITICAL findings.
  - `scripts/seo-agent.mjs` — Daily 4:00 UTC: sitemap crawl (all URLs return 200), meta tags (title, desc, OG), broken internal links, schema markup, blog freshness, page load times, AI analysis.
  - `scripts/marketing-agent.mjs` — Weekly Monday 7:00 UTC: AI content gap analysis, blog ideas, social media post suggestions, newsletter topics, content freshness assessment.
  - `scripts/competitor-agent.mjs` — Weekly Sunday 21:00 UTC: crawls 4 competitors (National Express, Arriva, HCT Group, Go Goodwins), content hash change detection, AI competitive analysis.
  - `scripts/performance-agent.mjs` — Daily 6:00 UTC: endpoint health (12 pages), admin protection verification, API health, SSL, content integrity. NO AI. Only emails on failures (grade D/F).
- Shared utilities: `callHaiku`, `sendReportEmail` (Resend), `saveReport`, `loadReport`, `updateHistory` (90-day cap), `fetchWithTimeout`, `createGitHubIssue`, `gradeFromIssues` (A-F scale), HTML email helpers.
- `scripts/run-all-agents.mjs` — convenience script to run all 5 in sequence (supports subset: `node scripts/run-all-agents.mjs security performance`).
- `src/data/competitors.json` — 4 competitors with URLs and service tiers.
- Report files: `src/data/reports/{security,seo,marketing,competitor,performance}-report.json` + `history.json` (90-day capped grade history) + `competitor-hashes.json` (content change tracking).
- GitHub Actions workflows (all with `workflow_dispatch` for manual trigger):
  - `.github/workflows/security-agent.yml` — daily 3:00 UTC (permissions: contents write, issues write)
  - `.github/workflows/seo-agent.yml` — daily 4:00 UTC
  - `.github/workflows/marketing-agent.yml` — weekly Monday 7:00 UTC
  - `.github/workflows/competitor-agent.yml` — weekly Sunday 21:00 UTC
  - `.github/workflows/performance-agent.yml` — daily 6:00 UTC (no AI key needed)
- Admin monitoring dashboard at `/admin/monitoring` (management only):
  - 6-agent card grid (security, SEO, marketing, competitor, performance, pricing intelligence)
  - Grade badge (A-F) with trend indicator (improving/stable/declining)
  - Expandable report details per agent
  - 90-day grade history table with recent grades and summaries
- AdminLayout nav updated with Monitoring link
- GitHub secrets needed: `LLM_API_KEY`, `SITE_URL`, `RESEND_API_KEY`, `NOTIFICATION_EMAIL`

**Security Headers Middleware — COMPLETE (2026-02-17)**
- `src/middleware.ts` — Astro middleware applying security headers to every response (public + admin + API)
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- Strict-Transport-Security: max-age=31536000; includeSubDomains
- Content-Security-Policy: allowlists for Google Analytics, Cloudflare CDN, Google Fonts, Web3Forms, Postcodes.io, OSRM, Anthropic API, OpenAI API

**Do NOT touch:** ContactForm (stable), BaseLayout GA4 (stable), SEOHead (stable), redirects (stable), Content calendar dashboard (stable), Social Impact Report components (stable), Admin pricing portal (stable), LLM layer (stable), prompts library (stable), Admin dashboard pages (stable), approval API (stable), Quote wizard (stable), Area data files (stable), Compliance data (stable), Testimonial engine (stable), Schema markup (stable), Social media scripts (stable), Component subdirectory structure (stable), github.ts shared utility (stable), James knowledge base (stable), Quote logging infrastructure (stable), Conversion tracking admin (stable), Pricing intelligence admin (stable), Monitoring agents + agent-utils.mjs (stable), Competitor data (stable), Security headers middleware (stable)

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
| **Framework** | Astro (v5.17.x) | Static pages + server-rendered API endpoints |
| **Styling** | Tailwind CSS | Utility-first, no custom CSS files unless absolutely necessary |
| **Hosting** | Railway | Auto-deploys on push to `main` branch |
| **Adapter** | `@astrojs/node` | Standalone mode for Railway |
| **DNS/CDN** | Cloudflare | DNS, SSL, domain management, Zero Trust for auth |
| **Auth** | Cloudflare Zero Trust | Used for internal tools and admin access |
| **LLM API** | Anthropic (Haiku 4.5) | Content generation, NL commands — swap-ready for Groq/Llama |
| **Email** | Resend API | Notifications, reminders |
| **Forms** | Web3Forms | Contact form submissions |
| **Repo** | `afj-website` on `main` branch | Feature branches for development |
| **Node** | v20.x LTS (Railway target) | Local dev runs v24; Railway deploys with v20 LTS |
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
│   ├── middleware.ts                # 🆕 Security headers on all responses
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
│   │   │   ├── approvals.astro     # Pending content approval queue
│   │   │   ├── pricing.astro       # 🆕 Pricing configuration portal (management only)
│   │   │   ├── conversions.astro   # 🆕 Quote conversion tracking (management only)
│   │   │   ├── pricing-intelligence.astro  # 🆕 AI pricing recommendations (management only)
│   │   │   └── monitoring.astro    # 🆕 Monitoring dashboard — 6 agents (management only)
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
│   │   │   ├── compliance/
│   │   │   │   └── status.ts       # 🆕 GET — compliance dashboard data
│   │   │   └── admin/
│   │   │       ├── pricing.ts      # 🆕 GET/POST — pricing config read/write
│   │   │       ├── compliance.ts   # POST — compliance data update via GitHub API
│   │   │       ├── conversions.ts  # 🆕 GET/PUT/POST — quote log + conversion tracking
│   │   │       └── pricing-report.ts # 🆕 GET/PUT — AI pricing report read/approve/reject
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
│   │   ├── quote-log.ts            # 🆕 Quote logging (append-only JSONL, 5MB rotation)
│   │   └── github.ts               # GitHub API helper for content creation
│   └── data/
│       ├── compliance.json         # 🆕 Compliance status data
│       ├── departments.json        # 🆕 Department → page mapping for admin
│       ├── area-data/              # 🆕 Local data for programmatic SEO pages
│       │   ├── schools.json
│       │   ├── hospitals.json
│       │   └── areas.json
│       ├── quote-rules.json        # 🆕 Quote estimation rules and ranges
│       ├── competitors.json        # 🆕 Competitor URLs and service tiers (4 competitors)
│       └── reports/
│           ├── pricing-report.json # 🆕 AI-generated weekly pricing report
│           ├── security-report.json  # 🆕 Daily security scan report
│           ├── seo-report.json       # 🆕 Daily SEO scan report
│           ├── marketing-report.json # 🆕 Weekly marketing analysis report
│           ├── competitor-report.json # 🆕 Weekly competitor monitor report
│           ├── performance-report.json # 🆕 Daily performance/uptime report
│           ├── history.json          # 🆕 90-day grade history (all agents)
│           └── competitor-hashes.json # 🆕 Content hash tracking for change detection
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
├── scripts/
│   ├── agent-utils.mjs             # 🆕 Shared monitoring agent utilities
│   ├── market-research-agent.mjs   # 🆕 Weekly AI pricing analysis (Haiku)
│   ├── security-agent.mjs          # 🆕 Daily security scan (3:00 UTC)
│   ├── seo-agent.mjs               # 🆕 Daily SEO scan (4:00 UTC)
│   ├── marketing-agent.mjs         # 🆕 Weekly marketing analysis (Mon 7:00 UTC)
│   ├── competitor-agent.mjs        # 🆕 Weekly competitor monitor (Sun 21:00 UTC)
│   ├── performance-agent.mjs       # 🆕 Daily performance/uptime check (6:00 UTC)
│   └── run-all-agents.mjs          # 🆕 Convenience script to run all agents
└── .github/
    └── workflows/                  # 🆕 CI/CD + Monitoring
        ├── lighthouse.yml
        ├── broken-links.yml
        ├── deploy-validate.yml
        ├── market-research.yml     # 🆕 Sunday 22:00 UTC pricing agent cron
        ├── security-agent.yml      # 🆕 Daily 3:00 UTC
        ├── seo-agent.yml           # 🆕 Daily 4:00 UTC
        ├── marketing-agent.yml     # 🆕 Monday 7:00 UTC
        ├── competitor-agent.yml    # 🆕 Sunday 21:00 UTC
        └── performance-agent.yml   # 🆕 Daily 6:00 UTC
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
Stored in `src/data/quote-rules.json`. Rule-based, not AI-powered (no need for LLM here). The quote is an estimate range to set expectations, not a binding price.

### Pricing Model (Private Hire)
Cost = (miles × costPerMile) + (hours × chargeOutRatePerHour), then × passengerMultiplier.
- `costPerMile` (default £0.45) covers fuel, wear, insurance, depreciation, compliance — set by admin
- `chargeOutRatePerHour` (default £17) is what we charge clients per driver hour — set by admin
- `driverWagePerHour` (default £13) is what we pay the driver — shown in admin for margin visibility only

**Three-tier return pricing:**
1. **Split** (same-day, pickup near base, gap ≥ 5 hours) — driver returns to base between legs. Two separate leg costs, zero waiting charge. Customer sees "Separate return collection" line.
2. **Wait** (same-day, far from base OR short gap) — driver stays at destination. Journey + return + waiting hours at charge-out rate. Customer sees "Driver waiting time" line.
3. **Separate** (different-day) — two independent bookings. Surcharges applied per-leg based on each leg's date/time.

Deadhead (base→pickup) is rolled into journey miles — not shown as a separate line item. Only charged when pickup is >30 miles from nearest base.

**Airport transfers** use a separate fixed-rate model (`airportRates` table), not the cost-per-mile formula.

### Vehicle Tiers
6 passenger bands for private-hire and airport: "1-4" (Saloon), "5-8" (MPV), "9-16" (Minibus), "17-24" (Large minibus), "25-33" (Coach), "34-48" (Full-size coach). Each has its own multiplier and minimum booking floor.

### Admin Pricing Portal (`/admin/pricing`)
Management-only admin page for configuring all pricing inputs without touching code. Changes commit to `quote-rules.json` via GitHub API and auto-deploy via Railway. Includes a quote preview panel to test impact of changes before saving.

---

## 11. Pricing Intelligence System

A complete pipeline for tracking quotes, analysing conversion performance, and generating AI-powered pricing recommendations.

### Quote Logging
- `src/lib/quote-log.ts` — mirrors `audit-log.ts` pattern: append-only JSONL, 5MB rotation, fire-and-forget
- Log path: `data/quote-log.jsonl` (gitignored, persists on Railway between deploys)
- All quotes logged automatically: website (`/api/quote/estimate`), James chat (`/api/chat`), manual phone entries
- Privacy: only first 4 characters of postcodes stored; no IP addresses logged
- Entry fields: id, timestamp, service, pickup, destination, passengers, date, time, returnType, quoteLow, quoteHigh, quoteTotal, source, converted, convertedAt, convertedValue, lostReason, customerName, notes

### Conversion Tracking (`/admin/conversions`)
Management-only admin page with:
- Dashboard metrics: this week/month quotes, conversions, rate %, average value, top routes, busiest days
- Filterable table: date range, service, source (website/james-chat/phone), status (pending/converted/lost)
- Slide-out panel: mark as converted (booking value, customer name, notes) or lost (reason)
- Manual phone booking form: creates pre-converted entry with source "phone"
- API: `GET /api/admin/conversions` (filtered log + metrics), `PUT` (convert/lose), `POST` (phone booking)

### Weekly Market Research Agent
- Script: `scripts/market-research-agent.mjs` — standalone Node.js script (no Astro runtime)
- Reads `quote-rules.json` (current pricing) + `data/quote-log.jsonl` (last 7 days of quotes)
- Calls Anthropic Haiku with structured analysis prompt
- Generates: recommendations (with field, current/recommended values, reasoning, impact), tier analysis, minimum floor analysis, market insights
- Saves to `src/data/reports/pricing-report.json`
- Handles <5 quotes gracefully (baseline report without AI call)
- Schedule: `.github/workflows/market-research.yml` — Sunday 22:00 UTC + manual trigger via GitHub Actions
- Requires `LLM_API_KEY` as a GitHub repository secret (Settings → Secrets → Actions)

### Pricing Recommendations (`/admin/pricing-intelligence`)
Management-only admin page with:
- Latest report header: period, generation time, status badge (pending/reviewed)
- Key metrics: quotes, converted, conversion rate, average value
- AI insights: free-form market analysis text
- Recommendations list: priority badges (high/medium/low), type tags (rate-adjustment, minimum-floor, multiplier, surcharge, operational)
- **Test This** panel: click on any recommendation → runs 5 standard test journeys (Birmingham→Manchester, Birmingham→Coventry, Birmingham→London, Wolverhampton→Birmingham, Manchester→Leeds) → shows side-by-side current vs recommended pricing
- Approve/reject buttons per recommendation: approve updates report status, reject prompts for optional reason
- Tier analysis and minimum floor analysis sections
- Top routes display
- API: `GET /api/admin/pricing-report` (read), `PUT` (approve/reject recommendation)

### Data Flow
```
Website/Chat quotes → quote-log.jsonl → market-research-agent.mjs (weekly)
                                              ↓
                                    Anthropic Haiku analysis
                                              ↓
                                    pricing-report.json
                                              ↓
                              /admin/pricing-intelligence (review)
                                              ↓
                              Approve → /api/admin/pricing → quote-rules.json → deploy
```

---

## 12. Automated Monitoring Agents

6 automated agents running on GitHub Actions cron schedules, providing continuous security, SEO, marketing, competitive, performance, and pricing intelligence.

### Agent Overview

| Agent | Script | Schedule | AI | Email |
|-------|--------|----------|----|-------|
| Security | `security-agent.mjs` | Daily 3:00 UTC | Yes | Always |
| SEO | `seo-agent.mjs` | Daily 4:00 UTC | Yes | Always |
| Marketing | `marketing-agent.mjs` | Mon 7:00 UTC | Yes | Always |
| Competitor | `competitor-agent.mjs` | Sun 21:00 UTC | Yes | Always |
| Performance | `performance-agent.mjs` | Daily 6:00 UTC | No | Failures only |
| Pricing | `market-research-agent.mjs` | Sun 22:00 UTC | Yes | N/A (admin page) |

### Shared Utilities (`scripts/agent-utils.mjs`)
All agents import from `agent-utils.mjs`:
- `callHaiku(system, userMessage)` — Anthropic API call
- `parseAIJSON(raw)` — strips markdown fencing, parses JSON
- `sendReportEmail(subject, htmlBody)` — Resend API (skips silently if no key)
- `saveReport(filename, data)` / `loadReport(filename)` — JSON persistence in `src/data/reports/`
- `updateHistory(agentName, grade, summary)` — 90-day capped grade history
- `gradeFromIssues(critical, high, medium, low)` — A-F grading scale
- `fetchWithTimeout(url, options, timeoutMs)` — fetch with AbortController timeout
- `createGitHubIssue(title, body, labels)` — GitHub API issue creation
- `reportHeader()` / `reportFooter()` — branded HTML email templates

### Grading Scale
- **A**: No issues
- **B**: Minor/low issues only
- **C**: Some moderate issues
- **D**: Significant problems (performance agent emails here)
- **F**: Critical failures (security agent creates GitHub issues here)

### Admin Dashboard (`/admin/monitoring`)
Management-only page showing all 6 agents in a card grid. Each card shows:
- Agent name, schedule, AI-powered flag
- Grade badge (A-F) with colour coding
- Trend indicator (improving/stable/declining) based on last 3 grades
- Last run timestamp
- Expandable report detail panel with agent-specific sections
- 90-day grade history table at bottom

### GitHub Secrets Required
| Secret | Used By |
|--------|---------|
| `LLM_API_KEY` | Security, SEO, Marketing, Competitor, Pricing agents |
| `SITE_URL` | All 5 monitoring agents |
| `RESEND_API_KEY` | All agents (email reports) |
| `NOTIFICATION_EMAIL` | All agents (email recipient) |
| `GITHUB_TOKEN` | Security agent (issue creation) |

### Competitor Data
`src/data/competitors.json` stores 4 competitors with URLs and service tiers. The competitor agent crawls `/`, `/services`, `/about`, `/contact` for each, hashes body content, and detects changes between runs. Hashes stored in `src/data/reports/competitor-hashes.json`.

---

## 13. Programmatic SEO Strategy

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

## 14. Compliance Dashboard

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

## 15. Error Handling & Logging

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

## 16. Testing & Validation

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

## 17. Environment Variables (Complete Reference)

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

# === TTS (James chat voice) ===
OPENAI_API_KEY=                             # OpenAI API key (TTS only, not for chat LLM)

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

# === GITHUB ACTIONS SECRETS (set in repo Settings → Secrets → Actions) ===
# LLM_API_KEY                              # Same as LLM_API_KEY above (for CI agents)
# SITE_URL                                 # https://www.afjltd.co.uk (for CI agents)
# RESEND_API_KEY                           # Same as above (for agent email reports)
# NOTIFICATION_EMAIL                       # info@afjltd.co.uk (for agent email reports)
```

---

## 18. Common Troubleshooting

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

## 19. Git Workflow

1. **Feature branches:** `feature/admin-dashboard`, `feature/quote-wizard`, etc.
2. **Commit messages:** Descriptive, present tense: "Add AI draft endpoint for blog posts"
3. **Pull to main:** Only merge when feature is tested and working
4. **Never force push to main** — Railway auto-deploys from main
5. **Tag releases:** `v1.0`, `v1.1`, etc. for major milestones

---

## 20. Implementation Priority Order

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
