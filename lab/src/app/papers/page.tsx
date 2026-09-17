import type { Metadata } from 'next';
import { PaperBrowser, type PaperEntry } from '@/components/papers/paper-browser';
import { PageHeader } from '@/components/ui/primitives';
import { allPapers } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Research papers',
  description:
    'Papers indexed by the mathematics they use: what problem each attacks, what it contributes, and which results on this site you need before reading it.',
};

export default function PapersPage() {
  const papers: PaperEntry[] = allPapers().map((p) => ({
    id: p.id,
    title: p.frontmatter.title,
    authors: p.frontmatter.authors,
    year: p.frontmatter.year,
    venue: p.frontmatter.venue,
    field: p.frontmatter.field,
    tags: p.frontmatter.tags,
    problem: p.frontmatter.problem,
    contribution: p.frontmatter.contribution,
  }));

  const years = papers.map((p) => p.year);
  const span = years.length > 0 ? `${Math.min(...years)}–${Math.max(...years)}` : '';

  return (
    <div className="mx-auto max-w-[84rem] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Reference"
        title="Research papers"
        lead={`${papers.length} papers spanning ${span}, each broken down the same way: the problem it
          attacks, what it actually contributes, the mathematics it presumes, and what it did not
          settle. Entries link to the topics that prove the results the paper takes for granted.`}
      >
        <p className="max-w-3xl text-xs leading-relaxed text-[var(--color-ink-faint)]">
          These pages describe and cite the papers; they do not reproduce them. Every entry links to
          the authoritative version — arXiv, a DOI or the authors' own page — and where a paper's
          central claim is empirical rather than proved, the breakdown says so.
        </p>
      </PageHeader>

      <PaperBrowser papers={papers} />
    </div>
  );
}
