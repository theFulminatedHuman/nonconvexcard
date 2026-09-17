import type { Metadata } from 'next';
import Link from 'next/link';
import { NextUp, RecentActivity, ReviewBanner, type NextTopic } from '@/components/dashboard/panels';
import { ContributionHeatmap } from '@/components/progress/heatmap';
import { StreakPanel, TotalsPanel } from '@/components/progress/stats';
import { LinkCard, PageHeader, SectionHeading } from '@/components/ui/primitives';
import { allProblems, allTopics } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'Your streak, what is ready to study next, what is due for review, and everything you have recorded.',
};

const SHORTCUTS = [
  { href: '/daily', title: 'Daily mathematics', hint: 'Four problems chosen for today' },
  { href: '/learn', title: 'Learning path', hint: 'The dependency-ordered route' },
  { href: '/problems', title: 'Problem database', hint: 'Filter by field, difficulty and type' },
  { href: '/graph', title: 'Mastery graph', hint: 'What your progress has opened up' },
];

export default function DashboardPage() {
  const topics = allTopics();
  const problems = allProblems();

  const nextTopics: NextTopic[] = topics.map((t, i) => ({
    id: t.id,
    title: t.frontmatter.title,
    summary: t.frontmatter.summary,
    field: t.field,
    level: t.frontmatter.level,
    prerequisites: t.frontmatter.prerequisites,
    order: i,
  }));

  return (
    <div className="mx-auto max-w-[76rem] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Start"
        title="Dashboard"
        lead="Where you are, and the shortest sensible thing to do next. Everything here is computed in
          this browser from your own records."
      />

      <div className="space-y-8">
        <ReviewBanner />

        <StreakPanel />

        <section>
          <SectionHeading
            title="Study next"
            action={
              <Link href="/graph" className="text-xs text-[var(--color-accent)] hover:underline">
                Full graph
              </Link>
            }
          />
          <NextUp topics={nextTopics} />
        </section>

        <section>
          <SectionHeading
            title="Recent activity"
            action={
              <Link href="/progress" className="text-xs text-[var(--color-accent)] hover:underline">
                Full history
              </Link>
            }
          />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <RecentActivity />
            <TotalsPanel available={{ problems: problems.length, topics: topics.length }} />
          </div>
        </section>

        <section>
          <SectionHeading title="Last six months" />
          <ContributionHeatmap weeks={27} />
        </section>

        <section>
          <SectionHeading title="Jump to" />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SHORTCUTS.map((s) => (
              <li key={s.href}>
                <LinkCard href={s.href} className="h-full p-3.5">
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="mt-0.5 text-[0.8rem] leading-snug text-[var(--color-ink-faint)]">
                    {s.hint}
                  </p>
                </LinkCard>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
