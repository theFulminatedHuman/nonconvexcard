import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Card,
  Chip,
  LinkCard,
  PageHeader,
  SectionHeading,
} from '@/components/ui/primitives';
import { allProblems, allTopics, populatedFields } from '@/lib/content';
import { FIELDS, FIELD_GROUPS, LEVEL_SHORT } from '@/lib/taxonomy';

export const metadata: Metadata = {
  title: 'All topics',
  description:
    'Every topic on the site, grouped by field: foundations, probability, optimization, learning theory and modern model architectures.',
};

export default function TopicsIndexPage() {
  const topics = allTopics();
  const fields = populatedFields();
  const problems = allProblems();

  return (
    <div className="mx-auto max-w-[76rem] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Reference"
        title="All topics"
        lead={`${topics.length} topics across ${fields.length} fields. Each one states its assumptions,
          proves what it claims, and says explicitly what is not proven. Fields are ordered by
          dependency: everything below a field assumes what is above it.`}
      />

      <div className="space-y-10">
        {FIELD_GROUPS.map((group) => {
          const inGroup = fields.filter((f) => FIELDS[f].group === group);
          if (inGroup.length === 0) return null;
          return (
            <section key={group}>
              <SectionHeading title={group} />
              <div className="space-y-6">
                {inGroup.map((slug) => {
                  const meta = FIELDS[slug];
                  const fieldTopics = topics.filter((t) => t.field === slug);
                  const count = problems.filter((p) => p.field === slug).length;
                  return (
                    <Card key={slug} className="p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-base font-semibold">
                          <Link href={`/topics/${slug}`} className="hover:text-[var(--color-accent)]">
                            {meta.title}
                          </Link>
                        </h3>
                        <p className="font-mono text-[11px] text-[var(--color-ink-faint)] tabular-nums">
                          {fieldTopics.length} topics · {count} problems
                        </p>
                      </div>
                      <p className="mt-1 max-w-3xl text-[0.86rem] leading-relaxed text-[var(--color-ink-soft)]">
                        {meta.blurb}
                      </p>
                      {meta.requires.length > 0 ? (
                        <p className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="mono-label">Assumes</span>
                          {meta.requires.map((r) => (
                            <Link key={r} href={`/topics/${r}`}>
                              <Chip>{FIELDS[r].short}</Chip>
                            </Link>
                          ))}
                        </p>
                      ) : null}
                      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {fieldTopics.map((t) => (
                          <li key={t.id}>
                            <LinkCard href={`/topics/${t.id}`} className="h-full px-3 py-2.5">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="text-sm font-medium">{t.frontmatter.title}</span>
                                <span className="mono-label shrink-0">
                                  {LEVEL_SHORT[t.frontmatter.level]}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[0.8rem] leading-snug text-[var(--color-ink-faint)]">
                                {t.frontmatter.summary}
                              </p>
                            </LinkCard>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
