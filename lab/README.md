# nonconvexcard

The mathematical foundations of modern AI — from probability to optimization, learning theory, deep
learning and LLM systems — as an interactive mathematical laboratory rather than a course.

It is a statically exported Next.js application: 323 pre-rendered pages, no server, no database, no
account, no telemetry. Progress lives in the reader's own browser.

```
npm install && npm run dev      # http://localhost:3000
```

---

## 1. What this is

Every topic follows the same twelve movements — intuition, definitions, formulation, theorems,
proofs, derivations, examples, a numerical experiment, code, problems, papers, open research — so a
reader always knows where the proof is and, more importantly, **whether there is one**.

The editorial rule the whole architecture exists to enforce: *a claim is never presented in a
stronger epistemic grammar than it has earned.* `theorem`, `lemma`, `proposition`, `corollary`,
`definition`, `heuristic`, `empirical`, `conjecture` and `open-problem` are distinct kinds in the
content schema, are rendered with visibly different affordances, and are filterable in the proof
library — so the claim that the site distinguishes them is one a reader can check rather than take
on trust.

## 2. Architecture

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 15 App Router, `output: 'export'` | Fully static HTML; deployable to GitHub Pages, S3 or any file server. |
| Language | TypeScript, `strict` + `noUncheckedIndexedAccess` | Content is data; the type system is the first validator. |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) | One token file drives light/dark; no runtime CSS-in-JS. |
| Prose | MDX via `next-mdx-remote/rsc`, compiled at build time | Interactive components inside mathematical prose, with **no MDX runtime shipped**. |
| Problem prose | `unified` Markdown pipeline (`src/lib/markdown.ts`) | Problem text comes from YAML and must not be subject to JSX parsing — a set written `{convex, smooth}` in running text is prose, not a JavaScript expression. |
| Mathematics | KaTeX (`remark-math` + `rehype-katex`) | Rendered at build time; no client-side typesetting pass. |
| Validation | zod schemas over every content file | Malformed frontmatter fails `next build` with a path-qualified error instead of rendering a broken page. |
| Charts | Hand-rolled SVG (`src/components/charts/`) | ~400 lines against ~300 kB of d3/plotly, and full control of theming. |
| Linear algebra | Hand-rolled dense routines (`src/lib/linalg.ts`) | Cyclic Jacobi eigenvalues, singular values via the smaller Gram matrix, Cholesky solves — enough for the experiments, unit tested, no dependency. |
| Randomness | `sfc32` seeded through `splitmix32` (`src/lib/rng.ts`) | Every experiment is reproducible: same seed, same figure, any machine. |
| Search | Static JSON index + conjunctive linear scan | A few kB of code beats shipping a full-text engine at this corpus size, and ranks predictably. |
| Progress | `useSyncExternalStore` over `localStorage` | Local-first by necessity (static export) and by choice (no account, nothing to leak). |

### Content is data, not code

Nothing about a topic, problem, paper or claim is hardcoded in a React component. `content/` is the
database; `src/lib/content.ts` is the loader; every counter on the site — including the home page
headline numbers — is derived from it at build time. Adding 5,000 problems requires no code change.

The loader also enforces referential integrity at build time:

- a topic's directory must match its frontmatter `field`;
- every `prerequisites` entry must resolve to an existing topic;
- every `<ProblemRef>`, `<TopicRef>` and `<ExperimentRef>` must resolve;
- problem ids must be globally unique;
- every populated field must appear in the learning path.

A broken cross-reference fails the build. That is the mechanism that keeps a site of this size honest.

## 3. File structure

```
lab/
├── content/                        ← the database
│   ├── topics/<field>/<slug>.mdx   ← 42 topics, YAML frontmatter + MDX body
│   ├── problems/*.yaml             ← 213 problems, grouped by area
│   └── papers/<id>.mdx             ← 29 paper breakdowns
├── public/.nojekyll                ← keeps GitHub Pages from eating /_next
├── src/
│   ├── app/                        ← routes (App Router)
│   │   ├── page.tsx                ← home; every counter derived from content
│   │   ├── dashboard, learn, daily
│   │   ├── topics/, topics/[field]/, topics/[field]/[slug]/
│   │   ├── problems/, problems/[id]/, abyss/
│   │   ├── proofs/, experiments/, experiments/[id]/
│   │   ├── papers/, papers/[id]/
│   │   ├── graph/, progress/, search/
│   │   └── search-index.json/route.ts   ← emits the static search corpus
│   ├── components/
│   │   ├── content/     claim, disclosure (Proof/Hints), links, toc, references, markdown
│   │   ├── charts/      scales + Plot/Line/Area/Bars/Points/Rule/Legend/Figure
│   │   ├── experiments/ frame, controls (Slider/Select/Toggle/Seed/ReadOut)
│   │   ├── problems/    row, browser, filters
│   │   ├── papers/, proofs/, progress/, graph/, learn/, daily/, dashboard/
│   │   ├── layout/      app-shell, sidebar, controls, theme-script
│   │   ├── search/      command-palette, search-view
│   │   └── ui/          primitives, icons
│   ├── experiments/     registry.ts (metadata) + components/ + loader.tsx (code-split)
│   ├── hooks/           use-local-store, use-progress, use-theme
│   └── lib/             taxonomy, schema, content, problem-index, learning-path, mdx,
│                        markdown, katex-options, search, search-index, progress, daily,
│                        dates, rng, stats, linalg, nav, site, base-path
└── next.config.mjs, tsconfig.json, vitest.config.ts
```

`src/lib/taxonomy.ts` is the single source of truth: fields, levels, difficulties, problem types,
time estimates and claim kinds are each defined exactly once and validated everywhere.

## 4. Features

**Reading**
- 42 topic pages with the twelve-movement structure, sticky table of contents, statement index,
  prerequisite rail, prev/next, and per-page reference lists.
- Proofs collapsed by default — reading a proof before attempting it is the fastest way to feel like
  you understand something you cannot reproduce.
- Research mode strips intuition-first scaffolding site-wide (a document attribute, so CSS handles it
  without a re-render).
- Light/dark/system themes with no flash of the wrong theme (pre-paint inline script).

**Practice**
- 213 problems — proof, numerical and coding — filterable by field, difficulty, type, status and free
  text, sorted by difficulty, time or title.
- Progressive hint ladders: hints reveal strictly in order, so you cannot skip to the last nudge.
- The Abyss: the hardest problems, including genuinely open ones, marked as open.
- 8 interactive experiments, each code-split, seeded and reproducible, each stating what the figure
  *is not* evidence for.
- **An in-browser judge**: 14 coding problems ship starter code and test cases, and run Python in
  the reader's own browser through Pyodide in a Web Worker — no server, nothing uploaded, still a
  static export. Passing every test marks the problem solved. A non-terminating submission is killed
  on a time limit, which is what the worker is for.

**Reference**
- Proof library over every stated result, filterable by epistemic status and by whether a complete
  proof is actually given.
- 29 paper breakdowns indexed by the mathematics they use, with prerequisite topics and lineage.
- ⌘K command palette and a full search page over one static index.

**Progress** (all local to the browser)
- GitHub-style contribution heatmap with per-day detail.
- Streaks, totals, difficulty breakdown and per-field coverage.
- Mastery graph: the prerequisite DAG laid out left-to-right, showing what your progress has opened
  up. Nothing is ever actually locked — a prerequisite is information, not a gate.
- Daily Mathematics: four problems (one below level, two at level in different fields, one above),
  a deterministic function of the date, so it cannot be rerolled.
- Spaced review at 3, 7, 21 and 60 days.
- Export / import / reset, because `localStorage` is the only backup that exists.

## 5. Content

| | Count |
| --- | --- |
| Fields | 14 |
| Topics | 42 |
| Stated results | 262 |
| — carrying a proof obligation | 214 |
| — proved in full on the page | 172 (80%) |
| Problems | 213 — 168 proof, 23 numerical, 22 coding |
| — in The Abyss | 31 |
| — genuinely open, labelled as open | 6 |
| Papers | 29 |
| Experiments | 8 |

Difficulty distribution: 7 foundation · 33 beginner · 81 intermediate · 62 advanced · 21 graduate ·
6 research · 3 olympiad.

The six `research` problems are open problems. They have no solution, the page says so, and the
"Solution" section is replaced by "What is known" — an account of what has been proved, what has only
been measured, and exactly where the argument stops.

Fields: foundations · probability · high-dimensional probability · random matrix theory ·
high-dimensional statistics · optimization · advanced optimization · stochastic optimization ·
learning theory · classical ML · deep learning · deep learning theory · LLMs · RAG.

**On sources.** The exposition, examples and problems are original. Standard references — Vershynin's
*High-Dimensional Probability*, Boyd & Vandenberghe, Shalev-Shwartz & Ben-David, Wainwright, and the
cited papers — are named where a result is standard, and none is reproduced. Where a proof is
omitted the page says so and points at a source. Where nothing is known, the page says that.

## 6. Running locally

```bash
cd lab
npm install
npm run dev        # development server
npm run typecheck  # tsc --noEmit, strict
npm test           # vitest — math utilities, scales, search, progress, daily selection
npm run build      # static export into lab/out/
npx serve out      # preview the export exactly as it will be served
```

Node 20+ is required (Node 22 is what CI uses).

## 7. Deploying to GitHub Pages

The export is plain files; `public/.nojekyll` stops Pages stripping `/_next`.

`.github/workflows/deploy-lab.yml` builds `lab/` and publishes it. It is **manual on purpose**
(`workflow_dispatch`): this repository currently serves a Jekyll site from its root, and switching
Pages to this application should be a deliberate act.

To deploy:

1. **Settings → Pages → Source → GitHub Actions.**
2. **Actions → "Deploy lab to GitHub Pages" → Run workflow.**

The workflow computes `basePath` itself: a repository named `<owner>.github.io` is served from the
root and gets no prefix; anything else is a project page served from
`https://<owner>.github.io/<repo>/` and gets `/<repo>`. To deploy on every push instead, add a
`push:` trigger — the comment at the top of the workflow gives the exact block.

For any other host, `npm run build` and serve `lab/out/`. Set `NEXT_PUBLIC_BASE_PATH` if the site is
not served from the domain root.

## 8. Adding content

See **[docs/AUTHORING.md](docs/AUTHORING.md)** for the full recipes: a new topic, a new theorem, a
new problem, a new experiment, a new paper. The short version is that topics, problems and papers
need no code at all, and an experiment needs one registry entry plus one component.

## 9. Roadmap

Ordered by what would most improve the site, not by ease.

1. **Depth before breadth.** Several fields have two or three topics where they need eight —
   measure-theoretic probability, information theory, online learning and bandits, optimal
   transport, mean-field analyses of training.
2. **More complete proofs.** The proof library reports the exact ratio of stated results to proved
   ones. Raising it is the single highest-value content work.
3. **Executable code cells.** The coding problems currently ship reference solutions as text. A
   Pyodide-backed cell would let a reader run and modify them without leaving the page, at the cost
   of a large lazy-loaded chunk — worth it only on coding problems.
4. **Experiment breadth.** Attention-pattern geometry, double descent swept end to end, proximal
   methods on a non-smooth objective, LSH recall curves.
5. **Per-problem notes.** A local scratchpad attached to each problem, exported with progress.
6. **Cross-device sync, opt-in.** Deliberately absent today. If it ever arrives it must stay
   opt-in and end-to-end encrypted, or the "nothing leaves your browser" claim stops being true.
7. **Spaced repetition that models memory.** The current 3/7/21/60 schedule is honest about being a
   fixed Leitner ladder. A real scheduler needs per-item difficulty and recall feedback.
8. **Content linting.** A CI check for the editorial rules that the schema cannot express: a claim of
   kind `theorem` whose body contains no `<Assumptions>`, a page asserting convergence without naming
   its hypotheses.
9. **Accessibility audit.** KaTeX emits MathML alongside HTML, but the charts need proper
   descriptions and the heatmap needs a keyboard-navigable summary table.
10. **Printable topic pages.** A print stylesheet that expands folded proofs and drops the chrome, so
    a topic can be read on paper.
