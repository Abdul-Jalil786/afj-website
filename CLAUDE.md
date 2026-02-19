# CLAUDE.md — AFJ Limited Digital Platform

> Primary instruction file for Claude Code. Read ENTIRE file before making changes.
> Last updated: 2026-02-18

---

## CURRENT STATUS

**All Tiers 1-5 COMPLETE.** Active development on automation and intelligence features.

**Recently completed:**
- Compliance data management: MOT/DBS record tracking, CSV import, expiry warnings, daily compliance check agent (no AI)
- Social media auto-publishing: AI-generated LinkedIn + Facebook drafts on blog publish, manual post creation, admin review/approve/publish workflow
- Meta agent: monthly AI health check of all agents, recommendations, cost estimates, Agent Health tab in monitoring
- Command centre dashboard: admin home rebuilt with key metrics, action cards, agent status strip, quick actions sidebar
- Centralised notification system with admin bell icon, email alerts, /admin/notifications page
- Blog auto-drafting with inline AI editing, diff view, edit history, publish via GitHub API
- Security/SEO remediation agent (daily 5am, generates Claude Code prompts for manual fixing — no AI, no auto-apply)
- Pricing intelligence system (quote tracking, conversion analytics, market research agent, recommendations)
- 9 monitoring agents (security, SEO, remediation, marketing, competitor, performance, pricing, compliance, meta) with email reports
- Run Now buttons on monitoring dashboard — trigger any agent on-demand via `/api/admin/run-agent` (management only, single-agent lock, 120s timeout). After execution, all report files are batch-committed to GitHub in a single commit via Git Trees API (1 commit = 1 Railway deploy, not N).
- Security headers middleware on all routes (CSP tightened: `unsafe-eval` removed)
- robots.txt blocks /admin/, /api/, /image-library, /content-calendar (sitemap points to staging domain)
- Rate limiting on all public endpoints including /api/compliance/status
- Vehicle tiers expanded to 1-48 passengers with per-tier minimums
- James AI chat assistant with voice input, OpenAI TTS, auto-knowledge, quote calculator

**In progress / next:**
- (nothing currently in progress)

**Do NOT touch:** ContactForm, BaseLayout GA4, SEOHead, redirects, Content calendar, Social Impact Report components, Hero slider logic, Header navigation structure, Component subdirectory structure, github.ts shared utility, Notification bell in AdminLayout header, Compliance records API + agent, Social drafter lib + API, Security headers middleware (stable), robots.txt (stable)

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Company** | AFJ Limited |
| **Website** | https://www.afjltd.co.uk (staging: afj-staging.ascendtechgroup.co.uk) |
| **Industry** | Transport — SEND, NEPTS, private hire, fleet services |
| **Scale** | 2,000+ students daily, 47+ drivers |
| **Facebook** | https://www.facebook.com/AFJTravel/ |
| **LinkedIn** | https://www.linkedin.com/company/afj-ltd/ |

### Fleet (internal — never show exact numbers publicly)
- Birmingham SEND: ~130 vehicles
- Manchester SEND: ~50 vehicles
- NEPTS Birmingham: ~10 vehicles
- NEPTS Manchester: ~10 vehicles
- Total: ~200 vehicles. Show only MOT pass rate % publicly.

### Service Areas
- **Council contracts (SEND/NEPTS):** Birmingham, Manchester, Coventry, Sandwell, Solihull, Oldham, Trafford. Can deliver in other areas depending on volume.
- **Private hire/airport:** Birmingham and Manchester + 20-mile radius.

### Competitors (for competitor monitoring agent)
**Tier 1 — Direct council contract competitors:**
- Green Destinations (https://greendestinationsltd.com) — SEND transport
- HATS Group (https://hatsgroup.com) — SEND/NEPTS, took over North Birmingham Travel contract
- Travel SOS (https://travelsos.co.uk) — SEND transport
- Smart Kids Group (https://smartkidsgroup.co.uk) — SEND transport

**Tier 2 — Private hire / minibus competitors (Birmingham):**
- AJ Travel (https://aj-travel.co.uk) — minibus/coach hire, 20+ years
- HS2 Travel (https://hs2travelltd.co.uk) — minibus/coach hire
- Aziz Coach Service (https://www.azizcoachservice.com) — coach hire, est. 1960
- Aston Manor Coaches (https://astonmanorcoaches.com) — coach/minibus hire

### Go-Live
- Staging: afj-staging.ascendtechgroup.co.uk (current)
- Production: www.afjltd.co.uk (switch when admin agrees ready)
- When going live: update SITE_URL, NOTIFICATION_EMAIL (→ jay@afjltd.co.uk), change robots.txt Sitemap URL back to afjltd.co.uk, update astro.config.mjs `site` to afjltd.co.uk
- Resend domain verified: afjltd.co.uk — all emails now sent from noreply@afjltd.co.uk

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Astro v5.17.x (static + server endpoints) |
| Styling | Tailwind CSS |
| Hosting | Railway (auto-deploys on push to main) |
| Adapter | @astrojs/node (standalone) |
| DNS/CDN | Cloudflare (Zero Trust for auth) |
| LLM | Anthropic Haiku 4.5 via src/lib/llm.ts abstraction |
| TTS | OpenAI (tts-1, voice "ash") via /api/tts |
| Email | Resend API |
| Forms | Web3Forms |
| Node | v20.x LTS (Railway), v24 local |
| Package Manager | npm (package-lock.json) |

---

## 3. Architectural Decisions (DO NOT OVERRIDE)

1. **Astro over Next.js** — Static pages, minimal JS, island architecture
2. **Railway over Vercel** — Server endpoints, auto-deploy on push
3. **No traditional CMS** — Repo is the CMS. Content via markdown/JSON + admin dashboard
4. **Cloudflare Zero Trust for auth** — No custom auth, no password databases
5. **Haiku-first for AI** — All AI via src/lib/llm.ts. Never hardcode model/provider
6. **Images in public/images/** — No Astro image optimization (Railway memory constraints)
7. **Server endpoints for API only** — Pages pre-rendered. Only /api/* is server-rendered

---

## 4. Brand Voice

- "SEND transport" (not SEN or special needs), "NEPTS" (not ambulance), "AFJ Limited" (not AFJ Ltd in body)
- "Students" (not children), "Fleet maintenance" (not vehicle repair)
- Professional, approachable, community-focused, data-driven
- Never: "We're the best", "cheap/budget", "disabled" as noun, generic AI filler

---

## 5. Automation Philosophy

The admin portal is a **command centre** where AI agents do the work and Jay approves. The goal is to minimise human effort to reviewing and clicking approve/reject.

**How it works:**
- Agents run on schedules (GitHub Actions cron) → generate reports, drafts, fix proposals
- Every action that needs attention creates a notification → email sent with direct link
- Jay opens admin portal → reviews action cards → approves, edits, or rejects
- On approve → system auto-deploys (blog posts, pricing changes, code fixes via PR)

**Agent hierarchy:**
- Monitoring agents (security, SEO, performance) → detect issues
- Remediation agent → generates fix proposals for detected issues
- Marketing agent → suggests content → blog drafter auto-writes posts
- Market research agent → analyses pricing → generates recommendations
- Meta agent (monthly) → reviews all agents for outdated code/better approaches
- All agents feed into the centralised notification system

**Nothing auto-deploys without approval.** Every change goes through the admin portal first.

---

## 5b. Key Files

```
src/
├── middleware.ts                    # Security headers on all responses
├── lib/
│   ├── llm.ts                      # LLM provider abstraction
│   ├── prompts.ts                  # System prompts with brand voice
│   ├── quote-engine.ts             # Quote calculation (723 lines)
│   ├── quote-log.ts                # JSONL quote logger (5MB rotation)
│   ├── james-knowledge.ts          # Auto-builds knowledge from site content
│   ├── github.ts                   # GitHub API helper
│   ├── cf-auth.ts                  # Cloudflare Zero Trust auth
│   ├── audit-log.ts                # Admin action logging
│   ├── tts-usage.ts                # Daily TTS character tracking
│   ├── notifications.ts            # Centralised notification service (create, email, read/mark)
│   ├── blog-drafter.ts             # AI blog draft generation + inline editing
│   └── social-drafter.ts           # LinkedIn + Facebook post generation (blog-triggered + manual)
├── data/
│   ├── quote-rules.json            # Pricing config (rates, multipliers, surcharges, distances)
│   ├── departments.json            # Department → email → page mapping
│   ├── compliance.json             # Compliance status data
│   ├── competitors.json            # 8 competitors (4 direct + 4 indirect) for monitoring
│   ├── compliance-records.json     # MOT + DBS records (expiry tracking)
│   ├── notifications.json          # Notification queue
│   ├── blog-drafts.json            # AI-generated blog drafts
│   ├── social-drafts.json          # AI-generated social media drafts
│   ├── proposed-fixes.json         # Remediation agent proposed fixes
│   ├── area-data/                  # Schools, hospitals, areas for SEO pages
│   └── reports/                    # Agent reports (security, seo, marketing, etc.)
├── pages/
│   ├── admin/
│   │   ├── index.astro             # Command Centre dashboard (metrics, actions, agent status)
│   │   ├── content.astro           # Blog creation + AI drafts + inline editor
│   │   ├── social.astro            # Social media drafts (LinkedIn + Facebook)
│   │   ├── pages.astro             # NL page updates
│   │   ├── approvals.astro         # Approval queue
│   │   ├── pricing.astro           # Pricing config (management only)
│   │   ├── conversions.astro       # Quote conversion tracking
│   │   ├── pricing-intelligence.astro  # AI pricing recommendations
│   │   ├── compliance-records.astro    # MOT + DBS record management + CSV import
│   │   ├── monitoring.astro        # 9-agent monitoring dashboard + proposed fixes + agent health tabs
│   │   └── notifications.astro     # Notification centre
│   ├── api/
│   │   ├── chat.ts                 # James AI chat endpoint
│   │   ├── tts.ts                  # OpenAI TTS proxy
│   │   ├── quote/estimate.ts       # Public quote estimation
│   │   ├── contact/submit.ts       # Contact form handler
│   │   ├── blog/create.ts          # Blog publish via GitHub
│   │   ├── ai/                     # AI endpoints (draft, page-edit, seo-generate)
│   │   └── admin/                  # Admin APIs (pricing, conversions, notifications, social, compliance-records, run-agent, etc.)
│   ├── areas/[slug].astro          # 25 dynamic area pages
│   ├── quote/index.astro           # Public quote wizard
│   └── compliance.astro            # Public compliance dashboard
├── components/
│   ├── ui/ChatWidget.astro         # James chat UI
│   ├── ui/ChatCharacter.astro      # Animated chauffeur SVG
│   └── [layout/, core/, content/, social-impact/, admin/, quote/]
scripts/
├── agent-utils.mjs                 # Shared: callHaiku, sendReportEmail, saveReport, createNotification, etc.
├── security-agent.mjs              # Daily 3am
├── seo-agent.mjs                   # Daily 4am
├── remediation-agent.mjs           # Daily 5am (generates Claude Code prompts, no AI)
├── performance-agent.mjs           # Daily 6am (no AI)
├── compliance-check-agent.mjs      # Daily 7am (no AI, pure date logic, expiry warnings)
├── marketing-agent.mjs             # Weekly Mon 7am (+ auto-drafts top 2 blog ideas)
├── competitor-agent.mjs            # Weekly Sun 9pm
├── market-research-agent.mjs       # Weekly Sun 10pm
├── meta-agent.mjs                  # Monthly 1st 8am (AI health check of all agents)
└── run-all-agents.mjs              # Run all/subset convenience
.github/workflows/                  # CI/CD + agent cron schedules
```

---

## 6. Admin Dashboard

Protected by Cloudflare Zero Trust. Primarily managed by Jay (jay@afjltd.co.uk) with AI-assisted workflows — no other department users currently needed.

| Role | Access |
|------|--------|
| Management (jay@afjltd.co.uk) | Full access — all pages, approvals, pricing, monitoring |

Department structure exists in departments.json for future use if needed, but current workflow is: AI agents generate recommendations/drafts → notifications sent to Jay → Jay reviews and approves/edits/rejects in admin portal. This single-operator + AI model eliminates the need for multi-user approval chains.

API security: all /api/admin/* check Cloudflare JWT or DASHBOARD_SECRET header.

---

## 7. Pricing Model

**Private hire:** Cost = (miles × costPerMile) + (hours × chargeOutRate) × passengerMultiplier
- costPerMile: £0.45, chargeOutRate: £17/hr, driverWage: £13/hr (margin visibility only)
- 6 vehicle tiers: 1-4, 5-8, 9-16, 17-24, 25-33, 34-48 with per-tier multipliers and minimums
- Three return types: Split (near base, gap ≥5hr), Wait (far/short gap), Separate (different day)
- Deadhead rolled into miles (charged when pickup >30mi from base)
- Surcharges: early morning, late night, Saturday, Sunday, bank holiday (stack additively)

**Airport:** Fixed-rate table (airportRates in quote-rules.json), not cost-per-mile

**Admin portal:** /admin/pricing — edit all parameters, preview impact before saving

---

## 8. Pricing Intelligence Pipeline

```
Website/Chat quotes → quote-log.jsonl → market-research-agent (weekly)
                                              ↓
                                    Haiku analysis → pricing-report.json
                                              ↓
                              /admin/pricing-intelligence (review + test)
                                              ↓
                              Approve → /api/admin/pricing → deploy
```

- /admin/conversions — track quote→booking conversion rates
- "Test This" — 5 standard journeys, side-by-side current vs recommended pricing

---

## 9. Monitoring Agents

| Agent | Schedule | AI | Email |
|-------|----------|-----|-------|
| Security | Daily 3am | Yes | Always |
| SEO | Daily 4am | Yes | Always |
| Remediation | Daily 5am | No | On fixes found |
| Performance | Daily 6am | No | Failures only |
| Compliance | Daily 7am | No | On expiring/expired |
| Marketing | Mon 7am | Yes | Always |
| Competitor | Sun 9pm | Yes | Always |
| Market Research | Sun 10pm | Yes | Via admin |
| Meta Agent | 1st of month 8am | Yes | Always |

Shared utils: scripts/agent-utils.mjs (callHaiku, sendReportEmail, saveReport, createNotification, gradeFromIssues, etc.)
Grading: A (no issues) → F (critical). Reports in src/data/reports/. History capped at 90 days.
SEO agent rewrites all sitemap URLs to match SITE_URL origin before crawling (Astro generates sitemaps with the production domain from `site` config, but the agent may run against staging).
Dashboard: /admin/monitoring — 9-agent card grid with expandable reports, grade history, Proposed Fixes tab, and Agent Health tab. Each card has a "Run Now" button to trigger the agent on-demand (POST /api/admin/run-agent, management only, 120s timeout, single-agent lock prevents overlapping runs). After execution, run-agent reads all output files from disk and batch-commits them to GitHub in a single commit via the Git Trees API (blobs → tree → commit → update ref). This ensures reports persist across Railway deploys and produces exactly 1 deployment per Run Now click.
Remediation reads security + SEO reports → pattern-matches HIGH/CRITICAL issues → generates plain English descriptions + ready-to-paste Claude Code prompts → stores in proposed-fixes.json. Admin copies prompt into Claude Code to fix safely. No AI, no auto-apply, no GitHub commits. Auto-resolves when issues disappear from reports. Deduplicates by title.
Compliance agent: pure date logic (no AI, no cost). Reads compliance-records.json, checks MOT/DBS expiry dates, creates notifications for items expiring within 30/14/7 days, weekly dedup.
Meta agent: reads all agent scripts + reports, AI analysis via Haiku (~£0.03/run), generates health assessments, recommendations, cost estimates.
Workflow commit step: all 9 agent workflows use a robust git conflict handler — stash, pull --rebase, stash pop, retry push with delay. Prevents failures when concurrent agents write to shared files (notifications.json, history.json).

---

## 10. Notification System

Live and hooked into all agents. Every system that needs admin attention routes through here.
- Types: blog-draft, pricing-recommendation, security-fix, seo-fix, compliance-expiry, social-draft, conversion-milestone, agent-critical
- Storage: src/data/notifications.json (capped at 200)
- Email via Resend on every notification (from noreply@afjltd.co.uk)
- Bell icon in admin header with unread badge + dropdown (latest 10)
- /admin/notifications — full list with type/status/priority filters, grouped by date, bulk mark-as-read
- API: GET/PUT /api/admin/notifications
- Agents create notifications via: createNotification() in agent-utils.mjs (standalone scripts) or src/lib/notifications.ts (Astro runtime)

---

## 11. James AI Chat Assistant

- Chat widget with animated SVG chauffeur character (4 moods)
- Auto-knowledge from website content (james-knowledge.ts)
- Voice input via Web Speech API (en-GB)
- OpenAI TTS (voice "ash") with browser fallback — currently returning 401 (permission issue)
- Quote calculator: collects journey details → [QUOTE_REQUEST:{json}] → calls estimateQuote() server-side
- Only exposes low/high to customer — never internal cost breakdowns
- Rate limiting: per-IP/min, per-IP/hr, global/hr
- Currently disabled while building other features

---

## 12. Environment Variables

```env
# Railway Production
SITE_URL=https://afj-staging.ascendtechgroup.co.uk
DASHBOARD_SECRET=                    # API endpoint auth
CF_ACCESS_AUD=                       # Cloudflare Zero Trust audience tag
CF_ACCESS_TEAM_DOMAIN=ascendtechafj  # Cloudflare team domain
GITHUB_TOKEN=                        # GitHub PAT (repo scope)
GITHUB_REPO=                         # owner/afj-website
LLM_PROVIDER=anthropic
LLM_MODEL=claude-haiku-4-5-20251001
LLM_API_KEY=                         # Anthropic API key
LLM_MAX_TOKENS=2048
OPENAI_API_KEY=                      # OpenAI (TTS only)
RESEND_API_KEY=                      # Resend.com
NOTIFICATION_EMAIL=jay.shakeel@gmail.com  # Temporary (go-live: jay@afjltd.co.uk)
WEB3FORMS_API_KEY=                   # Contact form

# GitHub Actions Secrets
LLM_API_KEY                          # Same Anthropic key
SITE_URL                             # https://afj-staging.ascendtechgroup.co.uk
RESEND_API_KEY                       # Same Resend key
NOTIFICATION_EMAIL                   # jay.shakeel@gmail.com
```

---

## 13. Coding Rules

1. `npm run build` must pass before committing
2. All /api/* return `{ success: boolean, data?, error? }` with proper HTTP status codes
3. Never expose internal errors to client
4. All AI calls through src/lib/llm.ts — never call APIs directly
5. All admin endpoints check CF JWT or DASHBOARD_SECRET + department permissions
6. Use src/lib/github.ts for all GitHub API operations
7. Images pre-optimized in public/images/ — no Astro image optimization
8. Commit messages: descriptive, present tense
9. Never force push to main
10. Test affected pages before committing (check component → page usage)

---

## 14. Troubleshooting

| Problem | Solution |
|---------|----------|
| Railway build OOM | Check image sizes in public/images/. No Astro image optimization. |
| Blog not appearing | Clear Railway cache. Check frontmatter (title, date, description, image required). |
| CF Zero Trust loop | Check access policy email domain. Ensure URL includes path prefix. |
| API returns 500 | Check Railway logs. Usually missing env var. |
| Agent email not sending | Check Resend logs. Domain verified: afjltd.co.uk, sender: noreply@afjltd.co.uk |
| Agent push conflict | Fixed: git pull --rebase before push in all workflows. |
| TTS returns 401 | OpenAI permission issue. Try "All" permissions on API key. |
