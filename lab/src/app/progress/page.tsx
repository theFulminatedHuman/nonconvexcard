import type { Metadata } from 'next';
import { DataControls } from '@/components/progress/data-controls';
import { ContributionHeatmap } from '@/components/progress/heatmap';
import {
  DifficultyBreakdown,
  FieldMasteryPanel,
  StreakPanel,
  TotalsPanel,
  type FieldAvailability,
} from '@/components/progress/stats';
import { PageHeader, SectionHeading } from '@/components/ui/primitives';
import { allProblems, allTopics, populatedFields } from '@/lib/content';
import { DIFFICULTIES } from '@/lib/taxonomy';

export const metadata: Metadata = {
  title: 'Progress',
  description:
    'A contribution heatmap, streaks, difficulty breakdown and per-field coverage — computed in your browser from your own records.',
};

export default function ProgressPage() {
  const topics = allTopics();
  const problems = allProblems();

  const availability: FieldAvailability[] = populatedFields().map((field) => ({
    field,
    topics: topics.filter((t) => t.field === field).length,
    problems: problems.filter((p) => p.field === field).length,
  }));

  const byDifficulty = Object.fromEntries(
    DIFFICULTIES.map((d) => [d, problems.filter((p) => p.difficulty === d).length]),
  );

  return (
    <div className="mx-auto max-w-[76rem] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Reference"
        title="Progress"
        lead="Everything below is derived from records kept in this browser. There is no account, no
          sync and no telemetry — which also means this page is empty on a machine you have not used
          before, and that an export is the only backup."
      />

      <section className="mb-8">
        <StreakPanel />
      </section>

      <section className="mb-10">
        <SectionHeading title="Activity" />
        <ContributionHeatmap />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionHeading title="Completed" />
          <TotalsPanel available={{ problems: problems.length, topics: topics.length }} />
        </section>

        <section>
          <SectionHeading title="By difficulty" />
          <DifficultyBreakdown available={byDifficulty} />
        </section>

        <section>
          <SectionHeading title="Coverage by field" />
          <FieldMasteryPanel availability={availability} />
        </section>

        <section>
          <SectionHeading title="Data" />
          <DataControls />
        </section>
      </div>
    </div>
  );
}
