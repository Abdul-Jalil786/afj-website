/**
 * Blog Auto-Drafter
 *
 * Generates blog post drafts using the LLM abstraction layer.
 * Used by the marketing agent (auto-draft) and admin content page (manual draft).
 *
 * Storage: src/data/blog-drafts.json
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { generateText } from './llm';

export interface BlogDraft {
  id: string;
  title: string;
  keyword: string;
  content: string;
  status: 'draft' | 'reviewing' | 'published';
  createdAt: string;
  source: 'marketing-agent' | 'manual' | 'admin';
  editHistory: Array<{ timestamp: string; instruction: string; previousContent: string }>;
  publishedAt: string | null;
  publishedSlug: string | null;
}

interface DraftsStore {
  drafts: BlogDraft[];
}

const STORE_PATH = join(process.cwd(), 'src', 'data', 'blog-drafts.json');

async function readDrafts(): Promise<DraftsStore> {
  try {
    const raw = await readFile(STORE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { drafts: [] };
  }
}

async function writeDrafts(store: DraftsStore): Promise<void> {
  await mkdir(join(process.cwd(), 'src', 'data'), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2) + '\n', 'utf-8');
}

/**
 * Generate a new blog draft using AI.
 */
export async function generateDraft(opts: {
  topic: string;
  keyword: string;
  brief?: string;
  source?: BlogDraft['source'];
}): Promise<BlogDraft> {
  const system = `You are a content writer for AFJ Limited, a Birmingham-based UK transport company.
Services: SEND school transport, non-emergency patient transport (NEPTS), private minibus hire, airport transfers, executive hire, fleet maintenance, driver training, vehicle conversions.
700+ students daily, 47+ drivers, 18+ years of service. CQC rated "Good".

Write a blog post in markdown format.

Requirements:
- 600-800 words
- Professional but approachable British English tone
- Include the target keyword naturally 3-5 times
- Structure: engaging intro, 3-4 subheadings with content, conclusion with CTA
- CTA should direct readers to contact AFJ or use the quote wizard at /quote
- Mention Birmingham and Manchester where relevant
- Include relevant AFJ services (SEND, NEPTS, private hire, airport transfers)
- Do NOT make up statistics or quotes
- Do NOT include frontmatter — output ONLY the markdown body`;

  const userMsg = `Topic: ${opts.topic}
Target keyword: ${opts.keyword}
${opts.brief ? `Brief: ${opts.brief}` : ''}`;

  const content = await generateText(system, userMsg, 3000);

  const id = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
  const draft: BlogDraft = {
    id,
    title: opts.topic,
    keyword: opts.keyword,
    content,
    status: 'draft',
    createdAt: new Date().toISOString(),
    source: opts.source || 'manual',
    editHistory: [],
    publishedAt: null,
    publishedSlug: null,
  };

  const store = await readDrafts();
  store.drafts.push(draft);
  await writeDrafts(store);

  return draft;
}

/**
 * Apply an AI edit to a draft based on natural language instructions.
 * Returns the new content without saving (caller decides to accept or reject).
 */
export async function editDraft(
  currentContent: string,
  instruction: string,
): Promise<string> {
  const system = `You are editing a blog post for AFJ Limited, a UK transport company.
Apply the user's editing instruction to the blog post below.
Return ONLY the complete updated markdown — no explanations, no frontmatter.

Current blog post:
${currentContent}`;

  return generateText(system, `Editing instruction: ${instruction}`, 3000);
}

/**
 * Get all drafts.
 */
export async function getDrafts(): Promise<BlogDraft[]> {
  const store = await readDrafts();
  return store.drafts;
}

/**
 * Get a single draft by ID.
 */
export async function getDraftById(id: string): Promise<BlogDraft | null> {
  const store = await readDrafts();
  return store.drafts.find((d) => d.id === id) || null;
}

/**
 * Update a draft in the store.
 */
export async function updateDraft(id: string, updates: Partial<BlogDraft>): Promise<BlogDraft | null> {
  const store = await readDrafts();
  const idx = store.drafts.findIndex((d) => d.id === id);
  if (idx === -1) return null;

  store.drafts[idx] = { ...store.drafts[idx], ...updates };
  await writeDrafts(store);
  return store.drafts[idx];
}

/**
 * Save an edit to the draft's history and update content.
 */
export async function applyEdit(
  id: string,
  instruction: string,
  newContent: string,
): Promise<BlogDraft | null> {
  const store = await readDrafts();
  const idx = store.drafts.findIndex((d) => d.id === id);
  if (idx === -1) return null;

  const draft = store.drafts[idx];
  draft.editHistory.push({
    timestamp: new Date().toISOString(),
    instruction,
    previousContent: draft.content,
  });
  draft.content = newContent;
  draft.status = 'reviewing';
  await writeDrafts(store);
  return draft;
}

/**
 * Revert to a previous version by edit history index.
 */
export async function revertDraft(id: string, historyIndex: number): Promise<BlogDraft | null> {
  const store = await readDrafts();
  const idx = store.drafts.findIndex((d) => d.id === id);
  if (idx === -1) return null;

  const draft = store.drafts[idx];
  if (historyIndex < 0 || historyIndex >= draft.editHistory.length) return null;

  draft.content = draft.editHistory[historyIndex].previousContent;
  // Trim history to the revert point
  draft.editHistory = draft.editHistory.slice(0, historyIndex);
  await writeDrafts(store);
  return draft;
}
