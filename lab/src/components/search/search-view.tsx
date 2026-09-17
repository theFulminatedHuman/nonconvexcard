'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { search, type SearchDoc, type SearchKind } from '@/lib/search';
import { FIELDS } from '@/lib/taxonomy';
import { FilterChip, FilterGroup, toggleIn } from '@/components/problems/filters';
import { SearchIcon } from '@/components/ui/icons';
import { EmptyState } from '@/components/ui/primitives';

const KIND_LABEL: Record<SearchKind, string> = {
  topic: 'Topic',
  claim: 'Statement',
  problem: 'Problem',
  paper: 'Paper',
  experiment: 'Experiment',
  page: 'Page',
};

const KINDS: SearchKind[] = ['topic', 'claim', 'problem', 'paper', 'experiment', 'page'];

/**
 * The full-page search.
 *
 * The same static index the command palette uses, with no result cap and with
 * kind filters — for the case where you are exploring the corpus rather than
 * navigating to something you already have in mind.
 */
export function SearchView({ basePath }: { basePath: string }) {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [kinds, setKinds] = useState<SearchKind[]>([]);
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${basePath}/search-index.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('index unavailable'))))
      .then((d: unknown) => {
        if (!cancelled) setDocs(Array.isArray(d) ? (d as SearchDoc[]) : []);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [basePath]);

  const hits = useMemo(() => {
    if (!docs) return [];
    const all = search(docs, query, 500);
    return kinds.length === 0 ? all : all.filter((h) => kinds.includes(h.kind));
  }, [docs, query, kinds]);

  const counts = useMemo(() => {
    const m = new Map<SearchKind, number>();
    for (const d of docs ?? []) m.set(d.kind, (m.get(d.kind) ?? 0) + 1);
    return m;
  }, [docs]);

  return (
    <div className="space-y-6">
      <label className="flex items-center gap-2.5 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5">
        <SearchIcon size={18} className="shrink-0 text-[var(--color-ink-faint)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          placeholder="Search concepts, theorems, proofs, problems, algorithms, papers, experiments…"
          aria-label="Search the site"
          className="w-full bg-transparent text-base outline-none placeholder:text-[var(--color-ink-faint)]"
        />
      </label>

      <FilterGroup label="Restrict to">
        {KINDS.filter((k) => counts.has(k)).map((k) => (
          <FilterChip
            key={k}
            active={kinds.includes(k)}
            count={counts.get(k)}
            onClick={() => setKinds((prev) => toggleIn(prev, k))}
          >
            {KIND_LABEL[k]}
          </FilterChip>
        ))}
      </FilterGroup>

      {failed ? (
        <EmptyState
          title="The search index could not be loaded."
          hint="Browsing from the sidebar still works."
        />
      ) : docs === null ? (
        <p className="text-sm text-[var(--color-ink-faint)]">Loading index…</p>
      ) : query.trim() === '' ? (
        <p className="text-sm text-[var(--color-ink-faint)]">
          {docs.length} items indexed: every topic, theorem-like statement, problem, paper and
          experiment on the site. Type to search, or press ⌘K anywhere for the quick palette.
        </p>
      ) : hits.length === 0 ? (
        <EmptyState
          title={`No matches for “${query}”.`}
          hint="Matching is conjunctive — every word must appear. Try fewer words."
        />
      ) : (
        <>
          <p className="font-mono text-xs text-[var(--color-ink-soft)] tabular-nums">
            {hits.length} result{hits.length === 1 ? '' : 's'}
          </p>
          <ul className="divide-y divide-[var(--color-line)]">
            {hits.map((hit) => (
              <li key={hit.id}>
                <Link
                  href={hit.href}
                  className="flex items-baseline gap-3 py-3 transition-colors hover:bg-[var(--color-elevated)]"
                >
                  <span className="mono-label w-20 shrink-0">{KIND_LABEL[hit.kind]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{hit.title}</span>
                    <span className="block text-[0.82rem] leading-snug text-[var(--color-ink-faint)]">
                      {hit.subtitle}
                    </span>
                  </span>
                  {hit.field ? (
                    <span className="shrink-0 font-mono text-[10px] text-[var(--color-ink-faint)]">
                      {FIELDS[hit.field].short}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
