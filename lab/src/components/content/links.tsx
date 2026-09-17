import Link from 'next/link';
import type { AnchorHTMLAttributes } from 'react';
import { getProblem, getTopicById } from '@/lib/content';
import { getExperiment } from '@/experiments/registry';
import { DIFFICULTY_LABEL, PROBLEM_TYPE_LABEL, TIME_LABEL } from '@/lib/taxonomy';
import { ArrowRightIcon, ExternalIcon, FlaskIcon } from '@/components/ui/icons';

/**
 * Anchor used for all MDX links: internal hrefs go through `next/link` so
 * navigation is client-side and `basePath` is applied, external ones get an
 * explicit affordance and `rel="noreferrer"`.
 */
export function MdxLink({ href = '', children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const internal = href.startsWith('/') || href.startsWith('#');
  if (internal) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" {...rest}>
      {children}
      <ExternalIcon size={11} className="ml-0.5 inline-block align-baseline" />
    </a>
  );
}

/** Inline card linking to a problem, with its live metadata. */
export function ProblemRef({ id }: { id: string }) {
  const problem = getProblem(id);
  if (!problem) {
    throw new Error(`<ProblemRef id="${id}" /> refers to a problem that does not exist.`);
  }
  return (
    <Link
      href={`/problems/${problem.id}`}
      className="my-2 flex items-center gap-3 rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 no-underline transition-colors hover:border-[var(--color-line-strong)]"
    >
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: `var(--color-diff-${problem.difficulty})` }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-sans text-sm font-medium text-[var(--color-ink)]">
          {problem.title}
        </span>
        <span className="block font-mono text-[10px] tracking-wide text-[var(--color-ink-faint)] uppercase">
          {PROBLEM_TYPE_LABEL[problem.type]} · {DIFFICULTY_LABEL[problem.difficulty]} ·{' '}
          {TIME_LABEL[problem.estimated_time]}
        </span>
      </span>
      <ArrowRightIcon size={14} className="shrink-0 text-[var(--color-ink-faint)]" />
    </Link>
  );
}

/** Inline card linking to an interactive experiment. */
export function ExperimentRef({ id }: { id: string }) {
  const meta = getExperiment(id);
  if (!meta) {
    throw new Error(`<ExperimentRef id="${id}" /> refers to an experiment that does not exist.`);
  }
  return (
    <Link
      href={`/experiments/${meta.id}`}
      className="my-3 flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-elevated)] px-3.5 py-3 no-underline transition-colors hover:border-[var(--color-line-strong)]"
    >
      <FlaskIcon size={16} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
      <span className="min-w-0">
        <span className="block font-sans text-sm font-medium text-[var(--color-ink)]">
          Run it: {meta.title}
        </span>
        <span className="block font-sans text-[0.8rem] leading-snug text-[var(--color-ink-soft)]">
          {meta.summary}
        </span>
      </span>
    </Link>
  );
}

/** Inline link to another topic, resolving its title from content. */
export function TopicRef({ id, children }: { id: string; children?: React.ReactNode }) {
  const topic = getTopicById(id);
  if (!topic) throw new Error(`<TopicRef id="${id}" /> refers to a topic that does not exist.`);
  return <Link href={`/topics/${topic.id}`}>{children ?? topic.frontmatter.title}</Link>;
}
