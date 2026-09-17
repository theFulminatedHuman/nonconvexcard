import type { Metadata } from 'next';
import { DailyBoard } from '@/components/daily/daily-board';
import { PageHeader } from '@/components/ui/primitives';
import { buildProblemIndex } from '@/lib/problem-index';

export const metadata: Metadata = {
  title: 'Daily mathematics',
  description:
    'Four problems chosen for today — one below your level, two at it, one above — plus whatever is due for spaced review.',
};

export default function DailyPage() {
  return (
    <div className="mx-auto max-w-[70rem] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Start"
        title="Daily mathematics"
        lead="Four problems: one below the level you are working at, two at it in different fields, and
          one above. The last one is meant to defeat you more often than not — that is what it is for."
      >
        <p className="max-w-3xl text-xs leading-relaxed text-[var(--color-ink-faint)]">
          The set is a deterministic function of the date and what you have already solved, so
          reloading does not reroll it and the same day gives the same problems on any device. It is
          computed in your browser; nothing about your progress leaves it.
        </p>
      </PageHeader>

      <DailyBoard problems={buildProblemIndex()} />
    </div>
  );
}
