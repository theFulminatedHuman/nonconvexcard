'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useHasMounted } from '@/hooks/use-local-store';
import { useProgress } from '@/hooks/use-progress';
import { FIELDS, LEVEL_SHORT, type FieldSlug, type Level } from '@/lib/taxonomy';
import { LockIcon } from '@/components/ui/icons';
import { Card, Chip, cx } from '@/components/ui/primitives';

export interface GraphNode {
  id: string;
  title: string;
  field: FieldSlug;
  level: Level;
  prerequisites: string[];
  problems: number;
}

const COL_W = 250;
const ROW_H = 74;
const NODE_W = 204;
const NODE_H = 54;
const PAD = 16;

type Status = 'done' | 'ready' | 'locked';

/**
 * Longest-path depth of each node in the prerequisite DAG.
 *
 * Longest rather than shortest: a topic should appear to the right of every
 * prerequisite, not just its earliest one. Cycles cannot occur — the content
 * loader resolves prerequisites and would have failed the build — but the
 * memoised recursion guards against one anyway rather than hanging the tab.
 */
function depths(nodes: GraphNode[]): Map<string, number> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out = new Map<string, number>();
  const visiting = new Set<string>();

  const depth = (id: string): number => {
    const cached = out.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const node = byId.get(id);
    const d = !node || node.prerequisites.length === 0
      ? 0
      : 1 + Math.max(...node.prerequisites.map((p) => depth(p)));
    visiting.delete(id);
    out.set(id, d);
    return d;
  };

  for (const n of nodes) depth(n.id);
  return out;
}

/**
 * The mastery graph.
 *
 * Nodes are topics, edges are declared prerequisites, and a topic is "locked"
 * only in the advisory sense: the link still works. Locking material behind a
 * quiz would be theatre — the graph's job is to tell you what you are missing,
 * not to stop you reading it.
 */
export function DependencyGraph({ nodes }: { nodes: GraphNode[] }) {
  const { state } = useProgress();
  const mounted = useHasMounted();
  const [hover, setHover] = useState<string | null>(null);

  const done = useMemo(() => {
    const ids = new Set<string>();
    for (const e of state.entries) if (e.kind === 'topic') ids.add(e.refId);
    return ids;
  }, [state]);

  const layout = useMemo(() => {
    const d = depths(nodes);
    const columns = new Map<number, GraphNode[]>();
    for (const n of nodes) {
      const col = d.get(n.id) ?? 0;
      const list = columns.get(col) ?? [];
      list.push(n);
      columns.set(col, list);
    }
    const positions = new Map<string, { x: number; y: number }>();
    let maxRows = 0;
    for (const [col, list] of columns) {
      list.sort(
        (a, b) => a.field.localeCompare(b.field) || a.level - b.level || a.title.localeCompare(b.title),
      );
      list.forEach((n, i) => positions.set(n.id, { x: PAD + col * COL_W, y: PAD + i * ROW_H }));
      maxRows = Math.max(maxRows, list.length);
    }
    return {
      positions,
      width: PAD * 2 + (Math.max(...columns.keys(), 0) + 1) * COL_W,
      height: PAD * 2 + maxRows * ROW_H,
      columnCount: columns.size,
    };
  }, [nodes]);

  const status = (n: GraphNode): Status => {
    if (!mounted) return 'ready';
    if (done.has(n.id)) return 'done';
    return n.prerequisites.every((p) => done.has(p)) ? 'ready' : 'locked';
  };

  const readyNext = mounted
    ? nodes.filter((n) => status(n) === 'ready' && !done.has(n.id)).slice(0, 6)
    : [];

  const edges = nodes.flatMap((n) =>
    n.prerequisites.map((p) => ({ from: p, to: n.id, key: `${p}->${n.id}` })),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-ink-faint)]">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-sm border border-[var(--color-diff-foundation)] bg-[var(--color-diff-foundation)]/25"
          />
          studied
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-sm border border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
          />
          ready — prerequisites met
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-sm border border-[var(--color-line-strong)]"
          />
          prerequisites outstanding
        </span>
        <span>· {layout.columnCount} dependency layers</span>
      </div>

      <div className="no-scrollbar overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)]">
        <div
          className="relative"
          style={{ width: layout.width, height: layout.height, minWidth: '100%' }}
        >
          <svg
            className="absolute inset-0"
            width={layout.width}
            height={layout.height}
            aria-hidden
            focusable="false"
          >
            {edges.map((e) => {
              const a = layout.positions.get(e.from);
              const b = layout.positions.get(e.to);
              if (!a || !b) return null;
              const x1 = a.x + NODE_W;
              const y1 = a.y + NODE_H / 2;
              const x2 = b.x;
              const y2 = b.y + NODE_H / 2;
              const mid = (x1 + x2) / 2;
              const active = hover === e.from || hover === e.to;
              return (
                <path
                  key={e.key}
                  d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={active ? 'var(--color-accent)' : 'var(--color-line-strong)'}
                  strokeWidth={active ? 1.6 : 1}
                  opacity={active ? 0.95 : 0.5}
                />
              );
            })}
          </svg>

          {nodes.map((n) => {
            const pos = layout.positions.get(n.id);
            if (!pos) return null;
            const s = status(n);
            const missing = n.prerequisites.filter((p) => !done.has(p)).length;
            return (
              <Link
                key={n.id}
                href={`/topics/${n.id}`}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(n.id)}
                onBlur={() => setHover(null)}
                style={{ left: pos.x, top: pos.y, width: NODE_W, height: NODE_H }}
                className={cx(
                  'absolute flex flex-col justify-center rounded border px-2.5 py-1.5 transition-colors',
                  s === 'done'
                    ? 'border-[var(--color-diff-foundation)]/60 bg-[var(--color-diff-foundation)]/12'
                    : s === 'ready'
                      ? 'border-[var(--color-accent)]/45 bg-[var(--color-accent-soft)]'
                      : 'border-[var(--color-line-strong)] bg-[var(--color-elevated)]',
                  hover === n.id ? 'ring-1 ring-[var(--color-accent)]' : '',
                )}
              >
                <span className="flex items-center gap-1 truncate text-[0.78rem] font-medium">
                  {s === 'locked' && mounted ? (
                    <LockIcon size={10} className="shrink-0 text-[var(--color-ink-faint)]" />
                  ) : null}
                  <span className="truncate">{n.title}</span>
                </span>
                <span className="truncate font-mono text-[9px] tracking-wide text-[var(--color-ink-faint)] uppercase">
                  {FIELDS[n.field].short} · {LEVEL_SHORT[n.level]}
                  {mounted && missing > 0 ? ` · ${missing} to go` : ''}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {readyNext.length > 0 ? (
        <Card className="p-4">
          <p className="mono-label mb-2">Ready now — every prerequisite marked studied</p>
          <ul className="flex flex-wrap gap-2">
            {readyNext.map((n) => (
              <li key={n.id}>
                <Link href={`/topics/${n.id}`}>
                  <Chip tone="accent">{n.title}</Chip>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
