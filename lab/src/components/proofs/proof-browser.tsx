'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { normalise } from '@/lib/search';
import {
  CLAIM_KINDS,
  CLAIM_LABEL,
  FIELDS,
  type ClaimKind,
  type FieldSlug,
} from '@/lib/taxonomy';
import { FilterChip, FilterGroup, toggleIn } from '@/components/problems/filters';
import { SearchIcon } from '@/components/ui/icons';
import { Chip, ClaimChip, EmptyState } from '@/components/ui/primitives';

export interface ProofEntry {
  id: string;
  title: string;
  summary: string;
  kind: ClaimKind;
  proved: boolean;
  tags: string[];
  field: FieldSlug;
  topicId: string;
  topicTitle: string;
  href: string;
}

/**
 * The proof library.
 *
 * Every theorem-like statement on the site appears here exactly once, tagged
 * with its epistemic status and with whether the page actually carries a
 * complete proof. The "proof included" filter is the point of the page: it is
 * the difference between a site that states results and one that proves them,
 * and it is computed from the content rather than asserted.
 */
export function ProofBrowser({ entries }: { entries: ProofEntry[] }) {
  const [query, setQuery] = useState('');
  const [kinds, setKinds] = useState<ClaimKind[]>([]);
  const [fields, setFields] = useState<FieldSlug[]>([]);
  const [provedOnly, setProvedOnly] = useState(false);

  const tokens = useMemo(() => normalise(query).split(' ').filter(Boolean), [query]);

  const counts = useMemo(() => {
    const byKind = new Map<ClaimKind, number>();
    const byField = new Map<FieldSlug, number>();
    for (const e of entries) {
      byKind.set(e.kind, (byKind.get(e.kind) ?? 0) + 1);
      byField.set(e.field, (byField.get(e.field) ?? 0) + 1);
    }
    return { byKind, byField };
  }, [entries]);

  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        if (kinds.length > 0 && !kinds.includes(e.kind)) return false;
        if (fields.length > 0 && !fields.includes(e.field)) return false;
        if (provedOnly && !e.proved) return false;
        if (tokens.length > 0) {
          const hay = normalise(`${e.title} ${e.summary} ${e.tags.join(' ')} ${e.topicTitle}`);
          if (!tokens.every((t) => hay.includes(t))) return false;
        }
        return true;
      }),
    [entries, kinds, fields, provedOnly, tokens],
  );

  const availableFields = (Object.keys(FIELDS) as FieldSlug[]).filter((f) =>
    counts.byField.has(f),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <label className="flex items-center gap-2 rounded border border-[var(--color-line)] bg-[var(--color-elevated)] px-2.5 py-1.5">
          <SearchIcon size={14} className="shrink-0 text-[var(--color-ink-faint)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter statements"
            aria-label="Filter statements by text"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-ink-faint)]"
          />
        </label>

        <FilterGroup label="Proof status">
          <FilterChip active={provedOnly} onClick={() => setProvedOnly((v) => !v)}>
            Proof included only
          </FilterChip>
        </FilterGroup>

        <FilterGroup label="Epistemic status">
          {CLAIM_KINDS.filter((k) => counts.byKind.has(k)).map((k) => (
            <FilterChip
              key={k}
              active={kinds.includes(k)}
              color={`var(--color-claim-${k})`}
              count={counts.byKind.get(k)}
              onClick={() => setKinds((prev) => toggleIn(prev, k))}
            >
              {CLAIM_LABEL[k]}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label="Field">
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

        {kinds.length + fields.length > 0 || provedOnly || query !== '' ? (
          <button
            type="button"
            onClick={() => {
              setKinds([]);
              setFields([]);
              setProvedOnly(false);
              setQuery('');
            }}
            className="text-xs text-[var(--color-accent)] hover:underline"
          >
            Clear all filters
          </button>
        ) : null}
      </div>

      <div className="min-w-0">
        <p className="mb-2 border-b border-[var(--color-line)] pb-2 font-mono text-xs text-[var(--color-ink-soft)] tabular-nums">
          {filtered.length} of {entries.length} statements
        </p>
        {filtered.length === 0 ? (
          <EmptyState title="No statements match these filters." />
        ) : (
          <ul className="divide-y divide-[var(--color-line)]">
            {filtered.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ClaimChip kind={e.kind} />
                  <Link
                    href={e.href}
                    className="text-sm font-medium hover:text-[var(--color-accent)]"
                  >
                    {e.title}
                  </Link>
                  {e.proved ? (
                    <Chip tone="quiet" title="A complete proof is given on the page">
                      proof included
                    </Chip>
                  ) : null}
                </div>
                <p className="mt-1 text-[0.85rem] leading-snug text-[var(--color-ink-soft)]">
                  {e.summary}
                </p>
                <p className="mt-1 font-mono text-[10px] tracking-wide text-[var(--color-ink-faint)] uppercase">
                  {FIELDS[e.field].short} ·{' '}
                  <Link href={`/topics/${e.topicId}`} className="hover:text-[var(--color-ink)]">
                    {e.topicTitle}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
