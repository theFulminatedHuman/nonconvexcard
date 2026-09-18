import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Hint, Hints, Proof } from '@/components/content/disclosure';
import { Markdown } from '@/components/content/markdown';
import { ProblemTable } from '@/components/problems/problem-table';
import { CompleteButton } from '@/components/progress/complete-button';
import {
  Chip,
  DifficultyChip,
  SectionHeading,
  TimeChip,
  TypeChip,
} from '@/components/ui/primitives';
import { allProblems, getProblem, getTopicById } from '@/lib/content';
import { renderMarkdown } from '@/lib/markdown';
import { buildProblemIndex } from '@/lib/problem-index';
import { DIFFICULTY_LABEL, FIELDS, PROBLEM_TYPE_LABEL, TIME_MINUTES } from '@/lib/taxonomy';

export const dynamicParams = false;

export function generateStaticParams() {
  return allProblems().map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const problem = getProblem(id);
  if (!problem) return {};
  return {
    title: problem.title,
    description: `${DIFFICULTY_LABEL[problem.difficulty]} ${PROBLEM_TYPE_LABEL[
      problem.type
    ].toLowerCase()} problem in ${FIELDS[problem.field].title}.`,
  };
}

/** What the reader is being asked to produce, stated in one line per type. */
const TYPE_BRIEF = {
  proof: 'Write a complete argument. Every inequality you use should be one you could state precisely.',
  numerical:
    'Compute the requested quantities and say what they mean. A number without an interpretation is not an answer.',
  coding:
    'Implement it, then check the implementation against something you can verify independently.',
} as const;

export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const problem = getProblem(id);
  if (!problem) notFound();

  const statement = await renderMarkdown(problem.statement);
  const solution = await renderMarkdown(problem.solution);
  const hints = await Promise.all(problem.hints.map((h) => renderMarkdown(h)));
  const topic = problem.topic ? getTopicById(problem.topic) : undefined;
  const field = FIELDS[problem.field];

  // Research-difficulty entries are open problems: they have no solution, and the
  // page must not imply otherwise.
  const open = problem.difficulty === 'research';

  const index = buildProblemIndex();
  const related = index
    .filter(
      (p) =>
        p.id !== problem.id &&
        (p.topic === problem.topic || p.tags.some((t) => problem.tags.includes(t))),
    )
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-[56rem] px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mono-label mb-3 flex flex-wrap items-center gap-1.5">
        <Link href="/problems" className="hover:text-[var(--color-ink)]">
          Problems
        </Link>
        <span aria-hidden>/</span>
        <Link
          href={`/problems?field=${problem.field}`}
          className="hover:text-[var(--color-ink)]"
        >
          {field.short}
        </Link>
        {problem.abyss ? (
          <>
            <span aria-hidden>/</span>
            <Link href="/abyss" className="text-[var(--color-accent)] hover:underline">
              The Abyss
            </Link>
          </>
        ) : null}
      </nav>

      <header className="border-b border-[var(--color-line)] pb-5">
        <h1 className="text-[1.5rem] leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-[1.75rem]">
          {problem.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <TypeChip type={problem.type} />
          <DifficultyChip difficulty={problem.difficulty} />
          <TimeChip time={problem.estimated_time} />
          <Chip tone="accent">{field.short}</Chip>
          {problem.also.map((f) => (
            <Chip key={f} tone="quiet">
              {FIELDS[f].short}
            </Chip>
          ))}
          {problem.tags.slice(0, 6).map((t) => (
            <Chip key={t} tone="quiet">
              {t}
            </Chip>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CompleteButton
            kind="problem"
            refId={problem.id}
            title={problem.title}
            field={problem.field}
            minutes={TIME_MINUTES[problem.estimated_time]}
            difficulty={problem.difficulty}
            type={problem.type}
            labels={{ todo: 'Mark solved', done: 'Solved' }}
          />
          {topic ? (
            <Link
              href={`/topics/${topic.id}`}
              className="text-xs font-medium text-[var(--color-accent)] hover:underline"
            >
              Theory: {topic.frontmatter.title} →
            </Link>
          ) : null}
        </div>
      </header>

      <section className="mt-7">
        <SectionHeading title="Problem" />
        <Markdown html={statement} />
        <p className="mt-4 rounded border border-[var(--color-line)] bg-[var(--color-elevated)] px-3 py-2 text-[0.82rem] text-[var(--color-ink-soft)]">
          {open
            ? 'This is an open problem. Nobody has a solution, and none is hidden below — what is recorded is the state of the argument. Progress on it would be publishable.'
            : TYPE_BRIEF[problem.type]}
        </p>
      </section>

      {hints.length > 0 ? (
        <section className="mt-8">
          <SectionHeading title="Hints" />
          <Hints>
            {hints.map((h, i) => (
              // eslint-disable-next-line react/no-array-index-key -- hints are a fixed ordered list
              <Hint key={i}>
                <Markdown html={h} className="" />
              </Hint>
            ))}
          </Hints>
        </section>
      ) : null}

      <section className="mt-8">
        <SectionHeading title={open ? 'What is known' : 'Solution'} />
        <p className="mb-3 text-[0.82rem] text-[var(--color-ink-faint)]">
          {open
            ? 'This problem is open. What follows is an account of what has been proved, what has only been measured, and where the argument stops — not a solution, because there is not one.'
            : 'Opening this before you have a real attempt on paper is the fastest way to feel like you understand something you cannot reproduce.'}
        </p>
        <Proof title={open ? 'State of the problem' : 'Worked solution'}>
          <Markdown html={solution} className="" />
        </Proof>
      </section>

      {related.length > 0 ? (
        <section className="mt-10">
          <SectionHeading
            title="Related problems"
            action={
              <Link href="/problems" className="text-xs text-[var(--color-accent)] hover:underline">
                All problems
              </Link>
            }
          />
          <div className="panel">
            <ProblemTable problems={related} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
