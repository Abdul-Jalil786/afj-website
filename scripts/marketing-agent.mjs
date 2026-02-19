#!/usr/bin/env node

/**
 * Marketing Agent — Weekly Monday 7:00 UTC
 *
 * AI-powered: content gap analysis, content review/suggestions,
 * social media post ideas, newsletter topic recommendations.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  SITE_URL, API_KEY, callHaiku, parseAIJSON,
  saveReport, updateHistory, gradeFromIssues,
  sendReportEmail, reportHeader, reportFooter,
  createNotification,
} from './agent-utils.mjs';

const ROOT = process.cwd();

// ── Gather site data ──

function loadBlogPosts() {
  const blogDir = join(ROOT, 'src', 'content', 'blog');
  if (!existsSync(blogDir)) return [];

  try {
    const files = readdirSync(blogDir).filter(f => f.endsWith('.md'));
    return files.map(f => {
      const content = readFileSync(join(blogDir, f), 'utf-8');
      const titleMatch = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
      const dateMatch = content.match(/^date:\s*["']?(.+?)["']?\s*$/m);
      const descMatch = content.match(/^description:\s*["']?(.+?)["']?\s*$/m);
      return {
        slug: f.replace('.md', ''),
        title: titleMatch?.[1] || f,
        date: dateMatch?.[1] || 'unknown',
        description: descMatch?.[1] || '',
      };
    });
  } catch {
    return [];
  }
}

function loadServices() {
  const servicesDir = join(ROOT, 'src', 'pages', 'services');
  if (!existsSync(servicesDir)) return [];

  try {
    return readdirSync(servicesDir)
      .filter(f => f.endsWith('.astro') && f !== 'index.astro')
      .map(f => f.replace('.astro', ''));
  } catch {
    return [];
  }
}

function loadAreaPages() {
  const areasFile = join(ROOT, 'src', 'data', 'area-data', 'areas.json');
  if (!existsSync(areasFile)) return [];
  try {
    return JSON.parse(readFileSync(areasFile, 'utf-8'));
  } catch {
    return [];
  }
}

function loadContentCalendar() {
  const calPath = join(ROOT, 'seo', 'content-calendar.csv');
  if (!existsSync(calPath)) return [];
  try {
    const csv = readFileSync(calPath, 'utf-8');
    return csv.trim().split('\n').slice(1); // skip header
  } catch {
    return [];
  }
}

// ── Main ──

async function run() {
  console.log('Marketing Agent starting...');
  const now = new Date();

  if (!API_KEY) {
    console.error('LLM API key required for marketing agent');
    process.exit(1);
  }

  // Gather data
  const blogPosts = loadBlogPosts();
  const services = loadServices();
  const areas = loadAreaPages();
  const calendar = loadContentCalendar();

  // Sort blogs by date to find freshness
  const sortedBlogs = [...blogPosts].sort((a, b) => b.date.localeCompare(a.date));
  const latestBlog = sortedBlogs[0];
  const daysSinceLastBlog = latestBlog
    ? Math.floor((now.getTime() - new Date(latestBlog.date).getTime()) / 86400000)
    : 999;

  console.log(`Blog posts: ${blogPosts.length}, Services: ${services.length}, Areas: ${areas.length}`);
  console.log(`Days since last blog: ${daysSinceLastBlog}`);

  // AI analysis
  const raw = await callHaiku(
    `You are a marketing strategist for AFJ Limited (${SITE_URL}), a UK transport company based in Birmingham.
Services: SEND school transport, non-emergency patient transport (NEPTS), private minibus hire, airport transfers, executive hire, fleet maintenance, driver training, vehicle conversions.
Clients: Birmingham City Council, Manchester City Council, Sandwell Council, NHS trusts, schools, private customers.
2,000+ students daily, 47+ drivers.

Analyse the current content and provide marketing recommendations.
Output ONLY valid JSON:
{
  "contentGaps": [{ "topic": "...", "reason": "...", "priority": "high|medium|low" }],
  "blogIdeas": [{ "title": "...", "targetKeywords": ["..."], "angle": "..." }],
  "socialMediaPosts": [{ "platform": "linkedin|facebook", "content": "...", "cta": "..." }],
  "newsletterTopics": [{ "subject": "...", "summary": "..." }],
  "contentFreshness": { "assessment": "...", "recommendation": "..." },
  "overallAssessment": "1-2 paragraph summary"
}`,
    JSON.stringify({
      currentBlogPosts: sortedBlogs.slice(0, 20).map(b => ({ title: b.title, date: b.date })),
      totalBlogPosts: blogPosts.length,
      daysSinceLastBlog,
      services,
      areasCount: areas.length,
      contentCalendarEntries: calendar.length,
      currentDate: now.toISOString().split('T')[0],
    }, null, 2),
  );

  let analysis;
  try {
    analysis = parseAIJSON(raw);
  } catch (err) {
    console.error('Failed to parse AI response:', err.message);
    analysis = {
      contentGaps: [],
      blogIdeas: [],
      socialMediaPosts: [],
      newsletterTopics: [],
      contentFreshness: { assessment: 'Unable to assess', recommendation: 'Run agent again' },
      overallAssessment: 'AI analysis failed to produce structured output.',
    };
  }

  // Grade based on content freshness and gaps
  let medium = 0;
  let low = 0;
  if (daysSinceLastBlog > 30) medium++;
  if (daysSinceLastBlog > 60) medium++;
  if (blogPosts.length < 10) low++;
  if ((analysis.contentGaps || []).filter(g => g.priority === 'high').length > 2) medium++;

  const grade = gradeFromIssues(0, 0, medium, low);

  // Build report
  const report = {
    generatedAt: now.toISOString(),
    agent: 'marketing',
    grade,
    blogCount: blogPosts.length,
    daysSinceLastBlog,
    servicesCount: services.length,
    areasCount: areas.length,
    contentGaps: analysis.contentGaps || [],
    blogIdeas: analysis.blogIdeas || [],
    socialMediaPosts: analysis.socialMediaPosts || [],
    newsletterTopics: analysis.newsletterTopics || [],
    contentFreshness: analysis.contentFreshness || {},
    overallAssessment: analysis.overallAssessment || '',
  };

  saveReport('marketing-report.json', report);
  updateHistory('marketing', grade, `${blogPosts.length} posts, ${daysSinceLastBlog}d since last`);

  // Auto-draft top 2 blog ideas
  const blogIdeas = (analysis.blogIdeas || []).slice(0, 2);
  if (blogIdeas.length > 0 && API_KEY) {
    console.log(`Auto-drafting ${blogIdeas.length} blog posts...`);
    for (const idea of blogIdeas) {
      try {
        const draftContent = await callHaiku(
          `You are a content writer for AFJ Limited, a Birmingham-based UK transport company.
Services: SEND school transport, NEPTS, private minibus hire, airport transfers, executive hire, fleet maintenance, driver training, vehicle conversions.
2,000+ students daily, 47+ drivers, 18+ years of service.

Write a blog post in markdown format.

Requirements:
- 600-800 words
- Professional but approachable British English tone
- Include the target keyword naturally 3-5 times
- Structure: engaging intro, 3-4 subheadings with content, conclusion with CTA
- CTA should direct readers to contact AFJ or use the quote wizard at /quote
- Mention Birmingham and Manchester where relevant
- Include relevant AFJ services
- Do NOT make up statistics or quotes
- Output ONLY the markdown content (no frontmatter)`,
          `Topic: ${idea.title}\nTarget keyword: ${(idea.targetKeywords || []).join(', ') || idea.title}\nAngle: ${idea.angle || 'General informational'}`
        );

        // Save draft
        const draftsPath = join(ROOT, 'src', 'data', 'blog-drafts.json');
        let draftsStore = { drafts: [] };
        if (existsSync(draftsPath)) {
          try { draftsStore = JSON.parse(readFileSync(draftsPath, 'utf-8')); } catch { draftsStore = { drafts: [] }; }
        }

        const draftId = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
        const wordCount = draftContent.split(/\s+/).length;
        const draft = {
          id: draftId,
          title: idea.title,
          keyword: (idea.targetKeywords || []).join(', ') || '',
          content: draftContent,
          status: 'draft',
          createdAt: new Date().toISOString().split('T')[0],
          source: 'marketing-agent',
          editHistory: [],
          publishedAt: null,
          publishedSlug: null,
        };

        draftsStore.drafts.push(draft);
        writeFileSync(draftsPath, JSON.stringify(draftsStore, null, 2) + '\n', 'utf-8');
        console.log(`Blog draft saved: ${idea.title}`);

        // Create notification
        createNotification({
          type: 'blog-draft',
          title: `New blog draft: ${idea.title}`,
          summary: `AI wrote a ${wordCount}-word post targeting '${draft.keyword || idea.title}'. Ready for review.`,
          actionUrl: `/admin/content?draft=${draftId}`,
          priority: 'medium',
        });
      } catch (err) {
        console.error(`Failed to draft blog "${idea.title}":`, err.message);
      }
    }
  }

  // Email report
  const emailHtml = `
    ${reportHeader('Weekly Marketing Report', grade, now.toISOString().split('T')[0])}
    <h3>Content Stats</h3>
    <table style="width:100%;border-collapse:collapse;margin:12px 0">
      <tr><td style="padding:8px 12px;border:1px solid #e5e7eb"><strong>Blog posts</strong></td><td style="padding:8px 12px;border:1px solid #e5e7eb">${blogPosts.length}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e5e7eb"><strong>Days since last blog</strong></td><td style="padding:8px 12px;border:1px solid #e5e7eb;${daysSinceLastBlog > 30 ? 'color:#ea580c;font-weight:bold' : ''}">${daysSinceLastBlog}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e5e7eb"><strong>Service pages</strong></td><td style="padding:8px 12px;border:1px solid #e5e7eb">${services.length}</td></tr>
      <tr><td style="padding:8px 12px;border:1px solid #e5e7eb"><strong>Area pages</strong></td><td style="padding:8px 12px;border:1px solid #e5e7eb">${areas.length}</td></tr>
    </table>

    <h3>Content Gaps</h3>
    <ul>
      ${(analysis.contentGaps || []).map(g => `<li><strong>[${g.priority}]</strong> ${g.topic} — ${g.reason}</li>`).join('') || '<li>No gaps identified</li>'}
    </ul>

    <h3>Blog Ideas</h3>
    <ol>
      ${(analysis.blogIdeas || []).slice(0, 5).map(b => `<li><strong>${b.title}</strong><br><em>Keywords: ${(b.targetKeywords || []).join(', ')}</em><br>${b.angle}</li>`).join('') || '<li>No ideas generated</li>'}
    </ol>

    <h3>Social Media Posts</h3>
    <ul>
      ${(analysis.socialMediaPosts || []).slice(0, 4).map(s => `<li><strong>[${s.platform}]</strong> ${s.content.slice(0, 150)}${s.content.length > 150 ? '...' : ''}</li>`).join('') || '<li>No posts suggested</li>'}
    </ul>

    <h3>Assessment</h3>
    <p>${analysis.overallAssessment || 'No assessment available.'}</p>
    ${reportFooter()}
  `;
  await sendReportEmail(`[AFJ Marketing] Grade ${grade} — ${now.toISOString().split('T')[0]}`, emailHtml);

  console.log(`Marketing Agent complete — Grade: ${grade}`);
}

run()
  .then(() => process.exit(0))
  .catch(err => { console.error('Marketing Agent failed:', err.message); process.exit(1); });
