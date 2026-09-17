'use client';

import { useMemo, useState } from 'react';
import { BarsMark, Figure, Legend, LineMark, Plot, RuleMark } from '@/components/charts/plot';
import { ControlPanel, ReadOut, SeedControl, Slider } from '@/components/experiments/controls';
import { ExperimentFrame } from '@/components/experiments/frame';
import { cosineSimilarity, norm2 } from '@/lib/linalg';
import { createRng, gaussianVector } from '@/lib/rng';
import { histogram, mean, std } from '@/lib/stats';

/** Density of the cosine between two independent uniform directions in R^d. */
function cosineDensity(t: number, d: number): number {
  if (Math.abs(t) >= 1 || d < 2) return 0;
  // c_d (1 − t²)^{(d−3)/2}; the constant is fixed by numerical normalisation
  // below, which avoids overflow in Γ(d/2) for large d.
  return (1 - t * t) ** ((d - 3) / 2);
}

function normalisedCosineDensity(d: number, gridSize = 400): (t: number) => number {
  let mass = 0;
  const h = 2 / gridSize;
  for (let i = 0; i < gridSize; i++) mass += cosineDensity(-1 + (i + 0.5) * h, d) * h;
  return (t: number) => (mass > 0 ? cosineDensity(t, d) / mass : 0);
}

function unitVector(rng: ReturnType<typeof createRng>, d: number): Float64Array {
  const v = gaussianVector(rng, d);
  const nrm = norm2(v);
  for (let i = 0; i < d; i++) v[i] = v[i]! / nrm;
  return v;
}

/**
 * Two questions about embedding space at once: how nearly orthogonal random
 * directions are, and how much signal a retriever needs before the right
 * document beats the best of N distractors.
 */
export function EmbeddingGeometry() {
  const [logD, setLogD] = useState(7); // d = 128
  const [samples, setSamples] = useState(4000);
  const [nDistractors, setNDistractors] = useState(1000);
  const [seed, setSeed] = useState(1);
  const d = 2 ** logD;

  const { cosines, density, recallCurve, signalGrid } = useMemo(() => {
    const rng = createRng(seed * 2971215073 + d);
    const out = new Float64Array(samples);
    for (let t = 0; t < samples; t++) {
      out[t] = cosineSimilarity(unitVector(rng, d), unitVector(rng, d));
    }

    const dens = normalisedCosineDensity(d);
    const densCurve = Array.from({ length: 200 }, (_, i) => {
      const t = -0.6 + (1.2 * i) / 199;
      return [t, dens(t)] as const;
    });

    /*
     * Retrieval model. The relevant document embedding is e, and the query is
     *   q = α·e + √(1−α²)·ξ,  ξ ⟂ noise direction,
     * so cos(q, e) ≈ α. Distractors are independent uniform directions. A
     * retrieval succeeds when cos(q, e) exceeds the largest of N distractor
     * similarities. Only the maximum of the distractors matters, which is why
     * the curve is so sensitive to N.
     */
    const grid = Array.from({ length: 24 }, (_, i) => 0.02 + (i * 0.5) / 23);
    const trials = 260;
    const recall = grid.map((alpha) => {
      let hits = 0;
      for (let t = 0; t < trials; t++) {
        const e = unitVector(rng, d);
        const xi = unitVector(rng, d);
        const q = new Float64Array(d);
        for (let i = 0; i < d; i++) q[i] = alpha * e[i]! + Math.sqrt(1 - alpha * alpha) * xi[i]!;
        const target = cosineSimilarity(q, e);
        let worst = -1;
        for (let j = 0; j < nDistractors; j++) {
          const c = cosineSimilarity(q, unitVector(rng, d));
          if (c > worst) worst = c;
        }
        if (target > worst) hits++;
      }
      return [alpha, hits / trials] as const;
    });

    return { cosines: out, density: densCurve, recallCurve: recall, signalGrid: grid };
  }, [d, samples, nDistractors, seed]);

  const bins = useMemo(() => histogram(cosines, 48, -0.6, 0.6), [cosines]);
  const maxDensity = Math.max(...bins.map((b) => b.density), ...density.map((p) => p[1]));
  const predictedSd = 1 / Math.sqrt(d);

  const breakeven = recallCurve.find(([, r]) => r >= 0.9);

  return (
    <ExperimentFrame
      question={
        <>
          Retrieval ranks documents by cosine similarity. Two facts decide whether that works:
          random directions in <code>R^d</code> are nearly orthogonal (so the noise floor is low),
          and the retriever competes against the <em>maximum</em> of{' '}
          <code>{nDistractors.toLocaleString()}</code> distractor scores, not their average.
        </>
      }
      controls={
        <ControlPanel>
          <Slider
            label="Embedding dimension d"
            value={logD}
            min={2}
            max={11}
            onChange={setLogD}
            format={() => `2^${logD} = ${d}`}
          />
          <Slider
            label="Samples"
            value={samples}
            min={1000}
            max={12000}
            step={500}
            onChange={setSamples}
            format={(v) => v.toLocaleString()}
          />
          <Slider
            label="Distractors N"
            value={nDistractors}
            min={10}
            max={5000}
            step={10}
            onChange={setNDistractors}
            format={(v) => v.toLocaleString()}
            hint="Corpus size the retriever searches."
          />
          <SeedControl seed={seed} onReseed={setSeed} />
          <div className="border-t border-[var(--color-line)] pt-3">
            <ReadOut
              rows={[
                { label: 'mean cosine', value: mean(cosines).toFixed(4), note: 'predicted 0' },
                {
                  label: 'sd of cosine',
                  value: std(cosines).toFixed(4),
                  note: `predicted 1/√d = ${predictedSd.toFixed(4)}`,
                },
                {
                  label: 'signal for 90% top-1',
                  value: breakeven ? breakeven[0].toFixed(2) : '> 0.52',
                  note: 'alignment α needed',
                },
              ]}
            />
          </div>
        </ControlPanel>
      }
      interpretation={
        <>
          <p>
            The cosine between independent directions concentrates at 0 with standard deviation{' '}
            <code>1/√d</code>, matching the density <code>∝ (1 − t²)^((d−3)/2)</code>. At{' '}
            <code>d = 1024</code> a random pair sits within about <code>0.06</code> of orthogonal:
            almost all of the sphere is almost perpendicular to any fixed vector. That is the reason
            a dot-product retriever can separate anything at all.
          </p>
          <p>
            The second panel is the sobering one. Because the competition is against{' '}
            <code>max</code> of <code>N</code> distractor scores, which grows like{' '}
            <code>√(2 log N)/√d</code>, the required query–document alignment grows with the corpus.
            Multiply the corpus by 10 and the bar rises — slowly, like <code>√log N</code>, but it
            rises. This is the quantitative version of the folklore that retrieval gets harder as the
            index grows.
          </p>
          <p>
            Scope: the distractors here are <em>independent uniform</em> directions. Real corpora are
            nothing like that — embeddings are clustered and anisotropic, which makes near-duplicate
            distractors far more dangerous than this model suggests. Read the curve as a best case.
          </p>
        </>
      }
    >
      <Figure
        caption={`Cosine similarity between independent random directions in R^${d}`}
        note="The curve is the exact density of the cosine between two uniform directions."
      >
        <Plot
          title="Distribution of cosine similarity between random unit vectors"
          description="A narrow bell-shaped histogram centred on zero, narrowing as the dimension grows."
          xDomain={[-0.6, 0.6]}
          yDomain={[0, maxDensity * 1.1]}
          xLabel="cos(x, y)"
          yLabel="density"
          height={250}
        >
          {(s) => (
            <>
              <BarsMark bins={bins} scales={s} color="var(--color-series-1)" opacity={0.45} />
              <LineMark points={density} scales={s} color="var(--color-series-2)" width={2} />
              <RuleMark scales={s} x={0} label="orthogonal" />
            </>
          )}
        </Plot>
        <Legend
          entries={[
            { label: 'empirical', color: 'var(--color-series-1)' },
            { label: 'exact density', color: 'var(--color-series-2)' },
          ]}
        />
      </Figure>

      <Figure
        caption={`Top-1 retrieval accuracy against query–document alignment, N = ${nDistractors.toLocaleString()} distractors`}
        note="Alignment α is the cosine between the query and the relevant document; the rest of the query is noise."
      >
        <Plot
          title="Retrieval accuracy as a function of query-document alignment"
          description="An increasing curve rising from near zero to one as alignment grows."
          xDomain={[signalGrid[0]!, signalGrid[signalGrid.length - 1]!]}
          yDomain={[0, 1.02]}
          xLabel="alignment α = cos(q, e)"
          yLabel="P(relevant document ranked first)"
          height={230}
        >
          {(s) => (
            <>
              <LineMark points={recallCurve} scales={s} color="var(--color-series-3)" width={2.5} />
              <RuleMark scales={s} y={0.9} label="90%" />
            </>
          )}
        </Plot>
      </Figure>
    </ExperimentFrame>
  );
}
