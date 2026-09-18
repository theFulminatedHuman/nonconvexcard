import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProblemTable } from '@/components/problems/problem-table';
import {
  Chip,
  LinkCard,
  PageHeader,
  SectionHeading,
  TimeChip,
} from '@/components/ui/primitives';
import { EXPERIMENTS } from '@/experiments/registry';
import { allPapers, allProblems, populatedFields, topicsByField } from '@/lib/content';
import { buildProblemIndex } from '@/lib/problem-index';
import { FIELDS, LEVELS, LEVEL_LABEL, isFieldSlug } from '@/lib/taxonomy';

export const dynamicParams = false;

export function generateStaticParams() {
  return populatedFields().map((field) => ({ field }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ field: string }>;
}): Promise<Metadata> {
  const { field } = await params;
  if (!isFieldSlug(field)) return {};
  return { title: FIELDS[field].title, description: FIELDS[field].blurb };
}

export default async function FieldPage({ params }: { params: Promise<{ field: string }> }) {
  const { field } = await params;
  if (!isFieldSlug(field)) notFound();
  const meta = FIELDS[field];
  const topics = topicsByField(field);
  if (topics.length === 0) notFound();

  const problems = buildProblemIndex().filter((p) => p.field === field);
  const experiments = EXPERIMENTS.filter((e) => e.field === field);
  const papers = allPapers().filter(
    (p) => p.frontmatter.field === field || p.frontmatter.also.includes(field),
  );
  const dependents = populatedFields().filter((f) => FIELDS[f].requires.includes(field));
  const totalProblems = allProblems().length;

  return (
    <div className="mx-auto max-w-[76rem] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow={
          <Link href="/topics" className="hover:text-[var(--color-ink)]">
            Topics
          </Link>
        }
        title={meta.title}
        lead={meta.blurb}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip>{topics.length} topics</Chip>
          <Chip>
            {problems.length} problems ({Math.round((problems.length / totalProblems) * 100)}% of the
            database)
          </Chip>
          {experiments.length > 0 ? <Chip>{experiments.length} experiments</Chip> : null}
          {meta.requires.map((r) => (
            <Link key={r} href={`/topics/${r}`}>
              <Chip tone="accent">assumes {FIELDS[r].short}</Chip>
            </Link>
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-8">
          {LEVELS.map((level) => {
            const atLevel = topics.filter((t) => t.frontmatter.level === level);
            if (atLevel.length === 0) return null;
            return (
              <section key={level}>
                <SectionHeading title={LEVEL_LABEL[level]} />
                <ul className="grid gap-3 sm:grid-cols-2">
                  {atLevel.map((t) => (
                    <li key={t.id}>
                      <LinkCard href={`/topics/${t.id}`} className="h-full p-3.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium">{t.frontmatter.title}</span>
                          <span className="mono-label shrink-0">{t.readingMinutes} min</span>
                        </div>
                        <p className="mt-1 text-[0.82rem] leading-snug text-[var(--color-ink-soft)]">
                          {t.frontmatter.summary}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {t.frontmatter.claims.slice(0, 3).map((c) => (
                            <Chip key={c.id} tone="quiet">
                              {c.title}
                            </Chip>
                          ))}
                        </div>
                      </LinkCard>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          {problems.length > 0 ? (
            <section>
              <SectionHeading
                title={`Problems (${problems.length})`}
                action={
                  <Link
                    href={`/problems?field=${field}`}
                    className="text-xs text-[var(--color-accent)] hover:underline"
                  >
                    Open in the browser
                  </Link>
                }
              />
              <div className="panel">
                <ProblemTable problems={problems.slice(0, 12)} showField={false} />
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          {experiments.length > 0 ? (
            <div>
              <SectionHeading title="Experiments" />
              <ul className="space-y-2">
                {experiments.map((e) => (
                  <li key={e.id}>
                    <LinkCard href={`/experiments/${e.id}`} className="p-3">
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="mt-0.5 text-[0.78rem] leading-snug text-[var(--color-ink-faint)]">
                        {e.summary}
                      </p>
                      <div className="mt-1.5">
                        <TimeChip time={e.estimated_time} />
                      </div>
                    </LinkCard>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {papers.length > 0 ? (
            <div>
              <SectionHeading title="Papers" />
              <ul className="space-y-1.5">
                {papers.slice(0, 10).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/papers/${p.id}`}
                      className="block text-[0.82rem] leading-snug hover:text-[var(--color-accent)]"
                    >
                      {p.frontmatter.title}
                      <span className="block font-mono text-[10px] text-[var(--color-ink-faint)]">
                        {p.frontmatter.year}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {dependents.length > 0 ? (
            <div>
              <SectionHeading title="Leads to" />
              <ul className="space-y-1.5">
                {dependents.map((d) => (
                  <li key={d}>
                    <Link
                      href={`/topics/${d}`}
                      className="text-[0.82rem] text-[var(--color-accent)] hover:underline"
                    >
                      {FIELDS[d].title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
