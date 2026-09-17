import type { Metadata } from 'next';
import { DependencyGraph, type GraphNode } from '@/components/graph/dependency-graph';
import { PageHeader } from '@/components/ui/primitives';
import { allProblems, allTopics } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Mastery graph',
  description:
    'The prerequisite dependency graph over every topic, with what you have studied and what is ready next.',
};

export default function GraphPage() {
  const problems = allProblems();
  const nodes: GraphNode[] = allTopics().map((t) => ({
    id: t.id,
    title: t.frontmatter.title,
    field: t.field,
    level: t.frontmatter.level,
    prerequisites: t.frontmatter.prerequisites,
    problems: problems.filter((p) => p.topic === t.id).length,
  }));

  const edges = nodes.reduce((a, n) => a + n.prerequisites.length, 0);

  return (
    <div className="mx-auto max-w-[84rem] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Reference"
        title="Mastery graph"
        lead={`${nodes.length} topics and ${edges} declared prerequisite edges, laid out left to right so
          that every topic sits to the right of everything it assumes. Nodes you have marked studied
          turn green; nodes whose prerequisites are all met are highlighted as ready.`}
      >
        <p className="max-w-3xl text-xs leading-relaxed text-[var(--color-ink-faint)]">
          Nothing here is locked in the sense of being unavailable: every link works whatever your
          progress. A prerequisite is a claim about what a page assumes you can already do, which is
          information you can act on — not a gate.
        </p>
      </PageHeader>

      <DependencyGraph nodes={nodes} />
    </div>
  );
}
