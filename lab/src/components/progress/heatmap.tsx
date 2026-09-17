'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useHasMounted } from '@/hooks/use-local-store';
import { useProgress } from '@/hooks/use-progress';
import {
  MONTH_LABELS,
  addDays,
  formatLongDate,
  monthOf,
  today,
  weekday,
  type IsoDate,
} from '@/lib/dates';
import { byDay } from '@/lib/progress';
import { FIELDS } from '@/lib/taxonomy';
import { Chip, cx } from '@/components/ui/primitives';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** Five buckets, matching the five `--color-heat-*` tokens. */
function level(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

const HREF_BY_KIND = {
  problem: (id: string) => `/problems/${id}`,
  topic: (id: string) => `/topics/${id}`,
  experiment: (id: string) => `/experiments/${id}`,
  paper: (id: string) => `/papers/${id}`,
} as const;

/**
 * A GitHub-style contribution grid over the last `weeks` weeks.
 *
 * Columns are weeks, rows are weekdays, and the grid always ends on the column
 * containing today, so the most recent activity is at the right edge where the
 * eye lands. Clicking a day opens what was done on it.
 */
export function ContributionHeatmap({ weeks = 53 }: { weeks?: number }) {
  const { state } = useProgress();
  const mounted = useHasMounted();
  const [selected, setSelected] = useState<IsoDate | null>(null);

  const days = useMemo(() => byDay(state), [state]);

  const grid = useMemo(() => {
    const end = today();
    // The Sunday of the week containing today, walked back `weeks - 1` weeks.
    const firstSunday = addDays(end, -weekday(end) - (weeks - 1) * 7);
    const cols: IsoDate[][] = [];
    for (let w = 0; w < weeks; w++) {
      const col: IsoDate[] = [];
      for (let d = 0; d < 7; d++) col.push(addDays(firstSunday, w * 7 + d));
      cols.push(col);
    }
    return { cols, end };
  }, [weeks]);

  const monthMarks = useMemo(() => {
    const marks: { col: number; label: string }[] = [];
    let last = -1;
    grid.cols.forEach((col, i) => {
      const first = col[0];
      if (!first) return;
      const m = monthOf(first);
      if (m !== last) {
        marks.push({ col: i, label: MONTH_LABELS[m] ?? '' });
        last = m;
      }
    });
    return marks;
  }, [grid]);

  const selectedBucket = selected ? days.get(selected) : undefined;
  const total = mounted ? state.entries.length : 0;

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-full">
          <div
            className="mb-1 grid gap-[3px] pl-8 text-[10px] text-[var(--color-ink-faint)]"
            style={{ gridTemplateColumns: `repeat(${grid.cols.length}, 11px)` }}
            aria-hidden
          >
            {grid.cols.map((_, i) => {
              const mark = monthMarks.find((m) => m.col === i);
              return (
                <span key={i} className="font-mono whitespace-nowrap">
                  {mark ? mark.label : ''}
                </span>
              );
            })}
          </div>

          <div className="flex gap-[3px]">
            <div className="grid w-7 shrink-0 grid-rows-7 gap-[3px] text-[9px] text-[var(--color-ink-faint)]">
              {DAY_LABELS.map((d, i) => (
                <span key={d} className="h-[11px] leading-[11px] font-mono">
                  {i % 2 === 1 ? d : ''}
                </span>
              ))}
            </div>

            <div
              role="grid"
              aria-label="Activity over the last year"
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: `repeat(${grid.cols.length}, 11px)` }}
            >
              {grid.cols.map((col, ci) => (
                <div key={ci} role="row" className="grid grid-rows-7 gap-[3px]">
                  {col.map((date) => {
                    const count = mounted ? (days.get(date)?.count ?? 0) : 0;
                    const future = date > grid.end;
                    return (
                      <button
                        key={date}
                        type="button"
                        role="gridcell"
                        disabled={future}
                        aria-label={`${formatLongDate(date)}: ${count} item${count === 1 ? '' : 's'}`}
                        title={`${formatLongDate(date)} — ${count} item${count === 1 ? '' : 's'}`}
                        onClick={() => setSelected(count > 0 ? date : null)}
                        className={cx(
                          'size-[11px] rounded-[2px] transition-colors',
                          future ? 'opacity-0' : '',
                          selected === date
                            ? 'ring-1 ring-[var(--color-accent)] ring-offset-1 ring-offset-[var(--color-canvas)]'
                            : '',
                        )}
                        style={{ background: `var(--color-heat-${level(count)})` }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-4 text-[11px] text-[var(--color-ink-faint)]">
        <span className="font-mono tabular-nums">
          {total} item{total === 1 ? '' : 's'} recorded
        </span>
        <span className="flex items-center gap-1">
          Less
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              aria-hidden
              className="size-[10px] rounded-[2px]"
              style={{ background: `var(--color-heat-${l})` }}
            />
          ))}
          More
        </span>
      </div>

      {selectedBucket ? (
        <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium">{formatLongDate(selectedBucket.date)}</p>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-[11px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            >
              Close
            </button>
          </div>
          <ul className="space-y-1.5">
            {selectedBucket.entries.map((e) => (
              <li key={e.key} className="flex flex-wrap items-baseline gap-2">
                <Link
                  href={HREF_BY_KIND[e.kind](e.refId)}
                  className="text-[0.85rem] hover:text-[var(--color-accent)]"
                >
                  {e.title}
                </Link>
                <Chip tone="quiet">{e.kind}</Chip>
                <Chip tone="quiet">{FIELDS[e.field].short}</Chip>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-[11px] text-[var(--color-ink-faint)]">
          Progress is stored in this browser only — there is no account and nothing is sent anywhere.
          Click a day with activity to see what it was.
        </p>
      )}
    </div>
  );
}
