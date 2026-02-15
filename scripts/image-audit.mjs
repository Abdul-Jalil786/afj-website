#!/usr/bin/env node

/**
 * Image Optimization Audit Script
 *
 * Scans public/images/ for files exceeding 500 KB.
 * Optionally creates WebP versions using sharp.
 *
 * Usage:
 *   node scripts/image-audit.mjs              # Report only
 *   node scripts/image-audit.mjs --convert    # Report + create WebP copies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');
const THRESHOLD_BYTES = 512_000; // 500 KB
const CONVERT = process.argv.includes('--convert');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff']);

function walkDir(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

function formatBytes(bytes) {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

async function run() {
  console.log('=== AFJ Image Optimization Audit ===\n');

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Images directory not found: ${IMAGES_DIR}`);
    process.exit(1);
  }

  const allFiles = walkDir(IMAGES_DIR);
  const imageFiles = allFiles.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return IMAGE_EXTENSIONS.has(ext) || ext === '.webp';
  });

  console.log(`Total image files: ${imageFiles.length}\n`);

  // Gather stats
  const oversized = [];
  let totalSize = 0;

  for (const file of imageFiles) {
    const stat = fs.statSync(file);
    totalSize += stat.size;
    if (stat.size > THRESHOLD_BYTES) {
      oversized.push({
        path: path.relative(ROOT, file),
        size: stat.size,
        ext: path.extname(file).toLowerCase(),
      });
    }
  }

  oversized.sort((a, b) => b.size - a.size);

  // Report
  console.log(`Total image size: ${formatBytes(totalSize)}`);
  console.log(`Files over 500 KB: ${oversized.length}\n`);

  if (oversized.length === 0) {
    console.log('All images are under 500 KB. No action needed.');
    return;
  }

  // Critical (> 2 MB) - CLAUDE.md says remove to avoid Railway OOM
  const critical = oversized.filter(f => f.size > 2_097_152);
  const large = oversized.filter(f => f.size > 1_048_576 && f.size <= 2_097_152);
  const moderate = oversized.filter(f => f.size <= 1_048_576);

  if (critical.length > 0) {
    console.log('--- CRITICAL (> 2 MB — may cause Railway build OOM) ---');
    for (const f of critical) {
      console.log(`  ${formatBytes(f.size).padStart(10)}  ${f.path}`);
    }
    console.log();
  }

  if (large.length > 0) {
    console.log('--- LARGE (1-2 MB) ---');
    for (const f of large) {
      console.log(`  ${formatBytes(f.size).padStart(10)}  ${f.path}`);
    }
    console.log();
  }

  if (moderate.length > 0) {
    console.log(`--- MODERATE (500 KB - 1 MB) — ${moderate.length} files ---`);
    for (const f of moderate) {
      console.log(`  ${formatBytes(f.size).padStart(10)}  ${f.path}`);
    }
    console.log();
  }

  // Summary
  const savingsEstimate = oversized
    .filter(f => f.ext !== '.webp')
    .reduce((sum, f) => sum + f.size * 0.6, 0); // WebP typically saves ~60%

  console.log('--- SUMMARY ---');
  console.log(`  Oversized files:       ${oversized.length}`);
  console.log(`  Already WebP:          ${oversized.filter(f => f.ext === '.webp').length}`);
  console.log(`  Convertible to WebP:   ${oversized.filter(f => f.ext !== '.webp').length}`);
  console.log(`  Est. savings (WebP):   ~${formatBytes(savingsEstimate)}`);
  console.log();

  // Convert if requested
  if (CONVERT) {
    const convertible = oversized.filter(f => f.ext !== '.webp');
    if (convertible.length === 0) {
      console.log('All oversized files are already WebP. Nothing to convert.');
      return;
    }

    let sharp;
    try {
      sharp = (await import('sharp')).default;
    } catch {
      console.error('sharp is not installed. Run: npm install sharp');
      process.exit(1);
    }

    console.log(`Converting ${convertible.length} files to WebP...\n`);
    let converted = 0;
    let totalSaved = 0;

    for (const file of convertible) {
      const inputPath = path.join(ROOT, file.path);
      const outputPath = inputPath.replace(/\.[^.]+$/, '.webp');

      // Skip if WebP already exists
      if (fs.existsSync(outputPath)) {
        console.log(`  SKIP (exists)  ${file.path}`);
        continue;
      }

      try {
        await sharp(inputPath)
          .webp({ quality: 80 })
          .toFile(outputPath);

        const newSize = fs.statSync(outputPath).size;
        const saved = file.size - newSize;
        totalSaved += saved;
        converted++;

        console.log(
          `  OK  ${formatBytes(file.size)} -> ${formatBytes(newSize)} (saved ${formatBytes(saved)})  ${file.path}`
        );
      } catch (err) {
        console.log(`  FAIL  ${file.path}: ${err.message}`);
      }
    }

    console.log(`\nConverted: ${converted} files`);
    console.log(`Total saved: ${formatBytes(totalSaved)}`);
    console.log('\nNote: Original files preserved. Update src references to use .webp versions,');
    console.log('then delete the originals when confirmed.');
  } else {
    console.log('Run with --convert to create WebP versions of oversized images.');
  }
}

run().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
