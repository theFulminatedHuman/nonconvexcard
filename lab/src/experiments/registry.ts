/**
 * Experiment metadata.
 *
 * Kept free of React so that it can be imported from server components (the
 * search index, topic pages, the experiment listing). The components themselves
 * live in `src/experiments/components/` and are wired up in `loader.tsx`.
 */
import type { EstimatedTime, FieldSlug } from '@/lib/taxonomy';

export interface ExperimentMeta {
  id: string;
  title: string;
  /** One sentence: what the simulation shows. */
  summary: string;
  /**
   * The precise claim the experiment is evidence for, and the caveat. Every
   * experiment states this: a simulation illustrates a theorem, it never proves
   * one, and several of these experiments exist to show where a bound is loose.
   */
  question: string;
  field: FieldSlug;
  tags: string[];
  estimated_time: EstimatedTime;
  /** Topic ids that link to this experiment. */
  topics: string[];
}

export const EXPERIMENTS: ExperimentMeta[] = [
  {
    id: 'concentration-inequalities',
    title: 'Concentration inequalities, side by side',
    summary:
      'Empirical tail probabilities of a sample mean against the Markov, Chebyshev, Hoeffding and Bernstein bounds.',
    question:
      'How loose is each inequality, and when does Bernstein beat Hoeffding? Everything plotted is a valid upper bound; the gap to the empirical curve is the price of generality.',
    field: 'high-dimensional-probability',
    tags: ['concentration', 'hoeffding', 'bernstein', 'chebyshev', 'tail bounds'],
    topics: ['high-dimensional-probability/concentration-inequalities'],
    estimated_time: '15m',
  },
  {
    id: 'gaussian-norm',
    title: 'The norm of a Gaussian vector',
    summary:
      'The distribution of ‖X‖₂ for X ~ N(0, I_d) as the dimension grows, against the √d prediction.',
    question:
      'Does ‖X‖₂ concentrate near √d with fluctuations of order 1, independent of d? The simulation is consistent with the theorem; it is not a substitute for it.',
    field: 'high-dimensional-probability',
    tags: ['concentration', 'gaussian', 'high dimension', 'norm'],
    topics: ['high-dimensional-probability/concentration-of-the-norm'],
    estimated_time: '15m',
  },
  {
    id: 'random-projection-jl',
    title: 'Johnson–Lindenstrauss distortion',
    summary:
      'Pairwise distance distortion under a random Gaussian projection, as a function of the target dimension k.',
    question:
      'Is the worst observed distortion below ε once k ≳ ε⁻² log N? Watch what happens to the worst pair, not the average pair — the lemma is a statement about the maximum.',
    field: 'high-dimensional-probability',
    tags: ['johnson-lindenstrauss', 'random projection', 'dimension reduction', 'embeddings'],
    topics: ['high-dimensional-probability/johnson-lindenstrauss'],
    estimated_time: '30m',
  },
  {
    id: 'marchenko-pastur',
    title: 'Marchenko–Pastur law',
    summary:
      'Eigenvalues of a sample covariance matrix against the Marchenko–Pastur density for aspect ratio λ = p/n.',
    question:
      'The population covariance is the identity, so every eigenvalue "should" be 1. How far does the empirical spectrum spread, and how does that spread scale with p/n?',
    field: 'random-matrix-theory',
    tags: ['random matrices', 'spectrum', 'covariance', 'marchenko-pastur'],
    topics: ['random-matrix-theory/marchenko-pastur'],
    estimated_time: '30m',
  },
  {
    id: 'sgd-dynamics',
    title: 'Gradient descent, momentum and SGD',
    summary:
      'Trajectories and suboptimality curves for GD, Nesterov acceleration, heavy ball and SGD on a quadratic.',
    question:
      'Do the observed rates match the O((1 − μ/L)^t) and O(1/t) predictions, and what does gradient noise do to the floor of the error curve?',
    field: 'stochastic-optimization',
    tags: ['gradient descent', 'sgd', 'momentum', 'nesterov', 'convergence rate'],
    topics: [
      'optimization/gradient-descent-convergence',
      'stochastic-optimization/sgd-convergence',
    ],
    estimated_time: '30m',
  },
  {
    id: 'bias-variance',
    title: 'Bias–variance decomposition',
    summary:
      'Squared bias, variance and total risk of polynomial regression as model capacity grows.',
    question:
      'Does the measured risk equal bias² + variance + noise, and where does the minimum sit relative to the true degree?',
    field: 'learning-theory',
    tags: ['bias-variance', 'risk', 'regression', 'model selection'],
    topics: ['learning-theory/bias-variance-and-double-descent'],
    estimated_time: '30m',
  },
  {
    id: 'kernel-regression',
    title: 'Kernel ridge regression',
    summary:
      'The fitted function of kernel ridge regression as bandwidth and regularisation vary.',
    question:
      'How do the bandwidth σ and the ridge λ trade off, and what does the representer theorem mean geometrically for the fitted function?',
    field: 'machine-learning',
    tags: ['kernels', 'rkhs', 'ridge', 'representer theorem'],
    topics: ['machine-learning/kernel-methods-and-rkhs'],
    estimated_time: '30m',
  },
  {
    id: 'embedding-geometry',
    title: 'Embedding geometry and retrieval',
    summary:
      'Cosine similarity between random unit vectors in R^d, and the separation available to a retriever.',
    question:
      'Random directions in high dimension are nearly orthogonal. How much signal does a retriever need before the true document beats the best of N random distractors?',
    field: 'rag',
    tags: ['rag', 'embeddings', 'cosine similarity', 'near-orthogonality', 'retrieval'],
    topics: ['rag/embedding-geometry-and-similarity'],
    estimated_time: '30m',
  },
];

export function getExperiment(id: string): ExperimentMeta | undefined {
  return EXPERIMENTS.find((e) => e.id === id);
}

export function experimentsForTopic(topicId: string): ExperimentMeta[] {
  return EXPERIMENTS.filter((e) => e.topics.includes(topicId));
}
