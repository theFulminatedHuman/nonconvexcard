'use client';

import { useMemo, useState } from 'react';
import { BarsMark, Figure, Legend, LineMark, Plot, RuleMark } from '@/components/charts/plot';
import { ControlPanel, ReadOut, SeedControl, Slider, Toggle } from '@/components/experiments/controls';
import { ExperimentFrame } from '@/components/experiments/frame';
import { gram, mat, symmetricEigenvalues } from '@/lib/linalg';
import { createRng } from '@/lib/rng';
import { histogram, marchenkoPasturPdf, marchenkoPasturSupport, max as vmax } from '@/lib/stats';

/**
 * The empirical spectrum of a sample covariance matrix with identity population
 * covariance, against the Marchenko–Pastur density.
 *
 * The experiment exists to make one point concrete: with p comparable to n, the
 * sample covariance matrix is a badly distorted picture of the population one,
 * and the distortion has a precise, universal shape.
 */
export function MarchenkoPastur() {
  const [p, setP] = useState(120);
  const [lambda, setLambda] = useState(0.4); // p / n
  const [heavyTailed, setHeavyTailed] = useState(false);
  const [seed, setSeed] = useState(1);
  const n = Math.max(p + 2, Math.round(p / lambda));

  const { eigs, edges } = useMemo(() => {
    const rng = createRng(seed * 32452843 + p * 97 + Math.round(lambda * 1000));
    const X = mat(n, p);
    for (let i = 0; i < X.data.length; i++) {
      // Both laws are standardised to unit variance, so only the tails differ.
      X.data[i] = heavyTailed ? rng.rademacher() * Math.sqrt(rng.exponential(1) * 2) / Math.SQRT2 : rng.normal();
    }
    const S = gram(X); // (1/n) XᵀX
    return { eigs: symmetricEigenvalues(S), edges: marchenkoPasturSupport(p / n) };
  }, [p, n, lambda, heavyTailed, seed]);

  const upper = Math.max(edges[1] * 1.15, vmax(eigs) * 1.05);
  const bins = useMemo(() => histogram(eigs, 44, 0, upper), [eigs, upper]);
  const density = useMemo(() => {
    const ratio = p / n;
    return Array.from({ length: 300 }, (_, i) => {
      const x = (upper * (i + 0.5)) / 300;
      return [x, marchenkoPasturPdf(x, ratio)] as const;
    });
  }, [p, n, upper]);

  const maxDensity = Math.max(...bins.map((b) => b.density), ...density.map((d) => d[1]));
  const largest = eigs[eigs.length - 1] ?? 0;
  const smallest = eigs[0] ?? 0;

  return (
    <ExperimentFrame
      question={
        <>
          The population covariance here is exactly <code>I_p</code>: every eigenvalue{' '}
          <em>should</em> be 1. Sample <code>n</code> vectors, form{' '}
          <code>Σ̂ = (1/n)XᵀX</code>, and look at where its eigenvalues actually are.
        </>
      }
      controls={
        <ControlPanel>
          <Slider label="Dimension p" value={p} min={20} max={200} step={10} onChange={setP} />
          <Slider
            label="Aspect ratio λ = p/n"
            value={lambda}
            min={0.05}
            max={1}
            step={0.05}
            onChange={setLambda}
            format={(v) => v.toFixed(2)}
            hint={`n = ${n}`}
          />
          <Toggle
            label="Heavy-tailed entries (unit variance)"
            checked={heavyTailed}
            onChange={setHeavyTailed}
          />
          <SeedControl seed={seed} onReseed={setSeed} />
          <div className="border-t border-[var(--color-line)] pt-3">
            <ReadOut
              rows={[
                { label: 'bulk edges', value: `[${edges[0].toFixed(3)}, ${edges[1].toFixed(3)}]` },
                { label: 'λ_max(Σ̂)', value: largest.toFixed(3), note: `(1+√λ)² = ${edges[1].toFixed(3)}` },
                { label: 'λ_min(Σ̂)', value: smallest.toFixed(3), note: `(1−√λ)² = ${edges[0].toFixed(3)}` },
                {
                  label: 'condition number',
                  value: (largest / Math.max(smallest, 1e-12)).toFixed(1),
                  note: 'of a matrix whose truth is I',
                },
              ]}
            />
          </div>
        </ControlPanel>
      }
      interpretation={
        <>
          <p>
            The eigenvalues spread over <code>[(1−√λ)², (1+√λ)²]</code> and the histogram follows the
            Marchenko–Pastur density on that interval. Nothing here is a finite-sample artefact that
            more careful estimation removes: with <code>p/n</code> fixed, the spread does{' '}
            <em>not</em> vanish as <code>n → ∞</code>. This is the precise sense in which classical
            asymptotics — <code>p</code> fixed, <code>n → ∞</code>, where the spectrum collapses to a
            point at 1 — is the wrong limit for modern data.
          </p>
          <p>
            Switching to heavy-tailed entries barely moves the bulk. That is universality: the
            limiting density depends on the variance and on <code>λ</code>, not on the entry
            distribution. The extreme eigenvalues are a different story and are governed by the
            fourth moment.
          </p>
          <p>
            Push <code>λ</code> to 1 and the lower edge hits 0: the sample covariance becomes
            singular, the condition number blows up, and any estimator that inverts{' '}
            <code>Σ̂</code> — ordinary least squares among them — is in trouble.
          </p>
        </>
      }
    >
      <Figure
        caption={`Eigenvalues of Σ̂ = (1/n)XᵀX with p = ${p}, n = ${n}, λ = ${(p / n).toFixed(2)}`}
        note="The solid curve is the Marchenko–Pastur density; the dashed rules are the predicted bulk edges."
      >
        <Plot
          title="Empirical eigenvalue histogram against the Marchenko-Pastur density"
          description="A histogram of sample covariance eigenvalues matching a smooth theoretical density supported on an interval."
          xDomain={[0, upper]}
          yDomain={[0, maxDensity * 1.12]}
          xLabel="eigenvalue"
          yLabel="density"
          height={300}
        >
          {(s) => (
            <>
              <BarsMark bins={bins} scales={s} color="var(--color-series-1)" opacity={0.45} />
              <LineMark points={density} scales={s} color="var(--color-series-2)" width={2.25} />
              <RuleMark scales={s} x={edges[0]} label="(1−√λ)²" />
              <RuleMark scales={s} x={edges[1]} label="(1+√λ)²" />
              <RuleMark scales={s} x={1} label="truth = 1" color="var(--color-series-3)" />
            </>
          )}
        </Plot>
        <Legend
          entries={[
            { label: 'empirical spectrum', color: 'var(--color-series-1)' },
            { label: 'Marchenko–Pastur density', color: 'var(--color-series-2)' },
            { label: 'population eigenvalue', color: 'var(--color-series-3)', dashed: true },
          ]}
        />
      </Figure>
    </ExperimentFrame>
  );
}
