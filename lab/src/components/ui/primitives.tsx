import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  CLAIM_LABEL,
  DIFFICULTY_LABEL,
  PROBLEM_TYPE_LABEL,
  TIME_LABEL,
  type ClaimKind,
  type Difficulty,
  type EstimatedTime,
  type ProblemType,
} from '@/lib/taxonomy';

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------ chips */

export function Chip({
  children,
  tone = 'neutral',
  className,
  title,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'quiet';
  className?: string;
  title?: string;
}) {
  const tones = {
    neutral: 'border-[var(--color-line)] text-[var(--color-ink-soft)] bg-[var(--color-elevated)]',
    accent: 'border-[var(--color-accent)]/35 text-[var(--color-accent-ink)] bg-[var(--color-accent-soft)]',
    quiet: 'border-transparent text-[var(--color-ink-faint)] bg-transparent',
  } as const;
  return (
    <span
      title={title}
      className={cx(
        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A chip whose left edge carries the colour of a taxonomy value. */
function ColorChip({ color, label, title }: { color: string; label: string; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1.5 rounded border border-[var(--color-line)] bg-[var(--color-elevated)] px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-[var(--color-ink-soft)] uppercase whitespace-nowrap"
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export function DifficultyChip({ difficulty }: { difficulty: Difficulty }) {
  return (
    <ColorChip
      color={`var(--color-diff-${difficulty})`}
      label={DIFFICULTY_LABEL[difficulty]}
      title={`Difficulty: ${DIFFICULTY_LABEL[difficulty]}`}
    />
  );
}

export function TypeChip({ type }: { type: ProblemType }) {
  return <Chip title={`Problem type: ${PROBLEM_TYPE_LABEL[type]}`}>{PROBLEM_TYPE_LABEL[type]}</Chip>;
}

export function TimeChip({ time }: { time: EstimatedTime }) {
  return <Chip tone="quiet" title="Estimated time">⏱ {TIME_LABEL[time]}</Chip>;
}

export function ClaimChip({ kind }: { kind: ClaimKind }) {
  return (
    <ColorChip
      color={`var(--color-claim-${kind})`}
      label={CLAIM_LABEL[kind]}
      title={`Epistemic status: ${CLAIM_LABEL[kind]}`}
    />
  );
}

/* ------------------------------------------------------------------ cards */

export function Card({
  children,
  className,
  as: As = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section' | 'li';
}) {
  return (
    <As
      className={cx(
        'rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)]',
        className,
      )}
    >
      {children}
    </As>
  );
}

/** A card that is entirely a link, with a hover affordance on the border. */
export function LinkCard({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cx(
        'group block rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] transition-colors',
        'hover:border-[var(--color-line-strong)] hover:bg-[var(--color-elevated)]',
        className,
      )}
    >
      {children}
    </Link>
  );
}

/* --------------------------------------------------------------- headings */

export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: ReactNode;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 border-b border-[var(--color-line)] pb-6">
      {eyebrow ? <div className="mono-label mb-2">{eyebrow}</div> : null}
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance sm:text-[1.75rem]">
        {title}
      </h1>
      {lead ? (
        <p className="mt-2 max-w-3xl text-[0.95rem] leading-relaxed text-[var(--color-ink-soft)]">
          {lead}
        </p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </header>
  );
}

export function SectionHeading({
  title,
  action,
  id,
}: {
  title: string;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4 border-b-2 border-[var(--color-line-strong)] pb-1.5">
      <h2
        id={id}
        className="text-[0.82rem] font-bold tracking-[0.03em] text-[var(--color-ink)] uppercase"
      >
        {title}
      </h2>
      {action}
    </div>
  );
}

/* ----------------------------------------------------------------- states */

export function EmptyState({ title, hint }: { title: string; hint?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-line-strong)] px-6 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint ? <p className="mt-1.5 text-sm text-[var(--color-ink-faint)]">{hint}</p> : null}
    </div>
  );
}

/** Accessible meter with an optional numeric caption. */
export function Meter({
  value,
  label,
  caption,
  color = 'var(--color-accent)',
}: {
  value: number;
  label: string;
  caption?: string;
  color?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
        <span className="text-[var(--color-ink-soft)]">{label}</span>
        {caption ? <span className="font-mono text-[var(--color-ink-faint)]">{caption}</span> : null}
      </div>
      <div
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-sunken)]"
      >
        <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function StatBlock({
  value,
  label,
  sub,
}: {
  value: ReactNode;
  label: string;
  sub?: string;
}) {
  return (
    <div className="px-4 py-3">
      <div className="font-mono text-xl tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs font-medium text-[var(--color-ink-soft)]">{label}</div>
      {sub ? <div className="mt-0.5 text-[11px] text-[var(--color-ink-faint)]">{sub}</div> : null}
    </div>
  );
}
