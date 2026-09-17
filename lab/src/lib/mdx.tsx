/**
 * MDX compilation.
 *
 * Content is authored as MDX so that prose, LaTeX and interactive components
 * live in one file. Compilation happens during `next build` inside the RSC
 * render, which is what makes the fully static export possible: no MDX runtime
 * is shipped to the browser.
 */
import { compileMDX } from 'next-mdx-remote/rsc';
import type { ReactElement } from 'react';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import {
  Algorithm,
  Assumptions,
  Claim,
  Conjecture,
  Corollary,
  Definition,
  Derivation,
  Empirical,
  Heuristic,
  Intuition,
  KeyIdea,
  Lemma,
  Note,
  NotSaid,
  OpenProblem,
  Proposition,
  Step,
  Theorem,
  Warning,
} from '@/components/content/claim';
import { Details, Hint, Hints, Proof } from '@/components/content/disclosure';
import { ExperimentRef, MdxLink, ProblemRef, TopicRef } from '@/components/content/links';
import { ExperimentRunner } from '@/experiments/loader';
import { katexOptions } from './katex-options';

/** Components available to every MDX file, without an import. */
export const mdxComponents = {
  a: MdxLink,
  Claim,
  Theorem,
  Lemma,
  Proposition,
  Corollary,
  Definition,
  Heuristic,
  Empirical,
  Conjecture,
  OpenProblem,
  Assumptions,
  NotSaid,
  KeyIdea,
  Note,
  Warning,
  Intuition,
  Algorithm,
  Derivation,
  Step,
  Proof,
  Hints,
  Hint,
  Details,
  ProblemRef,
  ExperimentRef,
  TopicRef,
  Experiment: ExperimentRunner,
} as const;

export async function renderMdx(source: string): Promise<ReactElement> {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      parseFrontmatter: false, // frontmatter is stripped by the content loader
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [rehypeSlug, [rehypeKatex, katexOptions]],
      },
    },
  });
  return content;
}
