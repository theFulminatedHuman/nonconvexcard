import type { ReactNode } from 'react';
import { CLAIM_LABEL, type ClaimKind } from '@/lib/taxonomy';
import { cx } from '@/components/ui/primitives';

/**
 * A theorem-like statement.
 *
 * The epistemic status is part of the component's identity, not a decoration:
 * `kind` drives the label, the accent colour and — for non-deductive claims —
 * an explicit status line. A reader should never have to guess whether they are
 * looking at something proved or something observed.
 */
export function Claim({
  kind,
  id,
  title,
  children,
  source,
}: {
  kind: ClaimKind;
  id?: string;
  title?: string;
  children: ReactNode;
  /** Attribution for a named result, e.g. "Hoeffding, 1963". */
  source?: string;
}) {
  const accent = `var(--color-claim-${kind})`;
  const isFormal = kind !== 'heuristic' && kind !== 'empirical' && kind !== 'conjecture' && kind !== 'open-problem';

  return (
    <section
      id={id}
      className="my-6 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)]"
      style={{ borderLeft: `3px solid ${accent}` }}
      aria-labelledby={id ? `${id}-label` : undefined}
    >
      <header className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-[var(--color-line)] bg-[var(--color-elevated)] px-4 py-2">
        <span
          id={id ? `${id}-label` : undefined}
          className="font-mono text-[11px] font-semibold tracking-[0.08em] uppercase"
          style={{ color: accent }}
        >
          {CLAIM_LABEL[kind]}
        </span>
        {title ? (
          <span className="text-sm font-semibold tracking-[-0.01em]">{title}</span>
        ) : null}
        {source ? (
          <span className="ml-auto font-mono text-[11px] text-[var(--color-ink-faint)]">{source}</span>
        ) : null}
      </header>

      {!isFormal ? (
        <p className="border-b border-[var(--color-line)] bg-[var(--color-sunken)] px-4 py-1.5 text-[11px] text-[var(--color-ink-soft)]">
          {STATUS_NOTE[kind]}
        </p>
      ) : null}

      <div className={cx('prose-tight px-4 py-3.5', kind === 'definition' && 'text-[0.97rem]')}>
        {children}
      </div>
    </section>
  );
}

const STATUS_NOTE: Partial<Record<ClaimKind, string>> = {
  heuristic:
    'Heuristic — a reasoning shortcut that predicts the right answer in the regimes discussed here. It is not a proof and can fail outside them.',
  empirical:
    'Empirical observation — a regularity seen in experiments. No theorem on this page establishes it in general.',
  conjecture: 'Conjecture — believed, supported by evidence, not proved.',
  'open-problem': 'Open problem — no proof and no counterexample is known to the author of this page.',
};

/** Convenience wrappers so MDX reads like a textbook. */
export const Theorem = (p: Omit<Parameters<typeof Claim>[0], 'kind'>) => <Claim kind="theorem" {...p} />;
export const Lemma = (p: Omit<Parameters<typeof Claim>[0], 'kind'>) => <Claim kind="lemma" {...p} />;
export const Proposition = (p: Omit<Parameters<typeof Claim>[0], 'kind'>) => (
  <Claim kind="proposition" {...p} />
);
export const Corollary = (p: Omit<Parameters<typeof Claim>[0], 'kind'>) => (
  <Claim kind="corollary" {...p} />
);
export const Definition = (p: Omit<Parameters<typeof Claim>[0], 'kind'>) => (
  <Claim kind="definition" {...p} />
);
export const Heuristic = (p: Omit<Parameters<typeof Claim>[0], 'kind'>) => (
  <Claim kind="heuristic" {...p} />
);
export const Empirical = (p: Omit<Parameters<typeof Claim>[0], 'kind'>) => (
  <Claim kind="empirical" {...p} />
);
export const Conjecture = (p: Omit<Parameters<typeof Claim>[0], 'kind'>) => (
  <Claim kind="conjecture" {...p} />
);
export const OpenProblem = (p: Omit<Parameters<typeof Claim>[0], 'kind'>) => (
  <Claim kind="open-problem" {...p} />
);

/**
 * The hypotheses of the surrounding claim, listed separately from its
 * conclusion. Every convergence result on this site states its assumptions in
 * one of these; "SGD converges" with no visible hypothesis list is a bug.
 */
export function Assumptions({ children }: { children: ReactNode }) {
  return (
    <div className="my-3 rounded border border-[var(--color-line)] bg-[var(--color-sunken)] px-3.5 py-2.5">
      <p className="mono-label mb-1.5">Assumptions</p>
      <div className="prose-tight text-[0.94rem]">{children}</div>
    </div>
  );
}

/**
 * The scope limit of the preceding theorem. Stating what a result does *not*
 * give you is the difference between a theorem and a slogan, and deep learning
 * theory is full of slogans built from correctly-quoted theorems.
 */
export function NotSaid({ children }: { children: ReactNode }) {
  return (
    <div className="my-5 rounded-[var(--radius-card)] border border-dashed border-[var(--color-claim-conjecture)]/50 bg-[var(--color-surface)] px-4 py-3">
      <p className="mono-label mb-1.5" style={{ color: 'var(--color-claim-conjecture)' }}>
        What this does not say
      </p>
      <div className="prose-tight">{children}</div>
    </div>
  );
}

export function KeyIdea({ children }: { children: ReactNode }) {
  return (
    <div className="my-5 border-l-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)]/45 px-4 py-3">
      <p className="mono-label mb-1" style={{ color: 'var(--color-accent-ink)' }}>
        Key idea
      </p>
      <div className="prose-tight">{children}</div>
    </div>
  );
}

export function Note({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <aside className="my-5 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-elevated)] px-4 py-3">
      {title ? <p className="mono-label mb-1">{title}</p> : null}
      <div className="prose-tight text-[0.95rem] text-[var(--color-ink-soft)]">{children}</div>
    </aside>
  );
}

export function Warning({ children, title = 'Common mistake' }: { children: ReactNode; title?: string }) {
  return (
    <aside className="my-5 rounded-[var(--radius-card)] border border-[var(--color-claim-open-problem)]/35 bg-[var(--color-surface)] px-4 py-3">
      <p className="mono-label mb-1" style={{ color: 'var(--color-claim-open-problem)' }}>
        {title}
      </p>
      <div className="prose-tight text-[0.95rem]">{children}</div>
    </aside>
  );
}

/**
 * Intuition-first exposition. Hidden by `[data-research='1']` so that research
 * mode presents definitions, statements and proofs without the ramp-up.
 */
export function Intuition({ children }: { children: ReactNode }) {
  return (
    <aside
      data-intuition
      className="my-5 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-elevated)] px-4 py-3"
    >
      <p className="mono-label mb-1.5">Intuition</p>
      <div className="prose-tight">{children}</div>
    </aside>
  );
}

/** Numbered algorithm listing with a monospaced body. */
export function Algorithm({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure className="my-6 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)]">
      <figcaption className="border-b border-[var(--color-line)] bg-[var(--color-elevated)] px-4 py-2 font-mono text-[11px] tracking-[0.06em] uppercase">
        Algorithm — {title}
      </figcaption>
      <div className="prose-tight bg-[var(--color-surface)] px-4 py-3 font-mono text-[0.82rem] leading-relaxed [&_ol]:list-decimal [&_ol]:pl-5">
        {children}
      </div>
    </figure>
  );
}

/** A worked derivation: a sequence of steps, each with a justification. */
export function Derivation({ children, title = 'Derivation' }: { children: ReactNode; title?: string }) {
  return (
    <section className="my-6 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
      <p className="mono-label mb-2">{title}</p>
      <ol className="space-y-3">{children}</ol>
    </section>
  );
}

export function Step({ children, why }: { children: ReactNode; why?: string }) {
  return (
    <li className="grid gap-1 border-l border-[var(--color-line)] pl-3 marker:text-[var(--color-ink-faint)]">
      <div className="prose-tight">{children}</div>
      {why ? (
        <p className="text-[0.8rem] text-[var(--color-ink-faint)] italic">{why}</p>
      ) : null}
    </li>
  );
}
