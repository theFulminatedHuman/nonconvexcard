/**
 * Deterministic pseudo-random number generation.
 *
 * Every experiment on the site is reproducible: the same seed produces the same
 * figure on every machine and every reload. That matters here because the plots
 * are used as evidence for (or against) theoretical predictions, and a reader
 * must be able to reproduce what they are shown.
 *
 * The generator is `sfc32` seeded through `splitmix32` — small, fast, and with
 * a long enough period (~2^128) for the sample sizes used in the experiments.
 */

export interface Rng {
  /** Uniform on [0, 1). */
  next(): number;
  /** Uniform on [lo, hi). */
  uniform(lo: number, hi: number): number;
  /** Standard normal via the polar Box–Muller transform. */
  normal(): number;
  /** Normal with given mean and standard deviation. */
  gaussian(mean: number, sd: number): number;
  /** Rademacher: ±1 with equal probability. */
  rademacher(): number;
  /** Bernoulli(p) as 0/1. */
  bernoulli(p: number): number;
  /** Exponential with rate `lambda`. */
  exponential(lambda: number): number;
  /** Uniform integer in [0, n). */
  int(n: number): number;
}

function splitmix32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x9e3779b9) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Creates a generator. `seed` may be a number or a string (hashed with FNV-1a),
 * so experiments can be seeded by a human-readable label.
 */
export function createRng(seed: number | string = 1): Rng {
  const numericSeed = typeof seed === 'number' ? seed : hashString(seed);
  const mix = splitmix32(numericSeed);
  let a = (mix() * 4294967296) >>> 0;
  let b = (mix() * 4294967296) >>> 0;
  let c = (mix() * 4294967296) >>> 0;
  let d = (mix() * 4294967296) >>> 0;

  const next = (): number => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };

  // Discard the first outputs; the state is still correlated with the seed.
  for (let i = 0; i < 12; i++) next();

  let spare: number | null = null;
  const normal = (): number => {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return v;
    }
    let u = 0;
    let v = 0;
    let s = 0;
    do {
      u = 2 * next() - 1;
      v = 2 * next() - 1;
      s = u * u + v * v;
    } while (s === 0 || s >= 1);
    const f = Math.sqrt((-2 * Math.log(s)) / s);
    spare = v * f;
    return u * f;
  };

  return {
    next,
    normal,
    uniform: (lo, hi) => lo + (hi - lo) * next(),
    gaussian: (mean, sd) => mean + sd * normal(),
    rademacher: () => (next() < 0.5 ? -1 : 1),
    bernoulli: (p) => (next() < p ? 1 : 0),
    exponential: (lambda) => -Math.log(1 - next()) / lambda,
    int: (n) => Math.floor(next() * n),
  };
}

export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** `n` i.i.d. draws from `draw`. */
export function sample(n: number, draw: () => number): Float64Array {
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = draw();
  return out;
}

/** A standard Gaussian vector in R^d. */
export function gaussianVector(rng: Rng, d: number): Float64Array {
  const v = new Float64Array(d);
  for (let i = 0; i < d; i++) v[i] = rng.normal();
  return v;
}

/**
 * An `n x p` matrix with i.i.d. entries, stored row-major in a flat array.
 * Flat storage keeps the experiments allocation-light at n*p in the thousands.
 */
export function randomMatrix(rng: Rng, n: number, p: number, draw: (r: Rng) => number): Float64Array {
  const m = new Float64Array(n * p);
  for (let i = 0; i < n * p; i++) m[i] = draw(rng);
  return m;
}
