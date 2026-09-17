# Authoring guide

Everything under `content/` is validated at build time by the zod schemas in `src/lib/schema.ts`. A
mistake fails `next build` with the offending file path and the offending key — so the fastest way to
learn the format is to write something wrong and read the error.

Taxonomy values (`field`, `level`, `difficulty`, `type`, `estimated_time`, claim `kind`) come from
`src/lib/taxonomy.ts` and nowhere else. If you need a new field, add it there first.

---

## The editorial rules

These are not style preferences; they are the reason the site exists.

1. **Never invent a theorem, a citation, a constant or an attribution.** If you are not certain a
   result is standard, either prove it on the page or do not state it.
2. **Never claim a proof exists when it does not.** `proved: true` in a claim's frontmatter means the
   page contains a complete argument. A sketch is `<Proof sketch>` and `proved: false`.
3. **Distinguish the kinds.** `theorem` / `lemma` / `proposition` / `corollary` carry proof
   obligations. `definition` is a convention. `heuristic` is a useful non-proof. `empirical` is a
   reproduced measurement without an explanation. `conjecture` is believed and unproved.
   `open-problem` means nobody knows.
4. **Never write "SGD converges".** Write "under assumptions A, B and C, SGD satisfies X", and state
   A, B and C — in an `<Assumptions>` block, in the same visual unit as the claim.
5. **Say what is not said.** `<NotSaid>` exists so a theorem's limits are as visible as its
   conclusion.
6. **Reference, never reproduce.** Name the source for a standard result; do not copy its text,
   its proof or its exercises.
7. **A simulation is not a proof.** Every experiment states the claim it illustrates and the caveat.

---

## Add a topic

Create `content/topics/<field>/<slug>.mdx`. The directory **must** equal the frontmatter `field`.

```mdx
---
title: Concentration of the norm
summary: Why ‖X‖₂ for a standard Gaussian in R^d sits within O(1) of √d, and what that buys.
field: high-dimensional-probability
level: 2                     # 0 Foundations … 4 Research
order: 30                    # ordering within (field, level)
prerequisites:
  - high-dimensional-probability/sub-gaussian-random-variables
tags: [concentration, gaussian, high dimension]
estimated_time: 1h           # 5m | 15m | 30m | 1h | 3h | 1d | research
claims:
  - id: norm-concentration   # becomes the #anchor on the page
    kind: theorem            # see taxonomy.ts for the nine kinds
    title: Concentration of the Euclidean norm
    summary: For X ~ N(0, I_d), ‖X‖₂ − √d is sub-Gaussian with an absolute constant.
    proved: true             # true only if a COMPLETE proof is on the page
    tags: [concentration]
experiments: [gaussian-norm] # ids from src/experiments/registry.ts
papers: [johnson-lindenstrauss-paper-id]
references:
  - key: vershynin-hdp
    title: High-Dimensional Probability
    authors: R. Vershynin
    year: 2018
    kind: book
    url: https://www.math.uci.edu/~rvershyn/papers/HDP-book/HDP-book.html
    note: Theorem 3.1.1 — the statement here is proved independently below.
draft: false                 # true hides the page from navigation and the build
---

Body in MDX. `##` and `###` headings become the table of contents automatically.
```

Available inside any topic without importing:

| Component | Use |
| --- | --- |
| `<Theorem id title>`, `<Lemma>`, `<Proposition>`, `<Corollary>`, `<Definition>` | Claims with proof obligations. `id` must match a `claims[].id`. |
| `<Heuristic>`, `<Empirical>`, `<Conjecture>`, `<OpenProblem>` | Claims without them. |
| `<Assumptions>` | The hypotheses, in the same unit as the claim. |
| `<NotSaid>` | What the result does *not* give you. |
| `<Proof>`, `<Proof sketch>` | Collapsed by default. `sketch` adds an explicit incompleteness note. |
| `<Derivation>` / `<Step why="...">` | Step-by-step, each step carrying its justification. |
| `<Algorithm title>` | Numbered pseudocode. |
| `<KeyIdea>`, `<Note>`, `<Warning>`, `<Intuition>` | `<Intuition>` is hidden in research mode. |
| `<Hints><Hint>…</Hint></Hints>` | Sequential reveal. |
| `<Details summary>` | Long asides and alternative proofs. |
| `<Experiment id="…" />` | Embeds a registered experiment inline. |
| `<ProblemRef id>`, `<TopicRef id>`, `<ExperimentRef id>` | Cross-references. **Validated at build time.** |

LaTeX is `$inline$` and `$$display$$`. Macros (`\R \E \P \Var \Cov \argmin \norm \ip \eps \Ncal
\prox \one` …) are defined once in `src/lib/katex-options.ts` and work in both pipelines.

## Add a theorem to an existing topic

Two edits, and both are required — the build does not enforce the pairing, but the proof library
reads the frontmatter and the page renders the body:

1. Append to `claims:` in the frontmatter (`id`, `kind`, `title`, `summary`, `proved`).
2. Add `<Theorem id="that-same-id" title="…">…</Theorem>` in the body, with `<Assumptions>` and, if
   `proved: true`, a complete `<Proof>`.

## Add a problem

Append to the appropriate `content/problems/*.yaml`. Files are grouped by area purely for the
author's convenience; the loader concatenates them and requires globally unique ids.

```yaml
defaults:                    # optional; merged into every problem in the file
  field: high-dimensional-probability

problems:
  - id: hdp-mgf-bound        # globally unique, kebab-case
    title: A sub-Gaussian moment generating function bound
    topic: high-dimensional-probability/sub-gaussian-random-variables   # must resolve
    difficulty: advanced     # foundation | beginner | intermediate | advanced | graduate | research | olympiad
    type: proof              # proof | numerical | coding
    estimated_time: 1h
    abyss: false             # true puts it in The Abyss
    also: [probability]      # additional fields for filtering
    tags: [sub-gaussian, mgf]
    statement: |
      Markdown + LaTeX. Braces in running text are safe here: problem prose goes
      through the Markdown pipeline, not MDX.
    hints:
      - |
        Revealed first.
      - |
        Revealed second, and only after the first.
    solution: |
      A complete worked solution. This is the page's answer key: it must be right.
```

Because the statement and solution are Markdown rather than MDX, the claim components above are
**not** available in a problem — use bold headings (`**Step 1.**`) instead.

## Add an experiment

Two steps, one of which is code.

1. **Metadata** — append to `EXPERIMENTS` in `src/experiments/registry.ts`:

```ts
{
  id: 'marchenko-pastur',
  title: 'The Marchenko–Pastur law',
  summary: 'Eigenvalue histogram of a sample covariance matrix against the limiting density.',
  question:
    'Does the empirical spectrum match the MP density at finite n, and how fast? The simulation is consistent with the theorem; it is not a substitute for it.',
  field: 'random-matrix-theory',
  tags: ['random matrices', 'spectrum'],
  topics: ['random-matrix-theory/marchenko-pastur'],   // must resolve
  estimated_time: '30m',
}
```

2. **Component** — `src/experiments/components/<id>.tsx`, and register it in
   `src/experiments/loader.tsx` so it is code-split:

```tsx
'use client';
export function MarchenkoPastur() {
  const [seed, setSeed] = useState(1);
  const data = useMemo(() => simulate(createRng(seed), /* … */), [seed /* , … */]);
  return (
    <ExperimentFrame question={…} controls={<ControlPanel>…</ControlPanel>} interpretation={…}>
      <Figure caption="…"><Plot …>…</Plot></Figure>
    </ExperimentFrame>
  );
}
```

**Always seed through `createRng`.** An experiment that reshuffles on reload cannot be quoted, and
the site's claim that every figure is reproducible has to be true.

Then add the id to `experiments:` in any topic frontmatter that should link to it.

## Add a paper

Create `content/papers/<id>.mdx`:

```mdx
---
title: Attention Is All You Need
authors: A. Vaswani et al.
year: 2017
venue: NeurIPS
arxiv: '1706.03762'          # quote it — YAML reads 1706.03762 as a number
url: https://arxiv.org/abs/1706.03762
field: deep-learning
also: [llm]
tags: [attention, transformer]
problem: One sentence on the problem the paper attacks.
contribution: One sentence on what it actually contributes.
prerequisites: [deep-learning/transformers]   # topic ids; must resolve
descendants: [bert, gpt3]                      # paper ids; must resolve
related: [word2vec]
---

The breakdown. Say what was proved, what was measured, and what remains open — in those terms.
```

`descendants` builds the lineage rail on the paper page, and `prerequisites` is what makes
"which papers need this mathematics" a one-click question from a topic page.

## Add a field

1. Add the slug to `FIELD_SLUGS` and a `FieldMeta` entry (with `requires`) in `src/lib/taxonomy.ts`.
2. Add a stage to `STAGES` in `src/lib/learning-path.ts`, or add the field to an existing one — the
   build fails if a populated field is missing from the learning path.
3. Create `content/topics/<field>/` and write at least one topic.

## Before committing

```bash
npm run typecheck && npm test && npm run build
```

The build is the real check: it validates every content file, resolves every cross-reference, and
regenerates the search index from the same module graph as the pages, so the index cannot drift from
what it points at.
