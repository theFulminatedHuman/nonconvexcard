import { describe, expect, it } from 'vitest';
import {
  erf,
  histogram,
  leastSquaresLine,
  marchenkoPasturPdf,
  marchenkoPasturSupport,
  mean,
  normalCdf,
  normalPdf,
  quantile,
  semicirclePdf,
  std,
  tailFraction,
  variance,
} from './stats';

describe('summary statistics', () => {
  it('computes mean and unbiased variance', () => {
    const x = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(mean(x)).toBe(5);
    expect(variance(x)).toBeCloseTo(4.571428, 5);
    expect(std(x)).toBeCloseTo(Math.sqrt(4.571428), 4);
  });

  it('treats a single observation as zero variance', () => {
    expect(variance([3])).toBe(0);
  });

  it('interpolates quantiles', () => {
    const x = [1, 2, 3, 4];
    expect(quantile(x, 0)).toBe(1);
    expect(quantile(x, 1)).toBe(4);
    expect(quantile(x, 0.5)).toBeCloseTo(2.5, 10);
  });

  it('counts tail events', () => {
    expect(tailFraction([0, 1, 2, 3], 0, 1.5)).toBe(0.5);
  });
});

describe('histogram', () => {
  it('conserves mass and integrates to one', () => {
    const x = Array.from({ length: 1000 }, (_, i) => i / 1000);
    const bins = histogram(x, 10, 0, 1);
    expect(bins).toHaveLength(10);
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(1000);
    const area = bins.reduce((a, b) => a + b.density * (b.hi - b.lo), 0);
    expect(area).toBeCloseTo(1, 10);
  });

  it('clamps out-of-range values into the end bins', () => {
    const bins = histogram([-5, 0.5, 5], 2, 0, 1);
    expect(bins[0]!.count).toBe(1);
    expect(bins[1]!.count).toBe(2);
  });
});

describe('special functions', () => {
  it('matches known values of erf', () => {
    expect(erf(0)).toBeCloseTo(0, 6);
    expect(erf(1)).toBeCloseTo(0.8427008, 5);
    expect(erf(-1)).toBeCloseTo(-0.8427008, 5);
  });

  it('matches known values of the normal CDF', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 4);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 4);
  });

  it('has a normal density that integrates to one', () => {
    let area = 0;
    const h = 0.001;
    for (let x = -8; x <= 8; x += h) area += normalPdf(x) * h;
    expect(area).toBeCloseTo(1, 4);
  });
});

describe('limiting spectral densities', () => {
  it('places the Marchenko-Pastur bulk at the right edges', () => {
    const [a, b] = marchenkoPasturSupport(0.25);
    expect(a).toBeCloseTo(0.25, 10);
    expect(b).toBeCloseTo(2.25, 10);
    expect(marchenkoPasturPdf(0.1, 0.25)).toBe(0);
    expect(marchenkoPasturPdf(3, 0.25)).toBe(0);
    expect(marchenkoPasturPdf(1, 0.25)).toBeGreaterThan(0);
  });

  it('has a Marchenko-Pastur density integrating to one when lambda < 1', () => {
    const lambda = 0.5;
    const [a, b] = marchenkoPasturSupport(lambda);
    let area = 0;
    const h = (b - a) / 200000;
    for (let x = a + h / 2; x < b; x += h) area += marchenkoPasturPdf(x, lambda) * h;
    expect(area).toBeCloseTo(1, 2);
  });

  it('has a semicircle density integrating to one', () => {
    let area = 0;
    const h = 4 / 200000;
    for (let x = -2 + h / 2; x < 2; x += h) area += semicirclePdf(x) * h;
    expect(area).toBeCloseTo(1, 3);
  });
});

describe('leastSquaresLine', () => {
  it('recovers an exact linear relation', () => {
    const xs = [0, 1, 2, 3, 4];
    const ys = xs.map((x) => 3 - 2 * x);
    const { a, b } = leastSquaresLine(xs, ys);
    expect(a).toBeCloseTo(3, 10);
    expect(b).toBeCloseTo(-2, 10);
  });

  it('returns zero slope for constant x', () => {
    expect(leastSquaresLine([1, 1, 1], [0, 5, 10]).b).toBe(0);
  });
});
