'use client';

import { useMemo, useState } from 'react';
import { Figure, Legend, LineMark, Plot, PointsMark } from '@/components/charts/plot';
import { ControlPanel, ReadOut, SeedControl, Slider, Select } from '@/components/experiments/controls';
import { ExperimentFrame } from '@/components/experiments/frame';
import { mat, set, solveSpd } from '@/lib/linalg';
import { createRng } from '@/lib/rng';

type KernelName = 'gaussian' | 'laplace' | 'polynomial';

const GRID = Array.from({ length: 220 }, (_, i) => -1.1 + (2.2 * i) / 219);
const truth = (x: number) => Math.sin(3 * x) * Math.exp(-0.4 * x * x);

function kernelFn(name: KernelName, sigma: number) {
  if (name === 'gaussian') return (a: number, b: number) => Math.exp(-((a - b) ** 2) / (2 * sigma * sigma));
  if (name === 'laplace') return (a: number, b: number) => Math.exp(-Math.abs(a - b) / sigma);
  // Inhomogeneous polynomial kernel; sigma reparameterised as the degree.
  const degree = Math.max(1, Math.round(sigma * 6));
  return (a: number, b: number) => (1 + a * b) ** degree;
}

/**
 * Kernel ridge regression in one dimension.
 *
 * The representer theorem says the solution lies in the span of the kernel
 * sections at the training points; the figure draws exactly that — a sum of
 * bumps centred on the data — so the theorem is visible rather than asserted.
 */
export function KernelRegression() {
  const [n, setN] = useState(18);
  const [sigma, setSigma] = useState(0.25);
  const [logLambda, setLogLambda] = useState(-3);
  const [noiseSd, setNoiseSd] = useState(0.12);
  const [kernel, setKernel] = useState<KernelName>('gaussian');
  const [seed, setSeed] = useState(1);
  const lambda = 10 ** logLambda;

  const { fit, data, basis, trainErr, effectiveDof } = useMemo(() => {
    const rng = createRng(seed * 433494437 + n * 131 + Math.round(sigma * 1000));
    const xs = Array.from({ length: n }, (_, i) => -1 + (2 * i) / Math.max(1, n - 1) + rng.uniform(-0.03, 0.03));
    const ys = xs.map((x) => truth(x) + noiseSd * rng.normal());
    const k = kernelFn(kernel, sigma);

    // Solve (K + nλI) α = y — the representer-theorem coefficients.
    const K = mat(n, n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) set(K, i, j, k(xs[i]!, xs[j]!));
    }
    const A = mat(n, n, Float64Array.from(K.data));
    for (let i = 0; i < n; i++) set(A, i, i, A.data[i * n + i]! + n * lambda);

    let alpha: Float64Array;
    try {
      alpha = solveSpd(A, ys);
    } catch {
      // A degenerate kernel matrix (e.g. a huge bandwidth) needs more jitter.
      for (let i = 0; i < n; i++) set(A, i, i, A.data[i * n + i]! + 1e-6);
      alpha = solveSpd(A, ys);
    }

    const evaluate = (x: number) => {
      let s = 0;
      for (let i = 0; i < n; i++) s += alpha[i]! * k(xs[i]!, x);
      return s;
    };

    // Effective degrees of freedom tr(K (K + nλI)^{-1}); a scale-free read-out
    // of how much capacity the regulariser is actually allowing.
    let dof = 0;
    for (let i = 0; i < n; i++) {
      const e = new Float64Array(n);
      e[i] = 1;
      const col = solveSpd(A, e);
      let s = 0;
      for (let j = 0; j < n; j++) s += K.data[i * n + j]! * col[j]!;
      dof += s;
    }

    let err = 0;
    xs.forEach((x, i) => {
      err += (evaluate(x) - ys[i]!) ** 2;
    });

    return {
      fit: GRID.map((x) => [x, evaluate(x)] as const),
      data: xs.map((x, i) => [x, ys[i]!] as const),
      basis: xs.slice(0, Math.min(n, 10)).map((c, i) =>
        GRID.map((x) => [x, alpha[i]! * k(c, x)] as const),
      ),
      trainErr: err / n,
      effectiveDof: dof,
    };
  }, [n, sigma, lambda, noiseSd, kernel, seed]);

  return (
    <ExperimentFrame
      question={
        <>
          Kernel ridge regression minimises{' '}
          <code>(1/n)Σ(yᵢ − f(xᵢ))² + λ‖f‖²_H</code> over an infinite-dimensional space, and the
          representer theorem collapses the search to <code>n</code> coefficients. What do the two
          knobs — bandwidth <code>σ</code> and ridge <code>λ</code> — actually do to the answer?
        </>
      }
      controls={
        <ControlPanel>
          <Select
            label="Kernel"
            value={kernel}
            onChange={setKernel}
            options={[
              { value: 'gaussian', label: 'Gaussian exp(−|x−y|²/2σ²)' },
              { value: 'laplace', label: 'Laplace exp(−|x−y|/σ)' },
              { value: 'polynomial', label: 'Polynomial (1+xy)^d' },
            ]}
          />
          <Slider
            label={kernel === 'polynomial' ? 'Degree (via σ)' : 'Bandwidth σ'}
            value={sigma}
            min={0.03}
            max={1.5}
            step={0.01}
            onChange={setSigma}
            format={(v) => (kernel === 'polynomial' ? String(Math.max(1, Math.round(v * 6))) : v.toFixed(2))}
          />
          <Slider
            label="log₁₀ λ"
            value={logLambda}
            min={-8}
            max={0}
            step={0.25}
            onChange={setLogLambda}
            format={(v) => `λ = 1e${v.toFixed(2)}`}
          />
          <Slider label="Training points n" value={n} min={5} max={60} step={1} onChange={setN} />
          <Slider
            label="Noise σ_y"
            value={noiseSd}
            min={0}
            max={0.5}
            step={0.02}
            onChange={setNoiseSd}
            format={(v) => v.toFixed(2)}
          />
          <SeedControl seed={seed} onReseed={setSeed} />
          <div className="border-t border-[var(--color-line)] pt-3">
            <ReadOut
              rows={[
                { label: 'training MSE', value: trainErr.toExponential(2) },
                {
                  label: 'effective d.o.f.',
                  value: effectiveDof.toFixed(2),
                  note: `of n = ${n}`,
                },
              ]}
            />
          </div>
        </ControlPanel>
      }
      interpretation={
        <>
          <p>
            The fitted function is a sum of kernel bumps, one per training point, weighted by the
            coefficients <code>αᵢ</code> — the lower panel draws those terms. That is the representer
            theorem: whatever else lives in the RKHS, the minimiser does not use it.
          </p>
          <p>
            Small <code>σ</code> makes the bumps narrow, the effective degrees of freedom approach{' '}
            <code>n</code>, and the fit interpolates the noise. Large <code>σ</code> makes the kernel
            matrix nearly rank-one and the fit nearly constant. The ridge <code>λ</code> moves
            along the same axis from the opposite end: driving it to <code>0</code> recovers exact
            interpolation, and raising it shrinks the coefficients toward zero.
          </p>
          <p>
            The effective degrees of freedom <code>tr(K(K + nλI)⁻¹)</code> is the honest measure of
            capacity here — not the number of parameters, which is formally infinite.
          </p>
        </>
      }
    >
      <Figure
        caption="Kernel ridge fit against the target function"
        note="Points are the noisy training sample; the black curve is the target, which the fit does not see."
      >
        <Plot
          title="Kernel ridge regression fit"
          description="A smooth fitted curve through noisy scattered points, compared with the true function."
          xDomain={[-1.1, 1.1]}
          yDomain={[-1.6, 1.6]}
          xLabel="x"
          yLabel="f(x)"
          height={270}
        >
          {(s) => (
            <>
              <LineMark
                points={GRID.map((x) => [x, truth(x)] as const)}
                scales={s}
                color="var(--color-ink)"
                width={1.75}
                dashed
              />
              <LineMark points={fit} scales={s} color="var(--color-series-1)" width={2.5} />
              <PointsMark points={data} scales={s} color="var(--color-series-2)" radius={3} />
            </>
          )}
        </Plot>
        <Legend
          entries={[
            { label: 'kernel ridge fit', color: 'var(--color-series-1)' },
            { label: 'true f', color: 'var(--color-ink)', dashed: true },
            { label: 'training data', color: 'var(--color-series-2)' },
          ]}
        />
      </Figure>

      <Figure
        caption="The representer expansion, term by term"
        note="Each curve is αᵢ k(xᵢ, ·) for one training point; the fit above is their sum."
      >
        <Plot
          title="Individual terms of the representer expansion"
          description="Several localised bump functions of varying sign and height."
          xDomain={[-1.1, 1.1]}
          yDomain={[-1.2, 1.2]}
          xLabel="x"
          yLabel="αᵢ k(xᵢ, x)"
          height={200}
        >
          {(s) => (
            <>
              {basis.map((b, i) => (
                // eslint-disable-next-line react/no-array-index-key -- expansion terms are positional
                <LineMark key={i} points={b} scales={s} color="var(--color-series-4)" width={1.1} />
              ))}
            </>
          )}
        </Plot>
      </Figure>
    </ExperimentFrame>
  );
}
