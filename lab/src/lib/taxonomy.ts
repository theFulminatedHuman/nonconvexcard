/**
 * Single source of truth for the site's taxonomy.
 *
 * Every field, level, difficulty, problem type and claim kind used anywhere in
 * the application (content frontmatter, problem database, navigation, filters,
 * progress tracking) is defined here exactly once. Content files reference these
 * by slug; `src/lib/schema.ts` validates that they do.
 */

/* ------------------------------------------------------------------ fields */

export const FIELD_SLUGS = [
  'foundations',
  'probability',
  'high-dimensional-probability',
  'random-matrix-theory',
  'high-dimensional-statistics',
  'optimization',
  'advanced-optimization',
  'stochastic-optimization',
  'learning-theory',
  'machine-learning',
  'deep-learning',
  'deep-learning-theory',
  'llm',
  'finetuning',
  'quantization',
  'llm-ops',
  'ai-systems',
  'rag',
  'agents',
] as const;

export type FieldSlug = (typeof FIELD_SLUGS)[number];

/** Coarse grouping used by the sidebar. */
export type FieldGroup =
  | 'Foundations'
  | 'Probability'
  | 'Optimization'
  | 'Theory'
  | 'Models'
  | 'Systems';

export interface FieldMeta {
  readonly slug: FieldSlug;
  readonly title: string;
  /** Compact label for chips, filters and the sidebar. */
  readonly short: string;
  readonly group: FieldGroup;
  readonly blurb: string;
  /** Fields whose material this one assumes. Drives the mastery graph. */
  readonly requires: readonly FieldSlug[];
}

export const FIELDS: Readonly<Record<FieldSlug, FieldMeta>> = {
  foundations: {
    slug: 'foundations',
    title: 'Mathematical Foundations',
    short: 'Foundations',
    group: 'Foundations',
    blurb:
      'Linear algebra, matrix calculus and the analysis prerequisites every later section silently assumes.',
    requires: [],
  },
  probability: {
    slug: 'probability',
    title: 'Probability',
    short: 'Probability',
    group: 'Probability',
    blurb:
      'Probability spaces, expectation, conditional expectation and the four modes of convergence, stated precisely.',
    requires: ['foundations'],
  },
  'high-dimensional-probability': {
    slug: 'high-dimensional-probability',
    title: 'High-Dimensional Probability',
    short: 'High-Dim Probability',
    group: 'Probability',
    blurb:
      'Sub-Gaussian and sub-exponential tails, concentration inequalities, nets, and the geometry of random vectors in large dimension.',
    requires: ['probability'],
  },
  'random-matrix-theory': {
    slug: 'random-matrix-theory',
    title: 'Random Matrix Theory',
    short: 'Random Matrices',
    group: 'Probability',
    blurb:
      'Spectral norms of random matrices, singular value bounds, Wishart ensembles and the Marchenko–Pastur law.',
    requires: ['high-dimensional-probability'],
  },
  'high-dimensional-statistics': {
    slug: 'high-dimensional-statistics',
    title: 'High-Dimensional Statistics',
    short: 'High-Dim Statistics',
    group: 'Probability',
    blurb:
      'Estimation when the dimension grows with the sample size: covariance estimation, sparsity, the lasso and minimax rates.',
    requires: ['high-dimensional-probability', 'random-matrix-theory'],
  },
  optimization: {
    slug: 'optimization',
    title: 'Optimization',
    short: 'Optimization',
    group: 'Optimization',
    blurb:
      'Convex sets and functions, smoothness, strong convexity, and complete convergence proofs for gradient descent.',
    requires: ['foundations'],
  },
  'advanced-optimization': {
    slug: 'advanced-optimization',
    title: 'Advanced Optimization',
    short: 'Advanced Optimization',
    group: 'Optimization',
    blurb:
      'Proximal and projected methods, duality, acceleration, Newton and quasi-Newton methods, with Lyapunov analyses.',
    requires: ['optimization'],
  },
  'stochastic-optimization': {
    slug: 'stochastic-optimization',
    title: 'SGD & Optimization Dynamics',
    short: 'SGD',
    group: 'Optimization',
    blurb:
      'Stochastic approximation, step-size schedules, variance reduction, adaptive methods and their convergence guarantees.',
    requires: ['optimization', 'probability'],
  },
  'learning-theory': {
    slug: 'learning-theory',
    title: 'Statistical Learning Theory',
    short: 'Learning Theory',
    group: 'Theory',
    blurb:
      'Empirical risk minimisation, uniform convergence, VC dimension, Rademacher complexity and PAC guarantees.',
    requires: ['high-dimensional-probability'],
  },
  'machine-learning': {
    slug: 'machine-learning',
    title: 'Classical Machine Learning',
    short: 'Classical ML',
    group: 'Models',
    blurb:
      'Linear and logistic regression, nearest neighbours, kernels and RKHS, support vector machines, trees and ensembles.',
    requires: ['optimization', 'probability'],
  },
  'deep-learning': {
    slug: 'deep-learning',
    title: 'Deep Learning Mathematics',
    short: 'Deep Learning',
    group: 'Models',
    blurb:
      'Approximation theory, backpropagation as reverse-mode differentiation, convolutions, recurrence and transformers.',
    requires: ['machine-learning', 'optimization'],
  },
  'deep-learning-theory': {
    slug: 'deep-learning-theory',
    title: 'Why Does Deep Learning Optimization Work?',
    short: 'DL Theory',
    group: 'Theory',
    blurb:
      'What is actually proven about training deep networks — and, stated just as carefully, what is not.',
    requires: ['stochastic-optimization', 'deep-learning', 'learning-theory'],
  },
  llm: {
    slug: 'llm',
    title: 'Modern AI / LLM Mathematics',
    short: 'LLMs',
    group: 'Models',
    blurb:
      'Autoregressive factorisation, cross-entropy, attention at scale, preference optimisation and scaling laws.',
    requires: ['deep-learning'],
  },
  finetuning: {
    slug: 'finetuning',
    title: 'Fine-Tuning Mathematics',
    short: 'Fine-Tuning',
    group: 'Models',
    blurb:
      'Adapting a pretrained model: the low-rank hypothesis behind LoRA, the memory arithmetic that decides what fits on your GPU, and what is actually known about forgetting.',
    requires: ['llm', 'optimization'],
  },
  quantization: {
    slug: 'quantization',
    title: 'Quantization Mathematics',
    short: 'Quantization',
    group: 'Systems',
    blurb:
      'Number formats, rounding error and its propagation, the Hessian-weighted objective behind GPTQ, and why a handful of outlier features breaks naive INT8.',
    requires: ['deep-learning', 'foundations'],
  },
  'llm-ops': {
    slug: 'llm-ops',
    title: 'LLM Ops & Inference Mathematics',
    short: 'LLM Ops',
    group: 'Systems',
    blurb:
      'Serving arithmetic: arithmetic intensity and the roofline, KV-cache growth, batching and queueing, and the acceptance algebra of speculative decoding.',
    requires: ['llm'],
  },
  'ai-systems': {
    slug: 'ai-systems',
    title: 'AI System Design',
    short: 'AI Systems',
    group: 'Systems',
    blurb:
      'The mathematics of putting a model into production: Little\u2019s law and the utilisation wall, tail latency under fan-out, parallelism and collective-communication cost models, caching, load balancing, availability and cost per token.',
    requires: ['llm-ops', 'probability'],
  },
  rag: {
    slug: 'rag',
    title: 'RAG Mathematics',
    short: 'RAG',
    group: 'Models',
    blurb:
      'Embeddings, similarity geometry, approximate nearest-neighbour search, and retrieval as a latent-variable model.',
    requires: ['llm', 'high-dimensional-probability'],
  },
  agents: {
    slug: 'agents',
    title: 'Agentic AI Mathematics',
    short: 'Agents',
    group: 'Models',
    blurb:
      'Tool-using agents as decision processes: how per-step error compounds over a trajectory, the bandit view of tool selection, and what inference-time search buys.',
    requires: ['llm', 'rag'],
  },
};

export const FIELD_GROUPS: readonly FieldGroup[] = [
  'Foundations',
  'Probability',
  'Optimization',
  'Theory',
  'Models',
  'Systems',
];

export function fieldsInGroup(group: FieldGroup): FieldMeta[] {
  return FIELD_SLUGS.map((s) => FIELDS[s]).filter((f) => f.group === group);
}

export function isFieldSlug(value: string): value is FieldSlug {
  return (FIELD_SLUGS as readonly string[]).includes(value);
}

/* ------------------------------------------------------------------ levels */

export const LEVELS = [0, 1, 2, 3, 4] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABEL: Readonly<Record<Level, string>> = {
  0: 'Level 0 — Foundations',
  1: 'Level 1 — Core',
  2: 'Level 2 — Advanced',
  3: 'Level 3 — Graduate',
  4: 'Level 4 — Research',
};

export const LEVEL_SHORT: Readonly<Record<Level, string>> = {
  0: 'Foundations',
  1: 'Core',
  2: 'Advanced',
  3: 'Graduate',
  4: 'Research',
};

/* -------------------------------------------------------------- difficulty */

export const DIFFICULTIES = [
  'foundation',
  'beginner',
  'intermediate',
  'advanced',
  'graduate',
  'research',
  'olympiad',
] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABEL: Readonly<Record<Difficulty, string>> = {
  foundation: 'Foundation',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  graduate: 'Graduate',
  research: 'Research',
  olympiad: 'Olympiad / Extreme',
};

/** Ordinal weight, used for sorting and for the adaptive daily selector. */
export const DIFFICULTY_RANK: Readonly<Record<Difficulty, number>> = {
  foundation: 0,
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  graduate: 4,
  research: 5,
  olympiad: 6,
};

/* ------------------------------------------------------------ problem type */

export const PROBLEM_TYPES = ['proof', 'numerical', 'coding'] as const;
export type ProblemType = (typeof PROBLEM_TYPES)[number];

export const PROBLEM_TYPE_LABEL: Readonly<Record<ProblemType, string>> = {
  proof: 'Proof',
  numerical: 'Numerical',
  coding: 'Coding',
};

/* ---------------------------------------------------------- estimated time */

export const ESTIMATED_TIMES = ['5m', '15m', '30m', '1h', '3h', '1d', 'research'] as const;
export type EstimatedTime = (typeof ESTIMATED_TIMES)[number];

export const TIME_LABEL: Readonly<Record<EstimatedTime, string>> = {
  '5m': '5 min',
  '15m': '15 min',
  '30m': '30 min',
  '1h': '1 hour',
  '3h': '3 hours',
  '1d': '1 day',
  research: 'Research',
};

/** Minutes, for aggregating study time. `research` is deliberately open-ended. */
export const TIME_MINUTES: Readonly<Record<EstimatedTime, number>> = {
  '5m': 5,
  '15m': 15,
  '30m': 30,
  '1h': 60,
  '3h': 180,
  '1d': 480,
  research: 480,
};

/* ------------------------------------------------------------- claim kinds */

/**
 * The epistemic status of a displayed claim. Keeping these distinct is a hard
 * editorial rule of this site: an empirical regularity is never rendered with
 * the same affordance as a theorem.
 */
export const CLAIM_KINDS = [
  'definition',
  'theorem',
  'lemma',
  'proposition',
  'corollary',
  'heuristic',
  'empirical',
  'conjecture',
  'open-problem',
] as const;

export type ClaimKind = (typeof CLAIM_KINDS)[number];

export const CLAIM_LABEL: Readonly<Record<ClaimKind, string>> = {
  definition: 'Definition',
  theorem: 'Theorem',
  lemma: 'Lemma',
  proposition: 'Proposition',
  corollary: 'Corollary',
  heuristic: 'Heuristic',
  empirical: 'Empirical observation',
  conjecture: 'Conjecture',
  'open-problem': 'Open problem',
};

/** Claims that carry a proof obligation; the proof library indexes exactly these. */
export const PROVABLE_KINDS: readonly ClaimKind[] = [
  'theorem',
  'lemma',
  'proposition',
  'corollary',
];
