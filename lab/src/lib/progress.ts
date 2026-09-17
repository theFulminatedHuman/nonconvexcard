/**
 * Local-first progress tracking.
 *
 * Everything a learner does is stored in their own browser. There is no server,
 * no account and no telemetry: the site is a static export, so the only place
 * progress *can* live is `localStorage`. That is also the honest design — this
 * is a study tool, not a product that needs your data.
 *
 * The pure reducers and derivations at the bottom of this file are unit tested
 * (`progress.test.ts`); the React bindings are a thin wrapper over them.
 */
import type { Difficulty, FieldSlug, ProblemType } from './taxonomy';
import { DIFFICULTIES, DIFFICULTY_RANK, FIELD_SLUGS, PROBLEM_TYPES } from './taxonomy';
import { addDays, daysBetween, today, type IsoDate } from './dates';

export const STORAGE_KEY = 'lab:progress';
export const SCHEMA_VERSION = 1;

export type ActivityKind = 'problem' | 'topic' | 'experiment' | 'paper';

export interface ActivityEntry {
  /** Stable identity of the activity: `${kind}:${refId}`. */
  key: string;
  kind: ActivityKind;
  refId: string;
  title: string;
  date: IsoDate;
  field: FieldSlug;
  difficulty?: Difficulty;
  type?: ProblemType;
  /** Estimated effort in minutes, taken from the item's metadata. */
  minutes: number;
}

export interface ProgressState {
  version: number;
  entries: ActivityEntry[];
}

export const EMPTY_STATE: ProgressState = { version: SCHEMA_VERSION, entries: [] };

/* -------------------------------------------------------- persistence I/O */

function isActivity(v: unknown): v is ActivityEntry {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.key === 'string' &&
    typeof e.refId === 'string' &&
    typeof e.title === 'string' &&
    typeof e.date === 'string' &&
    typeof e.minutes === 'number' &&
    (FIELD_SLUGS as readonly string[]).includes(e.field as string) &&
    ['problem', 'topic', 'experiment', 'paper'].includes(e.kind as string) &&
    (e.difficulty === undefined || (DIFFICULTIES as readonly string[]).includes(e.difficulty as string)) &&
    (e.type === undefined || (PROBLEM_TYPES as readonly string[]).includes(e.type as string))
  );
}

/**
 * Parses stored JSON, discarding anything malformed rather than throwing.
 * A corrupted entry must never take down the whole dashboard.
 */
export function parseState(raw: string | null): ProgressState {
  if (!raw) return EMPTY_STATE;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return EMPTY_STATE;
    const entries = (parsed as { entries?: unknown }).entries;
    if (!Array.isArray(entries)) return EMPTY_STATE;
    return { version: SCHEMA_VERSION, entries: entries.filter(isActivity) };
  } catch {
    return EMPTY_STATE;
  }
}

/* ------------------------------------------------------------- reducers */

export function activityKey(kind: ActivityKind, refId: string): string {
  return `${kind}:${refId}`;
}

/** Records an activity, replacing any earlier record of the same item. */
export function recordActivity(
  state: ProgressState,
  entry: Omit<ActivityEntry, 'key'>,
): ProgressState {
  const key = activityKey(entry.kind, entry.refId);
  const entries = state.entries.filter((e) => e.key !== key);
  entries.push({ ...entry, key });
  entries.sort((a, b) => (a.date === b.date ? a.key.localeCompare(b.key) : a.date.localeCompare(b.date)));
  return { ...state, entries };
}

export function removeActivity(
  state: ProgressState,
  kind: ActivityKind,
  refId: string,
): ProgressState {
  const key = activityKey(kind, refId);
  return { ...state, entries: state.entries.filter((e) => e.key !== key) };
}

export function hasActivity(state: ProgressState, kind: ActivityKind, refId: string): boolean {
  const key = activityKey(kind, refId);
  return state.entries.some((e) => e.key === key);
}

/* ----------------------------------------------------------- derivations */

export interface DayBucket {
  date: IsoDate;
  count: number;
  entries: ActivityEntry[];
}

/** Activity grouped by local calendar day, keyed by `YYYY-MM-DD`. */
export function byDay(state: ProgressState): Map<IsoDate, DayBucket> {
  const map = new Map<IsoDate, DayBucket>();
  for (const e of state.entries) {
    const bucket = map.get(e.date) ?? { date: e.date, count: 0, entries: [] };
    bucket.count += 1;
    bucket.entries.push(e);
    map.set(e.date, bucket);
  }
  return map;
}

export interface StreakSummary {
  current: number;
  longest: number;
  /** Most recent day with any activity, or `null` when there is none. */
  lastActive: IsoDate | null;
  activeDays: number;
}

/**
 * Streaks over active days.
 *
 * The current streak counts back from today; a streak that ended yesterday is
 * still "current" until the end of today, which is the convention learners
 * expect from contribution graphs.
 */
export function streaks(state: ProgressState, asOf: IsoDate = today()): StreakSummary {
  const days = [...new Set(state.entries.map((e) => e.date))].sort();
  if (days.length === 0) return { current: 0, longest: 0, lastActive: null, activeDays: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (daysBetween(days[i - 1]!, days[i]!) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
  }

  const active = new Set(days);
  let current = 0;
  let cursor = asOf;
  if (!active.has(cursor)) cursor = addDays(cursor, -1); // today may not be done yet
  while (active.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, longest, lastActive: days[days.length - 1]!, activeDays: days.length };
}

export interface ProgressTotals {
  problems: number;
  proofs: number;
  numerical: number;
  coding: number;
  research: number;
  topics: number;
  experiments: number;
  papers: number;
  minutes: number;
}

export function totals(state: ProgressState): ProgressTotals {
  const t: ProgressTotals = {
    problems: 0, proofs: 0, numerical: 0, coding: 0, research: 0,
    topics: 0, experiments: 0, papers: 0, minutes: 0,
  };
  for (const e of state.entries) {
    t.minutes += e.minutes;
    if (e.kind === 'topic') t.topics += 1;
    else if (e.kind === 'experiment') t.experiments += 1;
    else if (e.kind === 'paper') t.papers += 1;
    else {
      t.problems += 1;
      if (e.type === 'proof') t.proofs += 1;
      if (e.type === 'numerical') t.numerical += 1;
      if (e.type === 'coding') t.coding += 1;
      if (e.difficulty === 'research' || e.difficulty === 'olympiad') t.research += 1;
    }
  }
  return t;
}

export function countsByDifficulty(state: ProgressState): Record<Difficulty, number> {
  const out = Object.fromEntries(DIFFICULTIES.map((d) => [d, 0])) as Record<Difficulty, number>;
  for (const e of state.entries) if (e.difficulty) out[e.difficulty] += 1;
  return out;
}

export function countsByField(state: ProgressState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of state.entries) out[e.field] = (out[e.field] ?? 0) + 1;
  return out;
}

/**
 * Mastery of a field in [0, 1]: the share of its available items completed,
 * weighted so that topics count for more than individual problems. The weights
 * are a study heuristic, not a measurement — they exist to make the mastery bar
 * move sensibly, and they are documented as such in the UI.
 */
export function fieldMastery(
  state: ProgressState,
  field: FieldSlug,
  available: { topics: number; problems: number },
): number {
  const done = state.entries.filter((e) => e.field === field);
  const topicsDone = done.filter((e) => e.kind === 'topic').length;
  const problemsDone = done.filter((e) => e.kind === 'problem').length;
  const weight = 2;
  const numerator = weight * Math.min(topicsDone, available.topics) + Math.min(problemsDone, available.problems);
  const denominator = weight * available.topics + available.problems;
  if (denominator === 0) return 0;
  return Math.min(1, numerator / denominator);
}

/**
 * The difficulty a learner is ready for: one step above the hardest level they
 * have solved at least three problems at, capped at `research`. Used by the
 * Daily Mathematics selector.
 */
export function suggestedDifficulty(state: ProgressState): Difficulty {
  const counts = countsByDifficulty(state);
  let best: Difficulty = 'foundation';
  for (const d of DIFFICULTIES) {
    if (d === 'olympiad') continue;
    if ((counts[d] ?? 0) >= 3 && DIFFICULTY_RANK[d] >= DIFFICULTY_RANK[best]) best = d;
  }
  const ladder: Difficulty[] = ['foundation', 'beginner', 'intermediate', 'advanced', 'graduate', 'research'];
  const idx = ladder.indexOf(best);
  return ladder[Math.min(idx + 1, ladder.length - 1)] ?? 'beginner';
}

/**
 * Items due for spaced review: solved 3, 7, 21 or 60 days ago (±0 days).
 * A deliberately simple Leitner-style schedule — enough to resurface work
 * without pretending to model memory.
 */
export const REVIEW_INTERVALS = [3, 7, 21, 60] as const;

export function dueForReview(state: ProgressState, asOf: IsoDate = today()): ActivityEntry[] {
  return state.entries.filter((e) => {
    if (e.kind !== 'problem') return false;
    const age = daysBetween(e.date, asOf);
    return (REVIEW_INTERVALS as readonly number[]).includes(age);
  });
}
