'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useHasMounted } from '@/hooks/use-local-store';
import { useProgress } from '@/hooks/use-progress';
import { formatLongDate } from '@/lib/dates';
import { dueForReview } from '@/lib/progress';
import { FIELDS, LEVEL_SHORT, type FieldSlug, type Level } from '@/lib/taxonomy';
import { ArrowRightIcon } from '@/components/ui/icons';
import { Card, Chip, EmptyState, LinkCard } from '@/components/ui/primitives';

export interface NextTopic {
  id: string;
  title: string;
  summary: string;
  field: FieldSlug;
  level: Level;
  prerequisites: string[];
  order: number;
}

const HREF_BY_KIND = {
  problem: (id: string) => `/problems/${id}`,
  topic: (id: string) => `/topics/${id}`,
  experiment: (id: string) => `/experiments/${id}`,
  paper: (id: string) => `/papers/${id}`,
} as const;

/**
 * What to study next.
 *
 * "Next" means: not yet studied, every declared prerequisite studied, earliest
 * in the dependency order. When nothing has been studied yet this degenerates
 * to the roots of the graph, which is the right answer for a first visit.
 */
export function NextUp({ topics }: { topics: NextTopic[] }) {
  const { state } = useProgress();
  const mounted = useHasMounted();

  const done = useMemo(() => {
    const ids = new Set<string>();
    for (const e of state.entries) if (e.kind === 'topic') ids.add(e.refId);
    return ids;
  }, [state]);

  const next = useMemo(
    () =>
      topics
        .filter((t) => !done.has(t.id) && t.prerequisites.every((p) => done.has(p)))
        .sort((a, b) => a.order - b.order)
        .slice(0, 4),
    [topics, done],
  );

  if (!mounted) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-elevated)]"
          />
        ))}
      </div>
    );
  }

  if (next.length === 0) {
    return (
      <EmptyState
        title="Every topic whose prerequisites you have met is marked studied."
        hint={
          <>
            Go to the{' '}
            <Link href="/graph" className="text-[var(--color-accent)] hover:underline">
              mastery graph
            </Link>{' '}
            to see what is left, or start on{' '}
            <Link href="/abyss" className="text-[var(--color-accent)] hover:underline">
              The Abyss
            </Link>
            .
          </>
        }
      />
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {next.map((t) => (
        <li key={t.id}>
          <LinkCard href={`/topics/${t.id}`} className="h-full p-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{t.title}</span>
              <span className="mono-label shrink-0">{LEVEL_SHORT[t.level]}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-[0.82rem] leading-snug text-[var(--color-ink-soft)]">
              {t.summary}
            </p>
            <p className="mt-1.5 font-mono text-[10px] tracking-wide text-[var(--color-ink-faint)] uppercase">
              {FIELDS[t.field].short}
            </p>
          </LinkCard>
        </li>
      ))}
    </ul>
  );
}

/** The last things you touched, newest first. */
export function RecentActivity({ limit = 8 }: { limit?: number }) {
  const { state } = useProgress();
  const mounted = useHasMounted();

  const recent = useMemo(
    () => [...state.entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit),
    [state, limit],
  );

  if (!mounted) {
    return (
      <div className="h-40 animate-pulse rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-elevated)]" />
    );
  }

  if (recent.length === 0) {
    return (
      <EmptyState
        title="Nothing recorded yet."
        hint={
          <>
            Mark a topic studied or a problem solved and it will appear here, in the heatmap and in
            the review schedule. Start with the{' '}
            <Link href="/learn" className="text-[var(--color-accent)] hover:underline">
              learning path
            </Link>
            .
          </>
        }
      />
    );
  }

  return (
    <Card className="divide-y divide-[var(--color-line)]">
      {recent.map((e) => (
        <Link
          key={e.key}
          href={HREF_BY_KIND[e.kind](e.refId)}
          className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-[var(--color-elevated)]"
        >
          <span className="min-w-0 flex-1 truncate text-[0.85rem]">{e.title}</span>
          <Chip tone="quiet">{e.kind}</Chip>
          <span className="shrink-0 font-mono text-[10px] text-[var(--color-ink-faint)]">
            {formatLongDate(e.date)}
          </span>
        </Link>
      ))}
    </Card>
  );
}

/** A one-line prompt when spaced review has surfaced something. */
export function ReviewBanner() {
  const { state } = useProgress();
  const mounted = useHasMounted();
  const due = useMemo(() => (mounted ? dueForReview(state) : []), [mounted, state]);

  if (due.length === 0) return null;

  return (
    <Link
      href="/daily"
      className="flex items-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)] px-4 py-2.5 text-sm text-[var(--color-accent-ink)] transition-colors hover:border-[var(--color-accent)]"
    >
      <span className="flex-1">
        {due.length} problem{due.length === 1 ? ' is' : 's are'} due for review today.
      </span>
      <ArrowRightIcon size={14} />
    </Link>
  );
}
