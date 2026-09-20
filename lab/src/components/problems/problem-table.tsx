import Link from 'next/link';
import type { ProblemIndexEntry } from '@/lib/problem-index';
import {
  DIFFICULTY_LABEL,
  FIELDS,
  PROBLEM_TYPE_LABEL,
  TIME_LABEL,
  type Difficulty,
} from '@/lib/taxonomy';
import { CheckIcon } from '@/components/ui/icons';
import { cx } from '@/components/ui/primitives';

/** Difficulty as saturated bold text, the way contest sites render rating. */
export function Rating({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`rating rating-${difficulty}`} title={`Difficulty: ${DIFFICULTY_LABEL[difficulty]}`}>
      {DIFFICULTY_LABEL[difficulty]}
    </span>
  );
}

/**
 * The problem list as an actual table.
 *
 * A table rather than a stack of cards because that is what the content is: a
 * few hundred rows with five comparable attributes, meant to be scanned down a
 * column. Gridlines and a header bar make the columns legible; difficulty is
 * coloured text so a whole page of it can be read at a glance.
 */
export function ProblemTable({
  problems,
  solvedIds,
  showTeaser = false,
  showField = true,
}: {
  problems: ProblemIndexEntry[];
  /** Ids completed by the reader; omitted on server-rendered listings. */
  solvedIds?: ReadonlySet<string>;
  /** Off by default: a contest problem list is one line per problem. */
  showTeaser?: boolean;
  showField?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col" className="w-7">
              <span className="sr-only">Solved</span>
            </th>
            <th scope="col">Problem</th>
            {showField ? <th scope="col">Field</th> : null}
            <th scope="col">Type</th>
            <th scope="col">Difficulty</th>
            <th scope="col" className="num">
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          {problems.map((p) => {
            const done = solvedIds?.has(p.id) ?? false;
            return (
              <tr key={p.id}>
                <td>
                  <span
                    aria-hidden
                    className={cx(
                      'grid size-4 place-items-center rounded-full border',
                      done
                        ? 'border-[var(--color-diff-foundation)] bg-[var(--color-diff-foundation)]/15 text-[var(--color-diff-foundation)]'
                        : 'border-[var(--color-line-strong)] text-transparent',
                    )}
                  >
                    <CheckIcon size={10} />
                  </span>
                  {done ? <span className="sr-only">Solved</span> : null}
                </td>
                <td>
                  <Link
                    href={`/problems/${p.id}`}
                    className="font-medium text-[var(--color-accent)] hover:underline"
                  >
                    {p.title}
                  </Link>
                  {p.runnable ? (
                    <>
                      {' '}
                      <span
                        className="ml-1.5 font-mono text-[10px] tracking-wide text-[var(--color-diff-foundation)] uppercase"
                        title="Has tests you can run in the browser"
                      >
                        run
                      </span>
                    </>
                  ) : null}
                  {p.abyss ? (
                    <>
                      {' '}
                      <span className="ml-1.5 font-mono text-[10px] tracking-wide text-[var(--color-diff-olympiad)] uppercase">
                        abyss
                      </span>
                    </>
                  ) : null}
                  {showTeaser ? (
                    <span className="mt-0.5 block max-w-prose text-[0.78rem] leading-snug text-[var(--color-ink-faint)]">
                      {p.teaser}
                    </span>
                  ) : null}
                </td>
                {showField ? (
                  <td className="text-[0.78rem] whitespace-nowrap text-[var(--color-ink-soft)]">
                    {FIELDS[p.field].short}
                  </td>
                ) : null}
                <td className="text-[0.78rem] whitespace-nowrap text-[var(--color-ink-soft)]">
                  {PROBLEM_TYPE_LABEL[p.type]}
                </td>
                <td>
                  <Rating difficulty={p.difficulty} />
                </td>
                <td className="num text-[0.78rem] text-[var(--color-ink-soft)]">
                  {TIME_LABEL[p.estimatedTime]}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
