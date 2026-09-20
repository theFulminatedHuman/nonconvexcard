import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ProblemBrowser } from '@/components/problems/problem-browser';
import { PageHeader } from '@/components/ui/primitives';
import { buildProblemIndex } from '@/lib/problem-index';
import { judgeCount } from '@/lib/judge';
import { DIFFICULTIES, DIFFICULTY_LABEL, PROBLEM_TYPES, PROBLEM_TYPE_LABEL } from '@/lib/taxonomy';

export const metadata: Metadata = {
  title: 'Problems',
  description:
    'A filterable database of proof, numerical and coding problems, from foundation exercises to open research questions.',
};

export default function ProblemsPage() {
  const problems = buildProblemIndex();
  const byType = PROBLEM_TYPES.map((t) => ({
    type: t,
    count: problems.filter((p) => p.type === t).length,
  }));
  const hardest = DIFFICULTIES.filter((d) => problems.some((p) => p.difficulty === d)).at(-1);

  return (
    <div className="mx-auto max-w-[84rem] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Practice"
        title="Problem database"
        lead={
          <>
            {problems.length} problems across {byType.map((t) => `${t.count} ${PROBLEM_TYPE_LABEL[t.type].toLowerCase()}`).join(', ')}.
            Every problem has a complete worked solution, and most have a hint ladder you can climb
            one rung at a time.{' '}
            <Link href="/problems/?runnable=1" className="text-[var(--color-accent)] hover:underline">
              {judgeCount()} come with a code editor
            </Link>{' '}
            and run in your browser against test cases — marked{' '}
            <strong className="font-normal text-[var(--color-diff-foundation)]">run</strong> in the
            table. The hardest sit in{' '}
            <Link href="/abyss" className="text-[var(--color-accent)] hover:underline">
              The Abyss
            </Link>
            .
          </>
        }
      >
        <p className="text-xs text-[var(--color-ink-faint)]">
          Difficulty runs {DIFFICULTY_LABEL[DIFFICULTIES[0]]} →{' '}
          {hardest ? DIFFICULTY_LABEL[hardest] : DIFFICULTY_LABEL.olympiad}. It describes the
          mathematical maturity a problem assumes, not how long it takes — the time estimate is
          separate, and both are honest estimates rather than measurements.
        </p>
      </PageHeader>

      <Suspense fallback={<p className="text-sm text-[var(--color-ink-faint)]">Loading problems…</p>}>
        <ProblemBrowser problems={problems} />
      </Suspense>
    </div>
  );
}
