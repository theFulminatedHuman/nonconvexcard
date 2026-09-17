import { describe, expect, it } from 'vitest';
import { extent, formatTick, linearTicks, logTicks, makeScale, padDomain } from './scales';

describe('makeScale', () => {
  it('maps a linear domain onto a range', () => {
    const s = makeScale([0, 10], [0, 100]);
    expect(s(0)).toBe(0);
    expect(s(5)).toBe(50);
    expect(s(10)).toBe(100);
  });

  it('supports inverted ranges, as used for the y axis', () => {
    const s = makeScale([0, 1], [200, 0]);
    expect(s(0)).toBe(200);
    expect(s(1)).toBe(0);
  });

  it('inverts', () => {
    const s = makeScale([2, 6], [0, 400]);
    expect(s.invert(s(4))).toBeCloseTo(4, 10);
  });

  it('handles a degenerate domain without dividing by zero', () => {
    const s = makeScale([3, 3], [0, 100]);
    expect(Number.isFinite(s(3))).toBe(true);
  });

  it('maps decades evenly on a log scale', () => {
    const s = makeScale([1, 1000], [0, 300], 'log');
    expect(s(1)).toBeCloseTo(0, 6);
    expect(s(10)).toBeCloseTo(100, 6);
    expect(s(1000)).toBeCloseTo(300, 6);
  });

  it('does not produce NaN for zero on a log scale', () => {
    const s = makeScale([1e-6, 1], [0, 100], 'log');
    expect(Number.isFinite(s(0))).toBe(true);
  });
});

describe('ticks', () => {
  it('produces round linear ticks covering the domain', () => {
    const t = linearTicks([0, 10], 5);
    expect(t[0]).toBe(0);
    expect(t.at(-1)).toBe(10);
    expect(t.every((v) => Number.isFinite(v))).toBe(true);
  });

  it('avoids floating point dust at zero', () => {
    expect(linearTicks([-1, 1], 4)).toContain(0);
  });

  it('returns a single tick for a degenerate domain', () => {
    expect(linearTicks([5, 5])).toEqual([5]);
  });

  it('produces decade ticks on a log axis', () => {
    expect(logTicks([1, 1000])).toEqual([1, 10, 100, 1000]);
  });

  it('thins log ticks over a wide range', () => {
    expect(logTicks([1e-10, 1e10], 5).length).toBeLessThanOrEqual(12);
  });
});

describe('formatTick', () => {
  it('formats common magnitudes compactly', () => {
    expect(formatTick(0)).toBe('0');
    expect(formatTick(1500)).toBe('1.5k');
    expect(formatTick(2.5)).toBe('2.5');
    expect(formatTick(0.25)).toBe('0.25');
  });

  it('uses scientific notation for log axes', () => {
    expect(formatTick(1e-6, 'log')).toBe('1e-6');
  });
});

describe('extent and padDomain', () => {
  it('finds the extent, ignoring non-finite values', () => {
    expect(extent([3, 1, Number.NaN, 5, Infinity])).toEqual([1, 5]);
  });

  it('widens a degenerate extent', () => {
    expect(extent([2, 2])).toEqual([1.5, 2.5]);
  });

  it('falls back to the unit interval for empty input', () => {
    expect(extent([])).toEqual([0, 1]);
  });

  it('pads symmetrically', () => {
    expect(padDomain([0, 10], 0.1)).toEqual([-1, 11]);
  });
});
