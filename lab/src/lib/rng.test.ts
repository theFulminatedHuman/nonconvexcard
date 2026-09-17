import { describe, expect, it } from 'vitest';
import { createRng, gaussianVector, hashString, sample } from './rng';
import { mean, std } from './stats';

describe('createRng', () => {
  it('is reproducible for a given seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const xs = Array.from({ length: 50 }, () => a.next());
    const ys = Array.from({ length: 50 }, () => b.next());
    expect(xs).toEqual(ys);
  });

  it('produces different streams for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a.next()).not.toBe(b.next());
  });

  it('accepts string seeds', () => {
    const a = createRng('johnson-lindenstrauss');
    const b = createRng('johnson-lindenstrauss');
    expect(a.next()).toBe(b.next());
    expect(hashString('a')).not.toBe(hashString('b'));
  });

  it('stays inside [0, 1)', () => {
    const r = createRng(7);
    for (let i = 0; i < 5000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('generates approximately standard normal draws', () => {
    const r = createRng(11);
    const x = sample(20000, () => r.normal());
    expect(mean(x)).toBeCloseTo(0, 1);
    expect(std(x)).toBeCloseTo(1, 1);
  });

  it('generates Rademacher draws that are balanced', () => {
    const r = createRng(3);
    const x = sample(20000, () => r.rademacher());
    expect(Math.abs(mean(x))).toBeLessThan(0.05);
    expect(new Set(Array.from(x))).toEqual(new Set([-1, 1]));
  });

  it('gives Gaussian vectors of the requested dimension', () => {
    const v = gaussianVector(createRng(5), 128);
    expect(v.length).toBe(128);
    // ‖X‖ concentrates near √d — see the norm-concentration experiment.
    const n = Math.hypot(...Array.from(v));
    expect(n).toBeGreaterThan(Math.sqrt(128) - 4);
    expect(n).toBeLessThan(Math.sqrt(128) + 4);
  });

  it('gives exponential draws with the requested mean', () => {
    const r = createRng(9);
    const x = sample(20000, () => r.exponential(2));
    expect(mean(x)).toBeCloseTo(0.5, 1);
  });
});
