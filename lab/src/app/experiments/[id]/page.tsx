import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CompleteButton } from '@/components/progress/complete-button';
import { Chip, LinkCard, PageHeader, SectionHeading } from '@/components/ui/primitives';
import { ExperimentRunner } from '@/experiments/loader';
import { EXPERIMENTS, getExperiment } from '@/experiments/registry';
import { getTopicById } from '@/lib/content';
import { FIELDS, TIME_MINUTES } from '@/lib/taxonomy';

export const dynamicParams = false;

export function generateStaticParams() {
  return EXPERIMENTS.map((e) => ({ id: e.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const experiment = getExperiment(id);
  if (!experiment) return {};
  return { title: experiment.title, description: experiment.summary };
}

export default async function ExperimentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const experiment = getExperiment(id);
  if (!experiment) notFound();

  const topics = experiment.topics
    .map((t) => getTopicById(t))
    .filter((t): t is NonNullable<typeof t> => !!t);
  const siblings = EXPERIMENTS.filter((e) => e.field === experiment.field && e.id !== experiment.id);

  return (
    <div className="mx-auto max-w-[76rem] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow={
          <Link href="/experiments" className="hover:text-[var(--color-ink)]">
            Experiments
          </Link>
        }
        title={experiment.title}
        lead={experiment.summary}
      >
        <div className="flex flex-wrap items-center gap-3">
          <CompleteButton
            kind="experiment"
            refId={experiment.id}
            title={experiment.title}
            field={experiment.field}
            minutes={TIME_MINUTES[experiment.estimated_time]}
            labels={{ todo: 'Mark experiment run', done: 'Run' }}
          />
          <Chip tone="accent">{FIELDS[experiment.field].short}</Chip>
          {experiment.tags.slice(0, 4).map((t) => (
            <Chip key={t} tone="quiet">
              {t}
            </Chip>
          ))}
        </div>
      </PageHeader>

      <ExperimentRunner id={experiment.id} />

      {topics.length > 0 ? (
        <section className="mt-10">
          <SectionHeading title="The mathematics behind this" />
          <ul className="grid gap-3 sm:grid-cols-2">
            {topics.map((t) => (
              <li key={t.id}>
                <LinkCard href={`/topics/${t.id}`} className="h-full p-3.5">
                  <p className="text-sm font-medium">{t.frontmatter.title}</p>
                  <p className="mt-0.5 text-[0.82rem] leading-snug text-[var(--color-ink-faint)]">
                    {t.frontmatter.summary}
                  </p>
                </LinkCard>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {siblings.length > 0 ? (
        <section className="mt-8">
          <SectionHeading title="Other experiments in this field" />
          <ul className="flex flex-wrap gap-2">
            {siblings.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/experiments/${e.id}`}
                  className="inline-block rounded border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-soft)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)]"
                >
                  {e.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
