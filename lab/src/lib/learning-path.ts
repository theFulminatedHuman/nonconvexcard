/**
 * The recommended order through the material.
 *
 * Stages are editorial — the blurb and the stated outcome are judgements about
 * what a stage buys you — but their *contents* are derived from the content
 * tree, so a new topic appears in the path automatically. The consistency check
 * at the bottom fails the build if a populated field is missing from the path,
 * which is the failure mode that would otherwise go unnoticed.
 */
import { allProblems, allTopics, populatedFields } from './content';
import { TIME_MINUTES, type FieldSlug } from './taxonomy';
import type { TrackStage, TrackTopic } from '@/components/learn/track';

interface StageSpec {
  id: string;
  title: string;
  blurb: string;
  outcome: string;
  fields: FieldSlug[];
}

const STAGES: StageSpec[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    blurb:
      'The linear algebra, matrix calculus and analysis that every later page assumes without saying so. Most of the difficulty people attribute to machine learning theory is actually unfamiliarity here.',
    outcome:
      'differentiate matrix expressions without index gymnastics, and read a spectral argument without stopping.',
    fields: ['foundations'],
  },
  {
    id: 'probability',
    title: 'Probability, stated precisely',
    blurb:
      'Measure-theoretic probability at working depth: what a random variable is, what conditioning means, and which mode of convergence a theorem is actually asserting.',
    outcome:
      'tell almost-sure from in-probability convergence, and say what a conditional expectation is without waving at "averaging".',
    fields: ['probability'],
  },
  {
    id: 'high-dimensional-probability',
    title: 'High-dimensional probability',
    blurb:
      'The technical core of modern learning theory: sub-Gaussian tails, concentration inequalities, covering numbers and the geometry of high dimension. Nearly every guarantee later in the path bottoms out here.',
    outcome:
      'prove a concentration bound from scratch and read "with probability at least 1 − δ" as a quantitative statement rather than a ritual.',
    fields: ['high-dimensional-probability'],
  },
  {
    id: 'random-matrices',
    title: 'Random matrices and high-dimensional statistics',
    blurb:
      'What happens to spectra and estimators when the dimension grows with the sample size — the regime every modern model lives in.',
    outcome:
      'predict the spectrum of a sample covariance matrix, and say why an estimator that is consistent for fixed d can fail when d ≍ n.',
    fields: ['random-matrix-theory', 'high-dimensional-statistics'],
  },
  {
    id: 'optimization',
    title: 'Convex optimization',
    blurb:
      'Convexity, smoothness and strong convexity, then complete convergence proofs: gradient descent, projections and proximal steps, duality, acceleration and second-order methods.',
    outcome:
      'derive a rate rather than quote one, and recognise which assumption a published rate is buying its constant from.',
    fields: ['optimization', 'advanced-optimization'],
  },
  {
    id: 'stochastic',
    title: 'Stochastic optimization',
    blurb:
      'SGD and its descendants: step-size schedules, variance, the difference between convergence of the iterates and of the averages, and what adaptive methods do and do not guarantee.',
    outcome:
      'state the assumptions under which SGD converges, and explain precisely why "Adam converges" is not a theorem in the form it is usually quoted.',
    fields: ['stochastic-optimization'],
  },
  {
    id: 'learning-theory',
    title: 'Statistical learning theory',
    blurb:
      'Empirical risk minimisation, uniform convergence, VC dimension, Rademacher complexity — and where the classical picture stops describing what deep networks do.',
    outcome:
      'derive a generalisation bound, and say exactly which of its assumptions modern practice violates.',
    fields: ['learning-theory'],
  },
  {
    id: 'classical-ml',
    title: 'Classical machine learning',
    blurb:
      'The models whose mathematics is fully understood: linear and ridge regression, logistic regression, kernels and RKHS, SVMs, nearest neighbours, trees and ensembles.',
    outcome:
      'derive each method from an objective rather than recall its formula, and know which ones have closed-form solutions and why.',
    fields: ['machine-learning'],
  },
  {
    id: 'deep-learning',
    title: 'Deep learning mathematics',
    blurb:
      'Approximation theory, backpropagation as reverse-mode differentiation, convolution and normalisation, attention — followed by an honest account of what is proven about why any of it trains.',
    outcome:
      'derive backpropagation and attention from first principles, and separate the theorems about deep learning from the folklore.',
    fields: ['deep-learning', 'deep-learning-theory'],
  },
  {
    id: 'modern-ai',
    title: 'Modern AI: language models and retrieval',
    blurb:
      'Autoregressive factorisation and cross-entropy, preference optimisation, scaling laws, and the geometry that makes dense retrieval work — and sometimes fail.',
    outcome:
      'derive the DPO objective, read a scaling-law fit critically, and compute a retrieval pipeline’s recall ceiling before blaming the generator.',
    fields: ['llm', 'rag'],
  },
];

export function buildLearningPath(): TrackStage[] {
  const topics = allTopics();
  const problems = allProblems();

  const covered = new Set(STAGES.flatMap((s) => s.fields));
  for (const field of populatedFields()) {
    if (!covered.has(field)) {
      throw new Error(
        `Field "${field}" has published topics but does not appear in any learning-path stage (src/lib/learning-path.ts).`,
      );
    }
  }

  return STAGES.map((spec) => ({
    id: spec.id,
    title: spec.title,
    blurb: spec.blurb,
    outcome: spec.outcome,
    topics: spec.fields.flatMap((field) =>
      topics
        .filter((t) => t.field === field)
        .map<TrackTopic>((t) => ({
          id: t.id,
          title: t.frontmatter.title,
          summary: t.frontmatter.summary,
          field: t.field,
          level: t.frontmatter.level,
          minutes: Math.max(t.readingMinutes, TIME_MINUTES[t.frontmatter.estimated_time] / 4),
          problems: problems.filter((p) => p.topic === t.id).length,
        })),
    ),
  })).filter((s) => s.topics.length > 0);
}
