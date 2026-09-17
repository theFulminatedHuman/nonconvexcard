import type { Metadata } from 'next';
import Link from 'next/link';
import { Track } from '@/components/learn/track';
import { Card, PageHeader } from '@/components/ui/primitives';
import { buildLearningPath } from '@/lib/learning-path';

export const metadata: Metadata = {
  title: 'Learning path',
  description:
    'A dependency-ordered route from linear algebra to the mathematics of large language models, with what each stage buys you stated explicitly.',
};

export default function LearnPage() {
  const stages = buildLearningPath();
  const topics = stages.reduce((a, s) => a + s.topics.length, 0);
  const hours = Math.round(
    stages.reduce((a, s) => a + s.topics.reduce((b, t) => b + t.minutes, 0), 0) / 60,
  );

  return (
    <div className="mx-auto max-w-[70rem] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Start"
        title="Learning path"
        lead={`${stages.length} stages, ${topics} topics, roughly ${hours} hours of reading before you
          attempt the problems — and the problems are where the time actually goes. The order is a
          dependency claim: each stage uses results proved in the ones above it.`}
      >
        <Card className="max-w-3xl p-4">
          <p className="mono-label mb-1.5">How to use this</p>
          <p className="text-[0.85rem] leading-relaxed text-[var(--color-ink-soft)]">
            Read a topic, then do its problems before moving on — the reading is the smaller half.
            Mark topics studied as you go and the{' '}
            <Link href="/graph" className="text-[var(--color-accent)] hover:underline">
              mastery graph
            </Link>{' '}
            will show what has opened up; the{' '}
            <Link href="/daily" className="text-[var(--color-accent)] hover:underline">
              daily selection
            </Link>{' '}
            will start resurfacing old work for review. Skipping ahead is fine if you already know a
            stage: the graph will tell you what a page assumes, and you can go back for exactly that.
          </p>
        </Card>
      </PageHeader>

      <Track stages={stages} />
    </div>
  );
}
