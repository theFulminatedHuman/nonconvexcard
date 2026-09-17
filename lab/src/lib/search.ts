/**
 * Search index construction and scoring.
 *
 * The index is built at `next build` into a single static JSON document, which
 * the command palette fetches once on first use. For a corpus of this size
 * (hundreds of documents, growing to thousands) a well-tuned linear scan beats
 * shipping a full-text engine: it is a few kilobytes of code, it ranks
 * predictably, and it matches on LaTeX-free keyword text we control.
 */
import type { FieldSlug } from './taxonomy';

export type SearchKind = 'topic' | 'claim' | 'problem' | 'paper' | 'experiment' | 'page';

export interface SearchDoc {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  href: string;
  field?: FieldSlug;
  /** Lower-cased free text: tags, summaries, alternative names. */
  keywords: string;
  /** Short right-aligned label in the result row (difficulty, year, …). */
  badge?: string;
}

export interface SearchHit extends SearchDoc {
  score: number;
}

const KIND_WEIGHT: Record<SearchKind, number> = {
  topic: 1.15,
  claim: 1.1,
  page: 1.05,
  experiment: 1,
  problem: 0.95,
  paper: 0.95,
};

export function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‐-―]/g, '-') // unicode dashes → hyphen
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(s: string): string[] {
  return normalise(s).split(' ').filter(Boolean);
}

/**
 * Scores one document against the query tokens. Returns 0 when any token is
 * unmatched, so the search is conjunctive: "sgd convergence" must match both.
 */
export function scoreDoc(doc: SearchDoc, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const title = normalise(doc.title);
  const subtitle = normalise(doc.subtitle);
  const keywords = doc.keywords;

  let score = 0;
  for (const token of tokens) {
    let best = 0;
    if (title === token) best = 12;
    else if (title.startsWith(`${token} `) || title.startsWith(`${token}-`)) best = 8;
    else if (title.includes(token)) best = 6;
    else if (subtitle.includes(token)) best = 3;
    else if (keywords.includes(token)) best = 2;
    if (best === 0) return 0;
    score += best;
  }

  // An exact phrase match in the title outranks a scattered token match.
  const phrase = tokens.join(' ');
  if (title.includes(phrase)) score += 6;

  // Prefer shorter titles when scores are otherwise equal: they are more specific.
  score += Math.max(0, 3 - title.length / 40);

  return score * KIND_WEIGHT[doc.kind];
}

export function search(docs: SearchDoc[], query: string, limit = 24): SearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const hits: SearchHit[] = [];
  for (const doc of docs) {
    const score = scoreDoc(doc, tokens);
    if (score > 0) hits.push({ ...doc, score });
  }
  hits.sort((a, b) => (b.score === a.score ? a.title.localeCompare(b.title) : b.score - a.score));
  return hits.slice(0, limit);
}
