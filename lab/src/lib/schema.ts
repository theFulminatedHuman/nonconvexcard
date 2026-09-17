/**
 * Content schemas.
 *
 * Every file under `/content` is validated against these schemas at build time.
 * A malformed frontmatter entry fails `next build` with a path-qualified error
 * rather than silently rendering a broken page.
 */
import { z } from 'zod';
import {
  CLAIM_KINDS,
  DIFFICULTIES,
  ESTIMATED_TIMES,
  FIELD_SLUGS,
  PROBLEM_TYPES,
} from './taxonomy';

const slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slugs are lowercase kebab-case');

const fieldSlug = z.enum(FIELD_SLUGS);
/** Levels 0–4; spelled out so the inferred type is the `Level` union, not `number`. */
const level = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

/* ------------------------------------------------------------- references */

export const referenceSchema = z.object({
  /** Short citation key, e.g. `vershynin-hdp`. */
  key: slug,
  title: z.string().min(1),
  authors: z.string().min(1),
  year: z.number().int().min(1600).max(2100).optional(),
  kind: z.enum(['book', 'paper', 'lecture-notes', 'survey', 'chapter']),
  /** Canonical, publicly resolvable link (arXiv, DOI, author page). */
  url: z.string().url().optional(),
  note: z.string().optional(),
});

export type Reference = z.infer<typeof referenceSchema>;

/* ------------------------------------------------------------------ claims */

/**
 * A theorem-like statement declared in a topic's frontmatter. The statement
 * body lives in the MDX; this entry is what the proof library and search index
 * consume, so titles must be stable.
 */
export const claimSchema = z.object({
  id: slug,
  kind: z.enum(CLAIM_KINDS),
  title: z.string().min(1),
  /** One-line plain-language summary, shown in the proof library listing. */
  summary: z.string().min(1),
  /** `true` when the page contains a complete proof (not a sketch). */
  proved: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export type Claim = z.infer<typeof claimSchema>;

/* ------------------------------------------------------------------ topics */

export const topicFrontmatterSchema = z.object({
  title: z.string().min(1),
  /** Sub-title rendered under the H1; one sentence. */
  summary: z.string().min(1),
  field: fieldSlug,
  level,
  order: z.number().int().default(100),
  /** Topic ids (`field/slug`) that should be understood first. */
  prerequisites: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  estimated_time: z.enum(ESTIMATED_TIMES).default('1h'),
  claims: z.array(claimSchema).default([]),
  /** Ids from the experiment registry, rendered as linked cards. */
  experiments: z.array(slug).default([]),
  /** Paper ids surfaced in the "further reading" rail. */
  papers: z.array(slug).default([]),
  references: z.array(referenceSchema).default([]),
  /** Hidden from navigation while a page is being drafted. */
  draft: z.boolean().default(false),
});

export type TopicFrontmatter = z.infer<typeof topicFrontmatterSchema>;

export interface Topic {
  /** `${field}/${slug}` — globally unique. */
  id: string;
  slug: string;
  field: (typeof FIELD_SLUGS)[number];
  frontmatter: TopicFrontmatter;
  /** Raw MDX body, compiled lazily by the page that renders it. */
  body: string;
  /** Approximate reading time in minutes, derived from the body. */
  readingMinutes: number;
  headings: { depth: number; text: string; id: string }[];
}

/* ---------------------------------------------------------------- problems */

export const problemSchema = z.object({
  id: slug,
  title: z.string().min(1),
  /** Primary field; also the first entry of the filter chips. */
  field: fieldSlug,
  /** Additional fields this problem draws on. */
  also: z.array(fieldSlug).default([]),
  /** Topic id (`field/slug`) this problem belongs to, when one exists. */
  topic: z.string().optional(),
  difficulty: z.enum(DIFFICULTIES),
  type: z.enum(PROBLEM_TYPES),
  estimated_time: z.enum(ESTIMATED_TIMES),
  /** Markdown + LaTeX. */
  statement: z.string().min(1),
  /** Progressive disclosure: revealed one at a time, in order. */
  hints: z.array(z.string()).default([]),
  /** Full worked solution / proof. Markdown + LaTeX. */
  solution: z.string().min(1),
  tags: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  /** Marks membership of "The Abyss". */
  abyss: z.boolean().default(false),
});

export type Problem = z.infer<typeof problemSchema>;

export const problemFileSchema = z.object({
  /** Defaults applied to every problem in the file; each may override them. */
  defaults: problemSchema.partial().optional(),
  problems: z.array(problemSchema.partial().extend({ id: slug })).min(1),
});

/* ------------------------------------------------------------------ papers */

export const paperFrontmatterSchema = z.object({
  title: z.string().min(1),
  authors: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  venue: z.string().optional(),
  url: z.string().url().optional(),
  arxiv: z.string().optional(),
  field: fieldSlug,
  also: z.array(fieldSlug).default([]),
  tags: z.array(z.string()).default([]),
  /** One-sentence statement of the problem the paper attacks. */
  problem: z.string().min(1),
  /** One-sentence statement of the contribution. */
  contribution: z.string().min(1),
  /** Topic ids whose mathematics the paper presumes. */
  prerequisites: z.array(z.string()).default([]),
  /** Paper ids that build on this one. */
  descendants: z.array(slug).default([]),
  related: z.array(slug).default([]),
  draft: z.boolean().default(false),
});

export type PaperFrontmatter = z.infer<typeof paperFrontmatterSchema>;

export interface Paper {
  id: string;
  frontmatter: PaperFrontmatter;
  body: string;
}

/** Formats a zod failure with the offending file path in front. */
export function formatIssue(file: string, error: z.ZodError): string {
  const lines = error.issues.map((i) => `  - ${i.path.join('.') || '<root>'}: ${i.message}`);
  return `Invalid content in ${file}\n${lines.join('\n')}`;
}
