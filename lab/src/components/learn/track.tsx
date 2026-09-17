'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useHasMounted } from '@/hooks/use-local-store';
import { useProgress } from '@/hooks/use-progress';
import { FIELDS, LEVEL_SHORT, type FieldSlug, type Level } from '@/lib/taxonomy';
import { CheckIcon } from '@/components/ui/icons';
import { Card, Meter, cx } from '@/components/ui/primitives';

export interface TrackTopic {
  id: string;
  title: string;
  summary: string;
  field: FieldSlug;
  level: Level;
  minutes: number;
  problems: number;
}

export interface TrackStage {
  id: string;
  title: string;
  blurb: string;
  outcome: string;
  topics: TrackTopic[];
}

/**
 * The learning path.
 *
 * Ordered, not adaptive: the sequence is a claim about what depends on what,
 * and it does not change based on what you click. Progress marks are advisory —
 * the path is a recommendation, and skipping ahead is a legitimate way to use it.
 */
export function Track({ stages }: { stages: TrackStage[] }) {
  const { state } = useProgress();
  const mounted = useHasMounted();

  const done = useMemo(() => {
    const ids = new Set<string>();
    for (const e of state.entries) if (e.kind === 'topic') ids.add(e.refId);
    return ids;
  }, [state]);

  return (
    <ol className="space-y-8">
      {stages.map((stage, i) => {
        const completed = mounted ? stage.topics.filter((t) => done.has(t.id)).length : 0;
        const minutes = stage.topics.reduce((a, t) => a + t.minutes, 0);
        return (
          <li key={stage.id}>
            <Card className="overflow-hidden">
              <div className="border-b border-[var(--color-line)] bg-[var(--color-elevated)] px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h2 className="text-sm font-semibold">
                    <span className="mono-label mr-2">Stage {i + 1}</span>
                    {stage.title}
                  </h2>
                  <span className="font-mono text-[11px] text-[var(--color-ink-faint)] tabular-nums">
                    {stage.topics.length} topics · ~{Math.round(minutes / 60)}h reading
                  </span>
                </div>
                <p className="mt-1 max-w-3xl text-[0.85rem] leading-relaxed text-[var(--color-ink-soft)]">
                  {stage.blurb}
                </p>
                <p className="mt-1.5 text-[0.8rem] text-[var(--color-ink-faint)]">
                  <span className="mono-label mr-1.5">You can then</span>
                  {stage.outcome}
                </p>
                <div className="mt-3 max-w-sm">
                  <Meter
                    value={stage.topics.length === 0 ? 0 : completed / stage.topics.length}
                    label="Studied"
                    caption={`${completed} / ${stage.topics.length}`}
                  />
                </div>
              </div>

              <ul className="divide-y divide-[var(--color-line)]">
                {stage.topics.map((t) => {
                  const isDone = mounted && done.has(t.id);
                  return (
                    <li key={t.id}>
                      <Link
                        href={`/topics/${t.id}`}
                        className="flex gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-elevated)]"
                      >
                        <span
                          aria-hidden
                          className={cx(
                            'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border',
                            isDone
                              ? 'border-[var(--color-diff-foundation)] bg-[var(--color-diff-foundation)]/15 text-[var(--color-diff-foundation)]'
                              : 'border-[var(--color-line-strong)] text-transparent',
                          )}
                        >
                          <CheckIcon size={10} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-2">
                            <span className="text-sm font-medium">{t.title}</span>
                            <span className="mono-label">
                              {FIELDS[t.field].short} · {LEVEL_SHORT[t.level]}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-[0.82rem] leading-snug text-[var(--color-ink-soft)]">
                            {t.summary}
                          </span>
                        </span>
                        <span className="shrink-0 self-center font-mono text-[10px] text-[var(--color-ink-faint)] tabular-nums">
                          {t.minutes}m
                          {t.problems > 0 ? ` · ${t.problems}p` : ''}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}
