'use client';

import { useMemo, useState } from 'react';
import { BarsMark, Figure, Legend, LineMark, Plot, RuleMark } from '@/components/charts/plot';
import { ControlPanel, ReadOut, SeedControl, Slider } from '@/components/experiments/controls';
import { ExperimentFrame } from '@/components/experiments/frame';
import { createRng } from '@/lib/rng';
import { histogram, max as vmax, mean } from '@/lib/stats';

const K_GRID = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256];

/**
 * Distortion of pairwise distances under a Gaussian random projection.
 *
 * The lemma controls the *worst* pair, which is why the figure plots the
 * maximum distortion alongside the mean: the mean looks fine long before the
 * maximum does, and a reader who only watches the mean will conclude that far
 * smaller k suffices than the theorem allows.
 */
export function RandomProjectionJL() {
  const [nPoints, setNPoints] = useState(40);
  const [ambient, setAmbient] = useState(400);
  const [kIndex, setKIndex] = useState(5); // K_GRID[5] = 32
  const [seed, setSeed] = useState(1);
  const k = K_GRID[kIndex]!;

  const { curve, distortions, pairCount } = useMemo(() => {
    const rng = createRng(seed * 15485863 + nPoints * 31 + ambient);

    // Fixed point cloud, shared across every target dimension in the sweep.
    const pts: Float64Array[] = [];
    for (let i = 0; i < nPoints; i++) {
      const v = new Float64Array(ambient);
      for (let j = 0; j < ambient; j++) v[j] = rng.normal();
      pts.push(v);
    }

    const pairs: { i: number; j: number; d2: number }[] = [];
    for (let i = 0; i < nPoints; i++) {
      for (let j = i + 1; j < nPoints; j++) {
        let s = 0;
        const a = pts[i]!;
        const b = pts[j]!;
        for (let t = 0; t < ambient; t++) {
          const dd = a[t]! - b[t]!;
          s += dd * dd;
        }
        pairs.push({ i, j, d2: s });
      }
    }

    /** Distortions |‖Ax − Ay‖²/‖x − y‖² − 1| for one target dimension. */
    const runFor = (target: number, r: ReturnType<typeof createRng>): Float64Array => {
      // A is target x ambient with N(0, 1/target) entries, so E‖Ax‖² = ‖x‖².
      const scale = 1 / Math.sqrt(target);
      const A = new Float64Array(target * ambient);
      for (let i = 0; i < A.length; i++) A[i] = r.normal() * scale;

      const proj: Float64Array[] = pts.map((v) => {
        const out = new Float64Array(target);
        for (let row = 0; row < target; row++) {
          let s = 0;
          const base = row * ambient;
          for (let c = 0; c < ambient; c++) s += A[base + c]! * v[c]!;
          out[row] = s;
        }
        return out;
      });

      const out = new Float64Array(pairs.length);
      pairs.forEach((p, idx) => {
        const a = proj[p.i]!;
        const b = proj[p.j]!;
        let s = 0;
        for (let t = 0; t < target; t++) {
          const dd = a[t]! - b[t]!;
          s += dd * dd;
        }
        out[idx] = Math.abs(s / p.d2 - 1);
      });
      return out;
    };

    const sweepRng = createRng(seed * 5915587 + 1);
    const sweep = K_GRID.map((target) => {
      const dist = runFor(target, sweepRng);
      return { k: target, maxD: vmax(dist), meanD: mean(dist) };
    });

    return {
      curve: sweep,
      distortions: runFor(k, createRng(seed * 3010349 + k)),
      pairCount: pairs.length,
    };
  }, [nPoints, ambient, k, seed]);

  const bins = useMemo(() => histogram(distortions, 36, 0, Math.max(0.05, vmax(distortions))), [distortions]);
  const worst = vmax(distortions);

  // Dimension the lemma asks for at the observed worst distortion.
  const epsilon = Math.max(0.05, worst);
  const required = Math.ceil((8 * Math.log(nPoints)) / (epsilon * epsilon));

  return (
    <ExperimentFrame
      question={
        <>
          The Johnson–Lindenstrauss lemma promises that <code>k = O(ε⁻² log N)</code> dimensions
          preserve every pairwise distance to within <code>1 ± ε</code>. Watch the{' '}
          <em>maximum</em> distortion over all <code>{pairCount}</code> pairs, not the average — the
          lemma is a statement about the worst pair.
        </>
      }
      controls={
        <ControlPanel>
          <Slider
            label="Points N"
            value={nPoints}
            min={10}
            max={70}
            step={5}
            onChange={setNPoints}
            hint={`${pairCount} pairs`}
          />
          <Slider
            label="Ambient dimension D"
            value={ambient}
            min={100}
            max={1000}
            step={100}
            onChange={setAmbient}
            hint="The guarantee does not depend on D."
          />
          <Slider
            label="Target dimension k"
            value={kIndex}
            min={0}
            max={K_GRID.length - 1}
            onChange={setKIndex}
            format={() => String(k)}
          />
          <SeedControl seed={seed} onReseed={setSeed} />
          <div className="border-t border-[var(--color-line)] pt-3">
            <ReadOut
              rows={[
                { label: 'worst distortion', value: worst.toFixed(4) },
                { label: 'mean distortion', value: mean(distortions).toFixed(4) },
                { label: 'k in use', value: String(k) },
                {
                  label: '8 log N / ε²',
                  value: String(required),
                  note: `at ε = ${epsilon.toFixed(3)}`,
                },
              ]}
            />
          </div>
        </ControlPanel>
      }
      interpretation={
        <>
          <p>
            Two things should be visible. First, the maximum distortion falls like{' '}
            <code>1/√k</code>: halving the tolerated <code>ε</code> costs a factor of four in{' '}
            <code>k</code>, exactly the <code>ε⁻²</code> of the lemma. Second, sweeping the ambient
            dimension <code>D</code> at fixed <code>k</code> barely moves the curve. The target
            dimension depends on the number of points and on the accuracy, never on the dimension
            you started in.
          </p>
          <p>
            The gap between the mean and the maximum is the union bound made visible: a single pair
            is preserved with overwhelming probability, and the cost of asking that{' '}
            <code>{'(N choose 2)'}</code> pairs all succeed at once is the{' '}
            <code>log N</code> factor.
          </p>
        </>
      }
    >
      <Figure
        caption="Worst-case and mean distortion as the target dimension grows"
        note="Log–log axes; the dashed guide is proportional to 1/√k."
      >
        <Plot
          title="Distortion versus target dimension under a Gaussian random projection"
          description="Two decreasing curves, the maximum distortion lying above the mean distortion."
          xDomain={[4, 256]}
          yDomain={[0.004, 2]}
          xScale="log"
          yScale="log"
          xLabel="target dimension k"
          yLabel="distortion |‖Ax−Ay‖²/‖x−y‖² − 1|"
          height={270}
        >
          {(s) => (
            <>
              <LineMark
                points={K_GRID.map((kk) => [kk, 2.2 / Math.sqrt(kk)] as const)}
                scales={s}
                color="var(--color-series-4)"
                dashed
              />
              <LineMark
                points={curve.map((c) => [c.k, c.maxD] as const)}
                scales={s}
                color="var(--color-series-2)"
                width={2.25}
              />
              <LineMark
                points={curve.map((c) => [c.k, c.meanD] as const)}
                scales={s}
                color="var(--color-series-1)"
                width={2.25}
              />
              <RuleMark scales={s} x={k} label={`k = ${k}`} />
            </>
          )}
        </Plot>
        <Legend
          entries={[
            { label: 'maximum over pairs', color: 'var(--color-series-2)' },
            { label: 'mean over pairs', color: 'var(--color-series-1)' },
            { label: '∝ 1/√k', color: 'var(--color-series-4)', dashed: true },
          ]}
        />
      </Figure>

      <Figure
        caption={`Distribution of pairwise distortion at k = ${k}`}
        note="Every pair must land inside ε for the lemma's conclusion to hold; the right tail is what forces k up."
      >
        <Plot
          title={`Histogram of pairwise distortions at target dimension ${k}`}
          description="A right-skewed histogram of distortion values."
          xDomain={[0, Math.max(0.05, worst)]}
          yDomain={[0, Math.max(...bins.map((b) => b.density)) * 1.1 || 1]}
          xLabel="distortion"
          yLabel="density"
          height={200}
        >
          {(s) => <BarsMark bins={bins} scales={s} color="var(--color-series-3)" opacity={0.5} />}
        </Plot>
      </Figure>
    </ExperimentFrame>
  );
}
