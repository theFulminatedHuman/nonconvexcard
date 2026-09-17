'use client';

import { useMemo, useState } from 'react';
import { Figure, Legend, LineMark, Plot, RuleMark } from '@/components/charts/plot';
import { ControlPanel, ReadOut, SeedControl, Select, Slider } from '@/components/experiments/controls';
import { ExperimentFrame } from '@/components/experiments/frame';
import { createRng } from '@/lib/rng';

type Law = 'bernoulli' | 'uniform' | 'rademacher';

interface LawSpec {
  label: string;
  mean: number;
  variance: number;
  /** Almost-sure range [a, b]; Hoeffding's bound uses b − a. */
  range: [number, number];
  draw: (u: () => number) => number;
}

const LAWS: Record<Law, LawSpec> = {
  bernoulli: {
    label: 'Bernoulli(1/2) on {0,1}',
    mean: 0.5,
    variance: 0.25,
    range: [0, 1],
    draw: (u) => (u() < 0.5 ? 0 : 1),
  },
  uniform: {
    label: 'Uniform on [0,1]',
    mean: 0.5,
    variance: 1 / 12,
    range: [0, 1],
    draw: (u) => u(),
  },
  rademacher: {
    label: 'Bernoulli(0.05) on {0,1}',
    mean: 0.05,
    variance: 0.05 * 0.95,
    range: [0, 1],
    draw: (u) => (u() < 0.05 ? 1 : 0),
  },
};

const T_GRID = Array.from({ length: 40 }, (_, i) => 0.01 + (i * 0.34) / 39);

/**
 * Empirical deviation probabilities of a sample mean against four classical
 * upper bounds. The point of the figure is the *gap*: each bound is valid, and
 * each pays a different price for the generality of its hypotheses.
 */
export function ConcentrationInequalities() {
  const [n, setN] = useState(40);
  const [law, setLaw] = useState<Law>('bernoulli');
  const [trials, setTrials] = useState(20000);
  const [seed, setSeed] = useState(1);

  const spec = LAWS[law];

  const { empirical, hoeffding, chebyshev, bernstein, markov, exceedAt } = useMemo(() => {
    const rng = createRng(seed * 7919 + n);
    const deviations = new Float64Array(trials);
    for (let t = 0; t < trials; t++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += spec.draw(rng.next);
      deviations[t] = Math.abs(s / n - spec.mean);
    }
    deviations.sort();

    const tail = (t: number): number => {
      // deviations is sorted, so the tail count is a binary search.
      let lo = 0;
      let hi = deviations.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (deviations[mid]! > t) hi = mid;
        else lo = mid + 1;
      }
      return (deviations.length - lo) / deviations.length;
    };

    const b = spec.range[1] - spec.range[0];
    const sigma2 = spec.variance;
    const meanAbs = deviations.reduce((a, v) => a + v, 0) / deviations.length;

    const clamp = (v: number) => Math.min(2, Math.max(1e-12, v));

    return {
      empirical: T_GRID.map((t) => [t, Math.max(tail(t), 1 / trials / 4)] as const),
      hoeffding: T_GRID.map((t) => [t, clamp(2 * Math.exp((-2 * n * t * t) / (b * b)))] as const),
      chebyshev: T_GRID.map((t) => [t, clamp(sigma2 / (n * t * t))] as const),
      bernstein: T_GRID.map(
        (t) => [t, clamp(2 * Math.exp((-n * t * t) / (2 * sigma2 + (2 * b * t) / 3)))] as const,
      ),
      markov: T_GRID.map((t) => [t, clamp(meanAbs / t)] as const),
      exceedAt: tail(0.1),
    };
  }, [n, spec, trials, seed]);

  const yMin = Math.max(1e-6, 1 / (trials * 4));

  return (
    <ExperimentFrame
      question={
        <>
          Four inequalities bound the same quantity, <code>P(|X̄ₙ − μ| ≥ t)</code>. All four are
          correct. The question is how much each one throws away, and which hypotheses buy the
          improvement.
        </>
      }
      controls={
        <ControlPanel>
          <Select
            label="Distribution of Xᵢ"
            value={law}
            onChange={setLaw}
            options={(Object.keys(LAWS) as Law[]).map((k) => ({ value: k, label: LAWS[k].label }))}
          />
          <Slider label="Sample size n" value={n} min={5} max={400} step={5} onChange={setN} />
          <Slider
            label="Monte Carlo trials"
            value={trials}
            min={2000}
            max={60000}
            step={2000}
            onChange={setTrials}
            format={(v) => v.toLocaleString()}
            hint="Bounds the resolution of the empirical curve."
          />
          <SeedControl seed={seed} onReseed={setSeed} />
          <div className="border-t border-[var(--color-line)] pt-3">
            <ReadOut
              rows={[
                { label: 'σ²', value: spec.variance.toFixed(4) },
                { label: 'range b − a', value: (spec.range[1] - spec.range[0]).toFixed(2) },
                { label: 'P(|X̄ − μ| ≥ 0.1)', value: exceedAt.toExponential(2), note: 'empirical' },
                {
                  label: 'Hoeffding at t = 0.1',
                  value: (2 * Math.exp(-2 * n * 0.01)).toExponential(2),
                },
              ]}
            />
          </div>
        </ControlPanel>
      }
      interpretation={
        <>
          <p>
            Chebyshev decays only polynomially in <code>t</code> and is beaten by the exponential
            bounds as soon as <code>t</code> is a few standard deviations out. Hoeffding ignores the
            variance entirely — it only sees the range — so on the low-variance Bernoulli(0.05) law
            it is badly pessimistic, and Bernstein, which keeps the σ² term, recovers most of the
            gap. In the sub-Gaussian regime <code>t ≲ σ²/b</code> Bernstein’s denominator is
            dominated by <code>2σ²</code> and the bound is Gaussian-like; past that the linear
            <code> bt/3</code> term takes over and the decay becomes exponential rather than
            Gaussian.
          </p>
          <p>
            Markov applied to <code>|X̄ − μ|</code> uses only the first absolute moment and is, as
            expected, the weakest of the four.
          </p>
        </>
      }
    >
      <Figure
        caption="Deviation probability of the sample mean versus four upper bounds"
        note={
          <>
            Log scale on the vertical axis. The empirical curve is floored at the Monte Carlo
            resolution <code>1/(4·trials)</code>; below that the simulation cannot distinguish a
            small probability from zero.
          </>
        }
      >
        <Plot
          title="Empirical tail probability against Markov, Chebyshev, Hoeffding and Bernstein bounds"
          description="Four monotone decreasing curves lying above an empirical tail-probability curve."
          xDomain={[0, 0.35]}
          yDomain={[yMin, 2]}
          yScale="log"
          xLabel="deviation t"
          yLabel="P(|X̄ₙ − μ| ≥ t)"
          height={300}
        >
          {(s) => (
            <>
              <LineMark points={markov} scales={s} color="var(--color-series-5)" dashed />
              <LineMark points={chebyshev} scales={s} color="var(--color-series-4)" dashed />
              <LineMark points={hoeffding} scales={s} color="var(--color-series-2)" />
              <LineMark points={bernstein} scales={s} color="var(--color-series-3)" />
              <LineMark points={empirical} scales={s} color="var(--color-series-1)" width={2.25} />
              <RuleMark scales={s} y={0.05} label="0.05" />
            </>
          )}
        </Plot>
        <Legend
          entries={[
            { label: 'empirical', color: 'var(--color-series-1)' },
            { label: 'Bernstein', color: 'var(--color-series-3)' },
            { label: 'Hoeffding', color: 'var(--color-series-2)' },
            { label: 'Chebyshev', color: 'var(--color-series-4)', dashed: true },
            { label: 'Markov', color: 'var(--color-series-5)', dashed: true },
          ]}
        />
      </Figure>
    </ExperimentFrame>
  );
}
