'use client';

import { useId, type ReactNode } from 'react';
import { RefreshIcon } from '@/components/ui/icons';

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v: number) => String(v),
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-[var(--color-ink-soft)]">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-xs tabular-nums">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-[var(--color-accent)]"
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-0.5 text-[11px] text-[var(--color-ink-faint)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-[var(--color-ink-soft)]">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="mt-1.5 w-full rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1.5 text-xs"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 accent-[var(--color-accent)]"
      />
      <label htmlFor={id} className="text-xs text-[var(--color-ink-soft)]">
        {label}
      </label>
    </div>
  );
}

/** Re-seeds a deterministic experiment; the seed is always shown. */
export function SeedControl({ seed, onReseed }: { seed: number; onReseed: (s: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-[var(--color-line)] pt-3">
      <span className="font-mono text-[11px] text-[var(--color-ink-faint)]">seed = {seed}</span>
      <button
        type="button"
        onClick={() => onReseed(seed + 1)}
        className="flex items-center gap-1.5 rounded border border-[var(--color-line)] px-2 py-1 text-[11px] transition-colors hover:border-[var(--color-line-strong)]"
      >
        <RefreshIcon size={12} />
        New sample
      </button>
    </div>
  );
}

export function ControlPanel({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-3.5 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-elevated)] p-3.5">
      <p className="mono-label">Parameters</p>
      {children}
    </div>
  );
}

/** A compact table of numbers computed by the experiment. */
export function ReadOut({ rows }: { rows: { label: string; value: string; note?: string }[] }) {
  return (
    <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.label} className="border-l-2 border-[var(--color-line)] pl-2.5">
          <dt className="text-[11px] text-[var(--color-ink-faint)]">{r.label}</dt>
          <dd className="font-mono text-sm tabular-nums">{r.value}</dd>
          {r.note ? <dd className="text-[11px] text-[var(--color-ink-faint)]">{r.note}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
