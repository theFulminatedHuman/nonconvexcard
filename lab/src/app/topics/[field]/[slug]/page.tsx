import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReferenceList } from '@/components/content/references';
import { TableOfContents } from '@/components/content/toc';
import { CompleteButton } from '@/components/progress/complete-button';
import { ArrowRightIcon, FlaskIcon } from '@/components/ui/icons';
import {
  Card,
  Chip,
  ClaimChip,
  DifficultyChip,
  LinkCard,
  SectionHeading,
  TimeChip,
  TypeChip,
} from '@/components/ui/primitives';
import { experimentsForTopic } from '@/experiments/registry';
import {
  allPapers,
  allTopics,
  getPaper,
  getTopic,
  getTopicById,
  problemsForTopic,
} from '@/lib/content';
import { renderMdx } from '@/lib/mdx';
import { FIELDS, LEVEL_SHORT, TIME_MINUTES } from '@/lib/taxonomy';

export const dynamicParams = false;

export function generateStaticParams() {
  return allTopics().map((t) => ({ field: t.field, slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ field: string; slug: string }>;
}): Promise<Metadata> {
  const { field, slug } = await params;
  const topic = getTopic(field, slug);
  if (!topic) return {};
  return {
    title: topic.frontmatter.title,
    description: topic.frontmatter.summary,
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ field: string; slug: string }>;
}) {
  const { field, slug } = await params;
  const topic = getTopic(field, slug);
  if (!topic) notFound();

  const fm = topic.frontmatter;
  const meta = FIELDS[topic.field];
  const body = await renderMdx(topic.body);
  const problems = problemsForTopic(topic.id);
  const experiments = experimentsForTopic(topic.id);
  const papers = fm.papers.map((id) => getPaper(id)).filter((p): p is NonNullable<typeof p> => !!p);
  const citedBy = allPapers().filter((p) => p.frontmatter.prerequisites.includes(topic.id));
  const prerequisites = fm.prerequisites
    .map((id) => getTopicById(id))
    .filter((t): t is NonNullable<typeof t> => !!t);

  const siblings = allTopics().filter((t) => t.field === topic.field);
  const index = siblings.findIndex((t) => t.id === topic.id);
  const prev = index > 0 ? siblings[index - 1] : undefined;
  const next = index < siblings.length - 1 ? siblings[index + 1] : undefined;

  const claims = fm.claims;

  return (
    <div className="mx-auto grid max-w-[76rem] gap-10 px-4 py-8 sm:px-6 xl:grid-cols-[minmax(0,1fr)_14rem]">
      <article className="min-w-0">
        <nav aria-label="Breadcrumb" className="mono-label mb-3 flex flex-wrap items-center gap-1.5">
          <Link href="/topics" className="hover:text-[var(--color-ink)]">
            Topics
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/topics/${topic.field}`} className="hover:text-[var(--color-ink)]">
            {meta.short}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-[var(--color-ink-soft)]">{LEVEL_SHORT[fm.level]}</span>
        </nav>

        <header className="border-b border-[var(--color-line)] pb-5">
          <h1 className="text-[1.6rem] leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-[1.9rem]">
            {fm.title}
          </h1>
          <p className="mt-2.5 max-w-3xl text-[0.95rem] leading-relaxed text-[var(--color-ink-soft)]">
            {fm.summary}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Chip tone="accent">{meta.short}</Chip>
            <Chip>{LEVEL_SHORT[fm.level]}</Chip>
            <TimeChip time={fm.estimated_time} />
            <Chip tone="quiet">{topic.readingMinutes} min read</Chip>
            {fm.tags.slice(0, 5).map((tag) => (
              <Chip key={tag} tone="quiet">
                {tag}
              </Chip>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <CompleteButton
              kind="topic"
              refId={topic.id}
              title={fm.title}
              field={topic.field}
              minutes={TIME_MINUTES[fm.estimated_time]}
              labels={{ todo: 'Mark topic studied', done: 'Studied' }}
            />
            {problems.length > 0 ? (
              <Link
                href={`/problems?topic=${encodeURIComponent(topic.id)}`}
                className="text-xs font-medium text-[var(--color-accent)] hover:underline"
              >
                {problems.length} problem{problems.length === 1 ? '' : 's'} →
              </Link>
            ) : null}
          </div>

          {prerequisites.length > 0 ? (
            <div className="mt-4 rounded border border-[var(--color-line)] bg-[var(--color-elevated)] px-3 py-2">
              <span className="mono-label mr-2">Assumes</span>
              {prerequisites.map((p, i) => (
                <span key={p.id} className="text-[0.82rem]">
                  {i > 0 ? <span className="text-[var(--color-ink-faint)]"> · </span> : null}
                  <Link href={`/topics/${p.id}`} className="text-[var(--color-accent)] hover:underline">
                    {p.frontmatter.title}
                  </Link>
                </span>
              ))}
            </div>
          ) : null}
        </header>

        <div className="prose-lab mt-7 [[data-research='1']_&_[data-intuition]]:hidden">{body}</div>

        <ReferenceList references={fm.references} />

        {claims.length > 0 ? (
          <section className="mt-10">
            <SectionHeading title="Results stated on this page" />
            <ul className="divide-y divide-[var(--color-line)]">
              {claims.map((c) => (
                <li key={c.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5">
                  <ClaimChip kind={c.kind} />
                  <a href={`#${c.id}`} className="text-sm font-medium hover:underline">
                    {c.title}
                  </a>
                  {c.proved ? (
                    <Chip tone="quiet" title="A complete proof is given on this page">
                      proof included
                    </Chip>
                  ) : null}
                  <span className="w-full text-[0.82rem] text-[var(--color-ink-faint)]">
                    {c.summary}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {experiments.length > 0 ? (
          <section className="mt-10">
            <SectionHeading title="Experiments" />
            <ul className="grid gap-3 sm:grid-cols-2">
              {experiments.map((e) => (
                <li key={e.id}>
                  <LinkCard href={`/experiments/${e.id}`} className="h-full p-3.5">
                    <div className="flex items-start gap-2.5">
                      <FlaskIcon size={15} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{e.title}</p>
                        <p className="mt-0.5 text-[0.8rem] leading-snug text-[var(--color-ink-faint)]">
                          {e.summary}
                        </p>
                      </div>
                    </div>
                  </LinkCard>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {problems.length > 0 ? (
          <section className="mt-10">
            <SectionHeading
              title={`Problems (${problems.length})`}
              action={
                <Link
                  href="/problems"
                  className="text-xs text-[var(--color-accent)] hover:underline"
                >
                  All problems
                </Link>
              }
            />
            <ul className="divide-y divide-[var(--color-line)]">
              {problems.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/problems/${p.id}`}
                    className="flex flex-wrap items-center gap-x-2.5 gap-y-1 py-2.5 hover:bg-[var(--color-elevated)]"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.title}</span>
                    <TypeChip type={p.type} />
                    <DifficultyChip difficulty={p.difficulty} />
                    <TimeChip time={p.estimated_time} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {papers.length + citedBy.length > 0 ? (
          <section className="mt-10">
            <SectionHeading title="Papers that use this mathematics" />
            <ul className="grid gap-3 sm:grid-cols-2">
              {[...new Map([...papers, ...citedBy].map((p) => [p.id, p])).values()].map((p) => (
                <li key={p.id}>
                  <LinkCard href={`/papers/${p.id}`} className="h-full p-3.5">
                    <p className="text-sm font-medium">{p.frontmatter.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[var(--color-ink-faint)]">
                      {p.frontmatter.authors} · {p.frontmatter.year}
                    </p>
                  </LinkCard>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <nav className="mt-12 grid gap-3 border-t border-[var(--color-line)] pt-6 sm:grid-cols-2">
          {prev ? (
            <LinkCard href={`/topics/${prev.id}`} className="p-3.5">
              <span className="mono-label">Previous</span>
              <span className="mt-1 block text-sm font-medium">{prev.frontmatter.title}</span>
            </LinkCard>
          ) : (
            <div />
          )}
          {next ? (
            <LinkCard href={`/topics/${next.id}`} className="p-3.5 text-right">
              <span className="mono-label">Next</span>
              <span className="mt-1 flex items-center justify-end gap-1.5 text-sm font-medium">
                {next.frontmatter.title}
                <ArrowRightIcon size={14} />
              </span>
            </LinkCard>
          ) : null}
        </nav>
      </article>

      <aside className="hidden xl:block">
        <div className="sticky top-20 space-y-6">
          <TableOfContents items={topic.headings} />
          {claims.length > 0 ? (
            <Card className="p-3">
              <p className="mono-label mb-2">Statements</p>
              <ul className="space-y-1.5">
                {claims.map((c) => (
                  <li key={c.id}>
                    <a
                      href={`#${c.id}`}
                      className="block text-[0.78rem] leading-snug text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                    >
                      <span
                        aria-hidden
                        className="mr-1.5 inline-block size-1.5 rounded-full align-middle"
                        style={{ background: `var(--color-claim-${c.kind})` }}
                      />
                      {c.title}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
