'use client';

import { useMemo, useState } from 'react';
import { Figure, Legend, LineMark, Plot, PointsMark, RuleMark } from '@/components/charts/plot';
import { ControlPanel, ReadOut, SeedControl, Slider } from '@/components/experiments/controls';
import { ExperimentFrame } from '@/components/experiments/frame';
import { mat, ridgeSolve } from '@/lib/linalg';
import { createRng } from '@/lib/rng';

const DEGREES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
const TEST_GRID = Array.from({ length: 60 }, (_, i) => -1 + (2 * i) / 59);

/** Target regression function: smooth, not polynomial, so no degree is exact. */
const truth = (x: number) => Math.sin(2.2 * x) + 0.35 * x;

/**
 * Measures squared bias, variance and risk of polynomial least squares over
 * repeated draws of the training set, and checks the decomposition numerically.
 */
export function BiasVariance() {
  const [nTrain, setNTrain] = useState(25);
  const [noiseSd, setNoiseSd] = useState(0.3);
  const [datasets, setDatasets] = useState(200);
  const [showDegree, setShowDegree] = useState(3);
  const [seed, setSeed] = useState(1);

  const { rows, fits, sample } = useMemo(() => {
    const rng = createRng(seed * 217645177 + nTrain * 31 + Math.round(noiseSd * 100));

    const design = (xs: number[], degree: number) => {
      const m = mat(xs.length, degree + 1);
      xs.forEach((x, i) => {
        for (let j = 0; j <= degree; j++) m.data[i * (degree + 1) + j] = x ** j;
      });
      return m;
    };

    const predict = (coef: ArrayLike<number>, x: number) => {
      let s = 0;
      for (let j = 0; j < coef.length; j++) s += coef[j]! * x ** j;
      return s;
    };

    // Shared draws so that every degree sees the same datasets.
    const draws = Array.from({ length: datasets }, () => {
      const xs = Array.from({ length: nTrain }, () => rng.uniform(-1, 1));
      const ys = xs.map((x) => truth(x) + noiseSd * rng.normal());
      return { xs, ys };
    });

    const measured = DEGREES.map((degree) => {
      // predictions[t][i] = model t evaluated at test point i
      const predictions = draws.map(({ xs, ys }) => {
        // A tiny ridge keeps the normal equations solvable at high degree with
        // few points; it is 1e-9, far below the noise level, so it does not
        // change the story the plot tells.
        const coef = ridgeSolve(design(xs, degree), ys, 1e-9);
        return TEST_GRID.map((x) => predict(coef, x));
      });

      let bias2 = 0;
      let variance = 0;
      let risk = 0;
      TEST_GRID.forEach((x, i) => {
        const vals = predictions.map((p) => p[i]!);
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        const v = vals.reduce((a, b) => a + (b - avg) ** 2, 0) / vals.length;
        const b = (avg - truth(x)) ** 2;
        bias2 += b;
        variance += v;
        risk += vals.reduce((a, b2) => a + (b2 - truth(x)) ** 2, 0) / vals.length;
      });
      const k = TEST_GRID.length;
      return { degree, bias2: bias2 / k, variance: variance / k, risk: risk / k };
    });

    const shown = draws.slice(0, 12).map(({ xs, ys }) => {
      const coef = ridgeSolve(design(xs, showDegree), ys, 1e-9);
      return TEST_GRID.map((x) => [x, predict(coef, x)] as const);
    });

    const first = draws[0]!;
    return {
      rows: measured,
      fits: shown,
      sample: first.xs.map((x, i) => [x, first.ys[i]!] as const),
    };
  }, [nTrain, noiseSd, datasets, showDegree, seed]);

  const best = rows.reduce((a, b) => (b.risk < a.risk ? b : a), rows[0]!);
  const maxY = Math.min(2.5, Math.max(...rows.map((r) => r.risk)) * 1.15);

  return (
    <ExperimentFrame
      question={
        <>
          For a fixed test point, <code>E[(f̂(x) − f(x))²] = bias(x)² + Var(f̂(x))</code>. The
          decomposition is an identity, not an approximation — so measuring all three separately
          should reproduce it to Monte Carlo error. Where does the total risk bottom out?
        </>
      }
      controls={
        <ControlPanel>
          <Slider label="Training points n" value={nTrain} min={8} max={80} step={1} onChange={setNTrain} />
          <Slider
            label="Noise σ"
            value={noiseSd}
            min={0}
            max={1}
            step={0.05}
            onChange={setNoiseSd}
            format={(v) => v.toFixed(2)}
          />
          <Slider
            label="Datasets averaged"
            value={datasets}
            min={40}
            max={500}
            step={20}
            onChange={setDatasets}
          />
          <Slider
            label="Degree shown below"
            value={showDegree}
            min={0}
            max={15}
            onChange={setShowDegree}
          />
          <SeedControl seed={seed} onReseed={setSeed} />
          <div className="border-t border-[var(--color-line)] pt-3">
            <ReadOut
              rows={[
                { label: 'risk-minimising degree', value: String(best.degree) },
                { label: 'bias² there', value: best.bias2.toExponential(2) },
                { label: 'variance there', value: best.variance.toExponential(2) },
                {
                  label: 'bias² + var vs risk',
                  value: `${(best.bias2 + best.variance).toExponential(2)} / ${best.risk.toExponential(2)}`,
                  note: 'should agree',
                },
              ]}
            />
          </div>
        </ControlPanel>
      }
      interpretation={
        <>
          <p>
            Bias falls monotonically with degree — a richer class can represent more — while variance
            rises, and their sum is U-shaped. The minimum is the classical bias–variance sweet spot.
            Note that the target is <code>sin(2.2x) + 0.35x</code>, which is not a polynomial, so the
            bias never reaches zero at any finite degree.
          </p>
          <p>
            Turn the noise down to zero and the variance curve collapses: variance here is entirely
            noise being fitted. Raise <code>n</code> and the variance curve drops while the bias curve
            is unchanged, which is why "more data" and "simpler model" are not interchangeable
            remedies.
          </p>
          <p>
            One caveat about scope. This is the decomposition for squared loss and for a fixed,
            fully-determined least-squares fit. The U-shape here is <em>not</em> the whole story for
            modern overparameterised models: once the degree exceeds <code>n</code> the problem is
            underdetermined, the fit depends on which minimum-norm solution the algorithm picks, and
            the risk curve can descend a second time. That regime is treated in the double-descent
            section of the learning-theory topic, and this experiment deliberately stops short of it.
          </p>
        </>
      }
    >
      <Figure
        caption="Squared bias, variance and total risk against polynomial degree"
        note="Averaged over independently drawn training sets at each degree."
      >
        <Plot
          title="Bias-variance decomposition as a function of model degree"
          description="A decreasing bias curve, an increasing variance curve, and their U-shaped sum."
          xDomain={[0, 15]}
          yDomain={[0, maxY]}
          xLabel="polynomial degree"
          yLabel="mean squared error"
          height={270}
        >
          {(s) => (
            <>
              <LineMark
                points={rows.map((r) => [r.degree, r.bias2] as const)}
                scales={s}
                color="var(--color-series-3)"
                width={2}
              />
              <LineMark
                points={rows.map((r) => [r.degree, r.variance] as const)}
                scales={s}
                color="var(--color-series-2)"
                width={2}
              />
              <LineMark
                points={rows.map((r) => [r.degree, r.risk] as const)}
                scales={s}
                color="var(--color-series-1)"
                width={2.5}
              />
              <RuleMark scales={s} x={best.degree} label={`argmin = ${best.degree}`} />
            </>
          )}
        </Plot>
        <Legend
          entries={[
            { label: 'risk', color: 'var(--color-series-1)' },
            { label: 'bias²', color: 'var(--color-series-3)' },
            { label: 'variance', color: 'var(--color-series-2)' },
          ]}
        />
      </Figure>

      <Figure
        caption={`Twelve fits of degree ${showDegree} on independent training sets`}
        note="The spread between the grey curves is the variance; their average distance from the black curve is the bias."
      >
        <Plot
          title={`Independent polynomial fits of degree ${showDegree}`}
          description="Several fitted curves scattered around the true regression function."
          xDomain={[-1, 1]}
          yDomain={[-2.2, 2.2]}
          xLabel="x"
          yLabel="f(x)"
          height={240}
        >
          {(s) => (
            <>
              {fits.map((f, i) => (
                // eslint-disable-next-line react/no-array-index-key -- fits are positional
                <LineMark key={i} points={f} scales={s} color="var(--color-series-4)" width={1} />
              ))}
              <LineMark
                points={TEST_GRID.map((x) => [x, truth(x)] as const)}
                scales={s}
                color="var(--color-ink)"
                width={2.25}
              />
              <PointsMark points={sample} scales={s} color="var(--color-series-2)" radius={2.5} />
            </>
          )}
        </Plot>
        <Legend
          entries={[
            { label: 'true f', color: 'var(--color-ink)' },
            { label: 'fits', color: 'var(--color-series-4)' },
            { label: 'one training sample', color: 'var(--color-series-2)' },
          ]}
        />
      </Figure>
    </ExperimentFrame>
  );
}
