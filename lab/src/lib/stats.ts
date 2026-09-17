/**
 * Summary statistics and empirical distribution utilities used by the
 * experiments. Everything is pure and operates on flat typed arrays.
 */

export type Vec = ArrayLike<number>;

export function mean(x: Vec): number {
  if (x.length === 0) return Number.NaN;
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i]!;
  return s / x.length;
}

/** Unbiased (n − 1) sample variance. Returns 0 for a single observation. */
export function variance(x: Vec): number {
  const n = x.length;
  if (n < 2) return 0;
  const m = mean(x);
  let s = 0;
  for (let i = 0; i < n; i++) {
    const d = x[i]! - m;
    s += d * d;
  }
  return s / (n - 1);
}

export function std(x: Vec): number {
  return Math.sqrt(variance(x));
}

export function min(x: Vec): number {
  let m = Infinity;
  for (let i = 0; i < x.length; i++) if (x[i]! < m) m = x[i]!;
  return m;
}

export function max(x: Vec): number {
  let m = -Infinity;
  for (let i = 0; i < x.length; i++) if (x[i]! > m) m = x[i]!;
  return m;
}

/** Linear-interpolated quantile of the (copied and sorted) sample. */
export function quantile(x: Vec, q: number): number {
  const n = x.length;
  if (n === 0) return Number.NaN;
  const sorted = Array.from(x).sort((a, b) => a - b);
  const pos = (n - 1) * Math.min(1, Math.max(0, q));
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo]!;
  return sorted[lo]! + (pos - lo) * (sorted[hi]! - sorted[lo]!);
}

/** Empirical probability that |x_i − centre| > eps. */
export function tailFraction(x: Vec, centre: number, eps: number): number {
  let c = 0;
  for (let i = 0; i < x.length; i++) if (Math.abs(x[i]! - centre) > eps) c++;
  return c / x.length;
}

export interface HistogramBin {
  lo: number;
  hi: number;
  mid: number;
  count: number;
  /** Bin height normalised so that the total area is 1. */
  density: number;
}

/**
 * Equal-width histogram over [lo, hi] (defaulting to the sample range).
 * Values outside the range are clamped into the end bins so that the density
 * still integrates to one.
 */
export function histogram(x: Vec, bins = 40, lo?: number, hi?: number): HistogramBin[] {
  const a = lo ?? min(x);
  const b = hi ?? max(x);
  const width = (b - a) / bins;
  if (!Number.isFinite(width) || width <= 0) {
    return [{ lo: a, hi: b, mid: (a + b) / 2, count: x.length, density: 0 }];
  }
  const counts = new Array<number>(bins).fill(0);
  for (let i = 0; i < x.length; i++) {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((x[i]! - a) / width)));
    counts[idx] = counts[idx]! + 1;
  }
  return counts.map((count, i) => ({
    lo: a + i * width,
    hi: a + (i + 1) * width,
    mid: a + (i + 0.5) * width,
    count,
    density: count / (x.length * width),
  }));
}

/** Standard normal density. */
export function normalPdf(x: number, mu = 0, sigma = 1): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

/**
 * Standard normal CDF via Abramowitz & Stegun 7.1.26 applied to erf.
 * Absolute error below 1.5e-7, which is well inside plotting resolution.
 */
export function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return sign * y;
}

/**
 * Marchenko–Pastur density for aspect ratio `lambda = p/n` and variance
 * `sigma2`, on the bulk [a, b]. Returns 0 outside the bulk. The atom at 0 that
 * appears when lambda > 1 is not part of the density and is not returned here.
 */
export function marchenkoPasturPdf(x: number, lambda: number, sigma2 = 1): number {
  const a = sigma2 * (1 - Math.sqrt(lambda)) ** 2;
  const b = sigma2 * (1 + Math.sqrt(lambda)) ** 2;
  if (x <= a || x >= b) return 0;
  return Math.sqrt((b - x) * (x - a)) / (2 * Math.PI * sigma2 * lambda * x);
}

export function marchenkoPasturSupport(lambda: number, sigma2 = 1): [number, number] {
  return [sigma2 * (1 - Math.sqrt(lambda)) ** 2, sigma2 * (1 + Math.sqrt(lambda)) ** 2];
}

/** Semicircle density on [-2σ, 2σ], the limit for Wigner matrices. */
export function semicirclePdf(x: number, sigma = 1): number {
  const r = 2 * sigma;
  if (Math.abs(x) >= r) return 0;
  return Math.sqrt(r * r - x * x) / (2 * Math.PI * sigma * sigma);
}

/** Ordinary least squares fit of `y = a + b x`, returned as `{a, b}`. */
export function leastSquaresLine(xs: Vec, ys: Vec): { a: number; b: number } {
  const n = Math.min(xs.length, ys.length);
  const mx = mean(Array.from({ length: n }, (_, i) => xs[i]!));
  const my = mean(Array.from({ length: n }, (_, i) => ys[i]!));
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i]! - mx;
    num += dx * (ys[i]! - my);
    den += dx * dx;
  }
  const b = den === 0 ? 0 : num / den;
  return { a: my - b * mx, b };
}
