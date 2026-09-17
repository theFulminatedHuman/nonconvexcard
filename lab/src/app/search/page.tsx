import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchView } from '@/components/search/search-view';
import { PageHeader } from '@/components/ui/primitives';
import { BASE_PATH } from '@/lib/base-path';

export const metadata: Metadata = {
  title: 'Search',
  description:
    'Search every topic, theorem, proof, problem, paper and experiment on the site from one index.',
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-[60rem] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Reference"
        title="Search"
        lead="One index over everything: topics, theorem-like statements, problems, papers and
          experiments. It is a static file fetched once and searched in your browser — no queries
          leave the page."
      />
      <Suspense fallback={<p className="text-sm text-[var(--color-ink-faint)]">Loading…</p>}>
        <SearchView basePath={BASE_PATH} />
      </Suspense>
    </div>
  );
}
