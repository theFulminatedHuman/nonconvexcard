'use client';

import { Children, useState, type ReactNode } from 'react';
import { ChevronDownIcon } from '@/components/ui/icons';
import { cx } from '@/components/ui/primitives';

/**
 * A proof that stays folded until the reader asks for it.
 *
 * Reading a proof before attempting the argument is the single most common way
 * to feel like you understand something you cannot reproduce. The default is
 * therefore closed, and the control says what you are about to give up.
 */
export function Proof({
  children,
  title = 'Proof',
  sketch = false,
  defaultOpen = false,
}: {
  children: ReactNode;
  title?: string;
  /** Marks an argument that is deliberately incomplete. */
  sketch?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const label = sketch ? `${title} (sketch)` : title;

  return (
    <section className="my-5 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 bg-[var(--color-elevated)] px-4 py-2 text-left transition-colors hover:bg-[var(--color-sunken)]"
      >
        <ChevronDownIcon
          size={14}
          className={cx('shrink-0 transition-transform', open ? '' : '-rotate-90')}
        />
        <span className="font-mono text-[11px] font-semibold tracking-[0.08em] uppercase">
          {label}
        </span>
        <span className="ml-auto text-[11px] text-[var(--color-ink-faint)]">
          {open ? 'Hide' : 'Reveal'}
        </span>
      </button>
      {open ? (
        <div className="prose-tight bg-[var(--color-surface)] px-4 py-3.5">
          {children}
          {sketch ? (
            <p className="mt-3 border-t border-[var(--color-line)] pt-2 text-[0.8rem] text-[var(--color-ink-faint)]">
              This is a sketch: the steps above are the load-bearing ones, and the routine estimates
              between them are omitted. It is not a complete proof.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/**
 * A hint ladder. Hints are revealed strictly in order, so a reader cannot skip
 * to the last one without seeing the earlier, gentler nudges.
 */
export function Hints({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const [shown, setShown] = useState(0);
  if (items.length === 0) return null;

  return (
    <div className="my-5 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="mono-label">
          Hints — {shown} of {items.length} revealed
        </p>
        <div className="flex gap-1.5">
          {shown > 0 ? (
            <button
              type="button"
              onClick={() => setShown(0)}
              className="rounded border border-[var(--color-line)] px-2 py-0.5 text-[11px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            >
              Reset
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setShown((n) => Math.min(n + 1, items.length))}
            disabled={shown >= items.length}
            className="rounded border border-[var(--color-line)] px-2 py-0.5 text-[11px] transition-colors hover:border-[var(--color-line-strong)] disabled:opacity-40"
          >
            {shown === 0 ? 'Show first hint' : 'Next hint'}
          </button>
        </div>
      </div>
      {shown > 0 ? (
        <ol className="mt-3 space-y-2.5">
          {items.slice(0, shown).map((item, i) => (
            // eslint-disable-next-line react/no-array-index-key -- hints are a fixed, ordered list
            <li key={i} className="border-l-2 border-[var(--color-line-strong)] pl-3">
              <span className="mono-label">Hint {i + 1}</span>
              <div className="prose-tight mt-0.5">{item}</div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** Generic collapsible section used for long asides and alternative proofs. */
export function Details({
  summary,
  children,
  defaultOpen = false,
}: {
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="my-4 rounded-[var(--radius-card)] border border-[var(--color-line)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm font-medium hover:bg-[var(--color-elevated)]"
      >
        <ChevronDownIcon size={13} className={cx('transition-transform', open ? '' : '-rotate-90')} />
        {summary}
      </button>
      {open ? <div className="prose-tight border-t border-[var(--color-line)] px-3.5 py-3">{children}</div> : null}
    </section>
  );
}
