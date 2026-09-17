/** Scale construction and tick generation for the SVG plotting primitives. */

export type ScaleType = 'linear' | 'log';

export interface Scale {
  (v: number): number;
  domain: [number, number];
  type: ScaleType;
  /** Inverse map, used for cursor read-out. */
  invert(px: number): number;
}

export function makeScale(
  domain: [number, number],
  range: [number, number],
  type: ScaleType = 'linear',
): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;

  if (type === 'log') {
    // Guard against non-positive domains, which have no logarithm.
    const l0 = Math.log10(Math.max(d0, Number.MIN_VALUE));
    const l1 = Math.log10(Math.max(d1, Number.MIN_VALUE * 10));
    const span = l1 - l0 || 1;
    const fn = ((v: number) =>
      r0 + ((Math.log10(Math.max(v, Number.MIN_VALUE)) - l0) / span) * (r1 - r0)) as Scale;
    fn.domain = domain;
    fn.type = type;
    fn.invert = (px) => 10 ** (l0 + ((px - r0) / (r1 - r0)) * span);
    return fn;
  }

  const span = d1 - d0 || 1;
  const fn = ((v: number) => r0 + ((v - d0) / span) * (r1 - r0)) as Scale;
  fn.domain = domain;
  fn.type = type;
  fn.invert = (px) => d0 + ((px - r0) / (r1 - r0)) * span;
  return fn;
}

/**
 * "Nice" linear ticks: at most `count` values at a 1/2/5 × 10^k step, covering
 * the domain. This is the standard d3 algorithm, reimplemented here so that the
 * charts carry no runtime dependency.
 */
export function linearTicks(domain: [number, number], count = 6): number[] {
  const [d0, d1] = domain;
  if (!Number.isFinite(d0) || !Number.isFinite(d1) || d0 === d1) return [d0];
  const span = Math.abs(d1 - d0);
  const raw = span / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.ceil(Math.min(d0, d1) / step) * step;
  const out: number[] = [];
  for (let v = start; v <= Math.max(d0, d1) + step / 1e6; v += step) {
    out.push(Math.abs(v) < step / 1e6 ? 0 : v);
  }
  return out;
}

/** Decade ticks for a logarithmic axis. */
export function logTicks(domain: [number, number], maxCount = 8): number[] {
  const lo = Math.log10(Math.max(Math.min(...domain), Number.MIN_VALUE));
  const hi = Math.log10(Math.max(...domain));
  const first = Math.floor(lo);
  const last = Math.ceil(hi);
  const every = Math.max(1, Math.ceil((last - first) / maxCount));
  const out: number[] = [];
  for (let k = first; k <= last; k += every) out.push(10 ** k);
  return out;
}

/** Compact axis label: 1.2k, 0.05, 1e-6. */
export function formatTick(v: number, type: ScaleType = 'linear'): string {
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (type === 'log' || a >= 1e5 || a < 1e-3) {
    const exp = Math.round(Math.log10(a));
    if (10 ** exp === a) return `1e${exp}`; // `exp` already carries its own sign
    return v.toExponential(0);
  }
  if (a >= 1000) return `${(v / 1000).toFixed(a >= 10000 ? 0 : 1)}k`;
  if (a >= 10) return v.toFixed(0);
  if (a >= 1) return v.toFixed(1);
  return v.toFixed(a < 0.01 ? 3 : 2);
}

/** Pads a domain by a fraction of its span so marks are not clipped. */
export function padDomain(domain: [number, number], fraction = 0.05): [number, number] {
  const [a, b] = domain;
  const pad = (b - a) * fraction;
  return [a - pad, b + pad];
}

export function extent(values: ArrayLike<number>): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    if (!Number.isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!Number.isFinite(lo)) return [0, 1];
  return lo === hi ? [lo - 0.5, hi + 0.5] : [lo, hi];
}
