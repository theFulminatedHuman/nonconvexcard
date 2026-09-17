'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useHasMounted } from '@/hooks/use-local-store';
import { useProgress } from '@/hooks/use-progress';
import { dailySelection } from '@/lib/daily';
import { formatLongDate, today } from '@/lib/dates';
import type { ProblemIndexEntry } from '@/lib/problem-index';
import { dueForReview, suggestedDifficulty } from '@/lib/progress';
import { DIFFICULTY_LABEL, FIELDS } from '@/lib/taxonomy';
import {
  Card,
  Chip,
  DifficultyChip,
  EmptyState,
  TimeChip,
  TypeChip,
} from '@/components/ui/primitives';

/**
 * Today's work.
 *
 * The selection is a pure function of the date and what you have already
 * solved, so it does not change when you reload and it is the same on every
 * device — you cannot reroll a problem you do not fancy, which is the point.
 */
export function DailyBoard({ problems }: { problems: ProblemIndexEntry[] }) {
  const { state } = useProgress();
  const mounted = useHasMounted();

  const solved = useMemo(() => {
    const ids = new Set<string>();
    for (const e of state.entries) if (e.kind === 'problem') ids.add(e.refId);
    return ids;
  }, [state]);

  const level = useMemo(() => suggestedDifficulty(state), [state]);
  const date = mounted ? today() : '';
  const slots = useMemo(
    () => (mounted ? dailySelection(date, problems, solved, level) : []),
    [mounted, date, problems, solved, level],
  );
  const review = useMemo(() => (mounted ? dueForReview(state) : []), [mounted, state]);

  if (!mounted) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-elevated)]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-xs text-[var(--color-ink-soft)]">{formatLongDate(date)}</p>
        <p className="text-xs text-[var(--color-ink-faint)]">
          Calibrated to <strong className="font-medium">{DIFFICULTY_LABEL[level]}</strong> — one step
          above the hardest level you have solved three problems at.
        </p>
      </div>

      {slots.length === 0 ? (
        <EmptyState
          title="Nothing left to select."
          hint={
            <>
              Every problem in the database is marked solved. Try{' '}
              <Link href="/abyss" className="text-[var(--color-accent)] hover:underline">
                The Abyss
              </Link>{' '}
              again without the solutions open, or unmark something you want to revisit.
            </>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {slots.map((slot) => (
            <li key={slot.problem.id}>
              <Card className="flex h-full flex-col p-4">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="mono-label">{slot.role.replace('-', ' ')}</span>
                  <span className="font-mono text-[10px] text-[var(--color-ink-faint)]">
                    {FIELDS[slot.problem.field].short}
                  </span>
                </div>
                <Link
                  href={`/problems/${slot.problem.id}`}
                  className="text-sm font-medium hover:text-[var(--color-accent)]"
                >
                  {slot.problem.title}
                </Link>
                <p className="mt-1 line-clamp-2 flex-1 text-[0.8rem] leading-snug text-[var(--color-ink-faint)]">
                  {slot.problem.teaser}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <TypeChip type={slot.problem.type} />
                  <DifficultyChip difficulty={slot.problem.difficulty} />
                  <TimeChip time={slot.problem.estimatedTime} />
                </div>
                <p className="mt-2 border-t border-[var(--color-line)] pt-2 text-[11px] leading-snug text-[var(--color-ink-faint)]">
                  {slot.rationale}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <section>
        <div className="mb-2 flex items-baseline justify-between gap-3 border-b border-[var(--color-line)] pb-2">
          <h2 className="text-sm font-semibold">Due for review</h2>
          <span className="font-mono text-[11px] text-[var(--color-ink-faint)] tabular-nums">
            {review.length}
          </span>
        </div>
        {review.length === 0 ? (
          <p className="text-[0.85rem] text-[var(--color-ink-faint)]">
            Nothing is due. Problems resurface 3, 7, 21 and 60 days after you solve them — a fixed
            Leitner-style schedule, not a model of your memory.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-line)]">
            {review.map((e) => (
              <li key={e.key} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 py-2">
                <Link
                  href={`/problems/${e.refId}`}
                  className="text-sm font-medium hover:text-[var(--color-accent)]"
                >
                  {e.title}
                </Link>
                <Chip tone="quiet">{FIELDS[e.field].short}</Chip>
                <span className="font-mono text-[10px] text-[var(--color-ink-faint)]">
                  solved {e.date}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
