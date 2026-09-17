'use client';

import type { ReactNode } from 'react';
import { cx } from '@/components/ui/primitives';

/** A single toggleable filter value. */
export function FilterChip({
  active,
  onClick,
  children,
  color,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  color?: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        'inline-flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[11px] tracking-wide whitespace-nowrap transition-colors',
        active
          ? 'border-[var(--color-accent)]/45 bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]'
          : 'border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)]',
      )}
    >
      {color ? (
        <span aria-hidden className="size-1.5 rounded-full" style={{ background: color }} />
      ) : null}
      {children}
      {count === undefined ? null : (
        <span className="text-[var(--color-ink-faint)] tabular-nums">{count}</span>
      )}
    </button>
  );
}

export function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mono-label mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/**
 * A multi-select filter over a fixed set of values.
 *
 * An empty selection means "no constraint" rather than "nothing", which is the
 * behaviour a browsing interface needs: the default view shows everything.
 */
export function toggleIn<T>(set: readonly T[], value: T): T[] {
  return set.includes(value) ? set.filter((v) => v !== value) : [...set, value];
}
