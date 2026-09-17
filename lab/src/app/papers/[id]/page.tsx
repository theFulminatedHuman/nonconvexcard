import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CompleteButton } from '@/components/progress/complete-button';
import { ExternalIcon } from '@/components/ui/icons';
import { Card, Chip, LinkCard, SectionHeading } from '@/components/ui/primitives';
import { allPapers, getPaper, getTopicById } from '@/lib/content';
import { renderMdx } from '@/lib/mdx';
import { FIELDS } from '@/lib/taxonomy';

export const dynamicParams = false;

export function generateStaticParams() {
  return allPapers().map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const paper = getPaper(id);
  if (!paper) return {};
  return {
    title: paper.frontmatter.title,
    description: `${paper.frontmatter.authors} (${paper.frontmatter.year}) — ${paper.frontmatter.contribution}`,
  };
}

export default async function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paper = getPaper(id);
  if (!paper) notFound();

  const fm = paper.frontmatter;
  const body = await renderMdx(paper.body);
  const prerequisites = fm.prerequisites
    .map((t) => getTopicById(t))
    .filter((t): t is NonNullable<typeof t> => !!t);
  const descendants = fm.descendants
    .map((d) => getPaper(d))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const related = fm.related.map((r) => getPaper(r)).filter((p): p is NonNullable<typeof p> => !!p);
  const ancestors = allPapers().filter((p) => p.frontmatter.descendants.includes(paper.id));
  const canonical = fm.url ?? (fm.arxiv ? `https://arxiv.org/abs/${fm.arxiv}` : undefined);

  return (
    <div className="mx-auto max-w-[70rem] px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mono-label mb-3 flex flex-wrap items-center gap-1.5">
        <Link href="/papers" className="hover:text-[var(--color-ink)]">
          Papers
        </Link>
        <span aria-hidden>/</span>
        <span className="text-[var(--color-ink-soft)]">{fm.year}</span>
      </nav>

      <header className="border-b border-[var(--color-line)] pb-5">
        <h1 className="text-[1.5rem] leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-[1.8rem]">
          {fm.title}
        </h1>
        <p className="mt-2 font-mono text-xs text-[var(--color-ink-soft)]">
          {fm.authors} · {fm.year}
          {fm.venue ? ` · ${fm.venue}` : ''}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Chip tone="accent">{FIELDS[fm.field].short}</Chip>
          {fm.also.map((f) => (
            <Chip key={f}>{FIELDS[f].short}</Chip>
          ))}
          {fm.tags.slice(0, 6).map((t) => (
            <Chip key={t} tone="quiet">
              {t}
            </Chip>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CompleteButton
            kind="paper"
            refId={paper.id}
            title={fm.title}
            field={fm.field}
            minutes={90}
            labels={{ todo: 'Mark paper read', done: 'Read' }}
          />
          {canonical ? (
            <a
              href={canonical}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:underline"
            >
              Read the paper
              <ExternalIcon size={12} />
            </a>
          ) : null}
        </div>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="mono-label mb-1.5">The problem</p>
          <p className="text-[0.9rem] leading-relaxed">{fm.problem}</p>
        </Card>
        <Card className="p-4">
          <p className="mono-label mb-1.5">The contribution</p>
          <p className="text-[0.9rem] leading-relaxed">{fm.contribution}</p>
        </Card>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <article className="prose-lab mt-8 min-w-0 [[data-research='1']_&_[data-intuition]]:hidden">
          {body}
        </article>

        <aside className="mt-8 space-y-6">
          {prerequisites.length > 0 ? (
            <div>
              <SectionHeading title="Mathematics assumed" />
              <ul className="space-y-1.5">
                {prerequisites.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/topics/${t.id}`}
                      className="block text-[0.82rem] leading-snug text-[var(--color-accent)] hover:underline"
                    >
                      {t.frontmatter.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {ancestors.length > 0 ? (
            <div>
              <SectionHeading title="Builds on" />
              <ul className="space-y-1.5">
                {ancestors.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/papers/${p.id}`}
                      className="block text-[0.82rem] leading-snug hover:text-[var(--color-accent)]"
                    >
                      {p.frontmatter.title}{' '}
                      <span className="font-mono text-[10px] text-[var(--color-ink-faint)]">
                        {p.frontmatter.year}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      {descendants.length + related.length > 0 ? (
        <section className="mt-10">
          <SectionHeading title="What came next" />
          <ul className="grid gap-3 sm:grid-cols-2">
            {[...new Map([...descendants, ...related].map((p) => [p.id, p])).values()].map((p) => (
              <li key={p.id}>
                <LinkCard href={`/papers/${p.id}`} className="h-full p-3.5">
                  <p className="text-sm font-medium">{p.frontmatter.title}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-[var(--color-ink-faint)]">
                    {p.frontmatter.authors} · {p.frontmatter.year}
                  </p>
                  <p className="mt-1 text-[0.8rem] leading-snug text-[var(--color-ink-soft)]">
                    {p.frontmatter.contribution}
                  </p>
                </LinkCard>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
