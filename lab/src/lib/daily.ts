/**
 * Daily Mathematics: a deterministic selection of problems for a given day.
 *
 * Deterministic in the date, so the same day yields the same set on every
 * device and after every reload — a selection that reshuffles when you refresh
 * is one you never commit to. The selection is a pure function of (date,
 * catalogue, what you have solved), which is what makes it testable.
 */
import { createRng } from './rng';
import type { ProblemIndexEntry } from './problem-index';
import { DIFFICULTY_RANK, type Difficulty } from './taxonomy';
import type { IsoDate } from './dates';

export interface DailySlot {
  /** Why this problem is in today's set. */
  role: 'warm-up' | 'core' | 'core-alt' | 'stretch';
  rationale: string;
  problem: ProblemIndexEntry;
}

const ROLE_RATIONALE: Record<DailySlot['role'], string> = {
  'warm-up': 'Below your current level — meant to be finished, not laboured over.',
  core: 'At the level you are working at.',
  'core-alt': 'At your level, in a different field, so the day is not all one subject.',
  stretch: 'Above your level. Not finishing this one is the expected outcome.',
};

/** Deterministic shuffle of a copy of `items`, seeded by `seed`. */
function shuffled<T>(items: readonly T[], seed: string): T[] {
  const rng = createRng(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    const a = out[i]!;
    const b = out[j]!;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

function nearest(
  pool: readonly ProblemIndexEntry[],
  target: number,
  seed: string,
): ProblemIndexEntry | undefined {
  if (pool.length === 0) return undefined;
  const best = Math.min(...pool.map((p) => Math.abs(DIFFICULTY_RANK[p.difficulty] - target)));
  const tied = pool.filter((p) => Math.abs(DIFFICULTY_RANK[p.difficulty] - target) === best);
  return shuffled(tied, seed)[0];
}

/**
 * Chooses up to four problems for `date`.
 *
 * The shape of a day is fixed — one below level, two at level in different
 * fields, one above — because a set that is uniformly hard gets abandoned and a
 * set that is uniformly easy teaches nothing. Solved problems are excluded; if
 * the unsolved pool runs short the day is simply shorter.
 */
export function dailySelection(
  date: IsoDate,
  catalogue: readonly ProblemIndexEntry[],
  solved: ReadonlySet<string>,
  level: Difficulty,
): DailySlot[] {
  const pool = catalogue.filter((p) => !solved.has(p.id));
  const target = DIFFICULTY_RANK[level];
  const chosen: DailySlot[] = [];
  const used = new Set<string>();

  const take = (role: DailySlot['role'], want: number, restrict?: (p: ProblemIndexEntry) => boolean) => {
    const available = pool.filter((p) => !used.has(p.id) && (restrict?.(p) ?? true));
    const pick = nearest(available, want, `${date}:${role}`);
    if (!pick) return;
    used.add(pick.id);
    chosen.push({ role, rationale: ROLE_RATIONALE[role], problem: pick });
  };

  take('warm-up', Math.max(0, target - 1));
  take('core', target);
  const coreField = chosen.find((c) => c.role === 'core')?.problem.field;
  take('core-alt', target, (p) => (coreField ? p.field !== coreField : true));
  take('stretch', target + 1);

  return chosen;
}
