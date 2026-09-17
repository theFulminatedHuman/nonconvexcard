'use client';

import { useMemo, useState } from 'react';
import { BarsMark, Figure, Legend, LineMark, Plot, RuleMark } from '@/components/charts/plot';
import { ControlPanel, ReadOut, SeedControl, Slider } from '@/components/experiments/controls';
import { ExperimentFrame } from '@/components/experiments/frame';
import { createRng } from '@/lib/rng';
import { histogram, mean, normalPdf, std } from '@/lib/stats';

const DIMENSIONS = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];

/**
 * The norm of a standard Gaussian vector concentrates at √d with O(1)
 * fluctuations. The second panel is the point of the experiment: the *absolute*
 * width of the distribution does not grow with d, so the relative fluctuation
 * dies like 1/√d.
 */
export function GaussianNorm() {
  const [logD, setLogD] = useState(6); // d = 2^6 = 64
  const [samples, setSamples] = useState(4000);
  const [seed, setSeed] = useState(1);
  const d = 2 ** logD;

  const { norms, centred, sweep } = useMemo(() => {
    const rng = createRng(seed * 104729 + d);
    const out = new Float64Array(samples);
    for (let t = 0; t < samples; t++) {
      let s = 0;
      for (let i = 0; i < d; i++) {
        const z = rng.normal();
        s += z * z;
      }
      out[t] = Math.sqrt(s);
    }
    const sq = Math.sqrt(d);
    const centredArr = Float64Array.from(out, (v) => v - sq);

    // A coarse sweep over dimension: mean and sd of ‖X‖ at each d.
    const sweepRng = createRng(seed * 7717);
    const rows = DIMENSIONS.map((dim) => {
      const m = 600;
      const vals = new Float64Array(m);
      for (let t = 0; t < m; t++) {
        let s = 0;
        for (let i = 0; i < dim; i++) {
          const z = sweepRng.normal();
          s += z * z;
        }
        vals[t] = Math.sqrt(s);
      }
      return { dim, mean: mean(vals), sd: std(vals) };
    });

    return { norms: out, centred: centredArr, sweep: rows };
  }, [d, samples, seed]);

  const bins = useMemo(() => histogram(centred, 48, -4, 4), [centred]);
  const gaussianRef = useMemo(
    () => Array.from({ length: 120 }, (_, i) => {
      const x = -4 + (8 * i) / 119;
      // The limiting fluctuation of ‖X‖ − √d is N(0, 1/2).
      return [x, normalPdf(x, 0, Math.SQRT1_2)] as const;
    }),
    [],
  );

  const meanCurve = sweep.map((r) => [r.dim, r.mean] as const);
  const sqrtCurve = sweep.map((r) => [r.dim, Math.sqrt(r.dim)] as const);
  const sdCurve = sweep.map((r) => [r.dim, r.sd] as const);

  return (
    <ExperimentFrame
      question={
        <>
          For <code>X ~ N(0, I_d)</code> every coordinate is centred at 0, yet <code>‖X‖₂</code> is
          far from 0. Where does it sit, and how wide is it? Compare the width you measure with the
          width you would get if the fluctuation grew with <code>d</code>.
        </>
      }
      controls={
        <ControlPanel>
          <Slider
            label="Dimension d"
            value={logD}
            min={1}
            max={11}
            onChange={setLogD}
            format={() => `2^${logD} = ${d}`}
          />
          <Slider
            label="Samples"
            value={samples}
            min={500}
            max={12000}
            step={500}
            onChange={setSamples}
            format={(v) => v.toLocaleString()}
          />
          <SeedControl seed={seed} onReseed={setSeed} />
          <div className="border-t border-[var(--color-line)] pt-3">
            <ReadOut
              rows={[
                { label: '√d', value: Math.sqrt(d).toFixed(3) },
                { label: 'mean ‖X‖', value: mean(norms).toFixed(3) },
                { label: 'sd ‖X‖', value: std(norms).toFixed(3), note: 'predicted ≈ 0.707' },
                {
                  label: 'relative sd',
                  value: (std(norms) / mean(norms)).toExponential(2),
                  note: 'shrinks like 1/√d',
                },
              ]}
            />
          </div>
        </ControlPanel>
      }
      interpretation={
        <>
          <p>
            The centred histogram barely moves as you sweep <code>d</code> from 2 to 2048: the
            fluctuation of <code>‖X‖₂ − √d</code> is <code>O(1)</code>, not <code>O(√d)</code>. This
            is the content of the concentration-of-the-norm theorem, which bounds{' '}
            <code>‖ ‖X‖₂ − √d ‖_{'{ψ₂}'}</code> by an absolute constant — no dimension dependence at
            all.
          </p>
          <p>
            The reference curve is the <code>N(0, 1/2)</code> density, which is the limit of{' '}
            <code>‖X‖₂ − √d</code> as <code>d → ∞</code> (from the CLT for <code>‖X‖₂²</code> and the
            delta method). At small <code>d</code> the empirical histogram is visibly skewed; the
            concentration bound holds there too, but the Gaussian limit has not kicked in.
          </p>
        </>
      }
    >
      <Figure
        caption={`Centred norm ‖X‖₂ − √d for d = ${d}`}
        note="The reference curve is the N(0, 1/2) density that the centred norm converges to."
      >
        <Plot
          title={`Histogram of the centred Gaussian norm at dimension ${d}`}
          description="A bell-shaped histogram centred at zero with an overlaid normal density."
          xDomain={[-4, 4]}
          yDomain={[0, 0.75]}
          xLabel="‖X‖₂ − √d"
          yLabel="density"
          height={240}
        >
          {(s) => (
            <>
              <BarsMark bins={bins} scales={s} color="var(--color-series-1)" opacity={0.45} />
              <LineMark points={gaussianRef} scales={s} color="var(--color-series-2)" width={2} />
              <RuleMark scales={s} x={0} label="√d" />
            </>
          )}
        </Plot>
        <Legend
          entries={[
            { label: 'empirical', color: 'var(--color-series-1)' },
            { label: 'N(0, 1/2) limit', color: 'var(--color-series-2)' },
          ]}
        />
      </Figure>

      <Figure
        caption="Mean and standard deviation of ‖X‖₂ across dimension"
        note="Log–log axes. The mean tracks √d; the standard deviation stays flat at roughly 1/√2."
      >
        <Plot
          title="Mean and standard deviation of the Gaussian norm as a function of dimension"
          description="The mean grows as the square root of the dimension while the standard deviation stays constant."
          xDomain={[2, 1024]}
          yDomain={[0.3, 40]}
          xScale="log"
          yScale="log"
          xLabel="dimension d"
          yLabel="value"
          height={230}
        >
          {(s) => (
            <>
              <LineMark points={sqrtCurve} scales={s} color="var(--color-series-4)" dashed />
              <LineMark points={meanCurve} scales={s} color="var(--color-series-1)" width={2} />
              <LineMark points={sdCurve} scales={s} color="var(--color-series-3)" width={2} />
            </>
          )}
        </Plot>
        <Legend
          entries={[
            { label: 'mean ‖X‖₂', color: 'var(--color-series-1)' },
            { label: '√d', color: 'var(--color-series-4)', dashed: true },
            { label: 'sd ‖X‖₂', color: 'var(--color-series-3)' },
          ]}
        />
      </Figure>
    </ExperimentFrame>
  );
}
