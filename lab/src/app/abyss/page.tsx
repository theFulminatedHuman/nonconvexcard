import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ProblemBrowser } from '@/components/problems/problem-browser';
import { PageHeader } from '@/components/ui/primitives';
import { buildProblemIndex } from '@/lib/problem-index';

export const metadata: Metadata = {
  title: 'The Abyss',
  description:
    'The hardest problems on the site: multi-hour derivations, research-level questions and genuinely open problems.',
};

export default function AbyssPage() {
  const problems = buildProblemIndex().filter((p) => p.abyss);

  return (
    <div className="mx-auto max-w-[84rem] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Practice"
        title="The Abyss"
        lead={
          <>
            {problems.length} problems that are hard on purpose. Some are multi-hour derivations that
            appear in the literature as a line reading “a standard computation shows”. Some ask you to
            find where a bound is loose. A few are honestly open, and are labelled as such — no
            solution exists to reveal, because nobody has one.
          </>
        }
      >
        <p className="text-xs text-[var(--color-ink-faint)]">
          If a problem here is taking hours, that is the intended experience. Work it with the{' '}
          <Link href="/proofs" className="text-[var(--color-accent)] hover:underline">
            proof library
          </Link>{' '}
          open — every technique these need is proved somewhere on the site.
        </p>
      </PageHeader>

      <Suspense fallback={<p className="text-sm text-[var(--color-ink-faint)]">Loading…</p>}>
        <ProblemBrowser problems={problems} />
      </Suspense>
    </div>
  );
}
