'use client';

import { useMemo, useState } from 'react';
import { Figure, Legend, LineMark, Plot, PointsMark } from '@/components/charts/plot';
import { ControlPanel, ReadOut, SeedControl, Slider, Toggle } from '@/components/experiments/controls';
import { ExperimentFrame } from '@/components/experiments/frame';
import { createRng } from '@/lib/rng';

type Method = 'gd' | 'heavy-ball' | 'nesterov' | 'sgd';

const COLORS: Record<Method, string> = {
  gd: 'var(--color-series-1)',
  'heavy-ball': 'var(--color-series-3)',
  nesterov: 'var(--color-series-4)',
  sgd: 'var(--color-series-2)',
};

const LABELS: Record<Method, string> = {
  gd: 'gradient descent',
  'heavy-ball': 'heavy ball',
  nesterov: 'Nesterov',
  sgd: 'SGD (constant η)',
};

interface Run {
  method: Method;
  gaps: number[];
  path: [number, number][];
}

/**
 * Deterministic and stochastic first-order methods on the quadratic
 * f(x) = ½(μ x₁² + L x₂²), whose condition number κ = L/μ is set directly.
 *
 * A quadratic is the right test bed here because every rate in the topic pages
 * is tight on it: the observed slopes can be compared with the theorems rather
 * than merely admired.
 */
export function SgdDynamics() {
  const [logKappa, setLogKappa] = useState(1.3); // κ = 20
  const [stepFraction, setStepFraction] = useState(1); // η = fraction / L
  const [noise, setNoise] = useState(0.35);
  const [steps, setSteps] = useState(220);
  const [decaying, setDecaying] = useState(false);
  const [seed, setSeed] = useState(1);

  const kappa = 10 ** logKappa;
  const L = kappa;
  const mu = 1;
  const eta = stepFraction / L;

  const runs = useMemo<Run[]>(() => {
    const f = (x: number, y: number) => 0.5 * (mu * x * x + L * y * y);
    const grad = (x: number, y: number): [number, number] => [mu * x, L * y];
    const start: [number, number] = [1, 1];

    const build = (method: Method): Run => {
      const rng = createRng(seed * 122949823 + method.length * 7717);
      let [x, y] = start;
      let [vx, vy] = [0, 0];
      const gaps: number[] = [f(x, y)];
      const path: [number, number][] = [[x, y]];
      const beta = (Math.sqrt(kappa) - 1) / (Math.sqrt(kappa) + 1);

      for (let t = 1; t <= steps; t++) {
        if (method === 'gd') {
          const [gx, gy] = grad(x, y);
          x -= eta * gx;
          y -= eta * gy;
        } else if (method === 'heavy-ball') {
          const [gx, gy] = grad(x, y);
          vx = beta * vx - eta * gx;
          vy = beta * vy - eta * gy;
          x += vx;
          y += vy;
        } else if (method === 'nesterov') {
          // Look-ahead form: gradient is taken at the extrapolated point.
          const lx = x + beta * vx;
          const ly = y + beta * vy;
          const [gx, gy] = grad(lx, ly);
          const nx = lx - eta * gx;
          const ny = ly - eta * gy;
          vx = nx - x;
          vy = ny - y;
          x = nx;
          y = ny;
        } else {
          // Unbiased gradient oracle: g = ∇f(x) + ξ with E[ξ] = 0.
          const stepSize = decaying ? eta / (1 + t / 25) : eta;
          const [gx, gy] = grad(x, y);
          x -= stepSize * (gx + noise * rng.normal());
          y -= stepSize * (gy + noise * rng.normal());
        }
        gaps.push(Math.max(f(x, y), 1e-18));
        if (t % Math.max(1, Math.floor(steps / 160)) === 0) path.push([x, y]);
      }
      return { method, gaps, path };
    };

    return (['gd', 'heavy-ball', 'nesterov', 'sgd'] as Method[]).map(build);
  }, [kappa, L, eta, noise, steps, decaying, seed]);

  const theory = useMemo(() => {
    const rate = Math.max(0, 1 - mu / L);
    const f0 = runs[0]?.gaps[0] ?? 1;
    return Array.from({ length: steps + 1 }, (_, t) => [t, Math.max(f0 * rate ** t, 1e-18)] as const);
  }, [L, steps, runs]);

  const yFloor = Math.max(
    1e-16,
    Math.min(...runs.flatMap((r) => r.gaps.filter((g) => g > 0))) * 0.5,
  );

  const finalGaps = runs.map((r) => ({ method: r.method, gap: r.gaps[r.gaps.length - 1]! }));
  const diverging = finalGaps.some((g) => !Number.isFinite(g.gap) || g.gap > 1e6);

  return (
    <ExperimentFrame
      question={
        <>
          On <code>f(x) = ½(μx₁² + Lx₂²)</code> the theory is exact: gradient descent contracts the
          gap by <code>(1 − μ/L)</code> per step, momentum improves the exponent to{' '}
          <code>1 − 1/√κ</code>, and constant-step SGD cannot go below a noise floor. Do the measured
          slopes agree?
        </>
      }
      controls={
        <ControlPanel>
          <Slider
            label="Condition number κ = L/μ"
            value={logKappa}
            min={0.3}
            max={3}
            step={0.1}
            onChange={setLogKappa}
            format={() => kappa.toFixed(0)}
          />
          <Slider
            label="Step size η · L"
            value={stepFraction}
            min={0.1}
            max={2.2}
            step={0.05}
            onChange={setStepFraction}
            format={(v) => v.toFixed(2)}
            hint="Gradient descent diverges on this quadratic once ηL > 2."
          />
          <Slider
            label="Gradient noise scale"
            value={noise}
            min={0}
            max={2}
            step={0.05}
            onChange={setNoise}
            format={(v) => v.toFixed(2)}
          />
          <Slider label="Iterations" value={steps} min={50} max={600} step={25} onChange={setSteps} />
          <Toggle label="Decaying step ηₜ = η/(1+t/25)" checked={decaying} onChange={setDecaying} />
          <SeedControl seed={seed} onReseed={setSeed} />
          <div className="border-t border-[var(--color-line)] pt-3">
            <ReadOut
              rows={finalGaps.map((g) => ({
                label: LABELS[g.method],
                value: Number.isFinite(g.gap) ? g.gap.toExponential(2) : 'diverged',
              }))}
            />
          </div>
        </ControlPanel>
      }
      interpretation={
        <>
          <p>
            On log axes a linear rate is a straight line, and the gradient-descent curve sits on the{' '}
            <code>(1 − μ/L)ᵗ</code> guide whenever <code>ηL ≤ 1</code>. Raise <code>ηL</code> past 2
            and it diverges — the threshold is exact for a quadratic, and it is the reason the
            smoothness constant appears in every step-size condition.
          </p>
          <p>
            Both momentum methods bend the line to a steeper slope, with the improvement growing as{' '}
            <code>κ</code> grows: that is the <code>√κ</code> of acceleration. Heavy ball can
            oscillate; Nesterov’s extrapolation damps it.
          </p>
          <p>
            The SGD curve is different in kind. With a constant step it descends at the deterministic
            rate and then flattens at a floor proportional to <code>ησ²/μ</code> — it does not
            converge to the minimiser, it converges to a neighbourhood of it. Switch on the decaying
            step and the floor disappears, at the cost of a slower, <code>O(1/t)</code>-type descent.
            That trade is the whole content of the Robbins–Monro conditions.
          </p>
        </>
      }
    >
      <Figure
        caption="Suboptimality f(xₜ) − f* against iteration"
        note={
          diverging
            ? 'At least one method is diverging at this step size — that is the experiment working, not breaking.'
            : 'Log scale on the vertical axis, so a straight line is a linear (geometric) rate.'
        }
      >
        <Plot
          title="Suboptimality curves for gradient descent, heavy ball, Nesterov and SGD"
          description="Four decreasing curves on a logarithmic vertical axis; the stochastic one flattens at a noise floor."
          xDomain={[0, steps]}
          yDomain={[yFloor, Math.max(...runs.map((r) => r.gaps[0]!)) * 2]}
          yScale="log"
          xLabel="iteration t"
          yLabel="f(xₜ) − f*"
          height={300}
        >
          {(s) => (
            <>
              <LineMark points={theory} scales={s} color="var(--color-ink-faint)" dashed width={1.25} />
              {runs.map((r) => (
                <LineMark
                  key={r.method}
                  points={r.gaps.map((g, t) => [t, g] as const)}
                  scales={s}
                  color={COLORS[r.method]}
                  width={1.9}
                />
              ))}
            </>
          )}
        </Plot>
        <Legend
          entries={[
            ...(['gd', 'heavy-ball', 'nesterov', 'sgd'] as Method[]).map((m) => ({
              label: LABELS[m],
              color: COLORS[m],
            })),
            { label: '(1 − μ/L)ᵗ', color: 'var(--color-ink-faint)', dashed: true },
          ]}
        />
      </Figure>

      <Figure
        caption="Trajectories in the (x₁, x₂) plane"
        note="The ill-conditioned direction is vertical. Gradient descent zig-zags across the narrow valley; momentum turns the zig-zag into an overshoot it then damps."
      >
        <Plot
          title="Optimisation trajectories on a quadratic"
          description="Paths converging towards the origin from the point (1,1)."
          xDomain={[-0.35, 1.15]}
          yDomain={[-0.6, 1.15]}
          xLabel="x₁ (well conditioned, curvature μ)"
          yLabel="x₂ (curvature L)"
          height={260}
        >
          {(s) => (
            <>
              {runs.map((r) => (
                <LineMark key={r.method} points={r.path} scales={s} color={COLORS[r.method]} width={1.5} />
              ))}
              <PointsMark points={[[0, 0]]} scales={s} color="var(--color-ink)" radius={3.5} />
            </>
          )}
        </Plot>
      </Figure>
    </ExperimentFrame>
  );
}
