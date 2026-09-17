'use client';

import type { ReactNode } from 'react';

/**
 * Standard layout for an interactive experiment: plot on the left, controls on
 * the right, and — always — a statement of what the simulation is and is not
 * evidence for.
 */
export function ExperimentFrame({
  question,
  controls,
  children,
  interpretation,
}: {
  /** The question this run is meant to answer. */
  question: ReactNode;
  controls: ReactNode;
  children: ReactNode;
  /** What to read off the figure, and the honest caveat. */
  interpretation?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <p className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-sunken)] px-3.5 py-2.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
        {question}
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0">{children}</div>
        <div className="lg:sticky lg:top-20 lg:self-start">{controls}</div>
      </div>

      {interpretation ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
          <p className="mono-label mb-1.5">Reading the figure</p>
          <div className="prose-tight text-[0.92rem]">{interpretation}</div>
        </div>
      ) : null}

      <p className="text-[11px] leading-relaxed text-[var(--color-ink-faint)]">
        Every run is deterministic in its seed: the same parameters reproduce the same figure on any
        machine. A simulation is evidence about the regime you sampled, not a proof — the proofs are
        on the linked topic pages.
      </p>
    </div>
  );
}
