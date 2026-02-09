#!/usr/bin/env node
/**
 * Migrate WordPress blog posts from XML export to Astro Markdown content collection.
 * Parses Gutenberg block HTML → clean Markdown with frontmatter.
 *
 * Usage: node scripts/migrate-wordpress.js
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const XML_PATH = join(ROOT, 'wordpress-export', 'afjlimited.WordPress.2026-02-09.xml');
const BLOG_DIR = join(ROOT, 'src', 'content', 'blog');

// Featured image mapping — WordPress attachment IDs to descriptive filenames
const FEATURED_IMAGES = {
  'businesses-changing-lives-through-csr': '../assets/images/blog/businesses-csr.webp',
  'failsworth-transport-firm-helps-in-fight-against-loan-sharks': '../assets/images/blog/loan-sharks-awareness.webp',
  '5-keys-to-reliable-home-to-school-transport-in-the-uk': '../assets/images/blog/home-to-school-transport-keys.webp',
  'understanding-nepts': '../assets/images/blog/nepts-guide.webp',
  'the-group-travel-game-changer': '../assets/images/blog/private-minibus-hire.webp',
  'care-home-funding-grants': '../assets/images/blog/care-home-funding.webp',
  'finalist-at-the-prestigious': '../assets/images/blog/midlands-business-awards.webp',
  'swift-mobilisation': '../assets/images/blog/swift-mobilisation.webp',
  'why-proactive-maintenance': '../assets/images/blog/proactive-maintenance.webp',
  'navigating-the-challenges-of-staff-retention': '../assets/images/blog/staff-retention-transport.webp',
  'the-role-of-technology': '../assets/images/blog/technology-transport-safety.webp',
  'the-rising-demand-for-wheelchair': '../assets/images/blog/wheelchair-accessible-vehicles.webp',
  'what-councils-look-for': '../assets/images/blog/councils-hts-providers.webp',
  'the-environmental-impact': '../assets/images/blog/environmental-vehicle-maintenance.webp',
  'the-hidden-crisis': '../assets/images/blog/hospital-discharges.webp',
  'why-driver-and-passenger': '../assets/images/blog/driver-pa-training.webp',
};

function extractItems(xml, postType, status = 'publish') {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const typeMatch = itemXml.match(/<wp:post_type><!\[CDATA\[(.*?)\]\]><\/wp:post_type>/);
    const statusMatch = itemXml.match(/<wp:status><!\[CDATA\[(.*?)\]\]><\/wp:status>/);

    if (!typeMatch || typeMatch[1] !== postType) continue;
    if (!statusMatch || statusMatch[1] !== status) continue;

    const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
    const slugMatch = itemXml.match(/<wp:post_name><!\[CDATA\[(.*?)\]\]><\/wp:post_name>/);
    const dateMatch = itemXml.match(/<wp:post_date><!\[CDATA\[(.*?)\]\]><\/wp:post_date>/);
    const idMatch = itemXml.match(/<wp:post_id>(\d+)<\/wp:post_id>/);
    const contentMatch = itemXml.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);

    // Extract categories and tags
    const categories = [];
    const tags = [];
    const catRegex = /<category domain="(category|post_tag)"[^>]*><!\[CDATA\[(.*?)\]\]><\/category>/g;
    let catMatch;
    while ((catMatch = catRegex.exec(itemXml)) !== null) {
      if (catMatch[1] === 'category') categories.push(catMatch[2]);
      else tags.push(catMatch[2]);
    }

    items.push({
      title: titleMatch ? titleMatch[1] : 'Untitled',
      slug: slugMatch ? slugMatch[1] : '',
      date: dateMatch ? dateMatch[1] : '',
      id: idMatch ? parseInt(idMatch[1]) : 0,
      content: contentMatch ? contentMatch[1] : '',
      categories,
      tags,
    });
  }

  return items;
}

function stripGutenbergComments(html) {
  // Remove Gutenberg block comments
  return html.replace(/<!--\s*\/?wp:\w+[^>]*-->/g, '');
}

function htmlToMarkdown(html) {
  let md = html;

  // Strip Gutenberg comments first
  md = stripGutenbergComments(md);

  // Convert headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');
  md = md.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n##### $1\n');
  md = md.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n###### $1\n');

  // Convert links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Convert bold/italic
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');

  // Convert lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
    return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
  });
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    let i = 0;
    return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, liContent) => {
      i++;
      return `${i}. ${liContent}\n`;
    });
  });

  // Convert images
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

  // Convert blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
    return content.split('\n').map(line => `> ${line}`).join('\n');
  });

  // Convert paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');

  // Convert line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Remove remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#8217;/g, "'");
  md = md.replace(/&#8216;/g, "'");
  md = md.replace(/&#8220;/g, '"');
  md = md.replace(/&#8221;/g, '"');
  md = md.replace(/&#8211;/g, '–');
  md = md.replace(/&#8212;/g, '—');
  md = md.replace(/&#038;/g, '&');
  md = md.replace(/&nbsp;/g, ' ');

  // Clean up excessive whitespace
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.trim();

  return md;
}

function generateDescription(title, content) {
  // Create a description under 155 chars from the first paragraph
  const firstPara = content.split('\n\n').find(p => p.trim().length > 50);
  if (firstPara) {
    const clean = firstPara.replace(/[#*\[\]()]/g, '').trim();
    if (clean.length <= 155) return clean;
    return clean.substring(0, 152) + '...';
  }
  return `${title} — AFJ Limited blog post about transport services in Birmingham.`;
}

function formatDate(dateStr) {
  // WordPress format: 2024-03-12 13:41:25
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function main() {
  console.log('Reading WordPress XML export...');
  const xml = readFileSync(XML_PATH, 'utf-8');

  console.log('Extracting published posts...');
  const posts = extractItems(xml, 'post');

  console.log(`Found ${posts.length} published posts`);

  mkdirSync(BLOG_DIR, { recursive: true });

  for (const post of posts) {
    const markdown = htmlToMarkdown(post.content);
    const description = generateDescription(post.title, markdown);
    const date = formatDate(post.date);
    const image = FEATURED_IMAGES[post.slug] || Object.entries(FEATURED_IMAGES).find(([key]) => post.slug.startsWith(key))?.[1] || '';
    const allTags = [...new Set([...post.tags, ...post.categories.filter(c => c !== 'Uncategorized')])];

    const frontmatter = [
      '---',
      `title: "${post.title.replace(/"/g, '\\"')}"`,
      `description: "${description.replace(/"/g, '\\"')}"`,
      `pubDate: ${date}`,
      `author: "AFJ Limited"`,
      image ? `image: "${image}"` : '',
      image ? `imageAlt: "${post.title.replace(/"/g, '\\"')}"` : '',
      `tags: [${allTags.map(t => `"${t}"`).join(', ')}]`,
      `draft: false`,
      '---',
    ].filter(Boolean).join('\n');

    const fileContent = `${frontmatter}\n\n${markdown}\n`;
    const filePath = join(BLOG_DIR, `${post.slug}.md`);

    writeFileSync(filePath, fileContent, 'utf-8');
    console.log(`  ✓ ${post.slug}.md (${markdown.length} chars)`);
  }

  console.log(`\nMigrated ${posts.length} blog posts to ${BLOG_DIR}`);

  // Also extract page content summaries for reference
  console.log('\nExtracting published pages for reference...');
  const pages = extractItems(xml, 'page');
  console.log(`Found ${pages.length} published pages:`);
  for (const page of pages) {
    const contentLen = page.content.length;
    const hasElementor = page.content.includes('elementor') || page.content.includes('data-widget_type');
    const hasGutenberg = page.content.includes('<!-- wp:');
    const type = hasElementor ? 'Elementor' : hasGutenberg ? 'Gutenberg' : contentLen < 100 ? 'Empty/Minimal' : 'HTML';
    console.log(`  ID:${page.id} "${page.title}" (${page.slug}) — ${contentLen} chars — ${type}`);
  }
}

main();
