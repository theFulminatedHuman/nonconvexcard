/**
 * Build-time content loader.
 *
 * Reads `/content`, validates every file against `src/lib/schema.ts`, and hands
 * back plain data. Everything in this module runs inside `next build` only —
 * nothing here is shipped to the browser.
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import {
  formatIssue,
  paperFrontmatterSchema,
  problemFileSchema,
  problemSchema,
  topicFrontmatterSchema,
  type Paper,
  type Problem,
  type Topic,
} from './schema';
import { FIELDS, FIELD_SLUGS, isFieldSlug, type FieldSlug } from './taxonomy';

const CONTENT_ROOT = path.join(process.cwd(), 'content');

function walk(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, ext));
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out.sort();
}

/** ~220 wpm, with display math counted generously — it is slow to read. */
function readingMinutes(body: string): number {
  const words = body.split(/\s+/).length;
  const displayMath = (body.match(/\$\$/g) ?? []).length / 2;
  return Math.max(1, Math.round(words / 220 + displayMath * 0.5));
}

const HEADING_RE = /^(#{2,4})\s+(.+?)\s*$/gm;

function slugifyHeading(text: string): string {
  return text
    .replace(/\$[^$]*\$/g, '') // drop inline math from anchors
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function extractHeadings(body: string): Topic['headings'] {
  const out: Topic['headings'] = [];
  const seen = new Map<string, number>();
  for (const m of body.matchAll(HEADING_RE)) {
    const depth = m[1]!.length;
    const text = m[2]!.replace(/\{#[^}]+\}/, '').trim();
    let id = slugifyHeading(text);
    if (!id) continue;
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    if (n > 0) id = `${id}-${n}`;
    out.push({ depth, text, id });
  }
  return out;
}

/* ------------------------------------------------------------------ topics */

let topicCache: Topic[] | null = null;

export function allTopics(): Topic[] {
  if (topicCache) return topicCache;
  const files = walk(path.join(CONTENT_ROOT, 'topics'), '.mdx');
  const topics: Topic[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const { data, content } = matter(raw);
    const parsed = topicFrontmatterSchema.safeParse(data);
    if (!parsed.success) throw new Error(formatIssue(file, parsed.error));

    const rel = path.relative(path.join(CONTENT_ROOT, 'topics'), file);
    const dir = path.dirname(rel);
    const slug = path.basename(rel, '.mdx');
    if (!isFieldSlug(dir)) {
      throw new Error(
        `Topic ${file} lives in "${dir}" which is not a field slug. Expected one of: ${FIELD_SLUGS.join(', ')}`,
      );
    }
    if (dir !== parsed.data.field) {
      throw new Error(
        `Topic ${file}: frontmatter field "${parsed.data.field}" does not match its directory "${dir}".`,
      );
    }
    if (parsed.data.draft) continue;

    topics.push({
      id: `${dir}/${slug}`,
      slug,
      field: dir,
      frontmatter: parsed.data,
      body: content,
      readingMinutes: readingMinutes(content),
      headings: extractHeadings(content),
    });
  }

  // Deterministic ordering: field order, then level, then explicit `order`.
  const fieldIndex = new Map(FIELD_SLUGS.map((s, i) => [s, i]));
  topics.sort((a, b) => {
    const fa = fieldIndex.get(a.field)! - fieldIndex.get(b.field)!;
    if (fa !== 0) return fa;
    if (a.frontmatter.level !== b.frontmatter.level) {
      return a.frontmatter.level - b.frontmatter.level;
    }
    if (a.frontmatter.order !== b.frontmatter.order) {
      return a.frontmatter.order - b.frontmatter.order;
    }
    return a.slug.localeCompare(b.slug);
  });

  // Prerequisites must resolve, or navigation and the mastery graph break.
  const ids = new Set(topics.map((t) => t.id));
  for (const t of topics) {
    for (const p of t.frontmatter.prerequisites) {
      if (!ids.has(p)) {
        throw new Error(`Topic ${t.id}: unknown prerequisite "${p}".`);
      }
    }
  }

  topicCache = topics;
  return topics;
}

export function topicsByField(field: FieldSlug): Topic[] {
  return allTopics().filter((t) => t.field === field);
}

export function getTopic(field: string, slug: string): Topic | undefined {
  return allTopics().find((t) => t.field === field && t.slug === slug);
}

export function getTopicById(id: string): Topic | undefined {
  return allTopics().find((t) => t.id === id);
}

/** Fields that actually have published topics, in taxonomy order. */
export function populatedFields(): FieldSlug[] {
  const present = new Set(allTopics().map((t) => t.field));
  return FIELD_SLUGS.filter((f) => present.has(f));
}

/* ---------------------------------------------------------------- problems */

let problemCache: Problem[] | null = null;

export function allProblems(): Problem[] {
  if (problemCache) return problemCache;
  const files = walk(path.join(CONTENT_ROOT, 'problems'), '.yaml');
  const problems: Problem[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const doc = parseYaml(fs.readFileSync(file, 'utf8')) as unknown;
    const parsedFile = problemFileSchema.safeParse(doc);
    if (!parsedFile.success) throw new Error(formatIssue(file, parsedFile.error));

    const defaults = parsedFile.data.defaults ?? {};
    for (const entry of parsedFile.data.problems) {
      const merged = { ...defaults, ...entry };
      const parsed = problemSchema.safeParse(merged);
      if (!parsed.success) {
        throw new Error(formatIssue(`${file} (problem "${entry.id}")`, parsed.error));
      }
      if (seen.has(parsed.data.id)) {
        throw new Error(`Duplicate problem id "${parsed.data.id}" in ${file}.`);
      }
      seen.add(parsed.data.id);
      problems.push(parsed.data);
    }
  }

  const topicIds = new Set(allTopics().map((t) => t.id));
  for (const p of problems) {
    if (p.topic && !topicIds.has(p.topic)) {
      throw new Error(`Problem ${p.id}: unknown topic "${p.topic}".`);
    }
  }

  problems.sort((a, b) => a.id.localeCompare(b.id));
  problemCache = problems;
  return problems;
}

export function getProblem(id: string): Problem | undefined {
  return allProblems().find((p) => p.id === id);
}

export function problemsForTopic(topicId: string): Problem[] {
  return allProblems().filter((p) => p.topic === topicId);
}

export function abyssProblems(): Problem[] {
  return allProblems().filter((p) => p.abyss);
}

/* ------------------------------------------------------------------ papers */

let paperCache: Paper[] | null = null;

export function allPapers(): Paper[] {
  if (paperCache) return paperCache;
  const files = walk(path.join(CONTENT_ROOT, 'papers'), '.mdx');
  const papers: Paper[] = [];

  for (const file of files) {
    const { data, content } = matter(fs.readFileSync(file, 'utf8'));
    const parsed = paperFrontmatterSchema.safeParse(data);
    if (!parsed.success) throw new Error(formatIssue(file, parsed.error));
    if (parsed.data.draft) continue;
    papers.push({ id: path.basename(file, '.mdx'), frontmatter: parsed.data, body: content });
  }

  papers.sort((a, b) => {
    if (a.frontmatter.year !== b.frontmatter.year) return b.frontmatter.year - a.frontmatter.year;
    return a.frontmatter.title.localeCompare(b.frontmatter.title);
  });

  const ids = new Set(papers.map((p) => p.id));
  const topicIds = new Set(allTopics().map((t) => t.id));
  for (const p of papers) {
    for (const d of [...p.frontmatter.descendants, ...p.frontmatter.related]) {
      if (!ids.has(d)) throw new Error(`Paper ${p.id}: unknown related paper "${d}".`);
    }
    for (const pre of p.frontmatter.prerequisites) {
      if (!topicIds.has(pre)) throw new Error(`Paper ${p.id}: unknown prerequisite topic "${pre}".`);
    }
  }

  paperCache = papers;
  return papers;
}

export function getPaper(id: string): Paper | undefined {
  return allPapers().find((p) => p.id === id);
}

export function papersForTopic(topicId: string): Paper[] {
  return allPapers().filter((p) => p.frontmatter.prerequisites.includes(topicId));
}

/* -------------------------------------------------------------- aggregates */

export interface ClaimRecord {
  topicId: string;
  topicTitle: string;
  field: FieldSlug;
  claim: Topic['frontmatter']['claims'][number];
}

/** Every theorem-like statement on the site, flattened for the proof library. */
export function allClaims(): ClaimRecord[] {
  return allTopics().flatMap((t) =>
    t.frontmatter.claims.map((claim) => ({
      topicId: t.id,
      topicTitle: t.frontmatter.title,
      field: t.field,
      claim,
    })),
  );
}

/** Headline counters for the home page. Derived, never hardcoded. */
export function siteStats() {
  const topics = allTopics();
  const problems = allProblems();
  const claims = allClaims();
  return {
    fields: populatedFields().length,
    topics: topics.length,
    problems: problems.length,
    proofs: claims.filter((c) => c.claim.proved).length,
    claims: claims.length,
    papers: allPapers().length,
    abyss: problems.filter((p) => p.abyss).length,
    readingMinutes: topics.reduce((a, t) => a + t.readingMinutes, 0),
  };
}

export { FIELDS };
