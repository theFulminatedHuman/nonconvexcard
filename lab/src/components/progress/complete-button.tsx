'use client';

import { useProgress } from '@/hooks/use-progress';
import { useHasMounted } from '@/hooks/use-local-store';
import { today } from '@/lib/dates';
import type { ActivityKind } from '@/lib/progress';
import type { Difficulty, FieldSlug, ProblemType } from '@/lib/taxonomy';
import { CheckIcon } from '@/components/ui/icons';
import { cx } from '@/components/ui/primitives';

/**
 * Marks an item as done, which is what feeds the heatmap and the mastery bars.
 *
 * Rendered as a placeholder until mounted: the answer depends on
 * `localStorage`, which does not exist during the static pre-render.
 */
export function CompleteButton({
  kind,
  refId,
  title,
  field,
  minutes,
  difficulty,
  type,
  labels = { todo: 'Mark complete', done: 'Completed' },
  size = 'md',
}: {
  kind: ActivityKind;
  refId: string;
  title: string;
  field: FieldSlug;
  minutes: number;
  difficulty?: Difficulty;
  type?: ProblemType;
  labels?: { todo: string; done: string };
  size?: 'sm' | 'md';
}) {
  const { isDone, toggle } = useProgress();
  const mounted = useHasMounted();
  const done = mounted && isDone(kind, refId);

  return (
    <button
      type="button"
      aria-pressed={done}
      onClick={() =>
        toggle({ kind, refId, title, field, minutes, difficulty, type, date: today() })
      }
      className={cx(
        'inline-flex items-center gap-1.5 rounded border font-medium transition-colors',
        size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs',
        done
          ? 'border-[var(--color-diff-foundation)]/50 bg-[var(--color-diff-foundation)]/12 text-[var(--color-diff-foundation)]'
          : 'border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)]',
      )}
    >
      <CheckIcon size={size === 'sm' ? 12 : 13} className={done ? '' : 'opacity-40'} />
      {done ? labels.done : labels.todo}
    </button>
  );
}
