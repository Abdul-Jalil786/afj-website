#!/usr/bin/env node
/**
 * Download media files from WordPress export CSV
 * Usage: node scripts/download-media.js
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync, createWriteStream } from 'fs';
import { join, extname } from 'path';
import { get as httpsGet } from 'https';
import { get as httpGet } from 'http';

const ROOT = join(import.meta.dirname, '..');
const CSV_PATH = join(ROOT, 'wordpress-export', 'media-urls.csv');
const ASSETS_DIR = join(ROOT, 'src', 'assets', 'images');
const PUBLIC_DOCS = join(ROOT, 'public', 'documents');

// Image categorisation rules — maps filename patterns to folders
const CATEGORIES = [
  // Logos
  { pattern: /^(afj-logo|afjltdlogos|logo)\b/i, folder: 'logo' },
  // Hero images
  { pattern: /^(homeToSchool|nEmer|FleetSM|privatesmAFj|convertionAFJ|afj)\b/i, folder: 'hero' },
  { pattern: /^(Group-112|alkdu73|Group123)/i, folder: 'hero' },
  // Accreditation badges
  { pattern: /^(CQC|BCC|MCC|LCC|WCC|SCC|TBC|TBCC|OCC|NWAS|CnW|Finalist_Service|tameside)/i, folder: 'accreditations' },
  // About section
  { pattern: /^(Core-value|Mission|Vision|Quality-begins)/i, folder: 'about' },
  // Team photos
  { pattern: /^(Image-[1-4]|IMG_0062|IMG_0046|IMG_0044|IMG_0028)/i, folder: 'team' },
  // Fleet/vehicles
  { pattern: /^(mbs1|IMG_4420|IMG_4309|IMG_4438|IMG_0077|IMG_0076|IMG_0067|IMG_0043|IMG_0033|20231)/i, folder: 'fleet' },
  // Service images
  { pattern: /^(Untitled-design|Maintenance|Private-Hire|Privateasd|Convkhgersion|Mask-Group|NoPath)/i, folder: 'services' },
  // Icons
  { pattern: /\.(svg)$/i, folder: 'icons' },
  // Blog featured images
  { pattern: /^(Tackling-Hospital|Greener-Roads|Key-Factors|Rising-Demand|Role-of-Technology|Navigating-the-challenges|WhatsApp-Image-2025)/i, folder: 'blog' },
  { pattern: /^(1730980756373|1729868555014|2024311_85132)/i, folder: 'blog' },
];

// Files to skip (oversized SVGs, duplicates, WordPress crops)
const SKIP_PATTERNS = [
  /www\.afjltd\.co_\.uk.*\.svg$/i,  // 6-7MB SVGs
  /A-Safe-Reliable-Fleet-1\.svg$/i, // 7MB SVG
  /^2\.svg$/i,                       // 3MB SVG
  /^1\.svg$/i,                       // 1MB SVG
  /tube-spinner\.svg$/i,             // loading spinner
];

// PDF files to copy to public/documents
const PDF_RENAMES = {
  'HTS-2.pdf': 'afj-brochure.pdf',
  'Copy-of-AFJ-Maintenance-service-1.pdf': 'maintenance-service.pdf',
  'AFJ_Carbon_Reduction_Plan.pdf': 'carbon-reduction-plan.pdf',
};

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = parseCSVLine(lines[0]);
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const record = {};
    headers.forEach((h, idx) => {
      record[h.trim().replace(/^\uFEFF/, '')] = (values[idx] || '').trim();
    });
    records.push(record);
  }
  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function categorise(filename) {
  for (const { pattern, folder } of CATEGORIES) {
    if (pattern.test(filename)) return folder;
  }
  return 'misc';
}

function shouldSkip(filename) {
  return SKIP_PATTERNS.some(p => p.test(filename));
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const getter = url.startsWith('https') ? httpsGet : httpGet;
    getter(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }
      const stream = createWriteStream(destPath);
      response.pipe(stream);
      stream.on('finish', () => { stream.close(); resolve(); });
      stream.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Reading media CSV...');
  const csv = readFileSync(CSV_PATH, 'utf-8');
  const records = parseCSV(csv);

  console.log(`Found ${records.length} media records`);

  // Ensure directories exist
  const folders = ['logo', 'hero', 'fleet', 'team', 'services', 'accreditations', 'blog', 'about', 'icons', 'misc'];
  for (const folder of folders) {
    mkdirSync(join(ASSETS_DIR, folder), { recursive: true });
  }
  mkdirSync(PUBLIC_DOCS, { recursive: true });

  let downloaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const record of records) {
    const url = record['URL'];
    const filename = record['File Name'];
    const type = record['Type'] || '';

    if (!url || !filename) {
      skipped++;
      continue;
    }

    // Handle PDFs
    if (type.includes('pdf') || filename.endsWith('.pdf')) {
      const newName = PDF_RENAMES[filename];
      if (newName) {
        const dest = join(PUBLIC_DOCS, newName);
        if (!existsSync(dest)) {
          try {
            console.log(`  PDF: ${filename} → ${newName}`);
            await downloadFile(url, dest);
            downloaded++;
          } catch (e) {
            console.error(`  ERROR downloading ${filename}: ${e.message}`);
            errors++;
          }
        } else {
          console.log(`  SKIP (exists): ${newName}`);
          skipped++;
        }
      }
      continue;
    }

    // Skip non-image files (docx, etc.)
    if (type.includes('document') || type.includes('officedocument')) {
      skipped++;
      continue;
    }

    // Skip oversized/unwanted files
    if (shouldSkip(filename)) {
      console.log(`  SKIP (pattern): ${filename}`);
      skipped++;
      continue;
    }

    const folder = categorise(filename);
    const dest = join(ASSETS_DIR, folder, filename);

    if (existsSync(dest)) {
      skipped++;
      continue;
    }

    try {
      console.log(`  ${folder}/${filename}`);
      await downloadFile(url, dest);
      downloaded++;
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 100));
    } catch (e) {
      console.error(`  ERROR: ${filename} — ${e.message}`);
      errors++;
    }
  }

  console.log(`\nDone! Downloaded: ${downloaded}, Skipped: ${skipped}, Errors: ${errors}`);

  // Copy logos from wordpress-export/ to src/assets/images/logo/
  const wpExport = join(ROOT, 'wordpress-export');
  const logoSrc = join(wpExport, 'afj-logo-final.png');
  const logoDest = join(ASSETS_DIR, 'logo', 'afj-logo-final.png');
  if (existsSync(logoSrc) && !existsSync(logoDest)) {
    writeFileSync(logoDest, readFileSync(logoSrc));
    console.log('Copied afj-logo-final.png to logo/');
  }

  const logoWebpSrc = join(wpExport, 'logo.webp');
  const logoWebpDest = join(ASSETS_DIR, 'logo', 'logo.webp');
  if (existsSync(logoWebpSrc) && !existsSync(logoWebpDest)) {
    writeFileSync(logoWebpDest, readFileSync(logoWebpSrc));
    console.log('Copied logo.webp to logo/');
  }
}

main().catch(console.error);
