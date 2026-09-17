import { describe, expect, it } from 'vitest';
import {
  byDay,
  countsByDifficulty,
  dueForReview,
  EMPTY_STATE,
  fieldMastery,
  hasActivity,
  parseState,
  recordActivity,
  removeActivity,
  streaks,
  suggestedDifficulty,
  totals,
  type ActivityEntry,
  type ProgressState,
} from './progress';

function entry(over: Partial<ActivityEntry> = {}): Omit<ActivityEntry, 'key'> {
  return {
    kind: 'problem',
    refId: 'p1',
    title: 'A problem',
    date: '2026-03-10',
    field: 'probability',
    difficulty: 'intermediate',
    type: 'proof',
    minutes: 30,
    ...over,
  };
}

function build(entries: Omit<ActivityEntry, 'key'>[]): ProgressState {
  return entries.reduce(recordActivity, EMPTY_STATE);
}

describe('recordActivity', () => {
  it('records and finds an activity', () => {
    const s = recordActivity(EMPTY_STATE, entry());
    expect(s.entries).toHaveLength(1);
    expect(hasActivity(s, 'problem', 'p1')).toBe(true);
  });

  it('is idempotent on the same item', () => {
    const s = build([entry(), entry({ date: '2026-03-12' })]);
    expect(s.entries).toHaveLength(1);
    expect(s.entries[0]!.date).toBe('2026-03-12');
  });

  it('keeps items of different kinds separate', () => {
    const s = build([entry(), entry({ kind: 'topic', refId: 'p1' })]);
    expect(s.entries).toHaveLength(2);
  });

  it('removes an activity', () => {
    const s = removeActivity(build([entry()]), 'problem', 'p1');
    expect(s.entries).toHaveLength(0);
    expect(hasActivity(s, 'problem', 'p1')).toBe(false);
  });

  it('keeps entries sorted by date', () => {
    const s = build([
      entry({ refId: 'b', date: '2026-05-01' }),
      entry({ refId: 'a', date: '2026-01-01' }),
    ]);
    expect(s.entries.map((e) => e.refId)).toEqual(['a', 'b']);
  });
});

describe('parseState', () => {
  it('returns the empty state for null and garbage', () => {
    expect(parseState(null)).toEqual(EMPTY_STATE);
    expect(parseState('not json')).toEqual(EMPTY_STATE);
    expect(parseState('[]')).toEqual(EMPTY_STATE);
    expect(parseState('{"entries":"nope"}')).toEqual(EMPTY_STATE);
  });

  it('drops malformed entries but keeps valid ones', () => {
    const good = { ...entry(), key: 'problem:p1' };
    const raw = JSON.stringify({ version: 1, entries: [good, { key: 'x' }, null, 42] });
    expect(parseState(raw).entries).toHaveLength(1);
  });

  it('round-trips a stored state', () => {
    const s = build([entry(), entry({ refId: 'p2', kind: 'topic' })]);
    expect(parseState(JSON.stringify(s)).entries).toHaveLength(2);
  });
});

describe('streaks', () => {
  it('is zero on an empty state', () => {
    expect(streaks(EMPTY_STATE, '2026-03-10')).toEqual({
      current: 0, longest: 0, lastActive: null, activeDays: 0,
    });
  });

  it('counts consecutive days', () => {
    const s = build(['2026-03-08', '2026-03-09', '2026-03-10'].map((d, i) => entry({ refId: `p${i}`, date: d })));
    const r = streaks(s, '2026-03-10');
    expect(r.current).toBe(3);
    expect(r.longest).toBe(3);
    expect(r.activeDays).toBe(3);
  });

  it('keeps the streak alive on a day not yet worked', () => {
    const s = build(['2026-03-08', '2026-03-09'].map((d, i) => entry({ refId: `p${i}`, date: d })));
    expect(streaks(s, '2026-03-10').current).toBe(2);
  });

  it('breaks the streak after a missed day', () => {
    const s = build(['2026-03-05', '2026-03-06'].map((d, i) => entry({ refId: `p${i}`, date: d })));
    expect(streaks(s, '2026-03-10').current).toBe(0);
  });

  it('reports the longest historical streak', () => {
    const days = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-02-01'];
    const s = build(days.map((d, i) => entry({ refId: `p${i}`, date: d })));
    const r = streaks(s, '2026-02-01');
    expect(r.longest).toBe(4);
    expect(r.current).toBe(1);
  });

  it('counts several activities on one day as one active day', () => {
    const s = build([entry({ refId: 'a' }), entry({ refId: 'b' })]);
    expect(streaks(s, '2026-03-10').activeDays).toBe(1);
  });
});

describe('totals and breakdowns', () => {
  it('counts by kind and type', () => {
    const s = build([
      entry({ refId: 'a', type: 'proof' }),
      entry({ refId: 'b', type: 'coding' }),
      entry({ refId: 'c', type: 'numerical', difficulty: 'research' }),
      entry({ refId: 't', kind: 'topic', type: undefined, difficulty: undefined }),
      entry({ refId: 'x', kind: 'experiment', type: undefined, difficulty: undefined }),
    ]);
    const t = totals(s);
    expect(t.problems).toBe(3);
    expect(t.proofs).toBe(1);
    expect(t.coding).toBe(1);
    expect(t.numerical).toBe(1);
    expect(t.research).toBe(1);
    expect(t.topics).toBe(1);
    expect(t.experiments).toBe(1);
    expect(t.minutes).toBe(150);
  });

  it('buckets by day', () => {
    const s = build([entry({ refId: 'a' }), entry({ refId: 'b' }), entry({ refId: 'c', date: '2026-03-11' })]);
    const m = byDay(s);
    expect(m.get('2026-03-10')!.count).toBe(2);
    expect(m.get('2026-03-11')!.count).toBe(1);
  });

  it('counts by difficulty', () => {
    const s = build([entry({ refId: 'a' }), entry({ refId: 'b', difficulty: 'graduate' })]);
    const c = countsByDifficulty(s);
    expect(c.intermediate).toBe(1);
    expect(c.graduate).toBe(1);
    expect(c.olympiad).toBe(0);
  });
});

describe('fieldMastery', () => {
  it('is zero with no work and no content', () => {
    expect(fieldMastery(EMPTY_STATE, 'probability', { topics: 0, problems: 0 })).toBe(0);
    expect(fieldMastery(EMPTY_STATE, 'probability', { topics: 3, problems: 9 })).toBe(0);
  });

  it('reaches one when everything is done', () => {
    const s = build([
      entry({ kind: 'topic', refId: 't1' }),
      entry({ kind: 'problem', refId: 'p1' }),
      entry({ kind: 'problem', refId: 'p2' }),
    ]);
    expect(fieldMastery(s, 'probability', { topics: 1, problems: 2 })).toBeCloseTo(1, 10);
  });

  it('weights topics above problems', () => {
    const topicOnly = build([entry({ kind: 'topic', refId: 't1' })]);
    const problemOnly = build([entry({ kind: 'problem', refId: 'p1' })]);
    const avail = { topics: 2, problems: 2 };
    expect(fieldMastery(topicOnly, 'probability', avail)).toBeGreaterThan(
      fieldMastery(problemOnly, 'probability', avail),
    );
  });

  it('never exceeds one when extra work is logged', () => {
    const s = build([0, 1, 2, 3].map((i) => entry({ refId: `p${i}` })));
    expect(fieldMastery(s, 'probability', { topics: 1, problems: 2 })).toBeLessThanOrEqual(1);
  });
});

describe('suggestedDifficulty', () => {
  it('starts one step above foundation', () => {
    expect(suggestedDifficulty(EMPTY_STATE)).toBe('beginner');
  });

  it('advances once three problems at a level are solved', () => {
    const s = build([0, 1, 2].map((i) => entry({ refId: `p${i}`, difficulty: 'intermediate' })));
    expect(suggestedDifficulty(s)).toBe('advanced');
  });

  it('caps at research', () => {
    const s = build([0, 1, 2].map((i) => entry({ refId: `p${i}`, difficulty: 'research' })));
    expect(suggestedDifficulty(s)).toBe('research');
  });
});

describe('dueForReview', () => {
  it('resurfaces problems at the scheduled intervals', () => {
    const s = build([
      entry({ refId: 'a', date: '2026-03-07' }), // 3 days before
      entry({ refId: 'b', date: '2026-03-03' }), // 7 days before
      entry({ refId: 'c', date: '2026-03-09' }), // 1 day before — not due
      entry({ refId: 'd', date: '2026-03-07', kind: 'topic' }), // topics are not reviewed
    ]);
    const due = dueForReview(s, '2026-03-10').map((e) => e.refId).sort();
    expect(due).toEqual(['a', 'b']);
  });
});
