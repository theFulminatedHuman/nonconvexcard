import { describe, expect, it } from 'vitest';
import { dailySelection } from './daily';
import type { ProblemIndexEntry } from './problem-index';
import { DIFFICULTIES, type Difficulty, type FieldSlug } from './taxonomy';

function entry(id: string, difficulty: Difficulty, field: FieldSlug): ProblemIndexEntry {
  return {
    id,
    title: id,
    field,
    also: [],
    difficulty,
    type: 'proof',
    estimatedTime: '30m',
    minutes: 30,
    tags: [],
    abyss: false,
    hints: 0,
    teaser: '',
  };
}

const catalogue: ProblemIndexEntry[] = DIFFICULTIES.flatMap((d, i) => [
  entry(`${d}-a`, d, 'probability'),
  entry(`${d}-b`, d, 'optimization'),
  entry(`${d}-c`, d, i % 2 === 0 ? 'learning-theory' : 'deep-learning'),
]);

const none = new Set<string>();

describe('dailySelection', () => {
  it('is deterministic in the date', () => {
    const a = dailySelection('2026-03-14', catalogue, none, 'intermediate');
    const b = dailySelection('2026-03-14', catalogue, none, 'intermediate');
    expect(a.map((s) => s.problem.id)).toEqual(b.map((s) => s.problem.id));
  });

  it('differs across days', () => {
    const a = dailySelection('2026-03-14', catalogue, none, 'intermediate');
    const b = dailySelection('2026-03-15', catalogue, none, 'intermediate');
    expect(a.map((s) => s.problem.id)).not.toEqual(b.map((s) => s.problem.id));
  });

  it('never repeats a problem within a day', () => {
    const ids = dailySelection('2026-03-14', catalogue, none, 'advanced').map((s) => s.problem.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('orders the slots warm-up, core, core-alt, stretch', () => {
    const roles = dailySelection('2026-03-14', catalogue, none, 'intermediate').map((s) => s.role);
    expect(roles).toEqual(['warm-up', 'core', 'core-alt', 'stretch']);
  });

  it('puts the stretch problem above the warm-up', () => {
    const slots = dailySelection('2026-03-14', catalogue, none, 'intermediate');
    const warm = slots.find((s) => s.role === 'warm-up')!.problem.difficulty;
    const stretch = slots.find((s) => s.role === 'stretch')!.problem.difficulty;
    expect(DIFFICULTIES.indexOf(stretch)).toBeGreaterThan(DIFFICULTIES.indexOf(warm));
  });

  it('draws the alternate core problem from a different field', () => {
    const slots = dailySelection('2026-03-14', catalogue, none, 'intermediate');
    const core = slots.find((s) => s.role === 'core')!.problem.field;
    const alt = slots.find((s) => s.role === 'core-alt')!.problem.field;
    expect(alt).not.toBe(core);
  });

  it('excludes solved problems', () => {
    const solved = new Set(catalogue.slice(0, 15).map((p) => p.id));
    const slots = dailySelection('2026-03-14', catalogue, solved, 'intermediate');
    for (const s of slots) expect(solved.has(s.problem.id)).toBe(false);
  });

  it('returns a shorter day rather than failing when the pool is nearly empty', () => {
    const solved = new Set(catalogue.slice(1).map((p) => p.id));
    const slots = dailySelection('2026-03-14', catalogue, solved, 'intermediate');
    expect(slots.length).toBe(1);
  });

  it('returns nothing when everything is solved', () => {
    const solved = new Set(catalogue.map((p) => p.id));
    expect(dailySelection('2026-03-14', catalogue, solved, 'intermediate')).toEqual([]);
  });

  it('clamps the warm-up target at the easiest difficulty', () => {
    const slots = dailySelection('2026-03-14', catalogue, none, 'foundation');
    expect(slots.find((s) => s.role === 'warm-up')!.problem.difficulty).toBe('foundation');
  });
});
