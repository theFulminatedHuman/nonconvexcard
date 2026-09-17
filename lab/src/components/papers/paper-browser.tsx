'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { normalise } from '@/lib/search';
import { FIELDS, type FieldSlug } from '@/lib/taxonomy';
import { FilterChip, FilterGroup, toggleIn } from '@/components/problems/filters';
import { SearchIcon } from '@/components/ui/icons';
import { Chip, EmptyState } from '@/components/ui/primitives';

export interface PaperEntry {
  id: string;
  title: string;
  authors: string;
  year: number;
  venue?: string;
  field: FieldSlug;
  tags: string[];
  problem: string;
  contribution: string;
}

type Sort = 'year' | 'title';

/**
 * The paper explorer.
 *
 * Papers are indexed by the mathematics they use, not by popularity: the field
 * filter is the same taxonomy as the topics, so "which papers need
 * concentration inequalities" is a one-click question.
 */
export function PaperBrowser({ papers }: { papers: PaperEntry[] }) {
  const [query, setQuery] = useState('');
  const [fields, setFields] = useState<FieldSlug[]>([]);
  const [decades, setDecades] = useState<number[]>([]);
  const [sort, setSort] = useState<Sort>('year');

  const tokens = useMemo(() => normalise(query).split(' ').filter(Boolean), [query]);

  const counts = useMemo(() => {
    const byField = new Map<FieldSlug, number>();
    const byDecade = new Map<number, number>();
    for (const p of papers) {
      byField.set(p.field, (byField.get(p.field) ?? 0) + 1);
      const d = Math.floor(p.year / 10) * 10;
      byDecade.set(d, (byDecade.get(d) ?? 0) + 1);
    }
    return { byField, byDecade };
  }, [papers]);

  const filtered = useMemo(() => {
    const out = papers.filter((p) => {
      if (fields.length > 0 && !fields.includes(p.field)) return false;
      if (decades.length > 0 && !decades.includes(Math.floor(p.year / 10) * 10)) return false;
      if (tokens.length > 0) {
        const hay = normalise(
          `${p.title} ${p.authors} ${p.tags.join(' ')} ${p.problem} ${p.contribution} ${p.year}`,
        );
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
    out.sort((a, b) =>
      sort === 'title' ? a.title.localeCompare(b.title) : b.year - a.year || a.title.localeCompare(b.title),
    );
    return out;
  }, [papers, fields, decades, tokens, sort]);

  const availableFields = (Object.keys(FIELDS) as FieldSlug[]).filter((f) => counts.byField.has(f));
  const availableDecades = [...counts.byDecade.keys()].sort((a, b) => b - a);

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <label className="flex items-center gap-2 rounded border border-[var(--color-line)] bg-[var(--color-elevated)] px-2.5 py-1.5">
          <SearchIcon size={14} className="shrink-0 text-[var(--color-ink-faint)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter papers"
            aria-label="Filter papers by text"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-ink-faint)]"
          />
        </label>

        <FilterGroup label="Mathematics used">
          {availableFields.map((f) => (
            <FilterChip
              key={f}
              active={fields.includes(f)}
              count={counts.byField.get(f)}
              onClick={() => setFields((prev) => toggleIn(prev, f))}
            >
              {FIELDS[f].short}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label="Decade">
          {availableDecades.map((d) => (
            <FilterChip
              key={d}
              active={decades.includes(d)}
              count={counts.byDecade.get(d)}
              onClick={() => setDecades((prev) => toggleIn(prev, d))}
            >
              {d}s
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label="Sort by">
          <FilterChip active={sort === 'year'} onClick={() => setSort('year')}>
            Newest
          </FilterChip>
          <FilterChip active={sort === 'title'} onClick={() => setSort('title')}>
            Title
          </FilterChip>
        </FilterGroup>
      </div>

      <div className="min-w-0">
        <p className="mb-2 border-b border-[var(--color-line)] pb-2 font-mono text-xs text-[var(--color-ink-soft)] tabular-nums">
          {filtered.length} of {papers.length} papers
        </p>
        {filtered.length === 0 ? (
          <EmptyState title="No papers match these filters." />
        ) : (
          <ul className="divide-y divide-[var(--color-line)]">
            {filtered.map((p) => (
              <li key={p.id} className="py-3.5">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <Link
                    href={`/papers/${p.id}`}
                    className="text-sm font-medium hover:text-[var(--color-accent)]"
                  >
                    {p.title}
                  </Link>
                  <span className="font-mono text-[11px] text-[var(--color-ink-faint)] tabular-nums">
                    {p.year}
                  </span>
                  <Chip tone="quiet">{FIELDS[p.field].short}</Chip>
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-[var(--color-ink-faint)]">
                  {p.authors}
                  {p.venue ? ` · ${p.venue}` : ''}
                </p>
                <p className="mt-1.5 text-[0.85rem] leading-snug text-[var(--color-ink-soft)]">
                  <span className="mono-label mr-1.5">Contribution</span>
                  {p.contribution}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
