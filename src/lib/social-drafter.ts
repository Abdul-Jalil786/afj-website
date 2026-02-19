/**
 * Social Media Auto-Drafter
 *
 * Generates LinkedIn and Facebook post drafts using the LLM abstraction layer.
 * Auto-drafts when a blog post is published, or manually via admin page.
 *
 * Storage: src/data/social-drafts.json
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { generateText } from './llm';

export interface SocialDraft {
  id: string;
  platform: 'linkedin' | 'facebook';
  content: string;
  blogSlug: string | null;
  blogTitle: string | null;
  status: 'draft' | 'approved' | 'published' | 'rejected';
  createdAt: string;
  publishedAt: string | null;
  editedContent: string | null;
}

interface SocialDraftsStore {
  drafts: SocialDraft[];
}

const STORE_PATH = join(process.cwd(), 'src', 'data', 'social-drafts.json');

async function readStore(): Promise<SocialDraftsStore> {
  try {
    const raw = await readFile(STORE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { drafts: [] };
  }
}

async function writeStore(store: SocialDraftsStore): Promise<void> {
  await mkdir(join(process.cwd(), 'src', 'data'), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2) + '\n', 'utf-8');
}

function generateId(): string {
  return `social_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
}

const LINKEDIN_PROMPT = `You are a social media manager for AFJ Limited, a Birmingham-based transport company.

Write a LinkedIn post promoting the blog post described below.

Requirements:
- Professional, engaging tone suitable for LinkedIn
- 150-250 words maximum
- Include 3-5 relevant hashtags at the end
- Start with a compelling hook (NOT "We're pleased to announce" or similar)
- Mention AFJ Limited naturally
- Include a call to action (read more, contact us, etc.)
- Reference specific details from the blog content
- Use British English spelling
- Do NOT use emojis excessively (1-2 max)
- Output ONLY the post text, nothing else`;

const FACEBOOK_PROMPT = `You are a social media manager for AFJ Limited, a Birmingham-based transport company.

Write a Facebook post promoting the blog post described below.

Requirements:
- Friendly, conversational tone suitable for Facebook
- 100-200 words maximum
- More casual than LinkedIn but still professional
- Start with a compelling question or statement
- Mention AFJ Limited
- Include a clear call to action
- Reference specific details from the blog content
- Use British English spelling
- Do NOT overuse emojis (1-3 max)
- Output ONLY the post text, nothing else`;

const MANUAL_LINKEDIN_PROMPT = `You are a social media manager for AFJ Limited, a Birmingham-based transport company.
Services: SEND school transport, NEPTS, private minibus hire, airport transfers, executive hire, fleet maintenance, driver training, vehicle conversions.
2,000+ students daily, 47+ drivers, CQC rated "Good".

Write a LinkedIn post based on the topic/brief below.

Requirements:
- Professional, engaging tone suitable for LinkedIn
- 150-250 words
- Include 3-5 relevant hashtags at the end
- Compelling hook in the first line
- British English spelling
- 1-2 emojis maximum
- Output ONLY the post text`;

const MANUAL_FACEBOOK_PROMPT = `You are a social media manager for AFJ Limited, a Birmingham-based transport company.
Services: SEND school transport, NEPTS, private minibus hire, airport transfers, executive hire, fleet maintenance, driver training, vehicle conversions.
2,000+ students daily, 47+ drivers, CQC rated "Good".

Write a Facebook post based on the topic/brief below.

Requirements:
- Friendly, conversational tone suitable for Facebook
- 100-200 words
- Casual but professional
- British English spelling
- 1-3 emojis maximum
- Output ONLY the post text`;

/**
 * Generate social media drafts for a published blog post.
 * Creates both LinkedIn and Facebook drafts.
 */
export async function generateBlogSocialDrafts(opts: {
  blogTitle: string;
  blogSlug: string;
  blogContent: string;
}): Promise<SocialDraft[]> {
  const userMessage = `Blog title: ${opts.blogTitle}\nBlog URL: /blog/${opts.blogSlug}\n\nBlog content:\n${opts.blogContent.slice(0, 2000)}`;

  const drafts: SocialDraft[] = [];

  // Generate LinkedIn post
  try {
    const linkedinContent = await generateText(LINKEDIN_PROMPT, userMessage, 1024);
    const linkedinDraft: SocialDraft = {
      id: generateId(),
      platform: 'linkedin',
      content: linkedinContent.trim(),
      blogSlug: opts.blogSlug,
      blogTitle: opts.blogTitle,
      status: 'draft',
      createdAt: new Date().toISOString(),
      publishedAt: null,
      editedContent: null,
    };
    drafts.push(linkedinDraft);
  } catch (err) {
    console.error('LinkedIn draft generation failed:', err instanceof Error ? err.message : err);
  }

  // Generate Facebook post
  try {
    const facebookContent = await generateText(FACEBOOK_PROMPT, userMessage, 1024);
    const facebookDraft: SocialDraft = {
      id: generateId(),
      platform: 'facebook',
      content: facebookContent.trim(),
      blogSlug: opts.blogSlug,
      blogTitle: opts.blogTitle,
      status: 'draft',
      createdAt: new Date().toISOString(),
      publishedAt: null,
      editedContent: null,
    };
    drafts.push(facebookDraft);
  } catch (err) {
    console.error('Facebook draft generation failed:', err instanceof Error ? err.message : err);
  }

  if (drafts.length > 0) {
    const store = await readStore();
    store.drafts.push(...drafts);
    await writeStore(store);
  }

  return drafts;
}

/**
 * Generate a manual social media post (not tied to a blog).
 */
export async function generateManualDraft(opts: {
  platform: 'linkedin' | 'facebook';
  topic: string;
  brief?: string;
}): Promise<SocialDraft> {
  const prompt = opts.platform === 'linkedin' ? MANUAL_LINKEDIN_PROMPT : MANUAL_FACEBOOK_PROMPT;
  const userMessage = `Topic: ${opts.topic}${opts.brief ? `\nBrief: ${opts.brief}` : ''}`;

  const content = await generateText(prompt, userMessage, 1024);

  const draft: SocialDraft = {
    id: generateId(),
    platform: opts.platform,
    content: content.trim(),
    blogSlug: null,
    blogTitle: null,
    status: 'draft',
    createdAt: new Date().toISOString(),
    publishedAt: null,
    editedContent: null,
  };

  const store = await readStore();
  store.drafts.push(draft);
  await writeStore(store);

  return draft;
}

/**
 * AI rewrite of an existing draft.
 */
export async function rewriteDraft(
  draftId: string,
  instruction: string,
): Promise<string> {
  const store = await readStore();
  const draft = store.drafts.find(d => d.id === draftId);
  if (!draft) throw new Error('Draft not found');

  const currentContent = draft.editedContent || draft.content;
  const platform = draft.platform === 'linkedin' ? 'LinkedIn' : 'Facebook';

  const system = `You are editing a ${platform} post for AFJ Limited.
Apply the user's instruction to the post below.
Return ONLY the updated post text — no explanations.

Current post:
${currentContent}`;

  return generateText(system, `Instruction: ${instruction}`, 1024);
}

/**
 * Get all social drafts.
 */
export async function getSocialDrafts(): Promise<SocialDraft[]> {
  const store = await readStore();
  return store.drafts;
}

/**
 * Get a single draft by ID.
 */
export async function getSocialDraftById(id: string): Promise<SocialDraft | null> {
  const store = await readStore();
  return store.drafts.find(d => d.id === id) || null;
}

/**
 * Update a social draft.
 */
export async function updateSocialDraft(
  id: string,
  updates: Partial<SocialDraft>,
): Promise<SocialDraft | null> {
  const store = await readStore();
  const idx = store.drafts.findIndex(d => d.id === id);
  if (idx === -1) return null;

  store.drafts[idx] = { ...store.drafts[idx], ...updates };
  await writeStore(store);
  return store.drafts[idx];
}

/**
 * Delete a social draft.
 */
export async function deleteSocialDraft(id: string): Promise<boolean> {
  const store = await readStore();
  const idx = store.drafts.findIndex(d => d.id === id);
  if (idx === -1) return false;

  store.drafts.splice(idx, 1);
  await writeStore(store);
  return true;
}
