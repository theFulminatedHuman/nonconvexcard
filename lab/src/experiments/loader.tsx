'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

/**
 * Lazily-loaded experiment components.
 *
 * Each simulation is code-split: a reader who opens one topic page should not
 * download the random-matrix routines for another. The skeleton below reserves
 * the plot's height so the page does not jump when the chunk arrives.
 */
const Skeleton = () => (
  <div
    className="h-64 animate-pulse rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-elevated)]"
    aria-busy="true"
    aria-label="Loading experiment"
  />
);

const REGISTRY: Record<string, ComponentType> = {
  'concentration-inequalities': dynamic(
    () => import('./components/concentration-inequalities').then((m) => m.ConcentrationInequalities),
    { loading: Skeleton, ssr: false },
  ),
  'gaussian-norm': dynamic(() => import('./components/gaussian-norm').then((m) => m.GaussianNorm), {
    loading: Skeleton,
    ssr: false,
  }),
  'random-projection-jl': dynamic(
    () => import('./components/random-projection-jl').then((m) => m.RandomProjectionJL),
    { loading: Skeleton, ssr: false },
  ),
  'marchenko-pastur': dynamic(
    () => import('./components/marchenko-pastur').then((m) => m.MarchenkoPastur),
    { loading: Skeleton, ssr: false },
  ),
  'sgd-dynamics': dynamic(() => import('./components/sgd-dynamics').then((m) => m.SgdDynamics), {
    loading: Skeleton,
    ssr: false,
  }),
  'bias-variance': dynamic(() => import('./components/bias-variance').then((m) => m.BiasVariance), {
    loading: Skeleton,
    ssr: false,
  }),
  'kernel-regression': dynamic(
    () => import('./components/kernel-regression').then((m) => m.KernelRegression),
    { loading: Skeleton, ssr: false },
  ),
  'embedding-geometry': dynamic(
    () => import('./components/embedding-geometry').then((m) => m.EmbeddingGeometry),
    { loading: Skeleton, ssr: false },
  ),
};

export function ExperimentRunner({ id }: { id: string }) {
  const Component = REGISTRY[id];
  if (!Component) {
    return (
      <p className="rounded border border-dashed border-[var(--color-line-strong)] px-4 py-6 text-sm text-[var(--color-ink-faint)]">
        No experiment is registered under the id <code>{id}</code>.
      </p>
    );
  }
  return <Component />;
}
