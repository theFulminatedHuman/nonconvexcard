/**
 * The client-safe projection of the problem database.
 *
 * Problem statements and solutions are large (several kilobytes of LaTeX each)
 * and are only ever needed on a single problem's page, where they are rendered
 * on the server. Listing pages therefore ship this stripped record instead:
 * enough to filter, sort and display a row, and nothing else.
 */
import { allProblems, allTopics } from './content';
import { latexToText } from './latex-text';
import { allJudgeSpecs } from './judge';
import type { Difficulty, EstimatedTime, FieldSlug, ProblemType } from './taxonomy';
import { DIFFICULTY_RANK, TIME_MINUTES } from './taxonomy';

export interface ProblemIndexEntry {
  id: string;
  title: string;
  field: FieldSlug;
  also: FieldSlug[];
  topic?: string;
  topicTitle?: string;
  difficulty: Difficulty;
  type: ProblemType;
  estimatedTime: EstimatedTime;
  minutes: number;
  tags: string[];
  abyss: boolean;
  hints: number;
  /** First ~200 characters of the statement, rendered as plain prose. */
  teaser: string;
  /** True when the problem has runnable tests in the browser judge. */
  runnable: boolean;
}

/** Renders the opening of a statement as plain prose, math resolved to text. */
function teaserOf(statement: string): string {
  const flat = latexToText(
    statement
      .replace(/\$\$[\s\S]*?\$\$/g, ' … ')
      .replace(/```[\s\S]*?```/g, ' (code) '),
  );
  return flat.length > 200 ? `${flat.slice(0, 197)}…` : flat;
}

export function buildProblemIndex(): ProblemIndexEntry[] {
  const titles = new Map(allTopics().map((t) => [t.id, t.frontmatter.title]));
  const judged = allJudgeSpecs();
  return allProblems()
    .map((p) => ({
      id: p.id,
      title: p.title,
      field: p.field,
      also: p.also,
      topic: p.topic,
      topicTitle: p.topic ? titles.get(p.topic) : undefined,
      difficulty: p.difficulty,
      type: p.type,
      estimatedTime: p.estimated_time,
      minutes: TIME_MINUTES[p.estimated_time],
      tags: p.tags,
      abyss: p.abyss,
      hints: p.hints.length,
      teaser: teaserOf(p.statement),
      runnable: judged.has(p.id),
    }))
    .sort((a, b) => {
      const d = DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty];
      return d !== 0 ? d : a.title.localeCompare(b.title);
    });
}

/** Counts per field, used by listing headers and the mastery graph. */
export function problemCountsByField(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of allProblems()) out[p.field] = (out[p.field] ?? 0) + 1;
  return out;
}
