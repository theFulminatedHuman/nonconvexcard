import Link from 'next/link';
import type { ProblemIndexEntry } from '@/lib/problem-index';
import { FIELDS } from '@/lib/taxonomy';
import { CheckIcon } from '@/components/ui/icons';
import { Chip, DifficultyChip, TimeChip, TypeChip, cx } from '@/components/ui/primitives';

/**
 * One row of the problem database.
 *
 * Presentational and framework-free: the browser passes `solved` from
 * `localStorage`, server pages pass nothing and render the row unsolved.
 */
export function ProblemRow({
  problem,
  solved = false,
  showTeaser = true,
}: {
  problem: ProblemIndexEntry;
  solved?: boolean;
  showTeaser?: boolean;
}) {
  return (
    <Link
      href={`/problems/${problem.id}`}
      className="block px-3 py-3 transition-colors hover:bg-[var(--color-elevated)]"
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <span
          aria-hidden
          className={cx(
            'grid size-4 shrink-0 place-items-center rounded-full border',
            solved
              ? 'border-[var(--color-diff-foundation)] bg-[var(--color-diff-foundation)]/15 text-[var(--color-diff-foundation)]'
              : 'border-[var(--color-line-strong)] text-transparent',
          )}
        >
          <CheckIcon size={10} />
        </span>
        <span className="min-w-0 flex-1 text-sm font-medium">
          {problem.title}
          {solved ? <span className="sr-only"> (completed)</span> : null}
        </span>
        {problem.abyss ? (
          <Chip tone="accent" title="Part of The Abyss">
            Abyss
          </Chip>
        ) : null}
        <TypeChip type={problem.type} />
        <DifficultyChip difficulty={problem.difficulty} />
        <TimeChip time={problem.estimatedTime} />
      </div>
      {showTeaser ? (
        <p className="mt-1.5 ml-6.5 line-clamp-2 text-[0.82rem] leading-snug text-[var(--color-ink-faint)]">
          {problem.teaser}
        </p>
      ) : null}
      <p className="mt-1 ml-6.5 font-mono text-[10px] tracking-wide text-[var(--color-ink-faint)] uppercase">
        {FIELDS[problem.field].short}
        {problem.topicTitle ? ` · ${problem.topicTitle}` : ''}
        {problem.hints > 0 ? ` · ${problem.hints} hint${problem.hints === 1 ? '' : 's'}` : ''}
      </p>
    </Link>
  );
}
