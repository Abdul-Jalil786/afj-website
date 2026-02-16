/**
 * Auto-builds James's knowledge base from website content.
 * Uses import.meta.glob(?raw) to read source files at Vite bundle time.
 * The SITE_KNOWLEDGE constant is baked into the server bundle.
 */

// ── JSON data imports ──
import areasRaw from '../data/area-data/areas.json';
import complianceRaw from '../data/compliance.json';
import quoteRulesRaw from '../data/quote-rules.json';

interface Area {
  name: string;
  council: string;
  distanceFromBirmingham: number;
  servicesAvailable: string[];
}
interface ComplianceItem {
  label: string;
  value: string;
  detail: string;
}

const areas = areasRaw as Area[];
const complianceItems = (complianceRaw as { items: ComplianceItem[] }).items;

// ── Raw file imports (Vite resolves at bundle time) ──
const astroPages = import.meta.glob(
  [
    '/src/pages/**/*.astro',
    '!/src/pages/admin/**',
    '!/src/pages/api/**',
    '!/src/pages/image-library.astro',
    '!/src/pages/content-calendar.astro',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

const blogFiles = import.meta.glob(
  '/src/content/blog/*.md',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

// ── Helpers ──

/** Strip HTML, SVG, Astro expressions -> plain text */
function strip(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[\s\S]*?\}/g, ' ')
    .replace(/&\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SKIP_RE =
  /^[\/\.@#]|^https?:|^mailto:|^tel:|schema\.org|stroke|viewBox|svg |path d|aria-|d="M|M\d+[\s,]|fill=|role=/;

/** Extract readable text from a raw .astro file, capped at maxLen */
function pageText(path: string, maxLen = 400): string {
  const content = astroPages[path] || '';
  if (!content) return '';

  const parts = content.split(/^---$/m);
  const fm = parts.length >= 3 ? parts[1] : '';
  const tpl = parts.length >= 3 ? parts.slice(2).join('---') : content;

  // String literals > 15 chars from frontmatter
  const strs: string[] = [];
  for (const m of fm.matchAll(/"([^"]{15,})"/g)) {
    if (!SKIP_RE.test(m[1])) strs.push(m[1]);
  }
  for (const m of fm.matchAll(/'([^']{15,})'/g)) {
    if (!SKIP_RE.test(m[1])) strs.push(m[1]);
  }

  const tplText = strip(tpl);
  const combined = [...new Set(strs)].join('. ') + ' ' + tplText;
  return combined.substring(0, maxLen).trim();
}

/** Extract FAQ Q&A pairs from a raw .astro file */
function faqPairs(path: string): string[] {
  const content = astroPages[path] || '';
  if (!content) return [];

  const qs = [...content.matchAll(/question:\s*'([^']+)'/g)].map((m) => m[1]);
  const as_ = [...content.matchAll(/answer:\s*'([^']+)'/g)].map((m) => m[1]);

  const out: string[] = [];
  for (let i = 0; i < Math.min(qs.length, as_.length); i++) {
    out.push(`Q: ${qs[i]}\nA: ${as_[i]}`);
  }
  return out;
}

// ── Build knowledge string ──

function build(): string {
  const s: string[] = [];

  if (Object.keys(astroPages).length === 0) {
    console.warn('james-knowledge: No .astro pages found via glob — knowledge base will be limited');
  }

  // COMPANY
  s.push('=== COMPANY ===');
  s.push(pageText('/src/pages/about.astro', 500));

  // CONTACT
  s.push('\n=== CONTACT ===');
  s.push(pageText('/src/pages/contact.astro', 400));

  // SERVICES
  s.push('\n=== SERVICES ===');
  const svcs: [string, string][] = [
    ['/src/pages/services/send-transport.astro', 'Home to School Transport (SEND)'],
    ['/src/pages/services/patient-transport.astro', 'Non-Emergency Patient Transport (NEPTS)'],
    ['/src/pages/services/fleet-maintenance.astro', 'Fleet Maintenance'],
    ['/src/pages/services/vehicle-conversions.astro', 'Vehicle Conversions'],
    ['/src/pages/services/driver-training.astro', 'Driver, ACA & PA Training'],
    ['/src/pages/services/private-hire.astro', 'Private Minibus Hire'],
    ['/src/pages/services/executive-minibus.astro', 'Executive Minibus Hire'],
    ['/src/pages/services/airport-transfers.astro', 'Airport Transfers'],
  ];
  for (const [path, label] of svcs) {
    const url = path.replace('/src/pages', '').replace('.astro', '');
    s.push(`\n[${label}] (${url})\n${pageText(path, 350)}`);
  }

  // OTHER PAGES
  s.push('\n=== OTHER PAGES ===');
  const handled = new Set([
    '/src/pages/about.astro',
    '/src/pages/contact.astro',
    '/src/pages/faq.astro',
    '/src/pages/careers.astro',
    '/src/pages/vehicles-for-sale.astro',
    ...svcs.map(([p]) => p),
  ]);
  for (const [path] of Object.entries(astroPages)) {
    if (handled.has(path)) continue;
    if (path.includes('/areas/')) continue; // area data comes from JSON
    if (path.includes('/services/index')) continue; // covered by service list
    const url = path.replace('/src/pages', '').replace('.astro', '').replace(/\/index$/, '') || '/';
    const text = pageText(path, 250);
    if (text.length > 30) s.push(`[${url}] ${text}`);
  }

  // FAQ
  s.push('\n=== FAQ ===');
  s.push(...faqPairs('/src/pages/faq.astro'));
  for (const [path] of svcs) s.push(...faqPairs(path));
  s.push(...faqPairs('/src/pages/contact.astro'));

  // COMPLIANCE
  s.push('\n=== COMPLIANCE ===');
  for (const item of complianceItems) {
    s.push(`${item.label}: ${item.value} (${item.detail})`);
  }

  // AREAS
  s.push('\n=== AREAS SERVED ===');
  for (const a of areas) {
    s.push(
      `${a.name} (${a.council}, ${a.distanceFromBirmingham}mi): ${a.servicesAvailable.join(', ')}`,
    );
  }

  // CAREERS
  s.push('\n=== CAREERS ===');
  s.push(pageText('/src/pages/careers.astro', 300));

  // VEHICLES FOR SALE
  s.push('\n=== VEHICLES FOR SALE ===');
  s.push(pageText('/src/pages/vehicles-for-sale.astro', 300));

  // QUOTE WIZARD
  s.push('\n=== QUOTE WIZARD ===');
  s.push('Instant quotes at /quote for: Private Minibus Hire, Airport Transfers.');
  s.push('Enterprise services (SEND, NEPTS, Executive, Fleet) — contact for quote.');
  const airports = ((quoteRulesRaw as any).services?.airport?.questions || [])
    .find((q: any) => q.id === 'airport')
    ?.options?.map((o: any) => o.label) || [];
  if (airports.length) s.push(`Airports: ${airports.join(', ')}`);

  // BLOG
  s.push('\n=== BLOG ===');
  for (const content of Object.values(blogFiles)) {
    const t = content.match(/title:\s*"([^"]+)"/);
    if (t) s.push(`- ${t[1]}`);
  }

  return s.join('\n');
}

export const SITE_KNOWLEDGE = build();
