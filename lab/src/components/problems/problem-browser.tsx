'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useHasMounted } from '@/hooks/use-local-store';
import { useProgress } from '@/hooks/use-progress';
import type { ProblemIndexEntry } from '@/lib/problem-index';
import { normalise } from '@/lib/search';
import {
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  DIFFICULTY_RANK,
  FIELDS,
  PROBLEM_TYPES,
  PROBLEM_TYPE_LABEL,
  type Difficulty,
  type FieldSlug,
  type ProblemType,
} from '@/lib/taxonomy';
import { SearchIcon } from '@/components/ui/icons';
import { EmptyState } from '@/components/ui/primitives';
import { FilterChip, FilterGroup, toggleIn } from './filters';
import { ProblemTable } from './problem-table';

type Status = 'all' | 'todo' | 'done';
type Sort = 'difficulty' | 'time' | 'title';

const SORTS: { value: Sort; label: string }[] = [
  { value: 'difficulty', label: 'Difficulty' },
  { value: 'time', label: 'Time' },
  { value: 'title', label: 'Title' },
];

const PAGE = 60;

/**
 * The problem database browser.
 *
 * Filtering happens in the browser over the pre-built index, so the whole
 * database is navigable from a static export with no server round-trip. Results
 * are paged in blocks rather than virtualised: at a few hundred rows that is
 * simpler, keeps the page linkable and leaves ⌘F working.
 */
export function ProblemBrowser({
  problems,
  lockedField,
}: {
  problems: ProblemIndexEntry[];
  /** When set, the field filter is fixed and hidden (used by field pages). */
  lockedField?: FieldSlug;
}) {
  const params = useSearchParams();
  const { state } = useProgress();
  const mounted = useHasMounted();

  const initialField = params.get('field');
  const initialDifficulty = params.get('difficulty');
  const topicFilter = params.get('topic');

  const [query, setQuery] = useState('');
  const [fields, setFields] = useState<FieldSlug[]>(
    initialField && initialField in FIELDS ? [initialField as FieldSlug] : [],
  );
  const [difficulties, setDifficulties] = useState<Difficulty[]>(
    initialDifficulty && (DIFFICULTIES as readonly string[]).includes(initialDifficulty)
      ? [initialDifficulty as Difficulty]
      : [],
  );
  const [types, setTypes] = useState<ProblemType[]>([]);
  const [status, setStatus] = useState<Status>('all');
  const [sort, setSort] = useState<Sort>('difficulty');
  const [limit, setLimit] = useState(PAGE);

  const solved = useMemo(() => {
    const ids = new Set<string>();
    for (const e of state.entries) if (e.kind === 'problem') ids.add(e.refId);
    return ids;
  }, [state]);

  const scoped = useMemo(
    () =>
      problems.filter(
        (p) =>
          (!lockedField || p.field === lockedField || p.also.includes(lockedField)) &&
          (!topicFilter || p.topic === topicFilter),
      ),
    [problems, lockedField, topicFilter],
  );

  const availableFields = useMemo(() => {
    const present = new Set(scoped.map((p) => p.field));
    return (Object.keys(FIELDS) as FieldSlug[]).filter((f) => present.has(f));
  }, [scoped]);

  const tokens = useMemo(() => normalise(query).split(' ').filter(Boolean), [query]);

  const filtered = useMemo(() => {
    const out = scoped.filter((p) => {
      if (fields.length > 0 && !fields.includes(p.field) && !p.also.some((f) => fields.includes(f)))
        return false;
      if (difficulties.length > 0 && !difficulties.includes(p.difficulty)) return false;
      if (types.length > 0 && !types.includes(p.type)) return false;
      if (mounted && status === 'todo' && solved.has(p.id)) return false;
      if (mounted && status === 'done' && !solved.has(p.id)) return false;
      if (tokens.length > 0) {
        const hay = normalise(
          `${p.title} ${p.tags.join(' ')} ${p.teaser} ${p.topicTitle ?? ''} ${FIELDS[p.field].title}`,
        );
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      return true;
    });

    out.sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      if (sort === 'time') return a.minutes - b.minutes || a.title.localeCompare(b.title);
      return (
        DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] ||
        a.title.localeCompare(b.title)
      );
    });
    return out;
  }, [scoped, fields, difficulties, types, status, tokens, sort, solved, mounted]);

  const counts = useMemo(() => {
    const byDifficulty = new Map<Difficulty, number>();
    const byType = new Map<ProblemType, number>();
    const byField = new Map<FieldSlug, number>();
    for (const p of scoped) {
      byDifficulty.set(p.difficulty, (byDifficulty.get(p.difficulty) ?? 0) + 1);
      byType.set(p.type, (byType.get(p.type) ?? 0) + 1);
      byField.set(p.field, (byField.get(p.field) ?? 0) + 1);
    }
    return { byDifficulty, byType, byField };
  }, [scoped]);

  const active =
    fields.length + difficulties.length + types.length > 0 || status !== 'all' || query !== '';
  const doneCount = mounted ? scoped.filter((p) => solved.has(p.id)).length : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <label className="flex items-center gap-2 rounded border border-[var(--color-line)] bg-[var(--color-elevated)] px-2.5 py-1.5">
          <SearchIcon size={14} className="shrink-0 text-[var(--color-ink-faint)]" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="Filter problems"
            aria-label="Filter problems by text"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-ink-faint)]"
          />
        </label>

        <FilterGroup label="Status">
          {(['all', 'todo', 'done'] as Status[]).map((s) => (
            <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
              {s === 'all' ? 'All' : s === 'todo' ? 'Unsolved' : 'Solved'}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label="Difficulty">
          {DIFFICULTIES.filter((d) => counts.byDifficulty.has(d)).map((d) => (
            <FilterChip
              key={d}
              active={difficulties.includes(d)}
              color={`var(--color-diff-${d})`}
              count={counts.byDifficulty.get(d)}
              onClick={() => {
                setDifficulties((prev) => toggleIn(prev, d));
                setLimit(PAGE);
              }}
            >
              {DIFFICULTY_LABEL[d]}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label="Type">
          {PROBLEM_TYPES.filter((t) => counts.byType.has(t)).map((t) => (
            <FilterChip
              key={t}
              active={types.includes(t)}
              count={counts.byType.get(t)}
              onClick={() => {
                setTypes((prev) => toggleIn(prev, t));
                setLimit(PAGE);
              }}
            >
              {PROBLEM_TYPE_LABEL[t]}
            </FilterChip>
          ))}
        </FilterGroup>

        {lockedField ? null : (
          <FilterGroup label="Field">
            {availableFields.map((f) => (
              <FilterChip
                key={f}
                active={fields.includes(f)}
                count={counts.byField.get(f)}
                onClick={() => {
                  setFields((prev) => toggleIn(prev, f));
                  setLimit(PAGE);
                }}
              >
                {FIELDS[f].short}
              </FilterChip>
            ))}
          </FilterGroup>
        )}

        <FilterGroup label="Sort by">
          {SORTS.map((s) => (
            <FilterChip key={s.value} active={sort === s.value} onClick={() => setSort(s.value)}>
              {s.label}
            </FilterChip>
          ))}
        </FilterGroup>

        {active ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setFields([]);
              setDifficulties([]);
              setTypes([]);
              setStatus('all');
              setLimit(PAGE);
            }}
            className="text-xs text-[var(--color-accent)] hover:underline"
          >
            Clear all filters
          </button>
        ) : null}
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--color-line)] pb-2">
          <p className="font-mono text-xs text-[var(--color-ink-soft)] tabular-nums">
            {filtered.length} of {scoped.length} problems
          </p>
          {mounted && doneCount > 0 ? (
            <p className="font-mono text-xs text-[var(--color-ink-faint)] tabular-nums">
              {doneCount} solved ({Math.round((doneCount / Math.max(1, scoped.length)) * 100)}%)
            </p>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No problems match these filters."
            hint="Relax a filter, or clear them all and start from the full database."
          />
        ) : (
          <>
            <ProblemTable
              problems={filtered.slice(0, limit)}
              solvedIds={mounted ? solved : undefined}
              showField={!lockedField}
            />
            {filtered.length > limit ? (
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE)}
                className="mt-4 w-full rounded border border-[var(--color-line)] py-2 text-xs font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)]"
              >
                Show {Math.min(PAGE, filtered.length - limit)} more
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
