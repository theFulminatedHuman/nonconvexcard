'use client';

import { useId, type ReactNode } from 'react';
import type { HistogramBin } from '@/lib/stats';
import {
  formatTick,
  linearTicks,
  logTicks,
  makeScale,
  type Scale,
  type ScaleType,
} from './scales';

export interface PlotScales {
  x: Scale;
  y: Scale;
  /** Inner plot area in SVG user units. */
  width: number;
  height: number;
}

const MARGIN = { top: 10, right: 14, bottom: 34, left: 48 } as const;

/**
 * A Cartesian plotting frame.
 *
 * Charts are hand-rolled SVG rather than a charting library: the figures here
 * are simple (lines, bars, points), they must theme with CSS custom properties,
 * and a static site should not ship hundreds of kilobytes of plotting runtime
 * to render a histogram.
 *
 * The frame scales with its container through `viewBox`, so it stays legible on
 * a phone without a resize observer.
 */
export function Plot({
  xDomain,
  yDomain,
  xLabel,
  yLabel,
  xScale = 'linear',
  yScale = 'linear',
  height = 260,
  width = 720,
  title,
  description,
  children,
  xTickCount = 6,
  yTickCount = 5,
}: {
  xDomain: [number, number];
  yDomain: [number, number];
  xLabel?: string;
  yLabel?: string;
  xScale?: ScaleType;
  yScale?: ScaleType;
  height?: number;
  width?: number;
  /** Accessible name; also rendered as the figure's caption by `Figure`. */
  title: string;
  description?: string;
  children: (scales: PlotScales) => ReactNode;
  xTickCount?: number;
  yTickCount?: number;
}) {
  const id = useId();
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;
  const x = makeScale(xDomain, [0, innerW], xScale);
  const y = makeScale(yDomain, [innerH, 0], yScale);

  const xt = xScale === 'log' ? logTicks(xDomain, xTickCount) : linearTicks(xDomain, xTickCount);
  const yt = yScale === 'log' ? logTicks(yDomain, yTickCount) : linearTicks(yDomain, yTickCount);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full touch-pan-y select-none"
      role="img"
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      preserveAspectRatio="xMidYMid meet"
    >
      <title id={`${id}-title`}>{title}</title>
      {description ? <desc id={`${id}-desc`}>{description}</desc> : null}

      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* Grid */}
        {yt.map((v) => (
          <line
            key={`gy-${v}`}
            x1={0}
            x2={innerW}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--color-line)"
            strokeWidth={1}
            shapeRendering="crispEdges"
          />
        ))}
        {xt.map((v) => (
          <line
            key={`gx-${v}`}
            x1={x(v)}
            x2={x(v)}
            y1={0}
            y2={innerH}
            stroke="var(--color-line)"
            strokeWidth={1}
            strokeDasharray="2 3"
            shapeRendering="crispEdges"
          />
        ))}

        {/* Marks */}
        <g clipPath={`url(#${id}-clip)`}>{children({ x, y, width: innerW, height: innerH })}</g>
        <clipPath id={`${id}-clip`}>
          <rect x={-2} y={-6} width={innerW + 4} height={innerH + 8} />
        </clipPath>

        {/* Axes */}
        <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="var(--color-line-strong)" />
        <line x1={0} x2={0} y1={0} y2={innerH} stroke="var(--color-line-strong)" />

        {xt.map((v) => (
          <text
            key={`tx-${v}`}
            x={x(v)}
            y={innerH + 15}
            textAnchor="middle"
            className="fill-[var(--color-ink-faint)] font-mono"
            fontSize={10}
          >
            {formatTick(v, xScale)}
          </text>
        ))}
        {yt.map((v) => (
          <text
            key={`ty-${v}`}
            x={-7}
            y={y(v) + 3}
            textAnchor="end"
            className="fill-[var(--color-ink-faint)] font-mono"
            fontSize={10}
          >
            {formatTick(v, yScale)}
          </text>
        ))}

        {xLabel ? (
          <text
            x={innerW / 2}
            y={innerH + 30}
            textAnchor="middle"
            className="fill-[var(--color-ink-soft)]"
            fontSize={11}
          >
            {xLabel}
          </text>
        ) : null}
        {yLabel ? (
          <text
            transform={`translate(${-MARGIN.left + 11},${innerH / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-[var(--color-ink-soft)]"
            fontSize={11}
          >
            {yLabel}
          </text>
        ) : null}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ marks */

export function LineMark({
  points,
  scales,
  color = 'var(--color-series-1)',
  width = 1.75,
  dashed = false,
}: {
  points: readonly (readonly [number, number])[];
  scales: PlotScales;
  color?: string;
  width?: number;
  dashed?: boolean;
}) {
  if (points.length === 0) return null;
  const d = points
    .filter(([px, py]) => Number.isFinite(px) && Number.isFinite(py))
    .map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${scales.x(px).toFixed(2)},${scales.y(py).toFixed(2)}`)
    .join(' ');
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinejoin="round"
      strokeLinecap="round"
      strokeDasharray={dashed ? '5 4' : undefined}
    />
  );
}

export function AreaMark({
  points,
  scales,
  color = 'var(--color-series-1)',
  opacity = 0.14,
  baseline = 0,
}: {
  points: readonly (readonly [number, number])[];
  scales: PlotScales;
  color?: string;
  opacity?: number;
  baseline?: number;
}) {
  if (points.length === 0) return null;
  const base = scales.y(baseline);
  const top = points.map(([px, py]) => `${scales.x(px).toFixed(2)},${scales.y(py).toFixed(2)}`).join(' L');
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const d = `M${scales.x(first[0]).toFixed(2)},${base} L${top} L${scales.x(last[0]).toFixed(2)},${base} Z`;
  return <path d={d} fill={color} opacity={opacity} />;
}

export function BarsMark({
  bins,
  scales,
  color = 'var(--color-series-1)',
  opacity = 0.6,
  value = 'density',
}: {
  bins: HistogramBin[];
  scales: PlotScales;
  color?: string;
  opacity?: number;
  value?: 'density' | 'count';
}) {
  const base = scales.y(0);
  return (
    <g>
      {bins.map((b, i) => {
        const h = value === 'density' ? b.density : b.count;
        const top = scales.y(h);
        const x0 = scales.x(b.lo);
        const x1 = scales.x(b.hi);
        const w = Math.max(0.5, x1 - x0 - 0.75);
        if (!Number.isFinite(top) || h <= 0) return null;
        return (
          <rect
            // eslint-disable-next-line react/no-array-index-key -- bins are positional
            key={i}
            x={x0}
            y={Math.min(top, base)}
            width={w}
            height={Math.abs(base - top)}
            fill={color}
            opacity={opacity}
          />
        );
      })}
    </g>
  );
}

export function PointsMark({
  points,
  scales,
  color = 'var(--color-series-2)',
  radius = 2.5,
  opacity = 0.85,
}: {
  points: readonly (readonly [number, number])[];
  scales: PlotScales;
  color?: string;
  radius?: number;
  opacity?: number;
}) {
  return (
    <g fill={color} opacity={opacity}>
      {points.map(([px, py], i) => (
        // eslint-disable-next-line react/no-array-index-key -- scatter points are positional
        <circle key={i} cx={scales.x(px)} cy={scales.y(py)} r={radius} />
      ))}
    </g>
  );
}

/** A labelled vertical or horizontal reference line, e.g. a theoretical value. */
export function RuleMark({
  scales,
  x: xv,
  y: yv,
  label,
  color = 'var(--color-ink-faint)',
}: {
  scales: PlotScales;
  x?: number;
  y?: number;
  label?: string;
  color?: string;
}) {
  if (xv !== undefined) {
    const px = scales.x(xv);
    return (
      <g>
        <line x1={px} x2={px} y1={0} y2={scales.height} stroke={color} strokeWidth={1.25} strokeDasharray="4 3" />
        {label ? (
          <text x={px + 4} y={11} fontSize={10} className="fill-[var(--color-ink-faint)] font-mono">
            {label}
          </text>
        ) : null}
      </g>
    );
  }
  if (yv !== undefined) {
    const py = scales.y(yv);
    return (
      <g>
        <line x1={0} x2={scales.width} y1={py} y2={py} stroke={color} strokeWidth={1.25} strokeDasharray="4 3" />
        {label ? (
          <text x={scales.width - 3} y={py - 4} fontSize={10} textAnchor="end" className="fill-[var(--color-ink-faint)] font-mono">
            {label}
          </text>
        ) : null}
      </g>
    );
  }
  return null;
}

/* ----------------------------------------------------------------- legend */

export interface LegendEntry {
  label: string;
  color: string;
  dashed?: boolean;
}

export function Legend({ entries }: { entries: LegendEntry[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {entries.map((e) => (
        <li key={e.label} className="flex items-center gap-1.5 text-[11px] text-[var(--color-ink-soft)]">
          <svg width={16} height={8} aria-hidden>
            <line
              x1={0}
              y1={4}
              x2={16}
              y2={4}
              stroke={e.color}
              strokeWidth={2.25}
              strokeDasharray={e.dashed ? '4 3' : undefined}
            />
          </svg>
          {e.label}
        </li>
      ))}
    </ul>
  );
}

/** Wraps a plot with a caption and an optional note about what it shows. */
export function Figure({
  caption,
  note,
  children,
}: {
  caption: string;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="my-4">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
        {children}
      </div>
      <figcaption className="mt-2 text-[0.8rem] leading-relaxed text-[var(--color-ink-faint)]">
        <span className="font-medium text-[var(--color-ink-soft)]">{caption}</span>
        {note ? <> — {note}</> : null}
      </figcaption>
    </figure>
  );
}
