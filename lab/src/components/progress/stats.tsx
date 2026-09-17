'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useHasMounted } from '@/hooks/use-local-store';
import { useProgress } from '@/hooks/use-progress';
import { countsByDifficulty, fieldMastery, streaks, totals } from '@/lib/progress';
import { DIFFICULTIES, DIFFICULTY_LABEL, FIELDS, type FieldSlug } from '@/lib/taxonomy';
import { FlameIcon } from '@/components/ui/icons';
import { Card, Meter, StatBlock } from '@/components/ui/primitives';

export interface FieldAvailability {
  field: FieldSlug;
  topics: number;
  problems: number;
}

function hours(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = minutes / 60;
  return h < 10 ? `${h.toFixed(1)}h` : `${Math.round(h)}h`;
}

/** Streak, active days and recorded study time. */
export function StreakPanel() {
  const { state } = useProgress();
  const mounted = useHasMounted();
  const s = useMemo(() => streaks(state), [state]);
  const t = useMemo(() => totals(state), [state]);

  const items = mounted
    ? [
        { value: s.current, label: 'Current streak', sub: s.current === 1 ? 'day' : 'days' },
        { value: s.longest, label: 'Longest streak', sub: s.longest === 1 ? 'day' : 'days' },
        { value: s.activeDays, label: 'Active days', sub: 'with any activity' },
        { value: hours(t.minutes), label: 'Estimated time', sub: 'from item estimates' },
      ]
    : [
        { value: '—', label: 'Current streak', sub: 'days' },
        { value: '—', label: 'Longest streak', sub: 'days' },
        { value: '—', label: 'Active days', sub: 'with any activity' },
        { value: '—', label: 'Estimated time', sub: 'from item estimates' },
      ];

  return (
    <Card className="divide-y divide-[var(--color-line)] sm:grid sm:grid-cols-4 sm:divide-x sm:divide-y-0">
      {items.map((i) => (
        <StatBlock
          key={i.label}
          value={
            i.label === 'Current streak' && mounted && s.current > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <FlameIcon size={16} className="text-[var(--color-diff-advanced)]" />
                {i.value}
              </span>
            ) : (
              i.value
            )
          }
          label={i.label}
          sub={i.sub}
        />
      ))}
    </Card>
  );
}

/** What has been completed, by kind. */
export function TotalsPanel({ available }: { available: { problems: number; topics: number } }) {
  const { state } = useProgress();
  const mounted = useHasMounted();
  const t = useMemo(() => totals(state), [state]);

  const rows = [
    { label: 'Problems solved', value: t.problems, of: available.problems, href: '/problems' },
    { label: 'Topics studied', value: t.topics, of: available.topics, href: '/topics' },
    { label: 'Proof problems', value: t.proofs, href: '/problems' },
    { label: 'Numerical problems', value: t.numerical, href: '/problems' },
    { label: 'Coding problems', value: t.coding, href: '/problems' },
    { label: 'Research / Abyss', value: t.research, href: '/abyss' },
    { label: 'Experiments run', value: t.experiments, href: '/experiments' },
    { label: 'Papers read', value: t.papers, href: '/papers' },
  ];

  return (
    <Card className="divide-y divide-[var(--color-line)]">
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
          <Link href={r.href} className="text-sm hover:text-[var(--color-accent)]">
            {r.label}
          </Link>
          <span className="font-mono text-sm tabular-nums">
            {mounted ? r.value : '—'}
            {r.of !== undefined ? (
              <span className="text-[var(--color-ink-faint)]"> / {r.of}</span>
            ) : null}
          </span>
        </div>
      ))}
    </Card>
  );
}

/** Solved counts across the difficulty ladder. */
export function DifficultyBreakdown({ available }: { available: Record<string, number> }) {
  const { state } = useProgress();
  const mounted = useHasMounted();
  const counts = useMemo(() => countsByDifficulty(state), [state]);

  return (
    <div className="space-y-3">
      {DIFFICULTIES.filter((d) => (available[d] ?? 0) > 0).map((d) => {
        const done = mounted ? counts[d] : 0;
        const of = available[d] ?? 0;
        return (
          <Meter
            key={d}
            value={of === 0 ? 0 : done / of}
            label={DIFFICULTY_LABEL[d]}
            caption={`${done} / ${of}`}
            color={`var(--color-diff-${d})`}
          />
        );
      })}
    </div>
  );
}

/**
 * Per-field mastery.
 *
 * The weighting (a topic counts double a problem) is a study heuristic, not a
 * measurement of understanding — it exists so the bar moves in a way that
 * matches effort. It is labelled as such below, because a progress number that
 * pretends to be an assessment is worse than none.
 */
export function FieldMasteryPanel({ availability }: { availability: FieldAvailability[] }) {
  const { state } = useProgress();
  const mounted = useHasMounted();

  return (
    <div>
      <div className="space-y-3">
        {availability.map((a) => (
          <div key={a.field}>
            <Meter
              value={mounted ? fieldMastery(state, a.field, a) : 0}
              label={FIELDS[a.field].short}
              caption={`${a.topics} topics · ${a.problems} problems`}
            />
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-[var(--color-ink-faint)]">
        Mastery here is coverage, not assessment: it is the share of a field's material you have
        marked complete, with topics weighted twice a problem. Nothing tests you, so nothing can
        certify you.
      </p>
    </div>
  );
}
